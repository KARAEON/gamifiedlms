import { MYSTERY_CASES, MYSTERY_COMPONENTS, MYSTERY_TYPES } from '../games/science/mysterySampleLogic.js';
import { magnetPanel as panel, magnetControl } from './magnetWorkshopUi.js';
import { qText, qHeading } from './scienceQuarterUi.js';
import { supplyText, supplyHeading, supplyGlyph } from './supplyCartUi.js';
import { closeOpenModal, showModal } from './ui.js';

function sprite(scene, key, x, y, width, height = width) {
  const texture = scene.textures.get(key);
  const node = scene.add.image(x, y, key, texture.has('trimmed') ? 'trimmed' : undefined);
  return node.setScale(Math.min(width / node.width, height / node.height));
}

// Contents are state-driven and drawn beneath the transparent glass artwork.
export function mysteryJar(scene, round, x, y, height, settled = false) {
  const width = height * 2 / 3, group = scene.add.container(x, y), g = scene.add.graphics();
  const left = -width * 0.36, bottom = height * 0.405, surface = -height * 0.03;
  if (round < 2) {
    g.fillStyle(round === 1 && !settled ? 0x78acb5 : 0x54badd, 0.75).fillRect(left, surface, width * 0.72, bottom - surface);
    g.lineStyle(Math.max(1, height / 120), 0xa6eeff).lineBetween(left, surface, -left, surface);
  }
  if (round > 0) {
    const bedHeight = height * (round === 2 ? 0.21 : settled ? 0.15 : 0.035);
    g.fillStyle(0xd6a451).fillRect(left, bottom - bedHeight, width * 0.72, bedHeight);
    for (let i = 0; i < 220; i++) {
      const dx = left + 2 + ((i * 43) % 197) / 197 * (width * 0.72 - 4);
      const dy = bottom - ((i * 61) % 211) / 211 * (round === 1 && !settled ? bottom - surface - 4 : bedHeight - 2);
      const size = Math.max(1, height / 110);
      g.fillStyle([0xffdf9b, 0xbe7b37, 0xf2c46e, 0x91652e][i % 4]).fillRect(dx, dy, size, size);
    }
    if (round === 2) for (let i = 0; i < 7; i++) {
      const nail = sprite(scene, 'science-iron-nail', left + 12 + (i * 23) % (width * 0.62), bottom - 13 - (i * 17) % (bedHeight - 12), height * 0.085);
      group.add(nail.setAngle(i * 27));
    }
  }
  group.addAt(g, 0);
  group.add(sprite(scene, 'science-mystery-jar', 0, 0, width, height));
  return group;
}

function inspection(scene, round, x, y, size, revealed = true) {
  const group = scene.add.container(x, y);
  group.add(scene.add.rectangle(0, 0, size, size, 0x113344).setStrokeStyle(2, 0x67d8ee));
  if (!revealed) {
    group.add(supplyText(scene, 0, -11, '?', size * 0.34, '#67d8ee'));
    group.add(supplyText(scene, 0, size * 0.29, 'INSPECT A PORTION', size * 0.09, '#efdfb8'));
  } else if (round === 0) {
    group.add(scene.add.rectangle(0, 0, size - 6, size - 6, 0x56b3da));
    const g = scene.add.graphics();
    g.lineStyle(2, 0xb5e9f6, 0.7).lineBetween(-size * 0.33, -size * 0.34, -size * 0.33, size * 0.32);
    group.add(g);
    group.add(supplyText(scene, 0, 0, 'NO VISIBLE\nGRAINS', size * 0.14, '#102135'));
  } else {
    group.add(scene.add.image(0, 0, 'science-mystery-grains').setDisplaySize(size - 6, size - 6));
    if (round === 2) for (let i = 0; i < 4; i++) group.add(sprite(scene, 'science-iron-nail', (i % 2 ? 1 : -1) * size * 0.22, (i < 2 ? -1 : 1) * size * 0.24, size * 0.4).setAngle(i * 28 - 20));
  }
  return group;
}

