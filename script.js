// ==================== SOLAR TRACKING SIMULATOR ====================

class SolarTrackingSimulator {

    constructor() {

        // ==================== PAGE ELEMENTS ====================

        this.landingPage = document.getElementById('landingPage');
        this.simulationPage = document.getElementById('simulationPage');
        this.resultsPage = document.getElementById('resultsPage');


        // ==================== BUTTONS ====================

        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.speedBtn = document.getElementById('speedBtn');
        this.restartFromResults = document.getElementById('restartFromResults');


        // ==================== CANVAS ====================

        this.canvas = document.getElementById('simulationCanvas');

        if (!this.canvas) {
            console.error('simulationCanvas was not found.');
            return;
        }

        this.ctx = this.canvas.getContext('2d');


        // ==================== SIMULATION STATE ====================

        this.isRunning = false;
        this.isPaused = false;

        this.simulationTime = 0;

        // 25-second simulation
        this.simulationDuration = 25;

        this.speed = 1;


        // ==================== DATA COLLECTION ====================

        this.trackingData = [];
        this.fixedData = [];


        // ==================== CURRENT VALUES ====================

        this.currentSunAngle = 0;
        this.currentTrackingAngle = 90;
        this.currentFixedAngle = 30;

        this.currentTrackingPower = 0;
        this.currentFixedPower = 0;

        this.currentAlignment = 90;


        // ==================== BUTTON EVENTS ====================

        // START BUTTON
        if (this.startBtn) {

            this.startBtn.addEventListener('click', () => {

                console.log('Start button clicked!');

                this.startSimulation();

            });

        } else {

            console.error('startBtn was not found.');

        }


        // PAUSE BUTTON
        if (this.pauseBtn) {

            this.pauseBtn.addEventListener('click', () => {

                this.togglePause();

            });

        }


        // RESTART BUTTON
        if (this.restartBtn) {

            this.restartBtn.addEventListener('click', () => {

                this.restartSimulation();

            });

        }


        // SPEED BUTTON
        if (this.speedBtn) {

            this.speedBtn.addEventListener('click', () => {

                this.toggleSpeed();

            });

        }


        // RESULTS RESTART BUTTON
        if (this.restartFromResults) {

            this.restartFromResults.addEventListener('click', () => {

                this.resetToLanding();

            });

        }


        // ==================== INITIAL TIME ====================

        this.lastTime = performance.now();


        console.log('Solar Tracking Simulator initialized successfully.');

    }


    // ==================== PAGE NAVIGATION ====================

    startSimulation() {

        console.log('Starting simulation...');


        // Hide landing page
        this.landingPage.classList.add('hidden');


        // Show simulation page
        this.simulationPage.classList.remove('hidden');


        // Hide results page
        this.resultsPage.classList.add('hidden');


        // Reset simulation
        this.isRunning = true;
        this.isPaused = false;

        this.simulationTime = 0;

        this.trackingData = [];
        this.fixedData = [];


        // Reset values
        this.currentSunAngle = 0;
        this.currentTrackingAngle = 90;
        this.currentFixedAngle = 30;

        this.currentTrackingPower = 0;
        this.currentFixedPower = 0;

        this.currentAlignment = 90;


        // Reset pause button
        if (this.pauseBtn) {

            this.pauseBtn.textContent = '⏸ Pause';

        }


        // Reset speed
        this.speed = 1;

        if (this.speedBtn) {

            this.speedBtn.textContent = '1×';

        }


        // Reset timer
        this.lastTime = performance.now();


        // Start animation
        this.animate();

    }


    restartSimulation() {

        this.simulationTime = 0;

        this.trackingData = [];
        this.fixedData = [];

        this.isPaused = false;

        if (this.pauseBtn) {

            this.pauseBtn.textContent = '⏸ Pause';

        }

        this.lastTime = performance.now();

    }


    togglePause() {

        this.isPaused = !this.isPaused;

        if (this.pauseBtn) {

            this.pauseBtn.textContent =
                this.isPaused
                    ? '▶ Resume'
                    : '⏸ Pause';

        }

    }


