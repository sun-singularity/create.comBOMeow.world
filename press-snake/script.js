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
let burnArea = [];
let speed = 100;
let burnVisualActive = false;
let burnLogicActive = false;
let burnVisualTimeout;
let burnLogicTimeout;
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
    snake.forEach(part => {
        ctx.fillStyle = "green";
        ctx.fillRect(part.x, part.y, gridSize, gridSize);
    });

    // Draw apple
    ctx.fillStyle = "red";
    ctx.fillRect(apple.x, apple.y, gridSize, gridSize);

    // Draw burn visual area
    if (burnVisualActive && burnArea.length > 0) {
        const burnX = Math.max(0, Math.min(burnArea[0].x, canvas.width - gridSize * 3));
        const burnY = Math.max(0, Math.min(burnArea[0].y, canvas.height - gridSize * 3));
        ctx.drawImage(burnImage, burnX, burnY, gridSize * 3, gridSize * 3);
    }

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
        burnArea.forEach(part => {
            if (part.x === head.x && part.y === head.y) {
                hit = true;
            }
        });
        if (hit) {
            if (snake.length > 1) {
                snake.pop(); // Shorten snake by removing the tail
                speed = Math.max(speed * 0.8, 20); // Increase speed by 20%, minimum speed is 20ms
            } else {
                setTimeout(function(){
                    alert("Game Over");
                    resetGame();
                    return;
                },100)
            }
        }
        burnLogicActive = false; // Deactivate burn logic after one check
    }

    snake.unshift(head);
    snake.pop(); // Ensure the snake does not grow

    // Auto seek apple
    seekApple();
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
    burnArea = [];
    speed = 100;
    burnVisualActive = false;
    burnLogicActive = false;
    clearTimeout(burnVisualTimeout);
    clearTimeout(burnLogicTimeout);
    attempts = 0;
}

function burnAppleArea() {
    const burnStartX = apple.x - gridSize;
    const burnStartY = apple.y - gridSize;
    burnArea = [];

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const burnX = burnStartX + (i * gridSize);
            const burnY = burnStartY + (j * gridSize);
            if (burnX >= 0 && burnX < canvas.width && burnY >= 0 && burnY < canvas.height) {
                burnArea.push({ x: burnX, y: burnY });
            }
        }
    }

    // Increment attempts counter
    attempts++;

    // Activate burn visual for 1 second
    burnVisualActive = true;
    draw();
    burnVisualTimeout = setTimeout(() => {
        burnVisualActive = false;
    }, 1000);

    // Activate burn logic for one update cycle
    burnLogicActive = true;
}

window.addEventListener("keydown", (e) => {
    if (e.key === "Enter") burnAppleArea();
});

window.addEventListener("click", () => {
    burnAppleArea();
});

function gameLoop() {
    update();
    draw();
    setTimeout(gameLoop, speed);
}
