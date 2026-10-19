import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { GENERAL_ASSET_NAMES, generalAssetKey } from '../config/generalAssets.js';
import { MAGNET_ART_FRAMES } from '../config/magnetArtwork.js';
import { SIEVE_ART_FRAMES, SIEVE_SAND_FRAME } from '../config/sieveArtwork.js';
import { FILTER_ART_FRAMES } from '../config/filterArtwork.js';
import { EVAPORATION_ART_FRAMES, EVAPORATION_SALT_FRAME } from '../config/evaporationArtwork.js';
import { DECANT_ART_FRAMES } from '../config/decantArtwork.js';
import { COMMUNITY_SHIFT_ART_FRAMES } from '../config/communityShiftArtwork.js';
import { RECOVERY_CIRCUIT_ART_FRAMES } from '../config/recoveryCircuitArtwork.js';
import { VILLAGE_IMPACT_ART_FRAMES } from '../config/villageImpactArtwork.js';
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

    for (const name of ['energy-cup', 'empty-cup', 'trophy']) {
      this.load.image(`invent-${name}`, `/assets/ui/invent-workshop/${name}.png`);
    }
    this.load.image('horizon-bg', '/assets/backgrounds/horizon-bg.png');
    this.load.image('science-mystery-jar', '/assets/ui/science-quarter/mystery-sample/specimen-jar.png');
    this.load.image('science-kit-case', '/assets/ui/science-quarter/recovery-kit/equipment-case.png');
    this.load.image('science-revival-regions', '/assets/ui/science-quarter/workshop-revival/repair-regions.png');
    this.load.image('science-mystery-grains', '/assets/ui/science-quarter/mystery-sample/sand-grains.png');
    for (const name of ['panel-frame', 'audience', 'scales', 'magnifier']) {
      this.load.image(`court-${name}`, `/assets/ui/science-court/${name}.png`);
    }
    for (const name of ['sample-stage', 'detective-badge']) {
      this.load.image(`detective-${name}`, `/assets/ui/mixture-detective/${name}.png`);
    }
    for (const name of ['bin-blue', 'bin-green', 'conveyor', 'item-card', 'guide']) {
      this.load.image(`supply-${name}`, `/assets/ui/supply-cart/${name}.png`);
    }
    for (const name of GENERAL_ASSET_NAMES) {
      this.load.image(generalAssetKey(name), `/assets/general%20assets/${name}.png`);
    }
    for (const name of ['magnet', 'sieve', 'funnel', 'evaporating-dish', 'iron-nail', 'wood-chip', 'pebble', 'copper-piece']) {
      this.load.image(`science-${name}`, `/assets/ui/science-quarter/${name}.png`);
    }
    for (const name of ['workshop-backdrop', 'sample-tray', 'recovery-tray']) {
      this.load.image(`science-${name}`, `/assets/ui/science-quarter/magnet-workshop/${name}.png`);
    }
    for (const name of ['sieve-frame', 'grain-crate', 'stone-sack']) {
      this.load.image(`science-${name}`, `/assets/ui/science-quarter/sieve-workshop/${name}.png`);
    }
    for (const name of Object.keys(FILTER_ART_FRAMES)) {
      this.load.image(`science-${name}`, `/assets/ui/science-quarter/filter-workshop/${name}.png`);
    }
    for (const name of Object.keys(EVAPORATION_ART_FRAMES)) {
      this.load.image(`science-${name}`, `/assets/ui/science-quarter/evaporation-workshop/${name}.png`);
    }
    for (const name of Object.keys(DECANT_ART_FRAMES)) {
      this.load.image(`science-${name}`, `/assets/ui/science-quarter/decant-workshop/${name}.png`);
    }
    for (const name of Object.keys(COMMUNITY_SHIFT_ART_FRAMES)) {
      this.load.image(`science-${name}`, `/assets/ui/science-quarter/community-shift/${name}.png`);
    }
    for (const name of Object.keys(RECOVERY_CIRCUIT_ART_FRAMES)) {
      this.load.image(`science-${name}`, `/assets/ui/science-quarter/recovery-circuit/${name}.png`);
    }
    for (const name of Object.keys(VILLAGE_IMPACT_ART_FRAMES)) {
      this.load.image(`science-${name}`, `/assets/ui/science-quarter/village-impact/${name}.png`);
    }
    this.load.image('clouds-bg', '/assets/backgrounds/clouds-bg.png');
    this.load.image('vulcan-caverns', '/assets/islands/vulcan-caverns.png');
    this.load.image('numeric-ruins', '/assets/islands/numeric-ruins.png');
    this.load.image('reading-island', '/assets/islands/reading-island.png');
    this.load.image('vulcan-caverns-map', '/assets/island-maps/vulcan-caverns-map.png');
    this.load.image('reading-island-map', '/assets/island-maps/reading-island-map.png');
    this.load.image('numeric-ruins-map', '/assets/island-maps/numeric-ruins-map.png');
    this.load.image('lumora-world', '/assets/world/lumora-world.png');
    this.load.image('pilot-world', '/assets/world/3-pilot-world-map.png');
    this.load.image('world-map-cloudy', '/assets/world/world-map-cloudy.png');
    this.load.image('intro-library-background', '/assets/video/cutscene-1-library.png');
    this.load.video('intro-cutscene-1', '/assets/video/cutscene-1-browser.mp4');
    for (const pose of ['default', 'talk', 'sad']) {
      this.load.image(`quill-${pose}`, `/assets/characters/quill/quill-${pose}.png`);
    }
    this.load.image('cloud-zoom-poster', '/assets/video/cloud-zoom-poster.png');
    this.load.video('cloud-zoom', '/assets/video/cloud-zoom.webm', true);
    for (let index = 1; index <= 5; index += 1) {
      this.load.image(`world-border-cloud-${index}`, `/assets/clouds/border/cloud${index}.png`);
    }
    for (let index = 1; index <= 6; index += 1) {
      this.load.image(`world-cloud-patch-${index}`, `/assets/clouds/patches/cloudpatch-${index}.png`);
    }
    const backdrops = {
      'mix-match-backdrop': 'mix_match_backdrop.png',
      'supply-station-backdrop': 'supply_station_backdrop.png',
      'detective-desk-backdrop': 'detective_desk_backdrop.png',
      'science-court-backdrop': 'science_court_backdrop.png',
      'invent-workshop-backdrop': 'invent_workshop_backdrop.png',
      'assessment-backdrop': 'formative-summative-backdrop.png',
    };
    Object.entries(backdrops).forEach(([key, file]) => {
      this.load.image(key, `/assets/backdrops/${file}`);
    });
    for (const area of ['world_map', 'vulcan_caverns', 'numeric_ruins', 'reading_island']) {
      this.load.audio(`bgm-${area}`, `/assets/audio/bgm_${area}.mp3`);
    }
  }

  create() {
    const revivalTexture = this.textures.get('science-revival-regions');
    const atlas = revivalTexture.getSourceImage(), cellWidth = atlas.width / 3, cellHeight = atlas.height / 2;
    // Each region uses the same crop for its broken and restored art; no stretched illustration.
    for (let row = 0; row < 2; row++) for (let i = 0; i < 3; i++) {
      revivalTexture.add(`${row ? 'restored' : 'broken'}-${i}`, 0, i * cellWidth, row * cellHeight + cellHeight * 0.22, cellWidth, cellHeight * 0.71);
    }
    for (const [name, bounds] of Object.entries({ ...MAGNET_ART_FRAMES, ...SIEVE_ART_FRAMES, ...FILTER_ART_FRAMES, ...EVAPORATION_ART_FRAMES, ...DECANT_ART_FRAMES, ...COMMUNITY_SHIFT_ART_FRAMES, ...RECOVERY_CIRCUIT_ART_FRAMES, ...VILLAGE_IMPACT_ART_FRAMES })) {
      this.textures.get(`science-${name}`).add('trimmed', 0, ...bounds);
    }
    this.textures.get('general-sand-mound').add('sieve-trimmed', 0, ...SIEVE_SAND_FRAME);
    this.textures.get('general-salt').add('evaporation-trimmed', 0, ...EVAPORATION_SALT_FRAME);
    this.registry.set('musicEnabled', true);
    this.registry.set('sfxEnabled', true);
    markSceneReady('BootScene');
    this.scene.start('MenuScene');
  }
}
