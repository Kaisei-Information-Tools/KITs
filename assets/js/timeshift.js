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
    this.captureInterval = null;
    this.renderInterval = null;

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

      // Start capturing frames
      this.captureInterval = setInterval(() => {
        this.captureFrame();
      }, 1000 / this.frameRate);

      // Start rendering delayed frames
      this.renderInterval = setInterval(() => {
        this.renderDelayedFrame();
      }, 1000 / this.frameRate);

    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('カメラへのアクセスに失敗しました。カメラの使用を許可してください。');
      this.showNoCameraMessage();
    }
  }

  stop() {
    this.running = false;
    clearInterval(this.captureInterval);
    clearInterval(this.renderInterval);
    this.captureInterval = null;
    this.renderInterval = null;

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

  captureFrame() {
    if (!this.running || this.video.readyState !== 4) return;

    // Create a temporary canvas to capture the frame
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.video.videoWidth;
    tempCanvas.height = this.video.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.drawImage(this.video, 0, 0, tempCanvas.width, tempCanvas.height);

    // Store frame as ImageData for better performance
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

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
    // We want to show the frame that is delayDuration seconds ago
    const targetFrameIndex = Math.max(0, this.frameBuffer.length - this.maxFrames);
    
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
