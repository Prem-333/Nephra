# Validation record

Checked 7 October 2026. Synthetic engineering prototype only.

## Automated model checks
`npm run check`: 17 tests passed. The checks cover future-data isolation, personalisation, monotonic scenario response, preservation of observed history, stale/poor/insufficient data, invalid values, timestamp order, supported scenario bounds, deterministic cohort generation, finite sensitivity bands, workload arithmetic and current-low precedence.

`npm run evaluate`: 300 synthetic patients, 1,193 eligible windows and 128 future event windows. Metrics and raw rows are committed alongside source. This benchmark was inspected during development, not kept as a blinded external test set.

## Interface checks
- Dashboard displays distinct synthetic patients and their computed forecasts.
- Default Meera case: 95 mmHg cuff at minute 120; projected nadir approximately 84.2 mmHg; crossing near minute 134.
- Scenario 0.62 versus observed 0.88 L/h: different pressure projection and explicit 0.13 L less fluid removed over 30 minutes.
- Match observed rate: equal 84.2 mmHg nadirs and zero difference in removed volume.
- Test dropout: forecast withheld; scenario outputs replaced by missing-value markers.
- Restore sensors: forecast resumes.
- Mark reviewed: local review entry appears in both history and draft.
- Mobile dashboard and scenario views: viewport width and content width both 375 CSS pixels after fixing a grid overflow.
- PDFs: all 20 presentation pages and both architecture pages rendered; screenshot figures enlarged after review.
- Video: 20 chapters, H.264 video plus AAC narration, duration 20:00.02; full decode completed successfully.

## Body heatmap addition, 8 October 2026
- Male/female illustration selection follows the patient record; unspecified sex is not inferred.
- Four new unit checks cover template selection, status provenance, dropout clearing and independence from model output.
- Browser: pointer hover over circulating volume changed the details to the selected patient's RBV and pulse.
- Browser: keyboard Tab from the fluid marker selected unmeasured regions and disclosed absent measurements.
- Browser: selecting Arjun changed the illustration and readings from Meera's values to 97.2% RBV and 71 bpm.
- Browser: dropout withheld the pressure forecast and cleared circulating-volume and fluid readings; restoring sensors restored readings.
- Browser: body view stayed within a 390-pixel mobile viewport, with stacked cards and no horizontal overflow.

## Interpretation of all checks
These checks establish specific software behaviour. They do not establish clinical validity, real sensor accuracy, clinical outcome improvement, production security, regulatory status or realised workload savings. Separate evidence is required for every such claim.


