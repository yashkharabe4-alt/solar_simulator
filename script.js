
class SolarPanelSimulation {
    constructor() {
        // Simulation state
        this.simulationTime = 6; // Hour (6 AM start)
        this.isAnimating = true;
        this.animationSpeed = 1; // Multiplier for time progression
        this.dayOfYear = this.getCurrentDayOfYear();
        
        // Location (Pune, India by default)
        this.latitude = 18.5204;
        this.longitude = 73.8567;
        
        // Panel configuration
        this.panelCount = 6;
        this.panelEfficiency = 0.20; // 20% baseline
        this.tiltAngle = 30; // degrees
        this.orientation = 180; // 0=North, 90=East, 180=South, 270=West
        
        // Solar data
        this.solarAltitude = 0;
        this.solarAzimuth = 0;
        this.solarRadiation = 0; // W/m²
        this.incidentAngle = 0;
        
        // Performance metrics
        this.powerOutput = 0; // kW
        this.dailyEnergy = 0; // kWh
        this.energyHistory = [];
        this.timeHistory = [];
        
        // Panel specifications
        this.panelAreaPerUnit = 2.0; // m² per panel
        this.nominalPower = 400; // W per panel at STC
        
        // Initialize canvas
        this.skyCanvas = document.getElementById('skyCanvas');
        this.skyCtx = this.skyCanvas.getContext('2d');
        this.panelsCanvas = document.getElementById('panelsCanvas');
        this.panelsCtx = this.panelsCanvas.getContext('2d');
        this.energyChart = document.getElementById('energyChart');
        this.energyCtx = this.energyChart.getContext('2d');
        
        // Initialize data for 24-hour profile
        this.initializeDailyProfile();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start animation loop
        this.lastFrameTime = Date.now();
        this.animate();
    }
    
    // ==================== INITIALIZATION ====================
    
    setupEventListeners() {
        document.getElementById('latitude').addEventListener('change', (e) => {
            this.latitude = parseFloat(e.target.value);
            this.initializeDailyProfile();
        });
        
        document.getElementById('longitude').addEventListener('change', (e) => {
            this.longitude = parseFloat(e.target.value);
        });
        
        document.getElementById('panelCount').addEventListener('change', (e) => {
            this.panelCount = parseInt(e.target.value);
        });
        
        document.getElementById('panelEfficiency').addEventListener('input', (e) => {
            this.panelEfficiency = parseFloat(e.target.value);
            document.getElementById('efficiencyDisplay').textContent = 
                Math.round(this.panelEfficiency * 100) + '%';
        });
        
        document.getElementById('tiltAngle').addEventListener('input', (e) => {
            this.tiltAngle = parseInt(e.target.value);
            document.getElementById('tiltDisplay').textContent = e.target.value + '°';
        });
        
        document.getElementById('orientation').addEventListener('input', (e) => {
            this.orientation = parseInt(e.target.value);
            const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            const index = Math.round(this.orientation / 45) % 8;
            document.getElementById('orientationDisplay').textContent = 
                e.target.value + '° (' + directions[index] + ')';
        });
        
        document.getElementById('toggleAnimation').addEventListener('click', () => {
            this.isAnimating = !this.isAnimating;
            document.getElementById('toggleAnimation').textContent = 
                this.isAnimating ? '⏸ Pause Simulation' : '▶ Resume Simulation';
        });
        
        document.getElementById('resetButton').addEventListener('click', () => {
            this.simulationTime = 6;
            this.dailyEnergy = 0;
            this.energyHistory = [];
            this.timeHistory = [];
            this.initializeDailyProfile();
        });
        
        document.getElementById('speedControl').addEventListener('input', (e) => {
            this.animationSpeed = parseFloat(e.target.value);
            document.getElementById('speedDisplay').textContent = e.target.value + 'x';
        });
    }
    
