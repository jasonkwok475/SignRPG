import tensorflow as tf
import numpy as np
from backend.detector import HandData

LOG_OUTPUT = 0 # Set to 1 to enable logging of prediction progress

classes = ['A','B','C','D','E','F','G','H','I','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y']

class ASLClassifier(tf.keras.Model):
    def __init__(self, model_path):
        super(ASLClassifier, self).__init__()
        self.loaded_model = tf.keras.models.load_model(model_path, compile=False)

    @tf.function(reduce_retracing=True)
    def fast_predict(self, x):
        return self.loaded_model(x, training=False)

    def classify(self, hand_landmarks: HandData):
        input_data = self.preprocess(hand_landmarks)
        predictions = self.fast_predict(input_data).numpy()
        
        predicted_index = np.argmax(predictions[0])
        confidence = predictions[0][predicted_index]
        return classes[predicted_index], confidence

    def preprocess(self, hand_landmarks: HandData):
        vec = np.zeros((21,3))
        for i, landmark in enumerate(hand_landmarks.get_all_landmarks()):
            vec[i] = [landmark['x'], landmark['y'], landmark['z']]

        return np.array([vec], dtype=np.float32)

    def get_letter_from_prediction(self, predictions):
        predicted_index = np.argmax(predictions)
        return classes[predicted_index]