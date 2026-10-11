# Ansh — Dashboard, Evidence Panel & Report UI

**Branch:** `feature/frontend-dashboard`  
**Primary ownership:** `client/src/features/dashboard/`, `client/src/features/evidence/`, `client/src/features/reports/`  
**Stack:** React + Vite.

## Mission
Build the dashboard experience that turns API data into understandable, traceable evidence: summaries, rankings, charts, details, and Hindi/English briefs.

## Responsibilities
1. Build summary cards for dataset coverage, valid samples, historic period, and available observations.
2. Build the ranked ghat table using API-returned priority, explanation, sample count, and coverage.
3. Build the selected-ghat evidence panel with dates, parameters, values, units, source references, and limitations.
4. Add charts only where data supports them; show missing values as gaps, not zero.
5. Add a Hindi/English report-generation UI using the Express endpoint.
6. Add loading, empty, error, and insufficient-data states.
7. Ensure the UI never calls Cerebras directly from the browser.
8. Coordinate the selected-ghat interaction and shared component props with Pratham.

## Files owned
- `client/src/features/dashboard/Dashboard.jsx`
- `client/src/features/dashboard/RankingTable.jsx`
- `client/src/features/dashboard/SummaryCards.jsx`
- `client/src/features/evidence/EvidencePanel.jsx`
- `client/src/features/evidence/WaterQualityChart.jsx`
- `client/src/features/reports/BriefPanel.jsx`
- `client/src/services/api.js` (coordinate with other frontend contributors before changes)

## Deliverables
- Dashboard with real API-driven summary cards and ranking table.
- Evidence panel and source/limitation display.
- Bilingual brief UI.
- Responsive loading/error/empty states.
- Basic component tests where practical.

## Guardrails
- Do not label a ghat “safe” based only on lower observed historical concern.
- Do not conflate legal status with environmental priority.
- Do not convert missing values to zero or pass.
- Display historic data years and limitations.
- Do not fabricate chart data.
- No direct client-side Cerebras calls or secret keys.
- Avoid editing Pratham's map components; coordinate shared API service edits.
- No Python backend.

## Integration checklist
- [ ] All rows/details use the canonical `ghatId`.
- [ ] Data and source dates are visible.
- [ ] Missing/insufficient data is clearly represented.
- [ ] Hindi/English brief endpoint is integrated.
- [ ] Open a PR from `feature/frontend-dashboard`.