    toggleSpeed() {

        const speeds = [1, 1.5, 2];

        const currentIndex = speeds.indexOf(this.speed);

        this.speed =
            speeds[(currentIndex + 1) % speeds.length];


        if (this.speedBtn) {

            this.speedBtn.textContent =
                this.speed + '×';

        }

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
        this.simulationTime +=
            (deltaTime / 1000) * this.speed;


        // Check if simulation is complete
        if (this.simulationTime >= this.simulationDuration) {

            this.simulationTime =
                this.simulationDuration;

            this.showResults();

            return;

        }


        // Progress from 0 to 1
        // Morning → Evening

        const progress =
            this.simulationTime /
            this.simulationDuration;


        // Sun angle
        // 0° → 180°

        const sunAngle =
            progress * 180;


        // ==================== TRACKING PANEL ====================

        // Panel rotates to maintain perpendicular alignment
        const trackingPanelAngle =
            sunAngle + 90;


        const incidentAngle =
            Math.abs(
                sunAngle -
                (trackingPanelAngle - 90)
            );


        const alignment =
            Math.max(
                0,
                90 - incidentAngle
            );


        const trackingPower =
            1000 *
            (alignment / 90) *
            (alignment / 90);


        // ==================== FIXED PANEL ====================

        const fixedPanelAngle = 30;


        const fixedIncidentAngle =
            Math.abs(
                sunAngle -
                fixedPanelAngle
            );


        const fixedAlignment =
            Math.max(
                0,
                90 - fixedIncidentAngle
            );


        const fixedPower =
            800 *
            Math.max(
                0,
                Math.cos(
                    (fixedIncidentAngle * Math.PI) / 180
                )
            );


        // ==================== COLLECT DATA ====================

        this.trackingData.push({

            time: progress,
            power: trackingPower

        });


        this.fixedData.push({

            time: progress,
            power: fixedPower

        });


        // ==================== UPDATE UI ====================

        const sunAngleElement =
            document.getElementById('sunAngle');

        const panelAngleElement =
            document.getElementById('panelAngle');

        const alignmentElement =
            document.getElementById('alignment');

        const powerOutputElement =
            document.getElementById('powerOutput');


        if (sunAngleElement) {

            sunAngleElement.textContent =
                Math.round(sunAngle) + '°';

        }


        if (panelAngleElement) {

            panelAngleElement.textContent =
                Math.round(
                    trackingPanelAngle % 360
                ) + '°';

        }


        if (alignmentElement) {

            alignmentElement.textContent =
                Math.round(alignment) + '°';

        }


        if (powerOutputElement) {

            powerOutputElement.textContent =
                Math.round(trackingPower) + ' W';

        }


        // Store current values

        this.currentSunAngle = sunAngle;

        this.currentTrackingAngle =
            trackingPanelAngle;

        this.currentFixedAngle =
            fixedPanelAngle;

        this.currentTrackingPower =
            trackingPower;

        this.currentFixedPower =
            fixedPower;

        this.currentAlignment =
            alignment;

    }


    // ==================== RENDERING ====================

