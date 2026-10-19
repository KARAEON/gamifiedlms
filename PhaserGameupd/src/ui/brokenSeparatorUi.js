import { SCIENCE_TOOLS } from '../config/scienceQuarterGames.js';
import { diagnosticObservation } from '../games/science/scienceLogic.js';
import { magnetPanel as panel, magnetControl as control } from './magnetWorkshopUi.js';
import { circuitSample, toolSprite } from './recoveryCircuitUi.js';
import { decantJar, decantStream } from './decantWorkshopUi.js';
import { qText, qZone, qHeading } from './scienceQuarterUi.js';
import { supplyGlyph, supplyText, supplyHeading } from './supplyCartUi.js';
import { closeOpenModal, showModal } from './ui.js';

const variableName = id => ({ opening: 'opening', tool: 'method', settled: 'settling', angle: 'tilt' }[id]);
const methodName = id => SCIENCE_TOOLS.find(t => t.id === id)?.label ?? id;

function image(scene, key, x, y, width, height = width, frame) {
  const texture = scene.textures.get(key);
  const node = scene.add.image(x, y, key, frame ?? (texture.has('trimmed') ? 'trimmed' : undefined));
  node.setScale(Math.min(width / node.width, height / node.height));
  return node;
}

// The grid changes with the chosen opening; outputs derive from recorded settings.
export function sievePicture(scene, x, y, width, opening, observed = true) {
  const group = scene.add.container(x, y), g = scene.add.graphics();
  const rx = width * 0.43, ry = width * 0.14, cy = -width * 0.04, gap = opening * width / 58;
  g.fillStyle(0x081523).fillEllipse(0, cy, rx * 2, ry * 2);
  g.lineStyle(Math.max(1, width / 160), 0xb4c6d0);
  for (let dx = -rx + gap; dx < rx; dx += gap) {
    const extent = ry * Math.sqrt(1 - (dx / rx) ** 2);
    g.lineBetween(dx, cy - extent, dx, cy + extent);
  }
  for (let dy = -ry + gap / 2; dy < ry; dy += gap / 2) {
    const extent = rx * Math.sqrt(1 - (dy / ry) ** 2);
    g.lineBetween(-extent, cy + dy, extent, cy + dy);
  }
  group.add(g); group.add(image(scene, 'science-sieve-frame', 0, 0, width, width * 0.49));
  if (!observed) return group;
  const output = diagnosticObservation(0, { opening });
  const grains = scene.add.graphics(), side = Math.max(2, width * 0.026);
  for (let i = 0; i < 23; i++) {
    const below = output.sandPasses && i > 6;
    const gx = ((i * 31) % 91 / 91 - 0.5) * width * 0.74;
    const gy = below ? width * (0.25 + (i % 5) * 0.018) : cy + (i % 5 - 2) * width * 0.033;
    grains.fillStyle(0x986320).fillRect(gx + 1, gy + 1, side, side);
    grains.fillStyle(0xf2b748).fillRect(gx, gy, side, side);
    grains.fillStyle(0xffe397).fillRect(gx, gy, side, Math.max(1, side / 3));
  }
  group.add(grains);
  for (let i = 0; i < 4; i++) {
    const below = output.stonesPass && i > 0;
    group.add(image(scene, 'science-pebble', (i - 1.5) * width * 0.19,
      below ? width * (0.28 + i % 2 * 0.025) : cy - width * 0.01 + i % 2 * width * 0.055, width * 0.15));
  }
  return group;
}

function experimentPicture(scene, round, settings, x, y, width) {
  if (round === 0) return sievePicture(scene, x, y, width, settings.opening);
  const group = scene.add.container();
  if (round === 1) {
    group.add(circuitSample(scene, ['salt', 'water'], x - width * 0.28, y - 4, width * 0.29));
    group.add(toolSprite(scene, settings.tool, x + width * 0.14, y + width * 0.035, width * 0.51));
    const arrows = scene.add.graphics().fillStyle(0xffce58);
    arrows.fillRect(x - width * 0.1, y - 8, width * 0.08, 5);
    arrows.fillTriangle(x + width * 0.02, y - 6, x - width * 0.025, y - 17, x - width * 0.025, y + 5);
    group.add(arrows);
    if (settings.tool === 'evaporate') {
      group.add(circuitSample(scene, ['salt'], x - width * 0.16, y + width * 0.29, width * 0.23));
      group.add(circuitSample(scene, ['vapor'], x + width * 0.19, y + width * 0.29, width * 0.2));
    } else group.add(circuitSample(scene, ['salt', 'water'], x, y + width * 0.29, width * 0.25));
  } else {
    const observation = diagnosticObservation(round, settings), pours = settings.angle >= 10;
    const source = decantJar(scene, x - width * 0.2, y - 8, width * 0.34, width * 0.45,
      { source: true, angle: settings.angle, settled: settings.settled, amount: pours ? 60 : 100 });
    const receiver = decantJar(scene, x + width * 0.28, y + width * 0.08, width * 0.23, width * 0.34,
      { amount: pours ? 40 : 0, dirty: pours && !observation.success });
    group.add(source.group);
    if (pours) group.add(decantStream(scene, source.lip, receiver.lip, !observation.success));
    group.add(receiver.group);
  }
  return group;
}

