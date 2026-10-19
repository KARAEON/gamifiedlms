import { KIT_CASES, KIT_CAPACITY } from '../games/science/recoveryKitLogic.js';
import { SCIENCE_TOOLS } from '../config/scienceQuarterGames.js';
import { magnetPanel as panel, magnetControl } from './magnetWorkshopUi.js';
import { qText, qHeading, qZone } from './scienceQuarterUi.js';
import { supplyText, supplyHeading, supplyGlyph } from './supplyCartUi.js';
import { circuitSample, toolSprite } from './recoveryCircuitUi.js';
import { mysteryJar } from './mysterySampleUi.js';
import { apparatus as evaporationApparatus } from './evaporationWorkshopUi.js';
import { closeOpenModal, showModal } from './ui.js';

const names = { magnet: 'MAGNET', sieve: 'SIEVING', filter: 'FILTRATION', evaporate: 'EVAPORATION', decant: 'DECANTATION' };
const productName = parts => parts.join('+') === 'salt+water' ? 'SALTWATER' : parts.map(p => ({ salt: 'DRY SALT', stones: 'PEBBLES', vapor: 'WATER VAPOR' }[p] ?? p.toUpperCase())).join(' + ');

function image(scene, key, x, y, width, height = width, frame) {
  const texture = scene.textures.get(key);
  const node = scene.add.image(x, y, key, frame ?? (texture.has('trimmed') ? 'trimmed' : undefined));
  return node.setScale(Math.min(width / node.width, height / node.height));
}

function fit(text, width) {
  if (text.width > width) text.setFontSize(Math.floor(parseFloat(text.style.fontSize) * width / text.width));
  return text;
}

function filterModule(scene, x, y, size, used) {
  const group = scene.add.container(x, y);
  group.add(image(scene, 'science-filter-stand', 0, 0, size * 0.83, size));
  if (used) {
    const water = scene.add.graphics();
    water.fillStyle(0x54badd, 0.85).fillRect(-size * 0.115, size * 0.23, size * 0.23, size * 0.16);
    water.lineStyle(2, 0xb6efff).lineBetween(-size * 0.115, size * 0.23, size * 0.115, size * 0.23);
    group.add(water);
  }
  group.add(image(scene, 'science-filter-beaker', 0, size * 0.27, size * 0.36, size * 0.4));
  group.add(image(scene, 'science-filter-funnel', 0, -size * 0.24, size * 0.59, size * 0.56));
  if (used) group.add(image(scene, 'general-sand-mound', 0, -size * 0.34, size * 0.25, size * 0.12, 'sieve-trimmed'));
  return group;
}

function modulePicture(scene, tool, x, y, size, step = null) {
  if (tool === 'filter') return filterModule(scene, x, y, size, Boolean(step?.effective));
  if (tool === 'evaporate') {
    const group = evaporationApparatus(scene, x, y, size, size, step?.effective ? 4 : 0);
    // Evaporation before filtration leaves BOTH solids, not purified salt.
    if (step?.input.includes('sand')) group.add(image(scene, 'general-sand-mound', -size * 0.1, -size * 0.08, size * 0.22, size * 0.1, 'sieve-trimmed'));
    return group;
  }
  const group = toolSprite(scene, tool, x, y - (step?.effective ? size * 0.13 : 0), size * 0.8);
  if (step?.effective) group.add(circuitSample(scene, [tool === 'magnet' ? 'iron' : 'sand'], 0, size * 0.43, size * 0.55));
  return group;
}

function plaque(scene, x, y, width, height, text, size = 20) {
  scene.layer.add(panel(scene, x, y, width, height, { fill: 0xe9cf98 }));
  return qText(scene, x, y, text, size, '#292116', width - 36);
}

function badge(scene, x, y, number) {
  const group = scene.add.container(x, y);
  group.add(scene.add.circle(0, 0, 17, 0x10324a).setStrokeStyle(2, 0x67e8f3));
  group.add(supplyText(scene, 0, 0, `${number}`, 23, '#f6edcf'));
  return group;
}

