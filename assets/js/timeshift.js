// Timeshift Camera Implementation
let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingBuffer = []; // Ring buffer for storing frames
let maxBufferDuration = 10000; // Default 10 seconds in milliseconds
let isRecording = false;
let isPlayingBack = false;
let currentPlaybackIndex = 0;
let playbackInterval = null;
let lastFrameTime = 0;
let frameRate = 30; // Target frame rate
let frameInterval = 1000 / frameRate;

// DOM elements
const cameraPreview = document.getElementById('camera-preview');
const cameraCanvas = document.getElementById('camera-canvas');
const startCameraButton = document.getElementById('start-camera');
const stopCameraButton = document.getElementById('stop-camera');
const bufferDurationSelect = document.getElementById('buffer-duration');
const playbackSpeedSelect = document.getElementById('playback-speed');
const rewindButton = document.getElementById('rewind-button');
const framePrevButton = document.getElementById('frame-prev');
const frameNextButton = document.getElementById('frame-next');
const pauseButton = document.getElementById('pause-button');
const rewindSecondsSlider = document.getElementById('rewind-seconds');
const rewindValueSpan = document.getElementById('rewind-value');
const exportButton = document.getElementById('export-button');
const exportStatus = document.getElementById('export-status');
const progressBar = document.getElementById('progress-bar');

// Canvas context for capturing frames
const ctx = cameraCanvas.getContext('2d');

// Initialize event listeners
startCameraButton.addEventListener('click', startCamera);
stopCameraButton.addEventListener('click', stopCamera);
bufferDurationSelect.addEventListener('change', updateBufferDuration);
rewindButton.addEventListener('click', startRewindPlayback);
framePrevButton.addEventListener('click', framePrev);
frameNextButton.addEventListener('click', frameNext);
pauseButton.addEventListener('click', togglePause);
rewindSecondsSlider.addEventListener('input', updateRewindValue);
exportButton.addEventListener('click', exportVideo);

// Update rewind value display
function updateRewindValue() {
  rewindValueSpan.textContent = `${rewindSecondsSlider.value}秒`;
}

// Update buffer duration
function updateBufferDuration() {
  maxBufferDuration = parseInt(bufferDurationSelect.value) * 1000;
  rewindSecondsSlider.max = bufferDurationSelect.value;
  if (parseInt(rewindSecondsSlider.value) > parseInt(bufferDurationSelect.value)) {
    rewindSecondsSlider.value = bufferDurationSelect.value;
    updateRewindValue();
  }
}

// Start camera
async function startCamera() {
  try {
    // Request camera access
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false
    });

    cameraPreview.srcObject = mediaStream;
    
    // Set canvas size to match video
    cameraPreview.addEventListener('loadedmetadata', () => {
      cameraCanvas.width = cameraPreview.videoWidth;
      cameraCanvas.height = cameraPreview.videoHeight;
    });

    // Update UI
    startCameraButton.disabled = true;
    stopCameraButton.disabled = false;
    rewindButton.disabled = false;
    framePrevButton.disabled = false;
    frameNextButton.disabled = false;
    pauseButton.disabled = false;
    exportButton.disabled = false;

    // Start capturing frames
    isRecording = true;
    captureFrames();

  } catch (error) {
    console.error('Error accessing camera:', error);
    alert('カメラへのアクセスに失敗しました。カメラの使用を許可してください。');
  }
}

// Stop camera
function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  cameraPreview.srcObject = null;
  isRecording = false;
  isPlayingBack = false;

  if (playbackInterval) {
    clearInterval(playbackInterval);
    playbackInterval = null;
  }

  // Update UI
  startCameraButton.disabled = false;
  stopCameraButton.disabled = true;
  rewindButton.disabled = true;
  framePrevButton.disabled = true;
  frameNextButton.disabled = true;
  pauseButton.disabled = true;
  exportButton.disabled = true;

  // Clear buffer
  recordingBuffer = [];
  progressBar.style.width = '0%';
}

// Capture frames continuously
function captureFrames() {
  if (!isRecording || isPlayingBack) {
    requestAnimationFrame(captureFrames);
    return;
  }

  const currentTime = Date.now();
  
  if (currentTime - lastFrameTime >= frameInterval) {
    // Capture frame
    ctx.drawImage(cameraPreview, 0, 0, cameraCanvas.width, cameraCanvas.height);
    
    // Convert canvas to blob and store
    cameraCanvas.toBlob((blob) => {
      if (blob) {
        const frame = {
          blob: blob,
          timestamp: currentTime
        };

        recordingBuffer.push(frame);

        // Remove old frames if buffer is full
        const bufferStartTime = currentTime - maxBufferDuration;
        recordingBuffer = recordingBuffer.filter(frame => frame.timestamp >= bufferStartTime);

        // Update progress bar
        const bufferFillPercentage = (recordingBuffer.length * frameInterval / maxBufferDuration) * 100;
        progressBar.style.width = `${Math.min(bufferFillPercentage, 100)}%`;
      }
    }, 'image/jpeg', 0.8);

    lastFrameTime = currentTime;
  }

  requestAnimationFrame(captureFrames);
}

