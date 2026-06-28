import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveKidScore } from './therapistMetrics.js';

test('resolveKidScore ignores zero-only score history', () => {
  const score = resolveKidScore(
    { id: 'kid-1' },
    {
      scoreEvolution: [{ value: 0, createdAt: '2026-06-10T10:00:00Z' }],
      recentHistory: [],
    },
    [],
    [],
  );

  assert.equal(score, null);
});

test('resolveKidScore prefers real positive values over zero', () => {
  const score = resolveKidScore(
    { id: 'kid-2' },
    {
      scoreEvolution: [{ value: 0, createdAt: '2026-06-10T10:00:00Z' }, { value: 78, createdAt: '2026-06-09T10:00:00Z' }],
      recentHistory: [],
    },
    [],
    [],
  );

  assert.equal(score, 78);
});
