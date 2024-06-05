document.addEventListener("DOMContentLoaded", () => {
    const CONFIG = {
        canvasWidth: 800,
        canvasHeight: 600,
        gravity: 1,
        spawnX: 200,
        spawnY: 100,
        hexSize: 70,
        groundHeight: 140,
        forceMagnitude: 40,
        angleA: -Math.PI,
        angleB: Math.PI / 18,
        throttleTime: 2000,
        arrowBounceSpeed: 1,
        arrowBounceHeight: 20
    };

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
    let arrowY = 0;
    let arrowDirection = 1;

    const ground = Matter.Bodies.rectangle(
        CONFIG.canvasWidth / 2,
        CONFIG.canvasHeight - CONFIG.groundHeight / 2,
        CONFIG.canvasWidth,
        CONFIG.groundHeight,
        { isStatic: true, label: "ground" }
    );
    Matter.World.add(world, ground);
    const gap = 255;
    const blocks = [
        Matter.Bodies.rectangle(0, 0, 1600, 20, {
            isStatic: true,
            label: "block0",
        }),
        Matter.Bodies.rectangle(190, 360, gap, 80, {
            isStatic: true,
            label: "block1",
            angle: -Math.PI / 9
        }),
        Matter.Bodies.rectangle(620, 350, gap, 80, {
            isStatic: true,
            label: "block2",
            angle: Math.PI / 9
        }),
        Matter.Bodies.rectangle(30, 200, 20, 1000, {
            isStatic: true,
            label: "block3",
        }),
        Matter.Bodies.rectangle(770, 200, 20, 1000, {
            isStatic: true, label: "block4",
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
    hexagonImage.src = 'hexagon3.png';

    hexagonImage.onload = () => {
        console.log("Hexagon image loaded successfully.");
    };

    hexagonImage.onerror = () => {
        console.error("Failed to load hexagon image.");
    };

    const cupImage = new Image();
    cupImage.src = 'cup2.png';

    const arrowImage = new Image();
    arrowImage.src = 'rainbowArrow.png';

    function updateGame() {
        Matter.Engine.update(engine);
        updateIndicator();
        updateArrowBounce();
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
        if (gameFinished) return;
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

    function updateArrowBounce() {
        arrowY += CONFIG.arrowBounceSpeed * arrowDirection;
        if (arrowY >= CONFIG.arrowBounceHeight || arrowY <= -CONFIG.arrowBounceHeight) {
            arrowDirection *= -1;
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawHexagon(hexagon);
        blocks.forEach((block) => drawBody(block, "rgba(0, 0, 0, 0)")); // Transparent blocks
        drawBody(ground, "rgba(0, 0, 0, 0)"); // Transparent ground

        if (showIndicator) {
            drawIndicator();
        }

        // drawScoreMapping();
        drawCup();
        drawArrow();
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

    function drawArrow() {
        if (arrowImage.complete) {
            const arrowX = (CONFIG.canvasWidth / 2) - (arrowImage.width / 2)+45;
            const arrowBaseY = CONFIG.canvasHeight - CONFIG.groundHeight - 380;
            const arrowDrawY = arrowBaseY + arrowY;
            ctx.drawImage(arrowImage, arrowX, arrowDrawY, 84, 95);
        }
    }

    function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy - Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy - Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    function drawScoreMapping() {
        const colors = ["red", "yellow", "blue", "green", "purple", "black"];
        const scores = [50, 100, 200, 500, 1000, 2000];
        const padding = 0;
        const totalWidth = canvas.width - padding * 2;
        const cellWidth = totalWidth / colors.length;
        const cellHeight = 40; // Increase cellHeight to provide space for star and text
        const yPosition = 80;

        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (let i = 0; i < colors.length; i++) {
            const xPosition = padding + i * cellWidth + cellWidth / 2;

            if (highlightedScore === scores[i]) {
                ctx.fillStyle = "lightgray"; // Highlight the background
                ctx.fillRect(xPosition - cellWidth / 2, yPosition, cellWidth, cellHeight); // Adjust width to highlight full cell
            }

            // Draw star shape
            const starOuterRadius = 10;
            const starInnerRadius = 5;
            drawStar(ctx, xPosition, yPosition + starOuterRadius, 5, starOuterRadius, starInnerRadius, colors[i]);

            // Draw text
            ctx.fillStyle = "white";
            ctx.fillText(`${scores[i]} 分`, xPosition, yPosition + cellHeight / 2 + starOuterRadius);
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.strokeText(`${scores[i]} 分`, xPosition, yPosition + cellHeight / 2 + starOuterRadius);
        }
    }

    function drawCup() {
        const cupWidth = 220;
        const cupHeight = 220 * 281 / 373;
        const cupX = (CONFIG.canvasWidth / 2) - (cupWidth / 2);
        const groundY = CONFIG.canvasHeight - CONFIG.groundHeight;
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

});
