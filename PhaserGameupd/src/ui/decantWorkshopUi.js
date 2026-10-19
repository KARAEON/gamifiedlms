import { magnetPanel as workshopPanel, magnetControl as workshopControl } from './magnetWorkshopUi.js';
import { qText, qHeading } from './scienceQuarterUi.js';
import { supplyText, supplyHeading } from './supplyCartUi.js';
import { closeOpenModal, showModal } from './ui.js';
import { belowSurface, filledJar, transformJarPoint } from '../games/science/decantGeometry.js';

// Normalized interior follows the measured jar silhouette, inside its glass edges.
const INTERIOR = [[-0.26, -0.37], [0.26, -0.37], [0.36, -0.26], [0.36, 0.37], [0.29, 0.42], [-0.29, 0.42], [-0.36, 0.37], [-0.36, -0.26]];

function inside(point, polygon) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) result = !result;
  }
  return result;
}

function jar(scene, x, y, width, height, { angle = 0, amount = 0, source = false, settled = 2, dirty = false } = {}) {
  const glass = scene.add.image(x, y, 'science-decant-jar', 'trimmed');
  glass.setScale(Math.min(width / glass.width, height / glass.height)).setAngle(angle);
  const w = glass.displayWidth, h = glass.displayHeight;
  const interior = INTERIOR.map(point => transformJarPoint(point, x, y, w, h, angle));
  const water = filledJar(interior, (source ? 0.15 : 0) + amount / 100 * 0.68);
  const sand = filledJar(interior, source ? settled >= 2 ? 0.15 : settled === 1 ? 0.09 : 0.035 : dirty ? 0.075 : 0);
  const g = scene.add.graphics();
  if (amount > 0) {
    g.fillStyle(dirty || source && settled < 2 ? 0x9aa787 : 0x55b5da, 0.82).fillPoints(water.points, true);
    const surface = belowSurface(interior, water.surface).filter(p => Math.abs(p.y - water.surface) < 0.001);
    if (surface.length >= 2) g.lineStyle(Math.max(1, w / 70), 0xb8e8f1, 0.95).lineBetween(surface[0].x, surface[0].y, surface[1].x, surface[1].y);
  }
  if (sand.points.length) g.fillStyle(0xd4ab6e, 0.95).fillPoints(sand.points, true);
  const grainSize = Math.max(1, w / 70);
  const bounds = { left: Math.min(...interior.map(p => p.x)), right: Math.max(...interior.map(p => p.x)), top: Math.min(...interior.map(p => p.y)), bottom: Math.max(...interior.map(p => p.y)) };
  if (source || dirty) {
    for (let i = 0; i < 190; i++) {
      const px = bounds.left + ((i * 0.61803398875) % 1) * (bounds.right - bounds.left);
      const py = bounds.top + ((i * 0.41421356237) % 1) * (bounds.bottom - bounds.top);
      const p = { x: px, y: py };
      const inBed = inside(p, sand.points);
      const suspended = (dirty || settled < 2) && amount > 0 && inside(p, water.points) && i % (settled === 1 ? 3 : 2) === 0;
      if (inBed || suspended) g.fillStyle(i % 3 ? 0x8c632f : 0xffd79a, 0.9).fillRect(px, py, grainSize, grainSize);
    }
  }
  const group = scene.add.container(); group.add([g, glass]);
  return { group, lip: transformJarPoint([0.21, -0.45], x, y, w, h, angle) };
}

function pourStream(scene, from, to, dirty) {
  const g = scene.add.graphics();
  const points = [];
  for (let i = 0; i <= 25; i++) {
    const t = i / 25, u = 1 - t;
    points.push({ x: u * u * from.x + 2 * u * t * (from.x + (to.x - from.x) * 0.85) + t * t * to.x,
      y: u * u * from.y + 2 * u * t * (from.y - 16) + t * t * to.y });
  }
  g.lineStyle(8, dirty ? 0xa28c5d : 0x489ec7, 0.9).strokePoints(points);
  g.lineStyle(3, dirty ? 0xe0c295 : 0xb5e8f2, 0.9).strokePoints(points);
  return g;
}

export { jar as decantJar, pourStream as decantStream };

