# Product Requirements Document (PRD)

## 1. Product

**GhatWatch AI** --- From historical water-quality reports to
evidence-backed environmental decisions.

## 2. Problem

Historical water-quality reports can be difficult to compare quickly
across immersion locations. Data may be incomplete, site names may be
ambiguous, and a historical environmental concern is not equivalent to a
current legal restriction or live safety assessment.

## 3. Vision

A map-first workflow that helps a user locate monitored sites,
understand historical findings, inspect evidence and uncertainty, check
legal-status references, explore transparent scenarios and generate a
concise Hindi/English brief.

## 4. Primary user and job

**Primary user:** municipal/environmental planning officer.\
**Job:** "Help me quickly understand the historical evidence, what
remains uncertain, and which next steps should be considered---without
confusing historical data with current conditions or legal
authorisation."

## 5. Core experience

### A. Map Intelligence

-   Google Map centred on the verified Bhopal study area.
-   Marker for each mapped ghat.
-   Separate layers for environmental findings, legal status, data
    coverage and verified nearby context.
-   Click marker to open location details.
-   Filters by location, year, parameter and evidence availability.

### B. Environmental Evidence

Show supported parameters, valid sample count, exceedance count/rate,
observation year/date, source-page reference, data coverage and latest
observation. Preserve missing, BDL and ND.

### C. Explainable ranking

Use deterministic, documented logic. Candidate inputs:
parameter-specific exceedance rates, severity, recurrence, sample
counts, recency and missingness. Do not rank by raw counts alone where
sample sizes differ.

Suggested labels: `higher_historical_concern`,
`moderate_historical_concern`, `lower_observed_concern`,
`insufficient_data`. These describe available evidence, not legal status
or guaranteed current safety.

### D. Legal/operational reference

Display status (`authorised`, `prohibited`, `conditional`,
`not_verified`), official source, applicable clause, dates, scope and
conditions. Keep this layer visually separate from environmental
priority.

### E. Nearby environmental context

Only display sourced monitoring locations, documented environmental
points, verified alternative facilities or recorded cleanup points. Show
distance and source. Proximity alone does not prove contamination or
causation.

### F. Scenario lab

Start with a historical baseline and a small number of explicitly
hypothetical intervention scenarios. Do not invent effectiveness
percentages. If data is insufficient for a defensible forecast, say so.

### G. Bilingual brief

Cerebras may explain validated backend facts in Hindi or English. It
must not calculate scores, invent citations, decide legal status or
introduce unsupported ecological claims.

## 6. Differentiator

GhatWatch combines map-first evidence exploration, reproducible
environmental prioritisation, separate legal-status evidence, explicit
data-quality indicators, nearby verified context, transparent scenarios
and bilingual reporting. It is a decision-support layer, not a
replacement for MPPCB, CPCB, BMC or laboratory systems.

## 7. Priorities

**P0:** supplied dataset, correct comparisons, explainable ranking,
Google Map markers, evidence panel, missing/BDL/ND handling,
legal-status panel, README and secret check.\
**P1:** bilingual brief, nearby verified points, scenario interface,
location comparison.\
**P2:** authorised data imports, intervention-effectiveness tracking
using comparable pre/post measurements, facility planning with verified
capacity, advanced forecasting after validation.

## 8. Demo success

User selects a mapped site, sees real findings and source evidence,
understands sample counts and uncertainty, sees legal status
independently, and can generate a cautious bilingual brief. Scenario
output is explicitly labelled hypothetical unless validated.
