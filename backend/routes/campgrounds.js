const express = require('express');
const router = express.Router();
const Campground = require('../models/Campground');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: { folder: 'gocamp', allowed_formats: ['jpg', 'jpeg', 'png'] }
});
const parser = multer({ storage });

router.get('/', async (req, res) => {
    const campgrounds = await Campground.find();
    res.json(campgrounds);
});

router.post('/', parser.single('image'), async (req, res) => {
    const { name, location, description } = req.body;
    const image = req.file ? req.file.path : '';
    const camp = new Campground({ name, location, description, image });
    await camp.save();
    res.json(camp);
});

// DELETE a campground
router.delete('/:id', async (req, res) => {
    try {
        await Campground.findByIdAndDelete(req.params.id);
        res.json({ message: 'Campground deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting campground' });
    }
});

module.exports = router;
