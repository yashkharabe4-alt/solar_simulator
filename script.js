// ==================== SOLAR TRACKING SIMULATOR ====================

class SolarTrackingSimulator {

    constructor() {

        // ==================== PAGES ====================

        this.landingPage =
            document.getElementById('landingPage');

        this.simulationPage =
            document.getElementById('simulationPage');

        this.resultsPage =
            document.getElementById('resultsPage');


        // ==================== BUTTONS ====================

        this.startBtn =
            document.getElementById('startBtn');

        this.stopBtn =
            document.getElementById('stopBtn');


        // ==================== CANVAS ====================

        this.canvas =
            document.getElementById('simulationCanvas');

        if (!this.canvas) {

            console.error(
                'simulationCanvas was not found.'
            );

            return;
        }

        this.ctx =
            this.canvas.getContext('2d');


        // ==================== SIMULATION STATE ====================

        this.isRunning = false;

        this.simulationTime = 0;

        // Slower simulation
        this.simulationDuration = 40;


        // ==================== DATA ====================

        this.trackingData = [];

        this.referenceData = [];


        // ==================== CURRENT VALUES ====================

        this.currentSunAngle = 0;

        this.currentTrackingAngle = 90;

        this.currentAlignment = 90;

        this.currentTrackingPower = 0;

        this.currentReferencePower = 0;


        // ==================== BUTTON EVENTS ====================

        if (this.startBtn) {

            this.startBtn.addEventListener(
                'click',
                () => this.startSimulation()
            );

        }


        if (this.stopBtn) {

            this.stopBtn.addEventListener(
                'click',
                () => this.stopSimulation()
            );

        }


        this.lastTime =
            performance.now();


        console.log(
            'Solar Tracking Simulator initialized.'
        );
    }


    // ==================== START ====================

    startSimulation() {

        console.log(
            'Starting solar simulation...'
        );


        // Show simulation

        this.landingPage.classList.add(
            'hidden'
        );

        this.resultsPage.classList.add(
            'hidden'
        );

        this.simulationPage.classList.remove(
            'hidden'
        );


        // Reset values

        this.isRunning = true;

        this.simulationTime = 0;

        this.trackingData = [];

        this.referenceData = [];


        this.currentSunAngle = 0;

        this.currentTrackingAngle = 90;

        this.currentAlignment = 90;

        this.currentTrackingPower = 0;

        this.currentReferencePower = 0;


        this.lastTime =
            performance.now();


        this.animate();
    }


    // ==================== STOP ====================

    stopSimulation() {

        console.log(
            'Simulation stopped.'
        );


        this.isRunning = false;


        this.simulationPage.classList.add(
            'hidden'
        );

        this.resultsPage.classList.add(
            'hidden'
        );

        this.landingPage.classList.remove(
            'hidden'
        );
    }


    // ==================== UPDATE ====================

