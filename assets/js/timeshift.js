// Time Shift Camera
class TimeShiftCamera {
  constructor() {
    this.video = document.getElementById('video');
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.startButton = document.getElementById('start-button');
    this.stopButton = document.getElementById('stop-button');
    this.captureButton = document.getElementById('capture-button');
    this.timeSlider = document.getElementById('time-slider');
    this.timeValue = document.getElementById('time-value');
    this.timeControls = document.getElementById('time-controls');
    this.bufferDurationSelect = document.getElementById('buffer-duration');
    this.photosContainer = document.getElementById('photos-container');
    this.noCameraMessage = document.getElementById('no-camera-message');

    this.stream = null;
    this.recording = false;
    this.frameBuffer = [];
    this.bufferDuration = 10; // seconds
    this.frameRate = 30; // frames per second
    this.maxFrames = this.bufferDuration * this.frameRate;
    this.captureInterval = null;
    this.currentFrameIndex = null;

    this.initEventListeners();
  }

  initEventListeners() {
    this.startButton.addEventListener('click', () => this.startRecording());
    this.stopButton.addEventListener('click', () => this.stopRecording());
    this.captureButton.addEventListener('click', () => this.capturePhoto());
    this.timeSlider.addEventListener('input', (e) => this.updateTimePosition(e.target.value));
    this.bufferDurationSelect.addEventListener('change', (e) => this.updateBufferDuration(e.target.value));
  }

  async startRecording() {
    try {
      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      this.video.srcObject = this.stream;
      this.video.style.display = 'block';
      this.noCameraMessage.style.display = 'none';

      // Wait for video to be ready
      await new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.canvas.width = this.video.videoWidth;
          this.canvas.height = this.video.videoHeight;
          resolve();
        };
      });

      this.recording = true;
      this.frameBuffer = [];
      this.startButton.disabled = true;
      this.stopButton.disabled = false;
      this.captureButton.disabled = false;
      this.timeControls.style.display = 'block';

      // Start capturing frames
      this.captureInterval = setInterval(() => {
        this.captureFrame();
      }, 1000 / this.frameRate);

    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('カメラへのアクセスに失敗しました。カメラの使用を許可してください。');
      this.showNoCameraMessage();
    }
  }

  stopRecording() {
    this.recording = false;
    clearInterval(this.captureInterval);
    this.captureInterval = null;

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.video.srcObject = null;
    this.startButton.disabled = false;
    this.stopButton.disabled = true;
    this.captureButton.disabled = true;
    this.timeControls.style.display = 'none';
    this.frameBuffer = [];
  }

  captureFrame() {
    if (!this.recording || !this.video.readyState === 4) return;

    // Create a temporary canvas to capture the frame
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.video.videoWidth;
    tempCanvas.height = this.video.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.drawImage(this.video, 0, 0, tempCanvas.width, tempCanvas.height);

    // Store frame as data URL
    const frameData = tempCanvas.toDataURL('image/jpeg', 0.8);

    this.frameBuffer.push({
      data: frameData,
      timestamp: Date.now()
    });

    // Keep only the most recent frames based on buffer duration
    if (this.frameBuffer.length > this.maxFrames) {
      this.frameBuffer.shift();
    }

    // Update time slider max value
    const bufferDurationMs = this.frameBuffer.length / this.frameRate;
    this.updateTimeDisplay(bufferDurationMs);
  }

  updateTimePosition(value) {
    const percentage = parseInt(value);
    const bufferDurationMs = this.frameBuffer.length / this.frameRate;
    const secondsAgo = ((100 - percentage) / 100) * bufferDurationMs;

    this.timeValue.textContent = secondsAgo.toFixed(1) + '秒前';

    // Calculate which frame to show
    const frameIndex = Math.floor((percentage / 100) * (this.frameBuffer.length - 1));
    this.currentFrameIndex = Math.max(0, Math.min(frameIndex, this.frameBuffer.length - 1));

    // Preview the selected frame
    if (this.frameBuffer.length > 0 && this.currentFrameIndex !== null) {
      const frame = this.frameBuffer[this.currentFrameIndex];
      const img = new Image();
      img.onload = () => {
        this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
      };
      img.src = frame.data;
    }
  }

  updateTimeDisplay(bufferDurationMs) {
    const sliderValue = parseInt(this.timeSlider.value);
    const secondsAgo = ((100 - sliderValue) / 100) * bufferDurationMs;
    this.timeValue.textContent = secondsAgo.toFixed(1) + '秒前';
  }

  capturePhoto() {
    if (this.frameBuffer.length === 0) {
      alert('録画されたフレームがありません。');
      return;
    }

    // Determine which frame to capture
    let frameIndex;
    if (this.currentFrameIndex !== null && parseInt(this.timeSlider.value) < 100) {
      // User has moved the slider, use selected frame
      frameIndex = this.currentFrameIndex;
    } else {
      // Use the most recent frame
      frameIndex = this.frameBuffer.length - 1;
    }

    const frame = this.frameBuffer[frameIndex];
    const sliderValue = parseInt(this.timeSlider.value);
    const bufferDurationMs = this.frameBuffer.length / this.frameRate;
    const secondsAgo = ((100 - sliderValue) / 100) * bufferDurationMs;

    // Add to captured photos
    this.addCapturedPhoto(frame.data, secondsAgo);

    // Reset slider to current
    this.timeSlider.value = 100;
    this.currentFrameIndex = null;
    this.updateTimeDisplay(bufferDurationMs);
  }

  addCapturedPhoto(imageData, secondsAgo) {
    // Remove "no photos" message if exists
    const noPhotos = this.photosContainer.querySelector('.no-photos');
    if (noPhotos) {
      noPhotos.remove();
    }

    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item';

    const img = document.createElement('img');
    img.src = imageData;
    img.alt = 'Captured photo';

    const info = document.createElement('div');
    info.className = 'photo-item-info';

    const timestamp = document.createElement('span');
    timestamp.className = 'photo-timestamp';
    const timeText = secondsAgo > 0.1 ? `${secondsAgo.toFixed(1)}秒前` : '現在';
    timestamp.textContent = timeText;

    const actions = document.createElement('div');
    actions.className = 'photo-actions';

    const downloadButton = document.createElement('button');
    downloadButton.className = 'photo-action-button';
    downloadButton.innerHTML = '<i class="fa-solid fa-download"></i> 保存';
    downloadButton.addEventListener('click', () => this.downloadPhoto(imageData));

    const deleteButton = document.createElement('button');
    deleteButton.className = 'photo-action-button delete';
    deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i> 削除';
    deleteButton.addEventListener('click', () => photoItem.remove());

    actions.appendChild(downloadButton);
    actions.appendChild(deleteButton);
    info.appendChild(timestamp);
    info.appendChild(actions);
    photoItem.appendChild(img);
    photoItem.appendChild(info);

    this.photosContainer.insertBefore(photoItem, this.photosContainer.firstChild);
  }

  downloadPhoto(imageData) {
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `timeshift-${timestamp}.jpg`;
    link.href = imageData;
    link.click();
  }

  updateBufferDuration(duration) {
    this.bufferDuration = parseInt(duration);
    this.maxFrames = this.bufferDuration * this.frameRate;

    // Trim buffer if it's too long
    if (this.frameBuffer.length > this.maxFrames) {
      this.frameBuffer = this.frameBuffer.slice(-this.maxFrames);
    }
  }

  showNoCameraMessage() {
    this.video.style.display = 'none';
    this.noCameraMessage.style.display = 'flex';
  }
}

// Initialize the camera when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const camera = new TimeShiftCamera();
});
