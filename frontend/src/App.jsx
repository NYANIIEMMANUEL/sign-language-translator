import React, { useRef, useEffect, useState } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { api } from './utils/api';
import Interface from './components/Interface';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // App State
  const [mode, setMode] = useState("idle"); 
  const [labelInput, setLabelInput] = useState("");
  const [prediction, setPrediction] = useState("-");
  const [sentence, setSentence] = useState("");
  const [logs, setLogs] = useState("System Ready");
  const [captureCount, setCaptureCount] = useState(0);

  // Live Refs for the camera loop to avoid "stale state"
  const settingsRef = useRef({ mode: "idle", label: "" });
  const lastSentRef = useRef(0);

  // Update Ref when state changes so camera loop sees it instantly
  useEffect(() => {
    settingsRef.current = { mode, label: labelInput };
  }, [mode, labelInput]);

  // Watcher: Reset counter when switching modes
  useEffect(() => {
    if (mode === "collect") {
        setCaptureCount(0); 
        setLogs("Recording...");
    } else if (mode === "predict") {
        setLogs("Translating...");
    } else {
        setLogs("System Ready");
    }
  }, [mode]);

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);

    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }
  }, []); 

  const onResults = async (results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // 1. Draw Video
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Draw Skeleton
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(ctx, landmarks);
      }

      const primaryHand = results.multiHandLandmarks[0];
      const flatLandmarks = primaryHand.flatMap(lm => [lm.x, lm.y, lm.z]);
      const now = Date.now();

      // Read from Live Ref
      const currentMode = settingsRef.current.mode;
      const currentLabel = settingsRef.current.label;

      // --- LOGIC: COLLECTION ---
      if (currentMode === "collect" && currentLabel && now - lastSentRef.current > 100) {
         try {
             await api.collectData(currentLabel, flatLandmarks);
             
             // UPDATE COUNTER (I put this line back!)
             setCaptureCount(prev => prev + 1);
             
             lastSentRef.current = now;
         } catch (err) {
             console.error("Collection Error");
         }
      } 
      // --- LOGIC: PREDICTION ---
      else if (currentMode === "predict" && now - lastSentRef.current > 500) {
         const result = await api.predict(flatLandmarks);
         
         // Debug Log to see what Python is saying
         if (result) {
             console.log(`AI Says: ${result.prediction} (${result.confidence})`);
         }

         // LOWERED THRESHOLD TO 0.4 (40%)
         if (result && result.confidence > 0.4) {
             setPrediction(result.prediction);
             setLogs(`Detected: ${result.prediction} (${(result.confidence * 100).toFixed(0)}%)`);
         }
         lastSentRef.current = now;
      }
    }
    ctx.restore();
  };

  const drawConnectors = (ctx, landmarks) => {
      ctx.fillStyle = "#00FF00";
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(landmarks[0].x * 640, landmarks[0].y * 480);
      for (let i = 1; i <= 20; i++) {
        const x = landmarks[i].x * 640;
        const y = landmarks[i].y * 480;
        ctx.lineTo(x, y);
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
      }
      ctx.stroke();
  };

  const handleTrain = async () => {
    setLogs("Training...");
    try {
        const res = await api.trainModel();
        setLogs(`Success! Accuracy: ${res.accuracy}`);
    } catch (e) {
        setLogs("Training Failed. Check Console.");
    }
  };

  const handleSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(sentence);
    window.speechSynthesis.speak(utterance);
  };

  const handleAppend = () => {
      setSentence(prev => prev + prediction + " ");
  };

  return (
    <div className="container">
      <h1>Sign Language AI</h1>
      <div className="grid-container">
        
        {/* LEFT: Camera */}
        <div className="camera-box">
          <video ref={videoRef} style={{ display: 'none' }}></video>
          <canvas ref={canvasRef} width={640} height={480}></canvas>
          <div className="overlay-text">
            {mode === 'collect' 
                ? `Recording: ${labelInput} (${captureCount})` 
                : `Detected: ${prediction}`}
          </div>
        </div>

        {/* RIGHT: Interface */}
        <Interface 
            mode={mode}
            setMode={setMode}
            labelInput={labelInput}
            setLabelInput={setLabelInput}
            trainModel={handleTrain}
            logs={logs}
            sentence={sentence}
            setSentence={setSentence}
            prediction={prediction}
            appendToSentence={handleAppend}
            speakSentence={handleSpeak}
        />
      </div>
    </div>
  );
}

export default App;