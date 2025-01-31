const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const TypingTest = require('../models/TypingTest');
const { protect } = require('../middleware/authMiddleware');

// Get leaderboard data
router.get('/', protect, async (req, res) => {
    try {
        const { timeRange = 'all' } = req.query;
        let dateFilter = {};

        // Set date filter based on time range
        const now = new Date();
        switch (timeRange) {
            case 'daily':
                dateFilter = {
                    createdAt: {
                        $gte: new Date(now.setHours(0, 0, 0, 0))
                    }
                };
                break;
            case 'weekly':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                weekStart.setHours(0, 0, 0, 0);
                dateFilter = {
                    createdAt: { $gte: weekStart }
                };
                break;
            case 'monthly':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                dateFilter = {
                    createdAt: { $gte: monthStart }
                };
                break;
            default:
                // All time - no date filter
                break;
        }

        // Aggregate typing test results
        const leaderboard = await TypingTest.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$userId',
                    bestWpm: { $max: '$wpm' },
                    bestAccuracy: { $max: '$accuracy' },
                    totalTests: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 1,
                    username: '$user.username',
                    wpm: '$bestWpm',
                    accuracy: '$bestAccuracy',
                    totalTests: 1,
                    achievements: '$user.achievements'
                }
            },
            { $sort: { wpm: -1 } },
            { $limit: 50 }
        ]);

        res.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard Error:', error);
        res.status(500).json({ message: 'Error fetching leaderboard data' });
    }
});

module.exports = router;
