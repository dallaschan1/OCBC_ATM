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
        const response = await fetch('/moreServicesChat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput: input })
        });

        const data = await response.json();
        const aiResponse = data.responseText;

        if (!active) return;  // If voice mode is turned off during processing, do not proceed

        // Handle response based on your specifications
        if (aiResponse.includes("Convert Currency 1")) {
            alert('Convert Currency selected.');
        } else if (aiResponse.includes("Crypto Currency Services 2")) {
            window.location.href = '/crypto';
        } else if (aiResponse.includes("Pay Bills 3")) {
            alert('Pay Bills selected.');
        } else if (aiResponse.includes("Transfer Fund 4")) {
            window.location.href = '/transfer';
        } else if (aiResponse.includes("Savings or Loan Details 5")) {
            alert('Savings or Loan Details selected.');
        } else if (aiResponse.includes("Update Personal Particulars 6")) {
            alert('Update Personal Particulars selected.');
        } else if (aiResponse.includes("Back 7")) {
            window.location.href = '/homepage'; // Replace with your actual homepage URL
        } else if (aiResponse.includes("Exit 8")) {
            console.log("User chose to exit. Ending session.");
            // Turn off voice mode
            active = false;
            window.speechSynthesis.cancel();
            stopRecognition();
            stopVisualizer();
            isSpeaking = false;
            // Redirect to exit page
            window.location.href = '/exit';
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

recognition.addEventListener('end', () => {
    if (active && !a) {
        console.log("Speech recognition ended. Restarting...");
        setTimeout(() => {
            isRecognitionRunning = false;  // Update flag when recognition ends
            startRecognition();  // Restart only when recognition is properly ended and active
        }, 500);
    }
});
