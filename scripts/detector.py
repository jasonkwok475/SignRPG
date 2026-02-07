import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# https://github.com/google-ai-edge/mediapipe-samples/blob/main/examples/hand_landmarker/python/hand_landmarker.ipynb
base_options = python.BaseOptions(model_asset_path='hand_landmarker.task')
options = vision.HandLandmarkerOptions(
    base_options=base_options,
    num_hands=2,
    min_hand_detection_confidence=0.5,
    min_hand_presence_confidence=0.5
)
detector = vision.HandLandmarker.create_from_options(options)

cap = cv2.VideoCapture(0)

while cap.isOpened():
    success, frame = cap.read()
    if not success: break

    frame = cv2.flip(frame, 1)
    rgb_frame = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

    detection_result = detector.detect(rgb_frame)
    hands_data = {"Left": None, "Right": None}

    if detection_result.hand_landmarks:
        for i, hand_landmarks in enumerate(detection_result.hand_landmarks):
          
          label = detection_result.handedness[i][0].category_name
          label = "Right" if label == "Left" else "Left"  # Flip labels 
          
          points = []
          for lm in hand_landmarks:
              points.append({'x': lm.x, 'y': lm.y, 'z': lm.z})
              
          hands_data[label] = points

          for landmark in hand_landmarks:
              # Convert normalized coordinates back to pixel values
              x = int(landmark.x * frame.shape[1])
              y = int(landmark.y * frame.shape[0])
              cv2.circle(frame, (x, y), 5, (0, 255, 0), -1)

          if hands_data["Right"]:
              # Example: Get the Right Index Finger Tip
              r_index_tip = hands_data["Right"][8]
              print(f"Right Index is at: {r_index_tip['x']}, {r_index_tip['y']}")

          if hands_data["Left"]:
              # Example: Get the Left Thumb Tip
              l_thumb_tip = hands_data["Left"][4]
              print(f"Left Thumb is at: {l_thumb_tip['x']}, {l_thumb_tip['y']}")

    cv2.imshow('ASL Spellcaster', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

detector.close()
cap.release()
cv2.destroyAllWindows()