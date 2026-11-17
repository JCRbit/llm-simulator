export function randRange(a,b){ return a + Math.random()*(b-a); }
export function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
