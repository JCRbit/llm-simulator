import { $ } from './dom.js';
import { L } from './i18n.js';
import { fmtInt, fmtMoney } from './format.js';

const statusPrev = { tokens:null, cost:null, latency:null, rate:null };
export function initStatusBar(){
  $('statTokens').textContent = '0';
  $('statCost').textContent = '$0.0000';
  $('statLatency').textContent = '0.00 s';
  $('statRate').textContent = '0%';
  ['statTokensDelta','statCostDelta','statLatencyDelta','statRateDelta'].forEach(id=>{
    $(id).textContent = '—';
    $(id).className = 'status-delta';
  });
}

function setDelta(elId, prev, curr, mode){
  const el = $(elId);
  if(prev===null || prev===undefined){ el.textContent='—'; el.className='status-delta'; return; }
  const diff = curr-prev;
  if(Math.abs(diff) < (mode==='cost'?0.0001:1e-6)){ el.textContent='—'; el.className='status-delta'; return; }
  const up = diff>0;
  let text, cls;
  if(mode==='cost'){ text=(up?'↑ $':'↓ $')+Math.abs(diff).toFixed(4); cls=up?'up':'down'; }
  else if(mode==='latency'){ text=(up?'↑ ':'↓ ')+Math.round(Math.abs(diff)*1000)+'ms'; cls=up?'up':'down'; }
  else { const pct = prev!==0 ? Math.abs(diff/prev*100) : 0; text=(up?'↑ ':'↓ ')+pct.toFixed(0)+'%'; cls=up?'warn':'down'; }
  el.textContent=text; el.className='status-delta '+cls;
}
export function updateStatus(p){
  if('tokens' in p){ $('statTokens').textContent=fmtInt(p.tokens)+' tokens'; setDelta('statTokensDelta', statusPrev.tokens, p.tokens, 'tokens'); statusPrev.tokens=p.tokens; }
  if('cost' in p){ $('statCost').textContent=fmtMoney(p.cost,4); setDelta('statCostDelta', statusPrev.cost, p.cost, 'cost'); statusPrev.cost=p.cost; }
  if('latency' in p){ $('statLatency').textContent=p.latency.toFixed(2)+' s'; setDelta('statLatencyDelta', statusPrev.latency, p.latency, 'latency'); statusPrev.latency=p.latency; }
  if('rate' in p){
    $('statRate').textContent=Math.round(p.rate)+'%';
    const el=$('statRateDelta');
    if(p.rate>100){ el.textContent=L().status.overLimit; el.className='status-delta up'; }
    else if(p.rate>85){ el.textContent=L().status.nearLimit; el.className='status-delta warn'; }
    else { el.textContent=L().status.withinCapacity; el.className='status-delta down'; }
    statusPrev.rate=p.rate;
  }
}
