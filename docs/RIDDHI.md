# Riddhi — Data Ingestion, Validation & Analytics

**Branch:** `feature/backend-analytics`  
**Primary ownership:** `server/src/services/data/`, `server/src/services/analytics/`  
**Stack:** Node.js JavaScript/TypeScript; MongoDB/Mongoose only if persistence is used.

## Mission
Turn the supplied historical CSV files into validated, traceable records and deterministic evidence summaries. The analytics layer must be explainable and must not treat missing data as clean.

## Responsibilities
1. Inspect the actual files in `data/`; confirm row counts, headers, date formats, units, ghat names, and source references.
2. Implement CSV ingestion using a Node-compatible CSV parser.
3. Preserve original raw values and source-page/report identifiers.
4. Normalise data only when units and formats are known; flag ambiguous values for review.
5. Handle missing values, `BDL`, and `ND` according to the source convention.
6. Calculate sample counts, valid denominators, benchmark comparisons, monitoring coverage, and deterministic historical-priority categories.
7. Document the ranking methodology and add unit tests.
8. Provide stable output fields for Gaurav's API and Pratham/Ansh's frontend.

## Files owned
- `server/src/services/data/csvImport.service.js`
- `server/src/services/data/validation.service.js`
- `server/src/services/data/normalisation.service.js`
- `server/src/services/analytics/evidence.service.js`
- `server/src/services/analytics/ranking.service.js`
- `server/src/services/analytics/*.test.js`
- `docs/DATA_DICTIONARY.md` (coordinate shared edits first)

## Deliverables
- Reproducible CSV import/loader.
- Validation and normalisation rules.
- Summary metrics and explainable priority categories.
- Tests covering missing, `BDL`, `ND`, invalid values, and low sample counts.
- A short data-quality note listing known limitations.

## Guardrails
- Missing/unsampled is not zero or a pass.
- Preserve `BDL`/`ND`; don't silently turn them into zero.
- Only discuss metals actually present in the dataset (chromium, lead, zinc, copper).
- Historical 2023–2025 data does not certify current 2026 conditions.
- Keep environmental priority separate from legal status.
- Do not hard-code claimed row counts; calculate them from the real files.
- No Python/pandas/FastAPI.

## Integration checklist
- [ ] Import is repeatable and source traceability is preserved.
- [ ] Numeric comparisons use verified units and configured thresholds.
- [ ] Each ranking includes explanation, sample count, and coverage.
- [ ] Tests pass.
- [ ] Open a PR from `feature/backend-analytics`.
