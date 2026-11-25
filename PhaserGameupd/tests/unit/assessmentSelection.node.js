import test from 'node:test';
import assert from 'node:assert/strict';
import { selectAssessmentItems } from '../../src/systems/assessmentSelection.js';

test('each game assessment start draws the configured number and retry changes the draw', () => {
  const pool = Array.from({ length: 50 }, (_, index) => ({ id: `item-${index + 1}`, choices: ['A', 'B', 'C'], answer: 'A' }));
  const assessment = { items: pool, itemsPerAttempt: 5 };
  const first = selectAssessmentItems('retry-test', assessment, () => 0);
  const second = selectAssessmentItems('retry-test', assessment, () => 0);

  assert.equal(first.items.length, 5);
  assert.equal(second.items.length, 5);
  assert.notDeepEqual(second.items.map((item) => item.id), first.items.map((item) => item.id));
  assert.equal(assessment.items.length, 50);
  assert.equal(new Set(second.items.map((item) => item.id)).size, 5);
  assert.notDeepEqual(first.items[0].choices, pool[0].choices);
  assert.deepEqual(pool[0].choices, ['A', 'B', 'C']);
  assert.ok(first.items.every((item) => item.choices.includes(item.answer)));
});

test('different student starts can draw different subsets from the same bank', () => {
  const assessment = {
    items: Array.from({ length: 100 }, (_, index) => ({ id: `st-${index}`, choices: ['A', 'B'] })),
    itemsPerAttempt: 20,
  };
  const first = selectAssessmentItems('student-one', assessment, () => 0);
  const second = selectAssessmentItems('student-two', assessment, () => 0.99);
  assert.equal(first.items.length, 20);
  assert.equal(second.items.length, 20);
  assert.notDeepEqual(first.items.map((item) => item.id), second.items.map((item) => item.id));
});
