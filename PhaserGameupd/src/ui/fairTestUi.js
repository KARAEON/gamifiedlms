import { FAIR_CASES, FAIR_SIDES } from '../games/science/fairTestLogic.js';
import { magnetPanel as panel, magnetControl } from './magnetWorkshopUi.js';
import { qText, qHeading } from './scienceQuarterUi.js';
import { supplyText, supplyHeading, supplyGlyph } from './supplyCartUi.js';
import { circuitSample } from './recoveryCircuitUi.js';
import { decantJar, decantStream } from './decantWorkshopUi.js';
import { apparatus } from './evaporationWorkshopUi.js';
import { closeOpenModal, showModal } from './ui.js';

const parts = amounts => Object.keys(amounts).filter(p => amounts[p] > 0);
function image(scene, key, x, y, width, height = width, frame) {
  const texture = scene.textures.get(key);
  const node = scene.add.image(x, y, key, frame ?? (texture.has('trimmed') ? 'trimmed' : undefined));
  return node.setScale(Math.min(width / node.width, height / node.height));
}
function fit(text, maxHeight, minSize = 14) {
  for (let size = parseFloat(text.style.fontSize) - 1; text.height > maxHeight && size >= minSize; size--) text.setFontSize(size);
  return text;
}
function heading(scene, x, y, label, size, width) {
  const text = qHeading(scene, x, y, label, size, '#67e8f3');
  if (text.width > width) text.setFontSize(Math.floor(size * width / text.width));
  return text;
}
function plaque(scene, x, y, width, height, label, size = 18) {
  scene.layer.add(panel(scene, x, y, width, height, { fill: 0xe9cf98 }));
  return fit(qText(scene, x, y, label, size, '#292116', width - 34), height - 16);
}
function glass(scene, x, y, size, amounts = {}) {
  const group = scene.add.container(x, y), wet = amounts.water > 0;
  if (wet) {
    const g = scene.add.graphics();
    g.fillStyle(0x54badd, 0.85).fillRect(-size * 0.24, -size * 0.19, size * 0.48, size * 0.55);
    g.lineStyle(2, 0xb9ecff).lineBetween(-size * 0.24, -size * 0.19, size * 0.24, -size * 0.19);
    if (amounts.sand > 0) for (let i = 0; i < 24; i++) {
      g.fillStyle(i % 2 ? 0xe6b465 : 0x8c632f).fillRect(-size * 0.2 + ((i * 17) % 41) / 41 * size * 0.4, size * 0.08 + ((i * 13) % 37) / 37 * size * 0.22, Math.max(1, size / 45), Math.max(1, size / 45));
    }
    group.add(g);
  }
  group.add(image(scene, 'science-filter-beaker', 0, 0, size * 0.82, size));
  return group;
}

function filterPicture(scene, x, y, size, result) {
  const group = scene.add.container(x, y);
  group.add(image(scene, 'science-filter-stand', 0, 0, size * 0.83, size));
  group.add(glass(scene, 0, size * 0.27, size * 0.4, result?.outputs[0].amounts));
  group.add(image(scene, 'science-filter-funnel', 0, -size * 0.25, size * 0.6, size * 0.57));
  if (result?.outputs[1].amounts.sand) group.add(circuitSample(scene, ['sand'], 0, -size * 0.35, size * 0.26));
  if (result) {
    const drops = scene.add.graphics().fillStyle(0x83e0f9);
    drops.fillRect(-2, size * 0.04, 4, 8).fillRect(-2, size * 0.12, 4, 5); group.add(drops);
  }
  return group;
}

