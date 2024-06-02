document.addEventListener("DOMContentLoaded", () => {
    const CONFIG = {
        canvasWidth: 800,
        canvasHeight: 600,
        gravity: 1,
        spawnX: 200,
        spawnY: 100,
        hexSize: 80,
        groundHeight: 80,
        forceMagnitude: 40,
        angleA: -Math.PI, // Angle A in radians
        angleB: Math.PI / 18, // Angle B in radians
    };
  
    const canvas = document.getElementById("gameCanvas");
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
  
    const ground = Matter.Bodies.rectangle(
        CONFIG.canvasWidth / 2,
        CONFIG.canvasHeight - CONFIG.groundHeight / 2,
        CONFIG.canvasWidth,
        CONFIG.groundHeight,
        { isStatic: true, label: "ground" }
    );
    Matter.World.add(world, ground);
  
    // Hardcoded blocks
    const gap = 650;
    const blocks = [
        Matter.Bodies.rectangle(0, 410, gap, 20, {
            isStatic: true,
            label: "block1",
        }),
        Matter.Bodies.rectangle(800, 410, gap, 20, {
            isStatic: true,
            label: "block2",
        }),
        Matter.Bodies.rectangle(10, 200, 20, 1000, {
            isStatic: true,
            label: "block3",
        }),
        Matter.Bodies.rectangle(790, 200, 20, 1000, {
            isStatic: true,
            label: "block4",
        }),
    ];
    blocks.forEach((block) => Matter.World.add(world, block));
  
    const hexagon = Matter.Bodies.polygon(
        CONFIG.spawnX,
        CONFIG.spawnY,
        6,
        CONFIG.hexSize,
        { restitution: 0.6, density: 0.05, label: "hexagon" }
    );
    Matter.World.add(world, hexagon);
  
    const hexagonImage = new Image();
    hexagonImage.src = 'hexagon2.png';
  
    const cupImage = new Image();
    cupImage.src = 'cup.png';
  
    setInterval(() => {
        Matter.Engine.update(engine);
        updateIndicator();
        draw();
        if (hexagon.position.y > CONFIG.canvasHeight - 200 && !gameFinished) {
            calculateScore();
        }
    }, 1000 / 60);
  
    setInterval(() => {
        if (hexagon.position.y > CONFIG.canvasHeight - 200 && !gameFinished) {
            calculateScore();
        }
    }, 200);
  
    canvas.addEventListener("click", applyForceToHexagon);
    document.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            applyForceToHexagon();
        }
    });
  
    function updateIndicator() {
        if (!showIndicator) return;
  
        const swingSpeed = 0.02; // Adjust this value to change the swing speed
  
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
        if (gameFinished) return;
        if (Date.now() - lastActionTime < CONFIG.throttleTime) return; // Cooldown based on throttle time
  
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
        blocks.forEach((block) => drawBody(block, "rgba(0, 0, 0, 0)")); // 20% transparency
        drawBody(ground, "rgba(0, 0, 0, 0)"); // 20% transparency
  
        if (showIndicator) {
            drawIndicator();
        }
  
        drawScoreMapping();
  
        // Draw cup on top of the ground
        drawCup();
  
        ctx.font = "20px Arial";
        ctx.fillStyle = "black";
        ctx.textAlign = "right";
        ctx.fillText("Score: " + score, canvas.width - 30, 30);
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
        ctx.rotate(body.angle + Math.PI / 6); // Rotate by 30 degrees (PI / 6 radians)
        ctx.drawImage(
            hexagonImage,
            -width / 2,
            -height / 2,
            width,
            height
        );
        ctx.restore();
    }
  
    function drawIndicator() {
        const indicatorLength = 100;
        const indicatorX =
            hexagon.position.x + indicatorLength * Math.cos(indicatorAngle);
        const indicatorY =
            hexagon.position.y + indicatorLength * Math.sin(indicatorAngle);
  
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
  
    function drawScoreMapping() {
        const colors = ["red", "orange", "yellow", "green", "blue", "purple"];
        const scores = [100, 100, 200, 200, 500, 1000];
  
        ctx.font = "16px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        for (let i = 0; i < colors.length; i++) {
            ctx.fillStyle = colors[i];
            ctx.fillRect(10, 10 + i * 25, 20, 20);
            ctx.fillStyle = "black";
            ctx.fillText(" = " + scores[i] + " points", 40, 20 + i * 25);
        }
    }
  
    function drawCup() {
        const cupWidth = 200; // Adjust the width of the cup
        const cupHeight = 200 * 281 / 373; // Adjust the height of the cup
        const groundY = CONFIG.canvasHeight - CONFIG.groundHeight;
        const cupX = (CONFIG.canvasWidth / 2) - (cupWidth / 2);
        const cupY = groundY - cupHeight + 80;
  
        ctx.drawImage(cupImage, cupX, cupY, cupWidth, cupHeight);
    }
  
    function calculateScore() {
        const angle = hexagon.angle % (Math.PI * 2);
        const normalizedAngle = (angle + Math.PI * 2) % (Math.PI * 2); // Normalize angle to 0 - 2π
        const segmentAngle = Math.PI / 3; // 60 degrees per segment
  
        const edgeIndex = Math.floor(normalizedAngle / segmentAngle);
        // red, purple, blue, green, yellow, orange
        const edgeScores = [100, 1000, 500, 200, 200, 100];
        score = edgeScores[edgeIndex];
  
        if (!scoreUpdated && score > 0) {
            scoreUpdated = true;
            showIndicator = false;
            canvas.removeEventListener("click", applyForceToHexagon);
            document.removeEventListener("keydown", handleKeydown);
            setTimeout(() => {
                triggerScanner(score); // Trigger scanner with the score
                showScanPopup(); // Show scan popup
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
  
    /* Config functions from Chill Fishing game */
    function showConfigPopup() {
        document.getElementById('config-popup').style.display = 'block';
    }
  
    function loadConfig() {
        const configString = localStorage.getItem('gameConfig');
        if (configString) {
            const config = JSON.parse(configString);
            document.getElementById('gravity').value = config.gravity;
            document.getElementById('hex-size').value = config.hexSize;
            document.getElementById('throttle-time').value = config.throttleTime;
  
            CONFIG.gravity = config.gravity;
            CONFIG.hexSize = config.hexSize;
            CONFIG.throttleTime = config.throttleTime;
        }
    }
  
    function updateConfig() {
        const newConfig = {
            gravity: parseFloat(document.getElementById('gravity').value),
            hexSize: parseInt(document.getElementById('hex-size').value, 10),
            throttleTime: parseInt(document.getElementById('throttle-time').value, 10)
        };
  
        localStorage.setItem('gameConfig', JSON.stringify(newConfig));
        loadConfig();
        document.getElementById('config-popup').style.display = 'none';
    }
  
    /* Scan and Scanner functions from Chill Fishing game */
    function triggerScanner(score) {
        const scannerArgument = score.toString();  // Convert score to a string for the scanner argument
        console.log("Scanner triggered with score:", scannerArgument);
        alert(`Game Over! Score: ${scannerArgument}`);
  
        if (window.Android) {
            window.Android.startScanner(scannerArgument); // Pass the specific prize argument to Android
        } else {
            console.log("Scanner feature not available on this platform.");
        }
    }
  
    function showScanPopup() {
        document.getElementById('scan-popup').style.display = 'block';
    }
  
    window.onload = function() {
        loadConfig();
    };
});