function actionIcon(scene, name, selected) {
  if (name === 'magnet') return sprite(scene, 'science-magnet', 0, 0, 37);
  const color = selected ? 0xd6f4ff : 0x173b55;
  const g = scene.add.graphics();
  if (name === 'stir') {
    g.lineStyle(5, color);
    g.beginPath().arc(0, 0, 16, -Math.PI * 0.9, -Math.PI * 0.1, false).strokePath();
    g.beginPath().arc(0, 0, 16, Math.PI * 0.1, Math.PI * 0.9, false).strokePath();
    g.fillStyle(color).fillTriangle(18, -1, 5, -9, 21, -14).fillTriangle(-18, 1, -5, 9, -21, 14);
    return g;
  }
  g.lineStyle(4, color).strokeCircle(0, name === 'inspect' ? -3 : 0, 15);
  if (name === 'inspect') {
    g.lineStyle(7, color).lineBetween(-10, 9, -25, 25);
    g.fillStyle(0x67d8ee, 0.55).fillCircle(0, -3, 11);
  } else g.lineBetween(0, -10, 0, 0).lineBetween(0, 0, 9, 0);
  return g;
}

function paperButton(scene, id, x, y, label, action, { width = 210, height = 48, selected = false, icon = null, dropdown = false, size = 22 } = {}) {
  const group = scene.add.container(x, y), g = scene.add.graphics();
  const left = -width / 2, top = -height / 2;
  g.fillStyle(0x080d17).fillRect(left - 3, top - 3, width + 6, height + 8);
  g.fillStyle(selected ? 0x123650 : 0xf4d89e).fillRect(left, top, width, height);
  g.lineStyle(selected ? 3 : 2, selected ? 0x67ecff : 0xc3984f).strokeRect(left + 2, top + 2, width - 4, height - 4);
  g.lineStyle(1, 0xffedc5).strokeRect(left + 6, top + 6, width - 12, height - 12);
  group.add(g);
  if (icon) group.add(actionIcon(scene, icon, selected).setPosition(left + 38, 0));
  const t = supplyText(scene, icon ? 23 : dropdown ? -9 : 0, 0, label, size, selected ? '#f8f1df' : '#292116');
  const textWidth = width - (icon ? 82 : dropdown ? 40 : 24);
  if (t.width > textWidth) t.setFontSize(Math.floor(size * textWidth / t.width));
  group.add(t);
  if (dropdown) {
    const arrow = scene.add.graphics();
    arrow.fillStyle(0x292116).fillTriangle(width / 2 - 28, -4, width / 2 - 12, -4, width / 2 - 20, 5); group.add(arrow);
  }
  const zone = scene.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
  zone.on('pointerup', () => { if (!scene.currentModal && scene.phase === 'playing') action(); });
  zone.on('pointerover', () => { if (!scene.currentModal && scene.phase === 'playing') group.setScale(1.02); });
  zone.on('pointerout', () => group.setScale(1));
  if (scene.phase !== 'playing') zone.disableInteractive();
  group.add(zone); scene.layer.add(group); group.setData('testId', id);
  scene.controlViews.push({ id, x, y, width, height });
  return group;
}

const notebook = { left: 800, fieldX: 1104, fieldWidth: 264 };

function flatSurface(scene, x, y, width, height, fill, edge) {
  const node = scene.add.rectangle(x, y, width, height, fill);
  if (edge) node.setStrokeStyle(1, edge);
  scene.layer.add(node);
  return node;
}

