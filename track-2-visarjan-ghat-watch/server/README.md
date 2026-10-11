# GhatWatch AI — Express API

Node.js + Express REST API for GhatWatch AI. Contract: [`docs/API_CONTRACT.md`](../../docs/API_CONTRACT.md).

## Run it

```bash
cd track-2-visarjan-ghat-watch/server
npm install
cp .env.example .env
npm run dev               # http://localhost:5000/api/v1
npm test                  # no API keys or network needed
```

Requires Node.js 18 or later.

## Environment variables

| Variable | Local | Production |
|---|---|---|
| `NODE_ENV` | `development` | `production` |
| `PORT` | `5000` | Usually set by the host |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Deployed frontend URL (required; comma-separate several) |
| `TRUST_PROXY` | empty | `1` when behind a reverse proxy (Render, Railway, etc.) |

## Persistence mode

The API uses a **validated in-memory dataset**. At startup it imports `../data/bhopal_ghats_2023_2025.csv` once using the data and analytics services, then serves cached results. It does not use MongoDB. If the import fails, the server does not start.

## Endpoints (`/api/v1`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness check |
| GET | `/ghats` | Canonical ghat list with legal status and environmental priority as separate fields |
| GET | `/ghats/:ghatId` | Evidence, observations, per-parameter summaries, sources and limitations. Optional `?limit=1-500&offset=` pages the observations (all by default) |
| GET | `/ghats/:ghatId/sources` | Source reports with page references, plus the CPCB criteria source |
| GET | `/analytics/summary` | Dataset counts and CPCB Class B exceedances (valid readings only) |
| GET | `/analytics/rankings` | Deterministic ranking with explanation, methodology and score definition. Ghats with the same priority and score share a rank |
| POST | `/scenarios/compare` | Validated; returns `501 NOT_IMPLEMENTED` until the scenario service lands |
| POST | `/reports/brief` | English (`en`) or Hindi (`hi`) brief built from backend facts |

Examples:

```bash
curl http://localhost:5000/api/v1/analytics/rankings
curl -X POST http://localhost:5000/api/v1/reports/brief \
  -H "Content-Type: application/json" \
  -d '{"ghatId":"khatlapura-ghat","language":"hi"}'
```

Errors always use `{ "error": { "code", "message" } }`: `VALIDATION_ERROR` (400/413), `GHAT_NOT_FOUND` (404), `NOT_FOUND` (404), `RATE_LIMITED` (429), `NOT_IMPLEMENTED` (501), `INTERNAL_ERROR` (500). Stack traces are never returned.

## Data rules the API enforces

- **Legal status:** every ghat is `not_verified` until official evidence is added to `src/config/legalStatus.js`. Historical water quality is never used to infer legal status.
- **Coordinates:** the source reports give none, so they are `null` with `coordinateStatus: "not_verified"`.
- **Missing and BDL readings:** keep `numericValue: null` and are excluded from exceedance denominators. They are never treated as zero or clean.
- **Provenance:** every observation keeps the value as printed, its assumed unit, its `sourceId` (`mppcb-<year>-<festival>`) and its PDF page.

## How briefs are generated

Briefs are generated without any AI model. No external API is called and no API key is needed.

1. The request may contain only `ghatId`, `language` (`en` or `hi`) and `includeScenario`. Any other field is rejected.
2. The server builds a facts-only payload from the cached analytics.
3. A fixed English or Hindi template turns those facts into the brief. Every number in it comes from the facts; a test checks this for every ghat in both languages.
4. The brief never calls a ghat safe and never decides legal status. It always states the data years, missing data, source pages and limitations.

Brief generation is limited to 30 requests per minute per client IP; all other endpoints share a limit of 300 per minute.

## Deployment checklist

- **Host settings:** root directory `track-2-visarjan-ghat-watch/server`, build command `npm install`, start command `npm start`.
- **`CLIENT_ORIGIN`:** set `NODE_ENV=production` and set `CLIENT_ORIGIN` to the deployed frontend origin. The server refuses to start without `CLIENT_ORIGIN`.
- **`TRUST_PROXY`:** set it to the number of proxy hops when the server runs behind a reverse proxy, so rate limiting sees real client IPs.
- **Secrets:** set environment variables in the host's dashboard. Never commit a `.env` file.
