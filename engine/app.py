
import streamlit as st
import pandas as pd
import plotly.express as px

from src.risk_engine import assess_site
from src.data_loader import load_data as load_project_data

# -----------------------------
# PAGE CONFIGURATION
# -----------------------------

st.set_page_config(
    page_title="Visarjan Ghat Watch | Bhopal",
    page_icon="🌊",
    layout="wide"
)

# -----------------------------
# LOAD DATA
# -----------------------------

@st.cache_data
def load_data():
    return load_project_data()


try:
    df, criteria = load_data()

except Exception as e:
    st.error(f"Dataset loading failed: {e}")
    st.stop()


# -----------------------------
# SIDEBAR
# -----------------------------

st.sidebar.title("🌊 GHAT WATCH")

st.sidebar.caption(
    "Bhopal Municipal Corporation"
)

st.sidebar.markdown("---")

year = st.sidebar.selectbox(
    "Select Year",
    sorted(df["year"].unique()),
    index=len(sorted(df["year"].unique())) - 1
)

festivals = sorted(
    df[df["year"] == year]["festival"].unique()
)

festival = st.sidebar.selectbox(
    "Select Festival",
    festivals
)

phase = st.sidebar.selectbox(
    "Monitoring Phase",
    ["pre", "during", "after"],
    index=2
)

st.sidebar.markdown("---")

st.sidebar.caption(
    "Historical monitoring: 2023–2025"
)

# -----------------------------
# FILTER DATA
# -----------------------------

filtered = df[
    (df["year"] == year) &
    (df["festival"] == festival)
]

phase_data = filtered[
    filtered["phase"] == phase
]

# -----------------------------
# HEADER
# -----------------------------

st.title("🌊 VISARJAN GHAT WATCH")

st.subheader(
    "Bhopal Environmental Intelligence System"
)

st.caption(
    "Water Quality Analytics | Ghat Risk Assessment | "
    "Durga Visarjan Preparedness"
)

st.info(
    "Monitoring seven Bhopal immersion sites using "
    "historical water-quality observations from 2023–2025."
)

# -----------------------------
# TOP METRICS
# -----------------------------

total_sites = df["site"].nunique()

total_records = len(df)

numeric_readings = df["value"].notna().sum()

missing_readings = df["value"].isna().sum()

col1, col2, col3, col4 = st.columns(4)

col1.metric("Monitoring Sites", total_sites)

col2.metric("Historical Records", f"{total_records:,}")

col3.metric("Numeric Readings", f"{numeric_readings:,}")

col4.metric("Missing / BDL Values", missing_readings)

st.markdown("---")

# -----------------------------
# GHAT-WISE RISK ASSESSMENT
# -----------------------------

st.header("Ghat Risk Intelligence")

risk_rows = []

for site in sorted(phase_data["site"].unique()):

    site_data = phase_data[
        phase_data["site"] == site
    ]

    assessment = assess_site(site_data)

    water_body = site_data["water_body"].iloc[0]

    risk_rows.append({
        "Ghat": site,
        "Water Body": water_body,
        "Risk Assessment": assessment["risk"],
        "Reference Exceedances": assessment["violations"],
        "Site Match": site_data[
            "site_match_confidence"
        ].iloc[0]
    })

risk_df = pd.DataFrame(risk_rows)

if not risk_df.empty:

    st.dataframe(
        risk_df,
        use_container_width=True,
        hide_index=True
    )

else:

    st.warning("No readings available for these filters.")

st.caption(
    "Risk labels are preliminary screening categories based "
    "on available pH, DO and BOD measurements against CPCB "
    "Class B reference criteria. They are not official safety "
    "certifications."
)

st.markdown("---")

# -----------------------------
# INDIVIDUAL GHAT ANALYSIS
# -----------------------------

st.header("Individual Ghat Analysis")

available_sites = sorted(
    filtered["site"].unique()
)

