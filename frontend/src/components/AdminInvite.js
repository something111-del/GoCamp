import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../index.css';

const AdminInvite = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [pendingInvites, setPendingInvites] = useState([]);

    useEffect(() => {
        fetchPendingInvites();
    }, []);

    const fetchPendingInvites = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/admin/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingInvites(response.data);
        } catch (error) {
            console.error('Error fetching pending invites:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/admin/invite`,
                { email },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage({ type: 'success', text: `Invitation sent successfully to ${email}!` });
            setEmail('');
            fetchPendingInvites(); // Refresh the list
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to send invitation'
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
            <div className="card" style={{ padding: '40px' }}>
                <h1 style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '10px'
                }}>
                    Invite New Admin
                </h1>
                <p style={{ color: '#666', marginBottom: '30px' }}>
                    Send an invitation email to grant admin access to a new user
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #e0e0e0',
                                borderRadius: '8px',
                                fontSize: '16px',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        />
                    </div>

                    {message.text && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            background: message.type === 'success' ? '#d4edda' : '#f8d7da',
                            color: message.type === 'success' ? '#155724' : '#721c24',
                            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                        }}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn"
                        style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '16px',
                            fontWeight: '600',
                            opacity: loading ? 0.6 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Sending...' : 'Send Invitation'}
                    </button>
                </form>

                {pendingInvites.length > 0 && (
                    <div style={{ marginTop: '40px' }}>
                        <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>
                            Pending Invitations ({pendingInvites.length})
                        </h2>
                        <div style={{
                            background: '#f9f9f9',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }}>
                            {pendingInvites.map((invite, index) => (
                                <div
                                    key={invite._id}
                                    style={{
                                        padding: '16px 20px',
                                        borderBottom: index < pendingInvites.length - 1 ? '1px solid #e0e0e0' : 'none',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                                            {invite.email}
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#666' }}>
                                            Sent: {formatDate(invite.createdAt)}
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '6px 12px',
                                        background: '#fff3cd',
                                        color: '#856404',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}>
                                        Pending
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                    <button
                        onClick={() => window.history.back()}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#667eea',
                            cursor: 'pointer',
                            fontSize: '16px',
                            textDecoration: 'underline'
                        }}
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminInvite;
