# Product Requirements Document (PRD)

## Product
**GhatWatch AI — Evidence-led Visarjan Ghat Decision Support**

## Problem
People responsible for planning and managing idol immersion need a clear way to inspect historical water-quality observations, distinguish them from current legal restrictions, understand data gaps, and compare potential interventions. Reports and datasets can be difficult to explore together.

## Product vision
Connect historical water-quality evidence, verified legal restrictions, nearby environmental context, and transparent scenarios in one geospatial interface. Convert validated findings into concise Hindi/English briefs without presenting uncertain evidence as fact.

## Primary users
- Municipal/environmental operations teams.
- Hackathon evaluators and researchers.
- Community/environmental volunteers.
- Decision-makers who need traceable summaries.

## MVP experience
1. Open a Bhopal map and see verified ghat locations.
2. Switch environmental-priority, legal-status, and monitoring-coverage layers independently.
3. Select a ghat and inspect historical measurements, exceedances, sample counts, date range, and source references.
4. Compare its historic evidence with a consistent benchmark configuration.
5. Review verified legal-status evidence or see `not_verified`.
6. Explore nearby documented context without unsupported causal claims.
7. Run a clearly labelled hypothetical scenario.
8. Generate a Hindi or English brief from server-validated findings.

## Prioritised requirements

### P0 — Must have
- MERN application and working npm scripts.
- Canonical ghat/location IDs and verified coordinates.
- CSV/data import and validation in Node.js.
- Historical evidence dashboard.
- Transparent priority categories and data-coverage warnings.
- Independent legal-status field and layer.
- Map selection and evidence details.
- Server-side Cerebras integration for bilingual briefs.
- Clear source provenance, error states, and limitations.

### P1 — If time permits
- Scenario comparison panel.
- Verified nearby facilities/context.
- Exportable brief.
- Better chart filtering by year and parameter.

### P2 — Future
- Validated forecasting from sufficient longitudinal observations.
- Intervention effectiveness tracking using comparable pre/post data.
- Field reporting and cleanup coordination.
- Alternative immersion facility planner using verified authorisation, operational condition, capacity, and accessibility.

## Out of scope for the hackathon MVP
- Claiming real-time water monitoring without a live feed.
- Automatically determining legal permission from historical chemistry.
- Unsupported causal attribution of pollution.
- Unvalidated predictions or invented effectiveness percentages.
- A separate Python/FastAPI backend.
- A model-generated score that cannot be reproduced or explained.

## Success criteria
- A user can go from map to source-backed ghat evidence in two interactions.
- Environmental concern and legal status are never conflated in the UI or API.
- Missing data and historic date range are visible.
- Every legal status other than `not_verified` includes a source and verification date.
- Scenario output exposes assumptions and is not described as a measured outcome.
- English/Hindi brief accurately reflects backend-calculated data.

## Main risks and mitigations
- **Unverified legal orders:** default to `not_verified`; attach official evidence before assigning a status.
- **Sparse/uneven sampling:** show sample counts, missingness, and confidence limitations; avoid over-ranking small samples.
- **AI hallucination:** use structured backend facts, constrained prompting, and post-check returned values against supplied facts.
- **Maps or AI unavailable:** retain table/details experience and show graceful fallback errors.
- **Deadline/merge conflicts:** enforce file ownership, branch-per-feature, and early API/schema agreement.
