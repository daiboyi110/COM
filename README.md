# Center of Mass (COM) Visualization

**Author:** Boyi Dai
**Contact:** [daiboyi@gmail.com](mailto:daiboyi@gmail.com)
**Last Updated:** January 2026

A web-based application for analyzing human pose and calculating center of mass in videos and images using MediaPipe Pose estimation. Upload videos or images, visualize body landmarks, calculate segment and total-body center of mass, and export detailed biomechanical data.

## Features

- **Video & Image Analysis**: Process both video files and static images
- **MediaPipe Pose Estimation**: Automatic detection of 33 body landmarks using Google's MediaPipe Pose
- **2D & 3D Analysis Modes**: Choose between 2D pixel-based or 3D world coordinate analysis
- **Center of Mass Calculation**: Calculate segment COM and total-body COM with sex-specific models
- **Bilateral Symmetry Mirroring**: Automatically estimate missing landmarks using exact coordinates from opposite side (no noise added for accurate estimation)
- **Interactive Editing**: Manually adjust joint positions and calibration points
- **Coordinate System Visualization**: Display 2D or 3D coordinate axes with origin markers
- **Real-time Visual Overlay**: See detected skeleton, joints, and COM overlaid on video/image
- **Calibrated Measurements**: Scale 2D analysis to real-world units using calibration points
- **Data Export**: Export pose data to Excel, export images/frames with overlays, and export videos with overlays rendered on every frame
- **Full-Size Display**: View media at original resolution with doubled font size for better visibility

## Pose Estimation Technology

### MediaPipe Pose
This application uses **MediaPipe Pose** by Google for pose estimation:
- Detects **33 body landmarks** including face, torso, arms, and legs
- Provides both **2D normalized coordinates** (x, y) and **3D world coordinates** (x, y, z)
- Includes **visibility scores** for each landmark
- Works on both CPU and GPU for real-time performance

### Displayed Landmarks
The application displays **37 total markers**:
- **20 base landmarks**: Body landmarks including shoulders, elbows, wrists, hips, knees, ankles, heels, and foot indices
- **17 calculated markers**:
  - **2 midpoints**: Mid-shoulder and mid-hip
  - **14 segment centers of mass**: Upper arms (L/R), forearms (L/R), hands (L/R), thighs (L/R), shanks (L/R), feet (L/R), head, trunk
  - **1 total-body center of mass**: Weighted combination of all segments

**Note**: Face details (nose, eyes, mouth) and finger landmarks (pinky, thumb, index) are detected by MediaPipe but not displayed for cleaner visualization.

## Analysis Modes

### 2D Analysis
- **Coordinate System**: Origin at **left-bottom corner** of the image/video
  - **X-axis**: Points right (positive direction)
  - **Y-axis**: Points up (positive direction)
- **Units**: Normalized by calibration distance (meters)
  - Coordinates are calculated as: `(pixel distance) / (calibration distance in pixels) × (calibration scale in meters)`
  - Default calibration scale: 1.0 meter
- **Use Case**: Analyzing movement in a single plane (e.g., sagittal or frontal plane analysis)
- **Accuracy**: ✅ **Highly accurate** for X and Y coordinates when properly calibrated. 2D measurements are reliable for planar motion analysis as they are based on direct pixel-to-metric conversion using the calibration reference.

### 3D Analysis
- **Coordinate System**: Origin at **mid-hip** landmark
  - **X-axis**: Points right (positive direction)
  - **Y-axis**: Points up (positive direction)
  - **Z-axis**: Points forward toward camera (positive direction)
- **Units**: Meters (real-world coordinates provided by MediaPipe)
- **Use Case**: Full 3D spatial analysis with depth information
- **Accuracy**: ⚠️ **Limited accuracy** for X, Y, and Z coordinates. 3D depth estimation from a single camera (monocular vision) has inherent limitations and may not be suitable for precise quantitative analysis. For accurate measurements, use 2D analysis with proper calibration instead.

## Sex-Specific Center of Mass Models

The application uses different segment mass percentages and center of mass locations for males and females based on biomechanical research by de Leva (1996)[^1]:

### Male Model

