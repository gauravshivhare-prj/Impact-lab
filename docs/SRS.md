# Software Requirements Specification (SRS)

## 1. Purpose
Specify the minimum viable GhatWatch AI system: a MERN web application for exploring historical water-quality evidence and verified legal/operational information about Bhopal idol-immersion ghats.

## 2. System scope
The application presents historical evidence, monitoring coverage, environmental-priority indicators, legal-status evidence, sourced nearby context, and transparent hypothetical scenarios. It is a decision-support tool, not a live monitoring system, legal authority, or guarantee of present water safety.

## 3. Technology requirements
- **Client:** React + Vite.
- **API:** Node.js + Express.js REST API.
- **Persistence:** MongoDB + Mongoose.
- **Maps:** Google Maps JavaScript API.
- **AI text:** Cerebras API called from the Express server.
- **No Python/FastAPI service is part of the MVP.** CSV parsing, validation, metrics, and scenario calculations run in Node.js services.

## 4. Functional requirements

### FR-01: Ghat map
Display only locations with a verified coordinate/source or clearly label uncertain locations. Users can select a marker and open its evidence panel. Environmental-priority and legal-status layers must be independently switchable.

### FR-02: Historical evidence
For each ghat, show available observations, parameter values, sample counts, observation dates/years, source references, and missing-data coverage. Preserve the original source page/report identifier.

### FR-03: Environmental benchmarks
Where configured, compare measurements with the chosen official reference criteria. Current documentation references CPCB outdoor bathing criteria commonly stated as pH 6.5–8.5, DO greater than 5 mg/L, and BOD less than 3 mg/L. Verify the exact wording in the selected official source before implementation and keep thresholds centrally configured. These are comparison benchmarks, not a universal legal permission test for idol immersion.

### FR-04: Explainable priority
Calculate a deterministic historical-priority score or category using documented inputs and sample coverage. Show why a ghat received its category. Use `higher_historical_concern`, `moderate_historical_concern`, `lower_observed_concern`, or `insufficient_data`. Do not imply these labels describe current conditions.

### FR-05: Legal status
Use one of `authorised`, `prohibited`, `conditional`, `not_verified`. A status other than `not_verified` requires a current applicable official source, relevant clause/order, scope, effective dates where available, and verification date. Historical water-quality reports are not proof of legal status.

### FR-06: Nearby environmental context
Show sourced and verified monitoring points, documented drains/outfalls, cleanup points, and alternative immersion facilities only when evidence is available. Display distance and provenance. Proximity is not causal proof.

### FR-07: Scenario lab
Compare a historical baseline with explicitly hypothetical scenarios. Show assumptions, parameters changed, calculation method, and uncertainty. Do not claim causal impact or effectiveness without validated comparative evidence.

### FR-08: Bilingual brief
Allow users to generate an English or Hindi summary. Express backend-calculated facts to Cerebras as structured, validated input. The model may explain the facts but must not create measurements, legal determinations, or numerical predictions. Include sources, data dates, and limitations.

### FR-09: API reliability
Return consistent JSON, validation errors, not-found responses, and server errors. Do not expose credentials or internal stack traces.

### FR-10: Data provenance
Each imported record should retain its source, source page/report identifier where available, date, units, and original value/qualifier.

## 5. Non-functional requirements
- Explainability: scores and thresholds are visible to users.
- Data integrity: source values are preserved and validation failures are logged.
- Security: secrets server-side only; validate and constrain all request inputs.
- Performance: paginate large evidence lists and avoid repeated full CSV parsing per request.
- Accessibility: keyboard-operable controls, readable contrast, and text equivalents for map information.
- Resilience: map/API/AI failures should not blank the whole dashboard.
- Reproducibility: deterministic analytics must give the same output for the same validated dataset and configuration.

## 6. Data and scientific constraints
- Dataset coverage currently described as 1,524 rows across seven ghats, with observations from 2023–2025; verify these counts against the committed data before hard-coding.
- Missing values are not zero or clean.
- `BDL` and `ND` retain source semantics.
- Only describe chromium, lead, zinc, and copper when present in the supplied dataset.
- Do not claim actual aquatic mortality or assign mortality percentages without evidence.
- Historic evidence cannot certify 2026 conditions.

## 7. Acceptance criteria
- The app starts with documented npm commands.
- Map markers and dashboard rows use the same canonical ghat IDs.
- Legal status and environmental priority are displayed independently.
- Each score has a human-readable explanation.
- Missing data is visibly marked and excluded appropriately from denominators.
- Brief generation uses server-side Cerebras credentials and only validated facts.
- No API key, `.env` file, or credentials are committed.
- Core parsing, validation, ranking, and API routes have tests.
