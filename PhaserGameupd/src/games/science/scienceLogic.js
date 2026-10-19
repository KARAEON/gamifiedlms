import { REPORT_CASES, REPORT_CAPTION_LIMIT, SERVICE_ROUNDS } from '../../config/scienceQuarterGames.js';
import { initialMysteryState, mysteryAction, mysteryOutcome } from './mysterySampleLogic.js';
import { initialKitState, kitAction, kitOutcome } from './recoveryKitLogic.js';
import { initialRelayState, relayAction, relayOutcome } from './separationRelayLogic.js';
import { initialFairState, fairAction, fairOutcome } from './fairTestLogic.js';
import { initialRevivalState, revivalAction, revivalOutcome } from './workshopRevivalLogic.js';

export function initialScienceState(kind, round = 0) {
  const base = { kind, round, attempts: 0, message: '', checked: false };
  if (kind === 'mystery') return initialMysteryState(base);
  if (kind === 'kit') return initialKitState(base);
  if (kind === 'relay') return initialRelayState(base);
  if (kind === 'fair') return initialFairState(base);
  if (kind === 'revival') return initialRevivalState(base);
  if (kind === 'magnet') return { ...base, held: [], recovered: [], magnet: { x: 670, y: 223 } };
  if (kind === 'sieve') return { ...base, opening: 9, run: null };
  if (kind === 'filter') return { ...base, parts: [], poured: false, output: null };
  if (kind === 'evaporate') return { ...base, time: 0, journal: [], output: null };
  if (kind === 'decant') return { ...base, settled: 0, angle: 0, remaining: 100, collected: 0, sediment: 0 };
  if (kind === 'schedule') return { ...base, selected: 0, bookings: {}, run: false };
  if (kind === 'circuit') return { ...base, selected: 'input', pendingTool: null, streams: [{ id: 'input', label: 'INPUT MIXTURE', parts: circuitInput(round) }], steps: [] };
  if (kind === 'impact') return { ...base, tool: 'magnet', installations: {}, run: false };
  if (kind === 'diagnose') {
    const settings = { opening: 9, tool: 'filter', settled: 0, angle: 40 };
    return { ...base, ...settings, changes: [], tests: [{ label: 'BASELINE', success: false, ...settings }], repaired: false };
  }
  if (kind === 'report') return { ...base, activePanel: 0, panels: [null, null, null], caption: '' };
  throw new Error(`Unknown Science activity: ${kind}`);
}

export const sieveSizes = round => ({ small: 2 + round, large: 6 + round });
export const circuitInput = round => [['iron', 'sand', 'water'], ['stones', 'sand', 'water'], ['sand', 'salt', 'water']][round];

export const diagnosticVariables = round => round === 0 ? ['opening'] : round === 1 ? ['tool'] : ['settled', 'angle'];
export function diagnosticObservation(round, settings) {
  if (round === 0) {
    const sandPasses = settings.opening > 2, stonesPass = settings.opening > 6;
    return { success: sandPasses && !stonesPass, sandPasses, stonesPass,
      detail: stonesPass ? 'Sand and stones both pass through.' : sandPasses ? 'Sand passes; stones stay on the mesh.' : 'Sand and stones both stay on the mesh.',
      benefit: 'A suitable opening recovers sand for the building yard.' };
  }
  if (round === 1) {
    const success = settings.tool === 'evaporate';
    return { success, detail: success ? 'Salt remains; water leaves as vapor.' : settings.tool === 'filter' ? 'Dissolved salt passes with the water.' : 'Salt remains dissolved in water.',
      benefit: 'Evaporation recovers salt as a useful product.' };
  }
  const success = settings.settled >= 2 && settings.angle >= 10 && settings.angle <= 30;
  return { success, detail: success ? 'Upper liquid pours; settled sand stays.' : settings.angle < 10 ? 'Not tilted enough to collect liquid.' : 'Sediment enters the receiving jar.',
    benefit: 'Settling and a gentle tilt recover upper liquid for reuse.' };
}

export function magneticItems(round) {
  const positions = [[455, 362], [214, 375], [662, 374], [312, 415], [181, 446], [612, 432], [544, 458], [384, 454], [735, 450]];
  return Array.from({ length: 9 }, (_, i) => ({
    id: i, type: i % 3 === 0 ? 'iron' : i % 3 === 1 ? 'wood' : (round > 0 ? 'copper' : 'stone'),
    x: positions[i][0],
    y: positions[i][1],
  }));
}

