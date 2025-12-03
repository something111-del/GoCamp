
import React, { useState, useEffect } from 'react';
import { getChatQueries } from '../services/api';

import { useNavigate } from 'react-router-dom';

const ConsultantDashboard = () => {
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    useEffect(() => {
        const fetchQueries = async () => {
            try {
                const res = await getChatQueries();
                setQueries(res.data || []); // Ensure it's always an array
            } catch (err) {
                console.error('Error fetching queries:', err);
                setQueries([]); // Set empty array on error
            } finally {
                setLoading(false);
            }
        };
        fetchQueries();
    }, []);

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Consultant Dashboard</h2>
                <button onClick={handleLogout} style={{ background: '#e74c3c' }}>Logout</button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <a href="/admin/chats" style={{
                    flex: 1,
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}>
                    💬 Live Chats
                </a>
                <a href="/admin/invite" style={{
                    flex: 1,
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 12px rgba(240, 147, 251, 0.3)'
                }}>
                    👥 Invite Admin
                </a>
                <div style={{
                    flex: 1,
                    padding: '1.5rem',
                    background: '#f0f0f0',
                    borderRadius: '12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    color: '#666'
                }}>
                    📝 Submitted Queries
                </div>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
                {queries.length === 0 ? (
                    <p>No queries submitted yet.</p>
                ) : (
                    queries.map((q) => (
                        <div key={q.id} className="card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.2rem' }}>{q.name}</h3>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                <a href={`mailto:${q.email} `} style={{ color: '#e74c3c', textDecoration: 'none' }}>{q.email}</a>
                            </p>
                            <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #e74c3c' }}>
                                {q.query}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ConsultantDashboard;
