import tensorflow as tf
import numpy as np
from backend.detector import HandData

classes = ['A','B','C','D','E','F','G','H','I','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y']

class ASLClassifier(tf.keras.Model):
    def __init__(self, model_path):
        super(ASLClassifier, self).__init__()
        self.model = tf.keras.models.load_model(model_path, compile=False)

    def classify(self, hand_landmarks: HandData):
        # Preprocess the hand landmarks into the format expected by the model
        input_data = self.preprocess(hand_landmarks)
        predictions = self.model.predict(input_data)
        predicted_letter = self.get_letter_from_prediction(predictions)
        confidence = max(predictions[0])  # Get the confidence of the predicted letter
        return predicted_letter, confidence

    def preprocess(self, hand_landmarks: HandData):
        
        vec = np.zeros((21,3))
        for i, landmark in enumerate(hand_landmarks.get_all_landmarks()):
            vec[i] = [landmark['x'], landmark['y'], landmark['z']]

        return np.array([vec], dtype=np.float32)

    def get_letter_from_prediction(self, predictions):
        predicted_index = np.argmax(predictions)
        return classes[predicted_index]