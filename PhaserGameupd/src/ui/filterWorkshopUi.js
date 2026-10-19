import { magnetPanel as workshopPanel, magnetSprite as workshopSprite } from './magnetWorkshopUi.js';
import { qText, qZone, qHeading } from './scienceQuarterUi.js';
import { supplyGlyph } from './supplyCartUi.js';

export const FILTER_SLOTS = {
  filter: { x: 478, y: 279, width: 210, height: 196 },
  receiver: { x: 478, y: 448, width: 146, height: 145 },
};

const samples = ['SAND + WATER', 'SALTWATER', 'CLAY + WATER'];
const desired = ['SAND', 'DISSOLVED SALT', 'INSOLUBLE CLAY'];
const observations = [
  'Sand stays on the paper.\nWater passes into the jar.',
  'Salt passes through with water.\nPaper does not recover the salt.',
  'Insoluble clay stays on the paper.\nLiquid passes into the jar.',
];

function beaker(scene, x, y, width, height, { level = 0, sample = null } = {}) {
  const frame = scene.textures.get('science-filter-beaker').get('trimmed');
  const scale = Math.min(width / frame.width, height / frame.height);
  const w = frame.width * scale, h = frame.height * scale;
  if (level) {
    const g = scene.add.graphics();
    const bottom = y + h * 0.38, top = bottom - h * 0.68 * level;
    const color = sample === 0 ? 0xb8a679 : sample === 2 ? 0x9d8c77 : 0x4baedd;
    g.fillStyle(color, 0.78).fillRoundedRect(x - w * 0.34, top, w * 0.68, bottom - top, 6);
    g.fillStyle(sample === null || sample === 1 ? 0x86d9f4 : 0xd8cbb0, 0.8).fillEllipse(x, top, w * 0.68, 8);
    if (sample === 0 || sample === 2) {
      for (let i = 0; i < 37; i++) {
        const px = x - w * 0.3 + (i * 17) % (w * 0.6);
        const py = bottom - 4 - (i * 13) % Math.max(1, bottom - top - 9);
        g.fillStyle(sample === 0 ? 0xb0722b : 0x695740).fillRect(px, py, sample === 0 ? 3 : 2, 2);
      }
      g.fillStyle(sample === 0 ? 0xa87935 : 0x78614b, 0.9).fillRoundedRect(x - w * 0.31, bottom - 10, w * 0.62, 10, 3);
    }
    scene.layer.add(g);
  }
  return workshopSprite(scene, 'filter-beaker', x, y, width, height);
}

function callout(scene, label, x, y, width, targetX, targetY) {
  const g = scene.add.graphics().lineStyle(3, 0xffe4a8);
  const end = x - width / 2;
  g.lineBetween(end, y, targetX, targetY);
  const a = Math.atan2(targetY - y, targetX - end);
  g.lineBetween(targetX, targetY, targetX - Math.cos(a - 0.6) * 10, targetY - Math.sin(a - 0.6) * 10);
  g.lineBetween(targetX, targetY, targetX - Math.cos(a + 0.6) * 10, targetY - Math.sin(a + 0.6) * 10);
  scene.layer.add(g);
  scene.layer.add(scene.add.rectangle(x, y, width, 49, 0xf4dfb1).setStrokeStyle(2, 0x282522));
  qText(scene, x, y, label, 18, '#20201c');
}

function slotHint(scene, part) {
  const slot = FILTER_SLOTS[part];
  const height = part === 'filter' ? 130 : 123;
  scene.layer.add(workshopPanel(scene, slot.x, slot.y, part === 'filter' ? 171 : 137, height, { fill: 0x132332, edge: 0x7195a9 }));
  const icon = workshopSprite(scene, part === 'filter' ? 'filter-funnel' : 'filter-beaker', slot.x, slot.y - 14, 65, 65).setAlpha(0.45);
  qText(scene, slot.x, slot.y + 38, part === 'filter' ? 'PLACE FUNNEL' : 'PLACE JAR', 16, '#a8dbea');
  return icon;
}

function partCard(scene, part, x) {
  const placed = scene.state.parts.includes(part), playing = scene.phase === 'playing';
  scene.layer.add(workshopPanel(scene, x, 586, 227, 75, { fill: placed ? 0x132b22 : 0x101b30, edge: placed ? 0x77aa69 : 0x7195a9 }));
  const image = workshopSprite(scene, part === 'filter' ? 'filter-funnel' : 'filter-beaker', x - 72, 586, 48, 54);
  qText(scene, x + 23, 573, part === 'filter' ? 'FILTER FUNNEL' : 'RECEIVING JAR', 16, '#fff0d6');
  qText(scene, x + 24, 602, placed ? 'PLACED' : 'CLICK OR DRAG', placed ? 19 : 15, placed ? '#9ce877' : '#c5b3ef');
  if (placed) scene.layer.add(supplyGlyph(scene, x - 34, 602, 'check', 0x77e46a, 2));
  let dragged = false;
  const zone = qZone(scene, `place-${part}`, x, 586, 227, 75, () => {
    if (!dragged && !placed) scene.perform('place', part);
  });
  if (placed || !playing) { zone.disableInteractive(); return; }
  scene.input.setDraggable(zone);
  zone.on('pointerdown', () => { dragged = false; });
  zone.on('drag', pointer => {
    if (scene.currentModal || scene.phase !== 'playing') return;
    dragged = true; image.setPosition(pointer.x, pointer.y);
  });
  zone.on('dragend', pointer => {
    if (scene.currentModal || scene.phase !== 'playing') return;
    const slot = FILTER_SLOTS[part];
    if (Math.abs(pointer.x - slot.x) <= slot.width / 2 && Math.abs(pointer.y - slot.y) <= slot.height / 2) scene.perform('place', part);
    else scene.render();
  });
}

