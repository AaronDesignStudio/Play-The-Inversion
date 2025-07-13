// Game logic for Play the Inversion
class InversionGame {
    constructor(piano) {
        this.piano = piano;
        this.currentInversion = null;
        this.selectedInversions = [];
        this.currentIndex = 0;
        this.mistakes = 0;
        this.hintsUsed = false;
        this.startTime = null;
        this.hintTimeout = null;
        this.exerciseStarted = false;
        this.correctNotes = new Set();
        this.currentOctave = 4;
        this.externalPianoMode = false;
        
        // UI elements
        this.chordNameEl = document.getElementById('chordName');
        this.inversionTypeEl = document.getElementById('inversionType');
        this.feedbackEl = document.getElementById('feedback');
        this.flashcardEl = document.getElementById('flashcard');
        
        // Track played notes for inversion checking
        this.playedNotes = [];
    }
    
    // Set external piano mode
    setExternalPianoMode(enabled) {
        this.externalPianoMode = enabled;
        if (enabled) {
            this.piano.setEnabled(false);
        } else {
            this.piano.setEnabled(true);
        }
    }
    
    // Start game with selected inversions
    startGame(selectedInversions) {
        this.selectedInversions = this.shuffleArray([...selectedInversions]);
        this.currentIndex = 0;
        this.nextInversion();
    }
    
    // Move to next inversion
    nextInversion() {
        if (this.currentIndex >= this.selectedInversions.length) {
            this.currentIndex = 0;
            this.selectedInversions = this.shuffleArray(this.selectedInversions);
        }
        
        this.currentInversion = this.selectedInversions[this.currentIndex];
        this.currentIndex++;
        
        this.resetExercise();
        this.displayInversion();
    }
    
    // Reset exercise state
    resetExercise() {
        this.piano.reset();
        this.mistakes = 0;
        this.hintsUsed = false;
        this.exerciseStarted = false;
        this.correctNotes.clear();
        this.playedNotes = [];
        this.clearHintTimeout();
        this.feedbackEl.textContent = '';
        this.feedbackEl.className = 'feedback';
        // Make sure piano is enabled unless in external piano mode
        if (!this.externalPianoMode) {
            this.piano.setEnabled(true);
        }
    }
    
    // Display current inversion
    displayInversion() {
        this.chordNameEl.textContent = this.currentInversion.displayName;
        this.inversionTypeEl.textContent = this.currentInversion.inversionType;
        
        // Animate flashcard
        this.flashcardEl.style.animation = 'slideIn 0.5s ease';
        
        // Play and show the reference note (first note of the inversion)
        const referenceNote = this.currentInversion.referenceNote;
        const referenceOctave = this.currentOctave + Math.floor(referenceNote / 12);
        const referencePitch = referenceNote % 12;
        
        // Convert pitch number to note name
        const numberToNote = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const referenceNoteName = numberToNote[referencePitch];
        
        this.piano.glowKey(referenceNoteName, referenceOctave);
        window.audioSystem.playNote(referenceNoteName, referenceOctave);
    }
    
