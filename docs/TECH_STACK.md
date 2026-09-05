# Technology Stack Decisions & Evaluation

This document justifies every major architectural, frontend, backend, database, and media technology selected for the **AI Teacher** platform, detailing the problem solved, cost implications, and evaluated alternatives.

---

## 1. Frontend Technologies

### React 18 / Vite
* **Why it is used**: High-performance component-based rendering with instant HMR (Hot Module Replacement) and fast build times (~20 seconds vs 2+ minutes in legacy bundlers).
* **Problem it solves**: Powers the interactive classroom, live chalkboard updates, SVG avatar animations, and modal state machines without page reloads.
* **Cost Implications**: 100% Free & Open Source (MIT License).
* **Alternatives Evaluated**:
  - *Next.js*: Powerful for SSR, but heavier development server overhead and unnecessary SSR complexity for an authenticated single-page canvas studio.
  - *Vanilla JS*: Too brittle for multi-state checkpoint evaluations, modals, and reactive audio syncing.

### Tailwind CSS
* **Why it is used**: Utility-first CSS framework enabling a bespoke dark-mode "chalkboard" design system.
* **Problem it solves**: Avoids CSS bloat, eliminates naming conflicts, and allows rapid creation of responsive desktop/tablet/mobile layouts.
* **Cost Implications**: 100% Free & Open Source.
* **Alternatives Evaluated**:
  - *Bootstrap / MUI*: Bulky pre-built templates that create generic-looking interfaces rather than an immersive educational classroom.

### KaTeX
* **Why it is used**: Ultra-fast, client-side LaTeX math typesetting.
* **Problem it solves**: Renders mathematical formulas and step-by-step calculus derivations cleanly without layout shift or external server image rendering.
* **Cost Implications**: 100% Free & Open Source.
* **Alternatives Evaluated**:
  - *MathJax*: Significantly heavier and slower rendering performance.

### Recharts
* **Why it is used**: Declarative SVG charting library built specifically for React.
* **Problem it solves**: Visualizes the student's concept mastery radar and 7-day study minutes cleanly and responsively.
* **Cost Implications**: 100% Free & Open Source.
* **Alternatives Evaluated**:
  - *Chart.js*: Requires manual canvas ref management in React; Recharts integrates natively with JSX state.

---

## 2. Backend & API Technologies

### Node.js & Express (TypeScript)
* **Why it is used**: Industry-standard, asynchronous event-driven I/O engine with strong typing.
* **Problem it solves**: Acts as the central API gateway handling authentication, role authorization, document ingestion dispatch, and lesson session state management.
* **Cost Implications**: 100% Free & Open Source.
* **Alternatives Evaluated**:
  - *Python FastAPI*: Excellent for data science and media rendering (retained as an auxiliary media worker); Node/Express is optimal for real-time API gateways, JWT handling, and WebSockets.

### Zod
* **Why it is used**: TypeScript-first schema declaration and validation with static type inference.
* **Problem it solves**: Validates AI lesson plans and student input payloads, ensuring LLM outputs strictly conform to the expected JSON structure before reaching the frontend.
* **Cost Implications**: 100% Free & Open Source.
* **Alternatives Evaluated**:
  - *Joi / Yup*: Less seamless TypeScript type inference.

---

## 3. Database & Persistence

### MongoDB & Mongoose ODM
* **Why it is used**: Document-oriented NoSQL database with native JSON-like BSON documents and flexible schema evolution.
* **Problem it solves**: Accommodates deeply nested educational schemas (e.g. lesson plans containing sections, visual objects, checkpoints, and misconception maps) without awkward multi-table joins.
* **Cost Implications**: 100% Free for local Community Edition (already active on port 27017); MongoDB Atlas offers a generous 512MB free tier for cloud deployment.
* **Alternatives Evaluated**:
  - *PostgreSQL (pgvector)*: Strong relational engine, but requires complex JSON column casting or rigid normalization for dynamic pedagogical lessons and nested visual data.

---

## 4. Multimodal Speech & Media

### Microsoft Edge Neural TTS (`edge-tts`)
* **Why it is used**: High-fidelity neural voice synthesis with authentic regional accents (Indian English, Hindi, Hinglish, Tamil, Spanish).
* **Problem it solves**: Delivers human-like teacher audio without consuming paid commercial speech credits during development and testing.
* **Cost Implications**: 100% Free via the public Edge TTS protocol.
* **Alternatives Evaluated**:
  - *ElevenLabs*: Exceptional realism, but expensive usage quotas (~$22/mo for minimal minutes) making it impractical for local development.

### W3C Web Speech API (Client-side STT)
* **Why it is used**: Built-in browser speech recognition in Chromium and Edge.
* **Problem it solves**: Provides zero-latency, zero-cost student speech input for oral checkpoint answers.
* **Cost Implications**: 100% Free, zero server compute required.
* **Alternatives Evaluated**:
  - *OpenAI Whisper*: Highly accurate, but requires paid API keys ($0.006/min) or a local 1GB+ GPU model.

### Canvas SVG Viseme Engine
* **Why it is used**: Real-time vector avatar rendered via SVG and React state.
* **Problem it solves**: Delivers responsive mouth lip-sync, blinking, and head movement at 60 FPS without streaming expensive video files over network connections.
* **Cost Implications**: 100% Free, client-rendered.
* **Alternatives Evaluated**:
  - *D-ID / HeyGen*: Photorealistic video avatars, but prohibitive costs ($1 to $3 per video minute) and high rendering latency (30-60 seconds wait per phrase).