function sievePicture(scene, x, y, size, opening, result) {
  const group = scene.add.container(x, y), g = scene.add.graphics(), rx = size * 0.34, ry = size * 0.12, gap = opening * size / 90;
  g.fillStyle(0x0a1722).fillEllipse(0, -size * 0.09, rx * 2, ry * 2);
  for (let dx = -rx + gap; dx < rx; dx += gap) {
    const extent = ry * Math.sqrt(1 - (dx / rx) ** 2);
    g.lineStyle(1, 0xa5bac4).lineBetween(dx, -size * 0.09 - extent, dx, -size * 0.09 + extent);
  }
  for (let dy = -ry + gap / 2; dy < ry; dy += gap / 2) {
    const extent = rx * Math.sqrt(1 - (dy / ry) ** 2);
    g.lineStyle(1, 0xa5bac4).lineBetween(-extent, -size * 0.09 + dy, extent, -size * 0.09 + dy);
  }
  group.add(g);
  group.add(image(scene, 'science-sieve-frame', 0, 0, size, size * 0.54));
  const retained = result ? parts(result.outputs[1].amounts) : ['sand', 'stones'];
  if (retained.length) group.add(circuitSample(scene, retained, 0, -size * 0.1, size * 0.28));
  group.add(image(scene, 'science-recovery-tray', 0, size * 0.32, size * 0.9, size * 0.24));
  if (result) group.add(circuitSample(scene, parts(result.outputs[0].amounts), 0, size * 0.28, size * 0.33));
  return group;
}

function trialPicture(scene, side, x, y, size, nodes = scene.layer) {
  const c = FAIR_CASES[scene.round], method = c.trials[FAIR_SIDES.indexOf(side)], result = scene.state.trials[side];
  if (method.tool === 'decant') {
    const source = decantJar(scene, x - size * 0.2, y - size * 0.14, size * 0.58, size * 0.73, { angle: result ? 35 : 0, amount: result ? 20 : 100, source: true, settled: 2 });
    const receiver = decantJar(scene, x + size * 0.24, y + size * 0.22, size * 0.4, size * 0.52, { amount: result ? 80 : 0, dirty: Boolean(result?.outputs[0].amounts.sand) });
    nodes.add(source.group);
    if (result) nodes.add(decantStream(scene, source.lip, receiver.lip, true));
    nodes.add(receiver.group);
  } else if (method.tool === 'filter') nodes.add(filterPicture(scene, x, y, size, result));
  else if (method.tool === 'sieve') nodes.add(sievePicture(scene, x, y, size, method.opening, result));
  else {
    nodes.add(apparatus(scene, x, y, size, size, result ? 4 : 0));
    if (result) nodes.add(circuitSample(scene, ['vapor'], x, y - size * 0.47, size * 0.2));
  }
}

