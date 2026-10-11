# System Architecture — MERN

## Architecture overview

```text
┌─────────────────────────────────────────────────────────┐
│ React + Vite client                                     │
│ Map | Dashboard | Evidence | Scenarios | Bilingual brief│
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / JSON REST
┌──────────────────────────▼──────────────────────────────┐
│ Node.js + Express API                                   │
│ Routes → Controllers → Services → Validators            │
│                                                          │
│ CSV ingestion | Analytics | Ranking | Scenarios          │
│ Legal evidence | Report composition | Cerebras client    │
└───────────────┬───────────────────────────┬──────────────┘
                │                           │
┌───────────────▼────────────┐  ┌───────────▼─────────────┐
│ MongoDB + Mongoose         │  │ Cerebras API            │
│ Ghats, samples, sources,   │  │ Narrative only; called  │
│ legal evidence, scenarios  │  │ server-side              │
└────────────────────────────┘  └─────────────────────────┘

React client ────────────────► Google Maps JavaScript API
```

## Technology choices
- **MongoDB:** stores canonical locations, observations, source metadata, legal evidence, and saved scenario definitions where persistence is needed.
- **Express:** exposes a small REST API and centralises validation, error handling, and report generation.
- **React + Vite:** renders map, evidence, charts, filters, and brief UI.
- **Mongoose:** schema and validation layer for MongoDB.
- **Google Maps JavaScript API:** geospatial presentation only; map proximity does not establish causality.
- **Cerebras:** generates explanatory prose from backend-validated facts. It does not decide legal status, compute scores, or invent measurements.

## Suggested server layout

```text
server/src/
├── app.js
├── server.js
├── config/
│   ├── env.js
│   └── database.js
├── routes/
│   ├── ghat.routes.js
│   ├── analytics.routes.js
│   ├── scenario.routes.js
│   └── report.routes.js
├── controllers/
├── services/
│   ├── data/
│   │   ├── csvImport.service.js
│   │   ├── validation.service.js
│   │   └── normalisation.service.js
│   ├── analytics/
│   │   ├── evidence.service.js
│   │   └── ranking.service.js
│   ├── scenarios/
│   │   └── scenario.service.js
│   └── reports/
│       └── cerebras.service.js
├── models/
├── validators/
├── middleware/
└── utils/
```

## Suggested client layout

```text
client/src/
├── app/
├── components/
├── features/
│   ├── map/
│   ├── dashboard/
│   ├── evidence/
│   ├── scenarios/
│   └── reports/
├── pages/
├── services/api.js
└── utils/
```

## Data flow
1. A Node.js import script reads the supplied CSV and preserves raw source fields.
2. Validation normalises dates/units and handles missing/qualified results without converting them to clean values.
3. Analytics calculates counts, benchmark comparisons, coverage, and documented priority categories deterministically.
4. Express returns a stable JSON contract.
5. React renders the same canonical ghat ID across map, table, and detail view.
6. For a requested brief, Express builds a facts-only payload and calls Cerebras using a server-side secret.
7. The brief is returned with source references, observation years, and limitations.

## Persistence
Use Mongoose models for `Ghat`, `WaterQualityObservation`, `SourceDocument`, `LegalStatusEvidence`, and optionally `ScenarioRun`. If the MVP only imports a fixed CSV, a validated in-memory dataset can reduce setup time; do not pretend it is persistent MongoDB data. Choose one mode and document it.

## Trust boundaries
- Never expose Cerebras or Google Maps server credentials in client bundles. Google Maps browser keys must be restricted by allowed referrers and API.
- Validate request parameters and constrain report input size.
- Treat imported files and model output as untrusted input.
- Do not let the AI response override structured legal status, scores, source values, or benchmark results.
