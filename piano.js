// Piano component
class Piano {
    constructor(containerId, startOctave = 4, numOctaves = 2.5) {
        this.container = document.getElementById(containerId);
        this.startOctave = startOctave;
        this.numOctaves = numOctaves;
        this.keys = new Map();
        this.activeKeys = new Set();
        this.createPiano();
    }
    
    createPiano() {
        this.container.innerHTML = '';
        
        // Pattern of keys in one octave (true = white, false = black)
        const octavePattern = [
            { note: 'C', isBlack: false },
            { note: 'C#', isBlack: true },
            { note: 'D', isBlack: false },
            { note: 'D#', isBlack: true },
            { note: 'E', isBlack: false },
            { note: 'F', isBlack: false },
            { note: 'F#', isBlack: true },
            { note: 'G', isBlack: false },
            { note: 'G#', isBlack: true },
            { note: 'A', isBlack: false },
            { note: 'A#', isBlack: true },
            { note: 'B', isBlack: false }
        ];
        
        // Calculate total octaves to render
        const fullOctaves = Math.floor(this.numOctaves);
        const partialOctave = this.numOctaves - fullOctaves;
        const partialKeys = Math.floor(partialOctave * 12);
        
        let whiteKeyPosition = 0;
        
        // Create keys for each octave
        for (let octave = 0; octave < fullOctaves; octave++) {
            const currentOctave = this.startOctave + octave;
            
            octavePattern.forEach((keyInfo, index) => {
                const fullNote = `${keyInfo.note}${currentOctave}`;
                const key = this.createKey(keyInfo.note, currentOctave, fullNote, keyInfo.isBlack);
                this.keys.set(fullNote, key);
                
                if (!keyInfo.isBlack) {
                    key.style.left = `${whiteKeyPosition * 41}px`; // 40px width + 1px gap
                    whiteKeyPosition++;
                } else {
                    // Position black keys between white keys
                    const blackKeyOffset = this.getBlackKeyOffset(keyInfo.note);
                    key.style.left = `${(whiteKeyPosition - 1) * 41 + blackKeyOffset}px`;
                }
            });
        }
        
        // Create partial octave if needed
        if (partialKeys > 0) {
            const currentOctave = this.startOctave + fullOctaves;
            
            for (let i = 0; i < partialKeys; i++) {
                const keyInfo = octavePattern[i];
                const fullNote = `${keyInfo.note}${currentOctave}`;
                const key = this.createKey(keyInfo.note, currentOctave, fullNote, keyInfo.isBlack);
                this.keys.set(fullNote, key);
                
                if (!keyInfo.isBlack) {
                    key.style.left = `${whiteKeyPosition * 41}px`;
                    whiteKeyPosition++;
                } else {
                    const blackKeyOffset = this.getBlackKeyOffset(keyInfo.note);
                    key.style.left = `${(whiteKeyPosition - 1) * 41 + blackKeyOffset}px`;
                }
            }
        }
        
        // Set container width
        this.container.style.width = `${whiteKeyPosition * 41}px`;
    }
    
    createKey(note, octave, fullNote, isBlack) {
        const key = document.createElement('div');
        
        key.classList.add('key', isBlack ? 'black' : 'white');
        key.dataset.note = note;
        key.dataset.octave = octave;
        key.dataset.fullNote = fullNote;
        
        // Add label for white keys
        if (!isBlack) {
            const label = document.createElement('span');
            label.classList.add('key-label');
            label.textContent = note;
            key.appendChild(label);
        }
        
        this.container.appendChild(key);
        return key;
    }
    
    getBlackKeyOffset(note) {
        // Offset positions for black keys relative to their white key
        const offsets = {
            'C#': 27,
            'D#': 31,
            'F#': 26,
            'G#': 29,
            'A#': 33
        };
        return offsets[note] || 30;
    }
    
    isBlackKey(note) {
        return note.includes('#');
    }
    
    
    // Highlight a key with glow effect
    glowKey(note, octave) {
        const fullNote = `${note}${octave}`;
        const key = this.keys.get(fullNote);
        if (key) {
            key.classList.add('glowing');
        }
    }
    
    // Remove glow from all keys
    removeGlow() {
        this.keys.forEach(key => {
            key.classList.remove('glowing');
        });
    }
    
    // Highlight a key as hint
    hintKey(note, octave) {
        const fullNote = `${note}${octave}`;
        const key = this.keys.get(fullNote);
        if (key) {
            key.classList.add('hint');
            setTimeout(() => {
                key.classList.remove('hint');
            }, 2000);
        }
    }
    
    // Mark key as correct
    markCorrect(note, octave) {
        const fullNote = `${note}${octave}`;
        const key = this.keys.get(fullNote);
        if (key) {
            key.classList.remove('glowing', 'hint');
            key.classList.add('correct');
            this.activeKeys.add(fullNote);
        }
    }
    
    // Mark key as incorrect
    markIncorrect(note, octave) {
        const fullNote = `${note}${octave}`;
        const key = this.keys.get(fullNote);
        if (key) {
            key.classList.add('incorrect');
            setTimeout(() => {
                key.classList.remove('incorrect');
            }, 1000);
        }
    }
    
    // Reset all keys
    reset() {
        this.keys.forEach(key => {
            key.classList.remove('correct', 'incorrect', 'glowing', 'hint');
        });
        this.activeKeys.clear();
    }
    
    // Enable/disable piano
    setEnabled(enabled) {
        this.container.style.pointerEvents = enabled ? 'auto' : 'none';
        this.container.style.opacity = enabled ? '1' : '0.7';
    }
    
    // Get key element by note
    getKey(note, octave) {
        const fullNote = `${note}${octave}`;
        return this.keys.get(fullNote);
    }
    
    // Add click handler
    onKeyClick(callback) {
        this.container.addEventListener('click', (e) => {
            const key = e.target.closest('.key');
            if (key) {
                const note = key.dataset.note;
                const octave = parseInt(key.dataset.octave);
                callback(note, octave, key);
            }
        });
    }
}

// Export Piano class
window.Piano = Piano;