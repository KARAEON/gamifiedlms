import { SERVICE_ROUNDS, SCIENCE_TOOLS } from '../config/scienceQuarterGames.js';
import { checkSchedule } from '../games/science/scienceLogic.js';
import { magnetPanel as panel, magnetControl as control } from './magnetWorkshopUi.js';
import { qText, qZone, qHeading } from './scienceQuarterUi.js';
import { supplyText, supplyGlyph, supplyHeading } from './supplyCartUi.js';
import { closeOpenModal, showModal } from './ui.js';

const COLORS = [0x4daf44, 0x51aada, 0x9152ce];
const GRID = { left: 28, top: 278, label: 182, cell: 120, row: 50, header: 34 };
const toolLabel = id => SCIENCE_TOOLS.find(t => t.id === id)?.label ?? id;

function sprite(scene, key, x, y, width, height = width, frame, nodes = scene.layer) {
  const texture = scene.textures.get(key);
  const image = scene.add.image(x, y, key, frame ?? (texture.has('trimmed') ? 'trimmed' : undefined));
  image.setScale(Math.min(width / image.width, height / image.height));
  nodes.add ? nodes.add(image) : nodes.push(image);
  return image;
}

function product(scene, job, x, y, size, nodes = scene.layer) {
  if (job.product === 'Iron') return sprite(scene, 'science-iron-nail', x, y, size, size, undefined, nodes);
  if (job.product === 'Salt') return sprite(scene, 'general-salt', x, y, size, size, 'evaporation-trimmed', nodes);
  if (job.product === 'Upper liquid') return sprite(scene, 'general-bottled-water', x, y, size, size, undefined, nodes);
  const image = sprite(scene, 'general-sand-mound', x, y, size, size, 'sieve-trimmed', nodes);
  if (job.product === 'Clay') image.setTint(0xa68b73);
  return image;
}

function toolIcon(scene, id, x, y, size, nodes = scene.layer) {
  const key = { magnet: 'science-magnet', sieve: 'science-sieve', filter: 'science-funnel', evaporate: 'science-evaporating-dish', decant: 'science-decant-jar' }[id];
  const image = sprite(scene, key, x, y, size, size, undefined, nodes);
  if (id === 'decant') image.setAngle(22);
  return image;
}

function selectRequest(scene, index) {
  if (scene.currentModal) return;
  // Completed shifts still allow inspecting each customer's recovered product.
  scene.state = { ...scene.state, selected: index };
  scene.render();
}

