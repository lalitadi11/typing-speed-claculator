import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import './ProfilePicture.css';

const ProfilePicture = () => {
  const { user, updateUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Clear previous error
      setError('');
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size must be less than 5MB');
        event.target.value = ''; // Clear the file input
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        event.target.value = ''; // Clear the file input
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    setIsUploading(true);
    setError('');

    try {
      const response = await axios.post('/api/users/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Upload response:', response.data);
      
      updateUser({ ...user, profilePicture: response.data.profilePicture });
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Clear the file input
      const fileInput = document.getElementById('profile-picture-input');
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload profile picture';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setError('');
      const response = await axios.delete('/api/users/profile-picture');
      console.log('Remove response:', response.data);
      
      updateUser({ ...user, profilePicture: response.data.profilePicture });
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Clear the file input
      const fileInput = document.getElementById('profile-picture-input');
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err) {
      console.error('Remove error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to remove profile picture';
      setError(errorMessage);
    }
  };

  const getImageUrl = () => {
    if (previewUrl) return previewUrl;
    if (!user.profilePicture) return '';
    return user.profilePicture.startsWith('data:image') 
      ? user.profilePicture 
      : `${process.env.REACT_APP_API_URL}/uploads/${user.profilePicture}`;
  };

  return (
    <div className="profile-picture-container">
      <div className="profile-picture-preview">
        <img
          src={getImageUrl()}
          alt={user.username}
          className="profile-image"
          onError={(e) => {
            console.error('Image load error:', e);
            e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAADdgAAA3YBfdWCzAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAABBqSURBVHic7Z15kBvVmcB/r1v3HJqey+MDY4bBHhvbGEOWYGMOB8Ima8NmISF2NglQCUnIbiDZTUJ2k6RSye6GJZutJRUIkGQhwRBIHJIQMKkEHMCYYLAx2MY2PvCMPZ6Z8Yw0173vj5YsWeoZS91qdUvzflWuGktPre+9/r7X7/u+970nKKWYyUiSJMTHx0fk5+fnFRQULMzLy1ucmZlZkJaWlqsoiiYQCARVVY0oihIWBCEqCEJUVdWILMsRQRAiqqpGZFkOK4oSlmU5LMtyWJblkKqqYUEQQoqihBRFCSqKElQUJSjLckBV1YCiKAFFUQKKogRkWQ6qqhpQFMWvKIpfURSfoih+RVH8qqr6FEXxybLsVRTFq6qqV5Zlj6qqHlmWPaqquhVFcauq6lZV1a2qqktVVZeiqi5VVZ2qqjpVVXWqqupQVdWhKIpdVVW7oqp2VVHtsqLaVEW1KapiUxXFJiuKTVYUm6woVkVRrIqiWBVFsaiqYlFV1aIoikVVVYuiKmZVVcyKqphVRTGrqmpWFcWsqKpZVRWToigmVVVNiqKaVFU1KqpiVBTFqKiqUVEUo6KoBkVR9IqiGBRF0SuKoldVVS8ril5RVL2qqHpFUXSKouoURdEpiqJTVVWnqKpOVhSdoqo6WVF1sqLqZEXVyYqqk2VVJyuqTpZVvayoellW9Yqs6GVZ1cuKqpcVRS/Lql6WFb0sq3pZVnSyouoURdXJiqqTFUUnK4pOVlWdrKg6RVF1iqrqFFXVKYqqUxRFp6iqTlFVnaKoOkVVdbKi6mRF1SmqqpNVVScrqk5WVJ2sqjpZVXWKqupkRdUpqqqTFVUnq6pOVlSdoqo6RVV1iqLqFFXVKaqqk1VVp6iqTlZVnayoOkVVdbKi6hRF1SmqqpNVVaeoqk5WVZ2sqDpZUXWyquoURdUpqqqTVVUnK6pOVlWdrKg6WVF1sqrqZEXVyYqqk1VVJyuqTlFVnayoOkVVdbKq6mRF1cmqqpMVVSerqk5WVJ2sqDpZVXWyouoURdXJqqqTFVUnq6pOVlSdrKg6WVV1sqLqZFXVyYqqk1VVJyuqTlZVnayoOllVdbKi6v4fwzr1qN8mS3IAAAAASUVORK5CYII=';
          }}
        />
        <div className="profile-picture-overlay">
          <label className="upload-button" htmlFor="profile-picture-input">
            <i className="fas fa-camera"></i>
            <span>Change Picture</span>
          </label>
          {!user.profilePicture?.startsWith('data:image') && (
            <button className="remove-button" onClick={handleRemove}>
              <i className="fas fa-trash"></i>
              <span>Remove</span>
            </button>
          )}
        </div>
      </div>

      <input
        type="file"
        id="profile-picture-input"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {error && (
        <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
          {error}
        </div>
      )}

      {selectedFile && (
        <div className="upload-actions">
          <button
            className="upload-submit"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <i className="fas fa-cloud-upload-alt"></i>
                <span>Upload Picture</span>
              </>
            )}
          </button>
          <button
            className="upload-cancel"
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
              setError('');
              // Clear the file input
              const fileInput = document.getElementById('profile-picture-input');
              if (fileInput) {
                fileInput.value = '';
              }
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePicture;
