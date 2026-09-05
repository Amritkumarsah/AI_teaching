# Real-Time AI Live Classroom Specification (LIVE_CLASS.md)

> **Goal**: Build a genuine live interactive classroom session inspired by the futuristic reference video—not a static pre-recorded video or a basic chatbot. The AI Teacher teaches, gestures, explains, projects holographic 3D/2D visuals, evaluates understanding, and allows the student to interrupt at any time.

---

## 1. System Philosophy: Teaching as a Unified Action
In a traditional lecture, a master teacher never speaks in isolation from visual aids. The teacher points, illustrates, highlights, and gauges student reaction. 

In this platform:
$$\text{Speech} + \text{Facial Articulation} + \text{Holographic Visual Projection} + \text{Socratic Interaction} = \text{Single Live Classroom Session}$$

---

## 2. Core Interactive Flow
```text
Student uploads PDF / Notes
           ↓
Text Extraction & Semantic Sectioning
           ↓
RAG Knowledge Indexing
           ↓
Student configures: Subject, Level, Language, Duration, Goal
           ↓
AI synthesizes dynamic structured lesson plan
           ↓
LIVE CLASSROOM STARTS (Futuristic High-Tech Lab Environment)
           ↓
AI Teacher speaks naturally (Neural TTS + Real-time Lip Articulation)
           ↓
Holographic Visual Panel materializes beside/behind teacher (3D/2D/Architecture)
           ↓
Teacher explains visual; objects highlight dynamically
           ↓
Teacher asks concept question (ASKING_QUESTION → WAITING_FOR_RESPONSE)
           ↓
Student answers via Voice (STT) or Text
           ↓
AI evaluates response (CORRECT, PARTIAL, INCORRECT, CONFUSED)
           ↓
Teaching adapts (Simpler analogy, alternative visual, or progression)
           ↓
[ANYTIME] Student Interrupts: "Ma'am wait, difference kya hai?"
           ↓
Audio cuts off instantly (<100ms) → Teacher enters LISTENING → THINKING
           ↓
RAG retrieves exact textbook context
           ↓
Teacher answers in student's language + updates visual to Comparison Chart
           ↓
Teacher confirms understanding → Seamlessly resumes lesson
```

---

## 3. Teacher State Machine (10 States)
The AI Teacher engine and frontend UI strictly track and visually reflect 10 pedagogical states:

| State | Visual Behavior | Audio & Mouth Articulation | Holographic Visual Reaction |
| :--- | :--- | :--- | :--- |
| **`IDLE`** | Calm breathing, neutral gaze, gentle ambient movement | Silent, lips closed in resting smile | Idle ambient hologram |
| **`LISTENING`** | Attentive forward lean, pulsating amber listening indicator | Silent; microphone active | Visual freezes / dims |
| **`THINKING`** | Subtle reflective eye movement, cyan quantum particle shimmer | Silent; no jarring loading spinners | Hologram prepares next state |
| **`SPEAKING`** | Natural photographic mouth motion, subtle head cadence | Active streaming audio playback | Visual remains visible |
| **`EXPLAINING`** | Open palm gesture towards visual, active eye contact | Audio playing, synchronized speech | Highlights active node / flow |
| **`ASKING_QUESTION`** | Direct centered gaze, engaging open posture | Spoken question delivered | Visual displays question context |
| **`WAITING_FOR_RESPONSE`**| Expectant listening posture, purple attention aura | Silent, awaiting student voice/text | Highlights response options |
| **`INTERRUPTED`** | Instant alert attention, immediate speech halt | Audio forcefully halted (`<100ms`) | Visual flags clarification mode |
| **`ADAPTING`** | Warm reassuring expression, nodding | Spoken simplification | Transitions to simpler analogy / comparison |
| **`RESUMING`** | Seamless return to lecture trajectory | Audio continues next section | Restores main curriculum visual |

---

## 4. Futuristic Classroom UI Layout (Reference Video Standard)
```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  AI TEACHER CLASSROOM                                         ● LIVE 1080p   │
├──────────────────────────────────────────────┬───────────────────────────────┤
│                                              │                               │
│            AI TEACHER STAGE                  │   HOLOGRAPHIC 3D VISUAL       │
│                                              │   PROJECTION PANEL            │
│   - Professional female avatar (grey blazer) │                               │
│   - High-tech futuristic lab environment     │   - 3D WebGL Orbit Scene      │
│   - Pale grey panels with cyan-white neon    │   - Process State Machine     │
│   - Natural photographic facial animation    │   - Architecture Diagram      │
│   - Dynamic gesture & camera push-in         │   - Algorithm Code Trace      │
│                                              │   - Chalkboard / LaTeX        │
│                                              │                               │
├──────────────────────────────────────────────┴───────────────────────────────┤
│  Live Spoken Transcript: "Let's understand this with a simple real-world..." │
├──────────────────────────────────────────────────────────────────────────────┤
│  [🎤 Speak]  [⌨ Type Question]  [⏸ Pause]  [▶ Resume]  [🔁 Repeat]  [🌐 Lang] │
├──────────────────────────────────────────────────────────────────────────────┤
│  Side Telemetry: Topic: Process Management | Progress: 35% | State: EXPLAINING │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Visual Planning Service & Validated JSON Spec
The LLM generates declarative JSON specifications validated against schemas before rendering (preventing arbitrary script execution):

```json
{
  "visualType": "process_animation",
  "title": "Operating System 5-State Model",
  "objects": [
    { "id": "new", "label": "NEW", "type": "state" },
    { "id": "ready", "label": "READY", "type": "state" },
    { "id": "running", "label": "RUNNING", "type": "state" },
    { "id": "waiting", "label": "WAITING", "type": "state" },
    { "id": "terminated", "label": "TERMINATED", "type": "state" }
  ],
  "timeline": [
    { "time": 0, "action": "HIGHLIGHT_OBJECT", "target": "new" },
    { "time": 3, "action": "ANIMATE_FLOW", "from": "new", "to": "ready" },
    { "time": 6, "action": "HIGHLIGHT_OBJECT", "target": "running" }
  ]
}
```

---

## 6. Real-Time Communication Protocol (WebSockets)
- **Endpoint**: `/ws/live-class/{session_id}`
- **Server Events**:
  - `session_connected`: Full session snapshot and state restore
  - `teacher_state_changed`: Updated teacher state machine status
  - `teacher_speech_ready`: Synthesized audio URL, spoken text, viseme timeline
  - `visual_updated`: Validated visual specification JSON
  - `lesson_completed`: Final completion summary
- **Client Events**:
  - `student_interrupt`: Instant voice/text question
  - `advance_section`: Manual section advancement
  - `ping` / `pong`: Connection heartbeat
