import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import WebSocketComponent from '../components/WebSocketComponent';

export default function DocumentEditor() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState(null);

  // Fetch current user
  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found');
      return;
    }

    try {
      const res = await fetch('http://localhost:8080/api/user', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch user');

      setUserId(data.data.id); // Parse user ID from data.id
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to fetch user information');
    }
  };

  // Fetch document
  useEffect(() => {
    const fetchDoc = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      try {
        const res = await fetch(`http://localhost:8080/api/document/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch document');

        setDoc(data);
        setContent(data.content.String || '');
      } catch (err) {
        console.error('Error fetching document:', err);
        setError('Failed to load document');
      }
    };

    fetchDoc();
    fetchCurrentUser(); // Fetch user on component mount
  }, [id]);

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    setStatus('');

    try {
      const res = await fetch(`http://localhost:8080/api/document/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: content,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      setStatus('✅ Document saved successfully');
    } catch (err) {
      console.error('Error saving document:', err);
      setStatus('❌ Failed to save document');
    }
  };

  const handleWebSocketMessage = (newContent) => {
    setContent(newContent); // Update textarea with WebSocket message
  };

  return (
    <div style={{ padding: '2rem', background: '#1c1c1c', color: '#fff', minHeight: '100vh' }}>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {doc && userId ? (
        <>
          <h2>{doc.title}</h2>
          <textarea
            value={content}
            onChange={handleContentChange}
            style={{
              width: '100%',
              height: '70vh',
              marginTop: '1rem',
              padding: '1rem',
              fontSize: '1rem',
              fontFamily: 'monospace',
              background: '#2f2f2f',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '8px',
            }}
          />
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={handleSave}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                background: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Save
            </button>
            {status && (
              <span style={{ marginLeft: '1rem', color: '#ccc' }}>{status}</span>
            )}
          </div>
          <WebSocketComponent
            doc_id={id}
            user_id={userId}
            onMessage={handleWebSocketMessage}
          />
        </>
      ) : (
        <p>Loading document{userId ? '' : ' and user'}...</p>
      )}
    </div>
  );
}