# Data Dictionary and Validation Rules

## Purpose
Define the canonical fields used by the MERN application. Preserve original source values and provenance; normalised values are additional fields, not replacements for raw data.

## Ghat
| Field | Type | Meaning |
|---|---|---|
| `ghatId` | string | Stable application ID shared by map, API, and dashboard |
| `name` | string | Display name from a verified source |
| `aliases` | string[] | Source-backed alternate spellings |
| `latitude` | number/null | Latitude only when sourced/verified |
| `longitude` | number/null | Longitude only when sourced/verified |
| `coordinateStatus` | enum | `verified`, `approximate`, `not_verified` |
| `locationSourceId` | string/null | Provenance for coordinates |

## Water-quality observation
| Field | Type | Meaning |
|---|---|---|
| `observationId` | string | Stable record identifier |
| `ghatId` | string | Reference to canonical ghat |
| `observedAt` | ISO date/null | Sampling/observation date |
| `year` | integer/null | Derived from observation date only if valid |
| `parameter` | string | Source parameter name |
| `rawValue` | string/number/null | Original source value/qualifier |
| `numericValue` | number/null | Parsed numeric value only when valid |
| `qualifier` | enum/null | `BDL`, `ND`, `missing`, or source-specific qualifier |
| `unit` | string/null | Original or verified normalised unit |
| `sourceId` | string | Source report/document identifier |
| `sourcePage` | string/number/null | Page/table/row reference where available |
| `validationStatus` | enum | `valid`, `missing`, `qualified`, `invalid`, `needs_review` |

## Legal status evidence
| Field | Type | Meaning |
|---|---|---|
| `ghatId` | string | Canonical location ID |
| `status` | enum | `authorised`, `prohibited`, `conditional`, `not_verified` |
| `sourceTitle` | string/null | Official source title |
| `sourceUrl` | string/null | Official source URL |
| `clauseOrOrder` | string/null | Applicable order, clause, or section |
| `scope` | string/null | Location and activity scope |
| `effectiveFrom` | ISO date/null | Effective start if specified |
| `effectiveTo` | ISO date/null | Effective end if specified |
| `verifiedAt` | ISO date/null | Date the team checked the source |
| `notes` | string/null | Carefully scoped explanation |

A status other than `not_verified` requires applicable, current official evidence. If evidence is unclear or stale, use `not_verified`.

## Environmental priority
Allowed categories:
- `higher_historical_concern`
- `moderate_historical_concern`
- `lower_observed_concern`
- `insufficient_data`

Priority must be based on a documented deterministic method. Show valid sample counts, coverage, observation period, relevant exceedances, and a plain-language explanation. Do not label a ghat “safe” based only on lower observed concern.

## Missing and qualified values
- **Missing/unsampled:** retain as missing; never coerce to zero or count as passing.
- **BDL:** preserve “below detection limit” and the source's detection-limit details where available. Do not silently set it to zero.
- **ND:** preserve “not detected” according to the source's convention. Do not assume ND and BDL mean the same thing unless the source defines them that way.
- **Invalid value:** preserve raw value, mark invalid/needs review, exclude from numeric calculations until resolved.
- **Duplicates:** use source IDs/row identity to detect duplicates; do not remove records solely because their values match.

## Benchmark configuration
CPCB outdoor bathing reference criteria cited for this project are commonly stated as:
- pH: 6.5–8.5
- Dissolved oxygen (DO): greater than 5 mg/L
- Biochemical oxygen demand (BOD): less than 3 mg/L

Before implementation, verify the exact operators, units, and test conditions in the official source selected by the team. Store these in one versioned configuration object and display the source. These benchmarks are not by themselves a legal decision rule for idol immersion.

## Dataset notes
The current project description refers to 1,524 rows across seven ghats and the years 2023–2025. Verify against the actual committed CSVs. Do not hard-code those counts if the source files differ. Dataset coverage is historical and cannot establish current 2026 conditions.

## Source-document record
Recommended fields: `sourceId`, `title`, `publisher`, `publishedAt`, `sourceUrl`, `retrievedAt`, `pageReferences`, `fileName`, `checksum` (optional), `notes`.

## Scenario record
Recommended fields: `scenarioId`, `ghatId`, `scenarioType`, `assumptions`, `changedInputs`, `methodDescription`, `baseline`, `scenarioOutput`, `isHypothetical: true`, `limitations`, `createdAt`.

## Data quality checklist
- Confirm encoding, delimiters, header names, date formats, and units.
- Keep original raw fields.
- Validate ghat names against canonical IDs; flag uncertain matches for review.
- Retain source-page identifiers.
- Count missingness by parameter and location.
- Ensure denominators include only valid applicable observations.
- Test that missing, BDL, ND, and invalid records do not become numeric zero.
