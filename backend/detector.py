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

    def get_updated_frame(self, cap):
        """Capture a frame from the webcam and process it"""
        success, frame = cap.read()
        if not success:
            return None
        
        frame = cv2.flip(frame, 1)
        frame = cv2.resize(frame, (FRAME_WIDTH, FRAME_HEIGHT))
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


# Main tracking code
if __name__ == "__main__":
    base_options = python.BaseOptions(model_asset_path='hand_landmarker.task')
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=2,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5
    )
    detector = vision.HandLandmarker.create_from_options(options)
    
    # Initialize the tracker
    hands = HandsTracker()
    
    cap = cv2.VideoCapture(0)
    
    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            break
        
        frame = cv2.flip(frame, 1)
        rgb_frame = mp.Image(image_format=mp.ImageFormat.SRGB, 
                            data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        
        detection_result = detector.detect(rgb_frame)
        
        # Update tracker with new detection
        hands.get_updated_frame(detection_result)
        
        # Draw landmarks
        if detection_result.hand_landmarks:
            for hand_landmarks in detection_result.hand_landmarks:
                for landmark in hand_landmarks:
                    x = int(landmark.x * frame.shape[1])
                    y = int(landmark.y * frame.shape[0])
                    cv2.circle(frame, (x, y), 5, (0, 255, 0), -1)
        
        # Access hand data using the tracker
        if hands.has_right_hand():
            # Method 1: Using bracket notation
            r_index_tip = hands.right_hand[8]
            print(f"Right Index at: {r_index_tip['x']:.3f}, {r_index_tip['y']:.3f}")
            
            # Method 2: Using named access
            r_thumb = hands.right_hand.get_finger_tip('THUMB')
            if r_thumb:
                print(f"Right Thumb at: {r_thumb['x']:.3f}, {r_thumb['y']:.3f}")
        
        if hands.has_left_hand():
            # Method 3: Using landmark constants
            l_thumb_tip = hands.left_hand.get_named_landmark('THUMB_TIP')
            if l_thumb_tip:
                print(f"Left Thumb at: {l_thumb_tip['x']:.3f}, {l_thumb_tip['y']:.3f}")
        
        cv2.imshow('ASL Spellcaster', frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    detector.close()
    cap.release()
    cv2.destroyAllWindows()