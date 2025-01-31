import React, { useState } from 'react';
import soundService from '../services/SoundService';
import './SoundToggle.css';

const SoundToggle = () => {
    const [isEnabled, setIsEnabled] = useState(true);
    const [volume, setVolume] = useState(0.2);

    const handleToggle = () => {
        const enabled = soundService.toggleSound();
        setIsEnabled(enabled);
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        soundService.setVolume(newVolume);
    };

    return (
        <div className="sound-controls">
            <button 
                className={`sound-toggle ${isEnabled ? 'enabled' : ''}`}
                onClick={handleToggle}
                title={isEnabled ? 'Disable sounds' : 'Enable sounds'}
            >
                {isEnabled ? '🔊' : '🔇'}
            </button>
            {isEnabled && (
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                    title="Adjust volume"
                />
            )}
        </div>
    );
};

export default SoundToggle;
