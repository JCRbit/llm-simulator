import { renderTokenize, renderOverflow, renderDensity, renderPayload, initTokensLab } from './labs/tokens.js';
import { renderCost, initCostLab } from './labs/cost.js';
import { initLatencyLab } from './labs/latency.js';
import { renderBars, initLimitsLab } from './labs/limits.js';
import { renderGuidedChallenge, initChallengeLab } from './labs/challenge.js';
import { initStatusBar } from './core/status.js';
import { initLanguage, applyStaticTranslations } from './features/language.js';
import { initNavigation } from './features/navigation.js';

// Wire up events
initLanguage();
initTokensLab();
initCostLab();
initLatencyLab();
initLimitsLab();
initChallengeLab();

// Initial render (order matters: the last writer of each metric wins in the status bar)
renderTokenize();
renderOverflow();
renderDensity();
renderPayload();
renderCost();
renderBars();
applyStaticTranslations();
renderGuidedChallenge();

initNavigation();

// Estado inicial obligatorio: los cuatro indicadores parten de cero;
// los porcentajes/variaciones parten con guion. Los experimentos los actualizan
// únicamente cuando el usuario interactúa con ellos.
initStatusBar();
