import Phaser from 'phaser';
import { DEFAULT_ISLAND_ID, islands } from '../config/content.js';
import { INTRO_FADE_MS } from '../config/intro.js';
import { drawFloatingSky, ISLAND_STATES, ISLAND_VISUALS, isIslandUnlocked } from '../config/islandVisuals.js';
import { playAreaMusic } from '../systems/music.js';
import { markSceneReady, setTestCommand, setTestState } from '../systems/testSeam.js';
import { createIslandArt, createWorldClouds, layoutIslandCarousel } from '../ui/floatingIslandArt.js';
import { supplyGlyph } from '../ui/supplyCartUi.js';
import { closeOpenModal, createPixelButton, createToggleRow, showModal, textStyle, titleStyle } from '../ui/ui.js';

const wrapIndex = value => Phaser.Math.Wrap(value, 0, islands.length);
const relativeIndex = (index, cursor) => Phaser.Math.Wrap(index - cursor + islands.length / 2, 0, islands.length) - islands.length / 2;

export default class IslandSelectScene extends Phaser.Scene {
  constructor() { super('IslandSelectScene'); }

  init({ cloudTransition = false, fadeFromWhite = false, fromLibrary = false, islandId } = {}) {
    this.cloudTransition = Boolean(cloudTransition && this.scene.isActive('CloudTransitionScene'));
    this.fadeFromWhite = Boolean(fadeFromWhite && this.registry.get('introWorldRevealRequested'));
    this.registry.set('introWorldRevealRequested', false);
    const remembered = islandId ?? this.registry.get('carouselIsland') ?? DEFAULT_ISLAND_ID;
    this.selectedIndex = Math.max(0, islands.findIndex(island => island.id === remembered));
    this.cursor = this.selectedIndex;
    this.isMoving = false;
    this.dragStart = null;
    this.suppressClick = false;
    this.currentModal = null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.fromLibrary = fromLibrary;
  }

