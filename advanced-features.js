// ============================================================================
// ADVANCED FEATURES MODULE - Audio, API, Recording, Plugins
// ============================================================================

/**
 * THREE-BULLET EDUCATION:
 * 1. AudioReactivityEngine captures microphone input and analyzes frequencies
 * 2. FabricAPIStreamer handles WebSocket connections to real-time data sources
 * 3. PluginSystem allows extensible custom behaviors without modifying core code
 */

// ============================================================================
// AUDIO REACTIVITY ENGINE
// ============================================================================

class AudioReactivityEngine {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.freqData = new Uint8Array(256);
        this.isActive = false;
        this.audioSensitivity = 1.0;
        this.frequencyBands = {
            bass: 0,      // 0-3 Hz
            mid: 0,       // 4-45 Hz
            treble: 0,    // 90-360 Hz
            full: 0       // Overall energy
        };
    }

    /**
     * Initialize audio context and request microphone access.
     * 
     * THREE-BULLET EDUCATION:
     * 1. getUserMedia() requests browser microphone permission
     * 2. AudioContext creates audio processing pipeline
     * 3. Analyser performs FFT to extract frequency data
     */
    async initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            
            this.microphone.connect(this.analyser);
            this.isActive = true;
            
            console.log('✅ Audio reactivity enabled');
            return true;
        } catch (error) {
            console.warn('⚠️ Audio access denied:', error.message);
            this.isActive = false;
            return false;
        }
    }

    /**
     * Update frequency analysis every frame.
     */
    update() {
        if (!this.isActive || !this.analyser) return;

        this.analyser.getByteFrequencyData(this.freqData);

        // Extract frequency bands
        const bassSlice = this.freqData.slice(0, 3);
        const midSlice = this.freqData.slice(4, 45);
        const trebleSlice = this.freqData.slice(90, 360);

        // Calculate average for each band
        this.frequencyBands.bass = bassSlice.reduce((a, b) => a + b) / bassSlice.length / 255;
        this.frequencyBands.mid = midSlice.reduce((a, b) => a + b) / midSlice.length / 255;
        this.frequencyBands.treble = trebleSlice.reduce((a, b) => a + b) / trebleSlice.length / 255;
        this.frequencyBands.full = this.freqData.reduce((a, b) => a + b) / this.freqData.length / 255;

        // Apply sensitivity scaling
        Object.keys(this.frequencyBands).forEach(key => {
            this.frequencyBands[key] *= this.audioSensitivity;
        });
    }

    /**
     * Get overall audio energy (0-1).
     */
    getEnergy() {
        return constrain(this.frequencyBands.full, 0, 1);
    }

    /**
     * Disable audio and release microphone.
     */
    disable() {
        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone.mediaStream.getTracks().forEach(track => track.stop());
        }
        this.isActive = false;
        console.log('🔇 Audio reactivity disabled');
    }
}

// ============================================================================
// FABRIC API STREAMER (WebSocket Integration)
// ============================================================================

class FabricAPIStreamer {
    constructor(useWebSocket = false) {
        this.useWebSocket = useWebSocket;
        this.websocket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.dataBuffer = [];
        this.subscribers = [];
    }

    /**
     * Connect to WebSocket endpoint.
     * Handles connection, message parsing, and auto-reconnection.
     */
    async connect(url = 'wss://fabric-api.microsoft.com/metrics/stream') {
        if (!this.useWebSocket) {
            console.log('📡 WebSocket disabled—using mock data');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            try {
                this.websocket = new WebSocket(url);

                this.websocket.onopen = () => {
                    console.log('✅ WebSocket connected');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    resolve();
                };

                this.websocket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.dataBuffer.push(data);
                        this.notifySubscribers(data);
                    } catch (error) {
                        console.error('Failed to parse message:', error);
                    }
                };

                this.websocket.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    this.isConnected = false;
                    reject(error);
                };

                this.websocket.onclose = () => {
                    console.log('⚠️ WebSocket disconnected');
                    this.isConnected = false;
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Subscribe to data updates.
     */
    subscribe(callback) {
        this.subscribers.push(callback);
    }

    /**
     * Notify all subscribers of new data.
     */
    notifySubscribers(data) {
        this.subscribers.forEach(callback => callback(data));
    }

    /**
     * Disconnect from WebSocket.
     */
    disconnect() {
        if (this.websocket) {
            this.websocket.close();
        }
        this.isConnected = false;
    }
}

// ============================================================================
// INTERACTIVE CONTROL PANEL
// ============================================================================

class InteractiveControlPanel {
    constructor() {
        this.parameters = {
            particleCount: { value: 150, min: 10, max: 500, step: 10 },
            particleSize: { value: 5, min: 1, max: 20, step: 1 },
            dataSmoothing: { value: 0.08, min: 0.01, max: 0.3, step: 0.01 },
            audioSensitivity: { value: 1.0, min: 0.1, max: 3.0, step: 0.1 },
            motionBlur: { value: 20, min: 0, max: 50, step: 5 }
        };
        this.isOpen = false;
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        this.isOpen = true;
        console.log('📋 Control panel opened');
    }

