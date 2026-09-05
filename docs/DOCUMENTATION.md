# 🎓 AI Teacher — Project Documentation

---

## 1. Problem Statement

Traditional digital education remains trapped between two suboptimal paradigms: pre-recorded video lectures (which are monolithic, static, and cannot adapt when a student struggles) and text-based AI chatbots (which dump walls of unformatted text without visual pacing, vocal demonstration, or active pedagogical guidance). Neither system teaches the way a real human educator does.

**AI Teacher** bridges this gap by creating an end-to-end, adaptive educational platform that takes any uploaded curriculum document or plain topic request and transforms it into a personalized teaching session delivered by a human-like avatar with natural neural voice, synchronized visual whiteboard, interactive checkpoints, misconception diagnosis, and cross-session memory.

---

## 2. Solution Overview

**AI Teacher** models the complete pedagogical lifecycle of a master tutor:
$$\text{Understand} \longrightarrow \text{Plan} \longrightarrow \text{Explain} \longrightarrow \text{Demonstrate} \longrightarrow \text{Question} \longrightarrow \text{Evaluate} \longrightarrow \text{Adapt} \longrightarrow \text{Continue}$$

Given either an uploaded document (PDF, DOCX, PPTX, TXT) or a raw topic request, paired with natural-language instructions (e.g., *"I'm a beginner, teach me Chapter 4 in 20 minutes, in Hindi, with simple examples, and quiz me"*), the system executes a dual-task architecture:
1. **Task 1 (AI Teaching Video Generation)**: It parses the learner profile, retrieves ground-truth chunks using RAG, plans a time-budgeted lesson, generates a spoken teaching script with subject-specific visual reasoning, synthesizes natural neural speech with phoneme visemes, and composites an avatar with on-screen whiteboard visuals into a video stream.
2. **Task 2 (Interactive & Adaptive Engine)**: It pauses the lesson at checkpoints to present varied questions, evaluates answers against semantic rubrics, diagnoses specific misconceptions (e.g., Aristotelian motion errors or gravitational fallacies), branches into alternative mental models with new analogies, handles live student follow-up Q&A, runs a final quiz, and persists student mastery in a cross-session learner profile.

---

## 3. Key Features

- [x] **Learning from uploaded material** (PDF / DOCX / PPTX / notes) via RAG with chunk provenance.
- [x] **Topic-based teaching without uploaded material** in an explicit General Knowledge Mode.
- [x] **AI-generated, time-aware, level-aware lesson plans** (5m vs. 20m vs. 60m vs. 7-day roadmaps).
- [x] **Personalized teaching** (beginner to advanced, intuitive to rigorous, multilingual).
- [x] **Human-like teaching interaction** (explain → demonstrate → question → evaluate → adapt → continue).
- [x] **Video-based AI Teacher** (lip-synced avatar + voice + dynamic on-screen chalkboard visuals).
- [x] **Multilingual teaching with mid-lesson language switching** (Hindi, English, Hinglish, Spanish, Tamil) preserving lesson state.
- [x] **Subject-aware visual explanations** (Math equations, Physics vector simulations, Biology process cycles, CS code traces, History timelines).
- [x] **Student questioning and assessment** (MCQ, short-answer, applied problems, "explain in your own words").
- [x] **Misconception detection and adaptive re-teaching** using distinct mental models and analogies.
- [x] **Final assessment with structured learning report** (overall score, strengths, weak areas, next recommendations).
- [x] **Persistent learner profile across sessions** via SQLite database with personalized recall warmups.
- [x] **AI-generated learning path for broad topics** (ordered multi-module dependency roadmap).

---

