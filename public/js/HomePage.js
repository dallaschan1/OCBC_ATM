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

                if (withdrawAmounts.length > 0) {
                    // Sort amounts in ascending order
                    withdrawAmounts.sort((a, b) => a - b);

                    // Get the highest and lowest amounts for the day
                    const lowestAmount = withdrawAmounts[0];
                    const highestAmount = withdrawAmounts[withdrawAmounts.length - 1];

                    // Count occurrences of each withdrawal amount
                    const amountFrequency = {};
                    withdrawAmounts.forEach(amount => {
                        amountFrequency[amount] = (amountFrequency[amount] || 0) + 1;
                    });

                    // Sort amounts by frequency in descending order
                    const sortedByFrequency = Object.keys(amountFrequency)
                        .map(Number)
                        .sort((a, b) => amountFrequency[b] - amountFrequency[a]);

                    // Get the two most frequent amounts that aren't highest or lowest
                    const mostFrequentAmounts = sortedByFrequency.filter(amount => amount !== lowestAmount && amount !== highestAmount);

                    // Prepare the final list of unique amounts
                    // Prepare the final list of unique amounts
                    let uniqueAmounts = [...new Set([lowestAmount, highestAmount])]; // Remove duplicates

                    // Add the most frequent amounts if available, without duplicates
                    mostFrequentAmounts.forEach(amount => {
                        if (uniqueAmounts.length < 4 && !uniqueAmounts.includes(amount)) {
                            uniqueAmounts.push(amount);
                        }
                    });

                    // Fill in with default values if less than 4 unique amounts
                    const defaultValues = [20, 50, 100, 200];
                    let i = 0;
                    while (uniqueAmounts.length < 4 && i < defaultValues.length) {
                        if (!uniqueAmounts.includes(defaultValues[i])) {
                            uniqueAmounts.push(defaultValues[i]);
                        }
                        i++;
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
            const ATMID = localStorage.getItem('ATMID');
            window.location.href = `/withdrawalPage?amount=${amount}`;
            
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

                    const atmResponse = await fetch('/withdraw-atm-balance', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ ATMID: ATMID, withdrawalAmount: amount }),
                    });
              
                    if (!atmResponse.ok) {
                      throw new Error('Failed to update ATM balance');
                    }

                    alert('Withdrawal successful');
                    location.reload();
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
    let amount = prompt('Enter the amount you want to withdraw:');

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
        alert('Please enter a valid amount.');
        return;
    }

    // Validate that the amount is a multiple of either 5 or 2
    while (Number(amount) % 5 !== 0 && Number(amount) % 2 !== 0) {
        amount = prompt('Invalid amount. Please enter a valid cash note amount (multiple of 5 or 2).');
        
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            alert('Invalid input. Please enter a positive number.');
            return;
        }
    }

    const userId = localStorage.getItem('UserId');
    const ATMID = localStorage.getItem('ATMID');

    if (!userId) {
        alert('User not logged in');
        return;
    }

    try {
        // Withdraw from user balance
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

        // Redirect to withdrawal confirmation page
        window.location.href = `/withdrawalPage?amount=${amount}`;

        if (ATMID) {
            // Deduct from ATM balance
            const atmResponse = await fetch('/withdraw-atm-balance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ATMID: ATMID, withdrawalAmount: amount }),
            });

            if (!atmResponse.ok) {
                throw new Error('Failed to update ATM balance');
            }
        }

        alert('Withdrawal successful');
        location.reload();
    } catch (error) {
        console.error('Withdrawal failed:', error);
    }
});})


window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.interimResults = false; // Process only finalized results
recognition.lang = 'en-SG'; // Use Singapore English
recognition.continuous = false; // We'll handle continuous listening manually

let isRecognitionRunning = false;
let transcriptBuffer = ""; // Store the full transcript
const voiceButton = document.getElementById("voice-button");

voiceButton.addEventListener("click", () => {
  if (!isRecognitionRunning) {
    startRecognition();
  } else {
    stopRecognition(true); // Ensure manual stop triggers transcript sending
  }
});

// Function to start recognition
function startRecognition() {
  isRecognitionRunning = true;
  transcriptBuffer = ""; // Clear any previous transcript
  updateButtonState();
  recognition.start();
  console.log("Speech recognition started.");
}

