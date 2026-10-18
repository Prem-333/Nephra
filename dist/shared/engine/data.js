// Entirely synthetic identities and physiology; no patient records.
export function random(seed) { let n=seed>>>0; return () => { n=(1664525*n+1013904223)>>>0; return n/4294967296; }; }
export function normal(r) { return Math.sqrt(-2*Math.log(Math.max(1e-9,r())))*Math.cos(2*Math.PI*r()); }
export const patients = [
  {id:'NP-001',name:'Meera S.',age:62,sex:'F',weight:58,baselineSBP:131,refill:0.74,sensitivity:85,uf:0.88,excess:3.2,diabetes:true,albumin:3.2,history:3,seed:21,bed:'01'},
  {id:'NP-002',name:'Arjun R.',age:48,sex:'M',weight:74,baselineSBP:142,refill:0.69,sensitivity:80,uf:0.70,excess:3.1,diabetes:false,albumin:3.9,history:0,seed:44,bed:'02'},
  {id:'NP-003',name:'Fatima A.',age:67,sex:'F',weight:61,baselineSBP:126,refill:0.68,sensitivity:88,uf:0.78,excess:2.9,diabetes:true,albumin:3.1,history:2,seed:68,bed:'03'},
  {id:'NP-004',name:'Dev K.',age:55,sex:'M',weight:69,baselineSBP:146,refill:0.75,sensitivity:86,uf:0.80,excess:3.5,diabetes:false,albumin:3.6,history:1,seed:92,bed:'04'},
  {id:'NP-005',name:'Leela P.',age:71,sex:'F',weight:53,baselineSBP:123,refill:0.61,sensitivity:90,uf:0.66,excess:2.6,diabetes:true,albumin:3.3,history:2,seed:17,bed:'05'},
  {id:'NP-006',name:'Kabir N.',age:43,sex:'M',weight:81,baselineSBP:139,refill:0.69,sensitivity:78,uf:0.67,excess:3.4,diabetes:false,albumin:4.0,history:0,seed:81,bed:'06'}
];

/** Independent observation generator: hidden reserve fatigue, refill heterogeneity,
 * nonlinear pressure response, correlated noise and periodic cuff measurements.
 * The estimator never receives hidden deficit or the generating parameters. */
export function generateSession(p, seed=p.seed, minutes=240) {
  const r=random(seed), plasma=p.weight*0.07, reserve=0.7+r()*0.6;
  const actualRefill=p.refill*(0.83+r()*0.34), actualSens=p.sensitivity*(0.88+r()*0.24);
  let deficit=0, tissue=p.excess, noise=0; const readings=[];
  for(let minute=0;minute<=minutes;minute++) {
    const refill=Math.min(p.uf+deficit*60,actualRefill*(0.8+0.2*tissue/p.excess)*(1+0.07*Math.sin(minute/33)));
    if(minute) {deficit+= (p.uf-refill)/60; tissue=Math.max(0,tissue-refill/60);}
    noise=0.6*noise+normal(r)*0.65;
    const fatigue=Math.max(0,minute-95)/145*(p.diabetes?4:1.5)*reserve;
    const truth=p.baselineSBP-actualSens*deficit-1.6*deficit*deficit-fatigue+noise;
    readings.push({minute,sbp:minute%5===0?Math.max(40,Math.round((truth+normal(r)*1.2)*10)/10):null,
      hr:Math.round(70+deficit*11+normal(r)*1.5),rbv:Math.max(30,Math.round((100-deficit/plasma*100+normal(r)*0.14)*100)/100),
      uf:p.uf,removed:Math.round(p.uf*minute/60*1000)/1000,quality:'good',truth:Math.round(truth*100)/100});
  }
  return readings;
}
export function publicReadings(rows) {return rows.map(({truth,...row})=>row);}
export function cohort(count=200,seed=2026) {
 const r=random(seed); return Array.from({length:count},(_,i)=>({id:`EVAL-${seed}-${i}`,name:`Synthetic ${i+1}`,age:35+Math.floor(r()*45),sex:r()>.5?'F':'M',weight:50+r()*40,baselineSBP:117+r()*36,refill:.5+r()*.45,sensitivity:65+r()*40,uf:.55+r()*.5,excess:2.5+r()*1.8,diabetes:r()<.5,albumin:3+r(),history:Math.floor(r()*4),seed:Math.floor(r()*1e8),bed:String(i+1)}));
}

