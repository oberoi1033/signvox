# SignVox

**SignVox** is an AI-powered full-stack application that bridges communication gaps through real-time hand gesture recognition and digital accessibility. It features an **Indian Sign Language (ISL) Translator**, a gesture-based **Air Writer (AirWriter)**, and a secure **User Authentication & Translation History** portal.

---

## 🚀 Features

- 🤟 **ISL Gesture Translator** — Real-time computer vision recognition and translation of Indian Sign Language gestures into text with text-to-speech audio feedback.
- ✍️ **AirWriter** — Air-canvas neon writing using fingertip tracking and gesture controls (pinch/fist erasing, peace sign lifting, stroke export).
- 🔐 **Authentication & History Gateway** — Secure user authentication (JWT + bcrypt) and personalized translation history tracking.
- 📷 **Real-Time Hand Tracking** — Low-latency 21-point hand landmark detection powered by MediaPipe.
- 🧠 **Trained ML Model** — High-accuracy landmark classifier trained on custom ISL gesture datasets.
- 🌐 **Microservice Full-Stack Architecture** — Python Flask ML inference service, Node.js/Express Auth & History backend with embedded MongoDB fallback, and a React frontend.

---

## 🛠️ Architecture & Tech Stack

```
signvox/
├── isl-auth-backend/        # Authentication & Translation History Service (Port 5001)
│   ├── models/              # User and TranslationHistory Mongoose schemas
│   ├── routes/              # Auth (register/login) & History endpoints
│   ├── middleware/          # JWT authentication middleware
│   └── server.js            # Express server with MongoDB / MongoMemoryServer fallback
│
├── isl-backend/             # Gesture Classification & Landmark Service (Port 5005)
│   ├── app.py               # Flask prediction and landmark API
│   ├── collect_data.py      # Landmark collection tool
│   ├── train_model.py       # scikit-learn model trainer
│   ├── isl_model.pkl        # Trained classifier model
│   └── dataset.csv          # ISL gesture coordinate dataset
│
└── isl-translator/          # React Single Page Application (Port 3000)
    ├── src/
    │   ├── App.js           # Auth-gated router & navigation
    │   ├── Login.js         # User Sign-In component
    │   ├── Register.js      # User Registration component
    │   ├── ISLTranslator.js # Live camera feed & gesture translator
    │   ├── AirWriter.js     # Air canvas drawing tool
    │   └── History.js       # Personal translation history feed
    └── package.json
```

---

## 🚦 Getting Started

### Prerequisites
- **Node.js** 18+ and `npm`
- **Python** 3.9+ with `pip`
- A webcam-enabled device

---

### 1. Start Authentication & History Backend
```bash
cd isl-auth-backend
npm install
npm start
```
*Runs on `http://localhost:5001`. Automatically falls back to an embedded in-memory MongoDB instance if local MongoDB is not running.*

---

### 2. Start Machine Learning Backend
```bash
cd isl-backend
python -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate
pip install mediapipe==0.10.14 opencv-python scikit-learn flask flask-cors
python app.py
```
*Runs on `http://localhost:5005`.*

---

### 3. Start Frontend Application
```bash
cd isl-translator
npm install
npm start
```
*Opens in browser at `http://localhost:3000`.*

---

## 🧠 Training Custom Gesture Models

1. **Collect Data**: Run `python collect_data.py` with the gesture label of your choice to record 21-point hand landmark coordinates into `dataset.csv`.
2. **Train Model**: Run `python train_model.py` to train the classifier — saves `isl_model.pkl` and `label_encoder.pkl`.
3. **Deploy**: Restart `python app.py` to load the updated weights.

---

## 🔒 Security & Environment Configuration

### `isl-auth-backend/.env`
```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/signvox
JWT_SECRET=your_jwt_secret_key_here
```

---

## 📄 License
This project is licensed under the MIT License.
