/**
 * Lab 4 — Límites de uso
 *   Exp 1: traffic vs capacity · Exp 2: retry strategies
 */
import { $ } from '../core/dom.js';
import { L } from '../core/i18n.js';
import { fmtInt } from '../core/format.js';
import { sleep } from '../core/utils.js';
import { updateStatus } from '../core/status.js';

// ---- Experiment 1 — Traffic vs capacity ----
export function renderBars(){
  const traffic = parseInt($('trafficSlider').value,10);
  const limit = parseInt($('limitSlider').value,10);
  $('trafficLbl').textContent = fmtInt(traffic)+' RPM';
  $('limitLbl').textContent = fmtInt(limit)+' RPM';

  const holder = $('barsHolder');
  holder.innerHTML = '';
  const maxScale = Math.max(traffic, limit)*1.04;
  const barCount = 24;
  const overLimit = traffic > limit;
  const trafficBarIndex = traffic > 0 ? Math.floor(Math.random() * barCount) : -1;
  for(let i=0;i<barCount;i++){
    // Cada barra representa una muestra independiente del tráfico actual.
    // En cada render, una barra elegida al azar llega exactamente al nivel
    // de tráfico; las demás varían aleatoriamente y nunca lo superan.
    const variation = i === trafficBarIndex ? 1 : (0.55 + Math.random() * 0.45);
    const val = traffic * variation;
    const h = traffic > 0 ? Math.max(2, Math.min(100, (val/maxScale)*100)) : 0;
    const bar = document.createElement('div');
    bar.className='bar';
    bar.style.height = h+'%';
    bar.style.background = overLimit ? 'var(--red)' : 'var(--teal)';
    holder.appendChild(bar);
  }
  const line = document.createElement('div');
  line.className='limit-line';
  line.setAttribute('data-label', L().lab4.exp1.limitTag);
  // La línea usa exactamente la misma escala y zona útil que las barras,
  // incluyendo el padding del contenedor. Así, cuando Tráfico = Límite,
  // la línea toca la barra que alcanza el 100% del tráfico.
  const barAreaPx = 68;
  line.style.bottom = (10 + (limit/maxScale)*barAreaPx)+'px';
  holder.appendChild(line);

  const alertBox = $('rateAlert');
  if(traffic > limit){
    const excess = Math.round(((traffic-limit)/traffic)*100);
    alertBox.innerHTML = `<div class="alert">${L().lab4.exp1.exceeded(excess)}</div>`;
  } else {
    alertBox.innerHTML = `<div class="alert ok">${L().lab4.exp1.ok(fmtInt(limit-traffic))}</div>`;
  }
  updateStatus({ rate: (traffic/limit)*100 });
}

// ---- Experiment 2 — Retry strategies ----
// A burst of REQ_BURST requests hits an endpoint whose instantaneous
// capacity is REQ_CAPACITY. Each of the five strategies handles the
// overflow differently — the grid, summary counts and (for backoff/
// jitter) the retry timeline all animate to show the outcome.
const REQ_BURST = 40;
const REQ_CAPACITY = 8;
let currentRetry = 'immediate';
let reqCells = [];
let retryTimers = [];

function buildReqGrid(){
  const grid = $('reqGrid');
  grid.innerHTML = '';
  reqCells = [];
  for(let i=0;i<REQ_BURST;i++){
    const cell = document.createElement('div');
    cell.className = 'req-cell';
    grid.appendChild(cell);
    reqCells.push(cell);
  }
}
function setCell(i, state){ reqCells[i].className = 'req-cell '+state; }
function updateReqSummary(){
  let success=0, failed=0, pending=0;
  reqCells.forEach(c=>{
    if(c.classList.contains('success') || c.classList.contains('fallback')) success++;
    else if(c.classList.contains('failed')) failed++;
    else pending++;
  });
  $('reqSuccessN').textContent = success;
  $('reqFailedN').textContent = failed;
  $('reqPendingN').textContent = pending;
}
function clearRetryTimers(){ retryTimers.forEach(id=>clearTimeout(id)); retryTimers=[]; }
export function resetReqGrid(){
  clearRetryTimers();
  reqCells.forEach(c=> c.className='req-cell');
  updateReqSummary();
  $('retryTimelineWrap').style.display='none';
  $('retryTimeline').innerHTML='';
  $('retryLog').textContent = L().lab4.exp2.placeholder;
}
function addTimelineDot(waitMs, maxMs){
  const dot = document.createElement('div');
  dot.className = 'dot';
  dot.style.left = Math.min(96, (waitMs/maxMs)*100) + '%';
  $('retryTimeline').appendChild(dot);
}