**Segment Mass Percentages:**
- Head+Neck: 6.94% of total body mass
- Trunk: 43.46%
- Upper Arm: 2.71% (each)
- Forearm: 1.62% (each)
- Hand: 0.61% (each)
- Thigh: 14.16% (each)
- Shank: 4.33% (each)
- Foot: 1.37% (each)

**Segment COM Locations** (percentage from proximal to distal joint):
- Head+Neck: 50.00% from left ear to right ear
- Trunk: 43.10% from mid-shoulder to mid-hip
- Upper Arm: 57.72% from shoulder to elbow
- Forearm: 45.74% from elbow to wrist
- Hand: 79.00% from wrist to knuckle
- Thigh: 40.95% from hip to knee
- Shank: 44.59% from knee to ankle
- Foot: 44.15% from heel to toe

### Female Model

**Segment Mass Percentages:**
- Head+Neck: 6.68% of total body mass
- Trunk: 42.57%
- Upper Arm: 2.55% (each)
- Forearm: 1.38% (each)
- Hand: 0.56% (each)
- Thigh: 14.78% (each)
- Shank: 4.81% (each)
- Foot: 1.29% (each)

**Segment COM Locations** (percentage from proximal to distal joint):
- Head+Neck: 50.00% from left ear to right ear
- Trunk: 37.82% from mid-shoulder to mid-hip
- Upper Arm: 57.54% from shoulder to elbow
- Forearm: 45.59% from elbow to wrist
- Hand: 74.74% from wrist to knuckle
- Thigh: 36.12% from hip to knee
- Shank: 44.16% from knee to ankle
- Foot: 40.14% from heel to toe

**Total Body COM**: Calculated as weighted average of all 12 segment COMs based on their mass percentages.

## How to Use

### 1. Open the Application
Open `index.html` in a modern web browser (Chrome, Firefox, Edge, or Safari recommended)

### 2. Upload Media
- Click **"📹 Upload Video"** to select a video file (MP4, WebM, etc.)
- Click **"🖼️ Upload Image"** to select an image file (JPG, PNG, etc.)
- After loading, a red **"✕ Close Media"** button appears below the upload buttons
- Click this button to reload the page and start fresh with new media

**Tip**: For optimal performance when loading multiple videos or images sequentially, you can either:
- Click the **"✕ Close Media"** button to reload the page, or
- Press **Ctrl+F5** (Windows/Linux) or **Cmd+Shift+R** (Mac) to hard refresh the page

This clears the MediaPipe cache and ensures better pose detection accuracy.

### 3. Configure Analysis Settings

**Analysis Mode**:
- Select **2D** for planar analysis with calibrated units
- Select **3D** for spatial analysis with depth information

**Sex Selection**:
- Select **Male** or **Female** to use appropriate segment mass percentages for COM calculation

### 4. Display Options

**Show Pose**: Toggle skeleton and landmark visualization

**Names**: Display landmark names (abbreviated: R_Knee, L_Ankle, etc.)

**Coordinates**: Display coordinate values next to landmark names
- Format: `Landmark_Name (x, y)` for 2D or `Landmark_Name (x, y, z)` for 3D
- Coordinates appear inline with the landmark name

**Coordinate System**: Display coordinate axes showing origin and positive directions

**Full Size**: Display media at original resolution and double font size for better readability

**Font Size Slider**: Adjust base font size (12-60px) for all text labels

### 5. Calibration (2D Mode Only)

For accurate real-world measurements in 2D mode:

1. Check **"Edit Calibration Points"**
2. Two cyan points labeled "Calibration 1" and "Calibration 2" will appear
3. Drag these points to match a known distance in the image (e.g., a meter stick, door height)
4. Enter the real-world distance in the **"Calibration Scale (m)"** field
5. Uncheck "Edit Calibration Points" when done

All 2D coordinates will now be scaled to meters based on your calibration.

### 6. Edit Mode Features

The application provides four mutually exclusive edit/drawing modes (only one can be active at a time):

#### Edit Calibration
For accurate real-world measurements in 2D mode:

1. Check **"Edit Calibration"**
2. Two cyan points labeled "Calibration 1" and "Calibration 2" will appear
3. Drag these points to match a known distance in the image (e.g., a meter stick, door height)
4. Enter the real-world distance in the **"Calibration Scale (m)"** field
5. Uncheck "Edit Calibration" when done

All 2D coordinates will now be scaled to meters based on your calibration.

