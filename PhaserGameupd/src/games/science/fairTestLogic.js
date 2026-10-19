export const FAIR_CASES = [
  { mission: 'Which trial recovers liquid with less sand?', parts: ['sand', 'water'], amounts: { sand: 20, water: 100 }, goal: 'clean-liquid',
    controls: ['Same amounts of sand and water, divided equally.', 'Same settling time and collected liquid amount.'],
    trials: [{ tool: 'decant', label: 'DECANTATION' }, { tool: 'filter', label: 'FILTRATION' }],
    evidence: [
      { id: 'sand-retained', text: 'The filter retained the insoluble sand.' },
      { id: 'decant-no-sand', text: 'No sand entered the decanted liquid.' },
      { id: 'clear-safe', text: 'Clear-looking liquid is safe to drink.' },
    ] },
  { mission: 'Which opening collects sand without carrying stones?', parts: ['sand', 'stones'], amounts: { sand: 20, stones: 6 }, goal: 'clean-sand',
    controls: ['Same sand and stones in each starting portion.', 'Same particle sizes. Only the opening changes.'],
    trials: [{ tool: 'sieve', opening: 3, label: 'OPENING 3' }, { tool: 'sieve', opening: 9, label: 'OPENING 9' }],
    evidence: [
      { id: 'both-pass', text: 'Both sand and stones passed opening 9.' },
      { id: 'mesh-retained', text: 'Opening 3 passed sand and retained stones.' },
      { id: 'larger-particles', text: 'Trial B started with larger stones.' },
    ] },
  { mission: 'Which method recovers dry salt from saltwater?', parts: ['salt', 'water'], amounts: { salt: 20, water: 100 }, goal: 'dry-salt',
    controls: ['Same amount of saltwater in each portion.', 'Same salt concentration. Only the method changes.'],
    trials: [{ tool: 'filter', label: 'FILTRATION' }, { tool: 'evaporate', label: 'EVAPORATION' }],
    evidence: [
      { id: 'paper-retained-salt', text: 'Filter paper retained the dissolved salt.' },
      { id: 'vapor-collected', text: 'Evaporation collected liquid water.' },
      { id: 'salt-remained', text: 'Salt remained in the dish as water evaporated.' },
    ] },
];
export const FAIR_SIDES = ['A', 'B'];
const evidenceFeedback = {
  'clear-safe': 'Appearance does not show drinking safety. Choose evidence about the recovered sand.',
  'decant-no-sand': 'Some sand entered the decanted liquid in this trial. Compare the recorded carryover.',
  'larger-particles': 'Both portions started with the same particle sizes. Compare what passed the mesh.',
  'both-pass': 'Both materials passed opening 9. Choose evidence for the opening that retained stones.',
  'paper-retained-salt': 'Dissolved salt passed through paper with the water. Choose evidence of dry salt recovery.',
  'vapor-collected': 'Water left as vapor; it was not collected liquid. Choose evidence of dry salt recovery.',
};
export function initialFairState(base) {
  return { ...base, prepared: false, source: { ...FAIR_CASES[base.round].amounts }, portions: null, trials: {}, selected: null, evidence: null, evidenceOpen: false, answers: [] };
}

// Illustrative component units, not measured laboratory yields. Each output has a full inventory.
export function runFairTrial(round, side, input) {
  const c = FAIR_CASES[round], method = c.trials[FAIR_SIDES.indexOf(side)];
  if (!method) return null;
  let outputs, facts = [], observation;
  const out = (label, amounts) => ({ label, amounts });
  if (method.tool === 'decant') {
    outputs = [out('COLLECTED LIQUID', { water: input.water * 0.8, sand: input.sand * 0.05 }), out('LEFT IN SOURCE', { water: input.water * 0.2, sand: input.sand * 0.95 })];
    observation = 'Some sand\ncarried over';
  } else if (method.tool === 'sieve') {
    const sandPasses = method.opening > 2, stonesPass = method.opening > 6;
    outputs = [out('PASSED THROUGH', { ...(sandPasses ? { sand: input.sand } : {}), ...(stonesPass ? { stones: input.stones } : {}) }),
      out('ON THE MESH', { ...(!sandPasses ? { sand: input.sand } : {}), ...(!stonesPass ? { stones: input.stones } : {}) })];
    facts = sandPasses && !stonesPass ? ['mesh-retained'] : sandPasses && stonesPass ? ['both-pass'] : [];
    observation = stonesPass ? 'Stones also\npassed through' : 'Stones stayed\non the mesh';
  } else if (method.tool === 'filter') {
    const wetSand = Boolean(input.sand);
    outputs = wetSand ? [out('FILTRATE', { water: input.water * 0.8 }), out('DAMP FILTER RESIDUE', { sand: input.sand, water: input.water * 0.2 })]
      : [out('FILTRATE', { ...input }), out('ON THE PAPER', {})];
    facts = wetSand ? ['sand-retained'] : [];
    observation = wetSand ? 'No visible sand\nin this trial' : 'Salt is still\ndissolved';
  } else {
    outputs = [out('SOLID IN DISH', { salt: input.salt }), out('WATER VAPOR (NOT COLLECTED)', { vapor: input.water })];
    facts = ['salt-remained']; observation = 'Water left\nas vapor';
  }
  return { side, ...method, input: { ...input }, outputs, facts, observation };
}