export function renderFairTest(scene) {
  const s = scene.state, c = FAIR_CASES[scene.round];
  scene.layer.add(panel(scene, 396, 391, 760, 488, { fill: 0x081b2b }));
  scene.layer.add(panel(scene, 1028, 391, 472, 488, { fill: 0x081b2b }));
  heading(scene, 396, 178, 'EQUAL STARTING SAMPLES', 24, 713);
  heading(scene, 1028, 178, 'RESULTS PANEL', 25, 430);
  plaque(scene, 134, 262, 187, 99, c.controls[0], 19);
  plaque(scene, 658, 262, 187, 99, c.controls[1], 19);
  scene.layer.add(circuitSample(scene, c.parts, 396, 253, 111));
  for (const [side, x] of [['A', 271], ['B', 521]]) {
    if (s.prepared) scene.layer.add(circuitSample(scene, c.parts, x, 270, 73));
    else scene.layer.add(glass(scene, x, 269, 69));
    qText(scene, x, 311, `TRIAL ${side}`, 15, '#f4deb6');
    scene.layer.add(supplyGlyph(scene, side === 'A' ? 327 : 465, 261, 'arrow', 0x67e8f3, 2).setAngle(side === 'A' ? 0 : 180));
  }
  scene.button('prepare', 396, 330, s.prepared ? 'EQUAL PORTIONS READY' : 'SPLIT EQUALLY', () => scene.perform('prepare'), { width: 281, height: 32, size: 18, enabled: scene.phase === 'playing' && !s.prepared, keepColorWhenDisabled: true, ...(s.prepared ? { fill: 0x32641f } : {}) });
  FAIR_SIDES.forEach((side, i) => {
    const x = 213 + i * 368, method = c.trials[i], result = s.trials[side];
    scene.layer.add(panel(scene, x, 488, 354, 282, { fill: 0x102436 }));
    scene.layer.add(scene.add.image(x, 482, 'science-workshop-backdrop').setDisplaySize(316, 198));
    scene.layer.add(scene.add.rectangle(x, 482, 316, 198, 0x07121c, 0.22));
    heading(scene, x, 365, `TRIAL ${side} - ${method.label}`, 21, 315);
    trialPicture(scene, side, x, method.tool === 'sieve' ? 470 : method.tool === 'decant' ? 484 : 476, method.tool === 'sieve' ? 239 : 172);
    if (method.tool === 'sieve') qText(scene, x, 393, 'Sand size 2  /  Stone size 6', 16, '#ffdf9b');
    else qText(scene, x, 574, result ? method.tool === 'evaporate' ? 'DRY SALT + WATER VAPOR' : method.tool === 'decant' ? 'LIQUID + SEDIMENT LEFT' : scene.round === 0 ? 'DAMP SAND + FILTRATE' : 'SALTWATER PASSES THROUGH' : 'READY TO RUN', 15, '#ffdf9b', 299);
    scene.button(`run-${side}`, x, 605, result ? 'RUN AGAIN' : 'RUN TRIAL', () => scene.perform('run', side), { width: 227, height: 41, size: 22, enabled: scene.phase === 'playing' && s.prepared });
  });
  resultsTable(scene);
  const both = FAIR_SIDES.every(side => s.trials[side]);
  heading(scene, 1028, 440, 'BEST FOR THIS GOAL', 21, 420);
  FAIR_SIDES.forEach((side, i) => scene.button(`choose-${side}`, 918 + i * 220, 468, `${side}: ${c.trials[i].label}`, () => scene.perform('choose', side), { width: 211, height: 36, size: 18, enabled: scene.phase === 'playing' && both, ...(s.selected === side ? { fill: 0x32641f } : { tone: 'choice' }) }));
  qHeading(scene, 843, 496, 'EVIDENCE', 14, '#67e8f3', 0, 'left');
  scene.button('evidence-menu', 1028, 525, c.evidence.find(e => e.id === s.evidence)?.text ?? 'CHOOSE EVIDENCE', () => scene.perform('evidence-menu', !s.evidenceOpen), { width: 437, height: 32, size: 16, enabled: scene.phase === 'playing' && both, tone: 'choice' });
  scene.layer.add(supplyGlyph(scene, 1226, 525, 'arrow', 0xffe4a8, 1).setAngle(-90));
}

function resultsTable(scene) {
  const c = FAIR_CASES[scene.round], s = scene.state, header = scene.round === 0 ? ['METHOD', 'LIQUID', 'SAND CARRIED'] : scene.round === 1 ? ['OPENING', 'PASSED THROUGH', 'STONES'] : ['METHOD', 'PRODUCT', 'OBSERVATION'];
  const g = scene.add.graphics().lineStyle(1, 0x92c4d4);
  g.strokeRect(816, 204, 424, 215).lineBetween(816, 238, 1240, 238).lineBetween(816, 328, 1240, 328).lineBetween(950, 204, 950, 419).lineBetween(1093, 204, 1093, 419);
  scene.layer.add(g);
  [883, 1022, 1167].forEach((x, i) => heading(scene, x, 221, header[i], 16, i === 0 ? 126 : 135));
  FAIR_SIDES.forEach((side, i) => {
    const y = 283 + i * 90, result = s.trials[side];
    qText(scene, 883, y - 14, side, 18, '#f4deb6');
    const name = qText(scene, 883, y + 10, c.trials[i].label, 16, '#f4deb6');
    if (name.width > 125) name.setFontSize(Math.floor(16 * 125 / name.width));
    if (!result) {
      qText(scene, 1022, y, 'NOT RUN', 18, '#bfd8ec');
      qText(scene, 1167, y, 'Awaiting\nobservation', 16, '#bfd8ec', 124);
      return;
    }
    const output = result.outputs[0].amounts;
    scene.layer.add(output.water ? glass(scene, 1022, y - 4, 62, output) : circuitSample(scene, parts(output), 1022, y - 6, 69));
    if (scene.round === 2) qText(scene, 1022, y + 31, output.water ? 'SALTWATER' : 'DRY SALT', 13, '#f4deb6');
    if (scene.round === 0 && output.sand) scene.layer.add(circuitSample(scene, ['sand'], 1167, y - 17, 45));
    else if (scene.round === 1) scene.layer.add(circuitSample(scene, ['stones'], 1167, y - 17, 31));
    else if (scene.round === 2) scene.layer.add(circuitSample(scene, [output.water ? 'water' : 'vapor'], 1167, y - 18, 30));
    fit(qText(scene, 1167, y + (scene.round === 0 && !output.sand ? 0 : 20), result.observation, 16, '#f4deb6', 133), 40);
  });
}

