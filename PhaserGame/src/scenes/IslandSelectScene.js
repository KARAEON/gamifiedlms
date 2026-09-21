import Phaser from 'phaser';
import { islands } from '../config/content.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import { coverImage, createBackArrow, createPixelButton, flashToast, textStyle } from '../ui/ui.js';

export default class IslandSelectScene extends Phaser.Scene {
  constructor() {
    super('IslandSelectScene');
  }

  create() {
    coverImage(this, 'clouds-bg');
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.04).setOrigin(0);

    createBackArrow(this, () => this.scene.start('MenuScene'));

    const title = this.add.text(GAME_WIDTH / 2, 74, 'ISLAND RUINS', textStyle(54, '#fff2c9'));
    title.setOrigin(0.5);
    title.setShadow(5, 5, '#6d8c8a', 0, false, true);

    islands.forEach((island) => {
      this.createIsland(island);
    });

    markSceneReady('IslandSelectScene', { selectedIsland: null });
  }

  createIsland(island) {
    const image = this.add.image(island.x, island.y, island.assetKey);
    image.setScale(island.scale);
    image.setData('islandId', island.id);

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

    const hitZone = this.add.zone(island.x, island.y, island.hitWidth, island.hitHeight);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.on('pointerover', () => {
      image.setScale(island.scale * 1.04);
    });
    hitZone.on('pointerout', () => {
      image.setScale(island.scale);
    });
    hitZone.on('pointerup', onSelect);

    if (island.unlocked) {
      createPixelButton(this, island.x, 620, island.label, onSelect, {
        width: 260,
        height: 62,
        fontSize: 32,
        testId: `${island.id}-button`,
      });
    }
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
    setTestState({ lockedFeedback: islandId });
    flashToast(this, 'LOCKED');

    const originalX = image.x;
    this.tweens.add({
      targets: image,
      x: originalX + 8,
      yoyo: true,
      repeat: 3,
      duration: 45,
      onComplete: () => {
        image.x = originalX;
      },
    });
  }
}
