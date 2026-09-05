# AI Teacher Platform — Production Deployment Guide

This document outlines the complete procedure for deploying the **AI Teacher** platform to production across **Vercel** (Frontend SPA) and **Render / Railway / Cloud Run** (Backend API), backed by a production-managed **MongoDB Atlas** cluster.

---

## 1. System Architecture Overview

```text
Student Browser (Vercel SPA)
       ↓ HTTPS / WSS
Node.js Express Gateway (Render / Railway / Docker)
       ├── Authentication (JWT + Bcrypt)
       ├── Document Ingestion & RAG (Chunking + Vector Text Search)
       ├── Lesson Planner (Heuristic & Gemini/OpenAI Extensible)
       ├── Adaptive Teaching Engine (Misconception Diagnosis State Machine)
       ├── Voice Engine (Real Web Speech STT + Edge Neural TTS)
       ├── Video Studio (Scene Planner + Canvas/SVG Compositor)
       └── Learning Intelligence (Hierarchical Curriculum & DB Telemetry)
       ↓ TLS Connection
MongoDB Atlas (Replica Set + Indexed Collections)
```

---

## 2. Environment Variables Specification

Create your production environment file (or populate secrets in your cloud provider dashboard).

| Variable | Required | Description | Example / Production Value |
| :--- | :--- | :--- | :--- |
| `PORT` | Yes | API listening port | `5000` |
| `NODE_ENV` | Yes | Environment mode | `production` |
| `CLIENT_URL` | Yes | CORS allowed frontend origin | `https://ai-teacher-web.vercel.app` |
| `MONGODB_URI` | Yes | Production MongoDB connection string | `mongodb+srv://admin:<pwd>@cluster.mongodb.net/ai_teacher?retryWrites=true&w=majority` |
| `JWT_SECRET` | Yes | Strong 256-bit key for session tokens | `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | Yes | Token expiry duration | `7d` |
| `GEMINI_API_KEY` | Optional | Google Gemini API for lesson planner | *(Optional - Fallback runs with 0 keys)* |
| `OPENAI_API_KEY` | Optional | OpenAI Whisper/DALL-E key | *(Optional - Fallback runs with 0 keys)* |
| `HEYGEN_API_KEY` | Optional | Commercial avatar key | *(Optional - Fallback runs with 0 keys)* |

---

## 3. Database Deployment (MongoDB Atlas)

1. **Cluster Setup**:
   - Provision a dedicated M10+ or serverless MongoDB Atlas cluster on AWS or GCP.
2. **Security & IP Access**:
   - Create a dedicated database user with `readWrite` permissions on database `ai_teacher`.
   - Add backend server static IP addresses or `0.0.0.0/0` with strict authentication and TLS 1.3 enforced.
3. **Index Verification**:
   - The platform auto-creates required compound and text indexes on startup:
     - `DocumentChunk`: `{ documentId: 1, chunkIndex: 1 }` (unique), `{ text: 'text', heading: 'text', section: 'text' }`
     - `Lesson`: `{ userId: 1 }`, `{ topic: 1 }`
     - `ConceptMastery`: `{ userId: 1, concept: 1 }`
     - `VideoJob`: `{ userId: 1 }`, `{ status: 1 }`
4. **Backups**:
   - Enable Continuous Cloud Backup (point-in-time recovery) in MongoDB Atlas.

---

## 4. Backend Deployment (Render / Railway / Cloud Run)

### Option A: Deploy via Docker (Recommended)
1. Link your GitHub repository to **Render** or **Railway**.
2. Select **Docker** as the environment runtime.
3. Configure the build parameters:
   - **Docker Context**: Root (`.`)
   - **Dockerfile Path**: `apps/api/Dockerfile`
4. Add the Environment Variables specified in Section 2.
5. Set Health Check path:
   - **Health Endpoint**: `/api/health`
6. Deploy.

### Option B: Deploy via Node.js Native Runtime
- **Build Command**: `npm ci && npm run build --workspace=@ai-teacher/types && npm run build --workspace=@ai-teacher/api`
- **Start Command**: `npm run start --workspace=@ai-teacher/api`

---

## 5. Frontend Deployment (Vercel)

1. Import the repository into **Vercel**.
2. Set project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`
3. Environment Variables:
   - `VITE_API_URL`: `https://ai-teacher-api.onrender.com`
