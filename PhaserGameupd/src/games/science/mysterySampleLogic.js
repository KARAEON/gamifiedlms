export const MYSTERY_COMPONENTS = ['Salt + water', 'Sand + water', 'Iron + sand'];
export const MYSTERY_TYPES = ['Uniform', 'Non-uniform'];
export const MYSTERY_CASES = [
  { mission: 'Investigate the salt maker\'s workshop sample.', components: 'Salt + water', classification: 'Uniform',
    record: 'Salt was dissolved in water.', test: 'rest',
    observations: [
      ['Even appearance', 'The portion looks the same throughout. No separate grains are visible.'],
      ['No sediment after resting', 'The dissolved salt stays in the water. No grains collect at the bottom.'],
    ] },
  { mission: 'Investigate the settling workshop sample.', components: 'Sand + water', classification: 'Non-uniform',
    record: 'Sand was added to water.', test: 'rest',
    observations: [
      ['Visible grains', 'I can see sand grains in the sample.'],
      ['Grains settle when left to rest', 'The sand sinks to the bottom and the water becomes clearer.'],
    ] },
  { mission: 'Investigate the repair workshop sample.', components: 'Iron + sand', classification: 'Non-uniform',
    record: 'Iron pieces were mixed with sand.', test: 'magnet',
    observations: [
      ['Two visible materials', 'Dark iron pieces and golden sand grains are visible in the portion.'],
      ['Only iron follows the magnet', 'The iron moves toward the magnet. The sand stays in the tray.'],
    ] },
];

export function initialMysteryState(base) {
  return { ...base, inspected: false, settled: false, magnetic: false, view: 'sample', evidence: [],
    components: null, classification: null, menu: null, answers: [] };
}

export function mysteryAction(state, action) {
  const s = structuredClone(state), c = MYSTERY_CASES[s.round];
  s.message = '';
  const record = id => { if (!s.evidence.includes(id)) s.evidence.push(id); };
  if (action.type === 'inspect') { s.inspected = true; record('inspect'); s.message = 'An enlarged portion is now in your notebook.'; }
  if (action.type === 'stir') {
    s.settled = false; s.magnetic = false; s.view = 'stirred';
    s.message = s.round === 0 ? 'Salt remains dissolved. The sample still looks even.' : s.round === 1 ? 'Sand grains are suspended again. Try letting the sample rest.' : 'Both materials are mixed again. Try the magnet.';
  }
  if (action.type === c.test) {
    record(c.test); s.settled = c.test === 'rest'; s.magnetic = c.test === 'magnet'; s.view = c.test;
    s.message = c.observations[1][1];
  }
  if (action.type === 'menu' && ['components', 'classification', null].includes(action.value)) s.menu = s.menu === action.value ? null : action.value;
  if (action.type === 'components' && MYSTERY_COMPONENTS.includes(action.value)) { s.components = action.value; s.menu = null; }
  if (action.type === 'classification' && MYSTERY_TYPES.includes(action.value)) { s.classification = action.value; s.menu = null; }
  return s;
}

export function mysteryOutcome(s) {
  const c = MYSTERY_CASES[s.round];
  if (!s.evidence.includes('inspect')) return { success: false, message: 'Inspect a portion first. Collect evidence before making your conclusion.' };
  if (!s.evidence.includes(c.test)) return { success: false, message: c.test === 'rest' ? 'Let the sample rest. Record whether grains settle.' : 'Test the magnet. Record which material moves.' };
  if (!s.components || !s.classification) return { success: false, message: 'Choose the materials and mixture type using your notebook and preparation record.' };
  if (s.components !== c.components) return { success: false, message: 'Recheck the preparation record and enlarged portion. Which two materials were used?' };
  if (s.classification !== c.classification) return { success: false, message: s.round === 0 ? 'Two materials can look uniform when one dissolves. Recheck the even appearance.' : 'Visible separate parts support a non-uniform mixture. Recheck your observations.' };
  return { success: true, message: `${c.components}: ${c.classification.toLowerCase()}. Your recorded evidence supports this conclusion.` };
}
