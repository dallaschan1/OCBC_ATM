window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.interimResults = true;
recognition.lang = 'en-US';
recognition.continuous = true;

let isRecognitionRunning = false;  // Flag to track if recognition is running
let silenceTimeout;
let transcriptBuffer = "";

const slider = document.getElementsByClassName("slider")[0];
let active = false;

// Event listener for slider to turn voice mode on or off
slider.addEventListener("click", () => {
    active = !active;
    if (active) {
        console.log("Voice mode activated.");
        speakResponse("Voice mode activated.");
        startRecognition();
        
    } else {
        console.log("Voice mode deactivated.");
        window.speechSynthesis.cancel(); 
        stopRecognition();
        speakResponse("Voice mode deactivated.");
        
        
    }
});

// Function to start recognition safely
function startRecognition() {
    if (!isRecognitionRunning && active) {
        recognition.start();
        isRecognitionRunning = true;  // Update flag when recognition starts
        console.log("Speech recognition started.");
    }
}

// Function to stop recognition safely
function stopRecognition() {
    if (isRecognitionRunning) {
        recognition.stop();
        isRecognitionRunning = false;  // Update flag when recognition stops
        console.log("Speech recognition stopped.");
    }
}

// Handle speech recognition result
recognition.addEventListener('result', (event) => {
    if (!active) return;  // If voice mode is off, ignore results

    // Check if the result is final
    const finalTranscript = Array.from(event.results)
        .filter(result => result.isFinal) // Only consider final results
        .map(result => result[0].transcript)
        .join(' ')
        .trim();

    if (finalTranscript) {
        // Clear the buffer
        transcriptBuffer = finalTranscript;
        console.log("Final transcript:", transcriptBuffer);
        processUserInput(transcriptBuffer);
        transcriptBuffer = "";  // Clear buffer after sending input
        if (silenceTimeout) clearTimeout(silenceTimeout); // Clear any pending silence timeout
    }
});

let isSpeaking = false;

function speakResponse(response) {
    return new Promise((resolve, reject) => {
        if (isSpeaking) return;  // Avoid overlapping speeches
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

async function processUserInput(input) {
    if (isRecognitionRunning) {
        recognition.stop(); // Stop ongoing recognition
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for recognition to stop completely
    }

    try {
        const response = await fetch('http://localhost:3001/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput: input })
        });

        const data = await response.json();
        const aiResponse = data.responseText;

        if (!active) return;  // If voice mode is turned off during processing, do not proceed

        // Handle response
        if (aiResponse.includes("Convert Currency 1")) {
            openCard("convert-currency");
        } else if (aiResponse.includes("Crypto Currency Services 2")) {
            openCard("crypto-services");
        } else if (aiResponse.includes("Pay Bills 3")) {
            openCard("pay-bills");
        } else if (aiResponse.includes("Transfer Fund 4")) {
            openCard("transfer-fund");
        } else if (aiResponse.includes("Savings or Loan Details 5")) {
            openCard("loan-details");
        } else if (aiResponse.includes("Update Personal Particulars 6")) {
            openCard("update-personal");
        } else if (aiResponse.includes("Deposit Money 7")) {
            openCard("deposit-money");
        } else if (aiResponse.includes("Withdraw Money 8")) {
            openCard("withdraw-money");
        } else if (aiResponse.includes("Check Account Balance 9")) {
            openCard("check-balance");
        } else {
            await speakResponse(aiResponse);
            
        }
    } catch (error) {
        console.error('Error while fetching response from server:', error);
        isRecognitionRunning = false;
        startRecognition();
    } finally {
        if (active) {
            isRecognitionRunning = false;  // Update flag after speaking response
            console.log("Speech recognition will resume once processing ends.");
            startRecognition(); // Restart recognition after processing
        }
    }
}

recognition.addEventListener('end', () => {
    if (active) {
        console.log("Speech recognition ended. Restarting...");
        setTimeout(() => {
            startRecognition();  // Restart only when recognition is properly ended and active
        }, 500);
    }
});

// Function to open specific card based on Gemini's response
function openCard(cardId) {
    const allCards = document.querySelectorAll('.option-card');
    allCards.forEach(card => card.style.display = 'none');  // Hide all cards

    const selectedCard = document.getElementById(cardId);
    if (selectedCard) {
        selectedCard.style.display = 'block';  // Show the relevant card
        console.log(`Opening ${selectedCard.querySelector('h3').innerText}...`);
    }
}
