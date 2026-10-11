# API Contract

Freeze these contracts before parallel coding. Names may be adjusted
once, by agreement, before implementation.

## Conventions

-   Base path: `/api`
-   Format: JSON
-   Coordinates: decimal degrees
-   Missing/uncomputable metrics: `null`, with an explanatory state
    where useful
-   Legal status: `authorised`, `prohibited`, `conditional`,
    `not_verified`
-   Environmental priority: `higher_historical_concern`,
    `moderate_historical_concern`, `lower_observed_concern`,
    `insufficient_data`

## Endpoints

### `GET /api/health`

``` json
{"status":"ok"}
```

### `GET /api/ghats`

Returns mapped locations for the map and ranking list.

``` json
{
  "items": [{
    "ghat_id": "GHAT_001",
    "name": "Example location",
    "latitude": null,
    "longitude": null,
    "coordinate_status": "unverified",
    "environmental_priority": "insufficient_data",
    "legal_status": "not_verified",
    "latest_observation_year": null
  }]
}
```

Example only; do not ship placeholder coordinates as real.

### `GET /api/ghats/{ghat_id}/analysis`

Returns a location's parameters, valid sample counts, exceedance rates,
observations, criteria/source references and limitations.

### `GET /api/rankings`

Returns sorted locations, ranking method/version, score if defined,
valid sample counts and reason codes. Return `null` rather than
inventing a score.

### `GET /api/legal-status`

Returns source-backed legal records, including status, authority,
document title, source URL, applicable clause, scope and verification
date.

### `POST /api/scenarios`

Example request:

``` json
{
  "ghat_id": "GHAT_001",
  "scenario_type": "additional_monitoring",
  "assumptions": {"description":"Illustrative scenario; no effect size assumed."}
}
```

Example response:

``` json
{
  "scenario_type": "additional_monitoring",
  "is_hypothetical": true,
  "quantified_effect": null,
  "result_summary": "Effect cannot be quantified from the supplied data alone.",
  "assumptions": ["No measured intervention-effectiveness value supplied."],
  "data_limitations": ["Historical observations do not establish current conditions."]
}
```

### `POST /api/brief`

Accepts a location ID, language (`en` or `hi`), validated findings,
legal status and limitations. Returns brief text, cited source
references and caveats. The LLM must not calculate the ranking or invent
sources.

## Error shape

``` json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested location was not found."
  }
}
```

## Contract rules

-   Do not use illustrative values as real findings.
-   Include sample counts with rates.
-   Return `null` when a metric cannot be calculated.
-   Include source references where available.
-   Keep legal status independent of environmental priority.
-   ML output includes assumptions and limitations.