#### Edit Joints
If pose estimation is inaccurate, you can manually adjust landmarks:

1. Check **"Edit Joints"** to enable editing mode
2. Green dots will become draggable
3. Click and drag any green dot (joint) to reposition it
4. COM calculations will update automatically based on new positions
5. Uncheck "Edit Joints" when done

**Note**: Only joints with visibility > 0.3 can be edited. Edited positions persist until you reload the media.

#### Draw Line
Measure distances between any two points with calibrated measurements (2D mode only):

1. Check **"Draw Line"**
2. The cursor becomes a crosshair
3. Click two points on the image/video to draw a line
4. The line appears in **baby blue** with the calibrated distance (in meters) displayed at the midpoint
5. You can draw multiple lines while the mode is active
6. Click **"Clear Drawings"** to remove all drawings from the current frame

**Notes**:
- Only available in 2D analysis mode (checkbox hidden in 3D mode)
- For videos, drawings are frame-specific. Navigate to different frames to draw on multiple frames.
- Drawing tools work immediately after loading media, even before pose detection completes.

#### Draw Angle
Measure angles between any three points:

1. Check **"Draw Angle"**
2. The cursor becomes a crosshair
3. Click three points: first point → vertex (center) → third point
4. The angle appears in **magenta** with the angle measurement (in degrees) displayed
5. An arc shows the angle between the two lines
6. You can draw multiple angles while the mode is active
7. Click **"Clear Drawings"** to remove all drawings from the current frame

**Notes**:
- The second click defines the vertex (center point) of the angle.
- Drawing tools work immediately after loading media, even before pose detection completes.

#### Clear Drawings
- Removes all line and angle drawings from the current frame (video) or image
- Does not affect pose landmarks or COM markers
- Useful for starting fresh measurements on a frame

### 7. Video Playback Controls

- **▶ Play / ⏸ Pause**: Start/stop video playback
- **⏮ Previous Frame / ⏭ Next Frame**: Step through video frame-by-frame
- **Video Progress Bar**: Click or drag to jump to specific time

**Tip for Better Accuracy**: For optimal pose estimation accuracy, use the frame-by-frame navigation (⏮ Previous Frame / ⏭ Next Frame buttons) instead of playing the video continuously. This gives MediaPipe more processing time per frame and can result in more accurate landmark detection, especially for complex poses or fast movements.

### 8. Export Data

**Export Excel** (📗):
- Creates an XLSX file based on your selected analysis mode (2D or 3D)
- **2D Mode**: Exports only 2D coordinates (X, Y)
  - File name: `originalfilename_2D.xlsx`
  - Coordinates in calibrated meters with origin at left-bottom corner
- **3D Mode**: Exports only 3D coordinates (X, Y, Z)
  - File name: `originalfilename_3D.xlsx`
  - Coordinates in meters with origin at mid-hip
- Contains two sheets:
  - **Metadata**: Video/image info, analysis mode, sex selection, calibration scale
  - **Data**: All 37 displayed markers including calculated COMs
- Each row represents one frame (video) or the single frame (image)
- Columns: Joint_Index, Joint_Name, X, Y (and Z for 3D), Visibility
- **Includes edited coordinates**: Exported data reflects any manual joint position edits you made

**Export Frame/Image with Overlay** (📷):
- Captures current frame/image with all overlays (skeleton, landmarks, coordinates, COM, axes)
- File name: `originalfilename_overlay.png` (for single frame) or `originalfilename_frame_overlay.png` (for video frame)
- Saves as PNG file with visual overlays burned into the image
- Useful for presentations, reports, or documentation

**Export Video with Overlay** (🎬) - Video only:
- Exports the entire video with pose overlays rendered on every frame
- File name: `originalfilename_overlay.webm`
- Format: WebM video (VP9 codec, 8 Mbps)
- Maintains original video framerate (automatically detected)
- Processing time depends on video length and framerate
- Overlays include skeleton, landmarks, coordinates, COM markers as displayed

### 9. Video-Specific Features

**Clear Data** (🗑️): Removes all collected frame data and resets analysis

**Frame Counter**: Shows current frame / total frames

**Time Display**: Shows current playback time

**Frames w/ Data**: Shows how many frames have been processed

## Display Legend

The application uses color-coded circles to distinguish different point types:

