import { REVIVAL_CASES, readyToRepair, revivalOutcome } from '../games/science/workshopRevivalLogic.js';
import { SCIENCE_TOOLS, REPORT_CAPTION_LIMIT } from '../config/scienceQuarterGames.js';
import { magnetPanel as panel, magnetControl } from './magnetWorkshopUi.js';
import { circuitSample, toolSprite } from './recoveryCircuitUi.js';
import { qText, qHeading, qZone } from './scienceQuarterUi.js';
import { supplyGlyph, supplyText, supplyHeading } from './supplyCartUi.js';
import { closeOpenModal, showModal } from './ui.js';

const toolName = id => SCIENCE_TOOLS.find(t => t.id === id)?.label ?? 'NO METHOD YET';
export function materialName(parts) {
  if (parts.includes('salt') && parts.includes('water')) return [...parts.filter(p => !['salt', 'water'].includes(p)), 'saltwater'].join(' + ');
  return parts.map(p => p === 'vapor' ? 'water vapor' : p === 'salt' ? 'dry salt' : p).join(' + ');
}
function label(scene, x, y, text, width, size = 16) {
  const t = qText(scene, x, y, text, size, '#fff0d6', width);
  while (t.height > 36 && parseFloat(t.style.fontSize) > 12) t.setFontSize(parseFloat(t.style.fontSize) - 1);
  return t;
}
function plaque(scene, x, y, text, width, size = 16) {
  scene.layer.add(panel(scene, x, y, width, 31, { fill: 0xe9cf98 }));
  return qText(scene, x, y, text, size, '#292116', width - 28);
}
function regionImage(scene, i, repaired, x, y, w, h) {
  return scene.add.image(x, y, 'science-revival-regions', `${repaired ? 'restored' : 'broken'}-${i}`).setDisplaySize(w, h);
}

