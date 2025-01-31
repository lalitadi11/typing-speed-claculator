import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import './Leaderboard.css';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [timeRange]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/users/leaderboard?timeRange=${timeRange}`);
      setLeaderboard(response.data);
      setError('');
    } catch (err) {
      console.error('Leaderboard error:', err);
      setError(err.response?.data?.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="royal-loading">Gathering the nobles...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button className="retry-button" onClick={fetchLeaderboard}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header royal-corner">
        <h2 className="gold-gradient">Royal Court Rankings</h2>
        <div className="time-filter">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="royal-select"
          >
            <option value="all">All Time</option>
            <option value="daily">Today's Champions</option>
            <option value="weekly">This Week's Elite</option>
            <option value="monthly">Monthly Royalty</option>
          </select>
        </div>
      </div>

      <div className="leaderboard-content">
        {leaderboard.map((entry, index) => {
          const isCurrentUser = entry._id === user?._id || entry.isCurrentUser;
          const rank = entry.rank || index + 1;

          return (
            <div 
              key={entry._id} 
              className={`leaderboard-entry royal-corner ${
                isCurrentUser ? 'current-user' : ''
              } ${rank <= 3 ? 'top-three' : ''}`}
            >
              <div className="rank">
                {rank === 1 && '👑'}
                {rank === 2 && '🥈'}
                {rank === 3 && '🥉'}
                {rank > 3 && `#${rank}`}
              </div>
              
              <div className="user-info">
                <span className="username">
                  {entry.username}
                  {isCurrentUser && ' (You)'}
                </span>
                <div className="stats">
                  <span className="wpm">{Math.round(entry.wpm)} WPM</span>
                  <span className="wps">{(entry.wpm / 60).toFixed(2)} WPS</span>
                  <span className="accuracy">{Math.round(entry.accuracy)}% Accuracy</span>
                  {entry.totalTests > 0 && (
                    <span className="total-tests">
                      {entry.totalTests} Test{entry.totalTests !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {leaderboard.length === 0 && (
        <div className="no-entries">
          <p>No royal competitors yet. Be the first to claim the throne!</p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
