window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.interimResults = false; // Process only finalized results
recognition.lang = 'en-US'; // Use 'en-SG' for Singapore English
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

// Start speech recognition
function startRecognition() {
  isRecognitionRunning = true;
  transcriptBuffer = ""; // Clear any previous transcript
  updateButtonState();
  recognition.start();
  console.log("Speech recognition started.");
}

// Stop speech recognition
function stopRecognition(sendTranscript = false) {
  isRecognitionRunning = false;
  recognition.stop(); // Explicitly stop recognition
  updateButtonState();
  console.log("Speech recognition stopped.");

  // If `sendTranscript` is true, process the buffer
  if (sendTranscript && transcriptBuffer.trim()) {
    console.log("Final transcript to send:", transcriptBuffer.trim());
    processUserInput(transcriptBuffer.trim());
    transcriptBuffer = ""; // Clear the buffer after processing
  }
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
    recognition.start(); // Restart recognition to maintain continuous listening
  }
});

// Process user input and handle backend responses
async function processUserInput(input) {
  try {
    console.log("Sending transcript to the backend:", input);

    const response = await fetch('/moreServicesChat', {
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
      // Stop recognition and redirect to the exit page
      stopRecognition();
      window.location.href = '/exit';
    } else {
      await speakResponse(aiResponse);
    }
  } catch (error) {
    console.error("Error while fetching response from server:", error);
  }
}

// Speak a response using SpeechSynthesis
function speakResponse(response) {
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(response);
    utterance.lang = 'en-US'; // Use 'en-SG' for Singapore English
    utterance.rate = 1.2;
    utterance.pitch = 1.0;

    utterance.onend = resolve;
    utterance.onerror = reject;

    window.speechSynthesis.speak(utterance);
  });
}

// Handle recognition errors
recognition.addEventListener("error", (event) => {
  console.error("Speech recognition error:", event.error);
  if (isRecognitionRunning) {
    console.log("Restarting recognition due to error...");
    recognition.start(); // Restart recognition after an error
  }
});
