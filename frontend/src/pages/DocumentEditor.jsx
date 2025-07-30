import React, { useEffect, useState, useRef } from 'react';
import { useParams , useNavigate } from 'react-router-dom';
import WebSocketComponent from '../components/WebSocketComponent';

export default function DocumentEditor() {
  const { id } = useParams();
  const navigate = useNavigate()
  const [doc, setDoc] = useState(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState(null);
  const [userPermission, setUserPermission] = useState(null);
  const [sendMessage, setSendMessage] = useState(null);
  const [isWsConnected, setIsWsConnected] = useState(false); // Track WebSocket connection status
  const prevContent = useRef(''); // Store previous content for diffing
  const pendingMessages = useRef([]); // Queue messages if WebSocket not connected
  const [showShareForm, setShowShareForm] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState('view');

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

      setUserId(data.data.ID);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to fetch user information');
      return null
    }
  };

  // Fetch document
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
      setContent(data.Content.String || '');
      prevContent.current = data.Content.String || '';
    } catch (err) {
      console.error('Error fetching document:', err);
      setError('Failed to load document');
    }
  };


  // Fetch user permissions
  const fetchPermissions = async (userId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found');
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/user/permissions?document_id=${id}&user_id=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch permissions');

      if (data.String && ['view', 'edit', 'owner'].includes(data.String)) {
        setUserPermission(data.String);
      } else {
        throw new Error('Invalid permission received');
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError('Failed to fetch permissions');
    }
  };


  useEffect(() => {
    console.log('Document ID from useParams:', id);
    console.log('Current URL:', window.location.pathname);
    console.log('Full useParams:', useParams());
    if (!id) {
      setError('Invalid document ID. Redirecting to document list.');
      navigate('/documents');
      return;
    }

    const initialize = async () => {
      const fetchedUserId = await fetchCurrentUser();
      if (fetchedUserId) {
        setUserId(fetchedUserId);
        await fetchDoc();
        await fetchPermissions(fetchedUserId);
      }
    };

    initialize();
  }, [id, navigate]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    const cursorPos = e.target.selectionStart;
    let message = null;

    if (newContent.length > prevContent.current.length) {
      // Insert
      const insertedLength = newContent.length - prevContent.current.length;
      const position = cursorPos - insertedLength;
      const insertedText = newContent.slice(position, cursorPos);
      message = {
        user_id: userId,
        message_type: 'insert',
        position,
        content: insertedText,
      };
    } else if (newContent.length < prevContent.current.length) {
      // Delete
      const deletedLength = prevContent.current.length - newContent.length;
      const position = cursorPos;
      message = {
        user_id: userId,
        message_type: 'delete',
        position,
        length: deletedLength,
      };
    }

    if (message && userId) {
      if (isWsConnected && sendMessage) {
        try {
          sendMessage(JSON.stringify(message));
          console.log('Sent message:', message);
        } catch (err) {
          console.error('Error sending WebSocket message:', err);
          pendingMessages.current.push(message);
          setError('Failed to send update, message queued');
        }
      } else {
        console.log('WebSocket not connected, queuing message:', message);
        pendingMessages.current.push(message);
        setError('WebSocket not connected, message queued');
      }
    }

    setContent(newContent);
    prevContent.current = newContent;
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

  const handleShare = async () => {

    if (!shareEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shareEmail)) {
      setStatus('❌ Invalid email address');
      return;
    }
    if (!['view', 'edit'].includes(sharePermission)) {
      setStatus('❌ Invalid permission selected');
      return;
    }


    const token = localStorage.getItem('token');
    setStatus('');

    try {
      const res = await fetch(`http://localhost:8080/api/user/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: shareEmail,
          document_id: id,
          permission:sharePermission,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to share');
      }

      setStatus('✅ Document shared successfully');
      setShowShareForm(false);
      setShareEmail('');
      setSharePermission('view');


      setStatus('✅ Document shared successfully');
    } catch (err) {
      console.error('Error sharing document:', err);
      setStatus('❌ Failed to share document');
    }
  };


  const handleShareCancel = () => {
    setShowShareForm(false);
    setShareEmail('');
    setSharePermission('view');
    setStatus('');
  };


  const handleWebSocketMessage = (message) => {
    if (message.user_id === userId) return; // Ignore own changes
    if (message.message_type === 'insert') {
      setContent((prev) => {
        const newContent = prev.slice(0, message.position) + message.content + prev.slice(message.position);
        prevContent.current = newContent;
        return newContent;
      });
    } else if (message.message_type === 'delete') {
      setContent((prev) => {
        const newContent = prev.slice(0, message.position) + prev.slice(message.position + message.length);
        prevContent.current = newContent;
        return newContent;
      });
    }
  };

  return (
    <div style={{ padding: '2rem', background: '#1c1c1c', color: '#fff', minHeight: '100vh' }}>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {doc && userId && userPermission ? (
        <>
          <h2>{doc.title}</h2>
          <p>Permission: {userPermission.charAt(0).toUpperCase() + userPermission.slice(1)}</p>
          <textarea
            value={content}
            onChange={handleContentChange}
            readOnly={userPermission !== 'edit' && userPermission !== 'owner'}
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
              opacity: (userPermission !== 'edit' && userPermission !== 'owner') ? 0.7 : 1,
            }}
          />
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleSave}
              disabled={userPermission !== 'edit' && userPermission !== 'owner'}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                background: (userPermission !== 'edit' && userPermission !== 'owner') ? '#6c757d' : '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: (userPermission !== 'edit' && userPermission !== 'owner') ? 'not-allowed' : 'pointer',
              }}
            >
              Save
            </button>
            <button
              onClick={() => setShowShareForm(true)}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                background: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Share
            </button>
            {status && (
              <span style={{ marginLeft: '1rem', color: '#ccc' }}>{status}</span>
            )}
          </div>
          {showShareForm && (
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#2f2f2f',
                border: '1px solid #444',
                borderRadius: '8px',
                maxWidth: '400px',
              }}
            >
              <h3>Share Document</h3>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Email:
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '1rem',
                      background: '#1c1c1c',
                      color: '#fff',
                      border: '1px solid #444',
                      borderRadius: '4px',
                    }}
                    placeholder="Enter email address"
                  />
                </label>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Permission:
                  <select
                    value={sharePermission}
                    onChange={(e) => setSharePermission(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '1rem',
                      background: '#1c1c1c',
                      color: '#fff',
                      border: '1px solid #444',
                      borderRadius: '4px',
                    }}
                  >
                    <option value="view">View</option>
                    <option value="edit">Edit</option>
                  </select>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleShare}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '1rem',
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Share
                </button>
                <button
                  onClick={handleShareCancel}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '1rem',
                    background: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

        </>
      ) : (
        <p>Loading document{userId ? '' : ' and user'}{userPermission ? '' : ' and permissions'}...</p>
      )}
    </div>
  );
}