const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { Achievement, checkAchievements } = require('../models/achievementModel');
const jwt = require('jsonwebtoken');

// Auth middleware
const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Not authorized' });
  }
};

// Get all achievements
router.get('/', protect, async (req, res) => {
  try {
    console.log('Fetching achievements for user:', req.user._id);
    
    // Get all achievements
    const achievements = await Achievement.find().lean();
    console.log(`Found ${achievements.length} total achievements`);

    // Get user's unlocked achievements
    const user = await User.findById(req.user._id)
      .select('achievements')
      .populate('achievements')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mark which achievements are unlocked
    const achievementsWithStatus = achievements.map(achievement => ({
      ...achievement,
      unlocked: user.achievements.some(a => 
        a._id.toString() === achievement._id.toString()
      )
    }));

    console.log('Successfully processed achievements');
    res.json(achievementsWithStatus);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ message: 'Error fetching achievements' });
  }
});

// Get user's achievements
router.get('/user', protect, async (req, res) => {
  try {
    console.log('Fetching user achievements for:', req.user._id);
    
    const user = await User.findById(req.user._id)
      .select('achievements')
      .populate('achievements')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`Found ${user.achievements.length} achievements for user`);
    res.json(user.achievements);
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    res.status(500).json({ message: 'Error fetching achievements' });
  }
});

// Check achievements after test completion
router.post('/check', protect, async (req, res) => {
  try {
    console.log('Checking achievements for user:', req.user._id);
    
    const user = await User.findById(req.user._id)
      .select('typingResults achievements')
      .populate('achievements');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newAchievements = await checkAchievements(user);
    console.log(`User unlocked ${newAchievements.length} new achievements`);

    res.json({ 
      message: 'Achievements checked successfully',
      newAchievements 
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    res.status(500).json({ message: 'Error checking achievements' });
  }
});

module.exports = router;
