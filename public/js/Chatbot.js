window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.interimResults = false; // Process only final results
recognition.lang = 'en-SG'; // Set to Singapore English for better transcription
recognition.continuous = true; // Continuous listening

let isRecognitionRunning = false;
let transcriptBuffer = "";

const voiceButton = document.getElementById("voice-button");

// Toggle recognition on button click
voiceButton.addEventListener("click", () => {
  if (isRecognitionRunning) {
    stopRecognition();
  } else {
    startRecognition();
  }
});

// Start speech recognition
function startRecognition() {
  if (!isRecognitionRunning) {
    recognition.start();
    isRecognitionRunning = true;
    updateButtonState();
    console.log("Speech recognition started.");
  }
}

// Stop speech recognition
function stopRecognition() {
  if (isRecognitionRunning) {
    recognition.stop();
    isRecognitionRunning = false;
    updateButtonState();
    console.log("Speech recognition stopped.");
  }
}

// Update button appearance based on recognition state
function updateButtonState() {
  if (isRecognitionRunning) {
    voiceButton.textContent = "Stop Listening";
    voiceButton.style.backgroundColor = "red";
  } else {
    voiceButton.textContent = "Start Listening";
    voiceButton.style.backgroundColor = "";
  }
}

// Handle speech recognition results
recognition.addEventListener("result", (event) => {
  const finalTranscript = Array.from(event.results)
    .filter(result => result.isFinal)
    .map(result => result[0].transcript)
    .join(' ')
    .trim();

  if (finalTranscript) {
    transcriptBuffer = finalTranscript;
    console.log("Final transcript:", transcriptBuffer);
    processUserInput(transcriptBuffer); // Send to backend
    transcriptBuffer = ""; // Clear buffer
  }
});

// Handle recognition errors
recognition.addEventListener("error", (event) => {
  console.error("Speech recognition error:", event.error);
  if (event.error === "not-allowed" || event.error === "service-not-allowed") {
    alert("Microphone access is denied. Please allow access to use the voice assistant.");
    stopRecognition();
  }
});

// Handle recognition end
recognition.addEventListener("end", () => {
  console.log("Speech recognition ended.");
  if (isRecognitionRunning) {
    console.log("Restarting recognition...");
    startRecognition();
  }
});

// Process user input by sending it to the backend
async function processUserInput(input) {
  try {
    const response = await fetch('http://localhost:3001/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput: input })
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.responseText;
    console.log("AI Response:", aiResponse);

    if (aiResponse) {
      await handleAIResponse(aiResponse);
    }
  } catch (error) {
    console.error('Error processing user input:', error);
  }
}

// Handle AI response logic
async function handleAIResponse(response) {
  if (response.includes("Convert Currency 1")) {
    openCard("convert-currency");
  } else if (response.includes("Crypto Currency Services 2")) {
    openCard("crypto-services");
  } else if (response.includes("Pay Bills 3")) {
    openCard("pay-bills");
  } else if (response.includes("Transfer Fund 4")) {
    openCard("transfer-fund");
  } else if (response.includes("Savings or Loan Details 5")) {
    openCard("loan-details");
  } else if (response.includes("Update Personal Particulars 6")) {
    openCard("update-personal");
  } else if (response.includes("Deposit Money 7")) {
    openCard("deposit-money");
  } else if (response.includes("Withdraw Money 8")) {
    openCard("withdraw-money");
  } else if (response.includes("Check Account Balance 9")) {
    openCard("check-balance");
  } else {
    await speakResponse(response);
  }
}

// Speak response using speech synthesis
function speakResponse(response) {
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(response);
    utterance.lang = 'en-SG';
    utterance.rate = 1.2; // Adjust rate for natural pacing
    utterance.pitch = 1.0;

    utterance.onend = resolve;
    utterance.onerror = (event) => reject(event.error);

    window.speechSynthesis.speak(utterance);
  });
}

// Open specific card based on AI response
function openCard(cardId) {
  const allCards = document.querySelectorAll('.option-card');
  allCards.forEach(card => (card.style.display = 'none'));

  const selectedCard = document.getElementById(cardId);
  if (selectedCard) {
    selectedCard.style.display = 'block';
    console.log(`Opening ${selectedCard.querySelector('h3').innerText}...`);
  }
}

