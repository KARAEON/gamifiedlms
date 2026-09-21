import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import { textStyle } from '../ui/ui.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    setTestState({ ready: false, sceneKey: 'BootScene' });

    const progressBox = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 360, 36, 0x222222, 0.8);
    progressBox.setStrokeStyle(3, 0xfff2c9, 1);
    const progressBar = this.add.rectangle(GAME_WIDTH / 2 - 172, GAME_HEIGHT / 2, 0, 22, 0x66e5ff, 1);
    progressBar.setOrigin(0, 0.5);
    const loadingText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 58, 'LOADING', textStyle(32));
    loadingText.setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.width = 344 * value;
    });

    this.load.image('horizon-bg', '/assets/backgrounds/horizon-bg.png');
    this.load.image('clouds-bg', '/assets/backgrounds/clouds-bg.png');
    this.load.image('vulcan-caverns', '/assets/islands/vulcan-caverns.png');
    this.load.image('numeric-ruins', '/assets/islands/numeric-ruins.png');
    this.load.image('reading-island', '/assets/islands/reading-island.png');
    this.load.image('vulcan-caverns-map', '/assets/island-maps/vulcan-caverns-map.png');
  }

  create() {
    this.registry.set('musicEnabled', true);
    this.registry.set('sfxEnabled', true);
    markSceneReady('BootScene');
    this.scene.start('MenuScene');
  }
}
