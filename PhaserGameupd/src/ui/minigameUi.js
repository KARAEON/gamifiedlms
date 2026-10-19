import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { colors, coverImage, textStyle } from './ui.js';
import { supplyPanel, supplyText } from './supplyCartUi.js';
import { createMinigameHeader } from './minigameHeader.js';

export function drawMinigameBackdrop(scene, key) {
  if (key && scene.textures.exists(key)) {
    coverImage(scene, key);
    scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0e1920, 0.25).setOrigin(0);
    return;
  }
  scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x213733, 1).setOrigin(0);
  scene.add.rectangle(0, 0, GAME_WIDTH, 136, 0x3e3a36, 0.96).setOrigin(0);
  scene.add.rectangle(0, 136, GAME_WIDTH, 6, colors.gold, 1).setOrigin(0);
  scene.add.rectangle(0, 610, GAME_WIDTH, 110, 0x5b4a42, 1).setOrigin(0);

  const wall = scene.add.graphics();
  wall.lineStyle(2, 0x2f4a46, 0.55);
  for (let x = 0; x <= GAME_WIDTH; x += 64) {
    wall.lineBetween(x, 142, x, 610);
  }
  for (let y = 142; y <= 610; y += 56) {
    wall.lineBetween(0, y, GAME_WIDTH, y);
  }

  drawShelf(scene, 80, 168);
  drawShelf(scene, 1022, 168);
  drawBottomLabDetails(scene);
}

export function createMinigameHud(scene, {
  title, topic, progressLabel, progressValue = 0, progressMax, score = 0, time = 0,
}) {
  const header = createMinigameHeader(scene, {
    day: 1, title, subtitle: topic,
    counters: [{ label: 'TIME', glyph: 'clock', color: '#e8dcc0' }, { label: 'SCORE', glyph: 'star' }],
  });
  const { titleText, subtitleText: topicText, values: [timerText, scoreText] } = header;
  scoreText.setText(String(score));
  supplyPanel(scene, 640, 132, 798, 38, { fill: 0x101d2b, edge: 0x35678e });
  const progressGraphics = scene.add.graphics().setDepth(6);
  const progressText = supplyText(scene, 852, 132, '', 20).setDepth(6);
  const drawProgress = (value, max = progressMax) => {
    progressGraphics.clear();
    for (let i = 0; i < max; i++) {
      progressGraphics.fillStyle(i < value ? 0x77ad2e : 0x263a4c);
      progressGraphics.fillRect(265 + i * 80, 122, 70, 20);
      progressGraphics.lineStyle(2, 0x0a101a);
      progressGraphics.strokeRect(265 + i * 80, 122, 70, 20);
    }
    progressText.setText(`${progressLabel} ${value} / ${max}`);
  };
  const setTime = value => timerText.setText(`${Math.floor(value / 60).toString().padStart(2, '0')}:${Math.ceil(value % 60).toString().padStart(2, '0')}`);
  setTime(time);
  drawProgress(progressValue, progressMax);
  return {
    titleText, topicText, scoreText, timerText, progressGraphics, progressText,
    setScore: value => scoreText.setText(String(value)), setTime,
    setProgress: (value, max = progressMax) => drawProgress(value, max),
  };
}

export function createBottomFeedback(scene, { primary, secondary, rightInset = 0, panelFactory = supplyPanel, align = 'center', primarySize = 24, secondaryColor = '#67d8ee' }) {
  const width = 1140 - rightInset;
  const x = 103 + width / 2;
  panelFactory(scene, x, 678, width, 64, { fill: 0x111c30, edge: 0x35678e });
  const textX = align === 'left' ? 124 : x;
  const primaryText = supplyText(scene, textX, 660, primary, primarySize, '#fff2c9', align).setDepth(6);
  const secondaryText = supplyText(scene, textX, 692, secondary, 18, secondaryColor, align).setDepth(6);
  primaryText.setWordWrapWidth(width - 62);
  secondaryText.setWordWrapWidth(width - 62);
  return { primaryText, secondaryText,
    setText: (a, b) => { if (a !== undefined) primaryText.setText(a); if (b !== undefined) secondaryText.setText(b); },
  };
}

