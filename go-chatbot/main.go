package main

import (
	"fmt"
	"log"
	"net/http"

	"gocamp/go-chatbot/handlers"
)

func main() {
	handlers.InitMongo()
	http.HandleFunc("/chatbot", handlers.ChatbotHandler)
	http.HandleFunc("/queries", handlers.GetQueriesHandler)
	http.HandleFunc("/ws", handlers.WebSocketHandler)
	http.HandleFunc("/chat/sessions", handlers.GetChatSessions)
	http.HandleFunc("/chat/sessions/", handlers.GetChatSession)
	fmt.Println("Go Chatbot service running on port 8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