// Function to stop recognition
function stopRecognition(sendTranscript = false) {
  isRecognitionRunning = false;
  recognition.stop(); // Explicitly stop recognition
  updateButtonState();
  console.log("Speech recognition stopped.");

  // Wait briefly to allow any pending results to process
  setTimeout(() => {
    if (sendTranscript && transcriptBuffer.trim()) {
      console.log("Final transcript to send:", transcriptBuffer.trim());
      processUserInput(transcriptBuffer.trim());
      transcriptBuffer = ""; // Clear the buffer after processing
    }
  }, 250); // Delay to ensure all results are processed
}

// Update the button state to reflect recognition status
function updateButtonState() {
  if (isRecognitionRunning) {
    voiceButton.textContent = "Stop Listening";
    voiceButton.style.backgroundColor = "red";
  } else {
    voiceButton.textContent = "Start Listening";
    voiceButton.style.backgroundColor = "";
  }
}

// Handle transcription results
recognition.addEventListener("result", (event) => {
  const finalTranscript = Array.from(event.results)
    .filter((result) => result.isFinal) // Only process finalized results
    .map((result) => result[0].transcript)
    .join(" ")
    .trim();

  if (finalTranscript) {
    transcriptBuffer += finalTranscript + " "; // Append finalized transcript only
    console.log("Finalized transcript received:", finalTranscript);
  }
});

// Restart recognition when it ends (unless manually stopped)
recognition.addEventListener("end", () => {
  if (isRecognitionRunning) {
    console.log("Recognition ended. Restarting...");
    recognition.start(); // Restart the recognition to maintain continuous listening
  }
});

// Process user input and handle backend responses
async function processUserInput(input) {
  try {
    console.log("Sending transcript to the backend:", input);

    const response = await fetch('http://localhost:3001/homePageChat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput: input }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.responseText;
    console.log("Backend response:", aiResponse);

    // Handle specific AI responses
    if (aiResponse.includes("Deposit 1")) {
      console.log("Initiating Deposit...");
      await speakResponse("Starting the deposit process.");
    } else if (aiResponse.includes("Withdraw 2 and Amount: ")) {
      const amountMatch = aiResponse.match(/Withdraw 2 and Amount: (\d+(\.\d+)?)/);
      if (amountMatch) {
        const amount = amountMatch[1];
        await initiateWithdraw(amount);
      } else {
        await speakResponse("I'm sorry, I didn't catch the amount. Could you repeat?");
      }
    } else if (aiResponse.includes("Check Account Balance 3")) {
      console.log("Checking Account Balance...");
      await speakResponse("Here is your account balance.");
    } else if (aiResponse.includes("Show More Options 4")) {
      console.log("Redirecting to more options page...");
      window.location.href = '/More-Options';
    } else if (aiResponse.includes("Exit 5")) {
      console.log("User chose to exit.");
      await speakResponse("Thank you for using our services. Goodbye!");
      window.location.href = '/exit';
    } else {
      await speakResponse(aiResponse);
    }
  } catch (error) {
    console.error("Error sending transcript to the backend:", error);
  }
}

// Speak a response using SpeechSynthesis
function speakResponse(response) {
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(response);
    utterance.lang = 'en-SG'; // Use Singapore English
    utterance.rate = 1.2;
    utterance.pitch = 1.0;

    utterance.onend = resolve;
    utterance.onerror = reject;

    window.speechSynthesis.speak(utterance);
  });
}

// Handle withdrawal logic
async function initiateWithdraw(amount) {
  const userId = localStorage.getItem('UserId');
  if (userId && amount) {
    try {
      const response = await fetch('/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount }),
      });

      if (!response.ok) {
        throw new Error('Failed to withdraw');
      }

      console.log('Withdrawal successful');
      location.reload();
      await speakResponse(`You have successfully withdrawn $${amount}.`);
    } catch (error) {
      console.error('Withdrawal failed:', error);
      await speakResponse('Sorry, the withdrawal failed.');
    }
  } else {
    console.error('User not logged in or invalid amount');
    await speakResponse('User not logged in or invalid amount.');
  }
}

// Handle recognition errors
recognition.addEventListener("error", (event) => {
  console.error("Speech recognition error:", event.error);
  if (isRecognitionRunning) {
    console.log("Restarting recognition due to error...");
    recognition.start(); // Restart recognition after an error
  }
});
