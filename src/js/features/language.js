import { $ } from '../core/dom.js';
import { L, tr, getLang, setLang } from '../core/i18n.js';
import { renderTokenize, renderOverflow, refreshStrategyLesson, refreshResultTexts } from '../labs/tokens.js';
import { renderCost } from '../labs/cost.js';
import { renderBars, resetReqGrid, refreshRetryLesson } from '../labs/limits.js';
import { rebuildChallenge } from '../labs/challenge.js';

/**
 * Applies static [data-i18n] / [data-i18n-placeholder] text, then lets
 * setLanguage() re-run every render function so dynamic (JS-generated)
 * copy is also translated.
 */
export function applyStaticTranslations(){
  const currentLang = getLang();
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const val = tr(el.getAttribute('data-i18n'));
    if(typeof val === 'string') el.innerHTML = val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
    const val = tr(el.getAttribute('data-i18n-placeholder'));
    if(typeof val === 'string') el.placeholder = val;
  });
  $('langEs').setAttribute('aria-pressed', currentLang==='es');
  $('langEn').setAttribute('aria-pressed', currentLang==='en');
  $('langEs').classList.toggle('active', currentLang==='es');
  $('langEn').classList.toggle('active', currentLang==='en');
}

let tokInCurrentDefault = null; // tracks the auto-filled example text so we don't clobber user edits

export function setLanguage(lang){
  const prevDefault = tokInCurrentDefault;
  setLang(lang);
  applyStaticTranslations();

  // Swap the example sentence in the tokenizer textarea only if the user
  // hasn't typed anything of their own over it.
  const ta = $('tokIn');
  if(prevDefault === null || ta.value === prevDefault){
    ta.value = tr('lab1.exp1.defaultText');
  }
  tokInCurrentDefault = tr('lab1.exp1.defaultText');

  // Reset transient dynamic outputs that were rendered in the other language.
  resetReqGrid();
  refreshStrategyLesson();
  refreshRetryLesson();
  refreshResultTexts();

  // Re-render everything that depends on the language for number formatting
  // or generated copy (alerts, lesson text, status-bar wording).
  renderTokenize();
  renderOverflow();
  renderCost();
  renderBars();
  rebuildChallenge();
}

/** Registers the language switch and records the markup's default example text. */
export function initLanguage(){
  tokInCurrentDefault = $('tokIn').value; // matches the Spanish default already in the markup
  $('langEs').addEventListener('click', ()=> setLanguage('es'));
  $('langEn').addEventListener('click', ()=> setLanguage('en'));
}
