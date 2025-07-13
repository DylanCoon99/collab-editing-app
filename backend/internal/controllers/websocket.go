package controllers

import (
	"sync"
	"net/http"
	"github.com/google/uuid"
	"github.com/gin-gonic/gin"
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




func (cfg *ApiConfig) HandleWebSocket(c *gin.Context) {
	ws, err := cfg.Upgrader.Upgrade(c.Writer, c.Request, nil)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create websocket.", "details": err.Error()})
		return
	}

	defer ws.Close()

	document_id := c.Query("doc_id") // get this from the ws url endpoint that is in the request
	user_id := c.Query("user_id")

	document_uuid, err := uuid.Parse(document_id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse document id."})
		return
	}

	user_uuid, err := uuid.Parse(user_id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user id."})
		return
	}


	doc, ok := documents[document_uuid]

	if !ok {
		doc = &Document{Clients: make(map[uuid.UUID]*Client)}
		documents[document_uuid] = doc
	}

	doc.mu.Lock()
	doc.Clients[user_uuid] = &Client{Conn: ws, UserID: user_uuid}
	doc.mu.Unlock()


	
	

}