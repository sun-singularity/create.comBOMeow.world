document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("reloaded") === "true") {
    localStorage.removeItem("reloaded");
  }

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const engine = Matter.Engine.create();
  const world = engine.world;
  engine.world.gravity.y = 1;

  let gameFinished = false;

  const containerImage = new Image();
  containerImage.src = 'container.png';

  const bottomContainer = createContainerPart(250, 550, 250, 20); // Moved out to access in update function
  const containers = [
    createContainerPart(250, 80, 200, 20),
    createContainerPart(150, 400, 20, 250),
    createContainerPart(350, 400, 20, 250),
    bottomContainer
  ];
  Matter.World.add(world, containers);
  
  const cubeImage = new Image();
  cubeImage.src = 'cube.png';
  
  const ballImage = new Image();
  ballImage.src = 'ball.png';
  
  let fallenBalls = 0;  // Count how many balls have fallen

  let spawnX = 250; // Center of the canvas
  let spawnY = 120;  // Starting height
  let cubeSize = 40; // Size of the cube

  spawnBall(150, 220, 40);
  spawnBall(350, 220, 40);

  let bottomContainerDirection = 1; // 1 for moving right, -1 for moving left
  const maxShift = 100; // Max distance to move from the center
  const shiftSpeed = 1; // Speed of the container movement

  let freezeTime = 0; // Variable to track the freeze time
  const freezeDuration = 5000; // 5 seconds in milliseconds
  let playerAttempts = 0; // Variable to track player attempts

  setInterval(() => {
    Matter.Engine.update(engine);
    updateBottomContainer(); // Update the position of the bottom container
    removeFallenBalls(canvas, engine, world);
    draw();
  }, 1000 / 60);

  canvas.addEventListener("click", () => {
    spawnCubes();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      spawnCubes();
    }
  });

  function updateBottomContainer() {
    const currentX = bottomContainer.position.x;
    if (currentX >= 250 + maxShift) {
      bottomContainerDirection = -1;
    } else if (currentX <= 250 - maxShift) {
      bottomContainerDirection = 1;
    }

    Matter.Body.setVelocity(bottomContainer, { x: shiftSpeed * bottomContainerDirection, y: 0 });
    Matter.Body.setPosition(bottomContainer, { x: currentX + shiftSpeed * bottomContainerDirection, y: bottomContainer.position.y });
  }

  function spawnBall(x, y, size) {
    let ball = Matter.Bodies.circle(x, y, size / 2, {
      restitution: 1,
      friction: 0.1,
      density: 0.1,
      label: "ball",
      render: {
        sprite: {
          texture: 'ball.png',
          xScale: size / 100,
          yScale: size / 100
        }
      }
    });
    Matter.World.add(world, ball);
  }

  function spawnCubes() {
    if (Date.now() - freezeTime < freezeDuration) {
      return; // If still in cooldown period, do nothing
    }

    freezeTime = Date.now(); // Reset the freeze time
    playerAttempts++; // Increment the player attempts count

    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        spawnCube();
      }, i * 1000); // Delay each cube spawn by 0.2 seconds
    }
  }

  function spawnCube() {
    let cube = Matter.Bodies.rectangle(spawnX, spawnY, cubeSize, cubeSize, {
      restitution: 0.01,
      friction: 5,
      density: 0.01,
      label: "cube",
      render: {
        sprite: {
          texture: 'cube.png',
          xScale: 1,
          yScale: 1,
        },
      },
    });
    Matter.World.add(world, cube);
  }

  function drawSpawnIndicator() {
    ctx.fillStyle = "rgba(255, 165, 0, 0.5)"; // Orange color with opacity
    ctx.fillRect(spawnX - cubeSize / 2, spawnY - cubeSize / 2, cubeSize, cubeSize);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawSpawnIndicator();

    Matter.Composite.allBodies(engine.world).forEach((body) => {
      const vertices = body.vertices;
      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let v of vertices) {
        ctx.lineTo(v.x, v.y);
      }
      ctx.closePath();
      ctx.stroke();

      if (body.label === "cube") {
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        ctx.drawImage(cubeImage, -20, -20, 40, 40);
        ctx.restore();
      } else if (body.label === "container") {
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        const width = vertices[1].x - vertices[0].x;
        const height = vertices[2].y - vertices[1].y;
        ctx.drawImage(containerImage, -width / 2, -height / 2, width, height);
        ctx.restore();
      } else if (body.label === "ball") {
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        // Ensure the image size scales based on the body's circleRadius
        let radius = body.circleRadius;
        ctx.drawImage(ballImage, -radius, -radius, radius * 2, radius * 2);
        ctx.restore();
      }
    });

    ctx.font = "20px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "right";
    ctx.fillText("Attempts: " + playerAttempts, canvas.width - 10, 30); // Display player attempts

    // Display freeze countdown
    if (Date.now() - freezeTime < freezeDuration) {
      const remainingTime = Math.ceil((freezeDuration - (Date.now() - freezeTime)) / 1000);
      ctx.font = "30px Arial";
      ctx.fillStyle = "red";
      ctx.textAlign = "center";
      ctx.fillText("Wait: " + remainingTime + "s", canvas.width / 2, canvas.height / 2);
    }
  }

  function countCubes(engine) {
    return Matter.Composite.allBodies(engine.world).filter(
      (body) => body.label === "cube"
    ).length;
  }

  function removeFallenBalls(canvas, engine, world) {
    const bodies = Matter.Composite.allBodies(engine.world);
    for (let body of bodies) {
      if (body.label === "cube" && body.position.y > canvas.height + 20) {
        Matter.World.remove(world, body);
      }
      if (body.label === "ball" && body.position.y > canvas.height + 20) {
        Matter.World.remove(world, body);
        fallenBalls++;
      }
      if (fallenBalls === 2 && !gameFinished) {
        gameFinished = true; // Set the flag to true to prevent future triggers
        alert("Finish");
        window.setTimeout(() => window.location.reload(), 1000);  // Reload the webpage after 1 second
      }
    }
  }

  function createContainerPart(x, y, width, height) {
    return Matter.Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      label: "container",
      render: {
        sprite: {
          texture: 'container.png',
          xScale: width / 100,
          yScale: height / 20,
        },
      },
    });
  }
});
