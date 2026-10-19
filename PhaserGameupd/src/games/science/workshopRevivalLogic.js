import { REPORT_CAPTION_LIMIT } from '../../config/scienceQuarterGames.js';

export const REVIVAL_CASES = [
  { region: 'WORKBENCH', input: ['iron', 'sand'], goals: ['iron'], mission: 'Recover iron fasteners to restore the workshop workbench.', benefit: 'Iron fasteners secure the workbench brackets.' },
  { region: 'COURTYARD', input: ['stones', 'sand', 'water'], goals: ['sand'], mission: 'Recover sand for the workshop courtyard repair.', benefit: 'Recovered sand supplies the courtyard repair bed.' },
  { region: 'STORAGE', input: ['sand', 'salt', 'water'], goals: ['sand', 'salt'], mission: 'Recover sand and dry salt to restock the workshop storage.', benefit: 'Separate sand and dry salt can be stored for future workshop jobs.' },
];

export function initialRevivalState(base) {
  return { ...base, observed: false, observation: '', caption: '', tool: null, selected: 'input',
    streams: [{ id: 'input', label: 'INPUT', parts: [...REVIVAL_CASES[base.round].input] }], steps: [],
    repairs: [false, false, false], applied: [] };
}

export function readyToRepair(s) {
  return s.observed && !s.repairs[s.round] && REVIVAL_CASES[s.round].goals.every(goal =>
    s.streams.some(stream => stream.parts.length === 1 && stream.parts[0] === goal));
}

export function revivalAction(state, action, separate) {
  const s = structuredClone(state), c = REVIVAL_CASES[s.round];
  s.message = '';
  if (action.type === 'caption') { s.caption = String(action.value).slice(0, REPORT_CAPTION_LIMIT); return s; }
  if (action.type === 'observe') {
    s.observed = true;
    s.observation = ['Visible iron pieces and sand: non-uniform.', 'Stones and sand grains in water: non-uniform.', 'Visible sand in saltwater: non-uniform. Preparation record identifies dissolved salt.'][s.round];
    s.message = s.observation; return s;
  }
  if (action.type === 'apply') {
    if (!readyToRepair(s)) { s.message = s.repairs[s.round] ? 'This repair already uses the recovered material.' : 'Observe, then recover each needed material in a separate output.'; return s; }
    for (const goal of c.goals) {
      const index = s.streams.findIndex(stream => stream.parts.length === 1 && stream.parts[0] === goal);
      s.applied.push({ ...s.streams.splice(index, 1)[0], region: c.region });
    }
    s.repairs[s.round] = true; s.selected = null; s.tool = null;
    s.message = `${c.region} restored. Explain how the recovered material helps.`; return s;
  }
  if (!s.observed) { s.message = 'Observe the sample before choosing a separation method.'; return s; }
  if (s.repairs[s.round]) { s.message = 'The repair is complete. Write and save your explanation.'; return s; }
  if (action.type === 'stream' && s.streams.some(stream => stream.id === action.value)) {
    s.selected = action.value; s.tool = null;
  }
  if (action.type === 'tool' && ['magnet', 'sieve', 'filter', 'evaporate', 'decant'].includes(action.value)) s.tool = action.value;
  if (action.type === 'operate') {
    const input = s.streams.find(stream => stream.id === s.selected);
    if (!input || !s.tool) { s.message = 'Select an output and a tool, then apply the tool.'; return s; }
    const results = separate(input.parts, s.tool);
    if (!results) {
      s.message = s.tool === 'filter' && input.parts.includes('salt') && input.parts.includes('water')
        ? 'Dissolved salt passes through paper. Choose a method that leaves dry salt.'
        : s.tool === 'decant' ? 'Decanting can carry sand over. Use a method that retains the sand.'
          : 'This tool does not separate the selected materials. Try another tool or output.';
      return s;
    }
    const outputs = results.map((result, i) => ({ ...result, id: `step-${s.steps.length + 1}-${i}`,
      damp: (s.tool === 'filter' && i === 0) || Boolean(input.damp && result.parts.some(p => ['sand', 'stones', 'iron'].includes(p))) }));
    s.steps.push({ tool: s.tool, input: structuredClone(input), outputs: structuredClone(outputs) });
    s.streams = [...s.streams.filter(stream => stream.id !== input.id), ...outputs];
    s.selected = outputs.find(stream => stream.parts.length > 1)?.id ?? outputs[0].id; s.tool = null;
    s.message = readyToRepair(s) ? 'Needed materials recovered. Apply them to the highlighted repair.'
      : outputs.some(stream => stream.parts.includes('sand') && stream.parts.includes('salt') && !stream.parts.includes('water'))
        ? 'Sand and salt remain mixed in the dish. Reset and filter before evaporating.'
        : 'Both outputs are kept. Select the mixture that needs another step.';
  }
  return s;
}

export function revivalOutcome(s) {
  if (!s.observed) return { success: false, message: 'Observe the initial sample first.' };
  if (!s.repairs[s.round]) return { success: false, message: 'Recover and apply the needed materials to this repair.' };
  if (s.caption.trim().length < 20) return { success: false, message: 'Write at least 20 characters explaining how the recovered material helps.' };
  return { success: true, message: s.round === 2 ? 'Workshop restored! All explanations saved for teacher review.' : 'Repair and explanation saved for teacher review.' };
}
