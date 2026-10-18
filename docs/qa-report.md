# NEPHRA 1.4 verification report

Date: 18 October 2026. Scope: synthetic research application, local API and static build. This report describes targeted engineering verification, not a claim that all defects are absent.

## Automated checks

`npm run check`: **44 passing tests**. These cover the shared model, body signals, imports, review queue, route parsing, workload validation, benchmark validation and 9 backend integration cases. The model regression sweep exercises 4,338 bounded forecast/scenario calls.

Backend tests verify workspace isolation; valid synthetic import/review round-trip; metadata stripping; malformed and oversized requests; origin rejection; static path containment; competing save conflicts; browser/server forecast equivalence; and SQLite close/reopen persistence. Runtime files are excluded from version control and deployment output.

`npm run evaluate`: 300 seeded synthetic patients, 1,193 windows and 128 event windows. Model results are unchanged: nadir MAE 2.2529 mmHg; event recall 86.71875%; 111 detected events, 17 missed events, 2 false alerts and 1,063 correct negatives. Repeated windows are correlated and the generator shares assumptions with the model. These are not clinical performance estimates.

## Browser verification

- All five views checked at 320, 390, 768, 1,024 and 1,440 CSS pixels: no page-level horizontal overflow or broken images in the tested states.
- Automated axe accessibility checks on the five main views at desktop and phone widths; contrast, heading order, control labels and focusability defects addressed. Guide and body-region panels also inspected.
- Patient switching, male/female illustration, signal details, dropout withholding and recovery, scenario reset and review navigation exercised.
- Review mark/undo, search results and empty states, keyboard dialog dismissal and focus return checked.
- Blank workload fields rejected; malformed benchmark shows a recoverable error; valid benchmark retry succeeds.
- Invalid imports rejected; imported markup displayed as text; long/absent display names handled.
- Full-stack interface flow verified: import synthetic NP-QA-API, mark reviewed, Save workspace, reload, select the saved patient, confirm the reviewed state remains.

The public static edition is checked separately after build. Its browser-only behaviour is intentional; SQLite saving requires `npm start` locally.

## Limits

Testing used the Chromium-based in-app browser and the installed Node 24 runtime. This is not a complete Safari/Firefox, assistive-technology, penetration, load or clinical-validation audit. Automated accessibility checks do not replace testing with assistive-technology users. Public backend hosting, user accounts, operational monitoring and hospital integration are not part of this release.
