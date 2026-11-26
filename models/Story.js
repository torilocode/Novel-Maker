const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
    title: { type: String, default: 'Chapter 1' },
    content: { type: String, default: '' }
});

const storySchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        default: 'Untitled Novel'
    },
    synopsis: {
        type: String,
        trim: true,
        default: ''
    },
    coverTheme: {
        type: String,
        default: 'cover-emerald'
    },
    coverImage: {
        type: String,
        default: null
    },
    chapters: [chapterSchema]
}, { timestamps: true });

module.exports = mongoose.model('Story', storySchema);