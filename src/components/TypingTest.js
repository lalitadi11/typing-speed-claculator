import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import './TypingTest.css';

const TypingTest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [timer, setTimer] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [wps, setWps] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [incorrectChars, setIncorrectChars] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [stats, setStats] = useState({
    totalChars: 0,
    correctChars: 0,
    incorrectChars: 0,
    backspaces: 0,
    timeElapsed: 0
  });
  const inputRef = useRef(null);
  const textDisplayRef = useRef(null);
  const timerRef = useRef(null);
  const [showAchievement, setShowAchievement] = useState(false);

  // Timer effect
  useEffect(() => {
    if (isActive && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer(prevTimer => {
          if (prevTimer <= 1) {
            handleTestComplete();
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive]);

  // Prevent text selection and copying
  useEffect(() => {
    const preventCopy = (e) => {
      e.preventDefault();
      return false;
    };

    const preventSelection = (e) => {
      e.preventDefault();
      return false;
    };

    const element = textDisplayRef.current;
    if (element) {
      element.addEventListener('copy', preventCopy);
      element.addEventListener('selectstart', preventSelection);
      element.addEventListener('contextmenu', preventCopy);
    }

    return () => {
      if (element) {
        element.removeEventListener('copy', preventCopy);
        element.removeEventListener('selectstart', preventSelection);
        element.removeEventListener('contextmenu', preventCopy);
      }
    };
  }, []);

  const fetchNewText = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/texts/random');
      setText(response.data.text);
      setError('');
    } catch (err) {
      console.error('Error fetching text:', err);
      setError('Failed to load text. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNewText();
  }, [fetchNewText]);

  const calculateSpeed = useCallback((input, text, timeInSeconds) => {
    if (timeInSeconds === 0) return { wpm: 0, wps: 0 };
    
    // Count correct characters
    let correctChars = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] === text[i]) {
        correctChars++;
      }
    }
    
    // Convert seconds to minutes
    const minutes = timeInSeconds / 60;
    
    // Calculate WPM: (correct characters typed / 5) / minutes elapsed
    const wpm = Math.round((correctChars / 5) / minutes);
    
    // Calculate WPS from WPM
    const wps = Math.round((wpm / 60) * 100) / 100;
    
    return {
      wpm: Math.max(0, Math.min(200, wpm)), // Cap at 200 WPM
      wps: Math.max(0, wps)
    };
  }, []);

  const handleInputChange = useCallback((e) => {
    const newInput = e.target.value;
    setInput(newInput);

    // Start timer on first input
    if (!isActive && newInput.length === 1) {
      setIsActive(true);
      setStartTime(Date.now());
    }

    // Calculate WPM and WPS
    if (isActive && startTime) {
      const timeElapsed = Math.max(0.1, (Date.now() - startTime) / 1000); // Minimum 0.1 seconds to prevent division by zero
      const { wpm: currentWpm, wps: currentWps } = calculateSpeed(newInput, text, timeElapsed);
      setWpm(currentWpm);
      setWps(currentWps);
    }

    // Update stats
    const newStats = { ...stats };
    if (newInput.length < input.length) {
      newStats.backspaces++;
    }

    // Count correct and incorrect characters
    let correct = 0;
    let incorrect = 0;
    for (let i = 0; i < newInput.length; i++) {
      if (newInput[i] === text[i]) {
        correct++;
      } else {
        incorrect++;
      }
    }
    newStats.correctChars = correct;
    newStats.incorrectChars = incorrect;
    newStats.totalChars = newInput.length;
    
    setStats(newStats);

    // Check for incorrect characters
    const newIncorrectChars = [];
    for (let i = 0; i < newInput.length; i++) {
      if (newInput[i] !== text[i]) {
        newIncorrectChars.push(i);
      }
    }
    setIncorrectChars(newIncorrectChars);
    setCurrentPosition(newInput.length);

    // Check if text is complete
    if (newInput.length >= text.length) {
      handleTestComplete();
    }
  }, [input, isActive, startTime, stats, text, calculateSpeed]);

  const handleTestComplete = useCallback(async () => {
    if (isFinished) return;

    setIsActive(false);
    setIsFinished(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Calculate final speeds
    const timeElapsed = Math.max(0.1, (Date.now() - startTime) / 1000);
    const { wpm: finalWpm, wps: finalWps } = calculateSpeed(input, text, timeElapsed);

    // Calculate accuracy
    let correct = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] === text[i]) correct++;
    }
    const calculatedAccuracy = Math.round((correct / input.length) * 100) || 0;

    setWpm(finalWpm);
    setWps(finalWps);
    setAccuracy(calculatedAccuracy);

    // Save results if user is logged in
    if (user) {
      try {
        await axios.post('/api/texts/submit', {
          wpm: finalWpm,
          wps: finalWps,
          accuracy: calculatedAccuracy,
          correctChars: stats.correctChars,
          incorrectChars: stats.incorrectChars,
          totalChars: stats.totalChars,
          backspaces: stats.backspaces
        });

        // Check for new achievements
        const achievementResponse = await axios.post('/api/achievements/check');
        if (achievementResponse.data.newAchievements?.length > 0) {
          setShowAchievement(true);
          setTimeout(() => setShowAchievement(false), 5000);
        }
      } catch (err) {
        console.error('Error saving results:', err);
      }
    }
  }, [calculateSpeed, isFinished, input, text, user, startTime, stats]);

  const resetTest = useCallback(() => {
    setInput('');
    setTimer(30);
    setIsActive(false);
    setIsFinished(false);
    setIncorrectChars([]);
    setCurrentPosition(0);
    setWpm(0);
    setWps(0);
    setAccuracy(0);
    setStartTime(null);
    setStats({
      totalChars: 0,
      correctChars: 0,
      incorrectChars: 0,
      backspaces: 0,
      timeElapsed: 0
    });
    fetchNewText();
  }, [fetchNewText]);

  const getFormattedText = useCallback(() => {
    return text.split('').map((char, index) => {
      let className = '';
      if (index < input.length) {
        className = input[index] === char ? 'correct' : 'incorrect';
      }
      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  }, [input, text]);

  if (loading) {
    return <div className="loading">Loading text...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchNewText}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="typing-test">
      {showAchievement && (
        <div className="achievement-notification">
          New Achievement Unlocked! 🏆
        </div>
      )}

      <div className="test-header">
        <div className="timer">Time: {timer}s</div>
        {isActive && (
          <div className="current-stats">
            <div className="wpm">WPM: {wpm}</div>
            <div className="wps">WPS: {wps}</div>
          </div>
        )}
      </div>

      <div 
        ref={textDisplayRef}
        className="text-display"
        style={{ userSelect: 'none' }}
      >
        {getFormattedText()}
      </div>

      <textarea
        ref={inputRef}
        className="input-field"
        value={input}
        onChange={handleInputChange}
        placeholder="Start typing..."
        disabled={isFinished}
        autoFocus
      />

      {isFinished && (
        <div className="results">
          <h3>Results:</h3>
          <p>WPM: {wpm}</p>
          <p>WPS: {wps}</p>
          <p>Accuracy: {accuracy}%</p>
          <p>Backspaces: {stats.backspaces}</p>
          <button onClick={resetTest}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default TypingTest;
