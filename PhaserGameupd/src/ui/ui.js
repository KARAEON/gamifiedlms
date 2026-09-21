import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { setTestState } from '../systems/testSeam.js';

const FONT_FAMILY = '"Pixelify Sans", monospace';

export const colors = {
  paper: 0xffdca6,
  paperLight: 0xfff2c9,
  paperDark: 0x9e6b47,
  cyan: 0x66e5ff,
  cyanDark: 0x27647a,
  ink: 0x2f2a2a,
  gold: 0xffd76a,
  cream: 0xffefb5,
};

export function coverImage(scene, key) {
  const image = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key);
  const scale = Math.max(GAME_WIDTH / image.width, GAME_HEIGHT / image.height);
  image.setScale(scale);
  return image;
}

export function textStyle(size, color = '#fff2c9', align = 'center') {
  return {
    fontFamily: FONT_FAMILY,
    fontSize: `${size}px`,
    fontStyle: '700',
    color,
    align,
    letterSpacing: 0,
  };
}

export function createPixelButton(scene, x, y, label, onClick, options = {}) {
  const width = options.width ?? 260;
  const height = options.height ?? 68;
  const radius = options.radius ?? 6;
  const fontSize = options.fontSize ?? 34;
  const fill = options.fill ?? colors.paper;
  const hoverFill = options.hoverFill ?? colors.paperLight;
  const stroke = options.stroke ?? colors.paperDark;
  const textColor = options.textColor ?? '#65e7ff';
  const testId = options.testId ?? label.toLowerCase().replaceAll(' ', '-');

  const container = scene.add.container(x, y);
  const shadow = scene.add.rectangle(6, 8, width, height, 0x000000, 0.28);
  shadow.setOrigin(0.5);

  const graphics = scene.add.graphics();
  const draw = (currentFill) => {
    graphics.clear();
    graphics.fillStyle(currentFill, 1);
    graphics.lineStyle(4, stroke, 1);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
    graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
    graphics.lineStyle(2, 0xffffff, 0.45);
    graphics.strokeRoundedRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 10, radius);
  };

  draw(fill);

  const text = scene.add.text(0, -2, label, textStyle(fontSize, textColor));
  text.setOrigin(0.5);
  text.setShadow(2, 2, '#ffffff', 0, false, true);

  const hitArea = scene.add.zone(0, 0, width, height);
  hitArea.setOrigin(0.5);
  hitArea.setInteractive({ useHandCursor: true });
  hitArea.on('pointerover', () => {
    draw(hoverFill);
    container.setScale(1.03);
  });
  hitArea.on('pointerout', () => {
    draw(fill);
    container.setScale(1);
  });
  hitArea.on('pointerdown', () => {
    container.setScale(0.98);
  });
  hitArea.on('pointerup', () => {
    container.setScale(1.03);
    onClick?.();
  });

  container.add([shadow, graphics, text, hitArea]);
  container.setSize(width, height);
  container.setData('testId', testId);

  return container;
}

export function createBackArrow(scene, onClick) {
  const container = scene.add.container(64, 62);
  const graphics = scene.add.graphics();
  graphics.fillStyle(0xfff2c9, 1);
  graphics.lineStyle(4, 0x34434a, 1);
  graphics.beginPath();
  graphics.moveTo(-25, 0);
  graphics.lineTo(13, -23);
  graphics.lineTo(13, -9);
  graphics.lineTo(35, -9);
  graphics.lineTo(35, 9);
  graphics.lineTo(13, 9);
  graphics.lineTo(13, 23);
  graphics.closePath();
  graphics.fillPath();
  graphics.strokePath();

  const hitArea = scene.add.zone(0, 0, 96, 76).setInteractive({ useHandCursor: true });
  hitArea.on('pointerover', () => container.setScale(1.08));
  hitArea.on('pointerout', () => container.setScale(1));
  hitArea.on('pointerup', onClick);
  container.add([graphics, hitArea]);
  return container;
}

