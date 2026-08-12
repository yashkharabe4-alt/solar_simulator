// ==================== SOLAR TRACKING SIMULATOR ==================== 

class SolarTrackingSimulator {
    constructor() {
        // Page elements
        this.landingPage = document.getElementById('landingPage');
        this.simulationPage = document.getElementById('simulationPage');
        this.resultsPage = document.getElementById('resultsPage');

        // Buttons
        document.getElementById('startBtn').addEventListener('click', () => this.startSimulation());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartSimulation());
        document.getElementById('speedBtn').addEventListener('click', () => this.toggleSpeed());
        document.getElementById('restartFromResults').addEventListener('click', () => this.resetToLanding());

        // Canvas
        this.canvas = document.getElementById('simulationCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Simulation state
        this.isRunning = false;
        this.isPaused = false;
        this.simulationTime = 0;
        this.simulationDuration = 25; // seconds (for 25-30 second simulation)
        this.speed = 1;

        // Data collection
        this.trackingData = [];
        this.fixedData = [];

        // Animation loop
        this.lastTime = Date.now();
    }

    // ==================== PAGE NAVIGATION ====================

    startSimulation() {
        this.landingPage.classList.add('hidden');
        this.simulationPage.classList.remove('hidden');
        this.resultsPage.classList.add('hidden');
        this.isRunning = true;
        this.simulationTime = 0;
        this.trackingData = [];
        this.fixedData = [];
        this.animate();
    }

    restartSimulation() {
        this.simulationTime = 0;
        this.trackingData = [];
        this.fixedData = [];
        this.isPaused = false;
        document.getElementById('pauseBtn').textContent = '⏸ Pause';
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? '▶ Resume' : '⏸ Pause';
    }

    toggleSpeed() {
        const speeds = [1, 1.5, 2];
        const currentIndex = speeds.indexOf(this.speed);
        this.speed = speeds[(currentIndex + 1) % speeds.length];
        document.getElementById('speedBtn').textContent = this.speed + '×';
    }

    resetToLanding() {
        this.landingPage.classList.remove('hidden');
        this.simulationPage.classList.add('hidden');
        this.resultsPage.classList.add('hidden');
        this.isRunning = false;
    }

    showResults() {
        this.simulationPage.classList.add('hidden');
        this.resultsPage.classList.remove('hidden');
        this.isRunning = false;
        this.displayResults();
    }

    // ==================== SIMULATION LOGIC ====================

    update(deltaTime) {
        if (this.isPaused) return;

        // Advance simulation time
        this.simulationTime += (deltaTime / 1000) * this.speed;

        // Check if simulation is complete
        if (this.simulationTime >= this.simulationDuration) {
            this.showResults();
            return;
        }

        // Progress from 0 to 1 (morning to evening)
        const progress = this.simulationTime / this.simulationDuration;

        // Calculate sun position (0-180 degrees, left to right)
        // Sun rises at 0°, peaks at 90°, sets at 180°
        const sunAngle = progress * 180;

        // ===== TRACKING PANEL =====
        // Panel automatically rotates to maintain ~90° perpendicular angle to incoming light
        // If sun is at angle X, panel should face angle X + 90 (to be perpendicular)
        const trackingPanelAngle = sunAngle + 90;

        // Calculate alignment (how close to perpendicular)
        // When perpendicular, power is maximum
        const incidentAngle = Math.abs(sunAngle - (trackingPanelAngle - 90));
        const alignment = Math.max(0, 90 - incidentAngle);

        // Power output is proportional to alignment (simple cosine relationship)
        const trackingPower = 1000 * (alignment / 90) * (alignment / 90);

        // ===== FIXED PANEL =====
        // Fixed panel is set at optimal morning angle (30°)
        const fixedPanelAngle = 30;
        const fixedIncidentAngle = Math.abs(sunAngle - fixedPanelAngle);
        const fixedAlignment = Math.max(0, 90 - fixedIncidentAngle);
        const fixedPower = 800 * Math.max(0, Math.cos((fixedIncidentAngle * Math.PI) / 180));

        // ===== COLLECT DATA =====
        this.trackingData.push({ time: progress, power: trackingPower });
        this.fixedData.push({ time: progress, power: fixedPower });

        // ===== UPDATE UI =====
        document.getElementById('sunAngle').textContent = Math.round(sunAngle) + '°';
        document.getElementById('panelAngle').textContent = Math.round(trackingPanelAngle % 360) + '°';
        document.getElementById('alignment').textContent = Math.round(alignment) + '°';
        document.getElementById('powerOutput').textContent = Math.round(trackingPower) + ' W';

        // Store for rendering
        this.currentSunAngle = sunAngle;
        this.currentTrackingAngle = trackingPanelAngle;
        this.currentFixedAngle = fixedPanelAngle;
        this.currentTrackingPower = trackingPower;
        this.currentFixedPower = fixedPower;
        this.currentAlignment = alignment;
    }

