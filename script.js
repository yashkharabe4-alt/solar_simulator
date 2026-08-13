// ==================== SOLAR TRACKING SIMULATOR ====================

class SolarTrackingSimulator {

    constructor() {

        // ==================== ELEMENTS ====================

        this.landingPage =
            document.getElementById("landingPage");

        this.simulationPage =
            document.getElementById("simulationPage");

        this.resultsPage =
            document.getElementById("resultsPage");

        this.startBtn =
            document.getElementById("startBtn");

        this.stopBtn =
            document.getElementById("stopBtn");

        this.restartBtn =
            document.getElementById("restartFromResults");

        this.canvas =
            document.getElementById("simulationCanvas");

        this.ctx =
            this.canvas.getContext("2d");


        // ==================== SIMULATION STATE ====================

        this.isRunning = false;

        this.simulationTime = 0;

        this.simulationDuration = 40;

        this.lastTime = performance.now();


        // ==================== SUN ====================

        this.sunAngle = 0;


        // ==================== PANEL ====================

        this.panelAngle = -20;


        /*
         * User-controlled tracking speed.
         *
         * 1x = normal
         * 2x = faster
         * 3x = very fast
         * 4x = aggressive
         * 5x = maximum
         */

        this.rotationSpeeds = [
            1,
            2,
            3,
            4,
            5
        ];

        this.rotationSpeedIndex = 0;

        this.rotationSpeed =
            this.rotationSpeeds[
                this.rotationSpeedIndex
            ];


        // ==================== DATA ====================

        this.trackingData = [];

        this.referenceData = [];


        // ==================== EVENTS ====================

        this.startBtn.addEventListener(
            "click",
            () => this.startSimulation()
        );

        this.stopBtn.addEventListener(
            "click",
            () => this.stopSimulation()
        );

        this.restartBtn.addEventListener(
            "click",
            () => this.startSimulation()
        );


        // Create speed button
        this.createSpeedButton();
    }


    // =========================================================
    // SPEED BUTTON
    // =========================================================

    createSpeedButton() {

        const controlBar =
            document.querySelector(".control-bar");


        if (!controlBar) {
            return;
        }


        const speedButton =
            document.createElement("button");


        speedButton.id =
            "rotationSpeedBtn";


        speedButton.className =
            "btn-control";


        speedButton.textContent =
            "🔄 Rotation Speed: 1×";


        speedButton.addEventListener(
            "click",
            () => {

                this.rotationSpeedIndex++;

                if (
                    this.rotationSpeedIndex >=
                    this.rotationSpeeds.length
                ) {

                    this.rotationSpeedIndex = 0;
                }


                this.rotationSpeed =
                    this.rotationSpeeds[
                        this.rotationSpeedIndex
                    ];


                speedButton.textContent =
                    "🔄 Rotation Speed: " +
                    this.rotationSpeed +
                    "×";
            }
        );


        controlBar.appendChild(
            speedButton
        );
    }


    // =========================================================
    // START
    // =========================================================

    startSimulation() {

        this.landingPage.classList.add(
            "hidden"
        );

        this.resultsPage.classList.add(
            "hidden"
        );

        this.simulationPage.classList.remove(
            "hidden"
        );


        this.isRunning = true;

        this.simulationTime = 0;

        this.sunAngle = 0;

        this.panelAngle = -20;


        this.trackingData = [];

        this.referenceData = [];


        this.lastTime =
            performance.now();


        this.animate();
    }


    // =========================================================
    // STOP
    // =========================================================

    stopSimulation() {

        this.isRunning = false;


        this.simulationPage.classList.add(
            "hidden"
        );

        this.resultsPage.classList.add(
            "hidden"
        );

        this.landingPage.classList.remove(
            "hidden"
        );
    }


    // =========================================================
    // UPDATE
    // =========================================================

