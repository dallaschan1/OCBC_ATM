// Load models and start video feed
const video = document.getElementById('video');
const alertBox = document.getElementById('Alert'); // Select the alert box element

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri('../face-models'), // More accurate detector than tinyFaceDetector
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

const options = new faceapi.SsdMobilenetv1Options({
  minConfidence: 0.3, // Lower confidence threshold for more sensitivity to masked faces or distant faces
  maxResults: 10 // Increase max number of faces that can be detected
});

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  const videoWrapper = document.querySelector('.video-wrapper'); // Use the wrapper
  videoWrapper.append(canvas); // Attach the canvas inside the wrapper

  const displaySize = { width: video.videoWidth, height: video.videoHeight };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const context = canvas.getContext('2d', { willReadFrequently: true });

    // Clear previous drawings
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Apply circular clipping mask
    context.save();
    context.beginPath();
    const radius = canvas.width / 2;
    context.arc(radius, radius, radius, 0, Math.PI * 2); // Use same width and height for perfect circle
    context.clip();

    // Perform face detection
    const detections = await faceapi.detectAllFaces(video, options)
      .withFaceLandmarks()
      .withFaceExpressions();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    // Draw face detections and landmarks
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    // If more than one face is detected, activate alert
    if (resizedDetections.length > 1 || resizedDetections.length === 0) {
      alertBox.classList.add('active'); // Add 'active' class
    } else {
      alertBox.classList.remove('active'); // Remove 'active' class
    }

    context.restore(); // Restore the context after clipping
  }, 100); // Run detection every 100ms
});