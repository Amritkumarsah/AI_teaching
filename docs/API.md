# AI Teacher — REST API Reference

Base URL: `http://localhost:5000/api`

---

## 1. System Health
* **`GET /health`**
  - Returns service status, MongoDB connectivity, and active AI/Voice providers.

---

## 2. Authentication
* **`POST /auth/register`**
  - Body: `{ name, email, password, role }`
  - Response: `{ token, user }`
* **`POST /auth/login`**
  - Body: `{ email, password }`
  - Response: `{ token, user }` (or instant login via `demo@aiteacher.io`)
* **`GET /auth/me`**
  - Returns decoded JWT user context.

---

## 3. Student Profile & Onboarding
* **`GET /user/profile`**
  - Returns student education level, preferred language, style, and study time.
* **`POST /user/onboarding`**
  - Body: `{ educationLevel, preferredLanguage, learningGoal, teachingStyle, availableStudyTimeMinutes }`

---

## 4. Document Ingestion & RAG
* **`POST /documents/upload`**
  - Multipart form upload: `file` (PDF, DOCX, PPTX, TXT).
  - Automatically parses, sanitizes, and indexes chunks.
* **`GET /documents`**
  - Lists all uploaded documents for the student.
* **`POST /documents/query`**
  - Body: `{ query, documentId? }`
  - Returns top-k matching citations with page numbers and relevance scores.

---

## 5. Lesson Planning
* **`POST /lessons/generate`**
  - Body: `{ topic, documentId?, targetDurationMinutes, difficulty, language, teachingStyle }`
  - Returns a time-budgeted lesson plan with sections, chalkboard visuals, and checkpoints.
* **`GET /lessons/:id`**
  - Retrieves a specific lesson by ID.

---

## 6. AI Teaching Room & Evaluation
* **`POST /teaching/start`**
  - Initializes a new interactive teaching session.
* **`POST /teaching/evaluate`**
  - Body: `{ sessionId, question, studentAnswer, isVoice }`
  - Performs semantic rubric matching and diagnoses misconceptions.
* **`POST /teaching/explain-again`**
  - Body: `{ topic, concept, currentLanguage }`
  - Generates a simpler explanation using an alternative mental model and analogy.
* **`POST /teaching/change-language`**
  - Dynamically changes teaching language mid-session while preserving lesson context.

---

## 7. Assessment & Reporting
* **`POST /assessment/submit`**
  - Body: `{ lessonId, userAnswers }`
  - Grades final quiz and generates a comprehensive report card.
* **`GET /assessment/:id/results`**
  - Retrieves report card by assessment ID.

---

## 8. Analytics & Learning Path
* **`GET /analytics`**
  - Returns concept mastery radar, study streak, weak/strong concepts, and recommended next topics.
* **`GET /progress`**
  - Returns cumulative study time and completed lessons count.

---

## 9. Async Video Rendering
* **`POST /video/generate`**
  - Body: `{ lessonId }`
  - Queues an asynchronous background job to render an MP4 lesson.
* **`GET /video/jobs/:id`**
  - Returns the rendering job status (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`).
