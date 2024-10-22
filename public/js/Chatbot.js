window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.interimResults = true;  
recognition.lang = 'en-US';
recognition.continuous = true;  

let isSending = false; 
let silenceTimeout;  
let transcriptBuffer = ""; 
const textDisplay = document.getElementById('textDisplay');


window.onload = () => {
    recognition.start();
    console.log("Speech recognition started.");
};

// Handle speech recognition result
recognition.addEventListener('result', (event) => {
    // Accumulate the user's speech into the buffer
    transcriptBuffer = Array.from(event.results)
        .map(result => result[0].transcript)
        .join(' ')
        .trim();

    console.log("Partial transcript:", transcriptBuffer);
    textDisplay.innerText = `Listening: ${transcriptBuffer}`;

    // Reset the silence timeout whenever the user is speaking
    if (silenceTimeout) clearTimeout(silenceTimeout);

    
    silenceTimeout = setTimeout(() => {
        console.log("User stopped speaking. Sending input to Gemini...");
        processUserInput(transcriptBuffer);  
        transcriptBuffer = ""; 
    }, 2000); 
});

// Function for Text-to-Speech (TTS)
function speakResponse(response) {
    return new Promise((resolve, reject) => {
        window.speechSynthesis.cancel(); 

        const utterance = new SpeechSynthesisUtterance(response);
        utterance.lang = 'en-US';
        utterance.rate = 1.5;  
        utterance.pitch = 1.0; 
        
        
        const voices = window.speechSynthesis.getVoices();
        utterance.voice = voices.find(voice => voice.name.includes("Google US English")) || voices[0];

        utterance.onend = () => resolve();  
        utterance.onerror = (event) => reject(event.error);

        window.speechSynthesis.speak(utterance);
    });
}


// Handle errors and end events
recognition.addEventListener('error', (event) => {
    console.error('Speech recognition error:', event.error);
    if (event.error === 'no-speech') {
        console.log("No speech detected. Restarting...");
        recognition.start();
    }
});

recognition.addEventListener('end', () => {
    if (!isSending) {
        console.log("Speech recognition ended. Restarting...");
        recognition.start();  
    }
});

// Function to send user input to the backend
async function processUserInput(input) {
    if (isSending) return;  
    isSending = true;

    
    recognition.stop();
    textDisplay.innerText = `Processing: ${input}`;

    try {
        const response = await fetch('http://localhost:3001/api/converse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput: input })
        });

        const data = await response.json();
        if (data && data.response) {
            textDisplay.innerText = `Gemini AI says: ${data.response}`;
            await speakResponse(data.response);  // Wait for TTS to finish
        }
    } catch (error) {
        console.error('Error while fetching response from server:', error);
        textDisplay.innerText = "Error: Could not get a response from the server.";
    }

    // Resume recognition after processing the response
    isSending = false;
    recognition.start();
    console.log("Speech recognition resumed.");
}

