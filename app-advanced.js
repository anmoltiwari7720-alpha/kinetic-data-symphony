// ============================================================================
// KINETIC DATA SYMPHONY - CORE APPLICATION MODULE
// Microsoft Agents League | Track 1 - Generative Enterprise Data Visualization
// ============================================================================

/**
 * THREE-BULLET EDUCATION:
 * 1. p5.js provides canvas rendering + particle physics
 * 2. Mock Fabric IQ data generator simulates real metrics
 * 3. Dashboard updates in real-time as particles respond to data
 */

// ============================================================================
// SECTION 1: MOCK FABRIC IQ DATA GENERATOR
// ============================================================================

class FabricIQDataGenerator {
    constructor() {
        this.sales_velocity = 0;
        this.customer_sentiment = 0;
        this.supply_chain_latency = 0;
        this.smoothing = 0.08;
        this.targets = {
            sales_velocity: 50,
            sentiment: 0.3,
            latency: 250
        };
    }

    /**
     * Update metrics with smooth interpolation.
     * Periodically changes targets to simulate real data fluctuation.
     */
    update() {
        this.sales_velocity += (this.targets.sales_velocity - this.sales_velocity) * this.smoothing;
        this.customer_sentiment += (this.targets.sentiment - this.customer_sentiment) * this.smoothing;
        this.supply_chain_latency += (this.targets.latency - this.supply_chain_latency) * this.smoothing;

        // Change targets randomly every 60-120 frames (~1-2 seconds)
        if (frameCount % random(60, 120) === 0) {
            this.targets.sales_velocity = random(20, 95);
            this.targets.sentiment = random(-0.8, 1.0);
            this.targets.latency = random(50, 900);
        }
    }

    /**
     * Get current metrics constrained to valid ranges.
     */
    getMetrics() {
        return {
            sales_velocity: constrain(this.sales_velocity, 0, 100),
            customer_sentiment: constrain(this.customer_sentiment, -1.0, 1.0),
            supply_chain_latency: constrain(this.supply_chain_latency, 0, 1000),
            timestamp: Date.now()
        };
    }
}

// ============================================================================
// SECTION 2: PARTICLE CLASS
// ============================================================================

class Particle {
    constructor(x, y, metrics) {
        this.x = x;
        this.y = y;
        this.vx = random(-2, 2);
        this.vy = random(-2, 2);
        this.ax = 0;
        this.ay = 0;
        this.mass = random(1, 3);
        this.age = 0;
        this.hue = 0;
        this.metrics = metrics;
    }

    /**
     * Apply forces based on business metrics.
     * 
     * THREE-BULLET EDUCATION:
     * 1. Sales velocity affects particle acceleration magnitude
     * 2. Customer sentiment pulls particles toward/away from center
     * 3. Supply chain latency adds turbulent jitter
     */
    applyForces() {
        // Sales velocity increases acceleration range
        const velocityMagnitude = map(this.metrics.sales_velocity, 0, 100, 0.5, 3.0);
        
        // Sentiment: positive = attraction to center, negative = repulsion
        const sentimentForce = this.metrics.customer_sentiment * 0.015;
        
        const centerX = width / 2;
        const centerY = height / 2;
        const distToCenter = dist(this.x, this.y, centerX, centerY);

        // Apply sentiment-based force toward/away from center
        if (distToCenter > 0) {
            const angle = atan2(centerY - this.y, centerX - this.x);
            this.ax += cos(angle) * sentimentForce * velocityMagnitude;
            this.ay += sin(angle) * sentimentForce * velocityMagnitude;
        }

        // Latency causes chaotic turbulence
        const latencyJitter = map(this.metrics.supply_chain_latency, 0, 1000, 0.1, 1.2);
        this.ax += random(-latencyJitter * 0.5, latencyJitter * 0.5);
        this.ay += random(-latencyJitter * 0.5, latencyJitter * 0.5);

        // Air resistance/damping
        this.ax *= 0.92;
        this.ay *= 0.92;
    }

    /**
     * Update position and velocity using Euler integration.
     */
    update() {
        this.vx += this.ax;
        this.vy += this.ay;
        this.x += this.vx;
        this.y += this.vy;
        this.age += 1;

        // Wrap around edges
        if (this.x < -50) this.x = width + 50;
        if (this.x > width + 50) this.x = -50;
        if (this.y < -50) this.y = height + 50;
        if (this.y > height + 50) this.y = -50;

        // Reset acceleration for next frame
        this.ax = 0;
        this.ay = 0;
    }

    /**
     * Render particle with color based on sentiment.
     * Size based on sales velocity, opacity based on latency.
     */
    display() {
        // Map sentiment (-1 to 1) to hue (cool blue 200° → warm red 30°)
        const normalizedSentiment = (this.metrics.customer_sentiment + 1) / 2;
        const hueShift = map(normalizedSentiment, 0, 1, 200, 30);
        this.hue = hueShift;

        // Sales velocity determines particle size
        const particleSize = map(this.metrics.sales_velocity, 0, 100, 2, 8);
        
        // Latency determines opacity (high latency = transparent/glitchy)
        const alphaValue = map(this.metrics.supply_chain_latency, 0, 1000, 255, 40);

        push();
        noStroke();
        fill(hslToRgb(this.hue, 100, 50, alphaValue));
        circle(this.x, this.y, particleSize);

        // Add subtle glow ring
        stroke(hslToRgb(this.hue, 100, 70, alphaValue * 0.3));
        strokeWeight(1);
        noFill();
        circle(this.x, this.y, particleSize * 1.5);
        pop();
    }
}

