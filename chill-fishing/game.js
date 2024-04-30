const gridElements = document.querySelectorAll('.grid');
const levelSpan = document.getElementById('level');
const popup = document.getElementById('prize-popup');
const countdownElement = document.getElementById('countdown');
let gridContents = Array(14).fill(true);  // All grids start with fish
let currentLevel = 1;
gridContents[0] = false;  // Initial configuration without a fish in grid 0

let gameInterval;  // Declare outside to manage its state globally

function updateGrids() {
    gridContents.unshift(gridContents.pop()); // Rotate array right
    updateGridVisuals();
}

function updateGridVisuals() {
    gridContents.forEach((hasFish, index) => {
        const fishImage = hasFish ? 'grid_with_fish.png' : 'grid_without_fish.png';
        gridElements[index].style.backgroundImage = `url(${fishImage})`;
    });
}

function checkGridNine() {
    const cat = document.getElementById('cat');
    cat.style.animationName = 'catCatch';  // Apply the catch animation

    // Stop fish movement during the catch animation
    clearInterval(gameInterval);
    gameInterval = null;  // Ensure the interval is cleared

    // Resume fish movement after a hardcoded delay of 500 milliseconds (0.5 seconds)
    setTimeout(() => {
        startGame();  // Resume fish movement after the pause
        cat.style.animationName = 'none';  // Reset the animation
    }, 500);  // Half a second delay matches the animation duration

    if (gridContents[9]) {
        gridContents[9] = false;
        currentLevel++;
        levelSpan.textContent = currentLevel;
        updateGridVisuals(); // Immediate visual update of Grid 9
        if (!gridContents.includes(true)) {
            setTimeout(() => {
                triggerScanner();
                location.reload();
            },3000);
            showPrizePopup();
        }
    } else {
        setTimeout(() => {
            triggerScanner();
            location.reload();
        },3000);
        showPrizePopup();
    }
}

function startGame() {
    if (!gameInterval) {
        gameInterval = setInterval(updateGrids, 500);  // Fishes rotate every second
    }
}

function triggerScanner() {
    console.log("Scanner triggered"); // Diagnostic log
    if (window.Android) {
        window.Android.startScanner();
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
};
