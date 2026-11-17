import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pseudoTokenize, countTokens } from '../src/js/core/tokenizer.js';

test('empty input yields no tokens', () => {
  assert.deepEqual(pseudoTokenize(''), []);
  assert.equal(countTokens(''), 0);
});

test('short words stay whole and keep their leading space', () => {
  assert.deepEqual(pseudoTokenize('cat sat'), ['cat', ' sat']);
});

test('long alphanumeric runs are split into 4-character chunks', () => {
  assert.deepEqual(pseudoTokenize('abcdefghij'), ['abcd', 'efgh', 'ij']);
  // the leading space attaches to the first chunk only
  assert.deepEqual(pseudoTokenize('a abcdefgh'), ['a', ' abcd', 'efgh']);
});

test('punctuation becomes separate tokens', () => {
  assert.deepEqual(pseudoTokenize('hi, you!'), ['hi', ',', ' you', '!']);
});

test('countTokens ignores whitespace-only tokens', () => {
  const text = 'a  b\n\nc';
  assert.ok(pseudoTokenize(text).some(t => /^\s+$/.test(t)), 'fixture must contain whitespace tokens');
  assert.equal(countTokens(text), 3);
});

test('tokenization is lossless: tokens re-join into the original text', () => {
  const text = 'Explica cómo funciona un límite de uso — 12345678 tokens!';
  assert.equal(pseudoTokenize(text).join(''), text);
});
