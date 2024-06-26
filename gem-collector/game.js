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
    background: 'transparent', // Make canvas background transparent
  },
});

Render.run(render);

// Create runner
const runner = Runner.create();
Runner.run(runner, engine);

// Game variables
const balloonRadius = 30; // Variable balloon size
const gunX = 300;
const gunY = 730;
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
  transparent: 0,
};

// Function to load images and return a promise
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Load all images and start the game
Promise.all([
  loadImage('rocket.png'),
  ...Array.from({ length: 8 }, (_, i) => loadImage(`gem-${i}.png`)),
])
  .then(([rocketImg, ...gemImages]) => {
    // Function to create balloons (gems)
    function createBalloon(x, y, color) {
      const gemIndex = Math.floor(Math.random() * gemImages.length);
      return Bodies.circle(x, y, balloonRadius, {
        label: "balloon",
        isStatic: true,
        render: {
          sprite: {
            texture: gemImages[gemIndex].src,
            xScale: (balloonRadius * 2) / gemImages[gemIndex].width,
            yScale: (balloonRadius * 2) / gemImages[gemIndex].height,
          },
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
    const gun = Bodies.rectangle(gunX, gunY, 30, 10, { // Half size
      label: "gun",
      isStatic: true,
      render: {
        sprite: {
          texture: rocketImg.src,
          xScale: 0.25, // Scale down to 50% opacity
          yScale: 0.25, // Scale down to 50% opacity
          opacity: 0.5, // Set opacity to 50%
        },
      },
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

    // Function to shoot a bullet (rocket)
    function shootBullet() {
      const angle = gun.angle - Math.PI / 2; // Adjusting angle to match gun rotation
      const bullet = Bodies.rectangle(
        gun.position.x + Math.cos(angle) * 40,
        gun.position.y + Math.sin(angle) * 40,
        20, // Double the width
        40, // Double the height
        {
          label: "bullet",
          render: {
            sprite: {
              texture: rocketImg.src,
              xScale: 0.2, // Double the size
              yScale: 0.2, // Double the size
            },
          },
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
      Body.setAngle(bullet, angle - Math.PI / 2); // Rotate 90 degrees anti-clockwise
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

    // Function to reset balloons (gems)
    function resetBalloons() {
      balloons.forEach((balloon) => {
        const newColor = Object.keys(colorToScore).filter(
          (color) => color !== "transparent"
        )[Math.floor(Math.random() * (Object.keys(colorToScore).length - 1))];
        const gemIndex = Math.floor(Math.random() * gemImages.length);
        balloon.render.sprite.texture = gemImages[gemIndex].src;
        balloon.render.sprite.xScale = (balloonRadius * 2) / gemImages[gemIndex].width;
        balloon.render.sprite.yScale = (balloonRadius * 2) / gemImages[gemIndex].height;
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
      window.location.reload();
    }

    // Function to check for game over
    function checkGameOver() {
      const allBlack = balloons.every(
        (balloon) => balloon.render.fillStyle === "rgba(0, 0, 0, 0)"
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
            score += colorToScore[balloon.color];
            document.getElementById("score-value").textContent = score;

            // Change balloon color to transparent
            balloon.render.fillStyle = "rgba(0, 0, 0, 0)";
            balloon.render.sprite.texture = ""; // Remove the texture to make it transparent

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
        } else {
          // Align the bullet angle with its velocity, adjusted for 90 degrees anti-clockwise
          const velocity = bullet.velocity;
          const angle = Math.atan2(velocity.y, velocity.x);
          Body.setAngle(bullet, angle + Math.PI / 2);
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

    // Attach the restartGame function to the window object to make it accessible globally
    window.restartGame = restartGame;
  })
  .catch((error) => {
    console.error(error);
  });
