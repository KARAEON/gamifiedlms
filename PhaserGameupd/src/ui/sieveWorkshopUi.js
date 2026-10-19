import { sieveSizes } from '../games/science/scienceLogic.js';
import { magnetPanel as workshopPanel, magnetControl as workshopControl, magnetSprite as workshopSprite } from './magnetWorkshopUi.js';
import { qText, qHeading } from './scienceQuarterUi.js';
import { supplyText, supplyHeading } from './supplyCartUi.js';
import { closeOpenModal, showModal } from './ui.js';

const ink = { cyan: '#67d8ee', cream: '#fff0d6', gold: '#ffce58' };

function fittedLabel(scene, x, y, value, size = 22, width = 374) {
  const label = qHeading(scene, x, y, value, size, ink.cyan);
  if (label.width > width) label.setFontSize(Math.floor(parseFloat(label.style.fontSize) * width / label.width));
  return label;
}

function sampleTag(scene, text, x, y, endX, endY, width) {
  const g = scene.add.graphics().lineStyle(3, 0xffe4a8);
  g.lineBetween(x, y + 15, endX, endY);
  g.lineBetween(endX, endY, endX - 7, endY - 12);
  g.lineBetween(endX, endY, endX + 7, endY - 12);
  scene.layer.add(g);
  scene.layer.add(scene.add.rectangle(x, y, width, 34, 0xf4dfb1).setStrokeStyle(2, 0x282522));
  qText(scene, x, y, text, 19, '#20201c');
}

function mesh(scene, x, y, rx, ry, opening) {
  const g = scene.add.graphics();
  g.fillStyle(0x111d29, 0.93).fillEllipse(x, y, rx * 2, ry * 2);
  const gap = opening * 7;
  const line = (x1, y1, x2, y2) => {
    g.lineStyle(4, 0x17202c).lineBetween(x1 + 2, y1 + 2, x2 + 2, y2 + 2);
    g.lineStyle(2, 0x8b9bac).lineBetween(x1, y1, x2, y2);
    g.lineStyle(1, 0xc5d5dc).lineBetween(x1 - 1, y1 - 1, x2 - 1, y2 - 1);
  };
  for (let dx = -rx + gap; dx < rx; dx += gap) {
    const extent = ry * Math.sqrt(1 - (dx / rx) ** 2);
    line(x + dx, y - extent, x + dx, y + extent);
  }
  for (let dy = -ry + gap / 2; dy < ry; dy += gap / 2) {
    const extent = rx * Math.sqrt(1 - (dy / ry) ** 2);
    line(x - extent, y + dy, x + extent, y + dy);
  }
  scene.layer.add(g);
}

function grains(scene, x, y, particleSize, amount = 24, spreadX = 123, spreadY = 42) {
  const g = scene.add.graphics();
  for (let i = 0; i < amount; i++) {
    const dx = ((i * 43) % (spreadX * 2)) - spreadX;
    const dy = ((i * 17) % (spreadY * 2)) - spreadY;
    const side = particleSize * 7;
    g.fillStyle(0x89571d).fillRect(x + dx + 2, y + dy + 2, side + 2, side + 2);
    g.fillStyle(i % 2 ? 0xf6bd4b : 0xd98e29).fillRect(x + dx, y + dy, side, side);
    g.fillStyle(0xffdf82).fillRect(x + dx, y + dy, side, 2);
  }
  scene.layer.add(g);
}

function stonePile(scene, x, y, size = 48) {
  for (const [i, dx, dy] of [[0, -65, 4], [1, 0, -13], [2, 64, 8], [3, -22, 21], [4, 38, 25]]) {
    workshopSprite(scene, 'pebble', x + dx, y + dy, size + i % 2 * 9, size).setAngle(-8 + i * 11);
  }
}

function outputTray(scene, x, y, sand, stones, hasRun) {
  workshopSprite(scene, 'recovery-tray', x, y, 378, 127);
  if (!hasRun) return;
  if (sand) {
    const pile = scene.add.image(x + (stones ? -65 : 0), y + 26, 'general-sand-mound', 'sieve-trimmed').setOrigin(0.5, 1);
    pile.setScale(Math.min((stones ? 158 : 224) / pile.width, 80 / pile.height));
    scene.layer.add(pile);
  }
  if (stones) stonePile(scene, x + (sand ? 63 : 0), y - 8, sand ? 37 : 50);
}

