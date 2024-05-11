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
let accelerationFactor = 0.9; // Each level will speed up the game by 10%
let prizeConfig = {
    thirdPrizeThreshold: 5,
    secondPrizeThreshold: 10,
    firstPrizeThreshold: 11,
};


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
                showCatchDialog(true, () => {
                    // Optionally place actions here if needed after showing success message
                });
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
            }, 6000);
            showCatchDialog(true, () => {
                showPrizePopup(); // Show prize popup after showing fail dialog
             });
        }
    } else {
        animateCatCatch(false); // Use failing animation for failure
        setTimeout(() => {
            triggerScanner();
            location.reload();
        }, 6000);
        showCatchDialog(false, () => {
           showPrizePopup(); // Show prize popup after showing fail dialog
        });
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

/* config */
function showConfigPopup() {
    document.getElementById('config-popup').style.display = 'block';
}

function updateConfig() {
    const newConfig = {
        accelerationFactor: parseFloat(document.getElementById('accel-factor').value),
        thirdPrizeThreshold: parseInt(document.getElementById('third-prize-threshold').value, 10),
        secondPrizeThreshold: parseInt(document.getElementById('second-prize-threshold').value, 10),
        firstPrizeThreshold: parseInt(document.getElementById('first-prize-threshold').value, 10)
    };

    if (newConfig.accelerationFactor >= 0.1 && newConfig.accelerationFactor <= 2) {
        localStorage.setItem('gameConfig', JSON.stringify(newConfig)); // Store the config in localStorage
        loadConfig(); // Reload configuration to apply changes
        console.log("Configuration updated:", newConfig);
    } else {
        alert("Please enter valid values for all configurations.");
    }
    document.getElementById('config-popup').style.display = 'none'; // Close the config popup
}
function loadConfig() {
    const configString = localStorage.getItem('gameConfig');
    if (configString) {
        const config = JSON.parse(configString);
        document.getElementById('accel-factor').value = config.accelerationFactor;
        document.getElementById('third-prize-threshold').value = config.thirdPrizeThreshold;
        document.getElementById('second-prize-threshold').value = config.secondPrizeThreshold;
        document.getElementById('first-prize-threshold').value = config.firstPrizeThreshold;

        // Update global config variable
        prizeConfig = config;

        // Update game variables
        accelerationFactor = config.accelerationFactor;
        updateGameSpeed(); // Update game speed based on stored factor
        console.log("Configuration loaded:", config);
    }

    document.getElementById('display-first-prize').textContent = prizeConfig.firstPrizeThreshold;
    document.getElementById('display-second-prize').textContent = prizeConfig.secondPrizeThreshold;
    document.getElementById('display-third-prize').textContent = prizeConfig.thirdPrizeThreshold;
}

// Add event listener to level display to show config popup
document.getElementById('level-display').addEventListener('click', function(event) {
    event.stopPropagation(); // Prevent propagation to stop triggering checkGridNine
    showConfigPopup();
});

// Ensure clicks on the config popup itself do not propagate
document.getElementById('config-popup').addEventListener('click', function(event) {
    event.stopPropagation();
});


function triggerScanner() {
    console.log("Scanner triggered");
    const finalLevel = currentLevel - 1; // Assuming currentLevel increments before game over
    let prizeMessage = "Got No Prize";
    let scannerArgument = "noPrize";  // Default argument for the scanner

    if (finalLevel >= prizeConfig.firstPrizeThreshold) {
        prizeMessage = "Got First Prize!";
        scannerArgument = "firstPrize";
    } else if (finalLevel >= prizeConfig.secondPrizeThreshold) {
        prizeMessage = "Got Second Prize!";
        scannerArgument = "secondPrize";
    } else if (finalLevel >= prizeConfig.thirdPrizeThreshold) {
        prizeMessage = "Got Third Prize!";
        scannerArgument = "thirdPrize";
    }

    alert(`Game Over! ${prizeMessage}`);

    if (window.Android) {
        window.Android.startScanner(scannerArgument); // Pass the specific prize argument to Android
    } else {
        console.log(prizeMessage); // Log prize message if not running on Android
    }
}

function showCatchDialog(success, callback) {
    const dialog = document.getElementById('catch-dialog');
    const image = document.getElementById('catch-result-image');
    const message = document.getElementById('catch-dialog-message');

    // Set image and message based on success
    if (success) {
        image.src = 'happy.png'; // Ensure you have 'happy.png' in your assets
        message.textContent = 'Catch Success!';
    } else {
        image.src = 'sad.png'; // Ensure you have 'sad.png' in your assets
        message.textContent = 'Catch Fail';
    }

    // Display the dialog
    dialog.style.display = 'block';

    // Hide the dialog after 3 seconds and call the callback
    setTimeout(() => {
        dialog.style.display = 'none';
        if (callback) {
            callback(); // Execute callback after the dialog is removed
        }
    }, 3000); // Remove the dialog after 3 seconds
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
    loadConfig();
    updateGridVisuals();
    startGame();
    animateCat();
};
