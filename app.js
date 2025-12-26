// Global variables
let video, canvas, ctx;
let pose;
let isPlaying = false;
let poseData = []; // Store all pose data with timestamps
let currentFrameIndex = 0;
let fps = 30; // Default FPS, will be updated
let isProcessing = false;

// MediaPipe Pose landmarks
const POSE_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
    [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
    [17, 19], [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
    [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28],
    [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]
];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initPose();
    setupEventListeners();
});

function initElements() {
    video = document.getElementById('videoPlayer');
    canvas = document.getElementById('overlayCanvas');
    ctx = canvas.getContext('2d');
}

function initPose() {
    pose = new Pose({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
    });

    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    pose.onResults(onPoseResults);
}

function setupEventListeners() {
    // Video upload
    document.getElementById('videoUpload').addEventListener('change', handleVideoUpload);

    // Playback controls
    document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);
    document.getElementById('prevFrameBtn').addEventListener('click', previousFrame);
    document.getElementById('nextFrameBtn').addEventListener('click', nextFrame);

    // Timeline
    const timeline = document.getElementById('timeline');
    timeline.addEventListener('input', (e) => {
        if (video.duration) {
            video.currentTime = (e.target.value / 100) * video.duration;
        }
    });

    // Video events
    video.addEventListener('loadedmetadata', onVideoLoaded);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', () => {
        isPlaying = true;
        updatePlayPauseButton();
        processVideoFrames();
    });
    video.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayPauseButton();
    });
    video.addEventListener('ended', () => {
        isPlaying = false;
        updatePlayPauseButton();
    });

    // Export controls
    document.getElementById('exportJsonBtn').addEventListener('click', exportAsJson);
    document.getElementById('exportCsvBtn').addEventListener('click', exportAsCsv);
    document.getElementById('clearDataBtn').addEventListener('click', clearPoseData);

    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);

    // Checkboxes
    document.getElementById('showSkeleton').addEventListener('change', () => {
        if (!isPlaying) {
            processCurrentFrame();
        }
    });

    // Window resize handler
    window.addEventListener('resize', () => {
        if (video.videoWidth > 0) {
            resizeCanvas();
        }
    });
}

function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        video.src = url;
        document.getElementById('videoContainer').style.display = 'block';
        showStatus('Video loaded successfully', 'success');
        clearPoseData();
    }
}

function onVideoLoaded() {
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Ensure canvas visually matches video dimensions
    resizeCanvas();

    // Estimate FPS (default to 30 if not available)
    fps = 30;

    // Update UI
    updateTimeDisplay();
    updateFrameDisplay();

    const duration = video.duration;
    const totalFrames = Math.floor(duration * fps);
    document.getElementById('totalFrames').textContent = totalFrames;

    showStatus('Video ready for analysis', 'info');
}

function resizeCanvas() {
    // Match canvas display size to video display size
    const rect = video.getBoundingClientRect();
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
}

function togglePlayPause() {
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
}

function updatePlayPauseButton() {
    const playIcon = document.querySelector('.play-icon');
    const pauseIcon = document.querySelector('.pause-icon');

    if (isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'inline';
    } else {
        playIcon.style.display = 'inline';
        pauseIcon.style.display = 'none';
    }
}

function previousFrame() {
    if (video.duration) {
        video.pause();
        const frameTime = 1 / fps;
        video.currentTime = Math.max(0, video.currentTime - frameTime);
        setTimeout(() => processCurrentFrame(), 50);
    }
}

function nextFrame() {
    if (video.duration) {
        video.pause();
        const frameTime = 1 / fps;
        video.currentTime = Math.min(video.duration, video.currentTime + frameTime);
        setTimeout(() => processCurrentFrame(), 50);
    }
}

function onTimeUpdate() {
    updateTimeDisplay();
    updateFrameDisplay();

    // Update timeline
    if (video.duration) {
        const timeline = document.getElementById('timeline');
        timeline.value = (video.currentTime / video.duration) * 100;
    }
}

function updateTimeDisplay() {
    const current = formatTime(video.currentTime || 0);
    const duration = formatTime(video.duration || 0);
    document.getElementById('timeDisplay').textContent = `${current} / ${duration}`;
}

