// Load models and start video feed
const video = document.getElementById('video');
const alertBox = document.getElementById('Alert');

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('../face-models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('../face-models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('../face-models'),
  faceapi.nets.faceExpressionNet.loadFromUri('../face-models')
]).then(startVideo);

function startVideo() {
  navigator.getUserMedia(
    { video: { width: 1280, height: 720 } }, // Increase camera resolution for better detection
    stream => video.srcObject = stream,
    err => console.error(err)
  );
}

const options = new faceapi.TinyFaceDetectorOptions({
  inputSize: 512, // Higher values increase accuracy but reduce speed
  scoreThreshold: 0.5 // Adjust to balance between detection and false positives
});

const canvasWidth = 250;
const canvasHeight = 200;
let alertActive = false;
let debounceTimeout;
const DEBOUNCE_DELAY = 3000; // Alert remains active for 3 seconds

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const videoWrapper = document.querySelector('.video-wrapper');
  videoWrapper.append(canvas);

  const context = canvas.getContext('2d', { willReadFrequently: true });

  // Off-screen canvas for preprocessing
  const offScreenCanvas = document.createElement('canvas');
  offScreenCanvas.width = canvasWidth;
  offScreenCanvas.height = canvasHeight;
  const offScreenContext = offScreenCanvas.getContext('2d');

  const displaySize = { width: canvasWidth, height: canvasHeight };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    // Clear previous drawings
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the specific area of the video onto the off-screen canvas
    const videoX = 100; // Adjust as needed
    const videoY = 50;  // Adjust as needed
    offScreenContext.drawImage(
      video,
      videoX, videoY, canvasWidth, canvasHeight,
      0, 0, canvasWidth, canvasHeight
    );

    // Preprocess the frame
    preprocessFrame(offScreenContext, canvasWidth, canvasHeight);

    // Perform face detection on the off-screen canvas
    const detections = await faceapi.detectAllFaces(offScreenCanvas, options)
      .withFaceLandmarks()
      .withFaceExpressions();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    // Draw the preprocessed frame onto the main canvas (optional)
    context.drawImage(offScreenCanvas, 0, 0, canvasWidth, canvasHeight);

    // Apply circular clipping mask (optional)
    context.save();
    context.beginPath();
    const radius = canvasWidth / 2;
    context.arc(radius, radius, radius, 0, Math.PI * 2);
    context.clip();

    // Draw detections (optional)
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    context.restore();

    // Debouncing alert logic
    if (resizedDetections.length > 1) {
      if (!alertActive) {
        alertActive = true;
        alertBox.classList.add('active');

        debounceTimeout = setTimeout(() => {
          alertBox.classList.remove('active');
          alertActive = false;
        }, DEBOUNCE_DELAY);
      } else {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          alertBox.classList.remove('active');
          alertActive = false;
        }, DEBOUNCE_DELAY);
      }
    } else {
      // Optional: Hide the alert immediately when only one or no face is detected
      // clearTimeout(debounceTimeout);
      // alertBox.classList.remove('active');
      // alertActive = false;
    }
  }, 300);
});

function preprocessFrame(context, width, height) {
  const frameData = context.getImageData(0, 0, width, height);
  const data = frameData.data;

  // Simple brightness and contrast adjustment
  const brightness = 20; // Increase brightness
  const contrast = 1.2; // Increase contrast

  for (let i = 0; i < data.length; i += 4) {
    // Adjust brightness
    data[i] = data[i] + brightness;     // Red
    data[i + 1] = data[i + 1] + brightness; // Green
    data[i + 2] = data[i + 2] + brightness; // Blue

    // Adjust contrast
    data[i] = ((data[i] - 128) * contrast) + 128;
    data[i + 1] = ((data[i + 1] - 128) * contrast) + 128;
    data[i + 2] = ((data[i + 2] - 128) * contrast) + 128;
  }

  // Put the processed data back into the context
  context.putImageData(frameData, 0, 0);
}
