# AI & Pedagogical Reasoning Architecture

> **Design Principle**: The AI Teacher is **not a passive chatbot**. It is an active pedagogical agent that leads the student through a systematic learning path, tests comprehension, diagnoses misconceptions, adapts explanations dynamically, and maintains long-term mastery profiles.

---

## 1. Modular Provider Pattern

The AI Teacher platform abstracts intelligence behind pluggable provider interfaces:

```text
                  ┌──────────────────────┐
                  │   AI Model Router    │
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [Cloud LLM Provider]            [Local Heuristic Engine]
  Google Gemini 1.5 Flash          Deterministic Zod Planner
 (Active when key provided)         (Active in Zero-Key Demo)
```

* **Cloud Provider**: Connects to Google Gemini (`gemini-1.5-flash`). Handles rich, open-ended question answering, personalized analogy synthesis, and multilingual context generation.
* **Local Heuristic Provider**: Built-in deterministic pedagogical engine that executes offline without API keys or internet access. Generates structured lesson sections, KaTeX equations, chalkboard visuals, and multiple-choice checkpoints.

---

## 2. The 9-State Pedagogical State Machine

Unlike chatbots that simply wait for user input, the AI Teacher engine drives the lesson through a 9-state sequence:

```text
[1. INTRODUCTION]
  • States learning objectives
  • Connects to real-world intuition
      ↓
[2. EXPLANATION]
  • Breaks concept into digestible sub-ideas
  • Uses clear everyday analogies
      ↓
[3. DEMONSTRATION]
  • Chalkboard updates with subject-aware visual (FBD, LaTeX derivation, code trace)
      ↓
[4. CHECK_UNDERSTANDING]
  • Teacher poses a targeted conceptual checkpoint question
      ↓
[5. EVALUATE]
  • Evaluates student answer against conceptual criteria (rubric keywords)
      ↓
[6. ADAPT]
  • If correct: reinforces key insight and advances to [8. NEXT_CONCEPT]
  • If misconception detected: branches to [7. REMEDIATION]
      ↓
[7. REMEDIATION]
  • Diagnoses root cause (e.g. continuous force fallacy)
  • Introduces alternative mental model (e.g. frictionless puck on ice)
  • Re-checks understanding with a fresh question
      ↓
[8. NEXT_CONCEPT]
  • Transitions to the next section in the lesson plan
      ↓
[9. FINAL_REVIEW]
  • Comprehensive recap and transition to post-lesson assessment
```

---

## 3. Misconception Diagnosis Engine

The platform incorporates a domain-specific misconception classifier. When evaluating a student's answer:

1. **Semantic Evaluation**: The system inspects key conceptual mechanisms rather than expecting verbatim text.
2. **Catalog of Diagnosed Fallacies**:
   - *Continuous Force Fallacy*: Believing a continuous forward force is required to sustain constant velocity ($v \propto F$ instead of Newton's 1st Law).
   - *Heavy Falls Faster Trap*: Believing heavier objects accelerate faster in a vacuum, conflating mass with gravitational acceleration.
   - *Action-Reaction Self-Cancellation*: Thinking Newton's 3rd Law pairs cancel each other out on the same object.
   - *Centrifugal Force Fallacy*: Treating fictitious centrifugal force as a real physical interaction.
3. **Remediation Strategy**: The teacher never says *"You are wrong."* Instead, it validates the student's intuition (*"It feels that way because on Earth friction is always present..."*), isolates the missing variable, and offers a counter-example.

---

## 4. Multimodal Speech & Animated Visemes

* **Speech Synthesis (TTS)**: Synthesizes teacher voice using Microsoft Edge Neural TTS with native prosody and accents in English, Hindi, Hinglish, Spanish, and Tamil.
* **Voice Recognition (STT)**: Transcribes student spoken answers using the W3C Web Speech API with dual fallback to text input.
* **Lip-Sync Visemes**: Generates real-time visual viseme mouth shapes (`A`, `E`, `I`, `O`, `U`, `M`, `rest`) synchronized with audio playback at 60 FPS on an HTML5 SVG Canvas.