export function renderMysterySample(scene) {
  const s = scene.state, c = MYSTERY_CASES[scene.round], round = scene.round;
  scene.layer.add(panel(scene, 388, 391, 744, 488, { fill: 0x081b2b }));
  scene.layer.add(panel(scene, 1018, 391, 492, 488, { fill: 0x081b2b }));
  qHeading(scene, 388, 180, 'SAMPLE INVESTIGATION', 23, '#67e8f3');
  qHeading(scene, 1018, 180, 'EVIDENCE NOTEBOOK', 22, '#67e8f3');
  // A window onto the same workshop puts the apparatus back on the bench.
  const backdrop = sprite(scene, 'science-workshop-backdrop', 388, 375, 1100, 619);
  const maskShape = scene.make.graphics({ x: 0, y: 0, add: false }).fillStyle(0xffffff).fillRect(40, 208, 696, 316);
  backdrop.setMask(maskShape.createGeometryMask()); scene.layer.add(backdrop);
  scene.layer.add(maskShape.setVisible(false)); // Own the mask source so render/shutdown destroys it.
  flatSurface(scene, 388, 366, 696, 316, 0x081b2b).setAlpha(0.36);
  qText(scene, 208, 230, round === 2 ? 'DRY WORKSHOP SAMPLE' : s.settled ? 'AFTER RESTING' : 'WORKSHOP SAMPLE', 17, '#ffdf9b');
  scene.layer.add(mysteryJar(scene, round, 208, 382, 270, s.settled));
  flatSurface(scene, 548, 326, 344, 212, 0x102436, 0x466072);
  qText(scene, 456, 242, round === 2 ? 'BEFORE THE TEST' : 'EARLIER (STIRRED)', 16, '#efdfb8');
  scene.layer.add(mysteryJar(scene, round, 456, 346, 156, false));
  qText(scene, 632, 242, 'ENLARGED VIEW', 17, '#67e8f3');
  scene.layer.add(inspection(scene, round, 632, 344, 144, s.inspected));
  const tray = scene.add.container(548, 478);
  tray.add(sprite(scene, 'science-sample-tray', 0, 0, 286, 66));
  if (round > 0) tray.add(sprite(scene, 'general-sand-mound', 0, -5, 168, 48));
  if (round === 0) {
    tray.add(sprite(scene, 'general-salt', 0, -8, 78, 48));
  }
  if (round === 2) {
    if (s.magnetic) tray.add(sprite(scene, 'science-magnet', 98, -30, 64));
    for (let i = 0; i < 4; i++) tray.add(sprite(scene, 'science-iron-nail', s.magnetic ? 81 + i * 10 : -58 + i * 38, s.magnetic ? -12 : -7, 28).setAngle(i * 31));
  }
  scene.layer.add(tray);
  qText(scene, 548, 514, round === 0 ? 'MATERIAL FROM THE RECORD' : 'TEST PORTION', 14, '#ffdf9b');
  flatSurface(scene, 388, 547, 696, 34, 0xe9cf98);
  qText(scene, 388, 547, `PREPARATION RECORD: ${c.record}`, 17, '#292116');
  paperButton(scene, 'inspect', 150, 597, 'INSPECT', () => scene.perform('inspect'), { width: 220, height: 52, icon: 'inspect', selected: s.inspected, size: 21 });
  paperButton(scene, 'stir', 388, 597, round === 2 ? 'MIX SAMPLE' : 'STIR SAMPLE', () => scene.perform('stir'), { width: 220, height: 52, icon: 'stir', selected: s.view === 'stirred', size: 21 });
  paperButton(scene, c.test, 626, 597, round === 2 ? 'TEST MAGNET' : 'LET IT REST', () => scene.perform(c.test), { width: 220, height: 52, icon: c.test, selected: s.view === c.test, size: 21 });

  // Top-aligned copy and small evidence marks keep long observations clear.
  flatSurface(scene, 1018, 296, 436, 176, 0xe9cf98);
  const divider = scene.add.graphics().lineStyle(1, 0xb59159).lineBetween(816, 300, 1220, 300); scene.layer.add(divider);
  c.observations.forEach(([heading, detail], i) => {
    const observed = s.evidence.includes(i === 0 ? 'inspect' : c.test), top = 220 + i * 92;
    flatSurface(scene, 828, top + 13, 28, 28, observed ? 0x315237 : 0xd2b57d);
    if (observed) scene.layer.add(supplyGlyph(scene, 828, top + 13, 'check', 0xe4f4bc, 2));
    else qText(scene, 828, top + 13, `${i + 1}`, 20, '#534025');
    qText(scene, 852, top, observed ? heading : i === 0 ? 'Inspect a portion' : round === 2 ? 'Try the magnet' : 'Let the sample rest', 19, '#292116', 368, 'left').setOrigin(0, 0);
    qText(scene, 852, top + 28, observed ? detail : i === 0 ? 'Look closely to add your first observation.' : 'Record what changes after the test.', 17, observed ? '#29362f' : '#634d30', 368, 'left').setOrigin(0, 0);
  });
  qHeading(scene, 1018, 409, 'MY CONCLUSION', 21, '#67e8f3');
  qText(scene, notebook.left, 454, 'Materials', 20, '#ffdf9b', 160, 'left');
  qText(scene, notebook.left, 500, 'Mixture type', 20, '#ffdf9b', 160, 'left');
  paperButton(scene, 'choose-components', notebook.fieldX, 454, s.components ?? 'Choose materials', () => scene.perform('menu', 'components'), { width: notebook.fieldWidth, height: 42, dropdown: true, size: 21 });
  paperButton(scene, 'choose-classification', notebook.fieldX, 500, s.classification ?? 'Choose type', () => scene.perform('menu', 'classification'), { width: notebook.fieldWidth, height: 42, dropdown: true, size: 21 });
}

