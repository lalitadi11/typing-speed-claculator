class SoundService {
    constructor() {
        this.sounds = {
            correct: new Audio('/sounds/correct.mp3'),
            error: new Audio('/sounds/error.mp3'),
            backspace: new Audio('/sounds/backspace.mp3')
        };
        
        // Initialize all sounds with low volume
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.2;
        });

        this.enabled = true;
    }

    playSound(soundName) {
        if (!this.enabled || !this.sounds[soundName]) return;
        
        // Stop and reset the sound before playing again
        const sound = this.sounds[soundName];
        sound.currentTime = 0;
        sound.play().catch(err => console.log('Error playing sound:', err));
    }

    toggleSound() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    setVolume(volume) {
        Object.values(this.sounds).forEach(sound => {
            sound.volume = Math.max(0, Math.min(1, volume));
        });
    }
}

export default new SoundService();
