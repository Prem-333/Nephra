/** Display-only body projection. Locations are illustrative, never spatial diagnoses.
 * Sex selects an illustration; it never changes a pressure prediction.
 * Every coloured region discloses whether its information is observed, modelled,
 * historical, or unavailable. No organ damage, perfusion or oedema is inferred. */
export function bodySignals(patient,state,prediction) {
 const valid=state.valid&&prediction.valid;
 const anatomy=patient.sex==='F'?'female':patient.sex==='M'?'male':'unspecified';
 const label=anatomy==='unspecified'?'Generic body illustration':`${anatomy==='female'?'Female':'Male'} body illustration`;
 const f=n=>Number.isFinite(n)?n.toFixed(1):'Not available';
 const regions=[
  {id:'pressure',name:'Blood pressure',location:'Chest marker · systemic signal',x:50,y:29,
   tone:!valid?'unknown':['current-low','review'].includes(prediction.status)?'review':prediction.status==='watch'?'watch':'observed',
   kind:valid?'Observed + modelled':'Unavailable',value:valid?`${f(state.bp.sbp)} mmHg`:'Forecast withheld',
   description:'Cuff pressure and the whole-body circulation forecast are displayed at the chest for orientation. This is not a measurement of the heart itself.',
   facts:valid?[['Latest cuff',`${f(state.bp.sbp)} mmHg at minute ${state.bp.minute}`],['Predicted 30-minute nadir',`${f(prediction.nadir)} mmHg`],['Projected crossing',prediction.crossing===null?'None in this window':`Minute ${prediction.crossing} (${Math.max(0,prediction.crossing-state.now)} min ahead)`],['Pressure trend',`${f(state.slope*10)} mmHg / 10 min`]]:[],
   boundary:valid?'Colour follows the existing pressure-review status. It does not indicate heart damage.':state.reason},
  {id:'circulation',name:'Circulating volume',location:'Arm marker · systemic signal',x:30,y:40,
   tone:valid?'observed':'unknown',kind:valid?'Observed':'Unavailable',value:valid?`${f(state.last.rbv)}% RBV`:'No reliable reading',
   description:'Relative blood volume describes the circulating-volume trend. The arm marker is an illustration anchor, not the location of a measured vascular problem.',
   facts:valid?[['Relative blood volume',`${f(state.last.rbv)}% of session start`],['Pulse',`${state.last.hr} beats/min`],['Observation time',`Minute ${state.last.minute}`],['Stream quality',`${state.completeness}% reliable records`]]:[],
   boundary:'No vessel obstruction, access-site condition or local blood flow is inferred.'},
  {id:'kidney',name:'Kidney context',location:'Flank marker · historical context',x:58,y:43,
   tone:'context',kind:'Historical context',value:'Maintenance dialysis',
   description:'This synthetic case belongs to a maintenance-haemodialysis demonstration. The blue region marks the context of care, not measured kidney injury.',
   facts:[['Historical dry weight',`${patient.weight.toFixed(0)} kg`],['Baseline pressure',`${patient.baselineSBP.toFixed(0)} mmHg`],['Refilling prior',`${patient.refill.toFixed(2)} L/hour`],['Renal laboratory forecast','Not modelled']],
   boundary:'No current eGFR, kidney perfusion, damage severity or recovery prediction is available.'},
  {id:'fluid',name:'Fluid balance',location:'Leg marker · whole-body proxy',x:56,y:74,
   tone:valid?'observed':'unknown',kind:valid?'Observed + modelled':'Unavailable',value:valid?`${state.last.removed.toFixed(2)} L removed`:'No reliable reading',
   description:'The fluid-removal total and estimated circulating-volume deficit apply to the session as a whole. They are shown at the leg for visual organisation only.',
   facts:valid?[['Cumulative removal',`${state.last.removed.toFixed(2)} L`],['Current removal rate',`${state.last.uf.toFixed(2)} L/hour`],['Estimated volume deficit',`${state.deficit.toFixed(2)} L`],['Estimated refilling',`${state.refill.toFixed(2)} L/hour`]]:[],
   boundary:'Leg swelling, tissue hydration and regional fluid accumulation have not been measured.'},
  {id:'unmeasured',name:'Unmeasured regions',location:'Head marker · no regional sensor',x:50,y:11,
   tone:'unknown',kind:'Not measured',value:'No regional data',
   description:'No brain, lung, tissue-perfusion or organ-temperature measurements are included in this prototype. Unmeasured areas remain neutral.',
   facts:[['Cerebral perfusion','Not measured'],['Oxygenation','Not measured'],['Organ temperature','Not measured'],['Local tissue injury','Not inferred']],
   boundary:'Absence of a coloured alert is not evidence that an organ is healthy.'}
 ];
 return {anatomy,label,regions};
}
