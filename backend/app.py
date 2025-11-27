import os
import csv
import pickle
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

app = Flask(__name__)
# Enable CORS for all routes, specifically allowing Content-Type headers
CORS(app, resources={r"/*": {"origins": "*"}})

DATA_FILE = 'data/dataset.csv'
MODEL_FILE = 'model.pkl'

os.makedirs('data', exist_ok=True)

# Initialize CSV if missing
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        header = ['label'] + [f'v{i}' for i in range(63)]
        writer.writerow(header)

@app.route('/')
def home():
    return "Backend is Alive!"

@app.route('/collect', methods=['POST'])
def collect_data():
    try:
        data = request.json
        label = data.get('label')
        landmarks = data.get('landmarks')
        
        if not label or not landmarks:
            return jsonify({"error": "Missing data"}), 400

        # FORCE APPEND to prevent file locking issues
        with open(DATA_FILE, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([label] + landmarks)

        return jsonify({"status": "success"})
    except Exception as e:
        print(f"COLLECTION ERROR: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/train', methods=['POST'])
def train_model():
    try:
        if not os.path.exists(DATA_FILE):
            return jsonify({"error": "No dataset found"}), 400

        df = pd.read_csv(DATA_FILE)
        
        # Check if empty or only headers
        if len(df) < 2:
            return jsonify({"error": "Not enough data. Collect at least 2 samples."}), 400

        X = df.iloc[:, 1:].values
        y = df.iloc[:, 0].values

        # Needs at least 2 classes to classify
        if len(np.unique(y)) < 2:
            return jsonify({"error": "You need at least 2 DIFFERENT words to train."}), 400

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        model = RandomForestClassifier(n_estimators=100)
        model.fit(X_train, y_train)
        
        acc = 1.0
        if len(X_test) > 0:
            acc = accuracy_score(y_test, model.predict(X_test))

        with open(MODEL_FILE, 'wb') as f:
            pickle.dump(model, f)

        print(f"TRAINING SUCCESS: Accuracy {acc}")
        return jsonify({"status": "success", "accuracy": f"{acc:.2f}"})
        
    except Exception as e:
        print(f"TRAINING CRASH: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # 1. Check if model exists
        if not os.path.exists(MODEL_FILE):
            return jsonify({"error": "Model not found. Train first!"}), 400

        # 2. Get Data
        data = request.json
        landmarks = data.get('landmarks')

        # 3. Validation: Must be 63 numbers
        if not landmarks or len(landmarks) != 63:
            print(f"BAD INPUT: Expected 63 points, got {len(landmarks) if landmarks else 0}")
            return jsonify({"error": "Invalid hand data shape"}), 400

        # 4. Load Model
        with open(MODEL_FILE, 'rb') as f:
            model = pickle.load(f)

        # 5. Predict
        input_data = np.array([landmarks])
        prediction = model.predict(input_data)[0]
        probs = model.predict_proba(input_data)[0]
        confidence = float(max(probs))

        print(f"PREDICTION: {prediction} ({confidence:.2f})")
        return jsonify({"prediction": prediction, "confidence": confidence})

    except Exception as e:
        # THIS PRINTS THE REAL ERROR TO YOUR TERMINAL
        print(f"PREDICTION CRASH: {e}") 
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)