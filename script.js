let video;
let canvas;
let ctx;
let imageDisplay;
let imageCanvas;
let imageCtx;
let pose;
let fps = 30; // Default, will be detected
let frameCount = 0; // Total frame count for video
let showPose = true;
let showCOM = true;
let showLeftSide = true;
let showRightSide = true;
let showJointNumbers = false;
let showCoordinates = false;
let showCoordinateSystem = false;
let showVelocityVectors = false;
let processingTimer = null;
let poseDataArray = []; // Store all captured pose data
let isLoadingNewMedia = false; // Flag to prevent processing during media switching

// Image mode variables
let showPoseImage = true;
let showCOMImage = true;
let showLeftSideImage = true;
let showRightSideImage = true;
let showJointNumbersImage = false;
let showCoordinatesImage = false;
let showCoordinateSystemImage = false;
let imagePoseData = null; // Store pose data for the image

// Analysis mode variables
let analysisModeVideo = '2D'; // '2D' or '3D'
let analysisModeImage = '2D'; // '2D' or '3D'

// Sex selection for COM calculation
let sexSelectionVideo = 'male'; // 'male' or 'female'
let sexSelectionImage = 'male'; // 'male' or 'female'

// Body side is always 'full' - bilateral mirroring enabled for all landmarks

// Joint dragging variables
let isDragging = false;
let draggedJointIndex = null;
let draggedJointFrame = null; // For video: which frame is being edited
let isEditMode = false; // Toggle edit mode on/off
let isEditModeCalibration = false; // Toggle calibration point edit mode on/off

// Drawing tool variables
let isDrawLineMode = false; // Toggle line drawing mode on/off
let isDrawAngleMode = false; // Toggle angle drawing mode on/off
let drawingPoints = []; // Store points for current drawing
let completedDrawings = []; // Store all completed drawings with frame info

// Store filled landmarks (with mirroring) for edit mode click detection
let lastFilledLandmarks2DVideo = null;
let lastFilledLandmarks2DImage = null;

// Calibration points for 2D analysis (normalized coordinates 0-1)
// Initial positions: Point 1 at (100, 100) pixels, Point 2 at (100, 600) pixels (based on ~800px reference)
let calibrationPoint1Video = { x: 0.125, y: 0.125 }; // Point 1 for video
let calibrationPoint2Video = { x: 0.125, y: 0.75 }; // Point 2 for video
let calibrationPoint1Image = { x: 0.125, y: 0.125 }; // Point 1 for image
let calibrationPoint2Image = { x: 0.125, y: 0.75 }; // Point 2 for image
let draggedCalibrationPoint = null; // Which calibration point is being dragged ('point1' or 'point2')
let calibrationScaleVideo = 1.0; // Scale length in meters for video
let calibrationScaleImage = 1.0; // Scale length in meters for image

// Font size for displaying joint names and coordinates
let displayFontSize = 28; // Default font size in pixels

// Original file names for exports
let originalVideoFileName = 'video';
let originalImageFileName = 'image';

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

// Helper function to convert landmark name for display (Right -> R, Left -> L)
function getDisplayName(name) {
    if (!name) return '';
    return name.replace(/Right_/g, 'R_').replace(/Left_/g, 'L_');
}

// Helper function to determine if a landmark is on the left side
function isLeftSideLandmark(index) {
    const name = LANDMARK_NAMES[index];
    if (!name) return false;
    return name.includes('Left_');
}

// Helper function to determine if a landmark is on the right side
function isRightSideLandmark(index) {
    const name = LANDMARK_NAMES[index];
    if (!name) return false;
    return name.includes('Right_');
}

// Helper function to determine if a landmark is central (not left or right specific)
function isCentralLandmark(index) {
    return !isLeftSideLandmark(index) && !isRightSideLandmark(index);
}

// Helper function to filter landmarks based on body side selection
// Body side is always 'full', so these functions always return true
function shouldDisplayLandmark(index) {
    return true;
}

function shouldDisplayConnection(startIdx, endIdx) {
    return true;
}

// Mapping of left-right landmark pairs for mirroring
const LEFT_RIGHT_LANDMARK_PAIRS = [
    [1, 4],   // Left_Eye_Inner <-> Right_Eye_Inner
    [2, 5],   // Left_Eye <-> Right_Eye
    [3, 6],   // Left_Eye_Outer <-> Right_Eye_Outer
    [7, 8],   // Left_Ear <-> Right_Ear
    [9, 10],  // Mouth_Left <-> Mouth_Right
    [11, 12], // Left_Shoulder <-> Right_Shoulder
    [13, 14], // Left_Elbow <-> Right_Elbow
    [15, 16], // Left_Wrist <-> Right_Wrist
    [17, 18], // Left_Pinky <-> Right_Pinky
    [19, 20], // Left_Index <-> Right_Index
    [21, 22], // Left_Thumb <-> Right_Thumb
    [23, 24], // Left_Hip <-> Right_Hip
    [25, 26], // Left_Knee <-> Right_Knee
    [27, 28], // Left_Ankle <-> Right_Ankle
    [29, 30], // Left_Heel <-> Right_Heel
    [31, 32], // Left_Foot_Index <-> Right_Foot_Index
    [37, 38], // Left_Upper_Arm_COM <-> Right_Upper_Arm_COM
    [39, 40], // Left_Forearm_COM <-> Right_Forearm_COM
    [41, 42], // Left_Hand_COM <-> Right_Hand_COM
    [43, 44], // Left_Thigh_COM <-> Right_Thigh_COM
    [45, 46], // Left_Shank_COM <-> Right_Shank_COM
    [47, 48]  // Left_Foot_COM <-> Right_Foot_COM
];

// Function to get the opposite side landmark index
function getMirrorLandmarkIndex(index) {
    for (const [left, right] of LEFT_RIGHT_LANDMARK_PAIRS) {
        if (index === left) return right;
        if (index === right) return left;
    }
    return null; // No mirror pair (central landmark)
}

// Function to copy landmark from opposite side (bilateral symmetry estimation)
// Mirrors landmark from opposite side using exact coordinates
function mirrorLandmark(landmark) {
    if (!landmark) return null;

    return {
        x: landmark.x,
        y: landmark.y,
        z: landmark.z,
        visibility: landmark.visibility
    };
}

