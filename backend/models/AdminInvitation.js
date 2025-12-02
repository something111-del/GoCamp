const mongoose = require('mongoose');

const adminInvitationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    used: {
        type: Boolean,
        default: false
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// TTL index to auto-delete expired invitations after 48 hours
adminInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 172800 });

module.exports = mongoose.model('AdminInvitation', adminInvitationSchema);