export function renderWorkshopRevival(scene) {
  const s = scene.state, c = REVIVAL_CASES[scene.round];
  scene.layer.add(panel(scene, 396, 391, 760, 488, { fill: 0x081b2b }));
  scene.layer.add(panel(scene, 1028, 391, 472, 488, { fill: 0x081b2b }));
  qHeading(scene, 396, 178, 'WORKSHOP REPAIR', 25, '#67e8f3');
  qHeading(scene, 1028, 178, 'MISSION RECORD', 25, '#67e8f3');
  ['OBSERVE', 'SEPARATE', 'USE MATERIAL'].forEach((name, i) => {
    const done = i === 0 ? s.observed : i === 1 ? readyToRepair(s) || s.repairs[s.round] : s.repairs[s.round];
    const active = i === 0 ? !s.observed : i === 1 ? s.observed && !readyToRepair(s) && !s.repairs[s.round] : readyToRepair(s);
    const x = 164 + i * 232, color = done ? 0x83d862 : active ? 0x67e8f3 : 0x7890aa;
    scene.layer.add(scene.add.rectangle(x, 222, 219, 32, done ? 0x163928 : active ? 0x103b4a : 0x102436).setStrokeStyle(2, color));
    scene.layer.add(scene.add.circle(x - 88, 222, 17, 0x102436).setStrokeStyle(2, color));
    qText(scene, x - 88, 222, String(i + 1), 21);
    qText(scene, x + 13, 222, name, 17, done || active ? '#fff0d6' : '#c8d7e9');
  });
  REVIVAL_CASES.forEach((region, i) => {
    const x = 164 + i * 232, restored = s.repairs[i], current = i === scene.round;
    scene.layer.add(regionImage(scene, i, restored, x, 327, 219, 156));
    scene.layer.add(scene.add.rectangle(x, 327, 219, 156).setStrokeStyle(current ? 3 : 1, current ? 0x67e8f3 : 0xb98a43));
    plaque(scene, x, 265, region.region, 207, 17);
    scene.layer.add(scene.add.rectangle(x, 392, 211, 24, restored ? 0x183d26 : 0x102436, 0.93));
    qText(scene, x, 392, restored ? 'RESTORED' : current ? 'CURRENT REPAIR' : 'NEEDS REPAIR', 14, restored ? '#b3f29b' : '#f4deb6');
    if (restored) scene.layer.add(supplyGlyph(scene, x + 81, 285, 'check', 0x8cea66, 1.7));
  });
  qText(scene, 124, 422, 'INITIAL MIXTURE', 14, '#67e8f3');
  scene.layer.add(circuitSample(scene, c.input, 124, 463, 76));
  qText(scene, 124, 514, materialName(c.input), 13, '#fff0d6', 166);
  const latest = s.steps.at(-1);
  qText(scene, 276, 422, 'METHODS USED', 14, '#67e8f3');
  if (s.steps.length) {
    s.steps.slice(-2).forEach((step, i, steps) => {
      const x = steps.length === 1 ? 276 : 240 + i * 75;
      scene.layer.add(toolSprite(scene, step.tool, x, 469, 68));
      label(scene, x, 519, toolName(step.tool), 88, 13);
    });
  } else { qText(scene, 276, 470, '?', 38, '#c8d7e9'); label(scene, 276, 518, 'Observe first', 123, 15); }
  scene.layer.add(supplyGlyph(scene, 185, 472, 'arrow', 0xffce58, 1.7).setAngle(180));
  scene.layer.add(supplyGlyph(scene, 352, 472, 'arrow', 0xffce58, 1.7).setAngle(180));
  qText(scene, 563, 422, s.applied.length ? 'MATERIAL USED + OUTPUTS KEPT' : 'SELECT AN OUTPUT TO PROCESS', 14, '#67e8f3');
  const visible = [...s.applied, ...s.streams];
  visible.forEach((stream, i) => {
    const x = 420 + i * 98, chosen = stream.id === s.selected, used = s.applied.some(out => out.id === stream.id);
    scene.layer.add(scene.add.rectangle(x, 478, 91, 100, used ? 0x163928 : 0x102436).setStrokeStyle(chosen ? 3 : 1, chosen ? 0x67e8f3 : used ? 0x83d862 : 0xb98a43));
    scene.layer.add(circuitSample(scene, stream.parts, x, 464, 57));
    label(scene, x, 506, `${materialName(stream.parts)}${stream.damp ? ' (damp)' : ''}${used ? ' / USED' : ''}`, 83, 13);
    const zone = qZone(scene, `stream-${stream.id}`, x, 478, 91, 100, () => scene.perform('stream', stream.id));
    if (!s.observed || used || s.repairs[s.round]) zone.disableInteractive();
  });
  scene.button('observe', 140, 549, s.observed ? 'OBSERVED' : 'OBSERVE SAMPLE', () => scene.perform('observe'), { width: 188, height: 34, size: 17, enabled: !s.observed && scene.phase === 'playing' });
  scene.button('operate', 394, 549, 'APPLY TOOL', () => scene.perform('operate'), { width: 187, height: 34, size: 18, enabled: s.observed && Boolean(s.selected && s.tool) && !s.repairs[s.round] && scene.phase === 'playing' });
  scene.button('apply', 650, 549, s.repairs[s.round] ? 'MATERIAL USED' : 'APPLY MATERIAL', () => scene.perform('apply'), { width: 204, height: 34, size: 18, fill: 0x32641f, enabled: readyToRepair(s) && scene.phase === 'playing' });
  if (scene.phase === 'playing') SCIENCE_TOOLS.forEach((tool, i) => {
    const x = 102 + i * 146, selected = s.tool === tool.id;
    scene.layer.add(panel(scene, x, 604, 139, 65, { fill: selected ? 0x103b4a : 0x102436 }));
    if (selected) scene.layer.add(scene.add.rectangle(x, 604, 127, 53).setStrokeStyle(2, 0x67e8f3));
    scene.layer.add(toolSprite(scene, tool.id, x, 592, 36).setAlpha(s.observed && !s.repairs[s.round] ? 1 : 0.45));
    qText(scene, x, 623, tool.label, 15, '#f4deb6');
    const zone = qZone(scene, `tool-${tool.id}`, x, 604, 139, 65, () => scene.perform('tool', tool.id));
    if (!s.observed || s.repairs[s.round]) zone.disableInteractive();
  });
  else scene.button('download', 396, 603, 'DOWNLOAD MISSION RECORDS', () => scene.downloadReports(), { width: 382, height: 44, size: 21 });

  const cards = [
    { title: 'INITIAL MIXTURE', value: materialName(c.input), parts: c.input },
    { title: 'METHODS', value: s.steps.length ? s.steps.map(step => toolName(step.tool).toLowerCase()).join(' → ') : 'Observe, then choose a tool.', tool: latest?.tool },
    { title: 'RECOVERED PRODUCT', value: `${materialName(c.goals)} for the ${c.region.toLowerCase()}`, parts: c.goals },
  ];
  cards.forEach((card, i) => {
    const y = 239 + i * 70;
    scene.layer.add(scene.add.rectangle(1028, y, 429, 62, 0x102436).setStrokeStyle(1, 0x9f865d));
    if (card.tool) scene.layer.add(toolSprite(scene, card.tool, 863, y, 49));
    else if (card.parts) scene.layer.add(circuitSample(scene, card.parts, 863, y, 47).setAlpha(i === 2 && !readyToRepair(s) && !s.repairs[s.round] ? 0.35 : 1));
    else qText(scene, 863, y, '?', 30, '#c8d7e9');
    qHeading(scene, 1063, y - 15, card.title, 19, '#ffdf9b');
    label(scene, 1063, y + 13, card.value, 309, 17);
  });
  scene.layer.add(panel(scene, 1028, 483, 440, 142, { fill: 0xf5e4bd }));
  qText(scene, 1028, 428, `How does recovering ${materialName(c.goals)} help?`, 17, '#292116', 399);
  scene.captionBounds = { x: 829, y: 448, width: 397, height: 76, fontSize: 20 };
  scene.captionCount = qText(scene, 1185, 537, `${s.caption.length} / ${REPORT_CAPTION_LIMIT}`, 13, '#65512f');
  qText(scene, 982, 537, 'Saved for teacher review', 13, '#65512f');
  scene.ensureCaptionInput(); scene.syncCaptionInput();
}