  create() {
    playAreaMusic(this);
    drawFloatingSky(this).setDepth(0);
    createWorldClouds(this, { animate: !this.reducedMotion, depth: 4 });
    this.add.text(640, 42, 'ISLANDS OF LUMORA', titleStyle(38)).setOrigin(0.5, 0)
      .setShadow(3, 4, '#394c4e', 2).setDepth(20);
    this.add.text(640, 99, 'A world of knowledge awaits', textStyle(20, '#eaf0d8')).setOrigin(0.5).setDepth(20);

    this.islandViews = islands.map((island, index) => {
      const view = createIslandArt(this, island);
      const zone = this.add.zone(0, 0, 445, 390).setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        if (this.currentModal || this.isMoving || this.suppressClick) return;
        if (index === this.selectedIndex) this.enterSelectedIsland();
        else this.moveCarousel(relativeIndex(index, this.selectedIndex));
      });
      view.add(zone);
      return view;
    });

    this.createSelectionPanel();
    this.createNavigation();
    const settings = createPixelButton(this, 52, 48, '', () => this.openSettings(), {
      width: 56, height: 52, testId: 'world-settings',
    }).setDepth(30).setData('label', 'Settings');
    settings.add(supplyGlyph(this, 0, 0, 'gear', 0x263c49, 3));
    this.input.keyboard.on('keydown-LEFT', () => this.moveCarousel(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.moveCarousel(1));
    this.input.keyboard.on('keydown-ENTER', () => this.enterSelectedIsland());
    this.input.keyboard.on('keydown-SPACE', () => this.enterSelectedIsland());
    this.input.keyboard.on('keydown-ESC', () => { if (this.currentModal) closeOpenModal(this); });
    this.input.on('pointerdown', pointer => {
      if (this.currentModal || this.isMoving || pointer.y < 145 || pointer.y > 560) return;
      this.dragStart = { x: pointer.x, y: pointer.y };
      this.suppressClick = false;
    });
    this.input.on('pointermove', pointer => {
      if (!pointer.isDown || !this.dragStart || this.isMoving) return;
      const distance = pointer.x - this.dragStart.x;
      if (Math.abs(distance) > 25) {
        this.suppressClick = true;
        this.cursor = this.selectedIndex - Phaser.Math.Clamp(distance / 355, -0.9, 0.9);
        this.layoutIslands();
      }
    });
    const finishDrag = pointer => {
      if (!this.dragStart) return;
      const distance = pointer.x - this.dragStart.x;
      const horizontal = Math.abs(distance) > Math.abs(pointer.y - this.dragStart.y);
      this.dragStart = null;
      if (this.suppressClick) {
        this.moveCarousel(horizontal && Math.abs(distance) > 60 ? (distance < 0 ? 1 : -1) : 0);
        this.time.delayedCall(0, () => { this.suppressClick = false; });
      }
    };
    this.input.on('pointerup', finishDrag);
    this.input.on('pointerupoutside', finishDrag);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const key of ['LEFT', 'RIGHT', 'ENTER', 'SPACE', 'ESC']) this.input.keyboard.removeAllListeners('keydown-' + key);
    });

    this.layoutIslands();
    this.refreshSelection();
    if (this.cloudTransition) {
      this.input.enabled = false;
      this.scene.bringToTop('CloudTransitionScene');
    } else if (this.fadeFromWhite) {
      this.input.enabled = false;
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => this.finishCloudTransition());
      this.cameras.main.fadeIn(INTRO_FADE_MS, 255, 255, 255);
    } else {
      if (this.fromLibrary && !this.reducedMotion) this.cameras.main.fadeIn(180, 17, 17, 17);
      this.finishCloudTransition();
    }
  }

  registerTestCommands() {
    setTestCommand('selectCarouselIsland', id => {
      const index = islands.findIndex(island => island.id === id);
      if (index >= 0) this.moveCarousel(relativeIndex(index, this.selectedIndex));
    });
    setTestCommand('setIslandUnlocked', (id, unlocked) => {
      if (!islands.some(island => island.id === id)) return;
      this.registry.set('islandUnlocks', { ...this.registry.get('islandUnlocks'), [id]: Boolean(unlocked) });
      this.islandViews.forEach((view, index) => view.setIslandState(isIslandUnlocked(this, islands[index])));
      this.refreshSelection();
    });

  }

  layoutIslands(time = 0) {
    layoutIslandCarousel(this, this.islandViews, this.cursor, {
      time, reducedMotion: this.reducedMotion, isMoving: this.isMoving,
    });
  }

  update(time) { if (this.islandViews) this.layoutIslands(time); }

  moveCarousel(steps) {
    if (!this.input.enabled || this.currentModal || this.isMoving) return;
    this.isMoving = true;
    const target = this.selectedIndex + steps;
    setTestState({ carouselMoving: true });
    this.tweens.add({
      targets: this, cursor: target, duration: this.reducedMotion ? 0 : 460, ease: 'Cubic.Out',
      onComplete: () => {
        this.selectedIndex = wrapIndex(target);
        this.cursor = this.selectedIndex;
        this.isMoving = false;
        this.registry.set('carouselIsland', islands[this.selectedIndex].id);
        this.refreshSelection();
      },
    });
  }

  createSelectionPanel() {
    this.selectionPanel = this.add.container(640, 578).setDepth(20);
    const back = this.add.graphics();
    back.fillStyle(0x3b4d4b, 0.94).fillRoundedRect(-255, -46, 510, 92, 6);
    back.lineStyle(3, 0xffe2ab).strokeRoundedRect(-255, -46, 510, 92, 6);
    this.islandTitle = this.add.text(0, -37, '', titleStyle(30)).setOrigin(0.5, 0);
    this.islandSubject = this.add.text(0, 26, '', textStyle(21, '#eef0d5')).setOrigin(0.5);
    const hit = this.add.zone(0, 0, 510, 92).setInteractive({ useHandCursor: true });
    hit.on('pointerup', () => this.enterSelectedIsland());
    this.selectionPanel.add([back, this.islandTitle, this.islandSubject, hit]);
    this.entryLabel = this.add.text(640, 650, '', {
      ...textStyle(20, '#fff2c9'), backgroundColor: '#3b4d4b', padding: { x: 12, y: 4 },
    }).setOrigin(0.5).setDepth(20);
  }

  createNavigation() {
    const arrow = (x, direction) => {
      const button = createPixelButton(this, x, 578, '', () => this.moveCarousel(direction), { width: 66, height: 66 });
      const glyph = this.add.graphics().fillStyle(0x34494b);
      glyph.fillTriangle(direction * 15, 0, -direction * 7, -13, -direction * 7, 13);
      button.add(glyph).setDepth(25);
    };
    arrow(294, -1); arrow(986, 1);
    this.dots = islands.map((island, index) => {
      const x = 640 + (index - (islands.length - 1) / 2) * 27;
      const dot = this.add.rectangle(x, 688, 9, 9, 0xf4e5bc).setDepth(20);
      const hit = this.add.zone(x, 688, 26, 30).setDepth(21).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => this.moveCarousel(relativeIndex(index, this.selectedIndex)));
      return dot;
    });
    this.add.text(40, 686, 'DRAG OR USE ARROW KEYS', textStyle(16, '#edf0d8', 'left')).setDepth(20);
  }

  refreshSelection() {
    const island = islands[this.selectedIndex];
    const unlocked = isIslandUnlocked(this, island);
    this.islandTitle.setText(island.title).setFontSize(38);
    if (this.islandTitle.width > 475) this.islandTitle.setFontSize(Math.floor(38 * 475 / this.islandTitle.width));
    this.islandSubject.setText(ISLAND_VISUALS[island.id].subject);
    this.entryLabel.setText(ISLAND_STATES[unlocked ? 'normal' : 'locked'].label);
    this.dots.forEach((dot, index) => dot.setAlpha(index === this.selectedIndex ? 1 : 0.35).setScale(index === this.selectedIndex ? 1.4 : 1));
    this.syncState();
  }

  syncState() {
    const island = islands[this.selectedIndex];
    setTestState({
      selectedIsland: island.id, selectedOutline: null,
      lockedFeedback: isIslandUnlocked(this, island) ? null : island.id,
      islandEntryAvailable: isIslandUnlocked(this, island),
      islandInfoTitle: island.title, islandInfoSubject: ISLAND_VISUALS[island.id].subject,
      islandPositions: this.getIslandPositions(), carouselMoving: this.isMoving, carouselIndex: this.selectedIndex,
    });
  }

  getIslandPositions() {
    return islands.map((island, index) => {
      const view = this.islandViews[index];
      return { id: island.id, x: view.x, y: view.y, scale: view.scaleX, visible: view.visible,
        unlocked: isIslandUnlocked(this, island), state: view.getData('state'),
        normalAsset: island.assetKey, lockedTint: ISLAND_STATES.locked.tint };
    });
  }

  finishCloudTransition() {
    this.cloudTransition = false; this.fadeFromWhite = false; this.input.enabled = true;
    markSceneReady('IslandSelectScene', {
      cloudTransition: 'complete', worldBackground: 'floating-sky',
      worldSettings: { x: 52, y: 48, width: 56, height: 52, icon: 'gear' },
    });
    this.syncState();
    this.registerTestCommands();
  }

  enterSelectedIsland() {
    if (!this.input.enabled || this.isMoving || this.currentModal) return;
    const island = islands[this.selectedIndex];
    if (!isIslandUnlocked(this, island)) {
      this.entryLabel.setText('THIS ISLAND IS STILL HIDDEN IN THE MIST');
      setTestState({ lockedFeedback: island.id });
      return;
    }
    this.registry.set('carouselIsland', island.id);
    const enter = () => this.scene.start('IslandMapScene', { islandId: island.id });
    if (island.id === 'grand-library' && !this.reducedMotion) {
      this.input.enabled = false;
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, enter);
      this.cameras.main.fadeOut(160, 17, 17, 17);
    } else enter();
  }

  openSettings() {
    if (this.isMoving) return;
    this.dragStart = null;
    showModal(this, {
      name: 'settings', title: 'SETTINGS', height: 360,
      body: (overlay, { panelX, panelY }) => [
        createToggleRow(this, panelX - 16, panelY - 32, 'MUSIC', this.registry.get('musicEnabled'), enabled => {
          this.registry.set('musicEnabled', enabled); playAreaMusic(this);
        }),
        createToggleRow(this, panelX - 16, panelY + 34, 'SFX', this.registry.get('sfxEnabled'), enabled => this.registry.set('sfxEnabled', enabled)),
      ],
      buttons: [
        { label: 'BACK', action: () => closeOpenModal(this) },
        { label: 'EXIT', action: () => { closeOpenModal(this); this.scene.start('MenuScene'); } },
      ],
    });
  }
}
