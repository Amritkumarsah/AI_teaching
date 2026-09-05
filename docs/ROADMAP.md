# AI Teacher — 12-Phase Development Roadmap

This roadmap governs the incremental implementation and verification of the AI Teacher platform. Each phase must be verified before proceeding to subsequent phases.

---

### Phase 1: Foundation
* **Goal**: Establish project directory structure, package configuration, and base runtime health.
* **Deliverables**:
  - Unified monorepo structure (`packages/types`, `apps/api`, `apps/web`).
  - Base Express server booting cleanly on port 5000 with health-check endpoint (`/api/health`).
  - Local MongoDB connection verification (`mongodb://127.0.0.1:27017/ai_teacher`).
  - Strict TypeScript configurations with zero lint/compilation errors.

### Phase 2: Authentication & RBAC
* **Goal**: Production-grade identity and role authorization.
* **Deliverables**:
  - Password hashing with `bcryptjs`.
  - JWT creation and verification middleware with role gates (`STUDENT`, `TEACHER`, `ADMIN`).
  - Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
  - Student onboarding preference storage (`POST /api/user/onboarding`).

### Phase 3: Document Processing & Ingestion
* **Goal**: Robust multi-format document intake with sanitization.
* **Deliverables**:
  - File upload handler (`multer`) supporting PDF, DOCX, PPTX, TXT, and Markdown.
  - Text extraction and prompt-injection sanitization.
  - Semantic section and chapter chunker.
  - Chunk storage in `document_chunks` collection.

### Phase 4: RAG & Vector Search
* **Goal**: Grounded retrieval with transparent source citations.
* **Deliverables**:
  - Term-frequency and Cosine similarity vector search across chunk embeddings.
  - Grounded context synthesis with source filename, section, page, and similarity score.
  - General knowledge fallback mode when no documents are uploaded.

### Phase 5: Lesson Planner & Visual Reasoning
* **Goal**: Structured, time-budgeted pedagogical curricula with domain visuals.
* **Deliverables**:
  - Time budgeting: 5m sprint (1 concept), 20m dive (3 concepts + checkpoints), 60m masterclass.
  - Domain visual strategy engine (Physics vectors, Math KaTeX formulas, CS code traces, Bio flowcharts, History timelines).
  - Schema-enforced JSON validation using Zod.

### Phase 6: Adaptive Teaching State Machine
* **Goal**: Interactive classroom flow with misconception diagnosis.
* **Deliverables**:
  - State machine transitions (`INTRODUCTION` → `EXPLANATION` → `DEMONSTRATION` → `QUESTION` → `EVALUATE` → `ADAPT`).
  - Semantic rubric matching for checkpoint questions.
  - Classical misconception diagnosis (e.g. continuous force fallacy).
  - Adaptive remediation branch invoking fresh physical analogies before re-testing.

### Phase 7: Assessment & Reporting
* **Goal**: Automated post-lesson quiz grading and diagnostic report cards.
* **Deliverables**:
  - MCQ and short-answer grading endpoint (`POST /api/assessment/submit`).
  - Comprehensive report card generation detailing percentage, strong concepts, and weak areas.
  - Recommendation engine proposing the next logical topic in the learning track.

### Phase 8: Voice (TTS & STT)
* **Goal**: Natural multilingual oral dialogue.
* **Deliverables**:
  - Microsoft Edge Neural TTS integration across English, Hindi, Hinglish, Tamil, and Spanish.
  - Browser Speech-to-Text (`webkitSpeechRecognition`) for oral checkpoint answering.
  - Voice session cache and viseme mouth animation timelines.

### Phase 9: Video & Avatar Integration
* **Goal**: Real-time animated canvas avatar and asynchronous MP4 video export.
* **Deliverables**:
  - 60 FPS SVG Canvas Viseme Avatar with eye blinking and speech cadence lip-sync.
  - Background video rendering job queue (`video_jobs`).
  - Programmatic scene composition and FFmpeg audio-visual multiplexing.

### Phase 10: Analytics & Long-Term Memory
* **Goal**: Persistent learner mastery tracking and study analytics.
* **Deliverables**:
  - Concept mastery radar charts across academic disciplines.
  - Study streak tracker and learning time metrics.
  - Dynamic learning path generator based on prerequisite dependencies.

### Phase 11: Security & End-to-End Testing
* **Goal**: Enterprise hardening and regression prevention.
* **Deliverables**:
  - Rate limiting, Helmet HTTP security headers, and CORS lockdown.
  - Prompt injection regression test suite.
  - Automated Jest/Vitest unit and integration tests.

### Phase 12: Production Deployment
* **Goal**: Containerization and cloud readiness.
* **Deliverables**:
  - Multi-stage Dockerfiles for API and Web services.
  - Production `docker-compose.yml` with MongoDB persistence.
  - Deployment guides for Render, Railway, Fly.io, and Vercel.
