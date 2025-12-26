# Video Pose Estimation App

A web-based application for analyzing human pose in videos using real-time pose estimation. Upload videos, play them frame-by-frame, and export 3D joint location data.

## Features

- **Video Playback**: Play videos at their original sampling rate and resolution
- **Frame-by-Frame Navigation**: Step through videos one frame at a time using intuitive controls
- **Real-time Pose Estimation**: Automatic detection of 33 body joints using MediaPipe Pose
- **3D Joint Tracking**: Extract both 2D (pixel coordinates) and 3D (world coordinates) joint positions
- **Visual Overlay**: See detected skeleton and joints overlaid on the video in real-time
- **Data Export**: Export collected pose data in JSON or CSV format
- **Keyboard Controls**: Efficient navigation using keyboard shortcuts

## How to Use

1. **Open the App**: Open `index.html` in a modern web browser (Chrome, Firefox, Edge, or Safari)

2. **Upload a Video**: Click "Choose Video File" and select a video file from your computer

3. **Control Playback**:
   - Click the play button (▶) or press **Space** to play/pause
   - Use **⏮** and **⏭** buttons or **arrow keys** to navigate frame-by-frame
   - Drag the timeline slider to jump to specific points

4. **View Pose Detection**:
   - The skeleton will be automatically drawn over detected people
   - Toggle "Show Skeleton" to hide/show the overlay
   - Toggle "Enable Pose Detection" to turn pose detection on/off

5. **Export Data**:
   - Click "Export as JSON" for structured 3D data with metadata
   - Click "Export as CSV" for spreadsheet-compatible format
   - Data includes frame number, timestamp, and all 33 joint positions in 2D and 3D

## Keyboard Shortcuts

- **Space**: Play/Pause
- **Left Arrow**: Previous frame
- **Right Arrow**: Next frame

## Joint Data Structure

The app tracks 33 body landmarks:

- Face: nose, eyes, ears, mouth
- Torso: shoulders, hips
- Arms: elbows, wrists, hands, fingers
- Legs: knees, ankles, feet, toes

### Exported Data Format

**JSON Export**:
```json
{
  "metadata": {
    "totalFrames": 120,
    "fps": 30,
    "duration": 4.0,
    "videoWidth": 1920,
    "videoHeight": 1080
  },
  "poseData": [
    {
      "frame": 0,
      "timestamp": 0.0,
      "landmarks2D": [...],
      "landmarks3D": [...]
    }
  ]
}
```

**CSV Export**:
Each row contains: Frame, Timestamp, Landmark_ID, X_2D, Y_2D, Z_2D, X_3D, Y_3D, Z_3D, Visibility

## Technical Details

- **Pose Estimation**: MediaPipe Pose (Google)
- **3D Coordinates**: World landmarks in meters from hip center
- **2D Coordinates**: Normalized to video dimensions (0-1 range)
- **Landmark Count**: 33 body keypoints per frame
- **Browser Compatibility**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Files

- `index.html` - Main application interface
- `style.css` - Styling and responsive layout
- `app.js` - Core functionality and pose estimation logic

## Requirements

- Modern web browser with JavaScript enabled
- Internet connection (for MediaPipe CDN libraries)
- Video file in a browser-supported format (MP4, WebM, etc.)

## Privacy

All processing happens locally in your browser. No video data is uploaded to any server.