export function renderRecoveryKit(scene) {
  const s = scene.state, c = KIT_CASES[scene.round];
  scene.layer.add(panel(scene, 396, 391, 760, 488, { fill: 0x081b2b }));
  scene.layer.add(panel(scene, 1028, 391, 472, 488, { fill: 0x081b2b }));
  scene.layer.add(scene.add.image(396, 352, 'science-workshop-backdrop').setDisplaySize(720, 297));
  scene.layer.add(scene.add.rectangle(396, 352, 720, 297, 0x08131d, 0.16));
  qHeading(scene, 396, 178, 'EQUIPMENT BENCH', 25, '#67e8f3');
  qHeading(scene, 1028, 178, 'TRIAL RESULTS', 25, '#67e8f3');

  if (scene.round === 2) scene.layer.add(mysteryJar(scene, 1, 175, 328, 248, true));
  else {
    scene.layer.add(image(scene, 'science-sample-tray', 175, 374, 235, 85));
    scene.layer.add(circuitSample(scene, c.input, 175, 346, 153));
  }
  plaque(scene, 175, 469, 249, 53, `INPUT:\n${c.label}`, 18);
  scene.layer.add(panel(scene, 535, 247, 413, 94, { fill: 0xe9cf98 }));
  qText(scene, 535, 216, 'Recover these products:', 20, '#292116');
  c.goals.forEach((goal, i) => {
    const x = c.goals.length === 1 ? 535 : 444 + i * 182;
    scene.layer.add(scene.add.rectangle(x, 250, 132, 39, 0x30231e));
    scene.layer.add(circuitSample(scene, [goal], x, 247, goal === 'iron' ? 42 : 72));
    qText(scene, x, 279, productName([goal]), 19, '#292116');
  });

  scene.layer.add(image(scene, 'science-kit-case', 535, 400, 451, 226));
  for (let i = 0; i < KIT_CAPACITY; i++) {
    const x = 435 + i * 200, tool = s.kit[i];
    if (tool) {
      scene.layer.add(modulePicture(scene, tool, x, 384, 132));
      plaque(scene, x, 468, 183, 30, names[tool], 18);
      qZone(scene, `remove-${i}`, x, 402, 180, 178, () => scene.perform('module', tool));
    } else {
      qText(scene, x, 375, '+', 37, '#67d8ee');
      qText(scene, x, 412, 'PACK A MODULE', 16, '#f5deb0');
    }
    scene.layer.add(badge(scene, x - 63, 349, i + 1));
  }
  if (s.kit.length === 2) scene.button('swap', 535, 313, 'SWAP ORDER', () => scene.perform('swap'), { width: 148, height: 29, size: 16, enabled: scene.phase === 'playing', tone: 'choice' });
  else qText(scene, 535, 310, 'PACK ONLY WHAT YOU NEED', 14, '#ffdf9b');

  qHeading(scene, 173, 506, 'AVAILABLE MODULES', 21, '#67e8f3');
  qText(scene, 605, 506, 'Tap again to remove', 16, '#f4dab0');
  SCIENCE_TOOLS.forEach((tool, i) => {
    const x = 105 + i * 146, selected = s.kit.includes(tool.id);
    scene.layer.add(panel(scene, x, 563, 139, 82, { fill: selected ? 0x10334a : 0x101e2e }));
    if (selected) scene.layer.add(scene.add.rectangle(x, 563, 127, 72).setStrokeStyle(3, 0x67e8f3));
    scene.layer.add(toolSprite(scene, tool.id, x, 550, 54));
    plaque(scene, x, 588, 129, 24, tool.label, 16);
    qZone(scene, `module-${tool.id}`, x, 563, 139, 82, () => scene.perform('module', tool.id));
  });
  scene.button('trial', 396, 622, 'TRIAL KIT', () => scene.perform('trial'), { width: 300, height: 32, size: 22, enabled: scene.phase === 'playing' && s.kit.length > 0 });

  plaque(scene, 1028, 224, 437, 42, `KIT SLOTS: ${s.kit.length}/${KIT_CAPACITY}`, 24);
  for (let i = 0; i < 2; i++) resultCard(scene, i);
}

