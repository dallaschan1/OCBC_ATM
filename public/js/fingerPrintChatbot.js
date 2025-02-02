window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.interimResults = false; // Process only finalized results
recognition.lang = 'en-SG'; // Use Singapore English
recognition.continuous = false; // We'll handle continuous listening manually

let isRecognitionRunning = false;
let isBotSpeaking = false; // Flag to check if the bot is speaking
let transcriptBuffer = ""; // Store the full transcript
let nricProvided = false;
let nricNumber = "";
let confirmationAsked = false;
const voiceButton = document.getElementById("voice-button");

voiceButton.addEventListener("click", () => {
  if (isBotSpeaking) {
    stopBotSpeaking(); // Stop the bot from speaking before starting recognition
  }
  if (!isRecognitionRunning) {
    startRecognition();
  } else {
    stopRecognition(true); // Ensure manual stop triggers transcript sending
  }
});

// Function to stop the bot from speaking
function stopBotSpeaking() {
  if (isBotSpeaking) {
    window.speechSynthesis.cancel(); // Stop any ongoing speech synthesis
    isBotSpeaking = false;
    console.log("Bot speaking stopped.");
  }
}

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

  // Process the transcript if `sendTranscript` is true
  setTimeout(() => {
    if (sendTranscript && transcriptBuffer.trim()) {
      console.log("Final transcript to send:", transcriptBuffer.trim());
      processUserInput(transcriptBuffer.trim());
      transcriptBuffer = ""; // Clear the buffer after processing
    }
  }, 250); // Delay to ensure all results are processed
}

// Update button appearance and text based on the recognition state
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
// Process user input and handle backend responses
async function processUserInput(input) {
    try {
      // Normalize input
      const normalizedInput = input.toUpperCase().replace(/\s+/g, '');
      console.log("User input processed:", normalizedInput);
  
      // Send input to the backend
      const response = await fetch('http://localhost:3001/fingerPrintChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: normalizedInput }),
      });
  
      const data = await response.json();
      const backendMessage = data.responseText;
  
      console.log("Backend response received:", backendMessage);
  
      // Handle specific backend responses
      if (backendMessage.startsWith("Proceed with Fingerprint Authentication")) {
        const nric = backendMessage.match(/NRIC:\s*([A-Z0-9]+)/)[1];
        console.log("Proceeding with fingerprint authentication for NRIC:", nric);
        await proceedWithFingerprintAuthentication(nric);
      } else if (backendMessage.startsWith("Can I confirm your NRIC is")) {
        const nric = backendMessage.match(/NRIC\s*is\s*([A-Z0-9]+)/)[1];
        const confirmationMessage = `Can I confirm your NRIC is ${nric}?`;
        console.log("Speaking confirmation request:", confirmationMessage);
        await speakResponse(confirmationMessage);
      } else {
        // Speak and log the backend's response as-is
        console.log("Backend says:", backendMessage);
        await speakResponse(backendMessage);
      }
    } catch (error) {
      console.error("Error while processing user input:", error);
    }
  }
  
// Speak a response using SpeechSynthesis
function speakResponse(response) {
  return new Promise((resolve, reject) => {
    stopBotSpeaking(); // Stop any existing speech before starting a new one
    isBotSpeaking = true;

    const utterance = new SpeechSynthesisUtterance(response);
    utterance.lang = 'en-SG'; // Use Singapore English
    utterance.rate = 1.2;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      isBotSpeaking = false;
      resolve();
    };
    utterance.onerror = (error) => {
      isBotSpeaking = false;
      reject(error);
    };

    window.speechSynthesis.speak(utterance);
  });
}

// Handle fingerprint authentication
async function proceedWithFingerprintAuthentication(nric) {
  console.log(`Proceeding with fingerprint authentication for NRIC: ${nric}`);

  const responseDiv = document.getElementById('response');

  if (!nric) {
    responseDiv.innerText = 'Please enter your NRIC.';
    return;
  }

  try {
    const nricResponse = await fetch('/check-nric', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nric }),
    });

    const nricData = await nricResponse.json();

    if (nricResponse.ok) {
      const token = nricData.token;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          const messageResponse = await fetch('/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              location: { lat: latitude, lng: longitude },
            }),
          });

          if (messageResponse.ok) {
            responseDiv.innerText = 'Biometric Authentication Sent Successfully.';
            await speakResponse('Biometric Authentication Sent Successfully.');
          } else {
            const messageData = await messageResponse.json();
            responseDiv.innerText = 'Error: ' + messageData.error;
            await speakResponse('Error: ' + messageData.error);
          }
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
    console.error("Error during authentication:", error);
    responseDiv.innerText = 'An error occurred during authentication.';
    await speakResponse('An error occurred during authentication.');
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
