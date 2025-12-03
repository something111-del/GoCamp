import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const LiveChat = () => {
    const [userInfo, setUserInfo] = useState({ name: '', email: '', initialMessage: '' });
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [status, setStatus] = useState('form'); // 'form', 'waiting', 'active', 'ended', 'timeout'
    const [timeLeft, setTimeLeft] = useState(300); // 300 seconds = 5 minutes
    const wsRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (status === 'waiting') {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setStatus('timeout');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [status]);

    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const connectWebSocket = () => {
        const wsUrl = (process.env.REACT_APP_CHATBOT_URL || 'http://localhost:8080').replace('http', 'ws');
        const ws = new WebSocket(`${wsUrl}/ws`);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connected');
            // Send init message
            ws.send(JSON.stringify({
                type: 'init',
                userName: userInfo.name,
                userEmail: userInfo.email,
                content: userInfo.initialMessage
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('🔔 WebSocket message received:', data);

            if (data.type === 'session_created') {
                console.log('✅ Session created:', data.sessionId);
                setSessionId(data.sessionId);
                setStatus('waiting');
                if (userInfo.initialMessage) {
                    setMessages([{
                        sender: 'user',
                        content: userInfo.initialMessage,
                        timestamp: new Date()
                    }]);
                }
            } else if (data.type === 'admin_joined') {
                console.log('✅ Admin joined the chat');
                setStatus('active');
                setTimeLeft(0);
            } else if (data.type === 'message') {
                console.log('💬 New message:', data);
                setMessages(prev => [...prev, {
                    sender: data.sender,
                    content: data.content,
                    timestamp: new Date()
                }]);
            } else if (data.type === 'session_ended') {
                console.log('🔴 Session ended');
                setStatus('ended');
                ws.close();
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
        };
    };

    const handleStartChat = (e) => {
        e.preventDefault();
        connectWebSocket();
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !wsRef.current) return;

        const message = {
            type: 'message',
            sessionId: sessionId,
            sender: 'user',
            content: inputMessage
        };

        // Optimistic update
        setMessages(prev => [...prev, {
            sender: 'user',
            content: inputMessage,
            timestamp: new Date()
        }]);

        wsRef.current.send(JSON.stringify(message));
        setInputMessage('');
    };

    const handleSkipToQuery = () => {
        navigate('/chatbot/form');
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (status === 'form') {
        return (
            <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
                <h2>Chat with Consultant</h2>
                <p style={{ color: '#666', marginBottom: '2rem' }}>
                    Start a live chat session with our consultant. We'll notify them immediately!
                </p>
                <form onSubmit={handleStartChat}>
                    <input
                        type="text"
                        placeholder="Your Name"
                        value={userInfo.name}
                        onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Your Email"
                        value={userInfo.email}
                        onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                        required
                    />
                    <textarea
                        placeholder="How can we help you?"
                        value={userInfo.initialMessage}
                        onChange={(e) => setUserInfo({ ...userInfo, initialMessage: e.target.value })}
                        rows="4"
                        required
                    />
                    <button type="submit" style={{ width: '100%' }}>Start Chat</button>
                </form>
            </div>
        );
    }

    if (status === 'timeout') {
        return (
            <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
                <h2 style={{ color: '#e74c3c' }}>⏱️ Consultant Unavailable</h2>
                <p style={{ fontSize: '1.1rem', margin: '2rem 0' }}>
                    Our consultant didn't respond within 5 minutes. They might be busy right now.
                </p>
                <p style={{ color: '#666', marginBottom: '2rem' }}>
                    Would you like to submit your query instead? We'll get back to you via email.
                </p>
                <button onClick={handleSkipToQuery} style={{ width: '100%' }}>
                    Skip & Submit Query
                </button>
            </div>
        );
    }

    return (
        <div className="card" style={{ maxWidth: '800px', margin: '2rem auto', height: '600px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
                padding: '1rem',
                borderBottom: '2px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h3 style={{ margin: 0 }}>Live Chat</h3>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                        {status === 'waiting' && `⏳ Waiting for consultant... ${formatTime(timeLeft)}`}
                        {status === 'active' && '✅ Consultant joined'}
                        {status === 'ended' && '🔴 Chat ended'}
                    </p>
                </div>
                {status === 'waiting' && (
                    <button onClick={handleSkipToQuery} className="btn-secondary">
                        Skip & Submit Query
                    </button>
                )}
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                background: '#f9f9f9'
            }}>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        style={{
                            marginBottom: '1rem',
                            display: 'flex',
                            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                        }}
                    >
                        <div style={{
                            maxWidth: '70%',
                            padding: '0.75rem 1rem',
                            borderRadius: '12px',
                            background: msg.sender === 'user' ? '#667eea' : '#fff',
                            color: msg.sender === 'user' ? '#fff' : '#333',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.25rem' }}>
                                {msg.sender === 'user' ? 'You' : 'Consultant'}
                            </div>
                            <div>{msg.content}</div>
                        </div>
                    </div>
                ))}
            </div>

            {status === 'active' && (
                <form onSubmit={handleSendMessage} style={{
                    padding: '1rem',
                    borderTop: '2px solid #eee',
                    display: 'flex',
                    gap: '0.5rem'
                }}>
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

            {status === 'ended' && (
                <div style={{ padding: '1rem', textAlign: 'center', background: '#f0f0f0' }}>
                    <p style={{ margin: 0, color: '#666' }}>
                        This chat session has ended. Thank you for contacting us!
                    </p>
                </div>
            )}
        </div>
    );
};

export default LiveChat;
