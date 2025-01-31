import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import TypingTest from './components/TypingTest';
import Achievement from './components/Achievement';
import Leaderboard from './components/Leaderboard';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import Achievements from './components/Achievements';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route Component (redirects to home if already logged in)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="app">
        {user && (
          <header className="app-header royal-border">
            <img src="/logo.svg" alt="Noble Type Logo" className="app-logo" />
            <h1 className="app-title gold-gradient">Noble Type</h1>
          </header>
        )}
        {user && <Navbar />}
        <main className={`app-main ${!user ? 'full-height' : ''}`}>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <TypingTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/achievements"
              element={
                <ProtectedRoute>
                  <Achievements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
          </Routes>
        </main>
        {user && (
          <footer className="app-footer">
            <div className="footer-content gold-gradient">
              <p>Noble Type - Master the Art of Royal Typing</p>
            </div>
          </footer>
        )}
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
