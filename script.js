let video;
let fps = 30; // Default, will be detected
let frameCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    video = document.getElementById('video');
    const videoInput = document.getElementById('videoInput');
    const videoSection = document.getElementById('videoSection');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const prevFrameBtn = document.getElementById('prevFrameBtn');
    const nextFrameBtn = document.getElementById('nextFrameBtn');

    // Handle video upload
    videoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            video.src = url;
            videoSection.style.display = 'block';
        }
    });

    // When video metadata is loaded
    video.addEventListener('loadedmetadata', async () => {
        // Detect FPS using requestVideoFrameCallback if available
        await detectFPS();

        // Calculate total frames
        frameCount = Math.floor(video.duration * fps);
        document.getElementById('totalFrames').textContent = frameCount;

        // Display video info
        console.log(`Video: ${video.videoWidth}x${video.videoHeight} @ ${fps} FPS`);
        console.log(`Duration: ${video.duration}s`);
        console.log(`Total Frames: ${frameCount}`);

        updateTimeDisplay();
        updateFrameNumber();
        updateVideoInfo();
    });

    // Update display as video plays
    video.addEventListener('timeupdate', () => {
        updateTimeDisplay();
        updateFrameNumber();
    });

    // Play button
    playBtn.addEventListener('click', () => {
        video.play();
    });

    // Pause button
    pauseBtn.addEventListener('click', () => {
        video.pause();
    });

    // Previous frame
    prevFrameBtn.addEventListener('click', () => {
        stepFrame(-1);
    });

    // Next frame
    nextFrameBtn.addEventListener('click', () => {
        stepFrame(1);
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (!video.src) return;

        if (e.code === 'Space') {
            e.preventDefault();
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        } else if (e.code === 'ArrowLeft') {
            e.preventDefault();
            prevFrameBtn.click();
        } else if (e.code === 'ArrowRight') {
            e.preventDefault();
            nextFrameBtn.click();
        }
    });
});

function updateTimeDisplay() {
    const current = formatTime(video.currentTime);
    const duration = formatTime(video.duration || 0);
    document.getElementById('timeDisplay').textContent = `${current} / ${duration}`;
}

function updateFrameNumber() {
    const frameNum = Math.floor(video.currentTime * fps);
    document.getElementById('frameNumber').textContent = frameNum;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function detectFPS() {
    return new Promise((resolve) => {
        if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
            // Use requestVideoFrameCallback for accurate FPS detection
            let lastTime = null;
            let frameTimes = [];
            let callbackCount = 0;
            const maxCallbacks = 10;

            const measureFrame = (now, metadata) => {
                if (lastTime !== null) {
                    const frameDuration = (now - lastTime) / 1000; // Convert to seconds
                    frameTimes.push(frameDuration);
                }
                lastTime = now;
                callbackCount++;

                if (callbackCount < maxCallbacks && !video.paused) {
                    video.requestVideoFrameCallback(measureFrame);
                } else {
                    // Calculate average FPS
                    if (frameTimes.length > 0) {
                        const avgFrameDuration = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
                        fps = Math.round(1 / avgFrameDuration);
                        // Clamp to common FPS values
                        if (fps >= 59 && fps <= 61) fps = 60;
                        else if (fps >= 29 && fps <= 31) fps = 30;
                        else if (fps >= 23 && fps <= 25) fps = 24;
                    }
                    video.pause();
                    video.currentTime = 0;
                    resolve();
                }
            };

            video.currentTime = 0;
            video.play().then(() => {
                video.requestVideoFrameCallback(measureFrame);
            });
        } else {
            // Fallback: assume standard FPS based on duration
            // Most common: 30 fps, but could be 24, 25, 60
            fps = 30; // Default assumption
            resolve();
        }
    });
}

function updateVideoInfo() {
    const info = document.getElementById('videoInfo');
    if (info) {
        info.textContent = `${video.videoWidth}x${video.videoHeight} @ ${fps} FPS`;
    }
}

function stepFrame(direction) {
    video.pause();
    const frameTime = 1 / fps;
    const newTime = video.currentTime + (frameTime * direction);

    // Clamp to valid range
    video.currentTime = Math.max(0, Math.min(video.duration, newTime));

    // Show visual feedback
    showFrameStepIndicator();
}

function showFrameStepIndicator() {
    const indicator = document.getElementById('frameStep');
    if (indicator) {
        indicator.style.display = 'block';
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 300);
    }
}
