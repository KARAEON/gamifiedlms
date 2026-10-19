import { createGeneralAsset } from './assetIcons.js';
import { supplyGlyph, supplyPanel, supplyText } from './supplyCartUi.js';
import { titleStyle } from './ui.js';
import { SCIENCE_TOOLS } from '../config/scienceQuarterGames.js';

// Shared visual language; the experiment renderers own their distinct controls.
export const scienceInk = { navy: 0x102135, paper: 0xe9cf98, gold: 0xb98a43, cyan: '#67d8ee', green: '#b5e748' };

export function qText(scene, x, y, text, size = 20, color = '#efdfb8', width = 0, align = 'center') {
  const node = supplyText(scene, x, y, text, size, color, align);
  if (width) node.setWordWrapWidth(width, true);
  scene.layer.add(node);
  return node;
}

export function qHeading(scene, x, y, text, size = 20, color = '#efdfb8', width = 0, align = 'center') {
  return qText(scene, x, y, text, size, color, width, align).setStyle(titleStyle(size, color, align));
}

export function qPanel(scene, x, y, width, height, options = {}) {
  const node = supplyPanel(scene, x, y, width, height, { edge: scienceInk.gold, ...options });
  scene.layer.add(node);
  return node;
}

export function qAsset(scene, name, x, y, width = 90, height = width) {
  const key = `science-${name}`;
  let node;
  if (scene.textures.exists(key)) {
    node = scene.add.image(x, y, key);
    node.setScale(Math.min(width / node.width, height / node.height));
  } else node = createGeneralAsset(scene, name, { x, y, width, height });
  if (node) scene.layer.add(node);
  return node;
}

export function qZone(scene, id, x, y, width, height, action) {
  const node = scene.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
  node.on('pointerup', () => { if (!scene.currentModal && scene.phase === 'playing') action(); });
  node.setData('testId', id);
  scene.layer.add(node);
  scene.controlViews.push({ id, x, y, width, height });
  return node;
}

export function toolPicker(scene, y, action, selected = null, { x = 117, gap = 147, width = 136 } = {}) {
  SCIENCE_TOOLS.forEach((tool, i) => {
    const cx = x + i * gap;
    qPanel(scene, cx, y, width, 85, { fill: selected === tool.id ? 0x2a5429 : 0x102436, edge: selected === tool.id ? 0x91ba46 : scienceInk.gold });
    qAsset(scene, tool.asset, cx, y - 12, 43);
    qText(scene, cx, y + 25, tool.label, 16);
    qZone(scene, `tool-${tool.id}`, cx, y, width, 85, () => action(tool.id));
  });
}

export function material(scene, type, x, y, size = 30) {
  const sprite = { iron: 'iron-nail', wood: 'wood-chip', copper: 'copper-piece', stone: 'pebble', stones: 'pebble' }[type];
  if (sprite && scene.textures.exists(`science-${sprite}`)) return qAsset(scene, sprite, x, y, size * 1.3);
  const g = scene.add.graphics({ x, y });
  if (type === 'iron') {
    g.fillStyle(0x263746).fillRect(-4, -size / 2, 9, size);
    g.fillStyle(0xc5d6dc).fillRect(-2, -size / 2 + 3, 4, size - 5);
    g.fillStyle(0x96aab8).fillRect(-10, -size / 2, 20, 7);
  } else if (type === 'wood' || type === 'copper') {
    g.fillStyle(type === 'wood' ? 0x52341b : 0x663719).fillRect(-size / 2, -7, size, 17);
    g.fillStyle(type === 'wood' ? 0xb17c3b : 0xe29a55).fillRect(-size / 2 + 3, -4, size - 6, 7);
  } else {
    const color = type === 'stone' || type === 'stones' ? 0x8894a2 : type === 'salt' ? 0xf8eee2 : 0xe1b64d;
    g.fillStyle(0x3b4650).fillRect(-size / 2, -size / 3, size, size * 0.7);
    g.fillStyle(color).fillRect(-size / 2 + 3, -size / 3 + 3, size - 6, size * 0.7 - 6);
  }
  scene.layer.add(g);
  return g;
}

export function vessel(scene, x, y, { level = 1, sediment = false, mixed = false, width = 128, height = 172 } = {}) {
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0x1b3a52, 0.55).fillRect(-width / 2, -height / 2, width, height);
  const waterHeight = Math.max(0, height * 0.72 * level);
  g.fillStyle(0x56b3da, 0.7).fillRect(-width / 2 + 8, height / 2 - 8 - waterHeight, width - 16, waterHeight);
  if (sediment) {
    g.fillStyle(0xd3aa5e).fillRect(-width / 2 + 8, height / 2 - 25, width - 16, 17);
    if (mixed) for (let i = 0; i < 22; i++) g.fillRect(-width / 2 + 14 + (i * 17) % (width - 28), -height / 2 + 28 + (i * 29) % (height - 55), 4, 4);
  }
  g.lineStyle(5, 0xaed7e2).strokeRect(-width / 2, -height / 2, width, height);
  g.lineStyle(2, 0xe7f6f5).lineBetween(-width / 2 + 8, -height / 2 + 8, -width / 2 + 8, height / 2 - 8);
  for (let i = 1; i < 5; i++) g.lineBetween(width / 2 - 20, height / 2 - i * height / 6, width / 2 - 7, height / 2 - i * height / 6);
  scene.layer.add(g);
  return g;
}

export function arrow(scene, x1, y1, x2, y2, color = 0x67d8ee) {
  const g = scene.add.graphics();
  g.lineStyle(3, color).lineBetween(x1, y1, x2, y2);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  g.lineBetween(x2, y2, x2 - 11 * Math.cos(angle - 0.5), y2 - 11 * Math.sin(angle - 0.5));
  g.lineBetween(x2, y2, x2 - 11 * Math.cos(angle + 0.5), y2 - 11 * Math.sin(angle + 0.5));
  scene.layer.add(g);
  return g;
}

export function qCheck(scene, x, y) {
  const icon = supplyGlyph(scene, x, y, 'check', 0xb5e748, 3);
  scene.layer.add(icon);
}
