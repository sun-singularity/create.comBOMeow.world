// MatterJS module aliases
const Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Body = Matter.Body,
  Events = Matter.Events;

// Create an engine
const engine = Engine.create();
const world = engine.world;

// Set gravity to zero
engine.world.gravity.y = 0;

// Create a renderer
const render = Render.create({
  element: document.getElementById("game-container"),
  engine: engine,
  options: {
    width: 600,
    height: 800,
    wireframes: false,
    background: "#f0f0f0",
  },
});

Render.run(render);

// Create runner
const runner = Runner.create();
Runner.run(runner, engine);

// Game variables
const balloonRadius = 30;
const gunX = 300;
const gunY = 750;
let score = 0;
let countdown = 30;
let intervalId;
let balloonResetTimeout;
let direction = 1;

// Hardcoded balloon positions and colors
const balloonPositions = [
  { x: 100, y: 100, color: "#ffd700" },
  { x: 200, y: 100, color: "#c0c0c0" },
  { x: 300, y: 100, color: "#cd7f32" },
  { x: 400, y: 100, color: "#00ff00" },
  { x: 500, y: 100, color: "#0000ff" },
  { x: 100, y: 200, color: "#ff4500" },
  { x: 200, y: 200, color: "#ffd700" },
  { x: 300, y: 200, color: "#c0c0c0" },
  { x: 400, y: 200, color: "#cd7f32" },
  { x: 500, y: 200, color: "#00ff00" },
  { x: 100, y: 300, color: "#0000ff" },
  { x: 200, y: 300, color: "#ff4500" },
  { x: 300, y: 300, color: "#ffd700" },
  { x: 400, y: 300, color: "#c0c0c0" },
  { x: 500, y: 300, color: "#cd7f32" },
  { x: 100, y: 400, color: "#00ff00" },
  { x: 200, y: 400, color: "#0000ff" },
  { x: 300, y: 400, color: "#ff4500" },
  { x: 400, y: 400, color: "#ffd700" },
  { x: 500, y: 400, color: "#c0c0c0" },
  { x: 100, y: 500, color: "#cd7f32" },
  { x: 200, y: 500, color: "#00ff00" },
  { x: 300, y: 500, color: "#0000ff" },
  { x: 400, y: 500, color: "#ff4500" },
  { x: 500, y: 500, color: "#ffd700" },
];

// Mapping color to score
const colorToScore = {
  "#ffd700": 10,
  "#c0c0c0": 20,
  "#cd7f32": 50,
  "#00ff00": 100,
  "#0000ff": 200,
  "#ff4500": 500,
  white: 0,
};

// Function to create balloons
function createBalloon(x, y, color) {
  return Bodies.circle(x, y, balloonRadius, {
    label: "balloon",
    isStatic: true,
    render: {
      fillStyle: color,
    },
    color: color,
    collisionFilter: {
      category: 0x0002, // Different category from bullets
      mask: 0x0002,
    },
  });
}

// Initialize balloons
const balloons = balloonPositions.map((pos) =>
  createBalloon(pos.x, pos.y, pos.color)
);
Composite.add(world, balloons);

// Create the gun
const gun = Bodies.rectangle(gunX, gunY, 60, 20, {
  label: "gun",
  isStatic: true,
  render: { fillStyle: "red" },
});
Composite.add(world, gun);

// Create the walls
const leftWall = Bodies.rectangle(-10, 400, 20, 800, {
  isStatic: true,
  render: { fillStyle: "grey" },
  collisionFilter: {
    category: 0x0001, // Same category as bullets
    mask: 0xffffffff, // Collide with everything
  },
  restitution: 1, // Perfectly elastic collision
});

const rightWall = Bodies.rectangle(610, 400, 20, 800, {
  isStatic: true,
  render: { fillStyle: "grey" },
  collisionFilter: {
    category: 0x0001, // Same category as bullets
    mask: 0xffffffff, // Collide with everything
  },
  restitution: 1, // Perfectly elastic collision
});

