import Phaser from 'phaser';
import { vulcanMapNodes } from '../config/content.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import { closeOpenModal, colors, coverImage, createBackArrow, showModal, textStyle } from '../ui/ui.js';

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

    this.drawPath();
    this.createNodes();

    markSceneReady('IslandMapScene', { selectedIsland: this.islandId });
  }

  drawPath() {
    const graphics = this.add.graphics();
    graphics.lineStyle(7, 0x3f332d, 0.62);

    const points = vulcanMapNodes.map((node) => new Phaser.Math.Vector2(node.x, node.y));
    const curve = new Phaser.Curves.Spline(points);
    curve.draw(graphics, 80);

    graphics.lineStyle(3, colors.cream, 0.75);
    curve.draw(graphics, 80);
  }

  createNodes() {
    vulcanMapNodes.forEach((node) => {
      const isQuarter = node.kind === 'quarter';
      const radius = isQuarter ? 27 : 15;
      const container = this.add.container(node.x, node.y);
      container.setDepth(10);

      const shadow = this.add.circle(4, 6, radius + 3, 0x000000, 0.32);
      const outer = this.add.circle(0, 0, radius, isQuarter ? colors.gold : colors.cream, 1);
      outer.setStrokeStyle(isQuarter ? 5 : 3, isQuarter ? 0x6f4524 : 0x74634a, 1);
      const inner = this.add.circle(0, 0, radius * 0.52, isQuarter ? 0xfff2a7 : 0xffffcf, 1);

      container.add([shadow, outer, inner]);

      if (isQuarter) {
        const text = this.add.text(0, -1, node.label, textStyle(19, '#4b3527'));
        text.setOrigin(0.5);
        container.add(text);
      }

      const hitArea = this.add.zone(0, 0, radius * 2.4, radius * 2.4);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerover', () => container.setScale(1.12));
      hitArea.on('pointerout', () => container.setScale(1));
      hitArea.on('pointerup', () => this.openNode(node));
      container.add(hitArea);
      container.setData('nodeId', node.id);
    });
  }

  openNode(node) {
    setTestState({ selectedNode: node.id });

    showModal(this, {
      name: 'level',
      title: node.kind === 'quarter' ? `${node.label} QUARTER` : `LEVEL ${node.label}`,
      height: 285,
      body: (overlay, { panelX, panelY }) => {
        const body = this.add.text(panelX, panelY + 8, 'LEVEL PLACEHOLDER', textStyle(28, '#66e5ff'));
        body.setOrigin(0.5);
        return [body];
      },
      buttons: [
        {
          label: 'BACK',
          action: () => closeOpenModal(this),
        },
      ],
    });
  }
}
