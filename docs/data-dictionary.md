# Synthetic data contract

Import a JSON object with `synthetic: true`, `patient`, and `readings`. Files are read in browser memory, never uploaded, and limited to 2 MB. Use Evidence & model > Sample data for a complete example.

| Historical key | Units / role |
|---|---|
| id | 1-60 letters, digits or hyphens; unique synthetic identifier |
| name, age, sex, bed | Display context; never real identities |
| weight | kg, 30-200; effective circulating volume prior |
| baselineSBP | mmHg, 80-220; synthetic baseline |
| refill | L/hour, 0.1-1.5; historical refilling prior |
| sensitivity | mmHg/L, 10-180; synthetic pressure response prior |
| uf | L/hour, 0-2; nominal session removal rate |
| excess | L, 0.5-8; synthetic fluid-excess parameter |
| history | Optional integer 0-6: prior hypotensive sessions in the last six; display context only |
| diabetes, albumin | Built-in generator context; not retained by the importer or used directly by the estimator |
| seed | Deterministic generator seed, not sent to forecasting logic |

| Dynamic key | Units / validation |
|---|---|
| minute | Relative session minute, 0-1440, strictly increasing |
| sbp | mmHg, 40-240, or null for no cuff observation |
| rbv | Relative blood volume %, 30-110 |
| hr | beats/min, 30-220; display context only |
| uf | L/hour, 0-2 |
| removed | Cumulative L, 0-15; must not decrease |
| quality | `good` or `poor` |

The supplied synthetic generator uses one-minute records and five-minute cuffs. Maximum import length: 1,441 records; minimum import duration: 30 minutes. Replay bounds follow the selected session’s first and last timestamps. Playback stops at its last record and restarts from the beginning when Replay is pressed again. Import duration is measured as last minus first timestamp. Duplicate IDs receive an -IMP-N suffix, so existing sessions and review history are retained. Sex values F/Female and M/Male are normalised; other values are labelled unspecified. Unknown metadata and hidden truth are discarded. Cumulative removal must be nondecreasing; cross-field mass balance is not enforced. This is a bounded demo contract, not a clinical ingestion service.

The generator's internal `truth` is retained only for evaluation, stripped from UI data, and never used as an estimator feature. Separate generation and estimation functions make this boundary inspectable.