function settingsLabel(round, settings) {
  return round === 0 ? `OPENING ${settings.opening}` : round === 1 ? methodName(settings.tool)
    : `SETTLING ${settings.settled}/3 · TILT ${settings.angle}°`;
}

function badge(scene, x, y, success) {
  const group = scene.add.container(x, y);
  group.add(scene.add.circle(0, 0, 13, success ? 0x2c9a53 : 0xac3e49).setStrokeStyle(2, success ? 0x87e69e : 0xed939a));
  group.add(supplyGlyph(scene, 0, 0, success ? 'check' : 'cross', 0xfff4df, 1.5));
  return group;
}

export function renderBrokenSeparator(scene) {
  const s = scene.state, playing = scene.phase === 'playing', last = s.tests.at(-1);
  scene.layer.add(panel(scene, 420, 391, 808, 488, { fill: 0x102436 }));
  for (const [i, x] of [238, 618].entries()) {
    const recorded = i ? s.tests.length > 1 ? last : null : s.tests[0];
    scene.layer.add(panel(scene, x, 317, 376, 307, { fill: 0x081b2b, edge: 0x276386 }));
    scene.layer.add(scene.add.rectangle(x, 181, 335, 33, 0x124667).setStrokeStyle(2, 0x286b90));
    qHeading(scene, x, 181, i ? 'LATEST TEST' : 'FAILED BASELINE', 23, '#67d8ee');
    if (recorded) {
      scene.layer.add(panel(scene, x, 225, 321, 40, { fill: 0xe9cf98 }));
      const label = qText(scene, x, 225, settingsLabel(scene.round, recorded), 22, '#292116');
      if (label.width > 280) label.setFontSize(Math.floor(22 * 280 / label.width));
      scene.layer.add(experimentPicture(scene, scene.round, recorded, x, scene.round === 2 ? 322 : 309, scene.round === 2 ? 309 : 288));
      qText(scene, x, 442, diagnosticObservation(scene.round, recorded).detail, 17, recorded.success ? '#a8ef82' : '#edb1a4', 319);
    } else {
      scene.layer.add(toolSprite(scene, scene.round === 0 ? 'sieve' : scene.round === 1 ? 'filter' : 'decant', x, 294, 100).setAlpha(0.4));
      qText(scene, x, 394, 'NO TEST YET\nChange one variable,\nthen run a controlled test.', 20, '#c5d3e1', 310);
    }
  }

  if (scene.round === 0) {
    scene.layer.add(circuitSample(scene, ['sand'], 120, 547, 82));
    scene.layer.add(circuitSample(scene, ['stones'], 251, 545, 91));
    scene.layer.add(sievePicture(scene, 435, 542, 211, s.opening, false));
    for (const [x, label, width] of [[111, 'GRAIN SIZE 2', 134], [256, 'STONE SIZE 6', 134], [435, `OPENING ${s.opening}`, 184]]) {
      scene.layer.add(panel(scene, x, 605, width, 33, { fill: 0xe9cf98 })); qText(scene, x, 605, label, 17, '#292116');
    }
    scene.button('opening-less', 622, 531, '- SMALLER', () => scene.perform('opening', -1), { width: 143, height: 51, size: 21, enabled: playing && s.opening > 1 });
    scene.button('opening-more', 758, 531, '+ LARGER', () => scene.perform('opening', 1), { width: 127, height: 51, size: 21, enabled: playing && s.opening < 10 });
    scene.button('test', 689, 599, 'RUN CONTROLLED TEST', () => scene.perform('test'), { width: 266, height: 52, size: 22, enabled: playing });
  } else if (scene.round === 1) {
    scene.layer.add(circuitSample(scene, ['salt', 'water'], 112, 541, 94));
    qText(scene, 112, 603, 'SALTWATER', 17, '#ffce58');
    SCIENCE_TOOLS.forEach((tool, i) => {
      const x = 256 + i * 122, selected = s.tool === tool.id;
      scene.layer.add(panel(scene, x, 541, 119, 103, { fill: selected ? 0x153c2a : 0x081b2b, edge: selected ? 0xffce58 : 0x276386 }));
      qText(scene, x, 508, tool.label, 16);
      scene.layer.add(toolSprite(scene, tool.id, x, 545, 51));
      qText(scene, x, 579, selected ? 'SELECTED' : 'SELECT', 12, selected ? '#b5e748' : '#9db7c9');
      qZone(scene, `tool-${tool.id}`, x, 541, 119, 103, () => scene.perform('tool', tool.id));
    });
    scene.button('test', 526, 617, 'RUN CONTROLLED TEST', () => scene.perform('test'), { width: 490, height: 35, size: 23, enabled: playing });
  } else {
    scene.layer.add(decantJar(scene, 124, 540, 68, 96, { source: true, settled: s.settled, angle: 0, amount: 100 }).group);
    qText(scene, 258, 511, `SETTLING ${s.settled} / 3`, 20, '#67d8ee');
    qText(scene, 258, 540, s.settled >= 2 ? 'SAND SETTLED' : 'STILL SUSPENDED', 15, '#fff0d6');
    scene.button('settle', 255, 582, 'MORE SETTLING', () => scene.perform('settled', 1), { width: 224, height: 43, size: 21, enabled: playing && s.settled < 3 });
    qText(scene, 596, 508, `TILT ${s.angle}°`, 23, '#67d8ee');
    scene.button('angle-less', 478, 551, '- TILT', () => scene.perform('angle', -10), { width: 167, height: 43, size: 22, enabled: playing && s.angle > 0 });
    scene.button('angle-more', 701, 551, '+ TILT', () => scene.perform('angle', 10), { width: 167, height: 43, size: 22, enabled: playing && s.angle < 50 });
    scene.button('test', 590, 610, 'RUN CONTROLLED TEST', () => scene.perform('test'), { width: 392, height: 39, size: 23, enabled: playing });
  }

  scene.layer.add(panel(scene, 1050, 391, 428, 488, { fill: 0x081b2b }));
  qHeading(scene, 1050, 179, 'TEST LOG', 25, '#67d8ee');
  if (scene.diagnosticLogCount !== s.tests.length) { scene.diagnosticLogCount = s.tests.length; scene.diagnosticLogIndex = s.tests.length - 1; }
  const viewed = s.tests[scene.diagnosticLogIndex];
  [s.tests[0], s.tests.length > 1 ? viewed : null].forEach((recorded, i) => {
    const y = i ? 395 : 269;
    scene.layer.add(panel(scene, 1050, y, 389, i ? 124 : 109, { fill: 0x102436, edge: 0x276386 }));
    if (!recorded) { qText(scene, 1050, y, 'No test recorded yet.\nCompare one change with the baseline.', 18, '#9db7c9', 338); return; }
    scene.layer.add(experimentPicture(scene, scene.round, recorded, 910, y - 12, 78));
    scene.layer.add(badge(scene, 974, y - 29, recorded.success));
    const label = qText(scene, 1112, y - 29, `${recorded.label}: ${recorded.success ? 'WORKING' : 'FAILED'}`, 19, recorded.success ? '#a8ef82' : '#f2a197');
    if (label.width > 249) label.setFontSize(Math.floor(19 * 249 / label.width));
    qText(scene, 1111, y + 6, `${settingsLabel(scene.round, recorded)}\n${diagnosticObservation(scene.round, recorded).detail}`, 15, '#afd4e9', 250);
    if (i) qText(scene, 1111, y + 48, `Changed: ${variableName(recorded.changed)}`, 15, '#c5b3ef', 249);
  });
  if (s.tests.length > 2) {
    const choose = delta => { scene.diagnosticLogIndex = Math.max(1, Math.min(s.tests.length - 1, scene.diagnosticLogIndex + delta)); scene.render(); };
    scene.button('log-previous', 1166, 469, '<', () => choose(-1), { width: 38, height: 25, size: 20, enabled: scene.diagnosticLogIndex > 1 });
    scene.button('log-next', 1211, 469, '>', () => choose(1), { width: 38, height: 25, size: 20, enabled: scene.diagnosticLogIndex < s.tests.length - 1 });
    qText(scene, 991, 469, `VIEWING TEST ${scene.diagnosticLogIndex} / ${s.tests.length - 1}`, 13, '#9db7c9');
  }
}