export function renderSieveWorkshop(scene) {
  const s = scene.state, sizes = sieveSizes(scene.round);
  workshopSprite(scene, 'grain-crate', 152, 339, 246, 225);
  workshopSprite(scene, 'stone-sack', 731, 331, 183, 241);
  mesh(scene, 430, 319, 217, 77, s.opening);
  workshopSprite(scene, 'sieve-frame', 430, 337, 490, 268);
  if (!s.run || !s.run.sandPasses) grains(scene, 404, 314, sizes.small);
  if (!s.run || !s.run.stonesPass) {
    for (const [i, dx, dy] of [[0, -12, -26], [1, 100, -15], [2, 31, 40]]) {
      workshopSprite(scene, 'pebble', 430 + dx, 319 + dy, sizes.large * 7, sizes.large * 6.5).setAngle(i * 14);
    }
  }
  sampleTag(scene, `GRAINS: SIZE ${sizes.small}`, 158, 211, 164, 287, 184);
  sampleTag(scene, `STONES: SIZE ${sizes.large}`, 714, 211, 706, 289, 182);

  scene.layer.add(workshopPanel(scene, 430, 482, 341, 58, { fill: 0xe9cf98 }));
  qText(scene, 430, 482, `MESH OPENING: ${s.opening}`, 26, '#292116');
  const playing = scene.phase === 'playing';
  scene.button('opening-less', 294, 544, '- SMALLER', () => scene.perform('opening', -1), { width: 236, height: 58, size: 25, enabled: playing && s.opening > 1 });
  scene.button('opening-more', 566, 544, '+ LARGER', () => scene.perform('opening', 1), { width: 236, height: 58, size: 25, enabled: playing && s.opening < 10 });
  scene.button('run', 430, 609, 'RUN A BATCH', () => scene.perform('run'), { width: 400, height: 58, size: 29, enabled: playing });

  scene.layer.add(workshopPanel(scene, 1050, 388, 428, 482));
  const passed = s.run ? [s.run.sandPasses && 'SAND', s.run.stonesPass && 'STONES'].filter(Boolean).join(' + ') || 'NOTHING' : '—';
  const retained = s.run ? [!s.run.sandPasses && 'SAND', !s.run.stonesPass && 'STONES'].filter(Boolean).join(' + ') || 'NOTHING' : '—';
  fittedLabel(scene, 1050, 189, `PASSED THROUGH: ${passed}`);
  outputTray(scene, 1050, 270, s.run?.sandPasses, s.run?.stonesPass, Boolean(s.run));
  const divider = scene.add.graphics().lineStyle(2, 0xd9a641);
  divider.lineBetween(875, 351, 1034, 351).lineBetween(1066, 351, 1225, 351);
  divider.strokePoints([{ x: 1050, y: 345 }, { x: 1056, y: 351 }, { x: 1050, y: 357 }, { x: 1044, y: 351 }], true);
  scene.layer.add(divider);
  fittedLabel(scene, 1050, 378, `RETAINED ON MESH: ${retained}`, 21);
  outputTray(scene, 1050, 451, s.run && !s.run.sandPasses, s.run && !s.run.stonesPass, Boolean(s.run));
}

export function sieveResults(scene) {
  const complete = scene.phase !== 'playing';
  scene.layer.add(workshopPanel(scene, 1050, 548, 386, 74, { fill: complete ? 0x142e21 : 0x101b30, edge: complete ? 0x81ac58 : 0x778491 }));
  const message = complete ? 'Sand passed through.\nLarger stones stayed on the mesh.' : scene.state.message || 'Run a batch.\nInspect both trays, then check.';
  qText(scene, 1050, 548, message, 18, ink.cream, 344);
  scene.button(complete ? 'retry' : 'reset', 920, 602, complete ? 'RETRY' : 'RESET', () => scene.resetRound(), { width: 138, height: 54, size: 24 });
  scene.button(complete ? 'next' : 'check', 1112, 602,
    complete ? scene.phase === 'finished' ? 'LESSON MAP' : 'NEXT CHALLENGE' : 'CHECK RESULT',
    () => complete ? scene.nextRound() : scene.checkRound(), { width: 232, height: 54, size: 23, fill: 0x32641f });
}