export function createSparkles(scene, x, y) {
  for (let index = 0; index < 8; index += 1) {
    const sparkle = scene.add.circle(x, y, 4, index % 2 === 0 ? colors.gold : 0x66e5ff, 1);
    sparkle.setDepth(15);
    const angle = (Math.PI * 2 * index) / 8;
    scene.tweens.add({
      targets: sparkle,
      x: x + Math.cos(angle) * 62,
      y: y + Math.sin(angle) * 44,
      alpha: 0,
      duration: 420,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onComplete: () => sparkle.destroy(),
    });
  }
}

export function drawMixtureIcon(graphics, icon) {
  graphics.lineStyle(4, 0x2f2a2a, 1);

  if (icon === 'salt-water') {
    graphics.strokeRoundedRect(-28, -32, 56, 58, 7);
    graphics.fillStyle(0x66e5ff, 0.9);
    graphics.fillRoundedRect(-22, -3, 44, 25, 5);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(-10, 6, 3);
    graphics.fillCircle(8, 13, 3);
    graphics.fillCircle(18, 3, 2);
    return;
  }

  if (icon === 'orange-juice' || icon === 'juice') {
    graphics.strokeRoundedRect(-26, -34, 52, 60, 7);
    graphics.fillStyle(0xff9b42, 0.96);
    graphics.fillRoundedRect(-20, -8, 40, 30, 5);
    graphics.lineStyle(3, colors.cream, 1);
    graphics.lineBetween(6, -32, 28, -48);
    graphics.fillStyle(colors.gold, 1);
    graphics.fillCircle(-36, -8, 12);
    return;
  }

  if (icon === 'lemonade') {
    graphics.strokeRoundedRect(-26, -34, 52, 60, 7);
    graphics.fillStyle(0xfff078, 0.96);
    graphics.fillRoundedRect(-20, -8, 40, 30, 5);
    graphics.lineStyle(3, colors.cream, 1);
    graphics.lineBetween(6, -32, 28, -48);
    graphics.fillStyle(0xffd76a, 1);
    graphics.fillCircle(-35, -7, 13);
    graphics.lineStyle(3, 0xffffff, 0.8);
    graphics.lineBetween(-43, -7, -27, -7);
    graphics.lineBetween(-35, -15, -35, 1);
    return;
  }

  if (icon === 'sand-water') {
    graphics.strokeRoundedRect(-30, -32, 60, 58, 7);
    graphics.fillStyle(0x66e5ff, 0.72);
    graphics.fillRoundedRect(-24, -12, 48, 18, 4);
    graphics.fillStyle(0xd7a35a, 1);
    graphics.fillRoundedRect(-24, 5, 48, 18, 4);
    graphics.fillStyle(0x7c5b34, 1);
    graphics.fillCircle(-10, 13, 2);
    graphics.fillCircle(6, 17, 2);
    graphics.fillCircle(18, 10, 2);
    return;
  }

  if (icon === 'milk') {
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRoundedRect(-22, -32, 44, 64, 5);
    graphics.fillStyle(0x66e5ff, 0.88);
    graphics.fillRect(-16, -10, 32, 18);
    graphics.lineStyle(4, 0x2f2a2a, 1);
    graphics.strokeRoundedRect(-22, -32, 44, 64, 5);
    graphics.lineBetween(-13, -33, -5, -48);
    graphics.lineBetween(5, -48, 13, -33);
    graphics.lineBetween(-5, -48, 5, -48);
    return;
  }

  if (icon === 'cereal-milk') {
    graphics.fillStyle(0x8a6048, 1);
    graphics.fillEllipse(0, 14, 76, 26);
    graphics.fillStyle(0xffefb5, 1);
    graphics.fillEllipse(0, 6, 68, 20);
    graphics.fillStyle(0xd99a3d, 1);
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      graphics.fillCircle(Math.cos(angle) * 22, -2 + Math.sin(angle) * 11, 5);
    }
    return;
  }

  if (icon === 'vegetable-salad') {
    graphics.fillStyle(0x8a6048, 1);
    graphics.fillEllipse(0, 14, 78, 27);
    graphics.fillStyle(0xffefb5, 1);
    graphics.fillEllipse(0, 5, 70, 21);
    graphics.fillStyle(0x58cc02, 1);
    graphics.fillCircle(-24, -7, 11);
    graphics.fillCircle(-2, -14, 12);
    graphics.fillCircle(24, -5, 11);
    graphics.fillStyle(0xff5a66, 1);
    graphics.fillCircle(-10, 2, 8);
    graphics.fillCircle(17, -16, 7);
    graphics.fillStyle(0xf4f0d0, 1);
    graphics.fillCircle(8, 5, 7);
    return;
  }

  if (icon === 'vinegar') {
    graphics.fillStyle(0xd8fbff, 0.92);
    graphics.fillRoundedRect(-20, -30, 40, 62, 6);
    graphics.fillStyle(0x66e5ff, 0.35);
    graphics.fillRoundedRect(-15, -2, 30, 29, 4);
    graphics.lineStyle(4, 0x2f2a2a, 1);
    graphics.strokeRoundedRect(-20, -30, 40, 62, 6);
    graphics.strokeRect(-10, -44, 20, 14);
    graphics.fillStyle(0xfff2c9, 1);
    graphics.fillRoundedRect(-14, -12, 28, 16, 3);
    graphics.fillStyle(0x2f2a2a, 1);
    graphics.fillTriangle(-6, -9, 0, 0, 6, -9);
    return;
  }

  if (icon === 'oil-water') {
    graphics.strokeRoundedRect(-25, -34, 50, 66, 7);
    graphics.fillStyle(0xffd76a, 0.95);
    graphics.fillRoundedRect(-19, -8, 38, 19, 4);
    graphics.fillStyle(0x66e5ff, 0.82);
    graphics.fillRoundedRect(-19, 10, 38, 17, 4);
    graphics.lineStyle(3, 0x2f2a2a, 1);
    graphics.lineBetween(-19, 10, 19, 10);
    graphics.fillStyle(0xffffff, 0.95);
    graphics.fillCircle(9, -17, 4);
    return;
  }

  if (icon === 'halo-halo') {
    graphics.strokeRoundedRect(-34, -31, 68, 58, 7);
    graphics.fillStyle(0xffffff, 0.92);
    graphics.fillRoundedRect(-28, 1, 56, 20, 4);
    graphics.fillStyle(0x9b6bd3, 1);
    graphics.fillCircle(-14, -16, 13);
    graphics.fillStyle(0xff5a66, 1);
    graphics.fillCircle(-22, 4, 8);
    graphics.fillStyle(0x58cc02, 1);
    graphics.fillCircle(2, -2, 8);
    graphics.fillStyle(0xffd76a, 1);
    graphics.fillCircle(18, -9, 9);
    graphics.lineStyle(4, 0x8a6048, 1);
    graphics.lineBetween(18, -34, 28, 6);
    return;
  }

  if (icon === 'soy-sauce') {
    graphics.fillStyle(0x2a1712, 1);
    graphics.fillRoundedRect(-21, -24, 42, 54, 7);
    graphics.fillStyle(0xb52d25, 1);
    graphics.fillRoundedRect(-17, -35, 34, 14, 4);
    graphics.fillStyle(0xfff2c9, 1);
    graphics.fillRoundedRect(-16, -4, 32, 18, 3);
    graphics.lineStyle(4, 0x2f2a2a, 1);
    graphics.strokeRoundedRect(-21, -24, 42, 54, 7);
    graphics.strokeRoundedRect(-17, -35, 34, 14, 4);
    return;
  }

  if (icon === 'chocolate-drink') {
    graphics.strokeRoundedRect(-28, -34, 56, 62, 7);
    graphics.fillStyle(0x8a6048, 0.96);
    graphics.fillRoundedRect(-22, -10, 44, 33, 5);
    graphics.fillStyle(0x5b392f, 1);
    graphics.fillCircle(-8, 5, 2);
    graphics.fillCircle(9, 14, 2);
    graphics.lineStyle(4, 0xffffff, 1);
    graphics.lineBetween(14, -40, 24, -6);
    graphics.lineStyle(3, 0xff5a66, 1);
    graphics.lineBetween(17, -39, 27, -7);
    return;
  }

  if (icon === 'shampoo') {
    graphics.fillStyle(0x9b6bd3, 1);
    graphics.fillRoundedRect(-24, -24, 48, 56, 9);
    graphics.fillStyle(0xcaa7ff, 1);
    graphics.fillRoundedRect(-18, -41, 36, 18, 5);
    graphics.fillRect(-9, -54, 18, 14);
    graphics.fillRect(7, -51, 18, 6);
    graphics.fillStyle(0x66e5ff, 0.82);
    graphics.fillRoundedRect(-16, -1, 32, 18, 5);
    graphics.lineStyle(4, 0x2f2a2a, 1);
    graphics.strokeRoundedRect(-24, -24, 48, 56, 9);
    graphics.strokeRoundedRect(-18, -41, 36, 18, 5);
    graphics.fillStyle(0xffffff, 0.75);
    graphics.fillCircle(1, 8, 3);
    return;
  }

  graphics.fillStyle(0x8a6048, 1);
  graphics.fillEllipse(0, 12, 76, 26);
  graphics.fillStyle(0xffefb5, 1);
  graphics.fillEllipse(0, 5, 68, 20);
  graphics.fillStyle(0xff5a66, 1);
  graphics.fillCircle(-18, -10, 11);
  graphics.fillStyle(colors.gold, 1);
  graphics.fillCircle(2, -14, 11);
  graphics.fillStyle(0x58cc02, 1);
  graphics.fillCircle(20, -5, 10);
  graphics.fillStyle(0x9b6bd3, 1);
  graphics.fillCircle(-2, 2, 9);
}

