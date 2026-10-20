import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialScienceState, scienceAction, scienceOutcome } from '../../src/games/science/scienceLogic.js';
import { MYSTERY_CASES } from '../../src/games/science/mysterySampleLogic.js';
import { scienceQuarterGames } from '../../src/config/scienceQuarterGames.js';
import { vulcanQuarterDetails } from '../../src/config/content.js';
const step = (s, type, value) => scienceAction(s, { type, value });

test('supported conclusions require actual inspection and the relevant behavior test', () => {
  for (const [round, c] of MYSTERY_CASES.entries()) {
    let s = initialScienceState('mystery', round);
    s = step(s, 'components', c.components); s = step(s, 'classification', c.classification);
    assert.equal(scienceOutcome(s).success, false);
    s = step(s, 'inspect'); assert.equal(scienceOutcome(s).success, false);
    s = step(s, c.test); assert.equal(scienceOutcome(s).success, true);
    s = step(s, 'classification', c.classification === 'Uniform' ? 'Non-uniform' : 'Uniform');
    assert.equal(scienceOutcome(s).success, false);
    s = step(s, 'classification', c.classification);
    s = step(s, 'components', round === 0 ? 'Sand + water' : 'Salt + water');
    assert.equal(scienceOutcome(s).success, false);
  }
});

test('stirring reverses the visible test but preserves observations without duplicates', () => {
  for (const [round, c] of MYSTERY_CASES.entries()) {
    let s = initialScienceState('mystery', round);
    const original = structuredClone(s);
    s = step(s, 'inspect'); s = step(s, c.test); s = step(s, c.test); s = step(s, 'inspect');
    assert.deepEqual(s.evidence, ['inspect', c.test]);
    assert.equal(s.settled, round < 2); assert.equal(s.magnetic, round === 2);
    s = step(s, 'stir');
    assert.equal(s.settled, false); assert.equal(s.magnetic, false);
    assert.deepEqual(s.evidence, ['inspect', c.test]);
    assert.deepEqual(original, initialScienceState('mystery', round));
    assert.deepEqual(initialScienceState('mystery', round).evidence, []);
  }
});

test('implemented capstones occupy their slots; remaining extra-week lessons stay blank', () => {
  const game = scienceQuarterGames.find(g => g.day === 16);
  assert.equal(game.lessonId, 'q1-m4-l1'); assert.equal(game.competency, 'S6MT-Ia-c-1');
  for (const [id, quarter] of Object.entries(vulcanQuarterDetails)) {
    const lessons = quarter.majors[3].lessons;
    assert.equal(lessons.length, 5);
    for (const [i, lesson] of lessons.entries()) {
      const implemented = id === 'q1' && scienceQuarterGames.find(g => g.lessonId === lesson.id);
      if (implemented) { assert.equal(lesson.title, implemented.title); assert.equal(lesson.placeholder, false); }
      else { assert.equal(lesson.title, ''); assert.equal(lesson.placeholder, true); }
    }
  }
});
