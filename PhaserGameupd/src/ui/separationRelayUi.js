import { RELAY_CASES, relayOutcome, suggestedRelayTool } from '../games/science/separationRelayLogic.js';
import { SCIENCE_TOOLS } from '../config/scienceQuarterGames.js';
import { magnetPanel as panel, magnetControl } from './magnetWorkshopUi.js';
import { qText, qHeading, qZone } from './scienceQuarterUi.js';
import { supplyText, supplyHeading, supplyGlyph } from './supplyCartUi.js';
import { circuitSample, toolSprite } from './recoveryCircuitUi.js';
import { apparatus } from './evaporationWorkshopUi.js';
import { closeOpenModal, showModal } from './ui.js';

const toolName = id => SCIENCE_TOOLS.find(t => t.id === id)?.label ?? 'CHOOSE TOOL';
const names = parts => {
  const solids = parts.filter(p => p !== 'water');
  if (parts.includes('salt') && parts.includes('water')) return [...solids.filter(p => p !== 'salt').map(p => p.toUpperCase()), 'SALTWATER'].join(' + ');
  return parts.map(p => p === 'vapor' ? 'WATER VAPOR' : p === 'salt' ? 'DRY SALT' : p.toUpperCase()).join(' + ');
};
function image(scene, key, x, y, width, height = width, frame) {
  const texture = scene.textures.get(key);
  const node = scene.add.image(x, y, key, frame ?? (texture.has('trimmed') ? 'trimmed' : undefined));
  return node.setScale(Math.min(width / node.width, height / node.height));
}
function fit(text, height, min = 14) {
  for (let size = parseFloat(text.style.fontSize) - 1; text.height > height && size >= min; size--) text.setFontSize(size);
  return text;
}
function plaque(scene, x, y, width, height, label, size = 18) {
  scene.layer.add(panel(scene, x, y, width, height, { fill: 0xe9cf98 }));
  return fit(qText(scene, x, y, label, size, '#292116', width - 32), height - 14);
}

// Contents sit beneath the existing empty, transparent jar. Dissolved salt has no visible grains.
function sampleJar(scene, parts, x, y, height) {
  const group = scene.add.container(x, y), width = height * 2 / 3;
  if (parts.includes('water')) {
    const g = scene.add.graphics();
    g.fillStyle(0x54badd, 0.78).fillRect(-width * 0.36, -height * 0.03, width * 0.72, height * 0.435);
    g.lineStyle(2, 0xa6eeff).lineBetween(-width * 0.36, -height * 0.03, width * 0.36, -height * 0.03);
    group.add(g);
  }
  const visible = parts.filter(p => !['water', 'vapor'].includes(p) && !(p === 'salt' && parts.includes('water')));
  if (visible.length) group.add(circuitSample(scene, visible, 0, height * 0.28, width * 0.63));
  group.add(image(scene, 'science-mystery-jar', 0, 0, width, height));
  return group;
}

function checkpoints(scene) {
  const s = scene.state, finished = relayOutcome(s).success;
  const current = finished ? null : s.operation?.tool ?? s.tool ?? (s.active ? suggestedRelayTool(s.active.parts) : null);
  const completed = s.operation && !finished ? s.steps.slice(0, -1) : s.steps;
  const recent = completed.slice(finished ? -3 : -2);
  const labels = recent.map(step => ({ tool: step.tool, done: true }));
  if (labels.length < 3 && current) labels.push({ tool: current, done: false });
  // Preview a likely following step without enforcing an order.
  if (labels.length < 3 && current === 'filter' && (s.active?.parts ?? s.operation?.input.parts ?? []).includes('salt')) labels.push({ tool: 'evaporate', future: true });
  while (labels.length < 3) labels.push({ label: s.steps.length && !current ? 'OUTPUTS KEPT' : 'NEXT STEP', future: true });
  labels.forEach((entry, i) => {
    const x = 190 + i * 225, color = entry.done ? 0x6adb55 : entry.future ? 0x617b97 : 0x67e8f3;
    scene.layer.add(scene.add.rectangle(x, 222, 208, 31, entry.done ? 0x153a28 : 0x102436).setStrokeStyle(2, color));
    scene.layer.add(scene.add.circle(x - 81, 222, 18, 0x102436).setStrokeStyle(2, color));
    qText(scene, x - 81, 222, `${Math.max(0, completed.length - recent.length) + i + 1}`, 22, '#fff0d6');
    qText(scene, x + 13, 222, entry.label ?? toolName(entry.tool), 17, entry.future ? '#becfe4' : '#f8ead6');
    if (entry.done) scene.layer.add(supplyGlyph(scene, x - 66, 205, 'check', 0x79ef58, 1.3));
  });
}

