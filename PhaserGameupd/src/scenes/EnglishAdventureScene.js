import Phaser from 'phaser';
import { ENGLISH_AUDIO_CLIPS, englishWordAudioKey, getEnglishGame } from '../config/englishWeekOne.js';
import { englishAction, englishAccuracy, initialEnglishState } from '../games/english/englishLogic.js';
import { readEnglishDraft, persistEnglishDraft, persistEnglishResult } from '../systems/englishProgress.js';
import { playAreaMusic } from '../systems/music.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import { EnglishGameView } from '../ui/englishGameView.js';
import { coverImage } from '../ui/ui.js';

export default class EnglishAdventureScene extends Phaser.Scene {
  constructor() { super('EnglishAdventureScene'); }

  init(data = {}) {
    this.gameDefinition = getEnglishGame(data.lessonId) ?? getEnglishGame('reading-island-q1-week-1-day-1');
    this.lessonId = this.gameDefinition.lessonId;
    this.islandId = 'reading-island'; this.quarterId = 'q1'; this.majorId = 'reading-island-q1-week-1';
    this.returnScrollY = Number.isFinite(data.returnScrollY) ? data.returnScrollY : 0;
    this.modal = null; this.activeAudio = null; this.audioStatus = 'ready';
    this.savedResult = false; this.storageAvailable = true;
  }

  preload() {
    const game = this.gameDefinition;
    const artKey = `english-${game.backdrop}`;
    if (!this.textures.exists(artKey)) this.load.image(artKey, `/assets/english-week1/${game.backdrop}.png`);
    if (!this.textures.exists('english-word-lantern')) this.load.image('english-word-lantern', '/assets/english-week1/word-lantern.png');
    const keys = new Set(game.rounds.flatMap(round => [
      `english-${round.id}`, ...round.words.map(word => englishWordAudioKey(word.word)),
      ...(round.pool ?? []).map(englishWordAudioKey), ...(round.repair?.choices ?? []).map(englishWordAudioKey),
      ...(round.soundOptions ?? []).map(sound => `english-sound-${sound}`),
      ...(round.contrast ? [`english-contrast-${round.contrast}`] : []),
    ]));
    for (const clip of ENGLISH_AUDIO_CLIPS.filter(clip => keys.has(clip.key))) {
      if (!this.cache.audio.exists(clip.key)) this.load.audio(clip.key, `/assets/english-week1/audio/${clip.key}.wav`);
    }
  }

