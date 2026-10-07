# Pilot and business case

## Why this problem
The task has a specific chronic condition, a localised near-term outcome, a natural historical-plus-sensor data fusion requirement and a concrete staff workflow. A fluid-balance simulator gives the twin a state that changes with incoming observations and supports explicit counterfactuals. This is a stronger proof-of-concept scope than a whole-body avatar with an unsupported generic risk score.

## Existing solutions and defensible differentiation
Real-time IDH prediction has already been published. Physiological modelling and machine monitoring are established fields. Do not pitch prediction alone as a new invention. The proposed product differentiation is a transparent model plus accessible tradeoffs, explicit data-quality failure handling and review preparation in one workflow. This is a product hypothesis requiring comparison with commercial systems and clinician interviews, not a patentability conclusion.

## Customer and adoption hypothesis
Initial users: dialysis nurses and nephrologists. Potential buyer: dialysis provider or hospital network. Initial deployment hypothesis: read-only overlay on existing observations, with no machine control. A browser prototype keeps demonstration cost low but is not a production clinical architecture.

## Pilot sequence
1. Recruit a nephrology collaborator and map existing review tasks; interview at least five staff members as a discovery target, not a completed activity.
2. Specify the adverse-event definition, inclusion/exclusion criteria and clinically acceptable alarm burden before evaluation.
3. Secure data/ethics approvals; use retrospective de-identified records under an appropriate agreement.
4. Split at patient level and assess a separate site. Fit priors without leaking future sessions. Compare trend, clinical rules and established statistical baselines.
5. Report sensitivity, precision, calibration, lead time, missed events, false alerts per treatment, missing-data behaviour, subgroup errors and confidence intervals clustered by patient.
6. Run a silent prospective pilot; forecasts must not influence care at this stage.
7. Only after clinical and regulatory review, study an assisted workflow with explicit clinician accountability.

## Measuring the 90% preparation target
Use matched simulated tasks or an approved observed workflow. Randomise manual-versus-assisted order. Time gathering observations and preparing the review draft separately from clinical judgement. Include corrections and omissions. Report median and distribution, not only the fastest completion.

Default arithmetic: 24 patients x 8 cycles x 90 sec = 288 min/day; assisted 9 sec = 28.8 min/day. Difference = 259.2 min/day. These inputs are assumptions, not a survey or experiment. A result below 90% is still reportable; never choose the denominator to manufacture the target.

## Funding narrative
Ask for support tied to milestones: clinical discovery, governed retrospective data, external validation, silent pilot and a monitored workflow study. Do not claim revenue, customer commitments, funding, cost savings or prevented admissions. Those have not been established.

Potential commercial model: per-station or per-treatment software subscription after validation. Price, procurement cost, integration cost and support cost remain discovery questions. The credible next asset is an approved pilot and independently measured usefulness, not a fabricated market-size slide.

## Stop / redesign criteria
Unexpectedly high false-alert burden, poor external generalisation, missing-data bias, harmful over-reliance, or no time benefit after corrections should trigger redesign. Stable output must not reassure users that care can be reduced.
