// pincode page

let enteredPin = "";
let showPin = false;

// Function to add a digit to the PIN
function addDigit(digit) {
    if (enteredPin.length < 6) {  // Limit PIN to 6 digits
        enteredPin += digit;
        updateDisplay();
    }
}

// Function to update the PIN display
function updateDisplay() {
    const display = document.getElementById('pinDisplay');
    if (showPin) {
        display.textContent = enteredPin; // Show actual PIN
    } else {
        display.textContent = enteredPin.split('').map(() => '•').join(''); // Show dots instead of numbers
    }
}

// Function to toggle PIN visibility
function togglePinVisibility() {
    showPin = document.getElementById('showPinCheckbox').checked;
    updateDisplay();
}

// Function to clear the entered PIN
function clearInput() {
    enteredPin = "";
    updateDisplay();
}

// Function to cancel the input
function cancelInput() {
    enteredPin = "";
    updateDisplay();
    alert("Operation Cancelled");
}

// Function to handle Enter button click
function enterPin() {
    if (enteredPin.length === 6) {
        alert("PIN Entered: " + enteredPin); // Replace this with actual validation
        clearInput();
    } else {
        alert("Please enter a 6-digit PIN.");
    }
}

// Event listener for keyboard input
document.addEventListener('keydown', function(event) {
    if (event.key >= '0' && event.key <= '9') {
        addDigit(event.key); // Handle number keys
    } else if (event.key === 'Backspace') {
        enteredPin = enteredPin.slice(0, -1); // Remove the last digit on Backspace
        updateDisplay();
    } else if (event.key === 'Enter') {
        enterPin(); // Trigger Enter on Enter key
    }
});

// keyboard page
let enteredValue = "";

// Function to add a character to the input with validation
function addCharacter(char) {
    const length = enteredValue.length;

    // Validation: 1st and last character must be alphabets, middle characters must be numbers
    if (length === 0 || length === 8) {
        if (isAlphabet(char)) {
            enteredValue += char;
        }
    } else if (length > 0 && length < 8) {
        if (isNumber(char)) {
            enteredValue += char;
        }
    }

    // Limit to max 9 characters
    if (enteredValue.length > 9) {
        enteredValue = enteredValue.slice(0, 9);
    }

    document.getElementById('inputField').value = enteredValue;
}

// Function to clear the input
function clearInput() {
    enteredValue = "";
    document.getElementById('inputField').value = "";
}

// Function to remove the last character
function removeLastCharacter() {
    enteredValue = enteredValue.slice(0, -1);
    document.getElementById('inputField').value = enteredValue;
}

// Helper functions to check if a character is alphabet or number
function isAlphabet(char) {
    return /^[A-Za-z]$/.test(char);
}

function isNumber(char) {
    return /^[0-9]$/.test(char);
}

// Function to handle the Enter button
function submitInput() {
    alert('Input submitted: ' + enteredValue);
}

//Exit button
document.addEventListener("DOMContentLoaded", function() {
    // Show exit confirmation when exit button is clicked
    document.getElementById("exit-button").onclick = function() {
        document.getElementById("exit-confirmation").style.display = "flex";
    };

    // Confirm exit and show loading animation
    window.confirmExit = function() {
        console.log("Exit confirmed."); // Debug message
        // Hide confirmation text and buttons
        document.querySelector("#exit-confirmation h1").style.display = "none";
        document.querySelector("#exit-confirmation p").style.display = "none";
        document.querySelectorAll(".modal-button").forEach(button => button.style.display = "none");

        // Show loading animation
        document.getElementById("loading-animation").style.display = "flex";

        // Redirect to login page after 3 seconds
        setTimeout(function() {
            console.log("Redirecting to login page."); // Debug message
            window.location.href = '/feedback'; // Redirect to the login page
        }, 3000);
    }

    // Cancel exit and hide the modal
    window.cancelExit = function() {
        document.getElementById("exit-confirmation").style.display = "none";
    }
});

// data leak 
function showDataLeakWarning() {
    document.getElementById('data-leak-warning').style.display = 'flex';
}



function dismissWarning() {
    // Hide the warning modal without further action
    document.getElementById('data-leak-warning').style.display = 'none';
}

// Show data leak warning after 3 seconds
setTimeout(showDataLeakWarning, 3000);
