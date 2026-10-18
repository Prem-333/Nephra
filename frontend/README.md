# NEPHRA frontend

The browser workspace uses semantic HTML, CSS and native JavaScript modules. There are no production dependencies or framework build requirements.

Run `npm start` from the repository root for the frontend plus local backend. Run `npm run build` then `npm run serve:dist` for a standalone static preview. `dist/` is generated; edit `frontend/` and `shared/` instead.

## Boundaries

- `src/core`: state, navigation and constants.
- `src/views`: the five product views.
- `src/components`: shared visual and interaction components.
- `src/services/api.js`: same-origin connection, saved workspace loading and explicit Save workspace action.
- `src/styles`: layout, components, responsiveness, focus and reduced-motion states.
- `public`: deployable assets and documentation.
- `../shared/engine`: pure numerical model and validation, also used by the backend.

The browser keeps live replay and scenario computation responsive using the shared engine. If the local API is present, saved sessions and reviews load at startup. Save workspace persists a snapshot explicitly; editing does not automatically save. In static mode imports are memory-only and review markers use browser storage. There is no service worker or guaranteed offline reload support.

API failures preserve current work and show an error. A 409 save conflict requires reviewing the other tab's changes before reload; export the current review draft and retain original import files first. Browser-only preferences and backend workspace cookies are separate.
