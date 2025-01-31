const mongoose = require('mongoose');

const typingTestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    wpm: {
        type: Number,
        required: true
    },
    accuracy: {
        type: Number,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    mistakes: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster leaderboard queries
typingTestSchema.index({ userId: 1, wpm: -1 });
typingTestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('TypingTest', typingTestSchema);
