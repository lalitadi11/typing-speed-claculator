import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const getInitials = (name) => {
    return name
      ? name
          .split(' ')
          .map(word => word[0])
          .join('')
          .toUpperCase()
      : '?';
  };

  const getProfilePicUrl = (profilePicture) => {
    if (!profilePicture) return null;
    if (profilePicture.startsWith('data:image')) {
      return profilePicture;
    }
    return `${process.env.REACT_APP_API_URL}${profilePicture}`;
  };

  return (
    <>
      <button className="mobile-toggle" onClick={toggleMenu}>
        <span className="hamburger"></span>
      </button>

      <nav className={`navbar ${isOpen ? 'open' : ''}`}>
        <div className="navbar-brand">
          <span className="logo">⌨️</span>
          <h1>Royal Typist</h1>
        </div>

        {user && (
          <div className="user-profile royal-corner">
            <div className="avatar">
              {user.profilePicture ? (
                <img 
                  src={getProfilePicUrl(user.profilePicture)} 
                  alt={user.username}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <span className="initials">{getInitials(user.username)}</span>
              )}
              <span className="initials" style={{ display: 'none' }}>{getInitials(user.username)}</span>
            </div>
            <div className="user-info">
              <span className="username">{user.username}</span>
              <span className="user-stats">
                Best WPM: {user.bestScore?.wpm || 0}
              </span>
            </div>
          </div>
        )}

        <ul className="nav-links">
          <li>
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <i className="fas fa-home"></i>
              <span>Home</span>
            </Link>
          </li>
          {user && (
            <>
              <li>
                <Link 
                  to="/achievements" 
                  className={`nav-link ${location.pathname === '/achievements' ? 'active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <i className="fas fa-medal"></i>
                  <span>Achievements</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/leaderboard" 
                  className={`nav-link ${location.pathname === '/leaderboard' ? 'active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <i className="fas fa-trophy"></i>
                  <span>Leaderboard</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/profile" 
                  className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <i className="fas fa-user"></i>
                  <span>Profile</span>
                </Link>
              </li>
              <li className="nav-divider"></li>
              <li>
                <button onClick={handleLogout} className="nav-link logout-btn">
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Logout</span>
                </button>
              </li>
            </>
          )}
          {!user && (
            <>
              <li>
                <Link 
                  to="/login" 
                  className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <i className="fas fa-sign-in-alt"></i>
                  <span>Login</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/register" 
                  className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <i className="fas fa-user-plus"></i>
                  <span>Register</span>
                </Link>
              </li>
            </>
          )}
        </ul>

        {user && (
          <div className="navbar-footer">
            <button className="theme-toggle" onClick={toggleTheme}>
              <i className={`fas fa-${isDarkMode ? 'sun' : 'moon'}`}></i>
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
