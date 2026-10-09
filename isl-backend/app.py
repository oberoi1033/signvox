from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import base64
import cv2
import pickle
import mediapipe as mp
import os

app = Flask(__name__)
CORS(app)

# --- Load Model & Encoder ---
print("📂 Loading model...")
model_path = "isl_model.pkl" if os.path.exists("isl_model.pkl") else "isl_model.h5"
if model_path.endswith(".pkl"):
    with open(model_path, "rb") as f:
        model = pickle.load(f)
else:
    from tensorflow import keras
    model = keras.models.load_model(model_path)

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
    num_hands=1,
    min_hand_detection_confidence=0.3,
    min_hand_presence_confidence=0.3,
    min_tracking_confidence=0.3
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
        data = request.json or {}
        image_data = data.get('image')
        if not image_data:
            return jsonify({"prediction": None, "message": "No image data provided"}), 400

        header, encoded = image_data.split(",", 1) if "," in image_data else ("", image_data)
        img_bytes = base64.b64decode(encoded)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"prediction": None, "message": "Failed to decode image"}), 400

        # Flip horizontally to match training data collection orientation (collect_data.py uses cv2.flip(frame, 1))
        frame_flipped = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame_flipped, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb))

        result = landmarker.detect(mp_image)

        # Fallback to unflipped if flipped did not detect hand
        if not result.hand_landmarks:
            rgb_unflipped = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image_unflipped = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb_unflipped))
            result = landmarker.detect(mp_image_unflipped)

        if not result.hand_landmarks:
            return jsonify({"prediction": None, "message": "No hand detected"})

        landmarks = []
        for lm in result.hand_landmarks[0]:
            landmarks += [lm.x, lm.y, lm.z]

        input_data = np.array([landmarks])
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(input_data)[0]
            confidence = float(np.max(probs))
            predicted_label = encoder.inverse_transform([np.argmax(probs)])[0]
        else:
            prediction = model.predict(input_data, verbose=0)
            confidence = float(np.max(prediction))
            predicted_label = encoder.inverse_transform([np.argmax(prediction)])[0]

        if confidence < 0.35:
            return jsonify({"prediction": None, "message": "Low confidence", "confidence": round(confidence * 100, 2)})

        return jsonify({
            "prediction": predicted_label,
            "confidence": round(confidence * 100, 2)
        })

    except Exception as e:
        print(f"Error in /predict: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/landmarks', methods=['POST'])
def get_landmarks():
    try:
        data = request.json or {}
        image_data = data.get('image')
        if not image_data:
            return jsonify({"landmarks": None}), 400

        header, encoded = image_data.split(",", 1) if "," in image_data else ("", image_data)
        img_bytes = base64.b64decode(encoded)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"landmarks": None}), 400

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb))
        result = landmarker.detect(mp_image)

        if not result.hand_landmarks:
            return jsonify({"landmarks": None})

        landmarks = [{"x": lm.x, "y": lm.y, "z": lm.z} for lm in result.hand_landmarks[0]]
        return jsonify({"landmarks": landmarks})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5005))
    print(f"🚀 Starting ML server on port {port}...")
    app.run(debug=True, port=port, host="0.0.0.0")