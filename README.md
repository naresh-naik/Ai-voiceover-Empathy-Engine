# AI Voiceover Empathy Engine 🎙️

An emotion-aware voice synthesis platform that detects sentiment in text and generates a matching voiceover — available in two flavours:

| Version | Stack | API keys needed |
|---------|-------|----------------|
| **Python / Flask** (this guide) | Python, Flask, VADER, gTTS | ❌ None |
| React / TypeScript | React 19, Vite, Gemini API | ✅ Gemini key |

---

## 🐍 Python / Flask Version

### 🌟 Features

- **Sentiment Analysis** — uses [VADER](https://github.com/cjhutto/vaderSentiment) for accurate valence scoring (falls back gracefully to a built-in lexicon if VADER is not installed).
- **Emotion Mapping** — maps compound sentiment scores to one of five emotions: *joy*, *positive*, *neutral*, *negative*, *anger*.
- **Voice Synthesis** — generates an MP3 voiceover via [gTTS](https://github.com/pndurette/gTTS), choosing a distinct accent and speed for each emotion.
- **Modern Dark UI** — clean, responsive single-page frontend with sample text buttons, score bars, and an inline audio player.
- **Zero API keys** — runs entirely offline after `pip install`.

### 🛠️ Technical Stack

- **Backend**: Python 3.9+, Flask
- **Sentiment**: vaderSentiment (optional, falls back to built-in lexicon)
- **TTS**: gTTS (optional, audio generation disabled if absent)
- **Frontend**: Vanilla HTML / CSS / JavaScript (served by Flask)

### 📦 Setup

#### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Ai-voiceover-Empathy-Engine
```

#### 2. Create and activate a virtual environment (recommended)
```bash
python -m venv .venv
# macOS / Linux
source .venv/bin/activate
# Windows
.venv\Scripts\activate
```

#### 3. Install Python dependencies
```bash
pip install -r requirements.txt
```

#### 4. Run the Flask application
```bash
python app.py
```
Open **http://localhost:5000** in your browser.

### 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/`        | Renders the homepage |
| `POST` | `/analyze` | Analyzes text, returns emotion + optional audio URL |
| `GET`  | `/health`  | Service status / dependency availability |

#### `POST /analyze`

**Request body** (JSON):
```json
{ "text": "Today was absolutely incredible!" }
```

**Response** (JSON):
```json
{
  "success": true,
  "emotion": "joy",
  "emotion_description": "Joyful & Uplifting",
  "compound_score": 0.7184,
  "scores": { "positive": 0.545, "negative": 0.0, "neutral": 0.455 },
  "voice_description": "Bright Australian accent — energetic and upbeat",
  "audio_url": "/static/audio/<uuid>.mp3",
  "vader_available": true,
  "gtts_available": true
}
```

### 🧪 How It Works

1. **Analyze** — VADER (or the built-in lexicon) scores the text and produces *pos*, *neg*, *neu*, and *compound* values.
2. **Map** — The compound score is mapped to an emotion: joy (≥ 0.5), positive (≥ 0.05), neutral, negative (≥ −0.5), anger (< −0.5).
3. **Synthesise** — gTTS generates an MP3 using an accent and speed selected for the detected emotion and saves it to `static/audio/`.
4. **Serve** — The frontend plays the audio inline via the browser's native `<audio>` element.

---

## ⚛️ React / TypeScript Version

### 🛠️ Technical Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4.0
- **AI/ML Core**:
  - **Sentiment Analysis**: Gemini 3.1 Flash Lite
  - **Speech Synthesis**: Gemini 2.5 Flash TTS

### 📦 Setup

#### 1. Install dependencies
```bash
npm install
```

#### 2. Configure environment variables
Create a `.env` file and add your Gemini API key:
```env
GEMINI_API_KEY=your_api_key_here
```
*Get a key from the [Google AI Dashboard](https://aistudio.google.com/app/apikey).*

#### 3. Run the development server
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

---

Developed as a technical demonstration for **DarwixAi**.
