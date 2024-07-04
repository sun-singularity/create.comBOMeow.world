const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
let isDrawing = false;
let path = [];
let carImage = new Image();
carImage.src = "car.png"; // Make sure you have a car.png image in the same directory
let speed = 5;

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  path = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
  path.push({ x: e.offsetX, y: e.offsetY });
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    path.push({ x: e.offsetX, y: e.offsetY });
  }
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

document.getElementById("playButton").addEventListener("click", () => {
  if (path.length > 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Hide the path
    moveCar(0);
  }
});

document.getElementById("redrawButton").addEventListener("click", () => {
  clearPath();
});

document.getElementById("speedSlider").addEventListener("input", (e) => {
  speed = 11 - e.target.value; // Adjust speed (higher value = slower speed)
});

function moveCar(index) {
  if (index < path.length) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(carImage, path[index].x - 15, path[index].y - 10, 30, 20);
    setTimeout(() => moveCar(index + 1), speed * 10); // Adjust speed here
  } else {
    redrawPath(); // Show the path again after play
  }
}

function redrawPath() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.stroke();
}

function clearPath() {
  path = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