export function renderCommunityShift(scene) {
  const s = scene.state, jobs = SERVICE_ROUNDS[scene.round];
  jobs.forEach((job, i) => {
    const x = 156 + i * 264, selected = s.selected === i;
    scene.layer.add(panel(scene, x, 208, 256, 106, { fill: 0xe9cf98, edge: selected ? 0xffcd43 : 0xb98a43 }));
    if (selected) scene.layer.add(scene.add.rectangle(x, 208, 245, 97).setStrokeStyle(3, 0xffd54a));
    const title = qHeading(scene, x, 178, job.label, 21, '#292116');
    if (title.width > 220) title.setFontSize(Math.floor(parseFloat(title.style.fontSize) * 220 / title.width));
    product(scene, job, x - 78, 219, 68);
    const companion = job.tool === 'sieve' ? 'science-pebble' : job.mixture.includes('wood') ? 'science-wood-chip' : job.tool === 'magnet' ? 'general-sand-mound' : 'general-bottled-water';
    sprite(scene, companion, x - 51, 235, 38, 38, companion === 'general-sand-mound' ? 'sieve-trimmed' : undefined);
    qText(scene, x + 42, 210, `${job.product} from\n${job.mixture.toLowerCase()}`, 16, '#292116', 159);
    qText(scene, x + 42, 245, `${job.duration} time slot${job.duration === 1 ? '' : 's'}`, 17, '#65512f');
    const zone = scene.add.zone(x, 208, 256, 106).setInteractive({ useHandCursor: true });
    zone.on('pointerup', () => selectRequest(scene, i));
    scene.layer.add(zone);
    scene.controlViews.push({ id: `job-${i}`, x, y: 208, width: 256, height: 106 });
  });

  const { left, top, label, cell, row, header } = GRID;
  const width = label + cell * 5, height = header + row * 5;
  scene.layer.add(panel(scene, left + width / 2, top + height / 2, width + 10, height + 10, { fill: 0x0c1c2f }));
  const lines = scene.add.graphics();
  lines.lineStyle(1, 0xbd8b4c);
  for (let i = 0; i <= 5; i++) lines.lineBetween(left + label + i * cell, top, left + label + i * cell, top + height);
  for (let i = 0; i <= 5; i++) lines.lineBetween(left, top + header + i * row, left + width, top + header + i * row);
  scene.layer.add(lines);
  qText(scene, left + label / 2, top + header / 2, 'STATION', 16, '#67d8ee');
  for (let time = 0; time < 5; time++) qText(scene, left + label + (time + 0.5) * cell, top + header / 2, `${time + 1}`, 22);
  SCIENCE_TOOLS.forEach((tool, r) => {
    const y = top + header + (r + 0.5) * row;
    toolIcon(scene, tool.id, left + 35, y, 40);
    qText(scene, left + 110, y, tool.label, 18);
    for (let time = 0; time < 5; time++) {
      const x = left + label + (time + 0.5) * cell;
      qZone(scene, `book-${tool.id}-${time}`, x, y, cell - 2, row - 2, () => scene.perform('book', { tool: tool.id, start: time }));
    }
  });
  // Visual-only bars leave all grid cells available for moving the selected job.
  for (const [index, booking] of Object.entries(s.bookings)) {
    const job = jobs[index], r = SCIENCE_TOOLS.findIndex(t => t.id === booking.tool);
    const span = Math.min(job.duration, 5 - booking.start);
    const x = left + label + (booking.start + span / 2) * cell, y = top + header + (r + 0.5) * row;
    const late = booking.start + job.duration > 5, wrong = booking.tool !== job.tool;
    const collision = Object.entries(s.bookings).some(([other, b]) => other !== index && b.tool === booking.tool && b.start < booking.start + job.duration && booking.start < b.start + jobs[other].duration);
    const g = scene.add.graphics();
    g.fillStyle(wrong || late || collision ? 0xa54241 : COLORS[index]).fillRect(x - span * cell / 2 + 5, y - 20, span * cell - 10, 40);
    g.lineStyle(Number(index) === s.selected ? 3 : 1, Number(index) === s.selected ? 0xffd54a : 0xbcd6d9).strokeRect(x - span * cell / 2 + 5, y - 20, span * cell - 10, 40);
    g.fillStyle(0xffffff, 0.2).fillRect(x - span * cell / 2 + 7, y - 18, span * cell - 14, 4);
    scene.layer.add(g);
    qText(scene, x, y, `JOB ${Number(index) + 1}${late ? ' !' : ''}`, 20, '#101b27');
  }
  scene.button('run', 420, 600, 'RUN THE SHIFT', () => scene.perform('run'), { width: 596, height: 53, size: 29, enabled: scene.phase === 'playing' });

  const job = jobs[s.selected], booking = s.bookings[s.selected];
  scene.layer.add(panel(scene, 1050, 391, 428, 488, { fill: 0x081b2b }));
  qHeading(scene, 1050, 180, 'SELECTED REQUEST', 25, '#67d8ee');
  scene.layer.add(panel(scene, 1050, 308, 388, 216, { fill: 0xe9cf98 }));
  scene.layer.add(scene.add.rectangle(925, 272, 109, 122, 0x243345).setStrokeStyle(2, 0xb98a43));
  sprite(scene, 'science-community-worker', 925, 272, 100, 116);
  qText(scene, 1110, 221, job.label, 20, '#292116', 223);
  product(scene, job, 1018, 266, 52);
  qText(scene, 1141, 261, job.product.toUpperCase(), 19, '#292116', 164);
  qText(scene, 1111, 303, job.benefit, 16, '#65512f', 221);
  scene.layer.add(scene.add.rectangle(1050, 343, 342, 1, 0xb98a43));
  toolIcon(scene, booking?.tool ?? job.tool, 905, 367, 39);
  qText(scene, 1086, 359, `METHOD: ${booking ? toolLabel(booking.tool) : 'NOT BOOKED'}`, 19, '#292116', 286);
  const clock = supplyGlyph(scene, 905, 398, 'clock', 0x292116, 2);
  scene.layer.add(clock);
  qText(scene, 1086, 390, `TIME: ${job.duration} slot${job.duration === 1 ? '' : 's'}${booking ? ` | START ${booking.start + 1}` : ''}`, 17, '#292116', 287);

  const valid = s.run && checkSchedule(s).success;
  scene.layer.add(panel(scene, 1050, 464, 386, 80, { fill: 0x142e21, edge: 0x81ac58 }));
  qHeading(scene, 1050, 438, valid ? 'RECOVERED PRODUCT' : 'EXPECTED RESULT', 21, '#67d8ee');
  product(scene, job, 903, 477, 44);
  const benefit = qText(scene, 948, 476, valid ? job.benefit : `Recover ${job.product.toLowerCase()} for\n${job.label.toLowerCase()}.`, 17, '#b5e748', 272, 'left');
  for (let size = 16; benefit.height > 42 && size >= 14; size--) benefit.setFontSize(size);
}