## 4. System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Next.js 16 / React 19)                  │
│  - Upload Studio (Document Ingestion & Instruction Profiler)           │
│  - Classroom Studio (Talking Avatar + Synced Chalkboard Visuals)       │
│  - Checkpoint Modal (Interactive Questions & Misconception Branching)  │
│  - Live Q&A Drawer (Student Follow-Up with Grounded Voice Response)    │
│  - RAG Provenance Drawer & Learner Dashboard (Curriculum Roadmap)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST / SSE API
┌───────────────────────────────────▼────────────────────────────────────┐
│                    FASTAPI BACKEND ORCHESTRATOR                        │
│                                                                        │
│ 1. Document Ingestion & Parsing (PDF/DOCX/PPTX/TXT semantic chunker)   │
│ 2. RAG Vector Engine (TF-IDF/Cosine projection, provenance citations)  │
│ 3. Learner Profiler & Lesson Planner (time-budget & level adaptation) │
│ 4. Subject-Aware Visual Reasoning Engine (domain-tailored cues)        │
│ 5. Multilingual Media Pipeline (edge-tts Neural Audio + Visemes + MP4) │
│ 6. Interaction & Misconception Diagnosis Engine (rubrics & branching)  │
│ 7. Learner Profile Store & Curriculum Path Generator (SQLite database) │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Details
- **Frontend**: Next.js 16 (React 19) with Tailwind CSS, Lucide icons, and Canvas animations. Houses the split-screen Classroom Studio, audio streaming player, dynamic chalkboard, and interactive modals.
- **Teaching State Machine**: Coordinates node-by-node delivery, pauses at checkpoint timestamps, waits for user response, routes evaluation verdicts, and branches to alternative explanations when misconceptions arise.
- **Document Ingestion**: Parses PDF, DOCX, PPTX, and TXT using `pypdf`, `python-docx`, and `python-pptx` with semantic heading preservation and page tracking.
- **RAG Knowledge Grounding**: Indexes chunks into a vector similarity store, retrieves top-$k$ evidence chunks, records provenance (source file, section, page, score), and provides an explicit General Knowledge fallback.
- **Lesson Planner**: Generates structured JSON plans sized to the time budget (5 min: 1–2 concepts; 20 min: 3–4 concepts; 60 min: 5–6 concepts; 7 days: multi-module curriculum).
- **Script & Visual Reasoning**: Synthesizes spoken scripts in the chosen language alongside subject-tailored visual assets (vector simulations, equations, flowcharts, code traces).
- **Media Pipeline**: Generates neural audio via Microsoft `edge-tts`, computes phoneme visemes for avatar mouth lip sync, and renders composite MP4 videos using bundled `imageio-ffmpeg`.
- **Interaction & Assessment**: Evaluates student responses against concept rubrics, identifies known misconceptions, provides alternative analogies, and builds structured post-lesson report cards.
- **Learner Profile Store**: SQLite database (`backend/data/learner_profiles.db`) storing student records, concept mastery scores, and historical misconceptions.

**Repository Structure:**
```
/frontend
  ├── src/app/page.tsx               — Main studio orchestrator & classroom view
  ├── src/components/TeacherAvatar.tsx     — Viseme lip-synced talking educator avatar
  ├── src/components/ChalkboardVisual.tsx — Subject-aware dynamic whiteboard
  ├── src/components/CheckpointModal.tsx  — Concept question & misconception modal
  ├── src/components/StudentFollowUpDrawer.tsx — Mid-lesson live student Q&A drawer
  ├── src/components/VideoPromptModal.tsx      — Studio text-to-video prompt viewer
  ├── src/components/ComparisonPlansModal.tsx — 5m / 20m / 60m side-by-side viewer
  ├── src/components/RAGProvenanceModal.tsx   — Source citations & chunks drawer
  ├── src/components/LearningReportModal.tsx  — End-of-lesson mastery report card
  └── src/components/DashboardView.tsx        — Persistent profile & curriculum path
/backend
  ├── main.py                        — FastAPI application endpoints
  ├── config.py                      — Settings, paths, and model configs
  ├── services/
  │   ├── document_parser.py         — PDF/DOCX/PPTX/TXT parser & chunker
  │   ├── rag_engine.py              — Vector store & provenance retrieval
  │   ├── learner_profiler.py        — Free-text instruction parser
  │   ├── lesson_planner.py          — Time-budget & level-aware planner
  │   ├── script_visual_generator.py — Visual reasoning & spoken script generator
  │   ├── media_pipeline.py          — Neural TTS, visemes, and MP4 video renderer
  │   ├── assessment_engine.py       — Rubric evaluation & misconception diagnosis
  │   ├── learner_profile_store.py   — SQLite persistent student profile database
  │   └── learning_path_generator.py — Multi-module curriculum dependency tracks
  └── sample_materials/             — Pre-loaded materials (Newton's Laws, Photosynthesis, Bubble Sort)
/docs
  ├── README.md                      — Quickstart and overview
  ├── DOCUMENTATION.md               — Complete 17-section technical report
  └── DEMO_VIDEO_SCRIPT.md           — 5-6 min timestamped presenter demo script
/tests                               — Automated pytest test suites
```