    render() {

        const w = this.canvas.width;
        const h = this.canvas.height;


        // Background

        const gradient =
            this.ctx.createLinearGradient(
                0,
                0,
                0,
                h
            );


        gradient.addColorStop(
            0,
            '#87CEEB'
        );

        gradient.addColorStop(
            0.7,
            '#E0F6FF'
        );

        gradient.addColorStop(
            1,
            '#90EE90'
        );


        this.ctx.fillStyle =
            gradient;

        this.ctx.fillRect(
            0,
            0,
            w,
            h
        );


        // Ground

        this.ctx.fillStyle =
            '#8B7355';

        this.ctx.fillRect(
            0,
            h * 0.7,
            w,
            h * 0.3
        );


        // Don't render before simulation starts

        if (
            this.currentSunAngle === undefined
        ) {

            return;

        }


        // ==================== SUN ====================

        const sunProgress =
            this.currentSunAngle / 180;


        const sunX =
            w *
            (
                0.2 +
                sunProgress * 0.6
            );


        const sunY =
            h * 0.2 +
            Math.sin(
                sunProgress * Math.PI
            ) * h * 0.25;


        // Sun glow

        const sunGlow =
            this.ctx.createRadialGradient(
                sunX,
                sunY,
                0,
                sunX,
                sunY,
                60
            );


        sunGlow.addColorStop(
            0,
            'rgba(255, 200, 0, 0.4)'
        );

        sunGlow.addColorStop(
            1,
            'rgba(255, 200, 0, 0)'
        );


        this.ctx.fillStyle =
            sunGlow;

        this.ctx.fillRect(
            sunX - 60,
            sunY - 60,
            120,
            120
        );


        // Sun circle

        this.ctx.fillStyle =
            '#FFD700';

        this.ctx.beginPath();

        this.ctx.arc(
            sunX,
            sunY,
            30,
            0,
            Math.PI * 2
        );

        this.ctx.fill();


        // Sun outline

        this.ctx.strokeStyle =
            '#FFA500';

        this.ctx.lineWidth = 3;

        this.ctx.stroke();


        // ==================== SUNLIGHT ====================

        this.drawSunrays(
            sunX,
            sunY,
            w * 0.5,
            h * 0.65
        );


        // ==================== TRACKING PANEL ====================

        this.drawPanel(
            w * 0.35,
            h * 0.65,
            this.currentTrackingAngle,
            this.currentAlignment,
            true,
            'TRACKING PANEL'
        );


        // ==================== FIXED PANEL ====================

        this.drawPanel(
            w * 0.65,
            h * 0.65,
            this.currentFixedAngle,
            Math.max(
                0,
                90 -
                Math.abs(
                    this.currentSunAngle -
                    this.currentFixedAngle
                )
            ),
            false,
            'FIXED PANEL'
        );


        // ==================== ANGLE LINES ====================

        this.drawAngleLine(
            sunX,
            sunY,
            w * 0.35,
            h * 0.65,
            this.currentTrackingAngle
        );


        this.drawAngleLine(
            sunX,
            sunY,
            w * 0.65,
            h * 0.65,
            this.currentFixedAngle
        );


        // ==================== PROGRESS ====================

        const progress =
            this.simulationTime /
            this.simulationDuration;


        this.drawProgressBar(progress);

    }


    // ==================== PANEL DRAWING ====================

    drawPanel(
        x,
        y,
        angle,
        alignment,
        isTracking,
        label
    ) {

        const panelWidth = 100;
        const panelHeight = 60;


        this.ctx.save();


        this.ctx.translate(
            x,
            y
        );


        this.ctx.rotate(
            (angle * Math.PI) / 180
        );


        // Panel brightness

        const alignmentFraction =
            Math.min(
                1,
                alignment / 90
            );


        const brightness =
            0.3 +
            alignmentFraction * 0.7;


        this.ctx.fillStyle =
            isTracking
                ? `rgba(100, 150, 255, ${brightness})`
                : `rgba(150, 150, 150, ${brightness})`;


        // Panel

        this.ctx.fillRect(
            -panelWidth / 2,
            -panelHeight / 2,
            panelWidth,
            panelHeight
        );


        // Border

        this.ctx.strokeStyle =
            '#333';

        this.ctx.lineWidth = 3;


        this.ctx.strokeRect(
            -panelWidth / 2,
            -panelHeight / 2,
            panelWidth,
            panelHeight
        );


        // Panel grid

        this.ctx.strokeStyle =
            'rgba(255,255,255,0.4)';

        this.ctx.lineWidth = 1;


        for (let i = 1; i < 3; i++) {

            this.ctx.beginPath();

            this.ctx.moveTo(
                (-panelWidth / 2) +
                (panelWidth / 3) * i,
                -panelHeight / 2
            );

            this.ctx.lineTo(
                (-panelWidth / 2) +
                (panelWidth / 3) * i,
                panelHeight / 2
            );

            this.ctx.stroke();

        }


        this.ctx.restore();


        // Label

        this.ctx.fillStyle =
            '#333';

        this.ctx.font =
            'bold 14px Arial';

        this.ctx.textAlign =
            'center';


        this.ctx.fillText(
            label,
            x,
            y + 70
        );


        // Power

        this.ctx.font =
            '12px Arial';

        this.ctx.fillStyle =
            '#666';


        const power =
            isTracking
                ? this.currentTrackingPower
                : this.currentFixedPower;


        this.ctx.fillText(
            Math.round(power) + ' W',
            x,
            y + 90
        );

    }


    // ==================== SUNRAYS ====================

