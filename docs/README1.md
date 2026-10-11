# Team Task Allocation — GhatWatch AI (MERN)

## Five members, clear ownership

| Member | Responsibility | Branch |
|---|---|---|
| Gaurvee | Scenario modelling in JavaScript/TypeScript | `feature/ml-scenarios` |
| Riddhi | CSV ingestion, validation, analytics, ranking | `feature/backend-analytics` |
| Gaurav | Express API, integration, Cerebras brief endpoint | `feature/backend-api` |
| Pratham | Google Maps, markers, map layers | `feature/frontend-map` |
| Ansh | Dashboard, ranking table, evidence panel, report UI | `feature/frontend-dashboard` |

## Shared integration contract
Read `../API_CONTRACT.md` and `../DATA_DICTIONARY.md` before coding. Use stable canonical `ghatId` values across all layers.

## Git rules
1. Each member works on their own feature branch.
2. Avoid changing another member's owned files without coordination.
3. Do not independently alter shared API shapes or canonical field names.
4. Keep pull requests small; integrate early.
5. Never commit `.env`, API keys, credentials, or private data.

## Build order
1. Riddhi validates source data and shares a sample response.
2. Gaurav establishes Express endpoints and error format.
3. Pratham and Ansh build against the agreed contract in parallel.
4. Gaurvee adds the transparent scenario service.
5. Gaurav integrates the report endpoint; all members test the end-to-end demo.

## Important
The stack is MERN. Data ingestion, analytics, and scenario calculations are in Node.js JavaScript/TypeScript. Cerebras is called from Express only; React must never receive the secret API key.