4. Deploy.
5. **SPA Routing**: `apps/web/vercel.json` is pre-configured to route all paths to `/index.html` with reverse-proxy rewrites for `/api/*` and `/static/*`.

---

## 6. Docker Compose Multi-Container Deployment

To deploy the entire stack on an Ubuntu VPS (e.g. AWS EC2, DigitalOcean Droplet, Linode):

```bash
# 1. Clone repository
git clone https://github.com/your-org/ai-teacher.git
cd ai-teacher

# 2. Copy and customize production environment
cp .env.example .env
nano .env

# 3. Launch full stack with database, API, and Web frontend
docker compose up -d --build

# 4. Verify running containers
docker compose ps

# 5. Check health check status
curl -i http://localhost:5000/api/health
```

---

## 7. Production Verification Checklist

Before announcing general availability, verify all 14 core subsystems:

- [x] **Frontend Deployed**: Loads with modern responsive UI and SPA routing.
- [x] **Backend Deployed**: Responds to HTTP/JSON requests with structured envelope.
- [x] **Database Connected**: MongoDB Atlas ping passes with connected status.
- [x] **Authentication Works**: Bcrypt signup, login, JWT issuance, and expiration.
- [x] **Document Upload Works**: Multi-format PDF, TXT, DOCX uploads with 50MB limit.
- [x] **RAG Works**: Extracted document chunks searched via text indexes.
- [x] **AI Lesson Planning Works**: Generates structured sections, analogies, and questions.
- [x] **Adaptive Teaching Works**: Diagnoses misconceptions, adjusts difficulty, never says "Wrong."
- [x] **Assessment Works**: Dynamic 6 question types evaluated with rubric keywords.
- [x] **Voice Works**: 5-state UI (Idle, Listening, Processing, Speaking, Error) with multilingual tags.
- [x] **Video Generation Works**: Asynchronous job queue generating subject-aware visuals.
- [x] **Analytics Works**: Real database tracking of study time, streaks, and recommendations.
- [x] **Security Works**: User A / User B isolation enforced on all endpoints (403 Forbidden).
- [x] **API Keys Secured**: No hardcoded keys; real zero-key fallbacks operate out-of-the-box.

---

## 8. Monitoring & Maintenance

### Health & Diagnostic Endpoint
- **URL**: `GET /api/health`
- **Response Format**:
  ```json
  {
    "success": true,
    "message": "AI Teacher Production API is operational",
    "timestamp": "2026-09-04T20:58:35.000Z",
    "uptimeSeconds": 1845,
    "database": {
      "status": "connected",
      "name": "ai_teacher"
    },
    "system": {
      "heapUsedMb": 62.15,
      "rssMb": 114.8
    },
    "version": "1.0.0"
  }
  ```

### Log Inspection
- Structured request logging is activated via `morgan('dev')`.
- All operational errors log stack traces and error codes to standard out for aggregation in Datadog, CloudWatch, or Grafana Loki.

---

## 9. Troubleshooting & Rollback Instructions

### Common Issues
1. **`403 Forbidden` on Cross-Resource Requests**:
   - *Cause*: User data isolation security is active. A user cannot access another student's documents, lessons, assessments, or videos.
   - *Fix*: Verify the client is passing the correct bearer token for the document owner.
2. **`RATE_LIMIT_EXCEEDED`**:
   - *Cause*: A client exceeded 1000 requests in 15 minutes.
   - *Fix*: Wait for the rate-limit window to reset, or adjust `windowMs` and `max` in `apps/api/src/server.ts`.
3. **Database Connection Failures**:
   - *Cause*: IP whitelist in MongoDB Atlas is blocking server outbound IP.
   - *Fix*: Add backend server IP address in Atlas Network Access.

### Rollback Procedure
If a production issue occurs after deploying a new release:
1. **Vercel Frontend Rollback**:
   - In Vercel Project Dashboard $\to$ Deployments $\to$ locate the previous successful deployment $\to$ click **Instant Rollback**.
2. **Render / Railway Backend Rollback**:
   - In the service dashboard $\to$ Deployments $\to$ click **Rollback to this commit**.
3. **Docker Rollback**:
   ```bash
   git checkout HEAD~1
   docker compose up -d --build
   ```
