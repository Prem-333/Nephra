# NEPHRA 1.4 product readiness

Updated 18 October 2026. NEPHRA is a synthetic research prototype with a usable frontend and a working local backend. It is not clinically validated or approved for patient care.

## Delivered

- Refined light workspace, teal actions, readable hierarchy, mobile navigation and explicit review priority.
- Patient directory, five-region male/female body map, responsive forecast charts and numerical values.
- Scenario comparison, dropout withholding, review draft, export, print, copy and review undo.
- Searchable patient/page picker, keyboard focus restoration, reduced motion and recoverable error states.
- Evidence confusion counts, reproducible baselines, and a staged validation and workflow-measurement roadmap.
- Separate frontend, backend and shared model folders; generated static deployment.
- Local HTTP API, SQLite migration, isolated workspace cookies and explicit atomic saves.
- Validated imported sessions, authoritative review validation, bounded requests and save-conflict detection.

## Engineering evidence

44 automated tests cover model behaviour, a 4,338-call model sweep, imports, queue and review state, benchmark validation, API isolation, request validation, concurrent writes and SQLite restart recovery. The 300-patient synthetic benchmark remains unchanged. See the [QA report](qa-report.md) for browser checks and limits.

## Before public backend deployment

A reviewed authentication and role model, secure hosting/TLS, secrets management, rate limiting, data retention and deletion, monitoring, audited migrations, automated backups and recovery drills are still needed. The current server deliberately binds to loopback. Workspace cookies identify saved synthetic work; they are not clinical identity or authorization records.

## Before clinical use

Independent retrospective validation, dataset governance, subgroup evaluation, calibrated uncertainty, prospective silent evaluation, workflow time measurement, human-factors testing, hospital integration, regulatory assessment and clinical oversight are required. The synthetic generator and model share assumptions, so benchmark results do not establish clinical accuracy. A 90% workload reduction is an ambition to test, not a measured result.
