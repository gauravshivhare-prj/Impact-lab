# Implementation Phases and Four-Hour Hackathon Plan

## Build principle
Ship a trustworthy, working MERN vertical slice first. Do not start with advanced ML or AI prose before validated data and APIs work.

## Phase 0 — Align contracts (0:00–0:20)
**Everyone**
- Confirm the source CSV files and canonical ghat IDs.
- Read `API_CONTRACT.md` and `DATA_DICTIONARY.md`.
- Agree on legal-status rules and benchmark configuration.
- Confirm owners and create feature branches.
- Add `.env.example`; verify `.env` is ignored.

**Exit:** agreed data/API contract and clean branch setup.

## Phase 1 — Data and API foundation (0:20–1:10)
**Riddhi**
- Implement Node.js CSV ingestion, normalisation, validation, and missing-value handling.
- Add deterministic evidence aggregation and ranking.
- Write tests for parsing, `BDL`/`ND`, missing values, and threshold comparisons.

**Gaurav**
- Set up Express app, route/controller/service boundaries, error middleware, and API response shape.
- Add endpoints for ghats, summary, and ghat details.
- Connect Mongoose if persistence is required; for a time-limited demo, a validated in-memory/cache layer can serve read-only imported data.

**Exit:** API returns real, validated source-backed records.

## Phase 2 — Parallel frontend (0:35–1:50)
**Pratham**
- Build Google Maps page, verified markers, marker selection, and independent layer toggles.
- Clearly style unknown/unverified coordinates.

**Ansh**
- Build dashboard cards, ranking table, evidence panel, charts, empty/loading/error states.
- Use the agreed API contract and canonical IDs.

**Exit:** map and dashboard render API data, not hard-coded fake findings.

## Phase 3 — Scenario and bilingual brief (1:40–2:40)
**Gaurvee**
- Implement transparent scenario calculations in JavaScript/TypeScript.
- State assumptions and show baseline vs hypothetical scenario.
- Do not add a forecasting model unless the data and validation support it.

**Gaurav**
- Add report endpoint; call Cerebras from the server only.
- Send structured, validated facts and request a concise Hindi/English explanation with sources and limitations.

**Exit:** one scenario and one bilingual brief work end-to-end.

## Phase 4 — Integration and demo hardening (2:40–3:35)
**Everyone**
- Integrate small PRs; resolve API mismatches early.
- Test no-data, missing-coordinate, missing legal-source, and AI timeout states.
- Verify every number in the demo can be traced to source data or a documented formula.
- Confirm no secrets are tracked.

## Phase 5 — Demo rehearsal (3:35–4:00)
- Prepare a 2–3 minute story: map → historic evidence → legal status → scenario → bilingual brief.
- State dataset years and limitations explicitly.
- Rehearse with AI disabled to ensure core app still works.

## Branches and ownership
- `feature/backend-analytics` — Riddhi.
- `feature/backend-api` — Gaurav.
- `feature/ml-scenarios` — Gaurvee (scenario/analytics in JS/TS).
- `feature/frontend-map` — Pratham.
- `feature/frontend-dashboard` — Ansh.

Avoid concurrent edits to the same shared contract, root package files, or app entry points. One integration owner should approve changes to shared schemas.

## Definition of done
- App launches using documented npm scripts.
- API contracts match frontend usage.
- Core calculations have tests.
- Legal status is source-backed or `not_verified`.
- Historical vs current limitations are visible.
- No secrets or fabricated measurements are present.