// Start rewind playback
function startRewindPlayback() {
  if (recordingBuffer.length === 0) {
    alert('録画されたデータがありません。');
    return;
  }

  isPlayingBack = true;
  
  // Calculate start index based on rewind seconds
  const rewindMs = parseInt(rewindSecondsSlider.value) * 1000;
  const currentTime = Date.now();
  const targetTime = currentTime - rewindMs;
  
  // Find the index of the frame closest to target time
  currentPlaybackIndex = recordingBuffer.findIndex(frame => frame.timestamp >= targetTime);
  if (currentPlaybackIndex === -1) {
    currentPlaybackIndex = 0;
  }

  // Get playback speed
  const playbackSpeed = parseFloat(playbackSpeedSelect.value);
  const playbackFrameInterval = frameInterval / playbackSpeed;

  // Stop live view
  cameraPreview.style.display = 'none';
  cameraCanvas.style.display = 'block';

  // Start playback
  if (playbackInterval) {
    clearInterval(playbackInterval);
  }

  playbackInterval = setInterval(() => {
    if (currentPlaybackIndex < recordingBuffer.length) {
      const frame = recordingBuffer[currentPlaybackIndex];
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, cameraCanvas.width, cameraCanvas.height);
      };
      img.src = URL.createObjectURL(frame.blob);
      currentPlaybackIndex++;
    } else {
      // Playback finished, return to live view
      stopPlayback();
    }
  }, playbackFrameInterval);

  // Update button text
  pauseButton.innerHTML = '<i class="fas fa-stop"></i> 停止';
}

// Stop playback and return to live view
function stopPlayback() {
  if (playbackInterval) {
    clearInterval(playbackInterval);
    playbackInterval = null;
  }

  isPlayingBack = false;
  cameraCanvas.style.display = 'none';
  cameraPreview.style.display = 'block';
  pauseButton.innerHTML = '<i class="fas fa-pause"></i> 一時停止';
}

// Toggle pause during playback
function togglePause() {
  if (!isPlayingBack) {
    startRewindPlayback();
  } else {
    stopPlayback();
  }
}

// Frame previous
function framePrev() {
  if (recordingBuffer.length === 0) {
    return;
  }

  // If not in playback mode, enter it
  if (!isPlayingBack) {
    isPlayingBack = true;
    cameraPreview.style.display = 'none';
    cameraCanvas.style.display = 'block';
    currentPlaybackIndex = recordingBuffer.length - 1;
  }

  // Stop interval if running
  if (playbackInterval) {
    clearInterval(playbackInterval);
    playbackInterval = null;
  }

  // Move to previous frame
  currentPlaybackIndex = Math.max(0, currentPlaybackIndex - 1);
  
  // Display frame
  const frame = recordingBuffer[currentPlaybackIndex];
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, cameraCanvas.width, cameraCanvas.height);
  };
  img.src = URL.createObjectURL(frame.blob);
}

// Frame next
function frameNext() {
  if (recordingBuffer.length === 0) {
    return;
  }

  // If not in playback mode, enter it
  if (!isPlayingBack) {
    isPlayingBack = true;
    cameraPreview.style.display = 'none';
    cameraCanvas.style.display = 'block';
    currentPlaybackIndex = 0;
  }

  // Stop interval if running
  if (playbackInterval) {
    clearInterval(playbackInterval);
    playbackInterval = null;
  }

  // Move to next frame
  currentPlaybackIndex = Math.min(recordingBuffer.length - 1, currentPlaybackIndex + 1);
  
  // Display frame
  const frame = recordingBuffer[currentPlaybackIndex];
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, cameraCanvas.width, cameraCanvas.height);
  };
  img.src = URL.createObjectURL(frame.blob);
}

// Export video
async function exportVideo() {
  if (recordingBuffer.length === 0) {
    alert('録画されたデータがありません。');
    return;
  }

  exportStatus.textContent = '動画を作成中...';
  exportButton.disabled = true;

  try {
    // Create a temporary canvas for encoding
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = cameraCanvas.width;
    exportCanvas.height = cameraCanvas.height;
    const exportCtx = exportCanvas.getContext('2d');

    // Use MediaRecorder to create video
    const stream = exportCanvas.captureStream(frameRate);
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000
    });

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeshift_${new Date().getTime()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      
      exportStatus.textContent = 'ダウンロード完了！';
      exportButton.disabled = false;
      
      setTimeout(() => {
        exportStatus.textContent = '';
      }, 3000);
    };

    recorder.start();

    // Render all frames
    let frameIndex = 0;
    const renderFrame = () => {
      if (frameIndex < recordingBuffer.length) {
        const frame = recordingBuffer[frameIndex];
        const img = new Image();
        img.onload = () => {
          exportCtx.drawImage(img, 0, 0, exportCanvas.width, exportCanvas.height);
          frameIndex++;
          setTimeout(renderFrame, frameInterval);
        };
        img.src = URL.createObjectURL(frame.blob);
      } else {
        recorder.stop();
      }
    };

    renderFrame();

  } catch (error) {
    console.error('Error exporting video:', error);
    exportStatus.textContent = 'エラーが発生しました。';
    exportButton.disabled = false;
    
    setTimeout(() => {
      exportStatus.textContent = '';
    }, 3000);
  }
}

// Initialize
updateRewindValue();
