# NEPHRA workspace 1.2 — product readiness

Released 9 October 2026. This release improves the deployable **synthetic research workspace**. It does not qualify NEPHRA for patient care.

## Experience delivered

- Evergreen navigation, warm neutral surfaces, consistent typography, spacing, control states and responsive cards.
- Patient summary with observed cuff pressure, modelled nadir, removal total and replay context.
- Male/female anatomical illustrations with hover, focus and touch inspection; provenance and unavailable measurements remain explicit.
- Searchable patient/page picker (Ctrl or Command K), native modal focus containment, Escape dismissal and return focus.
- Sidebar focus mode, remembered locally without retaining patient records.
- Attention queue sorted by low-pressure, review, watch and unavailable-data states; clear search/filter recovery.
- Bounded scenario shortcuts and numerical forecast table alongside the chart.
- Copy, print and download review drafts; duplicate review protection by patient and minute; 10-second undo for review and history-clear actions.
- Shareable page routes with browser Back/Forward support. Body anchors stay within the page.
- Loading, no-JavaScript, module-load failure, benchmark retry, import-error and empty-search states.
- Replay pauses when the page becomes hidden or a dialog opens. Forecast disclosure stays expanded through re-renders.
- Reduced-motion preference, keyboard navigation, mobile touch targets, print styling and a skip link.

## Engineering validation

`npm run check`: **30 passing tests**, including the existing 4,338-call model sweep. Three new checks cover routing, queue order/filtering, and patient/time-specific review state. The forecast engine and benchmark are unchanged from model 1.1.

Browser checks cover patient search/switching, review undo, attention filtering, empty-state reset, scenario presets, guide dismissal/focus restoration, focus mode, keyboard search, review-file download, body anchors, sensor dropout/recovery, forecast values, and narrow-phone page widths. Deliberately blocking benchmark and application downloads verifies retry/reload recovery; blocking is removed after testing. Desktop, tablet and phone layouts were inspected. This is a targeted engineering pass, not a complete accessibility certification or cross-browser audit.

## Data and security boundary

All records are synthetic. Imported sessions remain in memory and disappear on reload. Review markers (maximum 100) and the focus-mode preference use browser storage; unavailable storage is handled. This persistence is not an authenticated, durable or tamper-evident clinical record. Exports are initiated by the visitor. Browser clipboard and printing depend on browser permissions and configuration.

Imported fields are validated and escaped. The page has a restrictive Content Security Policy: scripts and data connections are same-origin; embedding objects and form submissions are disabled. Google Fonts remain optional external font resources; system fonts provide a fallback. Inline styling is retained for SVG/body markers. A static-page policy cannot replace server security headers, authentication or authorization.

## Required before a real clinical deployment

These are separate workstreams, not features silently claimed by the demo:

| Area | Required evidence or implementation |
| --- | --- |
| Clinical model | Independent real-data validation, calibration, prospective evaluation, failure analysis and clinical ownership |
| Patient information | Approved data integration, access roles, secure server storage, retention/deletion policy and privacy review |
| Accountability | Authenticated reviewers, durable audit trail, session identity, conflict handling and change history |
| Operations | Monitoring, alert ownership, backup/restore exercises, incident response, staged deployments and rollback rehearsal |
| Delivery quality | Automated browser regression coverage, accessibility audit, cross-browser/device coverage and performance budgets |
| Governance | Applicable institutional, security and regulatory review before use in care |

The 90% preparation-time reduction remains an editable planning target, not measured productivity or clinical benefit. Existing presentation/video captures document an earlier visual release; the live application and this document describe workspace 1.2.
