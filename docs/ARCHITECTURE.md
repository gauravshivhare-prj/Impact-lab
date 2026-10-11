# System Architecture

## 1. Goals

-   Keep calculations deterministic and independent of the LLM.
-   Enable parallel work through clear module contracts.
-   Trace findings to data or official sources.
-   Separate legal status from environmental priority.
-   Treat Google Maps as a visualisation of verified location data, not
    a source of environmental facts.

## 2. Proposed stack

React + Vite; Google Maps JavaScript API; Python + FastAPI; pandas;
Recharts or simple UI charts; isolated Python ML/scenario module;
Cerebras API called server-side; Git + GitHub. Preserve the existing
working stack if one is already established.

## 3. High-level architecture

``` text
React + Vite Frontend
  ├── Google Maps UI (markers, layers, selection)
  └── Dashboard UI (ranking, evidence, legal status, brief)
                 |
             HTTP / JSON
                 |
            FastAPI Backend
  ├── Data loader and validation
  ├── Deterministic analytics/ranking
  ├── Legal-source registry
  ├── Scenario/ML adapter
  └── Brief-generation service → Cerebras
                 |
      Supplied CSVs and reference JSON/CSV
```

## 4. Module responsibilities

### Frontend

Render map, markers, layer toggles, ranking, evidence and error/loading
states. Do not calculate authoritative rankings in the browser.

### Data loader/validation

Load source CSVs, validate fields/units, preserve raw values and source
metadata, flag ambiguous site mappings and invalid observations.

### Analytics

Compare eligible measurements against configured criteria; compute
counts/rates/severity; apply documented ranking logic; return reasons
and source references.

### Legal registry

Store status, authority, source, applicable clause, scope and
verification date. Use `not_verified` unless authoritative evidence
establishes the current status. Never infer legality from a score.

### ML/scenario adapter

Return structured output, assumptions and limitations. Say "insufficient
data" where appropriate. Do not invent effect sizes or ecological
outcomes.

### Brief service

Send only validated facts and source references to Cerebras. Validate
output and provide a deterministic fallback if the API fails. Keep the
key on the server.

## 5. Suggested repository layout

``` text
ghatwatch/
├── frontend/
│   └── src/{components,pages,services,styles}/
├── backend/
│   ├── app/{routes,schemas,services}/
│   ├── tests/
│   └── requirements.txt
├── ml/
│   ├── data_checks.py
│   ├── baseline.py
│   ├── scenarios.py
│   └── README.md
├── data/{raw,processed,reference}/
├── docs/
│   ├── SRS.md
│   ├── PRD.md
│   ├── PHASES.md
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT.md
│   ├── API_CONTRACT.md
│   └── DATA_DICTIONARY.md
├── .gitignore
└── README.md
```

## 6. Google Maps notes

-   Store latitude/longitude and coordinate provenance.
-   Never guess coordinates for ambiguous names.
-   Marker click opens a detail panel.
-   Use separate encodings for environmental and legal status.
-   Provide a legend and a text/table alternative.
-   Restrict the API key to the intended app and required APIs.
-   Verify current Google Maps billing/configuration requirements.

## 7. Failure handling

-   Map API failure: retain ranking and location list.
-   Cerebras failure: show deterministic findings and fallback text.
-   Missing source: show "source unavailable"; do not invent citations.
-   Insufficient ML data: show "insufficient data".
-   Unverified legal status: show `not_verified`.
