async function getUserInfo() {
    const accountInput = document.getElementById('account').value.trim();
    if (accountInput.length > 3) {
        try {
            const response = await fetch('/get-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ UserName: accountInput, phoneNumber: accountInput })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    document.getElementById('user-name').textContent = data.user.UserName || '--';
                    document.getElementById('user-phone').textContent = data.user.phoneNumber || '--';

                    // Now fetch the suspicion score
                    const userId = data.user.UserID;
                    await checkSuspicion(userId);
                } else {
                    resetUserInfo();
                }
            } else {
                resetUserInfo();
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
            resetUserInfo();
        }
    } else {
        resetUserInfo();
    }
}

async function checkSuspicion(userId) {
    try {
        const response = await fetch('/check-suspicion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: userId })
        });

        if (response.ok) {
            const data = await response.json();
            const score = data.score !== null && data.score !== undefined ? data.score : '--';
            document.getElementById('user-score').textContent = score;
            console.log('Suspicion score:', score);
            return score;
        } else {
            console.error('Error fetching suspicion score');
            document.getElementById('user-score').textContent = '--';
        }
    } catch (error) {
        console.error('Error checking suspicion score:', error);
        document.getElementById('user-score').textContent = '--';
    }
    return null;
}

function resetUserInfo() {
    document.getElementById('user-name').textContent = '--';
    document.getElementById('user-phone').textContent = '--';
    document.getElementById('user-score').textContent = '--';
}

// Transfer button click handler
document.querySelector('.btn').addEventListener('click', async function() {
    const accountInput = document.getElementById('account').value.trim();
    const amountInput = document.getElementById('amount').value.trim();

    if (accountInput && amountInput) {
        const userId = await getUserId(accountInput);
        if (userId) {
            const suspicionScore = await checkSuspicion(userId);
            const threshold = 50; // Set your threshold for suspicious score here

            if (suspicionScore && suspicionScore > threshold) {
            
                document.getElementById('suspicion-modal').style.display = 'block';
                
               
                document.getElementById('confirm-btn').onclick = function() {
                  
                    closeModal();
                    showToast('Transfer Successful!');
                };
            } else {
                showToast('Transfer Successful!');
            }
        }
    } else {
        alert("Please fill in all fields.");
    }
});

async function getUserId(accountInput) {
    try {
        const response = await fetch('/get-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ UserName: accountInput, phoneNumber: accountInput })
        });

        if (response.ok) {
            const data = await response.json();
            return data.user.UserID;
        }
    } catch (error) {
        console.error('Error fetching user ID:', error);
    }
    return null;
}

function closeModal() {
    document.getElementById('suspicion-modal').style.display = 'none';
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 500);
    }, 3000);
}


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

            if (Math.abs(v - 1) > 0.05) {  // Check if there's a significant signal
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
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawing
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
        .filter(result => result.isFinal)
        .map(result => result[0].transcript)
        .join(' ')
        .trim();

    if (finalTranscript) {
        transcriptBuffer = finalTranscript;
        console.log("Final transcript:", transcriptBuffer);
        processUserInput(transcriptBuffer);
        transcriptBuffer = "";  // Clear buffer after sending input
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

// Handle errors and end events
recognition.addEventListener('error', (event) => {
    console.error('Speech recognition error:', event.error);
    isRecognitionRunning = false;  // Update flag if recognition stops due to an error

    if (event.error === 'no-speech' && active) {
        console.log("No speech detected. Restarting...");
        setTimeout(() => {
            startRecognition();  // Restart safely after a small delay
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
        const response = await fetch('http://localhost:3001/transferFundChat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput: input })
        });

        const data = await response.json();
        const aiResponse = data.responseText;

        if (!active) return;  // If voice mode is turned off during processing, do not proceed

        // Handle response
        if (aiResponse.startsWith("Proceed with Transfer to Account:")) {
            // Extract account and amount
            const regex = /Proceed with Transfer to Account: (.*), Amount: (.*)/;
            const match = aiResponse.match(regex);
            if (match) {
                const account = match[1];
                const amount = match[2];

                // Set the values in the input fields
                document.getElementById('account').value = account;
                document.getElementById('amount').value = amount;

                // Proceed with the transfer logic
                await proceedWithTransfer(account, amount);
            }
        } else {
            await speakResponse(aiResponse);
        }
    } catch (error) {
        console.error('Error while fetching response from server:', error);
    } finally {
        if (active) {
            isRecognitionRunning = false;  // Update flag after speaking response
            console.log("Speech recognition will resume once processing ends.");
            startRecognition(); // Restart recognition after processing
            a = false;
        }
    }
}

async function proceedWithTransfer(account, amount) {
    // Implement the transfer logic here
    // Simulate clicking the transfer button
    const transferButton = document.querySelector('.btn');
    if (transferButton) {
        transferButton.click();
    }
}

recognition.addEventListener('end', () => {
    if (active && !a) {
        console.log("Speech recognition ended. Restarting...");
        setTimeout(() => {
            isRecognitionRunning = false;  // Update flag when recognition ends
            startRecognition();  // Restart only when recognition is properly ended and active
        }, 500);
    }
});
