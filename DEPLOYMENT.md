# GhatWatch AI — Deployment Guide

This guide details how to build and deploy **GhatWatch AI** across popular cloud platforms and container environments.

---

## Architecture Overview

GhatWatch is composed of three interconnected services:
1. **Frontend (`client/`)**: React 18 + Vite + Tailwind CSS + Leaflet (production static build output in `client/dist`).
2. **Backend API (`server/`)**: Node.js + Express REST API on `/api/v1` (serves data and proxies risk calculations). In production, Express automatically serves the static React frontend from `client/dist`.
3. **Risk Screening Engine (`engine/`)**: Python 3 + FastAPI + Pandas on port `8000`.

---

## Option 1: 1-Click Container Deployment (Recommended)

The included `Dockerfile` packages the entire stack (React UI + Express API + Python Engine) into a single, optimized Linux container running on port `5000`.

### Local Docker / VPS
```bash
# Build and run with Docker Compose
docker compose up -d --build

# Access the application at:
# http://localhost:5000
```

### Google Cloud Run (via gcloud CLI)
```bash
# 1. Build and submit image to Google Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/ghatwatch

# 2. Deploy to Cloud Run
gcloud run deploy ghatwatch \
  --image gcr.io/YOUR_PROJECT_ID/ghatwatch \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 5000 \
  --memory 1Gi
```

### Render (Docker Blueprint)
1. Push your repository to GitHub or GitLab.
2. In Render, select **New** > **Blueprint** and connect your repository.
3. Render will automatically read `render.yaml` and provision the web service.

---

## Option 2: Platform-as-a-Service (Railway / Render without Docker)

If deploying using native Node.js and Python runtimes:

### 1. Build Command
```bash
npm run install:all && npm run build
```

### 2. Start Command
```bash
npm run start:prod
```

### Required Environment Variables
| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | External web port | `5000` (or assigned by host) |
| `CLIENT_ORIGIN` | Allowed origin(s) for CORS | `https://your-domain.com` |
| `ENGINE_URL` | Internal URL to Python Risk Engine | `http://127.0.0.1:8000` |
| `DATA_PATH` | Path to dataset CSV *(optional)* | `/app/track-2-visarjan-ghat-watch/data/bhopal_ghats_2023_2025.csv` |

---

## Option 3: Static Frontend on Vercel / Netlify / GitHub Pages

The React client features an embedded dataset fallback (`EMBEDDED_BHOPAL_WATER_DATA`). Even if deployed as a standalone static site without the backend, all historical data, rankings, maps, and statistical metrics operate seamlessly.

### Vercel
1. Import repository on Vercel.
2. Root Directory: `client`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. If you have deployed the Express server separately, set `client/vercel.json` rewrite to point `/api/(.*)` to your backend URL.

---

## Health Checks & Verification

After deployment, verify the endpoints:
- **Application Web UI:** `GET /` -> Serves React SPA
- **Express API Health:** `GET /api/v1/health` -> `{"data":{"status":"ok"},"meta":{}}`
- **Ghats Registry:** `GET /api/v1/ghats` -> 7 canonical Bhopal immersion sites
