import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
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

# --- Build & Train Model ---
print("\n🔨 Training classifier...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# --- Evaluate ---
accuracy = model.score(X_test, y_test)
print(f"\n✅ Test Accuracy: {accuracy * 100:.2f}%")

# --- Save Model & Encoder ---
with open("isl_model.pkl", "wb") as f:
    pickle.dump(model, f)
with open("label_encoder.pkl", "wb") as f:
    pickle.dump(encoder, f)

print("\n🎉 Model saved as isl_model.pkl")
print("🎉 Label encoder saved as label_encoder.pkl")