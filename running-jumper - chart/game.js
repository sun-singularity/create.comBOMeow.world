document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const CONFIG = {
        canvasWidth: 800,
        canvasHeight: 400,
        gravity: 0.5,
        jumpStrength: 12,
        obstacleSpeed: 5,
        spawnRate: 90,  // Frames between obstacle spawns
        blinkDuration: 3000, // Blinking duration in ms
        spriteWidth: 165, // Half of original width 330
        spriteHeight: 200, // Half of original height 400
        spriteFrameCount: 4,
        frameRate: 10,  // Adjust this value to control the speed of the sprite animation
        obstacleWidth: 88.5, // Half of original width 177
        obstacleHeight: 112.5, // Half of original height 225
    };

    let audioThreshold = parseInt(localStorage.getItem('audioThreshold')) || 0;
    let minFrequency = parseInt(localStorage.getItem('minFrequency')) || 0;
    let maxFrequency = parseInt(localStorage.getItem('maxFrequency')) || 20000;
    let snrThreshold = parseInt(localStorage.getItem('snrThreshold')) || 0;
    
    const controlBall = document.getElementById('control-ball');
    let isDragging = false;

    controlBall.style.bottom = `${audioThreshold * 2}px`;

    // Event listeners for dragging
    controlBall.addEventListener('mousedown', startDrag);
    controlBall.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);

    function startDrag(event) {
        event.preventDefault();
        isDragging = true;
    }

    function onDrag(event) {
        if (!isDragging) return;
        event.preventDefault();
        const volumeBarContainer = document.getElementById('volume-bar-container');
        const containerRect = volumeBarContainer.getBoundingClientRect();
        const clientY = event.clientY || event.touches[0].clientY;
        const newY = clientY - containerRect.top;
        const clampedY = Math.max(0, Math.min(containerRect.height, newY));
        const threshold = Math.round((containerRect.height - clampedY) * 0.5);
        audioThreshold = threshold;
        controlBall.style.bottom = `${containerRect.height - clampedY}px`;
    }

    function stopDrag(event) {
        event.preventDefault();
        isDragging = false;
        localStorage.setItem('audioThreshold', audioThreshold);
    }

    document.getElementById('volume-threshold').value = audioThreshold;
    document.getElementById('volume-threshold').addEventListener('input', (event) => {
        audioThreshold = parseInt(event.target.value);
        localStorage.setItem('audioThreshold', audioThreshold);
    });

    document.getElementById('min-frequency').value = minFrequency;
    document.getElementById('min-frequency').addEventListener('input', (event) => {
        minFrequency = parseInt(event.target.value);
        localStorage.setItem('minFrequency', minFrequency);
    });

    document.getElementById('max-frequency').value = maxFrequency;
    document.getElementById('max-frequency').addEventListener('input', (event) => {
        maxFrequency = parseInt(event.target.value);
        localStorage.setItem('maxFrequency', maxFrequency);
    });

    document.getElementById('snr-threshold').value = snrThreshold;
    document.getElementById('snr-threshold').addEventListener('input', (event) => {
        snrThreshold = parseInt(event.target.value);
        localStorage.setItem('snrThreshold', snrThreshold);
    });

    const player = {
        x: 50,
        y: CONFIG.canvasHeight - CONFIG.spriteHeight - 10,
        width: CONFIG.spriteWidth,
        height: CONFIG.spriteHeight,
        dy: 0,
        jumping: false,
        onGround: false,
        lives: 3,
        blinking: false,
        blinkEnd: 0,
        frameIndex: 0,
        frameCount: CONFIG.spriteFrameCount,
        spriteSheet: new Image(),
    };

    player.spriteSheet.src = 'cat_sprite.png';

    const cactusImage = new Image();
    cactusImage.src = 'cactus.png';

    const obstacles = [];
    let frames = 0;
    let score = 0;
    let gameOver = false;
    let mode = 'practice'; // 'practice' or 'challenge'

    function updateInfo() {
        document.getElementById('current-mode').textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
        document.getElementById('current-score').textContent = score;
        document.getElementById('remaining-lives').textContent = mode === 'challenge' ? player.lives : '∞';
    }

    function drawPlayer() {
        if (player.blinking && frames % 10 < 5) {
            return; // Skip drawing the player every other frame to create a blinking effect
        }
        ctx.drawImage(
            player.spriteSheet,
            player.frameIndex * CONFIG.spriteWidth * 2, // Original width in sprite sheet
            0,
            CONFIG.spriteWidth * 2,
            CONFIG.spriteHeight * 2,
            player.x,
            player.y,
            CONFIG.spriteWidth,
            CONFIG.spriteHeight
        );
        if (frames % CONFIG.frameRate === 0) {
            player.frameIndex = (player.frameIndex + 1) % player.frameCount;
        }
    }

    function drawObstacle(obstacle) {
        ctx.drawImage(
            cactusImage,
            obstacle.x,
            obstacle.y,
            CONFIG.obstacleWidth,
            CONFIG.obstacleHeight
        );
    }

    function spawnObstacle() {
        obstacles.push({
            x: CONFIG.canvasWidth,
            y: CONFIG.canvasHeight - CONFIG.obstacleHeight - 10,
            width: CONFIG.obstacleWidth,
            height: CONFIG.obstacleHeight,
        });
    }

    function updateObstacles() {
        obstacles.forEach(obstacle => {
            obstacle.x -= CONFIG.obstacleSpeed;
        });

        if (frames % CONFIG.spawnRate === 0) {
            spawnObstacle();
        }

        if (obstacles.length && obstacles[0].x + obstacles[0].width < 0) {
            obstacles.shift();
            score += 10;
        }
    }

    function checkCollision() {
        if (player.blinking) return false;

        for (let obstacle of obstacles) {
            if (player.x < obstacle.x + obstacle.width &&
                player.x + player.width > obstacle.x &&
                player.y < obstacle.y + obstacle.height &&
                player.y + player.height > obstacle.y) {
                if (mode === 'challenge') {
                    player.lives -= 1;
                    player.blinking = true;
                    player.blinkEnd = Date.now() + CONFIG.blinkDuration;
                    if (player.lives <= 0) {
                        gameOver = true;
                    }
                }
                return true;
            }
        }
        return false;
    }

    function jump() {
        if (player.onGround) {
            player.dy = -CONFIG.jumpStrength;
            player.jumping = true;
            player.onGround = false;
        }
    }

    function applyGravity() {
        player.y += player.dy;
        player.dy += CONFIG.gravity;

        if (player.y + player.height >= CONFIG.canvasHeight) {
            player.y = CONFIG.canvasHeight - player.height;
            player.dy = 0;
            player.jumping = false;
            player.onGround = true;
        }
    }

    function update() {
        if (gameOver) {
            showScanPopup(score);
            return;
        }

        if (player.blinking && Date.now() > player.blinkEnd) {
            player.blinking = false;
        }

        ctx.clearRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

        drawPlayer();
        updateObstacles();
        obstacles.forEach(drawObstacle);

        applyGravity();
        checkCollision();

        updateInfo();

        frames++;
        requestAnimationFrame(update);
    }

    function showScanPopup(score) {
        const scoreDisplay = document.getElementById('score-display');
        scoreDisplay.textContent = `${score} points`;
        document.getElementById('scan-popup').style.display = 'block';

        setTimeout(() => {
            window.location.reload();
        }, 5000);
    }

    // Switch to challenge mode on Enter key press or touch
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            switchToChallengeMode();
        }
    });

    canvas.addEventListener('click', switchToChallengeMode);

    function switchToChallengeMode() {
        mode = 'challenge';
        player.lives = 3;
        player.blinking = false;
        player.blinkEnd = 0;
        updateInfo();
    }

    // Audio input handling
    let audioContext;
    let analyser;
    let microphone;
    let javascriptNode;
    const volumeBar = document.getElementById('volume-bar');

    // Frequency chart setup
    const frequencyChartCtx = document.getElementById('frequencyChart').getContext('2d');
    const frequencyChart = new Chart(frequencyChartCtx, {
        type: 'line',
        data: {
            labels: Array.from({ length: 1024 }, (_, i) => i), // Placeholder labels, will be updated
            datasets: [{
                label: 'Frequency Data',
                data: Array(1024).fill(0),
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Frequency (Hz)'
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 256
                }
            }
        }
    });

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            microphone = audioContext.createMediaStreamSource(stream);
            javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;
            
             // Create a band-pass filter to isolate human voice frequencies
            const bandPassFilter = audioContext.createBiquadFilter();
            bandPassFilter.type = 'bandpass';
            bandPassFilter.frequency.value = 1000; // Center frequency of the band-pass filter
            bandPassFilter.Q.value = 1; // Quality factor, adjust as necessary

            microphone.connect(bandPassFilter);
            bandPassFilter.connect(analyser);
            analyser.connect(javascriptNode);
            javascriptNode.connect(audioContext.destination);

            // Update frequency labels based on sample rate
            frequencyChart.data.labels = Array.from({ length: 1024 }, (_, i) => (i * audioContext.sampleRate / 2 / 1024).toFixed(2));
            frequencyChart.update();

            javascriptNode.onaudioprocess = () => {
                const array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);

                // Update frequency chart
                frequencyChart.data.datasets[0].data = array;
                frequencyChart.update();

                const values = array.reduce((a, b) => a + b);
                const average = values / array.length;

                // Apply min/max frequency filters
                const minIndex = Math.floor(minFrequency / (audioContext.sampleRate / 2) * array.length);
                const maxIndex = Math.ceil(maxFrequency / (audioContext.sampleRate / 2) * array.length);
                const filteredArray = array.slice(minIndex, maxIndex);

                const filteredValues = filteredArray.reduce((a, b) => a + b);
                const filteredAverage = filteredValues / filteredArray.length;

                // Calculate SNR
                const noiseLevel = values - filteredValues;
                const snr = filteredAverage / noiseLevel;

                const volume = Math.min(100, Math.max(0, average));
                volumeBar.style.height = `${volume * 2}px`;

                const threshold = parseInt(localStorage.getItem('audioThreshold')) || 0;
                const snrThreshold = parseInt(localStorage.getItem('snrThreshold')) || 0;
                if (filteredAverage > threshold && snr > snrThreshold) {
                    jump();
                }
            };
        }).catch((err) => {
            console.error('Error accessing microphone:', err);
        });
    } else {
        console.error('getUserMedia not supported on your browser!');
    }

    update();
});