export function scienceAction(state, action) {
  if (state.kind === 'mystery') return mysteryAction(state, action);
  if (state.kind === 'kit') return kitAction(state, action, separate);
  if (state.kind === 'relay') return relayAction(state, action, separate);
  if (state.kind === 'fair') return fairAction(state, action);
  if (state.kind === 'revival') return revivalAction(state, action, separate);
  // Clone the serializable experiment state; renderers never mutate domain state.
  const s = structuredClone(state);
  s.message = '';
  const { kind, round } = s;
  const value = action.value;
  if (kind === 'magnet') {
    if (action.type === 'sweep') {
      s.magnet = { x: Math.max(170, Math.min(735, value.x)), y: Math.max(220, Math.min(510, value.y)) };
      for (const item of magneticItems(round)) {
        if (item.type === 'iron' && !s.recovered.includes(item.id) && !s.held.includes(item.id)
          && Math.hypot(item.x - s.magnet.x, item.y - s.magnet.y) < 65) s.held.push(item.id);
      }
    }
    if (action.type === 'release') { s.recovered.push(...s.held); s.held = []; }
  } else if (kind === 'sieve') {
    if (action.type === 'opening') { s.opening = Math.max(1, Math.min(10, s.opening + value)); s.run = null; }
    if (action.type === 'run') {
      const sizes = sieveSizes(round);
      s.run = { sandPasses: sizes.small < s.opening, stonesPass: sizes.large < s.opening };
      s.message = s.run.sandPasses && !s.run.stonesPass ? 'Sand passed through. Larger stones stayed on the mesh.' : s.run.stonesPass ? 'The opening lets both materials pass. Try a smaller opening.' : 'The opening retains the sand too. Try a larger opening.';
    }
  } else if (kind === 'filter') {
    if (action.type === 'place' && !s.parts.includes(value)) s.parts.push(value);
    if (action.type === 'pour') {
      s.poured = s.parts.includes('receiver') && s.parts.includes('filter');
      s.message = s.poured ? round === 1 ? 'The dissolved salt passes through with water. The paper does not recover salt.' : 'The insoluble solid stays on the paper. Liquid passes into the jar.' : 'Place a receiving jar and filter funnel before pouring.';
    }
    if (action.type === 'output' && s.poured) s.output = value;
  } else if (kind === 'evaporate') {
    if (action.type === 'advance') s.time = Math.min(4, s.time + 1);
    if (action.type === 'record' && !s.journal.includes(s.time)) s.journal.push(s.time);
    if (action.type === 'output') s.output = value;
  } else if (kind === 'decant') {
    if (action.type === 'settle' && s.collected === 0) s.settled = Math.min(3, s.settled + 1);
    if (action.type === 'angle') s.angle = Math.max(0, Math.min(50, s.angle + value));
    if (action.type === 'pour') {
      if (s.angle < 10) s.message = 'Tilt the jar a little before pouring.';
      else if (s.remaining > 0) {
        const amount = Math.min(20, s.remaining);
        if (s.settled < 2 || s.angle > 30 || s.remaining <= 20) s.sediment += 1;
        s.remaining -= amount; s.collected += amount;
        s.message = s.sediment ? 'Sediment reached the receiver.\nReset, settle, and pour gently.' : 'Upper liquid collected.\nKeep some above the sediment.';
      }
    }
  } else if (kind === 'schedule') {
    if (action.type === 'select') s.selected = value;
    if (action.type === 'book') { s.bookings[s.selected] = value; s.run = false; }
    if (action.type === 'run') { s.run = true; s.message = checkSchedule(s).message; }
  } else if (kind === 'circuit') {
    if (action.type === 'stream') { s.selected = value; s.pendingTool = null; }
    if (action.type === 'choose-tool') s.pendingTool = value;
    if (action.type === 'tool' || action.type === 'apply') {
      const tool = action.type === 'tool' ? value : s.pendingTool;
      if (!tool) { s.message = 'Choose a tool before applying it.'; return s; }
      const source = s.streams.find(stream => stream.id === s.selected);
      if (!source) return s;
      const outputs = separate(source.parts, tool);
      if (source.parts.length < 2 || !outputs || outputs.length < 2) s.message = 'That method does not separate this stream. Inspect its components and try another tool.';
      else {
        const index = s.steps.length + 1;
        s.streams = s.streams.filter(stream => stream.id !== source.id);
        const newStreams = outputs.map((out, i) => ({ id: `step-${index}-${i}`, ...out }));
        s.streams.push(...newStreams);
        s.steps.push({ sourceId: source.id, source: source.label, input: source.parts, tool, outputs: newStreams });
        s.selected = newStreams.find(stream => stream.parts.length > 1)?.id ?? newStreams[0].id;
        s.pendingTool = null;
        s.message = 'Follow both outputs. Process a mixed stream again to recover separate components.';
      }
    }
  } else if (kind === 'impact') {
    if (action.type === 'tool') s.tool = value;
    if (action.type === 'install') {
      if (s.installations[value]) delete s.installations[value];
      else if (Object.keys(s.installations).length < 2) s.installations[value] = s.tool;
      else s.message = 'Both tokens are used. Tap an installed location to reclaim its token.';
      s.run = false;
    }
    if (action.type === 'run') {
      s.run = true;
      const benefits = SERVICE_ROUNDS[round].filter((site, i) => s.installations[i] === site.tool).map(site => site.benefit);
      s.message = benefits.length ? benefits.join(' ') : 'The installed methods did not recover a useful product. Inspect each mixture and try another plan.';
    }
  } else if (kind === 'diagnose') {
    if (diagnosticVariables(round).includes(action.type)) {
      const previous = s[action.type];
      s[action.type] = action.type === 'tool' ? value : Math.max(action.type === 'opening' ? 1 : 0, Math.min(action.type === 'opening' ? 10 : action.type === 'settled' ? 3 : 50, previous + value));
      s.changes = diagnosticVariables(round).filter(key => s[key] !== s.tests.at(-1)[key]);
      if (previous !== s[action.type]) s.repaired = s.changes.length === 0 && s.tests.at(-1).success;
    }
    if (action.type === 'test') {
      if (s.changes.length !== 1) s.message = 'Change exactly one variable before each test. Reset if you changed more than one.';
      else {
        const { success } = diagnosticObservation(round, s);
        s.tests.push({ label: `TEST ${s.tests.length}`, success, changed: s.changes[0], opening: s.opening, tool: s.tool, settled: s.settled, angle: s.angle });
        s.changes = []; s.repaired = success;
        s.message = success ? 'The test restores the useful output. Compare it with the failed baseline.' : 'The output still fails the goal. Use the evidence to plan your next single change.';
      }
    }
  } else if (kind === 'report') {
    if (action.type === 'panel') s.activePanel = value;
    if (action.type === 'photo') s.panels[s.activePanel] = value;
    if (action.type === 'caption') s.caption = String(value).slice(0, REPORT_CAPTION_LIMIT);
  }
  return s;
}

