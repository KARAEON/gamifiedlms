import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { createPixelButton } from '../ui/ui.js';

// A linear list of clips with one completion callback. Skip affects cinema only.
export default class CutsceneSequence {
  constructor(scene, clips, { onComplete, onReady = () => {}, onStatus = () => {} }) {
    this.scene = scene;
    this.clips = clips;
    this.onComplete = onComplete;
    this.onReady = onReady;
    this.onStatus = onStatus;
    this.index = 0;
    this.finished = false;
    this.skip = createPixelButton(scene, GAME_WIDTH - 100, 48, 'SKIP', () => {
      if (scene.input.enabled) this.complete();
    }, {
      width: 132, height: 44, fontSize: 22, testId: 'skip-cutscene',
    }).setDepth(20);
    this.onEscape = () => { if (scene.input.enabled) this.complete(); };
    scene.input.keyboard?.on('keydown-ESC', this.onEscape);
    this.playNext();
  }

  playNext() {
    if (this.finished) return;
    const clip = this.clips[this.index++];
    if (!clip) return this.complete();
    if (!this.scene.cache.video.exists(clip.key)) return this.playNext();
    this.clearVideo();

    this.onStatus('loading');
    const video = this.scene.add.video(GAME_WIDTH / 2, GAME_HEIGHT / 2, clip.key).setDepth(1);
    video.setMute(!this.scene.registry.get('musicEnabled'));
    this.video = video;
    let ended = false;
    const next = () => {
      if (ended || this.finished) return;
      ended = true;
      this.playNext();
    };
    video.once('created', () => {
      if (this.finished) return;
      video.setScale(Math.min(GAME_WIDTH / video.width, GAME_HEIGHT / video.height));
      this.onStatus('playing');
      this.guard?.remove();
      const duration = video.getDuration();
      const durationMs = Number.isFinite(duration) && duration > 0 ? duration * 1000 : (clip.durationMs ?? 60000);
      this.guard = this.scene.time.delayedCall(durationMs + 4000, next);
      this.onReady();
    });
    video.once('complete', next);
    video.once('error', next);
    video.once('unsupported', next);
    // Recover when a video cannot download or acquire its first decoded frame.
    this.guard = this.scene.time.delayedCall(6000, next);
    video.play(false);
  }

  clearVideo() {
    this.guard?.remove();
    this.guard = null;
    if (this.video) {
      this.video.removeAllListeners();
      this.video.stop();
      this.video.destroy();
      this.video = null;
    }
  }

  complete() {
    if (this.finished) return;
    // Hold the final frame until the scene has faded out over it.
    this.finished = true;
    this.guard?.remove();
    this.guard = null;
    this.video?.pause();
    this.removeControls();
    this.onComplete();
  }

  removeControls() {
    this.skip?.destroy(true);
    this.skip = null;
    this.scene.input.keyboard?.off('keydown-ESC', this.onEscape);
  }

  destroy() {
    this.finished = true;
    this.clearVideo();
    this.removeControls();
  }
}
