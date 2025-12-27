let video;
let canvas;
let ctx;
let imageDisplay;
let imageCanvas;
let imageCtx;
let pose;
let fps = 30; // Default, will be detected
let frameCount = 0;
let isProcessing = false;
let showPose = true;
let showJointNumbers = true;
let showCoordinates = false;
let showCOMCoordinates = false;
let processingInterval = 1000 / 5; // Default 5 FPS (200ms) - video plays at full speed
let processingTimer = null;
let poseDataArray = []; // Store all captured pose data

// Image mode variables
let showPoseImage = true;
let showJointNumbersImage = true;
let showCoordinatesImage = false;
let showCOMCoordinatesImage = false;
let imagePoseData = null; // Store pose data for the image

// Analysis mode variables
let analysisModeVideo = '2D'; // '2D' or '3D'
let analysisModeImage = '2D'; // '2D' or '3D'

// Sex selection for COM calculation
let sexSelectionVideo = 'male'; // 'male' or 'female'
let sexSelectionImage = 'male'; // 'male' or 'female'

// Joint dragging variables
let isDragging = false;
let draggedJointIndex = null;
let draggedJointFrame = null; // For video: which frame is being edited
let isEditMode = false; // Toggle edit mode on/off

// Calibration points for 2D analysis (normalized coordinates 0-1)
let calibrationPoint1Video = { x: 0.3, y: 0.5 }; // Point 1 for video
let calibrationPoint2Video = { x: 0.7, y: 0.5 }; // Point 2 for video
let calibrationPoint1Image = { x: 0.3, y: 0.5 }; // Point 1 for image
let calibrationPoint2Image = { x: 0.7, y: 0.5 }; // Point 2 for image
let draggedCalibrationPoint = null; // Which calibration point is being dragged ('point1' or 'point2')
let calibrationScaleVideo = 1.0; // Scale length in meters for video
let calibrationScaleImage = 1.0; // Scale length in meters for image

// MediaPipe Pose landmark names (33 landmarks + 2 calculated)
const LANDMARK_NAMES = [
    'Nose',
    'Left_Eye_Inner',
    'Left_Eye',
    'Left_Eye_Outer',
    'Right_Eye_Inner',
    'Right_Eye',
    'Right_Eye_Outer',
    'Left_Ear',
    'Right_Ear',
    'Mouth_Left',
    'Mouth_Right',
    'Left_Shoulder',
    'Right_Shoulder',
    'Left_Elbow',
    'Right_Elbow',
    'Left_Wrist',
    'Right_Wrist',
    'Left_Pinky',
    'Right_Pinky',
    'Left_Index',
    'Right_Index',
    'Left_Thumb',
    'Right_Thumb',
    'Left_Hip',
    'Right_Hip',
    'Left_Knee',
    'Right_Knee',
    'Left_Ankle',
    'Right_Ankle',
    'Left_Heel',
    'Right_Heel',
    'Left_Foot_Index',
    'Right_Foot_Index',
    'Mid_Shoulder',  // 33: Calculated midpoint
    'Mid_Hip',       // 34: Calculated midpoint
    'Head_COM',      // 35: Center of Mass
    'Trunk_COM',     // 36: Center of Mass
    'Left_Upper_Arm_COM',   // 37: Center of Mass
    'Right_Upper_Arm_COM',  // 38: Center of Mass
    'Left_Forearm_COM',     // 39: Center of Mass
    'Right_Forearm_COM',    // 40: Center of Mass
    'Left_Hand_COM',        // 41: Center of Mass
    'Right_Hand_COM',       // 42: Center of Mass
    'Left_Thigh_COM',       // 43: Center of Mass
    'Right_Thigh_COM',      // 44: Center of Mass
    'Left_Shank_COM',       // 45: Center of Mass
    'Right_Shank_COM',      // 46: Center of Mass
    'Left_Foot_COM',        // 47: Center of Mass
    'Right_Foot_COM',       // 48: Center of Mass
    'Total_Body_COM'        // 49: Total Body Center of Mass
];

// Segment definitions for Center of Mass calculations
// Each segment has proximal and distal joint indices and COM position percentages for male/female
const SEGMENT_DEFINITIONS = [
    { name: 'Head_COM', index: 35, proximal: 7, distal: 8, male: 0.5, female: 0.5 },
    { name: 'Trunk_COM', index: 36, proximal: 33, distal: 34, male: 0.431, female: 0.3782 },
    { name: 'Left_Upper_Arm_COM', index: 37, proximal: 11, distal: 13, male: 0.5772, female: 0.5754 },
    { name: 'Right_Upper_Arm_COM', index: 38, proximal: 12, distal: 14, male: 0.5772, female: 0.5754 },
    { name: 'Left_Forearm_COM', index: 39, proximal: 13, distal: 15, male: 0.4574, female: 0.4559 },
    { name: 'Right_Forearm_COM', index: 40, proximal: 14, distal: 16, male: 0.4574, female: 0.4559 },
    { name: 'Left_Hand_COM', index: 41, proximal: 15, distal: 19, male: 0.7900, female: 0.7474 },
    { name: 'Right_Hand_COM', index: 42, proximal: 16, distal: 20, male: 0.7900, female: 0.7474 },
    { name: 'Left_Thigh_COM', index: 43, proximal: 23, distal: 25, male: 0.4095, female: 0.3612 },
    { name: 'Right_Thigh_COM', index: 44, proximal: 24, distal: 26, male: 0.4095, female: 0.3612 },
    { name: 'Left_Shank_COM', index: 45, proximal: 25, distal: 27, male: 0.4459, female: 0.4416 },
    { name: 'Right_Shank_COM', index: 46, proximal: 26, distal: 28, male: 0.4459, female: 0.4416 },
    { name: 'Left_Foot_COM', index: 47, proximal: 29, distal: 31, male: 0.4415, female: 0.4014 },
    { name: 'Right_Foot_COM', index: 48, proximal: 30, distal: 32, male: 0.4415, female: 0.4014 }
];

// Segment mass percentages (proportion of total body mass)
// Used for calculating total body center of mass
const SEGMENT_MASS_PERCENTAGES = [
    { name: 'Head_COM', index: 35, male: 0.0694, female: 0.0668 },
    { name: 'Trunk_COM', index: 36, male: 0.4346, female: 0.4257 },
    { name: 'Left_Upper_Arm_COM', index: 37, male: 0.0271, female: 0.0255 },
    { name: 'Right_Upper_Arm_COM', index: 38, male: 0.0271, female: 0.0255 },
    { name: 'Left_Forearm_COM', index: 39, male: 0.0162, female: 0.0138 },
    { name: 'Right_Forearm_COM', index: 40, male: 0.0162, female: 0.0138 },
    { name: 'Left_Hand_COM', index: 41, male: 0.0061, female: 0.0056 },
    { name: 'Right_Hand_COM', index: 42, male: 0.0061, female: 0.0056 },
    { name: 'Left_Thigh_COM', index: 43, male: 0.1416, female: 0.1478 },
    { name: 'Right_Thigh_COM', index: 44, male: 0.1416, female: 0.1478 },
    { name: 'Left_Shank_COM', index: 45, male: 0.0433, female: 0.0481 },
    { name: 'Right_Shank_COM', index: 46, male: 0.0433, female: 0.0481 },
    { name: 'Left_Foot_COM', index: 47, male: 0.0137, female: 0.0129 },
    { name: 'Right_Foot_COM', index: 48, male: 0.0137, female: 0.0129 }
];

