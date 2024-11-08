// Load models and start video feed
const video = document.getElementById('video');
const alertBox = document.getElementById('Alert');

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri('../face-models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('../face-models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('../face-models'),
  faceapi.nets.faceExpressionNet.loadFromUri('../face-models')
]).then(startVideo);

function startVideo() {
  navigator.getUserMedia(
    { video: { width: 200, height: 200 } }, // Increase camera resolution for better detection
    stream => video.srcObject = stream,
    err => console.error(err)
  );
}

const options = new faceapi.SsdMobilenetv1Options({
  minConfidence: 0.3,
  maxResults: 10
});

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  const videoWrapper = document.querySelector('.video-wrapper');
  videoWrapper.append(canvas);

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

    // Show alert if more than one person is detected
    if (resizedDetections.length > 1) {
      alertBox.classList.add('active');
    } else {
      alertBox.classList.remove('active');
    }

    context.restore();
  }, 100);
});
