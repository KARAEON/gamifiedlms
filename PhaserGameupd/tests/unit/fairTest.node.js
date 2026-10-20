import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialScienceState, scienceAction, scienceOutcome } from '../../src/games/science/scienceLogic.js';
import { FAIR_CASES, FAIR_SIDES, runFairTrial } from '../../src/games/science/fairTestLogic.js';
import { getScienceGame } from '../../src/config/scienceQuarterGames.js';
const act = (s, type, value) => scienceAction(s, { type, value });
const ready = round => {
  let s = act(initialScienceState('fair', round), 'prepare');
  for (const side of FAIR_SIDES) s = act(s, 'run', side);
  return s;
};
const answer = (s, selected, evidence) => act(act(s, 'choose', selected), 'evidence', evidence);

test('equal portions conserve the original supply and each trial accounts for all components', () => {
  for (const [round, c] of FAIR_CASES.entries()) {
    const s = ready(round);
    assert.deepEqual(s.portions.A, s.portions.B);
    for (const [part, total] of Object.entries(c.amounts)) assert.equal(s.portions.A[part] + s.portions.B[part], total);
    for (const side of FAIR_SIDES) {
      const t = s.trials[side], sums = {};
      for (const out of t.outputs) for (const [part, amount] of Object.entries(out.amounts)) {
        assert.ok(amount >= 0);
        const key = part === 'vapor' ? 'water' : part;
        sums[key] = (sums[key] ?? 0) + amount;
      }
      assert.deepEqual(sums, t.input);
    }
  }
  assert.equal(getScienceGame('q1-m4-l4').kind, 'fair');
  assert.equal(getScienceGame('q1-m4-l4').competency, 'S6MT-Id-f-2');
  assert.equal(getScienceGame('q1-m4-l5').kind, 'revival');
});

test('preparation, both observations, a method choice and relevant evidence are required', () => {
  let s = initialScienceState('fair');
  const initial = structuredClone(s);
  s = act(s, 'run', 'A'); assert.deepEqual(s.trials, {}); assert.match(s.message, /equally/);
  s = act(s, 'choose', 'B'); assert.equal(s.selected, null);
  s = act(s, 'evidence', 'sand-retained'); assert.equal(s.evidence, null);
  assert.equal(scienceOutcome(s).success, false);
  s = act(act(s, 'prepare'), 'run', 'B'); assert.equal(scienceOutcome(s).success, false);
  s = act(s, 'run', 'A'); assert.equal(scienceOutcome(s).success, false);
  s = act(s, 'choose', 'B'); assert.equal(scienceOutcome(s).success, false);
  s = act(s, 'evidence', 'sand-retained'); assert.equal(scienceOutcome(s).success, true);
  assert.deepEqual(initial, initialScienceState('fair'));
});

test('completion follows the observed goal and rejects every wrong choice or explanation', () => {
  const expected = [['B', 'sand-retained'], ['A', 'mesh-retained'], ['B', 'salt-remained']];
  for (const [round, c] of FAIR_CASES.entries()) for (const side of FAIR_SIDES) for (const evidence of c.evidence) {
    const s = answer(ready(round), side, evidence.id);
    assert.equal(scienceOutcome(s).success, side === expected[round][0] && evidence.id === expected[round][1], `${round}, ${side}, ${evidence.id}`);
  }
});

test('same-volume liquid trials record carryover; salt filtration does not create dry salt', () => {
  const liquid = ready(0), salt = ready(2);
  assert.equal(liquid.trials.A.outputs[0].amounts.water, liquid.trials.B.outputs[0].amounts.water);
  assert.ok(liquid.trials.A.outputs[0].amounts.sand > 0);
  assert.equal(liquid.trials.B.outputs[0].amounts.sand, undefined);
  assert.deepEqual(salt.trials.A.outputs[0].amounts, salt.portions.A);
  assert.deepEqual(salt.trials.A.outputs[1].amounts, {});
  assert.deepEqual(salt.trials.B.outputs[1].amounts, { vapor: salt.portions.B.water });
});

test('equal best recorded results allow either trial; unequal inputs invalidate the comparison', () => {
  const s = ready(0);
  s.trials.A = { ...structuredClone(s.trials.B), side: 'A' };
  for (const side of FAIR_SIDES) assert.equal(scienceOutcome(answer(s, side, 'sand-retained')).success, true);
  s.trials.A.input.sand += 1;
  assert.equal(scienceOutcome(answer(s, 'B', 'sand-retained')).success, false);
  assert.match(scienceOutcome(answer(s, 'B', 'sand-retained')).message, /equal amounts/);
});

test('running again invalidates the old decision, preserves comparable inputs and rejects unknown actions', () => {
  const s = answer(ready(0), 'B', 'sand-retained');
  const rerun = act(s, 'run', 'B');
  assert.equal(rerun.selected, null); assert.equal(rerun.evidence, null);
  assert.equal(scienceOutcome(rerun).success, false);
  assert.deepEqual(rerun.trials, s.trials);
  assert.equal(act(s, 'choose', 'C').selected, 'B');
  assert.equal(act(s, 'evidence', 'invented').evidence, 'sand-retained');
  assert.deepEqual(act(s, 'run', 'C').trials, s.trials);
  assert.equal(runFairTrial(0, 'C', {}), null);
});