---

## 5. AI/ML Models Used

| Purpose | Model / Service | Why Chosen |
|---|---|---|
| **Lesson Planning & Script Generation** | Pedagogical LLM Agent / Deterministic Structured Synthesis | Ensures zero hallucination, strict adherence to time budget, level calibration, and structured JSON outputs |
| **Embeddings & Vector Search** | TF-IDF / Sublinear Term Frequency Vector Indexing + Cosine Projection | Instant local execution, zero API key requirement, reproducible similarity scores, and transparent chunk provenance |
| **Answer Evaluation & Misconception Diagnosis** | Semantic Rubric Grader & Pattern-Based Misconception Engine | Semantic keyword matching against physical concepts, robust classification (`CORRECT`, `MISCONCEPTION`, `PARTIALLY_CORRECT`, `NO_UNDERSTANDING`) |
| **Text-to-Speech (TTS)** | Microsoft Neural Speech (`edge-tts`) | Hyper-realistic human voices (`hi-IN-SwaraNeural`, `en-US-JennyNeural`, `hi-IN-MadhurNeural`), zero cost, native regional accents, multilingual |
| **Talking Avatar** | Real-Time Canvas Viseme Lip-Sync & Micro-Animation Engine | Low-latency client animation, phoneme mouth sync, natural eye blinking, breathing tilts, no external API latency |
| **Video Compositing** | Bundled `imageio-ffmpeg` (FFmpeg v7.1) | Zero system dependency on pre-installed ffmpeg, reliable cross-platform MP4 generation with audio/video multiplexing |

---

## 6. RAG Implementation

- **Document Parsing**: Utilizes `pypdf` for PDF documents, `python-docx` for Word documents, `python-pptx` for presentations, and raw text reader with UTF-8 encoding.
- **Chunking Strategy**: Semantic section chunking based on document heading patterns (`Chapter X`, `X.Y Section`, Markdown `#`, or uppercase titles). Preserves heading titles, paragraph cohesion, and original page numbers. Minimum chunk size: 15 words; maximum: 150 words.
- **Vector Store**: In-memory and persistent vector index with term-frequency inverse-document-frequency (TF-IDF) scoring and cosine similarity ranking.
- **Retrieval**: Top-$k$ chunks ($k=3$ to $6$) ranked by cosine similarity with keyword boosting for core concept terms.
- **Grounding / Hallucination Mitigation**: Explanations are strictly grounded in retrieved chunks. When no document is uploaded, the engine enters **General Knowledge Mode**, flags `is_grounded: False`, and issues a transparent notice to the student.
- **Provenance / Verifiability**: Every retrieved chunk includes `chunk_id`, `source_file`, `page_number`, `section_title`, and `relevance_score`. Verifiable via the top navigation bar "RAG Grounding" button or `/api/debug/rag?query=X`.

---

## 7. Prompt / Agent Architecture

The agent executes an 8-stage state machine:
1. **Understand**: Parses free-text user instructions into structured learner profiles.
2. **Plan**: Selects concepts and allocates minutes according to time budget.
3. **Explain**: Generates clear spoken scripts in the requested language.
4. **Demonstrate**: Renders subject-appropriate dynamic whiteboard visuals.
5. **Question**: Pauses at checkpoints to present a concept question.
6. **Evaluate**: Grades student response against pedagogical rubrics.
7. **Adapt**: Diagnoses misconceptions, introduces alternative mental models, and re-checks.
8. **Continue**: Advances to the next concept or final assessment report.

### Representative Prompts & System Instructions

#### Lesson Planner System Prompt:
```
You are an expert curriculum designer. Given a target topic, learner level (beginner/intermediate/advanced),
target time budget (5 min / 20 min / 60 min), and retrieved textbook chunks:
1. Generate an ordered sequence of concepts sized precisely to the time budget.
2. 5 min budget: Exactly 1-2 core concepts, ultra-concise, 1 checkpoint question.
3. 20 min budget: 3-4 concepts, real-life analogies, 2-3 checkpoint questions.
4. 60 min budget: 5-6 concepts, rigorous derivations, applied problem sets.
5. Output valid JSON adhering strictly to the LessonPlan schema.
```

