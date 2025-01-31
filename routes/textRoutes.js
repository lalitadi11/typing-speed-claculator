const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { checkAchievements } = require('../models/achievementModel');
const jwt = require('jsonwebtoken');

// Shakespeare texts
const shakespeareTexts = [
  // Romeo and Juliet
  "Two households, both alike in dignity, In fair Verona, where we lay our scene, From ancient grudge break to new mutiny, Where civil blood makes civil hands unclean.",
  "But soft, what light through yonder window breaks? It is the east, and Juliet is the sun. Arise, fair sun, and kill the envious moon, Who is already sick and pale with grief.",
  
  // Hamlet
  "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer The slings and arrows of outrageous fortune, Or to take Arms against a Sea of troubles.",
  "This above all: to thine own self be true, And it must follow, as the night the day, Thou canst not then be false to any man.",
  
  // Macbeth
  "Double, double toil and trouble; Fire burn, and caldron bubble. Fillet of a fenny snake, In the caldron boil and bake.",
  "Is this a dagger which I see before me, The handle toward my hand? Come, let me clutch thee. I have thee not, and yet I see thee still.",
  
  // A Midsummer Night's Dream
  "Lord, what fools these mortals be! Love looks not with the eyes, but with the mind, And therefore is winged Cupid painted blind.",
  "The course of true love never did run smooth. Love is a familiar. Love is a devil. There is no evil angel but Love.",
  
  // King Lear
  "How sharper than a serpent's tooth it is to have a thankless child! As flies to wanton boys are we to the gods. They kill us for their sport.",
  "We are not ourselves when nature, being oppressed, commands the mind to suffer with the body. The weight of this sad time we must obey.",
  
  // The Tempest
  "We are such stuff as dreams are made on, and our little life is rounded with a sleep. Hell is empty and all the devils are here.",
  "O brave new world, That has such people in't! What's past is prologue. What is to come, in yours and my discharge."
];

// Keep track of which texts users have seen
const userTexts = new Map();

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

// Get a random text for typing test
router.get('/random', protect, (req, res) => {
  try {
    let userId = req.user._id.toString();
    let userTextIndices = userTexts.get(userId) || [];

    // If user has seen all texts, reset their history
    if (userTextIndices.length === shakespeareTexts.length) {
      userTextIndices = [];
    }

    // Get a random text that user hasn't seen
    let availableIndices = shakespeareTexts
      .map((_, index) => index)
      .filter(index => !userTextIndices.includes(index));

    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    userTextIndices.push(randomIndex);
    userTexts.set(userId, userTextIndices);

    const text = shakespeareTexts[randomIndex];
    res.json({ text });
  } catch (error) {
    console.error('Error getting random text:', error);
    res.status(500).json({ message: 'Error getting text' });
  }
});

// Submit typing test result
router.post('/submit', protect, async (req, res) => {
  try {
    const { wpm, accuracy } = req.body;

    // Validate input
    if (typeof wpm !== 'number' || typeof accuracy !== 'number') {
      return res.status(400).json({ message: 'Invalid WPM or accuracy values' });
    }

    // Add result to user's typing results
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.typingResults.push({ wpm, accuracy });
    await user.save();

    // Check for new achievements
    const newAchievements = await checkAchievements(user);

    res.json({ 
      message: 'Test result saved',
      newAchievements: newAchievements.length > 0 ? newAchievements : undefined
    });
  } catch (error) {
    console.error('Error submitting test result:', error);
    res.status(500).json({ message: 'Error saving result' });
  }
});

module.exports = router;