  create() {
    this.state = initialEnglishState(this.gameDefinition, this.gameDefinition.kind === 'festival' ? readEnglishDraft() : null);
    this.currentModal = null;
    this.input.enabled = true;
    if (this.registry.get('englishNarrationEnabled') === undefined) this.registry.set('englishNarrationEnabled', true);
    this.background = coverImage(this, `english-${this.gameDefinition.backdrop}`);
    playAreaMusic(this, this.islandId);
    this.view = new EnglishGameView(this);
    this.view.render();
    this.keyHandler = event => {
      if (event.key === 'Escape' && !this.modal && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) this.view.openPause();
    };
    this.input.keyboard.on('keydown', this.keyHandler);
    // The editor uses native inputs. Global Phaser key capture must not swallow
    // spaces, arrows or backspace while the learner writes or selects a span.
    this.previousCapture = this.input.keyboard.manager.preventDefault;
    this.input.keyboard.disableGlobalCapture();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.stopNarration(); this.view?.destroy();
      this.input.keyboard.off('keydown', this.keyHandler);
      if (this.previousCapture) this.input.keyboard.enableGlobalCapture();
      this.currentModal = null;
    });
    markSceneReady('EnglishAdventureScene', this.buildTestState());
  }

  perform(type, value, { render = true } = {}) {
    if (this.modal) return;
    const oldPhase = this.state.phase;
    this.state = englishAction(this.gameDefinition, this.state, { type, value });
    if (type.startsWith('poem-') || ['annotate', 'remove-annotation', 'submit-poem', 'edit-poem', 'resume-poem'].includes(type) || oldPhase !== this.state.phase && this.state.phase === 'editor') {
      this.storageAvailable = this.saveDraft();
    }
    if (type === 'continue' || this.state.phase === 'editor') this.stopNarration();
    if (this.state.phase === 'result' && !this.savedResult) {
      this.storageAvailable = persistEnglishResult(this.gameDefinition, this.state) && this.storageAvailable;
      this.savedResult = true;
    }
    if (type === 'edit-poem') this.savedResult = false;
    if (oldPhase !== this.state.phase && this.state.phase === 'round-complete' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.tweens.add({ targets: this.background, alpha: { from: 0.8, to: 1 }, duration: 450 });
    }
    if (render) this.view.render();
    this.updateTestState();
  }

  playNarration(key) {
    if (this.modal) return;
    if (!this.registry.get('englishNarrationEnabled')) {
      this.audioStatus = 'Narration is off in Settings.';
      this.view.updateAudioStatus(); this.updateTestState(); return;
    }
    if (!this.cache.audio.exists(key)) {
      this.audioStatus = 'Recording unavailable. Use the text and sound hints.';
      this.view.updateAudioStatus(); this.updateTestState(); return;
    }
    this.stopNarration();
    this.audioKey = key;
    this.activeAudio = this.sound.add(key, { volume: 0.95 });
    this.audioStatus = 'playing';
    this.activeAudio.once('complete', () => { this.audioStatus = 'ready'; this.view?.updateAudioStatus(); this.updateTestState(); });
    this.activeAudio.play();
    this.view.updateAudioStatus(); this.updateTestState();
  }

  stopNarration() {
    this.activeAudio?.stop(); this.activeAudio?.destroy(); this.activeAudio = null;
    this.audioStatus = 'ready';
  }

  pauseNarration() {
    this.audioWasPlaying = Boolean(this.activeAudio?.isPlaying);
    if (this.audioWasPlaying) { this.activeAudio.pause(); this.audioStatus = 'paused'; }
  }

  resumeNarration() {
    if (this.audioWasPlaying && this.activeAudio?.isPaused && this.registry.get('englishNarrationEnabled')) {
      this.activeAudio.resume(); this.audioStatus = 'playing';
    }
    this.audioWasPlaying = false;
    this.view.updateAudioStatus(); this.updateTestState();
  }

  returnToQuarter() {
    if (this.gameDefinition.kind === 'festival') this.saveDraft();
    this.scene.start('QuarterDetailScene', { islandId: this.islandId, quarterId: this.quarterId, scrollY: this.returnScrollY });
  }

  restartGame() {
    this.scene.restart({ lessonId: this.lessonId, returnScrollY: this.returnScrollY });
  }

  saveDraft() {
    return persistEnglishDraft({ ...this.state.draft, analysisRecords: this.state.records,
      analysisSupport: { assistance: this.state.assistance, hintCount: this.state.hintCount, solutionCount: this.state.solutionCount } });
  }

  buildTestState() {
    const round = this.gameDefinition.rounds[this.state.round];
    return {
      selectedIsland: this.islandId, selectedQuarter: this.quarterId, selectedMajor: this.majorId,
      selectedLesson: this.lessonId, minigameId: this.gameDefinition.id,
      openModal: this.modal?.dataset.modal ?? null, minigameHelpOpen: this.modal?.dataset.modal === 'english-help',
      paused: Boolean(this.modal), score: englishAccuracy(this.state).percent,
      gameResult: this.state.phase === 'result' ? this.gameDefinition.kind === 'festival' ? 'submitted-review-pending' : 'completed' : null,
      english: {
        day: this.gameDefinition.day, kind: this.gameDefinition.kind, phase: this.state.phase,
        round: this.state.round, roundId: round.id, roundCount: this.gameDefinition.rounds.length,
        selected: this.state.selected, positions: this.state.positions, mappings: this.state.mappings,
        slots: this.state.slots, sound: this.state.sound, reason: this.state.reason,
        repair: this.state.repair, feedback: this.state.feedback, feedbackKind: this.state.feedbackKind,
        accuracy: englishAccuracy(this.state), records: this.state.records, hintCount: this.state.hintCount,
        audioStatus: this.audioStatus, audioKey: this.audioKey ?? null,
        audioTime: this.activeAudio?.seek ?? 0, storageAvailable: this.storageAvailable,
        draft: this.state.draft, assistance: this.state.assistance,
      },
    };
  }
  updateTestState() { if (this.state) setTestState(this.buildTestState()); }
  update() { this.view?.syncBounds(); }
}