    update(deltaTime) {

        // Advance simulation slowly

        this.simulationTime +=
            deltaTime / 1000;


        // Simulation complete

        if (
            this.simulationTime >=
            this.simulationDuration
        ) {

            this.simulationTime =
                this.simulationDuration;

            this.isRunning = false;

            this.showResults();

            return;
        }


        // ==================== SIMULATION PROGRESS ====================

        const progress =
            this.simulationTime /
            this.simulationDuration;


        // ==================== SUN POSITION ====================

        /*
         * Sun travels from one side of the
         * simulation to the other.
         */

        const sunAngle =
            progress * 180;


        // ==================== TARGET PANEL ANGLE ====================

        /*
         * The panel orientation follows
         * the changing Sun position.
         */

        const targetPanelAngle =
            sunAngle + 90;


        // ==================== SMOOTH TRACKING ====================

        /*
         * The panel does not instantly jump.
         * It gradually rotates toward the
         * required tracking position.
         */

        const rotationSpeed = 0.08;


        this.currentTrackingAngle +=
            (
                targetPanelAngle -
                this.currentTrackingAngle
            ) *
            rotationSpeed;


        // ==================== ALIGNMENT ====================

        const angleDifference =
            Math.abs(
                targetPanelAngle -
                this.currentTrackingAngle
            );


        /*
         * Convert the tracking difference
         * into an approximate alignment value.
         */

        this.currentAlignment =
            Math.max(
                0,
                90 - angleDifference
            );


        /*
         * The conceptual tracker is intended
         * to maintain approximately 90°
         * alignment with sunlight.
         */

        if (
            this.currentAlignment > 88
        ) {

            this.currentAlignment = 90;

        }


        // ==================== REFERENCE OUTPUT ====================

        /*
         * We use a normalized reference output
         * instead of pretending that the panel
         * has a specific physical wattage.
         *
         * The output varies naturally during
         * the simulated day.
         */

        const referenceOutput =
            70 +
            30 *
            Math.sin(
                progress * Math.PI
            );


        // ==================== DUAL-AXIS ADVANTAGE ====================

        /*
         * Conceptual improvement:
         *
         * approximately 20–30% higher than
         * the reference output.
         */

        const improvementFactor =
            1.20 +
            0.10 *
            Math.sin(
                progress * Math.PI
            );


        const trackingOutput =
            referenceOutput *
            improvementFactor;


        // ==================== STORE DATA ====================

        this.trackingData.push({

            time: progress,

            power: trackingOutput

        });


        this.referenceData.push({

            time: progress,

            power: referenceOutput

        });


        // ==================== CURRENT VALUES ====================

        this.currentSunAngle =
            sunAngle;

        this.currentTrackingPower =
            trackingOutput;

        this.currentReferencePower =
            referenceOutput;


        // ==================== UPDATE UI ====================

        const sunAngleElement =
            document.getElementById(
                'sunAngle'
            );

        const panelAngleElement =
            document.getElementById(
                'panelAngle'
            );

        const alignmentElement =
            document.getElementById(
                'alignment'
            );

        const powerOutputElement =
            document.getElementById(
                'powerOutput'
            );


        if (sunAngleElement) {

            sunAngleElement.textContent =
                Math.round(
                    sunAngle
                ) + '°';

        }


        if (panelAngleElement) {

            panelAngleElement.textContent =
                Math.round(
                    this.currentTrackingAngle
                ) + '°';

        }


        if (alignmentElement) {

            alignmentElement.textContent =
                Math.round(
                    this.currentAlignment
                ) + '°';

        }


        if (powerOutputElement) {

            const relativeOutput =
                (
                    trackingOutput /
                    referenceOutput
                ) * 100;


            powerOutputElement.textContent =
                Math.round(
                    relativeOutput
                ) + '%';

        }
    }


    // ==================== RENDER ====================

    render() {

        const w =
            this.canvas.width;

        const h =
            this.canvas.height;


        // ==================== SIMPLE SKY ====================

        /*
         * No ground.
         * No buildings.
         * No landscape.
         *
         * The environment stays visually
         * simple so the panel remains the focus.
         */

        const gradient =
            this.ctx.createLinearGradient(
                0,
                0,
                0,
                h
            );


        gradient.addColorStop(
            0,
            '#BFE7F7'
        );


        gradient.addColorStop(
            1,
            '#F4FBFE'
        );


        this.ctx.fillStyle =
            gradient;


        this.ctx.fillRect(
            0,
            0,
            w,
            h
        );


        // ==================== SUN POSITION ====================

        const sunProgress =
            this.currentSunAngle /
            180;


        const sunX =
            w *
            (
                0.15 +
                sunProgress * 0.70
            );


        const sunY =
            h * 0.22 +
            Math.sin(
                sunProgress * Math.PI
            ) *
            h *
            0.20;


        // ==================== SUN GLOW ====================

        const sunGlow =
            this.ctx.createRadialGradient(
                sunX,
                sunY,
                0,
                sunX,
                sunY,
                90
            );


        sunGlow.addColorStop(
            0,
            'rgba(255,200,0,0.45)'
        );


        sunGlow.addColorStop(
            1,
            'rgba(255,200,0,0)'
        );


        this.ctx.fillStyle =
            sunGlow;


        this.ctx.fillRect(
            sunX - 90,
            sunY - 90,
            180,
            180
        );


        // ==================== SUN ====================

        this.ctx.fillStyle =
            '#FFD700';


        this.ctx.beginPath();


        this.ctx.arc(
            sunX,
            sunY,
            40,
            0,
            Math.PI * 2
        );


        this.ctx.fill();


        this.ctx.strokeStyle =
            '#FFA500';


        this.ctx.lineWidth = 3;


        this.ctx.stroke();


        // ==================== PANEL POSITION ====================

        /*
         * Large central panel.
         */

        const panelX =
            w * 0.50;

        const panelY =
            h * 0.67;


        // ==================== SUNLIGHT ====================

        this.drawSunrays(
            sunX,
            sunY,
            panelX,
            panelY
        );


        // ==================== TRACKING PANEL ====================

        this.drawPanel(
            panelX,
            panelY,
            this.currentTrackingAngle
        );


        // ==================== ALIGNMENT INDICATOR ====================

        this.drawAlignmentIndicator(
            panelX,
            panelY
        );


        // ==================== PROGRESS BAR ====================

        const progress =
            this.simulationTime /
            this.simulationDuration;


        this.drawProgressBar(
            progress
        );
    }


