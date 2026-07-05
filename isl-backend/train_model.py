import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from tensorflow import keras
from tensorflow.keras import layers
import pickle
import os

# --- Load Data ---
print("📂 Loading dataset...")
df = pd.read_csv("dataset.csv")

print(f"✅ Loaded {len(df)} samples")
print(f"📊 Gestures found: {df['label'].unique()}")

# --- Prepare Data ---
X = df.drop("label", axis=1).values   # 63 coordinates
y = df["label"].values                 # gesture names

# Encode labels (hello=0, thanks=1, etc)
encoder = LabelEncoder()
y_encoded = encoder.fit_transform(y)
num_classes = len(encoder.classes_)

print(f"🏷️ Classes: {encoder.classes_}")

# Split into train/test
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42
)

# --- Build Model ---
print("\n🔨 Building model...")
model = keras.Sequential([
    layers.Input(shape=(63,)),
    layers.Dense(128, activation="relu"),
    layers.Dropout(0.3),
    layers.Dense(64, activation="relu"),
    layers.Dropout(0.2),
    layers.Dense(32, activation="relu"),
    layers.Dense(num_classes, activation="softmax")
])

model.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

model.summary()

# --- Train ---
print("\n🚀 Training model...")
history = model.fit(
    X_train, y_train,
    epochs=50,
    batch_size=16,
    validation_data=(X_test, y_test),
    verbose=1
)

# --- Evaluate ---
loss, accuracy = model.evaluate(X_test, y_test, verbose=0)
print(f"\n✅ Test Accuracy: {accuracy * 100:.2f}%")

# --- Save Model & Encoder ---
model.save("isl_model.h5")
with open("label_encoder.pkl", "wb") as f:
    pickle.dump(encoder, f)

print("\n🎉 Model saved as isl_model.h5")
print("🎉 Label encoder saved as label_encoder.pkl")