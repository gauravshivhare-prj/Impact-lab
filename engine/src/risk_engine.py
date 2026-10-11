"""Visarjan Ghat Watch - Risk Intelligence Engine.

Provides preliminary screening of water quality observations against
Central Pollution Control Board (CPCB) Class B reference criteria for
outdoor bathing (organised).
"""

from typing import Any, Dict, Optional, Union
import numpy as np
import pandas as pd

# CPCB Class B reference screening criteria for outdoor bathing (organised)
# Note: Preliminary reference screening criteria only; not official safety certification.
CRITERIA: Dict[str, Dict[str, Any]] = {
    "pH": {
        "type": "range",
        "min": 6.5,
        "max": 8.5,
        "unit": "",
        "description": "pH reference range: 6.5–8.5"
    },
    "Dissolved oxygen": {
        "type": "min",
        "limit": 5.0,
        "unit": "mg/L",
        "description": "Dissolved Oxygen minimum: 5 mg/L"
    },
    "BOD": {
        "type": "max",
        "limit": 3.0,
        "unit": "mg/L",
        "description": "Biochemical Oxygen Demand maximum: 3 mg/L"
    }
}

# Aliases to match parameters flexibly without breaking on minor naming differences
PARAMETER_ALIASES = {
    "ph": "pH",
    "dissolved oxygen": "Dissolved oxygen",
    "dissolved_oxygen": "Dissolved oxygen",
    "do": "Dissolved oxygen",
    "d.oxygen": "Dissolved oxygen",
    "bod": "BOD",
    "bod (5 days 20c)": "BOD"
}


def canonical_parameter_name(parameter: str) -> str:
    """Resolve parameter string to standard CPCB criteria name if known."""
    if not isinstance(parameter, str):
        return str(parameter)
    cleaned = parameter.strip().lower()
    return PARAMETER_ALIASES.get(cleaned, parameter.strip())


def assess_parameter(parameter: str, value: Any) -> str:
    """Assess a single water quality parameter reading against CPCB Class B reference criteria.

    Handles:
    - Missing values (None, NaN, empty strings) -> "Insufficient data"
    - Non-quantified readings (BDL, 'not sampled', etc.) -> "Insufficient data"
      (Never treated as zero or assumed to be safe)
    - Valid numeric readings -> "Within reference" or "Outside reference"

    Returns:
        One of: "Within reference", "Outside reference", "Insufficient data", "Not assessed"
    """
    param_key = canonical_parameter_name(parameter)
    rule = CRITERIA.get(param_key)
    if rule is None:
        return "Not assessed"

    # Explicitly check for None or NaN
    if value is None or pd.isna(value):
        return "Insufficient data"

    # Handle string values such as BDL, 'not sampled', '*', '**'
    if isinstance(value, str):
        cleaned = value.strip().upper()
        if cleaned in ("BDL", "NOT SAMPLED", "*", "**", "NAN", "NONE", "", "_", "ND"):
            # Never treat BDL or unquantified readings as zero or safe
            return "Insufficient data"
        try:
            numeric_val = float(cleaned)
        except (ValueError, TypeError):
            return "Insufficient data"
    elif isinstance(value, (int, float, np.number)):
        numeric_val = float(value)
        if np.isnan(numeric_val):
            return "Insufficient data"
    else:
        try:
            numeric_val = float(value)
        except (ValueError, TypeError):
            return "Insufficient data"

    # Evaluate against criteria
    rule_type = rule.get("type")
    if rule_type == "range":
        if rule["min"] <= numeric_val <= rule["max"]:
            return "Within reference"
        return "Outside reference"

    if rule_type == "min":
        if numeric_val >= rule["limit"]:
            return "Within reference"
        return "Outside reference"

    if rule_type == "max":
        if numeric_val <= rule["limit"]:
            return "Within reference"
        return "Outside reference"

    return "Not assessed"


def assess_site(site_data: pd.DataFrame) -> Dict[str, Any]:
    """Assess all reference parameters for an immersion site / phase observation set.

    Evaluates:
    - pH: 6.5 - 8.5
    - Dissolved Oxygen: >= 5.0 mg/L
    - BOD: <= 3.0 mg/L

    Missing values and BDL readings are NEVER treated as zero and NEVER
    classified as safe. If readings are missing, the site is classified
    as 'Insufficient data' or 'Limited data' rather than 'Within reference'.

    Returns a dict with:
    - 'risk': Overall category ("Within reference", "Needs attention",
              "High concern", "Limited data", "Insufficient data")
    - 'violations': Count of parameters outside reference criteria
    - 'results': Per-parameter dict with 'value' and 'status'
    """
    results: Dict[str, Dict[str, Any]] = {}

    if site_data is None or site_data.empty:
        for parameter in CRITERIA:
            results[parameter] = {
                "value": None,
                "status": "Insufficient data"
            }
        return {
            "risk": "Insufficient data",
            "violations": 0,
            "results": results
        }

    for parameter in CRITERIA:
        # Match parameter flexibly
        matching = site_data[
            site_data["parameter"].astype(str).apply(canonical_parameter_name) == parameter
        ]

        value = None
        if not matching.empty:
            row = matching.iloc[0]
            flag = str(row.get("flag", "")).strip().upper() if "flag" in row and pd.notna(row["flag"]) else ""
            raw_val = row.get("value", None)

            # Never treat BDL as zero or safe; preserve as unquantified
            if flag == "BDL":
                value = None
            elif pd.notna(raw_val):
                try:
                    value = float(raw_val)
                    if np.isnan(value):
                        value = None
                except (ValueError, TypeError):
                    value = None
            else:
                value = None

        status = assess_parameter(parameter, value)

        results[parameter] = {
            "value": value,
            "status": status
        }

    violations = sum(
        1 for result in results.values()
        if result["status"] == "Outside reference"
    )

    available = sum(
        1 for result in results.values()
        if result["status"] != "Insufficient data"
    )

    if available == 0:
        risk = "Insufficient data"
    elif violations >= 2:
        risk = "High concern"
    elif violations == 1:
        risk = "Needs attention"
    elif available < len(CRITERIA):
        risk = "Limited data"
    else:
        risk = "Within reference"

    return {
        "risk": risk,
        "violations": violations,
        "results": results
    }
