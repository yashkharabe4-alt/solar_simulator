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


        // ==================== STATE ====================

        this.isRunning = false;

        this.simulationTime = 0;

        // 40-second simulation
        this.simulationDuration = 40;

        this.lastTime = performance.now();


        // ==================== PANEL ====================

        this.sunAngle = 0;

        // Only the panel rotates.
        // The pivot and support remain fixed.
        this.panelAngle = -15;


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
    }


    // ==================== START ====================

    startSimulation() {

        this.landingPage.classList.add("hidden");

        this.resultsPage.classList.add("hidden");

        this.simulationPage.classList.remove("hidden");


        this.isRunning = true;

        this.simulationTime = 0;

        this.sunAngle = 0;

        this.panelAngle = -15;


        this.trackingData = [];

        this.referenceData = [];


        this.lastTime = performance.now();


        this.animate();
    }


    // ==================== STOP ====================

    stopSimulation() {

        this.isRunning = false;


        this.simulationPage.classList.add("hidden");

        this.resultsPage.classList.add("hidden");

        this.landingPage.classList.remove("hidden");
    }


    // ==================== UPDATE ====================

    update(deltaTime) {

        if (!this.isRunning) {
            return;
        }


        this.simulationTime +=
            deltaTime / 1000;


        // ==================== END ====================

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


        // ==================== PROGRESS ====================

        const progress =
            this.simulationTime /
            this.simulationDuration;


        // ==================== SUN MOVEMENT ====================

        this.sunAngle =
            progress * 180;


        // ==================== PANEL TRACKING ====================

        /*
         * Visual representation of the panel
         * following the Sun.
         *
         * This is a conceptual simulation,
         * not a geographic solar-position model.
         */

        const targetPanelAngle =
            -55 +
            progress * 110;


        // Smooth mechanical movement

        const trackingSpeed = 0.055;


        this.panelAngle +=
            (
                targetPanelAngle -
                this.panelAngle
            ) *
            trackingSpeed;


        // ==================== ALIGNMENT ====================

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


        // ==================== REFERENCE OUTPUT ====================

        /*
         * Normalized output.
         *
         * We deliberately do NOT use
         * unrealistic values such as 1000 W.
         */

        const referenceOutput =
            70 +
            30 *
            Math.sin(
                progress * Math.PI
            );


        // ==================== DUAL-AXIS OUTPUT ====================

        /*
         * Approximate 20–30% improvement.
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


        // ==================== SAVE DATA ====================

        this.referenceData.push({

            time: progress,

            power: referenceOutput

        });


        this.trackingData.push({

            time: progress,

            power: trackingOutput

        });


        // ==================== UPDATE UI ====================

        document.getElementById(
            "sunAngle"
        ).textContent =
            Math.round(
                this.sunAngle
            ) + "°";


        document.getElementById(
            "panelAngle"
        ).textContent =
            Math.round(
                this.panelAngle
            ) + "°";


        document.getElementById(
            "alignment"
        ).textContent =
            "≈ " +
            Math.round(
                alignment
            ) + "°";


        document.getElementById(
            "powerOutput"
        ).textContent =
            Math.round(
                (
                    trackingOutput /
                    referenceOutput
                ) * 100
            ) + "%";


        // ==================== PROGRESS BAR ====================

        const progressBar =
            document.getElementById(
                "progressBar"
            );

        const progressText =
            document.getElementById(
                "progressText"
            );


        progressBar.style.width =
            (
                progress * 100
            ) + "%";


        progressText.textContent =
            Math.round(
                progress * 100
            ) + "%";
    }


    // ==================== RENDER ====================

    render() {

        const ctx =
            this.ctx;

        const w =
            this.canvas.width;

        const h =
            this.canvas.height;


        // ==================== SKY ====================

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


        // ==================== SUN ====================

        const progress =
            this.sunAngle /
            180;


        const sunX =
            w *
            (
                0.16 +
                progress * 0.68
            );


        const sunY =
            h *
            0.20 +
            Math.sin(
                progress * Math.PI
            ) *
            h *
            0.15;


        this.drawSun(
            sunX,
            sunY
        );


        // ==================== FIXED PIVOT ====================

        /*
         * IMPORTANT:
         *
         * This coordinate NEVER changes.
         *
         * It represents the fixed mechanical
         * pivot of the solar tracker.
         */

        const pivotX =
            w * 0.50;

        const pivotY =
            h * 0.67;


        // ==================== SUNLIGHT ====================

        this.drawSunRays(
            sunX,
            sunY,
            pivotX,
            pivotY
        );


        // ==================== FIXED SUPPORT ====================

        this.drawSupport(
            pivotX,
            pivotY
        );


        // ==================== ROTATING PANEL ====================

        this.drawPanel(
            pivotX,
            pivotY,
            this.panelAngle
        );


        // ==================== FIXED PIVOT ====================

        this.drawPivot(
            pivotX,
            pivotY
        );
    }


    // ==================== SUN ====================

    drawSun(
        x,
        y
    ) {

        const ctx =
            this.ctx;


        // Sun glow

        const glow =
            ctx.createRadialGradient(
                x,
                y,
                0,
                x,
                y,
                100
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
            x - 100,
            y - 100,
            200,
            200
        );


        // Sun

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


    // ==================== FIXED SUPPORT ====================

    drawSupport(
        x,
        y
    ) {

        const ctx =
            this.ctx;


        /*
         * NO rotation is applied here.
         *
         * Therefore the support and axis
         * remain perfectly stationary.
         */

        ctx.strokeStyle =
            "#2f404d";

        ctx.lineWidth = 12;

        ctx.lineCap = "round";


        // Vertical support

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


        // Fixed base

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


    // ==================== ROTATING PANEL ====================

    drawPanel(
        pivotX,
        pivotY,
        angle
    ) {

        const ctx =
            this.ctx;


        const panelWidth = 270;

        const panelHeight = 150;


        /*
         * ONLY the panel is rotated.
         *
         * The support is NOT inside this
         * rotated drawing context.
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


        // ==================== PANEL BODY ====================

        ctx.fillStyle =
            "#2f76b5";


        ctx.fillRect(
            -panelWidth / 2,
            -panelHeight,
            panelWidth,
            panelHeight
        );


        // ==================== PANEL BORDER ====================

        ctx.strokeStyle =
            "#173b5a";

        ctx.lineWidth = 6;


        ctx.strokeRect(
            -panelWidth / 2,
            -panelHeight,
            panelWidth,
            panelHeight
        );


        // ==================== SOLAR CELL GRID ====================

        ctx.strokeStyle =
            "rgba(255,255,255,0.42)";

        ctx.lineWidth = 1;


        // Vertical cell lines

        for (
            let i = 1;
            i < 6;
            i++
        ) {

            const cellX =
                -panelWidth / 2 +
                (
                    panelWidth / 6
                ) * i;


            ctx.beginPath();


            ctx.moveTo(
                cellX,
                -panelHeight
            );


            ctx.lineTo(
                cellX,
                0
            );


            ctx.stroke();
        }


        // Horizontal cell lines

        for (
            let i = 1;
            i < 3;
            i++
        ) {

            const cellY =
                -panelHeight +
                (
                    panelHeight / 3
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


    // ==================== FIXED PIVOT ====================

    drawPivot(
        x,
        y
    ) {

        const ctx =
            this.ctx;


        /*
         * Mechanical rotation point.
         *
         * This remains fixed while the
         * panel rotates around it.
         */

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


    // ==================== SUN RAYS ====================

    drawSunRays(
        sunX,
        sunY,
        pivotX,
        pivotY
    ) {

        const ctx =
            this.ctx;


        const rayCount = 5;


        for (
            let i = 0;
            i < rayCount;
            i++
        ) {

            const offset =
                (
                    i - 2
                ) * 20;


            ctx.strokeStyle =
                "rgba(255,184,0,0.55)";

            ctx.lineWidth = 3;

            ctx.lineCap = "round";


            ctx.beginPath();


            ctx.moveTo(
                sunX,
                sunY
            );


            ctx.lineTo(
                pivotX + offset,
                pivotY - 25
            );


            ctx.stroke();
        }
    }


    // ==================== RESULTS ====================

    showResults() {

        this.simulationPage.classList.add(
            "hidden"
        );

        this.resultsPage.classList.remove(
            "hidden"
        );


        this.displayResults();
    }


    // ==================== RESULTS DATA ====================

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


        document.getElementById(
            "trackingAvg"
        ).textContent =
            Math.round(
                trackingAverage
            ) + "%";


        document.getElementById(
            "fixedAvg"
        ).textContent =
            Math.round(
                referenceAverage
            ) + "%";


        document.getElementById(
            "improvement"
        ).textContent =
            "+" +
            Math.round(
                improvement
            ) + "%";


        this.drawGraph();
    }


    // ==================== GRAPH ====================

    drawGraph() {

        const canvas =
            document.getElementById(
                "comparisonGraph"
            );

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


        // ==================== GRID ====================

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


        // ==================== GRAPH LINES ====================

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


    // ==================== GRAPH LINE ====================

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


    // ==================== ANIMATION ====================

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
    "DOMContentLoaded",
    () => {

        window.solarSimulator =
            new SolarTrackingSimulator();

    }
);