#### Answer Evaluation & Misconception System Prompt:
```
You are a senior educator evaluating a student's answer against a conceptual rubric.
1. Classify the answer as CORRECT, PARTIALLY_CORRECT, MISCONCEPTION, or NO_UNDERSTANDING.
2. Check for known classical traps:
   - Aristotelian Fallacy: Believing continuous motion requires continuous force.
   - Gravitational Fallacy: Conflating greater gravitational force with greater acceleration.
   - Third Law Fallacy: Assuming action-reaction pairs cancel each other on the same object.
3. If a misconception is detected, provide an alternative mental model and analogy.
```

---

## 8. Personalization Approach

The `LearnerProfiler` translates natural-language inputs into five structured parameters:
- **Level**: Beginner, Intermediate, Advanced, or School Grade (e.g. Class 8).
- **Time Budget**: 5 minutes, 20 minutes, 60 minutes, or multi-day (e.g. 7 days).
- **Language**: English, Hindi, Hinglish, Spanish, Tamil.
- **Teaching Style**: Intuitive / Analogy-first, Rigorous / Mathematical, Practical / Code-first.
- **Goal**: Conceptual clarity, Exam preparation, Quick revision.

### Time-Budget Comparison Evidence (Saved Artifacts):

| Budget | Concept Count | Planned Mins | Focus & Checkpoints |
|---|---|---|---|
| **5-Minute Plan** | **2 concepts** | 4 mins | Inertia Core + Action-Reaction (1 MCQ Checkpoint) |
| **20-Minute Plan** | **4 concepts** | 16 mins | Galileo Insight + F=ma + Free Fall Vacuum + Rockets (3 Checkpoints) |
| **60-Minute Plan** | **5 concepts** | 21 mins | Complete Derivations + Elevator Free-Fall Apparent Weight (4 Checkpoints) |

*(Generated and saved in `backend/data/comparison_5min.json`, `backend/data/comparison_20min.json`, and `backend/data/comparison_60min.json`)*.

---

## 9. Assessment Methodology

- **Checkpoint Moments**: Lessons pause automatically after key concepts to check intuition.
- **Question Types**: Multiple Choice (MCQ), Short Answer, "Explain in Your Own Words", and Applied Problems.
- **Rubric Grading**: Matches conceptual tokens and semantic requirements rather than exact strings.
- **Misconception Diagnosis**: Identifies specific mental blockages, halts forward progression, and re-explains using an unshared analogy (e.g., air-hockey puck in space, feather & hammer on the Moon).
- **Learning Report Structure**:

```text
Topic: Newton's Laws of Motion
Overall Score: 92% (Grade A - Passed with Distinction)
Learner Level: Beginner
Concepts Mastered:
  ✓ Galileo's Insight & Inertia (First Law)
  ✓ The Mathematical Engine: F = ma (Second Law)
  ✓ Gravitational Equality in Free Fall
  ✓ Action-Reaction Pairs: Rockets & Earth Recoil (Third Law)
Strengths:
  • Strong grasp of Newton's First Law and mass as inertia.
  • Understands difference between velocity and acceleration.
  • Correctly identified action-reaction pairs in propulsion.
Misconceptions Addressed & Remediated:
  • Aristotelian Fallacy (Motion requires continuous force) -> Resolved with air-hockey puck analogy.
Recommended Next Module: Work, Energy, and Power in Dynamics (Prerequisites Met)
```

---

## 10. Multilingual Implementation

- **Supported Languages**: English (`en`), Hindi (`hi`), Hinglish (`hinglish`), Spanish (`es`), Tamil (`ta`).
- **Mid-Lesson Language Switching**: The student can change the language dropdown in the top header at any point during a video lesson. The avatar smoothly re-renders the script and voice in the newly selected language while preserving the student's current concept position and score state.
- **Material vs. Teaching Language Mismatch**: The system cleanly ingests English documents and generates explanations, on-screen chalkboard text, and neural voice in Hindi or Hinglish without cross-language pollution.

---

## 11. Voice Implementation

- **Engine**: Microsoft Neural Speech (`edge-tts`) with native regional accents.
- **Voice Mapping**:
  - Hindi: `hi-IN-SwaraNeural` (clear, warm, energetic educator tone).
  - Hinglish: `hi-IN-MadhurNeural` (natural conversational bilingual cadence).
  - English: `en-US-JennyNeural` / `en-IN-NeerjaNeural`.
  - Spanish: `es-ES-ElviraNeural`.
  - Tamil: `ta-IN-PallaviNeural`.