export function separate(parts, tool) {
  let retained;
  if (tool === 'magnet') retained = parts.filter(p => p === 'iron');
  if (tool === 'sieve') retained = parts.filter(p => p === 'stones');
  if (tool === 'filter' && parts.includes('water')) retained = parts.filter(p => ['iron', 'sand', 'stones'].includes(p));
  if (tool === 'evaporate' && parts.includes('water')) {
    const solid = parts.filter(p => p !== 'water');
    if (!solid.length) return null;
    return [{ label: 'SOLID IN DISH', parts: solid }, { label: 'WATER VAPOR (NOT COLLECTED)', parts: ['vapor'] }];
  }
  if (tool === 'decant' && parts.includes('water') && parts.includes('sand')) return null; // imperfect decanting is practiced in Steady Pour
  if (!retained?.length || retained.length === parts.length) return null;
  return [{ label: tool === 'magnet' ? 'MAGNETIC MATERIAL' : tool === 'filter' ? 'FILTER RESIDUE' : 'RETAINED STONES', parts: retained },
    { label: tool === 'filter' ? 'FILTRATE' : 'REMAINING MATERIAL', parts: parts.filter(p => !retained.includes(p)) }];
}

export function checkSchedule(s) {
  const jobs = SERVICE_ROUNDS[s.round];
  const occupied = new Set();
  for (const [i, job] of jobs.entries()) {
    const b = s.bookings[i];
    if (!b) return { success: false, message: 'Book all three requests before running the shift.' };
    if (b.tool !== job.tool) return { success: false, message: `${job.label}: choose a method that recovers ${job.product.toLowerCase()} from ${job.mixture.toLowerCase()}.` };
    if (b.start + job.duration > 5) return { success: false, message: `${job.label} finishes after the shift. Start this job earlier.` };
    for (let t = b.start; t < b.start + job.duration; t++) {
      const slot = `${b.tool}-${t}`;
      if (occupied.has(slot)) return { success: false, message: 'Two jobs overlap at one station. Move a booking to a free time.' };
      occupied.add(slot);
    }
  }
  return { success: true, message: 'Every request is served. Inspect how each recovered product helps the community.' };
}

