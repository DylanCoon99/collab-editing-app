import React, { useEffect, useState } from 'react';

function WebSocketComponent(props) {
const [messages, setMessages] = useState([]);
const [socket, setSocket] = useState(null);


const doc_id = props.doc_id
const user_id = props.user_id


useEffect(() => {
  const ws = new WebSocket(`ws://localhost:8080/api/ws?doc_id=${doc_id}&user_id=${user_id}`); // Replace with your server URL

  ws.onopen = () => {
    console.log('WebSocket connected');
    setSocket(ws);
  };

  ws.onmessage = (event) => {
    setMessages((prevMessages) => [...prevMessages, event.data]);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    setSocket(null);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return () => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  };
}, []);

const sendMessage = () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send('Hello from React!');
  }
};

return (
  <div>
    <button onClick={sendMessage}>Send Message</button>
    <div>
      <h3>Received Messages:</h3>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
    </div>
  </div>
);
}

export default WebSocketComponent;