- **Viseme Synchronization**: Generates timestamped phoneme mouth shapes (`open_a`, `open_e`, `round_o`, `dental_t`, `fricative_f`, `closed_m`) driving avatar lip-sync animations.

---

## 12. Avatar & Video Generation Approach

- **Avatar Rendering**: Animated SVG/Canvas educator avatar ("Dr. Arya") with real-time lip-sync mouth oscillation, natural blinking cycles (3.8s interval), and subtle head tilt micro-movements.
- **Subject-Aware Visual Reasoning Heuristics**:
  - **Physics**: Renders interactive vector force diagrams (Normal force, Gravity, Applied force, Friction) with interactive mass and force sliders.
  - **Mathematics**: Step-by-step LaTeX derivations rendered with illuminated formulas.
  - **Biology**: Multi-stage biochemical process flowcharts (e.g. Calvin Cycle, photolysis).
  - **Computer Science**: Monospace code viewer with active line highlighter and array memory inspection.
  - **History**: Chronological event timeline cards.
- **Video Compositing**: Uses bundled `imageio-ffmpeg` to multiplex audio, chalkboard visual frames, and subtitles into downloadable `.mp4` video files.
- **Studio Text-to-Video Master Prompts**: Outputs photorealistic 3-clip prompts (Clip A: Talking Shot, Clip B: Translucent Holographic HUD Panel, Clip C: Checkpoint Return) compatible with Sora, Veo, and Runway Gen.

---

## 13. APIs and Third-Party Services

| Service | Purpose | Free Tier / Cost Note |
|---|---|---|
| **Microsoft Neural Speech (`edge-tts`)** | Primary multilingual voice generation | 100% Free, zero API key required |
| **bundled `imageio-ffmpeg`** | Server-side MP4 video rendering | 100% Free, bundled standalone binary |
| **SQLite3 (Python Standard Library)** | Persistent learner profile storage | 100% Free, local zero-config database |
| **OpenAI / Claude API (Optional)** | Optional cloud LLM reasoning | Configurable via `.env` with local deterministic fallback |
| **ElevenLabs API (Optional)** | Optional studio voice synthesis | Configurable via `.env` |
| **HeyGen / D-ID API (Optional)** | Optional cloud avatar video rendering | Configurable via `.env` |

---

## 14. Setup Instructions

```bash
# 1. Clone repository
git clone <repo-url>
cd ai-teacher

# 2. Configure environment
cp .env.example .env

# 3. Start Backend Server (FastAPI on Port 8000)
cd backend
pip install -r requirements.txt
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# 4. Start Frontend Client (Next.js on Port 3000)
cd ../frontend
npm install
npm run dev

# 5. Run Automated Tests
cd ..
python -m pytest tests/ -v
```

---

## 15. Deployment Instructions

- **Containerized Deployment**:
  ```bash
  docker compose up -d --build
  ```
- **Live Ports**:
  - Frontend Web UI: `http://localhost:3000`
  - Backend API & Swagger Docs: `http://localhost:8000/docs`
- **Environment Variables**: See `.env.example` for optional third-party commercial keys.

---

## 16. Known Limitations

1. **3D Molecular Chemistry**: Chemical formulas are rendered as 2D balanced equations; 3D interactive WebGL protein structures are flagged for future enhancement.
2. **Scanned Handwritten Notes OCR**: OCR is calibrated for clear digital text; heavily cursive handwriting requires high DPI images.
3. **Speech-to-Text Input**: Speech input uses Web Speech API in supported browsers; text input is fully supported across all browsers.

---

## 17. Future Improvements

1. **Full-Duplex Conversational Streaming**: WebRTC live audio conversation for uninterrupted real-time voice interruptions.
2. **Multimodal Student Vision**: Webcam attention and confusion detection to automatically slow down the lesson when eye-tracking indicates distraction.
3. **Interactive 3D WebGL Labs**: Embedded virtual laboratory experiments for chemistry titrations and optical laser benches.
4. **Collaborative Peer Classrooms**: Allowing multiple students to join Dr. Arya's classroom session simultaneously.
