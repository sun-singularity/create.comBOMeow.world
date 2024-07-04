const canvas = document.getElementById("animationCanvas");
const ctx = canvas.getContext("2d");

const layerControls = document.getElementById("layerControls");

// Define layers
const layers = [
  { imageSrc: "layer1.png", angle: 0, speed: 1, opacity: 1, padding: 0 },
  { imageSrc: "layer2.png", angle: 0, speed: 2, opacity: 1, padding: 0 },
  { imageSrc: "layer3.png", angle: 0, speed: 3, opacity: 1, padding: 0 },
  { imageSrc: "layer4.png", angle: 0, speed: 4, opacity: 1, padding: 0 },
];

// Load images
const images = [];
layers.forEach((layer, index) => {
  const img = new Image();
  img.src = layer.imageSrc;
  img.onload = () => {
    images[index] = img;
    if (images.length === layers.length) {
      requestAnimationFrame(animate);
    }
  };

  // Add controls
  const control = document.createElement("div");
  control.classList.add("layer");
  control.innerHTML = `
    <div class="layer-header" data-layer="${index}">Layer ${index + 1}</div>
    <div class="layer-content" id="layerContent${index}">
      <label>Direction: 
        <input type="range" data-layer="${index}" class="angle" value="${
    layer.angle
  }" min="0" max="360">
      </label><br>
      <label>Speed: 
        <input type="range" data-layer="${index}" class="speed" value="${
    layer.speed
  }" min="0" max="5" step="0.1">
      </label><br>
      <label>Opacity: 
        <input type="range" data-layer="${index}" class="opacity" value="${
    layer.opacity
  }" min="0" max="1" step="0.1">
      </label><br>
      <label>Padding: 
        <input type="range" data-layer="${index}" class="padding" value="${
    layer.padding
  }" min="0" max="200">
      </label>
    </div>
  `;
  layerControls.appendChild(control);
});

// Animation state
let xPositions = new Array(layers.length).fill(0);
let yPositions = new Array(layers.length).fill(0);

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  layers.forEach((layer, index) => {
    ctx.globalAlpha = layer.opacity;
    const img = images[index];
    const angle = layer.angle * (Math.PI / 180); // Convert angle to radians
    let x = xPositions[index];
    let y = yPositions[index];

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    for (let i = x; i < canvas.width; i += img.width + layer.padding) {
      for (let j = y; j < canvas.height; j += img.height + layer.padding) {
        ctx.drawImage(img, i, j);
      }
      for (
        let j = y - img.height - layer.padding;
        j > -img.height;
        j -= img.height + layer.padding
      ) {
        ctx.drawImage(img, i, j);
      }
    }
    for (
      let i = x - img.width - layer.padding;
      i > -img.width;
      i -= img.width + layer.padding
    ) {
      for (let j = y; j < canvas.height; j += img.height + layer.padding) {
        ctx.drawImage(img, i, j);
      }
      for (
        let j = y - img.height - layer.padding;
        j > -img.height;
        j -= img.height + layer.padding
      ) {
        ctx.drawImage(img, i, j);
      }
    }

    ctx.restore();

    xPositions[index] += layer.speed * Math.cos(angle);
    yPositions[index] += layer.speed * Math.sin(angle);

    if (xPositions[index] > img.width + layer.padding) xPositions[index] = 0;
    if (xPositions[index] < -(img.width + layer.padding)) xPositions[index] = 0;
    if (yPositions[index] > img.height + layer.padding) yPositions[index] = 0;
    if (yPositions[index] < -(img.height + layer.padding))
      yPositions[index] = 0;
  });

  requestAnimationFrame(animate);
}

// Event listeners for controls
layerControls.addEventListener("change", (event) => {
  const layerIndex = event.target.getAttribute("data-layer");
  const value = event.target.value;

  if (event.target.classList.contains("angle")) {
    layers[layerIndex].angle = parseInt(value, 10);
  } else if (event.target.classList.contains("speed")) {
    layers[layerIndex].speed = parseFloat(value);
  } else if (event.target.classList.contains("opacity")) {
    layers[layerIndex].opacity = parseFloat(value);
  } else if (event.target.classList.contains("padding")) {
    layers[layerIndex].padding = parseInt(value, 10);
  }
});

// Collapsible layer controls
layerControls.addEventListener("click", (event) => {
  if (event.target.classList.contains("layer-header")) {
    const layerIndex = event.target.getAttribute("data-layer");
    const content = document.getElementById(`layerContent${layerIndex}`);
    content.style.display =
      content.style.display === "block" ? "none" : "block";
  }
});
