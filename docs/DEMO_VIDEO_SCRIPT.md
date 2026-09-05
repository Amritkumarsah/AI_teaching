# 🎬 AI Teacher — Demo Video Script & Outline

**Target length:** 5–6 minutes (within the 3–7 minute recommended range)  
**Goal:** Show the complete journey — Upload/Topic → Lesson Planning → AI Teaching Video → Student Interaction → Adaptation → Assessment → Learning Feedback — as one continuous, believable teaching session, not a feature tour.

Record your screen with voiceover. Keep transitions fast; don't linger on loading spinners — cut to the result and mention timing verbally if needed ("this generates in about 40 seconds").

---

## 0:00–0:20 — Hook + Problem (20s)

**On screen:** Title card, then a quick split-screen of "old way" (a static PDF / a plain chatbot answering a question) vs. "AI Teacher."

**Script:**
> "Most learning tools either dump a pre-recorded video on you, or answer questions one at a time like a chatbot. Neither one actually *teaches*. We built AI Teacher — it plans a lesson, delivers it through a real AI teacher on video, checks if you understood it, and adapts when you don't."

---

## 0:20–0:50 — Input: Upload or Topic (30s)

**On screen:** The upload UI. Upload a sample textbook chapter or PDF. Then show typing a natural-language instruction.

**Script:**
> "Here's a Physics textbook chapter on Newton's Laws as a document. I'll tell the AI Teacher: 'I'm a beginner, teach me Chapter 4 in 20 minutes, in Hindi, with simple examples, and quiz me at the end.'"

**Show:** the instruction being parsed into a structured learner profile (level / time / language / goal) — a quick UI panel or debug view showing this JSON is strong evidence for judges.

---

## 0:50–1:30 — Lesson Planning (40s)

**On screen:** The generated lesson plan — ordered concepts, each with depth/example/visual type, sized to 20 minutes.

**Script:**
> "The system retrieves the relevant sections from the document using RAG — so it's grounded in the actual chapter, not guessing — and builds a lesson plan: which concepts to teach, in what order, with what examples and visuals, all fit to the 20-minute budget."

**Optional strong add:** briefly flash the *same topic* planned for 5 minutes vs 60 minutes side by side, to visually prove time-budget personalization actually changes structure (click "5m/20m/60m Plans" button in the header).

---

## 1:30–2:45 — AI Teaching Video (75s)

**On screen:** Play a real segment of the generated teaching video — avatar speaking, on-screen text, and a subject-appropriate visual (equation solve / diagram / code trace / timeline) appearing in sync.

**Script:**
> "And here's the lesson itself — delivered by a human-like AI teacher, in Hindi, with visuals chosen automatically for the subject. This isn't a slide with a voiceover — the avatar, the narration, and the visuals are generated and synced together for this specific student, this specific chapter, this specific time budget."

**Show at least 2 different visual types** in this segment (e.g., a free-body force simulation diagram with interactive sliders and an equation step-by-step solve) to prove subject-awareness.

---

## 2:45–3:45 — Student Interaction & Checkpoint Question (60s)

**On screen:** The video pauses at a checkpoint; a question appears (MCQ or short-answer).

**Script:**
> "Partway through, the teacher stops and checks understanding — just like a real teacher would."

**Answer incorrectly on purpose** (pick an answer that reflects a real misconception, e.g., the Aristotelian continuous push trap: *"The wrench slows down and stops because force runs out"*).

**Script:**
> "I'll answer this the way a common misconception would — that objects in space stop once their force runs out."

---

## 3:45–4:45 — Misconception Detection & Adaptation (60s)

**On screen:** The system's response: it names the specific misconception (Aristotelian Fallacy), gives a new explanation with a *different* analogy/example than before (an air-hockey puck gliding in frictionless space), and asks a new checkpoint question.

**Script:**
> "Instead of just marking that wrong, the AI Teacher recognizes *why* I got it wrong — the Aristotelian misconception that motion requires ongoing force — and re-explains it with a different example: an air-hockey puck in frictionless space. Now it asks me again, differently."

**Answer correctly this time.**

**Script:**
> "This time I understood it — and the teacher moves on."

---

## 4:45–5:30 — Final Assessment & Learning Report (45s)

**On screen:** A short final quiz, then the generated learning report (score, strengths, weaknesses, recommendation, next topic).

**Script:**
> "At the end, there's a short assessment, and the AI Teacher generates a report: what I understood, what I'm still weak on, and what to study next — just like a real tutor would after a session."

---

## 5:30–5:50 — Multilingual + Personalization Across Sessions (20s)

**On screen:** Quickly show the same lesson (or a clip) switching language mid-session ("Ab isko Hindi mein samjhao" or switching dropdown to English/Hinglish), and/or a second session opening with a reference to the previous session's weak area.

**Script:**
> "The teacher also switches language mid-lesson without losing context, and remembers what I struggled with — so next time, it starts by checking in on that first."

---

## 5:50–6:10 — Close (20s)

**On screen:** Title card with tech stack logos/names and repo/demo link.

**Script:**
> "AI Teacher — built with FastAPI, Next.js, Microsoft Neural TTS, bundled FFmpeg video compositing, and RAG retrieval. Full source, docs, and a live demo link are below."

---

## Recording Checklist

- [x] Use a real uploaded document, not a toy example, so RAG grounding is credible.
- [x] Show at least one full misconception → re-teach → resolved loop (this is the single most important adaptive-teaching proof point).
- [x] Show at least two different subject-appropriate visual types in the video segment.
- [x] Show the time-budget comparison (5 vs 20 vs 60 min) via the header modal.
- [x] Show the learning report with specific (not generic) strengths/weaknesses.
- [x] Show a language switch mid-lesson.
- [x] Keep narration tight — cut dead air/loading time in editing.
- [x] End with a working link on screen.
