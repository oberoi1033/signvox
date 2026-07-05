import cv2
import mediapipe as mp
import csv
import os
import urllib.request

# --- Config ---
WORD = "NO"
SAMPLES = 200
OUTPUT_FILE = "dataset.csv"

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

# --- Download model if not exists ---
if not os.path.exists("hand_landmarker.task"):
    print("Downloading hand landmark model...")
    urllib.request.urlretrieve(
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
        "hand_landmarker.task"
    )
    print("Model downloaded!")

# --- CSV Setup ---
file_exists = os.path.exists(OUTPUT_FILE)
csv_file = open(OUTPUT_FILE, "a", newline="")
writer = csv.writer(csv_file)

if not file_exists:
    header = ["label"]
    for i in range(21):
        header += [f"x{i}", f"y{i}", f"z{i}"]
    writer.writerow(header)

# --- Webcam ---
cap = cv2.VideoCapture(0)
count = 0
collecting = False

print(f"\n📸 Ready to collect '{WORD}' — Press SPACE to start\n")

with HandLandmarker.create_from_options(options) as landmarker:
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = landmarker.detect(mp_image)

        if result.hand_landmarks:
            for hand in result.hand_landmarks:
                for lm in hand:
                    cx = int(lm.x * frame.shape[1])
                    cy = int(lm.y * frame.shape[0])
                    cv2.circle(frame, (cx, cy), 5, (0, 255, 0), -1)

                if collecting:
                    row = [WORD]
                    for lm in hand:
                        row += [lm.x, lm.y, lm.z]
                    writer.writerow(row)
                    count += 1

        status = f"Collecting: {count}/{SAMPLES}" if collecting else "Press SPACE to start"
        cv2.putText(frame, f"Word: {WORD}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, status, (10, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 200, 255), 2)

        cv2.imshow("Data Collection", frame)

        key = cv2.waitKey(1)
        if key == ord(" "):
            collecting = True
        if count >= SAMPLES:
            print(f"✅ Done collecting '{WORD}'!")
            break