// Landmarks to exclude from display
// 0-6: Nose and eye landmarks
// 9-10: Mouth landmarks
// 17-18: Left and right pinky fingers
// 21-22: Left and right thumb landmarks
const EXCLUDED_LANDMARKS = [0, 1, 2, 3, 4, 5, 6, 9, 10, 17, 18, 21, 22];

// MediaPipe Pose connections for drawing skeleton
const POSE_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
    [7, 8], // Added connection between left and right ears
    [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
    [17, 19], [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
    [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28],
    [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]
];

// Filter connections to exclude those involving excluded landmarks
const FILTERED_POSE_CONNECTIONS = POSE_CONNECTIONS.filter(([startIdx, endIdx]) => {
    return !EXCLUDED_LANDMARKS.includes(startIdx) && !EXCLUDED_LANDMARKS.includes(endIdx);
});

document.addEventListener('DOMContentLoaded', () => {
    video = document.getElementById('video');
    canvas = document.getElementById('poseCanvas');
    ctx = canvas.getContext('2d');
    imageDisplay = document.getElementById('imageDisplay');
    imageCanvas = document.getElementById('imageCanvas');
    imageCtx = imageCanvas.getContext('2d');

    const videoInput = document.getElementById('videoInput');
    const imageInput = document.getElementById('imageInput');
    const videoSection = document.getElementById('videoSection');
    const imageSection = document.getElementById('imageSection');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const prevFrameBtn = document.getElementById('prevFrameBtn');
    const nextFrameBtn = document.getElementById('nextFrameBtn');
    const showPoseCheckbox = document.getElementById('showPose');
    const showJointNumbersCheckbox = document.getElementById('showJointNumbers');
    const showCoordinatesCheckbox = document.getElementById('showCoordinates');
    const showCOMCoordinatesCheckbox = document.getElementById('showCOMCoordinates');
    const fullSizeVideoCheckbox = document.getElementById('fullSizeVideo');
    const processingSpeedSelect = document.getElementById('processingSpeed');

    // Image controls
    const showPoseImageCheckbox = document.getElementById('showPoseImage');
    const showJointNumbersImageCheckbox = document.getElementById('showJointNumbersImage');
    const showCoordinatesImageCheckbox = document.getElementById('showCoordinatesImage');
    const showCOMCoordinatesImageCheckbox = document.getElementById('showCOMCoordinatesImage');
    const fullSizeImageCheckbox = document.getElementById('fullSizeImage');
    const editModeImageCheckbox = document.getElementById('editModeImage');

    // Video edit mode
    const editModeVideoCheckbox = document.getElementById('editModeVideo');

    // Close buttons
    const closeImageBtn = document.getElementById('closeImageBtn');
    const closeVideoBtn = document.getElementById('closeVideoBtn');

    // Check if XLSX library is loaded
    if (typeof XLSX !== 'undefined') {
        console.log('✓ SheetJS (XLSX) library loaded successfully');
    } else {
        console.error('✗ SheetJS (XLSX) library failed to load - Excel export will not work');
    }

    // Initialize MediaPipe Pose
    initializePose();

    // Handle video upload
    videoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            video.src = url;
            videoSection.style.display = 'block';

            // Close image section if open
            if (imageSection.style.display !== 'none') {
                imageSection.style.display = 'none';
                imageDisplay.src = '';
                imagePoseData = null;
                imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
                imageInput.value = '';
            }

            // Clear previous pose data
            poseDataArray = [];
            document.getElementById('capturedFrames').textContent = '0';
        }
    });

    // Handle image upload
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log('Image file selected:', file.name);
            const url = URL.createObjectURL(file);
            imageDisplay.src = url;
            imageSection.style.display = 'block';

            // Close video section if open
            if (videoSection.style.display !== 'none') {
                video.pause();
                videoSection.style.display = 'none';
                video.src = '';
                poseDataArray = [];
                clearCanvas();
                videoInput.value = '';
            }

            imagePoseData = null;

            imageDisplay.onload = () => {
                console.log('Image loaded:', imageDisplay.naturalWidth, 'x', imageDisplay.naturalHeight);

                // Set canvas size to match image
                imageCanvas.width = imageDisplay.naturalWidth;
                imageCanvas.height = imageDisplay.naturalHeight;

                console.log('Canvas size set to:', imageCanvas.width, 'x', imageCanvas.height);

                // Update info
                document.getElementById('imageInfo').textContent =
                    `${imageDisplay.naturalWidth} × ${imageDisplay.naturalHeight}`;

                // Draw calibration points immediately if in 2D mode
                redrawImagePose();

                // Process pose estimation on the image
                console.log('Processing pose estimation...');
                processImagePose();
            };

            imageDisplay.onerror = (error) => {
                console.error('Error loading image:', error);
                alert('Failed to load image. Please try a different file.');
            };
        }
    });

    // Close image button
    closeImageBtn.addEventListener('click', () => {
        // Hide image section
        imageSection.style.display = 'none';

        // Clear image data
        imageDisplay.src = '';
        imagePoseData = null;

        // Clear canvas
        imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);

        // Reset checkboxes
        if (editModeImageCheckbox.checked) {
            editModeImageCheckbox.checked = false;
            imageCanvas.classList.remove('editable');
            isEditMode = false;
        }

        // Reset input
        imageInput.value = '';

        console.log('Image closed and data cleared');
    });

    // Close video button
    closeVideoBtn.addEventListener('click', () => {
        // Pause and hide video section
        video.pause();
        videoSection.style.display = 'none';

        // Clear video data
        video.src = '';
        poseDataArray = [];

        // Clear canvas
        clearCanvas();

        // Reset checkboxes
        if (editModeVideoCheckbox.checked) {
            editModeVideoCheckbox.checked = false;
            canvas.classList.remove('editable');
            isEditMode = false;
        }

        // Reset captured frames display
        document.getElementById('capturedFrames').textContent = '0';

        // Reset input
        videoInput.value = '';

        console.log('Video closed and data cleared');
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

        // Draw calibration points immediately if in 2D mode
        if (analysisModeVideo === '2D') {
            drawCalibrationPoints(ctx, canvas.width, canvas.height, calibrationPoint1Video, calibrationPoint2Video, calibrationScaleVideo);
        }

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

    showCoordinatesCheckbox.addEventListener('change', (e) => {
        showCoordinates = e.target.checked;
        if (!video.paused) {
            clearCanvas();
        } else {
            processPoseFrame();
        }
    });

    showCOMCoordinatesCheckbox.addEventListener('change', (e) => {
        showCOMCoordinates = e.target.checked;
        if (!video.paused) {
            clearCanvas();
        } else {
            processPoseFrame();
        }
    });

    fullSizeVideoCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            video.classList.add('full-size');
        } else {
            video.classList.remove('full-size');
        }
        // Resize canvas to match new video dimensions
        resizeCanvas();
    });

    // Image checkbox controls
    showPoseImageCheckbox.addEventListener('change', (e) => {
        showPoseImage = e.target.checked;
        redrawImagePose();
    });

    showJointNumbersImageCheckbox.addEventListener('change', (e) => {
        showJointNumbersImage = e.target.checked;
        redrawImagePose();
    });

    showCoordinatesImageCheckbox.addEventListener('change', (e) => {
        showCoordinatesImage = e.target.checked;
        redrawImagePose();
    });

    showCOMCoordinatesImageCheckbox.addEventListener('change', (e) => {
        showCOMCoordinatesImage = e.target.checked;
        redrawImagePose();
    });

    fullSizeImageCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            imageDisplay.classList.add('full-size');
        } else {
            imageDisplay.classList.remove('full-size');
        }
        // Resize canvas to match new image dimensions
        setTimeout(() => {
            imageCanvas.width = imageDisplay.clientWidth || imageDisplay.naturalWidth;
            imageCanvas.height = imageDisplay.clientHeight || imageDisplay.naturalHeight;
            redrawImagePose();
        }, 100);
    });

    // Edit mode controls
    editModeImageCheckbox.addEventListener('change', (e) => {
        isEditMode = e.target.checked;
        if (isEditMode) {
            imageCanvas.classList.add('editable');
            console.log('Edit mode enabled for image');
        } else {
            imageCanvas.classList.remove('editable');
            isDragging = false;
            draggedJointIndex = null;
            console.log('Edit mode disabled for image');
        }
    });

    editModeVideoCheckbox.addEventListener('change', (e) => {
        isEditMode = e.target.checked;
        if (isEditMode) {
            canvas.classList.add('editable');
            console.log('Edit mode enabled for video');
        } else {
            canvas.classList.remove('editable');
            isDragging = false;
            draggedJointIndex = null;
            console.log('Edit mode disabled for video');
        }
    });

    // Mouse events for image canvas
    imageCanvas.addEventListener('mousedown', handleMouseDown);
    imageCanvas.addEventListener('mousemove', handleMouseMove);
    imageCanvas.addEventListener('mouseup', handleMouseUp);
    imageCanvas.addEventListener('mouseleave', handleMouseUp);

    // Mouse events for video canvas
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

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

    // Image export button handlers
    document.getElementById('exportJsonBtnImage').addEventListener('click', exportImageAsJson);
    document.getElementById('exportCsvBtnImage').addEventListener('click', exportImageAsCsv);
    document.getElementById('exportExcelBtnImage').addEventListener('click', exportImageAsExcel);

    // Analysis mode radio buttons - Video
    const calibrationScaleLabelVideo = document.getElementById('calibrationScaleLabelVideo');
    document.querySelectorAll('input[name="analysisModeVideo"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            analysisModeVideo = e.target.value;
            console.log(`Video analysis mode changed to: ${analysisModeVideo}`);

            // Show/hide calibration scale input
            if (analysisModeVideo === '2D') {
                calibrationScaleLabelVideo.style.display = 'inline-block';
            } else {
                calibrationScaleLabelVideo.style.display = 'none';
            }

            // Redraw current frame
            if (!video.paused) {
                clearCanvas();
            } else {
                processPoseFrame();
            }
        });
    });

    // Analysis mode radio buttons - Image
    const calibrationScaleLabelImage = document.getElementById('calibrationScaleLabelImage');
    document.querySelectorAll('input[name="analysisModeImage"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            analysisModeImage = e.target.value;
            console.log(`Image analysis mode changed to: ${analysisModeImage}`);

            // Show/hide calibration scale input
            if (analysisModeImage === '2D') {
                calibrationScaleLabelImage.style.display = 'inline-block';
            } else {
                calibrationScaleLabelImage.style.display = 'none';
            }

            redrawImagePose();
        });
    });

    // Sex selection radio buttons - Video
    document.querySelectorAll('input[name="sexSelectionVideo"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            sexSelectionVideo = e.target.value;
            console.log(`Video sex selection changed to: ${sexSelectionVideo}`);

            // Redraw current frame to recalculate COM
            if (!video.paused) {
                clearCanvas();
            } else {
                processPoseFrame();
            }
        });
    });

    // Sex selection radio buttons - Image
    document.querySelectorAll('input[name="sexSelectionImage"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            sexSelectionImage = e.target.value;
            console.log(`Image sex selection changed to: ${sexSelectionImage}`);

            redrawImagePose();
        });
    });

    // Calibration scale input handlers
    const calibrationScaleVideoInput = document.getElementById('calibrationScaleVideo');
    const calibrationScaleImageInput = document.getElementById('calibrationScaleImage');

    calibrationScaleVideoInput.addEventListener('change', (e) => {
        calibrationScaleVideo = parseFloat(e.target.value) || 1.0;
        console.log(`Video calibration scale set to: ${calibrationScaleVideo}m`);
        if (!video.paused) {
            clearCanvas();
        } else {
            processPoseFrame();
        }
    });

    calibrationScaleImageInput.addEventListener('change', (e) => {
        calibrationScaleImage = parseFloat(e.target.value) || 1.0;
        console.log(`Image calibration scale set to: ${calibrationScaleImage}m`);
        redrawImagePose();
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

function resizeCanvas() {
    if (video && video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
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
    // Check if we're in image mode or video mode
    const imageSection = document.getElementById('imageSection');
    if (imageSection && imageSection.style.display !== 'none') {
        // Image mode
        onImagePoseResults(results);
        return;
    }

    // Video mode
    clearCanvas();

    if (!showPose || !results.poseLandmarks) {
        document.getElementById('jointCount').textContent = '0';
        // Still draw calibration points in 2D mode even without pose
        if (analysisModeVideo === '2D') {
            drawCalibrationPoints(ctx, canvas.width, canvas.height, calibrationPoint1Video, calibrationPoint2Video, calibrationScaleVideo);
        }
        return;
    }

    drawPose(results.poseLandmarks, results.poseWorldLandmarks);
    document.getElementById('jointCount').textContent = results.poseLandmarks.length;

    // Store pose data for export
    savePoseData(results.poseLandmarks, results.poseWorldLandmarks);
}

// Calculate midpoint landmarks
function calculateMidpoints(landmarks2D, landmarks3D) {
    const midpoints2D = [];
    const midpoints3D = [];

    // Mid-Shoulder (index 33): between Left_Shoulder (11) and Right_Shoulder (12)
    if (landmarks2D[11] && landmarks2D[12]) {
        midpoints2D[33] = {
            x: (landmarks2D[11].x + landmarks2D[12].x) / 2,
            y: (landmarks2D[11].y + landmarks2D[12].y) / 2,
            z: (landmarks2D[11].z + landmarks2D[12].z) / 2,
            visibility: Math.min(landmarks2D[11].visibility, landmarks2D[12].visibility)
        };
    }

    // Mid-Hip (index 34): between Left_Hip (23) and Right_Hip (24)
    if (landmarks2D[23] && landmarks2D[24]) {
        midpoints2D[34] = {
            x: (landmarks2D[23].x + landmarks2D[24].x) / 2,
            y: (landmarks2D[23].y + landmarks2D[24].y) / 2,
            z: (landmarks2D[23].z + landmarks2D[24].z) / 2,
            visibility: Math.min(landmarks2D[23].visibility, landmarks2D[24].visibility)
        };
    }

    // 3D midpoints
    if (landmarks3D) {
        // Mid-Shoulder 3D
        if (landmarks3D[11] && landmarks3D[12]) {
            midpoints3D[33] = {
                x: (landmarks3D[11].x + landmarks3D[12].x) / 2,
                y: (landmarks3D[11].y + landmarks3D[12].y) / 2,
                z: (landmarks3D[11].z + landmarks3D[12].z) / 2,
                visibility: Math.min(landmarks3D[11].visibility || 1.0, landmarks3D[12].visibility || 1.0)
            };
        }

        // Mid-Hip 3D
        if (landmarks3D[23] && landmarks3D[24]) {
            midpoints3D[34] = {
                x: (landmarks3D[23].x + landmarks3D[24].x) / 2,
                y: (landmarks3D[23].y + landmarks3D[24].y) / 2,
                z: (landmarks3D[23].z + landmarks3D[24].z) / 2,
                visibility: Math.min(landmarks3D[23].visibility || 1.0, landmarks3D[24].visibility || 1.0)
            };
        }
    }

    return { midpoints2D, midpoints3D };
}

// Calculate segment centers of mass based on proximal and distal joints
function calculateSegmentCOMs(extendedLandmarks2D, extendedLandmarks3D, sex) {
    const segmentCOMs2D = [];
    const segmentCOMs3D = [];

    // Calculate COM for each segment using the formula:
    // segment COM = proximal + percent * (distal - proximal)
    for (const segment of SEGMENT_DEFINITIONS) {
        const { index, proximal, distal, male, female } = segment;
        const percent = sex === 'male' ? male : female;

        // Calculate 2D COM
        if (extendedLandmarks2D[proximal] && extendedLandmarks2D[distal]) {
            const prox = extendedLandmarks2D[proximal];
            const dist = extendedLandmarks2D[distal];

            segmentCOMs2D[index] = {
                x: prox.x + percent * (dist.x - prox.x),
                y: prox.y + percent * (dist.y - prox.y),
                z: prox.z + percent * (dist.z - prox.z),
                visibility: Math.min(prox.visibility || 1.0, dist.visibility || 1.0)
            };
        }

        // Calculate 3D COM
        if (extendedLandmarks3D && extendedLandmarks3D[proximal] && extendedLandmarks3D[distal]) {
            const prox = extendedLandmarks3D[proximal];
            const dist = extendedLandmarks3D[distal];

            segmentCOMs3D[index] = {
                x: prox.x + percent * (dist.x - prox.x),
                y: prox.y + percent * (dist.y - prox.y),
                z: prox.z + percent * (dist.z - prox.z),
                visibility: Math.min(prox.visibility || 1.0, dist.visibility || 1.0)
            };
        }
    }

    return { segmentCOMs2D, segmentCOMs3D };
}

// Calculate total body center of mass using weighted average of segment COMs
function calculateTotalBodyCOM(segmentCOMs2D, segmentCOMs3D, sex) {
    let totalBodyCOM2D = null;
    let totalBodyCOM3D = null;

    // Calculate 2D total body COM
    let sum2D = { x: 0, y: 0, z: 0 };
    let totalMass2D = 0;
    let minVisibility2D = 1.0;

    for (const segmentMass of SEGMENT_MASS_PERCENTAGES) {
        const { index, male, female } = segmentMass;
        const massPercent = sex === 'male' ? male : female;
        const segmentCOM = segmentCOMs2D[index];

        if (segmentCOM) {
            sum2D.x += segmentCOM.x * massPercent;
            sum2D.y += segmentCOM.y * massPercent;
            sum2D.z += segmentCOM.z * massPercent;
            totalMass2D += massPercent;
            minVisibility2D = Math.min(minVisibility2D, segmentCOM.visibility || 1.0);
        }
    }

    if (totalMass2D > 0) {
        totalBodyCOM2D = {
            x: sum2D.x / totalMass2D,
            y: sum2D.y / totalMass2D,
            z: sum2D.z / totalMass2D,
            visibility: minVisibility2D
        };
    }

    // Calculate 3D total body COM
    if (segmentCOMs3D) {
        let sum3D = { x: 0, y: 0, z: 0 };
        let totalMass3D = 0;
        let minVisibility3D = 1.0;

        for (const segmentMass of SEGMENT_MASS_PERCENTAGES) {
            const { index, male, female } = segmentMass;
            const massPercent = sex === 'male' ? male : female;
            const segmentCOM = segmentCOMs3D[index];

            if (segmentCOM) {
                sum3D.x += segmentCOM.x * massPercent;
                sum3D.y += segmentCOM.y * massPercent;
                sum3D.z += segmentCOM.z * massPercent;
                totalMass3D += massPercent;
                minVisibility3D = Math.min(minVisibility3D, segmentCOM.visibility || 1.0);
            }
        }

        if (totalMass3D > 0) {
            totalBodyCOM3D = {
                x: sum3D.x / totalMass3D,
                y: sum3D.y / totalMass3D,
                z: sum3D.z / totalMass3D,
                visibility: minVisibility3D
            };
        }
    }

    return { totalBodyCOM2D, totalBodyCOM3D };
}

// Draw pose skeleton and landmarks
function drawPose(landmarks, landmarks3D) {
    const width = canvas.width;
    const height = canvas.height;

    // Calculate midpoint landmarks
    const { midpoints2D, midpoints3D } = calculateMidpoints(landmarks, landmarks3D);

    // Extend landmarks array with midpoints
    const extendedLandmarks2D = [...landmarks];
    const extendedLandmarks3D = landmarks3D ? [...landmarks3D] : [];
    if (midpoints2D[33]) extendedLandmarks2D[33] = midpoints2D[33];
    if (midpoints2D[34]) extendedLandmarks2D[34] = midpoints2D[34];
    if (midpoints3D[33]) extendedLandmarks3D[33] = midpoints3D[33];
    if (midpoints3D[34]) extendedLandmarks3D[34] = midpoints3D[34];

    // Calculate segment centers of mass
    const { segmentCOMs2D, segmentCOMs3D } = calculateSegmentCOMs(extendedLandmarks2D, extendedLandmarks3D, sexSelectionVideo);

    // Extend landmarks array with COMs
    for (let i = 35; i <= 48; i++) {
        if (segmentCOMs2D[i]) extendedLandmarks2D[i] = segmentCOMs2D[i];
        if (segmentCOMs3D[i]) extendedLandmarks3D[i] = segmentCOMs3D[i];
    }

    // Calculate total body center of mass
    const { totalBodyCOM2D, totalBodyCOM3D } = calculateTotalBodyCOM(segmentCOMs2D, segmentCOMs3D, sexSelectionVideo);

    // Add total body COM to extended landmarks (index 49)
    if (totalBodyCOM2D) extendedLandmarks2D[49] = totalBodyCOM2D;
    if (totalBodyCOM3D) extendedLandmarks3D[49] = totalBodyCOM3D;

    // Draw connections (skeleton)
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 4;

    FILTERED_POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];

        if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
            ctx.beginPath();
            ctx.moveTo(start.x * width, start.y * height);
            ctx.lineTo(end.x * width, end.y * height);
            ctx.stroke();
        }
    });

    // Calculate base size relative to canvas resolution for better visibility
    const baseSize = Math.max(width, height) * 0.003; // Base size for regular joints (~3px for 1000px resolution)

    // Draw landmarks (joints) - including calculated midpoints
    extendedLandmarks2D.forEach((landmark, index) => {
        // Skip excluded landmarks (nose and eyes)
        if (EXCLUDED_LANDMARKS.includes(index)) {
            return;
        }

        // Skip if landmark doesn't exist or has low visibility
        if (!landmark || landmark.visibility < 0.5) {
            return;
        }

        const x = landmark.x * width;
        const y = landmark.y * height;

        // Draw joint circle - highlight if being dragged
        const isBeingDragged = isDragging && draggedJointIndex === index;
        // Use different colors for different landmark types
        const isMidpoint = index === 33 || index === 34;
        const isSegmentCOM = index >= 35 && index <= 48;
        const isTotalBodyCOM = index === 49;

        // Calculate sizes based on landmark type
        const regularJointSize = baseSize;
        const midpointSize = baseSize * 1.3;
        const segmentCOMSize = baseSize * 2; // 2x the size of regular joints
        const totalBodyCOMSize = baseSize * 4; // 4x the size of regular joints

        if (isBeingDragged) {
            ctx.fillStyle = '#FF00FF'; // Magenta for dragged joint
            ctx.beginPath();
            ctx.arc(x, y, totalBodyCOMSize, 0, 2 * Math.PI);
            ctx.fill();
        } else if (isTotalBodyCOM) {
            ctx.fillStyle = '#FF0000'; // Red for Total Body COM
            ctx.beginPath();
            ctx.arc(x, y, totalBodyCOMSize, 0, 2 * Math.PI);
            ctx.fill();
            // Add outer ring for emphasis
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, totalBodyCOMSize, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (isSegmentCOM) {
            ctx.fillStyle = '#FFD700'; // Gold for segment COMs
            ctx.beginPath();
            ctx.arc(x, y, segmentCOMSize, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            ctx.fillStyle = isMidpoint ? '#0000FF' : '#00FF00'; // Blue for midpoints, green for regular joints
            ctx.beginPath();
            ctx.arc(x, y, isMidpoint ? midpointSize : regularJointSize, 0, 2 * Math.PI);
            ctx.fill();
        }

        let textY = y - 10;

        // Draw joint name
        if (showJointNumbers) {
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.font = 'bold 14px Arial';
            const jointName = LANDMARK_NAMES[index];
            ctx.strokeText(jointName, x + 10, textY);
            ctx.fillText(jointName, x + 10, textY);
            textY -= 18;
        }

        // Draw coordinates based on landmark type
        const isCOMPoint = index >= 35; // Segment COMs (35-48) and Total Body COM (49)
        const shouldShowCoordinates = isCOMPoint ? showCOMCoordinates : showCoordinates;

        if (shouldShowCoordinates) {
            let coordText;

            if (analysisModeVideo === '3D' && extendedLandmarks3D && extendedLandmarks3D[index]) {
                // 3D world coordinates (meters)
                const lm3d = extendedLandmarks3D[index];
                // Negate Y to make positive direction upward (conventional)
                coordText = `3D: (${lm3d.x.toFixed(3)}, ${(-lm3d.y).toFixed(3)}, ${lm3d.z.toFixed(3)})`;
            } else if (analysisModeVideo === '2D') {
                // 2D coordinates in pixels, divided by calibration distance
                const pixelX = landmark.x * width;
                const pixelY = (1 - landmark.y) * height; // Transform Y to make positive direction upward

                // Calculate calibration distance in pixels
                const p1x = calibrationPoint1Video.x * width;
                const p1y = calibrationPoint1Video.y * height;
                const p2x = calibrationPoint2Video.x * width;
                const p2y = calibrationPoint2Video.y * height;
                const calibDistance = Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));

                // Normalize by calibration distance
                const normalizedX = pixelX / calibDistance;
                const normalizedY = pixelY / calibDistance;

                coordText = `2D: (${normalizedX.toFixed(3)}, ${normalizedY.toFixed(3)})`;
            }

            if (coordText) {
                ctx.fillStyle = '#FFFF00';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3;
                ctx.font = 'bold 12px Arial';
                ctx.strokeText(coordText, x + 10, textY);
                ctx.fillText(coordText, x + 10, textY);
            }
        }
    });

    // Draw calibration points in 2D mode
    if (analysisModeVideo === '2D') {
        drawCalibrationPoints(ctx, canvas.width, canvas.height, calibrationPoint1Video, calibrationPoint2Video, calibrationScaleVideo);
    }
}

