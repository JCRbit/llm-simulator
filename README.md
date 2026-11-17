# LLM Simulator

Herramienta didáctica interactiva sobre las restricciones de producción de los LLM: **tokens, coste de inferencia, latencia y límites de uso**. Cinco laboratorios con 11 experimentos, bilingüe (ES/EN) y sin dependencias: HTML + CSS + JavaScript nativo (ES Modules).

| Lab | Contenido |
|-----|-----------|
| 01 · Tokens | Tokenizador, desbordamiento de contexto (truncar / ventana / resumir / recuperar), densidad ES vs EN, JSON vs Markdown |
| 02 · Costes | Calculadora de coste por petición, día y mes según modelo (`small` / `base` / `large`) |
| 03 · Latencia | Desglose de latencia (red, recuperación, TTFT, generación) y *streaming* vs bloqueante |
| 04 · Límites | Tráfico vs capacidad (429) y estrategias de reintento (inmediato, cola, backoff, jitter, fallback) |
| 05 · Reto | Incidente de producción guiado: diagnóstico y 4 decisiones hasta cumplir los objetivos de coste, P95, TPM y 429 |

Una barra de estado global muestra, en vivo, las métricas del último experimento tocado (tokens, coste, latencia, límite de uso).

## Inicio rápido

Solo necesitas **Node.js ≥ 20** para el servidor local, los tests y el build. El proyecto **no tiene dependencias** (no hace falta `npm install`).

```bash
npm run dev      # servidor local → http://localhost:5173
npm test         # tests unitarios (node:test)
npm run build    # genera dist/ listo para desplegar
npm run preview  # sirve dist/ para comprobar el build
```

## Estructura

```
├── index.html                 # marcado + carga de CSS y del punto de entrada JS
├── assets/                    # favicon
├── src/
│   ├── styles/                # CSS por responsabilidad (el orden de carga en index.html importa)
│   │   ├── tokens.css         #   variables de diseño (:root)
│   │   ├── base.css           #   reset, accesibilidad, tipografía base
│   │   ├── layout.css         #   cabecera, navegación, barra de estado, hero, pie
│   │   ├── components.css     #   tarjetas de experimento, controles, medidores, alertas, resultados
│   │   ├── lab-latency.css    #   lab 3
│   │   ├── lab-limits.css     #   lab 4
│   │   ├── theory.css         #   bloques de teoría
│   │   └── lab-challenge.css  #   lab 5
│   └── js/
│       ├── main.js            # punto de entrada: enlaza eventos y hace el render inicial
│       ├── core/              # lógica compartida y sin DOM cuando es posible
│       │   ├── tokenizer.js   #   pseudo-tokenizador (puro, testeado)
│       │   ├── models.js      #   precios por modelo y computeCost() (puro, testeado)
│       │   ├── i18n.js        #   idioma activo, L(), tr(), locale()
│       │   ├── format.js · utils.js · dom.js
│       │   └── status.js      #   barra de estado global
│       ├── labs/              # un módulo por laboratorio (tokens, cost, latency, limits, challenge)
│       ├── features/          # language.js (cambio de idioma) · navigation.js (rutas por hash)
│       └── locales/           # es.js · en.js (diccionarios)
├── tests/                     # node:test: tokenizador, precios, paridad de diccionarios ES/EN
├── scripts/                   # dev-server.mjs · build.mjs (sin dependencias)
└── .github/workflows/ci.yml   # tests + build + despliegue a GitHub Pages
```

## Decisiones de arquitectura

- **Sin bundler**: la app es pequeña y los navegadores modernos soportan ES Modules, así que lo que se desarrolla es lo que se despliega. `npm run build` solo copia los ficheros necesarios a `dist/`. Si más adelante necesitas minificar o empaquetar, migrar a [Vite](https://vite.dev) es directo (ya hay un único punto de entrada).
- **Cada laboratorio es un módulo** que exporta `init…Lab()` (registra eventos) y sus funciones `render…()`. Ninguno toca el DOM al importarse, por lo que se pueden importar desde tests.
- **i18n por diccionarios anidados** resueltos por ruta (`tr('lab1.exp1.defaultText')`). El marcado usa `data-i18n` / `data-i18n-placeholder`; el texto generado desde JS usa `L()`. Los valores con parámetros son funciones. Un test garantiza que `es` y `en` tienen exactamente las mismas claves y que todas las claves usadas en `index.html` existen.
- **Estado**: el idioma activo vive en `core/i18n.js`; cada laboratorio guarda su propio estado de forma privada. La barra de estado (`core/status.js`) es el único canal compartido entre laboratorios.




