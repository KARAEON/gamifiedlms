import { textStyle, titleStyle } from './ui.js';

export const supplyPalette = {
  background: 0x080e19, panel: 0x111c30, blue: 0x35678e,
  purple: 0x805398, cream: 0xe8dcc0, gold: 0xffbd38,
  cyan: 0x67d8ee, green: 0x8cda35, ink: 0x18202c,
};

// Stepped corners and one-pixel highlights stay crisp at the game's native size.
export function supplyPanel(scene, x, y, width, height, options = {}) {
  const graphics = scene.add.graphics({ x, y });
  const left = -width / 2, top = -height / 2, step = 6;
  graphics.fillStyle(options.fill ?? supplyPalette.panel, options.alpha ?? 1);
  graphics.lineStyle(4, 0x070b14, 1);
  graphics.beginPath();
  graphics.moveTo(left + step, top);
  graphics.lineTo(left + width - step, top);
  graphics.lineTo(left + width, top + step);
  graphics.lineTo(left + width, top + height - step);
  graphics.lineTo(left + width - step, top + height);
  graphics.lineTo(left + step, top + height);
  graphics.lineTo(left, top + height - step);
  graphics.lineTo(left, top + step);
  graphics.closePath();
  graphics.fillPath(); graphics.strokePath();
  graphics.lineStyle(2, options.edge ?? supplyPalette.purple, 1);
  graphics.strokeRect(left + 4, top + 4, width - 8, height - 8);
  graphics.lineStyle(1, options.highlight ?? 0x405879, 1);
  graphics.lineBetween(left + 9, top + 7, left + width - 10, top + 7);
  graphics.setDepth(options.depth ?? 5);
  return graphics;
}

const GLYPHS = {
  star: ['000010000','000111000','111111111','011111110','001111100','011111110','011000110','010000010'],
  clock: ['001111100','011000110','110010011','100010001','100011101','100000001','110000011','011000110','001111100'],
  gear: ['000111000','010111010','111111111','011000110','111010111','011000110','111111111','010111010','000111000'],
  bulb: ['00111100','01111110','11011011','11111111','01111110','00111100','00111100','00100100','00111100'],
  pause: ['110011','110011','110011','110011','110011','110011','110011'],
  arrow: ['00010000','00110000','01111111','11111111','01111111','00110000','00010000'],
  flask: ['00011000','00011000','00011000','00111100','00100100','01111110','01111110','11111111'],
  check: ['00000001','00000011','01000110','01101100','00111000','00010000'],
  cross: ['11000011','01100110','00111100','00011000','00111100','01100110','11000011'],
  eye: ['000111000','001111100','011000110','110010011','011000110','001111100','000111000'],
  gem: ['00111100','01111110','11111111','01111110','00111100','00011000'],
};

export function supplyGlyph(scene, x, y, name, color = supplyPalette.gold, scale = 3) {
  const rows = GLYPHS[name] ?? GLYPHS.star;
  const graphics = scene.add.graphics({ x, y });
  const left = -rows[0].length * scale / 2, top = -rows.length * scale / 2;
  for (const [dy, row] of rows.entries()) for (const [dx, value] of [...row].entries()) {
    if (value !== '1') continue;
    graphics.fillStyle(0x080d17); graphics.fillRect(left + dx * scale + 2, top + dy * scale + 2, scale, scale);
  }
  graphics.fillStyle(color);
  for (const [dy, row] of rows.entries()) for (const [dx, value] of [...row].entries()) {
    if (value === '1') graphics.fillRect(left + dx * scale, top + dy * scale, scale, scale);
  }
  return graphics;
}

export function supplyText(scene, x, y, value, size = 20, color = '#e8dcc0', align = 'center') {
  const text = scene.add.text(x, y, value, textStyle(size, color, align));
  text.setOrigin(align === 'left' ? 0 : 0.5, 0.5);
  text.setLineSpacing(2);
  return text;
}

export function supplyHeading(scene, x, y, value, size = 20, color = '#e8dcc0', align = 'center') {
  return supplyText(scene, x, y, value, size, color, align).setStyle(titleStyle(size, color, align));
}

export function supplyControl(scene, x, y, label, action, options = {}) {
  const width = options.width ?? 142, height = options.height ?? 48;
  const container = scene.add.container(x, y).setDepth(35);
  const panel = supplyPanel(scene, 0, 0, width, height, {
    fill: options.fill ?? 0x362044, edge: options.edge ?? supplyPalette.purple,
  });
  const text = supplyText(scene, options.icon ? 15 : 0, 0, label, options.size ?? 23);
  const icon = options.icon ? supplyGlyph(scene, -width / 2 + 25, 0, options.icon, options.iconColor, 3) : null;
  const zone = scene.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
  zone.on('pointerover', () => container.setScale(1.03));
  zone.on('pointerout', () => container.setScale(1));
  zone.on('pointerup', () => { container.setScale(1); action(); });
  container.add([panel, ...(icon ? [icon] : []), text, zone]);
  return container;
}