    // ==================== DRAW PANEL ====================

    drawPanel(
        x,
        y,
        angle
    ) {

        /*
         * Larger panel so the tracking
         * movement is clearly visible.
         */

        const panelWidth = 240;

        const panelHeight = 130;


        this.ctx.save();


        this.ctx.translate(
            x,
            y
        );


        this.ctx.rotate(
            angle *
            Math.PI /
            180
        );


        // ==================== PANEL ====================

        this.ctx.fillStyle =
            '#397DB8';


        this.ctx.fillRect(
            -panelWidth / 2,
            -panelHeight / 2,
            panelWidth,
            panelHeight
        );


        // ==================== PANEL BORDER ====================

        this.ctx.strokeStyle =
            '#1F3A56';


        this.ctx.lineWidth = 5;


        this.ctx.strokeRect(
            -panelWidth / 2,
            -panelHeight / 2,
            panelWidth,
            panelHeight
        );


        // ==================== SOLAR CELL GRID ====================

        this.ctx.strokeStyle =
            'rgba(255,255,255,0.45)';


        this.ctx.lineWidth = 1;


        // Vertical lines

        for (
            let i = 1;
            i < 5;
            i++
        ) {

            this.ctx.beginPath();


            this.ctx.moveTo(
                -panelWidth / 2 +
                (
                    panelWidth / 5
                ) * i,

                -panelHeight / 2
            );


            this.ctx.lineTo(
                -panelWidth / 2 +
                (
                    panelWidth / 5
                ) * i,

                panelHeight / 2
            );


            this.ctx.stroke();
        }


        // Horizontal lines

        for (
            let i = 1;
            i < 3;
            i++
        ) {

            this.ctx.beginPath();


            this.ctx.moveTo(
                -panelWidth / 2,

                -panelHeight / 2 +
                (
                    panelHeight / 3
                ) * i
            );


            this.ctx.lineTo(
                panelWidth / 2,

                -panelHeight / 2 +
                (
                    panelHeight / 3
                ) * i
            );


            this.ctx.stroke();
        }


        // ==================== SUPPORT ====================

        this.ctx.strokeStyle =
            '#263746';


        this.ctx.lineWidth = 7;


        this.ctx.beginPath();


        this.ctx.moveTo(
            0,
            panelHeight / 2
        );


        this.ctx.lineTo(
            0,
            panelHeight / 2 + 55
        );


        this.ctx.stroke();


        this.ctx.restore();


        // ==================== PANEL LABEL ====================

        this.ctx.fillStyle =
            '#243746';


        this.ctx.font =
            'bold 20px Arial';


        this.ctx.textAlign =
            'center';


        this.ctx.fillText(
            'DUAL-AXIS TRACKING',
            x,
            y + 100
        );


        // ==================== OUTPUT ====================

        this.ctx.font =
            'bold 15px Arial';


        this.ctx.fillStyle =
            '#516572';


        this.ctx.fillText(
            Math.round(
                (
                    this.currentTrackingPower /
                    this.currentReferencePower
                ) * 100
            ) +
            '% relative output',

            x,
            y + 125
        );
    }


