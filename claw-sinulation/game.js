document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const engine = Matter.Engine.create();
    const world = engine.world;
    engine.world.gravity.y = 1;

    let clawMovingDown = false;
    let pivotX = 250;
    let pivotY = 50;

    const containers = [
        Matter.Bodies.rectangle(150, 350, 20, 300, { isStatic: true }),
        Matter.Bodies.rectangle(350, 350, 20, 300, { isStatic: true }),
        Matter.Bodies.rectangle(250, 500, 200, 20, { isStatic: true }),
        Matter.Bodies.rectangle(550, 350, 20, 300, { isStatic: true }),
        Matter.Bodies.rectangle(750, 350, 20, 300, { isStatic: true }),
        Matter.Bodies.rectangle(650, 500, 200, 20, { isStatic: true })
    ];
    Matter.World.add(world, containers);

    for (let i = 0; i < 50; i++) {
        let xPosition = 200 + Math.random() * 100;
        let yPosition = 200 + Math.random() * 50;
        Matter.World.add(world, Matter.Bodies.circle(xPosition, yPosition, 20, {
            restitution: 0.1, // Reduced restitution
            friction: 0.1,   // Reduced friction
            density: 0.001,
            label: 'circle'
        }));
    }
    let claw = createClawWithString(world, pivotX, pivotY, 80, 1);

    function updateClaw() {
        if (clawMovingDown && pivotY < 500) {
            pivotY += 2;
        } else if (!clawMovingDown && pivotY > 50) {
            pivotY -= 2;
        }
        recreateClawConstraint();  // Update the string constraint on every update
    }

    function recreateClawConstraint() {
        if (claw.string) {
            console.log('Removing old constraint');
            Matter.World.remove(world, claw.string);  // Ensure the old constraint is removed
        }
        claw.string = Matter.Constraint.create({
            pointA: { x: pivotX, y: 0 },
            bodyB: claw.clawArm,
            pointB: { x: 0, y: 0 },
            stiffness: 0.05,
            length: pivotY
        });
        Matter.World.add(world, claw.string);
        console.log('Adding new constraint');
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        Matter.Composite.allBodies(engine.world).forEach(body => {
            const vertices = body.vertices;
            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let v of vertices) {
                ctx.lineTo(v.x, v.y);
            }
            ctx.closePath();
            ctx.stroke();
        });
        Matter.Composite.allConstraints(engine.world).forEach(constraint => {
            ctx.beginPath();
            ctx.moveTo(constraint.pointA.x, constraint.pointA.y);
            ctx.lineTo(constraint.bodyB.position.x + constraint.pointB.x, constraint.bodyB.position.y + constraint.pointB.y);
            ctx.stroke();
        });
        updateClaw();
        applyMagneticEffect(engine, claw);
    }

    setInterval(() => {
        Matter.Engine.update(engine);
        draw();
    }, 1000 / 60);

    document.addEventListener('keydown', (event) => {
        if (event.key === ' ') {
            clawMovingDown = !clawMovingDown; // This should toggle moving down, not claw open state
        } else if (event.key === 'ArrowUp') {
            clawMovingDown = false;
        } else if (event.key === 'ArrowDown') {
            clawMovingDown = true;
        }
    });

    document.addEventListener('keyup', (event) => {
        if (event.key === 'z' || event.key === 'Z') {
            clawMovingDown = false;
        }
    });
});

function createClawWithString(world, x, y, armLength, armThickness) {
    const armOptions = {
        label: 'clawPart',
        density: 0.02,
        render: {
            fillStyle: 'black'
        }
    };

    // Define the vertices of the V-shaped claw
    const halfWidth = armThickness / 2;
    const halfLength = armLength / 2;
    const vertices = [
        { x: x - halfLength, y: y + halfLength }, // Left bottom vertex
        { x: x, y: y - halfLength }, // Top vertex
        { x: x + halfLength, y: y + halfLength }  // Right bottom vertex
    ];

    // Create a body from the vertices
    const clawArm = Matter.Bodies.fromVertices(x, y, [vertices], armOptions, true);

    // Create a string constraint to attach to the top vertex of the V
    const string = Matter.Constraint.create({
        pointA: { x: x, y: 0 },
        bodyB: clawArm,
        pointB: { x: 0, y: -halfLength }, // Attach to the top point of the V
        stiffness: 0.05,
        length: y - halfLength // Adjusted to account for the vertex position
    });

    Matter.World.add(world, [clawArm, string]);

    return {
        clawArm,
        string
    };
}



function applyMagneticEffect(engine, claw) {
    const attractionStrength = 0.05; // Further increased strength for more visible effect
    const maxDistance = 100; // Adjust if needed to cover the desired area of effect

    Matter.Composite.allBodies(engine.world).forEach(body => {
        if (body.label === 'circle') {
            const ball = body;
            const arm = claw.clawArm;
            const distance = Matter.Vector.magnitude(Matter.Vector.sub(ball.position, arm.position));

            if (distance < maxDistance && distance > 0) { // Ensure distance is not zero to avoid division by zero
                const forceMagnitude = (attractionStrength / (distance * distance)); // Using inverse square law for more physical accuracy
                const forceDirection = Matter.Vector.normalise(Matter.Vector.sub(arm.position, ball.position));
                const force = Matter.Vector.mult(forceDirection, forceMagnitude);
                Matter.Body.applyForce(ball, ball.position, force);

                console.log(`Force: ${JSON.stringify(force)}, Distance: ${distance}`);
            }
        }
    });
}


function attachBallToClaw(world, ball, clawPart) {
    const stickyConstraint = Matter.Constraint.create({
        bodyA: ball,
        bodyB: clawPart,
        stiffness: 0.02,
        length: 0
    });
    ball.stickyConstraint = stickyConstraint;
    Matter.World.add(world, stickyConstraint);
}

function detachBallFromClaw(ball) {
    if (ball.stickyConstraint) {
        Matter.World.remove(world, ball.stickyConstraint);
        ball.stickyConstraint = null;
    }
}
