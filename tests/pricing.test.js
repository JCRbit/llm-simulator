import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MODELS, computeCost } from '../src/js/core/models.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !≈ ${b}`);

test('computeCost splits input/output cost per 1k tokens', () => {
  const r = computeCost('base', 1000, 1000, 1);
  close(r.costIn, MODELS.base.inPrice);
  close(r.costOut, MODELS.base.outPrice);
  close(r.costReq, MODELS.base.inPrice + MODELS.base.outPrice);
});

test('daily cost scales with requests/day and monthly is 30 days', () => {
  const r = computeCost('small', 2000, 500, 10_000);
  close(r.daily, r.costReq * 10_000);
  close(r.monthly, r.daily * 30);
});

test('larger tiers always cost more for the same request profile', () => {
  const cost = k => computeCost(k, 3000, 800, 1).costReq;
  assert.ok(cost('small') < cost('base'));
  assert.ok(cost('base') < cost('large'));
});

test('zero tokens cost nothing', () => {
  assert.equal(computeCost('large', 0, 0, 1000).monthly, 0);
});
