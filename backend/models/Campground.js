const mongoose = require('mongoose');

const campgroundSchema = new mongoose.Schema({
    name: String,
    location: String,
    description: String,
    image: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Campground', campgroundSchema);
