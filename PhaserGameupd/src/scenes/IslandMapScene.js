import Phaser from 'phaser';
import { islands, islandCurricula } from '../config/content.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { playAreaMusic } from '../systems/music.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import { colors, coverImage, createBackArrow, textStyle, titleStyle } from '../ui/ui.js';
import { ISLAND_VISUALS, isIslandUnlocked } from '../config/islandVisuals.js';
import { LibraryView } from '../ui/libraryView.js';

export default class IslandMapScene extends Phaser.Scene {
  constructor() {
    super('IslandMapScene');
  }

  init(data = {}) {
    this.island = islands.find((island) => island.id === data.islandId) ?? islands.find((island) => island.id === 'vulcan-caverns');
    this.islandId = this.island.id;
    this.quarterNodes = islandCurricula[this.islandId]?.nodes ?? [];
  }

  create() {
    if (!isIslandUnlocked(this, this.island)) {
      this.scene.start('IslandSelectScene', { islandId: this.islandId });
      return;
    }
    playAreaMusic(this, this.islandId);
    const returnToWorld = () => this.scene.start('IslandSelectScene', { islandId: this.islandId, fromLibrary: this.islandId === 'grand-library' });
    if (this.islandId === 'grand-library') {
      const library = new LibraryView(this, returnToWorld);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => library.destroy());
      markSceneReady('IslandMapScene', {
        selectedIsland: this.islandId, mapQuarterNodeCount: 0, mapSmallNodeCount: 0, worldBackground: 'archive-gallery',
      });
      return;
    }

    const background = `${this.islandId}-map`;
    coverImage(this, background);
    this.add.rectangle(0, 0, GAME_WIDTH, 112, 0x000000, 0.24).setOrigin(0);

    createBackArrow(this, returnToWorld);

    const title = this.add.text(156, 43, this.island.title, titleStyle(31, '#fff2c9', 'left'));
    title.setOrigin(0, 0.5);
    title.setLineSpacing(-8);
    title.setShadow(4, 4, '#4d332f', 0, false, true);
    const destinationHint = this.quarterNodes.length ? 'SELECT A QUARTER' : 'KNOWLEDGE HUB';
    this.add.text(156, 80, `${ISLAND_VISUALS[this.islandId].subject} · ${destinationHint}`, textStyle(20, '#fff2c9', 'left'));

    this.createQuarterNodes();
    if (!this.quarterNodes.length) {
      const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 62, 560, 72, 0x172d3b, 0.94);
      panel.setStrokeStyle(3, 0xffe6a3);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 62, 'NEW LESSONS COMING SOON', textStyle(28, '#fff2c9')).setOrigin(0.5);
    }

    markSceneReady('IslandMapScene', {
      selectedIsland: this.islandId,
      selectedQuarter: null,
      mapQuarterNodeCount: this.quarterNodes.length,
      worldBackground: background,
      mapSmallNodeCount: 0,
    });
  }

  createQuarterNodes() {
    this.quarterNodes.forEach((node) => {
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
