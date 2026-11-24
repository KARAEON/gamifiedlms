import Phaser from 'phaser';
import { INTRO_FADE_MS, INTRO_FLOW } from '../config/intro.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import CutsceneSequence from '../systems/CutsceneSequence.js';
import { playAreaMusic, stopAreaMusic } from '../systems/music.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import DialogueSequence from '../ui/DialogueSequence.js';
import { coverImage, titleStyle } from '../ui/ui.js';
import { DEFAULT_ISLAND_ID, islands } from '../config/content.js';
import { drawFloatingSky, isIslandUnlocked } from '../config/islandVisuals.js';
import { createIslandArt, createWorldClouds, layoutIslandCarousel } from '../ui/floatingIslandArt.js';

export default class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
  }

  create() {
    // Start requests are consumed once. Ordinary island returns never set one.
    if (!this.registry.get('introRequested')) {
      this.scene.start('IslandSelectScene', { cloudTransition: false, fadeFromWhite: false });
      return;
    }
    this.registry.set('introRequested', false);
    this.registry.set('introInProgress', true);
    this.stepIndex = -1;
    this.input.enabled = true;
    this.cinematic = null;
    this.dialogue = null;
    this.worldViews = null;
    this.worldCarousel = null;
    this.worldIndex = islands.findIndex(island => island.id === DEFAULT_ISLAND_ID);
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.stage = null;
    this.cameras.main.setBackgroundColor('#000000');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cinematic?.destroy();
      this.dialogue?.destroy();
      this.registry.set('introInProgress', false);
    });
    this.nextStep();
  }

  nextStep() {
    this.stepIndex += 1;
    const step = INTRO_FLOW[this.stepIndex];
    if (step.fadeFromPrevious) {
      this.input.enabled = false;
      setTestState({ ready: false, introStatus: 'fading' });
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.showStep(step, true));
      this.cameras.main.fadeOut(INTRO_FADE_MS, 255, 255, 255);
    } else this.showStep(step, false);
  }

  showStep(step, fromWhite) {
    this.cinematic?.destroy();
    this.cinematic = null;
    this.dialogue?.destroy();
    this.dialogue = null;
    this.stage?.destroy(true);
    this.stage = this.add.container();
    this.worldViews = null;
    this.worldCarousel = null;

    if (step.type === 'world') {
      this.registry.set('introCompleted', true);
      this.registry.set('introWorldRevealRequested', true);
      this.registry.set('carouselIsland', DEFAULT_ISLAND_ID);
      this.scene.start('IslandSelectScene', {
        cloudTransition: false, fadeFromWhite: true, islandId: DEFAULT_ISLAND_ID,
      });
      return;
    }

    if (step.type === 'cutscene') {
      stopAreaMusic(this);
      this.input.enabled = !fromWhite;
      markSceneReady('IntroScene', { introPhase: step.id, introStatus: 'loading' });
      this.cinematic = new CutsceneSequence(this, step.clips, {
        // A failed/missing clip can finish inside the constructor.
        onComplete: () => this.time.delayedCall(0, () => this.nextStep()),
        onStatus: (introStatus) => {
          if (introStatus !== 'playing') setTestState({ introStatus });
        },
        onReady: () => {
          const ready = () => {
            this.input.enabled = true;
            markSceneReady('IntroScene', { introPhase: step.id, introStatus: 'playing' });
          };
          if (fromWhite) {
            // Keep white covering the scene until the first video frame exists.
            setTestState({ ready: false, introStatus: 'fading' });
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, ready);
            this.cameras.main.fadeIn(INTRO_FADE_MS, 255, 255, 255);
          } else ready();
        },
      });
      return;
    }

    playAreaMusic(this);
    const background = this.textures.exists(step.background) ? step.background : 'lumora-world';
    if (background === 'floating-sky') {
      this.stage.add(drawFloatingSky(this));
      this.stage.add(createWorldClouds(this, { animate: !this.reducedMotion }));
      this.worldCarousel = this.add.container();
      this.worldViews = islands.map(island => createIslandArt(this, island));
      this.worldCarousel.add(this.worldViews);
      this.stage.add(this.worldCarousel);
      this.layoutWorld();
    } else this.stage.add(coverImage(this, background));

    // Krae is present as soon as the islands fade in; there is no viewing pause.
    this.stage.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.12).setOrigin(0));
    this.stage.add(this.add.text(32, 26, step.location, titleStyle(30, '#fff2c9', 'left'))
      .setShadow(3, 3, '#172833', 2));
    this.dialogue = new DialogueSequence(this, this.stage, step, () => this.nextStep());
    const worldState = {
      worldBackground: background,
      selectedIsland: this.worldViews ? DEFAULT_ISLAND_ID : null,
      islandPositions: this.worldViews ? this.worldViews.map((view, index) => ({
        id: islands[index].id, x: view.x, y: view.y, scale: view.scaleX,
        visible: view.visible, unlocked: isIslandUnlocked(this, islands[index]),
      })) : [],
    };
    const ready = () => {
      this.input.enabled = true;
      markSceneReady('IntroScene', { introPhase: step.id, introStatus: 'dialogue', ...worldState });
      this.dialogue.showLine();
    };
    if (fromWhite) {
      this.input.enabled = false;
      setTestState({ ready: false, introPhase: step.id, introStatus: 'fading', ...worldState });
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, ready);
      this.cameras.main.fadeIn(INTRO_FADE_MS, 255, 255, 255);
    } else ready();
  }

  layoutWorld(time = 0) {
    if (!this.worldViews) return;
    layoutIslandCarousel(this, this.worldViews, this.worldIndex, { time, reducedMotion: this.reducedMotion });
    this.worldCarousel.sort('depth');
  }

  update(time) { this.layoutWorld(time); }
}
