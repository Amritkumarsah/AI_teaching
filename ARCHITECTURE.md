# AI Teacher — System Architecture & Technical Specification

> **Platform Mission**: Transform educational materials and raw concepts into an adaptive, multimodal teaching experience that adheres to the verified pedagogical cycle:
> $$\text{Understand} \longrightarrow \text{Plan} \longrightarrow \text{Explain} \longrightarrow \text{Demonstrate} \longrightarrow \text{Question} \longrightarrow \text{Evaluate} \longrightarrow \text{Adapt} \longrightarrow \text{Continue}$$

---

## 1. End-to-End System Hierarchy

```text
┌────────────────────────────────────────────────────────────────────────┐
│                               FRONTEND                                 │
│  - Classroom Studio (SVG Viseme Avatar + KaTeX / SVG Chalkboard)       │
│  - Checkpoint Modal (Speech Recognition STT + Text Input)              │
│  - Document Ingestion & Natural-Language Learner Profiler              │
│  - Grounded RAG Citation Provenance Drawer                             │
│  - Student Dashboard (Radar Mastery, Study Streaks, Remediation Traps) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS REST / WebSockets / SSE
┌───────────────────────────────────▼────────────────────────────────────┐
│                             API GATEWAY                                │
│  - Reverse Proxy / Route Dispatcher                                    │
│  - JWT Authentication & RBAC Middleware (`STUDENT`, `TEACHER`, `ADMIN`)│
│  - Rate Limiting, Security Headers (Helmet, CORS), Payload Validation   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Internal Service Dispatch
┌───────────────────────────────────▼────────────────────────────────────┐
│                          BACKEND SERVICES                              │
│  ├── Auth & User Service (Bcrypt, JWT, Role Permissions)               │
│  ├── Learner Profile Service (Preferences, Strengths, Weaknesses)      │
│  ├── Document Processing Service (PDF/DOCX/PPTX Chunker & Sanitizer)   │
│  ├── Lesson Planning Service (Time Budgeting: 5m, 20m, 60m)            │
│  ├── Teaching State Machine (Explain, Demonstrate, Checkpoint, Adapt)  │
│  ├── Assessment & Remediation Service (Misconception Diagnosis)         │
│  ├── Voice & Media Pipeline (Neural Speech Synthesis & Visemes)        │
│  ├── Video Rendering Queue (Scene Assembly & Canvas/SVG Compositor)    │
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
│  └── Misconception Classifier      │  │  └── Top-K Text Matcher with   │
│      (Continuous force trap, etc.) │  │      Provenance Citations      │
└───────────────────┬────────────────┘  └───────────┬────────────────────┘
                    │                               │
┌───────────────────▼───────────────────────────────▼────────────────────┐
│                             DATABASE                                   │
│  MongoDB (Primary Datastore via Mongoose schemas & compound indexes)   │
│  - Collections: Users, StudentProfiles, Documents, DocumentChunks,    │
│    Lessons, LessonSessions, Questions, AssessmentResults, etc.         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ External API Integrations
┌───────────────────────────────────▼────────────────────────────────────┐
│                         EXTERNAL SERVICES                              │
│  - Google Gemini API (Cloud LLM Reasoning — Optional)                 │
│  - Microsoft Edge Neural TTS (Free Multilingual Speech Protocol)       │
│  - W3C Web Speech API (Free In-Browser Voice Input)                    │
│  - Commercial Cloud Avatars & Object Storage (Optional)                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Design & Responsibilities

### A. Frontend Layer (`apps/web`)
* **Framework**: React 18 + Vite + TypeScript.
* **Styling**: Tailwind CSS with custom glassmorphism and modern educational theme tokens.
* **Classroom Engine**:
  - `AvatarCanvas`: 60 FPS HTML5 Canvas / SVG rendering lip-sync visemes (`rest`, `A`, `E`, `O`, etc.), eye blinks, and gestures.
  - `Chalkboard`: Subject-aware display switching between LaTeX formulas, force diagrams, interactive code traces, and milestone timelines.
  - `VoiceInput`: Microphone recording through the W3C Web Speech API with dual fallback to text input.
* **State Management**: TanStack Query v5 for server caches, Zustand for classroom session states, and React Router v6 for SPA routing.

### B. Backend API Gateway (`apps/api`)
* **Runtime**: Node.js 20 LTS + Express + TypeScript.
* **Security & Hardening**:
  - Helmet for security headers (CSP, HSTS, X-Frame-Options).
  - Strict CORS origin restriction.
  - Multi-tenant tenant isolation ensuring User A cannot read or mutate User B's resources.
  - Express rate limiting (1000 requests per 15 minutes).
* **Process Lifecycle**: Graceful shutdown on `SIGTERM` and `SIGINT`, flushing DB connections and active background jobs cleanly.

### C. The 9-State Teaching Engine
The interactive teacher engine is an event-driven pedagogical state machine:
```text
[INTRODUCTION] 
      ↓