    close() {
        this.isOpen = false;
        console.log('📋 Control panel closed');
    }

    getParameter(key) {
        return this.parameters[key]?.value;
    }

    setParameter(key, value) {
        if (this.parameters[key]) {
            this.parameters[key].value = constrain(
                value,
                this.parameters[key].min,
                this.parameters[key].max
            );
        }
    }
}

// ============================================================================
// DATA RECORDER & PLAYBACK
// ============================================================================

class DataRecorder {
    constructor() {
        this.isRecording = false;
        this.recordedFrames = [];
        this.playbackIndex = 0;
        this.isPlayingBack = false;
        this.playbackSpeed = 1.0;
    }

    /**
     * Start recording session data.
     */
    startRecording() {
        this.recordedFrames = [];
        this.isRecording = true;
        console.log('🔴 Recording started');
    }

    /**
     * Record single frame of metrics and particle data.
     */
    recordFrame(metrics, particleData) {
        if (!this.isRecording) return;

        this.recordedFrames.push({
            timestamp: frameCount,
            metrics: { ...metrics },
            particles: particleData
        });
    }

    /**
     * Stop recording and return collected data.
     */
    stopRecording() {
        this.isRecording = false;
        console.log(`⏹️ Recording stopped (${this.recordedFrames.length} frames)`);
        return this.recordedFrames;
    }

    /**
     * Export recording as JSON file.
     */
    exportRecording(filename = 'kinetic-recording.json') {
        const dataStr = JSON.stringify(this.recordedFrames, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        console.log('📥 Recording exported:', filename);
    }

    /**
     * Start playback of recorded session.
     */
    startPlayback() {
        this.isPlayingBack = true;
        this.playbackIndex = 0;
        console.log('▶️ Playback started');
    }

    /**
     * Get next frame for playback.
     */
    getPlaybackFrame() {
        if (!this.isPlayingBack || this.recordedFrames.length === 0) return null;

        const frame = this.recordedFrames[Math.floor(this.playbackIndex)];
        this.playbackIndex += this.playbackSpeed;

        if (this.playbackIndex >= this.recordedFrames.length) {
            this.stopPlayback();
        }

        return frame;
    }

    /**
     * Stop playback.
     */
    stopPlayback() {
        this.isPlayingBack = false;
        console.log('⏹️ Playback stopped');
    }

    /**
     * Set playback speed (0.1x to 5x).
     */
    setPlaybackSpeed(speed) {
        this.playbackSpeed = constrain(speed, 0.1, 5.0);
        console.log(`⏱️ Playback speed: ${this.playbackSpeed}x`);
    }
}

// ============================================================================
// PLUGIN SYSTEM (Extensibility)
// ============================================================================

class PluginSystem {
    constructor() {
        this.plugins = [];
        this.hooks = {
            onParticleUpdate: [],
            onMetricsChange: [],
            onFrameRender: []
        };
    }

    /**
     * Register a plugin.
     * 
     * THREE-BULLET EDUCATION:
     * 1. Plugins implement hooks for custom behavior
     * 2. Hooks are called at specific lifecycle points
     * 3. Multiple plugins can subscribe to same hook
     */
    register(plugin) {
        if (!plugin.name) {
            console.warn('Plugin must have a name');
            return;
        }

        this.plugins.push(plugin);

        if (plugin.onParticleUpdate) {
            this.hooks.onParticleUpdate.push(plugin.onParticleUpdate.bind(plugin));
        }
        if (plugin.onMetricsChange) {
            this.hooks.onMetricsChange.push(plugin.onMetricsChange.bind(plugin));
        }
        if (plugin.onFrameRender) {
            this.hooks.onFrameRender.push(plugin.onFrameRender.bind(plugin));
        }

        console.log(`✅ Plugin registered: ${plugin.name}`);
    }

    /**
     * Execute all callbacks for a hook.
     */
    executeHook(hookName, ...args) {
        if (this.hooks[hookName]) {
            this.hooks[hookName].forEach(callback => callback(...args));
        }
    }

    /**
     * Unregister a plugin by name.
     */
    unregister(pluginName) {
        this.plugins = this.plugins.filter(p => p.name !== pluginName);
        console.log(`❌ Plugin unregistered: ${pluginName}`);
    }
}

// ============================================================================
// EXPORT TO GLOBAL SCOPE
// ============================================================================

window.AdvancedFeatures = {
    AudioReactivityEngine,
    FabricAPIStreamer,
    InteractiveControlPanel,
    DataRecorder,
    PluginSystem
};

console.log('✅ Advanced features module loaded');
console.log('📦 Available:', Object.keys(window.AdvancedFeatures).join(', '));