// Inversions data for Play the Inversion
// All triads in root position, first inversion, and second inversion

// Note names array for compatibility with pitch detection
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const INVERSION_TYPES = {
    ROOT: 'Root Position',
    FIRST: 'First Inversion',
    SECOND: 'Second Inversion'
};

const CHORD_TYPES = {
    MAJOR: 'Major',
    MINOR: 'Minor',
    DIMINISHED: 'Diminished',
    AUGMENTED: 'Augmented'
};

// Helper function to get note intervals based on chord type
function getChordIntervals(chordType) {
    switch (chordType) {
        case CHORD_TYPES.MAJOR:
            return [0, 4, 7]; // Root, Major 3rd, Perfect 5th
        case CHORD_TYPES.MINOR:
            return [0, 3, 7]; // Root, Minor 3rd, Perfect 5th
        case CHORD_TYPES.DIMINISHED:
            return [0, 3, 6]; // Root, Minor 3rd, Diminished 5th
        case CHORD_TYPES.AUGMENTED:
            return [0, 4, 8]; // Root, Major 3rd, Augmented 5th
        default:
            return [0, 4, 7];
    }
}

// Helper function to get inversion pattern
function getInversionPattern(inversionType) {
    switch (inversionType) {
        case INVERSION_TYPES.ROOT:
            return [0, 1, 2]; // Root, 3rd, 5th
        case INVERSION_TYPES.FIRST:
            return [1, 2, 0]; // 3rd, 5th, Root (Root up an octave)
        case INVERSION_TYPES.SECOND:
            return [2, 0, 1]; // 5th, Root, 3rd (Root and 3rd up an octave)
        default:
            return [0, 1, 2];
    }
}

// Generate all inversions for all keys
function generateAllInversions() {
    const roots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteToNumber = {
        'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
        'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };
    
    const inversions = [];
    
    for (const root of roots) {
        for (const chordType of Object.values(CHORD_TYPES)) {
            for (const inversionType of Object.values(INVERSION_TYPES)) {
                const rootNumber = noteToNumber[root];
                const intervals = getChordIntervals(chordType);
                const pattern = getInversionPattern(inversionType);
                
                // Calculate the actual notes for this inversion
                const chordNotes = intervals.map(interval => {
                    return (rootNumber + interval) % 12;
                });
                
                // Apply inversion pattern
                const inversionNotes = pattern.map((index, position) => {
                    let note = chordNotes[index];
                    // For first inversion, the root goes up an octave
                    // For second inversion, root and 3rd go up an octave
                    if (inversionType === INVERSION_TYPES.FIRST && index === 0) {
                        note += 12;
                    } else if (inversionType === INVERSION_TYPES.SECOND && (index === 0 || index === 1)) {
                        note += 12;
                    }
                    return note;
                });
                
                inversions.push({
                    id: `${root}-${chordType}-${inversionType}`,
                    root: root,
                    chordType: chordType,
                    inversionType: inversionType,
                    displayName: `${root} ${chordType}`,
                    notes: inversionNotes,
                    // Store the original chord notes for reference
                    chordNotes: chordNotes,
                    // The first note to be played as reference
                    referenceNote: inversionNotes[0]
                });
            }
        }
    }
    
    return inversions;
}

// Get a specific inversion by criteria
function getInversion(root, chordType, inversionType) {
    const inversions = generateAllInversions();
    return inversions.find(inv => 
        inv.root === root && 
        inv.chordType === chordType && 
        inv.inversionType === inversionType
    );
}

// Check if played notes match the required inversion
function checkInversion(playedNotes, targetInversion) {
    if (playedNotes.length !== 3) return false;
    
    // Normalize played notes to pitch classes (0-11)
    const playedPitchClasses = playedNotes.map(note => note % 12).sort((a, b) => a - b);
    
    // Get the chord notes (not the inversion pattern)
    const chordPitchClasses = targetInversion.chordNotes.sort((a, b) => a - b);
    
    // First check if the correct notes are played (regardless of inversion)
    const correctNotes = playedPitchClasses.every((note, index) => 
        note === chordPitchClasses[index]
    );
    
    if (!correctNotes) return false;
    
    // Now check if they're in the correct inversion
    // We need to check the order from bottom to top
    const sortedPlayed = [...playedNotes].sort((a, b) => a - b);
    
    // Get the bass note (lowest note)
    const bassNote = sortedPlayed[0] % 12;
    
    switch (targetInversion.inversionType) {
        case INVERSION_TYPES.ROOT:
            // Root position: root is the bass
            return bassNote === targetInversion.chordNotes[0];
            
        case INVERSION_TYPES.FIRST:
            // First inversion: 3rd is the bass
            return bassNote === targetInversion.chordNotes[1];
            
        case INVERSION_TYPES.SECOND:
            // Second inversion: 5th is the bass
            return bassNote === targetInversion.chordNotes[2];
            
        default:
            return false;
    }
}

// Get a random inversion for practice
function getRandomInversion() {
    const inversions = generateAllInversions();
    return inversions[Math.floor(Math.random() * inversions.length)];
}

// Export for use in other modules
const Inversions = {
    NOTES,
    INVERSION_TYPES,
    CHORD_TYPES,
    generateAllInversions,
    getInversion,
    checkInversion,
    getRandomInversion,
    getChordIntervals,
    getInversionPattern
};

// For browser environment
if (typeof window !== 'undefined') {
    window.Inversions = Inversions;
}