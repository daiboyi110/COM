let video;
let canvas;
let ctx;
let pose;
let fps = 30; // Default, will be detected
let frameCount = 0;
let isProcessing = false;
let showPose = true;
let showJointNumbers = true;
let processingInterval = 1000 / 5; // Default 5 FPS (200ms) - video plays at full speed
let processingTimer = null;
let poseDataArray = []; // Store all captured pose data

// MediaPipe Pose connections for drawing skeleton
const POSE_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
    [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
    [17, 19], [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
    [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28],
    [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]
];

document.addEventListener('DOMContentLoaded', () => {
    video = document.getElementById('video');
    canvas = document.getElementById('poseCanvas');
    ctx = canvas.getContext('2d');
    const videoInput = document.getElementById('videoInput');
    const videoSection = document.getElementById('videoSection');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const prevFrameBtn = document.getElementById('prevFrameBtn');
    const nextFrameBtn = document.getElementById('nextFrameBtn');
    const showPoseCheckbox = document.getElementById('showPose');
    const showJointNumbersCheckbox = document.getElementById('showJointNumbers');
    const processingSpeedSelect = document.getElementById('processingSpeed');

    // Initialize MediaPipe Pose
    initializePose();

    // Handle video upload
    videoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            video.src = url;
            videoSection.style.display = 'block';
            // Clear previous pose data
            poseDataArray = [];
            document.getElementById('capturedFrames').textContent = '0';
        }
    });

    // When video metadata is loaded
    video.addEventListener('loadedmetadata', async () => {
        // Detect FPS using requestVideoFrameCallback if available
        await detectFPS();

        // Calculate total frames
        frameCount = Math.floor(video.duration * fps);
        document.getElementById('totalFrames').textContent = frameCount;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Display video info
        console.log(`Video: ${video.videoWidth}x${video.videoHeight} @ ${fps} FPS`);
        console.log(`Duration: ${video.duration}s`);
        console.log(`Total Frames: ${frameCount}`);

        updateTimeDisplay();
        updateFrameNumber();
        updateVideoInfo();

        // Process first frame
        processPoseFrame();
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

    // Video play/pause events
    video.addEventListener('play', () => {
        startPoseProcessing();
    });

    video.addEventListener('pause', () => {
        stopPoseProcessing();
    });

    // Checkbox controls
    showPoseCheckbox.addEventListener('change', (e) => {
        showPose = e.target.checked;
        if (!video.paused) {
            clearCanvas();
        } else {
            processPoseFrame();
        }
    });

    showJointNumbersCheckbox.addEventListener('change', (e) => {
        showJointNumbers = e.target.checked;
        if (!video.paused) {
            clearCanvas();
        } else {
            processPoseFrame();
        }
    });

    // Processing speed control
    processingSpeedSelect.addEventListener('change', (e) => {
        const targetFPS = parseInt(e.target.value);
        processingInterval = 1000 / targetFPS;
        console.log(`Processing speed set to ${targetFPS} FPS (${processingInterval}ms interval)`);

        // Restart processing with new interval if video is playing
        if (!video.paused) {
            stopPoseProcessing();
            startPoseProcessing();
        }
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

    // Export button handlers
    document.getElementById('exportJsonBtn').addEventListener('click', exportAsJson);
    document.getElementById('exportCsvBtn').addEventListener('click', exportAsCsv);
    document.getElementById('exportExcelBtn').addEventListener('click', exportAsExcel);
    document.getElementById('clearDataBtn').addEventListener('click', clearPoseData);
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

    // Process pose for this frame
    setTimeout(() => processPoseFrame(), 100);
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

// Initialize MediaPipe Pose
function initializePose() {
    pose = new Pose({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
    });

    pose.setOptions({
        modelComplexity: 0, // Use lite model for faster processing
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    pose.onResults(onPoseResults);
    console.log('MediaPipe Pose initialized with lite model for better performance');
}

// Process a single frame for pose detection
async function processPoseFrame() {
    if (!pose || !video.videoWidth) return;

    try {
        await pose.send({ image: video });
    } catch (error) {
        console.error('Error processing frame:', error);
    }
}

// Start pose processing using interval (doesn't block video playback)
function startPoseProcessing() {
    stopPoseProcessing(); // Clear any existing timer

    if (!showPose) return;

    // Use setInterval to process frames independently of video playback
    processingTimer = setInterval(() => {
        if (!video.paused && !video.ended && showPose) {
            processPoseFrame().catch(err => console.error('Pose processing error:', err));
        } else {
            stopPoseProcessing();
        }
    }, processingInterval);

    console.log(`Pose processing started at ${1000/processingInterval} FPS`);
}

// Stop pose processing
function stopPoseProcessing() {
    if (processingTimer) {
        clearInterval(processingTimer);
        processingTimer = null;
    }
}

// Handle pose detection results
function onPoseResults(results) {
    clearCanvas();

    if (!showPose || !results.poseLandmarks) {
        document.getElementById('jointCount').textContent = '0';
        return;
    }

    drawPose(results.poseLandmarks);
    document.getElementById('jointCount').textContent = results.poseLandmarks.length;

    // Store pose data for export
    savePoseData(results.poseLandmarks, results.poseWorldLandmarks);
}

// Draw pose skeleton and landmarks
function drawPose(landmarks) {
    const width = canvas.width;
    const height = canvas.height;

    // Draw connections (skeleton)
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 4;

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

    // Draw landmarks (joints)
    landmarks.forEach((landmark, index) => {
        if (landmark.visibility > 0.5) {
            const x = landmark.x * width;
            const y = landmark.y * height;

            // Draw joint circle
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fill();

            // Draw joint number
            if (showJointNumbers) {
                ctx.fillStyle = '#FFFFFF';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3;
                ctx.font = 'bold 14px Arial';
                ctx.strokeText(index.toString(), x + 10, y - 10);
                ctx.fillText(index.toString(), x + 10, y - 10);
            }
        }
    });
}

// Clear the canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Save pose data for export
function savePoseData(landmarks2D, landmarks3D) {
    const currentTime = video.currentTime;
    const currentFrame = Math.floor(currentTime * fps);

    // Check if we already have data for this frame (avoid duplicates)
    const existingIndex = poseDataArray.findIndex(d => d.frame === currentFrame);

    const frameData = {
        frame: currentFrame,
        timestamp: currentTime,
        landmarks2D: landmarks2D.map((lm, index) => ({
            id: index,
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility
        })),
        landmarks3D: landmarks3D ? landmarks3D.map((lm, index) => ({
            id: index,
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility || 1.0
        })) : []
    };

    if (existingIndex >= 0) {
        poseDataArray[existingIndex] = frameData;
    } else {
        poseDataArray.push(frameData);
        poseDataArray.sort((a, b) => a.frame - b.frame);
    }

    // Update UI
    document.getElementById('capturedFrames').textContent = poseDataArray.length;
}

// Export as JSON
function exportAsJson() {
    if (poseDataArray.length === 0) {
        alert('No pose data to export. Play or step through the video to capture pose data.');
        return;
    }

    const exportData = {
        metadata: {
            totalFrames: frameCount,
            capturedFrames: poseDataArray.length,
            fps: fps,
            duration: video.duration,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            exportDate: new Date().toISOString()
        },
        poseData: poseDataArray
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    downloadFile(dataStr, 'pose_data.json', 'application/json');
    console.log(`Exported ${poseDataArray.length} frames to JSON`);
}

// Export as CSV
function exportAsCsv() {
    if (poseDataArray.length === 0) {
        alert('No pose data to export. Play or step through the video to capture pose data.');
        return;
    }

    let csv = 'Frame,Timestamp,Landmark_ID,X_2D,Y_2D,Z_2D,Visibility,X_3D,Y_3D,Z_3D\n';

    poseDataArray.forEach(frameData => {
        frameData.landmarks2D.forEach((lm2d, index) => {
            const lm3d = frameData.landmarks3D[index] || { x: 0, y: 0, z: 0 };
            csv += `${frameData.frame},${frameData.timestamp.toFixed(3)},${lm2d.id},${lm2d.x.toFixed(6)},${lm2d.y.toFixed(6)},${lm2d.z.toFixed(6)},${lm2d.visibility.toFixed(3)},${lm3d.x.toFixed(6)},${lm3d.y.toFixed(6)},${lm3d.z.toFixed(6)}\n`;
        });
    });

    downloadFile(csv, 'pose_data.csv', 'text/csv');
    console.log(`Exported ${poseDataArray.length} frames to CSV`);
}

// Export as Excel
function exportAsExcel() {
    if (poseDataArray.length === 0) {
        alert('No pose data to export. Play or step through the video to capture pose data.');
        return;
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Metadata sheet
    const metadataSheet = XLSX.utils.aoa_to_sheet([
        ['Property', 'Value'],
        ['Total Frames', frameCount],
        ['Captured Frames', poseDataArray.length],
        ['FPS', fps],
        ['Duration (seconds)', video.duration.toFixed(2)],
        ['Video Width', video.videoWidth],
        ['Video Height', video.videoHeight],
        ['Export Date', new Date().toISOString()]
    ]);
    XLSX.utils.book_append_sheet(wb, metadataSheet, 'Metadata');

    // Pose data sheet
    const poseDataRows = [['Frame', 'Timestamp', 'Landmark_ID', 'X_2D', 'Y_2D', 'Z_2D', 'Visibility', 'X_3D', 'Y_3D', 'Z_3D']];

    poseDataArray.forEach(frameData => {
        frameData.landmarks2D.forEach((lm2d, index) => {
            const lm3d = frameData.landmarks3D[index] || { x: 0, y: 0, z: 0 };
            poseDataRows.push([
                frameData.frame,
                parseFloat(frameData.timestamp.toFixed(3)),
                lm2d.id,
                parseFloat(lm2d.x.toFixed(6)),
                parseFloat(lm2d.y.toFixed(6)),
                parseFloat(lm2d.z.toFixed(6)),
                parseFloat(lm2d.visibility.toFixed(3)),
                parseFloat(lm3d.x.toFixed(6)),
                parseFloat(lm3d.y.toFixed(6)),
                parseFloat(lm3d.z.toFixed(6))
            ]);
        });
    });

    const poseSheet = XLSX.utils.aoa_to_sheet(poseDataRows);
    XLSX.utils.book_append_sheet(wb, poseSheet, 'Pose Data');

    // Summary by frame sheet
    const summaryRows = [['Frame', 'Timestamp', 'Detected_Joints', 'Avg_Visibility']];

    poseDataArray.forEach(frameData => {
        const avgVisibility = frameData.landmarks2D.reduce((sum, lm) => sum + lm.visibility, 0) / frameData.landmarks2D.length;
        summaryRows.push([
            frameData.frame,
            parseFloat(frameData.timestamp.toFixed(3)),
            frameData.landmarks2D.length,
            parseFloat(avgVisibility.toFixed(3))
        ]);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Download the file
    XLSX.writeFile(wb, 'pose_data.xlsx');
    console.log(`Exported ${poseDataArray.length} frames to Excel`);
}

// Clear all captured pose data
function clearPoseData() {
    if (poseDataArray.length === 0) {
        alert('No data to clear.');
        return;
    }

    if (confirm(`Are you sure you want to clear ${poseDataArray.length} frames of pose data?`)) {
        poseDataArray = [];
        document.getElementById('capturedFrames').textContent = '0';
        console.log('Pose data cleared');
    }
}

// Download file helper
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
