import { magnetPanel as workshopPanel, magnetControl as workshopControl } from './magnetWorkshopUi.js';
import { qText, qHeading } from './scienceQuarterUi.js';
import { supplyGlyph, supplyText, supplyHeading } from './supplyCartUi.js';
import { closeOpenModal, showModal } from './ui.js';

export const EVAPORATION_STAGES = [
  'Saltwater fills the dish.',
  'Water begins to evaporate.',
  'Less liquid remains.',
  'Only a little liquid remains.',
  'Salt remains in the dish.',
];

// Journal thumbnails use the same stage renderer as the live experiment.
export function apparatus(scene, x, y, width, height, stage = null, vapor = false) {
  const node = scene.add.container(x, y);
  const dish = scene.add.image(0, 0, 'science-evaporation-apparatus', 'trimmed');
  dish.setScale(Math.min(width / dish.width, height / dish.height));
  const w = dish.displayWidth, h = dish.displayHeight;
  node.add(dish);
  if (stage === null) { dish.setAlpha(0.23); return node; }
  const contents = scene.add.graphics();
  const cx = -w * 0.025, cy = -h * 0.17;
  const pixel = Math.max(1, Math.round(w / 155));
  const ellipse = (x, y, ew, eh, color, alpha = 1) => {
    contents.fillStyle(color, alpha);
    for (let row = -eh / 2; row < eh / 2; row += pixel) {
      const span = Math.sqrt(Math.max(0, 1 - ((row + pixel / 2) / (eh / 2)) ** 2)) * ew / 2;
      const left = Math.round((x - span) / pixel) * pixel;
      const right = Math.round((x + span) / pixel) * pixel;
      contents.fillRect(left, Math.round((y + row) / pixel) * pixel, right - left, pixel);
    }
  };
  if (stage < 4) {
    const scale = [1, 0.87, 0.73, 0.56][stage];
    const liquidY = cy + stage * h * 0.025;
    ellipse(cx, liquidY + h * 0.015, w * 0.72 * scale, h * 0.19 * scale, 0x2c7fa4);
    ellipse(cx, liquidY, w * 0.72 * scale, h * 0.18 * scale, 0x65bde2, 0.94);
    for (let i = 0; i < 4; i++) {
      contents.fillStyle(i % 2 ? 0x97d8ec : 0xd1f0f7, 0.85).fillRect(
        cx - w * 0.23 * scale + i * w * 0.12 * scale,
        liquidY + (i % 2 ? 1 : -2) * pixel, w * 0.09 * scale, pixel);
    }
  }
  // Dissolved salt is invisible initially; crystals emerge late, then remain dry.
  if (stage >= 2) {
    const count = stage === 2 ? 9 : stage === 3 ? 22 : 43;
    const size = Math.max(1, w * 0.012);
    for (let i = 0; i < count; i++) {
      const angle = i * 2.399963, radius = Math.sqrt((i + 1) / count);
      const px = cx + Math.cos(angle) * radius * w * 0.25;
      const py = cy + h * 0.05 + Math.sin(angle) * radius * h * 0.06;
      contents.fillStyle(0x88829b).fillRect(px, py + size * 0.35, size, size);
      contents.fillStyle(i % 3 ? 0xfff9e4 : 0xdedced).fillRect(px, py, size, size * 0.7);
      contents.fillStyle(0xffffff).fillRect(px, py, size * 0.4, size * 0.3);
    }
  }
  node.add(contents);
  if (stage === 4) {
    const salt = scene.add.image(cx, cy + h * 0.11, 'general-salt', 'evaporation-trimmed').setOrigin(0.5, 1);
    salt.setScale(w * 0.27 / salt.width); node.add(salt);
  }
  if (vapor && stage > 0 && stage < 4) {
    const wisps = scene.add.graphics();
    for (let i = 0; i < 3; i++) {
      const baseX = (i - 1) * w * 0.12;
      for (let j = 0; j < 12; j++) {
        const px = baseX + Math.sin(j * 0.66 + i) * w * 0.025;
        const py = -h * 0.34 - j * h * 0.02;
        wisps.fillStyle(0xbcb0b7, 0.36 + (11 - j) * 0.013).fillRect(px, py, w * 0.021, h * 0.026);
      }
    }
    node.add(wisps);
  }
  return node;
}

