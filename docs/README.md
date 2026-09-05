# 🎓 AI Teacher — A Human-Like AI Educator That Teaches Through Video

> **An adaptive, multimodal educational system that transforms documents or raw topics into interactive, personalized teaching sessions with a human-like avatar, neural voice, synchronized visual chalkboard, question checkpoints, misconception diagnosis, and persistent learning paths.**

---

## 1. Problem Statement & Solution Overview

### The Problem
Traditional educational technology suffers from two extremes:
1. **Static Text/Video**: Lectures on video platforms (YouTube/Coursera) are non-interactive, monolithic, and cannot adapt to a student who gets stuck on a concept.
2. **Generic Chatbots**: AI chatbots dump walls of text, expect the student to know what questions to ask, and lack visual demonstrations, pedagogical timing, and pacing.

### The Solution: AI Teacher
**AI Teacher** acts like a real master educator. It doesn't just read slides or answer questions in a vacuum. It executes the pedagogical cycle:
$$\text{Understand} \longrightarrow \text{Plan} \longrightarrow \text{Explain} \longrightarrow \text{Demonstrate} \longrightarrow \text{Question} \longrightarrow \text{Evaluate} \longrightarrow \text{Adapt} \longrightarrow \text{Continue}$$

Given an uploaded syllabus document (PDF, DOCX, PPTX, TXT) or a raw topic request, coupled with a natural-language constraint (e.g., *"I'm a beginner, teach me Chapter 4 in 20 minutes, in Hindi, with simple examples, and quiz me at the end"*), the system constructs a time-budgeted lesson, teaches with a talking avatar and synchronized visual blackboard, pauses at checkpoint questions, diagnoses misconceptions, re-teaches with different analogies, and persists the learner's profile across sessions.

---

## 2. Key Features

- **Document Ingestion & Grounded RAG**:
  - Parses PDF, DOCX, PPTX, and TXT with semantic section preservation.
  - TF-IDF & Cosine Similarity vector indexing with citation provenance (source file, section, page, similarity score).
  - Explicit **General Knowledge Mode** with transparent lower-confidence framing when no documents are uploaded.
- **Time-Budget & Level-Aware Pedagogical Planner**:
  - Automatically scales concept density and question frequency (5 min vs. 20 min vs. 60 min vs. multi-day curricula).
  - Adapts pedagogical tone from elementary school to advanced undergraduate levels.
- **Multilingual Teaching & Mid-Lesson Language Switching**:
  - Supports English, Hindi, Hinglish, Spanish, Tamil, and more.
  - Enables switching languages mid-session without restarting or losing lesson context.
- **Subject-Aware Visual Reasoning Engine**:
  - Tailors visual representations to subject domains:
    - **Physics**: Dynamic vector diagrams and free-body force simulations.
    - **Mathematics**: Step-by-step LaTeX formula derivations with KaTeX rendering.
    - **Biology**: Cyclic process flowcharts (e.g. Calvin Cycle, photolysis of water).
    - **Computer Science**: Code syntax tracing, pointer updates, and complexity bounds.
    - **History**: Chronological timelines and milestone callouts.
- **Multimodal Media Pipeline (Neural Voice + Talking Avatar)**:
  - High-fidelity Microsoft Neural Speech (`edge-tts`) with native regional accents (`hi-IN-SwaraNeural`, `en-US-JennyNeural`, `hi-IN-MadhurNeural`).
  - Real-time viseme/phoneme synchronization driving an interactive, animated canvas avatar.
  - Programmatic MP4 video composition via bundled `imageio-ffmpeg`.
- **Interactive Assessment & Misconception Diagnosis**:
  - Formats: Multiple Choice, Short Answer, "Explain in Your Own Words", and Applied Problems.
  - Rubric-based semantic evaluation detects classical misconceptions (e.g. *"continuous motion requires continuous force"*, *"heavier objects fall faster"*, *"action-reaction forces cancel out"*).
  - Adaptive Branching: Reteaches the concept using an entirely new mental model and analogy before continuing.
- **Cross-Session Learner Profile & Multi-Module Curriculum**:
  - Persistent SQLite database tracking topic mastery, past misconceptions, and preferred style.
  - Personalizes subsequent sessions with recall warmups (*"Last time you had a doubt on Ohm's law..."*).
  - Generates multi-module dependency tracks for broad subjects (e.g. Classical Mechanics, Machine Learning).

---