function metricCard(scene, y) {
  scene.layer.add(workshopPanel(scene, 1050, y, 383, 69, { fill: 0xe9cf98 }));
}

export function renderDecantWorkshop(scene) {
  const s = scene.state, playing = scene.phase === 'playing';
  scene.layer.add(workshopPanel(scene, 420, 388, 808, 482));
  scene.layer.add(scene.add.image(420, 388, 'science-workshop-backdrop').setDisplaySize(774, 458));
  scene.layer.add(scene.add.rectangle(420, 388, 774, 458, 0x070d14, 0.2));
  const source = jar(scene, 370, 364, 245, 316, { angle: s.angle, amount: s.remaining, source: true, settled: s.settled });
  const receiver = jar(scene, 638, 407, 161, 225, { amount: s.collected, dirty: s.sediment > 0 });
  scene.layer.add(source.group);
  if (s.collected > 0 && s.angle >= 10) scene.layer.add(pourStream(scene, source.lip, receiver.lip, s.sediment > 0));
  scene.layer.add(receiver.group);
  for (const [x, label, width] of [[330, 'SOURCE SAMPLE', 206], [638, 'COLLECTED LIQUID', 211]]) {
    scene.layer.add(workshopPanel(scene, x, 541, width, 36, { fill: 0x101b30 }));
    qText(scene, x, 541, label, 18, '#fff0d6');
  }
  scene.button('settle', 166, 589, 'LET IT SETTLE', () => scene.perform('settle'), { width: 236, height: 59, size: 24, enabled: playing && s.collected === 0 && s.settled < 3 });
  scene.button('angle-less', 367, 589, '- TILT', () => scene.perform('angle', -10), { width: 137, height: 59, size: 24, enabled: playing && s.angle > 0 });
  scene.button('angle-more', 521, 589, '+ TILT', () => scene.perform('angle', 10), { width: 137, height: 59, size: 24, enabled: playing && s.angle < 50 });
  scene.button('pour', 706, 589, 'POUR A LITTLE', () => scene.perform('pour'), { width: 206, height: 59, size: 22, enabled: playing && s.remaining > 0 });

  scene.layer.add(workshopPanel(scene, 1050, 391, 428, 488));
  qHeading(scene, 1050, 180, 'SETTLING PROGRESS', 25, '#67d8ee');
  metricCard(scene, 228);
  scene.layer.add(jar(scene, 923, 228, 49, 57, { angle: s.angle, amount: s.remaining }).group);
  qText(scene, 1098, 221, `TILT: ${s.angle}°`, 25, '#292116');
  qText(scene, 1098, 247, s.settled >= 2 ? 'SEDIMENT SETTLED' : s.settled === 1 ? 'STILL SETTLING' : 'FRESHLY STIRRED', 15, '#65512f');
  metricCard(scene, 303);
  scene.layer.add(jar(scene, 923, 303, 49, 57, { amount: s.collected, dirty: s.sediment > 0 }).group);
  qText(scene, 1098, 295, `COLLECTED: ${s.collected}%`, 23, '#292116');
  qText(scene, 1098, 323, `REMAINS IN SOURCE: ${s.remaining}%`, 14, '#65512f');
  metricCard(scene, 378);
  scene.layer.add(jar(scene, 904, 378, 41, 53, { amount: s.remaining, source: true, settled: s.settled }).group);
  scene.layer.add(jar(scene, 949, 378, 41, 53, { amount: s.collected, dirty: s.sediment > 0 }).group);
  qText(scene, 1100, 378, s.sediment ? 'Sediment entered\nthe receiving jar.' : s.collected ? 'Upper liquid pours out.\nSand stays in the source.' : s.settled >= 2 ? 'Sand rests at the bottom.\nUpper liquid can pour.' : 'Let the sand settle\nbefore pouring.', 18, '#292116', 235);
  qHeading(scene, 877, 428, 'GOAL', 22, '#67d8ee', 350, 'left');
  scene.layer.add(workshopPanel(scene, 1050, 464, 386, 54, { fill: 0x142e21, edge: 0x81ac58 }));
  qText(scene, 1050, 464, 'Collect at least 60%.\nLeave at least 20% behind.', 19, '#b5e748');
}

