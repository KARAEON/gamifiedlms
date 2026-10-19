import Phaser from 'phaser';
import AssessmentScene from '../scenes/AssessmentScene.js';
import BootScene from '../scenes/BootScene.js';
import CloudTransitionScene from '../scenes/CloudTransitionScene.js';
import IslandMapScene from '../scenes/IslandMapScene.js';
import IslandSelectScene from '../scenes/IslandSelectScene.js';
import InventMixScene from '../scenes/InventMixScene.js';
import IntroScene from '../scenes/IntroScene.js';
import MenuScene from '../scenes/MenuScene.js';
import MixtureDetectiveScene from '../scenes/MixtureDetectiveScene.js';
import MixMatchScene from '../scenes/MixMatchScene.js';
import QuarterDetailScene from '../scenes/QuarterDetailScene.js';
import ScienceCourtScene from '../scenes/ScienceCourtScene.js';
import SupplyCartScene from '../scenes/SupplyCartScene.js';
import ScienceAdventureScene from '../scenes/ScienceAdventureScene.js';

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
  scene: [
    BootScene,
    MenuScene,
    IslandSelectScene,
    IslandMapScene,
    QuarterDetailScene,
    MixMatchScene,
    SupplyCartScene,
    MixtureDetectiveScene,
    ScienceCourtScene,
    InventMixScene,
    ScienceAdventureScene,
    AssessmentScene,
    CloudTransitionScene,
    IntroScene,
  ],
};
