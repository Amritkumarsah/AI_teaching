# System Architecture & Technical Specification

> **Platform Mission**: Transform educational content into an adaptive, multimodal teaching experience that adheres to the pedagogical cycle:
> $$\text{Understand} \longrightarrow \text{Plan} \longrightarrow \text{Explain} \longrightarrow \text{Demonstrate} \longrightarrow \text{Question} \longrightarrow \text{Evaluate} \longrightarrow \text{Adapt} \longrightarrow \text{Continue}$$

---

## 1. End-to-End System Hierarchy

```text
┌────────────────────────────────────────────────────────────────────────┐
│                               FRONTEND                                 │
│  - Classroom Studio (SVG Viseme Avatar + KaTeX / SVG Chalkboard)       │
│  - Checkpoint Modal (Speech Recognition STT + Text Input)              │
│  - Document Upload & Natural-Language Learner Profiler                 │
│  - Grounded RAG Citation Provenance Drawer                             │
│  - Student Dashboard (Radar Mastery, Study Streaks, Remediation Traps) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST / SSE / WebSockets
┌───────────────────────────────────▼────────────────────────────────────┐
│                             API GATEWAY                                │
│  - Reverse Proxy / Route Dispatcher                                    │
│  - JWT Authentication & RBAC Middleware (`STUDENT`, `TEACHER`, `ADMIN`)│
│  - Rate Limiting, Security Headers (Helmet, CORS), Payload Validation   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Internal Dispatch
┌───────────────────────────────────▼────────────────────────────────────┐
│                          BACKEND SERVICES                              │
│  ├── Auth & User Service (Bcrypt, JWT, Role Permissions)               │
│  ├── Learner Profile Service (Preferences, Strengths, Weaknesses)      │
│  ├── Document Processing Service (PDF/DOCX/PPTX Chunker & Sanitizer)   │
│  ├── Lesson Planning Service (Time Budgeting: 5m, 20m, 60m)            │
│  ├── Teaching State Machine (Explain, Demonstrate, Checkpoint)         │
│  ├── Assessment & Remediation Service (Misconception Diagnosis)         │
│  ├── Voice & Media Pipeline (Neural Speech Synthesis & Visemes)        │
│  ├── Video Rendering Queue (Scene Assembly & FFmpeg MP4 Compositor)   │
│  └── Analytics & Progress Service (Cumulative Mastery & Next Topics)   │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
┌───────────────────▼────────────────┐  ┌───────────▼────────────────────┐
│              AI LAYER              │  │           RAG ENGINE           │
│  ├── Model Router & Provider       │  │  ├── Document Parsers          │
│  │   ├── Primary: Local Heuristic  │  │  │   (PDF, DOCX, PPTX, TXT)    │
│  │   └── Cloud: Google Gemini      │  │  ├── Prompt Injection Defense  │
│  ├── Script & Visual Synthesizer   │  │  ├── Semantic Section Chunker  │
│  │   (Physics, Math, CS, Bio, Hist)│  │  ├── Vector Store (Embeddings) │
│  └── Misconception Classifier      │  │  └── Top-K Cosine Matcher with │
│      (Continuous force trap, etc.) │  │      Provenance Citations      │
└───────────────────┬────────────────┘  └───────────┬────────────────────┘
                    │                               │
┌───────────────────▼───────────────────────────────▼────────────────────┐
│                             DATABASE                                   │
│  MongoDB (Primary Datastore via Mongoose schemas & compound indexes)   │
│  - 17 Collections (Users, Profiles, Documents, Chunks, Lessons, etc.)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ External API Integrations
┌───────────────────────────────────▼────────────────────────────────────┐
│                         EXTERNAL SERVICES                              │
│  - Google Gemini API (Cloud LLM Reasoning — Optional)                 │
│  - Microsoft Edge Neural TTS (Free Multilingual Speech Protocol)       │
│  - W3C Web Speech API (Free Client-side Voice Recognition STT)         │
│  - Local FFmpeg / imageio-ffmpeg (Free Programmatic MP4 Rendering)     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Subsystem Architectures

### A. Authentication Architecture
* **Tokens**: JWT (JSON Web Tokens) with cryptographic signature and configurable expiry (`7d`).
* **Storage**: Stored in HTTP-only secure cookies or Authorization Bearer header.
* **Role-Based Access Control (RBAC)**:
  - `STUDENT`: Access to classroom, dashboard, own uploaded documents, and quizzes.
  - `TEACHER`: Access to student progress overview, custom lesson templates, and curriculum paths.
  - `ADMIN`: Full system visibility, API telemetry, and user management.
* **Demo Mode Pass-through**: Deterministic student context available for offline zero-key evaluation.

### B. Document Processing Architecture
* **Supported Ingestion**: PDF, DOCX, PPTX, Markdown, and TXT.
* **Extraction Pipeline**:
  1. File type validation and MIME verification.
  2. Text extraction via semantic parsers.
  3. Prompt injection sanitization: redacts prompt override tokens (`Ignore all previous instructions`, etc.).
  4. Header-aware semantic chunking: splits by Chapters and Sections (averaging 500 characters per chunk).
  5. Chunk metadata enrichment: attaches `document_id`, `page_number`, `chapter`, and `section`.

### C. RAG (Retrieval-Augmented Generation) Architecture
* **Indexing**: In-memory TF-IDF and Cosine vector representations for fast, zero-dependency local retrieval.
* **Query Processing**: Normalizes queries, removes stop-words, and scores chunks against term-frequency matrices.
* **Grounded Attribution**: Every retrieved chunk returned to the AI Teacher includes citation provenance (`documentName`, `section`, `pageNumber`, and `relevanceScore`).
* **General Knowledge Fallback**: When no documents are uploaded, the system explicitly disclaims lower-confidence general knowledge mode.

### D. AI Teacher & Pedagogical State Machine Architecture
* The session is managed as an explicit finite-state machine:
  1. `INTRODUCTION`: Welcomes learner, frames objectives, and outlines time budget.
  2. `EXPLANATION`: Delivers concise conceptual breakdown with synthesized neural voice.
  3. `DEMONSTRATION`: Displays synchronized Chalkboard (KaTeX equations, force vector diagrams, code traces).
  4. `QUESTION`: Pauses audio/video; prompts student with conceptual or application questions.
  5. `EVALUATE`: Rubric semantic matching classifies student understanding.
  6. `ADAPT`: If a misconception is detected, halts forward progress and invokes an **alternative mental model** with a new analogy before re-testing.
  7. `CONTINUE`: Advances to the next section upon mastery.

### E. Video Generation Architecture
* **Asynchronous Queue**: Long video rendering jobs are decoupled from HTTP request loops via a `video_jobs` queue.
* **Scene Composition**:
  - Teacher Avatar frame composited with mouth movement visemes.
  - Chalkboard canvas rendered as side-by-side or picture-in-picture visual.
  - Neural audio track multiplexed via bundled `ffmpeg` to produce a standalone 1080p/720p MP4.

### F. Voice Architecture
* **Text-to-Speech (TTS)**: Microsoft Edge Neural TTS protocol providing natural accents:
  - English (`en-US-JennyNeural`, `en-IN-NeerjaNeural`)
  - Hindi (`hi-IN-SwaraNeural`)
  - Hinglish (`hi-IN-MadhurNeural`)
  - Tamil (`ta-IN-PallaviNeural`)
  - Spanish (`es-ES-ElviraNeural`)
* **Speech-to-Text (STT)**: Native browser W3C Web Speech API (`SpeechRecognition`) offering real-time zero-latency oral answers with zero server API cost.

### G. Assessment & Remediation Architecture
* **Checkpoint Evaluation**: Semantic rubric matching (keyword co-occurrence, token overlap, and misconception pattern classification) avoids brittle string equality.
* **Misconception Catalog**: Detects known pedagogical traps:
  - *Continuous Force Trap*: Assuming ongoing velocity requires ongoing force ($v \propto F$).
  - *Gravitational Fallacy*: Conflating mass-dependent weight with universal gravitational acceleration ($g$).
  - *Action-Reaction Pair Error*: Believing 3rd-law force pairs act on the same isolated body.
* **Adaptive Remediation**: Re-explains using fresh physical analogies (e.g. frictionless puck in deep space) and asks a diagnostic follow-up question.

### H. Analytics & Progress Architecture
* **Mastery Radar**: Tracks student scores across academic disciplines (Mechanics, Calculus, Algorithms, Electromagnetism, Thermodynamics).
* **Cognitive Memory Track**: Persists unresolved misconceptions in `weak_concepts` and mastered items in `strong_concepts`.
* **Curriculum Dependencies**: Recommends prerequisite and sequential topics based on past performance.
