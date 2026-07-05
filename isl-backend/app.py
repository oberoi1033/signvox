from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import base64
import cv2
import pickle
import mediapipe as mp
from tensorflow import keras
import os

app = Flask(__name__)
CORS(app)

# --- Load Model & Encoder ---
print("📂 Loading model...")
model = keras.models.load_model("isl_model.h5")
with open("label_encoder.pkl", "rb") as f:
    encoder = pickle.load(f)
print("✅ Model loaded!")

# --- MediaPipe Setup ---
BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path="hand_landmarker.task"),
    running_mode=VisionRunningMode.IMAGE,
    num_hands=1
)
landmarker = HandLandmarker.create_from_options(options)
print("✅ MediaPipe loaded!")

# --- Routes ---
@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"status": "Server is running!"})


@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        image_data = data['image']

        header, encoded = image_data.split(",", 1)
        img_bytes = base64.b64decode(encoded)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

        result = landmarker.detect(mp_image)

        if not result.hand_landmarks:
            return jsonify({"prediction": None, "message": "No hand detected"})

        landmarks = []
        for lm in result.hand_landmarks[0]:
            landmarks += [lm.x, lm.y, lm.z]

        input_data = np.array([landmarks])
        prediction = model.predict(input_data, verbose=0)
        confidence = float(np.max(prediction))
        predicted_label = encoder.inverse_transform([np.argmax(prediction)])[0]

        if confidence < 0.7:
            return jsonify({"prediction": None, "message": "Low confidence"})

        return jsonify({
            "prediction": predicted_label,
            "confidence": round(confidence * 100, 2)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/landmarks', methods=['POST'])
def get_landmarks():
    try:
        data = request.json
        image_data = data['image']

        header, encoded = image_data.split(",", 1)
        img_bytes = base64.b64decode(encoded)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = landmarker.detect(mp_image)

        if not result.hand_landmarks:
            return jsonify({"landmarks": None})

        landmarks = [{"x": lm.x, "y": lm.y, "z": lm.z} for lm in result.hand_landmarks[0]]
        return jsonify({"landmarks": landmarks})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)