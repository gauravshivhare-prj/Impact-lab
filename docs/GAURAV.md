# Gaurav — Express API, Integration & AI Briefs

**Branch:** `feature/backend-api`  
**Primary ownership:** `server/src/routes/`, `server/src/controllers/`, API integration and report service.

## Mission
Build the Node.js/Express API contract and connect validated analytics, scenario results, and bilingual report generation into a working application.

## Responsibilities
1. Set up/maintain Express app configuration, route mounting, validation middleware, and consistent error responses.
2. Implement endpoints from `docs/API_CONTRACT.md`.
3. Integrate Riddhi's data/analytics services and Gaurvee's scenario service without duplicating calculations.
4. Implement `POST /reports/brief`; fetch authoritative facts from backend services, then call Cerebras server-side.
5. Support Hindi (`hi`) and English (`en`) briefs.
6. Keep AI output subordinate to backend facts: the model explains, not calculates scores or decides legal status.
7. Add route/controller tests and graceful handling for AI timeout/rate-limit/provider errors.
8. Coordinate with frontend members on response fields and error states.

## Files owned
- `server/src/app.js`
- `server/src/routes/*.routes.js`
- `server/src/controllers/*.controller.js`
- `server/src/services/reports/cerebras.service.js`
- `server/src/middleware/errorHandler.js`
- `server/src/validators/*.validator.js` (coordinate scenario validator with Gaurvee)
- `server/src/**/*.test.js` for API integration

## Deliverables
- Working Express REST endpoints for ghats, summary/rankings, scenarios, and briefs.
- Consistent success/error JSON envelopes.
- Server-only Cerebras integration.
- API test examples and updated setup instructions if needed.

## Guardrails
- Never place `CEREBRAS_API_KEY` in React/Vite client code.
- Never let AI invent measurements, legal determinations, or effectiveness figures.
- Legal status must be `not_verified` without applicable current official evidence.
- Do not return stack traces or secrets.
- Do not silently change the agreed API contract; coordinate changes before merging.
- No Python/FastAPI backend.

## Integration checklist
- [ ] Endpoints match `docs/API_CONTRACT.md`.
- [ ] API returns the same canonical `ghatId` used by frontend.
- [ ] AI errors do not crash the core dashboard.
- [ ] Tests pass without requiring a live Cerebras key.
- [ ] Open a PR from `feature/backend-api`.