[EXPLANATION] 
      ↓
[DEMONSTRATION] 
      ↓
[CHECK_UNDERSTANDING] ──► (Evaluates Student Response)
      ↓
   [EVALUATE]
      ↓
    [ADAPT]
   ┌──┴────────────────────────┐
   ▼                           ▼
(Correct / Understood)      (Misconception Diagnosed)
   │                           │
   ▼                           ▼
[NEXT_CONCEPT]          [REMEDIATION] (Alternative Mental Model)
   │                           │
   └───────────┬───────────────┘
               ▼
         [FINAL_REVIEW]
```

---

## 3. Data Flow & Communication Protocols

* **Document Ingestion**: Multipart file upload $\to$ MIME validation $\to$ Text extraction $\to$ Prompt injection sanitization $\to$ Semantic section chunking $\to$ Compound text indexing $\to$ Database persistence.
* **Lesson Generation**: Topic / Document ID + Profile parameters $\to$ Pedagogical Lesson Planner $\to$ Structured Zod Schema validation $\to$ Stored in MongoDB $\to$ Returned to client.
* **Interactive Teaching**: Frontend dispatches responses $\to$ Teacher Engine extracts student semantics $\to$ Checks against misconception catalog $\to$ Generates dynamic remediation or advances concept state.

---

## 4. Real-Time Live AI Classroom Architecture

### A. Core Philosophy
The Live AI Classroom delivers a real-time, interactive, low-latency teaching session rather than a pre-recorded video. The teacher communicates via synchronized neural voice, natural photographic articulation, and safe declarative 3D/2D visual specs.

### B. The 10-State Teacher State System
```text
[IDLE] ◄─────────────────────────────────────────────┐
  │                                                   │
  ▼                                                   │
[EXPLAINING] ──► [SPEAKING]                           │
  │                   │                               │
  ▼                   ▼                               │
[ASKING_QUESTION] ──► [WAITING_FOR_RESPONSE]          │
  ▲                         │                         │
  │                         ▼                         │
  │                 [EVALUATION / ADAPTING] ──────────┤
  │                         ▲                         │
  │                         │                         │
[INTERRUPTED] ──► [LISTENING] ──► [THINKING] ──► [RESUMING]
```

1. **`IDLE`**: Ready state, neutral breathing.
2. **`LISTENING`**: Instant audio cutoff, actively capturing student microphone / text.
3. **`THINKING`**: Querying vector database & RAG without jarring spinners.
4. **`SPEAKING`**: Active streaming neural voice playback with synchronized mouth cadence.
5. **`EXPLAINING`**: Presenting concept with visual gesture toward holographic panel.
6. **`ASKING_QUESTION`**: Facing student with direct question.
7. **`WAITING_FOR_RESPONSE`**: Expectant listening posture awaiting student answer.
8. **`INTERRUPTED`**: Forceful audio stop `<100ms`, visual freeze.
9. **`ADAPTING`**: Socratic simplification, comparison chart, or everyday analogy.
10. **`RESUMING`**: Seamless continuation of lesson flow.

### C. Visual Planning Service
Generates safe, schema-validated JSON visual specifications (`3d_scene`, `process_animation`, `comparison`, `architecture`, `code_trace`, `whiteboard`) rendered client-side by Three.js WebGL and SVG/Canvas engines (no arbitrary script execution).