function resultCard(scene, index) {
  const s = scene.state, x = 916 + index * 224;
  const step = s.trial?.steps[index], tool = s.kit[index];
  // A one-module trial also shows the material left behind.
  const remainder = index === 1 && s.trial?.steps.length === 1 && s.trial.steps[0].effective ? s.trial.steps[0].outputs[1] : null;
  scene.layer.add(panel(scene, x, 357, 210, 216, { fill: 0x102436 }));
  plaque(scene, x, 270, 203, 33, remainder ? 'LEFT BEHIND' : tool ? names[tool] : 'UNUSED SLOT', 18);
  if (tool) scene.layer.add(modulePicture(scene, tool, x, 360, 135, step));
  else if (remainder) scene.layer.add(circuitSample(scene, remainder.parts, x, 354, 112));
  else {
    qText(scene, x, 339, `${index + 1}`, 47, '#67d8ee');
    qText(scene, x, 391, 'Only pack a module\nif it helps the goal.', 17, '#f3dfb9', 176);
  }
  const output = step?.effective ? step.outputs.find(o => o.parts.some(p => KIT_CASES[scene.round].goals.includes(p))) ?? step.outputs[0] : remainder;
  const label = output ? productName(output.parts) : step ? 'NOT RECOVERED' : tool ? 'AWAITING TRIAL' : 'NO MODULE';
  fit(plaque(scene, x, 447, 204, 32, label, 19), 173);
  let detail = '';
  if (remainder) detail = scene.round === 0 ? 'Sand remains separate from the recovered iron.' : 'Larger pebbles stay on the sieve.';
  else if (step && !step.effective) detail = tool === 'decant' ? 'Some liquid stays with sediment; this trial does not fully recover the products.' : 'This module cannot separate the remaining sample.';
  else if (step) detail = tool === 'magnet' ? 'Iron follows the magnet. Sand stays behind.' : tool === 'sieve' ? 'Fine sand passes through the mesh.' : tool === 'filter' ? 'Damp sand stays on the paper; saltwater passes through.' : step.input.includes('sand') ? 'Sand and salt remain mixed in the dish.' : 'Water leaves as vapor, leaving dry salt.';
  else detail = tool ? 'Run Trial Kit to see what this module recovers.' : 'An unused slot is fine when one module is enough.';
  const text = qText(scene, x, 496, detail, 18, '#f5ead6', 189);
  for (let size = 17; text.height > 58 && size >= 15; size--) text.setFontSize(size);
  if (index === 0 && s.trial?.steps.length === 2) scene.layer.add(supplyGlyph(scene, 1028, 353, 'arrow', 0x67e8f3, 3).setAngle(180));
}

export function recoveryKitResults(scene) {
  const success = scene.phase !== 'playing';
  scene.layer.add(panel(scene, 1028, 560, 437, 61, { fill: success ? 0x163e2a : 0xe9cf98 }));
  const text = qText(scene, 1028, 560, scene.state.message || 'Choose modules for the requested products. Trial your kit, then check the result.', 18, success ? '#e3f2be' : '#292116', 397);
  for (let size = 17; text.height > 49 && size >= 14; size--) text.setFontSize(size);
  scene.button(success ? 'retry' : 'reset', 897, 614, success ? 'RETRY' : 'RESET', () => scene.resetRound(), { width: 171, height: 43, size: 23 });
  scene.button(success ? 'next' : 'check', 1131, 614, success ? scene.phase === 'finished' ? 'LESSON MAP' : 'NEXT CHALLENGE' : 'CHECK RESULT', () => success ? scene.nextRound() : scene.checkRound(), { width: 255, height: 43, size: 22, fill: 0x32641f });
}

export function openRecoveryKitHelp(scene) {
  if (scene.currentModal) return;
  scene.minigameHelpOpen = true;
  showModal(scene, { name: 'minigame-help', title: 'PACK A RECOVERY KIT', width: 1120, height: 580,
    titleTop: 43, titleSize: 33, buttons: [], body: () => {
      const nodes = [supplyText(scene, 640, 144, 'Choose tools for the products you need. Every module must help.', 22, '#67d8ee')];
      scene.gameDefinition.steps.forEach(([heading, detail], i) => {
        const x = 294 + i * 346;
        nodes.push(panel(scene, x, 286, 326, 247, { fill: 0x102436 }));
        nodes.push(supplyHeading(scene, x, 188, heading, 22, '#ffdf9b'));
        if (i === 0) nodes.push(circuitSample(scene, ['iron', 'sand'], x, 268, 100));
        else if (i === 1) { nodes.push(image(scene, 'science-kit-case', x, 261, 215, 107)); nodes.push(toolSprite(scene, 'magnet', x - 45, 253, 54)); }
        else nodes.push(filterModule(scene, x, 268, 102, true));
        const text = supplyText(scene, x, 364, detail, 18, '#efdfb8').setWordWrapWidth(282, true);
        for (let size = 17; text.height > 80 && size >= 16; size--) text.setFontSize(size);
        nodes.push(text);
      });
      nodes.push(panel(scene, 640, 495, 1054, 150, { fill: 0x15301f }));
      nodes.push(supplyHeading(scene, 640, 443, 'SCIENTIST NOTE', 24, '#ffdf9b'));
      nodes.push(supplyText(scene, 640, 506, scene.gameDefinition.tip, 21, '#efdfb8').setWordWrapWidth(974, true));
      nodes.push(magnetControl(scene, 640, 611, 'GOT IT', () => { scene.minigameHelpOpen = false; closeOpenModal(scene); scene.updateTestState(); }, { width: 180, height: 50, fill: 0x32641f }));
      return nodes;
    } });
  scene.updateTestState();
}
