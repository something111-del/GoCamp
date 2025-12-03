package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"regexp"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"gocamp/go-chatbot/models"
)

var client *mongo.Client
var collection *mongo.Collection
var chatSessionsCollection *mongo.Collection

func InitMongo() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://mongo:27017" // Default for local development
	}
	
	client, _ = mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	collection = client.Database("gocamp").Collection("chatqueries")
	chatSessionsCollection = client.Database("gocamp").Collection("chatsessions")
	
	// Initialize WebSocket hub
	InitChatHub(chatSessionsCollection)
}

func isValidEmail(email string) bool {
	re := regexp.MustCompile(`\S+@\S+\.\S+`)
	return re.MatchString(email)
}

func ChatbotHandler(w http.ResponseWriter, r *http.Request) {
	// Add CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var query models.ChatQuery
	if err := json.NewDecoder(r.Body).Decode(&query); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if query.Name == "" || query.Email == "" || query.Query == "" {
		http.Error(w, "All fields required", http.StatusBadRequest)
		return
	}

	if !isValidEmail(query.Email) {
		http.Error(w, "Invalid email format", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	_, err := collection.InsertOne(ctx, query)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Thanks! A consultant will reach out via email.",
	})
}

func GetQueriesHandler(w http.ResponseWriter, r *http.Request) {
	// Add CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Origin, Accept, *")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, map[string]interface{}{})
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var queries []models.ChatQuery
	if err = cursor.All(ctx, &queries); err != nil {
		http.Error(w, "Error decoding queries", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(queries)
}