Composite.add(world, [leftWall, rightWall]);

// Function to shoot a bullet
function shootBullet() {
  const angle = gun.angle - Math.PI / 2; // Adjusting angle to match gun rotation
  const bullet = Bodies.circle(
    gun.position.x + Math.cos(angle) * 40,
    gun.position.y + Math.sin(angle) * 40,
    10,
    {
      label: "bullet",
      render: { fillStyle: "black" },
      frictionAir: 0,
      restitution: 1, // Perfectly elastic collision
      collisionFilter: {
        category: 0x0001,
        mask: 0x0001, // Collide only with walls
      },
    }
  );
  Body.setVelocity(bullet, {
    x: 5 * Math.cos(angle),
    y: 5 * Math.sin(angle),
  });
  Composite.add(world, bullet);

  // Reset the countdown timer
  resetCountdownTimer();
}

// Event listener for shooting
document.addEventListener("click", shootBullet);
document.addEventListener("keydown", function (event) {
  if (event.keyCode === 13) {
    shootBullet();
  }
});

// Reset countdown timer
function resetCountdownTimer() {
  clearInterval(intervalId);
  clearTimeout(balloonResetTimeout);
  countdown = 30;
  updateProgressBar();
  intervalId = setInterval(() => {
    countdown -= 1;
    updateProgressBar();
    if (countdown === 0) {
      clearInterval(intervalId);
      resetBalloons();
    }
  }, 1000);
}

// Function to update progress bar
function updateProgressBar() {
  const progressBar = document.getElementById("progress-bar");
  progressBar.style.width = `${(countdown / 30) * 100}%`;
}

// Function to reset balloons
function resetBalloons() {
  balloons.forEach((balloon) => {
    const newColor = Object.keys(colorToScore).filter(
      (color) => color !== "white"
    )[Math.floor(Math.random() * (Object.keys(colorToScore).length - 1))];
    balloon.render.fillStyle = newColor;
    balloon.color = newColor;
  });
}

// Function to show game over dialog
function showGameOverDialog() {
  const dialog = document.getElementById("game-over-dialog");
  dialog.style.display = "block";
}

// Function to restart the game
function restartGame() {
  const dialog = document.getElementById("game-over-dialog");
  dialog.style.display = "none";
  score = 0;
  document.getElementById("score-value").textContent = score;
  resetBalloons();
  resetCountdownTimer();
}

// Function to check for game over
function checkGameOver() {
  const allBlack = balloons.every(
    (balloon) => balloon.render.fillStyle === "white"
  );
  if (allBlack) {
    clearInterval(intervalId);
    showGameOverDialog();
  }
}

// Manually check for collisions
Events.on(engine, "beforeUpdate", function () {
  const bullets = Composite.allBodies(world).filter(
    (body) => body.label === "bullet"
  );
  bullets.forEach((bullet) => {
    balloons.forEach((balloon) => {
      if (Matter.Bounds.overlaps(bullet.bounds, balloon.bounds)) {
        // Add score
        score += colorToScore[balloon.render.fillStyle];
        document.getElementById("score-value").textContent = score;

        // Change balloon color to white
        balloon.render.fillStyle = "white";

        // Check for game over
        checkGameOver();
      }
    });

    // Check if the bullet is off-screen
    if (
      bullet.position.y < 0 ||
      bullet.position.x < 0 ||
      bullet.position.x > 600 ||
      bullet.position.y > 800
    ) {
      Composite.remove(world, bullet);
    }
  });
});

// Smoothly rotate the gun back and forth
let currentAngle = -Math.PI / 3;
const maxAngle = Math.PI / 3;
const angleStep = 0.01; // Small step for smooth transition

function rotateGun() {
  currentAngle += angleStep * direction;
  if (currentAngle >= maxAngle || currentAngle <= -maxAngle) {
    direction *= -1; // Reverse direction when reaching the limits
  }
  Body.setAngle(gun, currentAngle);
}

setInterval(rotateGun, 16); // Approximately 60 frames per second
