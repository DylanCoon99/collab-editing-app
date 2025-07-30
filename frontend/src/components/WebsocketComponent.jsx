import React, { useEffect, useState, useRef, useCallback } from 'react';

function WebSocketComponent({ doc_id, user_id, onMessage, onSendMessage, onReconnect, onConnectionChange }) {
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 500; // Reduced to 500ms for faster recovery
  const messageQueue = useRef([]); // Queue messages if disconnected

  const connectWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log(`WebSocket already connected for document ${doc_id}`);
      return;
    }

    const ws = new WebSocket(`ws://localhost:8080/api/ws?doc_id=${doc_id}&user_id=${user_id}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`WebSocket connected for document ${doc_id}, readyState: ${ws.readyState}`);
      reconnectAttempts.current = 0;
      if (onConnectionChange) {
        onConnectionChange(true);
      }
      // Send queued messages
      while (messageQueue.current.length > 0) {
        const message = messageQueue.current.shift();
        ws.send(message);
        console.log(`Sent queued message to document ${doc_id}: ${message}`);
      }
      if (onReconnect) {
        onReconnect(); // Trigger document fetch to sync state
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log(`Received message for document ${doc_id}:`, message);
        setMessages((prevMessages) => [...prevMessages, message.content]);
        if (onMessage) {
          onMessage(message);
        }
      } catch (err) {
        console.error(`Failed to parse WebSocket message for document ${doc_id}:`, err);
      }
    };

    ws.onclose = (event) => {
      console.log(`WebSocket closed for document ${doc_id}: code=${event.code}, reason=${event.reason}`);
      wsRef.current = null;
      if (onConnectionChange) {
        onConnectionChange(false);
      }
      if (reconnectAttempts.current < maxReconnectAttempts) {
        console.log(`Reconnecting WebSocket for document ${doc_id} in ${reconnectDelay}ms...`);
        setTimeout(() => {
          reconnectAttempts.current += 1;
          connectWebSocket();
        }, reconnectDelay);
      } else {
        console.error(`Max reconnect attempts reached for document ${doc_id}`);
      }
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for document ${doc_id}:`, error);
      if (onConnectionChange) {
        onConnectionChange(false);
      }
    };
  }, [doc_id, user_id, onMessage, onReconnect, onConnectionChange]);

  useEffect(() => {
    if (user_id) {
      connectWebSocket();
    }
    if (onSendMessage) {
      onSendMessage((message) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(message);
          console.log(`Sent message to document ${doc_id}: ${message}`);
        } else {
          console.error(`WebSocket not connected for document ${doc_id}, queuing message`);
          messageQueue.current.push(message);
          connectWebSocket();
        }
      });
    }

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Component unmounted');
      }
      wsRef.current = null;
      if (onConnectionChange) {
        onConnectionChange(false);
      }
    };
  }, [connectWebSocket, user_id, onSendMessage, onConnectionChange]);

  return (
    <div>
      <button onClick={() => {
        const message = JSON.stringify({ user_id, message_type: 'insert', position: 0, content: 'Hello from React!' });
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(message);
          console.log(`Sent test message to document ${doc_id}: ${message}`);
        } else {
          messageQueue.current.push(message);
          connectWebSocket();
        }
      }}>
        Send Message
      </button>
      <div>
        <h3>Received Messages:</h3>
        <ul>
          {messages.map((msg, index) => (
            <li key={`${doc_id}-${index}`}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default WebSocketComponent;