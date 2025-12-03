import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../index.css';

const InviteRegistration = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [tokenValid, setTokenValid] = useState(false);

    useEffect(() => {
        verifyToken();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const verifyToken = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/admin/verify-token/${token}`);
            if (response.data.valid) {
                setTokenValid(true);
                setEmail(response.data.email);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Invalid or expired invitation link');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setSubmitting(true);

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/admin/complete-invite`, {
                token,
                password
            });

            // Store the token
            localStorage.setItem('token', response.data.token);

            // Show success message and redirect
            alert('Admin account created successfully! Redirecting to dashboard...');
            navigate('/consultant-dashboard');
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create account');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: '48px',
                        marginBottom: '20px',
                        animation: 'spin 1s linear infinite'
                    }}>
                        ⏳
                    </div>
                    <p style={{ color: '#666' }}>Verifying invitation...</p>
                </div>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div style={{ padding: '40px', maxWidth: '500px', margin: '100px auto' }}>
                <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
                    <h1 style={{ color: '#e74c3c', marginBottom: '10px' }}>Invalid Invitation</h1>
                    <p style={{ color: '#666', marginBottom: '30px' }}>{error}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px', maxWidth: '500px', margin: '50px auto' }}>
            <div className="card" style={{ padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '10px' }}>🎉</div>
                    <h1 style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '10px'
                    }}>
                        Welcome to GoCamp!
                    </h1>
                    <p style={{ color: '#666' }}>
                        You've been invited to join as an administrator
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            disabled
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #e0e0e0',
                                borderRadius: '8px',
                                fontSize: '16px',
                                background: '#f5f5f5',
                                color: '#666'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                            Create Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            minLength={6}
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
                        <small style={{ color: '#666', fontSize: '14px' }}>
                            Minimum 6 characters
                        </small>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
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

                    {error && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            background: '#f8d7da',
                            color: '#721c24',
                            border: '1px solid #f5c6cb'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn"
                        style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '16px',
                            fontWeight: '600',
                            opacity: submitting ? 0.6 : 1,
                            cursor: submitting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {submitting ? 'Creating Account...' : 'Create Admin Account'}
                    </button>
                </form>

                <div style={{
                    marginTop: '30px',
                    padding: '16px',
                    background: '#e7f3ff',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#004085'
                }}>
                    <strong>🔒 Secure Registration</strong>
                    <p style={{ margin: '8px 0 0 0' }}>
                        Your password will be encrypted and stored securely. You'll have full admin access once registered.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InviteRegistration;
