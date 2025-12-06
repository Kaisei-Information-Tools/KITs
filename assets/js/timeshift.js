// Time Shift Camera - Delayed Mirror
class TimeShiftCamera {
  constructor() {
    // Constants
    this.MIN_DELAY_DURATION = 0.1;
    this.MAX_DELAY_DURATION = 600;
    this.frameRate = 30; // frames per second
    
    // DOM elements
    this.video = document.getElementById('video');
    this.videoLive = document.getElementById('video-live');
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.startButton = document.getElementById('start-button');
    this.stopButton = document.getElementById('stop-button');
    this.delayInput = document.getElementById('delay-input');
    this.delayLabel = document.getElementById('delay-label');
    this.statusText = document.getElementById('status-text');
    this.noCameraMessage = document.getElementById('no-camera-message');
    this.noCameraMessageLive = document.getElementById('no-camera-message-live');
    this.fullscreenButton = document.getElementById('fullscreen-button');
    this.container = document.getElementById('timeshift-container');
    this.videoDisplays = document.getElementById('video-displays');

    // State
    this.stream = null;
    this.running = false;
    this.frameBuffer = [];
    this.delayDuration = 5.0; // seconds
    this.maxFrames = Math.ceil(this.delayDuration * this.frameRate);
    this.animationFrameId = null;
    
    // Reusable temporary canvas for frame capture
    this.tempCanvas = document.createElement('canvas');
    this.tempCtx = this.tempCanvas.getContext('2d');

    this.initEventListeners();
  }

  initEventListeners() {
    this.startButton.addEventListener('click', () => this.start());
    this.stopButton.addEventListener('click', () => this.stop());
    this.delayInput.addEventListener('change', (e) => this.updateDelayDuration(parseFloat(e.target.value)));
    this.delayInput.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      if (!isNaN(value)) {
        this.delayLabel.textContent = value.toFixed(1) + '秒前';
      }
    });
    this.fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
    
    // Handle fullscreen change events (e.g., ESC key)
    document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('mozfullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('msfullscreenchange', () => this.handleFullscreenChange());
  }

  handleFullscreenChange() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && !document.msFullscreenElement) {
      // Exited fullscreen
      this.fullscreenButton.innerHTML = '<i class="fa-solid fa-expand"></i>';
      this.fullscreenButton.title = 'フルスクリーン';
    } else {
      // Entered fullscreen
      this.fullscreenButton.innerHTML = '<i class="fa-solid fa-compress"></i>';
      this.fullscreenButton.title = 'フルスクリーン終了';
    }
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

      // Set up both video elements
      this.video.srcObject = this.stream;
      this.videoLive.srcObject = this.stream;
      this.canvas.style.display = 'block';
      this.videoLive.style.display = 'block';
      this.noCameraMessage.style.display = 'none';
      this.noCameraMessageLive.style.display = 'none';

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
      this.delayInput.disabled = true;
      this.statusText.textContent = `${this.delayDuration.toFixed(1)}秒遅れの映像を表示中...`;

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
    this.videoLive.srcObject = null;
    this.startButton.disabled = false;
    this.stopButton.disabled = true;
    this.delayInput.disabled = false;
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
    // Validate and clamp duration
    duration = Math.max(this.MIN_DELAY_DURATION, Math.min(this.MAX_DELAY_DURATION, duration));
    this.delayDuration = duration;
    this.maxFrames = Math.ceil(this.delayDuration * this.frameRate);

    // Update input and label
    this.delayInput.value = duration.toFixed(1);
    this.delayLabel.textContent = duration.toFixed(1) + '秒前';

    // Trim buffer if it's too long
    if (this.frameBuffer.length > this.maxFrames) {
      this.frameBuffer = this.frameBuffer.slice(-this.maxFrames);
    }

    // Update status text if running
    if (this.running) {
      this.statusText.textContent = `${this.delayDuration.toFixed(1)}秒遅れの映像を表示中...`;
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && !document.msFullscreenElement) {
      // Enter fullscreen
      if (this.videoDisplays.requestFullscreen) {
        this.videoDisplays.requestFullscreen();
      } else if (this.videoDisplays.webkitRequestFullscreen) {
        this.videoDisplays.webkitRequestFullscreen();
      } else if (this.videoDisplays.mozRequestFullScreen) {
        this.videoDisplays.mozRequestFullScreen();
      } else if (this.videoDisplays.msRequestFullscreen) {
        this.videoDisplays.msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    // Button state will be updated by handleFullscreenChange event
  }

  showNoCameraMessage() {
    this.video.style.display = 'none';
    this.videoLive.style.display = 'none';
    this.noCameraMessage.style.display = 'flex';
    this.noCameraMessageLive.style.display = 'flex';
  }
}

// Initialize the camera when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const camera = new TimeShiftCamera();
});
