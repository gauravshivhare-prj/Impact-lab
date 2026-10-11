"""Visarjan Ghat Watch - Data Loader Module.

Loads Bhopal immersion ghat water-quality monitoring observations (2023–2025)
and CPCB Class B water quality criteria safely with path resolution and
type validation.
"""

from pathlib import Path
from typing import Optional, Tuple, Union
import pandas as pd

# Observations come from the shared dataset used by the Express API, so both
# services always read the same file. Criteria stay local to the engine.
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATA_PATH = (
    PROJECT_ROOT / "track-2-visarjan-ghat-watch" / "data" / "bhopal_ghats_2023_2025.csv"
)
DEFAULT_CRITERIA_PATH = Path("data") / "cpcb_water_quality_criteria.csv"

# Expected schema columns for validation
EXPECTED_DATA_COLUMNS = [
    "year",
    "festival",
    "site",
    "water_body",
    "phase",
    "parameter",
    "value",
    "unit_assumed",
    "flag",
    "value_as_printed",
    "parameter_as_printed",
    "site_as_printed",
    "site_match_confidence",
    "source_page"
]

EXPECTED_CRITERIA_COLUMNS = [
    "class",
    "designated_best_use",
    "parameter",
    "limit_type",
    "limit",
    "unit"
]


def resolve_path(file_path: Union[str, Path]) -> Path:
    """Resolve file path relative to current working directory or project root."""
    path = Path(file_path)
    if path.exists():
        return path

    # If running from a subfolder, try finding from parent directories
    project_root = Path(__file__).resolve().parent.parent
    candidate = project_root / path
    if candidate.exists():
        return candidate

    return path


def load_water_quality_data(filepath: Optional[str] = None) -> pd.DataFrame:
    """Load Bhopal immersion ghat monitoring observations (2023-2025).

    Performs:
    - Path resolution
    - Column validation
    - Safe numeric coercion (missing and BDL values remain NaN, never converted to 0)
    - Year integer type casting

    Returns:
        pd.DataFrame of water quality records.
    """
    path_to_load = resolve_path(filepath if filepath else DEFAULT_DATA_PATH)
    if not path_to_load.exists():
        raise FileNotFoundError(
            f"Water quality dataset not found at '{path_to_load}'. "
            "Please ensure 'data/bhopal_ghats_2023_2025.csv' exists in the project root."
        )

    df = pd.read_csv(path_to_load)

    # Validate essential columns
    for col in ["year", "site", "parameter", "value"]:
        if col not in df.columns:
            raise ValueError(f"Required column '{col}' missing from {path_to_load.name}")

    # Coerce numeric values safely; missing and BDL strings become NaN (never 0)
    df["value"] = pd.to_numeric(df["value"], errors="coerce")
    df["year"] = df["year"].astype(int)

    return df


def load_criteria(filepath: Optional[str] = None) -> pd.DataFrame:
    """Load CPCB water quality criteria dataset."""
    path_to_load = resolve_path(filepath if filepath else DEFAULT_CRITERIA_PATH)
    if not path_to_load.exists():
        raise FileNotFoundError(
            f"Criteria dataset not found at '{path_to_load}'. "
            "Please ensure 'data/cpcb_water_quality_criteria.csv' exists in the project root."
        )

    criteria = pd.read_csv(path_to_load)
    return criteria


def load_data(
    data_path: Optional[str] = None,
    criteria_path: Optional[str] = None
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Convenience loader returning both water quality observations and criteria."""
    df = load_water_quality_data(data_path)
    criteria = load_criteria(criteria_path)
    return df, criteria
