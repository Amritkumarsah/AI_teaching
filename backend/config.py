import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
# Load both backend/.env and root ../.env
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")
DATA_DIR = BASE_DIR / "data"
SAMPLE_MATERIALS_DIR = BASE_DIR / "sample_materials"
STATIC_DIR = BASE_DIR / "static"
UPLOADS_DIR = DATA_DIR / "uploads"
AUDIO_DIR = STATIC_DIR / "audio"
VIDEO_DIR = STATIC_DIR / "video"

for d in [DATA_DIR, SAMPLE_MATERIALS_DIR, STATIC_DIR, UPLOADS_DIR, AUDIO_DIR, VIDEO_DIR]:
    d.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    app_name: str = "AI Teacher — Adaptive Video Educator"
    app_version: str = "1.0.0"
    base_dir: Path = BASE_DIR
    data_dir: Path = DATA_DIR
    sample_materials_dir: Path = SAMPLE_MATERIALS_DIR
    static_dir: Path = STATIC_DIR
    uploads_dir: Path = UPLOADS_DIR
    audio_dir: Path = AUDIO_DIR
    video_dir: Path = VIDEO_DIR
    
    # Optional Third-Party Keys
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    elevenlabs_api_key: str = os.getenv("ELEVENLABS_API_KEY", "")
    heygen_api_key: str = os.getenv("HEYGEN_API_KEY", "")
    did_api_key: str = os.getenv("DID_API_KEY", "")
    
    # Default Voice Map for Neural TTS (edge-tts)
    voice_map: dict = {
        "en": "en-US-JennyNeural",
        "en-IN": "en-IN-NeerjaNeural",
        "hi": "hi-IN-SwaraNeural",
        "hinglish": "hi-IN-MadhurNeural",
        "es": "es-ES-ElviraNeural",
        "ta": "ta-IN-PallaviNeural",
        "te": "te-IN-ShrutiNeural",
        "bn": "bn-IN-TanishaaNeural",
        "mr": "mr-IN-AarohiNeural"
    }

settings = Settings()
