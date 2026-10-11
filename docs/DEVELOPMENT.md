# Development Guide — MERN

## Prerequisites
- Node.js LTS and npm.
- Git.
- MongoDB local instance or MongoDB Atlas connection string if using persistence.
- Google Maps JavaScript API key with the required API enabled and referrer restrictions.
- Cerebras API key for server-side report generation (optional until that feature is integrated).

## Environment
Create `server/.env` or a root `.env` according to the repository's setup. Commit only `.env.example`, never real credentials.

Example `server/.env.example`:

```dotenv
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ghatwatch
CEREBRAS_API_KEY=
CEREBRAS_MODEL=
CLIENT_ORIGIN=http://localhost:5173
```

For Google Maps, configure a browser-restricted key in the client environment, for example `VITE_GOOGLE_MAPS_API_KEY=`. A Vite variable is public in the built client; use only a referrer-restricted browser key, never a private server secret.

## Recommended setup
Commands may need adjustment to match the repository's existing package scripts.

```bash
# Terminal 1 — API
cd server
npm install
npm run dev

# Terminal 2 — client
cd client
npm install
npm run dev
```

Suggested root scripts if using npm workspaces:
- `npm run dev` — start client and server.
- `npm run test` — run available tests.
- `npm run lint` — lint the workspaces.

Do not create a second conflicting package setup if the repository already has one. Agree on root scripts before changing shared package files.

## Implementation rules
1. **Node.js for data work:** parse CSV with a Node-compatible CSV parser. Do not add a Python/FastAPI ingestion service.
2. Preserve source columns and source-page/report identifiers.
3. Normalise units and dates explicitly; never guess units.
4. Keep threshold values in one configuration module and cite the chosen official criterion.
5. Keep deterministic analytics separate from the Cerebras narrative layer.
6. Keep legal status source-backed; default to `not_verified`.
7. Add tests for missing values, `BDL`, `ND`, duplicates, malformed dates, and low sample counts.
8. Keep frontend API calls in `client/src/services/api.js` or a similarly central service.
9. Handle loading, empty, API error, map failure, and AI timeout states.
10. Do not commit secrets, credentials, personal data, or large generated files unnecessarily.

## Git workflow
```bash
git switch -c feature/backend-analytics
git add server/
git commit -m "feat: add validated water quality analytics"
git push -u origin feature/backend-analytics
```

Use a pull request into `main`. Pull/rebase before integration and resolve conflicts with the owner of the affected files. Do not force-push shared branches.

## Testing
- Unit-test CSV parsing and normalisation.
- Unit-test benchmark comparisons and ranking explanation.
- Test Express endpoints with Supertest.
- Test React components for loading, empty, error, and populated states.
- Test that `not_verified` is preserved if legal evidence is absent.
- Test report generation with a mocked Cerebras response; never require a live key in CI.

## Useful official references
- Madhya Pradesh Pollution Control Board: https://www.mppcb.mp.gov.in/
- MPPCB immersion reports: https://www.mppcb.mp.gov.in/Ganisheng-2021.aspx
- MPPCB 2023 immersion reports: https://www.mppcb.mp.gov.in/Ganisheng-2023.aspx
- CPCB water-quality / immersion report: https://cpcb.nic.in/wqm/Report-idol-imersion-2021.pdf
- Google Maps JavaScript API: https://developers.google.com/maps/documentation/javascript
- Cerebras documentation: use the official Cerebras developer documentation and keep credentials on the server.