// Function to fill missing landmarks with copied versions from opposite side
function fillMissingLandmarksWithMirrors(landmarks2D, landmarks3D) {
    // Create copies to avoid modifying originals
    const filled2D = [...landmarks2D];
    const filled3D = landmarks3D ? [...landmarks3D] : [];

    // Fill missing landmarks by copying from opposite side
    for (const [leftIdx, rightIdx] of LEFT_RIGHT_LANDMARK_PAIRS) {
        // 2D copying
        const left2D = filled2D[leftIdx];
        const right2D = filled2D[rightIdx];

        if (!left2D || left2D.visibility < 0.3) {
            if (right2D && right2D.visibility >= 0.3) {
                filled2D[leftIdx] = mirrorLandmark(right2D);
            }
        }

        if (!right2D || right2D.visibility < 0.3) {
            if (left2D && left2D.visibility >= 0.3) {
                filled2D[rightIdx] = mirrorLandmark(left2D);
            }
        }

        // 3D copying
        if (filled3D.length > 0) {
            const left3D = filled3D[leftIdx];
            const right3D = filled3D[rightIdx];

            if (!left3D || left3D.visibility < 0.3) {
                if (right3D && right3D.visibility >= 0.3) {
                    filled3D[leftIdx] = mirrorLandmark(right3D);
                }
            }

            if (!right3D || right3D.visibility < 0.3) {
                if (left3D && left3D.visibility >= 0.3) {
                    filled3D[rightIdx] = mirrorLandmark(left3D);
                }
            }
        }
    }

    return { filled2D, filled3D };
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired - initializing application');

    // Initialize visit counter using localStorage (simple local tracking)
    const visitCounterElement = document.getElementById('visitCounter');
    let visitCount = parseInt(localStorage.getItem('comVisualizationVisits') || '0', 10);
    visitCount++;
    localStorage.setItem('comVisualizationVisits', visitCount.toString());
    visitCounterElement.textContent = visitCount.toLocaleString();

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
    const uploadSection = document.getElementById('uploadSection');
    const videoRightSidebar = document.getElementById('videoRightSidebar');
    const imageRightSidebar = document.getElementById('imageRightSidebar');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const prevFrameBtn = document.getElementById('prevFrameBtn');
    const nextFrameBtn = document.getElementById('nextFrameBtn');
    const showPoseCheckbox = document.getElementById('showPose');
    const showCOMCheckbox = document.getElementById('showCOM');
    const showLeftSideCheckbox = document.getElementById('showLeftSide');
    const showRightSideCheckbox = document.getElementById('showRightSide');
    const showJointNumbersCheckbox = document.getElementById('showJointNumbers');
    const showCoordinatesCheckbox = document.getElementById('showCoordinates');
    const showCoordinateSystemCheckbox = document.getElementById('showCoordinateSystem');
    const fullSizeVideoCheckbox = document.getElementById('fullSizeVideo');
    // Processing at maximum video framerate

    // Image controls
    const showPoseImageCheckbox = document.getElementById('showPoseImage');
    const showCOMImageCheckbox = document.getElementById('showCOMImage');
    const showLeftSideImageCheckbox = document.getElementById('showLeftSideImage');
    const showRightSideImageCheckbox = document.getElementById('showRightSideImage');
    const showJointNumbersImageCheckbox = document.getElementById('showJointNumbersImage');
    const showCoordinatesImageCheckbox = document.getElementById('showCoordinatesImage');
    const showCoordinateSystemImageCheckbox = document.getElementById('showCoordinateSystemImage');
    const fullSizeImageCheckbox = document.getElementById('fullSizeImage');
    const editModeImageCheckbox = document.getElementById('editModeImage');

    // Video edit mode
    const editModeVideoCheckbox = document.getElementById('editModeVideo');
    const editModeCalibrationVideoCheckbox = document.getElementById('editModeCalibrationVideo');
    const editCalibrationVideoLabel = document.getElementById('editCalibrationVideoLabel');

    // Image calibration edit mode
    const editModeCalibrationImageCheckbox = document.getElementById('editModeCalibrationImage');
    const editCalibrationImageLabel = document.getElementById('editCalibrationImageLabel');

    // Close button
    const closeMediaBtn = document.getElementById('closeMediaBtn');

    // Check if XLSX library is loaded
    if (typeof XLSX !== 'undefined') {
        console.log('✓ SheetJS (XLSX) library loaded successfully');
    } else {
        console.error('✗ SheetJS (XLSX) library failed to load - Excel export will not work');
    }

    // Initialize calibration edit checkbox visibility (2D is default, so show them)
    if (editCalibrationVideoLabel) {
        editCalibrationVideoLabel.style.display = 'inline-block';
    }
    if (editCalibrationImageLabel) {
        editCalibrationImageLabel.style.display = 'inline-block';
    }

    // Initialize MediaPipe Pose after ensuring libraries are loaded
    if (typeof window.Pose !== 'undefined') {
        console.log('MediaPipe Pose library detected, initializing...');
        initializePose();
    } else {
        console.log('MediaPipe Pose library not yet loaded, waiting...');
        // Wait for window load event to ensure all external scripts are loaded
        window.addEventListener('load', () => {
            console.log('Window loaded, initializing MediaPipe Pose...');
            initializePose();
        });
    }

    // Handle video upload
    videoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Set flag to stop processing current video
            isLoadingNewMedia = true;

            // Stop any ongoing processing
            if (processingTimer) {
                clearInterval(processingTimer);
                processingTimer = null;
            }

            // Reset pose data array for new video
            poseDataArray = [];

            // Reuse existing MediaPipe Pose instance to avoid WebAssembly conflicts
            console.log('Loading new video with existing MediaPipe Pose instance...');
            if (!pose) {
                console.log('Initializing MediaPipe Pose for first time...');
                initializePose();
            }

            // Store original filename (without extension)
            originalVideoFileName = file.name.replace(/\.[^/.]+$/, '');

            const url = URL.createObjectURL(file);
            video.src = url;
            videoSection.style.display = 'block';

            // Move upload section to video right sidebar
            if (uploadSection && videoRightSidebar) {
                // Create upload control group if it doesn't exist
                let uploadGroup = videoRightSidebar.querySelector('.upload-control-group');
                if (!uploadGroup) {
                    uploadGroup = document.createElement('div');
                    uploadGroup.className = 'side-control-group upload-control-group';
                    uploadGroup.innerHTML = '<h3 style="margin: 0 0 10px 0; font-size: 16px;">Upload</h3>';
                    videoRightSidebar.insertBefore(uploadGroup, videoRightSidebar.firstChild);
                }
                // Move upload section content to sidebar
                uploadGroup.appendChild(uploadSection);
                uploadSection.style.margin = '0';
                uploadSection.style.padding = '0';
                uploadSection.style.background = 'transparent';
                uploadSection.style.display = 'flex';
                uploadSection.style.flexDirection = 'column';
                uploadSection.style.gap = '8px';

                // Adjust upload button styles for sidebar
                const uploadButtons = uploadSection.querySelectorAll('.upload-btn');
                uploadButtons.forEach(btn => {
                    btn.style.width = '100%';
                    btn.style.textAlign = 'center';
                    btn.style.padding = '10px';
                    btn.style.marginBottom = '0';
                });
            }

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

            // Uncheck all edit mode checkboxes
            if (editModeVideoCheckbox) editModeVideoCheckbox.checked = false;
            if (editModeCalibrationVideoCheckbox) editModeCalibrationVideoCheckbox.checked = false;
            if (drawLineModeVideoCheckbox) drawLineModeVideoCheckbox.checked = false;
            if (drawAngleModeVideoCheckbox) drawAngleModeVideoCheckbox.checked = false;

            // Disable all edit modes
            isEditMode = false;
            isEditModeCalibration = false;
            isDrawLineMode = false;
            isDrawAngleMode = false;
            canvas.classList.remove('editable');
            console.log('All edit modes disabled for new video');

            // Show close media button
            if (closeMediaBtn) {
                closeMediaBtn.style.display = 'block';
            }
        }
    });

    // Handle image upload
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log('Image file selected:', file.name);

            // Set flag to stop processing current media
            isLoadingNewMedia = true;

            // Reset pose data for new image
            imagePoseData = null;

            // Reuse existing MediaPipe Pose instance to avoid WebAssembly conflicts
            console.log('Loading new image with existing MediaPipe Pose instance...');
            if (!pose) {
                console.log('Initializing MediaPipe Pose for first time...');
                initializePose();
            }

            // Store original filename (without extension)
            originalImageFileName = file.name.replace(/\.[^/.]+$/, '');

            const url = URL.createObjectURL(file);
            imageDisplay.src = url;
            imageSection.style.display = 'block';

            // Move upload section to image right sidebar
            if (uploadSection && imageRightSidebar) {
                // Create upload control group if it doesn't exist
                let uploadGroup = imageRightSidebar.querySelector('.upload-control-group');
                if (!uploadGroup) {
                    uploadGroup = document.createElement('div');
                    uploadGroup.className = 'side-control-group upload-control-group';
                    uploadGroup.innerHTML = '<h3 style="margin: 0 0 10px 0; font-size: 16px;">Upload</h3>';
                    imageRightSidebar.insertBefore(uploadGroup, imageRightSidebar.firstChild);
                }
                // Move upload section content to sidebar
                uploadGroup.appendChild(uploadSection);
                uploadSection.style.margin = '0';
                uploadSection.style.padding = '0';
                uploadSection.style.background = 'transparent';
                uploadSection.style.display = 'flex';
                uploadSection.style.flexDirection = 'column';
                uploadSection.style.gap = '8px';

                // Adjust upload button styles for sidebar
                const uploadButtons = uploadSection.querySelectorAll('.upload-btn');
                uploadButtons.forEach(btn => {
                    btn.style.width = '100%';
                    btn.style.textAlign = 'center';
                    btn.style.padding = '10px';
                    btn.style.marginBottom = '0';
                });
            }

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

                // Clear the loading flag - ready to process new image
                isLoadingNewMedia = false;

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

                // Uncheck all edit mode checkboxes
                if (editModeImageCheckbox) editModeImageCheckbox.checked = false;
                if (editModeCalibrationImageCheckbox) editModeCalibrationImageCheckbox.checked = false;
                if (drawLineModeImageCheckbox) drawLineModeImageCheckbox.checked = false;
                if (drawAngleModeImageCheckbox) drawAngleModeImageCheckbox.checked = false;

                // Disable all edit modes
                isEditMode = false;
                isEditModeCalibration = false;
                isDrawLineMode = false;
                isDrawAngleMode = false;
                imageCanvas.classList.remove('editable');
                console.log('All edit modes disabled for new image');

                // Show close media button
                if (closeMediaBtn) {
                    closeMediaBtn.style.display = 'block';
                }
            };

            imageDisplay.onerror = (error) => {
                console.error('Error loading image:', error);
                alert('Failed to load image. Please try a different file.');
            };
        }
    });

    // When video metadata is loaded
    video.addEventListener('loadedmetadata', async () => {
        // Ensure playback rate is normal (1.0x)
        video.playbackRate = 1.0;

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

        // Clear the loading flag - ready to process new video
        isLoadingNewMedia = false;

        // Process first frame after a short delay to ensure pose is initialized
        console.log('Video metadata loaded, processing first frame...');
        setTimeout(() => {
            console.log('Attempting to process first frame, pose initialized:', !!pose);
            processPoseFrame();
        }, 100);
    });

    // Update display as video plays
    video.addEventListener('timeupdate', () => {
        updateTimeDisplay();
        updateFrameNumber();
    });

    // Play button
    playBtn.addEventListener('click', () => {
        video.playbackRate = 1.0; // Ensure normal playback speed
        video.play();
    });

    // Pause button
    pauseBtn.addEventListener('click', () => {
        video.pause();
    });

    // Monitor and enforce consistent playback rate
    video.addEventListener('ratechange', () => {
        if (video.playbackRate !== 1.0) {
            console.warn(`Playback rate changed to ${video.playbackRate}, resetting to 1.0`);
            video.playbackRate = 1.0;
        }
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
            redrawCurrentFrame();
        }
    });

    showCOMCheckbox.addEventListener('change', (e) => {
        showCOM = e.target.checked;
        if (!video.paused) {
            clearCanvas();
        } else {
            redrawCurrentFrame();
        }
    });

    showLeftSideCheckbox.addEventListener('change', (e) => {
        showLeftSide = e.target.checked;
        if (!video.paused) {
            clearCanvas();
        } else {
            redrawCurrentFrame();
        }
    });

    showRightSideCheckbox.addEventListener('change', (e) => {
        showRightSide = e.target.checked;
        if (!video.paused) {
            clearCanvas();
        } else {
            redrawCurrentFrame();
        }
    });

    showJointNumbersCheckbox.addEventListener('change', (e) => {
        showJointNumbers = e.target.checked;
        if (!video.paused) {
            clearCanvas();
        } else {
            redrawCurrentFrame();
        }
    });

    showCoordinatesCheckbox.addEventListener('change', (e) => {
        showCoordinates = e.target.checked;
        if (!video.paused) {
            clearCanvas();
        } else {
            redrawCurrentFrame();
        }
    });

    showCoordinateSystemCheckbox.addEventListener('change', (e) => {
        showCoordinateSystem = e.target.checked;
        if (!video.paused) {
            clearCanvas();
        } else {
            redrawCurrentFrame();
        }
    });

    const showVelocityVectorsCheckbox = document.getElementById('showVelocityVectors');
    showVelocityVectorsCheckbox.addEventListener('change', (e) => {
        showVelocityVectors = e.target.checked;
        if (!video.paused) {
            clearCanvas();
        } else {
            redrawCurrentFrame();
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

    showCOMImageCheckbox.addEventListener('change', (e) => {
        showCOMImage = e.target.checked;
        redrawImagePose();
    });

    showLeftSideImageCheckbox.addEventListener('change', (e) => {
        showLeftSideImage = e.target.checked;
        redrawImagePose();
    });

    showRightSideImageCheckbox.addEventListener('change', (e) => {
        showRightSideImage = e.target.checked;
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

    showCoordinateSystemImageCheckbox.addEventListener('change', (e) => {
        showCoordinateSystemImage = e.target.checked;
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

    // Font size slider for image
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const fontSizeValue = document.getElementById('fontSizeValue');
    if (fontSizeSlider && fontSizeValue) {
        fontSizeSlider.addEventListener('input', (e) => {
            displayFontSize = parseInt(e.target.value);
            fontSizeValue.textContent = displayFontSize;
            // Also update the video slider if it exists
            const fontSizeSliderVideo = document.getElementById('fontSizeSliderVideo');
            const fontSizeValueVideo = document.getElementById('fontSizeValueVideo');
            if (fontSizeSliderVideo && fontSizeValueVideo) {
                fontSizeSliderVideo.value = displayFontSize;
                fontSizeValueVideo.textContent = displayFontSize;
            }
            redrawImagePose();
        });
    }

    // Font size slider for video
    const fontSizeSliderVideo = document.getElementById('fontSizeSliderVideo');
    const fontSizeValueVideo = document.getElementById('fontSizeValueVideo');
    if (fontSizeSliderVideo && fontSizeValueVideo) {
        fontSizeSliderVideo.addEventListener('input', (e) => {
            displayFontSize = parseInt(e.target.value);
            fontSizeValueVideo.textContent = displayFontSize;
            // Also update the image slider if it exists
            if (fontSizeSlider && fontSizeValue) {
                fontSizeSlider.value = displayFontSize;
                fontSizeValue.textContent = displayFontSize;
            }
            drawPose();
        });
    }

    // Edit mode controls - Mutually exclusive checkboxes
    if (editModeImageCheckbox) {
        editModeImageCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Uncheck all other modes
                if (editModeCalibrationImageCheckbox) editModeCalibrationImageCheckbox.checked = false;
                if (drawLineModeImageCheckbox) drawLineModeImageCheckbox.checked = false;
                if (drawAngleModeImageCheckbox) drawAngleModeImageCheckbox.checked = false;

                isEditMode = true;
                isEditModeCalibration = false;
                isDrawLineMode = false;
                isDrawAngleMode = false;
                drawingPoints = [];
                imageCanvas.classList.add('editable');
                imageCanvas.style.cursor = 'default';
                console.log('Edit mode enabled for image');
            } else {
                isEditMode = false;
                imageCanvas.classList.remove('editable');
                isDragging = false;
                draggedJointIndex = null;
                console.log('Edit mode disabled for image');
            }
        });
    }

    if (editModeVideoCheckbox) {
        editModeVideoCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Uncheck all other modes
                if (editModeCalibrationVideoCheckbox) editModeCalibrationVideoCheckbox.checked = false;
                if (drawLineModeVideoCheckbox) drawLineModeVideoCheckbox.checked = false;
                if (drawAngleModeVideoCheckbox) drawAngleModeVideoCheckbox.checked = false;

                isEditMode = true;
                isEditModeCalibration = false;
                isDrawLineMode = false;
                isDrawAngleMode = false;
                drawingPoints = [];
                canvas.classList.add('editable');
                canvas.style.cursor = 'default';
                console.log('Edit mode enabled for video');
            } else {
                isEditMode = false;
                canvas.classList.remove('editable');
                isDragging = false;
                draggedJointIndex = null;
                console.log('Edit mode disabled for video');
            }
        });
    }

    if (editModeCalibrationVideoCheckbox) {
        editModeCalibrationVideoCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Uncheck all other modes
                if (editModeVideoCheckbox) editModeVideoCheckbox.checked = false;
                if (drawLineModeVideoCheckbox) drawLineModeVideoCheckbox.checked = false;
                if (drawAngleModeVideoCheckbox) drawAngleModeVideoCheckbox.checked = false;

                isEditMode = false;
                isEditModeCalibration = true;
                isDrawLineMode = false;
                isDrawAngleMode = false;
                drawingPoints = [];
                canvas.classList.add('editable');
                canvas.style.cursor = 'default';
                console.log('Calibration edit mode enabled for video');
            } else {
                isEditModeCalibration = false;
                canvas.classList.remove('editable');
                isDragging = false;
                draggedCalibrationPoint = null;
                console.log('Calibration edit mode disabled for video');
            }
        });
    }

    if (editModeCalibrationImageCheckbox) {
        editModeCalibrationImageCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Uncheck all other modes
                if (editModeImageCheckbox) editModeImageCheckbox.checked = false;
                if (drawLineModeImageCheckbox) drawLineModeImageCheckbox.checked = false;
                if (drawAngleModeImageCheckbox) drawAngleModeImageCheckbox.checked = false;

                isEditMode = false;
                isEditModeCalibration = true;
                isDrawLineMode = false;
                isDrawAngleMode = false;
                drawingPoints = [];
                imageCanvas.classList.add('editable');
                imageCanvas.style.cursor = 'default';
                console.log('Calibration edit mode enabled for image');
            } else {
                isEditModeCalibration = false;
                imageCanvas.classList.remove('editable');
                isDragging = false;
                draggedCalibrationPoint = null;
                console.log('Calibration edit mode disabled for image');
            }
        });
    }

    // Drawing mode event listeners
    const drawLineModeVideoCheckbox = document.getElementById('drawLineModeVideo');
    const drawAngleModeVideoCheckbox = document.getElementById('drawAngleModeVideo');
    const drawLineModeImageCheckbox = document.getElementById('drawLineModeImage');
    const drawAngleModeImageCheckbox = document.getElementById('drawAngleModeImage');

    if (drawLineModeVideoCheckbox) {
        drawLineModeVideoCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Uncheck all other modes
                if (editModeVideoCheckbox) editModeVideoCheckbox.checked = false;
                if (editModeCalibrationVideoCheckbox) editModeCalibrationVideoCheckbox.checked = false;
                if (drawAngleModeVideoCheckbox) drawAngleModeVideoCheckbox.checked = false;

                isEditMode = false;
                isEditModeCalibration = false;
                isDrawLineMode = true;
                isDrawAngleMode = false;
                drawingPoints = [];
                canvas.classList.add('editable'); // Enable pointer events
                canvas.style.cursor = 'crosshair';
                if (video && video.src) video.pause();
                console.log('Line drawing mode enabled for video');
            } else {
                isDrawLineMode = false;
                drawingPoints = [];
                canvas.classList.remove('editable'); // Disable pointer events
                canvas.style.cursor = 'default';
                console.log('Line drawing mode disabled for video');
            }
        });
    }

    if (drawAngleModeVideoCheckbox) {
        drawAngleModeVideoCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Uncheck all other modes
                if (editModeVideoCheckbox) editModeVideoCheckbox.checked = false;
                if (editModeCalibrationVideoCheckbox) editModeCalibrationVideoCheckbox.checked = false;
                if (drawLineModeVideoCheckbox) drawLineModeVideoCheckbox.checked = false;

                isEditMode = false;
                isEditModeCalibration = false;
                isDrawLineMode = false;
                isDrawAngleMode = true;
                drawingPoints = [];
                canvas.classList.add('editable'); // Enable pointer events
                canvas.style.cursor = 'crosshair';
                if (video && video.src) video.pause();
                console.log('Angle drawing mode enabled for video');
            } else {
                isDrawAngleMode = false;
                drawingPoints = [];
                canvas.classList.remove('editable'); // Disable pointer events
                canvas.style.cursor = 'default';
                console.log('Angle drawing mode disabled for video');
            }
        });
    }

    if (drawLineModeImageCheckbox) {
        drawLineModeImageCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Uncheck all other modes
                if (editModeImageCheckbox) editModeImageCheckbox.checked = false;
                if (editModeCalibrationImageCheckbox) editModeCalibrationImageCheckbox.checked = false;
                if (drawAngleModeImageCheckbox) drawAngleModeImageCheckbox.checked = false;

                isEditMode = false;
                isEditModeCalibration = false;
                isDrawLineMode = true;
                isDrawAngleMode = false;
                drawingPoints = [];
                imageCanvas.classList.add('editable'); // Enable pointer events
                imageCanvas.style.cursor = 'crosshair';
                console.log('Line drawing mode enabled for image');
            } else {
                isDrawLineMode = false;
                drawingPoints = [];
                imageCanvas.classList.remove('editable'); // Disable pointer events
                imageCanvas.style.cursor = 'default';
                console.log('Line drawing mode disabled for image');
            }
        });
    }

    if (drawAngleModeImageCheckbox) {
        drawAngleModeImageCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Uncheck all other modes
                if (editModeImageCheckbox) editModeImageCheckbox.checked = false;
                if (editModeCalibrationImageCheckbox) editModeCalibrationImageCheckbox.checked = false;
                if (drawLineModeImageCheckbox) drawLineModeImageCheckbox.checked = false;

                isEditMode = false;
                isEditModeCalibration = false;
                isDrawLineMode = false;
                isDrawAngleMode = true;
                drawingPoints = [];
                imageCanvas.classList.add('editable'); // Enable pointer events
                imageCanvas.style.cursor = 'crosshair';
                console.log('Angle drawing mode enabled for image');
            } else {
                isDrawAngleMode = false;
                drawingPoints = [];
                imageCanvas.classList.remove('editable'); // Disable pointer events
                imageCanvas.style.cursor = 'default';
                console.log('Angle drawing mode disabled for image');
            }
        });
    }

    // Clear Drawings buttons
    const clearDrawingsVideoBtn = document.getElementById('clearDrawingsVideo');
    const clearDrawingsImageBtn = document.getElementById('clearDrawingsImage');

    if (clearDrawingsVideoBtn) {
        clearDrawingsVideoBtn.addEventListener('click', () => {
            const currentFrame = Math.floor(video.currentTime * fps);
            // Remove all drawings for the current frame in video mode
            completedDrawings = completedDrawings.filter(d => d.isImageMode || d.frame !== currentFrame);
            drawingPoints = []; // Clear any in-progress drawing
            redrawCurrentFrame();
            console.log(`Cleared all drawings for video frame ${currentFrame}`);
        });
    }

    if (clearDrawingsImageBtn) {
        clearDrawingsImageBtn.addEventListener('click', () => {
            // Remove all drawings for image mode
            completedDrawings = completedDrawings.filter(d => !d.isImageMode);
            drawingPoints = []; // Clear any in-progress drawing
            redrawImagePose();
            console.log('Cleared all drawings for image');
        });
    }

    // Mouse events for image canvas
    imageCanvas.addEventListener('mousedown', handleMouseDown);
    imageCanvas.addEventListener('mousemove', handleMouseMove);
    imageCanvas.addEventListener('mouseup', handleMouseUp);
    imageCanvas.addEventListener('mouseleave', handleMouseUp);

    // Prevent video from playing when clicking in drawing/edit modes
    video.addEventListener('click', (e) => {
        if (isDrawLineMode || isDrawAngleMode || isEditMode || isEditModeCalibration) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Video click prevented - in edit/draw mode');
        }
    });

    // Mouse events for video canvas
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    // Processing speed removed - now using video's native framerate via requestAnimationFrame

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

    // Video export button handlers
    document.getElementById('exportVideoExcel').addEventListener('click', exportAsExcel);
    document.getElementById('exportFrameScreenshot').addEventListener('click', exportFrameScreenshot);
    document.getElementById('exportVideoWithOverlay').addEventListener('click', exportVideoWithOverlay);
    document.getElementById('clearDataBtn').addEventListener('click', clearPoseData);

    // Image export button handlers
    document.getElementById('exportImageExcel').addEventListener('click', exportImageAsExcel);
    document.getElementById('exportImageScreenshot').addEventListener('click', exportImageScreenshot);

    // Analysis mode radio buttons - Video
    const calibrationScaleLabelVideo = document.getElementById('calibrationScaleLabelVideo');
    const drawLineModeVideoLabel = document.getElementById('drawLineModeVideoLabel');
    document.querySelectorAll('input[name="analysisModeVideo"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            analysisModeVideo = e.target.value;
            console.log(`Video analysis mode changed to: ${analysisModeVideo}`);

            // Show/hide calibration scale input and calibration edit checkbox
            if (analysisModeVideo === '2D') {
                calibrationScaleLabelVideo.style.display = 'inline-block';
                if (editCalibrationVideoLabel) {
                    editCalibrationVideoLabel.style.display = 'inline-block';
                }
                if (drawLineModeVideoLabel) {
                    drawLineModeVideoLabel.style.display = 'inline-block';
                }
            } else {
                calibrationScaleLabelVideo.style.display = 'none';
                if (editCalibrationVideoLabel) {
                    editCalibrationVideoLabel.style.display = 'none';
                }
                if (drawLineModeVideoLabel) {
                    drawLineModeVideoLabel.style.display = 'none';
                }
                // Disable calibration edit mode when switching to 3D
                if (isEditModeCalibration && editModeCalibrationVideoCheckbox) {
                    editModeCalibrationVideoCheckbox.checked = false;
                    isEditModeCalibration = false;
                    canvas.classList.remove('editable');
                }
                // Disable draw line mode when switching to 3D
                if (isDrawLineMode && drawLineModeVideoCheckbox) {
                    drawLineModeVideoCheckbox.checked = false;
                    isDrawLineMode = false;
                    canvas.classList.remove('editable');
                    drawingPoints = [];
                }
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
    const drawLineModeImageLabel = document.getElementById('drawLineModeImageLabel');
    document.querySelectorAll('input[name="analysisModeImage"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            analysisModeImage = e.target.value;
            console.log(`Image analysis mode changed to: ${analysisModeImage}`);

            // Show/hide calibration scale input and calibration edit checkbox
            if (analysisModeImage === '2D') {
                calibrationScaleLabelImage.style.display = 'inline-block';
                if (editCalibrationImageLabel) {
                    editCalibrationImageLabel.style.display = 'inline-block';
                }
                if (drawLineModeImageLabel) {
                    drawLineModeImageLabel.style.display = 'inline-block';
                }
            } else {
                calibrationScaleLabelImage.style.display = 'none';
                if (editCalibrationImageLabel) {
                    editCalibrationImageLabel.style.display = 'none';
                }
                if (drawLineModeImageLabel) {
                    drawLineModeImageLabel.style.display = 'none';
                }
                // Disable calibration edit mode when switching to 3D
                if (isEditModeCalibration && editModeCalibrationImageCheckbox) {
                    editModeCalibrationImageCheckbox.checked = false;
                    isEditModeCalibration = false;
                    imageCanvas.classList.remove('editable');
                }
                // Disable draw line mode when switching to 3D
                if (isDrawLineMode && drawLineModeImageCheckbox) {
                    drawLineModeImageCheckbox.checked = false;
                    isDrawLineMode = false;
                    imageCanvas.classList.remove('editable');
                    drawingPoints = [];
                }
            }

            redrawImagePose();
        });
    });

    // Sex selection radio buttons - Video
    document.querySelectorAll('input[name="sexVideo"]').forEach(radio => {
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
    document.querySelectorAll('input[name="sexImage"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            sexSelectionImage = e.target.value;
            console.log(`Image sex selection changed to: ${sexSelectionImage}`);

            redrawImagePose();
        });
    });

    // Body side is always 'full' - bilateral mirroring is always enabled

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

    // Close media button handler
    if (closeMediaBtn) {
        closeMediaBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to close the current media? This will reload the page.')) {
                location.reload();
            }
        });
    }

    // Summary log
    console.log('=== Initialization Complete ===');
    console.log('All event listeners have been attached.');
    console.log('Ready to use the application.');
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
        console.log('Starting comprehensive FPS detection...');

        // Method 1: Try to get FPS from video metadata (most reliable if available)
        // Check for metadata hints
        if (video.mozDecodedFrames !== undefined && video.mozPresentedFrames !== undefined) {
            // Firefox-specific metadata
            const startTime = performance.now();
            const startFrames = video.mozPresentedFrames;

            setTimeout(() => {
                const elapsed = (performance.now() - startTime) / 1000;
                const framesPassed = video.mozPresentedFrames - startFrames;
                if (framesPassed > 0 && elapsed > 0) {
                    const detectedFPS = Math.round(framesPassed / elapsed);
                    console.log(`Firefox metadata FPS: ${detectedFPS}`);
                }
            }, 1000);
        }

        // Method 2: Use requestVideoFrameCallback with improved sampling
        if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
            let frameTimes = [];
            let frameTimestamps = [];
            let callbackCount = 0;
            const maxCallbacks = 30; // Increased from 10 to 30 for better accuracy
            let startTimestamp = null;
            let startFrame = null;

            const measureFrame = (now, metadata) => {
                if (startTimestamp === null) {
                    startTimestamp = now;
                    startFrame = metadata.presentedFrames || 0;
                } else {
                    // Calculate instantaneous frame time
                    if (frameTimestamps.length > 0) {
                        const frameDuration = (now - frameTimestamps[frameTimestamps.length - 1]) / 1000;
                        if (frameDuration > 0 && frameDuration < 0.1) { // Filter outliers (> 100ms)
                            frameTimes.push(frameDuration);
                        }
                    }
                    frameTimestamps.push(now);
                }

                callbackCount++;

                if (callbackCount < maxCallbacks && !video.paused) {
                    video.requestVideoFrameCallback(measureFrame);
                } else {
                    // Calculate FPS using multiple methods
                    let calculatedFPS = null;

                    // Method A: Average frame duration
                    if (frameTimes.length > 5) {
                        // Remove outliers (top and bottom 10%)
                        frameTimes.sort((a, b) => a - b);
                        const trimCount = Math.floor(frameTimes.length * 0.1);
                        const trimmedTimes = frameTimes.slice(trimCount, frameTimes.length - trimCount);

                        const avgFrameDuration = trimmedTimes.reduce((a, b) => a + b) / trimmedTimes.length;
                        const fpsFromAvg = Math.round(1 / avgFrameDuration);
                        console.log(`FPS from average frame duration: ${fpsFromAvg}`);
                        calculatedFPS = fpsFromAvg;
                    }

                    // Method B: Total time / total frames (more reliable)
                    if (metadata && metadata.presentedFrames !== undefined && startFrame !== null) {
                        const totalFrames = metadata.presentedFrames - startFrame;
                        const totalTime = (now - startTimestamp) / 1000;
                        if (totalFrames > 0 && totalTime > 0) {
                            const fpsFromTotal = Math.round(totalFrames / totalTime);
                            console.log(`FPS from total frames/time: ${fpsFromTotal}`);
                            // Prefer this method if available
                            calculatedFPS = fpsFromTotal;
                        }
                    }

                    if (calculatedFPS) {
                        fps = calculatedFPS;
                        // Snap to common FPS values with tighter tolerance
                        if (fps >= 119 && fps <= 121) fps = 120;
                        else if (fps >= 89 && fps <= 91) fps = 90;
                        else if (fps >= 59 && fps <= 61) fps = 60;
                        else if (fps >= 49 && fps <= 51) fps = 50;
                        else if (fps >= 47 && fps <= 49) fps = 48;
                        else if (fps >= 29 && fps <= 31) fps = 30;
                        else if (fps >= 24 && fps <= 26) fps = 25;
                        else if (fps >= 23 && fps <= 25) fps = 24;
                    }

                    console.log(`Final detected FPS: ${fps}`);
                    video.pause();
                    video.currentTime = 0;
                    resolve();
                }
            };

            // Start measurement from beginning of video
            video.currentTime = 0;
            video.playbackRate = 1.0; // Ensure normal playback speed
            video.play().then(() => {
                video.requestVideoFrameCallback(measureFrame);
            }).catch(err => {
                console.error('Error starting video for FPS detection:', err);
                fps = 30; // Fallback
                resolve();
            });
        } else {
            // Fallback: Estimate from duration and attempt frame counting
            console.log('requestVideoFrameCallback not supported, using fallback');

            // Try to estimate based on common video properties
            // Most web videos are 30fps, but 24, 25, 60 are also common
            const duration = video.duration;

            // Heuristic: videos with "clean" durations often indicate specific framerates
            // For example, a 10.00 second video at 30fps = 300 frames
            // while 10.00 seconds at 29.97fps = 299.7 frames
            const possibleFPS = [24, 25, 29.97, 30, 50, 59.94, 60];
            let bestMatch = 30;
            let bestError = Infinity;

            for (const testFPS of possibleFPS) {
                const estimatedFrames = duration * testFPS;
                const frameError = Math.abs(estimatedFrames - Math.round(estimatedFrames));
                if (frameError < bestError) {
                    bestError = frameError;
                    bestMatch = Math.round(testFPS);
                }
            }

            fps = bestMatch;
            console.log(`Fallback FPS estimate: ${fps}`);
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

    // Clear drawings for the previous frame
    const newFrame = Math.floor(video.currentTime * fps);
    completedDrawings = completedDrawings.filter(d => d.isImageMode || d.frame === newFrame);

    // Show visual feedback
    showFrameStepIndicator();

    // Check if we have manually edited data for this frame
    setTimeout(() => {
        const currentFrame = Math.floor(video.currentTime * fps);
        const savedFrameData = poseDataArray.find(d => d.frame === currentFrame);

        if (savedFrameData && savedFrameData.manuallyEdited) {
            // Use saved data only if frame was manually edited
            clearCanvas();
            if (showPose && savedFrameData.landmarks2D) {
                drawPose(savedFrameData.landmarks2D, savedFrameData.landmarks3D);
            }
        } else {
            // No manual edits, run MediaPipe detection
            processPoseFrame();
        }
    }, 100);
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

// Redraw current frame from saved data (only if manually edited) or run detection
function redrawCurrentFrame() {
    if (!video || !video.src) return;

    const currentFrame = Math.floor(video.currentTime * fps);
    const savedFrameData = poseDataArray.find(d => d.frame === currentFrame);

    if (savedFrameData && savedFrameData.manuallyEdited) {
        // Use saved data only if frame was manually edited
        clearCanvas();
        if (showPose && savedFrameData.landmarks2D) {
            drawPose(savedFrameData.landmarks2D, savedFrameData.landmarks3D);
        }
    } else {
        // No manual edits, run MediaPipe detection
        processPoseFrame();
    }
}

// Initialize MediaPipe Pose
function initializePose() {
    // Check if Pose is available in window object
    if (typeof window.Pose === 'undefined') {
        console.error('MediaPipe Pose library not loaded! Check if CDN is accessible.');
        alert('Error: MediaPipe Pose library failed to load. Please check your internet connection and refresh the page (Ctrl+F5).');
        return;
    }

    try {
        pose = new window.Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });

        pose.setOptions({
            modelComplexity: 1, // Use full model for better accuracy (0=lite, 1=full, 2=heavy)
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5, // Increased for better detection quality
            minTrackingConfidence: 0.5  // Increased for better tracking quality
        });

        pose.onResults(onPoseResults);
        console.log('MediaPipe Pose initialized with full model for better landmark detection accuracy');
    } catch (error) {
        console.error('Error initializing MediaPipe Pose:', error);
        alert('Error initializing pose detection: ' + error.message);
    }
}