if available_sites:

    selected_site = st.selectbox(
        "Choose a Bhopal Ghat",
        available_sites
    )

    selected_data = filtered[
        filtered["site"] == selected_site
    ]

    selected_phase = selected_data[
        selected_data["phase"] == phase
    ]

    st.subheader(selected_site)

    assessment = assess_site(selected_phase)

    st.metric(
        "Current Selected Assessment",
        assessment["risk"]
    )

    # Parameter values

    parameter_data = selected_phase[
        selected_phase["parameter"].isin(
            ["pH", "Dissolved oxygen", "BOD"]
        )
    ].copy()

    parameter_data = parameter_data.dropna(
        subset=["value"]
    )

    if not parameter_data.empty:

        st.subheader("Water Quality Indicators")

        fig = px.bar(
            parameter_data,
            x="parameter",
            y="value",
            color="parameter",
            title=f"{selected_site} - {phase.title()} Phase",
            labels={
                "parameter": "Water Quality Parameter",
                "value": "Measured Value"
            }
        )

        st.plotly_chart(
            fig,
            use_container_width=True
        )

    else:

        st.warning(
            "No numeric indicator readings are available."
        )

    # Risk explanations

    st.subheader("Indicator Assessment")

    for parameter, result in assessment["results"].items():

        value = result["value"]

        if pd.notna(value):
            display_value = f"{value:g}"
        else:
            display_value = "Not available"

        st.write(
            f"**{parameter}:** {display_value} | "
            f"{result['status']}"
        )

    # Historical phase comparison

    st.subheader("Before vs During vs After Immersion")

    trend_data = selected_data[
        selected_data["parameter"].isin(
            ["pH", "Dissolved oxygen", "BOD"]
        )
    ]

    if not trend_data.empty:

        trend_data = trend_data.dropna(
            subset=["value"]
        )

        fig2 = px.line(
            trend_data,
            x="phase",
            y="value",
            color="parameter",
            markers=True,
            category_orders={
                "phase": ["pre", "during", "after"]
            },
            title="Immersion Phase Comparison"
        )

        st.plotly_chart(
            fig2,
            use_container_width=True
        )

# -----------------------------
# HISTORICAL YEAR COMPARISON
# -----------------------------

st.markdown("---")

st.header("Historical Water Quality Trends")

trend_site = st.selectbox(
    "Select Ghat for Historical Analysis",
    sorted(df["site"].unique()),
    key="historical_site"
)

trend_parameter = st.selectbox(
    "Select Parameter",
    sorted(df["parameter"].unique()),
    index=sorted(df["parameter"].unique()).index("BOD"),
    key="historical_parameter"
)

history = df[
    (df["site"] == trend_site) &
    (df["parameter"] == trend_parameter) &
    (df["festival"] == festival)
].dropna(subset=["value"])

if not history.empty:

    fig3 = px.line(
        history,
        x="year",
        y="value",
        color="phase",
        markers=True,
        title=f"{trend_site} - {trend_parameter} Trend"
    )

    st.plotly_chart(
        fig3,
        use_container_width=True
    )

else:

    st.warning(
        "No historical numeric observations available."
    )

# -----------------------------
# DATA QUALITY
# -----------------------------

st.markdown("---")

st.header("Data Quality & Transparency")

col1, col2 = st.columns(2)

with col1:

    st.metric(
        "Missing Numeric Values",
        int(df["value"].isna().sum())
    )

    st.write(
        "Missing values are not automatically "
        "treated as zero or safe readings."
    )

with col2:

    bdl_count = (
        df["flag"].fillna("").str.upper() == "BDL"
    ).sum()

    st.metric(
        "Below Detection Limit",
        int(bdl_count)
    )

    st.write(
        "BDL values are kept separate from measured zeros."
    )

st.subheader("Site Matching Confidence")

st.dataframe(
    df.groupby(
        ["site", "site_match_confidence"]
    ).size().reset_index(
        name="Record Count"
    ),
    use_container_width=True,
    hide_index=True
)

st.subheader("Original Data Source References")

st.write(
    "The dataset includes source-page references "
    "for tracing observations back to their source."
)

st.dataframe(
    df[
        [
            "year",
            "festival",
            "site",
            "phase",
            "parameter",
            "value",
            "flag",
            "source_page"
        ]
    ].head(30),
    use_container_width=True,
    hide_index=True
)

st.caption(
    "VISARJAN GHAT WATCH | BHOPAL, MADHYA PRADESH | "
    "Historical Data Intelligence Prototype"
)