export function renderFilterWorkshop(scene) {
  const s = scene.state, playing = scene.phase === 'playing';
  scene.layer.add(workshopPanel(scene, 420, 388, 808, 482));
  // The laboratory remains visible within the experiment frame, as in the reference.
  scene.layer.add(scene.add.image(420, 388, 'science-workshop-backdrop').setDisplaySize(774, 458));
  scene.layer.add(scene.add.rectangle(420, 388, 774, 458, 0x070d14, 0.2));
  workshopSprite(scene, 'filter-stand', 478, 358, 275, 331);
  beaker(scene, 178, 365, 145, 185, { level: s.poured ? 0 : 0.64, sample: scene.round });
  scene.layer.add(scene.add.rectangle(178, 492, 182, 47, 0xf4dfb1).setStrokeStyle(2, 0x282522));
  qText(scene, 178, 492, `${samples[scene.round]}\nSAMPLE`, 17, '#20201c');
  if (s.parts.includes('filter')) {
    const funnel = workshopSprite(scene, 'filter-funnel', 478, 279, 195, 185);
    if (s.poured && scene.round !== 1) {
      const y = 279 - funnel.displayHeight * 0.24;
      if (scene.round === 0) {
        const sand = scene.add.image(478, y + 6, 'general-sand-mound', 'sieve-trimmed').setOrigin(0.5, 1);
        sand.setScale(66 / sand.width); scene.layer.add(sand);
      } else {
        const clay = scene.add.graphics();
        for (let i = 0; i < 12; i++) clay.fillStyle(i % 2 ? 0x957354 : 0x72563e).fillRect(450 + i * 5, y - i % 3 * 3, 7, 4);
        scene.layer.add(clay);
      }
    }
  } else slotHint(scene, 'filter');
  if (s.parts.includes('receiver')) beaker(scene, 478, 448, 117, 131, { level: s.poured ? 0.56 : 0 });
  else slotHint(scene, 'receiver');
  if (s.poured) {
    const flow = scene.add.graphics().lineStyle(5, 0x8fe2f6);
    const points = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, u = 1 - t;
      points.push({ x: u * u * 252 + 2 * u * t * 301 + t * t * 384, y: u * u * 284 + 2 * u * t * 205 + t * t * 223 });
    }
    flow.strokePoints(points);
    flow.fillStyle(0x8fe2f6).fillTriangle(394, 222, 372, 213, 378, 236);
    for (const y of [371, 385]) flow.fillStyle(0x81d5f0).fillCircle(478, y, 3).fillTriangle(478, y - 6, 475, y, 481, y);
    scene.layer.add(flow);
  }
  callout(scene, 'PAPER /\nRESIDUE', 660, 232, 143, 529, 236);
  callout(scene, 'JAR /\nFILTRATE', 685, 447, 147, 533, 457);
  partCard(scene, 'receiver', 151);
  partCard(scene, 'filter', 394);
  scene.button('pour', 661, 586, 'POUR SAMPLE', () => scene.perform('pour'), { width: 284, height: 75, size: 27, enabled: playing });

  scene.layer.add(workshopPanel(scene, 1050, 388, 428, 482));
  scene.layer.add(workshopPanel(scene, 1050, 188, 384, 47, { fill: 0x092733, edge: 0x67d8ee }));
  const target = qHeading(scene, 1050, 188, `DESIRED MATERIAL: ${desired[scene.round]}`, 22, '#67d8ee');
  if (target.width > 347) target.setFontSize(Math.floor(parseFloat(target.style.fontSize) * 347 / target.width));
  scene.layer.add(workshopPanel(scene, 1050, 253, 383, 49, { fill: 0xe9cf98 }));
  qText(scene, 1050, 253, 'Where did it go?', 27, '#292116');
  for (const [output, y, label] of [['paper', 330, 'ON PAPER'], ['liquid', 409, 'IN LIQUID']]) {
    const selected = s.output === output;
    scene.button(`output-${output}`, 1050, y, label, () => scene.perform('output', output), {
      width: 352, height: 62, size: 28, fill: selected ? 0x32641f : 0x18283b,
      tone: 'choice', enabled: playing && s.poured, keepColorWhenDisabled: selected,
    });
    scene.layer.add(scene.add.circle(907, y, 13, selected ? 0xf0fff0 : 0x101b30).setStrokeStyle(3, selected ? 0x9de88c : 0x7294a8));
  }
}

export function filterResults(scene) {
  const complete = scene.phase !== 'playing';
  scene.layer.add(workshopPanel(scene, 1050, 512, 386, 102, { fill: complete ? 0x142e21 : 0x101b30, edge: complete ? 0x81ac58 : 0x7195a9 }));
  const message = complete ? observations[scene.round] : scene.state.message || 'Place a jar and filter funnel.\nPour the sample, then follow\nthe desired material.';
  if (complete) scene.layer.add(supplyGlyph(scene, 902, 512, 'check', 0x77e46a, 4));
  qText(scene, complete ? 1082 : 1050, 512, message, 18, '#fff0d6', complete ? 282 : 343);
  scene.button(complete ? 'retry' : 'reset', 920, 602, complete ? 'RETRY' : 'RESET', () => scene.resetRound(), { width: 138, height: 54, size: 24, tone: 'red' });
  scene.button(complete ? 'next' : 'check', 1112, 602,
    complete ? scene.phase === 'finished' ? 'LESSON MAP' : 'NEXT CHALLENGE' : 'CHECK RESULT',
    () => complete ? scene.nextRound() : scene.checkRound(), { width: 232, height: 54, size: 23, fill: 0x32641f });
}
