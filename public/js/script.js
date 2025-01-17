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
// document.addEventListener("DOMContentLoaded", function() {
//     // Get userId from localStorage
//     const userId = 1; // Hardcoded for now, but replace with localStorage.getItem('userId') for real use
//     if (!userId) {
//         console.error("User not logged in. No userId found.");
//         return;
//     }

//     // Show exit confirmation when exit button is clicked
//     document.getElementById("exit-button").onclick = async function() {
//         try {
//             // Fetch the current transaction count for the user
//             const response = await fetch(`/getTransactionCount?userId=${userId}`);
//             const data = await response.json();
//             const transactionCount = data.transactionCount;

//             // Show exit confirmation modal
//             document.getElementById("exit-confirmation").style.display = "flex";

//             // Confirm exit
//             window.confirmExit = function() {
//                 console.log("Exit confirmed.");

//                 // Hide confirmation text and buttons
//                 document.querySelector("#exit-confirmation h1").style.display = "none";
//                 document.querySelector("#exit-confirmation p").style.display = "none";
//                 document.querySelectorAll(".modal-button").forEach(button => button.style.display = "none");

//                 // Show loading animation
//                 document.getElementById("loading-animation").style.display = "flex";

//                 // Redirect based on transaction count
//                 setTimeout(function() {
//                     if (transactionCount === 1) {
//                         window.location.href = 'rating-page.html'; // Redirect to rating page
//                     } else {
//                         window.location.href = 'thank-you-page.html'; // Redirect to Thank You page
//                     }
//                 }, 3000);
//             };

//             // Cancel exit and hide the modal
//             window.cancelExit = function() {
//                 document.getElementById("exit-confirmation").style.display = "none";
//             };
//         } catch (err) {
//             console.error("Error fetching transaction count:", err);
//         }
//     };
// });


// Feedback page
let selectedRating = 0;

function rate(rating) {
    selectedRating = rating;
    const stars = document.querySelectorAll('.stars button');
    stars.forEach((star, index) => {
        // Add 'active' class to the selected stars
        star.classList.toggle('active', index < rating);
    });
}

function submitRating() {
    // Retrieve the userId from localStorage
    const userId = localStorage.getItem('UserId');

    // Check if the user has selected a rating
    if (selectedRating === 0) {
        document.querySelector('.please-submit').style.display = 'block'; // Show the warning
        document.querySelector('.thank-you').style.display = 'none'; // Hide the thank-you message
    } else {
        document.querySelector('.please-submit').style.display = 'none'; // Hide the warning
        document.querySelector('.thank-you').style.display = 'block'; // Show the thank-you message

        // Log the rating (for testing purposes)
        console.log('User rating:', selectedRating);
        console.log('Sending rating data to server:', {
            rating: selectedRating,
            userId: userId // Use the retrieved userId
        });
        
        // Send the rating to the backend
        fetch('http://localhost:3001/submit-rating', {  // Use the correct port
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rating: selectedRating,
                userId: userId // Use the retrieved userId
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message); // Handle the response message
        })
        .catch(error => {
            console.error('Error submitting rating:', error);
        });

        // Simulate a delay before redirecting to login page
        setTimeout(() => {
            window.location.href = '/'; // Replace with the actual login page URL
        }, 2000);
    }
}


/*ThankYou*/
   // Show only the h1 and p initially
   document.getElementById("thankYouHeader").style.display = "block";
   document.getElementById("redirectMessage").style.display = "none";

   // Wait 3 seconds before showing the Lottie animation
   setTimeout(() => {
       // Show the Lottie animation
       document.getElementById("thankYouHeader").style.display = "none";
       document.getElementById("redirectMessage").style.display = "block";
       document.getElementById("loading-animation").style.display = "block";

       // After 3 more seconds, redirect to the login page
       setTimeout(() => {
           window.location.href = "login-page.html"; // Redirect to login page
       }, 3000);

   }, 3000);