// Draw calibration points for 2D analysis
function drawCalibrationPoints(context, width, height, point1, point2, scaleLength) {
    const x1 = point1.x * width;
    const y1 = point1.y * height;
    const x2 = point2.x * width;
    const y2 = point2.y * height;

    // Draw line connecting the two points
    context.strokeStyle = '#FF00FF'; // Magenta
    context.lineWidth = 3;
    context.setLineDash([10, 5]); // Dashed line
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.setLineDash([]); // Reset to solid line

    // Draw Point 1
    const isDraggingPoint1 = draggedCalibrationPoint === 'point1';
    context.fillStyle = isDraggingPoint1 ? '#FFFF00' : '#00FFFF'; // Yellow if dragging, cyan otherwise
    context.beginPath();
    context.arc(x1, y1, isDraggingPoint1 ? 12 : 8, 0, 2 * Math.PI);
    context.fill();
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    context.stroke();

    // Draw Point 2
    const isDraggingPoint2 = draggedCalibrationPoint === 'point2';
    context.fillStyle = isDraggingPoint2 ? '#FFFF00' : '#00FFFF'; // Yellow if dragging, cyan otherwise
    context.beginPath();
    context.arc(x2, y2, isDraggingPoint2 ? 12 : 8, 0, 2 * Math.PI);
    context.fill();
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    context.stroke();

    // Calculate distance between the two points in pixels
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

    // Display coordinates for Point 1 in pixels divided by distance (transform Y to make upward positive)
    const p1x_pixels = point1.x * width;
    const p1y_pixels = (1 - point1.y) * height;
    const p1x_normalized = p1x_pixels / distance;
    const p1y_normalized = p1y_pixels / distance;
    const coordText1 = `P1: (${p1x_normalized.toFixed(3)}, ${p1y_normalized.toFixed(3)})`;
    context.fillStyle = '#00FFFF';
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    context.font = 'bold 14px Arial';
    context.strokeText(coordText1, x1 + 15, y1 - 10);
    context.fillText(coordText1, x1 + 15, y1 - 10);

    // Display coordinates for Point 2 in pixels divided by distance (transform Y to make upward positive)
    const p2x_pixels = point2.x * width;
    const p2y_pixels = (1 - point2.y) * height;
    const p2x_normalized = p2x_pixels / distance;
    const p2y_normalized = p2y_pixels / distance;
    const coordText2 = `P2: (${p2x_normalized.toFixed(3)}, ${p2y_normalized.toFixed(3)})`;
    context.fillStyle = '#00FFFF';
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    context.font = 'bold 14px Arial';
    context.strokeText(coordText2, x2 + 15, y2 - 10);
    context.fillText(coordText2, x2 + 15, y2 - 10);

    // Display scale length at midpoint
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const scaleText = `Scale: ${scaleLength.toFixed(2)}m (${distance.toFixed(1)} px)`;
    context.fillStyle = '#FF00FF';
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    context.font = 'bold 16px Arial';
    context.strokeText(scaleText, midX, midY - 20);
    context.fillText(scaleText, midX, midY - 20);
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

    // Transform pose data to use conventional Y direction (positive upward)
    const transformedPoseData = poseDataArray.map(frameData => ({
        ...frameData,
        landmarks3D: frameData.landmarks3D.map(lm => ({
            ...lm,
            y: -lm.y  // Negate Y to make positive direction upward
        }))
    }));

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
        poseData: transformedPoseData
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

    // Build header row with joint names
    let header = 'Frame,Timestamp';
    LANDMARK_NAMES.forEach(name => {
        header += `,${name}_X,${name}_Y,${name}_Z`;
    });
    let csv = header + '\n';

    // Each row is one frame
    poseDataArray.forEach(frameData => {
        let row = `${frameData.frame},${frameData.timestamp.toFixed(3)}`;

        // Add X, Y, Z for each landmark
        frameData.landmarks2D.forEach((lm2d, index) => {
            const lm3d = frameData.landmarks3D[index] || { x: 0, y: 0, z: 0 };
            // Use 3D coordinates (world coordinates in meters)
            // Negate Y to make positive direction upward (conventional)
            row += `,${lm3d.x.toFixed(6)},${(-lm3d.y).toFixed(6)},${lm3d.z.toFixed(6)}`;
        });

        csv += row + '\n';
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

    // Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
        alert('Excel library not loaded. Please refresh the page and try again.');
        console.error('XLSX library is not loaded');
        return;
    }

    try {
        console.log('Starting Excel export...');

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
        console.log('Metadata sheet created');

        // Pose data sheet - rows are frames, columns are joint coordinates
        // Build header row
        const header = ['Frame', 'Timestamp'];
        LANDMARK_NAMES.forEach(name => {
            header.push(`${name}_X`, `${name}_Y`, `${name}_Z`);
        });
        const poseDataRows = [header];

        // Each row is one frame
        poseDataArray.forEach(frameData => {
            const row = [
                frameData.frame,
                parseFloat(frameData.timestamp.toFixed(3))
            ];

            // Add X, Y, Z for each landmark (using 3D world coordinates)
            frameData.landmarks2D.forEach((lm2d, index) => {
                const lm3d = frameData.landmarks3D[index] || { x: 0, y: 0, z: 0 };
                // Negate Y to make positive direction upward (conventional)
                row.push(
                    parseFloat(lm3d.x.toFixed(6)),
                    parseFloat((-lm3d.y).toFixed(6)),
                    parseFloat(lm3d.z.toFixed(6))
                );
            });

            poseDataRows.push(row);
        });

        const poseSheet = XLSX.utils.aoa_to_sheet(poseDataRows);
        XLSX.utils.book_append_sheet(wb, poseSheet, 'Pose Data');
        console.log('Pose Data sheet created with', poseDataRows.length - 1, 'frames');

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
        console.log('Summary sheet created');

        // Download the file
        console.log('Attempting to write Excel file...');
        XLSX.writeFile(wb, 'pose_data.xlsx');
        console.log(`Successfully exported ${poseDataArray.length} frames to Excel`);
        alert(`Excel file downloaded successfully! (${poseDataArray.length} frames)`);

    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert(`Error creating Excel file: ${error.message}\n\nPlease try exporting as CSV instead.`);
    }
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

// ===== JOINT EDITING FUNCTIONS =====

function handleMouseDown(e) {
    const targetCanvas = e.target;
    const rect = targetCanvas.getBoundingClientRect();
    const scaleX = targetCanvas.width / rect.width;
    const scaleY = targetCanvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Determine which mode we're in (image or video)
    const isImageMode = targetCanvas === imageCanvas;
    const analysisMode = isImageMode ? analysisModeImage : analysisModeVideo;

    // In 2D mode, always check for calibration points first (they're always draggable)
    if (analysisMode === '2D') {
        const CLICK_THRESHOLD = 20;
        const point1 = isImageMode ? calibrationPoint1Image : calibrationPoint1Video;
        const point2 = isImageMode ? calibrationPoint2Image : calibrationPoint2Video;

        const p1x = point1.x * targetCanvas.width;
        const p1y = point1.y * targetCanvas.height;
        const p2x = point2.x * targetCanvas.width;
        const p2y = point2.y * targetCanvas.height;

        const dist1 = Math.sqrt(Math.pow(mouseX - p1x, 2) + Math.pow(mouseY - p1y, 2));
        const dist2 = Math.sqrt(Math.pow(mouseX - p2x, 2) + Math.pow(mouseY - p2y, 2));

        if (dist1 < CLICK_THRESHOLD) {
            isDragging = true;
            draggedCalibrationPoint = 'point1';
            targetCanvas.style.cursor = 'move';
            console.log('Started dragging calibration point 1');
            return;
        } else if (dist2 < CLICK_THRESHOLD) {
            isDragging = true;
            draggedCalibrationPoint = 'point2';
            targetCanvas.style.cursor = 'move';
            console.log('Started dragging calibration point 2');
            return;
        }
    }

    // Only check pose landmarks if in edit mode
    if (!isEditMode) return;

    const landmarks = isImageMode ?
        (imagePoseData ? imagePoseData.landmarks2D : null) :
        (poseDataArray.length > 0 ? getCurrentFramePoseData()?.landmarks2D : null);

    if (!landmarks) return;

    // Find the closest joint within 20 pixels
    const CLICK_THRESHOLD = 20;
    let closestJoint = null;
    let closestDistance = CLICK_THRESHOLD;

    landmarks.forEach((landmark, index) => {
        // Skip excluded landmarks (nose and eyes)
        if (EXCLUDED_LANDMARKS.includes(index)) {
            return;
        }

        if (landmark.visibility > 0.5) {
            const jointX = landmark.x * targetCanvas.width;
            const jointY = landmark.y * targetCanvas.height;
            const distance = Math.sqrt(
                Math.pow(mouseX - jointX, 2) +
                Math.pow(mouseY - jointY, 2)
            );

            if (distance < closestDistance) {
                closestDistance = distance;
                closestJoint = index;
            }
        }
    });

    if (closestJoint !== null) {
        isDragging = true;
        draggedJointIndex = closestJoint;
        if (!isImageMode) {
            draggedJointFrame = Math.floor(video.currentTime * fps);
        }
        targetCanvas.style.cursor = 'move';
        console.log(`Started dragging joint ${draggedJointIndex} (${LANDMARK_NAMES[draggedJointIndex]})`);
    }
}

function handleMouseMove(e) {
    if (!isDragging) return;

    const targetCanvas = e.target;
    const rect = targetCanvas.getBoundingClientRect();
    const scaleX = targetCanvas.width / rect.width;
    const scaleY = targetCanvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Normalize coordinates (0 to 1)
    const normalizedX = mouseX / targetCanvas.width;
    const normalizedY = mouseY / targetCanvas.height;

    // Clamp to valid range
    const clampedX = Math.max(0, Math.min(1, normalizedX));
    const clampedY = Math.max(0, Math.min(1, normalizedY));

    const isImageMode = targetCanvas === imageCanvas;

    // Handle calibration point dragging
    if (draggedCalibrationPoint !== null) {
        if (isImageMode) {
            if (draggedCalibrationPoint === 'point1') {
                calibrationPoint1Image.x = clampedX;
                calibrationPoint1Image.y = clampedY;
            } else if (draggedCalibrationPoint === 'point2') {
                calibrationPoint2Image.x = clampedX;
                calibrationPoint2Image.y = clampedY;
            }
            redrawImagePose();
        } else {
            if (draggedCalibrationPoint === 'point1') {
                calibrationPoint1Video.x = clampedX;
                calibrationPoint1Video.y = clampedY;
            } else if (draggedCalibrationPoint === 'point2') {
                calibrationPoint2Video.x = clampedX;
                calibrationPoint2Video.y = clampedY;
            }
            clearCanvas();
            const frameData = getCurrentFramePoseData();
            if (showPose && frameData && frameData.landmarks2D) {
                drawPose(frameData.landmarks2D, frameData.landmarks3D);
            }
        }
        return;
    }

    // Handle pose landmark dragging
    if (draggedJointIndex === null) return;

    if (isImageMode && imagePoseData) {
        // Update image pose data
        const landmark2D = imagePoseData.landmarks2D[draggedJointIndex];
        const landmark3D = imagePoseData.landmarks3D[draggedJointIndex];

        // Calculate the delta in normalized coordinates
        const deltaX = clampedX - landmark2D.x;
        const deltaY = clampedY - landmark2D.y;

        // Update 2D position
        landmark2D.x = clampedX;
        landmark2D.y = clampedY;

        // Update 3D position (scale proportionally, keep Z the same)
        if (landmark3D) {
            // Estimate the change in world coordinates based on 2D movement
            // This is approximate - we're scaling by typical human body dimensions
            const SCALE_FACTOR = 2.0; // Approximate scaling from normalized to meters
            landmark3D.x += deltaX * SCALE_FACTOR;
            landmark3D.y -= deltaY * SCALE_FACTOR; // Negative because Y is flipped in display
        }

        redrawImagePose();
    } else if (!isImageMode) {
        // Update video pose data for current frame
        const currentFrame = Math.floor(video.currentTime * fps);
        const frameData = poseDataArray.find(d => d.frame === currentFrame);

        if (frameData) {
            const landmark2D = frameData.landmarks2D[draggedJointIndex];
            const landmark3D = frameData.landmarks3D[draggedJointIndex];

            const deltaX = clampedX - landmark2D.x;
            const deltaY = clampedY - landmark2D.y;

            landmark2D.x = clampedX;
            landmark2D.y = clampedY;

            if (landmark3D) {
                const SCALE_FACTOR = 2.0;
                landmark3D.x += deltaX * SCALE_FACTOR;
                landmark3D.y -= deltaY * SCALE_FACTOR;
            }

            // Redraw the current frame
            clearCanvas();
            if (showPose && frameData.landmarks2D) {
                drawPose(frameData.landmarks2D, frameData.landmarks3D);
            }
        }
    }
}

function handleMouseUp(e) {
    if (isDragging) {
        if (draggedCalibrationPoint !== null) {
            console.log(`Finished dragging calibration ${draggedCalibrationPoint}`);
            draggedCalibrationPoint = null;
        } else if (draggedJointIndex !== null) {
            console.log(`Finished dragging joint ${draggedJointIndex} (${LANDMARK_NAMES[draggedJointIndex]})`);
            draggedJointIndex = null;
            draggedJointFrame = null;
        }
        isDragging = false;
        if (isEditMode) {
            e.target.style.cursor = 'crosshair';
        } else {
            e.target.style.cursor = 'default';
        }
    }
}

function getCurrentFramePoseData() {
    if (!video || poseDataArray.length === 0) return null;
    const currentFrame = Math.floor(video.currentTime * fps);
    return poseDataArray.find(d => d.frame === currentFrame) || null;
}

// ===== IMAGE POSE PROCESSING FUNCTIONS =====

// Process pose estimation on uploaded image
async function processImagePose() {
    if (!imageDisplay || !pose) return;

    try {
        await pose.send({ image: imageDisplay });
    } catch (error) {
        console.error('Error processing image pose:', error);
    }
}

// Handle pose detection results for image
function onImagePoseResults(results) {
    if (!results.poseLandmarks) {
        document.getElementById('jointCountImage').textContent = '0';
        // Still redraw to show calibration points in 2D mode
        redrawImagePose();
        return;
    }

    // Store pose data
    imagePoseData = {
        landmarks2D: results.poseLandmarks,
        landmarks3D: results.poseWorldLandmarks || []
    };

    document.getElementById('jointCountImage').textContent = results.poseLandmarks.length;

    // Draw pose on image
    redrawImagePose();
}

// Redraw pose overlay on image
function redrawImagePose() {
    // Clear canvas
    imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);

    // Draw calibration points in 2D mode (always visible)
    if (analysisModeImage === '2D') {
        drawCalibrationPoints(imageCtx, imageCanvas.width, imageCanvas.height, calibrationPoint1Image, calibrationPoint2Image, calibrationScaleImage);
    }

    // Draw pose if available and enabled
    if (!imagePoseData) return;
    if (!showPoseImage) return;

    // Draw pose
    drawImagePose(imagePoseData.landmarks2D, imagePoseData.landmarks3D);
}

// Draw pose skeleton and landmarks on image
function drawImagePose(landmarks, landmarks3D) {
    const width = imageCanvas.width;
    const height = imageCanvas.height;

    // Calculate midpoint landmarks
    const { midpoints2D, midpoints3D } = calculateMidpoints(landmarks, landmarks3D);

    // Extend landmarks array with midpoints
    const extendedLandmarks2D = [...landmarks];
    const extendedLandmarks3D = landmarks3D ? [...landmarks3D] : [];
    if (midpoints2D[33]) extendedLandmarks2D[33] = midpoints2D[33];
    if (midpoints2D[34]) extendedLandmarks2D[34] = midpoints2D[34];
    if (midpoints3D[33]) extendedLandmarks3D[33] = midpoints3D[33];
    if (midpoints3D[34]) extendedLandmarks3D[34] = midpoints3D[34];

    // Calculate segment centers of mass
    const { segmentCOMs2D, segmentCOMs3D } = calculateSegmentCOMs(extendedLandmarks2D, extendedLandmarks3D, sexSelectionImage);

    // Extend landmarks array with COMs
    for (let i = 35; i <= 48; i++) {
        if (segmentCOMs2D[i]) extendedLandmarks2D[i] = segmentCOMs2D[i];
        if (segmentCOMs3D[i]) extendedLandmarks3D[i] = segmentCOMs3D[i];
    }

    // Calculate total body center of mass
    const { totalBodyCOM2D, totalBodyCOM3D } = calculateTotalBodyCOM(segmentCOMs2D, segmentCOMs3D, sexSelectionImage);

    // Add total body COM to extended landmarks (index 49)
    if (totalBodyCOM2D) extendedLandmarks2D[49] = totalBodyCOM2D;
    if (totalBodyCOM3D) extendedLandmarks3D[49] = totalBodyCOM3D;

    // Draw connections (skeleton)
    imageCtx.strokeStyle = '#00FF00';
    imageCtx.lineWidth = 4;

    FILTERED_POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];

        if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
            imageCtx.beginPath();
            imageCtx.moveTo(start.x * width, start.y * height);
            imageCtx.lineTo(end.x * width, end.y * height);
            imageCtx.stroke();
        }
    });

    // Calculate base size relative to canvas resolution for better visibility
    const baseSize = Math.max(width, height) * 0.003; // Base size for regular joints (~3px for 1000px resolution)

    // Draw landmarks (joints) - including calculated midpoints
    extendedLandmarks2D.forEach((landmark, index) => {
        // Skip excluded landmarks (nose and eyes)
        if (EXCLUDED_LANDMARKS.includes(index)) {
            return;
        }

        // Skip if landmark doesn't exist or has low visibility
        if (!landmark || landmark.visibility < 0.5) {
            return;
        }

        const x = landmark.x * width;
        const y = landmark.y * height;

        // Draw joint circle - highlight if being dragged
        const isBeingDragged = isDragging && draggedJointIndex === index;
        // Use different colors for different landmark types
        const isMidpoint = index === 33 || index === 34;
        const isSegmentCOM = index >= 35 && index <= 48;
        const isTotalBodyCOM = index === 49;

        // Calculate sizes based on landmark type
        const regularJointSize = baseSize;
        const midpointSize = baseSize * 1.3;
        const segmentCOMSize = baseSize * 2; // 2x the size of regular joints
        const totalBodyCOMSize = baseSize * 4; // 4x the size of regular joints

        if (isBeingDragged) {
            imageCtx.fillStyle = '#FF00FF'; // Magenta for dragged joint
            imageCtx.beginPath();
            imageCtx.arc(x, y, totalBodyCOMSize, 0, 2 * Math.PI);
            imageCtx.fill();
        } else if (isTotalBodyCOM) {
            imageCtx.fillStyle = '#FF0000'; // Red for Total Body COM
            imageCtx.beginPath();
            imageCtx.arc(x, y, totalBodyCOMSize, 0, 2 * Math.PI);
            imageCtx.fill();
            // Add outer ring for emphasis
            imageCtx.strokeStyle = '#FFFFFF';
            imageCtx.lineWidth = 2;
            imageCtx.beginPath();
            imageCtx.arc(x, y, totalBodyCOMSize, 0, 2 * Math.PI);
            imageCtx.stroke();
        } else if (isSegmentCOM) {
            imageCtx.fillStyle = '#FFD700'; // Gold for segment COMs
            imageCtx.beginPath();
            imageCtx.arc(x, y, segmentCOMSize, 0, 2 * Math.PI);
            imageCtx.fill();
        } else {
            imageCtx.fillStyle = isMidpoint ? '#0000FF' : '#00FF00'; // Blue for midpoints, green for regular joints
            imageCtx.beginPath();
            imageCtx.arc(x, y, isMidpoint ? midpointSize : regularJointSize, 0, 2 * Math.PI);
            imageCtx.fill();
        }

        let textY = y - 10;

        // Draw joint name
        if (showJointNumbersImage) {
            imageCtx.fillStyle = '#FFFFFF';
            imageCtx.strokeStyle = '#000000';
            imageCtx.lineWidth = 3;
            imageCtx.font = 'bold 14px Arial';
            const jointName = LANDMARK_NAMES[index];
            imageCtx.strokeText(jointName, x + 10, textY);
            imageCtx.fillText(jointName, x + 10, textY);
            textY -= 18;
        }

        // Draw coordinates based on landmark type
        const isCOMPoint = index >= 35; // Segment COMs (35-48) and Total Body COM (49)
        const shouldShowCoordinates = isCOMPoint ? showCOMCoordinatesImage : showCoordinatesImage;

        if (shouldShowCoordinates) {
            let coordText;

            if (analysisModeImage === '3D' && extendedLandmarks3D && extendedLandmarks3D[index]) {
                // 3D world coordinates (meters)
                const lm3d = extendedLandmarks3D[index];
                // Negate Y to make positive direction upward (conventional)
                coordText = `3D: (${lm3d.x.toFixed(3)}, ${(-lm3d.y).toFixed(3)}, ${lm3d.z.toFixed(3)})`;
            } else if (analysisModeImage === '2D') {
                // 2D coordinates in pixels, divided by calibration distance
                const pixelX = landmark.x * width;
                const pixelY = (1 - landmark.y) * height; // Transform Y to make positive direction upward

                // Calculate calibration distance in pixels
                const p1x = calibrationPoint1Image.x * width;
                const p1y = calibrationPoint1Image.y * height;
                const p2x = calibrationPoint2Image.x * width;
                const p2y = calibrationPoint2Image.y * height;
                const calibDistance = Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));

                // Normalize by calibration distance
                const normalizedX = pixelX / calibDistance;
                const normalizedY = pixelY / calibDistance;

                coordText = `2D: (${normalizedX.toFixed(3)}, ${normalizedY.toFixed(3)})`;
            }

            if (coordText) {
                imageCtx.fillStyle = '#FFFF00';
                imageCtx.strokeStyle = '#000000';
                imageCtx.lineWidth = 3;
                imageCtx.font = 'bold 12px Arial';
                imageCtx.strokeText(coordText, x + 10, textY);
                imageCtx.fillText(coordText, x + 10, textY);
            }
        }
    });

    // Draw calibration points in 2D mode
    if (analysisModeImage === '2D') {
        drawCalibrationPoints(imageCtx, imageCanvas.width, imageCanvas.height, calibrationPoint1Image, calibrationPoint2Image, calibrationScaleImage);
    }
}

