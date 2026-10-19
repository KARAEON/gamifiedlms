import Phaser from 'phaser';
import { getAssessmentForLesson } from '../config/content.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import { closeOpenModal, coverImage, createBackArrow, createPixelButton, showModal, textStyle, titleStyle } from '../ui/ui.js';

const CARD_WIDTH = 820;
const CARD_HEIGHT = 380;

export default class AssessmentScene extends Phaser.Scene {
  constructor() {
    super('AssessmentScene');
  }

  init(data) {
    this.islandId = data.islandId ?? 'vulcan-caverns';
    this.quarterId = data.quarterId ?? 'q1';
    this.majorId = data.majorId ?? 'q1-major-1';
    this.lessonId = data.lessonId ?? 'q1-m1-l1';
    this.returnScrollY = Number.isFinite(data.returnScrollY) ? data.returnScrollY : 0;
    this.minigameResult = data.minigameResult ?? null;
    this.minigameScore = Number.isFinite(data.minigameScore) ? data.minigameScore : 0;
    this.assessment = getAssessmentForLesson(this.lessonId);
    this.currentModal = null;
  }

  create() {
    this.itemIndex = 0;
    this.score = 0;
    this.selectedChoice = null;
    this.answered = false;
    this.result = null;
    this.phase = 'intro';
    this.choiceViews = [];
    this.nextButtonMeta = null;

    this.drawBackground();
    this.createHud();
    this.setupKeyboardShortcuts();

    markSceneReady('AssessmentScene', this.buildTestState());
    this.showIntroModal();
  }

  drawBackground() {
    if (this.textures.exists('assessment-backdrop')) coverImage(this, 'assessment-backdrop');
    else this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x172826, 1).setOrigin(0);
    this.add.rectangle(0, 0, GAME_WIDTH, 134, 0x3e3a36, 0.98).setOrigin(0);
    this.add.rectangle(0, 134, GAME_WIDTH, 7, 0xffd76a, 1).setOrigin(0);

