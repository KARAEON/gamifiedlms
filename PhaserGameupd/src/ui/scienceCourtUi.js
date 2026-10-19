import { supplyControl, supplyGlyph, supplyPanel, supplyText } from './supplyCartUi.js';

export const courtColors = { gold: 0xe8b342, paper: 0xe9cf98, navy: 0x102135, purple: 0x39204f };

// Nine-slice keeps the generated wood, metal corners, and fine gold rim intact.
export function courtPanel(scene, x, y, width, height, { paper = false, purple = false } = {}) {
  const container = scene.add.container(x, y);
  const scale = 0.08;
  const frame = scene.add.nineslice(0, 0, 'court-panel-frame', null,
    width / scale, height / scale, 230, 230, 190, 190).setScale(scale);
  container.add(frame);
  if (paper || purple) {
    const inner = scene.add.rectangle(0, 0, width - 34, height - 28, paper ? courtColors.paper : courtColors.purple);
    inner.setStrokeStyle(2, paper ? 0xb7955d : 0x74569a);
    container.add(inner);
  }
  return container;
}

export function courtButton(scene, x, y, label, action, options = {}) {
  return supplyControl(scene, x, y, label, action, {
    fill: options.fill ?? 0x28641e, edge: options.edge ?? courtColors.gold,
    size: options.size ?? 23, ...options,
  });
}

export function courtField(scene, x, y, width, label, action, { size = 18, height = 34 } = {}) {
  const container = scene.add.container(x, y);
  const panel = supplyPanel(scene, 0, 0, width, height, { fill: 0xf0dbae, edge: 0xa2824e });
  const text = supplyText(scene, -width / 2 + 9, 0, label, size, '#282015', 'left');
  text.setWordWrapWidth(width - (action ? 32 : 18));
  container.add([panel, text]);
  if (action) {
    container.add(supplyText(scene, width / 2 - 13, 0, '▾', 17, '#282015'));
    const zone = scene.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
    zone.on('pointerup', action);
    container.add(zone);
  }
  return { container, text };
}

export function courtEvidenceIcon(scene, id, x, y) {
  if (id === 'blended-evenly' || id === 'not-evenly-mixed') {
    return scene.add.image(x, y, 'court-magnifier').setDisplaySize(30, 30);
  }
  if (id === 'separates-layers') {
    const graphics = scene.add.graphics({ x, y });
    graphics.fillStyle(0xeff6fa); graphics.fillRect(-12, -14, 24, 27);
    graphics.lineStyle(2, 0x252c34); graphics.strokeRect(-12, -14, 24, 27);
    graphics.fillStyle(0xe7af34); graphics.fillRect(-9, -3, 18, 6);
    graphics.fillStyle(0x56afd1); graphics.fillRect(-9, 3, 18, 7);
    return graphics;
  }
  if (id === 'visible-parts') {
    const graphics = scene.add.graphics({ x, y });
    for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
      graphics.fillStyle((row + col) % 2 ? 0xbb7430 : 0xf2c057);
      graphics.fillRect(-11 + col * 8, -10 + row * 8, 5, 5);
      graphics.lineStyle(1, 0x392a1d); graphics.strokeRect(-11 + col * 8, -10 + row * 8, 5, 5);
    }
    return graphics;
  }
  return supplyGlyph(scene, x, y, id === 'same-throughout' ? 'eye' : 'star', id === 'same-throughout' ? 0x629fc1 : courtColors.gold, 3);
}