// Shared engine for 'backoff' and 'jitter': the endpoint's capacity only
// reopens for REQ_CAPACITY requests per round, and the wait before each
// round doubles. Every still-failing request retries; only the oldest
// REQ_CAPACITY of them get through, the rest fail again and roll into
// the next, longer round. `withJitter` only changes whether everyone in
// a round lands at the exact same instant or spreads out around it.
async function runRoundedRetry(withJitter){
  const overflow = REQ_BURST - REQ_CAPACITY;
  const totalRounds = Math.ceil(overflow / REQ_CAPACITY);
  const baseWait = 450;
  const jitterWindow = 220; // misma dispersión en todas las rondas
  const roundGap = 120;
  const roundStarts = [];
  let elapsed = 0;
  for(let r=1;r<=totalRounds;r++){
    elapsed += baseWait * Math.pow(2,r-1);
    roundStarts.push(elapsed);
    elapsed += jitterWindow + roundGap;
  }
  const maxWait = elapsed;
  $('retryTimelineWrap').style.display='block';
  $('retryTimelineCaption').textContent = withJitter ? L().lab4.exp2.timelineJitter : L().lab4.exp2.timelineNoJitter;
  let pending = [];
  for(let i=REQ_CAPACITY;i<REQ_BURST;i++) pending.push(i);
  let round = 0;
  while(pending.length){
    const batch = pending.slice(0, REQ_CAPACITY);
    const rest = pending.slice(REQ_CAPACITY);
    const roundStart = roundStarts[round];
    if(!withJitter){
      batch.forEach(()=> addTimelineDot(roundStart, maxWait));
      await new Promise(resolve=>{ const id=setTimeout(resolve, roundStart - (round ? roundStarts[round-1] : 0)); retryTimers.push(id); });
      batch.forEach(i=>setCell(i,'success'));
      updateReqSummary();
    } else {
      // Ventana de jitter constante: todos los reintentos se dispersan igual.
      const offsets = Array.from({length:batch.length}, (_,k)=>
        Math.max(0, Math.min(jitterWindow, k*(jitterWindow/(batch.length-1)) + (Math.random()-0.5)*45))
      ).sort((a,b)=>a-b);
      offsets.forEach(offset=>addTimelineDot(roundStart + offset, maxWait));
      const previousRoundEnd = round ? roundStarts[round-1] + jitterWindow + roundGap : 0;
      const waitUntilRound = Math.max(0, roundStart - previousRoundEnd);
      await new Promise(resolve=>{ const id=setTimeout(resolve, waitUntilRound); retryTimers.push(id); });
      let previousOffset=0;
      for(let k=0;k<batch.length;k++){
        const delay=Math.max(0, offsets[k]-previousOffset);
        if(delay) await new Promise(resolve=>{ const id=setTimeout(resolve,delay); retryTimers.push(id); });
        setCell(batch[k],'success');
        updateReqSummary();
        previousOffset=offsets[k];
      }
    }
    pending=rest;
    round++;
  }
  return round;
}

