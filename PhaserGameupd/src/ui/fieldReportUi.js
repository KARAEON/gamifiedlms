import { REPORT_CASES, REPORT_CAPTION_LIMIT } from '../config/scienceQuarterGames.js';
import { magnetPanel as panel, magnetControl as control } from './magnetWorkshopUi.js';
import { circuitSample, toolSprite } from './recoveryCircuitUi.js';
import { sievePicture } from './brokenSeparatorUi.js';
import { qText, qZone, qHeading } from './scienceQuarterUi.js';
import { supplyGlyph, supplyText, supplyHeading } from './supplyCartUi.js';
import { closeOpenModal, showModal } from './ui.js';
import { readScienceProgress } from '../systems/scienceProgress.js';

const stages = ['BEFORE', 'PROCESS', 'AFTER'];
const methodLabel = method => ({ sieve: 'Sieve', magnet: 'Magnet', evaporate: 'Evaporation' }[method]);
export const reportPhotoLabels = round => {
  const c = REPORT_CASES[round];
  return [c.input, methodLabel(c.tool), c.output, c.tool === 'magnet' ? 'Sieve' : 'Magnet', 'Oil + water'];
};

function image(scene, key, x, y, width, height = width, frame) {
  const texture = scene.textures.get(key);
  const node = scene.add.image(x, y, key, frame ?? (texture.has('trimmed') ? 'trimmed' : undefined));
  node.setScale(Math.min(width / node.width, height / node.height)); return node;
}

// The image bank uses genuine input mixtures, methods and recovered products.
export function reportPhoto(scene, round, role, x, y, size) {
  const group = scene.add.container(x, y), c = REPORT_CASES[round];
  if (role === 0 && round < 2) {
    group.add(circuitSample(scene, ['sand'], 0, size * 0.12, size * 0.9));
    for (let i = 0; i < 5; i++) {
      const [dx, dy] = [[-0.24, 0.12], [0.12, 0.03], [0.28, 0.16], [-0.06, 0.24], [0.18, 0.28]][i];
      group.add(image(scene, round === 0 ? 'science-pebble' : 'science-iron-nail', dx * size, dy * size, size * (round === 0 ? 0.24 : 0.34)).setAngle(i * 21 - 15));
    }
  } else if (role === 0) group.add(circuitSample(scene, ['salt', 'water'], 0, 0, size * 0.88));
  else if (role === 2) group.add(circuitSample(scene, [round === 0 ? 'sand' : round === 1 ? 'iron' : 'salt'], 0, 0, size * 0.86));
  else if (role === 4) group.add(image(scene, 'general-oil-and-water', 0, 0, size * 0.86));
  else {
    const method = role === 1 ? c.tool : c.tool === 'magnet' ? 'sieve' : 'magnet';
    if (method === 'sieve') group.add(sievePicture(scene, 0, -size * 0.06, size * 0.96, 4));
    else if (method === 'magnet') {
      group.add(toolSprite(scene, 'magnet', 0, -size * 0.13, size * 0.73));
      group.add(circuitSample(scene, ['iron'], size * 0.08, size * 0.26, size * 0.43));
    } else {
      group.add(toolSprite(scene, 'evaporate', 0, size * 0.04, size * 0.87));
      group.add(circuitSample(scene, ['vapor'], 0, -size * 0.3, size * 0.25));
      group.add(circuitSample(scene, ['salt'], 0, -size * 0.01, size * 0.26));
    }
  }
  return group;
}

function fit(node, size, width) {
  if (node.width > width) node.setFontSize(Math.floor(parseFloat(node.style.fontSize) * width / node.width));
  return node;
}

