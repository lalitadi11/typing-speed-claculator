const express = require('express');
const User = require('../models/userModel');
const TypingTest = require('../models/TypingTest');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Get random sentence for typing test
router.get('/sentence', async (req, res) => {
  const sentences = [
    "The quick brown fox jumps over the lazy dog.",
    "Pack my box with five dozen liquor jugs.",
    "How vexingly quick daft zebras jump!",
    "The five boxing wizards jump quickly.",
    "Sphinx of black quartz, judge my vow.",
    "Two driven jocks help fax my big quiz.",
    "The job requires extra pluck and zeal from every young wage earner.",
    "We promptly judged antique ivory buckles for the next prize.",
    "Waltz, nymph, for quick jigs vex Bud.",
    "Glib jocks quiz nymph to vex dwarf."
  ];
  
  const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
  res.json({ sentence: randomSentence });
});

// Save typing test result
router.post('/result', protect, async (req, res) => {
  try {
    const { 
      wpm, 
      accuracy, 
      rawWpm, 
      netWpm, 
      mistakes, 
      consistency, 
      totalChars, 
      correctChars, 
      incorrectChars, 
      backspaces 
    } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: 'Please log in to save your results' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Saving typing test result for user:', {
      userId: user._id,
      username: user.username,
      wpm,
      accuracy
    });

    // Create new typing test result
    const typingTest = new TypingTest({
      userId: user._id,
      wpm,
      accuracy,
      text: req.body.text || '',
      duration: 30, // Fixed duration
      mistakes,
      rawWpm,
      netWpm,
      consistency,
      totalChars,
      correctChars,
      incorrectChars,
      backspaces
    });

    await typingTest.save();
    console.log('Typing test saved:', typingTest._id);

    // Add to typing history
    if (!user.typingHistory) {
      user.typingHistory = [];
    }
    user.typingHistory.push({
      wpm,
      accuracy,
      date: new Date()
    });

    // Update best score if current score is higher
    if (!user.bestScore) {
      user.bestScore = { wpm: 0, accuracy: 0 };
    }
    if (wpm > user.bestScore.wpm) {
      user.bestScore.wpm = wpm;
      user.bestScore.accuracy = accuracy;
    }

    // Update user stats
    if (!user.stats) {
      user.stats = {
        totalTests: 0,
        averageWpm: 0,
        averageAccuracy: 0,
        totalTimePracticed: 0
      };
    }

    user.stats = {
      totalTests: user.stats.totalTests + 1,
      averageWpm: user.stats.averageWpm 
        ? ((user.stats.averageWpm * user.stats.totalTests) + wpm) / (user.stats.totalTests + 1)
        : wpm,
      averageAccuracy: user.stats.averageAccuracy
        ? ((user.stats.averageAccuracy * user.stats.totalTests) + accuracy) / (user.stats.totalTests + 1)
        : accuracy,
      totalTimePracticed: user.stats.totalTimePracticed + 0.5 // 30 seconds = 0.5 minutes
    };

    await user.save();
    console.log('User stats updated');

    // Check if user made it to leaderboard
    const betterScores = await User.countDocuments({
      'bestScore.wpm': { $gt: wpm }
    });

    const madeLeaderboard = betterScores < 50;
    console.log('Leaderboard check:', { madeLeaderboard, rank: betterScores + 1 });

    res.json({ 
      success: true, 
      madeLeaderboard,
      rank: betterScores + 1,
      stats: user.stats,
      bestScore: user.bestScore
    });
  } catch (error) {
    console.error('Error saving typing test result:', error);
    res.status(500).json({ 
      message: 'Failed to save results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