    initializeDailyProfile() {
        // Pre-calculate solar radiation for entire day for energy chart
        this.dailyProfile = [];
        for (let hour = 0; hour < 24; hour++) {
            const altitude = this.calculateSolarAltitude(this.latitude, this.longitude, hour, this.dayOfYear);
            let radiation = 0;
            
            if (altitude > 0) {
                // Clear day model with atmospheric attenuation
                const zenithAngle = 90 - altitude;
                const airMass = 1 / (Math.cos(this.degreesToRadians(zenithAngle)) + 0.50572 * Math.pow(96.07995 - zenithAngle, -1.6364));
                const directNormal = 910 * Math.pow(0.7, Math.pow(airMass, 0.678));
                const diffuseHorizontal = 100; // Approximate diffuse component
                radiation = directNormal * Math.cos(this.degreesToRadians(zenithAngle)) + diffuseHorizontal;
                radiation = Math.max(0, radiation);
            }
            
            const incidentAngle = this.calculateIncidentAngle(altitude, this.solarAzimuth, this.tiltAngle, this.orientation);
            const adjustedRadiation = radiation * Math.cos(this.degreesToRadians(Math.max(0, incidentAngle)));
            const panelOutput = (adjustedRadiation / 1000) * this.panelAreaPerUnit * this.panelCount * this.panelEfficiency;
            
            this.dailyProfile.push({
                hour: hour,
                radiation: Math.max(0, adjustedRadiation),
                power: Math.max(0, panelOutput)
            });
        }
    }
    
    // ==================== SOLAR CALCULATIONS ====================
    
    calculateSolarAltitude(latitude, longitude, hour, dayOfYear) {
        const lat = this.degreesToRadians(latitude);
        
        // Calculate declination
        const declination = 23.44 * Math.sin(this.degreesToRadians(360 * (dayOfYear - 81) / 365));
        const dec = this.degreesToRadians(declination);
        
        // Calculate hour angle
        const hourAngle = (hour - 12) * 15;
        const h = this.degreesToRadians(hourAngle);
        
        // Calculate altitude
        const altitude = Math.asin(Math.sin(lat) * Math.sin(dec) + 
                                   Math.cos(lat) * Math.cos(dec) * Math.cos(h));
        
        return this.radiansToDegrees(altitude);
    }
    
    calculateSolarAzimuth(latitude, longitude, hour, dayOfYear) {
        const lat = this.degreesToRadians(latitude);
        const declination = 23.44 * Math.sin(this.degreesToRadians(360 * (dayOfYear - 81) / 365));
        const dec = this.degreesToRadians(declination);
        
        const hourAngle = (hour - 12) * 15;
        const h = this.degreesToRadians(hourAngle);
        
        const altitude = this.calculateSolarAltitude(latitude, longitude, hour, dayOfYear);
        const altRad = this.degreesToRadians(altitude);
        
        // Calculate azimuth (0° = North, 180° = South)
        let azimuth = Math.atan2(Math.sin(h), 
                                 Math.cos(h) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat));
        azimuth = this.radiansToDegrees(azimuth) + 180;
        
