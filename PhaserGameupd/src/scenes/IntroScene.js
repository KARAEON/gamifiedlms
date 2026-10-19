import Phaser from 'phaser';
import { INTRO_FADE_MS, INTRO_FLOW } from '../config/intro.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import CutsceneSequence from '../systems/CutsceneSequence.js';
import { playAreaMusic, stopAreaMusic } from '../systems/music.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import DialogueSequence from '../ui/DialogueSequence.js';
import { coverImage, titleStyle } from '../ui/ui.js';

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
    this.revealTimer = null;
    this.stage = null;
    this.cameras.main.setBackgroundColor('#000000');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cinematic?.destroy();
      this.dialogue?.destroy();
      this.revealTimer?.remove(false);
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
    this.revealTimer?.remove(false);
    this.revealTimer = null;
    this.cinematic?.destroy();
    this.cinematic = null;
    this.dialogue?.destroy();
    this.dialogue = null;
    this.stage?.destroy(true);
    this.stage = this.add.container();

    if (step.type === 'world') {
      this.registry.set('introCompleted', true);
      this.registry.set('introWorldRevealRequested', true);
      this.scene.start('IslandSelectScene', { cloudTransition: false, fadeFromWhite: true });
      return;
    }

    if (step.type === 'cutscene') {
      stopAreaMusic(this);
      markSceneReady('IntroScene', { introPhase: step.id, introStatus: 'loading' });
      this.cinematic = new CutsceneSequence(this, step.clips, {
        onComplete: () => this.nextStep(),
        onStatus: (introStatus) => setTestState({ introStatus }),
      });
      return;
    }

    playAreaMusic(this);
    const background = this.textures.exists(step.background) ? step.background : 'lumora-world';
    this.stage.add(coverImage(this, background));
    const startDialogue = () => {
      this.revealTimer = null;
      this.stage.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.12).setOrigin(0));
      this.stage.add(this.add.text(32, 26, step.location, titleStyle(30, '#fff2c9', 'left'))
        .setShadow(3, 3, '#172833', 2));
      this.dialogue = new DialogueSequence(this, this.stage, step, () => this.nextStep());
      this.input.enabled = true;
      markSceneReady('IntroScene', { introPhase: step.id, introStatus: 'dialogue', worldBackground: background });
      this.dialogue.showLine();
    };
    const ready = () => {
      if (!step.revealDurationMs) return startDialogue();
      // Begin the full, unobstructed viewing time only once the fade has cleared.
      this.input.enabled = false;
      markSceneReady('IntroScene', { introPhase: step.id, introStatus: 'world-reveal', worldBackground: background });
      this.revealTimer = this.time.delayedCall(step.revealDurationMs, startDialogue);
    };
    if (fromWhite) {
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, ready);
      this.cameras.main.fadeIn(INTRO_FADE_MS, 255, 255, 255);
    } else ready();
  }
}
