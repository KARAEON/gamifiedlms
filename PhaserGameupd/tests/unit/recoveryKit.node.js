import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialScienceState, scienceAction, scienceOutcome, separate } from '../../src/games/science/scienceLogic.js';
import { KIT_CASES, KIT_TOOLS, runKitTrial } from '../../src/games/science/recoveryKitLogic.js';
import { getScienceGame } from '../../src/config/scienceQuarterGames.js';
const step = (s, type, value) => scienceAction(s, { type, value });

test('the smallest suitable kit must actually be trialed before its products count', () => {
  for (const [round, kit] of [[0, ['magnet']], [1, ['sieve']], [2, ['filter', 'evaporate']]]) {
    let s = initialScienceState('kit', round);
    for (const tool of kit) s = step(s, 'module', tool);
    assert.equal(scienceOutcome(s).success, false);
    s = step(s, 'trial'); assert.equal(scienceOutcome(s).success, true);
    assert.deepEqual(s.trial.recovered, KIT_CASES[round].goals);
  }
  assert.equal(getScienceGame('q1-m4-l2').competency, 'S6MT-Id-f-2');
});

test('all one- and two-module trials conserve components and only supported minimal plans pass', () => {
  const plans = KIT_TOOLS.flatMap(a => [[a], ...KIT_TOOLS.filter(b => b !== a).map(b => [a, b])]);
  const valid = [['magnet'], ['sieve'], ['filter', 'evaporate']];
  for (const [round, c] of KIT_CASES.entries()) for (const kit of plans) {
    const trial = runKitTrial(round, kit, separate);
    assert.deepEqual(trial.streams.flatMap(s => s.parts).map(p => p === 'vapor' ? 'water' : p).sort(), [...c.input].sort());
    const s = { ...initialScienceState('kit', round), kit, trial };
    assert.equal(scienceOutcome(s).success, kit.join() === valid[round].join(), `Round ${round}, ${kit}`);
  }
});

test('changing modules invalidates trial evidence; capacity, removal and reordering work', () => {
  let s = initialScienceState('kit', 2);
  s = step(s, 'module', 'evaporate'); s = step(s, 'module', 'filter');
  const before = structuredClone(s);
  s = step(s, 'module', 'magnet'); assert.deepEqual(s.kit, before.kit);
  assert.match(s.message, /full/);
  s = step(s, 'trial'); assert.equal(scienceOutcome(s).success, false);
  assert.deepEqual(s.trial.streams.find(out => out.parts.includes('salt')).parts, ['sand', 'salt']);
  s = step(s, 'swap'); assert.deepEqual(s.kit, ['filter', 'evaporate']);
  assert.equal(s.trial, null); assert.equal(scienceOutcome(s).success, false);
  s = step(s, 'trial'); assert.equal(scienceOutcome(s).success, true);
  assert.equal(s.trials.length, 2);
  s = step(s, 'module', 'filter'); assert.deepEqual(s.kit, ['evaporate']); assert.equal(s.trial, null);
  s = step(s, 'module', 'not-a-tool'); assert.deepEqual(s.kit, ['evaporate']);
  assert.deepEqual(before.kit, ['evaporate', 'filter']);
});

test('unnecessary modules fail even if a requested product was recovered', () => {
  let s = initialScienceState('kit');
  s = step(s, 'module', 'magnet'); s = step(s, 'module', 'sieve'); s = step(s, 'trial');
  assert.deepEqual(s.trial.recovered, ['iron']); assert.equal(scienceOutcome(s).success, false);
  assert.match(scienceOutcome(s).message, /unnecessary/);
});