export function decantResults(scene) {
  const complete = scene.phase !== 'playing', s = scene.state;
  qHeading(scene, 877, 506, 'FEEDBACK', 22, '#67d8ee', 350, 'left');
  scene.layer.add(workshopPanel(scene, 1050, 548, 386, 66, { fill: s.sediment ? 0x3c2327 : 0x142e21, edge: s.sediment ? 0xd37971 : 0x81ac58 }));
  const message = complete ? 'Sediment stayed in the source.\nUpper liquid was collected.' : s.message || (s.sediment ? 'Sediment reached the receiver.\nReset and pour gently.' : s.collected ? 'Upper liquid collected.\nKeep some above the sediment.' : s.settled >= 2 ? 'Ready to tilt and pour gently.' : s.settled === 1 ? 'The sand is still settling.\nLet it settle once more.' : 'Let the sand settle,\nthen tilt and pour a little.');
  qText(scene, 1050, 548, message, 18, '#fff0d6', 341);
  scene.button(complete ? 'retry' : 'reset', 920, 607, complete ? 'RETRY' : 'RESET', () => scene.resetRound(), { width: 138, height: 48, size: 24 });
  scene.button(complete ? 'next' : 'check', 1112, 607,
    complete ? scene.phase === 'finished' ? 'LESSON MAP' : 'NEXT CHALLENGE' : 'CHECK RESULT',
    () => complete ? scene.nextRound() : scene.checkRound(), { width: 232, height: 48, size: 23 });
}

export function openDecantHelp(scene) {
  if (scene.currentModal) return;
  scene.minigameHelpOpen = true;
  showModal(scene, { name: 'minigame-help', title: 'HOW TO PLAY', width: 1120, height: 580,
    titleTop: 43, titleSize: 33, buttons: [], body: () => {
      const nodes = [];
      const text = (x, y, label, size = 20, color = '#fff0d6', width = 0, role = 'body') => {
        const t = (role === 'heading' ? supplyHeading : supplyText)(scene, x, y, label, size, color);
        if (width) t.setWordWrapWidth(width, true); nodes.push(t);
      };
      text(640, 145, 'Settle the sand. Pour gently. Stop with some liquid left in the source.', 22, '#67d8ee');
      for (let i = 0; i < 3; i++) {
        const x = 294 + i * 346;
        nodes.push(workshopPanel(scene, x, 299, 326, 279, { fill: 0x102436 }));
        text(x, 187, ['1. LET IT SETTLE', '2. POUR GENTLY', '3. STOP IN TIME'][i], 22, '#b5e748', 0, 'heading');
        const source = jar(scene, x - 59, 284, 82, 119, { angle: i ? 20 : 0, amount: i === 2 ? 40 : 100, source: true, settled: 2 });
        const receiver = jar(scene, x + 72, 310, 61, 80, { amount: i === 2 ? 60 : 0 });
        nodes.push(source.group);
        if (i === 1) nodes.push(pourStream(scene, source.lip, receiver.lip, false));
        nodes.push(receiver.group);
        text(x, 385, [
          'Use Let It Settle twice.\nWait for sand at the bottom.',
          'Tilt gently, then Pour a Little.\nEach pour transfers 20%.',
          'Collect at least 60%.\nLeave at least 20% behind.\nKeep sediment out, then check.',
        ][i], 18, '#fff0d6', 287);
      }
      nodes.push(workshopPanel(scene, 640, 505, 1054, 118, { fill: 0x142e21 }));
      nodes.push(scene.add.image(182, 505, 'supply-guide').setDisplaySize(75, 90));
      text(700, 472, 'SCIENTIST NOTE', 23, '#ffce58', 0, 'heading');
      text(700, 509, 'Pouring before settling, tilting above 30°, or emptying the source carries sand along.\nDecanting is not perfect separation; the collected liquid is not automatically safe to drink.', 18, '#fff0d6', 851);
      text(700, 548, 'Sediment in the receiver? Reset and try settling and a gentler pour.', 17, '#c5b3ef', 851);
      nodes.push(workshopControl(scene, 640, 611, 'GOT IT', () => {
        scene.minigameHelpOpen = false; closeOpenModal(scene); scene.updateTestState();
      }, { width: 180, height: 50, fill: 0x32641f }));
      return nodes;
    },
  });
  scene.updateTestState();
}