export function workshopRevivalResults(scene) {
  const complete = scene.phase !== 'playing', s = scene.state;
  const message = complete ? s.message : s.message || 'Observe. Separate. Apply. Explain the benefit.';
  scene.layer.add(scene.add.rectangle(1028, 577, 429, 41, 0x102436).setStrokeStyle(1, 0x9f865d));
  scene.reportStatusText = label(scene, 1028, 577, message, 402, 16);
  scene.reportStatusText.setColor(complete ? '#b3f29b' : s.message ? '#ffdf9b' : '#fff0d6');
  scene.button(complete ? 'retry' : 'reset', 896, 615, complete ? 'RETRY' : 'RESET', () => scene.resetRound(), { width: 173, height: 43, size: 22 });
  const save = scene.button(complete ? 'next' : 'check', 1135, 615, complete ? scene.phase === 'finished' ? 'LESSON MAP' : 'NEXT REPAIR' : 'CHECK RESULT', () => complete ? scene.nextRound() : scene.checkRound(), { width: 232, height: 43, size: 22, fill: 0x32641f, enabled: complete || revivalOutcome(s).success });
  save.setName('revival-save-control');
}

export function openWorkshopRevivalHelp(scene) {
  if (scene.currentModal) return;
  scene.minigameHelpOpen = true;
  showModal(scene, { name: 'minigame-help', title: 'HOW TO PLAY', width: 1120, height: 580, titleTop: 43, titleSize: 33, buttons: [], body: () => {
    const nodes = [], text = (x, y, value, size, color, width, heading = false) => {
      const t = (heading ? supplyHeading : supplyText)(scene, x, y, value, size, color);
      if (width) t.setWordWrapWidth(width, true); nodes.push(t);
    };
    text(640, 143, 'Restore one workshop through three linked repairs.', 23, '#67e8f3');
    scene.gameDefinition.steps.forEach(([title, detail], i) => {
      const x = 294 + i * 346;
      nodes.push(panel(scene, x, 297, 326, 277, { fill: 0x102436 }));
      text(x, 185, title, 22, '#b3f29b', 0, true);
      if (!i) nodes.push(circuitSample(scene, REVIVAL_CASES[scene.round].input, x, 277, 105));
      else if (i === 1) nodes.push(toolSprite(scene, ['magnet', 'filter', 'evaporate'][scene.round], x, 277, 105));
      else nodes.push(regionImage(scene, scene.round, true, x, 260, 168, 119));
      text(x, 379, detail, 19, '#fff0d6', 282);
    });
    nodes.push(panel(scene, 640, 512, 1054, 126, { fill: 0x142e21 }));
    text(640, 475, `Write 20–${REPORT_CAPTION_LIMIT} characters explaining the material and benefit.`, 21, '#ffdf9b');
    text(640, 521, scene.gameDefinition.tip, 18, '#fff0d6', 991);
    nodes.push(magnetControl(scene, 640, 611, 'GOT IT', () => { scene.minigameHelpOpen = false; closeOpenModal(scene); scene.updateTestState(); }, { width: 180, height: 50, fill: 0x32641f }));
    return nodes;
  } });
  scene.updateTestState();
}