export function impactRecovery(s) {
  return SERVICE_ROUNDS[s.round].reduce((total, site, index) => total + (s.installations[index] === site.tool ? site.amount : 0), 0);
}

export function scienceOutcome(s) {
  if (s.kind === 'mystery') return mysteryOutcome(s);
  if (s.kind === 'kit') return kitOutcome(s);
  if (s.kind === 'relay') return relayOutcome(s);
  if (s.kind === 'fair') return fairOutcome(s);
  if (s.kind === 'revival') return revivalOutcome(s);
  let success = false, message;
  if (s.kind === 'magnet') { success = s.recovered.length === 3 && !s.held.length; message = 'Recover all three iron pieces. Release them into the tray.'; }
  if (s.kind === 'sieve') { success = Boolean(s.run?.sandPasses && !s.run.stonesPass); message = 'Run a batch with an opening that passes the sand and retains the stones.'; }
  if (s.kind === 'filter') { success = s.poured && s.output === (s.round === 1 ? 'liquid' : 'paper'); message = s.round === 1 ? 'Find the dissolved salt in the collected liquid, not on the paper.' : 'Find the recovered insoluble solid on the filter paper.'; }
  if (s.kind === 'evaporate') {
    success = s.time === 4 && s.journal.includes(0) && s.journal.includes(4) && s.journal.some(t => t > 0 && t < 4) && s.output === 'salt';
    message = s.time < 4 ? 'Advance to stage 5.\nRecord the changing dish.'
      : !s.journal.includes(0) ? 'Start observation missing.\nReset and record stage 1.'
        : !s.journal.some(t => t > 0 && t < 4) ? 'No middle stage recorded.\nReset and record stages 2-4.'
          : !s.journal.includes(4) ? 'Record the end at stage 5.'
            : 'Find the solid left in the dish.';
  }
  if (s.kind === 'decant') {
    success = s.collected >= 60 && s.remaining >= 20 && s.sediment === 0;
    message = s.sediment ? 'Sediment reached the receiver.\nReset, settle, and pour gently.'
      : s.remaining < 20 ? 'Too little liquid remains.\nReset and leave at least 20%.'
        : 'Collect at least 60%.\nPour gently in small steps.';
  }
  if (s.kind === 'schedule') { const checked = checkSchedule(s); success = s.run && checked.success; message = s.run ? checked.message : 'Run the shift to inspect your scheduled outputs.'; }
  if (s.kind === 'circuit') {
    const targets = s.round === 0 ? ['iron', 'sand', 'water'] : s.round === 1 ? ['stones', 'sand', 'water'] : ['sand', 'salt'];
    success = targets.every(p => s.streams.some(stream => stream.parts.length === 1 && stream.parts[0] === p));
    message = 'Recover each requested component in its own output. Select the mixed output before applying the next tool.';
  }
  if (s.kind === 'impact') {
    const target = SERVICE_ROUNDS[s.round].map(j => j.amount).sort((a, b) => b - a).slice(0, 2).reduce((a, b) => a + b, 0);
    success = s.run && impactRecovery(s) === target;
    message = `Use two suitable services to recover ${target} units. Run the preview and inspect which locations benefit most.`;
  }
  if (s.kind === 'diagnose') { success = s.repaired && s.tests.length > 1 && s.changes.length === 0; message = 'Restore the output through tests that change one variable at a time.'; }
  if (s.kind === 'report') {
    success = s.panels.every((p, i) => p === i) && s.caption.trim().length >= 20;
    message = s.panels.some(p => p === null) ? 'Fill Before, Process and After with images.'
      : !s.panels.every((p, i) => p === i) ? 'Check the images: mixture, method, recovered product.'
        : 'Write at least 20 characters about the method, product and benefit.';
  }
  return { success, message: success ? s.kind === 'report' ? 'Your illustrated report is saved for review. The written explanation still needs a teacher check.' : 'The challenge is complete. Inspect the result, then continue.' : message,
    benefit: s.kind === 'report' ? REPORT_CASES[s.round].benefit : null };
}
