import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import { coverImage } from '../ui/ui.js';

// Runs above the live world, so transparent cloud openings reveal the map.
export default class CloudTransitionScene extends Phaser.Scene {
  constructor() {
    super('CloudTransitionScene');
  }

  create() {
    this.finishing = false;
    this.scene.launch('IslandSelectScene', { cloudTransition: true });
    this.scene.bringToTop();

    const poster = this.textures.exists('cloud-zoom-poster')
      ? coverImage(this, 'cloud-zoom-poster').setDepth(1)
      : null;
    this.add.zone(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT)
      .setDepth(3).setInteractive();
    markSceneReady('CloudTransitionScene', { cloudTransition: 'loading' });

    if (!this.cache.video.exists('cloud-zoom')) {
      this.finishTransition();
      return;
    }

    const video = this.add.video(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'cloud-zoom')
      .setDepth(2).setMute(true);
    this.cloudVideo = video;
    // 'created' fires after Phaser sets the decoded frame dimensions.
    // Scaling on 'textureready' would use the initial 256px placeholder size.
    video.once('created', () => {
      video.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
      poster?.setVisible(false);
      setTestState({ cloudTransition: 'playing' });
    });
    video.once('complete', () => this.finishTransition());
    video.once('error', () => this.finishTransition());
    video.once('unsupported', () => this.finishTransition());

    // A failed download or stalled decoder must never trap the player.
    this.fallbackTimer = this.time.delayedCall(9000, () => this.finishTransition());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.fallbackTimer?.remove();
      video.stop();
    });
    video.play(false);
  }

  finishTransition() {
    if (this.finishing) return;
    this.finishing = true;
    this.fallbackTimer?.remove();
    // Allow the world launched during create() to finish its creation first.
    this.time.delayedCall(0, () => {
      this.scene.get('IslandSelectScene').finishCloudTransition();
      this.scene.stop();
    });
  }
}