    drawSunrays(
        sunX,
        sunY,
        targetX,
        targetY
    ) {

        const rayCount = 6;


        for (
            let i = 0;
            i < rayCount;
            i++
        ) {

            const fraction =
                i / rayCount;


            const rayX =
                sunX +
                (targetX - sunX) *
                fraction;


            const rayY =
                sunY +
                (targetY - sunY) *
                fraction;


            this.ctx.strokeStyle =
                `rgba(255,200,0,${0.6 - fraction * 0.4})`;

            this.ctx.lineWidth = 2;


            this.ctx.beginPath();

            this.ctx.moveTo(
                sunX,
                sunY
            );

            this.ctx.lineTo(
                rayX,
                rayY
            );

            this.ctx.stroke();


            this.ctx.fillStyle =
                `rgba(255,200,0,${0.5 - fraction * 0.4})`;


            this.ctx.beginPath();

            this.ctx.arc(
                rayX,
                rayY,
                4,
                0,
                Math.PI * 2
            );

            this.ctx.fill();

        }

    }


    // ==================== ANGLE LINE ====================

    drawAngleLine(
        sunX,
        sunY,
        panelX,
        panelY,
        panelAngle
    ) {

        this.ctx.strokeStyle =
            'rgba(255,107,107,0.5)';

        this.ctx.lineWidth = 1;

        this.ctx.setLineDash([
            5,
            5
        ]);


        this.ctx.beginPath();

        this.ctx.moveTo(
            sunX,
            sunY
        );

        this.ctx.lineTo(
            panelX,
            panelY
        );

        this.ctx.stroke();


        this.ctx.setLineDash([]);

    }


    // ==================== PROGRESS BAR ====================

    drawProgressBar(progress) {

        const barX = 20;

        const barY =
            this.canvas.height - 30;

        const barWidth =
            this.canvas.width - 40;

        const barHeight = 10;


        // Background

        this.ctx.fillStyle =
            '#DDD';

        this.ctx.fillRect(
            barX,
            barY,
            barWidth,
            barHeight
        );


        // Progress

        this.ctx.fillStyle =
            '#FFA500';

        this.ctx.fillRect(
            barX,
            barY,
            barWidth * progress,
            barHeight
        );


        // Border

        this.ctx.strokeStyle =
            '#333';

        this.ctx.lineWidth = 1;

        this.ctx.strokeRect(
            barX,
            barY,
            barWidth,
            barHeight
        );


        // Time

        this.ctx.fillStyle =
            '#333';

        this.ctx.font =
            '12px Arial';

        this.ctx.textAlign =
            'right';


        this.ctx.fillText(
            Math.round(
                this.simulationTime
            ) + 's',
            barX + barWidth + 10,
            barY + barHeight
        );

    }


    // ==================== RESULTS ====================

    displayResults() {

        if (
            this.trackingData.length === 0 ||
            this.fixedData.length === 0
        ) {

            return;

        }


        const trackingAverage =
            this.trackingData.reduce(
                (sum, d) =>
                    sum + d.power,
                0
            ) /
            this.trackingData.length;


        const fixedAverage =
            this.fixedData.reduce(
                (sum, d) =>
                    sum + d.power,
                0
            ) /
            this.fixedData.length;


        const improvement =
            fixedAverage > 0
                ? (
                    (trackingAverage - fixedAverage) /
                    fixedAverage
                ) * 100
                : 0;


        document.getElementById(
            'trackingAvg'
        ).textContent =
            Math.round(
                trackingAverage
            ) + ' W';


        document.getElementById(
            'fixedAvg'
        ).textContent =
            Math.round(
                fixedAverage
            ) + ' W';


        document.getElementById(
            'improvement'
        ).textContent =
            '+' +
            Math.round(
                improvement
            ) +
            '%';


        this.drawComparisonGraph();

    }


    // ==================== COMPARISON GRAPH ====================