// ============================================================================
// SECTION 3: PARTICLE SWARM SYSTEM
// ============================================================================

class ParticleSwarm {
    constructor(particleCount = 150) {
        this.particles = [];
        this.particleCount = particleCount;
        this.metrics = null;

        for (let i = 0; i < this.particleCount; i++) {
            const x = random(width);
            const y = random(height);
            this.particles.push(new Particle(x, y, {}));
        }
    }

    /**
     * Update all particles with current metrics.
     */
    update(metrics) {
        this.metrics = metrics;
        this.particles.forEach(particle => {
            particle.metrics = metrics;
            particle.applyForces();
            particle.update();
        });
    }

    /**
     * Render all particles.
     */
    display() {
        this.particles.forEach(particle => {
            particle.display();
        });
    }

    /**
     * Dynamically adjust swarm size.
     */
    adjustParticleCount(targetCount) {
        if (this.particles.length < targetCount) {
            // Add new particles
            for (let i = this.particles.length; i < targetCount; i++) {
                this.particles.push(new Particle(random(width), random(height), this.metrics));
            }
        } else if (this.particles.length > targetCount) {
            // Remove excess particles
            this.particles.splice(targetCount);
        }
    }

    /**
     * Export particle state for recording/analysis.
     */
    getParticleData() {
        return this.particles.map(p => ({
            x: p.x, y: p.y, vx: p.vx, vy: p.vy, hue: p.hue, mass: p.mass
        }));
    }
}

// ============================================================================
// SECTION 4: DASHBOARD CONTROLLER
// ============================================================================

class DashboardController {
    /**
     * Update dashboard metrics display.
     */
    static updateMetrics(metrics) {
        // Sales velocity
        const salesVelocity = Math.round(metrics.sales_velocity);
        document.getElementById('sales-velocity-value').textContent = salesVelocity;
        document.getElementById('sales-velocity-bar').style.width = `${metrics.sales_velocity}%`;

        // Customer sentiment
        const sentimentValue = metrics.customer_sentiment.toFixed(2);
        document.getElementById('sentiment-value').textContent = sentimentValue;
        const sentimentBar = map(metrics.customer_sentiment, -1, 1, 0, 100);
        document.getElementById('sentiment-bar').style.width = `${sentimentBar}%`;

        // Supply chain latency
        const latencyValue = Math.round(metrics.supply_chain_latency);
        document.getElementById('latency-value').textContent = `${latencyValue}ms`;
        const latencyBar = map(metrics.supply_chain_latency, 0, 1000, 0, 100);
        document.getElementById('latency-bar').style.width = `${latencyBar}%`;
    }

    /**
     * Update FPS counter.
     */
    static updateFPS(fps) {
        document.getElementById('fps').textContent = Math.round(fps);
    }
}

// ============================================================================
// SECTION 5: UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert HSL color to RGB.
 * Used for sentiment-based coloring.
 */
function hslToRgb(h, s, l, a = 255) {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return color(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), a);
}

/**
 * Linear interpolation (re-implementation for clarity).
 */
function map(value, start1, stop1, start2, stop2) {
    return ((value - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
}

/**
 * Clamp value to range.
 */
function constrain(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// ============================================================================
// SECTION 6: P5.JS SETUP AND MAIN LOOP
// ============================================================================

let dataGenerator;
let particleSwarm;
let fpsTracker = 0;

/**
 * p5.js setup function - called once on initialization.
 */
function setup() {
    const container = document.getElementById('canvas-container');
    let sketch = createCanvas(container.clientWidth, container.clientHeight);
    sketch.parent('canvas-container');

    dataGenerator = new FabricIQDataGenerator();
    particleSwarm = new ParticleSwarm(150);

    colorMode(RGB, 255);
    smooth();

    console.log('🎨 Kinetic Data Symphony initialized');
    console.log('📊 Canvas size:', width, 'x', height);
    console.log('✨ Particles:', particleSwarm.particleCount);
}

/**
 * p5.js draw function - called every frame (~60 FPS).
 */
function draw() {
    // Update data generator
    dataGenerator.update();
    const metrics = dataGenerator.getMetrics();

    // Update particle swarm
    particleSwarm.update(metrics);

    // Clear canvas with motion blur effect
    background(10, 14, 39, 20);

    // Render particles
    particleSwarm.display();

    // Update dashboard
    DashboardController.updateMetrics(metrics);
    fpsTracker = frameRate();
    DashboardController.updateFPS(fpsTracker);
}

/**
 * Handle window resize.
 */
function windowResized() {
    const container = document.getElementById('canvas-container');
    if (container) {
        resizeCanvas(container.clientWidth, container.clientHeight);
    }
}

console.log('✅ app-advanced.js loaded successfully');