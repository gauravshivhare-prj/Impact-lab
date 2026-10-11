"""Visarjan Ghat Watch - internal risk engine service.

Not called by the browser: the Express API (server/) proxies GET /api/v1/risk here.
"""

from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from src.data_loader import load_data
from src.risk_engine import CRITERIA, assess_site

app = FastAPI(title="Visarjan Ghat Watch API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

df, _criteria = load_data()

PHASES = ("pre", "during", "after")


def _site_payload(site: str, site_data) -> dict:
    assessment = assess_site(site_data)
    return {
        "site": site,
        "waterBody": site_data["water_body"].iloc[0],
        "siteMatchConfidence": site_data["site_match_confidence"].iloc[0],
        "risk": assessment["risk"],
        "violations": assessment["violations"],
        "parameters": assessment["results"],
    }


@app.get("/api/v1/health")
def health():
    return {"data": {"status": "ok", "records": len(df)}}


@app.get("/api/v1/criteria")
def criteria():
    return {"data": CRITERIA}


@app.get("/api/v1/risk")
def risk(
    year: int,
    phase: str = Query("after"),
    festival: Optional[str] = None,
):
    """Risk assessment for every ghat in a given year/phase (optionally one festival)."""
    if phase not in PHASES:
        raise HTTPException(
            status_code=400,
            detail={"code": "VALIDATION_ERROR", "message": f"phase must be one of {PHASES}"},
        )

    subset = df[(df["year"] == year) & (df["phase"] == phase)]
    if festival:
        subset = subset[subset["festival"].str.lower() == festival.lower()]
    if subset.empty:
        raise HTTPException(
            status_code=422,
            detail={"code": "INSUFFICIENT_DATA", "message": "No observations for these filters."},
        )

    rows = [_site_payload(site, subset[subset["site"] == site]) for site in sorted(subset["site"].unique())]
    return {
        "data": rows,
        "meta": {
            "count": len(rows),
            "year": year,
            "phase": phase,
            "festival": festival,
            "note": "Preliminary screening against CPCB Class B reference criteria; not a safety certification.",
        },
    }
