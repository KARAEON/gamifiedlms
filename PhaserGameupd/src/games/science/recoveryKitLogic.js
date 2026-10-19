export const KIT_CAPACITY = 2;
export const KIT_TOOLS = ['magnet', 'sieve', 'filter', 'evaporate', 'decant'];
export const KIT_CASES = [
  { mission: 'Recover iron from iron mixed with sand.', input: ['iron', 'sand'], label: 'IRON + SAND', goals: ['iron'], minimum: 1 },
  { mission: 'Recover fine sand from sand mixed with pebbles.', input: ['sand', 'stones'], label: 'SAND + PEBBLES', goals: ['sand'], minimum: 1 },
  { mission: 'Recover sand and dry salt from sand + saltwater.', input: ['sand', 'salt', 'water'], label: 'SAND + SALTWATER', goals: ['sand', 'salt'], minimum: 2 },
];

export function initialKitState(base) {
  return { ...base, kit: [], trial: null, trials: [] };
}

export function runKitTrial(round, kit, separate) {
  const c = KIT_CASES[round];
  let streams = [{ label: 'INPUT SAMPLE', parts: [...c.input] }];
  const steps = [];
  for (const tool of kit) {
    // Apply the packed module to a remaining mixed stream. Recovered products
    // stay separate; never conjure a requested product from a tool selection.
    const index = streams.findIndex(s => s.parts.length > 1 && separate(s.parts, tool));
    if (index < 0) {
      const input = streams.find(s => s.parts.length > 1)?.parts ?? [];
      steps.push({ tool, input: [...input], outputs: [], effective: false });
      continue;
    }
    const input = [...streams[index].parts];
    const outputs = separate(input, tool);
    streams.splice(index, 1, ...outputs);
    steps.push({ tool, input, outputs: structuredClone(outputs), effective: true });
  }
  const recovered = c.goals.filter(goal => streams.some(s => s.parts.length === 1 && s.parts[0] === goal));
  return { kit: [...kit], steps, streams, recovered };
}

export function kitAction(state, action, separate) {
  const s = structuredClone(state);
  s.message = '';
  if (action.type === 'module' && KIT_TOOLS.includes(action.value)) {
    const index = s.kit.indexOf(action.value);
    if (index >= 0) s.kit.splice(index, 1);
    else if (s.kit.length < KIT_CAPACITY) s.kit.push(action.value);
    else { s.message = 'Both kit slots are full. Tap a packed module to remove it.'; return s; }
    s.trial = null;
    s.message = 'Kit changed. Run a fresh trial to inspect its outputs.';
  }
  if (action.type === 'swap' && s.kit.length === 2) {
    s.kit.reverse(); s.trial = null;
    s.message = 'Order changed. Trial the new sequence.';
  }
  if (action.type === 'trial') {
    if (!s.kit.length) { s.message = 'Pack at least one module from the equipment bench.'; return s; }
    s.trial = runKitTrial(s.round, s.kit, separate);
    s.trials.push(structuredClone(s.trial));
    s.message = kitOutcome(s).message;
  }
  return s;
}

export function kitOutcome(s) {
  const c = KIT_CASES[s.round], t = s.trial;
  if (!t) return { success: false, message: 'Trial your current kit before checking the result.' };
  if (t.recovered.length !== c.goals.length) {
    const message = s.round === 0 ? 'Sand is not magnetic. Choose a module that attracts the iron.'
      : s.round === 1 ? 'Use particle size: let fine sand pass and retain the larger pebbles.'
        : t.steps.some(step => step.tool === 'evaporate' && step.effective) ? 'Evaporating first leaves sand and salt together. Filter out sand before evaporating the filtrate.'
          : s.kit.includes('decant') ? 'Decanting leaves liquid with the sediment. Filter the sand, then recover salt from the filtrate.'
            : 'Filtration retains sand; dissolved salt passes through. Evaporate the filtrate to recover dry salt.';
    return { success: false, message };
  }
  if (s.kit.length !== c.minimum || t.steps.some(step => !step.effective)) return { success: false, message: 'The products are recovered, but this kit has an unnecessary module. Pack the smallest suitable kit and trial it again.' };
  return { success: true, message: s.round === 0 ? 'Iron follows the magnet; sand stays behind. One module is enough.' : s.round === 1 ? 'Fine sand passes through; pebbles remain on the sieve. One module is enough.' : 'Filter out the sand. Evaporate the filtrate to recover dry salt. Water leaves as vapor.' };
}