function apparatusPicture(scene, tool, operation, parts, x, y, size) {
  const group = scene.add.container(x, y);
  if (tool === 'filter') {
    group.add(image(scene, 'science-filter-stand', 0, 0, size * 0.82, size));
    if (operation) {
      const g = scene.add.graphics();
      g.fillStyle(0x54badd, 0.86).fillRect(-size * 0.115, size * 0.23, size * 0.23, size * 0.15);
      group.add(g);
    }
    group.add(image(scene, 'science-filter-beaker', 0, size * 0.27, size * 0.36, size * 0.4));
    group.add(image(scene, 'science-filter-funnel', 0, -size * 0.24, size * 0.59, size * 0.56));
    if (operation) group.add(circuitSample(scene, operation.outputs[0].parts, 0, -size * 0.35, size * 0.25));
  } else if (tool === 'evaporate') {
    const solids = parts.filter(p => p !== 'water');
    const dish = apparatus(scene, 0, 0, size * 0.85, size * 0.85, operation ? solids.length === 1 && solids[0] === 'salt' ? 4 : null : 0, Boolean(operation));
    dish.getAt(0).setAlpha(1);
    group.add(dish);
    if (operation && !(solids.length === 1 && solids[0] === 'salt')) group.add(circuitSample(scene, solids, 0, -size * 0.12, size * 0.35));
  } else if (tool) group.add(toolSprite(scene, tool, 0, -size * 0.13, size * 0.65));
  else group.add(circuitSample(scene, parts, 0, -size * 0.06, size * 0.64));
  if (operation && !['filter', 'evaporate'].includes(tool)) operation.outputs.forEach((out, i) => {
    group.add(circuitSample(scene, out.parts, (i ? 1 : -1) * size * 0.24, size * 0.27, size * 0.29));
  });
  return group;
}

