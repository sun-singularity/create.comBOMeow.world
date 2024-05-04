const gridElements = document.querySelectorAll('.grid');
const levelSpan = document.getElementById('level');
const popup = document.getElementById('prize-popup');
const countdownElement = document.getElementById('countdown');
let gridContents = Array(12).fill(true);  // All grids start with fish
let currentLevel = 1;
gridContents[0] = false;  // Initial configuration without a fish in grid 0

let gameInterval;  // Declare outside to manage its state globally
let animateCatInterval;  // Declare outside to manage its state globally
let catCatchTimeout;  // Declare outside to manage its state globally
const accelerationFactor = 0.9; // Each level will speed up the game by 10%


function updateGrids() {
    gridContents.unshift(gridContents.pop()); // Rotate array right
    updateGridVisuals();
}

function updateGridVisuals() {
    gridContents.forEach((hasFish, index) => {
        const fishImage = hasFish ? 'jar_with_fish.png' : 'jar_without_fish.png';
        gridElements[index].style.backgroundImage = `url(${fishImage})`;
    });
}
function animateCat() {
    clearInterval(animateCatInterval); // Clear any existing animation interval
    let currentFrame = 0;
    let direction = 1; // Direction of frame sequence, 1 for forward, -1 for backward

    animateCatInterval = setInterval(() => {
        const positions = ['0px', '-296px', '-592px', '-888px']; // Positions for the first four frames
        document.getElementById('cat').style.backgroundPosition = `${positions[currentFrame]} 0px`;
        
        // Update frame index based on direction
        if (currentFrame === 3) { // If at last frame, switch direction to backward
            direction = -1;
        } else if (currentFrame === 0) { // If at first frame, switch direction to forward
            direction = 1;
        }
        currentFrame += direction;
    }, 300); // Change frame every 300 milliseconds
}

function animateCatCatch(success) {
    clearInterval(animateCatInterval); // Clear normal animation interval
    const cat = document.getElementById('cat');

    if (success) {
        cat.style.backgroundPosition = '-0px -305px'; // First frame of second row - catching
        setTimeout(() => {
            cat.style.backgroundPosition = '-296px -305px'; // Second frame of second row - eating
            setTimeout(() => {
                animateCat(); // Resume normal animation after the catch and eat sequence
            }, 300); // Time for the eating frame
        }, 300); // Time for the catching frame
    } else {
        cat.style.backgroundPosition = '-0px -610px'; // First frame of third row - fail start
        setTimeout(() => {
            cat.style.backgroundPosition = '-296px -610px'; // Second frame of third row - fail end
            setTimeout(() => {
                animateCat(); // Resume normal animation after the fail sequence
            }, 300); // Time for the fail end frame
        }, 300); // Time for the fail start frame
    }
}



function checkGridNine() {
    clearInterval(gameInterval); // Stop fish movement
    clearInterval(animateCatInterval); // Stop cat normal animation
    clearTimeout(catCatchTimeout); // Ensure no pending catch animations

    const cat = document.getElementById('cat');
    cat.style.animationName = 'catCatch'; // Apply the catch animation

    setTimeout(() => {
        updateGameSpeed(); // Update game speed as level changes
        cat.style.animationName = 'none'; // Reset the animation
        animateCat(); // Restart normal cat animation
    }, 500);

    if (gridContents[9]) {
        gridContents[9] = false;
        currentLevel++;
        levelSpan.textContent = currentLevel;
        updateGridVisuals();
        animateCatCatch(true); // Use catching and eating animation for success
        if (!gridContents.includes(true)) {
            setTimeout(() => {
                triggerScanner();
                location.reload();
            }, 3000);
            showPrizePopup();
        }
    } else {
        animateCatCatch(false); // Use failing animation for failure
        setTimeout(() => {
            triggerScanner();
            location.reload();
        }, 3000);
        showPrizePopup();
    }
}


function updateGameSpeed() {
    const newInterval = 500 * Math.pow(accelerationFactor, currentLevel - 1); // Calculate new speed based on level
    clearInterval(gameInterval); // Clear the existing interval
    gameInterval = setInterval(updateGrids, newInterval); // Set a new interval with updated speed
}


function startGame() {
    if (!gameInterval) {
        updateGameSpeed();  // Initialize game speed when starting
    }
}

function triggerScanner() {
    console.log("Scanner triggered"); // Diagnostic log
    if (window.Android) {
        window.Android.startScanner("QWERTYZXCVBN");
    } else {
        alert("Game Over");
    }
}

function showPrizePopup() {
    popup.style.display = 'block';
}

document.addEventListener('click', checkGridNine);
document.addEventListener('keydown', function(event) {
    if (event.keyCode === 13) {  // 13 is the keycode for the Enter key
        checkGridNine();
    }
});
window.onload = function() {
    updateGridVisuals();
    startGame();
    animateCat();
};
