document.addEventListener("DOMContentLoaded", () => {
    const CONFIG = {
        canvasWidth: 800,
        canvasHeight: 600,
        gravity: 1,
        spawnX: 100,
        spawnY: 100,
        hexSize: 70,
        groundHeight: 140,
        forceMagnitude: 50,
        angleA: - Math.PI / 2 - Math.PI / 2,  // 45 degrees - 22.5 degrees
        angleB: - Math.PI / 2 + Math.PI / 2,  // 45 degrees + 22.5 degrees
        throttleTime: 1000
    };

    let audioThreshold = parseInt(localStorage.getItem('audioThreshold')) || 0; // Initialize threshold value from localStorage or default to 0
    const controlBall = document.getElementById('control-ball');
    let isDragging = false;

    controlBall.style.bottom = `${audioThreshold * 2}px`; // Set initial position of control ball based on threshold

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
        const threshold = Math.round((containerRect.height - clampedY) * 0.5); // Scale to 0-100
        audioThreshold = threshold;
        controlBall.style.bottom = `${containerRect.height - clampedY}px`;
    }

    function stopDrag(event) {
        event.preventDefault();
        isDragging = false;
        localStorage.setItem('audioThreshold', audioThreshold); // Save threshold to localStorage
    }

    const canvas = document.getElementById("gameCanvas");
    canvas.width = CONFIG.canvasWidth;
    canvas.height = CONFIG.canvasHeight;
    const ctx = canvas.getContext("2d");
    const engine = Matter.Engine.create();
    const world = engine.world;
    engine.world.gravity.y = CONFIG.gravity;

    let gameFinished = false;
    let showIndicator = true;
    let indicatorAngle = CONFIG.angleA;
    let swingingRight = true;
    let lastActionTime = 0;
    let score = 0;
    let scoreUpdated = false;
    let highlightedScore = null;

    const ground = Matter.Bodies.rectangle(
        CONFIG.canvasWidth / 2,
        CONFIG.canvasHeight - CONFIG.groundHeight / 2,
        CONFIG.canvasWidth,
        CONFIG.groundHeight,
        { isStatic: true, label: "ground", friction: 1 }
    );
    Matter.World.add(world, ground);
    const blocks = [
        Matter.Bodies.rectangle(0, 0, 1600, 20, {
            isStatic: true,
            label: "block0",
            friction: 1
        }),
        Matter.Bodies.rectangle(0, 400, 620, 40, {
            isStatic: true,
            label: "hBlock1",
            friction: 1
        }),
        Matter.Bodies.rectangle(280, 330, 40, 100, {
            isStatic: true,
            label: "vBlock1",
            friction: 1
        }),
        Matter.Bodies.rectangle(420, 290, 320, 40, {
            isStatic: true,
            label: "hBlock2",
            friction: 1
        }),
        Matter.Bodies.rectangle(550, 400, 40, 180, {
            isStatic: true,
            label: "iceCreamBlock",
            friction: 1
        }),
        Matter.Bodies.rectangle(30, 200, 20, 1000, {
            isStatic: true,
            label: "block3",
            friction: 1
        }),
        Matter.Bodies.rectangle(770, 200, 20, 1000, {
            isStatic: true,
            label: "block4",
            friction: 1
        }),
    ];
    blocks.forEach((block) => Matter.World.add(world, block));

    const hexagon = Matter.Bodies.polygon(
        CONFIG.spawnX,
        CONFIG.spawnY,
        6,
        CONFIG.hexSize,
        { restitution: 0.6, density: 0.05, friction: 1, label: "hexagon" }
    );
    Matter.World.add(world, hexagon);

    const hexagonImage = new Image();
    hexagonImage.src = 'hexagon3.png';

    hexagonImage.onload = () => {
        console.log("Hexagon image loaded successfully.");
    };

    hexagonImage.onerror = () => {
        console.error("Failed to load hexagon image.");
    };

    const cupImage = new Image();
    cupImage.src = 'cup2.png';

    const indicatorImage = new Image();
    indicatorImage.src = 'rainbowArrow.png';

    indicatorImage.onload = () => {
        console.log("Indicator image loaded successfully.");
    };

    indicatorImage.onerror = () => {
        console.error("Failed to load indicator image.");
    };

    function updateGame() {
        Matter.Engine.update(engine);
        updateIndicator();
        draw();
        if (hexagon.position.y > CONFIG.canvasHeight - 260 && !gameFinished) {
            showIndicator = false;
            calculateScore();
        }
        requestAnimationFrame(updateGame);
    }

    updateGame();

    canvas.addEventListener("click", applyForceToHexagon);
    document.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            applyForceToHexagon();
        }
    });

    function updateIndicator() {
        if (!showIndicator) return;

        const swingSpeed = 0.02;

        if (swingingRight) {
            indicatorAngle += swingSpeed;
            if (indicatorAngle >= CONFIG.angleB) {
                indicatorAngle = CONFIG.angleB;
                swingingRight = false;
            }
        } else {
            indicatorAngle -= swingSpeed;
            if (indicatorAngle <= CONFIG.angleA) {
                indicatorAngle = CONFIG.angleA;
                swingingRight = true;
            }
        }
    }

    function applyForceToHexagon() {
        if (gameFinished || hexagon.position.y > CONFIG.canvasHeight - 260) return; // Disable applyForceToHexagon when the hexagon is below the specified position
        if (Date.now() - lastActionTime < CONFIG.throttleTime) return;

        const force = {
            x: CONFIG.forceMagnitude * Math.cos(indicatorAngle),
            y: CONFIG.forceMagnitude * Math.sin(indicatorAngle),
        };
        Matter.Body.applyForce(hexagon, hexagon.position, force);
        lastActionTime = Date.now();

        showIndicator = false;
        setTimeout(() => {
            if (!gameFinished) {
                showIndicator = true;
            }
        }, CONFIG.throttleTime);
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawHexagon(hexagon);
        blocks.forEach((block) => drawBody(block, "rgba(0, 0, 0, 0)")); // Transparent blocks
        drawBody(ground, "rgba(0, 0, 0, 0)"); // Transparent ground

        if (showIndicator) {
            drawIndicator();
        }

        drawCup();
        drawMovingIndicator();
    }

    function drawBody(body, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        body.vertices.forEach((vertex, index) => {
            if (index === 0) {
                ctx.moveTo(vertex.x, vertex.y);
            } else {
                ctx.lineTo(vertex.x, vertex.y);
            }
        });
        ctx.closePath();
        ctx.fill();
    }

    function drawHexagon(body) {
        const aspectRatio = 835 / 736;
        const width = CONFIG.hexSize * 2 * aspectRatio;
        const height = CONFIG.hexSize * 2;

        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle + Math.PI / 6);
        if (hexagonImage.complete) {
            ctx.drawImage(hexagonImage, -width / 2, -height / 2, width, height);
        } else {
            ctx.fillRect(-width / 2, -height / 2, width, height);
        }
        ctx.restore();
    }

    function drawIndicator() {
        const indicatorLength = 100;
        const indicatorX = hexagon.position.x + indicatorLength * Math.cos(indicatorAngle);
        const indicatorY = hexagon.position.y + indicatorLength * Math.sin(indicatorAngle);

        ctx.strokeStyle = "black";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(hexagon.position.x, hexagon.position.y);
        ctx.lineTo(indicatorX, indicatorY);
        ctx.stroke();

        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.moveTo(indicatorX, indicatorY);
        ctx.lineTo(indicatorX - 10 * Math.cos(indicatorAngle - Math.PI / 6), indicatorY - 10 * Math.sin(indicatorAngle - Math.PI / 6));
        ctx.lineTo(indicatorX - 10 * Math.cos(indicatorAngle + Math.PI / 6), indicatorY - 10 * Math.sin(indicatorAngle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    function drawMovingIndicator() {
        const amplitude = 20;
        const frequency = 0.01;
        const cupX = (CONFIG.canvasWidth / 2) + 260;
        const cupY = CONFIG.canvasHeight - CONFIG.groundHeight - 350; // Position just above the cup
        const time = Date.now() * frequency;
        const yOffset = Math.sin(time) * amplitude;

        const indicatorWidth = 50;
        const indicatorHeight = 50;

        ctx.drawImage(indicatorImage, cupX - indicatorWidth / 2, cupY + yOffset - indicatorHeight / 2, indicatorWidth, indicatorHeight);
    }

    function drawCup() {
        const cupWidth = 200;
        const cupHeight = 200 * 281 / 373;
        const groundY = CONFIG.canvasHeight - CONFIG.groundHeight;
        const cupX = (CONFIG.canvasWidth / 2) - (cupWidth / 2) + 260;
        const cupY = groundY - cupHeight + 80;

        ctx.drawImage(cupImage, cupX, cupY, cupWidth, cupHeight);
    }

    function calculateScore() {
        const angle = hexagon.angle % (Math.PI * 2);
        const normalizedAngle = (angle + Math.PI * 2) % (Math.PI * 2); // Normalize angle to 0 - 2π
        const segmentAngle = Math.PI / 3; // 60 degrees per segment

        const edgeIndex = Math.floor(normalizedAngle / segmentAngle);
        // yellow, red, BLACK, purple, green, blue
        const edgeScores = [100, 50, 2000, 1000, 500, 200];
        score = edgeScores[edgeIndex];
        highlightedScore = score; // Highlight the score

        if (!scoreUpdated && score > 0) {
            scoreUpdated = true;
            showIndicator = false;
            canvas.removeEventListener("click", applyForceToHexagon);
            document.removeEventListener("keydown", handleKeydown);
            setTimeout(() => {
                triggerScanner(score); // Trigger scanner with the score
                showScanPopup(score); // Show scan popup with the score
                setTimeout(() => {
                    window.location.reload();
                }, 5000); // Refresh the page after 5 seconds
            }, 5000);
        }
    }

    function handleKeydown(event) {
        if (event.key === "Enter") {
            applyForceToHexagon();
        }
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

    // Set up audio input handling
    let audioContext;
    let analyser;
    let microphone;
    let javascriptNode;
    const volumeBar = document.getElementById('volume-bar');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            microphone = audioContext.createMediaStreamSource(stream);
            javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;

            microphone.connect(analyser);
            analyser.connect(javascriptNode);
            javascriptNode.connect(audioContext.destination);

            javascriptNode.onaudioprocess = () => {
                const array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);

                const values = array.reduce((a, b) => a + b);
                const average = values / array.length;

                const volume = Math.min(100, Math.max(0, average)); // Scale average to 0-100
                volumeBar.style.height = `${volume * 2}px`; // Scale height (2px per unit)

                const threshold = parseInt(localStorage.getItem('audioThreshold')) || 0; // Retrieve threshold from localStorage
                if (average > threshold) {
                    applyForceToHexagon();
                }
            };
        }).catch((err) => {
            console.error('Error accessing microphone:', err);
        });
    } else {
        console.error('getUserMedia not supported on your browser!');
    }
});
