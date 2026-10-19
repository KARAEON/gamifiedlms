import './styles.css';

import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig.js';
import { setupTestSeam } from './systems/testSeam.js';

setupTestSeam();

async function startGame() {
  if (document.fonts) {
    await Promise.all([
      document.fonts.load('32px "ArcadeClassic"'),
      document.fonts.load('20px "Lower Pixel"'),
    ]);
    await document.fonts.ready;
  }

  new Phaser.Game(gameConfig);
}

startGame();
