# NEPHRA backend

A working local research backend using Node.js 24.15+ and built-in SQLite. No npm dependencies, API keys or external database service are required. It is intended for synthetic demonstrations on one computer.

## Run

From the repository root:

```bash
npm start
npm run dev
npm test
```

Use `start` or `dev`, not both on the same port. The server serves the frontend and API at `http://127.0.0.1:4173`. Optional environment variables: `PORT` (listening port) and `NEPHRA_DB` (database file path). The default database is `backend/data/nephra.sqlite`, excluded from Git and the static deployment.

## API

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Version, health and synthetic-only status |
| GET | `/api/workspace` | Create/resume a browser workspace; returns revision, sessions, events |
| PUT | `/api/workspace` | Validate and atomically replace that workspace using its revision |
| POST | `/api/forecast` | Estimate state, observed-rate forecast, optional scenario and review draft |
| GET | `/api/evaluation` | Reproducible benchmark JSON |

All endpoints except health and initial workspace creation require the workspace cookie. Error responses contain `error.code`, `error.message` and a request ID. JSON writes require `Content-Type: application/json`.

A minimal save after opening a fresh workspace:

```json
{"synthetic":true,"revision":0,"sessions":[],"events":[]}
```

Imported sessions contain `synthetic: true`, `patient` and `readings`, following the [data dictionary](../docs/data-dictionary.md). Up to 20 imported sessions and 100 review markers may be saved. Built-in patient IDs cannot be replaced. Unknown import metadata is removed. Review markers must reference an available observed-rate forecast and match its recomputed status.

Forecast request:

```json
{"patientId":"NP-001","minute":120,"uf":0.62}
```

`uf` is optional, in L/h. The shared engine validates patient data, causal replay time, sensor quality and scenario bounds. An unavailable forecast is represented explicitly rather than invented.

## Persistence and concurrency

The first workspace request issues an opaque 256-bit random identifier in an HttpOnly, SameSite=Strict cookie. Different browsers receive isolated workspaces. This is a bearer workspace identifier, not user authentication. It expires after 30 days; there is no account-recovery feature.

SQLite enables foreign keys and WAL. Migration `001_workspace.sql` creates the initial schema. Saves replace sessions and review markers inside one transaction and increment the revision. Competing writes with the same revision return one success and one `409 REVISION_CONFLICT`; stale clients cannot silently overwrite newer work. Stop the server before copying the database for a consistent manual backup. Clearing browser cookies does not delete database rows.

## Boundaries

The server binds to loopback and checks Host and Origin. Request bodies are limited to 8 MB, request/header timeouts are bounded, and workspace creation is capped at 1,000 rows. Static routes exclude backend files, dotfiles and path escapes. SQL uses prepared parameters. Runtime databases never enter the public static build.

There is no public authentication, role-based access, TLS termination, expiry cleanup, automated backup service, encrypted clinical storage, audit signing, hospital integration or medical-device clearance. Do not expose this local server through a public tunnel or use real patient records. Public deployment requires a separately designed and reviewed operational environment.
