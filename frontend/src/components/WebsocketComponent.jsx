import React, { useEffect, useState, useRef, useCallback } from 'react';

function WebSocketComponent({ doc_id, user_id, onMessage }) {
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null); // Store WebSocket instance
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const connectWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log(`WebSocket already connected for document ${doc_id}`);
      return;
    }

    const ws = new WebSocket(`ws://localhost:8080/api/ws?doc_id=${doc_id}&user_id=${user_id}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`WebSocket connected for document ${doc_id}`);
      reconnectAttempts.current = 0; // Reset reconnect attempts
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data); // Assume messages are JSON
        console.log(`Received message for document ${doc_id}:`, message);
        setMessages((prevMessages) => [...prevMessages, message.content]);
        if (onMessage) {
          onMessage(message.content); // Pass content to parent component
        }
      } catch (err) {
        console.error(`Failed to parse WebSocket message for document ${doc_id}:`, err);
      }
    };

    ws.onclose = (event) => {
      console.log(`WebSocket closed for document ${doc_id}: code=${event.code}, reason=${event.reason}`);
      wsRef.current = null;
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
    };
  }, [doc_id, user_id, onMessage]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    };
  }, [connectWebSocket]);

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({ content: message });
      wsRef.current.send(payload);
      console.log(`Sent message to document ${doc_id}: ${payload}`);
    } else {
      console.error(`WebSocket not connected for document ${doc_id}`);
      connectWebSocket(); // Attempt to reconnect
    }
  };

  return (
    <div>
      <button onClick={() => sendMessage('Hello from React!')}>Send Message</button>
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