import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentDemo = () => {
    const navigate = useNavigate();

    return (
        <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
            <h2>Chat with Our Consultant</h2>
            <p style={{ fontSize: '1.1rem', margin: '2rem 0', color: '#555' }}>
                Get instant help from our camping experts!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                <button
                    onClick={() => navigate('/live-chat')}
                    style={{
                        padding: '1rem 2rem',
                        fontSize: '1.1rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                >
                    💬 Start Live Chat (FREE)
                </button>

                <button
                    onClick={() => navigate('/chatbot/form')}
                    className="btn-secondary"
                    style={{ padding: '1rem 2rem' }}
                >
                    📝 Submit Query (Email Response)
                </button>
            </div>
        </div>
    );
};

export default PaymentDemo;
