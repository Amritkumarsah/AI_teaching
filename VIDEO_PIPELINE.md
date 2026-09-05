# AI Teacher — Video Pipeline & Avatar Architecture

> **Design Principle**: DO NOT create a static talking-head video. Instead, generate a dynamically orchestrated multimedia teaching video with subject-aware visuals, animated chalkboard diagrams, synced voiceover, and real-time avatar visemes.

---

## 1. End-to-End Pipeline Overview

```text
Lesson Plan
     ↓
[Scene Planner]
     ↓
[Teaching Script & Narration]
     ↓
[Visual Planner (Subject-Aware)]
     ↓
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│   Visual Generation     │    Voice Generation     │      Avatar Visemes     │
│ (SVG / Canvas / KaTeX)  │ (Edge Neural / WebTTS)  │  (Lip-Sync & Eyeblink)  │
└────────────┬────────────┴────────────┬────────────┴────────────┬────────────┘
             │                         │                         │
             └────────────────► [Video Compositor] ◄─────────────┘
                                       ↓
                           [MP4 / WebM Rendered Video]
```

---

## 2. Scene Model Specification

Each generated educational video is divided into discrete, pedagogically structured scenes:

```typescript
export interface VideoScene {
  sceneId: string;
  type: SceneType;
  durationSeconds: number;
  script: string;
  visual: {
    type: 'diagram' | 'equation' | 'code' | 'timeline' | 'cycle';
    title: string;
    content: string; // LaTeX string, SVG markup, or code snippet
    highlightElements?: string[];
  };
  avatar: {
    expression: 'neutral' | 'enthusiastic' | 'thoughtful' | 'explaining';
    position: 'bottom-right' | 'bottom-left' | 'chalkboard-side';
    visemes: Array<{ timeMs: number; viseme: string }>;
  };
  voice: {
    language: string;
    speed: number;
    audioUrl?: string;
  };
  textOverlay: {
    headline: string;
    bullets: string[];
  };
}
```

### Supported Scene Types

| Scene Type | Duration | Pedagogical Purpose | Visual Layout |
| :--- | :--- | :--- | :--- |
| `INTRO` | 10–15s | Hook student interest and state learning objectives | Title card + energetic avatar greeting |
| `EXPLANATION` | 20–40s | Progressive breakdown of core conceptual mechanism | Conceptual bullet points + step-by-step illustrations |
| `DIAGRAM` | 30–60s | Structural or physical representation of phenomena | Free-body force vectors or labeled biological diagrams |
| `EQUATION` | 30–45s | Mathematical derivation and variable breakdown | Formatted LaTeX equations with parameter legends |
| `CODE` | 30–60s | Code execution walkthrough with variable states | Syntax-highlighted code with line pointer & output box |
| `EXAMPLE` | 25–45s | Real-world application grounding theoretical concepts | Real-world scenario visuals and analogies |
| `QUESTION` | 15–30s | Mid-lesson checkpoint prompting active student thought | Question card with timer countdown |
| `SUMMARY` | 15–20s | Recap key takeaways and outline next steps | Comprehensive summary card and praise |

---

## 3. Subject-Aware Visual Reasoning

The visual engine dynamically selects the optimal diagrammatic representation based on the subject domain:

### 1. Mathematics
- **Visuals**: Formatted LaTeX equations, coordinate Cartesian axes, calculus limit approximations.
- **Renderer**: KaTeX engine producing crisp SVG vector symbols.

### 2. Physics
- **Visuals**: Dynamic Free-Body Diagrams (FBD) showing vector arrows with correct magnitudes and directions (e.g. Gravity $F_g$, Normal $F_N$, Friction $F_f$, Applied Force $F_{app}$).
- **Renderer**: SVG Canvas with real-time vector rendering.

### 3. Computer Science & Programming
- **Visuals**: Structured code blocks with line-by-line execution indicators, memory stack frames, and variable watcher boxes.
- **Renderer**: Monospace code layout with dynamic active-line highlighting.

### 4. Biology & Chemistry
- **Visuals**: Labeled cellular/atomic structures and cyclic process diagrams (e.g., Photosynthesis Calvin cycle, Krebs cycle).
- **Renderer**: Hierarchical SVG flowgraphs with animated direction arrows.

### 5. History & Social Studies
- **Visuals**: Chronological milestone timelines and territory map overlays.
- **Renderer**: Horizontal timeline nodes with dated milestone callouts.

---

## 4. Avatar Provider Architecture

The video system implements a pluggable `AvatarProvider` interface:

```typescript
export interface AvatarProvider {
  name: string;
  renderSceneAvatar(scene: VideoScene): Promise<{ avatarAssetUrl: string }>;
}
```

### 1. FallbackProvider (Default — Zero-Cost Local Engine)
- **Implementation**: Real-time 60 FPS HTML5 Canvas / SVG Viseme Engine.
- **Features**:
  - Lip-sync mouth phoneme shapes mapped to audio syllables (`A`, `E`, `I`, `O`, `U`, `M`, `rest`).
  - Natural micro-movements: periodic eye blinking and subtle head tilt gestures.
  - 100% free, runs locally with 0 external API keys and 0 latency.

### 2. PremiumProvider (Commercial Cloud Integration)
- **Supported Vendors**: HeyGen API or D-ID API.
- **Environment Variable**: `AVATAR_API_KEY`.
- **Behavior**: Generates photorealistic AI teacher video clips when credentials are provided. Automatically degrades gracefully to the SVG Canvas Avatar if keys are not provided or quotas are exceeded.

---

## 5. Asynchronous Video Job Queue

Rendering complete educational videos is a compute-intensive operation. The backend provides an asynchronous job queue:

### API Endpoints:
* `POST /api/video/render`: Submits a lesson for video synthesis.
  - Returns `202 Accepted` with `{ jobId, status: 'QUEUED' }`.
* `GET /api/video/jobs/:id`: Polls job progress.
  - Returns:
    ```json
    {
      "jobId": "66e2c34...",
      "status": "COMPLETED",
      "progress": 100,
      "scenesCount": 5,
      "videoUrl": "/static/videos/lesson_123.mp4",
      "durationSeconds": 185
    }
    ```

### Job Lifecycle State Machine:
```text
[QUEUED] ──► [PROCESSING] ──► [SCENE_ASSEMBLY] ──► [COMPLETED]
     │              │
     └──────────────┴──────► [FAILED] (with error log & retry)
```

---

## 6. Verification & Automated Tests

Verify video scene generation, subject-aware diagram selection, and job status polling by running:

```bash
npm run test:video --workspace=@ai-teacher/api
```
All 7 video unit and integration tests validate the entire scene-generation and rendering pipeline.
