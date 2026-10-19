import { supplyGlyph, supplyText } from './supplyCartUi.js';
import { qText } from './scienceQuarterUi.js';

// Games 6–8 share this metal / timber treatment and control positions.
export function magnetPanel(scene, x, y, width, height, options = {}) {
  const container = scene.add.container(x, y).setDepth(options.depth ?? 5);
  const scale = 0.055;
  const frame = scene.add.nineslice(0, 0, 'court-panel-frame', null,
    width / scale, height / scale, 230, 230, 190, 190).setScale(scale);
  container.add(frame);
  if (options.fill !== undefined) {
    const inset = 17;
    const inner = scene.add.rectangle(0, 0, width - inset * 2, height - 12, options.fill);
    inner.setStrokeStyle(1, options.edge ?? 0xb78a48);
    container.add(inner);
    if (options.fill === 0xe6c283 || options.fill === 0xe9cf98) {
      const flecks = scene.add.graphics();
      for (let i = 0; i < 24; i++) {
        const px = -width / 2 + 21 + (i * 43) % Math.max(1, width - 44);
        const py = -height / 2 + 15 + (i * 17) % Math.max(1, height - 32);
        flecks.fillStyle(i % 2 ? 0xb58042 : 0xffdf9c, 0.25).fillRect(px, py, 3, 2);
      }
      container.add(flecks);
    }
  }
  return container;
}

export function magnetControl(scene, x, y, label, action, options = {}) {
  const width = options.width ?? 160, height = options.height ?? 54;
  const container = scene.add.container(x, y).setDepth(35);
  const green = options.fill === 0x32641f || options.fill === 0x28641e;
  const red = options.tone === 'red', choice = options.tone === 'choice';
  const palette = green ? [0x256020, 0x5aaf39, 0x123e16, 0xacdd73]
    : red ? [0x922d3d, 0xd34b5c, 0x501725, 0xf09f9d]
      : choice ? [0x18283b, 0x3a5269, 0x0c1624, 0x668ca8]
        : [0x4c2294, 0x8c56d3, 0x2b105e, 0xc7a4f3];
  const g = scene.add.graphics(), left = -width / 2, top = -height / 2;
  g.fillStyle(0x060914).fillRoundedRect(left - 3, top + 4, width + 6, height, 4);
  g.fillStyle(options.nav ? 0x312440 : 0x5c350f).fillRoundedRect(left, top, width, height, 4);
  g.lineStyle(3, options.nav ? 0xaaa0d0 : 0xf5c554).strokeRoundedRect(left + 2, top + 2, width - 4, height - 4, 3);
  g.fillStyle(options.enabled === false && !options.keepColorWhenDisabled ? 0x3b3b47 : palette[0]).fillRect(left + 7, top + 7, width - 14, height - 14);
  g.fillStyle(palette[1]).fillRect(left + 8, top + 8, width - 16, 5);
  g.fillStyle(palette[2]).fillRect(left + 8, top + height - 13, width - 16, 5);
  g.lineStyle(1, palette[3]).strokeRect(left + 6, top + 6, width - 12, height - 12);
  container.add(g);
  if (options.icon) container.add(supplyGlyph(scene, 0, 0, options.icon, options.iconColor ?? 0xfaf0dc, options.icon === 'arrow' ? 4 : 3.5));
  if (label) {
    const text = supplyText(scene, 0, -1, label, options.size ?? 23, '#fff4df').setShadow(2, 2, '#201029', 0);
    if (text.width > width - 23) text.setFontSize(Math.floor((options.size ?? 23) * (width - 23) / text.width));
    container.add(text);
  }
  const zone = scene.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
  if (options.enabled === false) zone.disableInteractive();
  zone.on('pointerover', () => { if (!scene.currentModal) container.setScale(1.025); });
  zone.on('pointerout', () => container.setScale(1));
  zone.on('pointerup', () => { container.setScale(1); action(); });
  container.add(zone);
  return container;
}

export function magnetSprite(scene, name, x, y, width, height = width) {
  const key = `science-${name}`;
  const texture = scene.textures.get(key);
  const image = scene.add.image(x, y, key, texture.has('trimmed') ? 'trimmed' : undefined);
  image.setScale(Math.min(width / image.width, height / image.height));
  scene.layer.add(image);
  return image;
}

export function magnetResults(scene) {
  const success = scene.phase !== 'playing';
  const feedback = magnetPanel(scene, 1050, 465, 386, 88, { fill: success ? 0x142e21 : 0x101b30, edge: success ? 0x81ac58 : 0x778491 });
  scene.layer.add(feedback);
  const message = scene.state.message || `Iron follows the magnet.\n${scene.round > 0 ? 'Copper' : 'Stone'} and wood stay behind.`;
  qText(scene, 1050, 465, message, success ? 20 : 21, '#fff0d6', 337);
  if (!success) {
    scene.button('reset', 920, 562, 'RESET', () => scene.resetRound(), { width: 138, height: 56, size: 24 });
    scene.button('check', 1112, 562, 'CHECK RESULT', () => scene.checkRound(), { width: 232, height: 56, size: 24, fill: 0x32641f });
  } else {
    scene.button('retry', 920, 562, 'RETRY', () => scene.resetRound(), { width: 138, height: 56, size: 24 });
    scene.button('next', 1112, 562, scene.phase === 'finished' ? 'LESSON MAP' : 'NEXT CHALLENGE', () => scene.nextRound(), { width: 232, height: 56, size: 23, fill: 0x32641f });
  }
}