function journalPage(scene, label, stage, y) {
  const recorded = stage !== null;
  const g = scene.add.graphics();
  g.fillStyle(0x291b18).fillRect(863, y - 38, 377, 77);
  g.fillStyle(recorded ? 0xead2a6 : 0x74717a).fillRect(867, y - 34, 369, 69);
  g.lineStyle(2, recorded ? 0xaf8150 : 0x969099).strokeRect(871, y - 30, 361, 61);
  g.lineStyle(1, recorded ? 0xb79e79 : 0x504e57).strokeRect(883, y - 25, 132, 50);
  for (let i = 0; i < 4; i++) {
    const ringY = y - 25 + i * 16;
    g.fillStyle(0x161821).fillRect(858, ringY, 21, 8);
    g.fillStyle(0xc9a461).fillRect(859, ringY, 17, 3);
  }
  scene.layer.add(g);
  scene.layer.add(apparatus(scene, 949, y, 109, 61, stage));
  qText(scene, 1122, y - 10, label, 24, recorded ? '#292116' : '#28252d');
  qText(scene, 1122, y + 16, recorded ? `STAGE ${stage + 1} RECORDED` : 'NOT RECORDED', 14, recorded ? '#65512f' : '#28252d');
}

export function renderEvaporationWorkshop(scene) {
  const s = scene.state, playing = scene.phase === 'playing';
  scene.layer.add(workshopPanel(scene, 420, 388, 808, 482));
  scene.layer.add(scene.add.image(420, 388, 'science-workshop-backdrop').setDisplaySize(774, 458));
  scene.layer.add(scene.add.rectangle(420, 388, 774, 458, 0x070d14, 0.2));
  scene.layer.add(workshopPanel(scene, 420, 190, 555, 47, { fill: 0x101b30, edge: 0x67d8ee }));
  qText(scene, 420, 190, `SIMULATED TIME: STAGE ${s.time + 1}/5`, 24, '#67d8ee');
  scene.layer.add(apparatus(scene, 420, 378, 568, 276, s.time, true));
  scene.layer.add(workshopPanel(scene, 420, 537, 442, 42, { fill: 0x101b30 }));
  qText(scene, 420, 537, EVAPORATION_STAGES[s.time], 21, '#fff0d6');
  scene.button('record', 248, 587, s.journal.includes(s.time) ? 'OBSERVATION RECORDED' : 'RECORD OBSERVATION', () => scene.perform('record'),
    { width: 323, height: 60, size: 24, enabled: playing && !s.journal.includes(s.time) });
  scene.button('advance', 597, 587, 'ADVANCE TIME', () => scene.perform('advance'),
    { width: 323, height: 60, size: 24, enabled: playing && s.time < 4 });

  scene.layer.add(workshopPanel(scene, 1050, 388, 428, 482));
  qHeading(scene, 1050, 184, 'OBSERVATION JOURNAL', 25, '#67d8ee');
  const middle = s.journal.filter(t => t > 0 && t < 4).at(-1) ?? null;
  journalPage(scene, 'START', s.journal.includes(0) ? 0 : null, 246);
  journalPage(scene, 'MIDDLE', middle, 324);
  journalPage(scene, 'END', s.journal.includes(4) ? 4 : null, 402);
  qHeading(scene, 1050, 454, 'RECOVERED IN THE DISH?', 22, '#67d8ee');
  for (const [output, x] of [['salt', 952], ['water', 1147]]) {
    const selected = s.output === output;
    scene.button(`output-${output}`, x, 492, output.toUpperCase(), () => scene.perform('output', output), {
      width: 181, height: 48, size: 25, tone: 'choice', fill: selected ? 0x32641f : 0x18283b,
      enabled: playing, keepColorWhenDisabled: selected,
    });
    if (selected) scene.layer.add(supplyGlyph(scene, x - 64, 492, 'check', 0x98ee81, 2.5));
  }
}