    update(deltaTime) {

        if (!this.isRunning) {
            return;
        }


        // Simulation time

        this.simulationTime +=
            deltaTime / 1000;


        // =====================================================
        // END OF SIMULATION
        // =====================================================

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


        // =====================================================
        // SIMULATION PROGRESS
        // =====================================================

        const progress =
            this.simulationTime /
            this.simulationDuration;


        // =====================================================
        // SUN ANGLE
        // =====================================================

        this.sunAngle =
            progress * 180;


        // =====================================================
        // FIXED PANEL PIVOT
        // =====================================================

        const canvasWidth =
            this.canvas.width;

        const canvasHeight =
            this.canvas.height;


        const pivotX =
            canvasWidth * 0.50;

        const pivotY =
            canvasHeight * 0.67;


        // =====================================================
        // SUN POSITION
        // =====================================================

        /*
         * IMPORTANT:
         *
         * The Sun now follows a clean arc across
         * the upper portion of the sky.
         *
         * It does NOT move toward the panel.
         */

        const sunX =
            canvasWidth *
            (
                0.10 +
                progress * 0.80
            );


        /*
         * At sunrise and sunset:
         *
         *     y ≈ 0.24h
         *
         * At midday:
         *
         *     y ≈ 0.13h
         *
         * Smaller Y = higher in the sky.
         */

        const sunY =
            canvasHeight *
            (
                0.24 -
                Math.sin(
                    progress * Math.PI
                ) * 0.11
            );


        // =====================================================
        // SUN → PANEL VECTOR
        // =====================================================

        const dx =
            sunX - pivotX;

        const dy =
            sunY - pivotY;


        // =====================================================
        // TARGET PANEL ANGLE
        // =====================================================

        /*
         * Calculate the orientation required
         * for the panel to face the Sun.
         */

        let targetPanelAngle =
            Math.atan2(
                dx,
                -dy
            ) *
            180 /
            Math.PI;


        // Mechanical limits

        targetPanelAngle =
            Math.max(
                -65,
                Math.min(
                    65,
                    targetPanelAngle
                )
            );


        // =====================================================
        // PANEL TRACKING
        // =====================================================

        /*
         * Base tracking response.
         *
         * The button multiplies this value.
         */

        const baseTrackingSpeed =
            0.045;


        const trackingSpeed =
            baseTrackingSpeed *
            this.rotationSpeed;


        /*
         * Prevent the interpolation factor
         * from becoming unstable at high speeds.
         */

        const limitedTrackingSpeed =
            Math.min(
                trackingSpeed,
                0.35
            );


        this.panelAngle +=
            (
                targetPanelAngle -
                this.panelAngle
            ) *
            limitedTrackingSpeed;


        // =====================================================
        // ALIGNMENT
        // =====================================================

        const trackingError =
            Math.abs(
                targetPanelAngle -
                this.panelAngle
            );


        let alignment =
            90 -
            trackingError;


        alignment =
            Math.max(
                0,
                Math.min(
                    90,
                    alignment
                )
            );


        // =====================================================
        // REFERENCE OUTPUT
        // =====================================================

        /*
         * Normalized conceptual generation.
         *
         * This avoids unrealistic 1000 W values.
         */

        const referenceOutput =
            70 +
            30 *
            Math.sin(
                progress * Math.PI
            );


        // =====================================================
        // DUAL-AXIS IMPROVEMENT
        // =====================================================

        /*
         * Expected improvement remains around
         * 20–30%.
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


        // =====================================================
        // SAVE DATA
        // =====================================================

        this.referenceData.push({

            time: progress,

            power: referenceOutput
        });


        this.trackingData.push({

            time: progress,

            power: trackingOutput
        });


        // =====================================================
        // UPDATE UI
        // =====================================================

        const sunAngleElement =
            document.getElementById(
                "sunAngle"
            );


        const panelAngleElement =
            document.getElementById(
                "panelAngle"
            );


        const alignmentElement =
            document.getElementById(
                "alignment"
            );


        const powerOutputElement =
            document.getElementById(
                "powerOutput"
            );


        if (sunAngleElement) {

            sunAngleElement.textContent =
                Math.round(
                    this.sunAngle
                ) + "°";
        }


        if (panelAngleElement) {

            panelAngleElement.textContent =
                Math.round(
                    this.panelAngle
                ) + "°";
        }


        if (alignmentElement) {

            alignmentElement.textContent =
                "≈ " +
                Math.round(
                    alignment
                ) + "°";
        }


        if (powerOutputElement) {

            powerOutputElement.textContent =
                Math.round(
                    (
                        trackingOutput /
                        referenceOutput
                    ) * 100
                ) + "%";
        }


        // =====================================================
        // PROGRESS
        // =====================================================

        const progressBar =
            document.getElementById(
                "progressBar"
            );


        const progressText =
            document.getElementById(
                "progressText"
            );


        if (progressBar) {

            progressBar.style.width =
                (
                    progress * 100
                ) + "%";
        }


        if (progressText) {

            progressText.textContent =
                Math.round(
                    progress * 100
                ) + "%";
        }
    }


    // =========================================================
    // RENDER
    // =========================================================

    render() {

        const ctx =
            this.ctx;


        const w =
            this.canvas.width;


        const h =
            this.canvas.height;


        // =====================================================
        // SKY
        // =====================================================

        const sky =
            ctx.createLinearGradient(
                0,
                0,
                0,
                h
            );


        sky.addColorStop(
            0,
            "#b9e5f5"
        );


        sky.addColorStop(
            1,
            "#f5fbfe"
        );


        ctx.fillStyle =
            sky;


        ctx.fillRect(
            0,
            0,
            w,
            h
        );


        // =====================================================
        // SUN
        // =====================================================

        const progress =
            this.sunAngle /
            180;


        const sunX =
            w *
            (
                0.10 +
                progress * 0.80
            );


        const sunY =
            h *
            (
                0.24 -
                Math.sin(
                    progress * Math.PI
                ) * 0.11
            );


        this.drawSun(
            sunX,
            sunY
        );


        // =====================================================
        // FIXED PIVOT
        // =====================================================

        const pivotX =
            w * 0.50;


        const pivotY =
            h * 0.67;


        // =====================================================
        // SUNLIGHT
        // =====================================================

        this.drawSunRays(
            sunX,
            sunY,
            pivotX,
            pivotY
        );


        // =====================================================
        // FIXED SUPPORT
        // =====================================================

        this.drawSupport(
            pivotX,
            pivotY
        );


        // =====================================================
        // ROTATING PANEL
        // =====================================================

        this.drawPanel(
            pivotX,
            pivotY,
            this.panelAngle
        );


        // =====================================================
        // FIXED PIVOT
        // =====================================================

        this.drawPivot(
            pivotX,
            pivotY
        );
    }


    // =========================================================
    // SUN
    // =========================================================

    drawSun(
        x,
        y
    ) {

        const ctx =
            this.ctx;


        // Glow

        const glow =
            ctx.createRadialGradient(
                x,
                y,
                0,
                x,
                y,
                110
            );


        glow.addColorStop(
            0,
            "rgba(255,210,40,0.45)"
        );


        glow.addColorStop(
            1,
            "rgba(255,210,40,0)"
        );


        ctx.fillStyle =
            glow;


        ctx.fillRect(
            x - 110,
            y - 110,
            220,
            220
        );


        // Sun body

        ctx.fillStyle =
            "#FFD43B";


        ctx.beginPath();


        ctx.arc(
            x,
            y,
            40,
            0,
            Math.PI * 2
        );


        ctx.fill();


        ctx.strokeStyle =
            "#F5A400";


        ctx.lineWidth = 3;


        ctx.stroke();
    }


    // =========================================================
    // FIXED SUPPORT
    // =========================================================

    drawSupport(
        x,
        y
    ) {

        const ctx =
            this.ctx;


        /*
         * This axis NEVER rotates.
         */

        ctx.strokeStyle =
            "#2f404d";


        ctx.lineWidth = 12;


        ctx.lineCap =
            "round";


        // Vertical axis

        ctx.beginPath();


        ctx.moveTo(
            x,
            y
        );


        ctx.lineTo(
            x,
            y + 120
        );


        ctx.stroke();


        // Base

        ctx.lineWidth = 14;


        ctx.beginPath();


        ctx.moveTo(
            x - 70,
            y + 120
        );


        ctx.lineTo(
            x + 70,
            y + 120
        );


        ctx.stroke();
    }


