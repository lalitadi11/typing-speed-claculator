import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import './Achievements.css';

const Achievements = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setError('Please log in to view achievements');
        return;
      }

      const response = await axios.get('/api/achievements');
      setAchievements(response.data);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      if (error.response?.status === 401) {
        setError('Please log in to view achievements');
      } else {
        setError('Failed to load achievements. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [user]);

  if (loading) {
    return (
      <div className="achievements-container">
        <div className="achievements-loading">
          <div className="loading-spinner"></div>
          <p>Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="achievements-container">
        <div className="achievements-error">
          <p>{error}</p>
          {error.includes('log in') && (
            <button 
              className="login-button"
              onClick={() => navigate('/login')}
            >
              Log In
            </button>
          )}
          {!error.includes('log in') && (
            <button 
              className="retry-button"
              onClick={fetchAchievements}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-container">
      <h2 className="achievements-title">Your Royal Achievements</h2>
      <div className="achievements-grid">
        {achievements.map((achievement) => (
          <div
            key={achievement._id}
            className={`achievement-card ${achievement.earned ? 'earned' : 'locked'}`}
          >
            <div className="achievement-icon">{achievement.icon}</div>
            <div className="achievement-info">
              <h3>{achievement.name}</h3>
              <p>{achievement.description}</p>
              <div className="achievement-status">
                {achievement.earned ? (
                  <span className="status-earned">Earned! 🎉</span>
                ) : (
                  <div className="status-locked">
                    <span>Not yet earned</span>
                    <div className="progress-info">
                      {achievement.criteria.type === 'wpm' && (
                        <span>Best: {user.bestScore?.wpm || 0} / {achievement.criteria.value} WPM</span>
                      )}
                      {achievement.criteria.type === 'accuracy' && (
                        <span>Best: {user.bestScore?.accuracy || 0}% / {achievement.criteria.value}%</span>
                      )}
                      {achievement.criteria.type === 'tests_completed' && (
                        <span>Completed: {user.typingHistory?.length || 0} / {achievement.criteria.value} tests</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;
