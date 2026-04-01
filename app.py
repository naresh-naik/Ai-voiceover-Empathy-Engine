import os
import uuid
import glob
import time
import logging
from flask import Flask, request, jsonify, render_template, send_from_directory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Optional dependency: vaderSentiment
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    VADER_AVAILABLE = True
    vader_analyzer = SentimentIntensityAnalyzer()
    logger.info("VADER sentiment analyzer loaded successfully.")
except ImportError:
    VADER_AVAILABLE = False
    vader_analyzer = None
    logger.warning("vaderSentiment not found. Falling back to built-in analyzer.")

# Optional dependency: gTTS
try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
    logger.info("gTTS loaded successfully.")
except ImportError:
    GTTS_AVAILABLE = False
    logger.warning("gTTS not found. Audio generation will be disabled.")

app = Flask(__name__)

AUDIO_DIR = os.path.join("static", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

# Maximum age of audio files in seconds (10 minutes)
AUDIO_MAX_AGE = 600

# ---------------------------------------------------------------------------
# Fallback lexicon-based sentiment analyzer
# ---------------------------------------------------------------------------

POSITIVE_WORDS = {
    "good", "great", "excellent", "wonderful", "amazing", "fantastic",
    "happy", "joy", "love", "beautiful", "awesome", "brilliant", "glad",
    "pleased", "delightful", "superb", "outstanding", "perfect", "marvelous",
    "terrific", "nice", "best", "enjoy", "excited", "thrilled", "grateful",
    "thankful", "positive", "optimistic", "cheerful", "charming", "generous",
    "kind", "warm", "proud",
}

NEGATIVE_WORDS = {
    "bad", "terrible", "awful", "horrible", "disgusting", "hate", "sad",
    "angry", "depressed", "miserable", "dreadful", "ugly", "worst",
    "failure", "disappoint", "unfortunate", "pathetic", "frustrating",
    "annoying", "evil", "corrupt", "cruel", "vicious", "painful", "sorry",
    "regret", "worthless", "useless", "stupid", "idiot", "fool",
}

ANGER_WORDS = {
    "angry", "furious", "rage", "hate", "annoyed", "frustrated", "mad",
    "irritated", "livid", "outraged", "hostile", "bitter", "resentful",
    "enraged", "infuriated",
}


def _fallback_analyze(text: str) -> dict:
    """Simple lexicon-based sentiment analysis used when VADER is unavailable."""
    words = text.lower().split()
    pos_count = sum(1 for w in words if w.strip(".,!?;:\"'") in POSITIVE_WORDS)
    neg_count = sum(1 for w in words if w.strip(".,!?;:\"'") in NEGATIVE_WORDS)
    anger_count = sum(1 for w in words if w.strip(".,!?;:\"'") in ANGER_WORDS)
    total = len(words) or 1

    pos_score = pos_count / total
    neg_score = (neg_count + anger_count) / total
    neu_score = max(0.0, 1.0 - pos_score - neg_score)

    compound = (pos_count - neg_count - anger_count) / (total ** 0.5) if total > 0 else 0.0
    compound = max(-1.0, min(1.0, compound))

    return {
        "pos": round(pos_score, 4),
        "neg": round(neg_score, 4),
        "neu": round(neu_score, 4),
        "compound": round(compound, 4),
    }


# ---------------------------------------------------------------------------
# Emotion mapping
# ---------------------------------------------------------------------------

EMOTION_MAP = {
    "joy": {
        "description": "Joyful & Uplifting",
        "voice": {"lang": "en", "tld": "com.au", "slow": False},
        "voice_description": "Bright Australian accent — energetic and upbeat",
        "threshold": lambda s: s["compound"] >= 0.5,
    },
    "positive": {
        "description": "Positive & Warm",
        "voice": {"lang": "en", "tld": "co.uk", "slow": False},
        "voice_description": "Warm British accent — friendly and encouraging",
        "threshold": lambda s: 0.05 <= s["compound"] < 0.5,
    },
    "neutral": {
        "description": "Calm & Neutral",
        "voice": {"lang": "en", "tld": "com", "slow": False},
        "voice_description": "Standard US accent — clear and balanced",
        "threshold": lambda s: -0.05 <= s["compound"] < 0.05,
    },
    "negative": {
        "description": "Somber & Reflective",
        "voice": {"lang": "en", "tld": "ca", "slow": True},
        "voice_description": "Slow Canadian accent — measured and empathetic",
        "threshold": lambda s: -0.5 <= s["compound"] < -0.05,
    },
    "anger": {
        "description": "Tense & Intense",
        "voice": {"lang": "en", "tld": "co.in", "slow": False},
        "voice_description": "Sharp Indian accent — direct and assertive",
        "threshold": lambda s: s["compound"] < -0.5,
    },
}


def detect_emotion(scores: dict) -> str:
    """Return the best-matching emotion label for the given sentiment scores."""
    for emotion, cfg in EMOTION_MAP.items():
        if cfg["threshold"](scores):
            return emotion
    return "neutral"


# ---------------------------------------------------------------------------
# Audio helpers
# ---------------------------------------------------------------------------

def cleanup_old_audio():
    """Remove audio files older than AUDIO_MAX_AGE seconds."""
    now = time.time()
    for filepath in glob.glob(os.path.join(AUDIO_DIR, "*.mp3")):
        if now - os.path.getmtime(filepath) > AUDIO_MAX_AGE:
            try:
                os.remove(filepath)
                logger.debug("Removed old audio file: %s", filepath)
            except OSError:
                pass


def generate_audio(text: str, emotion: str) -> str | None:
    """Generate an MP3 with gTTS and return the URL path, or None on failure."""
    if not GTTS_AVAILABLE:
        return None

    cleanup_old_audio()

    voice_cfg = EMOTION_MAP[emotion]["voice"]
    filename = f"{uuid.uuid4().hex}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)

    try:
        tts = gTTS(text=text, lang=voice_cfg["lang"], tld=voice_cfg["tld"], slow=voice_cfg["slow"])
        tts.save(filepath)
        return f"/static/audio/{filename}"
    except Exception as exc:
        logger.error("gTTS generation failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "vader_available": VADER_AVAILABLE,
        "gtts_available": GTTS_AVAILABLE,
    })


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json(silent=True)
    if not data or not isinstance(data.get("text"), str):
        return jsonify({"success": False, "error": "Request body must be JSON with a 'text' string."}), 400

    text = data["text"].strip()
    if not text:
        return jsonify({"success": False, "error": "Text cannot be empty."}), 400
    if len(text) > 5000:
        return jsonify({"success": False, "error": "Text is too long (max 5 000 characters)."}), 400

    # Sentiment analysis
    if VADER_AVAILABLE:
        scores = vader_analyzer.polarity_scores(text)
    else:
        scores = _fallback_analyze(text)

    emotion = detect_emotion(scores)
    emotion_cfg = EMOTION_MAP[emotion]

    # Audio generation
    audio_url = generate_audio(text, emotion)

    return jsonify({
        "success": True,
        "emotion": emotion,
        "emotion_description": emotion_cfg["description"],
        "compound_score": scores["compound"],
        "scores": {
            "positive": scores["pos"],
            "negative": scores["neg"],
            "neutral": scores["neu"],
        },
        "voice_description": emotion_cfg["voice_description"],
        "audio_url": audio_url,
        "vader_available": VADER_AVAILABLE,
        "gtts_available": GTTS_AVAILABLE,
    })


@app.route("/static/audio/<path:filename>")
def serve_audio(filename):
    return send_from_directory(AUDIO_DIR, filename)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    logger.info("Starting AI Voiceover Empathy Engine on port %d", port)
    app.run(host="0.0.0.0", port=port, debug=debug)