// Process a single frame for pose detection
async function processPoseFrame() {
    // Don't process if we're loading new media
    if (isLoadingNewMedia) {
        console.log('Skipping frame processing - loading new media');
        return;
    }

    if (!pose) {
        console.warn('processPoseFrame: pose object is null/undefined, waiting for initialization...');
        // Try to reinitialize if needed
        if (typeof window.Pose !== 'undefined') {
            console.log('Attempting to reinitialize MediaPipe Pose...');
            initializePose();
            // Wait briefly for initialization
            await new Promise(resolve => setTimeout(resolve, 200));
            if (!pose) return; // Still not ready
        } else {
            return;
        }
    }
    if (!video.videoWidth) {
        console.error('processPoseFrame: video.videoWidth is 0 or undefined');
        return;
    }

    try {
        console.log('Sending frame to MediaPipe Pose...');
        await pose.send({ image: video });
    } catch (error) {
        console.error('Error processing frame:', error);
    }
}

// Start pose processing synchronized with video framerate
function startPoseProcessing() {
    stopPoseProcessing(); // Clear any existing timer

    if (!showPose) return;

    // Display the detected video FPS in the Processing FPS field
    const fpsDisplay = document.getElementById('processingFPS');
    if (fpsDisplay) {
        fpsDisplay.textContent = fps;
    }

    let lastProcessedTime = -1;

    // Use requestAnimationFrame but only process new video frames
    function processFrame() {
        if (!video.paused && !video.ended && showPose) {
            // Only process if video has advanced to a new frame
            // Video currentTime changes when a new frame is available
            const currentTime = video.currentTime;

            if (currentTime !== lastProcessedTime) {
                lastProcessedTime = currentTime;
                processPoseFrame().catch(err => console.error('Pose processing error:', err));
            }

            processingTimer = requestAnimationFrame(processFrame);
        } else {
            stopPoseProcessing();
        }
    }

    processingTimer = requestAnimationFrame(processFrame);
    console.log(`Pose processing started at video framerate: ${fps} FPS`);
}

