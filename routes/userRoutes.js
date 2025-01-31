const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/userModel');
const { Achievement, checkAchievements } = require('../models/achievementModel');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
  }
} catch (err) {
  console.error('Error creating uploads directory:', err);
}

// Middleware to protect routes
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

// Default avatar as base64 (a simple placeholder image)
const defaultAvatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAADdgAAA3YBfdWCzAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAABBqSURBVHic7Z15kBvVmcB/r1v3HJqey+MDY4bBHhvbGEOWYGMOB8Ima8NmISF2NglQCUnIbiDZTUJ2k6RSye6GJZutJRUIkGQhwRBIHJIQMKkEHMCYYLAx2MY2PvCMPZ6Z8Yw0173vj5YsWeoZS91qdUvzflWuGktPre+9/r7X7/u+970nKKWYyUiSJMTHx0fk5+fnFRQULMzLy1ucmZlZkJaWlqsoiiYQCARVVY0oihIWBCEqCEJUVdWILMsRQRAiqqpGZFkOK4oSlmU5LMtyWJblkKqqYUEQQoqihBRFCSqKElQUJSjLckBV1YCiKAFFUQKKogRkWQ6qqhpQFMWvKIpfURSfoih+RVH8qqr6FEXxybLsVRTFq6qqV5Zlj6qqHlmWPaqquhVFcauq6lZV1a2qqktVVZeiqi5VVZ2qqjpVVXWqqupQVdWhKIpdVVW7oqp2VVHtsqLaVEW1KapiUxXFJiuKTVYUm6woVkVRrIqiWBVFsaiqYlFV1aIoikVVVYuiKqphVRTGrqmpWFcWsqKpZVRWToigmVVVNiqKaVFU1KqpiVBTFqKiqUVEUo6KoBkVR9IqiGBRF0SuKoldVVS8ril5RVL2qqHpFUXSKouoURdEpiqJTVVWnqKpOVhSdoqo6WVF1sqLqZEXVyYqqk2VVJyuqTpZVvayoellW9Yqs6GVZ1cuKqpcVRS/Lql6WFb0sq3pZVnSyouoURdXJiqqTFUUnK4pOVlWdrKg6RVF1iqrqFFXVKYqqUxRFp6iqTlFVnaKoOkVVdbKi6mRF1SmqqpNVVScrqk5WVJ2sqjpZVXWKqupkRdUpqqqTFVUnq6pOVlSdoqo6RVV1iqLqFFXVKaqqk1VVp6iqTlZVnayoOkVVdbKq6hRF1SmqqpNVVaeoqk5WVZ2sqDpZUXWyquoURdUpqqqTVVUnK6pOVlWdrKg6WVF1sqrqZEXVyYqqk1VVJyuqTlFVnayoOkVVdbKq6mRF1cmqqpMVVSerqk5WVJ2sqDpZVXWyouoURdXJqqqTFVUnq6pOVlSdrKg6WVV1sqLqZFXVyYqqk1VVJyuqTlZVnayoOllVdbKi6v4fwzr1qN8mS3IAAAAASUVORK5CYII=';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
      cb(new Error('Invalid file type. Only JPG, PNG and GIF are allowed'));
      return;
    }
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Check file type
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Please upload an image file'), false);
    return;
  }
  
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
    cb(new Error('Invalid file type. Only JPG, PNG and GIF are allowed'), false);
    return;
  }
  
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter
});

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Maximum size is 5MB' });
    }
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Register user
router.post('/register', async (req, res) => {
  try {
    console.log('Registration attempt:', {
      username: req.body.username,
      email: req.body.email
    });

    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: 'Please provide username, email and password' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() }, 
        { username: username.trim() }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      if (existingUser.username === username.trim()) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Create new user
    const user = new User({
      username: username.trim(),
      email: email.toLowerCase(),
      password,
      profilePicture: '/default-avatar.png'
    });

    // Save user
    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return user data (excluding password)
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      token
    });

  } catch (error) {
    console.error('Registration error:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: messages 
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field} already exists` 
      });
    }

    res.status(500).json({ 
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });

    // Validate input
    if (!email || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log('User found:', { email: user.email, username: user.username });

    // Check password using the model's method
    const isMatch = await user.matchPassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('Login successful:', { email: user.email, username: user.username });
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Save typing result
router.post('/typing-result', protect, async (req, res) => {
  try {
    const { wpm, accuracy } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add to typing history
    user.typingHistory.push({
      wpm,
      accuracy,
      date: new Date()
    });

    // Update best score if current score is better
    if (wpm > user.bestScore.wpm) {
      user.bestScore.wpm = wpm;
      user.bestScore.accuracy = accuracy;
    }

    await user.save();

    res.json({
      message: 'Typing result saved successfully',
      bestScore: user.bestScore
    });
  } catch (error) {
    console.error('Error saving typing result:', error);
    res.status(500).json({ message: 'Error saving typing result' });
  }
});

// Get user profile with typing history
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      username: user.username,
      email: user.email,
      typingHistory: user.typingHistory,
      bestScore: user.bestScore,
      profilePicture: user.profilePicture
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    console.log('Fetching leaderboard...');
    
    const users = await User.find()
      .select('username typingResults achievements')
      .populate('achievements')
      .lean();

    console.log(`Found ${users.length} users`);

    const leaderboard = users.map(user => {
      const typingResults = user.typingResults || [];
      
      // Calculate stats
      const stats = {
        username: user.username,
        testsCompleted: typingResults.length,
        achievements: user.achievements?.length || 0,
        averageWPM: 0,
        bestWPM: 0,
        bestWPS: 0,
        averageAccuracy: 0,
        bestAccuracy: 0
      };

      if (typingResults.length > 0) {
        // Calculate averages
        const totalWPM = typingResults.reduce((sum, result) => sum + result.wpm, 0);
        const totalAccuracy = typingResults.reduce((sum, result) => sum + result.accuracy, 0);
        stats.averageWPM = Math.round(totalWPM / typingResults.length);
        stats.averageAccuracy = Math.round(totalAccuracy / typingResults.length);

        // Find bests
        stats.bestWPM = Math.max(...typingResults.map(result => result.wpm));
        stats.bestWPS = +(stats.bestWPM / 60).toFixed(2);
        stats.bestAccuracy = Math.max(...typingResults.map(result => result.accuracy));
      }

      return stats;
    });

    // Sort by best WPM
    leaderboard.sort((a, b) => b.bestWPM - a.bestWPM);

    console.log('Leaderboard generated successfully');
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
});

// Get user stats
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all typing results for the user
    const typingResults = user.typingResults || [];

    // Calculate stats
    const stats = {
      averageWPM: 0,
      averageAccuracy: 0,
      testsCompleted: typingResults.length,
      bestWPM: 0,
      bestAccuracy: 0
    };

    if (typingResults.length > 0) {
      // Calculate averages
      const totalWPM = typingResults.reduce((sum, result) => sum + result.wpm, 0);
      const totalAccuracy = typingResults.reduce((sum, result) => sum + result.accuracy, 0);
      stats.averageWPM = totalWPM / typingResults.length;
      stats.averageAccuracy = totalAccuracy / typingResults.length;

      // Find bests
      stats.bestWPM = Math.max(...typingResults.map(result => result.wpm));
      stats.bestAccuracy = Math.max(...typingResults.map(result => result.accuracy));
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Error fetching user stats' });
  }
});

// Upload profile picture
router.post('/profile-picture', protect, upload.single('profilePicture'), handleMulterError, async (req, res) => {
  try {
    console.log('Profile picture upload attempt:', {
      userId: req.user._id,
      file: req.file ? {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file'
    });

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'Please select an image to upload' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      console.log('User not found:', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      console.log('Creating uploads directory:', uploadsDir);
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Delete old profile picture if it exists and is not the default avatar
    if (user.profilePicture && !user.profilePicture.includes('default-avatar')) {
      const oldPicturePath = path.join(uploadsDir, path.basename(user.profilePicture));
      console.log('Attempting to delete old profile picture:', oldPicturePath);
      try {
        if (fs.existsSync(oldPicturePath)) {
          fs.unlinkSync(oldPicturePath);
          console.log('Successfully deleted old profile picture');
        }
      } catch (err) {
        console.error('Error deleting old profile picture:', err);
        // Continue with the update even if delete fails
      }
    }

    // Update user's profile picture path
    const profilePicturePath = `/uploads/${req.file.filename}`;
    console.log('Setting new profile picture path:', profilePicturePath);
    
    user.profilePicture = profilePicturePath;
    await user.save();

    console.log('Successfully updated profile picture for user:', req.user._id);
    res.json({ 
      message: 'Profile picture updated successfully',
      profilePicture: profilePicturePath
    });
  } catch (error) {
    console.error('Profile picture update error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      file: req.file
    });

    // Delete uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(uploadsDir, req.file.filename);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Cleaned up uploaded file after error');
        }
      } catch (err) {
        console.error('Error cleaning up uploaded file:', err);
      }
    }

    res.status(500).json({ 
      message: 'Error updating profile picture. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete profile picture
router.delete('/profile-picture', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.profilePicture && !user.profilePicture.startsWith('data:image')) {
      const picturePath = path.join(uploadsDir, user.profilePicture);
      try {
        await fs.unlink(picturePath);
      } catch (err) {
        console.error('Error deleting profile picture:', err);
      }
    }

    user.profilePicture = defaultAvatar;
    await user.save();

    res.json({
      message: 'Profile picture removed successfully',
      profilePicture: defaultAvatar
    });
  } catch (error) {
    console.error('Error removing profile picture:', error);
    res.status(500).json({ message: 'Error removing profile picture' });
  }
});

module.exports = router;