// Export image pose data as JSON
function exportImageAsJson() {
    if (!imagePoseData) {
        alert('No pose data to export. Please upload an image first.');
        return;
    }

    // Transform pose data to use conventional Y direction (positive upward)
    const transformedLandmarks3D = imagePoseData.landmarks3D.map(lm => ({
        ...lm,
        y: -lm.y  // Negate Y to make positive direction upward
    }));

    const exportData = {
        metadata: {
            imageWidth: imageDisplay.naturalWidth,
            imageHeight: imageDisplay.naturalHeight,
            exportDate: new Date().toISOString()
        },
        poseData: {
            landmarks2D: imagePoseData.landmarks2D,
            landmarks3D: transformedLandmarks3D
        }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    downloadFile(dataStr, 'image_pose_data.json', 'application/json');
    console.log('Exported image pose data to JSON');
}

// Export image pose data as CSV
function exportImageAsCsv() {
    if (!imagePoseData) {
        alert('No pose data to export. Please upload an image first.');
        return;
    }

    // Build header row with joint names
    let header = 'Joint_Index,Joint_Name,X,Y,Z,Visibility';
    let csv = header + '\n';

    // Each row is one joint
    imagePoseData.landmarks2D.forEach((lm2d, index) => {
        const lm3d = imagePoseData.landmarks3D[index] || { x: 0, y: 0, z: 0 };
        // Negate Y to make positive direction upward (conventional)
        const row = `${index},${LANDMARK_NAMES[index]},${lm3d.x.toFixed(6)},${(-lm3d.y).toFixed(6)},${lm3d.z.toFixed(6)},${lm2d.visibility.toFixed(3)}`;
        csv += row + '\n';
    });

    downloadFile(csv, 'image_pose_data.csv', 'text/csv');
    console.log('Exported image pose data to CSV');
}

// Export image pose data as Excel
function exportImageAsExcel() {
    if (!imagePoseData) {
        alert('No pose data to export. Please upload an image first.');
        return;
    }

    // Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
        alert('Excel library not loaded. Please refresh the page and try again.');
        console.error('XLSX library is not loaded');
        return;
    }

    try {
        console.log('Starting Excel export for image...');

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Metadata sheet
        const metadataSheet = XLSX.utils.aoa_to_sheet([
            ['Property', 'Value'],
            ['Image Width', imageDisplay.naturalWidth],
            ['Image Height', imageDisplay.naturalHeight],
            ['Detected Joints', imagePoseData.landmarks2D.length],
            ['Export Date', new Date().toISOString()]
        ]);
        XLSX.utils.book_append_sheet(wb, metadataSheet, 'Metadata');
        console.log('Metadata sheet created');

        // Pose data sheet - each row is a joint
        const header = ['Joint_Index', 'Joint_Name', 'X', 'Y', 'Z', 'Visibility'];
        const poseDataRows = [header];

        imagePoseData.landmarks2D.forEach((lm2d, index) => {
            const lm3d = imagePoseData.landmarks3D[index] || { x: 0, y: 0, z: 0 };
            // Negate Y to make positive direction upward (conventional)
            const row = [
                index,
                LANDMARK_NAMES[index],
                parseFloat(lm3d.x.toFixed(6)),
                parseFloat((-lm3d.y).toFixed(6)),
                parseFloat(lm3d.z.toFixed(6)),
                parseFloat(lm2d.visibility.toFixed(3))
            ];
            poseDataRows.push(row);
        });

        const poseSheet = XLSX.utils.aoa_to_sheet(poseDataRows);
        XLSX.utils.book_append_sheet(wb, poseSheet, 'Pose Data');
        console.log('Pose Data sheet created with', poseDataRows.length - 1, 'joints');

        // Download the file
        console.log('Attempting to write Excel file...');
        XLSX.writeFile(wb, 'image_pose_data.xlsx');
        console.log('Successfully exported image pose data to Excel');
        alert('Image pose data exported successfully!');

    } catch (error) {
        console.error('Error exporting image to Excel:', error);
        alert(`Error creating Excel file: ${error.message}\n\nPlease try exporting as CSV instead.`);
    }
}
