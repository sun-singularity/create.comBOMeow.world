document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("reloaded") === "true") {
    localStorage.removeItem("reloaded");
  }

  const CONFIG = {
    canvasWidth: 800,
    canvasHeight: 600,
    gravity: 1,
    spawnX: 400,
    spawnY: 100,
    cubeSize: 80,
    maxShift: 100,
    shiftSpeed: 1,
    freezeDuration: 5000,
    bottomContainer: {
      x: 450,
      y: 350,
      width: 550,
      height: 20,
      friction: 0.1,
    },
  };

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const engine = Matter.Engine.create();
  const world = engine.world;
  engine.world.gravity.y = CONFIG.gravity;

  let gameFinished = false;

  const containerImage = new Image();
  containerImage.src = "container.png";

  const bottomContainer = createContainerPart(
    CONFIG.bottomContainer.x,
    CONFIG.bottomContainer.y,
    CONFIG.bottomContainer.width,
    CONFIG.bottomContainer.height,
    CONFIG.bottomContainer.friction
  );
  const containers = [bottomContainer];
  Matter.World.add(world, containers);

  const ballImage = new Image();
  ballImage.src = "ball.png";

  const cubeImage = new Image();
  cubeImage.src = "cube.png";

  let fallenCubes = 0; // Count how many cubes have fallen

  spawnCube();

  let bottomContainerDirection = 1; // 1 for moving right, -1 for moving left
  let freezeTime = 0; // Variable to track the freeze time
  let playerAttempts = 0; // Variable to track player attempts

  setInterval(() => {
    Matter.Engine.update(engine);
    updateBottomContainer(); // Update the position of the bottom container
    removeFallenCubes(canvas, engine, world);
    draw();
  }, 1000 / 60);

  canvas.addEventListener("click", () => {
    spawnBalls();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      spawnBalls();
    }
  });

  function updateBottomContainer() {
    const currentX = bottomContainer.position.x;
    if (currentX >= CONFIG.spawnX + CONFIG.maxShift) {
      bottomContainerDirection = -1;
    } else if (currentX <= CONFIG.spawnX - CONFIG.maxShift) {
      bottomContainerDirection = 1;
    }

    Matter.Body.setVelocity(bottomContainer, {
      x: CONFIG.shiftSpeed * bottomContainerDirection,
      y: 0,
    });
    Matter.Body.setPosition(bottomContainer, {
      x: currentX + CONFIG.shiftSpeed * bottomContainerDirection,
      y: bottomContainer.position.y,
    });
  }

  function spawnCube() {
    let cube = Matter.Bodies.rectangle(
      CONFIG.spawnX,
      CONFIG.spawnY,
      CONFIG.cubeSize,
      CONFIG.cubeSize,
      {
        restitution: 0.1,
        friction: 100,
        density: 0.01,
        label: "cube",
        render: {
          sprite: {
            texture: "cube.png",
            xScale: 1,
            yScale: 1,
          },
        },
      }
    );
    Matter.World.add(world, cube);
  }

  function spawnBalls() {
    if (Date.now() - freezeTime < CONFIG.freezeDuration) {
      return; // If still in cooldown period, do nothing
    }

    freezeTime = Date.now(); // Reset the freeze time
    playerAttempts++; // Increment the player attempts count

    for (let i = 0; i < 1; i++) {
      setTimeout(() => {
        spawnBall(CONFIG.spawnX, CONFIG.spawnY, 40);
      }, i * 1000); // Delay each ball spawn by 1 second
    }
  }

  function spawnBall(x, y, size) {
    let ball = Matter.Bodies.circle(x, y, size / 2, {
      restitution: 1,
      friction: 0.05,
      density: 0.01,
      label: "ball",
      render: {
        sprite: {
          texture: "ball.png",
          xScale: size / 100,
          yScale: size / 100,
        },
      },
    });
    Matter.World.add(world, ball);
  }

  function drawSpawnIndicator() {
    ctx.fillStyle = "rgba(255, 165, 0, 0.5)"; // Orange color with opacity
    ctx.fillRect(
      CONFIG.spawnX - CONFIG.cubeSize / 2,
      CONFIG.spawnY - CONFIG.cubeSize / 2,
      CONFIG.cubeSize,
      CONFIG.cubeSize
    );
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

      if (body.label === "ball") {
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        ctx.drawImage(ballImage, -20, -20, 40, 40);
        ctx.restore();
      } else if (body.label === "container") {
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        const width = vertices[1].x - vertices[0].x;
        const height = vertices[2].y - vertices[1].y;
        ctx.drawImage(containerImage, -width / 2, -height / 2, width, height);
        ctx.restore();
      } else if (body.label === "cube") {
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        // Use width and height of the rectangle for drawing
        const width = vertices[1].x - vertices[0].x;
        const height = vertices[2].y - vertices[1].y;
        ctx.drawImage(cubeImage, -width / 2, -height / 2, width, height);
        ctx.restore();
      }
    });

    ctx.font = "20px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "right";
    ctx.fillText("Attempts: " + playerAttempts, canvas.width - 10, 30); // Display player attempts

    // Display freeze countdown
    if (Date.now() - freezeTime < CONFIG.freezeDuration) {
      const remainingTime = Math.ceil(
        (CONFIG.freezeDuration - (Date.now() - freezeTime)) / 1000
      );
      ctx.font = "30px Arial";
      ctx.fillStyle = "red";
      ctx.textAlign = "center";
      ctx.fillText(
        "Wait: " + remainingTime + "s",
        canvas.width / 2,
        canvas.height / 2
      );
    }
  }

  function removeFallenCubes(canvas, engine, world) {
    const bodies = Matter.Composite.allBodies(engine.world);
    for (let body of bodies) {
      if (body.label === "ball" && body.position.y > canvas.height + 20) {
        Matter.World.remove(world, body);
      }
      if (body.label === "cube" && body.position.y > canvas.height + 20) {
        Matter.World.remove(world, body);
        fallenCubes++;
      }
      if (fallenCubes === 1 && !gameFinished) {
        gameFinished = true; // Set the flag to true to prevent future triggers
        alert("Finish");
        window.setTimeout(() => window.location.reload(), 1000); // Reload the webpage after 1 second
      }
    }
  }

  function createContainerPart(x, y, width, height, friction) {
    return Matter.Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      friction: friction,
      label: "container",
      render: {
        sprite: {
          texture: "container.png",
          xScale: width / 100,
          yScale: height / 20,
        },
      },
    });
  }
});
