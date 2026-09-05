# API Requirements & Third-Party Service Disclosure

> **Architectural Principle**: The AI Teacher platform is engineered around a **Modular Provider Pattern**. It operates 100% out-of-the-box in **Zero-Key Local Demo Mode** without requiring any paid API keys or commercial accounts, while providing seamless plug-and-play expansion for cloud LLMs, avatars, and object storage.

---

## 1. Third-Party Services & API Disclosure Matrix

Below is the complete audit and disclosure of all external services, cloud providers, and local engines used across the platform.

| Service Category | Provider / Engine | Purpose | Free / Paid | API Key Required? | Environment Variable | Known Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **LLM Provider** | **Google Gemini** (`gemini-1.5-flash`) | Dynamic open-ended lesson planning, conceptual reasoning, and interactive student Q&A | **Free Tier Available** (Paid for high scale) | **Optional** (`GEMINI_API_KEY`) | `GEMINI_API_KEY` | 15 RPM / 1,500 RPD rate limits on free tier. Automatically falls back to deterministic Heuristic Planner when key is absent. |
| **LLM Provider (Fallback)** | **Built-in Pedagogical Heuristic Engine** | Structured offline curriculum generation, deterministic lesson synthesis | **100% Free** | **No** | None | Limited to rule-based pedagogical templates and pre-indexed misconception rubrics. |
| **Embedding Provider** | **MongoDB Text Index / Local TF-IDF** | Keyword & semantic matching for document chunk retrieval | **100% Free** | **No** | None | Lexical & n-gram frequency matching; lacks dense 1536-dimensional semantic nuance of large embedding models. |
| **Embedding Provider (Cloud)** | **OpenAI / Gemini Embeddings** | High-dimensional dense vector embeddings for RAG | **Paid / Free Tier** | **Optional** (`OPENAI_API_KEY`) | `OPENAI_API_KEY` | Requires external network connectivity and credit balance. |
| **Speech-To-Text (STT)** | **W3C Web Speech API** (`SpeechRecognition`) | Real-time student voice transcription in interactive teaching sessions | **100% Free** | **No** | None | Requires Chromium-based browser (Chrome, Edge, Brave); requires microphone permission. |
| **Speech-To-Text (Fallback)** | **OpenAI Whisper API** | High-accuracy multilingual audio transcription | **Paid per audio minute** | **Optional** (`OPENAI_API_KEY`) | `OPENAI_API_KEY` | Incurs per-minute API cost; adds 1–2s network latency over browser-native STT. |
| **Text-To-Speech (TTS)** | **Microsoft Edge Neural Speech** (`edge-tts`) | Natural, expressive teacher voice synthesis in 5+ languages | **100% Free** | **No** | None | Dependent on public WebSocket protocol; fallback to HTML5 Web Speech synthesis if offline. |
| **Text-To-Speech (Fallback)** | **Browser Web Speech API** (`SpeechSynthesis`) | Instant client-side speech audio synthesis | **100% Free** | **No** | None | Voice accents and prosody vary depending on client operating system and installed voices. |
| **Avatar Provider** | **SVG Canvas Viseme Engine** | 60 FPS animated teacher avatar with lip-sync phonemes, blinking, and head tilt | **100% Free** | **No** | None | 2D stylized vector visual style (not photorealistic human video). |
| **Avatar Provider (Cloud)** | **HeyGen / D-ID API** | Photorealistic commercial talking-head video generation | **Commercial Paid** | **Optional** (`HEYGEN_API_KEY`) | `HEYGEN_API_KEY` | Expensive per-minute pricing; async video generation takes 30–90 seconds per scene. |
| **Storage Provider** | **Local Disk Storage** (`uploads/` & `static/`) | Secure storage of uploaded PDFs, DOCXs, and generated video/audio assets | **100% Free** | **No** | None | Storage capacity bounded by host disk space; ephemeral on stateless container platforms unless persistent volume attached. |
| **Storage Provider (Cloud)** | **AWS S3 / Cloudinary** | Scalable multi-region asset storage for documents and videos | **Paid after Free Tier** | **Optional** (`AWS_ACCESS_KEY_ID`) | `AWS_S3_BUCKET` | Incurs bandwidth and storage fees; requires AWS IAM policy configuration. |
| **Vector Database** | **MongoDB Text & Chunk Indexes** | Compound indexing for document chunk filtering and keyword relevance search | **100% Free** | **No** | `MONGODB_URI` | Performs inverted text search; does not compute cosine similarity over floating-point vector arrays. |
| **Vector Database (Cloud)** | **Qdrant / MongoDB Atlas Vector Search** | HNSW index vector database for dense vector retrieval | **Free Tier Available** | **Optional** (`QDRANT_URL`) | `QDRANT_URL` | Additional infrastructure container or cloud service to provision and monitor. |
| **UI Component Libraries** | **Lucide Icons, KaTeX, Recharts** | Vector icons, LaTeX mathematical typography, and learning analytics charts | **100% Free (MIT)**| **No** | None | Client-side bundle size footprint (~300kB gzip). |

---

## 2. Zero-Key Demo Mode Guarantee

The platform guarantees **100% operational functionality without providing any API keys**:

1. **Lesson Planner**: Runs the deterministic pedagogical heuristic engine with Zod schema validation.
2. **Document RAG**: Ingests, sanitizes, and indexes documents using local text extraction and compound MongoDB text indexes.
3. **Adaptive Teacher**: Runs the 9-state teaching machine with semantic rubric matching and misconception diagnosis.
4. **Voice Engine**: Uses the W3C Web Speech API for voice input and Edge Neural TTS / browser SpeechSynthesis for voice output.
5. **Video & Avatar**: Renders subject-aware chalkboard graphics and animates the SVG Canvas Viseme Avatar.
6. **Analytics & Paths**: Computes study time, streaks, topic mastery, and recommendations in MongoDB.

---

## 3. Cloud Mode Activation Guide

To activate cloud capabilities:

1. Obtain a **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).
2. Add to `.env`:
   ```bash
   GEMINI_API_KEY=AIzaSy...
   ```
3. Restart the API:
   ```bash
   npm run dev:api
   ```
4. The system automatically detects the key and routes lesson generation and open-ended student Q&A to Gemini 1.5 Flash.
