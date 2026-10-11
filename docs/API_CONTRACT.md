# API Contract — Express REST API

Base URL during development: `http://localhost:5000/api/v1`

All responses use JSON. API data should be calculated or loaded by Node.js services. Property names below are the agreed contract; implementation may add optional fields without breaking existing clients.

## Standard response shapes

Success:
```json
{
  "data": {},
  "meta": {}
}
```

Error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be validated."
  }
}
```

## `GET /ghats`
Returns the canonical ghat list and verified coordinates.

Example:
```json
{
  "data": [
    {
      "ghatId": "canonical-ghat-id",
      "name": "Display name",
      "latitude": 23.0,
      "longitude": 77.0,
      "coordinateStatus": "verified",
      "legalStatus": "not_verified",
      "environmentalPriority": "insufficient_data"
    }
  ],
  "meta": { "count": 1 }
}
```

`coordinateStatus`: `verified`, `approximate`, `not_verified`. Do not render approximate coordinates as exact.

## `GET /ghats/:ghatId`
Returns location, legal evidence, summary, observations/aggregates, sources, and caveats.

Example:
```json
{
  "data": {
    "ghatId": "canonical-ghat-id",
    "name": "Display name",
    "legal": {
      "status": "not_verified",
      "sourceTitle": null,
      "sourceUrl": null,
      "clauseOrOrder": null,
      "effectiveFrom": null,
      "effectiveTo": null,
      "verifiedAt": null
    },
    "historicalEvidence": {
      "startYear": 2023,
      "endYear": 2025,
      "sampleCount": 0,
      "coverage": "insufficient_data",
      "priority": "insufficient_data",
      "exceedances": [],
      "observations": []
    },
    "sources": [],
    "limitations": ["Historical data does not certify current conditions."]
  }
}
```

## `GET /analytics/summary`
Returns aggregate counts and dataset coverage. Do not include missing values in a pass denominator.

## `GET /analytics/rankings`
Returns deterministically ranked ghats with:
- `ghatId`
- `priority`
- `score` (nullable if data is insufficient)
- `explanation`
- `validSampleCount`
- `coverage`
- `observationPeriod`
- `sourceIds`

Ranking methodology and weights must be documented in code/docs before showing a numeric score. If there is not enough data to support a defensible score, return a category and explanation instead of inventing precision.

## `GET /ghats/:ghatId/sources`
Returns source metadata and source-page/report references used by that ghat's evidence.

## `POST /scenarios/compare`
Request:
```json
{
  "ghatId": "canonical-ghat-id",
  "scenarioType": "hypothetical_monitoring_or_waste_management",
  "assumptions": {
    "description": "User-defined assumption",
    "changedInputs": []
  }
}
```
The server validates the scenario type and inputs. Response must label the result as hypothetical, return the calculation method and assumptions, and avoid unsupported effectiveness percentages.

## `POST /reports/brief`
Request:
```json
{
  "ghatId": "canonical-ghat-id",
  "language": "hi",
  "includeScenario": false
}
```
`language`: `en` or `hi`.

The Express service fetches validated evidence and calls Cerebras server-side. Do not accept arbitrary user-provided facts as authoritative report data. Return:
```json
{
  "data": {
    "language": "hi",
    "brief": "Generated explanation...",
    "factsUsed": [],
    "sourceIds": [],
    "limitations": ["Historical evidence is not a live reading."],
    "generatedAt": "ISO-8601 timestamp"
  }
}
```

## Status and error codes
- `400 VALIDATION_ERROR`
- `404 GHAT_NOT_FOUND`
- `422 INSUFFICIENT_DATA`
- `429 RATE_LIMITED`
- `502 AI_PROVIDER_ERROR`
- `500 INTERNAL_ERROR`

Never send stack traces, API keys, or internal secrets to the client.

## Shared contract rules
- `ghatId` must be stable and identical in map, dashboard, observations, and API.
- Legal status and environmental priority are separate fields.
- Unknown legal status is `not_verified`, not an empty string or an inferred status.
- Dates are ISO 8601; units are explicit.
- Preserve qualifiers such as `BDL` and `ND`.