export function showModal(scene, config) {
  closeOpenModal(scene);

  const modalName = config.name ?? 'modal';
  setTestState({ openModal: modalName });
  const camera = scene.cameras.main;
  const viewX = camera.scrollX;
  const viewY = camera.scrollY;

  const overlay = scene.add.container(0, 0);
  overlay.setDepth(1000);

  const blocker = scene.add.rectangle(viewX, viewY, GAME_WIDTH, GAME_HEIGHT, 0x000000, config.overlayAlpha ?? 0.64);
  blocker.setOrigin(0);
  blocker.setInteractive();

  const panelWidth = config.width ?? 520;
  const panelHeight = config.height ?? 320;
  const panelX = config.x ?? viewX + GAME_WIDTH / 2;
  const panelY = config.y ?? viewY + GAME_HEIGHT / 2;
  const panelLeft = panelX - panelWidth / 2;
  const panelTop = panelY - panelHeight / 2;
  const panelRight = panelX + panelWidth / 2;
  const panelBottom = panelY + panelHeight / 2;
  const panel = scene.add.graphics();
  panel.fillStyle(0x3e3a36, 0.95);
  panel.lineStyle(5, colors.paperLight, 1);
  panel.fillRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 8);
  panel.strokeRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 8);
  panel.lineStyle(3, colors.paperDark, 1);
  panel.strokeRoundedRect(panelLeft + 10, panelTop + 10, panelWidth - 20, panelHeight - 20, 6);

  const title = scene.add.text(
    panelX,
    panelTop + (config.titleTop ?? 62),
    config.title,
    textStyle(config.titleSize ?? 38),
  );
  title.setOrigin(0.5);
  title.setWordWrapWidth(panelWidth - 72);
  title.setShadow(3, 3, '#000000', 0, false, true);

  overlay.add([blocker, panel, title]);

  const body = config.body?.(overlay, {
    panelX,
    panelY,
    panelWidth,
    panelHeight,
    panelLeft,
    panelTop,
    panelRight,
    panelBottom,
    bodyTop: panelTop + (config.bodyTop ?? 112),
    bodyBottom: panelBottom - (config.bodyBottom ?? 118),
  });
  if (Array.isArray(body)) {
    overlay.add(body);
  }

  const buttons = config.buttons ?? [{ label: 'BACK', action: () => closeOpenModal(scene) }];
  const buttonY = config.buttonY ?? panelBottom - 68;
  const spacing = config.buttonSpacing ?? 210;
  const startX = panelX - ((buttons.length - 1) * spacing) / 2;
  buttons.forEach((button, index) => {
    const control = createPixelButton(scene, startX + index * spacing, buttonY, button.label, () => {
      button.action?.();
    }, {
      width: button.width ?? 180,
      height: 56,
      fontSize: 26,
      testId: `${modalName}-${button.label.toLowerCase()}`,
    });
    overlay.add(control);
  });

  scene.currentModal = overlay;
  return overlay;
}

export function closeOpenModal(scene) {
  if (scene.currentModal) {
    scene.currentModal.destroy(true);
    scene.currentModal = null;
  }

  setTestState({ openModal: null });
}

export function createToggleRow(scene, x, y, label, initialValue, onToggle) {
  const container = scene.add.container(x, y);
  let enabled = initialValue;

  const labelText = scene.add.text(-110, 0, label, textStyle(30, '#fff2c9', 'left'));
  labelText.setOrigin(0, 0.5);

  const stateText = scene.add.text(95, 0, enabled ? 'ON' : 'OFF', textStyle(30, enabled ? '#66e5ff' : '#ff9f9f'));
  stateText.setOrigin(0.5);

  const hitArea = scene.add.zone(70, 0, 180, 50).setInteractive({ useHandCursor: true });
  hitArea.on('pointerup', () => {
    enabled = !enabled;
    stateText.setText(enabled ? 'ON' : 'OFF');
    stateText.setColor(enabled ? '#66e5ff' : '#ff9f9f');
    onToggle(enabled);
  });

  container.add([labelText, stateText, hitArea]);
  return container;
}

export function flashToast(scene, message) {
  if (scene.toast) {
    scene.toast.destroy(true);
  }

  const toast = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 92);
  toast.setDepth(900);
  const background = scene.add.rectangle(0, 0, 260, 58, 0x1f1f1f, 0.82);
  background.setStrokeStyle(3, colors.paperLight, 1);
  const text = scene.add.text(0, -2, message, textStyle(30, '#fff2c9'));
  text.setOrigin(0.5);
  toast.add([background, text]);
  scene.toast = toast;

  scene.tweens.add({
    targets: toast,
    y: GAME_HEIGHT - 112,
    alpha: 0,
    duration: 950,
    ease: Phaser.Math.Easing.Quadratic.Out,
    onComplete: () => {
      toast.destroy(true);
      if (scene.toast === toast) {
        scene.toast = null;
      }
    },
  });
}
