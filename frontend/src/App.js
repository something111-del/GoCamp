import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CampgroundList from './components/CampgroundList';
import CampgroundForm from './components/CampgroundForm';
import ChatbotForm from './components/ChatbotForm';
import PaymentDemo from './components/PaymentDemo';

import Login from './components/Login';
import ConsultantDashboard from './components/ConsultantDashboard';
import LiveChat from './components/LiveChat';
import AdminChatDashboard from './components/AdminChatDashboard';
import AdminInvite from './components/AdminInvite';
import InviteRegistration from './components/InviteRegistration';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc', marginBottom: '1rem' }}>
                <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
                <Link to="/add-campground" style={{ marginRight: '1rem' }}>Add Campground</Link>
                <Link to="/chatbot" style={{ marginRight: '1rem' }}>Chat with Consultant</Link>
                <Link to="/dashboard" style={{ color: '#e74c3c' }}>Dashboard</Link>
            </nav>
            <div className="container">
                <Routes>
                    <Route path="/" element={<CampgroundList />} />
                    <Route path="/add-campground" element={<CampgroundForm />} />
                    <Route path="/chatbot" element={<PaymentDemo />} />
                    <Route path="/chatbot/form" element={<ChatbotForm />} />
                    <Route path="/live-chat" element={<LiveChat />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={
                        <PrivateRoute>
                            <ConsultantDashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/admin/chats" element={
                        <PrivateRoute>
                            <AdminChatDashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/admin/invite" element={
                        <PrivateRoute>
                            <AdminInvite />
                        </PrivateRoute>
                    } />
                    <Route path="/admin/register/:token" element={<InviteRegistration />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