// Stop pose processing
function stopPoseProcessing() {
    if (processingTimer) {
        cancelAnimationFrame(processingTimer);
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
    console.log('onPoseResults called for video - showPose:', showPose, 'has landmarks:', !!results.poseLandmarks);

    clearCanvas();

    if (!showPose || !results.poseLandmarks) {
        document.getElementById('jointCountVideo').textContent = '0';
        console.log('No pose to show - showPose:', showPose, 'landmarks:', !!results.poseLandmarks);
        // Still draw calibration points in 2D mode even without pose
        if (analysisModeVideo === '2D') {
            const fullSizeVideoCheckbox = document.getElementById('fullSizeVideo');
            const effectiveFontSize = fullSizeVideoCheckbox && fullSizeVideoCheckbox.checked ? displayFontSize * 2 : displayFontSize;
            drawCalibrationPoints(ctx, canvas.width, canvas.height, calibrationPoint1Video, calibrationPoint2Video, calibrationScaleVideo, effectiveFontSize);
        }
        return;
    }

    console.log('Drawing pose with', results.poseLandmarks.length, 'landmarks');
    console.log('First landmark visibility:', results.poseLandmarks[0]?.visibility);
    console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
    drawPose(results.poseLandmarks, results.poseWorldLandmarks);
    console.log('drawPose() completed');
    // Count displayed joints: 50 total - 13 excluded = 37 displayed
    const displayedJointCount = LANDMARK_NAMES.length - EXCLUDED_LANDMARKS.length;
    document.getElementById('jointCountVideo').textContent = displayedJointCount;

    // Fill missing landmarks with mirrored versions FIRST (same as drawPose does)
    const { filled2D, filled3D } = fillMissingLandmarksWithMirrors(results.poseLandmarks, results.poseWorldLandmarks);

    // Calculate extended landmarks including midpoints, segment COMs, and total body COM
    // Using mirrored data for consistency with displayed data
    const { midpoints2D, midpoints3D } = calculateMidpoints(filled2D, filled3D);

    // Extend landmarks array with midpoints (using mirrored data)
    const extendedLandmarks2D = [...filled2D];
    const extendedLandmarks3D = filled3D ? [...filled3D] : [];
    if (midpoints2D[33]) extendedLandmarks2D[33] = midpoints2D[33];
    if (midpoints2D[34]) extendedLandmarks2D[34] = midpoints2D[34];
    if (midpoints3D[33]) extendedLandmarks3D[33] = midpoints3D[33];
    if (midpoints3D[34]) extendedLandmarks3D[34] = midpoints3D[34];

    // Calculate segment centers of mass (using mirrored data)
    const { segmentCOMs2D, segmentCOMs3D } = calculateSegmentCOMs(extendedLandmarks2D, extendedLandmarks3D, sexSelectionVideo);

    // Extend landmarks array with COMs
    for (let i = 35; i <= 48; i++) {
        if (segmentCOMs2D[i]) extendedLandmarks2D[i] = segmentCOMs2D[i];
        if (segmentCOMs3D[i]) extendedLandmarks3D[i] = segmentCOMs3D[i];
    }

    // Calculate total body center of mass (using mirrored data)
    const { totalBodyCOM2D, totalBodyCOM3D } = calculateTotalBodyCOM(segmentCOMs2D, segmentCOMs3D, sexSelectionVideo);

    // Add total body COM to extended landmarks (index 49)
    if (totalBodyCOM2D) extendedLandmarks2D[49] = totalBodyCOM2D;
    if (totalBodyCOM3D) extendedLandmarks3D[49] = totalBodyCOM3D;

    // Store extended pose data for export (includes all calculated landmarks with mirrored data)
    savePoseData(extendedLandmarks2D, extendedLandmarks3D);
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
// Calculate total body COM (body side is always 'full')
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
    console.log('drawPose() called with', landmarks?.length, 'landmarks');
    const width = canvas.width;
    const height = canvas.height;
    console.log('Drawing on canvas size:', width, 'x', height);

    // Calculate effective font size (double if Full Size is checked)
    const fullSizeVideoCheckbox = document.getElementById('fullSizeVideo');
    const effectiveFontSize = fullSizeVideoCheckbox && fullSizeVideoCheckbox.checked ? displayFontSize * 2 : displayFontSize;

    // Fill missing landmarks with mirrored versions from opposite side
    const { filled2D, filled3D } = fillMissingLandmarksWithMirrors(landmarks, landmarks3D);

    // Store filled landmarks for edit mode click detection
    lastFilledLandmarks2DVideo = filled2D;

    // Calculate midpoint landmarks
    const { midpoints2D, midpoints3D } = calculateMidpoints(filled2D, filled3D);

    // Extend landmarks array with midpoints
    const extendedLandmarks2D = [...filled2D];
    const extendedLandmarks3D = filled3D ? [...filled3D] : [];
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
        const start = filled2D[startIdx];
        const end = filled2D[endIdx];

        // Body side is always 'full' - show all connections
        if (!shouldDisplayConnection(startIdx, endIdx)) {
            return;
        }

        // Filter connections based on left/right side checkboxes
        const startName = LANDMARK_NAMES[startIdx];
        const endName = LANDMARK_NAMES[endIdx];
        const isLeftConnection = startName?.startsWith('Left_') || endName?.startsWith('Left_');
        const isRightConnection = startName?.startsWith('Right_') || endName?.startsWith('Right_');

        if (isLeftConnection && !showLeftSide) {
            return;
        }
        if (isRightConnection && !showRightSide) {
            return;
        }

        if (start && end && start.visibility > 0.3 && end.visibility > 0.3) {
            ctx.beginPath();
            ctx.moveTo(start.x * width, start.y * height);
            ctx.lineTo(end.x * width, end.y * height);
            ctx.stroke();
        }
    });

    // Draw connection between Mid-Shoulder (33) and Mid-Hip (34)
    if (extendedLandmarks2D[33] && extendedLandmarks2D[34]) {
        const midShoulder = extendedLandmarks2D[33];
        const midHip = extendedLandmarks2D[34];

        if (midShoulder.visibility > 0.3 && midHip.visibility > 0.3) {
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(midShoulder.x * width, midShoulder.y * height);
            ctx.lineTo(midHip.x * width, midHip.y * height);
            ctx.stroke();
        }
    }

    // Calculate base size relative to canvas resolution for better visibility
    const baseSize = Math.max(width, height) * 0.003; // Base size for regular joints (~3px for 1000px resolution)

    // Draw landmarks (joints) - including calculated midpoints
    extendedLandmarks2D.forEach((landmark, index) => {
        // Skip excluded landmarks (nose and eyes)
        if (EXCLUDED_LANDMARKS.includes(index)) {
            return;
        }

        // Determine landmark type
        const isMidpoint = index === 33 || index === 34;
        const isSegmentCOM = index >= 35 && index <= 48;
        const isTotalBodyCOM = index === 49;
        const isRegularJoint = !isMidpoint && !isSegmentCOM && !isTotalBodyCOM;

        // Filter based on Show Pose checkbox (only regular joints)
        if (isRegularJoint && !showPose) {
            return;
        }

        // Filter based on Show COM checkbox (segment COMs and total body COM)
        if ((isSegmentCOM || isTotalBodyCOM) && !showCOM) {
            return;
        }

        // Filter based on left/right side checkboxes
        const landmarkName = LANDMARK_NAMES[index];
        const isLeftSide = landmarkName?.startsWith('Left_');
        const isRightSide = landmarkName?.startsWith('Right_');

        if (isLeftSide && !showLeftSide) {
            return;
        }
        if (isRightSide && !showRightSide) {
            return;
        }

        // Body side is always 'full' - show all landmarks
        if (!shouldDisplayLandmark(index)) {
            return;
        }

        // Skip if landmark doesn't exist or has low visibility
        if (!landmark || landmark.visibility < 0.3) {
            return;
        }

        const x = landmark.x * width;
        const y = landmark.y * height;

        // Draw joint circle - highlight if being dragged
        const isBeingDragged = isDragging && draggedJointIndex === index;

        // Calculate sizes based on landmark type
        const regularJointSize = baseSize;
        const midpointSize = baseSize * 1.3;
        const segmentCOMSize = baseSize * 2; // 2x the size of regular joints
        const totalBodyCOMSize = baseSize * 4; // 4x the size of regular joints

        // Determine size and color based on landmark type
        let pointSize, pointColor;
        if (isTotalBodyCOM) {
            pointSize = totalBodyCOMSize;
            pointColor = '#FF0000'; // Red for Total Body COM
        } else if (isSegmentCOM) {
            pointSize = segmentCOMSize;
            pointColor = '#FFD700'; // Gold for segment COMs
        } else if (isMidpoint) {
            pointSize = midpointSize;
            pointColor = '#0000FF'; // Blue for midpoints
        } else {
            pointSize = regularJointSize;
            pointColor = '#00FF00'; // Green for regular joints
        }

        // Override color if being dragged
        if (isBeingDragged) {
            pointColor = '#FF00FF'; // Magenta for dragged joint
        }

        // Draw the point
        ctx.fillStyle = pointColor;
        ctx.beginPath();
        ctx.arc(x, y, pointSize, 0, 2 * Math.PI);
        ctx.fill();

        // Add outer ring for Total Body COM
        if (isTotalBodyCOM && !isBeingDragged) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, pointSize, 0, 2 * Math.PI);
            ctx.stroke();
        }

        let textY = y - 10;

        // Draw joint name with coordinates (if enabled)
        if (showJointNumbers) {
            let jointName = getDisplayName(LANDMARK_NAMES[index]);

            // Append coordinates to name if showCoordinates is enabled
            if (showCoordinates) {
                let coordText = '';

                if (analysisModeVideo === '3D' && extendedLandmarks3D && extendedLandmarks3D[index]) {
                    // 3D world coordinates (meters)
                    const lm3d = extendedLandmarks3D[index];
                    // Negate Y to make positive direction upward (conventional)
                    coordText = `(${lm3d.x.toFixed(3)}, ${(-lm3d.y).toFixed(3)}, ${lm3d.z.toFixed(3)})`;
                } else if (analysisModeVideo === '2D') {
                    // 2D coordinates in meters, using calibration
                    const pixelX = landmark.x * width;
                    const pixelY = (1 - landmark.y) * height; // Transform Y to make positive direction upward

                    // Calculate calibration distance in pixels
                    const p1x = calibrationPoint1Video.x * width;
                    const p1y = calibrationPoint1Video.y * height;
                    const p2x = calibrationPoint2Video.x * width;
                    const p2y = calibrationPoint2Video.y * height;
                    const calibDistance = Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));

                    // Convert to meters: (pixels / calibration pixels) * calibration scale
                    const metersX = (pixelX / calibDistance) * calibrationScaleVideo;
                    const metersY = (pixelY / calibDistance) * calibrationScaleVideo;

                    coordText = `(${metersX.toFixed(3)}, ${metersY.toFixed(3)})`;
                }

                if (coordText) {
                    jointName += ` ${coordText}`;
                }
            }

            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.font = `bold ${effectiveFontSize}px Arial`;
            ctx.strokeText(jointName, x + 10, textY);
            ctx.fillText(jointName, x + 10, textY);
        }
    });

    // Draw calibration points in 2D mode
    if (analysisModeVideo === '2D') {
        drawCalibrationPoints(ctx, canvas.width, canvas.height, calibrationPoint1Video, calibrationPoint2Video, calibrationScaleVideo, effectiveFontSize);
    }

    // Draw coordinate system if enabled
    if (showCoordinateSystem) {
        // Pass mid-hip landmark for 3D mode origin
        const midHip = extendedLandmarks2D[34];
        drawCoordinateSystem(ctx, canvas.width, canvas.height, analysisModeVideo, calibrationPoint1Video, calibrationPoint2Video, midHip);
    }

    // Draw velocity vectors if enabled
    const currentFrame = Math.floor(video.currentTime * fps);
    const currentTime = video.currentTime;

    if (showVelocityVectors) {
        const totalBodyCOMCurrent = extendedLandmarks2D[49];

        if (totalBodyCOMCurrent && totalBodyCOMCurrent.visibility >= 0.3) {
            let velocityX = 0;
            let velocityY = 0;

            // Look for previous frame (frame N-1) by absolute frame number
            const prevFrameData = poseDataArray.find(d => d.frame === currentFrame - 1);

            if (prevFrameData) {
                const totalBodyCOMPrev = prevFrameData.landmarks2D[49];

                if (totalBodyCOMPrev && totalBodyCOMPrev.visibility >= 0.3) {
                    const deltaTime = currentTime - prevFrameData.timestamp;

                    if (deltaTime > 0) {
                        // Calculate display coordinates for current Total Body COM (displayed)
                        const currentDisplayCoord = calculateTotalBodyCOMDisplayCoord(
                            totalBodyCOMCurrent,
                            extendedLandmarks3D[49],
                            analysisModeVideo,
                            calibrationPoint1Video,
                            calibrationPoint2Video,
                            calibrationScaleVideo,
                            width,
                            height
                        );

                        // Calculate display coordinates for previous Total Body COM (saved)
                        const prevDisplayCoord = calculateTotalBodyCOMDisplayCoord(
                            totalBodyCOMPrev,
                            prevFrameData.landmarks3D[49],
                            analysisModeVideo,
                            calibrationPoint1Video,
                            calibrationPoint2Video,
                            calibrationScaleVideo,
                            width,
                            height
                        );

                        if (currentDisplayCoord && prevDisplayCoord) {
                            velocityX = (currentDisplayCoord.x - prevDisplayCoord.x) / deltaTime;
                            velocityY = (currentDisplayCoord.y - prevDisplayCoord.y) / deltaTime;
                        }
                    }
                }
            }

            // Draw velocity vectors
            drawVelocityVectors(ctx, width, height, velocityX, velocityY, totalBodyCOMCurrent, effectiveFontSize);
        }
    }

    // Render completed drawings
    renderCompletedDrawings(canvas, false, currentFrame);
}

