import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { setTestState } from '../systems/testSeam.js';
import { textStyle, titleStyle } from './ui.js';

// Static character poses and scripted lines, with no choices or branching.
export default class DialogueSequence {
  constructor(scene, container, step, onComplete) {
    this.scene = scene;
    this.step = step;
    this.onComplete = onComplete;
    this.index = 0;
    this.finished = false;
    this.portrait = scene.add.image(188, 710, 'quill-default').setOrigin(0.5, 1);
    this.portrait.setScale(410 / this.portrait.height);

    const panel = scene.add.rectangle(798, 588, 886, 204, 0x172d3b, 0.96);
    panel.setStrokeStyle(3, 0xffe6a3);
    const name = scene.add.text(382, 507, 'QUILL', titleStyle(30, '#fff2c9', 'left'));
    this.text = scene.add.text(382, 550, '', {
      ...textStyle(28, '#f4f0df', 'left'),
      wordWrap: { width: 820 }, lineSpacing: 5,
    });
    this.progress = scene.add.text(382, 658, '', textStyle(18, '#aec6d2', 'left'));
    const hint = scene.add.text(1216, 658, 'CLICK / TAP / SPACE TO CONTINUE', textStyle(18, '#fff2c9'))
      .setOrigin(1, 0);
    const advance = scene.add.zone(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT)
      .setInteractive({ useHandCursor: true });
    advance.on('pointerup', () => this.advance());
    container.add([this.portrait, panel, name, this.text, this.progress, hint, advance]);

    this.onKey = (event) => { if (!event.repeat) this.advance(); };
    scene.input.keyboard?.on('keydown-SPACE', this.onKey);
    scene.input.keyboard?.on('keydown-ENTER', this.onKey);
    this.showLine();
  }

  showLine() {
    const line = this.step.lines[this.index];
    this.text.setText(line.text);
    const pose = this.scene.textures.exists(`quill-${line.pose}`) ? line.pose : 'default';
    this.portrait.setTexture(`quill-${pose}`);
    this.progress.setText(`${this.index + 1} / ${this.step.lines.length}`);
    setTestState({ dialogueLineIndex: this.index, dialogueLineCount: this.step.lines.length,
      dialogueText: line.text, dialoguePose: pose });
  }

  advance() {
    if (this.finished || !this.scene.input.enabled) return;
    this.index += 1;
    if (this.index < this.step.lines.length) this.showLine();
    else {
      this.destroy();
      this.onComplete();
    }
  }

  destroy() {
    this.finished = true;
    this.scene.input.keyboard?.off('keydown-SPACE', this.onKey);
    this.scene.input.keyboard?.off('keydown-ENTER', this.onKey);
  }
}
