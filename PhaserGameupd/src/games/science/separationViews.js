import { magneticItems, scienceAction } from './scienceLogic.js';
import { qText, qZone, qHeading } from '../../ui/scienceQuarterUi.js';
import { magnetPanel, magnetSprite } from '../../ui/magnetWorkshopUi.js';
import { renderSieveWorkshop } from '../../ui/sieveWorkshopUi.js';
import { renderFilterWorkshop } from '../../ui/filterWorkshopUi.js';
import { renderEvaporationWorkshop } from '../../ui/evaporationWorkshopUi.js';
import { renderDecantWorkshop } from '../../ui/decantWorkshopUi.js';

function magnetView(scene) {
  const s = scene.state;
  const itemViews = [];
  magnetSprite(scene, 'sample-tray', 430, 390, 794, 310);
  scene.layer.add(magnetPanel(scene, 1050, 377, 428, 451));
  qHeading(scene, 878, 198, 'RECOVERED IRON:', 23, '#67d8ee', 262, 'left');
  qText(scene, 1193, 198, `${s.recovered.length}/3`, 29, '#ffce58');
  magnetSprite(scene, 'recovery-tray', 1050, 313, 380, 162);
  for (let i = 0; i < s.recovered.length; i++) {
    magnetSprite(scene, 'iron-nail', 1050 + (i - (s.recovered.length - 1) / 2) * 73, 319, 74, 64).setAngle(-8 + i * 12);
  }
  const divider = scene.add.graphics().lineStyle(2, 0xd9a641);
  divider.lineBetween(875, 402, 1034, 402).lineBetween(1066, 402, 1225, 402);
  divider.strokePoints([{ x: 1050, y: 396 }, { x: 1056, y: 402 }, { x: 1050, y: 408 }, { x: 1044, y: 402 }], true);
  scene.layer.add(divider);

  const names = { iron: 'iron-nail', wood: 'wood-chip', copper: 'copper-piece', stone: 'pebble' };
  for (const item of magneticItems(scene.round)) {
    if (s.recovered.includes(item.id)) continue;
    const held = s.held.includes(item.id);
    const index = s.held.indexOf(item.id);
    const x = held ? s.magnet.x - 39 + index * 25 : item.x;
    const y = held ? s.magnet.y + 78 - index * 8 : item.y;
    const object = magnetSprite(scene, names[item.type], x, y, item.type === 'wood' ? 84 : 77, 63).setAngle(item.id % 2 ? 12 : -12);
    if (!held) {
      if (item.type !== 'iron') {
        magnetSprite(scene, names[item.type], x + 24, y + 8, 41, 29).setAngle(-32);
        magnetSprite(scene, names[item.type], x - 25, y - 13, 43, 30).setAngle(32);
      }
      qZone(scene, `material-${item.id}`, x, y, 76, 64, () => scene.perform('sweep', { x, y }));
    }
    itemViews.push({ id: item.id, object });
  }
  const callout = (text, x, y, toX, toY, width) => {
    const g = scene.add.graphics().lineStyle(3, 0xffe4a8);
    const startY = y + (toY > y ? 14 : -14);
    g.lineBetween(x, startY, toX, toY);
    const a = Math.atan2(toY - startY, toX - x);
    g.lineBetween(toX, toY, toX - Math.cos(a - 0.55) * 9, toY - Math.sin(a - 0.55) * 9);
    g.lineBetween(toX, toY, toX - Math.cos(a + 0.55) * 9, toY - Math.sin(a + 0.55) * 9);
    scene.layer.add(g);
    scene.layer.add(scene.add.rectangle(x, y, width, 28, 0xf4dfb1).setStrokeStyle(2, 0x282522));
    qText(scene, x, y, text, 17, '#20201c');
  };
  callout('SAND', 153, 310, 177, 357, 69);
  callout('WOOD', 174, 518, 188, 454, 75);
  callout('IRON NAILS', 444, 518, 507, 462, 122);
  callout(scene.round ? 'COPPER SCRAPS' : 'STONES', 718, 518, 722, 457, scene.round ? 145 : 88);

  const magnetPoint = scene.phase === 'playing' ? s.magnet : { x: 670, y: 223 };
  const icon = magnetSprite(scene, 'magnet', magnetPoint.x, magnetPoint.y, 158, 145).setAngle(34);
  const sparks = scene.add.graphics().setPosition(s.magnet.x, s.magnet.y).setVisible(s.held.length > 0);
  sparks.lineStyle(3, 0xffd565).strokePoints([{ x: -59, y: 64 }, { x: -65, y: 74 }, { x: -55, y: 72 }, { x: -61, y: 84 }]);
  sparks.strokePoints([{ x: 6, y: 57 }, { x: 0, y: 67 }, { x: 10, y: 65 }, { x: 4, y: 77 }]);
  scene.layer.add(sparks);
  const zone = qZone(scene, 'magnet-drag', magnetPoint.x, magnetPoint.y, 134, 126, () => {});
  scene.input.setDraggable(zone);
  zone.on('drag', (_p, x, y) => {
    if (scene.currentModal || scene.phase !== 'playing') return;
    scene.state = scienceAction(scene.state, { type: 'sweep', value: { x, y } });
    icon.setPosition(scene.state.magnet.x, scene.state.magnet.y);
    zone.setPosition(scene.state.magnet.x, scene.state.magnet.y);
    sparks.setPosition(scene.state.magnet.x, scene.state.magnet.y).setVisible(scene.state.held.length > 0);
    itemViews.forEach(view => {
      const i = scene.state.held.indexOf(view.id);
      if (i >= 0) view.object.setPosition(scene.state.magnet.x - 39 + i * 25, scene.state.magnet.y + 78 - i * 8);
    });
    scene.updateTestState();
  });
  zone.on('dragend', p => scene.perform('sweep', { x: p.x, y: p.y }));
  scene.button('release', 330, 582, scene.phase === 'playing' ? 'RELEASE TO TRAY' : 'IRON RECOVERED', () => scene.perform('release'), {
    width: 298, height: 58, size: 25, enabled: scene.phase === 'playing',
  });
  scene.layer.add(magnetPanel(scene, 659, 582, 307, 58, { fill: 0x101b30 }));
  qText(scene, 659, 582, 'Drag or tap.\nArrows move; Space releases.', 17, '#c5b3ef', 269);
}

function sieveView(scene) {
  renderSieveWorkshop(scene);
}

function filterView(scene) {
  renderFilterWorkshop(scene);
}

function evaporationView(scene) {
  renderEvaporationWorkshop(scene);
}

function decantView(scene) {
  renderDecantWorkshop(scene);
}

export function renderSeparation(scene) {
  const render = { magnet: magnetView, sieve: sieveView, filter: filterView, evaporate: evaporationView, decant: decantView }[scene.gameDefinition.kind];
  render(scene);
}