export function mysteryResults(scene) {
  const s = scene.state, success = scene.phase !== 'playing';
  if (success) flatSurface(scene, 1018, 555, 436, 58, 0x163e2a);
  qText(scene, notebook.left + 8, 555, s.message || 'Use your observations to describe the sample.', 17, success ? '#dbefb6' : '#efdfb8', 420, 'left');
  scene.button(success ? 'retry' : 'reset', 870, 609, success ? 'RETRY' : 'RESET', () => scene.resetRound(), { width: 140, height: 40, size: 21, tone: 'choice' });
  scene.button(success ? 'next' : 'check', 1096, 609, success ? scene.phase === 'finished' ? 'LESSON MAP' : 'NEXT CHALLENGE' : 'CHECK RESULT', () => success ? scene.nextRound() : scene.checkRound(), { width: 280, height: 40, size: 21, fill: 0x32641f });
  // Menus open upward, on top of the notebook, with explicit choices.
  if (s.menu && !success) {
    // Dismissal consumes the click, leaving the experiment and answers intact.
    const dismiss = scene.add.zone(640, 391, 1248, 488).setInteractive();
    dismiss.on('pointerup', () => { if (!scene.currentModal) scene.perform('menu', null); });
    scene.layer.add(dismiss);
    const field = s.menu, choices = field === 'components' ? MYSTERY_COMPONENTS : MYSTERY_TYPES;
    const fieldY = field === 'components' ? 454 : 500;
    const menuHeight = choices.length * 46 + 12;
    flatSurface(scene, notebook.fieldX, fieldY - 28 - menuHeight / 2, notebook.fieldWidth + 12, menuHeight, 0x081b2b, 0x67d8ee);
    choices.forEach((choice, i) => {
      paperButton(scene, `${field}-${i}`, notebook.fieldX, fieldY - 57 - (choices.length - 1 - i) * 46, choice, () => scene.perform(field, choice), { width: notebook.fieldWidth, height: 42, size: 21, selected: s[field] === choice });
    });
  }
}

export function openMysteryHelp(scene) {
  if (scene.currentModal) return;
  scene.minigameHelpOpen = true;
  showModal(scene, { name: 'minigame-help', title: 'HOW TO INVESTIGATE', width: 1120, height: 580,
    titleTop: 43, titleSize: 33, buttonY: 611, buttons: [],
    body: () => {
      const nodes = [supplyText(scene, 640, 143, scene.gameDefinition.subtitle, 23, '#67d8ee')];
      scene.gameDefinition.steps.forEach(([heading, detail], i) => {
        const x = 294 + i * 346;
        nodes.push(panel(scene, x, 281, 326, 239, { fill: 0x102436 }));
        nodes.push(supplyHeading(scene, x, 190, heading, 22, '#ffdf9b'));
        nodes.push(i === 0 ? inspection(scene, 1, x, 263, 95) : i === 1 ? mysteryJar(scene, 1, x, 263, 107, true) : supplyGlyph(scene, x, 263, 'check', 0xb5e748, 7));
        nodes.push(supplyText(scene, x, 353, detail, 20, '#efdfb8').setWordWrapWidth(285, true));
      });
      nodes.push(panel(scene, 640, 496, 1054, 157, { fill: 0x15301f }));
      nodes.push(supplyHeading(scene, 640, 442, 'SCIENTIST NOTE', 24, '#ffdf9b'));
      nodes.push(supplyText(scene, 640, 507, scene.gameDefinition.tip, 22, '#efdfb8').setWordWrapWidth(974, true));
      nodes.push(magnetControl(scene, 640, 611, 'GOT IT', () => { scene.minigameHelpOpen = false; closeOpenModal(scene); scene.updateTestState(); }, { width: 180, height: 50, fill: 0x32641f }));
      return nodes;
    } });
  scene.updateTestState();
}
