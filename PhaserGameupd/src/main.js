import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import './styles.css';

import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig.js';
import { setupTestSeam } from './systems/testSeam.js';

setupTestSeam();

async function startGame() {
  if (document.fonts) {
    await document.fonts.load('32px "Pixelify Sans"');
    await document.fonts.ready;
  }

  new Phaser.Game(gameConfig);
}

startGame();
