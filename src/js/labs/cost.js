/** Lab 2 — Cost Engineering: per-request, daily and monthly cost calculator. */
import { $ } from '../core/dom.js';
import { fmtInt, fmtMoney } from '../core/format.js';
import { updateStatus } from '../core/status.js';
import { computeCost } from '../core/models.js';

export function renderCost(){
  const inTok = parseInt($('inTok').value,10);
  const outTok = parseInt($('outTok').value,10);
  const reqDay = parseInt($('reqDay').value,10);
  const { costIn, costOut, costReq, daily, monthly } = computeCost($('modelSel').value, inTok, outTok, reqDay);

  $('inTokLbl').textContent = fmtInt(inTok);
  $('outTokLbl').textContent = fmtInt(outTok);
  $('reqDayLbl').textContent = fmtInt(reqDay);

  $('costInput').textContent = fmtMoney(costIn,4);
  $('costOutput').textContent = fmtMoney(costOut,4);
  $('costTotal').textContent = fmtMoney(costReq,4);

  $('costDaily').textContent = fmtMoney(daily,2);
  $('costMonthly').textContent = fmtMoney(monthly,2);
  updateStatus({ cost: costReq });
}

export function initCostLab(){
  ['modelSel','inTok','outTok','reqDay'].forEach(id=>$(id).addEventListener('input', renderCost));
}