    const grid = this.add.graphics();
    grid.lineStyle(2, 0x31504a, 0.45);
    for (let x = 0; x <= GAME_WIDTH; x += 64) {
      grid.lineBetween(x, 141, x, GAME_HEIGHT);
    }
    for (let y = 141; y <= GAME_HEIGHT; y += 56) {
      grid.lineBetween(0, y, GAME_WIDTH, y);
    }
  }

  createHud() {
    const back = createBackArrow(this, () => this.returnToQuarter());
    back.setDepth(20);

    const label = this.assessment.type === 'summative' ? 'SUMMATIVE' : 'FORMATIVE';
    this.titleText = this.add.text(150, 42, this.assessment.title, titleStyle(36, '#fff2c9', 'left'));
    this.titleText.setOrigin(0, 0.5);
    this.titleText.setShadow(3, 3, '#000000', 0, false, true);
    this.subtitleText = this.add.text(150, 82, this.assessment.subtitle, textStyle(22, '#66e5ff', 'left'));
    this.subtitleText.setOrigin(0, 0.5);
    this.typeText = this.add.text(640, 36, label, textStyle(25, '#ffd76a'));
    this.typeText.setOrigin(0.5);
    this.scoreText = this.add.text(1052, 42, 'SCORE 0', textStyle(27, '#fff2c9'));
    this.scoreText.setOrigin(0.5);
    this.progressText = this.add.text(1052, 82, `ITEM 1 / ${this.assessment.items.length}`, textStyle(25, '#fff2c9'));
    this.progressText.setOrigin(0.5);
    this.progressGraphics = this.add.graphics();
    this.drawProgress();
  }

  drawProgress() {
    this.progressGraphics.clear();
    const x = 452;
    const y = 68;
    const width = 376;
    const height = 22;
    const progress = this.assessment.items.length > 0 ? this.itemIndex / this.assessment.items.length : 0;
    this.progressGraphics.fillStyle(0x201b1b, 1);
    this.progressGraphics.fillRoundedRect(x, y, width, height, 6);
    this.progressGraphics.lineStyle(3, 0xffefb5, 1);
    this.progressGraphics.strokeRoundedRect(x, y, width, height, 6);
    this.progressGraphics.fillStyle(0x58cc02, 1);
    this.progressGraphics.fillRoundedRect(x + 4, y + 4, Math.max(0, (width - 8) * progress), height - 8, 4);
  }

  showIntroModal() {
    const isSummative = this.assessment.type === 'summative';
    const testLabel = isSummative ? 'SUMMATIVE TEST' : 'FORMATIVE TEST';
    const status = this.minigameResult === 'win' ? 'MINIGAME PASSED' : 'MINIGAME NOT PASSED';
    const statusColor = this.minigameResult === 'win' ? '#9fe870' : '#ffd76a';

    showModal(this, {
      name: 'assessment-intro',
      title: testLabel,
      width: 700,
      height: 390,
      titleSize: 36,
      body: (_overlay, { panelX, panelY }) => {
        const statusText = this.add.text(panelX, panelY - 58, status, textStyle(29, statusColor));
        statusText.setOrigin(0.5);
        const score = this.add.text(panelX, panelY - 18, `MINIGAME SCORE ${this.minigameScore}`, textStyle(23, '#66e5ff'));
        score.setOrigin(0.5);
        const instructions = this.add.text(
          panelX,
          panelY + 34,
          `${this.assessment.title} HAS ${this.assessment.items.length} FLASHCARD ITEMS. NO TIMER. ANSWER EACH CARD, THEN CHECK THE FALLBACK NOTE AFTER YOUR SCORE.`,
          textStyle(20, '#fff2c9'),
        );
        instructions.setOrigin(0.5);
        instructions.setWordWrapWidth(560);
        instructions.setLineSpacing(-2);
        return [statusText, score, instructions];
      },
      buttons: [
        {
          label: isSummative ? 'START ST' : 'START FT',
          width: 220,
          action: () => this.startAssessmentItems(),
        },
        {
          label: 'BACK',
          width: 180,
          action: () => this.returnToQuarter(),
        },
      ],
    });
  }

  startAssessmentItems() {
    closeOpenModal(this);
    this.phase = 'quiz';
    this.renderItem();
    this.updateTestState();
  }

  renderItem() {
    this.clearItemLayer();
    this.itemLayer = this.add.container(0, 0);
    this.itemLayer.setDepth(5);
    this.choiceViews = [];
    this.nextButtonMeta = null;
    this.selectedChoice = null;
    this.answered = false;

    const item = this.getCurrentItem();
    const card = this.add.graphics();
    card.fillStyle(0xfff2c9, 1);
    card.lineStyle(6, 0x9e6b47, 1);
    card.fillRoundedRect((GAME_WIDTH - CARD_WIDTH) / 2, 176, CARD_WIDTH, CARD_HEIGHT, 8);
    card.strokeRoundedRect((GAME_WIDTH - CARD_WIDTH) / 2, 176, CARD_WIDTH, CARD_HEIGHT, 8);
    card.fillStyle(0x3b2547, 1);
    card.fillRoundedRect((GAME_WIDTH - CARD_WIDTH) / 2 + 22, 198, CARD_WIDTH - 44, 64, 8);

    const kind = this.add.text(640, 216, item.kind.toUpperCase(), textStyle(20, '#d7b6ff'));
    kind.setOrigin(0.5);
    const prompt = this.add.text(640, 294, item.prompt.toUpperCase(), textStyle(28, '#2f2a2a'));
    prompt.setOrigin(0.5);
    prompt.setWordWrapWidth(700);
    prompt.setLineSpacing(-2);

    this.feedbackText = this.add.text(640, 586, 'CHOOSE THE BEST ANSWER.', textStyle(24, '#66e5ff'));
    this.feedbackText.setOrigin(0.5);
    this.feedbackText.setWordWrapWidth(850);

    this.itemLayer.add([card, kind, prompt, this.feedbackText]);
    item.choices.forEach((choice, index) => {
      const row = Math.floor(index / 2);
      const column = index % 2;
      const x = item.choices.length <= 2 ? 640 : 440 + column * 400;
      const y = item.choices.length <= 2 ? 390 + index * 76 : 390 + row * 76;
      this.createChoice(choice, x, y, item.choices.length <= 2 ? 520 : 360, 58);
    });

    this.updateHud();
    this.updateTestState();
  }

  createChoice(choice, x, y, width, height) {
    const container = this.add.container(x, y);
    container.setDepth(8);
    const graphics = this.add.graphics();
    const label = this.add.text(0, -1, choice.toUpperCase(), textStyle(choice.length > 48 ? 15 : 19, '#2f2a2a'));
    label.setOrigin(0.5);
    label.setWordWrapWidth(width - 28);
    label.setLineSpacing(-3);
    const zone = this.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      if (!this.answered) {
        container.setScale(1.03);
      }
    });
    zone.on('pointerout', () => container.setScale(1));
    zone.on('pointerup', () => this.selectChoice(choice));

    container.add([graphics, label, zone]);
    this.itemLayer.add(container);
    const view = { choice, x, y, width, height, container, graphics };
    this.choiceViews.push(view);
    this.drawChoice(view);
  }

  drawChoice(view) {
    const item = this.getCurrentItem();
    const selected = this.selectedChoice === view.choice;
    const correct = this.answered && item.answer === view.choice;
    const wrong = this.answered && selected && !correct;
    view.graphics.clear();
    view.graphics.fillStyle(correct ? 0xe7ffd6 : wrong ? 0xffd6d6 : selected ? 0xdaf7ff : 0xffffff, 1);
    view.graphics.lineStyle(4, correct ? 0x58cc02 : wrong ? 0xff5a66 : selected ? 0x66e5ff : 0x9e6b47, 1);
    view.graphics.fillRoundedRect(-view.width / 2, -view.height / 2, view.width, view.height, 7);
    view.graphics.strokeRoundedRect(-view.width / 2, -view.height / 2, view.width, view.height, 7);
  }

  selectChoice(choice) {
    if (this.phase !== 'quiz' || this.answered || this.result) {
      return;
    }

    const item = this.getCurrentItem();
    this.selectedChoice = choice;
    this.answered = true;
    const correct = choice === item.answer;
    if (correct) {
      this.score += 1;
    }
    this.choiceViews.forEach((view) => this.drawChoice(view));
    this.feedbackText.setText(`${correct ? 'CORRECT' : 'REVIEW'}: ${item.feedback}`.toUpperCase());
    this.createNextButton();
    this.updateHud();
    this.updateTestState();
  }

  createNextButton() {
    const label = this.itemIndex >= this.assessment.items.length - 1 ? 'FINISH' : 'NEXT';
    const button = createPixelButton(this, 640, 644, label, () => this.advance(), {
      width: 200,
      height: 54,
      fontSize: 25,
      textColor: '#2f2a2a',
    });
    button.setDepth(12);
    this.itemLayer.add(button);
    this.nextButtonMeta = { x: 640, y: 644, label };
  }

  advance() {
    if (this.phase !== 'quiz' || !this.answered || this.result) {
      return;
    }

    if (this.itemIndex >= this.assessment.items.length - 1) {
      this.showResult();
      return;
    }

    this.itemIndex += 1;
    this.renderItem();
  }

  showResult() {
    this.result = this.getPercent() >= this.assessment.passPercent ? 'pass' : 'fail';
    this.phase = 'result';
    this.updateTestState();
    showModal(this, {
      name: `assessment-${this.result}`,
      title: this.result === 'pass' ? 'ASSESSMENT PASSED' : 'RETEACHING NEEDED',
      width: 700,
      height: 390,
      titleSize: 34,
      body: (_overlay, { panelX, panelY }) => {
        const score = this.add.text(panelX, panelY - 62, `SCORE ${this.score} / ${this.assessment.items.length} (${this.getPercent()}%)`, textStyle(29, '#66e5ff'));
        score.setOrigin(0.5);
        const message = this.add.text(panelX, panelY - 8, this.assessment.fallback.toUpperCase(), textStyle(20, '#fff2c9'));
        message.setOrigin(0.5);
        message.setWordWrapWidth(560);
        message.setLineSpacing(-2);
        const note = this.add.text(panelX, panelY + 74, 'AI INTEGRATION PLACEHOLDER ONLY.', textStyle(20, '#ffd76a'));
        note.setOrigin(0.5);
        return [score, message, note];
      },
      buttons: [
        {
          label: 'BACK TO PATH',
          width: 240,
          action: () => this.returnToQuarter(),
        },
      ],
    });
  }

  clearItemLayer() {
    if (this.itemLayer) {
      this.itemLayer.destroy(true);
      this.itemLayer = null;
    }
  }

  updateHud() {
    this.scoreText.setText(`SCORE ${this.score}`);
    this.progressText.setText(`ITEM ${Math.min(this.itemIndex + 1, this.assessment.items.length)} / ${this.assessment.items.length}`);
    this.drawProgress();
  }

  getCurrentItem() {
    return this.assessment.items[this.itemIndex];
  }

  getPercent() {
    return Math.round((this.score / this.assessment.items.length) * 100);
  }

  setupKeyboardShortcuts() {
    this.input.keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.ESC,
      Phaser.Input.Keyboard.KeyCodes.BACKSPACE,
    ]);
    this.input.keyboard.on('keydown-ESC', () => this.goBackOrCloseModal());
    this.input.keyboard.on('keydown-BACKSPACE', (event) => {
      event?.preventDefault?.();
      this.goBackOrCloseModal();
    });
  }

  goBackOrCloseModal() {
    if (this.currentModal) {
      this.returnToQuarter();
      return;
    }
    this.returnToQuarter();
  }

  returnToQuarter() {
    this.scene.start('QuarterDetailScene', {
      islandId: this.islandId,
      quarterId: this.quarterId,
      scrollY: this.returnScrollY,
    });
  }

  buildTestState() {
    return {
      selectedIsland: this.islandId,
      selectedQuarter: this.quarterId,
      selectedMajor: this.majorId,
      selectedLesson: this.lessonId,
      assessmentPhase: this.phase,
      assessmentId: this.assessment.id,
      assessmentType: this.assessment.type,
      assessmentItemIndex: this.itemIndex,
      assessmentItemCount: this.assessment.items.length,
      assessmentScore: this.score,
      assessmentPercent: this.result ? this.getPercent() : 0,
      assessmentResult: this.result,
      assessmentFallback: this.assessment.fallback,
      assessmentSelectedChoice: this.selectedChoice,
      assessmentOptions: this.choiceViews.map((view) => ({
        label: view.choice,
        x: view.x,
        y: view.y,
        width: view.width,
        height: view.height,
        correct: view.choice === this.getCurrentItem()?.answer,
      })),
      assessmentNextButton: this.nextButtonMeta,
    };
  }

  updateTestState() {
    setTestState(this.buildTestState());
  }
}
