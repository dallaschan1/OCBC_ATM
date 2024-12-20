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
                    location.reload();
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


window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.interimResults = true;
recognition.lang = 'en-US';
recognition.continuous = true;

let isRecognitionRunning = false;
let transcriptBuffer = "";

const slider = document.getElementsByClassName("slider")[0];
let active = false;

let audioContext;
let analyser;
let microphone;
const canvas = document.getElementById('waveform');
const canvasCtx = canvas.getContext('2d');

// Event listener for slider to turn voice mode on or off
slider.addEventListener("click", () => {
  active = !active;
  if (active) {
    console.log("Voice mode activated.");
    speakResponse("Voice mode activated.");
    startRecognition();
    startVisualizer();
  } else {
    console.log("Voice mode deactivated.");
    window.speechSynthesis.cancel();
    stopRecognition();
    stopVisualizer();
    isSpeaking = false;
    speakResponse("Voice mode deactivated.");
  }
});

// Function to start recognition safely
function startRecognition() {
  if (!isRecognitionRunning && active) {
    recognition.start();
    isRecognitionRunning = true;
    console.log("Speech recognition started.");
  }
}

// Function to stop recognition safely
function stopRecognition() {
  if (isRecognitionRunning) {
    recognition.stop();
    isRecognitionRunning = false;
    console.log("Speech recognition stopped.");
  }
}

// Function to start the audio visualizer
async function startVisualizer() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    drawWaveform();
  } catch (error) {
    console.error('Error accessing the microphone:', error);
  }
}

// Function to stop the visualizer
function stopVisualizer() {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
    analyser = null;
    console.log("Audio context stopped.");
  }
}

// Function to draw the waveform
function drawWaveform() {
  if (!analyser) return;

  const bufferLength = analyser.fftSize;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    if (!analyser) return; // Stop if visualizer is not active
    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    // Clear the canvas
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up the style for the waveform line
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'blue';

    // Begin drawing the waveform path
    canvasCtx.beginPath();
    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    let significantSignal = false;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0; // Normalize between 0 and 1
      const y = (v * canvas.height) / 2;

      if (Math.abs(v - 1) > 0.05) {
        significantSignal = true;
      }

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    // If no significant audio signal, draw a flat line in the middle
    if (!significantSignal) {
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      canvasCtx.beginPath();
      canvasCtx.moveTo(0, canvas.height / 2);
      canvasCtx.lineTo(canvas.width, canvas.height / 2);
    }

    canvasCtx.stroke();
  }

  draw();
}

recognition.addEventListener('result', (event) => {
  if (!active) return;

  const finalTranscript = Array.from(event.results)
    .filter((result) => result.isFinal)
    .map((result) => result[0].transcript)
    .join(' ')
    .trim();

  if (finalTranscript) {
    transcriptBuffer = finalTranscript;
    console.log("Final transcript:", transcriptBuffer);
    processUserInput(transcriptBuffer);
    transcriptBuffer = ""; // Clear buffer after sending input
  }
});

let isSpeaking = false;

function speakResponse(response) {
  return new Promise((resolve, reject) => {
    if (isSpeaking) return;
    isSpeaking = true;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(response);
    utterance.lang = 'en-US';
    utterance.rate = 1.2;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      isSpeaking = false;
      resolve();
      if (active) {
        startRecognition();
      }
    };
    utterance.onerror = (event) => {
      isSpeaking = false;
      reject(event.error);
    };

    window.speechSynthesis.speak(utterance);
  });
}

recognition.addEventListener('error', (event) => {
  console.error('Speech recognition error:', event.error);
  isRecognitionRunning = false; // Update flag if recognition stops due to an error

  if (event.error === 'no-speech' && active) {
    console.log("No speech detected. Restarting...");
    setTimeout(() => {
      startRecognition(); // Restart safely after a small delay
    }, 500);
  }
});

let a = false;
async function processUserInput(input) {
  if (isRecognitionRunning) {
    recognition.stop();
    a = true;
  }

  try {
    const response = await fetch('http://localhost:3001/homePageChat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput: input }),
    });

    const data = await response.json();
    const aiResponse = data.responseText;

    if (!active) return;

    // Handle response based on requirements
    if (aiResponse.includes("Deposit 1")) {
      // Redirect to Deposit page or initiate deposit process
      console.log("Initiating Deposit...");
      await speakResponse("Starting the deposit process.");
      // Implement your deposit logic here
    } else if (aiResponse.includes("Withdraw 2 and Amount: ")) {
      const amountMatch = aiResponse.match(/Withdraw 2 and Amount: (\d+(\.\d+)?)/);
      if (amountMatch) {
        const amount = amountMatch[1];
        await initiateWithdraw(amount);
      } else {
        // If amount is not specified correctly
        await speakResponse("I'm sorry, I didn't catch the amount you want to withdraw. Could you please repeat it?");
      }
    } else if (aiResponse.includes("Check Account Balance 3")) {
      // Redirect to Account Balance page or display balance
      console.log("Checking Account Balance...");
      await speakResponse("Here is your account balance.");
      // Implement your account balance logic here
    } else if (aiResponse.includes("Show More Options 4")) {
      console.log("Redirecting to more options page...");
      window.location.href = '/More-Options';
    } else if (aiResponse.includes("Exit 5")) {
      console.log("User chose to exit. Ending session...");
      await speakResponse("Thank you for using our services. Have a great day!");
      // Perform any necessary cleanup
      window.location.href = '/exit'; // Redirect to an exit or goodbye page
    } else {
      await speakResponse(aiResponse);
    }
  } catch (error) {
    console.error('Error while fetching response from server:', error);
  } finally {
    if (active) {
      isRecognitionRunning = false;
      startRecognition();
      a = false;
    }
  }
}

async function initiateWithdraw(amount) {
  const userId = localStorage.getItem('UserId');
  if (userId && amount) {
    try {
      const response = await fetch('/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

recognition.addEventListener('end', () => {
  if (active && !a) {
    console.log("Speech recognition ended. Restarting...");
    setTimeout(() => {
      isRecognitionRunning = false; // Update flag when recognition ends
      startRecognition(); // Restart only when recognition is properly ended and active
    }, 500);
  }
});