export function evaporationResults(scene) {
  const complete = scene.phase !== 'playing';
  scene.layer.add(workshopPanel(scene, 1050, 554, 386, 63, { fill: complete ? 0x142e21 : 0x101b30, edge: complete ? 0x81ac58 : 0x7195a9 }));
  const message = complete ? 'Water leaves as vapor.\nSalt remains in the dish.'
    : scene.state.message || (scene.state.journal.includes(scene.state.time)
      ? scene.state.time === 4 ? 'Choose the recovered material.\nCheck your journal and result.' : 'Observation saved.\nAdvance time to watch the change.'
      : 'Record this stage\nbefore advancing time.');
  qText(scene, 1050, 554, message, 18, complete ? '#b5e748' : '#fff0d6', 341);
  scene.button(complete ? 'retry' : 'reset', 920, 608, complete ? 'RETRY' : 'RESET', () => scene.resetRound(), { width: 138, height: 48, size: 24 });
  scene.button(complete ? 'next' : 'check', 1112, 608,
    complete ? scene.phase === 'finished' ? 'LESSON MAP' : 'NEXT CHALLENGE' : 'CHECK RESULT',
    () => complete ? scene.nextRound() : scene.checkRound(), { width: 232, height: 48, size: 23 });
}

export function openEvaporationHelp(scene) {
  if (scene.currentModal) return;
  scene.minigameHelpOpen = true;
  showModal(scene, {
    name: 'minigame-help', title: 'HOW TO PLAY', width: 1120, height: 580,
    titleTop: 43, titleSize: 33, buttons: [],
    body: () => {
      const nodes = [];
      const text = (x, y, label, size = 20, color = '#fff0d6', width = 0, role = 'body') => {
        const t = (role === 'heading' ? supplyHeading : supplyText)(scene, x, y, label, size, color);
        if (width) t.setWordWrapWidth(width, true);
        nodes.push(t);
      };
      text(640, 145, 'Watch the dish. Record the start, a middle stage, and the end.', 22, '#67d8ee');
      for (const [i, stage] of [0, 2, 4].entries()) {
        const x = 294 + i * 346;
        nodes.push(workshopPanel(scene, x, 299, 326, 279, { fill: 0x102436 }));
        text(x, 187, ['1. RECORD START', '2. ADVANCE + RECORD', '3. RECORD END'][i], 22, '#b5e748', 0, 'heading');
        nodes.push(apparatus(scene, x, 270, 218, 128, stage, i === 1));
        text(x, 380, [
          'Record before advancing.\nSalt is dissolved in the water.',
          'Advance time. Record a middle\nstage as less liquid remains.',
          'Record stage 5. Choose what\nremains, then check your result.',
        ][i], 18, '#fff0d6', 291);
      }
      nodes.push(workshopPanel(scene, 640, 505, 1054, 118, { fill: 0x142e21 }));
      nodes.push(scene.add.image(182, 505, 'supply-guide').setDisplaySize(75, 90));
      text(700, 472, 'SCIENTIST NOTE', 23, '#ffce58', 0, 'heading');
      text(700, 509, 'Water leaves as vapor; salt stays in the dish. Simulated time is compressed.\nThe vapor wisps are a visual cue; this setup does not collect liquid water.', 19, '#fff0d6', 851);
      text(700, 548, 'Missed the start or middle? Reset the experiment and record those stages.', 17, '#c5b3ef', 851);
      nodes.push(workshopControl(scene, 640, 611, 'GOT IT', () => {
        scene.minigameHelpOpen = false; closeOpenModal(scene); scene.updateTestState();
      }, { width: 180, height: 50, fill: 0x32641f }));
      return nodes;
    },
  });
  scene.updateTestState();
}
