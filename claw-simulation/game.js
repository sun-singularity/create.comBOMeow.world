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

  const containerImage = new Image();
  containerImage.src = 'container.png'; // Path to your container image

  const containers = [
    createContainerPart(250, 0, 200, 20), // top border
    createContainerPart(150, 275, 20, 550), // left border
    createContainerPart(350, 275, 20, 550), // right border
    createVShapePart(200, 500, 80, 20, Math.PI / 4), // left side of V
    createVShapePart(300, 500, 80, 20, -Math.PI / 4) // right side of V
  ];
  Matter.World.add(world, containers);

  const ballImage = new Image();
  ballImage.src = 'ball.png'; // Path to your ball image

  const clawImage = new Image();
  clawImage.src = 'claw.png'; // Path to your claw image

  for (let i = 0; i < 50; i++) {
    let xPosition = 200 + Math.random() * 100;
    let yPosition = 200 + Math.random() * 50;
    Matter.World.add(
      world,
      Matter.Bodies.circle(xPosition, yPosition, 20, {
        restitution: 0.1, // Low restitution for inelastic collisions
        friction: 0.2, // Adjust friction as needed
        density: 0.01,
        label: "circle",
        render: {
          sprite: {
            texture: 'ball.png', // Path to the ball image
            xScale: 0.5, // Adjust the scale if needed
            yScale: 0.5,
          },
        },
      })
    );
  }

  let claw = createClawWithString(world, pivotX, pivotY, 80, 40);

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
      Matter.World.remove(world, claw.string);
    }
    claw.string = Matter.Constraint.create({
      pointA: { x: pivotX, y: 0 },
      bodyB: claw.clawArm,
      pointB: { x: 0, y: 0 },
      stiffness: 0.05,
      length: pivotY,
    });
    Matter.World.add(world, claw.string);
  }

  function shiftPivot() {
    if (!clawMovingDown) {
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

      // Draw the ball image with rotation
      if (body.label === "circle") {
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        ctx.drawImage(ballImage, -20, -20, 40, 40); // Adjust the size accordingly
        ctx.restore();
      }

      // Draw the claw image with rotation
      if (body.label === "clawPart") {
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        ctx.drawImage(clawImage, -40, -20, 80, 40); // Adjust the size accordingly
        ctx.restore();
      }

      // Draw the container image for borders
      if (body.label === "container") {
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        const width = vertices[1].x - vertices[0].x;
        const height = vertices[2].y - vertices[1].y;
        ctx.drawImage(containerImage, -width / 2, -height / 2, width, height); // Adjust the size accordingly
        ctx.restore();
      }
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
    ctx.fillText("Push Count: " + activationCount, canvas.width - 10, 55);
  }

  setInterval(() => {
    Matter.Engine.update(engine);
    removeFallenBalls(canvas, engine, world);
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
        clawMovingDown = false;
      }, 5000);
      lastActivationTime = Date.now();
    }
  }

  function isClawDebounced() {
    return Date.now() - lastActivationTime < debouncePeriod;
  }
});

function createClawWithString(world, x, y, width, height) {
  const armOptions = {
    label: "clawPart",
    density: 0.02,
    render: {
      sprite: {
        texture: 'claw.png', // Path to the claw image
        xScale: width / 80, // Adjust the scale if needed
        yScale: height / 40,
      },
    },
  };

  const clawArm = Matter.Bodies.rectangle(x, y, width, height, armOptions);

  const string = Matter.Constraint.create({
    pointA: { x: x, y: 0 },
    bodyB: clawArm,
    pointB: { x: 0, y: -height / 2 },
    stiffness: 0.05,
    length: y - height / 2,
  });

  Matter.World.add(world, [clawArm, string]);

  return {
    clawArm,
    string,
  };
}

function createContainerPart(x, y, width, height) {
  return Matter.Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    label: "container",
    render: {
      sprite: {
        texture: 'container.png', // Path to the container image
        xScale: width / 80, // Adjust the scale if needed
        yScale: height / 20,
      },
    },
  });
}

function createVShapePart(x, y, length, width, angle) {
  return Matter.Bodies.rectangle(x, y, length, width, {
    isStatic: true,
    angle: angle,
    restitution: 0.1, // Low restitution for inelastic collisions
    friction: 0.5, // Adjust friction as needed
    label: "container",
    render: {
      sprite: {
        texture: 'container.png', // Path to the container image
        xScale: length / 100, // Adjust the scale if needed
        yScale: width / 20,
      },
    },
  });
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
      Matter.World.remove(world, body);
    }
  }
}
