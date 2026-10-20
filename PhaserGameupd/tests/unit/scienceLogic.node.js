import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialScienceState, scienceAction, scienceOutcome, separate, checkSchedule, magneticItems, impactRecovery } from '../../src/games/science/scienceLogic.js';
import { SERVICE_ROUNDS } from '../../src/config/scienceQuarterGames.js';

const step = (s, type, value) => scienceAction(s, { type, value });

test('magnetic rescue leaves wood, stone and copper behind and recovers each nail only once', () => {
  for (let round = 0; round < 3; round++) {
    let s = initialScienceState('magnet', round);
    for (const item of magneticItems(round).filter(item => item.type !== 'iron')) s = step(s, 'sweep', item);
    assert.deepEqual(s.held, []);
    assert.equal(scienceOutcome(s).success, false);
    for (const item of magneticItems(round).filter(item => item.type === 'iron')) s = step(s, 'sweep', item);
    assert.deepEqual(s.held.slice().sort(), [0, 3, 6]);
    assert.equal(scienceOutcome(s).success, false, 'Release is required before checking.');
    s = step(s, 'release');
    for (const item of magneticItems(round)) s = step(s, 'sweep', item);
    s = step(s, 'release');
    assert.deepEqual(s.recovered.slice().sort(), [0, 3, 6]);
    assert.equal(scienceOutcome(s).success, true);
  }
});

test('filtration retains insoluble sand but not dissolved salt; dry powder cannot be paper-filtered', () => {
  const out = separate(['sand', 'salt', 'water'], 'filter');
  assert.deepEqual(out.map(o => o.parts), [['sand'], ['salt', 'water']]);
  assert.equal(separate(['sand', 'salt'], 'filter'), null);
  assert.equal(separate(['salt', 'water'], 'filter'), null);
});

test('recovery circuits accept both valid magnetic/filtration orders and conserve every component', () => {
  for (const order of [['magnet', 'filter'], ['filter', 'magnet']]) {
    let s = initialScienceState('circuit');
    for (const method of order) s = step(s, 'tool', method);
    assert.equal(scienceOutcome(s).success, true);
    assert.deepEqual(s.streams.flatMap(v => v.parts).sort(), ['iron', 'sand', 'water']);
  }
});

test('recovery circuits preview tool choices, require application, and preserve every output', () => {
  for (const [round, order] of [[0, ['filter', 'magnet']], [1, ['sieve', 'filter']], [2, ['filter', 'evaporate']]]) {
    let s = initialScienceState('circuit', round);
    for (const tool of order) {
      const before = structuredClone(s.streams);
      s = step(s, 'choose-tool', tool);
      assert.deepEqual(s.streams, before, 'Choosing a tool must not process materials.');
      s = step(s, 'apply');
      assert.equal(s.pendingTool, null);
      assert.ok(s.steps.at(-1).sourceId, 'Record the parent stream for the connected diagram.');
    }
    assert.equal(scienceOutcome(s).success, true);
    assert.equal(s.streams.flatMap(v => v.parts).length, 3);
    if (round === 2) assert.deepEqual(s.streams.flatMap(v => v.parts).sort(), ['salt', 'sand', 'vapor']);
  }
  let s = initialScienceState('circuit');
  s = step(s, 'apply'); assert.equal(s.steps.length, 0);
  s = step(s, 'choose-tool', 'decant'); s = step(s, 'apply');
  assert.equal(s.steps.length, 0);
  assert.deepEqual(s.streams[0].parts, ['iron', 'sand', 'water']);
  s = step(s, 'choose-tool', 'magnet'); s = step(s, 'stream', 'input');
  assert.equal(s.pendingTool, null, 'A newly selected stream needs a fresh tool choice.');
});

test('evaporation separates water vapor from the recovered salt without claiming collected liquid water', () => {
  assert.deepEqual(separate(['salt', 'water'], 'evaporate').map(o => o.parts), [['salt'], ['vapor']]);
  let s = initialScienceState('evaporate');
  s = step(s, 'output', 'salt');
  for (let i = 0; i < 4; i++) s = step(s, 'advance');
  assert.equal(scienceOutcome(s).success, false, 'Missing observations must not pass.');
});

