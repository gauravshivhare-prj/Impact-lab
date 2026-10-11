# Gaurvee — Scenarios & Environmental Modelling

**Branch:** `feature/ml-scenarios`  
**Primary ownership:** `server/src/services/scenarios/` and scenario tests  
**Stack:** JavaScript/TypeScript on Node.js. No Python service.

## Mission
Build a transparent scenario-comparison module. This is not a black-box predictor. It should compare a documented historical baseline with hypothetical user-defined changes and clearly explain assumptions and limitations.

## Responsibilities
1. Review the dataset and coordinate with Riddhi on which validated metrics are available.
2. Implement scenario input validation and deterministic calculations in JavaScript/TypeScript.
3. Define scenario types that the current evidence can actually support.
4. Return baseline, changed assumptions, scenario output, calculation method, and limitations.
5. Add unit tests for valid, invalid, boundary, and insufficient-data cases.
6. Coordinate with Gaurav so the service response matches `docs/API_CONTRACT.md`.

## Files owned
- `server/src/services/scenarios/scenario.service.js` (or `.ts`)
- `server/src/validators/scenario.validator.js`
- `server/src/services/scenarios/scenario.service.test.js`
- Any scenario-specific documentation under `docs/`

Do not edit shared API schemas without coordinating with Gaurav. Do not change other members' files without discussion.

## Deliverables
- One working scenario type with explicit assumptions.
- A baseline-vs-scenario result object.
- A plain-language explanation of the calculation.
- Unit tests.
- A short demo example with clearly hypothetical inputs.

## Guardrails
- Do not invent effectiveness percentages or call hypothetical results forecasts.
- Do not claim causal environmental improvement without validated comparative evidence.
- If the dataset cannot support a numeric projection, return an explicit `insufficient_data` result and explain why.
- Keep legal status separate from environmental priority.
- No Python/FastAPI/pandas backend.

## Integration checklist
- [ ] Inputs follow `docs/API_CONTRACT.md`.
- [ ] Scenario output includes `isHypothetical: true`.
- [ ] Assumptions and limitations are visible to the frontend.
- [ ] Tests pass.
- [ ] Open a PR from `feature/ml-scenarios`.