export function brokenSeparatorResults(scene) {
  const s = scene.state, complete = scene.phase !== 'playing', last = s.tests.at(-1);
  scene.layer.add(panel(scene, 1050, 532, 385, 91, { fill: 0xe9cf98 }));
  scene.layer.add(scene.add.image(911, 534, 'supply-guide').setDisplaySize(70, 84));
  const quote = s.changes.length > 1 ? 'Two variables changed. Undo one change, or reset before testing.'
    : s.changes.length ? `Pending: ${variableName(s.changes[0])}. Run a test to observe its output.`
      : s.message && !last.success ? 'Change one variable. Run a test and compare the outputs.'
        : last.success ? diagnosticObservation(scene.round, last).benefit
          : scene.round === 2 && s.tests.length > 1 ? 'This change alone did not fix it. Test another single change.' : 'Inspect the failed baseline. Change one variable, then test it.';
  const text = qText(scene, 1100, 533, quote, 18, '#292116', 252);
  for (let size = 17; text.height > 70 && size >= 14; size--) text.setFontSize(size);
  scene.button(complete ? 'retry' : 'reset', 920, 607, complete ? 'RETRY' : 'RESET', () => scene.resetRound(), { width: 138, height: 48, size: 24 });
  scene.button(complete ? 'next' : 'check', 1112, 607, complete ? scene.phase === 'finished' ? 'LESSON MAP' : 'NEXT CHALLENGE' : 'CHECK RESULT', () => complete ? scene.nextRound() : scene.checkRound(), { width: 232, height: 48, size: 23, fill: 0x32641f });
}

