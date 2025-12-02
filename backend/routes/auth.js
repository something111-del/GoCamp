const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

// Seed Admin User
const seedAdmin = async () => {
    const adminEmail = 'karepalli123@gmail.com';
    const adminPass = 'Mikiie@15';
    let admin = await User.findOne({ username: adminEmail });

    if (!admin) {
        admin = new User({
            username: adminEmail,
            password: adminPass,
            role: 'admin'
        });
        await admin.save();
        console.log('Admin user seeded');
    } else if (admin.role !== 'admin') {
        admin.role = 'admin';
        await admin.save();
        console.log('Admin user role updated to admin');
    }
};
seedAdmin();

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();
    res.json({ message: 'User registered' });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'secret_key_123',
        { expiresIn: '1h' }
    );
    res.json({ token, message: 'Login successful', role: user.role });
});

module.exports = router;
