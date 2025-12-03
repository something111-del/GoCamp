import React, { useState, useEffect, useRef } from 'react';

const AdminChatDashboard = () => {
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [viewMode, setViewMode] = useState('active'); // 'active' or 'history'
    const [searchQuery, setSearchQuery] = useState('');
    const wsRef = useRef(null);

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_CHATBOT_URL || 'http://localhost:8080'}/chat/sessions`);
            const data = await res.json();
            setSessions(data || []);
        } catch (err) {
            console.error('Error fetching sessions:', err);
        }
    };

    const cleanupWebSocket = () => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    };

    const joinSession = (session) => {
        cleanupWebSocket(); // Close any existing connection
        setActiveSession(session);
        setMessages(session.messages || []);

        const wsUrl = (process.env.REACT_APP_CHATBOT_URL || 'http://localhost:8080').replace('http', 'ws');
        const ws = new WebSocket(`${wsUrl}/ws`);
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({
                type: 'join',
                sessionId: session.id,
                role: 'admin'
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('🔔 Admin received WebSocket message:', data);

            if (data.type === 'message') {
                console.log('💬 Adding message to chat:', data);
                setMessages(prev => [...prev, {
                    sender: data.sender,
                    content: data.content,
                    timestamp: new Date()
                }]);
            }
        };
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !wsRef.current) return;

        // Optimistic update
        setMessages(prev => [...prev, {
            sender: 'admin',
            content: inputMessage,
            timestamp: new Date()
        }]);

        wsRef.current.send(JSON.stringify({
            type: 'message',
            sessionId: activeSession.id,
            sender: 'admin',
            content: inputMessage
        }));

        setInputMessage('');
    };

    const endSession = () => {
        if (wsRef.current) {
            wsRef.current.send(JSON.stringify({
                type: 'end',
                sessionId: activeSession.id
            }));
            cleanupWebSocket();
        }
        setActiveSession(null);
        fetchSessions();
    };

    const handleBack = () => {
        cleanupWebSocket();
        setActiveSession(null);
    };

    const viewTranscript = (session) => {
        setActiveSession(session);
        setMessages(session.messages || []);
    };

    // Filter sessions based on view mode
    const activeSessions = sessions.filter(s => s.status !== 'ended');
    const endedSessions = sessions.filter(s => s.status === 'ended');

    // Filter by search query
    const filteredHistory = endedSessions.filter(s =>
        s.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // If viewing a session (active or transcript)
    if (activeSession) {
        const isEnded = activeSession.status === 'ended';

        return (
            <div className="card" style={{ maxWidth: '900px', margin: '2rem auto', height: '600px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem', borderBottom: '2px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>{isEnded ? 'Chat Transcript - ' : 'Chat with '}{activeSession.userName}</h3>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>{activeSession.userEmail}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handleBack} className="btn-secondary">Back</button>
                        {!isEnded && (
                            <button onClick={endSession} style={{ background: '#e74c3c' }}>End Chat</button>
                        )}
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: '#f9f9f9' }}>
                    {messages.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#999' }}>No messages yet</p>
                    ) : (
                        messages.map((msg, index) => (
                            <div key={index} style={{
                                marginBottom: '1rem',
                                display: 'flex',
                                justifyContent: msg.sender === 'admin' ? 'flex-end' : 'flex-start'
                            }}>
                                <div style={{
                                    maxWidth: '70%',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '12px',
                                    background: msg.sender === 'admin' ? '#667eea' : '#fff',
                                    color: msg.sender === 'admin' ? '#fff' : '#333',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.25rem' }}>
                                        {msg.sender === 'admin' ? 'You' : activeSession.userName}
                                    </div>
                                    <div>{msg.content}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {!isEnded && (
                    <form onSubmit={sendMessage} style={{ padding: '1rem', borderTop: '2px solid #eee', display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder="Type your message..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            style={{ flex: 1, marginBottom: 0 }}
                        />
                        <button type="submit">Send</button>
                    </form>
                )}

                {isEnded && (
                    <div style={{ padding: '1rem', textAlign: 'center', background: '#f0f0f0' }}>
                        <p style={{ margin: 0, color: '#666' }}>
                            Chat ended on {new Date(activeSession.endedAt).toLocaleString()}
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // Main dashboard view
    return (
        <div className="card" style={{ maxWidth: '900px', margin: '2rem auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Live Chat Sessions</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setViewMode('active')}
                        style={{
                            background: viewMode === 'active' ? '#667eea' : '#ddd',
                            color: viewMode === 'active' ? 'white' : '#666'
                        }}
                    >
                        Active Chats
                    </button>
                    <button
                        onClick={() => setViewMode('history')}
                        style={{
                            background: viewMode === 'history' ? '#667eea' : '#ddd',
                            color: viewMode === 'history' ? 'white' : '#666'
                        }}
                    >
                        Previous Chats
                    </button>
                </div>
            </div>

            {viewMode === 'history' && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        placeholder="🔍 Search by user name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%' }}
                    />
                </div>
            )}

            <div style={{ display: 'grid', gap: '1rem' }}>
                {viewMode === 'active' ? (
                    activeSessions.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No active chat sessions</p>
                    ) : (
                        activeSessions.map((session) => (
                            <div key={session.id} className="card" style={{
                                padding: '1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>{session.userName}</h4>
                                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>{session.userEmail}</p>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>
                                        Status: <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            background: session.status === 'waiting' ? '#ffc107' : '#4caf50',
                                            color: 'white',
                                            fontSize: '0.75rem'
                                        }}>
                                            {session.status}
                                        </span>
                                    </p>
                                </div>
                                <button onClick={() => joinSession(session)}>Join Chat</button>
                            </div>
                        ))
                    )
                ) : (
                    filteredHistory.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                            {searchQuery ? 'No chats found' : 'No previous chats'}
                        </p>
                    ) : (
                        filteredHistory.map((session) => (
                            <div key={session.id} className="card" style={{
                                padding: '1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>{session.userName}</h4>
                                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>{session.userEmail}</p>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#999' }}>
                                        Ended: {new Date(session.endedAt).toLocaleString()}
                                    </p>
                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                                        Messages: {session.messages?.length || 0}
                                    </p>
                                </div>
                                <button onClick={() => viewTranscript(session)} className="btn-secondary">
                                    View Transcript
                                </button>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
};

export default AdminChatDashboard;
