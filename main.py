from flask import Flask, send_from_directory
from flask_socketio import SocketIO
import cv2
import base64
from flask_cors import CORS
import os
from scripts.detector import HandsTracker

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

# Target frame rate for the game loop (in FPS)
GAME_FRAME_RATE = 30  

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST = os.path.join(ROOT_DIR, 'game', 'dist')

@app.route('/')
def index():
    return send_from_directory(FRONTEND_DIST, 'index.html')

# Serve all static assets from the dist folder
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(FRONTEND_DIST, path)

@socketio.on('connect')
def handle_connect():
    print("React Client Connected!")

    # Start the camera loop in a background task so it doesn't block Flask
    socketio.start_background_task(video_stream_task)

def video_stream_task():
    cap = cv2.VideoCapture(0) # 0 is the webcam
    tracker = HandsTracker()
    
    while cap.isOpened():

        # Get the processed frame with hand landmarks drawn
        frame = tracker.get_updated_frame(cap)

        if frame is None:
            continue  # Skip if frame couldn't be read

        # 2. MEDIA PIPE LOGIC GOES HERE
        # detected_letter = check_asl_logic(hand_landmarks)
        
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 60])
        b64_frame = base64.b64encode(buffer).decode('utf-8')

        socketio.emit('video_data', {
            'image': b64_frame,
            'letter': 'F', # Replace with logic
            'buffer': 'FI' # Replace with logic
        })
        
        socketio.sleep(1.0 / GAME_FRAME_RATE)

    cap.release()

if __name__ == '__main__':
    socketio.run(app, debug=True, port=8000, allow_unsafe_werkzeug=True)
