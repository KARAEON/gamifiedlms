import { supplyGlyph, supplyPanel, supplyText, supplyHeading } from './supplyCartUi.js';
import { fitTextWidth } from './ui.js';

// Every game reserves the same title, counter, and navigation lanes.
export function createMinigameHeader(scene, { day, detail = 'MINI-GAME', title, subtitle, counters, panelFactory = supplyPanel }) {
  scene.add.rectangle(640, 46, 1280, 92, 0x080e19, 0.92).setDepth(19);
  panelFactory(scene, 90, 46, 148, 72, { fill: 0x2c211b, edge: 0xb77935, highlight: 0xe8c074, depth: 20 });
  supplyHeading(scene, 90, 30, `DAY ${day}`, 25).setDepth(21);
  const detailText = supplyText(scene, 90, 61, detail, 20, '#ffce58').setDepth(21);
  fitTextWidth(detailText, 128);
  panelFactory(scene, 431, 46, 512, 72, { fill: 0xe6c283, edge: 0xa37137, highlight: 0xffe3a1, depth: 20 });
  const titleText = supplyHeading(scene, 431, 32, title, 30, '#1a1715').setDepth(21);
  fitTextWidth(titleText, 480);
  const subtitleText = supplyText(scene, 431, 65, subtitle, 18, '#292017').setDepth(21);
  if (subtitleText.width > 480) subtitleText.setFontSize(Math.floor(18 * 480 / subtitleText.width));
  const gap = 9;
  const width = (384 - gap * (counters.length - 1)) / counters.length;
  const values = counters.map(({ label, glyph, color = '#ffce58', value = '' }, index) => {
    const x = 705 + width / 2 + index * (width + gap);
    panelFactory(scene, x, 46, width, 72, { fill: 0x201c19, edge: 0x936032, depth: 20 });
    const labelText = supplyText(scene, x, 26, label, 17, '#b9a990').setDepth(21);
    if (labelText.width > width - 16) labelText.setFontSize(Math.floor(17 * (width - 16) / labelText.width));
    if (glyph) supplyGlyph(scene, x - width / 2 + 23, 56, glyph, glyph === 'clock' ? 0xc2e4ef : 0xffbd38, 3).setDepth(21);
    return supplyText(scene, x + (glyph ? 12 : 0), 57, value, 24, color).setDepth(21);
  });
  return { detailText, titleText, subtitleText, values };
}
