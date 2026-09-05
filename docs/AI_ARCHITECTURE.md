# AI & Pedagogical Reasoning Architecture

## 1. Modular Provider Pattern

The AI Teacher platform employs a strict **Provider Abstraction** for all generative tasks:

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

## 2. Dynamic Time-Budgeting

The planner dynamically scales concept depth based on requested time budget:

* **5-Minute Sprint**:
  - 1 Core intuitive concept
  - 1 High-impact visual (e.g. Free-body diagram)
  - 1 Interactive checkpoint question
* **20-Minute Deep Dive**:
  - 3 Sequenced sections (Intuition → Mechanism → Edge Cases)
  - 3 Domain visuals (KaTeX derivations + Simulation)
  - 2 Checkpoint checkpoints with misconception diagnosis
* **60-Minute Comprehensive Masterclass**:
  - 5 Pedagogical sections
  - Comprehensive problem-solving scenarios
  - Full post-lesson assessment quiz

## 3. Misconception Classification & Remediation

When a student answers a checkpoint question, the `AssessmentEngine` performs multi-tier semantic evaluation:
1. **Direct Rubric Matching**: Checks for necessary conceptual mechanisms rather than string equality.
2. **Misconception Diagnosis**: Cross-references answers with classical misconceptions:
   - **Continuous Force Trap**: Believing motion ceases without an ongoing push ($v \propto F$).
   - **Gravitational Fallacy**: Conflating weight ($m \cdot g$) with gravitational acceleration ($g$).
   - **Action-Reaction Canceling Fallacy**: Thinking 3rd Law pairs cancel each other out on the same body.
3. **Adaptive Branching**: If a misconception is detected, the engine halts forward progression and invokes an **alternative mental model** with a new analogy before re-evaluating.