    // ==================== SUN RAYS ====================

    drawSunrays(
        sunX,
        sunY,
        targetX,
        targetY
    ) {

        const rayCount = 7;


        for (
            let i = 0;
            i < rayCount;
            i++
        ) {

            const offset =
                (
                    i -
                    3
                ) * 18;


            const endX =
                targetX +
                offset;


            const endY =
                targetY;


            this.ctx.strokeStyle =
                'rgba(255,190,0,0.60)';


            this.ctx.lineWidth = 3;


            this.ctx.beginPath();


            this.ctx.moveTo(
                sunX,
                sunY
            );


            this.ctx.lineTo(
                endX,
                endY
            );


            this.ctx.stroke();
        }
    }


    // ==================== ALIGNMENT INDICATOR ====================

    drawAlignmentIndicator(
        x,
        y
    ) {

        this.ctx.fillStyle =
            'rgba(255,255,255,0.92)';


        this.ctx.fillRect(
            x - 100,
            y - 195,
            200,
            55
        );


        this.ctx.strokeStyle =
            '#D8E5EC';


        this.ctx.lineWidth = 1;


        this.ctx.strokeRect(
            x - 100,
            y - 195,
            200,
            55
        );


        this.ctx.fillStyle =
            '#2C3E50';


        this.ctx.font =
            'bold 15px Arial';


        this.ctx.textAlign =
            'center';


        this.ctx.fillText(
            'Sunlight Alignment',
            x,
            y - 169
        );


        this.ctx.fillStyle =
            '#27AE60';


        this.ctx.font =
            'bold 20px Arial';


        this.ctx.fillText(
            '≈ 90°',
            x,
            y - 146
        );
    }


    // ==================== PROGRESS BAR ====================

    drawProgressBar(
        progress
    ) {

        const barX = 40;

        const barY =
            this.canvas.height - 30;

        const barWidth =
            this.canvas.width - 80;

        const barHeight = 8;


        this.ctx.fillStyle =
            'rgba(255,255,255,0.70)';


        this.ctx.fillRect(
            barX,
            barY,
            barWidth,
            barHeight
        );


        this.ctx.fillStyle =
            '#FFA500';


        this.ctx.fillRect(
            barX,
            barY,
            barWidth * progress,
            barHeight
        );


        this.ctx.strokeStyle =
            'rgba(50,50,50,0.25)';


        this.ctx.lineWidth = 1;


        this.ctx.strokeRect(
            barX,
            barY,
            barWidth,
            barHeight
        );


        this.ctx.fillStyle =
            '#516572';


        this.ctx.font =
            '12px Arial';


        this.ctx.textAlign =
            'right';


        this.ctx.fillText(
            Math.round(
                progress * 100
            ) + '%',

            barX + barWidth,
            barY - 6
        );
    }


    // ==================== RESULTS ====================

    showResults() {

        this.simulationPage.classList.add(
            'hidden'
        );

        this.resultsPage.classList.remove(
            'hidden'
        );


        this.displayResults();
    }


    // ==================== DISPLAY RESULTS ====================

    displayResults() {

        if (
            this.trackingData.length === 0 ||
            this.referenceData.length === 0
        ) {

            return;
        }


        // ==================== AVERAGES ====================

        const trackingAverage =
            this.trackingData.reduce(
                (
                    sum,
                    data
                ) =>
                    sum + data.power,

                0
            ) /
            this.trackingData.length;


        const referenceAverage =
            this.referenceData.reduce(
                (
                    sum,
                    data
                ) =>
                    sum + data.power,

                0
            ) /
            this.referenceData.length;


        // ==================== IMPROVEMENT ====================

        const improvement =
            (
                (
                    trackingAverage -
                    referenceAverage
                ) /
                referenceAverage
            ) * 100;


        // ==================== UPDATE RESULTS ====================

        document.getElementById(
            'trackingAvg'
        ).textContent =
            Math.round(
                trackingAverage
            ) + '%';


        document.getElementById(
            'fixedAvg'
        ).textContent =
            Math.round(
                referenceAverage
            ) + '%';


        document.getElementById(
            'improvement'
        ).textContent =
            '+' +
            Math.round(
                improvement
            ) +
            '%';


        // ==================== GRAPH ====================

        this.drawComparisonGraph();
    }


