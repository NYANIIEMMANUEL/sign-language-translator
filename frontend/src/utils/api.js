import axios from 'axios';

// This must match the port your Python app.py is running on
const API_URL = "http://localhost:5000";

export const api = {
  // 1. Send landmarks to be saved in CSV
  collectData: async (label, landmarks) => {
    try {
      const response = await axios.post(`${API_URL}/collect`, {
        label: label,
        landmarks: landmarks
      });
      return response.data;
    } catch (error) {
      console.error("API Error (Collect):", error);
      throw error;
    }
  },

  // 2. Trigger the Python script to train the model
  trainModel: async () => {
    try {
      const response = await axios.post(`${API_URL}/train`);
      return response.data;
    } catch (error) {
      console.error("API Error (Train):", error);
      throw error;
    }
  },

  // 3. Send landmarks and get a prediction back
  predict: async (landmarks) => {
    try {
      const response = await axios.post(`${API_URL}/predict`, {
        landmarks: landmarks
      });
      return response.data;
    } catch (error) {
      // It's normal to error if model isn't trained yet
      return null;
    }
  }
};