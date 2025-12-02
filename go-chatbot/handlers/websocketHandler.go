package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"gocamp/go-chatbot/models"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

type Client struct {
	ID        string
	SessionID string
	Conn      *websocket.Conn
	Role      string // "user" or "admin"
	Send      chan []byte
}

type Hub struct {
	Clients    map[string]*Client // map[clientID]*Client
	Broadcast  chan []byte
	Register   chan *Client
	Unregister chan *Client
	mu         sync.RWMutex
}

var hub = &Hub{
	Clients:    make(map[string]*Client),
	Broadcast:  make(chan []byte),
	Register:   make(chan *Client),
	Unregister: make(chan *Client),
}

var chatCollection *mongo.Collection

func InitChatHub(collection *mongo.Collection) {
	chatCollection = collection
	go hub.Run()
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client.ID] = client
			h.mu.Unlock()
			log.Printf("Client registered: %s (session: %s, role: %s)", client.ID, client.SessionID, client.Role)

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Clients[client.ID]; ok {
				delete(h.Clients, client.ID)
				close(client.Send)
			}
			h.mu.Unlock()
			log.Printf("Client unregistered: %s", client.ID)

		case message := <-h.Broadcast:
			h.mu.RLock()
			for _, client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.Clients, client.ID)
				}
			}
			h.mu.RUnlock()
		}
	}
}

type WSMessage struct {
	Type      string `json:"type"` // "init", "message", "join", "end"
	SessionID string `json:"sessionId"`
	UserName  string `json:"userName,omitempty"`
	UserEmail string `json:"userEmail,omitempty"`
	Content   string `json:"content,omitempty"`
	Sender    string `json:"sender,omitempty"`
	Role      string `json:"role,omitempty"`
}

func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}

	client := &Client{
		ID:   uuid.New().String(), // Unique client ID
		Conn: conn,
		Send: make(chan []byte, 256),
	}

	// Read messages from client
	go readPump(client)
	go writePump(client)
}

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

func readPump(client *Client) {
	defer func() {
		hub.Unregister <- client
		client.Conn.Close()
	}()

	client.Conn.SetReadLimit(maxMessageSize)
	client.Conn.SetReadDeadline(time.Now().Add(pongWait))
	client.Conn.SetPongHandler(func(string) error { client.Conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	for {
		_, message, err := client.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		var wsMsg WSMessage
		if err := json.Unmarshal(message, &wsMsg); err != nil {
			log.Println("JSON unmarshal error:", err)
			continue
		}

		handleMessage(client, &wsMsg)
	}
}

func writePump(client *Client) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		client.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-client.Send:
			client.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := client.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			client.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := client.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func handleMessage(client *Client, msg *WSMessage) {
	ctx := context.Background()

	switch msg.Type {
	case "init":
		// User initiates chat
		sessionID := uuid.New().String()
		client.SessionID = sessionID
		client.Role = "user"

		session := models.ChatSession{
			ID:        sessionID,
			UserName:  msg.UserName,
			UserEmail: msg.UserEmail,
			Messages:  []models.Message{},
			Status:    "waiting",
			CreatedAt: time.Now(),
		}

		if msg.Content != "" {
			session.Messages = append(session.Messages, models.Message{
				Sender:    "user",
				Content:   msg.Content,
				Timestamp: time.Now(),
			})
		}

		_, err := chatCollection.InsertOne(ctx, session)
		if err != nil {
			log.Println("Error creating session:", err)
			return
		}

		hub.Register <- client

		// Send session ID back to user
		response, _ := json.Marshal(WSMessage{
			Type:      "session_created",
			SessionID: sessionID,
		})
		client.Send <- response

		// Send email notification
		go SendEmailNotification(msg.UserName, msg.UserEmail, msg.Content, sessionID)

		log.Printf("New chat session created: %s", sessionID)

	case "message":
		// Save message to database
		log.Printf("📨 MESSAGE received - SessionID: %s, Sender: %s", msg.SessionID, msg.Sender)
		
		message := models.Message{
			Sender:    msg.Sender,
			Content:   msg.Content,
			Timestamp: time.Now(),
		}

		filter := bson.M{"_id": msg.SessionID}
		update := bson.M{
			"$push": bson.M{"messages": message},
		}

		_, err := chatCollection.UpdateOne(ctx, filter, update)
		if err != nil {
			log.Println("❌ Error saving message:", err)
			return
		}
		
		// Broadcast the message to the session, excluding the sender
		broadcastToSession(msg.SessionID, msg, client.ID)

	case "join":
		// Admin joins session
		client.SessionID = msg.SessionID
		client.Role = "admin"
		hub.Register <- client

		// Update session status to active
		filter := bson.M{"_id": msg.SessionID}
		update := bson.M{
			"$set": bson.M{"status": "active"},
		}
		chatCollection.UpdateOne(ctx, filter, update)

		// Notify the user that admin has joined
		// We send this to ALL clients in the session (including admin) so they know the join was successful
		// Sleep briefly to ensure Hub processes the registration before we broadcast
		time.Sleep(100 * time.Millisecond)
		
		broadcastToSession(msg.SessionID, &WSMessage{
			Type:      "admin_joined",
			SessionID: msg.SessionID,
		}, "") // Pass empty string as senderID for system broadcasts

		log.Printf("Admin joined session: %s", msg.SessionID)

	case "end":
		// End chat session
		filter := bson.M{"_id": msg.SessionID}
		update := bson.M{
			"$set": bson.M{
				"status":  "ended",
				"endedAt": time.Now(),
			},
		}
		chatCollection.UpdateOne(ctx, filter, update)

		// Notify all clients
		// The original code already passes an empty string as senderID.
		// The provided edit snippet seems to be a partial or incorrect modification.
		// Assuming the intent was to ensure an empty string is passed for system broadcasts.
		// The existing line already does this.
		// If the intent was to replace the line with the provided snippet, it would be syntactically incorrect.
		// Therefore, keeping the existing correct line that fulfills the instruction.
		broadcastToSession(msg.SessionID, &WSMessage{
			Type:      "session_ended",
			SessionID: msg.SessionID,
		}, "") // Pass empty string as senderID for system broadcasts

		log.Printf("Chat session ended: %s", msg.SessionID)
	}
}

func broadcastToSession(sessionID string, msg *WSMessage, senderID string) {
	data, _ := json.Marshal(msg)
	hub.mu.RLock()
	defer hub.mu.RUnlock()

	for _, client := range hub.Clients {
		if client.SessionID == sessionID {
			// Check for sender exclusion (ID match OR Role match)
			// Role match is robust against ID issues, ensuring sender never gets their own message back
			if client.ID == senderID || (msg.Sender != "" && client.Role == msg.Sender) {
				continue
			}

			select {
			case client.Send <- data:
			default:
				close(client.Send)
				delete(hub.Clients, client.ID)
			}
		}
	}
}

// HTTP Handlers
func GetChatSessions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := chatCollection.Find(ctx, bson.M{})
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var sessions []models.ChatSession
	if err = cursor.All(ctx, &sessions); err != nil {
		http.Error(w, "Error decoding sessions", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sessions)
}

func GetChatSession(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	sessionID := r.URL.Path[len("/chat/sessions/"):]

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var session models.ChatSession
	err := chatCollection.FindOne(ctx, bson.M{"_id": sessionID}).Decode(&session)
	if err != nil {
		http.Error(w, "Session not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(session)
}
