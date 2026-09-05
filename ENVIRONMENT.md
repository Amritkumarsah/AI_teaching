# Environment Configuration Specification (ENVIRONMENT.md)

> Comprehensive reference of all environment variables across backend and frontend services.

---

## 1. Backend Configuration (`backend/.env` / `.env`)

| Variable | Description | Required? | Default Value | Fallback Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `APP_NAME` | Name of the AI Teacher service | No | `"AI Teacher Live Classroom"` | Used in OpenAPI docs & headers |
| `APP_VERSION` | Application semver version | No | `"1.0.0"` | Telemetry |
| `PORT` | FastAPI backend HTTP listening port | No | `8000` | Standard FastAPI port |
| `HOST` | Binding network interface | No | `"0.0.0.0"` | Binds to all interfaces |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins | No | `"http://localhost:3000,http://localhost:3001"` | Allow local development |
| `GEMINI_API_KEY` | Google Gemini API key for advanced LLM reasoning | Optional | `""` | Deterministic local RAG & heuristic lesson planner |
| `GEMINI_MODEL` | Target Gemini model identifier | No | `"gemini-1.5-flash"` | Falls back to available tier |
| `TTS_PROVIDER` | Text-to-Speech synthesis provider | No | `"edge_tts"` | Uses Microsoft Edge Neural TTS (100% Free) |
| `TTS_VOICE_FEMALE_EN` | Neural voice identifier for English female tutor | No | `"en-US-AriaNeural"` | High quality neural voice |
| `TTS_VOICE_FEMALE_HI` | Neural voice identifier for Hindi/Hinglish female tutor | No | `"hi-IN-SwaraNeural"` | High quality neural voice |
| `TTS_VOICE_MALE_EN` | Neural voice identifier for English male tutor | No | `"en-US-GuyNeural"` | High quality neural voice |
| `TTS_VOICE_MALE_HI` | Neural voice identifier for Hindi/Hinglish male tutor | No | `"hi-IN-MadhurNeural"` | High quality neural voice |
| `MONGODB_URI` | MongoDB connection URI for persistent session state | Optional | `"mongodb://localhost:27017/ai_teacher"` | In-memory session store if MongoDB is offline |

---

## 2. Frontend Configuration (`frontend/.env.local`)

| Variable | Description | Required? | Default Value |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_BACKEND_URL` | Base HTTP URL of the FastAPI backend | No | `"http://localhost:8000"` |
| `NEXT_PUBLIC_WS_URL` | Base WebSocket URL for real-time live classroom | No | `"ws://localhost:8000"` |
| `NEXT_PUBLIC_DEFAULT_LANGUAGE` | Default teaching language | No | `"hinglish"` |
| `NEXT_PUBLIC_DEFAULT_TUTOR` | Default teacher avatar identity | No | `"Dr. Arya"` |

---

## 3. Sample `.env.example`
```bash
# Server Port & Binding
PORT=8000
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Optional Cloud LLM (Zero cost fallback active if omitted)
# GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Text-to-Speech Settings (Edge TTS is built-in and free)
TTS_PROVIDER=edge_tts
TTS_VOICE_FEMALE_EN=en-US-AriaNeural
TTS_VOICE_FEMALE_HI=hi-IN-SwaraNeural
TTS_VOICE_MALE_EN=en-US-GuyNeural
TTS_VOICE_MALE_HI=hi-IN-MadhurNeural

# Persistent Database (In-memory fallback active if omitted)
MONGODB_URI=mongodb://localhost:27017/ai_teacher
```
