import es from '../locales/es.js';
import en from '../locales/en.js';

/**
 * Nested plain-object dictionaries resolved by dot-path (see tr()).
 * The active language is module state; use getLang()/setLang() to read/write it.
 */
const STR = { es, en };
let currentLang = 'es';

export function getLang(){ return currentLang; }
export function setLang(lang){ currentLang = lang; }
export function L(){ return STR[currentLang]; }
/** Resolve a dot-path string against the active language dictionary. */
export function tr(path){
  return path.split('.').reduce((o,k)=> (o && o[k]!==undefined) ? o[k] : undefined, L());
}
export function locale(){ return currentLang==='es' ? 'es-ES' : 'en-US'; }
