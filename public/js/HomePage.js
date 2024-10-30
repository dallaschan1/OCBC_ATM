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

document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('UserId');
    if (userId) {
        try {
            // Call /withdraw on load to get the recordset
            const response = await fetch(`/withdraw?userId=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch withdrawal data');
            }
            
            const recordsets = await response.json();
            const recordset = recordsets.success;
            console.log('Recordset:', recordset);
            if (recordset && recordset.length > 0) {
                const withdrawAmounts = recordset.map(record => Number(record.WithdrawAmount));
                
                // Sort amounts in ascending order
                withdrawAmounts.sort((a, b) => a - b);

                // Collect unique values
                const uniqueAmounts = [...new Set(withdrawAmounts)];

                // Fill in with default values if less than 4 unique amounts
                const defaultValues = [5, 10, 20, 50];
                while (uniqueAmounts.length < 4) {
                    uniqueAmounts.push(defaultValues.shift());
                }

                // Sort the final list to ensure it's in ascending order
                uniqueAmounts.sort((a, b) => a - b);

                // Fill the 4 h3 elements with amounts in ascending order
                const cashButtons = document.querySelectorAll('.Cash-Holder h3');
                if (cashButtons.length >= 4) {
                    cashButtons[0].textContent = `$${uniqueAmounts[0]}`;
                    cashButtons[1].textContent = `$${uniqueAmounts[1]}`;
                    cashButtons[2].textContent = `$${uniqueAmounts[2]}`;
                    cashButtons[3].textContent = `$${uniqueAmounts[3]}`;
                }
            }
        } catch (error) {
            console.error('Error fetching withdrawal data:', error);
        }
    } else {
        alert('User not logged in');
    }

    // Select existing cash buttons and add click event listeners
    const cashButtons = document.querySelectorAll('.Cash-Holder h3');
    cashButtons.forEach(button => {
        button.addEventListener('click', async () => {
            console.log('Withdraw button clicked:', button.textContent);
            const amount = button.textContent.replace('$', '');
            const userId = localStorage.getItem('UserId');
            
            if (userId && amount) {
                try {
                    const response = await fetch('/withdraw', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ userId, amount })
                    });

                    if (!response.ok) {
                        throw new Error('Failed to withdraw');
                    }

                    alert('Withdrawal successful');
                } catch (error) {
                    console.error('Withdrawal failed:', error);
                }
            } else {
                alert('User not logged in or invalid amount');
            }
        });
    });

    // Handle "Other Cash Amount" button click event
    const otherCashButton = document.querySelector('#Bottom h3');
    otherCashButton.addEventListener('click', async () => {
        const amount = prompt('Enter the amount you want to withdraw:');
        if (amount && !isNaN(amount) && Number(amount) > 0) {
            const userId = localStorage.getItem('UserId');
            
            if (userId) {
                try {
                    const response = await fetch('/withdraw', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ userId, amount })
                    });

                    if (!response.ok) {
                        throw new Error('Failed to withdraw');
                    }

                    alert('Withdrawal successful');
                } catch (error) {
                    console.error('Withdrawal failed:', error);
                }
            } else {
                alert('User not logged in');
            }
        } else {
            alert('Please enter a valid amount');
        }
    });
});