async function runRetrySim(){
  clearRetryTimers();
  reqCells.forEach(c=> c.className='req-cell');
  $('retryTimelineWrap').style.display='none';
  $('retryTimeline').innerHTML='';
  updateReqSummary();
  const t = L().lab4.exp2;
  $('retryLog').textContent = t.running;

  // Whatever fits in the endpoint's instantaneous capacity always
  // succeeds right away, regardless of strategy.
  for(let i=0;i<REQ_CAPACITY;i++) setCell(i,'success');
  updateReqSummary();
  await sleep(150);
  const overflow = REQ_BURST - REQ_CAPACITY;

  if(currentRetry==='immediate'){
    // Immediate retry: first show the initial outcome (8 successes, rest failed).
    // Then all failed requests retry together: every failed cell briefly returns
    // to the neutral/initial color at the same instant, before most fail again
    // and a few randomly selected requests succeed.
    for(let i=REQ_CAPACITY;i<REQ_BURST;i++) setCell(i,'failed');
    updateReqSummary();

    const retryCells = Array.from({length:overflow}, (_,k)=>REQ_CAPACITY+k);
    const luckyCount = Math.min(3, Math.max(1, Math.floor(Math.random()*3)+1));
    const lucky = new Set(retryCells.sort(()=>Math.random()-0.5).slice(0, luckyCount));

    // Leave a visible gap between the initial burst and the retry.
    await sleep(650);
    retryCells.forEach(i=>setCell(i,'retry-flash'));
    updateReqSummary();

    await sleep(120);
    retryCells.forEach(i=>setCell(i, lucky.has(i) ? 'success' : 'failed'));
    updateReqSummary();

    $('retryLog').textContent = t.done.immediate(REQ_CAPACITY + luckyCount, overflow - luckyCount);

  } else if(currentRetry==='queue'){
    // Nothing fails: overflow requests wait in memory and drain as
    // capacity is confirmed, like a token bucket refilling.
    for(let i=REQ_CAPACITY;i<REQ_BURST;i++) setCell(i,'queued');
    updateReqSummary();
    let served = REQ_CAPACITY, tokens = 0;
    await new Promise(resolve=>{
      const iv = setInterval(()=>{
        tokens += 1.6;
        while(tokens>=1 && served<REQ_BURST){ setCell(served,'success'); served++; tokens-=1; }
        updateReqSummary();
        if(served>=REQ_BURST){ clearInterval(iv); resolve(); }
      }, 120);
      retryTimers.push(iv);
    });
    $('retryLog').textContent = t.done.queue(REQ_BURST);

  } else if(currentRetry==='backoff'){
    // Every failed client computes the exact same backoff wait, so they
    // all retry — and collide — at the same instant. Only REQ_CAPACITY
    // of them fit through in that instant; the rest fail again and have
    // to wait twice as long before the next attempt.
    for(let i=REQ_CAPACITY;i<REQ_BURST;i++) setCell(i,'failed');
    updateReqSummary();
    const rounds = await runRoundedRetry(false);
    $('retryLog').textContent = t.done.backoff(overflow, rounds, REQ_CAPACITY);

  } else if(currentRetry==='jitter'){
    // Same doubling backoff base, but each client adds its own random
    // jitter on top, so each round's retries land spread out instead of
    // stacking on the exact same instant.
    for(let i=REQ_CAPACITY;i<REQ_BURST;i++) setCell(i,'failed');
    updateReqSummary();
    const rounds = await runRoundedRetry(true);
    $('retryLog').textContent = t.done.jitter(overflow, rounds, REQ_CAPACITY);

  } else if(currentRetry==='fallback'){
    // Overflow requests fail on the primary model, then get rerouted
    // to a backup model/region — shown in a distinct color.
    for(let i=REQ_CAPACITY;i<REQ_BURST;i++) setCell(i,'failed');
    updateReqSummary();
    await sleep(350);
    const waits = [];
    for(let i=REQ_CAPACITY;i<REQ_BURST;i++) waits.push({i, w: 200+Math.random()*300});
    await Promise.all(waits.map(({i,w})=> new Promise(resolve=>{
      const id = setTimeout(()=>{ setCell(i,'fallback'); updateReqSummary(); resolve(); }, w);
      retryTimers.push(id);
    })));
    $('retryLog').textContent = t.done.fallback(overflow);
  }
}

/** Re-applies the lesson text of the active retry strategy (used on language change). */
export function refreshRetryLesson(){
  $('retryLesson').textContent = L().lab4.exp2.lessons[currentRetry];
}

export function initLimitsLab(){
  $('trafficSlider').addEventListener('input', renderBars);
  $('limitSlider').addEventListener('input', renderBars);
  buildReqGrid();
  document.querySelectorAll('#retryRow .choice').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      currentRetry = btn.dataset.r;
      document.querySelectorAll('#retryRow .choice').forEach(b=>{
        const active = b === btn;
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
        b.classList.toggle('active', active);
      });
      $('retryLesson').textContent = L().lab4.exp2.lessons[currentRetry];
      resetReqGrid();
    });
  });
  $('runRetryBtn').addEventListener('click', runRetrySim);
}
