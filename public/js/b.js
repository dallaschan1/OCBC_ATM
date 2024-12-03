// Ensure the DOM is fully loaded before executing the script
document.addEventListener('DOMContentLoaded', () => {
  // Get video and alert elements
  const video = document.getElementById('video');
  const alertBox = document.getElementById('Alert');

  // Load face-api models
  Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('../face-models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('../face-models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('../face-models'),
    faceapi.nets.faceExpressionNet.loadFromUri('../face-models')
  ]).then(startVideo).catch(err => console.error('Model loading error:', err));

  // Start the video stream
  function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
      .then(stream => {
        video.srcObject = stream;
        video.play();
      })
      .catch(err => console.error('Error accessing webcam:', err));
  }

  // Define detection options with adjusted parameters
  const detectionOptions = new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,      // Higher value for better accuracy
    scoreThreshold: 0.1  // Lowered to increase sensitivity
  });

  // Handle video loadeddata event to ensure video is ready
  video.addEventListener('loadeddata', () => {
    // Create and append a canvas matching the video dimensions
    const canvas = faceapi.createCanvasFromMedia(video);
    canvas.width = 250; // Set your desired canvas width
    canvas.height = 200; // Set your desired canvas height
    const videoWrapper = document.querySelector('.video-wrapper');
    videoWrapper.appendChild(canvas);

    // Define display size based on canvas dimensions
    const displaySize = { width: canvas.width, height: canvas.height };
    faceapi.matchDimensions(canvas, displaySize);

    // Debouncing variables
    let alertTimeout;
    const DEBOUNCE_DELAY = 1000; // 1 second

    // Function to process each video frame
    async function onPlay() {
      try {
        // Perform face detection within the canvas area
        const detections = await faceapi.detectAllFaces(video, detectionOptions)
          .withFaceLandmarks()
          .withFaceExpressions();

        // Resize detections to match display size
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        // Clear the canvas for new drawings
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Apply circular clipping mask (if desired)
        context.save();
        context.beginPath();
        const radius = Math.min(canvas.width, canvas.height) / 2;
        context.arc(radius, radius, radius, 0, Math.PI * 2);
        context.clip();

        // Draw detections (boxes, landmarks, expressions)
        // faceapi.draw.drawDetections(canvas, resizedDetections);
        // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        // faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

        context.restore();

        // Log the number of faces detected
        const numberOfFaces = resizedDetections.length;
        console.log('Number of faces detected:', numberOfFaces);

        // Handle alert display based on number of faces
        if (numberOfFaces > 1) {
          if (!alertBox.classList.contains('active')) {
            alertBox.classList.add('active');
          }
          clearTimeout(alertTimeout);
          alertTimeout = setTimeout(() => {
            alertBox.classList.remove('active');
          }, DEBOUNCE_DELAY);
        } else {
          alertBox.classList.remove('active');
        }
      } catch (error) {
        console.error('Error during face detection:', error);
      }

      // Continue processing the next frame
      requestAnimationFrame(onPlay);
    }

    // Start processing frames
    onPlay();
  });
});
