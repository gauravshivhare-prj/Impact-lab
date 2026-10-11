# GhatWatch AI --- Documentation Index

GhatWatch AI is a map-first environmental decision-support prototype for
reviewing historical water-quality observations at Bhopal immersion
locations. It combines traceable data analysis, Google Maps, verified
legal-status references, transparent scenarios and bilingual decision
briefs.

> **Boundary:** This is not a legal authority or live water-safety
> certification system. Historical observations do not establish current
> conditions. Environmental priority and legal/operational status must
> remain separate.

## Files

-   [SRS](SRS.md)
-   [PRD](PRD.md)
-   [Development phases](PHASES.md)
-   [Architecture](ARCHITECTURE.md)
-   [Development workflow and team roles](DEVELOPMENT.md)
-   [API contract](API_CONTRACT.md)
-   [Data dictionary](DATA_DICTIONARY.md)

## Team ownership

  Member    Ownership
  --------- ----------------------------------------------------------
  Gaurvee   ML and scenarios (`ml/`)
  Riddhi    Backend data loading, validation, analytics and ranking
  Gaurav    Backend API, integration and report-generation endpoints
  Pratham   Frontend Google Maps and geospatial interactions
  Ansh      Frontend dashboard, ranking/detail panels and report UI

## Proposed stack

React + Vite; Google Maps JavaScript API; Python + FastAPI; pandas;
isolated Python ML/scenario module; Cerebras API called server-side;
Git + GitHub. If the repository already uses another working stack,
preserve it and keep these module boundaries.

## Official references

-   [MPPCB official website and water-monitoring
    reports](https://www.mppcb.mp.gov.in/)
-   [MPPCB idol-immersion orders, guidelines and
    reports](https://www.mppcb.mp.gov.in/Ganisheng-2021.aspx)
-   [MPPCB 2023 idol-immersion reports
    page](https://www.mppcb.mp.gov.in/Ganisheng-2023.aspx)
-   [CPCB water-quality monitoring report and outdoor-bathing
    criteria](https://cpcb.nic.in/wqm/Report-idol-imersion-2021.pdf)
-   [Revised idol-immersion guidelines (PDF hosted by
    MPCB)](https://www.mpcb.gov.in/sites/default/files/water-quality/water-quality-status/RevisedGuidelines09092021.pdf)
-   [Google Maps JavaScript
    API](https://developers.google.com/maps/documentation/javascript)

Verify the latest applicable official order before displaying a
location-specific legal status. A historical report or news article is
not a substitute for the applicable official order.

## Important rules

-   Supplied data covers historical observations (currently 2023--2025),
    not live monitoring.
-   Reference bathing-water criteria include pH 6.5--8.5, DO \>5 mg/L
    and BOD \<3 mg/L; confirm the exact source and operators in the
    configured criteria. These are not a universal legal permission test
    for every immersion site.
-   Preserve missing, BDL and ND as distinct states.
-   Threshold exceedance alone does not prove an activity is illegal.
-   Do not claim measured fish mortality, pollution causation or
    validated 5--10-year forecasts without evidence.
-   Never commit `.env` or API keys.
