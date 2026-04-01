# The Empathy Engine 🎙️

An advanced neural audio synthesis platform that dynamically modulates vocal characteristics based on the emotional context and intensity of input text.

## 🌟 Overview

The Empathy Engine bridges the gap between robotic text-to-speech and human-like expressive communication. By analyzing the underlying sentiment of a message, the engine programmatically adjusts vocal parameters—such as pitch, rate, and tonal quality—to achieve emotional resonance.

## 🚀 Key Features

- **Neural Emotion Analysis**: Deep sentiment detection identifying primary emotions and their relative intensity.
- **Dynamic Vocal Modulation**: Real-time adjustment of TTS parameters based on emotional metadata.
- **High-Fidelity Synthesis**: Utilizes state-of-the-art neural speech models for natural-sounding output.
- **Interactive Audio Suite**: Full playback control with seeking, duration tracking, and export capabilities.
- **Session History**: Persistent tracking of synthesized segments within the current session.

## 🛠️ Technical Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4.0 (Custom Neural Theme)
- **Animations**: Framer Motion
- **AI/ML Core**: 
  - **Sentiment Analysis**: Gemini 3.1 Flash Lite (Optimized for low-latency detection)
  - **Speech Synthesis**: Gemini 2.5 Flash TTS (Emotional synthesis core)

## 📦 Local Setup

Follow these steps to run the project on your local machine:

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd empathy-engine
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory and add your Gemini API Key:
```env
GEMINI_API_KEY=your_api_key_here
```
*Note: You can obtain an API key from the [Google AI Dashboard](https://aistudio.google.com/app/apikey).*

### 4. Run the Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

## 🧪 How it Works

1. **Analysis Phase**: The engine sends the input text to a lightweight neural model to determine the primary emotion (e.g., "Excited", "Anxious", "Calm") and its intensity (0.0 to 1.0).
2. **Strategy Generation**: Based on the analysis, a "Vocal Modulation Strategy" is formulated. For example, a "High Intensity Angry" result might trigger a strategy of "Speak with a sharp, loud tone and rapid pace."
3. **Synthesis Phase**: The text, along with the modulation strategy, is sent to the neural TTS core.
4. **PCM to WAV Conversion**: The raw 16-bit PCM data returned by the API is processed on the client side, where a RIFF/WAV header is dynamically generated to create a playable audio blob.

---

Developed as a technical demonstration for **DarwixAi**.
