package models

import "time"

type ChatSession struct {
	ID        string    `json:"id" bson:"_id"`
	UserName  string    `json:"userName" bson:"userName"`
	UserEmail string    `json:"userEmail" bson:"userEmail"`
	Messages  []Message `json:"messages" bson:"messages"`
	Status    string    `json:"status" bson:"status"` // "waiting", "active", "ended"
	CreatedAt time.Time `json:"createdAt" bson:"createdAt"`
	EndedAt   time.Time `json:"endedAt,omitempty" bson:"endedAt,omitempty"`
}

type Message struct {
	Sender    string    `json:"sender" bson:"sender"` // "user" or "admin"
	Content   string    `json:"content" bson:"content"`
	Timestamp time.Time `json:"timestamp" bson:"timestamp"`
}
