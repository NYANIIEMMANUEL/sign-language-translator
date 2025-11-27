import React from 'react';

// We receive all logic from App.jsx as "props"
const Interface = ({ 
    mode, 
    setMode, 
    labelInput, 
    setLabelInput, 
    trainModel, 
    logs, 
    sentence, 
    setSentence, 
    prediction,
    appendToSentence,
    speakSentence 
}) => {
  return (
    <div className="controls-box">
      {/* SECTION 1: DATA COLLECTION */}
      <div className="section">
        <h3>1. Teach the AI</h3>
        <p className="hint">Type a word, then hold your hand pose.</p>
        <input 
          type="text" 
          placeholder="Enter Word (e.g. Hello)" 
          value={labelInput} 
          onChange={(e) => setLabelInput(e.target.value)}
          disabled={mode === 'collect'}
        />
        <button 
            className={mode === 'collect' ? 'active-btn' : 'start-btn'}
            onClick={() => setMode(mode === 'collect' ? 'idle' : 'collect')}
        >
          {mode === 'collect' ? 'Stop Collecting' : 'Start Collecting'}
        </button>
      </div>

      {/* SECTION 2: TRAINING */}
      <div className="section">
        <h3>2. Train Brain</h3>
        <button onClick={trainModel} className="train-btn">
            Train Model
        </button>
        <div className="status-log">Status: {logs}</div>
      </div>

      {/* SECTION 3: TRANSLATION */}
      <div className="section">
        <h3>3. Live Translate</h3>
        <button 
            onClick={() => setMode('predict')} 
            className="predict-btn"
        >
          Mode: {mode === 'predict' ? 'Translating...' : 'Start Translation'}
        </button>
        
        {/* Prediction Display */}
        {mode === 'predict' && (
            <div className="live-prediction">
                Current Sign: <strong>{prediction}</strong>
                <button onClick={appendToSentence} className="add-word-btn">
                   + Add Word
                </button>
            </div>
        )}
      </div>

      {/* SECTION 4: TEXT TO SPEECH */}
      <div className="output-area">
        <textarea 
            value={sentence} 
            onChange={(e) => setSentence(e.target.value)}
            placeholder="Translation sentence..."
        />
        <div className="action-buttons">
            <button onClick={speakSentence} className="speak-btn">🔊 Speak</button>
            <button onClick={() => setSentence("")} className="clear-btn">Clear</button>
        </div>
      </div>
    </div>
  );
};

export default Interface;