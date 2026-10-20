import test from 'node:test';
import assert from 'node:assert/strict';
import { initialScienceState, scienceAction, scienceOutcome } from '../../src/games/science/scienceLogic.js';
import { REVIVAL_CASES, readyToRepair } from '../../src/games/science/workshopRevivalLogic.js';
import { getScienceGame, REPORT_CAPTION_LIMIT } from '../../src/config/scienceQuarterGames.js';
import { vulcanQuarterDetails } from '../../src/config/content.js';

const act = (s, type, value) => scienceAction(s, { type, value });
function conserved(s) {
  const inventory = [...s.streams, ...s.applied].flatMap(stream => stream.parts).map(p => p === 'vapor' ? 'water' : p).sort();
  assert.deepEqual(inventory, [...REVIVAL_CASES[s.round].input].sort());
}
function operate(s, tool, parts) {
  if (parts) s = act(s, 'stream', s.streams.find(stream => stream.parts.join(',') === parts.join(','))?.id);
  const result = act(act(s, 'tool', tool), 'operate'); conserved(result); return result;
}
function recover(round, tools) {
  let s = act(initialScienceState('revival', round), 'observe');
  for (const [tool, parts] of tools) s = operate(s, tool, parts);
  return s;
}

test('final Q1 capstone launches; other quarters keep the five extra lessons empty', () => {
  const game = getScienceGame('q1-m4-l5');
  assert.equal(game.kind, 'revival'); assert.equal(game.day, 20);
  assert.equal(game.competencies.length, 3);
  for (const q of Object.values(vulcanQuarterDetails).slice(1)) {
    const lessons = q.majors.at(-1).lessons;
    assert.equal(lessons.length, 5);
    assert.ok(lessons.every(l => l.placeholder));
  }
});

test('observation and actual separated products gate repairs; applying never duplicates material', () => {
  let s = initialScienceState('revival');
  for (const type of ['operate', 'apply']) { s = act(s, type); conserved(s); assert.equal(s.repairs[0], false); }
  s = act(s, 'tool', 'magnet'); assert.equal(s.tool, null);
  s = act(s, 'observe'); assert.match(s.observation, /non-uniform/);
  for (const tool of ['sieve', 'filter', 'evaporate', 'decant']) { s = operate(s, tool); assert.equal(s.steps.length, 0); }
  s = operate(s, 'magnet'); assert.equal(readyToRepair(s), true);
  s = act(s, 'apply'); conserved(s); assert.deepEqual(s.applied[0].parts, ['iron']);
  assert.deepEqual(s.repairs, [true, false, false]);
  assert.equal(readyToRepair(s), false);
  const used = structuredClone(s.applied); s = act(s, 'apply');
  assert.deepEqual(s.applied, used); conserved(s);
  assert.equal(scienceOutcome(s).success, false);
  s = act(s, 'caption', 'Recovered iron secures the workbench brackets.');
  assert.equal(scienceOutcome(s).success, true);
});

test('courtyard accepts sieve/filter in either order and retains every unused output', () => {
  for (const tools of [[['sieve'], ['filter']], [['filter'], ['sieve', ['stones', 'sand']]]]) {
    let s = recover(1, tools); assert.equal(readyToRepair(s), true);
    assert.equal(s.streams.find(out => out.parts.join(',') === 'sand').damp, true);
    s.repairs[0] = true; s = act(s, 'apply'); conserved(s);
    assert.deepEqual(s.repairs, [true, true, false]); assert.deepEqual(s.applied[0].parts, ['sand']);
    assert.deepEqual(s.streams.flatMap(out => out.parts).sort(), ['stones', 'water']);
  }
});

test('storage requires both pure products; salt passes paper and water becomes vapor', () => {
  let s = act(initialScienceState('revival', 2), 'observe');
  assert.match(s.observation, /dissolved salt/);
  s = operate(s, 'filter'); assert.equal(readyToRepair(s), false);
  assert.deepEqual(s.streams.find(out => out.label === 'FILTRATE').parts, ['salt', 'water']);
  const before = structuredClone(s.streams); s = operate(s, 'filter'); assert.deepEqual(s.streams, before);
  assert.match(s.message, /Dissolved salt passes/);
  s = operate(s, 'evaporate'); assert.equal(readyToRepair(s), true);
  s.repairs = [true, true, false]; s = act(s, 'apply'); conserved(s);
  assert.deepEqual(s.repairs, [true, true, true]);
  assert.deepEqual(s.applied.flatMap(out => out.parts).sort(), ['salt', 'sand']);
  assert.deepEqual(s.streams[0].parts, ['vapor']);
});

test('premature evaporation cannot invent separated sand and salt; caption completeness is not semantic grading', () => {
  let s = recover(2, [['evaporate']]);
  assert.match(s.message, /Reset/); assert.equal(readyToRepair(s), false);
  s = act(s, 'apply'); conserved(s); assert.equal(s.repairs[2], false);
  s = recover(0, [['magnet']]); s = act(s, 'apply');
  s = act(s, 'caption', ' '.repeat(100)); assert.equal(scienceOutcome(s).success, false);
  s = act(s, 'caption', 'x'.repeat(REPORT_CAPTION_LIMIT + 100));
  assert.equal(s.caption.length, REPORT_CAPTION_LIMIT);
  assert.equal(scienceOutcome(s).success, true); assert.match(scienceOutcome(s).message, /teacher review/);
});
