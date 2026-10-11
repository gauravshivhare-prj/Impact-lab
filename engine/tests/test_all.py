"""Comprehensive test suite for Visarjan Ghat Watch."""

import unittest
import numpy as np
import pandas as pd

from src.risk_engine import assess_parameter, assess_site, CRITERIA, canonical_parameter_name
from src.data_loader import load_data, load_water_quality_data, load_criteria
from src.analytics import (
    compute_ghat_risk_summary,
    get_site_parameter_data,
    get_immersion_phase_trends,
    get_historical_parameter_trend,
    get_data_quality_stats
)


class TestVisarjanGhatWatch(unittest.TestCase):

    def test_package_imports(self):
        """Verify all core functions and modules import correctly."""
        self.assertIsNotNone(assess_site)
        self.assertIsNotNone(assess_parameter)
        self.assertIsNotNone(CRITERIA)
        self.assertIsNotNone(load_data)
        self.assertIsNotNone(compute_ghat_risk_summary)

    def test_cpcb_criteria_thresholds(self):
        """Verify CPCB Class B reference thresholds."""
        self.assertEqual(CRITERIA["pH"]["min"], 6.5)
        self.assertEqual(CRITERIA["pH"]["max"], 8.5)
        self.assertEqual(CRITERIA["Dissolved oxygen"]["limit"], 5.0)
        self.assertEqual(CRITERIA["Dissolved oxygen"]["type"], "min")
        self.assertEqual(CRITERIA["BOD"]["limit"], 3.0)
        self.assertEqual(CRITERIA["BOD"]["type"], "max")

    def test_parameter_assessment(self):
        """Verify individual parameter reference screening."""
        # pH: 6.5–8.5
        self.assertEqual(assess_parameter("pH", 7.0), "Within reference")
        self.assertEqual(assess_parameter("pH", 6.5), "Within reference")
        self.assertEqual(assess_parameter("pH", 8.5), "Within reference")
        self.assertEqual(assess_parameter("pH", 6.4), "Outside reference")
        self.assertEqual(assess_parameter("pH", 8.6), "Outside reference")

        # Dissolved Oxygen: >= 5.0 mg/L
        self.assertEqual(assess_parameter("Dissolved oxygen", 6.0), "Within reference")
        self.assertEqual(assess_parameter("Dissolved oxygen", 5.0), "Within reference")
        self.assertEqual(assess_parameter("Dissolved oxygen", 4.9), "Outside reference")

        # BOD: <= 3.0 mg/L
        self.assertEqual(assess_parameter("BOD", 2.0), "Within reference")
        self.assertEqual(assess_parameter("BOD", 3.0), "Within reference")
        self.assertEqual(assess_parameter("BOD", 3.1), "Outside reference")

    def test_missing_and_bdl_handling(self):
        """Verify missing and BDL values are never treated as zero or classified as safe."""
        # None and NaN
        self.assertEqual(assess_parameter("pH", None), "Insufficient data")
        self.assertEqual(assess_parameter("pH", np.nan), "Insufficient data")
        self.assertEqual(assess_parameter("Dissolved oxygen", None), "Insufficient data")
        self.assertEqual(assess_parameter("BOD", np.nan), "Insufficient data")

        # String representations of BDL and missing
        self.assertEqual(assess_parameter("pH", "BDL"), "Insufficient data")
        self.assertEqual(assess_parameter("Dissolved oxygen", "not sampled"), "Insufficient data")
        self.assertEqual(assess_parameter("BOD", "*"), "Insufficient data")
        self.assertEqual(assess_parameter("BOD", "**"), "Insufficient data")
        self.assertEqual(assess_parameter("BOD", ""), "Insufficient data")

    def test_site_assessment_logic(self):
        """Verify site-level risk categorization."""
        # Case 1: All within reference
        df_safe = pd.DataFrame([
            {"parameter": "pH", "value": 7.5, "flag": np.nan},
            {"parameter": "Dissolved oxygen", "value": 6.5, "flag": np.nan},
            {"parameter": "BOD", "value": 2.5, "flag": np.nan}
        ])
        res_safe = assess_site(df_safe)
        self.assertEqual(res_safe["risk"], "Within reference")
        self.assertEqual(res_safe["violations"], 0)

        # Case 2: One violation -> "Needs attention"
        df_one_viol = pd.DataFrame([
            {"parameter": "pH", "value": 7.5, "flag": np.nan},
            {"parameter": "Dissolved oxygen", "value": 4.5, "flag": np.nan},  # violation
            {"parameter": "BOD", "value": 2.5, "flag": np.nan}
        ])
        res_one = assess_site(df_one_viol)
        self.assertEqual(res_one["risk"], "Needs attention")
        self.assertEqual(res_one["violations"], 1)

        # Case 3: Two violations -> "High concern"
        df_two_viol = pd.DataFrame([
            {"parameter": "pH", "value": 9.0, "flag": np.nan},  # violation
            {"parameter": "Dissolved oxygen", "value": 3.0, "flag": np.nan},  # violation
            {"parameter": "BOD", "value": 2.5, "flag": np.nan}
        ])
        res_two = assess_site(df_two_viol)
        self.assertEqual(res_two["risk"], "High concern")
        self.assertEqual(res_two["violations"], 2)

        # Case 4: Missing parameter must NOT be classified as safe
        df_missing = pd.DataFrame([
            {"parameter": "pH", "value": 7.5, "flag": np.nan},
            {"parameter": "Dissolved oxygen", "value": 6.0, "flag": np.nan}
            # BOD is missing
        ])
        res_missing = assess_site(df_missing)
        self.assertEqual(res_missing["risk"], "Limited data")

        # Case 5: All missing -> "Insufficient data"
        df_empty = pd.DataFrame()
        res_empty = assess_site(df_empty)
        self.assertEqual(res_empty["risk"], "Insufficient data")

        # Case 6: BDL flag present -> must not be treated as 0 or safe
        df_bdl = pd.DataFrame([
            {"parameter": "pH", "value": 7.5, "flag": np.nan},
            {"parameter": "Dissolved oxygen", "value": 6.0, "flag": np.nan},
            {"parameter": "BOD", "value": np.nan, "flag": "BDL"}
        ])
        res_bdl = assess_site(df_bdl)
        self.assertEqual(res_bdl["risk"], "Limited data")
        self.assertEqual(res_bdl["results"]["BOD"]["status"], "Insufficient data")

    def test_dataset_loading(self):
        """Verify real CSV datasets load with accurate rows and columns."""
        df, criteria = load_data()

        # Check records count
        self.assertGreater(len(df), 1500)
        self.assertGreater(len(criteria), 15)

        # Check required columns
        expected_cols = ["year", "festival", "site", "water_body", "phase", "parameter", "value"]
        for col in expected_cols:
            self.assertIn(col, df.columns)

        # Check data types
        self.assertTrue(pd.api.types.is_integer_dtype(df["year"]))
        self.assertTrue(pd.api.types.is_float_dtype(df["value"]))

        # Check sites
        self.assertEqual(df["site"].nunique(), 7)

    def test_analytics_functions(self):
        """Verify analytics computations."""
        df, _ = load_data()

        # Risk summary for 2023 Ganesh after
        summary = compute_ghat_risk_summary(df, year=2023, festival="Ganesh", phase="after")
        self.assertFalse(summary.empty)
        self.assertIn("Ghat", summary.columns)
        self.assertIn("Risk Assessment", summary.columns)

        # Data quality stats
        stats = get_data_quality_stats(df)
        self.assertEqual(stats["total_sites"], 7)
        self.assertGreater(stats["numeric_readings"], 1000)
        self.assertGreater(stats["missing_readings"], 0)
        self.assertGreater(stats["bdl_count"], 0)


if __name__ == "__main__":
    unittest.main()
