const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const AdminInvitation = require('../models/AdminInvitation');
const User = require('../models/User');
const { sendAdminInvitation } = require('../services/emailService');
const jwt = require('jsonwebtoken');

// Middleware to verify admin role (you'll need to create this or use existing auth middleware)
const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123');
        const user = await User.findById(decoded.id);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        req.userId = user._id;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Send admin invitation
router.post('/invite', verifyAdmin, async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email || !email.includes('@')) {
            return res.status(400).json({ message: 'Valid email is required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username: email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Check if there's already a pending invitation
        const existingInvitation = await AdminInvitation.findOne({
            email,
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (existingInvitation) {
            return res.status(400).json({ message: 'An active invitation already exists for this email' });
        }

        // Generate unique token
        const token = uuidv4();

        // Set expiration to 24 hours from now
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Create invitation
        const invitation = new AdminInvitation({
            email,
            token,
            expiresAt,
            invitedBy: req.userId
        });

        await invitation.save();

        // Send email
        await sendAdminInvitation(email, token);

        res.json({
            message: 'Invitation sent successfully',
            email,
            expiresAt
        });
    } catch (error) {
        console.error('Error sending invitation:', error);
        res.status(500).json({ message: 'Failed to send invitation', error: error.message });
    }
});

// Verify invitation token
router.get('/verify-token/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const invitation = await AdminInvitation.findOne({ token });

        if (!invitation) {
            return res.status(404).json({ message: 'Invalid invitation token' });
        }

        if (invitation.used) {
            return res.status(400).json({ message: 'This invitation has already been used' });
        }

        if (new Date() > invitation.expiresAt) {
            return res.status(400).json({ message: 'This invitation has expired' });
        }

        res.json({
            valid: true,
            email: invitation.email
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(500).json({ message: 'Failed to verify token' });
    }
});

// Complete admin registration
router.post('/complete-invite', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: 'Token and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Find and validate invitation
        const invitation = await AdminInvitation.findOne({ token });

        if (!invitation) {
            return res.status(404).json({ message: 'Invalid invitation token' });
        }

        if (invitation.used) {
            return res.status(400).json({ message: 'This invitation has already been used' });
        }

        if (new Date() > invitation.expiresAt) {
            return res.status(400).json({ message: 'This invitation has expired' });
        }

        // Check if user already exists (shouldn't happen, but double-check)
        const existingUser = await User.findOne({ username: invitation.email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new admin user
        const newUser = new User({
            username: invitation.email,
            password: password,
            role: 'admin'
        });

        await newUser.save();

        // Mark invitation as used
        invitation.used = true;
        await invitation.save();

        // Generate JWT token
        const jwtToken = jwt.sign(
            { id: newUser._id },
            process.env.JWT_SECRET || 'secret_key_123',
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Admin account created successfully',
            token: jwtToken,
            user: {
                id: newUser._id,
                username: newUser.username,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Error completing invitation:', error);
        res.status(500).json({ message: 'Failed to complete registration', error: error.message });
    }
});

// Get pending invitations (admin only)
router.get('/pending', verifyAdmin, async (req, res) => {
    try {
        const invitations = await AdminInvitation.find({
            used: false,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        res.json(invitations);
    } catch (error) {
        console.error('Error fetching invitations:', error);
        res.status(500).json({ message: 'Failed to fetch invitations' });
    }
});

module.exports = router;