export function fairTestResults(scene) {
  const s = scene.state, success = scene.phase !== 'playing', both = FAIR_SIDES.every(side => s.trials[side]);
  scene.layer.add(panel(scene, 1028, 568, 437, 46, { fill: success ? 0x163e2a : 0x102436 }));
  const prompt = both ? s.selected && s.evidence ? 'Your choice and evidence are ready to check.' : 'Choose using the recorded outputs.' : s.prepared ? 'Run both trials to compare their outputs.' : 'Prepare equal portions, then run both trials.';
  fit(qText(scene, 1028, 568, s.message || prompt, 18, success ? '#e3f2be' : '#f5ead6', 401), 35);
  scene.button(success ? 'retry' : 'reset', 900, 615, success ? 'RETRY' : 'RESET', () => scene.resetRound(), { width: 176, height: 43, size: 23 });
  scene.button(success ? 'next' : 'check', 1136, 615, success ? scene.phase === 'finished' ? 'LESSON MAP' : 'NEXT CHALLENGE' : 'CHECK RESULT', () => success ? scene.nextRound() : scene.checkRound(), { width: 247, height: 43, size: 21, fill: 0x32641f, enabled: success || both });
  if (s.evidenceOpen && !success) {
    scene.layer.add(panel(scene, 1028, 421, 437, 149, { fill: 0x102436 }));
    FAIR_CASES[scene.round].evidence.forEach((e, i) => scene.button(`evidence-${e.id}`, 1028, 376 + i * 45, e.text, () => scene.perform('evidence', e.id), { width: 412, height: 43, size: 17, tone: 'choice' }));
  }
}

export function openFairTestHelp(scene) {
  if (scene.currentModal) return;
  scene.minigameHelpOpen = true;
  showModal(scene, { name: 'minigame-help', title: 'COMPARE USING FAIR TRIALS', width: 1120, height: 580, titleTop: 43, titleSize: 32, buttons: [], body: () => {
    const nodes = [supplyText(scene, 640, 144, 'Change the method or opening. Keep the starting samples comparable.', 22, '#67d8ee')];
    scene.gameDefinition.steps.forEach(([title, detail], i) => {
      const x = 294 + i * 346;
      nodes.push(panel(scene, x, 286, 326, 247, { fill: 0x102436 }));
      const heading = supplyHeading(scene, x, 188, title, 22, '#ffdf9b');
      if (heading.width > 288) heading.setFontSize(Math.floor(22 * 288 / heading.width)); nodes.push(heading);
      if (i === 0) { nodes.push(circuitSample(scene, FAIR_CASES[scene.round].parts, x - 51, 269, 74)); nodes.push(circuitSample(scene, FAIR_CASES[scene.round].parts, x + 51, 269, 74)); }
      else if (i === 1) nodes.push(filterPicture(scene, x, 268, 105, null));
      else { nodes.push(supplyGlyph(scene, x - 28, 263, 'check', 0x79d957, 4)); nodes.push(circuitSample(scene, ['sand'], x + 27, 267, 64)); }
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
