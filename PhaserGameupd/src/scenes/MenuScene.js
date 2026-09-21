import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { markSceneReady } from '../systems/testSeam.js';
import { closeOpenModal, coverImage, createPixelButton, createToggleRow, showModal, textStyle } from '../ui/ui.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    coverImage(this, 'horizon-bg');
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.25).setOrigin(0);

    const title = this.add.text(GAME_WIDTH / 2, 142, 'LUMI', textStyle(86, '#fff2c9'));
    title.setOrigin(0.5);
    title.setShadow(7, 6, '#61e6ff', 0, false, true);

    const subtitle = this.add.text(GAME_WIDTH / 2, 215, 'ADVENTURES', textStyle(42, '#66e5ff'));
    subtitle.setOrigin(0.5);
    subtitle.setShadow(3, 3, '#183745', 0, false, true);

    createPixelButton(this, GAME_WIDTH / 2, 344, 'START', () => {
      this.scene.start('IslandSelectScene');
    }, { testId: 'start-button' });

    createPixelButton(this, GAME_WIDTH / 2, 440, 'SETTINGS', () => {
      this.openSettings();
    }, { testId: 'settings-button' });

    createPixelButton(this, GAME_WIDTH / 2, 536, 'EXIT', () => {
      this.openExit();
    }, { testId: 'exit-button' });

    markSceneReady('MenuScene');
  }

  openSettings() {
    showModal(this, {
      name: 'settings',
      title: 'SETTINGS',
      body: (overlay, { panelX, panelY }) => [
        createToggleRow(this, panelX - 16, panelY - 24, 'MUSIC', this.registry.get('musicEnabled'), (enabled) => {
          this.registry.set('musicEnabled', enabled);
        }),
        createToggleRow(this, panelX - 16, panelY + 42, 'SFX', this.registry.get('sfxEnabled'), (enabled) => {
          this.registry.set('sfxEnabled', enabled);
        }),
      ],
      buttons: [
        {
          label: 'BACK',
          action: () => closeOpenModal(this),
        },
      ],
    });
  }

  openExit() {
    showModal(this, {
      name: 'exit',
      title: 'THANKS FOR PLAYING',
      height: 280,
      body: (overlay, { panelX, panelY }) => {
        const note = this.add.text(panelX, panelY + 10, 'YOUR JOURNEY CAN CONTINUE ANY TIME', textStyle(24, '#fff2c9'));
        note.setOrigin(0.5);
        return [note];
      },
      buttons: [
        {
          label: 'BACK TO MENU',
          width: 250,
          action: () => closeOpenModal(this),
        },
      ],
    });
  }
}