        return (azimuth + 360) % 360;
    }
    
    calculateIncidentAngle(altitude, azimuth, tilt, orientation) {
        const altRad = this.degreesToRadians(altitude);
        const azRad = this.degreesToRadians(azimuth);
        const tiltRad = this.degreesToRadians(tilt);
        const orientRad = this.degreesToRadians(orientation);
        
        const incidentAngle = Math.acos(
            Math.sin(altRad) * Math.cos(tiltRad) +
            Math.cos(altRad) * Math.sin(tiltRad) * Math.cos(azRad - orientRad)
        );
        
        return this.radiansToDegrees(incidentAngle);
    }
    
    calculateSolarRadiation(altitude, declination, dayOfYear) {
        // Clear day model (simplified)
        if (altitude <= 0) return 0;
        
        const zenithAngle = 90 - altitude;
        const zenithRad = this.degreesToRadians(zenithAngle);
        
        // Air mass calculation
        const airMass = 1 / (Math.cos(zenithRad) + 0.50572 * Math.pow(96.07995 - zenithAngle, -1.6364));
        
        // Extraterrestrial solar radiation (approximately constant)
        const gsc = 1367; // W/m² at Earth's mean distance from sun
        
        // Calculate declination
        const decl = this.degreesToRadians(23.44 * Math.sin(this.degreesToRadians(360 * (dayOfYear - 81) / 365)));
        
        // Earth-sun distance correction
        const beta = 360 * (dayOfYear - 1) / 365;
        const distance = 1.00011 + 0.034221 * Math.cos(this.degreesToRadians(beta)) + 
                        0.00128 * Math.sin(this.degreesToRadians(beta)) + 
                        0.000719 * Math.cos(this.degreesToRadians(2 * beta)) + 
                        0.000077 * Math.sin(this.degreesToRadians(2 * beta));
        
        // Direct normal irradiance
        const dni = 910 * Math.pow(0.7, Math.pow(airMass, 0.678));
        
        // Global horizontal irradiance
        const ghi = Math.max(0, ni * Math.cos(zenithRad)) + 100;
        
        return ghi;
    }
    
    // ==================== ENERGY CALCULATIONS ====================
    
    calculatePowerOutput() {
        if (this.solarAltitude <= 0) {
            this.powerOutput = 0;
            this.incidentAngle = 180;
            return;
        }
        
        // Incident angle on tilted surface
        this.incidentAngle = this.calculateIncidentAngle(
            this.solarAltitude,
            this.solarAzimuth,
            this.tiltAngle,
            this.orientation
        );
        
        if (this.incidentAngle > 90) {
            this.powerOutput = 0;
            return;
        }
        
        // Cosine factor
        const cosineFactor = Math.cos(this.degreesToRadians(this.incidentAngle));
        
        // Effective radiation on panel
        const effectiveRadiation = this.solarRadiation * cosineFactor;
        
        // Temperature coefficient (reduce efficiency in heat)
        const tempCoefficient = 0.998; // 0.2% loss per °C above STC (assume 25°C ambient)
        
        // Power output calculation
        const totalPanelArea = this.panelCount * this.panelAreaPerUnit;
        this.powerOutput = (effectiveRadiation / 1000) * totalPanelArea * this.panelEfficiency * tempCoefficient;
        this.powerOutput = Math.max(0, this.powerOutput);
    }
    
    updateDailyEnergy() {
        // Accumulate energy (assuming 1-minute intervals in simulation)
        const timeIncrement = (this.animationSpeed * 5) / 60; // Convert to hours
        this.dailyEnergy += (this.powerOutput * timeIncrement);
    }
    
    // ==================== UTILITY FUNCTIONS ====================
    
    degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    radiansToDegrees(radians) {
        return radians * (180 / Math.PI);
    }
    
    getCurrentDayOfYear() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }
    
    getTimeString(hours) {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }
    
    // ==================== UPDATE FUNCTION ====================
    
    update() {
        // Update simulation time
        if (this.isAnimating) {
            this.simulationTime += (this.animationSpeed * 5) / 3600; // Advance by 5ms worth of simulation time
            if (this.simulationTime >= 24) {
                this.simulationTime = 0;
            }
        }
        
        // Calculate solar position
        this.solarAltitude = this.calculateSolarAltitude(
            this.latitude,
            this.longitude,
            this.simulationTime,
            this.dayOfYear
        );
        
        this.solarAzimuth = this.calculateSolarAzimuth(
            this.latitude,
            this.longitude,
            this.simulationTime,
            this.dayOfYear
        );
        
        // Calculate solar radiation (clear day model)
        if (this.solarAltitude > 0) {
            const zenithAngle = 90 - this.solarAltitude;
            const airMass = 1 / (Math.cos(this.degreesToRadians(zenithAngle)) + 
                                0.50572 * Math.pow(96.07995 - zenithAngle, -1.6364));
            const directNormal = 910 * Math.pow(0.7, Math.pow(airMass, 0.678));
            this.solarRadiation = Math.max(0, directNormal * Math.cos(this.degreesToRadians(zenithAngle)) + 100);
        } else {
            this.solarRadiation = 0;
        }
        
        // Calculate power output
        this.calculatePowerOutput();
        
        // Update daily energy
        this.updateDailyEnergy();
        
        // Store history for chart
        this.energyHistory.push(this.powerOutput);
        this.timeHistory.push(this.simulationTime);
        
        // Keep only last 2 hours of history for detailed chart
        if (this.energyHistory.length > 120) {
            this.energyHistory.shift();
            this.timeHistory.shift();
        }
        
        // Update UI
        this.updateStats();
    }
    
    updateStats() {
        document.getElementById('altitudeValue').textContent = Math.max(0, this.solarAltitude).toFixed(1) + '°';
        document.getElementById('azimuthValue').textContent = this.solarAzimuth.toFixed(1) + '°';
        document.getElementById('radiationValue').textContent = this.solarRadiation.toFixed(0);
        document.getElementById('incidentAngleValue').textContent = this.incidentAngle.toFixed(1) + '°';
        document.getElementById('powerOutput').textContent = (this.powerOutput / 1000).toFixed(2);
        document.getElementById('dailyEnergy').textContent = (this.dailyEnergy / 1000).toFixed(1);
        document.getElementById('currentTime').textContent = this.getTimeString(this.simulationTime);
        
        // Effective efficiency (ratio of actual to theoretical max)
        const theoreticalMax = this.solarRadiation > 0 ? 
            (this.solarRadiation / 1000) * this.panelCount * this.panelAreaPerUnit : 0;
        const effectiveEff = theoreticalMax > 0 ? 
            ((this.powerOutput / theoreticalMax) * 100) : 0;
        document.getElementById('effectiveEfficiency').textContent = 
            Math.min(100, effectiveEff).toFixed(0) + '%';
    }
    
    // ==================== RENDERING ====================
    
    render() {
        this.renderSkyView();
        this.renderPanelView();
        this.renderEnergyChart();
    }
    
    renderSkyView() {
        const canvas = this.skyCanvas;
        const ctx = this.skyCtx;
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;
        
        // Clear canvas with sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Draw horizon line
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
        
        // Draw cardinal directions
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillText('N', centerX, centerY - radius - 20);
        ctx.fillText('S', centerX, centerY + radius + 20);
        ctx.fillText('E', centerX + radius + 20, centerY);
        ctx.fillText('W', centerX - radius - 20, centerY);
        
        // Draw altitude circles
        ctx.strokeStyle = '#CCC';
        ctx.lineWidth = 1;
        for (let alt = 15; alt <= 75; alt += 15) {
            const r = radius * (alt / 90);
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = '#999';
            ctx.font = '12px Arial';
            ctx.fillText(alt + '°', centerX + r + 5, centerY - 5);
        }
        
        // Draw sun if above horizon
        if (this.solarAltitude > 0) {
            // Calculate sun position on diagram
            const azimuthRad = this.degreesToRadians(this.solarAzimuth);
            const altitudeRad = this.degreesToRadians(Math.min(90, this.solarAltitude));
            const r = radius * (Math.min(90, this.solarAltitude) / 90);
            
            // Azimuth is from North, measured clockwise
            // Convert to standard math coordinates (counterclockwise from East)
            const mathAngle = Math.PI / 2 - azimuthRad;
            const sunX = centerX + r * Math.cos(mathAngle);
            const sunY = centerY - r * Math.sin(mathAngle);
            
            // Draw sun
            const sunRadius = 20;
            const sunGradient = ctx.createRadialGradient(sunX - 5, sunY - 5, 0, sunX, sunY, sunRadius);
            sunGradient.addColorStop(0, '#FFD700');
            sunGradient.addColorStop(1, '#FFA500');
            ctx.fillStyle = sunGradient;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw glow
            ctx.strokeStyle = 'rgba(255, 165, 0, 0.3)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunRadius + 10, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw radiation indicator
            ctx.fillStyle = `rgba(255, 165, 0, ${Math.min(1, this.solarRadiation / 1000)})`;
            const radiationRadius = 15 + (this.solarRadiation / 1000) * 20;
            ctx.beginPath();
            ctx.arc(sunX, sunY, radiationRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw solar path line for current latitude
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const sunrise = this.calculateSolarAltitude(this.latitude, this.longitude, 6, this.dayOfYear) > 0 ? 6 : 7;
        const sunset = this.calculateSolarAltitude(this.latitude, this.longitude, 18, this.dayOfYear) > 0 ? 18 : 17;
        
        for (let hour = sunrise; hour <= sunset; hour += 0.1) {
            const alt = this.calculateSolarAltitude(this.latitude, this.longitude, hour, this.dayOfYear);
            const azim = this.calculateSolarAzimuth(this.latitude, this.longitude, hour, this.dayOfYear);
            
            if (alt > 0) {
                const r = radius * (alt / 90);
                const mathAngle = Math.PI / 2 - this.degreesToRadians(azim);
                const x = centerX + r * Math.cos(mathAngle);
                const y = centerY - r * Math.sin(mathAngle);
                
                if (hour === Math.ceil(hour)) {
                    ctx.fillStyle = '#666';
                    ctx.font = '10px Arial';
                    ctx.fillText(hour.toFixed(0), x - 2, y - 8);
                }
                
                if (hour === sunrise) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
        }
        ctx.stroke();
    }
    
    renderPanelView() {
        const canvas = this.panelsCanvas;
        const ctx = this.panelsCtx;
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, width, height);
        
        // Draw ground
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, height * 0.6, width, height * 0.4);
        
        // Draw sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height * 0.6);
        
        // Draw sun in sky
        if (this.solarAltitude > 0) {
            const sunX = width * 0.25 + (this.solarAzimuth / 360) * width * 0.5;
            const sunY = height * 0.1 + (1 - this.solarAltitude / 90) * height * 0.4;
            
            const sunRadius = 25;
            const sunGradient = ctx.createRadialGradient(sunX - 8, sunY - 8, 0, sunX, sunY, sunRadius);
            sunGradient.addColorStop(0, '#FFD700');
            sunGradient.addColorStop(1, '#FFA500');
            ctx.fillStyle = sunGradient;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw panels
        const panelWidth = 120;
        const panelHeight = 60;
        const startX = (width - (this.panelCount * panelWidth + (this.panelCount - 1) * 10)) / 2;
        const panelY = height * 0.55;
        
        for (let i = 0; i < this.panelCount; i++) {
            const x = startX + i * (panelWidth + 10);
            const panelCenterX = x + panelWidth / 2;
            const panelCenterY = panelY + panelHeight / 2;
            
            // Save context for rotation
            ctx.save();
            ctx.translate(panelCenterX, panelCenterY);
            ctx.rotate(this.degreesToRadians(this.tiltAngle));
            
            // Draw panel
            const efficiency = Math.min(1, this.powerOutput / (this.panelCount * 1000));
            const brightness = 0.3 + efficiency * 0.7;
            ctx.fillStyle = `rgba(50, 50, 150, ${brightness})`;
            ctx.fillRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight);
            
            // Draw panel border
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.strokeRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight);
            
            // Draw cells
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    const cellX = -panelWidth / 2 + (col + 1) * panelWidth / 4;
                    const cellY = -panelHeight / 2 + (row + 1) * panelHeight / 4;
                    const cellSize = 10;
                    ctx.strokeRect(cellX - cellSize / 2, cellY - cellSize / 2, cellSize, cellSize);
                }
            }
            
            ctx.restore();
            
            // Draw output indicator
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText((this.powerOutput / this.panelCount / 1000).toFixed(2) + ' kW', 
                        x + panelWidth / 2, panelY + panelHeight + 20);
        }
        
        // Draw sun rays
        if (this.solarAltitude > 0) {
            ctx.strokeStyle = 'rgba(255, 200, 0, 0.3)';
            ctx.lineWidth = 2;
            
            for (let i = 0; i < this.panelCount; i++) {
                const panelX = startX + i * (panelWidth + 10) + panelWidth / 2;
                
                // Draw line from sun to panel
                const sunX = width * 0.25 + (this.solarAzimuth / 360) * width * 0.5;
                const sunY = height * 0.1 + (1 - this.solarAltitude / 90) * height * 0.4;
                
                ctx.beginPath();
                ctx.moveTo(sunX, sunY);
                ctx.lineTo(panelX, panelY);
                ctx.stroke();
            }
        }
        
        // Draw angle indicators
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Tilt: ${this.tiltAngle}°`, 10, 30);
        ctx.fillText(`Azimuth: ${this.orientation}°`, 10, 55);
        ctx.fillText(`Power: ${(this.powerOutput / 1000).toFixed(2)} kW`, 10, 80);
    }
    
    renderEnergyChart() {
        const canvas = this.energyChart;
        const ctx = this.energyCtx;
        const width = canvas.width;
        const height = canvas.height;
        const padding = 60;
        
        // Clear canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw 24-hour profile
        const graphWidth = width - 2 * padding;
        const graphHeight = height - 2 * padding;
        
        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(padding, padding);
        ctx.lineTo(width - padding, padding);
        ctx.stroke();
        
        // Draw grid and labels
        ctx.strokeStyle = '#EEE';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        // Hour labels and grid lines
        for (let hour = 0; hour <= 24; hour += 3) {
            const x = padding + (hour / 24) * graphWidth;
            ctx.beginPath();
            ctx.moveTo(x, height - padding);
            ctx.lineTo(x, padding);
            ctx.stroke();
            ctx.fillText(hour + ':00', x, height - padding + 20);
        }
        
        // Power output labels
        ctx.textAlign = 'right';
        const maxPower = Math.max(...this.dailyProfile.map(p => p.power), this.powerOutput / 1000);
        for (let power = 0; power <= Math.ceil(maxPower * 1.1); power += Math.ceil(maxPower / 5)) {
            const y = height - padding - (power / (maxPower * 1.1)) * graphHeight;
            ctx.beginPath();
            ctx.moveTo(padding - 5, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
            ctx.fillText(power.toFixed(1) + ' kW', padding - 10, y + 4);
        }
        
        // Draw 24-hour profile
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < this.dailyProfile.length; i++) {
            const profile = this.dailyProfile[i];
            const x = padding + (profile.hour / 24) * graphWidth;
            const y = height - padding - (profile.power / (maxPower * 1.1)) * graphHeight;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // Draw actual generation (last 24 hours)
        if (this.energyHistory.length > 0) {
            ctx.strokeStyle = '#FF9800';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            for (let i = 0; i < this.energyHistory.length; i++) {
                const power = this.energyHistory[i] / 1000;
                const time = this.timeHistory[i];
                const x = padding + (time / 24) * graphWidth;
                const y = height - padding - (power / (maxPower * 1.1)) * graphHeight;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        // Draw legend
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(width - 250, padding, 15, 15);
        ctx.fillStyle = '#333';
        ctx.textAlign = 'left';
        ctx.fillText('24-Hour Profile', width - 230, padding + 12);
        
        ctx.fillStyle = '#FF9800';
        ctx.fillRect(width - 250, padding + 25, 15, 15);
        ctx.fillStyle = '#333';
        ctx.fillText('Current Data', width - 230, padding + 37);
    }
    
    // ==================== ANIMATION LOOP ====================
    
    animate() {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Update 60 times per second max
        if (deltaTime >= 16.67) {
            this.update();
            this.render();
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    new SolarPanelSimulation();
});