test('evaporation journal requires start, middle and end snapshots and rejects water recovery', () => {
  let s = initialScienceState('evaporate');
  s = step(s, 'record'); s = step(s, 'record');
  assert.deepEqual(s.journal, [0]);
  for (let i = 0; i < 7; i++) s = step(s, 'advance');
  assert.equal(s.time, 4);
  s = step(s, 'record'); s = step(s, 'output', 'salt');
  assert.equal(scienceOutcome(s).success, false);
  assert.match(scienceOutcome(s).message, /middle/);
  s.journal = [1, 4];
  assert.equal(scienceOutcome(s).success, false);
  assert.match(scienceOutcome(s).message, /Start/);
  s.journal = [0, 1];
  assert.equal(scienceOutcome(s).success, false);
  assert.match(scienceOutcome(s).message, /end/);
  s.journal = [0, 1, 4]; s = step(s, 'output', 'water');
  assert.equal(scienceOutcome(s).success, false);
  s = step(s, 'output', 'salt');
  assert.equal(scienceOutcome(s).success, true);
});

test('decantation fails with unsettled sediment or an excessive tilt and passes a partial gentle pour', () => {
  for (const [settling, angle, pass] of [[0, 20, false], [2, 40, false], [2, 20, true]]) {
    let s = initialScienceState('decant');
    for (let i = 0; i < settling; i++) s = step(s, 'settle');
    s = step(s, 'angle', angle);
    for (let i = 0; i < 3; i++) s = step(s, 'pour');
    assert.equal(scienceOutcome(s).success, pass);
    assert.equal(s.remaining + s.collected, 100);
  }
});

test('decantation conserves liquid, clamps tilt and cannot repair a contaminated receiver by settling', () => {
  let s = initialScienceState('decant');
  s = step(s, 'angle', -10); assert.equal(s.angle, 0);
  s = step(s, 'pour'); assert.equal(s.collected, 0);
  s = step(s, 'angle', 70); assert.equal(s.angle, 50);
  s = step(s, 'pour'); assert.equal(s.sediment, 1);
  s = step(s, 'settle'); assert.equal(s.settled, 0);
  for (let i = 0; i < 6; i++) s = step(s, 'pour');
  assert.equal(s.collected, 100); assert.equal(s.remaining, 0);
  assert.equal(scienceOutcome(s).success, false);
  for (const pours of [3, 4, 5]) {
    s = initialScienceState('decant');
    for (let i = 0; i < 5; i++) s = step(s, 'settle');
    assert.equal(s.settled, 3);
    s = step(s, 'angle', 20);
    for (let i = 0; i < pours; i++) s = step(s, 'pour');
    assert.equal(s.remaining + s.collected, 100);
    assert.equal(scienceOutcome(s).success, pours <= 4);
  }
});

test('a sieve must pass small grains and retain stones, not simply run successfully', () => {
  let s = step(initialScienceState('sieve'), 'run');
  assert.equal(scienceOutcome(s).success, false);
  s = step(s, 'opening', -5); s = step(s, 'run');
  assert.equal(scienceOutcome(s).success, true);
});

test('sieve openings respect particle-size boundaries and invalidate old batch observations', () => {
  for (let round = 0; round < 3; round++) {
    const small = 2 + round, large = 6 + round;
    for (const [opening, sandPasses, stonesPass] of [[small, false, false], [small + 1, true, false], [large, true, false], [large + 1, true, true]]) {
      let s = initialScienceState('sieve', round);
      s = step(s, 'opening', opening - s.opening);
      s = step(s, 'run');
      assert.deepEqual(s.run, { sandPasses, stonesPass });
      assert.equal(scienceOutcome(s).success, sandPasses && !stonesPass);
      s = step(s, 'opening', -1);
      assert.equal(s.run, null, 'Changing the opening clears the old outputs.');
    }
  }
});

test('community scheduling rejects an unsuitable method and late jobs', () => {
  let s = initialScienceState('schedule');
  s.bookings = { 0: { tool: 'magnet', start: 0 }, 1: { tool: 'sieve', start: 0 }, 2: { tool: 'evaporate', start: 0 } };
  assert.equal(checkSchedule(s).success, true);
  s.bookings[2].start = 4; assert.equal(checkSchedule(s).success, false);
  s.bookings[2] = { tool: 'filter', start: 0 }; assert.equal(checkSchedule(s).success, false);
});

