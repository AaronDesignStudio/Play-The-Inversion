// Main application for Play the Inversion
class App {
    constructor() {
        this.piano = new Piano('piano');
        this.game = new InversionGame(this.piano);
        this.allInversions = window.Inversions.generateAllInversions();
        this.pitchDetector = new PitchDetector();
        
        // Selection state
        this.selectedRootNotes = new Set();
        this.selectedChordTypes = new Set();
        this.selectedInversionTypes = new Set();
        
        this.initializeUI();
        this.bindEvents();
        this.initPitchDetector();
    }
    
    initializeUI() {
        this.createRootNoteDropdown();
        this.createChordTypeDropdown();
        this.createInversionTypeDropdown();
        this.updateStartButton();
    }
    
    createRootNoteDropdown() {
        const menu = document.getElementById('rootNoteMenu');
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        notes.forEach(note => {
            const label = document.createElement('label');
            label.classList.add('dropdown-checkbox');
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = note;
            
            const span = document.createElement('span');
            span.textContent = note;
            
            label.appendChild(checkbox);
            label.appendChild(span);
            menu.appendChild(label);
        });
    }
    
    createChordTypeDropdown() {
        const menu = document.getElementById('chordTypeMenu');
        
        Object.values(window.Inversions.CHORD_TYPES).forEach(chordType => {
            const label = document.createElement('label');
            label.classList.add('dropdown-checkbox');
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = chordType;
            
            const span = document.createElement('span');
            span.textContent = chordType;
            
            label.appendChild(checkbox);
            label.appendChild(span);
            menu.appendChild(label);
        });
    }
    
    createInversionTypeDropdown() {
        const menu = document.getElementById('inversionTypeMenu');
        
        Object.values(window.Inversions.INVERSION_TYPES).forEach(inversionType => {
            const label = document.createElement('label');
            label.classList.add('dropdown-checkbox');
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = inversionType;
            
            const span = document.createElement('span');
            span.textContent = inversionType;
            
            label.appendChild(checkbox);
            label.appendChild(span);
            menu.appendChild(label);
        });
    }
    
    bindEvents() {
        // Setup dropdown toggles
        this.setupDropdownToggle('rootNoteDropdown');
        this.setupDropdownToggle('chordTypeDropdown');
        this.setupDropdownToggle('inversionTypeDropdown');
        
        // Root note dropdown
        document.getElementById('rootNoteMenu').addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                if (e.target.value === 'all') {
                    this.handleAllCheckbox(e.target, 'rootNoteMenu', this.selectedRootNotes);
                } else {
                    this.handleCheckboxChange(e.target, this.selectedRootNotes, 'rootNoteMenu');
                }
                this.updateDropdownDisplay('rootNoteValue', this.selectedRootNotes);
                this.updateStartButton();
            }
        });
        
        // Chord type dropdown
        document.getElementById('chordTypeMenu').addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                if (e.target.value === 'all') {
                    this.handleAllCheckbox(e.target, 'chordTypeMenu', this.selectedChordTypes);
                } else {
                    this.handleCheckboxChange(e.target, this.selectedChordTypes, 'chordTypeMenu');
                }
                this.updateDropdownDisplay('chordTypeValue', this.selectedChordTypes);
                this.updateStartButton();
            }
        });
        
        // Inversion type dropdown
        document.getElementById('inversionTypeMenu').addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                if (e.target.value === 'all') {
                    this.handleAllCheckbox(e.target, 'inversionTypeMenu', this.selectedInversionTypes);
                } else {
                    this.handleCheckboxChange(e.target, this.selectedInversionTypes, 'inversionTypeMenu');
                }
                this.updateDropdownDisplay('inversionTypeValue', this.selectedInversionTypes);
                this.updateStartButton();
            }
        });
        
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startPractice();
        });
        
        // External piano toggle
        document.getElementById('listenToPiano').addEventListener('change', (e) => {
            this.game.setExternalPianoMode(e.target.checked);
            if (e.target.checked) {
                this.startListening();
            } else {
                this.stopListening();
            }
        });
        
        // Piano keyboard
        this.piano.onKeyClick((note, octave) => {
            this.game.handleKeyClick(note, octave);
        });
    }
    
    setupDropdownToggle(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        const trigger = dropdown.querySelector('.dropdown-trigger');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        trigger.addEventListener('click', () => {
            dropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }
    
    handleAllCheckbox(allCheckbox, menuId, selectedSet) {
        const menu = document.getElementById(menuId);
        const checkboxes = menu.querySelectorAll('input[type="checkbox"]:not([value="all"])');
        
        if (allCheckbox.checked) {
            selectedSet.clear();
            checkboxes.forEach(cb => cb.checked = false);
        }
    }
    
    handleCheckboxChange(checkbox, selectedSet, menuId) {
        const menu = document.getElementById(menuId);
        const allCheckbox = menu.querySelector('input[value="all"]');
        
        if (checkbox.checked) {
            selectedSet.add(checkbox.value);
            allCheckbox.checked = false;
        } else {
            selectedSet.delete(checkbox.value);
            if (selectedSet.size === 0) {
                allCheckbox.checked = true;
            }
        }
    }
    
    updateDropdownDisplay(displayId, selectedSet) {
        const display = document.getElementById(displayId);
        if (selectedSet.size === 0) {
            display.textContent = 'All';
        } else if (selectedSet.size <= 3) {
            display.textContent = Array.from(selectedSet).join(', ');
        } else {
            display.textContent = `${selectedSet.size} selected`;
        }
    }
    
    updateStartButton() {
        const btn = document.getElementById('startBtn');
        const hasSelection = this.getSelectedInversions().length > 0;
        btn.disabled = !hasSelection;
    }
    
    getSelectedInversions() {
        const selectedRoots = this.selectedRootNotes.size > 0 ? 
            Array.from(this.selectedRootNotes) : 
            ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            
        const selectedTypes = this.selectedChordTypes.size > 0 ? 
            Array.from(this.selectedChordTypes) : 
            Object.values(window.Inversions.CHORD_TYPES);
            
        const selectedInversions = this.selectedInversionTypes.size > 0 ? 
            Array.from(this.selectedInversionTypes) : 
            Object.values(window.Inversions.INVERSION_TYPES);
        
        return this.allInversions.filter(inv => 
            selectedRoots.includes(inv.root) && 
            selectedTypes.includes(inv.chordType) &&
            selectedInversions.includes(inv.inversionType)
        );
    }
    
    startPractice() {
        const selectedInversions = this.getSelectedInversions();
        if (selectedInversions.length > 0) {
            this.game.startGame(selectedInversions);
        }
    }
    
    // Pitch detection methods
    initPitchDetector() {
        this.pitchDetector.on('noteDetected', (note) => {
            if (document.getElementById('listenToPiano').checked) {
                this.game.handleExternalNote(note);
            }
        });
    }
    
    async startListening() {
        try {
            await this.pitchDetector.start();
        } catch (error) {
            console.error('Failed to start pitch detection:', error);
            alert('Could not access microphone. Please check your permissions.');
            document.getElementById('listenToPiano').checked = false;
        }
    }
    
    stopListening() {
        this.pitchDetector.stop();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});