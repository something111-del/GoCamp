package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type ChatQuery struct {
	ID     primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Name   string             `bson:"name" json:"name"`
	Email  string             `bson:"email" json:"email"`
	Query  string             `bson:"query" json:"query"`
}
