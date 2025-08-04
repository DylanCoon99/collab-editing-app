import React, { useEffect, useRef } from 'react';

const WebSocketComponent = ({ url, onMessage, setSendMessage, setIsWsConnected, pendingMessages }) => {
  const wsRef = useRef(null);
  const isConnecting = useRef(false);

  useEffect(() => {
    console.log('WebSocketComponent: Connecting to', url);

    const connect = () => {

      if (isConnecting.current) {
        console.log('WebSocketComponent: Connection already in progress, skipping');
        return;
      }

      isConnecting.current = true;
      console.log('WebSocketComponent: Attempting connection');
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('WebSocketComponent: Connected');
        setIsWsConnected(true);
        isConnecting.current = false

        // Send any pending messages
        while (pendingMessages.length > 0) {
          const message = pendingMessages.shift();
          try {
            wsRef.current.send(JSON.stringify(message));
            console.log('WebSocketComponent: Sent pending message:', message);
          } catch (err) {
            console.error('WebSocketComponent: Error sending pending message:', err);
            pendingMessages.push(message); // Re-queue on failure
          }
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocketComponent: Received message:', message);
          if (!message.user_id || !message.message_type) {
            console.error('WebSocketComponent: Invalid message format:', message);
            return;
          }
          onMessage(message);
        } catch (err) {
          console.error('WebSocketComponent: Error parsing message:', err, 'raw data:', event.data);        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocketComponent: Disconnected, code:', event.code, 'reason:', event.reason, 'wasClean:', event.wasClean);
        setIsWsConnected(false);
        isConnecting.current = false;
        // Temporarily disable reconnection for debugging
        console.log('WebSocketComponent: Reconnection disabled for debugging');      };

      wsRef.current.onerror = (err) => {
        console.error('WebSocketComponent: Error:', err);
        setIsWsConnected(false);
        isConnecting.current = false;
      };
    };

    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED || wsRef.current.readyState === WebSocket.CLOSING) {
      connect();
    } else {
      console.log('WebSocketComponent: Existing connection active, skipping connect');
    }
    
    // Cleanup on unmount
    return () => {
      console.log('WebSocketComponent: Cleaning up');
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      isConnecting.current = false;
    };
  }, [url]);

  // Expose sendMessage function
  useEffect(() => {
    setSendMessage(() => (message) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(message);
        console.log('WebSocketComponent: Sent message:', JSON.parse(message));
      } else {
        console.log('WebSocketComponent: WebSocket not connected, queuing message');
        pendingMessages.push(JSON.parse(message));
      }
    });
  }, [setSendMessage, pendingMessages]);

  return null;
};

export default WebSocketComponent;