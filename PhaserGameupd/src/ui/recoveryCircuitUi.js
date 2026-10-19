import { SCIENCE_TOOLS } from '../config/scienceQuarterGames.js';
import { circuitInput } from '../games/science/scienceLogic.js';
import { magnetPanel as panel, magnetControl as control } from './magnetWorkshopUi.js';
import { qText, qZone, qHeading } from './scienceQuarterUi.js';
import { supplyText, supplyHeading } from './supplyCartUi.js';
import { closeOpenModal, showModal } from './ui.js';

const name = parts => parts.includes('salt') && parts.includes('water') && parts.length === 2 ? 'SALTWATER' : parts.map(p => p === 'vapor' ? 'WATER VAPOR' : p).join(' + ').toUpperCase();
const toolName = id => SCIENCE_TOOLS.find(t => t.id === id)?.label ?? 'CHOOSE A TOOL';
const goals = round => round === 0 ? [['iron', 'Iron for repairs'], ['sand', 'Sand for reuse'], ['water', 'Separate liquid water']] : round === 1 ? [['stones', 'Stones for reuse'], ['sand', 'Sand for building'], ['water', 'Separate liquid water']] : [['sand', 'Sand for reuse'], ['salt', 'Salt as a useful product'], ['vapor', 'Water leaves as vapor']];

function image(scene, key, x, y, width, height = width, frame) {
  const texture = scene.textures.get(key);
  const node = scene.add.image(x, y, key, frame ?? (texture.has('trimmed') ? 'trimmed' : undefined));
  node.setScale(Math.min(width / node.width, height / node.height));
  return node;
}

// Every stream illustration derives from its actual components, including both outputs.
export function circuitSample(scene, parts, x, y, size = 80) {
  const group = scene.add.container(x, y);
  const singleton = parts.length === 1, wet = parts.includes('water');
  if (singleton && parts[0] === 'water') {
    group.add(image(scene, 'science-water-drop', 0, 0, size * 0.66, size));
    return group;
  }
  if (singleton && parts[0] === 'vapor') {
    const g = scene.add.graphics();
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 7; row++) {
        g.fillStyle(0xc8e6ef, 0.5 + row * 0.06).fillRect((col - 1) * size * 0.23 + Math.sin(row * 0.9 + col) * size * 0.07, (row - 3) * size * 0.1, size * 0.09, size * 0.1);
      }
    }
    group.add(g); return group;
  }
  const scale = wet ? 0.58 : 1;
  if (wet) {
    const g = scene.add.graphics();
    g.fillStyle(0x349acd, 0.78).fillRect(-size * 0.28, -size * 0.1, size * 0.56, size * 0.44);
    g.fillStyle(0x92ddfa, 0.85).fillEllipse(0, -size * 0.1, size * 0.56, size * 0.08);
    group.add(g);
  }
  const solids = parts.filter(p => !['water', 'vapor'].includes(p));
  solids.forEach((part, i) => {
    const px = solids.length > 1 ? (i - (solids.length - 1) / 2) * size * 0.18 : 0;
    const py = wet ? size * 0.22 : 0;
    if (part === 'salt' && wet) {
      // Dissolved salt is not drawn as a visible pile in the solution.
      return;
    }
    if (part === 'iron' || part === 'stones') {
      for (let j = 0; j < (singleton ? 3 : 2); j++) {
        const node = image(scene, part === 'iron' ? 'science-iron-nail' : 'science-pebble', px + (j - 1) * size * scale * 0.18, py + (j % 2) * size * scale * 0.1, size * scale * 0.66);
        if (part === 'iron') node.setAngle(j * 29 - 26);
        group.add(node);
      }
    } else group.add(image(scene, part === 'salt' ? 'general-salt' : 'general-sand-mound', px, py, size * scale, size * scale * 0.66, part === 'salt' ? 'evaporation-trimmed' : 'sieve-trimmed'));
  });
  if (wet) group.add(image(scene, 'science-filter-beaker', 0, 0, size * 0.86, size));
  return group;
}

export function toolSprite(scene, id, x, y, size = 80) {
  const group = scene.add.container(x, y);
  if (id === 'filter') {
    group.add(image(scene, 'science-filter-funnel', 0, -size * 0.18, size * 0.64, size * 0.64));
    group.add(image(scene, 'science-filter-beaker', 0, size * 0.28, size * 0.37, size * 0.4));
  } else {
    const key = { magnet: 'science-magnet', sieve: 'science-sieve', evaporate: 'science-evaporation-apparatus', decant: 'science-decant-jar' }[id];
    if (key) group.add(image(scene, key, 0, 0, size, size));
    if (id === 'decant') group.setAngle(24);
  }
  return group;
}

