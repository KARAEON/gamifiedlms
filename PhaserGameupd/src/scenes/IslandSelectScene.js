import Phaser from 'phaser';
import { islands } from '../config/content.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import { colors, coverImage, createBackArrow, flashToast, textStyle } from '../ui/ui.js';

export default class IslandSelectScene extends Phaser.Scene {
  constructor() {
    super('IslandSelectScene');
  }

  create() {
    coverImage(this, 'clouds-bg');
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.04).setOrigin(0);
    this.islandImages = [];

    createBackArrow(this, () => this.scene.start('MenuScene'));

    const title = this.add.text(GAME_WIDTH / 2, 74, 'ISLAND RUINS', textStyle(54, '#fff2c9'));
    title.setOrigin(0.5);
    title.setShadow(5, 5, '#6d8c8a', 0, false, true);

    islands.forEach((island) => {
      this.createIsland(island);
    });

    markSceneReady('IslandSelectScene', {
      selectedIsland: null,
      islandPositions: this.getIslandPositions(),
    });
  }

  createIsland(island) {
    const image = this.add.image(island.x, island.y, island.assetKey);
    image.setScale(island.scale);
    image.setData('islandId', island.id);
    image.setData('homeX', island.x);
    image.setData('homeY', island.y);
    this.islandImages.push(image);
    let nameplate = null;

    if (!island.unlocked) {
      image.setTint(0x202020);
      image.setAlpha(0.82);
      this.drawLock(island.x, island.y + 18);
    }

    const onSelect = () => {
      if (!island.unlocked) {
        this.showLockedFeedback(image, island.id);
        return;
      }

      setTestState({ selectedIsland: island.id });
      this.scene.start('IslandMapScene', { islandId: island.id });
    };

    const setHover = (isHovered) => {
      if (isHovered) {
        image.setScale(island.scale * 1.04);
        nameplate?.setScale(1.04);
        return;
      }

      image.setScale(island.scale);
      nameplate?.setScale(1);
    };

    const hitZone = this.add.zone(island.x, island.y, island.hitWidth, island.hitHeight);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.on('pointerover', () => setHover(true));
    hitZone.on('pointerout', () => setHover(false));
    hitZone.on('pointerup', onSelect);

    if (island.unlocked) {
      nameplate = this.createIslandNameplate(island.x, 620, island.label);
      const nameplateHitZone = this.add.zone(island.x, 620, 300, 74);
      nameplateHitZone.setInteractive({ useHandCursor: true });
      nameplateHitZone.on('pointerover', () => setHover(true));
      nameplateHitZone.on('pointerout', () => setHover(false));
      nameplateHitZone.on('pointerup', onSelect);
    }
  }

  createIslandNameplate(x, y, label) {
    const container = this.add.container(x, y);
    const shadow = this.add.rectangle(6, 8, 300, 70, 0x000000, 0.22);
    shadow.setOrigin(0.5);

    const plaque = this.add.graphics();
    plaque.fillStyle(colors.paper, 1);
    plaque.lineStyle(4, colors.paperDark, 1);
    plaque.fillRoundedRect(-150, -35, 300, 70, 6);
    plaque.strokeRoundedRect(-150, -35, 300, 70, 6);
    plaque.lineStyle(2, 0xffffff, 0.45);
    plaque.strokeRoundedRect(-143, -28, 286, 56, 5);

    const text = this.add.text(0, -3, label, textStyle(34, '#65e7ff'));
    text.setOrigin(0.5);
    text.setShadow(2, 2, '#ffffff', 0, false, true);

    container.add([shadow, plaque, text]);
    return container;
  }

  drawLock(x, y) {
    const graphics = this.add.graphics();
    graphics.lineStyle(8, 0xfff2c9, 1);
    graphics.strokeRoundedRect(x - 27, y - 5, 54, 43, 4);
    graphics.strokeCircle(x, y - 10, 23);
    graphics.fillStyle(0x000000, 0.6);
    graphics.fillRoundedRect(x - 32, y - 9, 64, 50, 4);
    graphics.lineStyle(5, 0xfff2c9, 1);
    graphics.strokeRoundedRect(x - 27, y - 5, 54, 43, 4);
    graphics.beginPath();
    graphics.arc(x, y - 5, 21, Math.PI, 0, false);
    graphics.strokePath();
  }

  showLockedFeedback(image, islandId) {
    setTestState({
      lockedFeedback: islandId,
      islandPositions: this.getIslandPositions(),
    });
    flashToast(this, 'LOCKED');

    const originalX = image.getData('homeX') ?? image.x;
    const originalY = image.getData('homeY') ?? image.y;
    this.tweens.killTweensOf(image);
    image.setPosition(originalX, originalY);
    setTestState({ islandPositions: this.getIslandPositions() });

    this.tweens.add({
      targets: image,
      x: originalX + 8,
      yoyo: true,
      repeat: 3,
      duration: 45,
      onComplete: () => {
        image.setPosition(originalX, originalY);
        setTestState({ islandPositions: this.getIslandPositions() });
      },
    });
  }

  getIslandPositions() {
    return this.islandImages?.map((image) => ({
      id: image.getData('islandId'),
      x: Math.round(image.x),
      y: Math.round(image.y),
    })) ?? [];
  }
}
