import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [stats, setStats] = useState({
    averageWPM: 0,
    averageAccuracy: 0,
    testsCompleted: 0,
    bestWPM: 0,
    bestAccuracy: 0
  });

  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await axios.get('/api/users/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset states
    setUploadError(null);
    setUploadSuccess(false);
    setLoading(true);

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a JPG, PNG or GIF image');
      setLoading(false);
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await axios.post('/api/users/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      updateUser({ ...user, profilePicture: response.data.profilePicture });
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setUploadError(error.response?.data?.message || 'Error uploading profile picture');
    } finally {
      setLoading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validate passwords match if changing password
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const dataToUpdate = {};

      // Only include fields that have been changed
      if (formData.username !== user.username) {
        dataToUpdate.username = formData.username;
      }
      if (formData.email !== user.email) {
        dataToUpdate.email = formData.email;
      }
      if (formData.currentPassword && formData.newPassword) {
        dataToUpdate.currentPassword = formData.currentPassword;
        dataToUpdate.newPassword = formData.newPassword;
      }

      // Only make the request if there are changes
      if (Object.keys(dataToUpdate).length > 0) {
        const response = await axios.put('/api/users/profile', dataToUpdate);
        updateUser(response.data);
        setSuccess(true);
        
        // Clear sensitive form fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        setError('No changes to save');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <h2>Profile Settings</h2>
      
      <div className="profile-stats">
        <h3>Your Typing Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Average WPM</h4>
            <p>{stats.averageWPM.toFixed(1)}</p>
          </div>
          <div className="stat-card">
            <h4>Best WPM</h4>
            <p>{stats.bestWPM.toFixed(1)}</p>
          </div>
          <div className="stat-card">
            <h4>Average Accuracy</h4>
            <p>{stats.averageAccuracy.toFixed(1)}%</p>
          </div>
          <div className="stat-card">
            <h4>Best Accuracy</h4>
            <p>{stats.bestAccuracy.toFixed(1)}%</p>
          </div>
          <div className="stat-card">
            <h4>Tests Completed</h4>
            <p>{stats.testsCompleted}</p>
          </div>
        </div>
      </div>

      <div className="profile-picture-section">
        <h3>Profile Picture</h3>
        <div className="current-picture">
          <img 
            src={user?.profilePicture || '/default-avatar.png'} 
            alt="Profile" 
            className="profile-image"
          />
        </div>
        
        {uploadError && <div className="error-message">{uploadError}</div>}
        {uploadSuccess && <div className="success-message">Profile picture updated successfully!</div>}
        
        <div className="form-group">
          <label className="file-input-label">
            <span>Choose New Picture</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleFileChange}
              className="file-input"
              disabled={loading}
            />
          </label>
          <div className="file-requirements">
            Supported formats: JPG, PNG, GIF (max 5MB)
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <h3>Edit Profile</h3>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Profile updated successfully!</div>}

        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            minLength="3"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={loading}
          />
        </div>

        <h4>Change Password</h4>
        <div className="form-group">
          <label>Current Password</label>
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleInputChange}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            minLength="6"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Confirm New Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            minLength="6"
            disabled={loading}
          />
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
