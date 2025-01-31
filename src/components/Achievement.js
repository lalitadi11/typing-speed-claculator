import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import ProfilePicture from './ProfilePicture';
import './Achievement.css';

const Achievement = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/users/stats');
      setStats(response.data);
    } catch (err) {
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="royal-loading">Loading your royal achievements...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="achievement-container">
      <div className="achievement-header royal-corner">
        <div className="achievement-title">
          <h2 className="gold-gradient">Royal Achievements</h2>
          <span className="achievement-crown">👑</span>
        </div>
        <ProfilePicture />
        <p className="achievement-username">{user.username}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card royal-corner">
          <div className="stat-icon">⚡</div>
          <div className="stat-value">{stats?.averageWPM || 0}</div>
          <div className="stat-label">Average WPM</div>
        </div>

        <div className="stat-card royal-corner">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{stats?.accuracy || 0}%</div>
          <div className="stat-label">Accuracy</div>
        </div>

        <div className="stat-card royal-corner">
          <div className="stat-icon">🏆</div>
          <div className="stat-value">{stats?.highestWPM || 0}</div>
          <div className="stat-label">Highest WPM</div>
        </div>

        <div className="stat-card royal-corner">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{stats?.testsCompleted || 0}</div>
          <div className="stat-label">Tests Completed</div>
        </div>
      </div>

      <div className="recent-tests royal-corner">
        <h3 className="section-title gold-gradient">Recent Royal Performances</h3>
        <div className="tests-list">
          {stats?.recentTests?.map((test, index) => (
            <div key={index} className="test-item">
              <div className="test-info">
                <span className="test-wpm">{test.wpm} WPM</span>
                <span className="test-accuracy">{test.accuracy}% Accuracy</span>
              </div>
              <div className="test-date">
                {new Date(test.date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="achievements-section royal-corner">
        <h3 className="section-title gold-gradient">Royal Honors</h3>
        <div className="achievements-grid">
          {stats?.achievements?.map((achievement, index) => (
            <div 
              key={index} 
              className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-icon">{achievement.icon}</div>
              <div className="achievement-info">
                <h4>{achievement.title}</h4>
                <p>{achievement.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Achievement;
