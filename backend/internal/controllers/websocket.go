package controllers

import (
	"log"
	"sync"
	"net/http"
	"context"
	"github.com/google/uuid"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)



// Represents a connected ws client
type Client struct {
	Conn *websocket.Conn
	UserID uuid.UUID
	Send chan []byte
	Document *Document
}



// Represents a collaborative document with connected clients
type Document struct {
	DocID      uuid.UUID
	Clients    map[uuid.UUID]*Client
	mu         sync.Mutex
	Broadcast  chan []byte
}



// Manager holds all documents
type Manager struct {
	Documents  map[uuid.UUID]*Document
	mu         sync.Mutex
}


var manager = &Manager{
	Documents: make(map[uuid.UUID]*Document),
}




func (cfg *ApiConfig) HandleWebSocket(c *gin.Context) {
	

	document_id := c.Query("doc_id") // get this from the ws url endpoint that is in the request
	user_id := c.Query("user_id")

	document_uuid, err := uuid.Parse(document_id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse document id.", "Details": err})
		return
	}

	user_uuid, err := uuid.Parse(user_id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user id.", "Details": err})
		return
	}


	// when a client clicks on a document, a ws is created here

	ws, err := cfg.Upgrader.Upgrade(c.Writer, c.Request, nil)

	if err != nil {
		log.Printf("Websocket upgrader error:", err)
		return
	}

	defer ws.Close()


	// at this point, the document in question is added to the manager if it is not already there

	manager.mu.Lock()
	doc, ok := manager.Documents[document_uuid]

	// if not ok, the doc is created and added to the manager
	if !ok {
		doc = &Document{
			DocID:     document_uuid,
			Clients:   make(map[uuid.UUID]*Client),
			Broadcast: make(chan []byte, 256),  // make a buffered channel
		}
		manager.Documents[document_uuid] = doc

		// after the doc is created, broadcast all changes to the document to every user using the document
		go doc.runBroadcaster()
	}
	manager.mu.Unlock()


	// create a client

	client := &Client{
		Conn:     ws,
		UserID:   user_uuid,
		Send:     make(chan []byte, 256),
		Document: doc,
	}


	// add the client to the document's client map

	doc.mu.Lock()
	doc.Clients[user_uuid] = client
	log.Println("CLIENT CREATED.")
	doc.mu.Unlock()


	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// start go routines for reading and writing
	go client.readMessages(ctx)
	go client.writeMessages(ctx)

	// keep connection alive until the context is cancelled
	<-ctx.Done()
}



func (c *Client) readMessages(ctx context.Context) {

	// listens for incoming messages from the client and forwards them to the document's broadcast channel

	defer func() {
		c.Document.mu.Lock()
		delete(c.Document.Clients, c.UserID)
		c.Document.mu.Unlock()
		c.Conn.Close()
	}()


	for {
		select {
		case <-ctx.Done():
			return
		default:
			_, message, err := c.Conn.ReadMessage()
			//log.Printf("MESSAGE RECEIVED: %v", message)
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("Websocket read error: %v", err)
				}
				return
			}
			// forward message to broadcast channel 
			c.Document.Broadcast <- message
		}
	}

}



func (c *Client) writeMessages(ctx context.Context) {

	// sends messages to the client via the websocket connection

	defer func() {
		log.Printf("Client %s has stopped writing messages.", c.UserID.String())
		c.Conn.Close()
	}()

	for {
		select {
		case <- ctx.Done():
			return
		case message, ok := <-c.Send:
			if !ok {
				log.Printf("Send channel close for client %s", c.UserID.String())
				return
			}
			err := c.Conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				log.Printf("Websocket write error: %v", err)
				return
			}
			log.Printf("Message sent to client %s: %s", c.UserID.String(), string(message))
		}
	}

}




// broadcasts all message for a document to every client using the document
func (d *Document) runBroadcaster() {

	defer func() {
		d.mu.Lock()
		for _, client := range d.Clients {
			close(client.Send)
		}
		d.mu.Unlock()
		log.Printf("Broadcaster stopped for document %s", d.DocID.String())
	}()


	for message := range d.Broadcast {
		d.mu.Lock()

		// for every client using the document
		for userID, client := range d.Clients {
			// send to the client's send channel
			select {
			case client.Send <- message:
				// successfully sent the message to the client
				log.Printf("Message broadcast to client %s in document %s", userID.String(), d.DocID.String())
			default:
				log.Printf("Send channel full for client %s in document %s", client.UserID.String(), d.DocID.String())
				delete(d.Clients, userID)
				log.Printf("CLIENT %v DELETED.", userID.String())
				close(client.Send)
				client.Conn.Close()
			}
		}

		d.mu.Unlock()
	}
}


// need a function for reading messages on a client's 