// Draw calibration points for 2D analysis
function drawCalibrationPoints(context, width, height, point1, point2, scaleLength, fontSize = displayFontSize) {
    const x1 = point1.x * width;
    const y1 = point1.y * height;
    const x2 = point2.x * width;
    const y2 = point2.y * height;

    // Draw line connecting the two points
    context.strokeStyle = '#FFFFFF'; // White
    context.lineWidth = 6;
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

    // Draw label for Point 1
    context.fillStyle = '#FFFFFF';
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    context.font = `bold ${fontSize}px Arial`;
    context.strokeText('Calibration 1', x1 + 10, y1 - 10);
    context.fillText('Calibration 1', x1 + 10, y1 - 10);

    // Draw Point 2
    const isDraggingPoint2 = draggedCalibrationPoint === 'point2';
    context.fillStyle = isDraggingPoint2 ? '#FFFF00' : '#00FFFF'; // Yellow if dragging, cyan otherwise
    context.beginPath();
    context.arc(x2, y2, isDraggingPoint2 ? 12 : 8, 0, 2 * Math.PI);
    context.fill();
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    context.stroke();

    // Draw label for Point 2
    context.fillStyle = '#FFFFFF';
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    context.font = `bold ${fontSize}px Arial`;
    context.strokeText('Calibration 2', x2 + 10, y2 - 10);
    context.fillText('Calibration 2', x2 + 10, y2 - 10);

    // Display scale length at midpoint
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // Calculate calibration distance in pixels
    const calibDistancePixels = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

    // Calculate pixels per meter
    const pixelsPerMeter = calibDistancePixels / scaleLength;

    const scaleText = `Scale: ${scaleLength.toFixed(2)}m`;
    const pixelText = `1 meter = ${pixelsPerMeter.toFixed(0)} pixels`;

    context.fillStyle = '#FFFFFF';
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    context.font = `bold ${fontSize}px Arial`;
    context.strokeText(scaleText, midX, midY - 20);
    context.fillText(scaleText, midX, midY - 20);
    context.strokeText(pixelText, midX, midY + 5);
    context.fillText(pixelText, midX, midY + 5);
}

// Draw coordinate system axes
function drawCoordinateSystem(context, width, height, analysisMode, calibrationPoint1, calibrationPoint2, midHipLandmark) {
    const axisLength = 450; // Length of axes in pixels
    const arrowSize = 20; // Size of arrowhead (doubled for visibility)
    const lineThickness = 9; // Line thickness (3x of original 3)

    if (analysisMode === '2D') {
        // For 2D mode, origin is at left bottom corner
        const originX = 0;
        const originY = height;

        // Draw X axis (positive direction: right, red color)
        context.strokeStyle = '#FF0000'; // Red
        context.lineWidth = lineThickness;
        context.beginPath();
        context.moveTo(originX, originY);
        context.lineTo(originX + axisLength, originY);
        context.stroke();

        // Draw X axis arrowhead
        context.beginPath();
        context.moveTo(originX + axisLength, originY);
        context.lineTo(originX + axisLength - arrowSize, originY - arrowSize/2);
        context.lineTo(originX + axisLength - arrowSize, originY + arrowSize/2);
        context.closePath();
        context.fillStyle = '#FF0000';
        context.fill();

        // Draw X axis label
        context.fillStyle = '#FF0000';
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.font = `bold ${displayFontSize}px Arial`;
        context.strokeText('+X', originX + axisLength + 15, originY + 5);
        context.fillText('+X', originX + axisLength + 15, originY + 5);

        // Draw Y axis (positive direction: up, green color)
        context.strokeStyle = '#00FF00'; // Green
        context.lineWidth = lineThickness;
        context.beginPath();
        context.moveTo(originX, originY);
        context.lineTo(originX, originY - axisLength); // Negative because screen Y is inverted
        context.stroke();

        // Draw Y axis arrowhead
        context.beginPath();
        context.moveTo(originX, originY - axisLength);
        context.lineTo(originX - arrowSize/2, originY - axisLength + arrowSize);
        context.lineTo(originX + arrowSize/2, originY - axisLength + arrowSize);
        context.closePath();
        context.fillStyle = '#00FF00';
        context.fill();

        // Draw Y axis label
        context.fillStyle = '#00FF00';
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.font = `bold ${displayFontSize}px Arial`;
        context.strokeText('+Y', originX + 10, originY - axisLength - 10);
        context.fillText('+Y', originX + 10, originY - axisLength - 10);

        // Draw origin label
        context.fillStyle = '#FFFFFF';
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.font = `bold ${displayFontSize}px Arial`;
        context.strokeText('O (0,0)', originX + 10, originY - 10);
        context.fillText('O (0,0)', originX + 10, originY - 10);

    } else if (analysisMode === '3D') {
        // For 3D mode, origin is at mid-hip position if available
        let originX = 100; // Default position
        let originY = 100;

        if (midHipLandmark && midHipLandmark.visibility > 0.3) {
            originX = midHipLandmark.x * width;
            originY = midHipLandmark.y * height;
        }

        // Draw X axis (red, pointing right)
        context.strokeStyle = '#FF0000'; // Red
        context.lineWidth = lineThickness;
        context.beginPath();
        context.moveTo(originX, originY);
        context.lineTo(originX + axisLength, originY);
        context.stroke();

        // X axis arrowhead
        context.beginPath();
        context.moveTo(originX + axisLength, originY);
        context.lineTo(originX + axisLength - arrowSize, originY - arrowSize/2);
        context.lineTo(originX + axisLength - arrowSize, originY + arrowSize/2);
        context.closePath();
        context.fillStyle = '#FF0000';
        context.fill();

        // X axis label
        context.fillStyle = '#FF0000';
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.font = `bold ${displayFontSize}px Arial`;
        context.strokeText('+X', originX + axisLength + 10, originY + 5);
        context.fillText('+X', originX + axisLength + 10, originY + 5);

        // Draw Y axis (green, pointing up)
        context.strokeStyle = '#00FF00'; // Green
        context.lineWidth = lineThickness;
        context.beginPath();
        context.moveTo(originX, originY);
        context.lineTo(originX, originY - axisLength);
        context.stroke();

        // Y axis arrowhead
        context.beginPath();
        context.moveTo(originX, originY - axisLength);
        context.lineTo(originX - arrowSize/2, originY - axisLength + arrowSize);
        context.lineTo(originX + arrowSize/2, originY - axisLength + arrowSize);
        context.closePath();
        context.fillStyle = '#00FF00';
        context.fill();

        // Y axis label
        context.fillStyle = '#00FF00';
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.font = `bold ${displayFontSize}px Arial`;
        context.strokeText('+Y', originX + 10, originY - axisLength - 5);
        context.fillText('+Y', originX + 10, originY - axisLength - 5);

        // Draw Z axis (blue, pointing toward camera - diagonal down-right to simulate depth)
        const zAxisEndX = originX - axisLength * 0.5;
        const zAxisEndY = originY + axisLength * 0.5;

        context.strokeStyle = '#0080FF'; // Blue
        context.lineWidth = lineThickness;
        context.beginPath();
        context.moveTo(originX, originY);
        context.lineTo(zAxisEndX, zAxisEndY);
        context.stroke();

        // Z axis arrowhead
        const zAngle = Math.atan2(zAxisEndY - originY, zAxisEndX - originX);
        const arrowX1 = zAxisEndX - arrowSize * Math.cos(zAngle - Math.PI/6);
        const arrowY1 = zAxisEndY - arrowSize * Math.sin(zAngle - Math.PI/6);
        const arrowX2 = zAxisEndX - arrowSize * Math.cos(zAngle + Math.PI/6);
        const arrowY2 = zAxisEndY - arrowSize * Math.sin(zAngle + Math.PI/6);

        context.beginPath();
        context.moveTo(zAxisEndX, zAxisEndY);
        context.lineTo(arrowX1, arrowY1);
        context.lineTo(arrowX2, arrowY2);
        context.closePath();
        context.fillStyle = '#0080FF';
        context.fill();

        // Z axis label
        context.fillStyle = '#0080FF';
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.font = `bold ${displayFontSize}px Arial`;
        context.strokeText('+Z', zAxisEndX - 15, zAxisEndY + 25);
        context.fillText('+Z', zAxisEndX - 15, zAxisEndY + 25);

        // Draw origin label
        context.fillStyle = '#FFFFFF';
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.font = `bold ${displayFontSize}px Arial`;
        context.strokeText('O (0,0,0)', originX + 10, originY + 20);
        context.fillText('O (0,0,0)', originX + 10, originY + 20);
    }
}

// Helper function to calculate Total Body COM display coordinates
function calculateTotalBodyCOMDisplayCoord(landmark2D, landmark3D, analysisMode, calibrationPoint1, calibrationPoint2, calibrationScale, canvasWidth, canvasHeight) {
    if (!landmark2D) return null;

    let displayCoord = { x: 0, y: 0 };

    if (analysisMode === '3D' && landmark3D) {
        // 3D mode: use 3D world coordinates with negated Y
        displayCoord = {
            x: landmark3D.x,
            y: -landmark3D.y
        };
    } else if (analysisMode === '2D') {
        // 2D mode: convert to meters using calibration
        const pixelX = landmark2D.x * canvasWidth;
        const pixelY = (1 - landmark2D.y) * canvasHeight;

        const p1x = calibrationPoint1.x * canvasWidth;
        const p1y = calibrationPoint1.y * canvasHeight;
        const p2x = calibrationPoint2.x * canvasWidth;
        const p2y = calibrationPoint2.y * canvasHeight;
        const calibDistance = Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));

        const pixelsPerMeter = calibDistance / calibrationScale;

        displayCoord = {
            x: pixelX / pixelsPerMeter,
            y: pixelY / pixelsPerMeter
        };
    }

    return displayCoord;
}

// Draw velocity vectors for Total Body COM
function drawVelocityVectors(context, width, height, velocityX, velocityY, totalBodyCOM, fontSize) {
    if (!totalBodyCOM || totalBodyCOM.visibility < 0.3) {
        return;
    }

    // Get COM position in pixels
    const comX = totalBodyCOM.x * width;
    const comY = totalBodyCOM.y * height;

    // Calculate resultant velocity
    const resultantVelocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

    // Don't draw if velocity is essentially zero
    if (resultantVelocity < 0.001) {
        return;
    }

    // Scale factor for vector visualization
    const vectorScale = 56.25; // pixels per m/s

    // Calculate resultant vector end point
    // velocityX is positive to the right, velocityY is positive upward (but canvas Y is inverted)
    const endX = comX + (velocityX * vectorScale);
    const endY = comY - (velocityY * vectorScale); // Subtract because canvas Y is inverted

    const arrowSize = 12;

    // Draw resultant velocity vector (red)
    context.strokeStyle = '#FF0000';
    context.lineWidth = 8;
    context.beginPath();
    context.moveTo(comX, comY);
    context.lineTo(endX, endY);
    context.stroke();

    // Draw arrowhead for resultant vector
    const angle = Math.atan2(comY - endY, endX - comX); // Note: Y is inverted
    context.fillStyle = '#FF0000';
    context.beginPath();
    context.moveTo(endX, endY);
    context.lineTo(endX - arrowSize * Math.cos(angle - Math.PI/6), endY + arrowSize * Math.sin(angle - Math.PI/6));
    context.lineTo(endX - arrowSize * Math.cos(angle + Math.PI/6), endY + arrowSize * Math.sin(angle + Math.PI/6));
    context.closePath();
    context.fill();

    // Draw velocity text near the arrow tip
    context.font = `bold ${fontSize}px Arial`;
    const velocityText = `Vx: ${velocityX.toFixed(2)} m/s, Vy: ${velocityY.toFixed(2)} m/s`;
    const textWidth = context.measureText(velocityText).width;

    // Position text near arrow tip
    const textX = endX + 10;
    const textY = endY - 10;

    // Background for text
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(textX - 4, textY - fontSize, textWidth + 8, fontSize + 8);

    // Draw text (white)
    context.fillStyle = '#FFFFFF';
    context.fillText(velocityText, textX, textY);
}

