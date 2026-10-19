import Phaser from 'phaser';
import { islands } from '../config/content.js';
import { GAME_WIDTH } from '../config/gameConfig.js';
import { INTRO_FADE_MS } from '../config/intro.js';
import { ISLAND_DETAIL_OUTLINES, ISLAND_OUTLINES } from '../config/worldOutlines.js';
import { playAreaMusic } from '../systems/music.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import { supplyGlyph } from '../ui/supplyCartUi.js';
import { closeOpenModal, coverImage, createPixelButton, createToggleRow, showModal, textStyle, titleStyle } from '../ui/ui.js';

// Both map assets share the same island positions at 1280 x 720.
const unlockedIslands = new Set(islands.filter((island) => island.unlocked).map((island) => island.id));
const WORLD_REGIONS = [
  { id: 'unknown', title: 'UNKNOWN ISLAND', x: 263, y: 143, width: 210, height: 135 },
  { id: 'akashic-archives', title: 'AKASHIC ARCHIVES', x: 507, y: 112, width: 184, height: 130 },
  { id: 'hibla-archipelago', title: 'HIBLA ARCHIPELAGO', x: 850, y: 110, width: 196, height: 125 },
  { id: 'hearthwork-terraces', title: 'HEARTHWORK TERRACES', x: 1094, y: 174, width: 190, height: 139 },
  { id: 'tala-crossroad', title: 'TALA CROSSROAD', x: 188, y: 302, width: 218, height: 135 },
  { id: 'grand-library', title: 'GRAND LIBRARY', x: 653, y: 305, width: 390, height: 230 },
  { id: 'vulcan-caverns', title: 'VULCAN CAVERNS', x: 200, y: 515, width: 280, height: 208 },
  { id: 'reading-island', title: 'READING ISLAND', x: 532, y: 547, width: 215, height: 170 },
  { id: 'numeric-ruins', title: 'NUMERIC RUINS', x: 859, y: 551, width: 220, height: 176 },
  { id: 'concord-grove', title: 'CONCORD GROVE', x: 1108, y: 402, width: 206, height: 186 },
].map((region) => ({
  ...region,
  unlocked: unlockedIslands.has(region.id),
  subject: {
    'vulcan-caverns': 'Science',
    'reading-island': 'English',
    'numeric-ruins': 'Mathematics',
    'hibla-archipelago': 'Filipino',
    'hearthwork-terraces': 'EPP',
    'tala-crossroad': 'Araling Panlipunan',
    'concord-grove': 'Edukasyon sa Pagpapakatao',
    'grand-library': 'Knowledge hub',
  }[region.id] ?? 'Subject to be revealed',
}));

export default class IslandSelectScene extends Phaser.Scene {
  constructor() {
    super('IslandSelectScene');
  }

  init({ cloudTransition = false, fadeFromWhite = false } = {}) {
    // Phaser retains launch data when a scene restarts without new data.
    // A stale transition flag must not disable input on an island return.
    this.cloudTransition = Boolean(cloudTransition && this.scene.isActive('CloudTransitionScene'));
    this.fadeFromWhite = Boolean(fadeFromWhite && this.registry.get('introWorldRevealRequested'));
    this.registry.set('introWorldRevealRequested', false);
  }