- 🟢 **Green**: Regular joints (MediaPipe detected landmarks)
- 🟡 **Yellow**: Segment centers of mass (14 calculated points)
- 🔴 **Red**: Total-body center of mass (1 calculated point)

The legend appears at the bottom of both video and image analysis sections.

## Coordinate Systems Explained

### 2D Coordinate System
```
Y↑ (up)
│
│     ● Landmark (x, y)
│
└────────→ X (right)
(0,0) Left-bottom corner
```
- Origin: Left-bottom corner of image/video
- X increases to the right
- Y increases upward
- Units: Meters (scaled by calibration distance)

### 3D Coordinate System
```
      Y↑ (up)
      │
      │  ● Landmark (x, y, z)
      │ /
      │/
      ●─────→ X (right)
   Mid-hip  ↙
           Z (forward)
```
- Origin: Mid-hip landmark (index 34)
- X increases to the right
- Y increases upward (inverted from MediaPipe's original down direction)
- Z increases forward toward the camera
- Units: Meters (MediaPipe world coordinates)

## Excel Export Format

Excel files are exported with filenames based on the original file and analysis mode:
- **2D mode**: `originalfilename_2D.xlsx`
- **3D mode**: `originalfilename_3D.xlsx`

Each workbook contains two sheets:

### Sheet 1: Metadata
Contains analysis parameters:
- Video/Image dimensions
- Number of detected joints
- Analysis mode (2D or 3D)
- Sex selection (male or female)
- Calibration scale (meters)
- Export date/time

### Sheet 2: Data
Columns depend on analysis mode:

**2D Mode**:
- Columns: `Joint_Index | Joint_Name | X | Y | Visibility`
- Origin: Left-bottom corner
- Units: Meters (calibrated using calibration points)
- Each row = one joint
- Video exports: Multiple frames, each with all 37 displayed markers
- Image exports: Single frame with all 37 displayed markers

**3D Mode**:
- Columns: `Joint_Index | Joint_Name | X | Y | Z | Visibility`
- Origin: Mid-hip landmark
- Units: Meters (MediaPipe world coordinates)
- Y-axis: Positive = up (inverted from MediaPipe convention)
- Z-axis: Positive = forward toward camera
- Each row = one joint
- Video exports: Multiple frames, each with all 37 displayed markers
- Image exports: Single frame with all 37 displayed markers

**All 37 displayed markers are included**:
- 20 base body landmarks
- 2 calculated midpoints (Mid_Shoulder, Mid_Hip)
- 14 segment COMs
- 1 total-body COM

**Note**: Coordinates reflect any manual edits made using the "Edit Joint Positions" feature.

## Landmark Names

The application uses abbreviated names for compact display:
- **L_** prefix: Left side (e.g., L_Shoulder, L_Knee)
- **R_** prefix: Right side (e.g., R_Shoulder, R_Knee)
- Full name examples: Nose, L_Eye, R_Elbow, L_Wrist, R_Hip, L_Ankle, R_Foot

### Complete Landmark List (37 displayed markers)

**Body Landmarks (20)**: L_Shoulder, R_Shoulder, L_Elbow, R_Elbow, L_Wrist, R_Wrist, L_Hip, R_Hip, L_Knee, R_Knee, L_Ankle, R_Ankle, L_Heel, R_Heel, L_Foot_Index, R_Foot_Index, L_Ear, R_Ear, Mouth_Left, Mouth_Right

**Calculated Midpoints (2)**: Mid_Shoulder, Mid_Hip

**Segment COMs (14)**: L_Upper_Arm_COM, R_Upper_Arm_COM, L_Forearm_COM, R_Forearm_COM, L_Hand_COM, R_Hand_COM, L_Thigh_COM, R_Thigh_COM, L_Shank_COM, R_Shank_COM, L_Foot_COM, R_Foot_COM, Head_COM, Trunk_COM

**Total Body COM (1)**: Total_Body_COM

## Technical Details

- **Pose Estimation**: MediaPipe Pose v0.5+ (Google)
- **3D Coordinates**: World landmarks in meters from mid-hip center
- **2D Coordinates**: Calibrated to meters using reference distance
- **Displayed Markers**: 20 base landmarks + 17 calculated = 37 total markers per frame
- **Browser Compatibility**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Processing**: Client-side only (no data uploaded to servers)
- **Video Processing**: Maximum framerate (no throttling)
- **Visibility Threshold**: 0.3 (landmarks with visibility < 0.3 are hidden)

### MediaPipe Pose Configuration Parameters

The following MediaPipe Pose parameters are used in this application for optimal accuracy and performance:

```javascript
{
  modelComplexity: 1,              // Model: 0=lite, 1=full, 2=heavy (full model for balanced accuracy/performance)
  smoothLandmarks: true,            // Enable landmark smoothing to reduce jitter
  enableSegmentation: false,        // Disable segmentation mask (not needed for this application)
  minDetectionConfidence: 0.5,     // Minimum confidence (0.0-1.0) for person detection
  minTrackingConfidence: 0.5       // Minimum confidence (0.0-1.0) for landmark tracking
}
```

**Parameter Explanations:**
- **modelComplexity**: Set to `1` (full model) for better accuracy without excessive computational cost. Use `0` for faster performance on slower devices, or `2` for maximum accuracy on powerful hardware.
- **smoothLandmarks**: Enabled to reduce jitter and provide smoother landmark tracking across frames.
- **enableSegmentation**: Disabled as person segmentation masks are not required for pose analysis.
- **minDetectionConfidence**: Set to `0.5` to ensure reasonable detection quality while maintaining good performance.
- **minTrackingConfidence**: Set to `0.5` to balance tracking stability with responsiveness to movement.

## Files

- `index.html` - Main application interface
- `styles.css` - Styling and responsive layout
- `script.js` - Core functionality, pose estimation, COM calculation, and export logic

## Requirements

- Modern web browser with JavaScript enabled
- Internet connection (for MediaPipe and SheetJS CDN libraries)
- Video file in browser-supported format (MP4, WebM, MOV, etc.)
- Image file in browser-supported format (JPG, PNG, BMP, etc.)

## Privacy & Security

All processing happens **locally in your browser**. No video, image, or pose data is uploaded to any server. MediaPipe models are loaded from CDN but all computation is client-side.

## Limitations

- **Single Person Detection**: MediaPipe Pose detects only one person per frame (the most prominent person)
- **Visibility Requirements**: Landmarks must have visibility ≥ 0.3 to be displayed
- **2D Calibration**: Requires manual calibration point placement for accurate measurements in 2D mode
- **3D Accuracy Limitation**: ⚠️ 3D depth estimation (X, Y, Z coordinates) from monocular video is **not accurate** for precise quantitative analysis. MediaPipe's 3D pose estimation uses a single camera and has inherent depth perception limitations. **For accurate measurements, use 2D analysis with proper calibration.**
- **Browser Memory**: Very long videos may consume significant memory

## Use Cases

- Biomechanical analysis of human movement
- Gait analysis and postural assessment
- Sports performance analysis
- Rehabilitation monitoring
- Ergonomics research
- Motion capture for animation reference
- Physical therapy progress tracking

## Citations

If you use this tool for research, please cite:

### Segment Inertial Parameters
[^1]: de Leva P. (1996). Adjustments to Zatsiorsky-Seluyanov's segment inertia parameters. *Journal of Biomechanics*, 29(9):1223-1230. doi: [10.1016/0021-9290(95)00178-6](https://doi.org/10.1016/0021-9290(95)00178-6)

```bibtex
@article{deleva1996,
  title={Adjustments to Zatsiorsky-Seluyanov's segment inertia parameters},
  author={de Leva, Paolo},
  journal={Journal of Biomechanics},
  volume={29},
  number={9},
  pages={1223--1230},
  year={1996},
  doi={10.1016/0021-9290(95)00178-6},
  pmid={8872282}
}
```

### MediaPipe Pose Estimation
```bibtex
@article{mediapipe2019,
  title={MediaPipe: A Framework for Building Perception Pipelines},
  author={Lugaresi, Camillo and Tang, Jiuqiang and Nash, Hadon and McClanahan, Chris and Uboweja, Esha and Hays, Michael and Zhang, Fan and Chang, Chuo-Ling and Yong, Ming Guang and Lee, Juhyun and others},
  journal={arXiv preprint arXiv:1906.08172},
  year={2019}
}
```

## License

This application uses MediaPipe (Apache 2.0 License) and SheetJS Community Edition (Apache 2.0 License).
