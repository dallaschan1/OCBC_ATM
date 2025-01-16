

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
let nricProvided = false;
let nricNumber = "";
let confirmationAsked = false;

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
        // If NRIC has not been provided yet
        if (!nricProvided) {
            nricNumber = input.toUpperCase().replace(/\s+/g, '');
            console.log("NRIC provided:", nricNumber);
            await speakResponse(`Can I confirm your NRIC is ${nricNumber}?`);
            nricProvided = true;
            confirmationAsked = true;
        } else if (confirmationAsked) {
            if (input.toLowerCase().includes("yes")) {
                // Assistant returns the phrase along with NRIC
                const aiResponse = `Proceed with Fingerprint Authentication and NRIC: ${nricNumber}`;
                console.log("AI Response:", aiResponse);

                // Call the function with the provided code snippet
                await proceedWithFingerprintAuthentication(nricNumber);

            } else {
                await speakResponse("I'm sorry, could you please provide your NRIC number again?");
                nricProvided = false;
                nricNumber = "";
                confirmationAsked = false;
            }
        } else {
            // Handle any other interactions
            const response = await fetch('http://localhost:3001/fingerPrintChat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userInput: input })
            });

            const data = await response.json();
            const aiResponse = data.responseText;

            if (!active) return;  // If voice mode is turned off during processing, do not proceed

            await speakResponse(aiResponse);

            // Check if AI is asking for NRIC
            if (aiResponse.toLowerCase().includes("may i have your nric number")) {
                nricProvided = false;
            }
        }
    } catch (error) {
        console.error('Error while processing user input:', error);
    } finally {
        if (active) {
            isRecognitionRunning = false;  // Update flag after speaking response
            console.log("Speech recognition will resume once processing ends.");
            startRecognition(); // Restart recognition after processing
            a = false;
        }
    }
}

async function proceedWithFingerprintAuthentication(nric) {
    // Implement the code you provided here
    console.log(`Proceeding with fingerprint authentication for NRIC: ${nric}`);

    const responseDiv = document.getElementById('response');

    if (!nric) {
        responseDiv.innerText = 'Please enter your NRIC.';
        return;
    }

    try {
        // Send the NRIC to the backend to check for linked token
        const nricResponse = await fetch('/check-nric', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nric })
        });

        const nricData = await nricResponse.json();

        const idResponse = await fetch('/getting-id', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nric })
        });

        const idData = await idResponse.json();
        console.log(idData);
        const UserId = idData.UserID;
        localStorage.setItem('UserId', UserId);

        if (nricResponse.ok) {
            // If a token is found, get user location and send the message
            const token = nricData.token;

            // Get user location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;

                    // Send the FCM token and location to the backend
                    const messageResponse = await fetch('/send-message', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            token: token, 
                            location: { lat: latitude, lng: longitude }
                        })
                    });

                    const messageData = await messageResponse.json();

                    if (messageResponse.ok) {
                        responseDiv.innerText = 'Biometric Authentication Sent Successfully.';
                        await speakResponse('Biometric Authentication Sent Successfully.');
                    } else {
                        responseDiv.innerText = 'Error: ' + messageData.error;
                        await speakResponse('Error: ' + messageData.error);
                    }
                }, async (error) => {
                    console.error('Error getting location: ', error);
                    responseDiv.innerText = 'Error getting location: ' + error.message;
                    await speakResponse('Error getting location: ' + error.message);
                });
            } else {
                responseDiv.innerText = 'Geolocation is not supported by this browser.';
                await speakResponse('Geolocation is not supported by this browser.');
            }
        } else {
            responseDiv.innerText = 'Error: ' + nricData.error;
            await speakResponse('Error: ' + nricData.error);
        }
    } catch (error) {
        console.error('Error during authentication:', error);
        responseDiv.innerText = 'An error occurred during authentication.';
        await speakResponse('An error occurred during authentication.');
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
