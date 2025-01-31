const fs = require('fs').promises;
const pdf = require('pdf-parse');

class TextService {
    constructor() {
        this.texts = [];
        this.initialized = false;
    }

    cleanText(text) {
        return text
            // Replace quotes with simple quotes
            .replace(/[""]/g, '"')
            .replace(/['']/g, "'")
            // Replace dashes with simple hyphen
            .replace(/[—–]/g, "-")
            // Remove special characters not on standard keyboard
            .replace(/[^\x20-\x7E]/g, '')
            // Replace multiple spaces with single space
            .replace(/\s+/g, ' ')
            .trim();
    }

    async initialize() {
        if (this.initialized) return;

        try {
            const dataBuffer = await fs.readFile('nesbit_shakespeare_preview.pdf');
            const data = await pdf(dataBuffer);
            
            // Split text into paragraphs and clean them
            const paragraphs = data.text
                .split(/\n\s*\n/)
                .map(p => this.cleanText(p))
                .filter(p => p.length >= 50 && p.length <= 200); // Filter appropriate length paragraphs

            this.texts = paragraphs;
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing TextService:', error);
            // Fallback texts in case PDF reading fails
            this.texts = [
                "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer The slings and arrows of outrageous fortune, Or to take Arms against a Sea of troubles.",
                "All the world's a stage, and all the men and women merely players. They have their exits and their entrances, and one man in his time plays many parts.",
                "What's in a name? That which we call a rose by any other name would smell as sweet. So Romeo would, were he not Romeo called.",
                "Life's but a walking shadow, a poor player that struts and frets his hour upon the stage and then is heard no more. It is a tale told by an idiot, full of sound and fury.",
            ].map(text => this.cleanText(text));
            this.initialized = true;
        }
    }

    getRandomText() {
        if (!this.initialized || this.texts.length === 0) {
            throw new Error('TextService not initialized');
        }
        const randomIndex = Math.floor(Math.random() * this.texts.length);
        return this.texts[randomIndex];
    }
}

module.exports = new TextService();