  create() {
    playAreaMusic(this);
    this.selectedRegion = null;
    this.highlights = new Map();

    if (this.textures.exists('pilot-world')) coverImage(this, 'pilot-world').setDepth(0);
    else coverImage(this, 'clouds-bg').setDepth(0);

    for (const region of WORLD_REGIONS) {
      this.highlights.set(region.id, this.createOutline(region));

      const zone = this.add.zone(region.x, region.y, region.width, region.height);
      zone.setDepth(3).setInteractive({ useHandCursor: true });
      zone.on('pointerover', (pointer) => {
        if (!pointer.wasTouch && !this.currentModal) this.selectRegion(region);
      });
      zone.on('pointerout', (pointer) => {
        if (!pointer.wasTouch && this.selectedRegion?.id === region.id) this.clearSelection();
      });
      zone.on('pointerup', (pointer) => {
        if (this.currentModal) return;
        const alreadySelected = this.selectedRegion?.id === region.id;
        this.selectRegion(region);
        if (region.unlocked && (!pointer.wasTouch || alreadySelected)) this.enterSelectedIsland();
      });
    }

    const settings = createPixelButton(this, 52, 48, '', () => this.openSettings(), {
      width: 56, height: 52, testId: 'world-settings',
    }).setDepth(20).setData('label', 'Settings');
    settings.add(supplyGlyph(this, 0, 0, 'gear', 0x263c49, 3));
    this.add.text(GAME_WIDTH - 24, 22, 'LUMORA', titleStyle(27, '#fff2c9'))
      .setOrigin(1, 0).setShadow(2, 2, '#172833', 4).setDepth(20);

    this.createSelectionPanel();
    if (this.cloudTransition) {
      this.input.enabled = false;
      // Launching this scene changes scene order; keep the video above it.
      this.scene.bringToTop('CloudTransitionScene');
    } else if (this.fadeFromWhite) {
      this.input.enabled = false;
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => this.finishCloudTransition());
      this.cameras.main.fadeIn(INTRO_FADE_MS, 255, 255, 255);
    } else this.finishCloudTransition();
  }

  openSettings() {
    this.clearSelection();
    showModal(this, {
      name: 'settings', title: 'SETTINGS', height: 360,
      body: (overlay, { panelX, panelY }) => [
        createToggleRow(this, panelX - 16, panelY - 32, 'MUSIC', this.registry.get('musicEnabled'), (enabled) => {
          this.registry.set('musicEnabled', enabled);
          playAreaMusic(this);
        }),
        createToggleRow(this, panelX - 16, panelY + 34, 'SFX', this.registry.get('sfxEnabled'), (enabled) => {
          this.registry.set('sfxEnabled', enabled);
        }),
      ],
      buttons: [
        { label: 'BACK', action: () => closeOpenModal(this) },
        { label: 'EXIT', action: () => {
          closeOpenModal(this);
          this.scene.start('MenuScene');
        } },
      ],
    });
  }

  finishCloudTransition() {
    this.cloudTransition = false;
    this.fadeFromWhite = false;
    this.input.enabled = true;
    markSceneReady('IslandSelectScene', {
      selectedIsland: null,
      islandPositions: this.getIslandPositions(),
      cloudTransition: 'complete',
      worldBackground: 'pilot-world',
      islandInfoTitle: null,
      islandInfoSubject: null,
      worldSettings: { x: 52, y: 48, width: 56, height: 52, icon: 'gear' },
    });
  }

  createOutline(region) {
    const points = ISLAND_OUTLINES[region.id];
    if (!points) return null;
    const outline = this.add.graphics().setDepth(2).setVisible(false);
    outline.lineStyle(5, region.unlocked ? 0xffefad : 0xe2f2ff, 0.96);
    const paths = [points, ...(ISLAND_DETAIL_OUTLINES[region.id] ?? [])];
    for (const path of paths) {
      outline.beginPath();
      outline.moveTo(path[0][0], path[0][1]);
      for (let index = 1; index < path.length; index += 1) {
        outline.lineTo(path[index][0], path[index][1]);
      }
      outline.closePath();
      outline.strokePath();
    }
    return outline;
  }

  createSelectionPanel() {
    const panel = this.add.container(GAME_WIDTH / 2, 651).setDepth(10).setVisible(false);
    const background = this.add.rectangle(0, 0, 475, 91, 0x172d3b, 0.91);
    background.setStrokeStyle(3, 0xffe6a3, 0.95);
    const title = this.add.text(0, -19, '', titleStyle(30, '#fff2c9')).setOrigin(0.5);
    const subject = this.add.text(0, 20, '', textStyle(20, '#d7e7ee')).setOrigin(0.5);
    panel.add([background, title, subject]);
    this.selectionPanel = { panel, title, subject };
  }

  selectRegion(region) {
    if (this.selectedRegion) this.highlights.get(this.selectedRegion.id)?.setVisible(false);
    this.selectedRegion = region;
    this.highlights.get(region.id)?.setVisible(true);
    this.selectionPanel.title.setText(region.title);
    this.selectionPanel.subject.setText(region.subject);
    this.selectionPanel.panel.setVisible(true);
    setTestState({
      selectedIsland: region.id,
      lockedFeedback: region.unlocked ? null : region.id,
      islandPositions: this.getIslandPositions(),
      selectedOutline: region.id,
      islandEntryAvailable: region.unlocked,
      islandInfoTitle: region.title,
      islandInfoSubject: region.subject,
    });
  }

  clearSelection() {
    if (this.selectedRegion) this.highlights.get(this.selectedRegion.id)?.setVisible(false);
    this.selectedRegion = null;
    this.selectionPanel.panel.setVisible(false);
    setTestState({ selectedIsland: null, selectedOutline: null, lockedFeedback: null,
      islandEntryAvailable: false, islandInfoTitle: null, islandInfoSubject: null });
  }

  enterSelectedIsland() {
    if (!this.selectedRegion?.unlocked) return;
    this.scene.start('IslandMapScene', { islandId: this.selectedRegion.id });
  }

  getIslandPositions() {
    return WORLD_REGIONS.map(({ id, x, y, unlocked }) => ({ id, x, y, unlocked }));
  }
}
