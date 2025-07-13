// Audio system for playing piano notes
class AudioSystem {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 0.2;
        
        // Create a compressor to control dynamics
        this.compressor = this.audioContext.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 30;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;
        this.compressor.connect(this.masterGain);
        
        // Define notes array
        this.NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    }
    
    // Convert note name to frequency
    noteToFrequency(note, octave = 4) {
        // Handle both string note names and numeric note values
        let noteIndex;
        if (typeof note === 'string') {
            noteIndex = this.NOTES.indexOf(note);
            if (noteIndex === -1) {
                console.error('Unknown note:', note);
                return 440; // Return A4 as fallback
            }
        } else if (typeof note === 'number') {
            // If note is already a number, use it directly
            noteIndex = note % 12;
            // Convert to note name for consistency
            note = this.NOTES[noteIndex];
        }
        
        const a4Frequency = 440;
        const a4Position = 57; // A4 is the 57th key on piano (starting from C0)
        const notePosition = octave * 12 + noteIndex;
        const halfStepsFromA4 = notePosition - a4Position;
        
        return a4Frequency * Math.pow(2, halfStepsFromA4 / 12);
    }
    
    // Play a single note
    playNote(note, octave = 4, duration = 0.5) {
        const frequency = this.noteToFrequency(note, octave);
        const now = this.audioContext.currentTime;
        
        // Create oscillator
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'triangle'; // Cleaner sound than sine for piano
        oscillator.frequency.setValueAtTime(frequency, now);
        
        // Create gain envelope
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Quick attack
        gainNode.gain.exponentialRampToValueAtTime(0.1, now + 0.1); // Quick decay
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration); // Release
        
        // Add a filter for more piano-like sound
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(frequency * 4, now); // Cut high harmonics
        filter.Q.setValueAtTime(1, now);
        
        // Connect the audio graph
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.compressor);
        
        // Start and stop
        oscillator.start(now);
        oscillator.stop(now + duration + 0.1);
        
        // Clean up
        oscillator.onended = () => {
            oscillator.disconnect();
            filter.disconnect();
            gainNode.disconnect();
        };
    }
    
    // Play a chord
    playChord(notes, octave = 4, duration = 1) {
        notes.forEach((note, index) => {
            // Slight delay between notes for strumming effect
            setTimeout(() => {
                this.playNote(note, octave, duration);
            }, index * 30);
        });
    }
    
    // Play success sound
    playSuccess() {
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        
        osc.connect(gain);
        gain.connect(this.compressor);
        
        osc.start(now);
        osc.stop(now + 0.2);
    }
    
    // Play error sound
    playError() {
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        osc.connect(gain);
        gain.connect(this.compressor);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }
    
    // Play perfect success sound
    playPerfectSuccess() {
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        notes.forEach((freq, index) => {
            setTimeout(() => {
                const now = this.audioContext.currentTime;
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                
                osc.connect(gain);
                gain.connect(this.compressor);
                
                osc.start(now);
                osc.stop(now + 0.3);
            }, index * 100);
        });
    }
    
    // Resume audio context (needed for some browsers)
    resume() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// Export audio system
window.audioSystem = new AudioSystem();