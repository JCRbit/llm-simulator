/** Lab 5 — Production incident challenge: a guided, multi-step incident-response scenario. */
import { $ } from '../core/dom.js';
import { L, getLang, locale } from '../core/i18n.js';
import { fmtInt } from '../core/format.js';
import { updateStatus } from '../core/status.js';

const challengeInitial={model:'large',context:7200,cache:false,rateStrategy:'none',cost:9840,latency:3.40,tpm:1180000,rate429:3.8,rpm:1250};
let challengeSteps=[];
let challengeIndex=0,challengeCurrent={...challengeInitial},challengeChoices={model:'large',context:'keep',cache:'off',rateStrategy:'none'},challengeCheckpoint={...challengeInitial};
function buildChallengeSteps(){ return [{key:'diagnosis',...L().lab5.steps.diagnosis,target:'all'},{key:'model',...L().lab5.steps.model,target:'small'},{key:'context',...L().lab5.steps.context,target:'rag'},{key:'cache',...L().lab5.steps.cache,target:'on'},{key:'rate',...L().lab5.steps.rate,target:'backoff'},{key:'verify',...L().lab5.steps.verify,target:'accept',verify:true}]; }
challengeSteps=buildChallengeSteps();
function challengeMetric(label,value,key){
  const good=key==='cost'?value<=8000:key==='latency'?value<=2:key==='tpm'?value<=1000000:value<=1;
  const safe=Number.isFinite(Number(value))?Number(value):0; const val=key==='cost'?'€'+Math.round(safe).toLocaleString(locale()):key==='latency'?safe.toFixed(2)+' s':key==='tpm'?fmtInt(safe):safe.toFixed(2)+'%';
  return `<div class="incident-metric ${good?'good':'bad'}"><span>${label}</span><b>${val}</b></div>`;
}
function renderIncidentMetrics(m){
  $('incidentMetrics').innerHTML=challengeMetric('Coste / mes',m.cost,'cost')+challengeMetric('P95 Latency',m.latency,'latency')+challengeMetric('Tokens / min',m.tpm,'tpm')+challengeMetric('429',m.rate429,'rate')+`<div class="incident-metric"><span>RPM pico</span><b>${fmtInt(m.rpm)}</b></div>`;
}
function renderLive(){
  // SISTEMA EN PRODUCCIÓN is the live state of the incident. It stays visible
  // from the first decision through verification and always reflects the
  // current challenge state. Only the final verification adds the closed badge.
  $('challengeLive').style.display='block';
  $('liveGrid').innerHTML=challengeMetric(L().lab5.metricCost,challengeCurrent.cost,'cost')+challengeMetric(L().lab5.metricLatency,challengeCurrent.latency,'latency')+challengeMetric(L().lab5.metricTPM,challengeCurrent.tpm,'tpm')+challengeMetric(L().lab5.metricRate,challengeCurrent.rate429,'rate');
}
export function renderGuidedChallenge(){
  const step=challengeSteps[challengeIndex];
  $('challengeStep').textContent=step.phase; $('challengeQuestion').textContent=step.question; $('challengeHint').textContent=step.hint;
  $('challengeProgressText').textContent=(challengeIndex+1)+' / '+challengeSteps.length; $('challengeProgressMeter').style.width=((challengeIndex+1)/challengeSteps.length*100)+'%';
  $('challengeChoices').innerHTML='';
  $('challengeContinue').style.display='none';
  $('diagnosticPanel').style.display='none';
  $('consequencePanel').style.display='none';
  $('challengeLessonText').textContent='';
  // La tabla de métricas permanece visible durante todo el reto y refleja
  // el estado actual del sistema. En cada etapa parte del checkpoint actual;
  // al seleccionar la respuesta correcta, renderLive() la actualiza con la
  // mejora aplicada. El badge de incidente cerrado solo aparece en Verificación.
  $('challengeLive').style.display='block';
  const closedBadge=$('challengeLive').querySelector('.incident-badge-closed');
  closedBadge.style.display='none';
  renderLive();
  challengeCheckpoint={...challengeCurrent};
  if(step.verify){
    $('challengeQuestion').textContent=getLang()==='es'?'Sistema listo para producción':'System ready for production';
    $('challengeHint').textContent=getLang()==='es'?'Las restricciones de coste, latencia, tokens por minuto y tasa 429 están satisfechas.':'The cost, latency, tokens-per-minute and 429-rate constraints are satisfied.';
    $('challengeState').classList.add('challenge-ready-state');
    closedBadge.style.display='inline-flex';
    renderLive();
  } else {
    $('challengeState').classList.remove('challenge-ready-state');
    Object.entries(step.choices).forEach(([value,label])=>{const b=document.createElement('button');b.type='button';b.className='choice';b.textContent=label;b.setAttribute('data-choice',value);b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>selectChallengeChoice(value));$('challengeChoices').appendChild(b);});
    $('challengeContinue').style.display='block';
    $('challengeContinue').disabled=true;
  }
}
function renderContextDiagnostic(step){
  const d=step.breakdown;
  $('diagnosticPanel').style.display='block';
  $('diagnosticPanel').innerHTML=`<div class="breakdown-title">REQUEST BREAKDOWN / 7,200 TOKENS</div><div class="breakdown-row"><span>${d.system}</span><b>1,000</b></div><div class="breakdown-row"><span>${d.history}</span><b>2,000</b></div><div class="breakdown-row"><span>${d.rag}</span><b>3,600</b></div><div class="breakdown-row"><span>${d.output}</span><b>600</b></div><div class="breakdown-row total"><span>${d.total}</span><b>7,200</b></div>`;
}
function safeNum(v){const n=Number(v);return Number.isFinite(n)?n:0;}
function fmtChallengeValue(v,key){const n=safeNum(v);return key==='cost'?'€'+Math.round(n).toLocaleString(locale()):key==='latency'?n.toFixed(2)+' s':key==='tpm'?fmtInt(n):n.toFixed(2)+'%';}
function deltaHTML(before,after,key){const b=safeNum(before),a=safeNum(after),d=a-b;if(Math.abs(d)<0.005)return '<span class="challenge-delta">—</span>';const better=d<0;const text=key==='cost'?'€'+Math.abs(Math.round(d)):key==='latency'?Math.abs(d).toFixed(2)+' s':key==='tpm'?fmtInt(Math.abs(d)):Math.abs(d).toFixed(2)+'%';return `<span class="challenge-delta ${better?'better':'worse'}">${better?'↓':'↑'} ${text}</span>`;}
function renderConsequence(before,after,showComparison=true){
  const rows=[['Coste / mes','cost'],['Latencia P95 <span class="metric-help"></span>','latency'],['Tokens / min','tpm'],['429 rate','rate429']];
  $('consequenceGrid').innerHTML=rows.map(([label,key])=>{
    const b=safeNum(before[key]), a=safeNum(after[key]);
    return `<div class="consequence-row"><span class="consequence-label">${label}</span><b class="consequence-before">${fmtChallengeValue(b,key)}</b><span class="consequence-arrow"${showComparison?'':' style="visibility:hidden"'}>→</span><b class="consequence-after"${showComparison?'':' style="visibility:hidden"'}>${showComparison?fmtChallengeValue(a,key):'0'}</b><span class="consequence-delta-cell"${showComparison?'':' style="visibility:hidden"'}>${showComparison?deltaHTML(b,a,key):'—'}</span></div>`;
  }).join('');
}
function applyChallengeEffect(step,value){
  if(step.key==='model'){
    challengeChoices.model=value;
    if(value==='small') Object.assign(challengeCurrent,{cost:challengeCurrent.cost*0.34,latency:1.98,tpm:Math.round(challengeCurrent.tpm*0.62)});
    if(value==='base') Object.assign(challengeCurrent,{cost:challengeCurrent.cost*0.62,latency:2.55,tpm:Math.round(challengeCurrent.tpm*0.82)});
    if(value==='large') Object.assign(challengeCurrent,{cost:challengeCurrent.cost*1.18,latency:3.75,tpm:Math.round(challengeCurrent.tpm*1.08)});
  }
  if(step.key==='context'){
    challengeChoices.context=value;
    const factors={keep:[1,1,1],history:[.82,.88,.80],rag:[.52,.68,.56],summarize:[.58,.75,.62]}; const f=factors[value]||factors.keep;
    challengeCurrent.context=value==='rag'?3800:value==='summarize'?4200:value==='history'?5900:7200;
    challengeCurrent.cost*=f[0]; challengeCurrent.latency*=f[1]; challengeCurrent.tpm=Math.round(challengeCurrent.tpm*f[2]);
  }
  if(step.key==='cache'){
    challengeChoices.cache=value; if(value==='on'){challengeCurrent.cache=true;challengeCurrent.cost*=0.72;challengeCurrent.tpm=Math.round(challengeCurrent.tpm*0.78);} else {challengeCurrent.cache=false;}
  }
  if(step.key==='rate'){
    challengeChoices.rateStrategy=value;
    const factors={reject:[.55,.9],queue:[.38,.35],backoff:[.11,.11],fallback:[.16,.18]}; const f=factors[value]||[1,1];
    challengeCurrent.rate429*=f[0]; challengeCurrent.rpm=value==='backoff'?1050:value==='queue'?1120:value==='fallback'?1180:980;
    if(value==='backoff'){challengeCurrent.cost*=0.99;challengeCurrent.latency*=0.99;challengeCurrent.tpm=Math.round(challengeCurrent.tpm*.99);}
    if(value==='fallback'){challengeCurrent.cost*=1.08;challengeCurrent.latency*=.93;}
  }
}
function selectChallengeChoice(value){
  const step=challengeSteps[challengeIndex];
  const continueBtn=$('challengeContinue');
  const isCorrect=value===step.target;

  document.querySelectorAll('#challengeChoices .choice').forEach(b=>{
    b.setAttribute('aria-pressed',String(b.getAttribute('data-choice')===value));
  });

  // Never accumulate effects from repeated clicks: every choice starts from the
  // checkpoint of the current stage. Wrong answers are shown as explanations,
  // but they do not mutate production metrics.
  challengeCurrent={...challengeCheckpoint};

  if(step.key==='diagnosis'){
    $('diagnosticPanel').style.display='block';
    renderContextDiagnostic(step);
    $('diagnosticPanel').insertAdjacentHTML('afterbegin',`<div class="diagnostic-answer"><b>${step.phase}</b><p>${step.answer}</p></div>`);
    $('consequencePanel').style.display='block';
    $('consequenceGrid').innerHTML=`<div class="diagnostic-answer"><b>SEÑAL CLAVE</b><p>${challengeCurrent.cost.toLocaleString(locale())} €/mes + ${challengeCurrent.latency.toFixed(2)}s P95 + ${fmtInt(challengeCurrent.tpm)} TPM + ${challengeCurrent.rate429.toFixed(2)}% 429.</p></div>`;
    $('consequenceVerdict').textContent=isCorrect?'Opción correcta':'Opción incorrecta'; $('consequenceVerdict').className='challenge-verdict '+(isCorrect?'challenge-answer-correct':'challenge-answer-wrong');
    $('challengeLessonText').textContent=isCorrect?step.answer:(step.wrong?.[value] || 'Esta opción no responde al problema principal del incidente.');
  } else {
    if(isCorrect){
      applyChallengeEffect(step,value);
    }
    renderConsequence(challengeCheckpoint,challengeCurrent,isCorrect);
    $('consequencePanel').style.display='block';
    $('consequenceVerdict').textContent=isCorrect?'Opción correcta':'Opción incorrecta'; $('consequenceVerdict').className='challenge-verdict '+(isCorrect?'challenge-answer-correct':'challenge-answer-wrong');
    $('challengeLessonText').textContent=isCorrect?step.lesson:(step.wrong?.[value] || 'Esta opción no resuelve el incidente según los criterios del reto.');
  }

  // This is the only gate: Continue becomes active only for the unique
  // correct answer of the current stage.
  continueBtn.disabled=!isCorrect;
  continueBtn.setAttribute('aria-disabled',String(!isCorrect));
  renderIncidentMetrics(challengeInitial);
  // Keep the production table live and synchronized with the latest accepted improvement.
  renderLive();
  updateStatus({tokens:challengeCurrent.tpm,cost:challengeCurrent.cost,latency:challengeCurrent.latency,rate:challengeCurrent.rate429});
}

