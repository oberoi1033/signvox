# SignVox

**SignVox** is an AI-powered application that bridges communication gaps through real-time hand gesture recognition. It combines an **Indian Sign Language (ISL) Translator** with an **AI Writer (AirWriter)** feature, allowing users to communicate and write using just their hands via a webcam.

---

## Features

- 🤟 **ISL Gesture Translator** — Real-time recognition and translation of Indian Sign Language hand gestures into text using computer vision and machine learning.
- ✍️ **AirWriter** — Write text in the air using hand gestures, tracked and converted into digital text in real time.
- 📷 **Live Webcam Detection** — Uses MediaPipe Hand Landmarker for accurate, low-latency hand tracking.
- 🧠 **Custom-Trained ML Model** — Gesture classification powered by a model trained on a custom dataset of hand landmark coordinates.
- 🌐 **Full-Stack Architecture** — Python-based ML backend paired with a modern React frontend.

---

## Tech Stack

### Backend (`isl-backend`)
- **Python**
- **MediaPipe** — Hand landmark detection (`hand_landmarker.task`)
- **OpenCV (cv2)** — Video capture and frame processing
- **scikit-learn / TensorFlow-Keras** — Model training and inference (`isl_model.h5`, `label_encoder.pkl`)
- **Flask / FastAPI** — API layer (adjust based on your actual framework)

### Frontend (`isl-translator`)
- **React** — UI framework
- **Tailwind CSS** — Styling
- **PostCSS** — CSS processing
- Key components: `ISLTranslator.js`, `AirWriter.js`, `App.jsx`

---

## Project Structure

```
signvox/
├── isl-backend/
│   ├── app.py                  # Main backend entry point
│   ├── collect_data.py         # Script to collect hand landmark training data
│   ├── train_model.py          # Model training script
│   ├── dataset.csv             # Collected gesture landmark dataset
│   ├── hand_landmarker.task    # MediaPipe hand landmark model
│   ├── isl_model.h5            # Trained gesture classification model
│   ├── label_encoder.pkl       # Label encoder for gesture classes
│   ├── package.json
│   └── node_modules/
│
└── isl-translator/
    ├── src/
    │   ├── App.jsx
    │   ├── ISLTranslator.js
    │   ├── AirWriter.js
    │   └── index.css
    ├── tailwind.config.js
    ├── postcss.config.js
    └── package.json
```

---

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js and npm
- A webcam-enabled device

### Backend Setup

```bash
cd isl-backend
python -m venv venv
venv\Scripts\activate        # On Windows
pip install -r requirements.txt
python app.py
```

### Frontend Setup

```bash
cd isl-translator
npm install
npm run dev
```

### Training Your Own Gesture Model
1. Run `collect_data.py` to capture hand landmark samples for each gesture and save them to `dataset.csv`.
2. Run `train_model.py` to train the classifier — this generates `isl_model.h5` and `label_encoder.pkl`.
3. Restart the backend to load the newly trained model.

---

## How It Works

1. The webcam feed is captured and passed to **MediaPipe's Hand Landmarker**, which detects 21 hand landmark points per hand.
2. These landmark coordinates are normalized and fed into the trained ML model.
3. The model predicts the corresponding ISL gesture or AirWriter stroke.
4. The prediction is sent to the frontend, which displays the translated text or written character in real time.

---

## Roadmap

- [ ] Expand ISL gesture vocabulary
- [ ] Add two-hand gesture support
- [ ] Improve AirWriter accuracy with smoothing/prediction
- [ ] Add multi-language translation output
- [ ] Deploy as a hosted web app

---

## Contributing

Contributions are welcome. Please open an issue or submit a pull request with a clear description of your changes.

---

## License

This project is licensed under the MIT License. See `LICENSE` for details.

---

## Acknowledgements

- [MediaPipe](https://developers.google.com/mediapipe) for hand landmark detection
- The Indian Sign Language community for gesture reference and inspiration
