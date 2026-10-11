"""Visarjan Ghat Watch - Bhopal Environmental Intelligence Package.

Modules:
- risk_engine: CPCB Class B reference criteria screening & risk assessment.
- data_loader: Loading and validation of ghat monitoring records and criteria.
- analytics: Water quality analytics, phase comparisons, and trend extraction.
"""

from .risk_engine import (
    assess_site,
    assess_parameter,
    CRITERIA,
    canonical_parameter_name
)

from .data_loader import (
    load_data,
    load_water_quality_data,
    load_criteria
)

from .analytics import (
    compute_ghat_risk_summary,
    get_site_parameter_data,
    get_immersion_phase_trends,
    get_historical_parameter_trend,
    get_data_quality_stats
)

__all__ = [
    "assess_site",
    "assess_parameter",
    "CRITERIA",
    "canonical_parameter_name",
    "load_data",
    "load_water_quality_data",
    "load_criteria",
    "compute_ghat_risk_summary",
    "get_site_parameter_data",
    "get_immersion_phase_trends",
    "get_historical_parameter_trend",
    "get_data_quality_stats"
]
