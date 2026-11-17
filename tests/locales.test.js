import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import es from '../src/js/locales/es.js';
import en from '../src/js/locales/en.js';

/** Flattens a dictionary into { 'a.b.c': 'string' | 'function' | ... } */
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, out);
    else out[key] = typeof v;
  }
  return out;
}

test('es and en dictionaries expose exactly the same keys and value types', () => {
  const a = flatten(es), b = flatten(en);
  const onlyEs = Object.keys(a).filter(k => !(k in b));
  const onlyEn = Object.keys(b).filter(k => !(k in a));
  assert.deepEqual(onlyEs, [], `keys missing in en: ${onlyEs.join(', ')}`);
  assert.deepEqual(onlyEn, [], `keys missing in es: ${onlyEn.join(', ')}`);
  const mismatched = Object.keys(a).filter(k => a[k] !== b[k]);
  assert.deepEqual(mismatched, [], `type mismatch: ${mismatched.join(', ')}`);
});

test('every data-i18n / data-i18n-placeholder key in index.html resolves to a string in both languages', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const keys = [...html.matchAll(/data-i18n(?:-placeholder)?="([^"]+)"/g)].map(m => m[1]);
  assert.ok(keys.length > 20, 'expected many translated nodes');
  const get = (dict, path) => path.split('.').reduce((o, k) => o?.[k], dict);
  for (const key of new Set(keys)) {
    for (const [name, dict] of [['es', es], ['en', en]]) {
      assert.equal(typeof get(dict, key), 'string', `${name}: "${key}" is missing or not a string`);
    }
  }
});

test('the English dictionary contains no leaked Spanish "límite de uso" terminology', () => {
  const src = readFileSync(new URL('../src/js/locales/en.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /l[ií]mites? de uso/i);
});

test('no machine-replacement artifacts such as "usoing" remain in any source', () => {
  for (const f of ['../index.html', '../src/js/locales/es.js', '../src/js/locales/en.js']) {
    assert.doesNotMatch(readFileSync(new URL(f, import.meta.url), 'utf8'), /usoing/i, f);
  }
});
