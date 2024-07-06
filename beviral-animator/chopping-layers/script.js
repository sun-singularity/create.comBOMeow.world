const canvas = document.getElementById("animationCanvas");
const ctx = canvas.getContext("2d");

const topImages = [];
const bottomImages = [];
const backgroundImage = new Image();
backgroundImage.src = "background.png"; // Set the source of your background image
const mid1Image = new Image();
mid1Image.src = "mid_1.png";
const mid2Image = new Image();
mid2Image.src = "mid_2.png";

let currentTopImageIndex = 0;
let currentBottomImageIndex = 0;
let midImageDirection = 1; // 1 for down, -1 for up
let midImageY = 0; // Initial Y position for mid images
let currentMidImage = mid1Image;
let downMoveCount = 0; // To track the number of times mid.png has moved down

function loadImages(prefix, count, collection) {
  for (let i = 1; i <= count; i++) {
    const img = new Image();
    img.src = `${prefix}_${i}.png`;
    collection.push(img);
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function init() {
  loadImages("top", 3, topImages);
  loadImages("bottom", 3, bottomImages);

  setInterval(changeImages, 3000); // Change images every 3 seconds
  requestAnimationFrame(draw);
}

function changeImages() {
  currentTopImageIndex = randomInt(0, 2);
  currentBottomImageIndex = randomInt(0, 2);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background image
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

  // Draw bottom images (layer 1)
  const bottomImage = bottomImages[downMoveCount % 3];
  ctx.drawImage(bottomImage, 10, canvas.height - bottomImage.height - 10);

  // Draw mid images (layer 2)
  const yOffset = midImageY-200;
  const xOffset = canvas.width - currentMidImage.width + 200; // Adjust X position to be more in the top right corner
  ctx.drawImage(currentMidImage, xOffset, yOffset);

  // Draw top images (layer 3)
  const topImage = topImages[downMoveCount % 3];
  ctx.drawImage(topImage, canvas.width - topImage.width - 10, 10);

  // Update mid images position
  if (midImageY > 200) {
    midImageDirection = -1;
  } else if (midImageY < 0) {
    midImageDirection = 1;
  }

  midImageY += midImageDirection * 2; // Move up or down

  // Change mid image and update image set based on direction
  if (midImageDirection === 1) { // Moving down
    currentMidImage = mid2Image;
    // Increment the downMoveCount when moving down
    if (midImageY === 200) {
      downMoveCount = (downMoveCount + 1) % 3; // Cycle through 0, 1, 2
    }
  } else if (midImageDirection === -1) { // Moving up
    currentMidImage = mid1Image;
  }

  requestAnimationFrame(draw);
}

// Load images and start the animation
init();
