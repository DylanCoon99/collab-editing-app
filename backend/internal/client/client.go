package client


import (
	"sync"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)



type Client struct {
	Conn *websocket.Conn
	UserID uuid.UUID
}



type Document struct {
	Clients map[uuid.UUID]*Client
	mu      sync.Mutex
}



var documents = make(map[uuid.UUID]*Document) // map of doc_ids to document



