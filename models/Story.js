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
    coverTheme: {
        type: String,
        enum: ['cover-emerald', 'cover-amber', 'cover-cognac'],
        default: 'cover-emerald'
    },
    chapters: {
        type: [chapterSchema],
        default: [{ title: 'Chapter 1', content: '' }]
    }
}, { timestamps: true });

module.exports = mongoose.model('Story', storySchema);