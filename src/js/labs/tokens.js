/**
 * Lab 1 — Token Anatomy
 *   Exp 1: tokenizer highlighter · Exp 2: context overflow strategies
 *   Exp 3: language density (ES vs EN) · Exp 4: payload efficiency (JSON vs Markdown)
 */
import { $ } from '../core/dom.js';
import { L, locale } from '../core/i18n.js';
import { fmtInt } from '../core/format.js';
import { updateStatus } from '../core/status.js';
import { pseudoTokenize, countTokens } from '../core/tokenizer.js';

const PALETTE = [
  {bg:'#134e4a',fg:'#5eead4'}, {bg:'#312e81',fg:'#a5b4fc'}, {bg:'#14532d',fg:'#86efac'},
  {bg:'#7c2d12',fg:'#fdba74'}, {bg:'#581c87',fg:'#e9d5ff'}, {bg:'#713f12',fg:'#fde68a'},
  {bg:'#164e63',fg:'#67e8f9'},
];

// ---- Experiment 1 — Tokenizer (inline highlighter) ----
/** Paints a token strip into elId and returns the raw token list (whitespace included). */
function paintTokenStrip(elId, text){
  const tokens = pseudoTokenize(text);
  const strip = $(elId);
  strip.innerHTML = tokens.map((t,i)=>{
    const c = PALETTE[i % PALETTE.length];
    const safe = t.replace(/&/g,'&amp;').replace(/</g,'&lt;');
    return `<span class="htok" style="background:${c.bg};color:${c.fg}">${safe}</span>`;
  }).join('');
  return tokens;
}
export function renderTokenize(){
  const text = $('tokIn').value;
  const tokens = pseudoTokenize(text);
  const strip = $('tokStrip');
  strip.innerHTML = tokens.map((t,i)=>{
    const c = PALETTE[i % PALETTE.length];
    const safe = t.replace(/&/g,'&amp;').replace(/</g,'&lt;');
    return `<span class="htok" style="background:${c.bg};color:${c.fg}">${safe}</span>`;
  }).join('');
  $('tokCount').textContent = fmtInt(tokens.length);
  $('charCount').textContent = fmtInt(text.length);
  $('charsPerToken').textContent = tokens.length ? (text.length/tokens.length).toLocaleString(locale(), {minimumFractionDigits:1, maximumFractionDigits:2}) : '0';
  const pct = Math.min(100, (tokens.length/4096)*100);
  $('ctxPct').textContent = Math.round(pct)+'%';
  const meter = $('ctxMeter');
  meter.style.width = pct+'%';
  meter.className = 'meter-fill' + (pct>90?' over':pct>70?' warn':'');
  updateStatus({ tokens: tokens.length });
}

// ---- Experiment 2 — Context overflow ----
const CTX_MAX = 4096;
const TURN_COUNT = 12;
let currentStrategy = 'truncate';
export function renderOverflow(){
  const total = parseInt($('convLen').value,10);
  $('convLenLbl').textContent = fmtInt(total)+' tokens';
  const strip = $('convStrip');
  strip.innerHTML = '';

  const weights = Array.from({length:TURN_COUNT}, (_,i)=> 0.6 + (i%3)*0.25);
  const wsum = weights.reduce((a,b)=>a+b,0);
  let turns = weights.map(w => Math.round(total*(w/wsum)));

  let displayTurns = turns.map((t,i)=>({tokens:t,label:'T'+(i+1),kind:'normal'}));
  let effectiveTotal = turns.reduce((a,b)=>a+b,0);

  if(effectiveTotal > CTX_MAX){
    if(currentStrategy==='truncate' || currentStrategy==='sliding'){
      let running = 0; const kept = [];
      for(let i=displayTurns.length-1;i>=0;i--){
        if(running + displayTurns[i].tokens <= CTX_MAX){ running+=displayTurns[i].tokens; kept.unshift(displayTurns[i]); }
      }
      const dropped = displayTurns.length - kept.length;
      displayTurns = dropped>0 ? [{tokens:0,label:dropped+' —',kind:'dropped'}, ...kept] : kept;
      effectiveTotal = running;
    } else if(currentStrategy==='summarize'){
      const half = Math.floor(displayTurns.length/2);
      const older = displayTurns.slice(0, half);
      const recent = displayTurns.slice(half);
      const oldTokens = older.reduce((a,b)=>a+b.tokens,0);
      const summaryTokens = Math.min(200, Math.round(oldTokens*0.1));
      displayTurns = [{tokens:summaryTokens,label:'summary',kind:'summary'}, ...recent];
      effectiveTotal = summaryTokens + recent.reduce((a,b)=>a+b.tokens,0);
    } else if(currentStrategy==='retrieve'){
      const relevant = [displayTurns[2], displayTurns[7], displayTurns[displayTurns.length-1]].filter(Boolean);
      displayTurns = relevant.map(t=>({...t, kind:'retrieved'}));
      effectiveTotal = displayTurns.reduce((a,b)=>a+b.tokens,0);
    }
  }

  const maxSeg = Math.max(...displayTurns.map(t=>t.tokens), 1);
  displayTurns.forEach(t=>{
    const w = Math.max(18, (t.tokens/maxSeg)*90);
    let cls = 'tok-a';
    if(t.kind==='dropped') cls='';
    if(t.kind==='summary') cls='tok-b';
    if(t.kind==='retrieved') cls='tok-b';
    const style = t.kind==='dropped' ? 'color:var(--text-faint);border:1px dashed var(--border);background:transparent;' : '';
    const span = document.createElement('span');
    span.className = 'tok '+cls;
    span.style.cssText = style + `min-width:${w}px;text-align:center;`;
    span.textContent = t.kind==='dropped' ? t.label : (t.kind==='summary' ? 'summary' : t.label);
    strip.appendChild(span);
  });

  $('convReadout').textContent = `${fmtInt(effectiveTotal)} / ${fmtInt(CTX_MAX)}`;
  const meter = $('convMeter');
  meter.style.width = Math.min(100,(effectiveTotal/CTX_MAX)*100)+'%';
  meter.className = 'meter-fill'+(effectiveTotal>=CTX_MAX*0.95?' over':effectiveTotal>=CTX_MAX*0.7?' warn':'');

  const alertBox = $('convAlert');
  if(total > CTX_MAX){
    const strategyLabel = L().lab1.exp2.choices[currentStrategy];
    alertBox.innerHTML = `<div class="alert">${L().lab1.exp2.alert(fmtInt(total), fmtInt(CTX_MAX), strategyLabel)}</div>`;
  } else {
    alertBox.innerHTML = '';
  }
  updateStatus({ tokens: effectiveTotal });
}

