# AI Teacher — Complete REST API Reference

> **API Base URL**: `http://localhost:5000/api` (Local) or `https://ai-teacher-api.onrender.com/api` (Production)

All API responses follow a uniform structured JSON envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```
Operational errors return standard HTTP error status codes with an error envelope:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_FORBIDDEN",
    "message": "You do not have permission to access this resource"
  }
}
```

---

## 1. System Health & Diagnostics

### `GET /api/health`
Returns system uptime, live MongoDB status, memory usage, and operational version.
* **Auth**: Public
* **Response**:
  ```json
  {
    "success": true,
    "message": "AI Teacher Production API is operational",
    "timestamp": "2026-09-04T20:58:35.000Z",
    "uptimeSeconds": 1845,
    "database": { "status": "connected", "name": "ai_teacher" },
    "system": { "heapUsedMb": 62.15, "rssMb": 114.8 },
    "version": "1.0.0"
  }
  ```

---

## 2. Authentication & Identity

### `POST /api/auth/register`
Creates a new student account.
* **Body**:
  ```json
  {
    "name": "Alex Chen",
    "email": "alex@example.com",
    "password": "SecurePassword123!",
    "role": "STUDENT"
  }
  ```
* **Response**: `201 Created` with `{ user, token }`.

### `POST /api/auth/login`
Authenticates a user and returns a signed JWT.
* **Body**: `{ "email": "alex@example.com", "password": "SecurePassword123!" }`
* **Response**: `200 OK` with `{ user, token }`.

### `GET /api/auth/me`
Returns current authenticated user details from the JWT bearer token.
* **Auth**: Bearer Token required.

---

## 3. Student Profile & Onboarding

### `GET /api/user/profile`
Retrieves student education level, preferred language, style, and study goals.
* **Auth**: Bearer Token.

### `POST /api/user/onboarding`
Saves or updates initial learning profile preferences.
* **Body**:
  ```json
  {
    "educationLevel": "undergraduate",
    "preferredLanguage": "en",
    "learningGoal": "concept_mastery",
    "teachingStyle": "intuitive",
    "availableStudyTimeMinutes": 20
  }
  ```

---

## 4. Document Ingestion & Grounded RAG

### `POST /api/documents/upload`
Uploads educational study material (PDF, DOCX, TXT) with 50MB limit and prompt injection sanitization.
* **Format**: `multipart/form-data` with field `file`.
* **Response**: `201 Created` with parsed document metadata and generated chunk count.

### `GET /api/documents`
Lists all documents belonging to the authenticated student.
* **Auth**: Bearer Token.

### `GET /api/documents/:id`
Retrieves a single document. Enforces multi-tenant isolation (returns `403` if belonging to another user).

### `POST /api/documents/query`
Performs keyword & vector text search over indexed chunks.
* **Body**: `{ "query": "What is Newton's First Law?", "documentId": "66e2c..." }`
* **Response**: Top-K matched chunks with chapter, section, page number, and relevance scores.

---

## 5. Lesson Planning

### `POST /api/lessons/generate`
Generates a structured, time-budgeted pedagogical lesson plan.
* **Body**:
  ```json
  {
    "topic": "Newton's Laws of Motion",
    "documentId": "66e2c...",
    "targetDurationMinutes": 20,
    "difficulty": "beginner",
    "language": "en",
    "teachingStyle": "intuitive"
  }
  ```
* **Response**: Validated lesson object containing objectives, prerequisites, sections, analogies, equations, and checkpoints.

### `GET /api/lessons/:id`
Retrieves a lesson plan by ID. Enforces multi-tenant isolation.

---

## 6. Adaptive AI Teacher Engine

### `POST /api/teaching/start`
Initializes an interactive teaching state machine session for a lesson.
* **Body**: `{ "lessonId": "66e2d..." }`
* **Response**: Returns initialized session in state `INTRODUCTION` with concept overview and visual chalkboard config.

### `POST /api/teaching/respond`
Sends student response to a checkpoint or explanation question.
* **Body**:
  ```json
  {
    "sessionId": "66e2f...",
    "answer": "The box stops because you stopped pushing it",
    "isVoice": false
  }
  ```
* **Response**: Returns pedagogical evaluation, diagnosed misconceptions (e.g. `continuous_force_fallacy`), and adaptive state transition (advances to `REMEDIATION` or `NEXT_CONCEPT`).

### `POST /api/teaching/ask`
Allows the student to ask a spontaneous question during teaching.
* **Body**: `{ "sessionId": "66e2f...", "question": "Why does friction oppose motion?" }`
* **Response**: Teacher explanation grounded in lesson context and analogies.

---

## 7. Assessment & Feedback

### `POST /api/assessment/generate`
Generates a 6-question comprehensive post-lesson quiz (MCQ, Short answer, Conceptual, Application, Problem-solving, Explain in own words).
* **Body**: `{ "lessonId": "66e2d..." }`

### `POST /api/assessment/submit`
Submits student answers for multi-dimensional grading.
* **Body**:
  ```json
  {
    "lessonId": "66e2d...",
    "answers": [
      { "questionId": "q1", "studentAnswer": "Inertia maintains velocity" },
      { "questionId": "q2", "studentAnswer": "Net force is zero" }
    ]
  }
  ```
* **Response**: Returns grading score, accuracy, diagnosed weak concepts, and study recommendations.

### `GET /api/assessment/:id/results`
Retrieves report card by assessment ID. Enforces multi-tenant isolation.

---

## 8. Real-Time Multilingual Voice

### `POST /api/voice/session`
Initiates a voice session and verifies browser STT compatibility.

### `POST /api/voice/tts`
Generates synthesized teacher speech using Microsoft Edge Neural TTS or Web Speech fallback.
* **Body**: `{ "text": "Welcome to our lesson on Newton's Laws!", "language": "en" }`
* **Response**: Returns audio stream or audio URL.

---

## 9. AI Video Generation Queue

### `POST /api/video/render`
Queues asynchronous video synthesis for a lesson.
* **Body**: `{ "lessonId": "66e2d..." }`
* **Response**: `202 Accepted` with `{ "jobId": "66e3a...", "status": "QUEUED" }`.

### `GET /api/video/jobs/:id`
Polls rendering job progress. Enforces multi-tenant isolation.
* **Response**: Status (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`), progress percentage, and final video MP4 asset URL.

---

## 10. Learning Analytics & Curriculum Intelligence

### `GET /api/analytics/profile`
Returns student study telemetry: total study minutes, lessons completed, current streak, and concept mastery radar.

### `GET /api/analytics/curriculum`
Returns hierarchical course-module-lesson curriculum tree for a topic.

### `GET /api/analytics/recommendations`
Returns personalized next-action recommendations based on diagnosed weak concepts and mastery gaps.