export function renderSeparationRelay(scene) {
  const s = scene.state, c = RELAY_CASES[scene.round];
  scene.layer.add(panel(scene, 396, 391, 760, 488, { fill: 0x081b2b }));
  scene.layer.add(panel(scene, 1028, 391, 472, 488, { fill: 0x081b2b }));
  scene.layer.add(scene.add.image(396, 393, 'science-workshop-backdrop').setDisplaySize(720, 300));
  scene.layer.add(scene.add.rectangle(396, 393, 720, 300, 0x08131d, 0.16));
  qHeading(scene, 396, 178, 'SEPARATION BENCH', 25, '#67e8f3');
  qHeading(scene, 1028, 178, 'RECOVERY RACK', 25, '#67e8f3');
  checkpoints(scene);
  const source = s.operation?.input ?? s.active;
  const parts = source?.parts ?? c.input;
  plaque(scene, 156, 277, 220, 58, `${source?.id === 'input' ? 'INPUT' : source ? 'CARRIED SAMPLE' : 'INITIAL SAMPLE'}:\n${names(parts)}`, 18);
  scene.layer.add(sampleJar(scene, parts, 156, 405, 184));
  if (!s.active && !s.operation) qText(scene, 156, 507, 'ALL OUTPUTS KEPT', 16, '#f4deb6');
  const first = s.recovered[0];
  if (first) {
    scene.layer.add(image(scene, 'science-recovery-tray', 156, 528, 180, 53));
    scene.layer.add(circuitSample(scene, first.parts, 156, 514, 62));
    qText(scene, 156, 548, `${names(first.parts)} KEPT`, 15, '#ffdf9b');
  } else qText(scene, 156, 530, 'Keep every useful output.', 16, '#f4deb6', 210);
  const tool = s.operation?.tool ?? s.tool;
  scene.layer.add(apparatusPicture(scene, tool, s.operation, parts, 424, 388, 242));
  const observed = s.operation?.outputs[0];
  plaque(scene, 424, 507, 200, 35, tool === 'filter' && s.operation ? names(s.operation.outputs[1].parts) : tool ? toolName(tool) : 'CHOOSE A TOOL', 17);
  if (tool === 'filter' && observed) plaque(scene, 437, 274, 220, 33, `${names(observed.parts)} (DAMP)`, 17);
  scene.button('operate', 424, 544, tool === 'magnet' ? 'SWEEP MAGNET' : tool === 'filter' ? 'POUR SAMPLE' : tool === 'sieve' ? 'RUN SIEVE' : tool === 'evaporate' ? 'EVAPORATE' : 'OPERATE TOOL', () => scene.perform('operate'), { width: 212, height: 34, size: 19, enabled: scene.phase === 'playing' && Boolean(s.active && s.tool) });
  outputSelector(scene);
  SCIENCE_TOOLS.forEach((t, i) => {
    const x = 102 + i * 146, selected = s.tool === t.id;
    scene.layer.add(panel(scene, x, 601, 139, 69, { fill: selected ? 0x103b4a : 0x102436 }));
    if (selected) scene.layer.add(scene.add.rectangle(x, 601, 127, 58).setStrokeStyle(2, 0x67e8f3));
    scene.layer.add(toolSprite(scene, t.id, x, 589, 40).setAlpha(s.active ? 1 : 0.5));
    qText(scene, x, 621, t.label, 16, s.active ? '#f4deb6' : '#bacbdf');
    const zone = qZone(scene, `tool-${t.id}`, x, 601, 139, 69, () => scene.perform('tool', t.id));
    if (!s.active) zone.disableInteractive();
  });
  c.goals.forEach((goal, i) => {
    const y = 251 + i * 96, kept = s.recovered.some(out => out.parts.length === 1 && out.parts[0] === goal);
    scene.layer.add(scene.add.rectangle(1028, y + 41, 424, 1, 0x415a69));
    scene.layer.add(panel(scene, 913, y, 195, 85, { fill: 0x102436 }));
    plaque(scene, 913, y - 25, 186, 29, names([goal]), 19);
    scene.layer.add(circuitSample(scene, [goal], 913, y + 13, goal === 'iron' ? 47 : 76));
    scene.layer.add(scene.add.rectangle(1140, y, 197, 40, kept ? 0x226537 : 0x2c4465).setStrokeStyle(2, kept ? 0x80d964 : 0x809bbc));
    if (kept) scene.layer.add(supplyGlyph(scene, 1068, y, 'check', 0xe6f4d0, 2));
    else scene.layer.add(scene.add.circle(1068, y, 9).setStrokeStyle(2, 0xbfd2e9));
    qText(scene, 1156, y, kept ? 'RECOVERED' : 'PENDING', 21, kept ? '#edfbd5' : '#c9dbf0');
  });
  if (c.goals.length === 2) {
    qHeading(scene, 1028, 432, 'EVERY OUTPUT COUNTS', 21, '#67e8f3');
    qText(scene, 1028, 467, scene.round === 0 ? 'Iron follows the magnet.\nSand stays separate.' : 'Larger stones stay on the sieve.\nPaper retains insoluble sand.', 20, '#f4deb6', 411);
  }
  const water = s.accounted.some(out => out.parts.includes('water')) ? 'Liquid water kept separately.' : s.accounted.some(out => out.parts.includes('vapor')) ? 'Water left as vapor; not collected liquid.' : c.input.includes('water') ? 'Track the water through each step.' : 'All solids remain in your recovery rack.';
  qText(scene, 1028, 497, water, 15, '#bfd8ec', 418);
}

