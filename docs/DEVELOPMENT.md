# Development Workflow and Team Responsibilities

## 1. Team assignments

  -----------------------------------------------------------------------------------------------
  Member            Role              File/folder ownership                    Deliverables
  ----------------- ----------------- ---------------------------------------- ------------------
  Gaurvee           ML                `ml/`                                    Data-suitability
                                                                               checks, baseline,
                                                                               scenario function
                                                                               and limitations

  Riddhi            Backend ---       `backend/app/services/data_loader.py`,   CSV loading,
                    data/analytics    `validation.py`, `analytics.py`, unit    validation,
                                      tests                                    criteria
                                                                               comparisons,
                                                                               counts and ranking

  Gaurav            Backend ---       `backend/app/main.py`,                   FastAPI endpoints,
                    API/integration   `backend/app/routes/`,                   response schemas
                                      `backend/app/schemas/`, brief            and service
                                      integration                              integration

  Pratham           Frontend --- map  `frontend/src/components/map/` and       Google Maps,
                                      map-specific services                    verified markers,
                                                                               layer controls and
                                                                               selection

  Ansh              Frontend ---      `frontend/src/pages/`, non-map           Ranking table,
                    dashboard         components and dashboard styles          detail/evidence
                                                                               panel, report UI
                                                                               and loading/error
                                                                               states
  -----------------------------------------------------------------------------------------------

Coordinate before editing another member's owned files.

## 2. Merge-conflict prevention

-   Riddhi owns analytics; Gaurav calls it rather than rewriting it.
-   Gaurav owns API routing/shared backend schemas.
-   Pratham owns map-specific components; Ansh owns
    dashboard/detail/report components.
-   Gaurvee owns `ml/`; other members integrate through the agreed
    adapter contract.
-   Assign one owner for `README.md`, dependency files and shared schema
    changes.
-   Keep raw supplied data read-only; put derived data in
    `data/processed/`.
-   Freeze `API_CONTRACT.md` and `DATA_DICTIONARY.md` before parallel
    coding.

## 3. Branches

``` text
main
├── feature/ml-scenarios
├── feature/backend-analytics
├── feature/backend-api
├── feature/frontend-map
└── feature/frontend-dashboard
```

Each member pulls latest `main`, works on their branch, commits small
working changes, pushes, requests review and tests after merge. Do not
have everyone commit directly to `main`. Integrate early.

## 4. Development order

1.  Create repository, folders, `.gitignore`, `.env.example` and health
    checks.
2.  Inspect CSV columns and agree on schema.
3.  Riddhi implements loader/validation/analysis; Gaurav creates
    routes/contracts.
4.  Pratham builds the map against mock data; Ansh builds the dashboard
    against mock JSON.
5.  Gaurvee assesses whether the data supports a meaningful scenario.
6.  Connect frontend to real API data.
7.  Integrate legal records and scenario output.
8.  Add Cerebras brief generation last, with a fallback.
9.  Run QA and rehearse the demo.

## 5. Test checklist

-   Missing stays missing; BDL and ND are not zero.
-   Units and operators match the chosen criterion source.
-   Unequal sample counts are disclosed.
-   Ranking is reproducible.
-   Unknown legal status remains `not_verified`.
-   Historical observations are not described as current.
-   Map/API/LLM failures do not hide deterministic findings.
-   Coordinates and nearby points are verified or clearly labelled
    approximate.
-   Public repo has no secrets.

## 6. Security

-   Never commit `.env`, tokens, API keys or credentials.
-   Commit `.env.example` with placeholder names only.
-   Restrict the Google Maps browser key by referrer and required APIs.
-   Keep the Cerebras key on the backend.
-   If a secret is committed, rotate it; deleting it from the latest
    file may not remove it from Git history.

## 7. Definition of done

A task is complete when it works against the agreed contract, handles
empty/error states, does not fabricate data, has been tested, and is
ready for a small reviewable commit.
