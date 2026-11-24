const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nickname: {
        type: String,
        required: true,
        trim: true,
        maxlength: 40
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: 25
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        default: 'Crafting new worlds and late-night drafts on NovelMaker.',
        maxlength: 200
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);