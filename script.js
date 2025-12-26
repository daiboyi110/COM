let video;
let fps = 30;

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
    video.addEventListener('loadedmetadata', () => {
        updateTimeDisplay();
        updateFrameNumber();
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
        video.pause();
        const frameTime = 1 / fps;
        video.currentTime = Math.max(0, video.currentTime - frameTime);
    });

    // Next frame
    nextFrameBtn.addEventListener('click', () => {
        video.pause();
        const frameTime = 1 / fps;
        video.currentTime = Math.min(video.duration, video.currentTime + frameTime);
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