export function communityShiftResults(scene) {
  const complete = scene.phase !== 'playing', s = scene.state;
  const valid = s.run && checkSchedule(s).success;
  scene.layer.add(panel(scene, 1050, 551, 386, 80, { fill: valid ? 0x142e21 : 0x101b30, edge: valid ? 0x81ac58 : 0x778491 }));
  qHeading(scene, 1050, 525, complete ? scene.phase === 'finished' ? 'ACTIVITY COMPLETE' : 'SHIFT COMPLETE' : 'FEEDBACK', 21, '#67d8ee');
  qText(scene, 1050, 559, complete ? 'All three requests served.\nInspect each recovered product.' : s.message || 'Select a request, then choose\na station and starting slot.', 17, '#fff0d6', 340);
  scene.button(complete ? 'retry' : 'reset', 920, 611, complete ? 'RETRY' : 'RESET', () => scene.resetRound(), { width: 138, height: 43, size: 23 });
  scene.button(complete ? 'next' : 'check', 1112, 611, complete ? scene.phase === 'finished' ? 'LESSON MAP' : 'NEXT CHALLENGE' : 'CHECK RESULT', () => complete ? scene.nextRound() : scene.checkRound(), { width: 232, height: 43, size: 23 });
}

export function openCommunityShiftHelp(scene) {
  if (scene.currentModal) return;
  scene.minigameHelpOpen = true;
  showModal(scene, { name: 'minigame-help', title: 'HOW TO PLAY', width: 1120, height: 580,
    titleTop: 43, titleSize: 33, buttons: [], body: () => {
      const nodes = [];
      const text = (x, y, label, size = 20, color = '#fff0d6', width = 0, role = 'body') => {
        const t = (role === 'heading' ? supplyHeading : supplyText)(scene, x, y, label, size, color);
        if (width) t.setWordWrapWidth(width, true); nodes.push(t);
      };
      text(640, 145, 'Recover useful materials for the community within a five-slot shift.', 22, '#67d8ee');
      for (let i = 0; i < 3; i++) {
        const x = 294 + i * 346;
        nodes.push(panel(scene, x, 299, 326, 279, { fill: 0x102436 }));
        text(x, 187, ['1. CHOOSE A REQUEST', '2. BOOK ITS STATION', '3. RUN AND CHECK'][i], 21, '#b5e748', 0, 'heading');
        if (i === 0) {
          nodes.push(panel(scene, x, 283, 266, 126, { fill: 0xe9cf98 }));
          product(scene, SERVICE_ROUNDS[0][1], x - 80, 281, 66, nodes);
          text(x + 37, 254, 'BUILDING YARD', 18, '#292116');
          text(x + 37, 286, 'Recover sand\n2 time slots', 17, '#292116');
        } else if (i === 1) {
          toolIcon(scene, 'sieve', x - 100, 287, 47, nodes);
          for (let time = 0; time < 5; time++) {
            nodes.push(scene.add.rectangle(x - 48 + time * 35, 281, 33, 46, time < 2 ? COLORS[1] : 0x213448).setStrokeStyle(1, 0xb98a43));
            text(x - 48 + time * 35, 281, `${time + 1}`, 19, '#fff0d6');
          }
          text(x + 22, 330, 'JOB 2: TWO SLOTS', 18, '#67d8ee');
        } else {
          nodes.push(control(scene, x, 258, 'RUN THE SHIFT', () => {}, { width: 254, height: 46 }));
          product(scene, SERVICE_ROUNDS[0][1], x - 70, 322, 70, nodes);
          text(x + 51, 322, 'USEFUL SAND\nFOR BUILDING', 18, '#b5e748', 0, 'heading');
        }
        text(x, 385, ['Tap a customer card. Read the desired material, mixture, and job duration.', 'Tap a station and starting slot. The bar spans the whole job. Tap another cell to move it.', 'Run to inspect your plan. Check Result completes the shift. Retry when a method or time is wrong.'][i], 18, '#fff0d6', 285);
      }
      nodes.push(panel(scene, 640, 505, 1054, 118, { fill: 0x142e21 }));
      nodes.push(scene.add.image(182, 505, 'supply-guide').setDisplaySize(75, 90));
      text(700, 470, 'SCIENTIST NOTE', 23, '#ffce58', 0, 'heading');
      text(700, 510, 'All jobs must finish by slot 5. Different stations can work at the same time;\ntwo jobs at the same station cannot overlap. Choose a method for the requested material.', 18, '#fff0d6', 851);
      text(700, 548, 'These time slots are planning units, not actual experiment durations. No timer.', 17, '#c5b3ef', 851);
      nodes.push(control(scene, 640, 611, 'GOT IT', () => {
        scene.minigameHelpOpen = false; closeOpenModal(scene); scene.updateTestState();
      }, { width: 180, height: 50, fill: 0x32641f }));
      return nodes;
    },
  });
  scene.updateTestState();
}
