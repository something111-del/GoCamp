import React, { useState } from 'react';
import { submitChatQuery } from '../services/api';

const ChatbotForm = () => {
    const [form, setForm] = useState({ name: '', email: '', query: '' });
    const [message, setMessage] = useState('');

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await submitChatQuery(form);
            setMessage(res.data.message);
            setForm({ name: '', email: '', query: '' });
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error submitting query');
        }
    };

    return (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2>Consultant Chat Form</h2>
            <form onSubmit={handleSubmit}>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Your Name" required />
                <input name="email" value={form.email} onChange={handleChange} placeholder="Email" type="email" required />
                <textarea name="query" value={form.query} onChange={handleChange} placeholder="Your query" required rows="5" />
                <button type="submit" style={{ width: '100%' }}>Submit Query</button>
            </form>
            {message && <p style={{ marginTop: '1rem', padding: '1rem', background: '#e8f5e9', color: '#2e7d32', borderRadius: '8px' }}>{message}</p>}
        </div>
    );
};

export default ChatbotForm;