## 3. System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js / React)                      │
│  - Classroom Studio (Avatar Video + Synced Visuals + Dynamic Captions) │
│  - Interactive Checkpoint Question Modal (Voice/Text Input)            │
│  - Document Upload & Natural-Language Learner Profiler                 │
│  - RAG Provenance Drawer (Source Chunks & Citations)                  │
│  - Learner Dashboard (Mastery Radar, Misconceptions, Curriculum Path)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST / SSE API
┌───────────────────────────────────▼────────────────────────────────────┐
│                    FASTAPI BACKEND ORCHESTRATOR                        │
│                                                                        │
│ 1. Ingestion & RAG Engine                                              │
│    - PDF/DOCX/PPTX/TXT parser & semantic chunker                       │
│    - Vector store with top-k retrieval & citation attribution           │
│    - General knowledge fallback mode with low-confidence framing       │
│                                                                        │
│ 2. Learner Profiler & Lesson Planner                                   │
│    - Free-text instruction parsing (level, goal, time budget, language)│
│    - Time-budget scaling (5m: 1-2 core; 20m: 3-5 + checkpoints;        │
│      60m: deep dive + quiz; 7d: multi-day curriculum)                  │
│                                                                        │
│ 3. Script & Visual Reasoning Engine                                    │
│    - Subject-specific visual strategy (Math, Physics, Bio, Code, etc.) │
│    - Timestamped visual cue generator & slide layout synthesis         │
│                                                                        │
│ 4. Interaction, Misconception & Assessment Engine                      │
│    - Rubric-based semantic evaluation (not exact string match)          │
│    - Misconception diagnosis & branch re-explanation with new analogy  │
│    - Final assessment report card with strengths/weaknesses            │
│                                                                        │
│ 5. Media Pipeline                                                      │
│    - Multilingual Neural TTS (Hindi, English, Hinglish, Spanish, etc.) │
│    - Lip-sync viseme generator & avatar compositor                     │
│    - Programmatic MP4 video renderer & live stream state machine       │
│                                                                        │
│ 6. Learner Profile Store & Curriculum Path Generator                   │
│    - SQLite persistent learner profile across sessions                 │
│    - Dependency graph curriculum generator for broad topics            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Visual Reasoning Heuristics (Judged Criterion)

The engine selects visual representations using domain-specific heuristics implemented in `backend/services/script_visual_generator.py`:

| Subject Area | Heuristic & Pedagogy | Rendered Visual Type |
|---|---|---|
| **Physics** | Spatial forces require vector arithmetic and dynamic balance demonstrations | `SIMULATION_DIAGRAM` (Vector arrows: Normal, Gravity, Applied, Friction) |
| **Mathematics** | Symbolic rigor requires step-by-step algebraic expansion | `EQUATION` (LaTeX formulas rendered via KaTeX) |
| **Biology** | Cellular & biochemical reactions are multi-stage sequential pipelines | `FLOWCHART_PROCESS` (Photolysis, Calvin Cycle, Grana vs Stroma) |
| **Computer Science** | Algorithms require array states, comparison indices, and code execution | `CODE_TRACE` (Monospace syntax highlighting, active line, swap trace) |
| **History** | Historical context requires causal chronology and milestone anchoring | `TIMELINE` (Chronological event cards and dates) |

---

## 5. Assessment & Misconception Diagnosis Methodology

When a student responds to a checkpoint question, the `AssessmentEngine` performs multi-tier semantic evaluation:
1. **Direct Rubric Matching**: Checks for necessary physical or conceptual keywords rather than string equality.
2. **Misconception Diagnosis**:
   - Cross-references answers with known misconception patterns:
     - **Continuous Force Trap**: Thinking motion ceases without an ongoing push ($v \propto F$).
     - **Gravitational Fallacy**: Conflating gravitational force ($m \cdot g$) with acceleration ($g$).
     - **Action-Reaction Canceling Fallacy**: Believing 3rd Law pairs cancel each other out on the same body.
3. **Adaptive Branching**:
   - If a misconception is detected, the engine halts forward progression.
   - It invokes a **different mental model** (e.g. air-hockey puck in space, feather and hammer on the Moon, swimmer pushing water).
   - Re-evaluates understanding before granting progression.

---

## 6. Setup & Deployment Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Local Quickstart

1. **Clone Repository & Set Environment**:
   ```bash
   cp .env.example .env
   ```

2. **Start Backend Server**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   API runs at `http://localhost:8000`. Swagger documentation is available at `http://localhost:8000/docs`.

3. **Start Frontend Client**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

4. **Run Automated Test Suite**:
   ```bash
   python -m pytest tests/ -v
   ```

---

## 7. Known Limitations & Future Work

1. **Chemistry 3D Molecular Renders**: Currently renders 2D chemical equations; interactive 3D WebGL protein folding is flagged for future extension.
2. **OCR for Extremely Blurry Scans**: OCR is calibrated for clear smartphone photos; handwritten cursive notes benefit from higher resolution input.
3. **Privacy**: Uploaded documents are stored locally in `backend/data/uploads` and are not transmitted to external third-party model providers unless commercial cloud keys are configured.
