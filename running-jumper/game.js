document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const CONFIG = {
        canvasWidth: 800,
        canvasHeight: 500,
        gravity: 0.4,
        jumpStrength: 15,
        obstacleSpeed: 5,
        spawnRate: 120,  // Frames between obstacle spawns in practice mode
        challengeSpawnRate: 90, // Frames between obstacle spawns in challenge mode
        blinkDuration: 1000, // Blinking duration in ms
        spriteWidth: 165, // Half of original width 330
        spriteHeight: 200, // Half of original height 400
        spriteFrameCount: 4,
        frameRate: 10,  // Adjust this value to control the speed of the sprite animation
        obstacleWidth: 88.5, // Half of original width 177
        obstacleHeight: 112.5, // Half of original height 225
        collisionOffsetX: 20, // Collision offset for obstacle width
        collisionOffsetY: 30, // Collision offset for obstacle height
    };

    let audioThreshold = parseInt(localStorage.getItem('audioThreshold')) || 0;
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
    const boxImage = new Image();
    boxImage.src = 'box.png';

    const obstacles = [];
    let frames = 0;
    let score = 0;
    let gameOver = false;
    let mode = 'practice'; // 'practice' or 'challenge'
    let spawningEnabled = true;

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
        const obstacleImage = mode === 'practice' ? boxImage : cactusImage;
        ctx.drawImage(
            obstacleImage,
            obstacle.x,
            obstacle.y,
            CONFIG.obstacleWidth,
            CONFIG.obstacleHeight
        );
    }

    function spawnObstacle() {
        if (spawningEnabled) {
            obstacles.push({
                x: CONFIG.canvasWidth,
                y: CONFIG.canvasHeight - CONFIG.obstacleHeight - 10,
                width: CONFIG.obstacleWidth,
                height: CONFIG.obstacleHeight,
            });
        }
    }

    function updateObstacles() {
        obstacles.forEach(obstacle => {
            obstacle.x -= CONFIG.obstacleSpeed;
        });

        if (spawningEnabled && frames % (mode === 'challenge' ? CONFIG.challengeSpawnRate : CONFIG.spawnRate) === 0) {
            spawnObstacle();
        }

        if (obstacles.length && obstacles[0].x + obstacles[0].width < 0) {
            obstacles.shift();
            if (mode === 'challenge') {
                score += 500; // Add score for each successful pass in challenge mode
                if (score >= 2000) {
                    gameOver = true;
                    showScanPopup(score); // End game if score reaches 2000 in challenge mode
                    triggerScanner(score); 
                    setTimeout(() => {
                        window.location.reload();
                    }, 5000);
                }
            }
        }
    }

    function checkCollision() {
        if (player.blinking) return false;

        for (let obstacle of obstacles) {
            if (player.x < obstacle.x + obstacle.width - CONFIG.collisionOffsetX &&
                player.x + player.width > obstacle.x + CONFIG.collisionOffsetX &&
                player.y < obstacle.y + obstacle.height - CONFIG.collisionOffsetY &&
                player.y + player.height > obstacle.y + CONFIG.collisionOffsetY) {
                player.blinking = true;
                player.blinkEnd = Date.now() + CONFIG.blinkDuration;
                if (mode === 'challenge') {
                    player.lives -= 1;
                    if (player.lives <= 0) {
                        gameOver = true;
                        showScanPopup(score); // Show score popup if cat is hit in challenge mode
                        triggerScanner(score); 
                        setTimeout(() => {
                            window.location.reload();
                        }, 5000);
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
        if (gameOver && mode === 'challenge') {
            return; // Stop the game if game over in challenge mode
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


    function triggerScanner(score) {
        const scannerArgument = score.toString();  // Convert score to a string for the scanner argument
        console.log("Scanner triggered with score:", scannerArgument);
        // alert(`Game Over! Score: ${scannerArgument}`);

        if (window.Android) {
            window.Android.startScanner(scannerArgument); // Pass the specific prize argument to Android
        } else {
            console.log("Scanner feature not available on this platform.");
        }
    }
    function showScanPopup(score) {
        const scoreDisplay = document.getElementById('score-display');
        scoreDisplay.textContent = `${score}分`;
        document.getElementById('scan-popup').style.display = 'block';
    }

    // Countdown before challenge mode starts
    function startCountdown(callback) {
        spawningEnabled = false; // Stop spawning obstacles during countdown

        const countdownContainer = document.createElement('div');
        countdownContainer.id = 'countdown-container';
        countdownContainer.style.position = 'fixed';
        countdownContainer.style.width = '100%';
        countdownContainer.style.height = '100%';
        countdownContainer.style.top = '0';
        countdownContainer.style.left = '0';
        countdownContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        countdownContainer.style.display = 'flex';
        countdownContainer.style.flexDirection = 'column';
        countdownContainer.style.justifyContent = 'center';
        countdownContainer.style.alignItems = 'center';
        countdownContainer.style.color = 'white';
        countdownContainer.style.fontSize = '48px';
        countdownContainer.style.zIndex = '1000';
        document.body.appendChild(countdownContainer);

        const countdownText = document.createElement('div');
        countdownText.textContent = '進入挑戰模式';
        countdownText.style.fontSize = '60px';
        countdownText.style.marginBottom = '20px';
        countdownContainer.appendChild(countdownText);

        const countdownNumber = document.createElement('div');
        countdownNumber.textContent = '5';
        countdownNumber.style.fontSize = '60px';
        countdownContainer.appendChild(countdownNumber);

        let countdown = 5;

        const countdownInterval = setInterval(() => {
            countdown -= 1;
            if (countdown > 0) {
                countdownNumber.textContent = countdown;
            } else {
                clearInterval(countdownInterval);
                document.body.removeChild(countdownContainer);
                spawningEnabled = true; // Enable spawning obstacles after countdown
                callback();
            }
        }, 1000);
    }

    // Switch to challenge mode on Enter key press or touch
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            startCountdown(switchToChallengeMode);
        }
    });

    canvas.addEventListener('click', () => startCountdown(switchToChallengeMode));
    canvas.addEventListener('touchstart', () => startCountdown(switchToChallengeMode), { passive: false });

    function switchToChallengeMode() {
        mode = 'challenge';
        document.body.style.backgroundImage = "url('background_challenge.jpg')"; // Change background image
        player.lives = 1; // Only one life in challenge mode
        player.blinking = false;
        player.blinkEnd = 0;
        score = 0; // Reset score for challenge mode
        updateInfo();
    }

    function switchToPracticeMode() {
        mode = 'practice';
        document.body.style.backgroundImage = "url('background_practice.jpg')"; // Change background image
        player.lives = 3; // Reset lives for practice mode
        player.blinking = false;
        player.blinkEnd = 0;
        score = 0; // Reset score for practice mode
        updateInfo();
    }

    // Audio input handling
    let audioContext;
    let analyser;
    let microphone;
    let javascriptNode;
    let biquadFilter;
    const volumeBar = document.getElementById('volume-bar');

    let filterOn = true; // Boolean to toggle filter on/off

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            microphone = audioContext.createMediaStreamSource(stream);
            javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

            biquadFilter = audioContext.createBiquadFilter();
            biquadFilter.type = 'bandpass';
            biquadFilter.frequency.setValueAtTime(1000, audioContext.currentTime); // Center frequency
            biquadFilter.Q.setValueAtTime(1, audioContext.currentTime); // Q factor

            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;

            microphone.connect(biquadFilter);
            biquadFilter.connect(analyser);
            analyser.connect(javascriptNode);
            javascriptNode.connect(audioContext.destination);

            javascriptNode.onaudioprocess = () => {
                const array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);

                const values = array.reduce((a, b) => a + b);
                const average = values / array.length;

                const volume = Math.min(100, Math.max(0, average));
                volumeBar.style.height = `${volume * 2}px`;

                const threshold = parseInt(localStorage.getItem('audioThreshold')) || 0;
                if (average > threshold) {
                    jump();
                }
            };
        }).catch((err) => {
            console.error('Error accessing microphone:', err);
        });
    } else {
        console.error('getUserMedia not supported on your browser!');
    }

    // Function to toggle the filter
    function toggleFilter() {
        const filterButton = document.getElementById('toggle-filter-button');
        if (filterOn) {
            microphone.disconnect(biquadFilter);
            microphone.connect(analyser);
            filterButton.textContent = '0';
        } else {
            microphone.disconnect(analyser);
            microphone.connect(biquadFilter);
            biquadFilter.connect(analyser);
            filterButton.textContent = '1';
        }
        filterOn = !filterOn;
    }

    // Example of how to toggle the filter
    document.getElementById('toggle-filter-button').addEventListener('click', toggleFilter);
    document.getElementById('toggle-filter-button').addEventListener('touchstart', toggleFilter, { passive: false });

    // Set initial button text
    document.getElementById('toggle-filter-button').textContent = '1';

    switchToPracticeMode(); // Start in practice mode
    update();
});