// Clear the canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw calibration points in 2D mode
    if (analysisModeVideo === '2D') {
        drawCalibrationPoints(ctx, canvas.width, canvas.height, calibrationPoint1Video, calibrationPoint2Video, calibrationScaleVideo);
    }

    // Render completed drawings even when canvas is cleared
    const currentFrame = Math.floor(video.currentTime * fps);
    renderCompletedDrawings(canvas, false, currentFrame);
}

// Save pose data for export
function savePoseData(landmarks2D, landmarks3D, manuallyEdited = false) {
    const currentTime = video.currentTime;
    const currentFrame = Math.floor(currentTime * fps);

    // Check if we already have data for this frame
    const existingIndex = poseDataArray.findIndex(d => d.frame === currentFrame);

    const frameData = {
        frame: currentFrame,
        timestamp: currentTime,
        manuallyEdited: manuallyEdited, // Flag to indicate if this frame has manual edits
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
        // Preserve the manuallyEdited flag if it was already set to true
        if (poseDataArray[existingIndex].manuallyEdited) {
            frameData.manuallyEdited = true;
        }
        poseDataArray[existingIndex] = frameData;
    } else {
        poseDataArray.push(frameData);
        poseDataArray.sort((a, b) => a.frame - b.frame);
    }

    // Update UI
    document.getElementById('capturedFrames').textContent = poseDataArray.length;
}

// Helper function to calculate all extended landmarks (including COM) with display coordinates
function calculateExtendedLandmarksForExport(landmarks2D, landmarks3D, sex, analysisMode, calibrationPoint1, calibrationPoint2, calibrationScale, canvasWidth, canvasHeight) {
    // Step 1: Fill missing landmarks with mirroring
    const { filled2D, filled3D } = fillMissingLandmarksWithMirrors(landmarks2D, landmarks3D);

    // Step 2: Calculate midpoints
    const { midpoints2D, midpoints3D } = calculateMidpoints(filled2D, filled3D);

    // Step 3: Extend landmarks array with midpoints
    const extendedLandmarks2D = [...filled2D];
    const extendedLandmarks3D = filled3D ? [...filled3D] : [];
    if (midpoints2D[33]) extendedLandmarks2D[33] = midpoints2D[33];
    if (midpoints2D[34]) extendedLandmarks2D[34] = midpoints2D[34];
    if (midpoints3D[33]) extendedLandmarks3D[33] = midpoints3D[33];
    if (midpoints3D[34]) extendedLandmarks3D[34] = midpoints3D[34];

    // Step 4: Calculate segment COMs
    const { segmentCOMs2D, segmentCOMs3D } = calculateSegmentCOMs(extendedLandmarks2D, extendedLandmarks3D, sex);

    // Add segment COMs to extended landmarks (indices 35-48)
    for (let i = 35; i <= 48; i++) {
        if (segmentCOMs2D[i]) extendedLandmarks2D[i] = segmentCOMs2D[i];
        if (segmentCOMs3D[i]) extendedLandmarks3D[i] = segmentCOMs3D[i];
    }

    // Step 5: Calculate total body COM
    const { totalBodyCOM2D, totalBodyCOM3D } = calculateTotalBodyCOM(segmentCOMs2D, segmentCOMs3D, sex);

    // Add total body COM to extended landmarks (index 49)
    if (totalBodyCOM2D) extendedLandmarks2D[49] = totalBodyCOM2D;
    if (totalBodyCOM3D) extendedLandmarks3D[49] = totalBodyCOM3D;

    // Step 6: Calculate display coordinates for all extended landmarks
    const displayCoords = [];

    extendedLandmarks2D.forEach((landmark, index) => {
        if (!landmark) {
            displayCoords.push(null);
            return;
        }

        let displayCoord = { x: 0, y: 0 };

        if (analysisMode === '3D' && extendedLandmarks3D && extendedLandmarks3D[index]) {
            // 3D mode: use 3D world coordinates with negated Y
            const lm3d = extendedLandmarks3D[index];
            displayCoord = {
                x: parseFloat(lm3d.x.toFixed(6)),
                y: parseFloat((-lm3d.y).toFixed(6)),
                z: parseFloat(lm3d.z.toFixed(6))
            };
        } else if (analysisMode === '2D') {
            // 2D mode: normalized by calibration distance
            const pixelX = landmark.x * canvasWidth;
            const pixelY = (1 - landmark.y) * canvasHeight; // Transform Y to make positive direction upward

            // Calculate calibration distance in pixels
            const p1x = calibrationPoint1.x * canvasWidth;
            const p1y = calibrationPoint1.y * canvasHeight;
            const p2x = calibrationPoint2.x * canvasWidth;
            const p2y = calibrationPoint2.y * canvasHeight;
            const calibDistance = Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));

            // Calculate scale factor (pixels per meter)
            const pixelsPerMeter = calibDistance / calibrationScale;

            // Normalize by pixels per meter to get meters
            displayCoord = {
                x: parseFloat((pixelX / pixelsPerMeter).toFixed(6)),
                y: parseFloat((pixelY / pixelsPerMeter).toFixed(6))
            };
        }

        displayCoords.push(displayCoord);
    });

    return {
        extendedLandmarks2D,
        extendedLandmarks3D,
        displayCoords
    };
}

// Helper function to calculate display coordinates (as shown on video/figure)
function calculateDisplayCoordinates(landmarks2D, landmarks3D, analysisMode, calibrationPoint1, calibrationPoint2, canvasWidth, canvasHeight) {
    const displayCoords = [];

    landmarks2D.forEach((landmark, index) => {
        let displayCoord = { x: 0, y: 0 };

        if (analysisMode === '3D' && landmarks3D && landmarks3D[index]) {
            // 3D mode: use 3D world coordinates with negated Y
            const lm3d = landmarks3D[index];
            displayCoord = {
                x: parseFloat(lm3d.x.toFixed(6)),
                y: parseFloat((-lm3d.y).toFixed(6)),
                z: parseFloat(lm3d.z.toFixed(6))
            };
        } else if (analysisMode === '2D') {
            // 2D mode: normalized by calibration distance
            const pixelX = landmark.x * canvasWidth;
            const pixelY = (1 - landmark.y) * canvasHeight; // Transform Y to make positive direction upward

            // Calculate calibration distance in pixels
            const p1x = calibrationPoint1.x * canvasWidth;
            const p1y = calibrationPoint1.y * canvasHeight;
            const p2x = calibrationPoint2.x * canvasWidth;
            const p2y = calibrationPoint2.y * canvasHeight;
            const calibDistance = Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));

            // Normalize by calibration distance
            displayCoord = {
                x: parseFloat((pixelX / calibDistance).toFixed(6)),
                y: parseFloat((pixelY / calibDistance).toFixed(6))
            };
        }

        displayCoords.push(displayCoord);
    });

    return displayCoords;
}

// Export as JSON
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
            ['Analysis Mode', analysisModeVideo],
            ['Sex', sexSelectionVideo],
            ['Calibration Scale (m)', calibrationScaleVideo],
            ['Export Date', new Date().toISOString()]
        ]);
        XLSX.utils.book_append_sheet(wb, metadataSheet, 'Metadata');
        console.log('Metadata sheet created');

        // Create header based on analysis mode
        const header = ['Frame', 'Timestamp'];
        LANDMARK_NAMES.forEach((name, index) => {
            // Skip excluded landmarks
            if (EXCLUDED_LANDMARKS.includes(index)) {
                return;
            }
            if (analysisModeVideo === '2D') {
                header.push(`${name}_X`, `${name}_Y`);
            } else {
                header.push(`${name}_X`, `${name}_Y`, `${name}_Z`);
            }
        });
        const dataRows = [header];

        // Process each frame
        poseDataArray.forEach(frameData => {
            // Calculate extended landmarks (with mirroring, midpoints, COMs) and display coordinates
            const { extendedLandmarks2D, extendedLandmarks3D, displayCoords } = calculateExtendedLandmarksForExport(
                frameData.landmarks2D,
                frameData.landmarks3D,
                sexSelectionVideo,
                analysisModeVideo,
                calibrationPoint1Video,
                calibrationPoint2Video,
                calibrationScaleVideo,
                video.videoWidth,
                video.videoHeight
            );

            // Create row with frame and timestamp
            const row = [
                frameData.frame,
                parseFloat(frameData.timestamp.toFixed(3))
            ];

            // Add coordinates based on analysis mode
            if (analysisModeVideo === '2D') {
                extendedLandmarks2D.forEach((landmark, index) => {
                    // Skip excluded landmarks
                    if (EXCLUDED_LANDMARKS.includes(index)) {
                        return;
                    }

                    const displayCoord = displayCoords[index];

                    if (landmark && landmark.visibility >= 0.3 && displayCoord) {
                        row.push(
                            parseFloat(displayCoord.x.toFixed(6)),
                            parseFloat(displayCoord.y.toFixed(6))
                        );
                    } else {
                        row.push('', '');
                    }
                });
            } else {
                // 3D mode
                extendedLandmarks3D.forEach((landmark, index) => {
                    // Skip excluded landmarks
                    if (EXCLUDED_LANDMARKS.includes(index)) {
                        return;
                    }

                    const displayCoord = displayCoords[index];

                    if (landmark && displayCoord && displayCoord.z !== undefined) {
                        row.push(
                            parseFloat(displayCoord.x.toFixed(6)),
                            parseFloat(displayCoord.y.toFixed(6)),
                            parseFloat(displayCoord.z.toFixed(6))
                        );
                    } else {
                        row.push('', '', '');
                    }
                });
            }

            dataRows.push(row);
        });

        // Create and append sheet
        const sheetName = analysisModeVideo === '2D' ? 'Data' : 'Data';
        const sheet = XLSX.utils.aoa_to_sheet(dataRows);
        XLSX.utils.book_append_sheet(wb, sheet, sheetName);
        console.log(`${analysisModeVideo} data sheet created with`, dataRows.length - 1, 'frames');

        // Download the file with appropriate filename
        const filename = analysisModeVideo === '2D' ? `${originalVideoFileName}_2D.xlsx` : `${originalVideoFileName}_3D.xlsx`;
        console.log('Attempting to write Excel file...');
        XLSX.writeFile(wb, filename);
        console.log(`Successfully exported ${poseDataArray.length} frames to ${filename}`);
        alert(`Excel file downloaded successfully!\n${analysisModeVideo} data with ${poseDataArray.length} frames and all 50 landmarks including COM`);

    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert(`Error creating Excel file: ${error.message}\n\nCheck console for details.`);
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

// ===== DRAWING TOOL FUNCTIONS =====