    // =========================================================
    // SOLAR PANEL
    // =========================================================

    drawPanel(
        pivotX,
        pivotY,
        angle
    ) {

        const ctx =
            this.ctx;


        const panelWidth = 340;

        const panelHeight = 165;


        /*
         * ONLY this assembly rotates.
         *
         * The support remains outside
         * this rotated canvas context.
         */

        ctx.save();


        ctx.translate(
            pivotX,
            pivotY
        );


        ctx.rotate(
            angle *
            Math.PI /
            180
        );


        // =====================================================
        // MOUNTING ARM
        // =====================================================

        ctx.strokeStyle =
            "#34495e";


        ctx.lineWidth = 12;


        ctx.lineCap =
            "round";


        ctx.beginPath();


        ctx.moveTo(
            0,
            0
        );


        ctx.lineTo(
            0,
            -panelHeight / 2
        );


        ctx.stroke();


        // =====================================================
        // PANEL BODY
        // =====================================================

        ctx.fillStyle =
            "#286da8";


        ctx.fillRect(
            -panelWidth / 2,
            -panelHeight / 2,
            panelWidth,
            panelHeight
        );


        // =====================================================
        // PANEL BORDER
        // =====================================================

        ctx.strokeStyle =
            "#173b5a";


        ctx.lineWidth = 6;


        ctx.strokeRect(
            -panelWidth / 2,
            -panelHeight / 2,
            panelWidth,
            panelHeight
        );


        // =====================================================
        // SOLAR CELLS
        // =====================================================

        ctx.strokeStyle =
            "rgba(255,255,255,0.38)";


        ctx.lineWidth = 1.2;


        // Vertical cells

        const columns = 6;


        for (
            let i = 1;
            i < columns;
            i++
        ) {

            const cellX =
                -panelWidth / 2 +
                (
                    panelWidth /
                    columns
                ) * i;


            ctx.beginPath();


            ctx.moveTo(
                cellX,
                -panelHeight / 2
            );


            ctx.lineTo(
                cellX,
                panelHeight / 2
            );


            ctx.stroke();
        }


        // Horizontal cells

        const rows = 3;


        for (
            let i = 1;
            i < rows;
            i++
        ) {

            const cellY =
                -panelHeight / 2 +
                (
                    panelHeight /
                    rows
                ) * i;


            ctx.beginPath();


            ctx.moveTo(
                -panelWidth / 2,
                cellY
            );


            ctx.lineTo(
                panelWidth / 2,
                cellY
            );


            ctx.stroke();
        }


        ctx.restore();
    }