function drawShelf(scene, x, y) {
  const shelf = scene.add.graphics();
  shelf.fillStyle(0x8a6048, 1);
  shelf.fillRoundedRect(x, y + 74, 176, 12, 4);
  shelf.fillStyle(0xff9b42, 1);
  shelf.fillRect(x + 20, y + 28, 24, 48);
  shelf.fillStyle(0x66e5ff, 0.85);
  shelf.fillRect(x + 24, y + 48, 16, 22);
  shelf.fillStyle(0x9fe870, 1);
  shelf.fillRect(x + 68, y + 16, 32, 60);
  shelf.fillStyle(colors.cream, 1);
  shelf.fillCircle(x + 128, y + 55, 24);
}

function drawBottomLabDetails(scene) {
  const desk = scene.add.graphics();
  desk.fillStyle(0x45352f, 1);
  desk.fillRoundedRect(88, 632, 190, 48, 6);
  desk.fillRoundedRect(1012, 632, 182, 48, 6);
  desk.lineStyle(4, colors.cream, 0.45);
  desk.strokeRoundedRect(88, 632, 190, 48, 6);
  desk.strokeRoundedRect(1012, 632, 182, 48, 6);
  desk.fillStyle(0x66e5ff, 0.8);
  desk.fillCircle(150, 656, 14);
  desk.fillStyle(0xff9b42, 0.92);
  desk.fillCircle(206, 656, 14);
  desk.fillStyle(0x58cc02, 0.92);
  desk.fillCircle(1060, 656, 14);
  desk.fillStyle(colors.gold, 0.92);
  desk.fillCircle(1116, 656, 14);
}
