# GhatWatch AI — Express API

Node.js + Express REST API for GhatWatch AI. Contract: [`docs/API_CONTRACT.md`](../../docs/API_CONTRACT.md).

## Run it

```bash
cd track-2-visarjan-ghat-watch/server
npm install
cp .env.example .env      # optional: add CEREBRAS_API_KEY and CEREBRAS_MODEL for AI briefs
npm run dev               # http://localhost:5000/api/v1
npm test                  # no Cerebras key or network needed
```

Requires Node.js 18 or later.

## Persistence mode

The API uses a **validated in-memory dataset**. At startup it imports `../data/bhopal_ghats_2023_2025.csv` once using the data and analytics services, then serves cached results. It does not use MongoDB yet. If the import fails, the server does not start.

## Endpoints (`/api/v1`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness check; also reports whether AI briefs are configured |
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

Errors always use `{ "error": { "code", "message" } }`: `VALIDATION_ERROR` (400/413), `GHAT_NOT_FOUND` (404), `NOT_FOUND` (404), `RATE_LIMITED` (429), `NOT_IMPLEMENTED` (501), `AI_PROVIDER_ERROR` (502), `INTERNAL_ERROR` (500). Stack traces and secrets are never returned.

## Data rules the API enforces

- **Legal status:** every ghat is `not_verified` until official evidence is added to `src/config/legalStatus.js`. Historical water quality is never used to infer legal status.
- **Coordinates:** the source reports give none, so they are `null` with `coordinateStatus: "not_verified"`.
- **Missing and BDL readings:** keep `numericValue: null` and are excluded from exceedance denominators. They are never treated as zero or clean.
- **Provenance:** every observation keeps the value as printed, its assumed unit, its `sourceId` (`mppcb-<year>-<festival>`) and its PDF page.

## How briefs are generated

1. The server builds a facts-only payload from cached analytics. The request may contain only `ghatId`, `language` and `includeScenario`; any other field is rejected.
2. **If `CEREBRAS_API_KEY` and `CEREBRAS_MODEL` are set**, the facts go to Cerebras server-side. The key is never sent to the browser.
3. **The AI draft is discarded** and the deterministic template brief is returned when any of these is true:
   - the draft contains a number that is not in the facts, a number written as a word, or a negative number;
   - it makes a safety, legal or health claim (e.g. "is safe", "is prohibited", "fish deaths", "सुरक्षित है");
   - a Hindi request comes back mostly in Latin script.

   The number check confirms each number exists somewhere in the facts. It cannot tell if a real number is attached to the wrong parameter, so the prompt rules still matter.
4. **AI failures:** a timeout or provider error returns `502 AI_PROVIDER_ERROR`; provider rate limiting returns `429 RATE_LIMITED`. The rest of the API keeps working.
5. **Without AI configured**, the endpoint returns the template brief. `data.generator` is `"template"` or `"cerebras"`, and `meta.aiStatus` explains which one was used.

Brief generation is limited to 10 requests per minute per client IP; all other endpoints share a limit of 300 per minute.

## Deployment checklist

- Set `NODE_ENV=production` and `CLIENT_ORIGIN` to the deployed frontend origin. The server refuses to start without `CLIENT_ORIGIN`.
- Set `TRUST_PROXY` to the number of proxy hops when the server runs behind a reverse proxy, so rate limiting sees real client IPs.
- Provide `CEREBRAS_API_KEY` through the host's secret store. Never commit it.
