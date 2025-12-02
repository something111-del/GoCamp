const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const fixAdminRole = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/gocamp');
        console.log('Connected to MongoDB');

        const email = 'karepalli123@gmail.com';
        const user = await User.findOne({ username: email });

        if (!user) {
            console.log('User not found!');
        } else {
            console.log(`Found user: ${user.username}, Current Role: ${user.role}`);

            user.role = 'admin';
            await user.save();

            console.log('UPDATED Role to: admin');

            // Verify
            const updatedUser = await User.findOne({ username: email });
            console.log(`Verification - Role is now: ${updatedUser.role}`);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

fixAdminRole();