    // =========================================================
    // FIXED PIVOT
    // =========================================================

    drawPivot(
        x,
        y
    ) {

        const ctx =
            this.ctx;


        ctx.fillStyle =
            "#263746";


        ctx.beginPath();


        ctx.arc(
            x,
            y,
            15,
            0,
            Math.PI * 2
        );


        ctx.fill();


        ctx.fillStyle =
            "#9aa8b1";


        ctx.beginPath();


        ctx.arc(
            x,
            y,
            6,
            0,
            Math.PI * 2
        );


        ctx.fill();
    }


    // =========================================================
    // SUN RAYS
    // =========================================================

    drawSunRays(
        sunX,
        sunY,
        pivotX,
        pivotY
    ) {

        const ctx =
            this.ctx;


        const dx =
            pivotX - sunX;


        const dy =
            pivotY - sunY;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        // Perpendicular direction

        const px =
            -dy / distance;


        const py =
            dx / distance;


        // =====================================================
        // SOFT SUNLIGHT BEAM
        // =====================================================

        const beamWidth = 75;


        const gradient =
            ctx.createLinearGradient(
                sunX,
                sunY,
                pivotX,
                pivotY
            );


        gradient.addColorStop(
            0,
            "rgba(255,204,40,0.18)"
        );


        gradient.addColorStop(
            0.6,
            "rgba(255,204,40,0.09)"
        );


        gradient.addColorStop(
            1,
            "rgba(255,204,40,0.015)"
        );


        ctx.fillStyle =
            gradient;


        ctx.beginPath();


        ctx.moveTo(
            sunX + px * 8,
            sunY + py * 8
        );


        ctx.lineTo(
            sunX - px * 8,
            sunY - py * 8
        );


        ctx.lineTo(
            pivotX -
            px * beamWidth,
            pivotY -
            py * beamWidth
        );


        ctx.lineTo(
            pivotX +
            px * beamWidth,
            pivotY +
            py * beamWidth
        );


        ctx.closePath();


        ctx.fill();


        // =====================================================
        // LIGHT RAYS
        // =====================================================

        const rayCount = 7;


        for (
            let i = 0;
            i < rayCount;
            i++
        ) {

            const offset =
                (
                    i -
                    (rayCount - 1) / 2
                ) * 18;


            ctx.strokeStyle =
                "rgba(255,190,20,0.30)";


            ctx.lineWidth = 2;


            ctx.lineCap =
                "round";


            ctx.beginPath();


            ctx.moveTo(
                sunX +
                px *
                offset *
                0.1,

                sunY +
                py *
                offset *
                0.1
            );


            ctx.lineTo(
                pivotX +
                px * offset,

                pivotY +
                py * offset
            );


            ctx.stroke();
        }
    }


