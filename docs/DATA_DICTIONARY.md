# Data Dictionary and Data Rules

## 1. Water-quality observations

Use the actual supplied CSV headers as the source of truth. Map original
columns to this logical schema without destroying raw values.

  -----------------------------------------------------------------------
  Field                   Type                    Meaning
  ----------------------- ----------------------- -----------------------
  `observation_id`        string                  Stable ID generated for
                                                  the imported row

  `site_name_raw`         string                  Original site name

  `ghat_id`               string/null             Normalised location ID
                                                  only when mapping is
                                                  supported

  `observation_date`      date/null               Sampling date, if
                                                  available

  `year`                  integer/null            Sampling year

  `phase`                 string/null             Pre/post or festival
                                                  phase if provided

  `parameter`             string                  Parameter measured

  `value_raw`             string                  Original source value,
                                                  preserved verbatim

  `value_numeric`         number/null             Parsed value when valid

  `unit`                  string/null             Original/verified unit

  `result_state`          enum                    `numeric`, `missing`,
                                                  `BDL`, `ND`, `invalid`
                                                  or source-specific
                                                  state

  `source_document`       string/null             Report/file identifier

  `source_page`           string/integer/null     Page reference

  `mapping_confidence`    enum                    `high`, `medium`,
                                                  `low`, `unmapped`

  `notes`                 string/null             Parsing or source notes
  -----------------------------------------------------------------------

## 2. Required handling

-   **Missing:** blank/unsampled is missing evidence, not zero or a
    pass.
-   **BDL:** below detection limit; preserve raw value and detection
    limit if available. Do not replace with zero by default.
-   **ND:** preserve the source's meaning; do not assume it is identical
    to BDL unless the source defines it that way.
-   **Invalid:** flag for review; disclose rows excluded from
    calculations.
-   **Ambiguous site names:** do not merge similar names without
    evidence. Preserve raw name and mapping confidence.
-   **Unequal sample counts:** show valid counts with rates; avoid
    ranking on raw counts alone.
-   **Historical vs current:** the supplied observations cover
    2023--2025 and do not establish current conditions.

## 3. Criteria configuration

Store criteria separately from code.

  Field                           Meaning
  ------------------------------- ---------------------------------
  `parameter`                     Parameter name
  `unit`                          Unit
  `operator`                      `between`, `>`, `>=`, `<`, `<=`
  `lower_bound` / `upper_bound`   Optional bounds
  `threshold_value`               Optional single value
  `criterion_name`                Standard/category name
  `source_authority`              Issuing authority
  `source_url`                    Official source
  `applicability_note`            Where/when it applies
  `verified_on`                   Date checked

Initial outdoor-bathing reference values include pH 6.5--8.5, DO \>5
mg/L and BOD \<3 mg/L. Confirm exact operators and units in the selected
source before implementation. These values are not a universal legal
immersion-permission test. Compare other parameters only when
applicability, units and measurement basis are verified.

## 4. Legal-status records

Suggested fields: `ghat_id`, `status`, `authority`, `document_title`,
`source_url`, `document_date`, `effective_from`, `effective_to`,
`applicable_clause`, `scope`, `verified_on`, `verification_notes`.

Use `not_verified` unless an applicable authoritative source establishes
the status. A monitoring report alone does not prove permission or
prohibition.

## 5. Google Maps location records

Suggested fields: `ghat_id`, `display_name`, `latitude`, `longitude`,
`coordinate_source`, `coordinate_status` (`verified`, `approximate`,
`unverified`), `mapping_confidence`, `notes`.

Do not invent coordinates. If a location is ambiguous, withhold the
marker or label it approximate and disclose the reason.

## 6. Nearby environmental context

Only include sourced monitoring locations, documented environmental
points, verified alternative facilities or recorded cleanup locations.
Store source, verification status and coordinates. Geographic proximity
alone does not prove pollution, contamination or causation.