test('village impact limits installations to two suitable services and requires previewing maximal recovery', () => {
  for (let round = 0; round < 3; round++) {
    let s = initialScienceState('impact', round);
    for (let i = 0; i < 2; i++) {
      s = step(s, 'tool', SERVICE_ROUNDS[round][i].tool); s = step(s, 'install', i);
    }
    assert.equal(scienceOutcome(s).success, false, 'Installation needs a preview.');
    s = step(s, 'run');
    assert.equal(impactRecovery(s), [14, 14, 13][round]);
    assert.equal(scienceOutcome(s).success, true);
    s = step(s, 'install', 2);
    assert.equal(Object.keys(s.installations).length, 2, 'A third service cannot exceed the budget.');
    assert.equal(s.run, false, 'The attempted edit clears the preview.');
    s = step(s, 'install', 0);
    assert.equal(Object.keys(s.installations).length, 1);
    s = step(s, 'run');
    assert.equal(scienceOutcome(s).success, false);
  }
  let s = initialScienceState('impact');
  s = step(s, 'tool', 'sieve'); s = step(s, 'install', 0);
  s = step(s, 'tool', 'magnet'); s = step(s, 'install', 2); s = step(s, 'run');
  assert.equal(impactRecovery(s), 0, 'An unsuitable service recovers no useful output.');
  assert.equal(scienceOutcome(s).success, false);
});

test('controlled tests reject changing two variables at once and require an observed successful test', () => {
  let s = initialScienceState('diagnose', 2);
  s = step(s, 'settled', 2); s = step(s, 'angle', -20); s = step(s, 'test');
  assert.equal(s.tests.length, 1); assert.equal(scienceOutcome(s).success, false);
  s = initialScienceState('diagnose', 2);
  s = step(s, 'settled', 2); s = step(s, 'test');
  assert.equal(s.tests.at(-1).success, false);
  s = step(s, 'angle', -20); s = step(s, 'test');
  assert.equal(scienceOutcome(s).success, true);
});

test('field reports require an ordered visual account and an authored explanation', () => {
  let s = initialScienceState('report'); s.panels = [0, 1, 2];
  assert.equal(scienceOutcome(s).success, false);
  s = step(s, 'caption', 'Sieving separates stones so the building yard can reuse sand.');
  assert.equal(scienceOutcome(s).success, true);
  s.panels = [1, 0, 2]; assert.equal(scienceOutcome(s).success, false);
});

test('diagnostic settings and outputs remain tied to recorded trials while pending changes can be undone', () => {
  let s = initialScienceState('diagnose');
  assert.equal(s.tests[0].opening, 9);
  s = step(s, 'opening', -5); s = step(s, 'test');
  assert.equal(s.tests.at(-1).opening, 4);
  const records = structuredClone(s.tests);
  s = step(s, 'opening', 1);
  assert.deepEqual(s.tests, records);
  assert.equal(scienceOutcome(s).success, false);
  s = step(s, 'opening', -1);
  assert.deepEqual(s.changes, []);
  assert.equal(scienceOutcome(s).success, true, 'Reinstating already-tested settings keeps their evidence.');
  s = initialScienceState('diagnose', 2);
  s = step(s, 'settled', 2); s = step(s, 'angle', -10); s = step(s, 'angle', 10);
  assert.deepEqual(s.changes, ['settled']);
  s = step(s, 'test'); assert.equal(s.tests.length, 2);
  s = step(s, 'angle', -20); s = step(s, 'test');
  assert.equal(scienceOutcome(s).success, true);
  s = initialScienceState('diagnose'); s = step(s, 'opening', -100);
  assert.equal(s.opening, 1);
  s = step(s, 'opening', 100); assert.equal(s.opening, 10);
});

test('field reports preserve student writing within the reference limit and require complete ordered pictures', () => {
  let s = initialScienceState('report');
  s = step(s, 'caption', 'x'.repeat(200));
  assert.equal(s.caption.length, 180);
  assert.equal(scienceOutcome(s).success, false);
  for (let i = 0; i < 3; i++) { s = step(s, 'panel', i); s = step(s, 'photo', i); }
  const caption = 'Sieving recovers sand that the building yard can reuse.';
  s = step(s, 'caption', caption);
  s = step(s, 'panel', 0); s = step(s, 'photo', 4);
  assert.equal(s.caption, caption);
  assert.equal(scienceOutcome(s).success, false);
  s = step(s, 'photo', 0);
  assert.equal(scienceOutcome(s).success, true);
  s = step(s, 'caption', ' '.repeat(30));
  assert.equal(scienceOutcome(s).success, false, 'Blank writing is incomplete.');
});