export function fairAction(state, action) {
  const s = structuredClone(state), c = FAIR_CASES[s.round];
  s.message = '';
  if (action.type === 'prepare') {
    const portion = Object.fromEntries(Object.entries(s.source).map(([part, amount]) => [part, amount / 2]));
    s.portions = { A: { ...portion }, B: { ...portion } };
    s.prepared = true; s.message = 'Equal portions ready. Run Trial A and Trial B before choosing.';
  }
  if (action.type === 'run' && FAIR_SIDES.includes(action.value)) {
    if (!s.prepared) { s.message = 'Split the sample equally before running either trial.'; return s; }
    s.trials[action.value] = runFairTrial(s.round, action.value, s.portions[action.value]);
    s.selected = null; s.evidence = null; s.evidenceOpen = false;
    s.message = FAIR_SIDES.every(side => s.trials[side]) ? 'Both trials are recorded. Choose the best method for this goal and its evidence.' : `Trial ${action.value} recorded. Run the other trial to compare its output.`;
  }
  if (action.type === 'choose' && FAIR_SIDES.includes(action.value)) {
    if (!FAIR_SIDES.every(side => s.trials[side])) { s.message = 'Run both trials before making a comparison.'; return s; }
    s.selected = action.value; s.evidenceOpen = false;
  }
  if (['evidence-menu', 'evidence'].includes(action.type) && !FAIR_SIDES.every(side => s.trials[side])) { s.message = 'Run both trials before selecting comparison evidence.'; return s; }
  if (action.type === 'evidence-menu') s.evidenceOpen = Boolean(action.value);
  if (action.type === 'evidence' && c.evidence.some(e => e.id === action.value)) { s.evidence = action.value; s.evidenceOpen = false; }
  return s;
}

// Rank the recorded product, not a fixed A/B answer. Equal best results accept either trial.
export function fairRank(goal, trial) {
  const output = trial.outputs[0].amounts;
  if (goal === 'clean-liquid') return output.water > 0 ? -(output.sand ?? 0) / output.water : -Infinity;
  if (goal === 'clean-sand') return output.sand > 0 ? -(output.stones ?? 0) / output.sand : -Infinity;
  return output.salt > 0 && !(output.water > 0) ? output.salt : 0;
}
export function fairOutcome(s) {
  const c = FAIR_CASES[s.round];
  if (!s.prepared || !FAIR_SIDES.every(side => s.trials[side])) return { success: false, message: 'Prepare equal portions and run both trials before checking.' };
  if (FAIR_SIDES.some(side => Object.keys(c.amounts).some(p => s.trials[side].input[p] !== s.source[p] / 2))) return { success: false, message: 'Starting samples must contain equal amounts for a fair comparison.' };
  if (!FAIR_SIDES.includes(s.selected)) return { success: false, message: 'Choose Trial A or Trial B using the recorded outputs.' };
  const rank = fairRank(c.goal, s.trials[s.selected]);
  if (rank < Math.max(...FAIR_SIDES.map(side => fairRank(c.goal, s.trials[side])))) return { success: false, message: 'That trial does not best meet this goal. Compare what passed through or remained.' };
  if (!s.trials[s.selected].facts.includes(s.evidence)) return { success: false, message: evidenceFeedback[s.evidence] ?? 'Choose evidence that supports your selected trial and this recovery goal.' };
  return { success: true, message: 'Fair comparison complete. Your chosen method is supported by the recorded outputs.' };
}
