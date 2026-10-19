export const RELAY_TOOLS = ['magnet', 'sieve', 'filter', 'evaporate', 'decant'];
export const RELAY_CASES = [
  { mission: 'Recover iron and sand from one dry mixed sample.', input: ['iron', 'sand'], goals: ['iron', 'sand'] },
  { mission: 'Recover stones and sand; keep track of the water.', input: ['stones', 'sand', 'water'], goals: ['stones', 'sand'] },
  { mission: 'Recover iron, sand, and salt from one mixed sample.', input: ['iron', 'sand', 'salt', 'water'], goals: ['iron', 'sand', 'salt'] },
];

export function initialRelayState(base) {
  return { ...base, active: { id: 'input', label: 'INPUT SAMPLE', parts: [...RELAY_CASES[base.round].input] },
    tool: null, operation: null, waiting: [], recovered: [], accounted: [], selectedOutput: null, steps: [] };
}

export function suggestedRelayTool(parts) {
  return parts.includes('iron') ? 'magnet' : parts.includes('stones') ? 'sieve'
    : parts.includes('water') && parts.includes('sand') ? 'filter'
      : parts.includes('water') && parts.includes('salt') ? 'evaporate' : null;
}

export function relayAction(state, action, separate) {
  const s = structuredClone(state);
  s.message = '';
  if (action.type === 'tool' && RELAY_TOOLS.includes(action.value)) {
    if (!s.active) { s.message = 'Carry a mixed output to the next bench before choosing its tool.'; return s; }
    s.tool = action.value;
  }
  if (action.type === 'operate') {
    if (!s.active) { s.message = 'Choose a mixed output and carry it to the next step.'; return s; }
    if (!s.tool) { s.message = 'Choose the separation tool for this sample first.'; return s; }
    const split = separate(s.active.parts, s.tool);
    if (!split) {
      s.message = !s.active.parts.includes('water') && s.active.parts.includes('sand') && s.active.parts.includes('salt')
        ? 'Sand and salt remain mixed. Reset, then filter out sand before evaporating the filtrate.'
        : s.tool === 'decant' ? 'Some liquid remains with the sediment. Choose a method that fully separates this sample.'
        : !s.active.parts.includes('water') && s.tool === 'filter' ? 'Paper filtration needs a liquid sample. This dry mixed solid cannot be filtered here.'
          : 'This tool does not separate the current materials. Inspect the sample and choose another tool.';
      return s;
    }
    const input = structuredClone(s.active);
    const outputs = split.map((output, i) => ({ ...output, id: `step-${s.steps.length + 1}-${i}` }));
    s.operation = { tool: s.tool, input, outputs };
    s.steps.push(structuredClone(s.operation));
    for (const output of outputs) {
      if (output.parts.length > 1) s.waiting.push(output);
      else if (['water', 'vapor'].includes(output.parts[0])) s.accounted.push(output);
      else s.recovered.push(output);
    }
    s.active = null;
    s.selectedOutput = s.waiting.length === 1 ? s.waiting[0].id : null;
    s.message = s.waiting.length ? s.operation.tool === 'filter' && outputs.some(out => out.parts.includes('salt'))
      ? 'The filtrate still contains dissolved salt. Carry a mixed output onward.'
      : 'Useful solids stay in the rack. Select a mixed output to carry to the next bench.'
      : 'Every output is kept. Inspect the recovery rack, then check your result.';
  }
  if (action.type === 'output') {
    if (s.waiting.some(output => output.id === action.value)) s.selectedOutput = action.value;
    else s.message = 'That output is already kept separately. Carry a sample that still needs separation.';
  }
  if (action.type === 'carry') {
    const index = s.waiting.findIndex(output => output.id === s.selectedOutput);
    if (index < 0) { s.message = 'Select a mixed output before carrying it to the next step.'; return s; }
    const next = s.waiting.splice(index, 1)[0];
    if (s.active) s.waiting.push(s.active); // Switching samples preserves the current one.
    s.active = next; s.operation = null; s.tool = null;
    s.selectedOutput = s.waiting.length === 1 ? s.waiting[0].id : null;
    s.message = 'Sample carried. Choose a suitable tool and operate it at this bench.';
  }
  return s;
}

export function relayOutcome(s) {
  const c = RELAY_CASES[s.round];
  const complete = c.goals.every(goal => s.recovered.some(output => output.parts.length === 1 && output.parts[0] === goal));
  if (!complete) return { success: false, message: s.active ? 'Separate the carried sample and recover every requested solid.' : 'Carry a mixed output onward. Some requested solids are still together or dissolved.' };
  if (s.active || s.waiting.length) return { success: false, message: 'A mixed sample still needs attention. Keep and process every useful output.' };
  return { success: true, message: s.round === 0 ? 'Iron and sand are recovered separately. Every material is kept.' : s.accounted.some(out => out.parts.includes('vapor')) ? 'Requested solids recovered. Water is accounted for as vapor, not collected liquid.' : 'Requested solids recovered. The separated liquid water is also kept.' };
}
