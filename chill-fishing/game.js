const gridElements = document.querySelectorAll('.grid');
const scanPopup = document.getElementById('scan-popup');
const countdownElement = document.getElementById('countdown');
let gridContents = Array(12).fill(true);  // All grids start with fish
gridContents[0] = false;  // Initial configuration without a fish in grid 0

let currentScore = 0;
let fishCaught = 0;

let defaultScoreValues = [200, 300, 350, 400, 450, 500, 550, 600, 650, 700, 1500];

let gameInterval;  // Declare outside to manage its state globally
let animateCatInterval;  // Declare outside to manage its state globally
let catCatchTimeout;  // Declare outside to manage its state globally
let accelerationFactor = 0.9; // Each level will speed up the game by 10%
let throttleTime = 3000; // Default throttle time
let inputBlocked = false; // Variable to block user inputs

const nextScoreSpan = document.getElementById('next-score-value');

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

function updateScore() {
    if (fishCaught < scoreValues.length) {
        currentScore += scoreValues[fishCaught];
        if (fishCaught < scoreValues.length - 1) {
            nextScoreSpan.textContent = scoreValues[fishCaught + 1];
        } else {
            nextScoreSpan.textContent = "Max Score Reached";
        }
        fishCaught++;
    }
}

function handleUserInput() {
    if (!inputBlocked) {
        inputBlocked = true; // Block further inputs
        checkGridNine(); // Perform the check

        setTimeout(() => {
            inputBlocked = false; // Unblock inputs after throttle time
        }, throttleTime);
    }
}

function checkGridNine() {
    console.log('realCheck')
    // Play meow sound
    const meowAudio = new Audio('meow.mp3');
    meowAudio.play();

    // Rest of the logic executes after the meow sound has started playing
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

    let scoreGained = gridContents[9] ? scoreValues[fishCaught] : 0;
    showCatchDialog(gridContents[9], scoreGained);

    if (gridContents[9]) {
        gridContents[9] = false;
        updateScore();
        updateGridVisuals();
        animateCatCatch(true); // Use catching and eating animation for success
        if (!gridContents.includes(true)) {
            setTimeout(() => {
                triggerScanner(currentScore); // Pass the current score to the scanner
                location.reload();
            }, 6000);

            setTimeout(() => {
                showScanPopup();
            }, 3000);
        }
    } else {
        animateCatCatch(false); // Use failing animation for failure
        setTimeout(() => {
            triggerScanner(currentScore); // Pass the current score to the scanner even if it was a fail
            location.reload();
        }, 6000);
        setTimeout(() => {
            showScanPopup();
        }, 3000);
    }
}

function updateGameSpeed() {
    const newInterval = 500 * Math.pow(accelerationFactor, fishCaught - 1); // Calculate new speed based on level
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
    console.log('showConfigPopup')
    document.getElementById('config-popup').style.display = 'block';
}

function loadConfig() {
    const configString = localStorage.getItem('gameConfig');
    if (configString) {
        const config = JSON.parse(configString);

        // Check if scoreValues exist in the config; if not, use the default
        if (config.scoreValues && Array.isArray(config.scoreValues)) {
            document.getElementById('score-values').value = config.scoreValues.join(',');
            scoreValues = config.scoreValues;
        } else {
            // Default score values
            scoreValues = [200, 300, 350, 400, 450, 500, 550, 600, 650, 700, 1500];
            document.getElementById('score-values').value = scoreValues.join(',');
        }

        // Update game variables
        accelerationFactor = config.accelerationFactor || 0.9;
        document.getElementById('accel-factor').value = accelerationFactor;

        throttleTime = config.throttleTime || 3000;
        document.getElementById('throttle-time').value = throttleTime;

        // Update the first score value in the HTML
        nextScoreSpan.textContent = scoreValues[0];

        updateGameSpeed(); // Update game speed based on stored factor
        console.log("Configuration loaded:", config);
    } else {
        // Default values if no config is found in localStorage
        scoreValues = [200, 300, 350, 400, 450, 500, 550, 600, 650, 700, 1500];
        accelerationFactor = 0.9;
        throttleTime = 3000;
        document.getElementById('score-values').value = scoreValues.join(',');
        document.getElementById('accel-factor').value = accelerationFactor;
        document.getElementById('throttle-time').value = throttleTime;

        // Update the first score value in the HTML
        nextScoreSpan.textContent = scoreValues[0];
    }
}

function updateConfig() {
    const newConfig = {
        accelerationFactor: parseFloat(document.getElementById('accel-factor').value),
        scoreValues: document.getElementById('score-values').value.split(',').map(Number),
        throttleTime: parseInt(document.getElementById('throttle-time').value, 10)
    };

    if (newConfig.accelerationFactor >= 0.1 && newConfig.accelerationFactor <= 2 && newConfig.scoreValues.every(Number.isInteger) && newConfig.throttleTime >= 1000 && newConfig.throttleTime <= 30000) {
        localStorage.setItem('gameConfig', JSON.stringify(newConfig)); // Store the config in localStorage
        loadConfig(); // Reload configuration to apply changes
        console.log("Configuration updated:", newConfig);

        // Update the first score value in the HTML
        nextScoreSpan.textContent = newConfig.scoreValues[0];
    } else {
        alert("Please enter valid values for all configurations.");
    }
    document.getElementById('config-popup').style.display = 'none'; // Close the config popup
}

// Add event listener to level display to show config popup
document.getElementById('next-score').addEventListener('click', function(event) {
    event.stopPropagation(); // Prevent propagation to stop triggering checkGridNine
    showConfigPopup();
});

// Ensure clicks on the config popup itself do not propagate
document.getElementById('config-popup').addEventListener('click', function(event) {
    event.stopPropagation();
});

function triggerScanner(score) {
    const scannerArgument = score.toString();  // Convert score to a string for the scanner argument
    console.log("Scanner triggered with score:", scannerArgument);
    alert(`Game Over! Score: ${scannerArgument}`);

    if (window.Android) {
        window.Android.startScanner(scannerArgument); // Pass the specific prize argument to Android
    } else {
        console.log("Scanner feature not available on this platform.");
    }
}

function showCatchDialog(success, score) {
    const dialog = document.getElementById('catch-dialog');
    const image = document.getElementById('catch-result-image');
    const message = document.getElementById('catch-dialog-message');

    // Set image and message based on success
    if (success) {
        image.src = 'happy.png'; // Ensure you have 'happy.png' in your assets
        message.textContent = `Catch Success! Score: ${score}`;
    } else {
        image.src = 'sad.png'; // Ensure you have 'sad.png' in your assets
        message.textContent = 'Catch Fail';
    }

    // Display the dialog
    setTimeout(() => {
        dialog.style.display = 'block';
    }, 600); // Show the dialog after 0.6 seconds

    // Hide the dialog after 3 seconds
    setTimeout(() => {
        dialog.style.display = 'none';
    }, 3000); // Remove the dialog after 3 seconds
}

function showScanPopup() {
    console.log('show scan popup')
    scanPopup.style.display = 'block';
}

document.addEventListener('click', handleUserInput);
document.addEventListener('keydown', function(event) {
    if (event.keyCode === 13) {  // Enter key
        handleUserInput();
    }
});

window.onload = function() {
    loadConfig();
    updateGridVisuals();
    startGame();
    animateCat();
};
