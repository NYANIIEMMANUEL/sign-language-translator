SignVoice: Real-Time Hand Gesture Recognition System

🚀 Project Overview

SignVoice is a full-stack, real-time web application designed to translate hand gestures (simplified sign language) into text and speech. This project showcases an end-to-end Machine Learning pipeline that runs entirely on a standard webcam feed.

The core functionality is driven by a unique in-browser training loop, allowing users to create custom gestures, collect data, train the model, and begin live translation instantly.

🌟 Key Features

1.Real-Time Gesture Translation: Converts hand signs into text with minimal latency.

2.Custom Training Pipeline: Allows users to collect, label, and train new gestures directly through the frontend UI.

3.Computer Vision: Utilizes MediaPipe Hands to extract 21 precise 3D landmarks (63 features) from the hand.

4.Machine Learning: Employs a Random Forest Classifier trained via Scikit-Learn for high-accuracy prediction.

5.Text-to-Speech (TTS): Integrated speech synthesis provides immediate auditory feedback for recognized signs.

6.Full-Stack Architecture: Decoupled design using React for the UI and Python/Flask for the ML inference layer.
