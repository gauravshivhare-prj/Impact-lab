# GhatWatch AI — Project Documentation

> **Stack: MERN** — MongoDB, Express.js, React, Node.js.  
> Google Maps JavaScript API provides the map. Cerebras is called from the Node.js server for bilingual narrative generation. **There is no Python/FastAPI backend in this project.**

## Project summary
GhatWatch AI is a geospatial environmental decision-support platform for idol-immersion ghats in Bhopal. It connects historical water-quality evidence, verified legal restrictions, nearby documented environmental context, and transparent hypothetical intervention scenarios. It helps users identify where further investigation may be needed without confusing historical environmental concern with current safety or legal authorisation.

## Repository layout

```text
track-2-visarjan-ghat-watch/
├── docs/
│   ├── README.md
│   ├── SRS.md
│   ├── PRD.md
│   ├── PHASES.md
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT.md
│   ├── API_CONTRACT.md
│   └── DATA_DICTIONARY.md
├── client/                         # React + Vite
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── features/map/
│       ├── features/dashboard/
│       ├── services/api.js
│       └── ...
├── server/                         # Node.js + Express
│   └── src/
│       ├── config/
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       ├── models/
│       ├── middleware/
│       ├── validators/
│       └── app.js
├── data/                           # Source datasets and data notes
├── resources/                      # Participant guide and references
├── .env.example
├── .gitignore
└── package.json                    # Optional npm workspaces/root scripts
```

Keep the existing repository folders if already established; this is the recommended application layout, not a requirement to move source data unnecessarily.

## Core capabilities
1. Map-first view with verified ghat markers and separate map layers.
2. Historical water-quality evidence and monitoring-coverage summaries.
3. Explainable, deterministic environmental-priority ranking.
4. Legal/operational status with source and verification date.
5. Nearby documented environmental context and verified facilities.
6. Hypothetical scenario comparison with explicit assumptions.
7. English/Hindi brief generation from validated server-side facts using Cerebras.
8. Clear missing-data handling, provenance, and limitations.

## Team ownership
- **Gaurvee:** scenario/ML logic and evaluation; implement in JavaScript/TypeScript under `server/src/services/scenarios/` unless a separately approved model artifact requires otherwise.
- **Riddhi:** data ingestion, validation, analytics, priority ranking, and tests under `server/src/services/data/`.
- **Gaurav:** Express routes/controllers, API integration, and report-generation endpoint.
- **Pratham:** Google Maps view, verified markers, map layers, selection, and map-specific UI.
- **Ansh:** dashboard, ranking table, evidence details, report UI, loading/error states.

## Non-negotiable data and legal rules
- Environmental priority and legal status are separate fields and separate UI layers.
- Historical measurements do not prove current conditions in 2026.
- A concerning historic result does not itself prove a ghat is prohibited; an authorised site is not thereby guaranteed to be environmentally safe.
- Use `authorised`, `prohibited`, `conditional`, or `not_verified` only when supported by a current applicable official source. Otherwise use `not_verified`.
- Missing or unsampled measurements are missing—not zero, clean, or a pass.
- Preserve source meanings for `BDL` and `ND`; do not silently convert them to zero or treat them as equivalent unless the source says so.
- Only report metals actually present in the supplied dataset (chromium, lead, zinc, copper).
- Distance to a drain or facility does not prove that it caused pollution.
- Do not invent intervention-effectiveness percentages or present hypothetical scenarios as forecasts.
- The supplied historical dataset covers 2023–2025; do not claim it certifies current conditions or future outcomes.
- Keep all API keys in local environment variables; never commit secrets.

## Stack and environment
- Frontend: React, Vite, JavaScript or TypeScript, React Router as needed.
- Backend: Node.js, Express.js.
- Database: MongoDB with Mongoose.
- Maps: Google Maps JavaScript API.
- Charts: Recharts or another React-compatible chart library.
- AI narrative: Cerebras API called **only from Express**.
- Tests: Vitest/Jest for frontend and Node services; Supertest for Express API tests.
- Optional data import: Node.js scripts that read CSV with a maintained Node CSV parser. Do not introduce FastAPI/pandas for ingestion.

## Start here
1. Agree on `API_CONTRACT.md` and `DATA_DICTIONARY.md` before parallel coding.
2. Agree on the canonical ghat IDs, source records, and legal-status evidence.
3. Create `.env.example` without real secrets.
4. Implement deterministic data validation and ranking before AI narrative generation.
5. Integrate through small feature branches and pull requests.