/** Re-applies the lesson text of the active overflow strategy (used on language change). */
export function refreshStrategyLesson(){
  $('strategyLesson').textContent = L().lab1.exp2.lessons[currentStrategy];
}

// ---- Experiment 3 — Language density test (ES vs EN) ----
// Illustrative differences quoted in the experiment copy (kept constant on purpose).
const DENSITY_DIFF_PCT = 50;
const PAYLOAD_DIFF_PCT = 58;

export function renderDensity(){
  const es = $('densEs').value;
  const en = $('densEn').value;
  const tokEs = paintTokenStrip('densEsStrip', es).filter(t=>!/^\s+$/.test(t));
  const tokEn = paintTokenStrip('densEnStrip', en).filter(t=>!/^\s+$/.test(t));
  $('densEsCount').textContent = fmtInt(tokEs.length);
  $('densEnCount').textContent = fmtInt(tokEn.length);
  const pct = tokEn.length ? Math.round(((tokEs.length - tokEn.length) / tokEn.length) * 100) : 0;
  $('densResult').innerHTML = L().lab1.exp3.result(DENSITY_DIFF_PCT);
  updateStatus({ tokens: tokEs.length });
}

// ---- Experiment 4 — Payload efficiency (JSON vs Markdown) ----
export function renderPayload(){
  const json = $('payloadJson').value;
  const md = $('payloadMarkdown').value;
  const tokJson = countTokens(json);
  const tokMd = countTokens(md);
  $('payloadJsonCount').textContent = fmtInt(tokJson);
  $('payloadMarkdownCount').textContent = fmtInt(tokMd);
  const pct = tokMd ? Math.round(((tokJson - tokMd) / tokMd) * 100) : 0;
  $('payloadResult').innerHTML = L().lab1.exp4.result(PAYLOAD_DIFF_PCT);
  updateStatus({ tokens: tokJson });
}

/** Re-translates the result sentences of experiments 3 and 4 (used on language change). */
export function refreshResultTexts(){
  $('densResult').innerHTML = L().lab1.exp3.result(DENSITY_DIFF_PCT);
  $('payloadResult').innerHTML = L().lab1.exp4.result(PAYLOAD_DIFF_PCT);
}

export function initTokensLab(){
  $('tokIn').addEventListener('input', renderTokenize);
  $('convLen').addEventListener('input', renderOverflow);
  document.querySelectorAll('#strategyRow .choice').forEach(el=>{
    el.addEventListener('click', ()=>{
      document.querySelectorAll('#strategyRow .choice').forEach(c=>c.setAttribute('aria-pressed','false'));
      el.setAttribute('aria-pressed','true');
      currentStrategy = el.dataset.s;
      $('strategyLesson').textContent = L().lab1.exp2.lessons[currentStrategy];
      renderOverflow();
    });
  });
  $('densEs').addEventListener('input', renderDensity);
  $('densEn').addEventListener('input', renderDensity);
  $('payloadJson').addEventListener('input', renderPayload);
  $('payloadMarkdown').addEventListener('input', renderPayload);
}