function connector(scene, points, nodes = scene.layer, size = 11) {
  const g = scene.add.graphics();
  g.lineStyle(9, 0x9c5f1c).strokePoints(points.map(([x,y]) => ({ x, y })), false);
  g.lineStyle(5, 0xffc14a).strokePoints(points.map(([x,y]) => ({ x, y })), false);
  const [x, y] = points.at(-1);
  g.fillStyle(0xffc14a).fillTriangle(x + size, y, x - size, y - size, x - size, y + size);
  nodes.add ? nodes.add(g) : nodes.push(g);
}

function selectStream(scene, id) {
  if (scene.currentModal || !scene.state.streams.some(s => s.id === id)) return;
  scene.state = { ...scene.state, selected: id, pendingTool: null, message: '' };
  scene.render();
}

function streamZone(scene, stream, x, y, width, height) {
  const zone = scene.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
  zone.on('pointerup', () => selectStream(scene, stream.id));
  scene.layer.add(zone);
  scene.controlViews.push({ id: `stream-${stream.id}`, x, y, width, height });
}

function streamCard(scene, stream, x, y, width, height, { input = false, live = true } = {}) {
  const selected = live && scene.state.selected === stream.id;
  scene.layer.add(panel(scene, x, y, width, height, { fill: 0xe9cf98, edge: selected ? 0xffd54a : 0xb98a43 }));
  if (selected) scene.layer.add(scene.add.rectangle(x, y, width - 9, height - 9).setStrokeStyle(3, 0xffd54a));
  const pure = stream.parts.length === 1;
  const label = input ? scene.state.steps.length ? 'PROCESS INPUT' : 'INPUT MIXTURE' : pure ? stream.parts[0] === 'vapor' ? 'WATER VAPOR' : `${name(stream.parts)} RECOVERED` : name(stream.parts);
  const title = qHeading(scene, x, y - height / 2 + 20, label, input ? 21 : 19, '#292116');
  if (title.width > width - 35) title.setFontSize(Math.floor(parseFloat(title.style.fontSize) * (width - 35) / title.width));
  scene.layer.add(circuitSample(scene, stream.parts, x, input ? y + 1 : y + 4, input ? 132 : 62));
  if (input) qText(scene, x, y + height / 2 - 29, name(stream.parts), 16, '#292116', width - 34);
  else {
    const status = !live ? 'PROCESSED' : pure ? stream.parts[0] === 'vapor' ? 'NOT COLLECTED' : 'RECOVERED' : 'SELECT STREAM';
    scene.layer.add(scene.add.rectangle(x, y + height / 2 - 17, 159, 22, pure && live ? 0x23613b : 0x3d4b5b));
    qText(scene, x, y + height / 2 - 17, status, 14, '#fff0d6');
  }
  if (live) streamZone(scene, stream, x, y, width, height);
}

function processRecord(scene) {
  scene.layer.add(panel(scene, 420, 460, 788, 75, { fill: 0xe9cf98 }));
  qText(scene, 82, 459, 'PROCESS\nRECORD', 16, '#292116');
  if (!scene.state.steps.length) {
    qText(scene, 483, 460, 'Your separation steps will appear here.', 19, '#65512f', 619);
    return;
  }
  scene.state.steps.slice(-2).forEach((step, i, rows) => {
    const y = rows.length === 1 ? 459 : 444 + i * 31;
    qText(scene, 149, y, `${i + 1}.`, 14, '#292116');
    scene.layer.add(circuitSample(scene, step.input, 181, y, 27));
    qText(scene, 257, y, name(step.input), 12, '#292116', 119);
    connector(scene, [[327,y],[343,y]], scene.layer, 5);
    scene.layer.add(toolSprite(scene, step.tool, 379, y, 26));
    qText(scene, 435, y, toolName(step.tool), 12, '#292116');
    connector(scene, [[479,y],[495,y]], scene.layer, 5);
    step.outputs.forEach((out, j) => {
      const x = 548 + j * 154;
      scene.layer.add(circuitSample(scene, out.parts, x - 27, y, 27));
      qText(scene, x + 39, y, name(out.parts), 12, '#292116', 103);
    });
  });
}