    // ==================== RENDERING ====================

    render() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#E0F6FF');
        gradient.addColorStop(1, '#90EE90');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, w, h);

        // Draw ground
        this.ctx.fillStyle = '#8B7355';
        this.ctx.fillRect(0, h * 0.7, w, h * 0.3);

        if (this.currentSunAngle === undefined) return;

        // ===== DRAW SUN =====
        const sunProgress = this.currentSunAngle / 180; // 0 to 1
        const sunX = w * (0.2 + sunProgress * 0.6);
        const sunY = h * 0.2 + Math.sin(sunProgress * Math.PI) * h * 0.25;

        // Sun glow
        const sunGlow = this.ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 60);
        sunGlow.addColorStop(0, 'rgba(255, 200, 0, 0.4)');
        sunGlow.addColorStop(1, 'rgba(255, 200, 0, 0)');
        this.ctx.fillStyle = sunGlow;
        this.ctx.fillRect(sunX - 60, sunY - 60, 120, 120);

        // Sun circle
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
        this.ctx.fill();

        // Sun outline
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // ===== DRAW SUNLIGHT RAYS =====
        this.drawSunrays(sunX, sunY, w * 0.5, h * 0.65);

        // ===== DRAW TRACKING PANEL =====
        this.drawPanel(
            w * 0.35,
            h * 0.65,
            this.currentTrackingAngle,
            this.currentAlignment,
            true,
            'TRACKING PANEL'
        );

        // ===== DRAW FIXED PANEL =====
        this.drawPanel(
            w * 0.65,
            h * 0.65,
            this.currentFixedAngle,
            Math.max(0, 90 - Math.abs(this.currentSunAngle - this.currentFixedAngle)),
            false,
            'FIXED PANEL'
        );

        // ===== DRAW ANGLE LINES =====
        this.drawAngleLine(sunX, sunY, w * 0.35, h * 0.65, this.currentTrackingAngle, '#FF6B6B');
        this.drawAngleLine(sunX, sunY, w * 0.65, h * 0.65, this.currentFixedAngle, '#FFB6C1');

        // ===== DRAW PROGRESS BAR =====
        const progress = this.simulationTime / this.simulationDuration;
        this.drawProgressBar(progress);
    }

    drawPanel(x, y, angle, alignment, isTracking, label) {
        const panelWidth = 100;
        const panelHeight = 60;

        // Save context for rotation
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate((angle * Math.PI) / 180);

        // Panel color based on alignment
        const alignmentFraction = Math.min(1, alignment / 90);
        const brightness = 0.3 + alignmentFraction * 0.7;
        this.ctx.fillStyle = isTracking 
            ? `rgba(100, 150, 255, ${brightness})`
            : `rgba(150, 150, 150, ${brightness})`;

        // Draw panel
        this.ctx.fillRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight);

        // Panel border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight);

        // Panel grid
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo((-panelWidth / 2) + (panelWidth / 3) * i, -panelHeight / 2);
            this.ctx.lineTo((-panelWidth / 2) + (panelWidth / 3) * i, panelHeight / 2);
            this.ctx.stroke();
        }

        this.ctx.restore();

        // Draw label below panel
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(label, x, y + 70);

        // Draw power output below panel
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#666';
        const power = isTracking ? this.currentTrackingPower : this.currentFixedPower;
        this.ctx.fillText(Math.round(power) + ' W', x, y + 90);
    }

    drawSunrays(sunX, sunY, targetX, targetY) {
        const rayCount = 6;
        for (let i = 0; i < rayCount; i++) {
            const fraction = i / rayCount;
            const rayX = sunX + (targetX - sunX) * fraction;
            const rayY = sunY + (targetY - sunY) * fraction;

            // Ray line
            this.ctx.strokeStyle = `rgba(255, 200, 0, ${0.6 - fraction * 0.4})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(sunX, sunY);
            this.ctx.lineTo(rayX, rayY);
            this.ctx.stroke();

            // Ray circle
            this.ctx.fillStyle = `rgba(255, 200, 0, ${0.5 - fraction * 0.4})`;
            this.ctx.beginPath();
            this.ctx.arc(rayX, rayY, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawAngleLine(sunX, sunY, panelX, panelY, panelAngle, color) {
        // Light ray from sun to panel
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(sunX, sunY);
        this.ctx.lineTo(panelX, panelY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawProgressBar(progress) {
        const barX = 20;
        const barY = this.canvas.height - 30;
        const barWidth = this.canvas.width - 40;
        const barHeight = 10;

        // Background
        this.ctx.fillStyle = '#DDD';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // Progress
        this.ctx.fillStyle = '#FFA500';
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

        // Border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Time label
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(Math.round(this.simulationTime) + 's', barX + barWidth + 10, barY + barHeight);
    }

    // ==================== RESULTS ====================

    displayResults() {
        // Calculate averages
        const trackingAverage = this.trackingData.reduce((sum, d) => sum + d.power, 0) / this.trackingData.length;
        const fixedAverage = this.fixedData.reduce((sum, d) => sum + d.power, 0) / this.fixedData.length;
        const improvement = ((trackingAverage - fixedAverage) / fixedAverage) * 100;

        // Update result cards
        document.getElementById('trackingAvg').textContent = Math.round(trackingAverage) + ' W';
        document.getElementById('fixedAvg').textContent = Math.round(fixedAverage) + ' W';
        document.getElementById('improvement').textContent = '+' + Math.round(improvement) + '%';

        // Draw comparison graph
        this.drawComparisonGraph();
    }

    drawComparisonGraph() {
        const canvas = document.getElementById('comparisonGraph');
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        // Clear
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, w, h);

        const padding = 60;
        const graphWidth = w - 2 * padding;
        const graphHeight = h - 2 * padding;

        // Find max power for scaling
        const maxPower = Math.max(
            ...this.trackingData.map(d => d.power),
            ...this.fixedData.map(d => d.power)
        );

        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, h - padding);
        ctx.lineTo(padding, padding);
        ctx.lineTo(w - padding, padding);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Time (Simulation Progress)', w / 2, h - 20);

        ctx.save();
        ctx.translate(15, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('Power Output (W)', 0, 0);
        ctx.restore();

        // Grid lines and value labels
        ctx.strokeStyle = '#EEE';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = h - padding - (graphHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(w - padding, y);
            ctx.stroke();

            const value = Math.round((maxPower / 5) * i);
            ctx.fillStyle = '#999';
            ctx.textAlign = 'right';
            ctx.fillText(value, padding - 10, y + 4);
        }

        // Time labels
        for (let i = 0; i <= 4; i++) {
            const x = padding + (graphWidth / 4) * i;
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.fillText((i * 25) + '%', x, h - padding + 20);
        }

        // Draw tracking line
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < this.trackingData.length; i++) {
            const data = this.trackingData[i];
            const x = padding + data.time * graphWidth;
            const y = h - padding - (data.power / maxPower) * graphHeight;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // Draw fixed line
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < this.fixedData.length; i++) {
            const data = this.fixedData[i];
            const x = padding + data.time * graphWidth;
            const y = h - padding - (data.power / maxPower) * graphHeight;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // Legend
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(w - 220, padding + 10, 12, 12);
        ctx.fillStyle = '#333';
        ctx.fillText('Tracking Panel', w - 200, padding + 19);

        ctx.fillStyle = '#888';
        ctx.fillRect(w - 220, padding + 30, 12, 12);
        ctx.fillStyle = '#333';
        ctx.fillText('Fixed Panel', w - 200, padding + 39);
    }

    // ==================== ANIMATION LOOP ====================

    animate() {
        const now = Date.now();
        const deltaTime = now - this.lastTime;
        this.lastTime = now;

        this.update(deltaTime);
        this.render();

        if (this.isRunning) {
            requestAnimationFrame(() => this.animate());
        }
    }
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    new SolarTrackingSimulator();
});