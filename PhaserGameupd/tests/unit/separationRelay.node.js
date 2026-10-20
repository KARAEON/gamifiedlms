import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialScienceState, scienceAction, scienceOutcome } from '../../src/games/science/scienceLogic.js';
import { RELAY_CASES } from '../../src/games/science/separationRelayLogic.js';
import { getScienceGame } from '../../src/config/scienceQuarterGames.js';
const act = (s, type, value) => scienceAction(s, { type, value });
const operate = (s, tool) => act(act(s, 'tool', tool), 'operate');
function conserved(s) {
  const live = [s.active, ...s.waiting, ...s.recovered, ...s.accounted].filter(Boolean);
  assert.deepEqual(live.flatMap(out => out.parts).map(p => p === 'vapor' ? 'water' : p).sort(), [...RELAY_CASES[s.round].input].sort());
  assert.equal(new Set(live.map(out => out.id)).size, live.length);
}
function carry(s, predicate = () => true) {
  const output = s.waiting.find(predicate); assert.ok(output);
  return act(act(s, 'output', output.id), 'carry');
}

test('the three relay challenges require carrying actual outputs and preserve all components', () => {
  const plans = [['magnet'], ['sieve', 'filter'], ['magnet', 'filter', 'evaporate']];
  for (const [round, plan] of plans.entries()) {
    let s = initialScienceState('relay', round); conserved(s);
    assert.equal(scienceOutcome(s).success, false);
    for (const [i, tool] of plan.entries()) {
      if (i) { s = carry(s); conserved(s); }
      s = operate(s, tool); conserved(s);
      assert.equal(s.active, null);
      assert.equal(scienceOutcome(s).success, i === plan.length - 1);
    }
    assert.deepEqual(s.recovered.map(out => out.parts[0]).sort(), [...RELAY_CASES[round].goals].sort());
    if (round === 2) assert.deepEqual(s.accounted[0].parts, ['vapor']);
  }
  assert.equal(getScienceGame('q1-m4-l3').kind, 'relay');
  assert.equal(getScienceGame('q1-m4-l3').competency, 'S6MT-Id-f-2');
  assert.equal(getScienceGame('q1-m4-l5').kind, 'revival');
});

test('filtering first preserves both branches and accepts either branch processing order', () => {
  for (const liquidFirst of [false, true]) {
    let s = operate(initialScienceState('relay', 2), 'filter'); conserved(s);
    assert.equal(s.waiting.length, 2); assert.equal(s.selectedOutput, null);
    assert.equal(scienceOutcome(s).success, false);
    const before = structuredClone(s);
    s = act(s, 'carry'); conserved(s); assert.deepEqual(s.waiting, before.waiting);
    s = carry(s, out => out.parts.includes(liquidFirst ? 'water' : 'iron')); conserved(s);
    s = operate(s, liquidFirst ? 'evaporate' : 'magnet'); conserved(s);
    assert.equal(scienceOutcome(s).success, false);
    s = carry(s); conserved(s);
    s = operate(s, liquidFirst ? 'magnet' : 'evaporate'); conserved(s);
    assert.equal(scienceOutcome(s).success, true);
    assert.equal(before.recovered.length, 0); // Earlier state remains immutable.
  }
  let s = operate(initialScienceState('relay', 1), 'filter');
  s = operate(carry(s), 'sieve'); conserved(s);
  assert.equal(scienceOutcome(s).success, true);
});

test('switching carried samples keeps the unprocessed sample available', () => {
  let s = operate(initialScienceState('relay', 2), 'filter');
  s = carry(s, out => out.parts.includes('iron')); conserved(s);
  const held = structuredClone(s.active);
  s = carry(s, out => out.parts.includes('water')); conserved(s);
  assert.deepEqual(s.waiting[0], held);
  s = operate(s, 'evaporate'); s = operate(carry(s), 'magnet'); conserved(s);
  assert.equal(scienceOutcome(s).success, true);
});

test('incompatible tools, missing carry actions and invalid output choices cannot create recovery', () => {
  let s = initialScienceState('relay');
  const input = structuredClone(s.active);
  s = act(s, 'operate'); assert.match(s.message, /Choose/);
  for (const tool of ['filter', 'evaporate', 'decant', 'sieve']) {
    s = operate(s, tool); conserved(s); assert.deepEqual(s.active, input); assert.equal(s.steps.length, 0);
  }
  s = operate(s, 'magnet'); const kept = structuredClone(s.recovered);
  s = act(s, 'output', s.recovered[0].id); s = act(s, 'carry'); s = operate(s, 'magnet');
  assert.deepEqual(s.recovered, kept); conserved(s);
  assert.equal(scienceOutcome(s).success, true);
});

test('premature evaporation preserves mixed solids instead of falsely recovering pure salt', () => {
  let s = operate(initialScienceState('relay', 2), 'evaporate'); conserved(s);
  assert.equal(s.recovered.length, 0);
  assert.deepEqual(s.waiting[0].parts, ['iron', 'sand', 'salt']);
  s = operate(carry(s), 'magnet'); conserved(s);
  assert.equal(scienceOutcome(s).success, false);
  assert.deepEqual(s.waiting[0].parts, ['sand', 'salt']);
  s = operate(carry(s), 'filter'); conserved(s);
  assert.match(s.message, /Reset/);
});
