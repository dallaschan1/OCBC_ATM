document.addEventListener("DOMContentLoaded", function() {
           
    // Show exit confirmation when exit button is clicked
    document.getElementById("exit-button").onclick = function() {
        document.getElementById("exit-confirmation").style.display = "flex";
    };

    

    

    // Changing language
    document.addEventListener("DOMContentLoaded", function() {
    const englishButton = document.getElementById("English");
    const languageDropdown = document.getElementById("language-dropdown");

    // Toggle dropdown visibility when "English" is clicked
    englishButton.onclick = function() {
        languageDropdown.style.display = languageDropdown.style.display === "block" ? "none" : "block";
    };

    // Hide dropdown if clicked outside
    document.addEventListener("click", function(event) {
        if (!englishButton.contains(event.target) && !languageDropdown.contains(event.target)) {
            languageDropdown.style.display = "none";
        }
    });
});

    // Function to handle language change
    function changeLanguage(language) {
        alert("Language switched to: " + language);
        document.getElementById("language-dropdown").style.display = "none";
    }

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
            window.location.href = 'login-page.html'; // Redirect to the login page
        }, 3000);
    }

    // Cancel exit and hide the modal
    window.cancelExit = function() {
        document.getElementById("exit-confirmation").style.display = "none";
    }
});