    // =========================================================
    // RESULTS
    // =========================================================

    showResults() {

        this.simulationPage.classList.add(
            "hidden"
        );


        this.resultsPage.classList.remove(
            "hidden"
        );


        this.displayResults();
    }


    // =========================================================
    // RESULTS DATA
    // =========================================================

    displayResults() {

        const trackingAverage =
            this.trackingData.reduce(
                (
                    total,
                    item
                ) =>
                    total + item.power,
                0
            ) /
            this.trackingData.length;


        const referenceAverage =
            this.referenceData.reduce(
                (
                    total,
                    item
                ) =>
                    total + item.power,
                0
            ) /
            this.referenceData.length;


        const improvement =
            (
                (
                    trackingAverage -
                    referenceAverage
                ) /
                referenceAverage
            ) * 100;


        const trackingElement =
            document.getElementById(
                "trackingAvg"
            );


        const referenceElement =
            document.getElementById(
                "fixedAvg"
            );


        const improvementElement =
            document.getElementById(
                "improvement"
            );


        if (trackingElement) {

            trackingElement.textContent =
                Math.round(
                    trackingAverage
                ) + "%";
        }


        if (referenceElement) {

            referenceElement.textContent =
                Math.round(
                    referenceAverage
                ) + "%";
        }


        if (improvementElement) {

            improvementElement.textContent =
                "+" +
                Math.round(
                    improvement
                ) + "%";
        }


        this.drawGraph();
    }


    // =========================================================
    // GRAPH
    // =========================================================

    drawGraph() {

        const canvas =
            document.getElementById(
                "comparisonGraph"
            );


        if (!canvas) {
            return;
        }


        const ctx =
            canvas.getContext("2d");


        const w =
            canvas.width;


        const h =
            canvas.height;


        ctx.clearRect(
            0,
            0,
            w,
            h
        );


        const left = 70;

        const right = 35;

        const top = 30;

        const bottom = 50;


        const graphWidth =
            w -
            left -
            right;


        const graphHeight =
            h -
            top -
            bottom;


        const maxValue =
            Math.max(
                ...this.trackingData.map(
                    item => item.power
                ),

                ...this.referenceData.map(
                    item => item.power
                )
            );


        // =====================================================
        // GRID
        // =====================================================

        ctx.strokeStyle =
            "#e6ecef";


        ctx.lineWidth = 1;


        for (
            let i = 0;
            i <= 5;
            i++
        ) {

            const y =
                h -
                bottom -
                (
                    graphHeight *
                    i /
                    5
                );


            ctx.beginPath();


            ctx.moveTo(
                left,
                y
            );


            ctx.lineTo(
                w - right,
                y
            );


            ctx.stroke();


            ctx.fillStyle =
                "#77838b";


            ctx.font =
                "12px Arial";


            ctx.textAlign =
                "right";


            ctx.fillText(
                Math.round(
                    maxValue *
                    i /
                    5
                ) + "%",
                left - 8,
                y + 4
            );
        }


        // Tracking line

        this.drawGraphLine(
            ctx,
            this.trackingData,
            "#ff9f00",
            maxValue,
            left,
            top,
            graphWidth,
            graphHeight
        );


        // Reference line

        this.drawGraphLine(
            ctx,
            this.referenceData,
            "#8b9399",
            maxValue,
            left,
            top,
            graphWidth,
            graphHeight
        );
    }


    // =========================================================
    // GRAPH LINE
    // =========================================================

    drawGraphLine(
        ctx,
        data,
        color,
        maxValue,
        left,
        top,
        width,
        height
    ) {

        ctx.strokeStyle =
            color;


        ctx.lineWidth = 4;


        ctx.lineJoin =
            "round";


        ctx.beginPath();


        data.forEach(
            (
                item,
                index
            ) => {

                const x =
                    left +
                    item.time *
                    width;


                const y =
                    top +
                    height -
                    (
                        item.power /
                        maxValue
                    ) *
                    height;


                if (
                    index === 0
                ) {

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
    }


    // =========================================================
    // ANIMATION
    // =========================================================

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


// =============================================================
// INITIALIZATION
// =============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        window.solarSimulator =
            new SolarTrackingSimulator();

    }
);