function outputSelector(scene) {
  const s = scene.state;
  scene.layer.add(panel(scene, 650, 393, 198, 212, { fill: 0x102436 }));
  qHeading(scene, 650, 309, 'SELECT OUTPUT', 18, '#67e8f3');
  if (!s.waiting.length) {
    scene.layer.add(circuitSample(scene, s.active?.parts ?? s.recovered.at(-1)?.parts ?? [], 650, 385, 86));
    qText(scene, 650, 453, s.active ? 'Operate the tool to\nsee its outputs.' : 'PRODUCTS KEPT\nIN THE RACK', 17, '#f4deb6', 161);
  }
  s.waiting.forEach((out, i) => {
    const y = s.waiting.length === 1 ? 400 : 357 + i * 80, selected = s.selectedOutput === out.id;
    scene.layer.add(scene.add.rectangle(650, y, 170, s.waiting.length === 1 ? 134 : 71, 0x0c2132).setStrokeStyle(selected ? 3 : 1, selected ? 0x67e8f3 : 0x687d91));
    scene.layer.add(circuitSample(scene, out.parts, s.waiting.length === 1 ? 650 : 596, s.waiting.length === 1 ? y - 17 : y, s.waiting.length === 1 ? 95 : 46));
    const label = out.label === 'FILTRATE' ? 'FILTRATE' : out.parts.includes('water') ? 'MIXED SAMPLE' : 'MIXED SOLIDS';
    fit(qText(scene, s.waiting.length === 1 ? 650 : 673, s.waiting.length === 1 ? y + 45 : y, `${label}\n${names(out.parts)}`, 16, '#f4deb6', s.waiting.length === 1 ? 152 : 100), 54);
    qZone(scene, `output-${out.id}`, 650, y, 170, s.waiting.length === 1 ? 134 : 71, () => scene.perform('output', out.id));
  });
  const selected = s.waiting.find(out => out.id === s.selectedOutput);
  scene.button('carry', 650, 531, selected?.label === 'FILTRATE' ? 'CARRY FILTRATE' : 'CARRY SAMPLE', () => scene.perform('carry'), { width: 199, height: 43, size: 19, enabled: scene.phase === 'playing' && Boolean(selected) });
}

export function separationRelayResults(scene) {
  const success = scene.phase !== 'playing', ready = relayOutcome(scene.state).success;
  const pending = scene.state.waiting.length;
  plaque(scene, 1028, 523, 438, 34, success ? 'Every requested product is recovered.' : pending ? `${pending} mixed ${pending === 1 ? 'output needs' : 'outputs need'} another step.` : scene.state.active ? 'Choose a suitable tool for this sample.' : 'Inspect the recovered products.', 17);
  scene.layer.add(panel(scene, 1028, 567, 438, 48, { fill: success ? 0x163e2a : 0x102436 }));
  fit(qText(scene, 1028, 567, scene.state.message || 'Choose a tool. Operate it. Keep and carry its outputs.', 18, success ? '#e3f2be' : '#f5ead6', 401), 37, 14);
  scene.button(success ? 'retry' : 'reset', 900, 615, success ? 'RETRY' : 'RESET', () => scene.resetRound(), { width: 176, height: 43, size: 23 });
  scene.button(success ? 'next' : 'check', 1136, 615, success ? scene.phase === 'finished' ? 'LESSON MAP' : 'NEXT CHALLENGE' : 'CHECK RESULT', () => success ? scene.nextRound() : scene.checkRound(), { width: 247, height: 43, size: 21, fill: 0x32641f, enabled: success || ready });
}

export function openSeparationRelayHelp(scene) {
  if (scene.currentModal) return;
  scene.minigameHelpOpen = true;
  showModal(scene, { name: 'minigame-help', title: 'CARRY EVERY USEFUL OUTPUT', width: 1120, height: 580, titleTop: 43, titleSize: 32, buttons: [], body: () => {
    const nodes = [supplyText(scene, 640, 144, 'Pure products go to the rack. Mixed outputs need another step.', 22, '#67d8ee')];
    scene.gameDefinition.steps.forEach(([heading, detail], i) => {
      const x = 294 + i * 346;
      nodes.push(panel(scene, x, 286, 326, 247, { fill: 0x102436 }));
      nodes.push(supplyHeading(scene, x, 188, heading, 22, '#ffdf9b'));
      nodes.push(i === 0 ? toolSprite(scene, 'magnet', x, 266, 98) : circuitSample(scene, i === 1 ? ['iron'] : ['salt', 'water'], x, 266, 103));
      nodes.push(fit(supplyText(scene, x, 364, detail, 18, '#efdfb8').setWordWrapWidth(282, true), 80, 16));
    });
    nodes.push(panel(scene, 640, 495, 1054, 150, { fill: 0x15301f }));
    nodes.push(supplyHeading(scene, 640, 443, 'SCIENTIST NOTE', 24, '#ffdf9b'));
    nodes.push(supplyText(scene, 640, 506, scene.gameDefinition.tip, 21, '#efdfb8').setWordWrapWidth(974, true));
    nodes.push(magnetControl(scene, 640, 611, 'GOT IT', () => { scene.minigameHelpOpen = false; closeOpenModal(scene); scene.updateTestState(); }, { width: 180, height: 50, fill: 0x32641f }));
    return nodes;
  } });
  scene.updateTestState();
}
