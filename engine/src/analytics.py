"""Visarjan Ghat Watch - Water Quality Analytics Module.

Provides analytical computations, risk summaries, phase comparisons, and
historical trend aggregations for Bhopal immersion sites.
"""

from typing import Any, Dict, List, Optional
import pandas as pd
from .risk_engine import assess_site


def compute_ghat_risk_summary(
    df: pd.DataFrame,
    year: int,
    festival: str,
    phase: str
) -> pd.DataFrame:
    """Compute risk assessment and exceedances for all ghats for a given year, festival, and phase.

    Returns:
        pd.DataFrame with columns:
        ['Ghat', 'Water Body', 'Risk Assessment', 'Reference Exceedances', 'Site Match']
    """
    filtered = df[
        (df["year"] == year) &
        (df["festival"] == festival) &
        (df["phase"] == phase)
    ]

    risk_rows: List[Dict[str, Any]] = []

    for site in sorted(filtered["site"].dropna().unique()):
        site_data = filtered[filtered["site"] == site]
        assessment = assess_site(site_data)
        water_body = site_data["water_body"].iloc[0] if "water_body" in site_data and not site_data.empty else "Unknown"
        site_match = site_data["site_match_confidence"].iloc[0] if "site_match_confidence" in site_data and not site_data.empty else "N/A"

        risk_rows.append({
            "Ghat": site,
            "Water Body": water_body,
            "Risk Assessment": assessment["risk"],
            "Reference Exceedances": assessment["violations"],
            "Site Match": site_match
        })

    return pd.DataFrame(risk_rows)


def get_site_parameter_data(
    df: pd.DataFrame,
    site: str,
    year: int,
    festival: str,
    phase: str,
    parameters: Optional[List[str]] = None
) -> pd.DataFrame:
    """Retrieve and clean parameter values for a specific site, year, festival, and phase."""
    if parameters is None:
        parameters = ["pH", "Dissolved oxygen", "BOD"]

    subset = df[
        (df["site"] == site) &
        (df["year"] == year) &
        (df["festival"] == festival) &
        (df["phase"] == phase) &
        (df["parameter"].isin(parameters))
    ].copy()

    return subset.dropna(subset=["value"])


def get_immersion_phase_trends(
    df: pd.DataFrame,
    site: str,
    year: int,
    festival: str,
    parameters: Optional[List[str]] = None
) -> pd.DataFrame:
    """Retrieve multi-phase (pre, during, after) observations for a given site."""
    if parameters is None:
        parameters = ["pH", "Dissolved oxygen", "BOD"]

    subset = df[
        (df["site"] == site) &
        (df["year"] == year) &
        (df["festival"] == festival) &
        (df["parameter"].isin(parameters))
    ].copy()

    return subset.dropna(subset=["value"])


def get_historical_parameter_trend(
    df: pd.DataFrame,
    site: str,
    parameter: str,
    festival: str
) -> pd.DataFrame:
    """Retrieve multi-year historical observations for a specific site, parameter, and festival."""
    history = df[
        (df["site"] == site) &
        (df["parameter"] == parameter) &
        (df["festival"] == festival)
    ].dropna(subset=["value"])

    return history.sort_values(by=["year", "phase"])


def get_data_quality_stats(df: pd.DataFrame) -> Dict[str, Any]:
    """Calculate data transparency and quality indicators across the dataset."""
    total_sites = df["site"].nunique() if "site" in df else 0
    total_records = len(df)
    numeric_readings = int(df["value"].notna().sum()) if "value" in df else 0
    missing_readings = int(df["value"].isna().sum()) if "value" in df else 0

    bdl_count = 0
    if "flag" in df:
        bdl_count = int((df["flag"].fillna("").astype(str).str.upper() == "BDL").sum())

    return {
        "total_sites": total_sites,
        "total_records": total_records,
        "numeric_readings": numeric_readings,
        "missing_readings": missing_readings,
        "bdl_count": bdl_count
    }