export function renderRecoveryCircuit(scene) {
  const s = scene.state, selected = s.streams.find(v => v.id === s.selected), latest = s.steps.at(-1);
  const focus = s.steps.find(step => step.outputs.some(out => out.id === s.selected)) ?? latest;
  const source = focus ? { id: focus.sourceId, parts: focus.input } : s.streams[0];
  scene.layer.add(panel(scene, 420, 320, 808, 344, { fill: 0x081b2b }));
  streamCard(scene, source, 174, 300, 224, 220, { input: true, live: s.streams.some(v => v.id === source.id) });
  const tool = focus?.tool ?? s.pendingTool;
  connector(scene, [[290,310],[330,310]]);
  scene.layer.add(panel(scene, 423, 308, 158, 161, { fill: 0x0a1e30 }));
  qText(scene, 423, 246, tool ? toolName(tool) : 'CHOOSE TOOL', 20);
  if (tool) scene.layer.add(toolSprite(scene, tool, 423, 322, 105));
  else {
    qText(scene, 423, 311, '?', 54, '#8bd8ec');
    qText(scene, 423, 365, 'THEN APPLY', 16, '#c5b3ef');
  }
  connector(scene, [[507,289],[541,236],[554,236]]);
  connector(scene, [[507,329],[541,356],[554,356]]);
  if (focus) focus.outputs.forEach((out, i) => streamCard(scene, out, 676, 236 + i * 120, 235, 115, { live: s.streams.some(v => v.id === out.id) }));
  else for (let i = 0; i < 2; i++) {
    scene.layer.add(panel(scene, 676, 236 + i * 120, 235, 115, { fill: 0x102436 }));
    qText(scene, 676, 220 + i * 120, `OUTPUT ${i + 1}`, 22, '#67d8ee');
    qText(scene, 676, 259 + i * 120, 'Apply a suitable tool.', 17, '#c5b3ef');
  }
  processRecord(scene);
  SCIENCE_TOOLS.forEach((t, i) => {
    const x = 96 + i * 160, chosen = s.pendingTool === t.id;
    scene.layer.add(panel(scene, x, 554, 151, 111, { fill: 0x081b2b, edge: chosen ? 0xffd54a : 0xb98a43 }));
    if (chosen) scene.layer.add(scene.add.rectangle(x, 554, 141, 102).setStrokeStyle(3, 0xffd54a));
    qText(scene, x, 515, t.label, 19);
    scene.layer.add(toolSprite(scene, t.id, x, 567, 71));
    qZone(scene, `tool-${t.id}`, x, 554, 151, 111, () => scene.perform('choose-tool', t.id));
  });
  scene.button('apply', 420, 622, 'APPLY TOOL', () => scene.perform('apply'), { width: 363, height: 36, size: 24, enabled: scene.phase === 'playing' && Boolean(s.pendingTool) });

  scene.layer.add(panel(scene, 1050, 391, 428, 488, { fill: 0x081b2b }));
  qHeading(scene, 1050, 179, 'RECOVERY GOALS', 25, '#67d8ee');
  scene.layer.add(panel(scene, 1050, 281, 388, 174, { fill: 0xe9cf98 }));
  goals(scene.round).forEach(([part, label], i) => {
    const y = 226 + i * 56, recovered = s.streams.find(v => v.parts.length === 1 && v.parts[0] === part);
    scene.layer.add(circuitSample(scene, [part], 905, y, 44));
    qText(scene, 997, y, label, 17, '#292116', 132);
    scene.layer.add(scene.add.rectangle(1160, y, 129, 39, recovered ? part === 'vapor' ? 0x285568 : 0x25683e : 0xada595).setStrokeStyle(1, recovered ? 0x77c587 : 0x756950));
    qText(scene, 1160, y, recovered ? part === 'vapor' ? 'ACCOUNTED' : 'RECOVERED' : 'PENDING', 14, recovered ? '#d5ffbd' : '#50483e');
    if (i < 2) scene.layer.add(scene.add.rectangle(1050, y + 28, 340, 1, 0xb98a43));
    if (recovered) streamZone(scene, recovered, 1050, y, 367, 54);
  });
  qHeading(scene, 1050, 389, 'SELECTED STREAM', 23, '#67d8ee');
  scene.layer.add(panel(scene, 1050, 450, 386, 104, { fill: 0xe9cf98 }));
  if (selected) {
    scene.layer.add(circuitSample(scene, selected.parts, 910, 451, 72));
    const title = qHeading(scene, 1110, 417, name(selected.parts), 19, '#292116', 246);
    if (title.height > 36) title.setFontSize(16);
    if (s.pendingTool) {
      qText(scene, 1111, 451, 'NEXT TOOL', 14, '#65512f');
      scene.layer.add(toolSprite(scene, s.pendingTool, 1017, 476, 33));
      qText(scene, 1126, 479, toolName(s.pendingTool), 19, '#292116');
    } else qText(scene, 1111, 468, selected.parts.length > 1 ? 'Choose a tool below.' : selected.parts[0] === 'vapor' ? 'Water left as vapor.\nIt was not collected.' : 'Single component.\nRecovered separately.', 17, '#65512f', 245);
  }
}