    // Handle key click (from UI piano)
    handleKeyClick(note, octave) {
        console.log('=== handleKeyClick called ===');
        console.log('note:', note, 'type:', typeof note);
        console.log('octave:', octave, 'type:', typeof octave);
        console.log('currentInversion:', this.currentInversion);
        console.log('exerciseStarted:', this.exerciseStarted);
        
        // Check if we have a current inversion
        if (!this.currentInversion) {
            console.error('No current inversion set!');
            return;
        }
        
        // Resume audio context on first interaction
        window.audioSystem.resume();
        
        if (!this.exerciseStarted) {
            this.startExercise();
            // Don't return - process this click!
        }
        
        // Check if note is already a number or needs conversion
        let noteNumber;
        let noteName;
        
        if (typeof note === 'number') {
            // Note is already a number
            noteNumber = note;
            const numberToNote = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            noteName = numberToNote[note];
        } else {
            // Convert note name to number (support both sharp and flat notation)
            const noteToNumber = {
                'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
                'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
            };
            noteNumber = noteToNumber[note];
            noteName = note;
            
            if (noteNumber === undefined) {
                console.error('Unknown note:', note);
                return;
            }
        }
        
        console.log('Converted note:', noteNumber, 'name:', noteName);
        
        // Convert to MIDI note number for tracking
        const midiNote = (octave * 12) + noteNumber;
        
        // Check if note is in the chord (any octave)
        const noteInChord = this.currentInversion.chordNotes.includes(noteNumber);
        console.log('Note in chord:', noteInChord);
        console.log('Note number:', noteNumber);
        console.log('Chord notes:', this.currentInversion.chordNotes);
        
        if (noteInChord) {
            // Play note sound and track it
            console.log('Playing correct note...');
            window.audioSystem.playNote(noteName, octave);
            this.handleCorrectNote(noteNumber, octave, midiNote, noteName);
        } else {
            // Don't play note sound for incorrect notes, only error sound
            console.log('Playing error sound...');
            this.handleIncorrectNote(noteName, octave);
        }
    }
    
    // Handle external piano note detection
    handleExternalNote(note) {
        if (!this.currentInversion) return;
        
        if (!this.exerciseStarted) {
            this.startExercise();
            // Don't return - process this note!
        }
        
        // Check if note is in chord
        const isCorrect = this.currentInversion.chordNotes.includes(note);
        
        if (isCorrect && !this.correctNotes.has(note)) {
            // For external piano, we estimate the octave based on typical piano range
            const octave = 4; // Default to middle octave
            const midiNote = (octave * 12) + note;
            // Convert number to note name
            const numberToNote = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const noteName = numberToNote[note];
            this.handleCorrectNote(note, octave, midiNote, noteName);
            // Visual feedback
            this.piano.markCorrect(noteName, octave);
        } else if (!isCorrect) {
            const numberToNote = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const noteName = numberToNote[note];
            this.handleIncorrectNote(noteName, 4);
            // Visual feedback
            this.piano.markIncorrect(noteName, 4);
        }
    }
    
    // Start the exercise
    startExercise() {
        this.exerciseStarted = true;
        this.startTime = Date.now();
        
        // Remove glow
        this.piano.removeGlow();
        
        // Start hint timeout
        this.startHintTimeout();
    }
    
    // Check if note is in current chord
    isNoteInChord(note) {
        return this.currentInversion.chordNotes.includes(note);
    }
    
    // Handle correct note
    handleCorrectNote(noteNumber, octave, midiNote, noteName) {
        console.log('Handling correct note:', noteNumber, octave, midiNote, noteName);
        if (!this.correctNotes.has(noteNumber)) {
            // Use the provided note name for piano display
            this.piano.markCorrect(noteName, octave);
            this.correctNotes.add(noteNumber);
            this.playedNotes.push(midiNote);
            console.log('Correct notes so far:', this.correctNotes.size, 'Played notes:', this.playedNotes);
            
            // Reset hint timeout
            this.clearHintTimeout();
            this.startHintTimeout();
            
            // Check if we have all three notes
            if (this.correctNotes.size === 3) {
                console.log('All 3 notes played, checking inversion...');
                // Check if the inversion is correct
                if (window.Inversions.checkInversion(this.playedNotes, this.currentInversion)) {
                    console.log('Correct inversion!');
                    this.completeExercise();
                } else {
                    console.log('Wrong inversion!');
                    // Wrong inversion - show feedback
                    this.feedbackEl.textContent = 'Wrong inversion! Try again.';
                    this.feedbackEl.classList.add('error');
                    window.audioSystem.playError();
                    
                    // Reset after delay
                    setTimeout(() => {
                        this.resetExercise();
                        this.displayInversion();
                    }, 2000);
                }
            }
        }
    }
    
