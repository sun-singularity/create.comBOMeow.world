const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 400;
canvas.height = 400;

const gridSize = 20;
let snake = [
    { x: 200, y: 200 },
    { x: 180, y: 200 },
    { x: 160, y: 200 },
    { x: 140, y: 200 },
    { x: 120, y: 200 }
];
let direction = { x: gridSize, y: 0 };
let apple = randomGridPosition();
let burnInstances = [];
let speed = 100;
let burnLogicActive = false;
let attempts = 0;

const burnImage = new Image();
burnImage.src = 'burn.png';

burnImage.onload = () => {
    gameLoop();
};

burnImage.onerror = () => {
    console.error("Failed to load burn.png");
};

function randomGridPosition() {
    return {
        x: Math.floor(Math.random() * canvas.width / gridSize) * gridSize,
        y: Math.floor(Math.random() * canvas.height / gridSize) * gridSize
    };
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    snake.forEach((part, index) => {
        ctx.fillStyle = "green";
        ctx.fillRect(part.x, part.y, gridSize, gridSize);

        // Draw border for snake head
        if (index === 0) {
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.strokeRect(part.x, part.y, gridSize, gridSize);
        }
    });

    // Draw apple
    ctx.fillStyle = "red";
    ctx.fillRect(apple.x, apple.y, gridSize, gridSize);

    // Draw burn instances
    burnInstances.forEach(burn => {
        ctx.drawImage(burnImage, burn.x, burn.y, gridSize * 3, gridSize * 3);
    });

    // Draw attempts counter
    const attemptsCounter = document.getElementById("attemptsCounter");
    attemptsCounter.textContent = `Attempts: ${attempts}`;
}

function update() {
    let head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Wrap snake position if it goes out of canvas boundaries
    if (head.x < 0) {
        head.x = canvas.width - gridSize;
    } else if (head.x >= canvas.width) {
        head.x = 0;
    } else if (head.y < 0) {
        head.y = canvas.height - gridSize;
    } else if (head.y >= canvas.height) {
        head.y = 0;
    }

    // Check for collision with apple
    if (head.x === apple.x && head.y === apple.y) {
        apple = randomGridPosition();
    }

    // Check for collision with burn area
    if (burnLogicActive) {
        let hit = false;
        burnInstances.forEach(burn => {
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (head.x === burn.x + i * gridSize && head.y === burn.y + j * gridSize) {
                        hit = true;
                    }
                }
            }
        });

        if (hit) {
            if (snake.length > 1) {
                snake.pop(); // Shorten snake by removing the tail
                speed = Math.max(speed * 0.8, 20); // Increase speed by 20%, minimum speed is 20ms
                showBurnIndicator();
            } else {
                alert("Game Over");
                resetGame();
                return;
            }
        }
        burnLogicActive = false; // Deactivate burn logic after one check
    }

    snake.unshift(head);
    snake.pop(); // Ensure the snake does not grow

    // Auto seek apple
    seekApple();

    // Remove expired burn instances
    burnInstances = burnInstances.filter(burn => Date.now() - burn.timestamp < 1000);
}

function seekApple() {
    const head = snake[0];
    if (head.x < apple.x) {
        direction = { x: gridSize, y: 0 };
    } else if (head.x > apple.x) {
        direction = { x: -gridSize, y: 0 };
    } else if (head.y < apple.y) {
        direction = { x: 0, y: gridSize };
    } else if (head.y > apple.y) {
        direction = { x: 0, y: -gridSize };
    }
}

function resetGame() {
    snake = [
        { x: 200, y: 200 },
        { x: 180, y: 200 },
        { x: 160, y: 200 },
        { x: 140, y: 200 },
        { x: 120, y: 200 }
    ];
    direction = { x: gridSize, y: 0 };
    apple = randomGridPosition();
    burnInstances = [];
    speed = 100;
    burnLogicActive = false;
    attempts = 0;
}

function burnAppleArea() {
    const burnStartX = apple.x - gridSize;
    const burnStartY = apple.y - gridSize;
    const burnInstance = {
        x: burnStartX,
        y: burnStartY,
        timestamp: Date.now()
    };

    burnInstances.push(burnInstance);

    // Increment attempts counter
    attempts++;

    // Activate burn logic for one update cycle
    burnLogicActive = true;

    // Remove the burn visual after 1 second
    setTimeout(() => {
        burnInstances = burnInstances.filter(b => b !== burnInstance);
    }, 1000);
}

function showBurnIndicator() {
    const burnIndicator = document.getElementById("burnIndicator");
    burnIndicator.style.display = "block";
    setTimeout(() => {
        burnIndicator.style.display = "none";
    }, 1000);
}

window.addEventListener("keydown", (e) => {
    if (e.key === "Enter") burnAppleArea();
});


canvas.addEventListener("touchstart", () => {
    burnAppleArea();
});

function gameLoop() {
    update();
    draw();
    setTimeout(gameLoop, speed);
}
