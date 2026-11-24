import Phaser from 'phaser';
import { getMathGame } from '../config/mathWeekOne.js';
import { initialMathState, mathAction, mathAccuracy } from '../games/math/mathLogic.js';
import { persistMathResult } from '../systems/mathProgress.js';
import { playAreaMusic } from '../systems/music.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import { MathGameView } from '../ui/mathGameView.js';
import { coverImage } from '../ui/ui.js';

export default class MathAdventureScene extends Phaser.Scene {
  constructor() { super('MathAdventureScene'); }
  init(data = {}) {
    this.gameDefinition = getMathGame(data.lessonId) ?? getMathGame('numeric-ruins-q1-week-1-day-1');
    this.lessonId = this.gameDefinition.lessonId; this.islandId = 'numeric-ruins'; this.quarterId = 'q1'; this.majorId = 'numeric-ruins-q1-week-1';
    this.returnScrollY = Number.isFinite(data.returnScrollY) ? data.returnScrollY : 0;
    this.modal = null; this.currentModal = null; this.savedResult = false; this.storageAvailable = true;
  }
  preload() {
    const { backdrop } = this.gameDefinition;
    if (!this.textures.exists(`math-${backdrop}`)) this.load.image(`math-${backdrop}`, `/assets/math-week1/${backdrop}.png`);
  }
  create() {
    this.state = initialMathState(this.gameDefinition);
    this.background = coverImage(this, `math-${this.gameDefinition.backdrop}`);
    playAreaMusic(this, this.islandId);
    this.view = new MathGameView(this); this.view.render();
    this.keyHandler = event => {
      if (event.key === 'Escape' && !this.modal && !['INPUT', 'SELECT'].includes(document.activeElement?.tagName)) this.view.openPause();
    };
    this.input.keyboard.on('keydown', this.keyHandler);
    this.previousCapture = this.input.keyboard.manager.preventDefault;
    this.input.keyboard.disableGlobalCapture();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.view?.destroy(); this.input.keyboard.off('keydown', this.keyHandler);
      if (this.previousCapture) this.input.keyboard.enableGlobalCapture();
      this.currentModal = null;
    });
    markSceneReady('MathAdventureScene', this.buildTestState());
  }
  perform(type, value, { render = true } = {}) {
    if (this.modal) return;
    this.state = mathAction(this.gameDefinition, this.state, { type, value });
    if (this.state.phase === 'result' && !this.savedResult) { this.storageAvailable = persistMathResult(this.gameDefinition, this.state); this.savedResult = true; }
    if (render) this.view.render(type);
    this.updateTestState();
  }
  // Shared native-dialog lifecycle pauses visual motion too.
  pauseNarration() { this.tweens.pauseAll(); this.view.root.classList.add('math-paused'); }
  resumeNarration() { this.tweens.resumeAll(); this.view.root.classList.remove('math-paused'); }
  returnToQuarter() { this.scene.start('QuarterDetailScene', { islandId: this.islandId, quarterId: this.quarterId, scrollY: this.returnScrollY }); }
  restartGame() { this.scene.restart({ lessonId: this.lessonId, returnScrollY: this.returnScrollY }); }
  buildTestState() {
    return {
      selectedIsland: this.islandId, selectedQuarter: this.quarterId, selectedMajor: this.majorId, selectedLesson: this.lessonId, minigameId: this.gameDefinition.id,
      openModal: this.modal?.dataset.modal ?? null, minigameHelpOpen: this.modal?.dataset.modal === 'math-help', paused: Boolean(this.modal),
      gameResult: this.state.phase === 'result' ? 'completed' : null, score: mathAccuracy(this.state).percent,
      math: { day: this.gameDefinition.day, kind: this.gameDefinition.kind, phase: this.state.phase, round: this.state.round, roundId: this.gameDefinition.rounds[this.state.round].id,
        board: this.state.board, feedback: this.state.feedback, notice: this.state.notice, records: this.state.records, accuracy: mathAccuracy(this.state),
        hintCount: this.state.hintCount, solutionCount: this.state.solutionCount, assistance: this.state.assistance, storageAvailable: this.storageAvailable },
    };
  }
  updateTestState() { setTestState(this.buildTestState()); }
  update() { this.view?.syncBounds(); }
}