export function renderFieldReport(scene) {
  const s = scene.state, c = REPORT_CASES[scene.round], labels = reportPhotoLabels(scene.round);
  scene.layer.add(panel(scene, 340, 391, 648, 488, { fill: 0x081b2b }));
  qHeading(scene, 340, 179, 'REPORTING WORKBOARD', 25, '#67d8ee');
  stages.forEach((stage, index) => {
    const x = 140 + index * 200, active = s.activePanel === index;
    scene.layer.add(panel(scene, x, 323, 195, 237, { fill: 0xe9cf98, edge: active ? 0x67d8ee : 0xb98a43 }));
    if (active) scene.layer.add(scene.add.rectangle(x, 323, 184, 228).setStrokeStyle(3, 0x67d8ee));
    scene.layer.add(scene.add.rectangle(x, 219, 163, 29, 0x102436).setStrokeStyle(1, active ? 0x67d8ee : 0xb98a43));
    qText(scene, x, 219, `${index + 1}. ${stage}`, 21);
    scene.layer.add(scene.add.rectangle(x, 318, 163, 159, 0xf5e4bd));
    if (s.panels[index] !== null) scene.layer.add(reportPhoto(scene, scene.round, s.panels[index], x, 316, 145));
    else {
      qText(scene, x, 301, '?', 49, '#6d4a96');
      qText(scene, x, 360, 'CHOOSE AN IMAGE\nFROM THE BANK', 15, '#65512f');
    }
    const label = s.panels[index] === null ? 'Tap this panel\nto select it.' : labels[s.panels[index]];
    qText(scene, x, 415, label, 17, '#292116', 161);
    qZone(scene, `panel-${index}`, x, 323, 195, 237, () => scene.perform('panel', index));
  });
  scene.layer.add(panel(scene, 340, 531, 615, 158, { fill: 0x102436 }));
  qHeading(scene, 340, 471, 'IMAGE BANK', 23, '#67d8ee');
  labels.forEach((label, role) => {
    const x = 100 + role * 120, chosen = s.panels[s.activePanel] === role;
    scene.layer.add(panel(scene, x, 545, 116, 114, { fill: 0xe9cf98, edge: chosen ? 0x67d8ee : 0xb98a43 }));
    if (chosen) scene.layer.add(scene.add.rectangle(x, 545, 105, 104).setStrokeStyle(2, 0x67d8ee));
    scene.layer.add(reportPhoto(scene, scene.round, role, x, 529, 75));
    qText(scene, x, 581, label, 14, '#292116', 98);
    qZone(scene, `photo-${role}`, x, 545, 116, 114, () => scene.perform('photo', role));
  });
  const saved = readScienceProgress()[scene.lessonId]?.records?.some(Boolean) || scene.records.some(Boolean);
  scene.button('download', 340, 622, 'DOWNLOAD SAVED REPORTS', () => scene.downloadReports(), { width: 368, height: 31, size: 19, enabled: Boolean(saved) });

  scene.layer.add(panel(scene, 969, 391, 590, 488, { fill: 0x081b2b }));
  qHeading(scene, 969, 179, 'YOUR FIELD REPORT', 25, '#67d8ee');
  scene.layer.add(panel(scene, 969, 235, 553, 69, { fill: 0xe9cf98 }));
  fit(qHeading(scene, 898, 235, c.title, 27, '#292116'), 27, 362);
  scene.layer.add(reportPhoto(scene, scene.round, 2, 1180, 234, 65));
  scene.layer.add(panel(scene, 969, 284, 553, 38, { fill: 0xe9cf98 }));
  fit(qText(scene, 969, 284, 'Explain the material, method and community benefit.', 18, '#292116'), 18, 510);
  scene.layer.add(panel(scene, 969, 418, 553, 227, { fill: 0xf5e4bd }));
  scene.captionBounds = { x: 710, y: 318, width: 518, height: 183, fontSize: 21 };
  scene.captionCount = qText(scene, 1192, 514, `${s.caption.length} / ${REPORT_CAPTION_LIMIT}`, 15, '#65512f');
  scene.ensureCaptionInput(); scene.syncCaptionInput();
}

