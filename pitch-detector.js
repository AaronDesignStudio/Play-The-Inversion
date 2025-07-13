// Pitch detection system using YIN algorithm
class PitchDetector {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.isListening = false;
        this.noteDetectedCallback = null;
        
        // Audio parameters
        this.sampleRate = 44100;
        this.bufferSize = 4096;
        this.threshold = 0.15; // YIN threshold
        this.probabilityThreshold = 0.8; // Lowered for better detection
        
        // Note detection parameters
        this.minVolume = 0.001; // Lowered threshold
        this.lastDetectedNote = null;
        this.lastDetectionTime = 0;
        this.detectionInterval = 50; // Faster detection
        
        // Processing buffers
        this.floatTimeDomainData = null;
        this.yinBuffer = null;
    }
    
    // Initialize audio context and analyzer
    async init() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sampleRate = this.audioContext.sampleRate;
        
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = this.bufferSize;
        this.analyser.smoothingTimeConstant = 0;
        
        // Initialize buffers
        this.floatTimeDomainData = new Float32Array(this.analyser.fftSize);
        this.yinBuffer = new Float32Array(this.analyser.fftSize / 2);
    }
    
    // Start listening to microphone
    async startListening() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                } 
            });
            
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            this.isListening = true;
            
            // Start detection loop
            this.detectPitch();
            
            return true;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            return false;
        }
    }
    
    // Stop listening
    stopListening() {
        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }
        this.isListening = false;
    }
    
    // Main pitch detection loop
    detectPitch() {
        if (!this.isListening) return;
        
        try {
            this.analyser.getFloatTimeDomainData(this.floatTimeDomainData);
            
            // Check if we're getting any data
            let hasSignal = false;
            for (let i = 0; i < this.floatTimeDomainData.length; i++) {
                if (this.floatTimeDomainData[i] !== 0) {
                    hasSignal = true;
                    break;
                }
            }
            
            // Signal check removed - working properly now
            
            // Check if signal is loud enough
            const rms = this.getRMS(this.floatTimeDomainData);
            
            if (rms < this.minVolume) {
                requestAnimationFrame(() => this.detectPitch());
                return;
            }
        } catch (error) {
            console.error('Error in detectPitch:', error);
        }
        
        // Detect pitch using YIN algorithm
        const pitchData = this.YINDetectorWithConfidence(this.floatTimeDomainData);
        
        if (pitchData.pitch > 0) {
            const note = this.frequencyToNote(pitchData.pitch);
            const now = Date.now();
            
            if (note && pitchData.confidence > 0.8 && (note !== this.lastDetectedNote || now - this.lastDetectionTime > 300)) {
                this.lastDetectedNote = note;
                this.lastDetectionTime = now;
                
                if (this.noteDetectedCallback) {
                    this.noteDetectedCallback(note);
                }
            }
        }
        
        setTimeout(() => this.detectPitch(), this.detectionInterval);
    }
    
    // YIN pitch detection algorithm with confidence
    YINDetectorWithConfidence(buffer) {
        let tauEstimate;
        let pitchInHertz = -1;
        let confidence = 0;
        
        // Step 1: Calculate difference function
        this.difference(buffer);
        
        // Step 2: Calculate cumulative mean normalized difference
        this.cumulativeMeanNormalizedDifference();
        
        // Step 3: Search for the first minimum
        tauEstimate = this.searchForMinimum();
        
        // Step 4: Refine the estimate using parabolic interpolation
        if (tauEstimate !== -1) {
            const betterTau = this.parabolicInterpolation(tauEstimate);
            
            // Convert to frequency
            pitchInHertz = this.sampleRate / betterTau;
            
            // Calculate confidence
            confidence = 1 - this.yinBuffer[tauEstimate];
        }
        
        return { pitch: pitchInHertz, confidence: confidence };
    }
    
    // Step 1: Difference function
    difference(buffer) {
        let index, tau;
        let delta;
        
        // Clear the buffer
        for (tau = 0; tau < this.yinBuffer.length; tau++) {
            this.yinBuffer[tau] = 0;
        }
        
        // Calculate difference
        for (tau = 1; tau < this.yinBuffer.length; tau++) {
            for (index = 0; index < this.yinBuffer.length; index++) {
                delta = buffer[index] - buffer[index + tau];
                this.yinBuffer[tau] += delta * delta;
            }
        }
    }
    
    // Step 2: Cumulative mean normalized difference
    cumulativeMeanNormalizedDifference() {
        let tau;
        this.yinBuffer[0] = 1;
        let runningSum = 0;
        
        for (tau = 1; tau < this.yinBuffer.length; tau++) {
            runningSum += this.yinBuffer[tau];
            this.yinBuffer[tau] *= tau / runningSum;
        }
    }
    
    // Step 3: Search for minimum
    searchForMinimum() {
        let tau;
        let minTau = -1;
        let minVal = Infinity;
        
        for (tau = 2; tau < this.yinBuffer.length; tau++) {
            if (this.yinBuffer[tau] < this.threshold) {
                while (tau + 1 < this.yinBuffer.length && this.yinBuffer[tau + 1] < this.yinBuffer[tau]) {
                    tau++;
                }
                minTau = tau;
                break;
            }
        }
        
        // If no minimum found, search for global minimum
        if (minTau === -1) {
            for (tau = 1; tau < this.yinBuffer.length; tau++) {
                if (this.yinBuffer[tau] < minVal) {
                    minVal = this.yinBuffer[tau];
                    minTau = tau;
                }
            }
        }
        
        return minTau;
    }
    
    // Step 4: Parabolic interpolation
    parabolicInterpolation(tauEstimate) {
        let x0, x2;
        let betterTau;
        
        if (tauEstimate < 1) {
            x0 = tauEstimate;
        } else {
            x0 = tauEstimate - 1;
        }
        
        if (tauEstimate + 1 < this.yinBuffer.length) {
            x2 = tauEstimate + 1;
        } else {
            x2 = tauEstimate;
        }
        
        if (x0 === tauEstimate) {
            if (this.yinBuffer[tauEstimate] <= this.yinBuffer[x2]) {
                betterTau = tauEstimate;
            } else {
                betterTau = x2;
            }
        } else if (x2 === tauEstimate) {
            if (this.yinBuffer[tauEstimate] <= this.yinBuffer[x0]) {
                betterTau = tauEstimate;
            } else {
                betterTau = x0;
            }
        } else {
            const s0 = this.yinBuffer[x0];
            const s1 = this.yinBuffer[tauEstimate];
            const s2 = this.yinBuffer[x2];
            
            betterTau = tauEstimate + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
        }
        
        return betterTau;
    }
    
    // Calculate RMS (Root Mean Square) for volume detection
    getRMS(buffer) {
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i] * buffer[i];
        }
        return Math.sqrt(sum / buffer.length);
    }
    
    // Convert frequency to note name
    frequencyToNote(frequency) {
        // A4 = 440 Hz
        const A4 = 440;
        const A4_INDEX = 57; // A4 is the 57th key on piano
        
        // Calculate number of half steps from A4
        const halfStepsFromA4 = 12 * Math.log2(frequency / A4);
        const noteIndex = Math.round(halfStepsFromA4) + A4_INDEX;
        
        // Get octave and note within octave
        const octave = Math.floor(noteIndex / 12);
        const noteWithinOctave = ((noteIndex % 12) + 12) % 12;
        
        // Only return notes within reasonable range
        if (octave >= 2 && octave <= 7) {
            return window.ChordData.NOTES[noteWithinOctave];
        }
        
        return null;
    }
    
    // Set callback for when a note is detected
    onNoteDetected(callback) {
        this.noteDetectedCallback = callback;
    }
}

// Export PitchDetector
window.PitchDetector = PitchDetector;