// The enlarged example belongs in Help. It uses fixed example sizes (2, 4, 6),
// while gameplay displays each challenge's actual mesh and observed outputs.
export function openSieveHelp(scene) {
  if (scene.currentModal) return;
  scene.minigameHelpOpen = true;
  showModal(scene, {
    name: 'minigame-help', title: 'HOW TO PLAY', width: 1120, height: 580,
    titleTop: 43, titleSize: 33,
    body: () => {
      const nodes = [];
      const text = (x, y, value, size = 20, color = ink.cream, width = 0, role = 'body') => {
        const t = (role === 'heading' ? supplyHeading : supplyText)(scene, x, y, value, size, color);
        if (width) t.setWordWrapWidth(width, true);
        nodes.push(t); return t;
      };
      text(640, 142, 'Separate materials by particle size.', 22, ink.cyan);
      for (const [i, [title, detail]] of scene.gameDefinition.steps.entries()) {
        const x = 294 + i * 346;
        nodes.push(workshopPanel(scene, x, 199, 326, 82, { fill: 0x102436 }));
        text(x, 179, title, 21, '#b5e748', 0, 'heading');
        text(x, 213, detail, 16, ink.cream, 287);
      }
      nodes.push(workshopPanel(scene, 421, 401, 593, 286));
      nodes.push(scene.add.rectangle(421, 280, 294, 30, 0xf4dfb1).setStrokeStyle(2, 0x282522));
      text(421, 280, 'EXAMPLE: OPENING 4', 21, '#20201c');
      const bars = scene.add.graphics();
      for (const x of [174, 248, 322, 490, 564, 638]) {
        bars.lineStyle(10, 0x3c495c).lineBetween(x + 5, 326, x - 10, 428);
        bars.lineStyle(5, 0xc1d0d8).lineBetween(x + 3, 326, x - 12, 428);
      }
      for (const y of [339, 378, 417]) {
        bars.lineStyle(10, 0x3c495c).lineBetween(151, y, 335, y);
        bars.lineBetween(467, y, 651, y);
        bars.lineStyle(4, 0xc1d0d8).lineBetween(151, y - 3, 335, y - 3);
        bars.lineBetween(467, y - 3, 651, y - 3);
      }
      bars.lineStyle(2, 0xffdf82).lineBetween(252, 318, 307, 318);
      bars.lineBetween(252, 312, 252, 324).lineBetween(307, 312, 307, 324);
      nodes.push(bars);
      text(279, 308, '4', 23, ink.gold);
      const grain = scene.add.graphics();
      grain.fillStyle(0xe7a936).fillRect(193, 347, 20, 20);
      grain.fillStyle(0xffdf82).fillRect(193, 347, 20, 5);
      grain.lineStyle(2, 0x8f5c22).strokeRect(193, 347, 20, 20);
      grain.fillStyle(0x73db47).fillTriangle(203, 406, 187, 388, 219, 388).fillRect(198, 370, 10, 21);
      for (let i = 0; i < 7; i++) grain.fillStyle(0xf4c053).fillRect(183 + i * 9, 431 + i % 3 * 8, 5, 5);
      nodes.push(grain);
      const stone = scene.add.image(543, 360, 'science-pebble', 'trimmed');
      stone.setScale(81 / stone.width); nodes.push(stone);
      text(543, 426, '×', 62, '#f45e5e');
      nodes.push(scene.add.rectangle(244, 493, 224, 33, 0x17351e).setStrokeStyle(2, 0x79d55c));
      nodes.push(scene.add.rectangle(560, 493, 267, 33, 0x321c24).setStrokeStyle(2, 0xf45e5e));
      text(244, 493, 'SIZE 2 PASSES', 21, '#a8ef82');
      text(560, 493, 'SIZE 6 STAYS ON MESH', 19, '#ff8b8b');
      nodes.push(workshopPanel(scene, 946, 401, 420, 286, { fill: 0x142e21 }));
      nodes.push(scene.add.image(946, 321, 'supply-guide').setDisplaySize(73, 87));
      text(946, 382, 'PARTICLE-SIZE TIP', 22, ink.gold);
      text(946, 427, 'Choose an opening between\nthe two particle sizes.', 22, ink.cream, 373);
      text(946, 494, 'This is an enlarged size model,\nnot a measurement in millimeters.', 17, '#c5b3ef', 365);
      text(640, 566, 'Adjust the mesh, run a batch, and compare BOTH trays before checking.', 19, ink.cyan, 1000);
      nodes.push(workshopControl(scene, 640, 611, 'GOT IT', () => {
        scene.minigameHelpOpen = false; closeOpenModal(scene); scene.updateTestState();
      }, { width: 180, height: 50, fill: 0x32641f }));
      return nodes;
    }, buttons: [],
  });
  scene.updateTestState();
}