    drawComparisonGraph() {

        const canvas =
            document.getElementById(
                'comparisonGraph'
            );


        if (!canvas) return;


        const ctx =
            canvas.getContext('2d');


        const w = canvas.width;
        const h = canvas.height;


        // Clear

        ctx.fillStyle =
            'white';

        ctx.fillRect(
            0,
            0,
            w,
            h
        );


        const padding = 60;

        const graphWidth =
            w - 2 * padding;

        const graphHeight =
            h - 2 * padding;


        // Maximum power

        const maxPower =
            Math.max(
                ...this.trackingData.map(
                    d => d.power
                ),
                ...this.fixedData.map(
                    d => d.power
                ),
                1
            );


        // ==================== AXES ====================

        ctx.strokeStyle =
            '#333';

        ctx.lineWidth = 2;


        ctx.beginPath();

        ctx.moveTo(
            padding,
            h - padding
        );

        ctx.lineTo(
            padding,
            padding
        );

        ctx.lineTo(
            w - padding,
            padding
        );

        ctx.stroke();


        // X-axis label

        ctx.fillStyle =
            '#666';

        ctx.font =
            '12px Arial';

        ctx.textAlign =
            'center';


        ctx.fillText(
            'Time (Simulation Progress)',
            w / 2,
            h - 20
        );


        // Y-axis label

        ctx.save();

        ctx.translate(
            15,
            h / 2
        );

        ctx.rotate(
            -Math.PI / 2
        );

        ctx.textAlign =
            'center';


        ctx.fillText(
            'Power Output (W)',
            0,
            0
        );


        ctx.restore();


        // ==================== GRID ====================

        ctx.strokeStyle =
            '#EEE';

        ctx.lineWidth = 1;


        for (
            let i = 0;
            i <= 5;
            i++
        ) {

            const y =
                h -
                padding -
                (graphHeight / 5) * i;


            ctx.beginPath();

            ctx.moveTo(
                padding,
                y
            );

            ctx.lineTo(
                w - padding,
                y
            );

            ctx.stroke();


            const value =
                Math.round(
                    (maxPower / 5) * i
                );


            ctx.fillStyle =
                '#999';

            ctx.textAlign =
                'right';


            ctx.fillText(
                value,
                padding - 10,
                y + 4
            );

        }


        // ==================== TIME LABELS ====================

        for (
            let i = 0;
            i <= 4;
            i++
        ) {

            const x =
                padding +
                (graphWidth / 4) * i;


            ctx.fillStyle =
                '#999';

            ctx.textAlign =
                'center';


            ctx.fillText(
                (i * 25) + '%',
                x,
                h - padding + 20
            );

        }


        // ==================== TRACKING LINE ====================

        ctx.strokeStyle =
            '#FFA500';

        ctx.lineWidth = 3;


        ctx.beginPath();


        for (
            let i = 0;
            i < this.trackingData.length;
            i++
        ) {

            const data =
                this.trackingData[i];


            const x =
                padding +
                data.time *
                graphWidth;


            const y =
                h -
                padding -
                (
                    data.power /
                    maxPower
                ) *
                graphHeight;


            if (i === 0) {

                ctx.moveTo(
                    x,
                    y
                );

            } else {

                ctx.lineTo(
                    x,
                    y
                );

            }

        }


        ctx.stroke();


        // ==================== FIXED LINE ====================

        ctx.strokeStyle =
            '#888';

        ctx.lineWidth = 3;


        ctx.beginPath();


        for (
            let i = 0;
            i < this.fixedData.length;
            i++
        ) {

            const data =
                this.fixedData[i];


            const x =
                padding +
                data.time *
                graphWidth;


            const y =
                h -
                padding -
                (
                    data.power /
                    maxPower
                ) *
                graphHeight;


            if (i === 0) {

                ctx.moveTo(
                    x,
                    y
                );

            } else {

                ctx.lineTo(
                    x,
                    y
                );

            }

        }


        ctx.stroke();


        // ==================== LEGEND ====================

        ctx.font =
            'bold 12px Arial';

        ctx.textAlign =
            'left';


        ctx.fillStyle =
            '#FFA500';

        ctx.fillRect(
            w - 220,
            padding + 10,
            12,
            12
        );


        ctx.fillStyle =
            '#333';

        ctx.fillText(
            'Tracking Panel',
            w - 200,
            padding + 19
        );


        ctx.fillStyle =
            '#888';

        ctx.fillRect(
            w - 220,
            padding + 30,
            12,
            12
        );


        ctx.fillStyle =
            '#333';

        ctx.fillText(
            'Fixed Panel',
            w - 200,
            padding + 39
        );

    }


    // ==================== ANIMATION LOOP ====================

    animate() {

        if (!this.isRunning) {

            return;

        }


        const now =
            performance.now();


        const deltaTime =
            now -
            this.lastTime;


        this.lastTime = now;


        this.update(deltaTime);

        this.render();


        if (this.isRunning) {

            requestAnimationFrame(
                () => this.animate()
            );

        }

    }

}


// ==================== INITIALIZATION ====================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        console.log(
            'Page loaded, initializing simulator...'
        );

        window.solarSimulator =
            new SolarTrackingSimulator();

    }
);