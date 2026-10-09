# Bug audit and fixes

Completed 9 October 2026. Scope: source review of the estimator, body projection, browser interactions, synthetic import, review storage, evaluation and local server; targeted automated and browser regression checks. Model revision: `nephra-state-space-1.1`.

## Findings resolved

| Finding | Reproduction / consequence | Fix |
|---|---|---|
| Imported history could become HTML | `history` accepted strings and the driver panel inserted them without escaping. An imported file could inject markup or executable event attributes. | Validate optional history as an integer 0-6, escape driver text, normalise imported display fields and discard unknown metadata. |
| Rate changes distorted the inferred refill | Changing the latest UF reading also changed the estimated refill for the entire preceding interval, despite unchanged RBV and cumulative removal. | Use change in cumulative removed volume over elapsed time for state transitions and refill estimation. Start the filter at the first observation. Keep current UF for future scenarios. |
| Replay assumed every session used minutes 15-210 | A session starting at minute 300 or ending at minute 30 could show a slider inconsistent with the actual replay time. End-of-replay could not restart. | Derive bounds from the selected stream, clamp time on patient changes, stop at the final record and restart at the beginning. Display the actual end time. |
| Sliders were replaced during dragging | Every input event rebuilt the entire page, detaching the control before the drag finished. | Update the visible input value during dragging; commit the model update on change/release. Pause playback while a slider is being edited. |
| Scenario control capped valid rates at 1.5 L/h | Import supported 2 L/h, but matching a 1.8 L/h observation left the range control clamped below the model value. | Extend the control to the supported 0-2 L/h range; give equal-rate comparisons explicit equal-volume wording. |
| Import could overwrite a reviewed session | An existing ID replaced the profile and readings while retaining review events under that ID. Sample export also mixed the original profile with replaced readings. | Give imports unique IDs considering both existing profiles and recorded review IDs; keep existing sessions; generate the example afresh. Include IDs in the body-view selector. |
| Import duration checked only the final timestamp | A few minutes of readings near minute 300 passed the 30-minute duration requirement. Null rows produced an unhelpful exception. Decreasing cumulative volume was accepted. | Validate elapsed coverage and row shape; reject decreasing cumulative totals. Reset the file picker after rejection so the same file can be selected again. |
| Fractional forecast horizons misreported duration | A 5.5-minute horizon produced five one-minute steps but calculated removal for 5.5 minutes. | Require whole-minute horizons. |
| Navigation/focus could preserve the wrong context | Switching views could leave the user scrolled down the previous page. Restoring focus during replay could override the region being inspected. | Focus the new workspace and return to its top; suppress region changes caused solely by programmatic focus restoration. Clear the patient search on import. |
| Local images lacked image MIME types | The preview server returned PNGs as generic binary files. | Add image and Markdown content types. |

## Verification

- `npm run check`: 27 passing tests, including 10 added regression tests.
- Full replay sweep: 6 patients x 241 timestamps x 3 scenario rates = 4,338 forecast calls; valid results are finite, insufficient-data states are explicitly withheld.
- `npm run evaluate`: 300 synthetic patients; 1,193 windows; 128 event windows. Twin nadir MAE 2.252905 mmHg; event recall 111/128; two false-positive windows. Rounded presentation results are unchanged. This is an inspected synthetic benchmark, not blinded or clinical validation.
- Browser: invalid history was rejected while staying on the import view; a minute-300-to-360 session loaded at minute 360 with the correct range; a 30-minute session used bounds 0-30.
- Browser: importing NP-001 created NP-001-IMP-1 while preserving NP-001. Rate matching at 1.8 L/h retained 1.8 in the range control and produced equal forecasts. A pointer drag changed 1.80 to 0.96 L/h and recomputed the comparison on release.
- Browser: reaching the last replay timestamp and pressing Replay restarted at the beginning. Navigation moved focus to the new workspace.
- Mobile: 390-pixel viewport with no horizontal overflow, 44-pixel body targets, working body/detail links and correct male/female patient switching. No console warnings or errors appeared in the final checked path.
- Updated screenshot: [patient twin](screenshots/audit-fixed-twin.png).

## Limits

The review does not prove the absence of every bug. Browser checks used the Codex in-app Chromium browser; Safari, Firefox, real assistive technology and physical mobile devices were not tested. Model limits remain unchanged: synthetic data, simplified physiology, uncalibrated sensitivity bands and no clinical validation. Cross-field sensor mass-balance verification and production clinical security are outside this demo contract. Existing PDF/video captures describe the prototype workflow; the model card, source and metrics identify the corrected revision.
