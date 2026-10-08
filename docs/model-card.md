# NEPHRA model card

**Version:** nephra-state-space-1.0. **Status:** synthetic research prototype. **Date:** 7 October 2026.

## Intended use
Demonstrate fusion of a historical synthetic patient record and a synthetic medical-IoT stream. Forecast an absolute systolic blood-pressure crossing below 90 mmHg in the next 30 minutes. Explore hypothetical ultrafiltration changes. Support evaluation of future research, not clinical decisions.

## Not supported
Real patient use; diagnosis; treatment recommendations; autonomous pump control; medication dosing; symptomatic IDH definitions; dialysis adequacy; prediction of mortality or kidney recovery; medical-device compliance. No authentication, production clinical audit trail, FHIR integration or sensor-device integration is implemented.

## Interactive body heatmap
The male/female illustration follows the synthetic record's sex field. If that field is unavailable, the image is explicitly labelled generic. Illustration selection does not affect the estimator or forecasts.

Chest, arm, flank and leg markers organise systemic pressure, circulating blood volume, historical kidney context and whole-body fluid balance. Locations are schematic. Hover, keyboard focus and tap disclose whether each value is observed, modelled, historical or unavailable. Red/amber pressure colours reuse the existing review status; other measured signals use teal, historical context blue, and unmeasured regions grey. No spatial interpolation or organ-specific severity estimation is performed.

The display is not a thermogram or a scan of organ damage, tissue hydration or perfusion. It contains no regional sensor data. Missing dynamic data removes dynamic values and turns their markers neutral; labelled historical context remains visible. Generated body illustrations are not images of real patients.

## Estimation equations
Let D be circulating-volume deficit in litres; V0 = 0.07 x dry weight in kg is a simplified effective circulating volume. The coefficient is a modelling assumption, not an individual clinical measurement.

- State transition: D(t+dt) = D(t) + [UF(t) - refill(t)] x dt / 60.
- Sensor observation: D_observed = V0 x (1 - RBV/100).
- Scalar Kalman update: K = P / (P + R); D = D_predicted + K x (D_observed - D_predicted).
- Process variance increases by 0.00015 x dt; measurement variance R = 0.0025. These are chosen demo constants, not clinically fitted noise estimates.
- Online refill: 0.65 x recent RBV-derived estimate + 0.35 x historical prior adjusted for removal; clamped to 0.05-1.5 L/hour.
- Projected refill decays exponentially with horizon using excess-volume-dependent time constant. This is a simplified phenomenological assumption.
- Pressure change: 0.7 x (-sensitivity x incremental D) + 0.3 x (recent slope adjusted for UF scenario x elapsed minutes).
- Pressure observations for slope: reliable cuff values in the preceding 25 minutes.

The filter assimilates the cumulative history before the requested time. Scenario runs clone the estimated state, so observed measurements never change. The pressure-sensitivity and refill priors are supplied in the synthetic history. Fitting priors to prior clinical sessions is future work.

## Uncertainty and review labels
Band half-width: 2.5 + 0.8 x sqrt(horizon minute) + 0.6 x recent regression RMSE + 0.2 x absolute disagreement between the two pressure-change estimates. The band is **heuristic sensitivity**, not a 95% interval. Twenty-one evenly spaced perturbations spanning that band yield a crossing fraction; this is **not a calibrated risk probability**.

Labels: current-low if the current pressure estimate is below 90; review if the central future trajectory crosses 90; watch if only the lower sensitivity bound crosses 90; stable otherwise. Stable does not mean clinically safe.

At least three reliable cuff readings in the preceding 25 minutes are required. Stream age over 3 minutes or cuff age over 10 minutes suppresses the forecast. The demo includes an explicit dropout control.

## Data lineage and evaluation
All data is generated from seeds. Six hand-authored synthetic profiles drive the UI. A separate seeded 300-patient cohort drives the reproducible engineering benchmark. No hospital, wearable account or patient database is connected.

The generator differs from the estimator: tissue-dependent refill, random patient-level parameters, reserve fatigue, nonlinear pressure response and correlated sensor noise. It still shares the same broad fluid-balance model family. Extreme observations are capped at supported sensor bounds; these are synthetic conventions, not physiologic guarantees. Synthetic pressure truth can fall below the observed sensor floor; the clinical model is not validated in that regime.

The benchmark is separate from demo profiles but inspected during development; it is not a blinded untouched test set. Five windows per patient can be correlated. Thresholds and model constants are not clinically learned. No train/test claim about real patient data is made.

Latest results are in `data/evaluation.json` within the hosted application and `dist/data/evaluation.json` in the source repository. The raw per-window CSV is in `docs/evaluation-windows.csv`. Nadir MAE, event recall, specificity, precision, confusion counts and empirical heuristic-band coverage are reported. Coverage near 100% on this generator can simply indicate wide bands and does not establish real-world calibration.

## Known limitations
- Real refilling and cardiovascular compensation are more complex than this reduced model.
- Inputs assume unit consistency and trustworthy synthetic timestamps; real devices need stronger quality control.
- No causal treatment-effect identification: counterfactual curves are model assumptions, not proven outcomes.
- Pulse and prior episode history are contextual displays, not predictor features.
- No clinical calibration, subgroup reliability, external-site validation or prospective safety evaluation.
- Missing or stale data can hide risk; withheld output must not be treated as a normal finding.
- Local review logs can be edited or deleted and are not tamper-evident clinical records.

## Release prerequisites for a future clinical pilot
Clinical partnership and oversight; ethics and data-governance approval; retrospective patient-separated validation; external-site testing; calibration and alarm-burden analysis; clinician-approved operational criteria; silent prospective observation; a separate regulatory assessment. No such approval is claimed here.

## References
[KDIGO conference report](https://kdigo.org/wp-content/uploads/2017/05/KDIGO-BP-Volume-in-Dialysis-FINAL.pdf); [real-time IDH prediction study](https://pmc.ncbi.nlm.nih.gov/articles/PMC10310501/); [plasma refilling study](https://pmc.ncbi.nlm.nih.gov/articles/PMC10278774/).