function renderCompletedDrawings(canvas, isImageMode, currentFrame) {
    const ctx = canvas.getContext('2d');
    const calibrationScale = isImageMode ? calibrationScaleImage : calibrationScaleVideo;
    const fontSize = isImageMode ? parseInt(fontSizeSlider.value) || 28 : parseInt(fontSizeSliderVideo.value) || 28;

    completedDrawings.forEach(drawing => {
        // Skip if drawing is for different mode or frame
        if (drawing.isImageMode !== isImageMode) return;
        if (!isImageMode && drawing.frame !== currentFrame) return;

        if (drawing.type === 'line' && drawing.points.length === 2) {
            // Calculate calibration
            const point1 = isImageMode ? calibrationPoint1Image : calibrationPoint1Video;
            const point2 = isImageMode ? calibrationPoint2Image : calibrationPoint2Video;
            const p1x = point1.x * canvas.width;
            const p1y = point1.y * canvas.height;
            const p2x = point2.x * canvas.width;
            const p2y = point2.y * canvas.height;
            const calibrationPixelDistance = Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));
            const pixelsPerMeter = calibrationPixelDistance / calibrationScale;

            // Calculate distance
            const dx = drawing.points[1].x - drawing.points[0].x;
            const dy = drawing.points[1].y - drawing.points[0].y;
            const distancePixels = Math.sqrt(dx * dx + dy * dy);
            const distanceMeters = distancePixels / pixelsPerMeter;

            // Draw line
            ctx.save();
            ctx.strokeStyle = '#89CFF0'; // Baby blue
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
            ctx.lineTo(drawing.points[1].x, drawing.points[1].y);
            ctx.stroke();

            // Draw endpoints
            ctx.fillStyle = '#89CFF0'; // Baby blue
            drawing.points.forEach(pt => {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
                ctx.fill();
            });

            // Draw label
            const midX = (drawing.points[0].x + drawing.points[1].x) / 2;
            const midY = (drawing.points[0].y + drawing.points[1].y) / 2;
            const text = `${distanceMeters.toFixed(3)} m`;
            ctx.font = `bold ${fontSize}px Arial`;
            const textWidth = ctx.measureText(text).width;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(midX - textWidth / 2 - 5, midY - fontSize / 2 - 5, textWidth + 10, fontSize + 10);
            ctx.fillStyle = '#89CFF0'; // Baby blue
            ctx.fillText(text, midX - textWidth / 2, midY + fontSize / 3);
            ctx.restore();
        } else if (drawing.type === 'angle' && drawing.points.length === 3) {
            const vertex = drawing.points[1];
            const pt1 = drawing.points[0];
            const pt2 = drawing.points[2];

            // Calculate angle
            const v1x = pt1.x - vertex.x;
            const v1y = pt1.y - vertex.y;
            const v2x = pt2.x - vertex.x;
            const v2y = pt2.y - vertex.y;
            const angle1 = Math.atan2(v1y, v1x);
            const angle2 = Math.atan2(v2y, v2x);
            let angleDiff = angle2 - angle1;
            if (angleDiff < 0) angleDiff += 2 * Math.PI;
            const angleDegrees = angleDiff * (180 / Math.PI);

            // Draw lines
            ctx.save();
            ctx.strokeStyle = '#FF00FF';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(vertex.x, vertex.y);
            ctx.lineTo(pt1.x, pt1.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(vertex.x, vertex.y);
            ctx.lineTo(pt2.x, pt2.y);
            ctx.stroke();

            // Draw points
            ctx.fillStyle = '#FF00FF';
            drawing.points.forEach(pt => {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
                ctx.fill();
            });

            // Draw arc
            const arcRadius = 50;
            ctx.strokeStyle = '#FF00FF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(vertex.x, vertex.y, arcRadius, angle1, angle2);
            ctx.stroke();

            // Draw label
            const labelAngle = (angle1 + angle2) / 2;
            const labelX = vertex.x + Math.cos(labelAngle) * (arcRadius + 20);
            const labelY = vertex.y + Math.sin(labelAngle) * (arcRadius + 20);
            const text = `${angleDegrees.toFixed(1)}°`;
            ctx.font = `bold ${fontSize}px Arial`;
            const textWidth = ctx.measureText(text).width;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(labelX - textWidth / 2 - 5, labelY - fontSize / 2 - 5, textWidth + 10, fontSize + 10);
            ctx.fillStyle = '#FF00FF';
            ctx.fillText(text, labelX - textWidth / 2, labelY + fontSize / 3);
            ctx.restore();
        }
    });
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

    console.log('handleMouseDown called - isEditMode:', isEditMode, 'isEditModeCalibration:', isEditModeCalibration, 'isDrawLineMode:', isDrawLineMode, 'isDrawAngleMode:', isDrawAngleMode);

    // MODE 1: Draw Line Mode
    if (isDrawLineMode) {
        // Only allow drawing lines in 2D mode
        if (analysisMode !== '2D') {
            console.log('Line drawing is only available in 2D mode');
            return;
        }

        const currentFrame = isImageMode ? -1 : Math.floor(video.currentTime * fps);
        drawingPoints.push({ x: mouseX, y: mouseY });

        if (drawingPoints.length === 2) {
            // Complete line drawing
            completedDrawings.push({
                type: 'line',
                points: [...drawingPoints],
                frame: currentFrame,
                isImageMode: isImageMode
            });
            drawingPoints = [];

            // Trigger redraw (keep mode active for more drawings)
            if (isImageMode) {
                redrawImagePose();
            } else {
                redrawCurrentFrame();
            }
            console.log('Line drawing completed - ready for next line');
        } else {
            // Draw temporary marker
            const ctx = targetCanvas.getContext('2d');
            ctx.fillStyle = '#89CFF0'; // Baby blue
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, 5, 0, 2 * Math.PI);
            ctx.fill();
            console.log(`Point ${drawingPoints.length} recorded for line`);
        }
        return; // Exit - only handle drawing mode
    }

    // MODE 2: Draw Angle Mode
    else if (isDrawAngleMode) {
        const currentFrame = isImageMode ? -1 : Math.floor(video.currentTime * fps);
        drawingPoints.push({ x: mouseX, y: mouseY });

        if (drawingPoints.length === 3) {
            // Complete angle drawing
            completedDrawings.push({
                type: 'angle',
                points: [...drawingPoints],
                frame: currentFrame,
                isImageMode: isImageMode
            });
            drawingPoints = [];

            // Trigger redraw (keep mode active for more drawings)
            if (isImageMode) {
                redrawImagePose();
            } else {
                redrawCurrentFrame();
            }
            console.log('Angle drawing completed - ready for next angle');
        } else {
            // Draw temporary marker
            const ctx = targetCanvas.getContext('2d');
            ctx.fillStyle = '#FF00FF';
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, 5, 0, 2 * Math.PI);
            ctx.fill();
            console.log(`Point ${drawingPoints.length} recorded for angle`);
        }
        return; // Exit - only handle drawing mode
    }

    // MODE 3: Edit Calibration Points Mode
    else if (analysisMode === '2D' && isEditModeCalibration) {
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
        } else if (dist2 < CLICK_THRESHOLD) {
            isDragging = true;
            draggedCalibrationPoint = 'point2';
            targetCanvas.style.cursor = 'move';
            console.log('Started dragging calibration point 2');
        }
        return; // Exit - only handle calibration mode
    }

    // MODE 4: Edit Joint Positions Mode
    else if (isEditMode) {
        console.log('Checking for joints to drag...');

        // Use filled landmarks (with mirroring) for click detection
        const filledLandmarks = isImageMode ? lastFilledLandmarks2DImage : lastFilledLandmarks2DVideo;

        if (!filledLandmarks) {
            console.log('No filled landmarks available for editing');
            return;
        }
        console.log('Filled landmarks found:', filledLandmarks.length);

        // Find the closest joint within 20 pixels
        const CLICK_THRESHOLD = 20;
        let closestJoint = null;
        let closestDistance = CLICK_THRESHOLD;

        filledLandmarks.forEach((landmark, index) => {
            // Skip excluded landmarks (nose and eyes)
            if (EXCLUDED_LANDMARKS.includes(index)) {
                return;
            }

            // Check all landmarks including mirrored ones (visibility > 0 instead of > 0.3)
            if (landmark && landmark.visibility > 0) {
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
        } else {
            console.log('No joint found within click threshold');
        }
        return; // Exit - only handle edit mode
    }

    // MODE 5: No mode active - do nothing
    else {
        console.log('No edit/draw mode active - click ignored');
        return;
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
            } else if (analysisModeVideo === '2D') {
                // Draw calibration points even when no pose data
                drawCalibrationPoints(ctx, canvas.width, canvas.height, calibrationPoint1Video, calibrationPoint2Video, calibrationScaleVideo);
            }
        }
        return;
    }

    // Handle pose landmark dragging
    if (draggedJointIndex === null) return;

    if (isImageMode && imagePoseData) {
        // Update image pose data
        let landmark2D = imagePoseData.landmarks2D[draggedJointIndex];
        let landmark3D = imagePoseData.landmarks3D[draggedJointIndex];

        // If landmark doesn't exist or has low visibility (was mirrored), create a new one
        if (!landmark2D || landmark2D.visibility < 0.3) {
            landmark2D = {
                x: clampedX,
                y: clampedY,
                z: lastFilledLandmarks2DImage[draggedJointIndex]?.z || 0,
                visibility: 1.0 // Mark as fully visible (user-edited)
            };
            imagePoseData.landmarks2D[draggedJointIndex] = landmark2D;

            // Create 3D landmark if it doesn't exist
            if (imagePoseData.landmarks3D) {
                landmark3D = {
                    x: 0,
                    y: 0,
                    z: 0,
                    visibility: 1.0
                };
                imagePoseData.landmarks3D[draggedJointIndex] = landmark3D;
            }
        } else {
            // Calculate the delta in normalized coordinates
            const deltaX = clampedX - landmark2D.x;
            const deltaY = clampedY - landmark2D.y;

            // Update 2D position
            landmark2D.x = clampedX;
            landmark2D.y = clampedY;
            landmark2D.visibility = 1.0; // Mark as user-edited

            // Update 3D position (scale proportionally, keep Z the same)
            if (landmark3D) {
                // Estimate the change in world coordinates based on 2D movement
                // This is approximate - we're scaling by typical human body dimensions
                const SCALE_FACTOR = 2.0; // Approximate scaling from normalized to meters
                landmark3D.x += deltaX * SCALE_FACTOR;
                landmark3D.y -= deltaY * SCALE_FACTOR; // Negative because Y is flipped in display
            }
        }

        redrawImagePose();
    } else if (!isImageMode) {
        // Update video pose data for current frame
        const currentFrame = Math.floor(video.currentTime * fps);
        const frameData = poseDataArray.find(d => d.frame === currentFrame);

        if (frameData) {
            let landmark2D = frameData.landmarks2D[draggedJointIndex];
            let landmark3D = frameData.landmarks3D[draggedJointIndex];

            // If landmark doesn't exist or has low visibility (was mirrored), create a new one
            if (!landmark2D || landmark2D.visibility < 0.3) {
                landmark2D = {
                    x: clampedX,
                    y: clampedY,
                    z: lastFilledLandmarks2DVideo[draggedJointIndex]?.z || 0,
                    visibility: 1.0 // Mark as fully visible (user-edited)
                };
                frameData.landmarks2D[draggedJointIndex] = landmark2D;

                // Create 3D landmark if it doesn't exist
                if (frameData.landmarks3D) {
                    landmark3D = {
                        x: 0,
                        y: 0,
                        z: 0,
                        visibility: 1.0
                    };
                    frameData.landmarks3D[draggedJointIndex] = landmark3D;
                }
            } else {
                const deltaX = clampedX - landmark2D.x;
                const deltaY = clampedY - landmark2D.y;

                landmark2D.x = clampedX;
                landmark2D.y = clampedY;
                landmark2D.visibility = 1.0; // Mark as user-edited

                if (landmark3D) {
                    const SCALE_FACTOR = 2.0;
                    landmark3D.x += deltaX * SCALE_FACTOR;
                    landmark3D.y -= deltaY * SCALE_FACTOR;
                }
            }

            // Mark this frame as manually edited
            frameData.manuallyEdited = true;

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
    // Don't process if we're loading new media
    if (isLoadingNewMedia) {
        console.log('Skipping image processing - loading new media');
        return;
    }

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

    // Count displayed joints: 50 total - 13 excluded = 37 displayed
    const displayedJointCount = LANDMARK_NAMES.length - EXCLUDED_LANDMARKS.length;
    document.getElementById('jointCountImage').textContent = displayedJointCount;

    // Draw pose on image
    redrawImagePose();
}

// Redraw pose overlay on image
function redrawImagePose() {
    // Clear canvas
    imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);

    // Draw calibration points in 2D mode (always visible)
    if (analysisModeImage === '2D') {
        const fullSizeImageCheckbox = document.getElementById('fullSizeImage');
        const effectiveFontSize = fullSizeImageCheckbox && fullSizeImageCheckbox.checked ? displayFontSize * 2 : displayFontSize;
        drawCalibrationPoints(imageCtx, imageCanvas.width, imageCanvas.height, calibrationPoint1Image, calibrationPoint2Image, calibrationScaleImage, effectiveFontSize);
    }

    // Draw coordinate system if enabled (even without pose data)
    if (showCoordinateSystemImage) {
        const midHip = imagePoseData && imagePoseData.landmarks2D ? imagePoseData.landmarks2D[34] : null;
        drawCoordinateSystem(imageCtx, imageCanvas.width, imageCanvas.height, analysisModeImage, calibrationPoint1Image, calibrationPoint2Image, midHip);
    }

    // Draw pose if available and enabled
    if (!imagePoseData) {
        // Still render completed drawings even without pose data
        renderCompletedDrawings(imageCanvas, true, -1);
        return;
    }
    if (!showPoseImage) {
        // Still render completed drawings even when pose is hidden
        renderCompletedDrawings(imageCanvas, true, -1);
        return;
    }

    // Draw pose
    drawImagePose(imagePoseData.landmarks2D, imagePoseData.landmarks3D);
}

