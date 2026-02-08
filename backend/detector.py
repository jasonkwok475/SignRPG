import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from typing import Dict, List, Optional
import os

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
LANDMARKER_MODEL_PATH = os.path.join(ROOT_DIR, 'hand_landmarker.task')

NUMBER_OF_HANDS = 2
MIN_DETECTION_CONFIDENCE = 0.5
FRAME_WIDTH = 480
FRAME_HEIGHT = 280
FRAME_SKIP = 1  # Process every nth frame

class HandData:
    """Class to store and access hand landmark data"""
    
    # Landmark indices for easy access
    LANDMARKS = {
        'WRIST': 0,
        'THUMB_CMC': 1, 'THUMB_MCP': 2, 'THUMB_IP': 3, 'THUMB_TIP': 4,
        'INDEX_MCP': 5, 'INDEX_PIP': 6, 'INDEX_DIP': 7, 'INDEX_TIP': 8,
        'MIDDLE_MCP': 9, 'MIDDLE_PIP': 10, 'MIDDLE_DIP': 11, 'MIDDLE_TIP': 12,
        'RING_MCP': 13, 'RING_PIP': 14, 'RING_DIP': 15, 'RING_TIP': 16,
        'PINKY_MCP': 17, 'PINKY_PIP': 18, 'PINKY_DIP': 19, 'PINKY_TIP': 20
    }
    
    def __init__(self, landmarks: List[Dict[str, float]]):
        """
        Initialize hand data with landmarks
        
        Args:
            landmarks: List of 21 landmark points with x, y, z coordinates
        """
        self.landmarks = landmarks
    
    def get_landmark(self, index: int) -> Optional[Dict[str, float]]:
        """Get landmark by index (0-20)"""
        if 0 <= index < len(self.landmarks):
            return self.landmarks[index]
        return None
    
    def get_named_landmark(self, name: str) -> Optional[Dict[str, float]]:
        """Get landmark by name (e.g., 'THUMB_TIP', 'INDEX_TIP')"""
        if name in self.LANDMARKS:
            return self.get_landmark(self.LANDMARKS[name])
        return None
    
    def get_finger_tip(self, finger: str) -> Optional[Dict[str, float]]:
        """Get fingertip by finger name: 'THUMB', 'INDEX', 'MIDDLE', 'RING', 'PINKY'"""
        return self.get_named_landmark(f'{finger}_TIP')
    
    def get_all_landmarks(self) -> List[Dict[str, float]]:
        """Get all landmarks"""
        return self.landmarks
    
    def __getitem__(self, index: int) -> Dict[str, float]:
        """Allow bracket notation: hand[8] for index finger tip"""
        return self.landmarks[index]
    
    def __repr__(self):
        return f"HandData({len(self.landmarks)} landmarks)"


class HandsTracker:
    """Manages hand detection and tracking data"""
    
    def __init__(self):
        self.left_hand: Optional[HandData] = None
        self.right_hand: Optional[HandData] = None
        self.detector = self._initialize_detector()
        self.frame_count = 0  # Track frames for skipping

    def get_updated_frame(self, cap):
        """Capture a frame from the webcam and process it"""
        success, frame = cap.read()
        if not success:
            return None
        
        frame = cv2.flip(frame, 1)
        frame = cv2.resize(frame, (FRAME_WIDTH, FRAME_HEIGHT))
        
        # Only process detection every FRAME_SKIP frames
        if self.frame_count % FRAME_SKIP == 0:
            rgb_frame = mp.Image(image_format=mp.ImageFormat.SRGB, 
                                data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            detection_result = self.detector.detect(rgb_frame)
            self._update(detection_result)

            # Draw landmarks onto frame
            if detection_result.hand_landmarks:
                for hand_landmarks in detection_result.hand_landmarks:
                    for landmark in hand_landmarks:
                        x = int(landmark.x * frame.shape[1])
                        y = int(landmark.y * frame.shape[0])
                        cv2.circle(frame, (x, y), 5, (0, 255, 0), -1)
        
        self.frame_count += 1
        return frame

    def has_left_hand(self) -> bool:
        """Check if left hand is detected"""
        return self.left_hand is not None
    
    def has_right_hand(self) -> bool:
        """Check if right hand is detected"""
        return self.right_hand is not None
    
    def has_any_hand(self) -> bool:
        """Check if any hand is detected"""
        return self.has_left_hand() or self.has_right_hand()
    
    def get_left_hand(self) -> Optional[HandData]:
        """Get left hand data"""
        return self.left_hand
    
    def get_right_hand(self) -> Optional[HandData]:
        """Get right hand data"""
        return self.right_hand

    def _initialize_detector(self):
        """Initialize the MediaPipe hand detector"""
        base_options = python.BaseOptions(model_asset_path=LANDMARKER_MODEL_PATH)
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            num_hands=NUMBER_OF_HANDS,
            min_hand_detection_confidence=MIN_DETECTION_CONFIDENCE,
            min_hand_presence_confidence=MIN_DETECTION_CONFIDENCE
        )
        return vision.HandLandmarker.create_from_options(options)

    def _update(self, detection_result):
        """
        Update hand data from MediaPipe detection result
        
        Args:
            detection_result: MediaPipe hand detection result
        """
        # Reset hands
        self.left_hand = None
        self.right_hand = None
        
        if detection_result.hand_landmarks:
            for i, hand_landmarks in enumerate(detection_result.hand_landmarks):
                # Get label and flip it (MediaPipe flips left/right for camera view)
                label = detection_result.handedness[i][0].category_name
                label = "Right" if label == "Left" else "Left"
                
                # Convert landmarks to our format
                points = []
                for lm in hand_landmarks:
                    points.append({'x': lm.x, 'y': lm.y, 'z': lm.z})
                
                # Store in appropriate hand
                if label == "Left":
                    self.left_hand = HandData(points)
                else:
                    self.right_hand = HandData(points)

    def __repr__(self):
        hands = []
        if self.left_hand: hands.append("Left")
        if self.right_hand: hands.append("Right")
        return f"HandsTracker({', '.join(hands) if hands else 'No hands detected'})"