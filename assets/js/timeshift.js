// Time Shift Camera - Delayed Mirror
class TimeShiftCamera {
  constructor() {
    this.video = document.getElementById('video');
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.startButton = document.getElementById('start-button');
    this.stopButton = document.getElementById('stop-button');
    this.delayDurationSelect = document.getElementById('delay-duration');
    this.statusText = document.getElementById('status-text');
    this.noCameraMessage = document.getElementById('no-camera-message');

    this.stream = null;
    this.running = false;
    this.frameBuffer = [];
    this.delayDuration = 5; // seconds
    this.frameRate = 30; // frames per second
    this.maxFrames = this.delayDuration * this.frameRate;
    this.animationFrameId = null;
    
    // Reusable temporary canvas for frame capture
    this.tempCanvas = document.createElement('canvas');
    this.tempCtx = this.tempCanvas.getContext('2d');

    this.initEventListeners();
  }

  initEventListeners() {
    this.startButton.addEventListener('click', () => this.start());
    this.stopButton.addEventListener('click', () => this.stop());
    this.delayDurationSelect.addEventListener('change', (e) => this.updateDelayDuration(e.target.value));
  }

  async start() {
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
      this.canvas.style.display = 'block';
      this.noCameraMessage.style.display = 'none';

      // Wait for video to be ready
      await new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.canvas.width = this.video.videoWidth;
          this.canvas.height = this.video.videoHeight;
          resolve();
        };
      });

      this.running = true;
      this.frameBuffer = [];
      this.startButton.disabled = true;
      this.stopButton.disabled = false;
      this.delayDurationSelect.disabled = true;
      this.statusText.textContent = `${this.delayDuration}秒遅れの映像を表示中...`;

      // Set up temporary canvas size
      this.tempCanvas.width = this.video.videoWidth;
      this.tempCanvas.height = this.video.videoHeight;

      // Start the capture and render loop
      this.lastCaptureTime = 0;
      this.captureAndRender();

    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('カメラへのアクセスに失敗しました。カメラの使用を許可してください。');
      this.showNoCameraMessage();
    }
  }

  stop() {
    this.running = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.video.srcObject = null;
    this.startButton.disabled = false;
    this.stopButton.disabled = true;
    this.delayDurationSelect.disabled = false;
    this.frameBuffer = [];
    this.statusText.textContent = 'カメラを開始してください';
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  captureAndRender(timestamp = 0) {
    if (!this.running) return;

    // Capture frame at the desired frame rate
    const elapsed = timestamp - this.lastCaptureTime;
    const frameInterval = 1000 / this.frameRate;

    if (elapsed >= frameInterval) {
      this.captureFrame();
      this.renderDelayedFrame();
      this.lastCaptureTime = timestamp;
    }

    // Continue the loop
    this.animationFrameId = requestAnimationFrame((ts) => this.captureAndRender(ts));
  }

  captureFrame() {
    if (!this.running || this.video.readyState !== 4) return;

    // Draw video frame to temporary canvas
    this.tempCtx.drawImage(this.video, 0, 0, this.tempCanvas.width, this.tempCanvas.height);

    // Store frame as ImageData for better performance
    const imageData = this.tempCtx.getImageData(0, 0, this.tempCanvas.width, this.tempCanvas.height);

    this.frameBuffer.push({
      data: imageData,
      timestamp: Date.now()
    });

    // Keep only the most recent frames based on delay duration
    if (this.frameBuffer.length > this.maxFrames) {
      this.frameBuffer.shift();
    }
  }

  renderDelayedFrame() {
    if (!this.running || this.frameBuffer.length === 0) return;

    // Calculate which frame to display based on delay
    // Show the frame from delayDuration seconds ago, or the oldest available frame
    const desiredDelayFrames = this.delayDuration * this.frameRate;
    const availableDelayFrames = Math.min(this.frameBuffer.length, desiredDelayFrames);
    const targetFrameIndex = Math.max(0, this.frameBuffer.length - availableDelayFrames);
    
    if (targetFrameIndex < this.frameBuffer.length) {
      const frame = this.frameBuffer[targetFrameIndex];
      
      // Draw the delayed frame to canvas
      this.ctx.putImageData(frame.data, 0, 0);
    }
  }

  updateDelayDuration(duration) {
    this.delayDuration = parseInt(duration);
    this.maxFrames = this.delayDuration * this.frameRate;

    // Trim buffer if it's too long
    if (this.frameBuffer.length > this.maxFrames) {
      this.frameBuffer = this.frameBuffer.slice(-this.maxFrames);
    }

    // Update status text if running
    if (this.running) {
      this.statusText.textContent = `${this.delayDuration}秒遅れの映像を表示中...`;
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