function updateFrameDisplay() {
    const currentFrame = Math.floor(video.currentTime * fps);
    document.getElementById('currentFrame').textContent = currentFrame;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function processVideoFrames() {
    if (!isPlaying || !document.getElementById('enablePoseDetection').checked) return;

    try {
        await pose.send({ image: video });
        if (isPlaying) {
            requestAnimationFrame(processVideoFrames);
        }
    } catch (error) {
        console.error('Error processing frame:', error);
    }
}

async function processCurrentFrame() {
    if (!document.getElementById('enablePoseDetection').checked) {
        clearCanvas();
        return;
    }

    try {
        await pose.send({ image: video });
    } catch (error) {
        console.error('Error processing frame:', error);
    }
}

function onPoseResults(results) {
    // Clear canvas
    clearCanvas();

    if (results.poseLandmarks && document.getElementById('showSkeleton').checked) {
        // Draw skeleton
        drawSkeleton(results.poseLandmarks);

        // Store pose data with 3D coordinates
        storePoseData(results.poseLandmarks, results.poseWorldLandmarks);

        // Update UI
        document.getElementById('jointCount').textContent = results.poseLandmarks.length;
        document.getElementById('processedFrames').textContent = poseData.length;
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawSkeleton(landmarks) {
    const width = canvas.width;
    const height = canvas.height;

    // Draw connections
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 3;

    POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];

        if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
            ctx.beginPath();
            ctx.moveTo(start.x * width, start.y * height);
            ctx.lineTo(end.x * width, end.y * height);
            ctx.stroke();
        }
    });

    // Draw landmarks
    landmarks.forEach((landmark, index) => {
        if (landmark.visibility > 0.5) {
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(landmark.x * width, landmark.y * height, 5, 0, 2 * Math.PI);
            ctx.fill();

            // Draw landmark index
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '10px Arial';
            ctx.fillText(index, landmark.x * width + 8, landmark.y * height - 8);
        }
    });
}

function storePoseData(landmarks, worldLandmarks) {
    const timestamp = video.currentTime;
    const frameNumber = Math.floor(timestamp * fps);

    // Check if we already have data for this frame
    const existingIndex = poseData.findIndex(d => Math.abs(d.timestamp - timestamp) < 0.01);

    const frameData = {
        frame: frameNumber,
        timestamp: timestamp,
        landmarks2D: landmarks.map((lm, index) => ({
            id: index,
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility
        })),
        landmarks3D: worldLandmarks ? worldLandmarks.map((lm, index) => ({
            id: index,
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility
        })) : []
    };

    if (existingIndex >= 0) {
        poseData[existingIndex] = frameData;
    } else {
        poseData.push(frameData);
        poseData.sort((a, b) => a.timestamp - b.timestamp);
    }
}

function exportAsJson() {
    if (poseData.length === 0) {
        showStatus('No pose data to export. Process the video first.', 'error');
        return;
    }

    const dataStr = JSON.stringify({
        metadata: {
            totalFrames: poseData.length,
            fps: fps,
            duration: video.duration,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight
        },
        poseData: poseData
    }, null, 2);

    downloadFile(dataStr, 'pose_data.json', 'application/json');
    showStatus(`Exported ${poseData.length} frames to JSON`, 'success');
}

function exportAsCsv() {
    if (poseData.length === 0) {
        showStatus('No pose data to export. Process the video first.', 'error');
        return;
    }

    let csv = 'Frame,Timestamp,Landmark_ID,X_2D,Y_2D,Z_2D,X_3D,Y_3D,Z_3D,Visibility\n';

    poseData.forEach(frameData => {
        frameData.landmarks2D.forEach((lm2d, index) => {
            const lm3d = frameData.landmarks3D[index] || { x: 0, y: 0, z: 0 };
            csv += `${frameData.frame},${frameData.timestamp},${lm2d.id},${lm2d.x},${lm2d.y},${lm2d.z},${lm3d.x},${lm3d.y},${lm3d.z},${lm2d.visibility}\n`;
        });
    });

    downloadFile(csv, 'pose_data.csv', 'text/csv');
    showStatus(`Exported ${poseData.length} frames to CSV`, 'success');
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function clearPoseData() {
    poseData = [];
    document.getElementById('processedFrames').textContent = '0';
    document.getElementById('jointCount').textContent = '0';
    clearCanvas();
    showStatus('Pose data cleared', 'info');
}

function handleKeyPress(event) {
    if (!video.src) return;

    switch(event.code) {
        case 'Space':
            event.preventDefault();
            togglePlayPause();
            break;
        case 'ArrowLeft':
            event.preventDefault();
            previousFrame();
            break;
        case 'ArrowRight':
            event.preventDefault();
            nextFrame();
            break;
    }
}

function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;

    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 5000);
}
