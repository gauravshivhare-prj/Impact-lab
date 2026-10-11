# GhatWatch — Visarjan Ghat Watch (Bhopal)

One project, three services:

| Folder | What it is | Port |
|---|---|---|
| `client/` | React + Vite dashboard | 5173 |
| `server/` | Express REST API — the only API the browser talks to (`/api/v1`) | 5000 |
| `engine/` | Python CPCB Class B risk-screening engine (FastAPI, internal) | 8000 |

Data lives in `track-2-visarjan-ghat-watch/data/` and is read by both the API and the engine.

```
browser ─► Vite (5173) ──/api──► Express (5000) ──/api/v1/risk──► Python engine (8000)
```

## Run

```bash
npm install            # root tooling (concurrently)
npm run install:all    # server, client and engine dependencies (needs Node 18+ and Python 3.10+)
cp server/.env.example server/.env
npm run dev            # starts API, engine and client together
```

Open http://localhost:5173. If the API is down the client falls back to its bundled dataset and shows a notice; the
Risk Screening page needs the engine.

## Test

```bash
npm test               # Express API tests + engine tests
```

`engine/app.py` is the original standalone Streamlit dashboard: `cd engine && streamlit run app.py`.
API contract: `docs/API_CONTRACT.md`. Express details: `server/README.md`.