// Draw pose skeleton and landmarks on image
function drawImagePose(landmarks, landmarks3D) {
    const width = imageCanvas.width;
    const height = imageCanvas.height;

    // Calculate effective font size (double if Full Size is checked)
    const fullSizeImageCheckbox = document.getElementById('fullSizeImage');
    const effectiveFontSize = fullSizeImageCheckbox && fullSizeImageCheckbox.checked ? displayFontSize * 2 : displayFontSize;

    // Fill missing landmarks with mirrored versions from opposite side
    const { filled2D, filled3D } = fillMissingLandmarksWithMirrors(landmarks, landmarks3D);

    // Store filled landmarks for edit mode click detection
    lastFilledLandmarks2DImage = filled2D;

    // Calculate midpoint landmarks
    const { midpoints2D, midpoints3D } = calculateMidpoints(filled2D, filled3D);

    // Extend landmarks array with midpoints
    const extendedLandmarks2D = [...filled2D];
    const extendedLandmarks3D = filled3D ? [...filled3D] : [];
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
        const start = filled2D[startIdx];
        const end = filled2D[endIdx];

        // Body side is always 'full' - show all connections
        if (!shouldDisplayConnection(startIdx, endIdx)) {
            return;
        }

        // Filter connections based on left/right side checkboxes
        const startName = LANDMARK_NAMES[startIdx];
        const endName = LANDMARK_NAMES[endIdx];
        const isLeftConnection = startName?.startsWith('Left_') || endName?.startsWith('Left_');
        const isRightConnection = startName?.startsWith('Right_') || endName?.startsWith('Right_');

        if (isLeftConnection && !showLeftSideImage) {
            return;
        }
        if (isRightConnection && !showRightSideImage) {
            return;
        }

        if (start && end && start.visibility > 0.3 && end.visibility > 0.3) {
            imageCtx.beginPath();
            imageCtx.moveTo(start.x * width, start.y * height);
            imageCtx.lineTo(end.x * width, end.y * height);
            imageCtx.stroke();
        }
    });

    // Draw connection between Mid-Shoulder (33) and Mid-Hip (34)
    if (extendedLandmarks2D[33] && extendedLandmarks2D[34]) {
        const midShoulder = extendedLandmarks2D[33];
        const midHip = extendedLandmarks2D[34];

        if (midShoulder.visibility > 0.3 && midHip.visibility > 0.3) {
            imageCtx.strokeStyle = '#00FF00';
            imageCtx.lineWidth = 4;
            imageCtx.beginPath();
            imageCtx.moveTo(midShoulder.x * width, midShoulder.y * height);
            imageCtx.lineTo(midHip.x * width, midHip.y * height);
            imageCtx.stroke();
        }
    }

    // Calculate base size relative to canvas resolution for better visibility
    const baseSize = Math.max(width, height) * 0.003; // Base size for regular joints (~3px for 1000px resolution)

    // Draw landmarks (joints) - including calculated midpoints
    extendedLandmarks2D.forEach((landmark, index) => {
        // Skip excluded landmarks (nose and eyes)
        if (EXCLUDED_LANDMARKS.includes(index)) {
            return;
        }

        // Determine landmark type
        const isMidpoint = index === 33 || index === 34;
        const isSegmentCOM = index >= 35 && index <= 48;
        const isTotalBodyCOM = index === 49;
        const isRegularJoint = !isMidpoint && !isSegmentCOM && !isTotalBodyCOM;

        // Filter based on Show Pose checkbox (only regular joints)
        if (isRegularJoint && !showPoseImage) {
            return;
        }

        // Filter based on Show COM checkbox (segment COMs and total body COM)
        if ((isSegmentCOM || isTotalBodyCOM) && !showCOMImage) {
            return;
        }

        // Filter based on left/right side checkboxes
        const landmarkName = LANDMARK_NAMES[index];
        const isLeftSide = landmarkName?.startsWith('Left_');
        const isRightSide = landmarkName?.startsWith('Right_');

        if (isLeftSide && !showLeftSideImage) {
            return;
        }
        if (isRightSide && !showRightSideImage) {
            return;
        }

        // Body side is always 'full' - show all landmarks
        if (!shouldDisplayLandmark(index)) {
            return;
        }

        // Skip if landmark doesn't exist or has low visibility
        if (!landmark || landmark.visibility < 0.3) {
            return;
        }

        const x = landmark.x * width;
        const y = landmark.y * height;

        // Draw joint circle - highlight if being dragged
        const isBeingDragged = isDragging && draggedJointIndex === index;

        // Calculate sizes based on landmark type
        const regularJointSize = baseSize;
        const midpointSize = baseSize * 1.3;
        const segmentCOMSize = baseSize * 2; // 2x the size of regular joints
        const totalBodyCOMSize = baseSize * 4; // 4x the size of regular joints

        // Determine size and color based on landmark type
        let pointSize, pointColor;
        if (isTotalBodyCOM) {
            pointSize = totalBodyCOMSize;
            pointColor = '#FF0000'; // Red for Total Body COM
        } else if (isSegmentCOM) {
            pointSize = segmentCOMSize;
            pointColor = '#FFD700'; // Gold for segment COMs
        } else if (isMidpoint) {
            pointSize = midpointSize;
            pointColor = '#0000FF'; // Blue for midpoints
        } else {
            pointSize = regularJointSize;
            pointColor = '#00FF00'; // Green for regular joints
        }

        // Override color if being dragged
        if (isBeingDragged) {
            pointColor = '#FF00FF'; // Magenta for dragged joint
        }

        // Draw the point
        imageCtx.fillStyle = pointColor;
        imageCtx.beginPath();
        imageCtx.arc(x, y, pointSize, 0, 2 * Math.PI);
        imageCtx.fill();

        // Add outer ring for Total Body COM
        if (isTotalBodyCOM && !isBeingDragged) {
            imageCtx.strokeStyle = '#FFFFFF';
            imageCtx.lineWidth = 2;
            imageCtx.beginPath();
            imageCtx.arc(x, y, pointSize, 0, 2 * Math.PI);
            imageCtx.stroke();
        }

        let textY = y - 10;

        // Draw joint name with coordinates (if enabled)
        if (showJointNumbersImage) {
            let jointName = getDisplayName(LANDMARK_NAMES[index]);

            // Append coordinates to name if showCoordinatesImage is enabled
            if (showCoordinatesImage) {
                let coordText = '';

                if (analysisModeImage === '3D' && extendedLandmarks3D && extendedLandmarks3D[index]) {
                    // 3D world coordinates (meters)
                    const lm3d = extendedLandmarks3D[index];
                    // Negate Y to make positive direction upward (conventional)
                    coordText = `(${lm3d.x.toFixed(3)}, ${(-lm3d.y).toFixed(3)}, ${lm3d.z.toFixed(3)})`;
                } else if (analysisModeImage === '2D') {
                    // 2D coordinates in meters, using calibration
                    const pixelX = landmark.x * width;
                    const pixelY = (1 - landmark.y) * height; // Transform Y to make positive direction upward

                    // Calculate calibration distance in pixels
                    const p1x = calibrationPoint1Image.x * width;
                    const p1y = calibrationPoint1Image.y * height;
                    const p2x = calibrationPoint2Image.x * width;
                    const p2y = calibrationPoint2Image.y * height;
                    const calibDistance = Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));

                    // Convert to meters: (pixels / calibration pixels) * calibration scale
                    const metersX = (pixelX / calibDistance) * calibrationScaleImage;
                    const metersY = (pixelY / calibDistance) * calibrationScaleImage;

                    coordText = `(${metersX.toFixed(3)}, ${metersY.toFixed(3)})`;
                }

                if (coordText) {
                    jointName += ` ${coordText}`;
                }
            }

            imageCtx.fillStyle = '#FFFFFF';
            imageCtx.strokeStyle = '#000000';
            imageCtx.lineWidth = 3;
            imageCtx.font = `bold ${effectiveFontSize}px Arial`;
            imageCtx.strokeText(jointName, x + 10, textY);
            imageCtx.fillText(jointName, x + 10, textY);
        }
    });

    // Draw calibration points in 2D mode
    if (analysisModeImage === '2D') {
        drawCalibrationPoints(imageCtx, imageCanvas.width, imageCanvas.height, calibrationPoint1Image, calibrationPoint2Image, calibrationScaleImage, effectiveFontSize);
    }

    // Draw coordinate system if enabled
    if (showCoordinateSystemImage) {
        // Pass mid-hip landmark for 3D mode origin
        const midHip = extendedLandmarks2D[34];
        drawCoordinateSystem(imageCtx, imageCanvas.width, imageCanvas.height, analysisModeImage, calibrationPoint1Image, calibrationPoint2Image, midHip);
    }

    // Render completed drawings
    renderCompletedDrawings(imageCanvas, true, -1);
}

// Export image pose data as JSON
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
            ['Analysis Mode', analysisModeImage],
            ['Sex', sexSelectionImage],
            ['Calibration Scale (m)', calibrationScaleImage],
            ['Export Date', new Date().toISOString()]
        ]);
        XLSX.utils.book_append_sheet(wb, metadataSheet, 'Metadata');
        console.log('Metadata sheet created');

        // Calculate extended landmarks (with mirroring, midpoints, COMs) and display coordinates
        const { extendedLandmarks2D, extendedLandmarks3D, displayCoords } = calculateExtendedLandmarksForExport(
            imagePoseData.landmarks2D,
            imagePoseData.landmarks3D,
            sexSelectionImage,
            analysisModeImage,
            calibrationPoint1Image,
            calibrationPoint2Image,
            calibrationScaleImage,
            imageDisplay.naturalWidth,
            imageDisplay.naturalHeight
        );

        // Create header based on analysis mode
        const header = ['Joint_Index', 'Joint_Name'];
        if (analysisModeImage === '2D') {
            header.push('X', 'Y', 'Visibility');
        } else {
            header.push('X', 'Y', 'Z', 'Visibility');
        }

        const data = [header];

        // Add data based on analysis mode
        if (analysisModeImage === '2D') {
            // Export 2D coordinates only
            extendedLandmarks2D.forEach((landmark, index) => {
                // Skip excluded landmarks
                if (EXCLUDED_LANDMARKS.includes(index)) {
                    return;
                }

                const displayCoord = displayCoords[index];

                if (landmark && landmark.visibility >= 0.3 && displayCoord) {
                    data.push([
                        index,
                        LANDMARK_NAMES[index],
                        parseFloat(displayCoord.x.toFixed(6)),
                        parseFloat(displayCoord.y.toFixed(6)),
                        parseFloat(landmark.visibility.toFixed(3))
                    ]);
                }
            });
        } else {
            // Export 3D coordinates only
            extendedLandmarks3D.forEach((landmark, index) => {
                // Skip excluded landmarks
                if (EXCLUDED_LANDMARKS.includes(index)) {
                    return;
                }

                const displayCoord = displayCoords[index];

                if (landmark && displayCoord && displayCoord.z !== undefined) {
                    data.push([
                        index,
                        LANDMARK_NAMES[index],
                        parseFloat(displayCoord.x.toFixed(6)),
                        parseFloat(displayCoord.y.toFixed(6)),
                        parseFloat(displayCoord.z.toFixed(6)),
                        parseFloat(landmark.visibility.toFixed(3))
                    ]);
                }
            });
        }

        const dataSheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, dataSheet, 'Data');
        console.log(`${analysisModeImage} coordinates sheet created with`, data.length - 1, 'landmarks');

        // Download the file with mode-specific filename
        const filename = analysisModeImage === '2D' ? `${originalImageFileName}_2D.xlsx` : `${originalImageFileName}_3D.xlsx`;
        console.log('Attempting to write Excel file:', filename);
        XLSX.writeFile(wb, filename);
        console.log(`Successfully exported image pose data to ${filename}`);
        alert(`Image pose data exported successfully with all 50 landmarks including COM!\nFile: ${filename}`);

    } catch (error) {
        console.error('Error exporting image to Excel:', error);
        alert(`Error creating Excel file: ${error.message}\n\nCheck console for details.`);
    }
}

// Export current video frame as screenshot with overlay
function exportFrameScreenshot() {
    if (!video || !video.videoWidth) {
        alert('No video frame available to export');
        return;
    }

    try {
        // Create a temporary canvas to combine video and overlay
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');

        // Draw the current video frame
        tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

        // Draw the pose overlay on top
        tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

        // Convert to blob and download
        tempCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${originalVideoFileName}_frame_overlay.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');

        console.log('Frame with overlay exported successfully');
    } catch (error) {
        console.error('Error exporting frame screenshot:', error);
        alert(`Error exporting frame: ${error.message}`);
    }
}

// Export current video frame as original without overlay
// Export video with overlay
async function exportVideoWithOverlay() {
    if (!video || !video.videoWidth || poseDataArray.length === 0) {
        alert('No video data available to export. Please process the video first.');
        return;
    }

    try {
        // Check if MediaRecorder is supported
        if (typeof MediaRecorder === 'undefined') {
            alert('Video recording is not supported in your browser. Please use Chrome, Firefox, or Edge.');
            return;
        }

        // Detect original video FPS (use detected fps or default to 30)
        const videoFPS = fps || 30;

        alert(`Video export started at ${videoFPS} fps. This may take a while depending on video length. Please wait...`);

        // Create a canvas to render frames
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = video.videoWidth;
        exportCanvas.height = video.videoHeight;
        const exportCtx = exportCanvas.getContext('2d');

        // Create a video stream from the canvas at original framerate
        const stream = exportCanvas.captureStream(videoFPS);
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 8000000 // 8 Mbps for better quality
        });

        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${originalVideoFileName}_overlay.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert(`Video export completed at ${videoFPS} fps!`);
        };

        // Start recording
        mediaRecorder.start();

        // Reset video to beginning
        video.currentTime = 0;
        await new Promise(resolve => {
            video.onseeked = resolve;
        });

        // Process each frame at original framerate
        const frameDuration = 1 / videoFPS;
        const videoEndTime = video.duration;
        let frameCount = 0;

        for (let time = 0; time < videoEndTime; time += frameDuration) {
            video.currentTime = time;
            await new Promise(resolve => {
                video.onseeked = resolve;
            });

            // Draw video frame
            exportCtx.drawImage(video, 0, 0, exportCanvas.width, exportCanvas.height);

            // Find pose data for this frame
            const frameIndex = Math.round(time * videoFPS);
            const frameData = poseDataArray.find(data => data.frame === frameIndex);

            if (frameData) {
                // Draw pose overlay
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = exportCanvas.width;
                tempCanvas.height = exportCanvas.height;
                const tempCtx = tempCanvas.getContext('2d');

                // Temporarily draw pose on temp canvas
                const oldCanvas = canvas;
                const oldCtx = ctx;
                canvas = tempCanvas;
                ctx = tempCtx;

                drawPose(frameData.landmarks2D, frameData.landmarks3D);

                canvas = oldCanvas;
                ctx = oldCtx;

                // Draw the overlay on export canvas
                exportCtx.drawImage(tempCanvas, 0, 0);
            }

            // Wait for next frame at original framerate
            await new Promise(resolve => setTimeout(resolve, 1000 / videoFPS));
            frameCount++;
        }

        console.log(`Exported ${frameCount} frames at ${videoFPS} fps`);

        // Stop recording
        mediaRecorder.stop();

    } catch (error) {
        console.error('Error exporting video with overlay:', error);
        alert(`Error exporting video: ${error.message}`);
    }
}

// Export image as screenshot with overlay
function exportImageScreenshot() {
    if (!imageDisplay || !imageDisplay.src) {
        alert('No image available to export');
        return;
    }

    try {
        // Create a temporary canvas to combine image and overlay
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageDisplay.naturalWidth;
        tempCanvas.height = imageDisplay.naturalHeight;
        const tempCtx = tempCanvas.getContext('2d');

        // Draw the image
        tempCtx.drawImage(imageDisplay, 0, 0, tempCanvas.width, tempCanvas.height);

        // Draw the pose overlay on top
        tempCtx.drawImage(imageCanvas, 0, 0, tempCanvas.width, tempCanvas.height);

        // Convert to blob and download
        tempCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${originalImageFileName}_overlay.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');

        console.log('Image with overlay exported successfully');
    } catch (error) {
        console.error('Error exporting image screenshot:', error);
        alert(`Error exporting image: ${error.message}`);
    }
}

// Export original image without overlay
