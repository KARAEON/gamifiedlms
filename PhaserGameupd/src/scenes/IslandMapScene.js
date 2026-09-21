import Phaser from 'phaser';
import { vulcanQuarterNodes } from '../config/content.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import { colors, coverImage, createBackArrow, textStyle } from '../ui/ui.js';

export default class IslandMapScene extends Phaser.Scene {
  constructor() {
    super('IslandMapScene');
  }

  init(data) {
    this.islandId = data.islandId ?? 'vulcan-caverns';
  }

  create() {
    coverImage(this, 'vulcan-caverns-map');
    this.add.rectangle(0, 0, GAME_WIDTH, 112, 0x000000, 0.24).setOrigin(0);

    createBackArrow(this, () => this.scene.start('IslandSelectScene'));

    const title = this.add.text(156, 56, 'VULCAN\nCAVERNS', textStyle(40, '#fff2c9', 'left'));
    title.setOrigin(0, 0.5);
    title.setLineSpacing(-8);
    title.setShadow(4, 4, '#4d332f', 0, false, true);

    this.createQuarterNodes();

    markSceneReady('IslandMapScene', {
      selectedIsland: this.islandId,
      selectedQuarter: null,
      mapQuarterNodeCount: vulcanQuarterNodes.length,
      mapSmallNodeCount: 0,
    });
  }

  createQuarterNodes() {
    vulcanQuarterNodes.forEach((node) => {
      const radius = 33;
      const container = this.add.container(node.x, node.y);
      container.setDepth(10);

      const glow = this.add.circle(0, 0, radius + 11, colors.gold, 0.18);
      const shadow = this.add.circle(5, 7, radius + 3, 0x000000, 0.34);
      const outer = this.add.circle(0, 0, radius, colors.gold, 1);
      outer.setStrokeStyle(5, 0x6f4524, 1);
      const inner = this.add.circle(0, 0, radius * 0.58, 0xfff2a7, 1);
      const text = this.add.text(0, -2, node.label, textStyle(22, '#4b3527'));
      text.setOrigin(0.5);

      container.add([glow, shadow, outer, inner, text]);

      const hitArea = this.add.zone(0, 0, radius * 2.4, radius * 2.4);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerover', () => container.setScale(1.12));
      hitArea.on('pointerout', () => container.setScale(1));
      hitArea.on('pointerup', () => this.openQuarter(node));
      container.add(hitArea);
      container.setData('quarterId', node.id);
    });
  }

  openQuarter(node) {
    setTestState({ selectedQuarter: node.id });
    this.scene.start('QuarterDetailScene', {
      islandId: this.islandId,
      quarterId: node.id,
    });
  }
}