    // Handle incorrect note
    handleIncorrectNote(note, octave) {
        this.piano.markIncorrect(note, octave);
        window.audioSystem.playError();
        this.mistakes++;
        
        // Show hint after 3 mistakes
        if (this.mistakes >= 3 && !this.hintsUsed) {
            this.showHint();
        }
    }
    
    // Complete the exercise
    completeExercise() {
        this.clearHintTimeout();
        this.piano.setEnabled(false);
        
        const perfect = this.mistakes === 0 && !this.hintsUsed;
        
        if (perfect) {
            this.feedbackEl.textContent = 'Perfect! 🎯';
            this.feedbackEl.classList.add('perfect');
            window.audioSystem.playPerfectSuccess();
        } else {
            this.feedbackEl.textContent = 'Good job! 👍';
            this.feedbackEl.classList.add('success');
            window.audioSystem.playSuccess();
        }
        
        // Play the complete inversion
        setTimeout(() => {
            // Play the notes in the order they were played (to demonstrate the inversion)
            const sortedNotes = [...this.playedNotes].sort((a, b) => a - b);
            const notes = sortedNotes.map(midi => midi % 12);
            const octaves = sortedNotes.map(midi => Math.floor(midi / 12));
            
            // Play notes with slight delay to hear the inversion clearly
            notes.forEach((note, index) => {
                setTimeout(() => {
                    // Convert number to note name
                    const numberToNote = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                    const noteName = numberToNote[note];
                    window.audioSystem.playNote(noteName, octaves[index]);
                }, index * 100);
            });
        }, 500);
        
        // Move to next chord after delay
        setTimeout(() => {
            this.flashcardEl.style.animation = 'slideOut 0.5s ease';
            setTimeout(() => {
                this.nextInversion();
            }, 500);
        }, 2000);
    }
    
    // Show hint
    showHint() {
        this.hintsUsed = true;
        
        // Find next required note
        const nextNoteNumber = this.currentInversion.chordNotes.find(note => !this.correctNotes.has(note));
        if (nextNoteNumber !== undefined) {
            // Convert to note name
            const numberToNote = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const nextNote = numberToNote[nextNoteNumber];
            // For inversions, we need to show the hint in a logical octave
            // that would create the correct inversion
            let hintOctave = 4; // Default middle octave
            
            // If we already have some notes played, adjust the octave accordingly
            if (this.playedNotes.length > 0) {
                const lowestPlayed = Math.min(...this.playedNotes);
                const lowestOctave = Math.floor(lowestPlayed / 12);
                
                // Determine appropriate octave based on inversion type
                switch (this.currentInversion.inversionType) {
                    case window.Inversions.INVERSION_TYPES.ROOT:
                        // Root position - all notes in same octave or spanning one octave
                        hintOctave = lowestOctave;
                        break;
                    case window.Inversions.INVERSION_TYPES.FIRST:
                        // First inversion - root should be higher
                        if (nextNoteNumber === this.currentInversion.chordNotes[0]) {
                            hintOctave = lowestOctave + 1;
                        } else {
                            hintOctave = lowestOctave;
                        }
                        break;
                    case window.Inversions.INVERSION_TYPES.SECOND:
                        // Second inversion - root and 3rd should be higher
                        if (nextNoteNumber === this.currentInversion.chordNotes[2]) {
                            hintOctave = lowestOctave;
                        } else {
                            hintOctave = lowestOctave + 1;
                        }
                        break;
                }
            }
            
            this.piano.hintKey(nextNote, hintOctave);
        }
    }
    
    // Hint timeout management
    startHintTimeout() {
        this.hintTimeout = setTimeout(() => {
            if (!this.hintsUsed) {
                this.showHint();
            }
        }, 5000);
    }
    
    clearHintTimeout() {
        if (this.hintTimeout) {
            clearTimeout(this.hintTimeout);
            this.hintTimeout = null;
        }
    }
    
    // Utility functions
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Export InversionGame class
window.InversionGame = InversionGame;