export function openBrokenSeparatorHelp(scene) {
  if (scene.currentModal) return;
  scene.minigameHelpOpen = true;
  showModal(scene, { name: 'minigame-help', title: 'HOW TO PLAY', width: 1120, height: 580, titleTop: 43, titleSize: 33, buttons: [], body: () => {
    const nodes = [], text = (x, y, label, size = 20, color = '#fff0d6', width = 0, role = 'body') => {
      const t = (role === 'heading' ? supplyHeading : supplyText)(scene, x, y, label, size, color); if (width) t.setWordWrapWidth(width, true); nodes.push(t);
    };
    text(640, 145, 'Keep the failed baseline. Change one variable and inspect the evidence.', 22, '#67d8ee');
    for (let i = 0; i < 3; i++) {
      const x = 294 + i * 346;
      nodes.push(panel(scene, x, 299, 326, 279, { fill: 0x102436 }));
      text(x, 187, ['1. INSPECT FAILURE', '2. CHANGE ONE VARIABLE', '3. COMPARE OUTPUTS'][i], 21, '#b5e748', 0, 'heading');
      nodes.push(sievePicture(scene, x, 276, 184, i ? 4 : 9));
      text(x, 215, i ? 'OPENING 4' : 'BASELINE: OPENING 9', 17, '#ffce58');
      text(x, 397, ['Opening 9 passes both materials.\nThe useful sand stays mixed.', 'Adjust the opening only.\nSeveral clicks on one control\nstill change one variable.', 'Run the test. Compare outputs.\nCheck Result when the useful\nproduct is restored.'][i], 18, '#fff0d6', 285);
    }
    nodes.push(panel(scene, 640, 505, 1054, 118, { fill: 0x142e21 }));
    nodes.push(scene.add.image(182, 505, 'supply-guide').setDisplaySize(75, 90));
    text(700, 470, 'SCIENTIST NOTE', 23, '#ffce58', 0, 'heading');
    text(700, 508, 'Change one variable between recorded tests. A failed test is evidence for your next change.\nFor pouring, test settling first, then test tilt while keeping settling unchanged.', 18, '#fff0d6', 851);
    text(700, 548, 'Dissolved salt passes through filter paper. Separate liquid is not automatically safe to drink.', 17, '#c5b3ef', 851);
    nodes.push(control(scene, 640, 611, 'GOT IT', () => { scene.minigameHelpOpen = false; closeOpenModal(scene); scene.updateTestState(); }, { width: 180, height: 50, fill: 0x32641f }));
    return nodes;
  } });
  scene.updateTestState();
}
