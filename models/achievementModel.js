const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  criteria: {
    type: {
      type: String,
      enum: ['wpm', 'accuracy', 'tests', 'streak'],
      required: true
    },
    value: {
      type: Number,
      required: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Function to check achievements for a user
const checkAchievements = async (user) => {
  try {
    const achievements = await Achievement.find();
    const unlockedAchievements = [];

    for (const achievement of achievements) {
      let achieved = false;

      switch (achievement.criteria.type) {
        case 'wpm':
          achieved = user.typingResults.some(result => result.wpm >= achievement.criteria.value);
          break;
        case 'accuracy':
          achieved = user.typingResults.some(result => result.accuracy >= achievement.criteria.value);
          break;
        case 'tests':
          achieved = user.typingResults.length >= achievement.criteria.value;
          break;
        case 'streak':
          // TODO: Implement streak checking
          achieved = false;
          break;
      }

      if (achieved && !user.achievements.includes(achievement._id)) {
        unlockedAchievements.push(achievement._id);
      }
    }

    if (unlockedAchievements.length > 0) {
      user.achievements.push(...unlockedAchievements);
      await user.save();
    }

    return unlockedAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
};

const Achievement = mongoose.model('Achievement', achievementSchema);

// Create default achievements if none exist
const createDefaultAchievements = async () => {
  try {
    const count = await Achievement.countDocuments();
    if (count === 0) {
      const defaults = [
        {
          title: 'Speed Demon',
          description: 'Reach 100+ WPM',
          icon: '🚀',
          criteria: { type: 'wpm', value: 100 }
        },
        {
          title: 'Accuracy Master',
          description: 'Achieve 100% accuracy',
          icon: '🎯',
          criteria: { type: 'accuracy', value: 100 }
        },
        {
          title: 'Dedicated Typist',
          description: 'Complete 50 tests',
          icon: '🏆',
          criteria: { type: 'tests', value: 50 }
        },
        {
          title: 'Getting Started',
          description: 'Complete your first typing test',
          icon: '🎉',
          criteria: { type: 'tests', value: 1 }
        },
        {
          title: 'Fast Fingers',
          description: 'Reach 50+ WPM',
          icon: '⚡',
          criteria: { type: 'wpm', value: 50 }
        }
      ];

      await Achievement.insertMany(defaults);
      console.log('Created default achievements');
    }
  } catch (error) {
    console.error('Error creating default achievements:', error);
  }
};

// Call this when the server starts
createDefaultAchievements();

module.exports = {
  Achievement,
  checkAchievements
};
