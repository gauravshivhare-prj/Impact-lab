# Pratham — Google Maps & Geospatial UI

**Branch:** `feature/frontend-map`  
**Primary ownership:** `client/src/features/map/`  
**Stack:** React + Vite + Google Maps JavaScript API.

## Mission
Build the map-first experience with verified locations, selectable ghats, and independent map layers. The map should make uncertainty visible rather than imply that every marker is exact or legally permitted.

## Responsibilities
1. Integrate Google Maps JavaScript API with a restricted browser key from client environment configuration.
2. Render ghat markers from the API; do not hard-code unsupported coordinates.
3. Support marker selection and pass the canonical `ghatId` to the evidence panel.
4. Add independent layer toggles for environmental priority, legal status, and monitoring coverage.
5. Distinguish verified, approximate, and unverified coordinates.
6. Show a clear legend and accessible text alternative/list for map locations.
7. Handle loading, API-key errors, empty data, and map load failures.
8. Coordinate shared marker properties with Ansh and the API contract with Gaurav.

## Files owned
- `client/src/features/map/GhatMap.jsx` (or `.tsx`)
- `client/src/features/map/MapControls.jsx`
- `client/src/features/map/MapLegend.jsx`
- `client/src/features/map/mapConfig.js`
- `client/src/features/map/*.test.*` where practical

## Deliverables
- Working Bhopal map.
- API-driven ghat markers and selection.
- Independent layer controls and legend.
- Visible treatment of uncertain locations.
- Responsive layout and graceful fallback if Maps fails.

## Guardrails
- A nearby drain/facility does not prove it caused pollution.
- A marker's environmental-priority category is not a legal status.
- Do not label a ghat authorised/prohibited without verified legal evidence supplied by the API.
- Do not expose unrestricted credentials; restrict the browser key by referrer/API.
- Avoid editing the shared app shell or API service without coordination.
- No Python backend.

## Integration checklist
- [ ] Markers use API-provided canonical `ghatId` values.
- [ ] Legal and environmental layers can be toggled separately.
- [ ] Coordinates show verification status.
- [ ] Map failure does not hide the dashboard/table.
- [ ] Open a PR from `feature/frontend-map`.
