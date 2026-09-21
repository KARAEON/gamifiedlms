import Phaser from 'phaser';
import BootScene from '../scenes/BootScene.js';
import IslandMapScene from '../scenes/IslandMapScene.js';
import IslandSelectScene from '../scenes/IslandSelectScene.js';
import MenuScene from '../scenes/MenuScene.js';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#111111',
  pixelArt: true,
  roundPixels: true,
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true,
    preserveDrawingBuffer: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, IslandSelectScene, IslandMapScene],
};