export function fieldReportResults(scene) {
  const complete = scene.phase !== 'playing', s = scene.state;
  scene.layer.add(panel(scene, 969, 590, 553, 86, { fill: 0x102436 }));
  const status = complete ? 'REPORT SAVED FOR TEACHER REVIEW' : s.message || 'Ready to save your report?';
  scene.reportStatusText = fit(qText(scene, 969, 554, status, 16, complete ? '#a8ef82' : s.message ? '#ffce58' : '#fff0d6'), 16, 512);
  scene.button(complete ? 'retry' : 'reset', 788, 588, complete ? 'RETRY' : 'RESET', () => scene.resetRound(), { width: 159, height: 45, size: 23 });
  scene.button(complete ? 'next' : 'check', 1067, 588, complete ? scene.phase === 'finished' ? 'LESSON MAP' : 'NEXT REPORT' : 'SAVE REPORT', () => complete ? scene.nextRound() : scene.checkRound(), { width: 301, height: 45, size: 25, fill: 0x32641f });
  qText(scene, 969, 620, 'Saved explanations need teacher review.', 12, '#c5b3ef');
}

export function openFieldReportHelp(scene) {
  if (scene.currentModal) return;
  scene.minigameHelpOpen = true;
  showModal(scene, { name: 'minigame-help', title: 'HOW TO PLAY', width: 1120, height: 580, titleTop: 43, titleSize: 33, buttons: [], body: () => {
    const nodes = [], text = (x, y, label, size = 20, color = '#fff0d6', width = 0, role = 'body') => {
      const t = (role === 'heading' ? supplyHeading : supplyText)(scene, x, y, label, size, color); if (width) t.setWordWrapWidth(width, true); nodes.push(t);
    };
    text(640, 145, 'Show the mixture, process and recovered product. Explain who benefits.', 22, '#67d8ee');
    for (let i = 0; i < 3; i++) {
      const x = 294 + i * 346;
      nodes.push(panel(scene, x, 299, 326, 279, { fill: 0x102436 }));
      text(x, 187, ['1. SELECT A PANEL', '2. CHOOSE AN IMAGE', '3. WRITE AND SAVE'][i], 21, '#b5e748', 0, 'heading');
      if (!i) {
        stages.forEach((stage, j) => {
          nodes.push(panel(scene, x - 90 + j * 90, 281, 88, 105, { fill: 0xe9cf98, edge: j === 0 ? 0x67d8ee : 0xb98a43 }));
          nodes.push(reportPhoto(scene, scene.round, j, x - 90 + j * 90, 271, 62));
          text(x - 90 + j * 90, 316, stage, 12, '#292116');
        });
      } else if (i === 1) {
        nodes.push(panel(scene, x, 282, 236, 118, { fill: 0xe9cf98 }));
        nodes.push(reportPhoto(scene, scene.round, 1, x, 273, 107));
        text(x, 325, methodLabel(REPORT_CASES[scene.round].tool), 17, '#292116');
      } else {
        nodes.push(panel(scene, x, 280, 269, 126, { fill: 0xf5e4bd }));
        text(x, 270, 'METHOD + PRODUCT\n+ COMMUNITY BENEFIT', 19, '#292116');
        nodes.push(supplyGlyph(scene, x, 320, 'check', 0x5c9c3a, 2));
      }
      text(x, 388, ['Tap Before, Process or After. The cyan outline marks the panel you are filling.', 'Choose from the image bank. Match the mixture, separation method and recovered material.', `Write 20–${REPORT_CAPTION_LIMIT} characters in your own words. Save the report, then continue.`][i], 18, '#fff0d6', 285);
    }
    nodes.push(panel(scene, 640, 505, 1054, 118, { fill: 0x142e21 }));
    nodes.push(scene.add.image(182, 505, 'supply-guide').setDisplaySize(75, 90));
    text(700, 470, 'SCIENTIST NOTE', 23, '#ffce58', 0, 'heading');
    text(700, 508, 'Explain what was recovered, how it was separated, and how people can use it.\nSave reports locally, then use Download Saved Reports to share them for review.', 18, '#fff0d6', 851);
    text(700, 548, 'Completion checks picture order and writing length. Your teacher reviews the explanation.', 17, '#c5b3ef', 851);
    nodes.push(control(scene, 640, 611, 'GOT IT', () => { scene.minigameHelpOpen = false; closeOpenModal(scene); scene.updateTestState(); }, { width: 180, height: 50, fill: 0x32641f }));
    return nodes;
  } });
  scene.updateTestState();
}
