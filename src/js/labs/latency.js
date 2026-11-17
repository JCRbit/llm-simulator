/** Lab 3 — Latency Control: latency breakdown and streaming vs blocking. */
import { $ } from '../core/dom.js';
import { L } from '../core/i18n.js';
import { randRange } from '../core/utils.js';
import { updateStatus } from '../core/status.js';

export function initLatencyLab(){
  // Experiment 1 — Latency breakdown
  $('sendReqBtn').addEventListener('click', ()=>{
    const block = $('timelineBlock');
    block.style.display = 'block';
    const network = randRange(40,120);
    const retrieval = randRange(80,220);
    const ttft = randRange(200,480);
    const outputTokens = Math.round(randRange(80,220));
    const tpot = randRange(28,55);
    const generation = outputTokens*tpot;
    const total = network+retrieval+ttft+generation;
    const stages = {network, retrieval, ttft, generation};
    Object.keys(stages).forEach(key=>{
      const pct = (stages[key]/total)*100;
      $('bar-'+key).style.width = '0%';
      requestAnimationFrame(()=>{ $('bar-'+key).style.width = pct+'%'; });
      $('ms-'+key).textContent = Math.round(stages[key])+' ms';
    });
    $('ms-total').textContent = Math.round(total)+' ms';
    $('latencyExtra').style.display = 'flex';
    $('ttftReadout').textContent = Math.round(ttft)+' ms';
    $('tpotReadout').textContent = Math.round(tpot)+' ms/token';
    $('outReadout').textContent = outputTokens+' tokens';
    updateStatus({ latency: total/1000 });
  });

  // Experiment 2 — Streaming vs blocking
  $('streamBtn').addEventListener('click', ()=>{
    const answer = L().lab3.exp2.answerText;
    const words = answer.split(' ');
    const blockEl = $('blockText'); const streamEl = $('streamText');
    blockEl.textContent=''; streamEl.textContent='';
    const firstTokenDelay = 320;
    // La generación total es prácticamente la misma en ambos modos: streaming
    // cambia cuándo empieza a verse la respuesta, no cuánto tarda necesariamente.
    const perWord = 84;
    const streamTotal = firstTokenDelay + Math.max(0, words.length - 1) * perWord;
    // Introducimos una pequeña variación realista: ambos modos tardan prácticamente
    // lo mismo, pero no terminan exactamente en el mismo instante.
    const jitter = Math.round((Math.random() * 300) - 150); // -150 ms a +150 ms
    const blockDelay = Math.max(100, streamTotal + jitter);

    setTimeout(()=>{ blockEl.textContent = answer; $('blockTime').textContent = blockDelay+' ms'; }, blockDelay);

    let shown = '';
    words.forEach((w,i)=>{
      setTimeout(()=>{
        shown += (i?' ':'')+w;
        streamEl.textContent = shown;
        if(i===0){ $('streamTime').textContent = firstTokenDelay+' ms'; }
        if(i===words.length-1){ $('streamTime').textContent = firstTokenDelay+' ms · '+streamTotal+' ms total'; }
      }, firstTokenDelay + i*perWord);
    });
  });
}
