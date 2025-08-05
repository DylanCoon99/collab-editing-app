import React, { useEffect, useState, useRef } from 'react';
import { useParams , useNavigate } from 'react-router-dom';
import WebSocketComponent from '../components/WebSocketComponent';

export default function DocumentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const [cursors, setCursors] = useState({}); // Store other users' cursor positions
  const textareaRef = useRef(null);

  
  useEffect(() => {
    console.log('DocumentEditor: useEffect: Document ID:', id, 'URL:', window.location.pathname);

    if (!id) {
      setError('Invalid document ID');
      navigate('/home', { replace: true });
      return;
    }

    const initialize = async () => {
      console.log('initialize: Starting...');
      try {
        const fetchedUserId = await fetchCurrentUser();
        console.log('initialize: fetchedUserId:', fetchedUserId);
        if (fetchedUserId) {
          setUserId(fetchedUserId);
          await fetchDoc();
          await fetchPermissions(fetchedUserId);
          console.log('initialize: Completed', { userId: fetchedUserId, doc, userPermission });
        } else {
          setError('Failed to fetch user ID');
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('initialize: Error:', err);
        setError('Initialization failed: ' + err.message);
      }
    };

    initialize();
  }, [id, navigate]);
  

const fetchCurrentUser = async (retries = 2, delayMs = 1000) => {
    const token = localStorage.getItem('token');
    console.log('fetchCurrentUser: token exists:', !!token, 'token:', token);
    if (!token) {
      setError('No authentication token found');
      navigate('/login', { replace: true });
      return null;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch('https://collab-editing-app.onrender.com/api/user', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        console.log(`fetchCurrentUser: attempt ${attempt}, status: ${res.status}, statusText: ${res.statusText}`);

        const text = await res.text();
        console.log('fetchCurrentUser: raw response:', text);

        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error('fetchCurrentUser: JSON parse error:', err);
          setError('Invalid response format from server');
          return null;
        }
        console.log('fetchCurrentUser: parsed data:', data);

        if (!res.ok) {
          throw new Error(data.message || `HTTP ${res.status}: ${res.statusText}`);
        }

        const fetchedUserId = data.data?.ID || data.data?.id || data.ID || data.id;
        if (!fetchedUserId) {
          throw new Error('User ID not found in response: ' + JSON.stringify(data));
        }

        console.log('fetchCurrentUser: fetchedUserId:', fetchedUserId);
        return fetchedUserId;
      } catch (err) {
        console.error(`fetchCurrentUser: attempt ${attempt} failed:`, err);
        if (attempt < retries) {
          console.log(`fetchCurrentUser: Retrying after ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          setError('Failed to fetch user: ' + err.message);
          return null;
        }
      }
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
      const res = await fetch(`https://collab-editing-app.onrender.com/api/document/${id}`, {
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
      navigate('/login', {replace: true})
      return;
    }

    try {
      const res = await fetch(`https://collab-editing-app.onrender.com/api/user/permissions?document_id=${id}&user_id=${userId}`, {
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


  const handleContentChange = (e) => {
    const newContent = e.target.value;
    const cursorPos = e.target.selectionStart;
    let message = null;

    if (userPermission !== 'edit' && userPermission !== 'owner') {
      setError('You do not have permission to edit this document');
      return;
    }

    if (newContent.length > prevContent.current.length) {
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


  const handleCursorChange = (e) => {
    if (!isWsConnected || !sendMessage || !userId) {
      console.log('DocumentEditor: Cannot send cursor update, connection or userId missing');
      return;
    }

    const position = e.target.selectionStart;
    const message = {
      user_id: userId,
      message_type: 'cursor',
      position,
    };

    try {
      sendMessage(JSON.stringify(message));
      console.log('DocumentEditor: Sent cursor update:', message);
    } catch (err) {
      console.error('DocumentEditor: Error sending cursor update:', err);
      setError('Failed to send cursor update');
    }
  };



  const handleSave = async () => {
    const token = localStorage.getItem('token');
    setStatus('');

    try {
      const res = await fetch(`https://collab-editing-app.onrender.com/api/document/${id}`, {
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
      const res = await fetch(`https://collab-editing-app.onrender.com/api/user/permissions`, {
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
    console.log('DocumentEditor: Received WebSocket message:', message);

    if (!message.user_id || !message.message_type) {
      console.error('DocumentEditor: Invalid message format:', message);
      setError('Received invalid message format');
      return;
    }

    if (message.user_id === userId) {
      console.log('DocumentEditor: Ignoring own message from user:', userId);
      return;
    }

    if (!['insert', 'delete', 'cursor'].includes(message.message_type)) {
      console.error('DocumentEditor: Invalid message_type:', message.message_type);
      setError('Received invalid message type');
      return;
    }

    if (message.message_type === 'insert') {
      if (typeof message.position !== 'number' || !message.content || typeof message.content !== 'string') {
        console.error('DocumentEditor: Invalid insert message:', message);
        setError('Received invalid insert message');
        return;
      }
      setContent((prev) => {
        if (message.position < 0 || message.position > prev.length) {
          console.error('DocumentEditor: Invalid position for insert:', message.position, 'content length:', prev.length);
          setError('Invalid insert position');
          return prev;
        }
        const newContent = prev.slice(0, message.position) + message.content + prev.slice(message.position);
        prevContent.current = newContent;
        console.log('DocumentEditor: Inserted content at position', message.position, 'new content:', newContent);
        return newContent;
      });
    } else if (message.message_type === 'delete') {
      if (typeof message.position !== 'number' || typeof message.length !== 'number') {
        console.error('DocumentEditor: Invalid delete message:', message);
        setError('Received invalid delete message');
        return;
      }
      setContent((prev) => {
        if (message.position < 0 || message.position + message.length > prev.length) {
          console.error('DocumentEditor: Invalid position or length for delete:', message.position, message.length, 'content length:', prev.length);
          setError('Invalid delete position or length');
          return prev;
        }
        const newContent = prev.slice(0, message.position) + prev.slice(message.position + message.length);
        prevContent.current = newContent;
        console.log('DocumentEditor: Deleted content at position', message.position, 'length:', message.length, 'new content:', newContent);
        return newContent;
      });
    } else if (message.message_type === 'cursor') {
      if (typeof message.position !== 'number') {
        console.error('DocumentEditor: Invalid cursor message:', message);
        setError('Received invalid cursor message');
        return;
      }
      setCursors((prev) => {
        if (message.position < 0 || message.position > content.length) {
          console.error('DocumentEditor: Invalid cursor position:', message.position, 'content length:', content.length);
          return prev;
        }
        return {
          ...prev,
          [message.user_id]: { position: message.position, updated: Date.now() },
        };
      });
    }
  };


    // Calculate cursor position in pixels
  const getCursorStyle = (position, userId) => {
    if (!textareaRef.current || position < 0 || position > content.length) return null;

    // Create a temporary span to measure text width
    const span = document.createElement('span');
    span.style.font = getComputedStyle(textareaRef.current).font;
    span.style.position = 'absolute';
    span.style.visibility = 'hidden';
    span.textContent = content.slice(0, position).replace(/\n/g, ' ');
    document.body.appendChild(span);
    const width = span.offsetWidth;
    document.body.removeChild(span);

    // Calculate line and column
    const lines = content.slice(0, position).split('\n');
    const line = lines.length - 1;
    const column = lines[line].length;

    const lineHeight = parseFloat(getComputedStyle(textareaRef.current).lineHeight) || 16;
    const fontSize = parseFloat(getComputedStyle(textareaRef.current).fontSize) || 16;

    return {
      top: `${line * lineHeight}px`,
      left: `${column * (width / position)}px`,
      backgroundColor: getUserColor(userId),
      height: `${lineHeight}px`,
    };
  };

  // Assign unique colors to users
  const getUserColor = (userId) => {
    const colors = ['#ff4d4f', '#40c4ff', '#ffca28', '#4caf50', '#ab47bc'];
    const index = parseInt(userId.replace(/-/g, '').slice(0, 8), 16) % colors.length;
    return colors[index];
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
            onSelect={handleCursorChange}
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
          <div>
            {Object.entries(cursors).map(([otherUserId, cursor]) => {
              const style = getCursorStyle(cursor.position, otherUserId);
              if (!style) return null;
              return (
                <div
                  key={otherUserId}
                  style={{
                    position: 'absolute',
                    width: '2px',
                    ...style,
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                  title={`User: ${otherUserId.slice(0, 8)}`}
                />
              );
            })}
          </div>
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
      {userId && (
        <WebSocketComponent
          url={`ws://collab-editing-app.onrender.com/api/ws?doc_id=${id}&user_id=${userId}`}
          onMessage={handleWebSocketMessage}
          setSendMessage={setSendMessage}
          setIsWsConnected={setIsWsConnected}
          pendingMessages={pendingMessages.current}
        />
      )}
    </div>
  );
}