    // ==================== COMPARISON GRAPH ====================

    drawComparisonGraph() {

        const canvas =
            document.getElementById(
                'comparisonGraph'
            );


        if (!canvas) {

            return;
        }


        const ctx =
            canvas.getContext('2d');


        const w =
            canvas.width;

        const h =
            canvas.height;


        // ==================== CLEAR ====================

        ctx.fillStyle =
            '#FFFFFF';


        ctx.fillRect(
            0,
            0,
            w,
            h
        );


        const padding = 60;


        const graphWidth =
            w -
            padding * 2;


        const graphHeight =
            h -
            padding * 2;


        // ==================== MAX VALUE ====================

        const maxPower =
            Math.max(
                ...this.trackingData.map(
                    data => data.power
                ),

                ...this.referenceData.map(
                    data => data.power
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


        // ==================== GRID ====================

        ctx.strokeStyle =
            '#EEEEEE';

        ctx.lineWidth = 1;


        for (
            let i = 0;
            i <= 5;
            i++
        ) {

            const y =
                h -
                padding -
                (
                    graphHeight / 5
                ) * i;


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
                    (
                        maxPower / 5
                    ) * i
                );


            ctx.fillStyle =
                '#777';


            ctx.font =
                '12px Arial';


            ctx.textAlign =
                'right';


            ctx.fillText(
                value + '%',
                padding - 10,
                y + 4
            );
        }


        // ==================== AXIS LABEL ====================

        ctx.fillStyle =
            '#666';


        ctx.font =
            '12px Arial';


        ctx.textAlign =
            'center';


        ctx.fillText(
            'Simulation Time',
            w / 2,
            h - 15
        );


        // ==================== Y AXIS LABEL ====================

        ctx.save();


        ctx.translate(
            15,
            h / 2
        );


        ctx.rotate(
            -Math.PI / 2
        );


        ctx.fillText(
            'Relative Output',
            0,
            0
        );


        ctx.restore();


        // ==================== DUAL-AXIS LINE ====================

        ctx.strokeStyle =
            '#FFA500';

        ctx.lineWidth = 4;


        ctx.beginPath();


        this.trackingData.forEach(
            (
                data,
                index
            ) => {

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


                if (index === 0) {

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
        );


        ctx.stroke();


        // ==================== REFERENCE LINE ====================

        ctx.strokeStyle =
            '#888';

        ctx.lineWidth = 4;


        ctx.beginPath();


        this.referenceData.forEach(
            (
                data,
                index
            ) => {

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


                if (index === 0) {

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
        );


        ctx.stroke();


        // ==================== LEGEND ====================

        ctx.font =
            'bold 12px Arial';


        ctx.textAlign =
            'left';


        // Dual-axis

        ctx.fillStyle =
            '#FFA500';


        ctx.fillRect(
            w - 230,
            padding + 10,
            12,
            12
        );


        ctx.fillStyle =
            '#333';


        ctx.fillText(
            'Dual-Axis Tracking',
            w - 210,
            padding + 20
        );


        // Reference

        ctx.fillStyle =
            '#888';


        ctx.fillRect(
            w - 230,
            padding + 32,
            12,
            12
        );


        ctx.fillStyle =
            '#333';


        ctx.fillText(
            'Reference Output',
            w - 210,
            padding + 42
        );
    }


    // ==================== ANIMATION LOOP ====================

    animate() {

        if (!this.isRunning) {

            return;
        }


        const currentTime =
            performance.now();


        const deltaTime =
            currentTime -
            this.lastTime;


        this.lastTime =
            currentTime;


        this.update(
            deltaTime
        );


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
            'Page loaded.'
        );


        window.solarSimulator =
            new SolarTrackingSimulator();

    }
);