function meetsTargets(m){return m.cost<=8000&&m.latency<=2&&m.tpm<=1000000&&m.rate429<=1;}
function finishChallenge(){
  $('challengeState').style.display='none'; $('challengeFinal').style.display='block'; const ready=meetsTargets(challengeCurrent);
  $('finalHeadline').textContent=ready?(getLang()==='es'?'Has estabilizado producción.':'You stabilized production.'):(getLang()==='es'?'El incidente sigue abierto.':'The incident is still open.');
  $('finalModel').textContent=challengeChoices.model==='small'?'Nova Small':challengeChoices.model==='base'?'Nova Base':'Nova Large'; $('finalContext').textContent=fmtInt(challengeCurrent.context)+' tokens'; $('finalCache').textContent=challengeChoices.cache==='on'?(getLang()==='es'?'ACTIVADO':'ON'):(getLang()==='es'?'DESACTIVADO':'OFF');
  const rs={none:'—',reject:L().lab5.steps.rate.choices.reject,queue:L().lab5.steps.rate.choices.queue,backoff:L().lab5.steps.rate.choices.backoff,fallback:L().lab5.steps.rate.choices.fallback}; $('finalRateStrategy').textContent=rs[challengeChoices.rateStrategy]||'—'; $('finalCost').textContent='€'+Math.round(challengeCurrent.cost).toLocaleString(locale()); $('finalLatency').textContent=challengeCurrent.latency.toFixed(2)+' s'; $('finalTPM').textContent=fmtInt(challengeCurrent.tpm); $('finalRate').textContent=challengeCurrent.rate429.toFixed(2)+'%';
  const v=$('finalVerdict');v.textContent=ready?L().lab5.pass:L().lab5.fail;v.className='final-verdict '+(ready?'pass':'fail');renderBonus();updateStatus({tokens:challengeCurrent.tpm,cost:challengeCurrent.cost,latency:challengeCurrent.latency,rate:challengeCurrent.rate429});
}
function renderBonus(){
  $('bonusStats').innerHTML=`<div class="bonus-stat"><span>Requests / min</span><b>2.100 → 6.300</b></div><div class="bonus-stat"><span>Tokens / min</span><b>${fmtInt(challengeCurrent.tpm)} → ×3 = ${fmtInt(challengeCurrent.tpm*3)}</b></div>`;
  $('bonusChoices').innerHTML=''; Object.entries(L().lab5.bonus.choices).forEach(([v,label])=>{const b=document.createElement('button');b.type='button';b.className='choice';b.textContent=label;b.addEventListener('click',()=>runBonus(v));$('bonusChoices').appendChild(b);});
}
function runBonus(value){$('bonusResultText').textContent=L().lab5.bonus.result[value];$('bonusResult').style.display='block';}

/** Rebuilds the step definitions from the active dictionary and re-renders (used on language change). */
export function rebuildChallenge(){
  challengeSteps = buildChallengeSteps();
  renderGuidedChallenge();
}

export function initChallengeLab(){
  renderIncidentMetrics(challengeInitial);

  // Single resilient handler: reads the current stage at click time, so it
  // keeps working after the choices are re-rendered.
  $('challengeContinue').onclick=function(){
    if(this.disabled) return;
    const step=challengeSteps[challengeIndex];
    if(!step) return;
    if(step.verify){
      return;
    }
    challengeCheckpoint={...challengeCurrent};
    challengeIndex=Math.min(challengeIndex+1,challengeSteps.length-1);
    renderGuidedChallenge();
    $('challengeState').scrollIntoView({behavior:'smooth',block:'nearest'});
  };
}