export function recoveryCircuitResults(scene) {
  const s = scene.state, complete = scene.phase !== 'playing';
  scene.layer.add(panel(scene, 1050, 551, 386, 80, { fill: 0x142e21, edge: 0x81ac58 }));
  qHeading(scene, 1050, 526, complete ? scene.phase === 'finished' ? 'ACTIVITY COMPLETE' : 'CIRCUIT COMPLETE' : 'FEEDBACK', 21, '#67d8ee');
  const mixed = s.streams.find(v => v.parts.length > 1);
  const text = qText(scene, 1050, 559, complete ? scene.round === 2 ? 'Sand and salt recovered.\nWater left as vapor.' : 'All three components recovered\nin separate outputs.' : s.message || (s.steps.length ? mixed ? `Select ${name(mixed.parts).toLowerCase()}.\nChoose its next separation tool.` : 'Inspect your outputs,\nthen check the circuit.' : 'Select the input mixture.\nChoose a tool, then apply it.'), 17, '#fff0d6', 340);
  for (let size = 16; text.height > 44 && size >= 14; size--) text.setFontSize(size);
  scene.button(complete ? 'retry' : 'reset', 920, 611, complete ? 'RETRY' : 'RESET', () => scene.resetRound(), { width: 138, height: 43, size: 23 });
  scene.button(complete ? 'next' : 'check', 1112, 611, complete ? scene.phase === 'finished' ? 'LESSON MAP' : 'NEXT CHALLENGE' : 'CHECK RESULT', () => complete ? scene.nextRound() : scene.checkRound(), { width: 232, height: 43, size: 23 });
}

export function openRecoveryCircuitHelp(scene) {
  if (scene.currentModal) return;
  scene.minigameHelpOpen = true;
  showModal(scene, { name: 'minigame-help', title: 'HOW TO PLAY', width: 1120, height: 580,
    titleTop: 43, titleSize: 33, buttons: [], body: () => {
      const nodes = [], text = (x, y, label, size = 20, color = '#fff0d6', width = 0, role = 'body') => {
        const t = (role === 'heading' ? supplyHeading : supplyText)(scene, x, y, label, size, color); if (width) t.setWordWrapWidth(width, true); nodes.push(t);
      };
      text(640, 145, 'Choose a stream and a tool. Apply it, then follow both outputs.', 22, '#67d8ee');
      for (let i = 0; i < 3; i++) {
        const x = 294 + i * 346;
        nodes.push(panel(scene, x, 299, 326, 279, { fill: 0x102436 }));
        text(x, 187, ['1. SELECT A STREAM', '2. CHOOSE AND APPLY', '3. FOLLOW BOTH OUTPUTS'][i], 21, '#b5e748', 0, 'heading');
        if (!i) {
          nodes.push(panel(scene, x, 279, 180, 134, { fill: 0xe9cf98 }));
          nodes.push(circuitSample(scene, circuitInput(0), x, 274, 91));
          text(x, 329, 'IRON + SAND + WATER', 14, '#292116');
        } else if (i === 1) {
          nodes.push(toolSprite(scene, 'magnet', x, 262, 76));
          nodes.push(control(scene, x, 329, 'APPLY TOOL', () => {}, { width: 230, height: 37, size: 20 }));
        } else {
          nodes.push(circuitSample(scene, ['iron'], x - 74, 274, 69));
          nodes.push(circuitSample(scene, ['sand', 'water'], x + 70, 274, 87));
          text(x - 74, 329, 'RECOVERED', 14, '#b5e748'); text(x + 70, 329, 'PROCESS AGAIN', 14, '#67d8ee', 0, 'heading');
        }
        text(x, 386, ['Tap an input or an available output. A gold border marks the selected stream.', 'Tap one of the five tool cards. Press Apply Tool to run it on your selected stream.', 'Check the recovery goals. Select a mixed output for another process, then Check Result.'][i], 18, '#fff0d6', 285);
      }
      nodes.push(panel(scene, 640, 505, 1054, 118, { fill: 0x142e21 }));
      nodes.push(scene.add.image(182, 505, 'supply-guide').setDisplaySize(75, 90));
      text(700, 470, 'SCIENTIST NOTE', 23, '#ffce58', 0, 'heading');
      text(700, 508, 'Different orders can work if you process the correct output.\nPaper filtration passes dissolved salt. Evaporation leaves salt and releases vapor.', 18, '#fff0d6', 851);
      text(700, 548, 'Vapor is accounted for, not collected. Separate water is not automatically safe to drink.', 17, '#c5b3ef', 851);
      nodes.push(control(scene, 640, 611, 'GOT IT', () => { scene.minigameHelpOpen = false; closeOpenModal(scene); scene.updateTestState(); }, { width: 180, height: 50, fill: 0x32641f }));
      return nodes;
    },
  });
  scene.updateTestState();
}
