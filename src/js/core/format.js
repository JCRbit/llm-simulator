import { locale } from './i18n.js';

export function fmtInt(n){ return Math.round(n).toLocaleString(locale()); }
export function fmtMoney(n, digits){ return '$'+n.toLocaleString(locale(), {maximumFractionDigits: digits===undefined?2:digits}); }
