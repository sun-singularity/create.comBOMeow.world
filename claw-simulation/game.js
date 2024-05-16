document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const engine = Matter.Engine.create();
  const world = engine.world;
  engine.world.gravity.y = 1;

  let clawMovingDown = false;
  let pivotX = 250;
  let pivotY = 50;
  let movingRight = true;
  let maxShift = 50;
  let lastActivationTime = 0;
  let activationCount = 0;
  const debouncePeriod = 5000;

  const containers = [
    Matter.Bodies.rectangle(250, 0, 200, 20, { isStatic: true }),
    Matter.Bodies.rectangle(150, 200, 20, 700, { isStatic: true }),
    Matter.Bodies.rectangle(350, 200, 20, 600, { isStatic: true }),
    Matter.Bodies.rectangle(250, 550, 200, 20, { isStatic: true }),
  ];
  Matter.World.add(world, containers);

  for (let i = 0; i < 50; i++) {
    let xPosition = 200 + Math.random() * 100;
    let yPosition = 200 + Math.random() * 50;
    Matter.World.add(
      world,
      Matter.Bodies.circle(xPosition, yPosition, 20, {
        restitution: 0.1, // Reduced restitution
        friction: 0.1, // Reduced friction
        density: 0.001,
        label: "circle",
      })
    );
  }
  let claw = createClawWithString(world, pivotX, pivotY, 80, 1);

  function updateClaw() {
    if (clawMovingDown && pivotY < 500) {
      pivotY += 2;
      updateClawConstraint();
    } else if (!clawMovingDown && pivotY > 50) {
      pivotY -= 2;
      updateClawConstraint();
    }
  }

  function updateClawConstraint() {
    if (claw.string) {
      console.log("Removing old constraint");
      Matter.World.remove(world, claw.string); // Ensure the old constraint is removed
    }
    claw.string = Matter.Constraint.create({
      pointA: { x: pivotX, y: 0 },
      bodyB: claw.clawArm,
      pointB: { x: 0, y: 0 },
      stiffness: 0.05,
      length: pivotY,
    });
    Matter.World.add(world, claw.string);
    console.log("Adding new constraint");
  }
  function shiftPivot() {
    if (!clawMovingDown) {
      // Only shift when not moving down
      if (pivotX >= 250 + maxShift) {
        movingRight = false;
      } else if (pivotX <= 250 - maxShift) {
        movingRight = true;
      }

      pivotX += movingRight ? 1 : -1;
      updateClawConstraint();
    }
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    Matter.Composite.allBodies(engine.world).forEach((body) => {
      const vertices = body.vertices;
      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let v of vertices) {
        ctx.lineTo(v.x, v.y);
      }
      ctx.closePath();
      ctx.stroke();
    });
    Matter.Composite.allConstraints(engine.world).forEach((constraint) => {
      ctx.beginPath();
      ctx.moveTo(constraint.pointA.x, constraint.pointA.y);
      ctx.lineTo(
        constraint.bodyB.position.x + constraint.pointB.x,
        constraint.bodyB.position.y + constraint.pointB.y
      );
      ctx.stroke();
    });
    updateClaw();
    shiftPivot();
    // Display the ball count
    const ballCount = countBalls(engine);
    if (ballCount === 0) {
      setTimeout(function () {
        window.location.reload();
      }, 3000);
    }
    ctx.font = "20px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "right";
    ctx.fillText("Ball Out: " + (50 - ballCount), canvas.width - 10, 30);
    ctx.fillText("Push Count: " + activationCount, canvas.width - 10, 55); // Display activation count below the ball count
  }

  setInterval(() => {
    Matter.Engine.update(engine);
    removeFallenBalls(canvas, engine, world); // Add this line to remove balls each frame
    draw();
  }, 1000 / 60);

  canvas.addEventListener("click", () => {
    triggerClaw();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      triggerClaw();
    }
  });

  function triggerClaw() {
    if (!clawMovingDown && !isClawDebounced()) {
      activationCount++;
      clawMovingDown = true;
      setTimeout(() => {
        clawMovingDown = false; // Automatically move claw up after 3 seconds
      }, 5000);
      lastActivationTime = Date.now(); // Update last activation time
    }
  }

  function isClawDebounced() {
    return Date.now() - lastActivationTime < debouncePeriod;
  }
});

function createClawWithString(world, x, y, armLength, armThickness) {
  const armOptions = {
    label: "clawPart",
    density: 0.02,
    render: {
      fillStyle: "black",
    },
  };

  // Define the vertices of the V-shaped claw
  const halfWidth = armThickness / 2;
  const halfLength = armLength / 2;
  const vertices = [
    { x: x - halfLength, y: y + halfLength }, // Left bottom vertex
    { x: x, y: y - halfLength }, // Top vertex
    { x: x + halfLength, y: y + halfLength }, // Right bottom vertex
  ];

  // Create a body from the vertices
  const clawArm = Matter.Bodies.fromVertices(
    x,
    y,
    [vertices],
    armOptions,
    true
  );

  // Create a string constraint to attach to the top vertex of the V
  const string = Matter.Constraint.create({
    pointA: { x: x, y: 0 },
    bodyB: clawArm,
    pointB: { x: 0, y: -halfLength }, // Attach to the top point of the V
    stiffness: 0.05,
    length: y - halfLength, // Adjusted to account for the vertex position
  });

  Matter.World.add(world, [clawArm, string]);

  return {
    clawArm,
    string,
  };
}

function countBalls(engine) {
  return Matter.Composite.allBodies(engine.world).filter(
    (body) => body.label === "circle"
  ).length;
}
function removeFallenBalls(canvas, engine, world) {
  const bodies = Matter.Composite.allBodies(engine.world);
  for (let body of bodies) {
    if (body.label === "circle" && body.position.y > canvas.height + 20) {
      // 20 is a buffer to ensure the ball is completely out of view
      Matter.World.remove(world, body);
    }
  }
}
