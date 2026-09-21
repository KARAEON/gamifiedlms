import Phaser from 'phaser';
import { mixtureDetectiveGame } from '../config/content.js';
import { GAME_WIDTH } from '../config/gameConfig.js';
import { getPostGameAssessmentLabel, startPostGameAssessment } from '../systems/assessmentFlow.js';
import { submitMinigameResult } from '../systems/resultSubmission.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import {
  createBottomFeedback,
  createMinigameHud,
  createSparkles,
  drawMinigameBackdrop,
  drawMixtureIcon,
} from '../ui/minigameUi.js';
import { closeOpenModal, colors, createPixelButton, showModal, textStyle } from '../ui/ui.js';

const SAMPLE_CARD_WIDTH = 270;
const SAMPLE_CARD_HEIGHT = 300;
const QUESTION_PANEL_X = 1034;
const QUESTION_PANEL_Y = 382;
const QUESTION_PANEL_WIDTH = 410;
const QUESTION_PANEL_HEIGHT = 420;

export default class MixtureDetectiveScene extends Phaser.Scene {
  constructor() {
    super('MixtureDetectiveScene');
  }

  init(data) {
    this.islandId = data.islandId ?? 'vulcan-caverns';
    this.quarterId = data.quarterId ?? 'q1';
    this.majorId = data.majorId ?? 'q1-major-1';
    this.lessonId = data.lessonId ?? mixtureDetectiveGame.lessonId;
    this.returnScrollY = Number.isFinite(data.returnScrollY) ? data.returnScrollY : 0;
    this.currentModal = null;
  }

  create() {
    this.score = 0;
    this.timeRemaining = mixtureDetectiveGame.timerSeconds;
    this.lastTimerSecond = Math.ceil(this.timeRemaining);
    this.result = null;
    this.phase = 'question';
    this.currentRoundIndex = 0;
    this.correctCount = 0;
    this.mistakes = 0;
    this.optionViews = [];
    this.sampleMetas = [];
    this.finalChipViews = [];
    this.finalSelections = {
      aType: null,
      aReason: null,
      bType: null,
      bReason: null,
    };
    this.nextButtonMeta = null;
    this.checkButtonMeta = null;

    drawMinigameBackdrop(this);
    this.drawDetectiveDesk();
    this.createHud();
    this.renderQuestion();
    this.setupKeyboardShortcuts();

    markSceneReady('MixtureDetectiveScene', this.buildTestState());
  }

  update(_time, delta) {
    if (this.result) {
      return;
    }

    this.timeRemaining = Math.max(0, this.timeRemaining - delta / 1000);
    const nextSecond = Math.ceil(this.timeRemaining);

    if (nextSecond !== this.lastTimerSecond) {
      this.lastTimerSecond = nextSecond;
      this.updateHudText();
      this.updateTestState();
    }

    if (this.timeRemaining <= 0) {
      this.finishGame(false, 'TIME IS UP');
    }
  }

  drawDetectiveDesk() {
    const desk = this.add.graphics();
    desk.setDepth(1);
    desk.fillStyle(0x2b2422, 0.42);
    desk.fillRoundedRect(74, 178, 742, 384, 8);
    desk.lineStyle(5, 0x6e5241, 0.95);
    desk.strokeRoundedRect(74, 178, 742, 384, 8);
  }

  createHud() {
    this.hud = createMinigameHud(this, {
      title: mixtureDetectiveGame.title,
      topic: mixtureDetectiveGame.topic,
      progressLabel: 'CASE',
      progressValue: this.correctCount,
      progressMax: mixtureDetectiveGame.questions.length,
      score: this.score,
      time: this.timeRemaining,
      onBack: () => this.returnToQuarter(),
    });

    this.feedback = createBottomFeedback(this, {
      primary: 'COMPARE THE TWO MIXTURES',
      secondary: 'CHOOSE THE ANSWER THAT BEST EXPLAINS WHAT YOU SEE.',
    });
  }

  renderQuestion() {
    this.phase = 'question';
    this.clearRoundLayer();
    this.roundLayer = this.add.container(0, 0);
    this.roundLayer.setDepth(5);
    this.optionViews = [];
    this.sampleMetas = [];
    this.finalChipViews = [];
    this.nextButtonMeta = null;
    this.checkButtonMeta = null;

    const question = this.getCurrentQuestion();
    this.createSampleCard(question.samples[0], 250, 382, 0x58cc02);
    this.createSampleCard(question.samples[1], 610, 382, 0x2278c9);
    this.createQuestionPanel(question);
    this.feedback.setText(`CASE ${this.currentRoundIndex + 1}: COMPARE SAMPLE A AND SAMPLE B`, 'CLICK A SAMPLE OR CHOOSE AN ANSWER.');
    this.updateHudText();
    this.updateTestState();
  }

  clearRoundLayer() {
    if (this.roundLayer) {
      this.roundLayer.destroy(true);
      this.roundLayer = null;
    }
  }

  createSampleCard(sample, x, y, color) {
    const container = this.add.container(x, y);
    container.setDepth(10);

    const shadow = this.add.rectangle(8, 10, SAMPLE_CARD_WIDTH, SAMPLE_CARD_HEIGHT, 0x000000, 0.24);
    shadow.setOrigin(0.5);
    const card = this.add.graphics();
    card.fillStyle(0xfff2c9, 1);
    card.lineStyle(5, color, 1);
    card.fillRoundedRect(-SAMPLE_CARD_WIDTH / 2, -SAMPLE_CARD_HEIGHT / 2, SAMPLE_CARD_WIDTH, SAMPLE_CARD_HEIGHT, 8);
    card.strokeRoundedRect(-SAMPLE_CARD_WIDTH / 2, -SAMPLE_CARD_HEIGHT / 2, SAMPLE_CARD_WIDTH, SAMPLE_CARD_HEIGHT, 8);
    card.fillStyle(color, 1);
    card.fillRoundedRect(-SAMPLE_CARD_WIDTH / 2, -SAMPLE_CARD_HEIGHT / 2, SAMPLE_CARD_WIDTH, 52, 8);
    card.fillStyle(0xffffff, 0.4);
    card.fillRoundedRect(-SAMPLE_CARD_WIDTH / 2 + 8, -SAMPLE_CARD_HEIGHT / 2 + 8, SAMPLE_CARD_WIDTH - 16, 10, 4);

    const header = this.add.text(0, -128, `SAMPLE ${sample.key}`, textStyle(25, '#fff2c9'));
    header.setOrigin(0.5);
    header.setShadow(2, 2, '#000000', 0, false, true);

    const name = this.add.text(0, -88, sample.name.toUpperCase(), textStyle(23, '#2f2a2a'));
    name.setOrigin(0.5);
    name.setWordWrapWidth(SAMPLE_CARD_WIDTH - 36);

    const windowBg = this.add.rectangle(0, 14, 210, 132, 0xdaf7ff, 1);
    windowBg.setStrokeStyle(4, 0x9e6b47, 1);
    const icon = this.add.graphics();
    icon.setPosition(0, 4);
    icon.setScale(1.42);
    drawMixtureIcon(icon, sample.icon);

    const noteBg = this.add.graphics();
    noteBg.fillStyle(0x3e3a36, 1);
    noteBg.fillRoundedRect(-SAMPLE_CARD_WIDTH / 2 + 16, 106, SAMPLE_CARD_WIDTH - 32, 52, 8);
    const note = this.add.text(0, 132, sample.note.toUpperCase(), textStyle(18, '#fff2c9'));
    note.setOrigin(0.5);
    note.setWordWrapWidth(SAMPLE_CARD_WIDTH - 54);
    note.setLineSpacing(-4);

    const hitArea = this.add.zone(0, 0, SAMPLE_CARD_WIDTH, SAMPLE_CARD_HEIGHT).setInteractive({ useHandCursor: true });
    hitArea.on('pointerover', () => {
      if (this.getSampleOption(sample.key)) {
        container.setScale(1.035);
      }
    });
    hitArea.on('pointerout', () => container.setScale(1));
    hitArea.on('pointerup', () => {
      const option = this.getSampleOption(sample.key);
      if (option) {
        this.answerOption(option);
      }
    });

    container.add([shadow, card, header, name, windowBg, icon, noteBg, note, hitArea]);
    this.roundLayer.add(container);
    this.sampleMetas.push({
      key: sample.key,
      name: sample.name,
      icon: sample.icon,
      type: sample.type,
      x,
      y,
    });
  }

  createQuestionPanel(question) {
    const panel = this.add.container(QUESTION_PANEL_X, QUESTION_PANEL_Y);
    panel.setDepth(11);

    const background = this.add.graphics();
    background.fillStyle(0x3b2547, 0.98);
    background.lineStyle(5, 0xffefb5, 1);
    background.fillRoundedRect(-QUESTION_PANEL_WIDTH / 2, -QUESTION_PANEL_HEIGHT / 2, QUESTION_PANEL_WIDTH, QUESTION_PANEL_HEIGHT, 8);
    background.strokeRoundedRect(-QUESTION_PANEL_WIDTH / 2, -QUESTION_PANEL_HEIGHT / 2, QUESTION_PANEL_WIDTH, QUESTION_PANEL_HEIGHT, 8);
    background.lineStyle(3, 0x9e6b47, 1);
    background.strokeRoundedRect(-QUESTION_PANEL_WIDTH / 2 + 10, -QUESTION_PANEL_HEIGHT / 2 + 10, QUESTION_PANEL_WIDTH - 20, QUESTION_PANEL_HEIGHT - 20, 6);

    const count = this.add.text(0, -172, `QUESTION ${this.currentRoundIndex + 1} / ${mixtureDetectiveGame.questions.length}`, textStyle(24, '#d7b6ff'));
    count.setOrigin(0.5);

    const prompt = this.add.text(0, -106, question.prompt.toUpperCase(), textStyle(27, '#fff2c9'));
    prompt.setOrigin(0.5);
    prompt.setWordWrapWidth(336);
    prompt.setLineSpacing(-4);

    panel.add([background, count, prompt]);
    this.roundLayer.add(panel);

    const optionHeight = question.options.length > 2 ? 70 : 78;
    const optionGap = question.options.length > 2 ? 12 : 22;
    const startY = QUESTION_PANEL_Y + (question.options.length > 2 ? 14 : 38);
    question.options.forEach((option, index) => {
      const y = startY + index * (optionHeight + optionGap);
      this.createAnswerButton(option, index, QUESTION_PANEL_X, y, 350, optionHeight);
    });
  }

  createAnswerButton(option, index, x, y, width, height) {
    const container = this.add.container(x, y);
    container.setDepth(12);

    const graphics = this.add.graphics();
    const draw = (fill, stroke) => {
      graphics.clear();
      graphics.fillStyle(fill, 1);
      graphics.lineStyle(4, stroke, 1);
      graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 7);
      graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 7);
      graphics.lineStyle(2, 0xffffff, 0.42);
      graphics.strokeRoundedRect(-width / 2 + 7, -height / 2 + 7, width - 14, height - 14, 5);
    };
    draw(0xfff2c9, 0x9e6b47);

    const badgeLabel = option.sampleKey ?? String.fromCharCode(65 + index);
    const badge = this.add.rectangle(-width / 2 + 34, 0, 42, 38, option.sampleKey === 'B' ? 0x2278c9 : 0x58cc02, 1);
    badge.setStrokeStyle(3, 0x2f2a2a, 1);
    const badgeText = this.add.text(-width / 2 + 34, -1, badgeLabel.toUpperCase(), textStyle(21, '#fff2c9'));
    badgeText.setOrigin(0.5);

    const label = this.add.text(-width / 2 + 68, 0, option.label.toUpperCase(), textStyle(questionTextSize(option.label), '#2f2a2a', 'left'));
    label.setOrigin(0, 0.5);
    label.setWordWrapWidth(width - 92);
    label.setLineSpacing(-3);

    const zone = this.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      if (this.phase === 'question' && !this.result) {
        draw(0xe7ffd6, colors.gold);
        container.setScale(1.035);
      }
    });
    zone.on('pointerout', () => {
      draw(0xfff2c9, 0x9e6b47);
      container.setScale(1);
    });
    zone.on('pointerup', () => this.answerOption(option));

    container.add([graphics, badge, badgeText, label, zone]);
    this.roundLayer.add(container);
    this.optionViews.push({
      id: option.id,
      label: option.label,
      sampleKey: option.sampleKey ?? null,
      correct: option.correct,
      x,
      y,
      width,
      height,
      container,
      draw,
    });
  }

  answerOption(option) {
    if (this.phase !== 'question' || this.result) {
      return;
    }

    if (option.correct) {
      this.handleCorrectAnswer(option);
      return;
    }

    this.handleWrongAnswer(option);
  }

  handleCorrectAnswer(option) {
    this.phase = 'feedback';
    this.correctCount += 1;
    this.score += mixtureDetectiveGame.score.correctQuestion;
    this.showStatusMark(true);
    this.markOption(option.id, true);
    this.clearAnswerButtons();

    const sparkleTarget = this.sampleMetas.find((sample) => sample.key === option.sampleKey) ?? { x: QUESTION_PANEL_X, y: QUESTION_PANEL_Y };
    createSparkles(this, sparkleTarget.x, sparkleTarget.y);

    const question = this.getCurrentQuestion();
    this.feedback.setText(`CORRECT +${mixtureDetectiveGame.score.correctQuestion}`, question.feedback.toUpperCase());
    this.createNextButton();
    this.updateHudText();
    this.updateTestState();
  }

  clearAnswerButtons() {
    this.optionViews.forEach((view) => {
      view.container?.destroy(true);
    });
    this.optionViews = [];
  }

  handleWrongAnswer(option) {
    this.mistakes += 1;
    this.showStatusMark(false);
    this.markOption(option.id, false);

    const question = this.getCurrentQuestion();
    this.feedback.setText(`TRY AGAIN - MISTAKE ${this.mistakes} / ${mixtureDetectiveGame.maxMistakes}`, question.hint.toUpperCase());

    const optionView = this.optionViews.find((view) => view.id === option.id);
    if (optionView) {
      this.shake(optionView.container);
    }

    this.updateTestState();

    if (this.mistakes >= mixtureDetectiveGame.maxMistakes) {
      this.time.delayedCall(360, () => this.finishGame(false, 'TOO MANY MISTAKES'));
    }
  }

  markOption(optionId, correct) {
    const optionView = this.optionViews.find((view) => view.id === optionId);
    if (!optionView) {
      return;
    }

    optionView.draw(correct ? 0xe7ffd6 : 0xffd6d6, correct ? 0x58cc02 : 0xff5a66);
  }

  showStatusMark(correct) {
    if (this.statusMark) {
      this.statusMark.destroy(true);
    }

    const mark = this.add.container(832, 198);
    mark.setDepth(12);
    const circle = this.add.circle(0, 0, 31, correct ? 0x58cc02 : 0xff5a66, 1);
    circle.setStrokeStyle(4, 0xfff2c9, 1);
    const graphics = this.add.graphics();
    graphics.lineStyle(7, 0xffffff, 1);

    if (correct) {
      graphics.lineBetween(-14, 0, -4, 13);
      graphics.lineBetween(-4, 13, 18, -14);
    } else {
      graphics.lineBetween(-13, -13, 13, 13);
      graphics.lineBetween(13, -13, -13, 13);
    }

    mark.add([circle, graphics]);
    this.roundLayer?.add(mark);
    this.statusMark = mark;
  }

  createNextButton() {
    const label = this.currentRoundIndex === mixtureDetectiveGame.questions.length - 1 ? 'FINAL CASE' : 'NEXT';
    const button = createPixelButton(this, QUESTION_PANEL_X, 562, label, () => this.advanceAfterFeedback(), {
      width: 198,
      height: 54,
      fontSize: 25,
      textColor: '#2f2a2a',
    });
    button.setDepth(12);
    this.roundLayer.add(button);
    this.nextButtonMeta = {
      x: QUESTION_PANEL_X,
      y: 562,
      label,
    };
  }

  advanceAfterFeedback() {
    if (this.phase !== 'feedback' || this.result) {
      return;
    }

    if (this.currentRoundIndex >= mixtureDetectiveGame.questions.length - 1) {
      this.renderFinalComparison();
      return;
    }

    this.currentRoundIndex += 1;
    this.renderQuestion();
  }

  renderFinalComparison() {
    this.phase = 'final';
    this.clearRoundLayer();
    this.roundLayer = this.add.container(0, 0);
    this.roundLayer.setDepth(5);
    this.optionViews = [];
    this.sampleMetas = [];
    this.finalChipViews = [];
    this.nextButtonMeta = null;
    this.checkButtonMeta = null;

    const title = this.add.text(455, 166, 'FINAL COMPARISON', textStyle(32, '#ffd76a'));
    title.setOrigin(0.5);
    title.setShadow(3, 3, '#000000', 0, false, true);
    const prompt = this.add.text(455, 203, 'COMPLETE BOTH SENTENCES ABOUT SAMPLE A AND SAMPLE B.', textStyle(22, '#fff2c9'));
    prompt.setOrigin(0.5);
    prompt.setWordWrapWidth(720);
    prompt.setLineSpacing(-2);

    this.roundLayer.add([title, prompt]);
    this.createSampleCard(mixtureDetectiveGame.finalComparison.samples[0], 250, 392, 0x58cc02);
    this.createSampleCard(mixtureDetectiveGame.finalComparison.samples[1], 610, 392, 0x2278c9);
    this.createFinalPanel();
    this.feedback.setText('COMPLETE THE COMPARISON SENTENCE', 'CHOOSE THE TYPE AND THE REASON FOR EACH SAMPLE.');
    this.updateHudText();
    this.updateTestState();
  }

  createFinalPanel() {
    const panel = this.add.container(1034, 382);
    panel.setDepth(10);
    const background = this.add.graphics();
    background.fillStyle(0x3b2547, 0.98);
    background.lineStyle(5, 0xffefb5, 1);
    background.fillRoundedRect(-205, -198, 410, 396, 8);
    background.strokeRoundedRect(-205, -198, 410, 396, 8);

    const rows = [
      { slot: 'aType', label: 'SAMPLE A IS', choices: [['uniform', 'UNIFORM'], ['nonuniform', 'NON-UNIFORM']] },
      { slot: 'aReason', label: 'A BECAUSE', choices: [['looks-same', 'LOOKS SAME'], ['visible-parts', 'HAS PARTS']] },
      { slot: 'bType', label: 'SAMPLE B IS', choices: [['uniform', 'UNIFORM'], ['nonuniform', 'NON-UNIFORM']] },
      { slot: 'bReason', label: 'B BECAUSE', choices: [['looks-same', 'LOOKS SAME'], ['visible-parts', 'HAS PARTS']] },
    ];

    panel.add(background);
    this.roundLayer.add(panel);
    rows.forEach((row, rowIndex) => {
      const rowY = -146 + rowIndex * 82;
      const label = this.add.text(-164, rowY - 24, row.label, textStyle(18, '#d7b6ff', 'left'));
      label.setOrigin(0, 0.5);
      panel.add(label);

      row.choices.forEach(([value, choiceLabel], choiceIndex) => {
        const chip = this.createFinalChip(row.slot, value, choiceLabel, 1034 - 82 + choiceIndex * 164, 382 + rowY + 14);
        this.roundLayer.add(chip.container);
      });
    });

    const check = createPixelButton(this, 1034, 586, 'CHECK', () => this.checkFinalComparison(), {
      width: 198,
      height: 54,
      fontSize: 25,
      textColor: '#2f2a2a',
    });
    check.setDepth(14);
    this.roundLayer.add(check);
    this.checkButtonMeta = {
      x: 1034,
      y: 586,
      label: 'CHECK',
    };
  }

  createFinalChip(slot, value, label, x, y) {
    const width = 150;
    const height = 42;
    const container = this.add.container(x, y);
    container.setDepth(13);
    const graphics = this.add.graphics();
    const text = this.add.text(0, -1, label, textStyle(16, '#2f2a2a'));
    text.setOrigin(0.5);
    const zone = this.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => container.setScale(1.04));
    zone.on('pointerout', () => container.setScale(1));
    zone.on('pointerup', () => {
      this.finalSelections[slot] = value;
      this.refreshFinalChips();
      this.updateTestState();
    });

    container.add([graphics, text, zone]);
    const chip = {
      slot,
      value,
      label,
      x,
      y,
      width,
      height,
      container,
      graphics,
    };
    this.finalChipViews.push(chip);
    this.drawFinalChip(chip);
    return chip;
  }

  refreshFinalChips() {
    this.finalChipViews.forEach((chip) => this.drawFinalChip(chip));
  }

  drawFinalChip(chip) {
    const selected = this.finalSelections[chip.slot] === chip.value;
    chip.graphics.clear();
    chip.graphics.fillStyle(selected ? 0xe7ffd6 : 0xfff2c9, 1);
    chip.graphics.lineStyle(4, selected ? 0x58cc02 : 0x9e6b47, 1);
    chip.graphics.fillRoundedRect(-chip.width / 2, -chip.height / 2, chip.width, chip.height, 6);
    chip.graphics.strokeRoundedRect(-chip.width / 2, -chip.height / 2, chip.width, chip.height, 6);
  }

  checkFinalComparison() {
    if (this.phase !== 'final' || this.result) {
      return;
    }

    const slots = Object.keys(mixtureDetectiveGame.finalComparison.correct);
    const complete = slots.every((slot) => this.finalSelections[slot]);
    if (!complete) {
      this.feedback.setText('FILL EVERY BLANK FIRST', 'CHOOSE ONE OPTION IN EACH ROW.');
      return;
    }

    const correct = slots.every((slot) => {
      return this.finalSelections[slot] === mixtureDetectiveGame.finalComparison.correct[slot];
    });

    if (correct) {
      this.score += mixtureDetectiveGame.score.finalComparison;
      this.feedback.setText(`CASE SOLVED +${mixtureDetectiveGame.score.finalComparison}`, mixtureDetectiveGame.finalComparison.hint.toUpperCase());
      createSparkles(this, 1034, 382);
      this.updateHudText();
      this.finishGame(true);
      return;
    }

    this.mistakes += 1;
    this.feedback.setText(`CHECK THE COMPARISON - MISTAKE ${this.mistakes} / ${mixtureDetectiveGame.maxMistakes}`, mixtureDetectiveGame.finalComparison.hint.toUpperCase());
    this.shake(this.roundLayer);
    this.updateTestState();

    if (this.mistakes >= mixtureDetectiveGame.maxMistakes) {
      this.time.delayedCall(360, () => this.finishGame(false, 'TOO MANY MISTAKES'));
    }
  }

  getCurrentQuestion() {
    return mixtureDetectiveGame.questions[this.currentRoundIndex];
  }

  getSampleOption(sampleKey) {
    if (this.phase !== 'question' || this.result) {
      return null;
    }

    return this.getCurrentQuestion().options.find((option) => option.sampleKey === sampleKey) ?? null;
  }

  shake(target) {
    const startX = target.x;
    this.tweens.add({
      targets: target,
      x: startX + 10,
      duration: 55,
      yoyo: true,
      repeat: 4,
      ease: Phaser.Math.Easing.Sine.InOut,
      onComplete: () => {
        target.x = startX;
      },
    });
  }

  finishGame(won, reason = null) {
    if (this.result) {
      return;
    }

    this.result = won ? 'win' : 'lose';
    this.phase = 'result';
    this.updateHudText();
    this.updateTestState();
    this.submitResult();

    showModal(this, {
      name: won ? 'result-win' : 'result-lose',
      title: won ? 'CASE SOLVED' : 'TRY AGAIN',
      height: 360,
      body: (_overlay, { panelX, panelY }) => {
        const scoreText = this.add.text(panelX, panelY - 38, `SCORE ${this.score}`, textStyle(31, '#66e5ff'));
        scoreText.setOrigin(0.5);
        const mistakeText = this.add.text(panelX, panelY + 4, `MISTAKES ${this.mistakes} / ${mixtureDetectiveGame.maxMistakes}`, textStyle(24, '#fff2c9'));
        mistakeText.setOrigin(0.5);
        const message = this.add.text(
          panelX,
          panelY + 47,
          won ? 'YOU COMPARED EVERY MIXTURE CASE.' : reason ?? 'COMPLETE THE CASE BEFORE TIME RUNS OUT.',
          textStyle(22, '#ffd76a'),
        );
        message.setOrigin(0.5);
        message.setWordWrapWidth(430);
        return [scoreText, mistakeText, message];
      },
      buttons: won
        ? [
            {
              label: getPostGameAssessmentLabel(this.lessonId),
              width: 220,
              action: () => this.startAssessment(),
            },
          ]
        : [
            {
              label: 'RETRY',
              width: 170,
              action: () => this.retryGame(),
            },
            {
              label: getPostGameAssessmentLabel(this.lessonId),
              width: 170,
              action: () => this.startAssessment(),
            },
            {
              label: 'BACK',
              width: 170,
              action: () => this.returnToQuarter(),
            },
          ],
    });
  }

  updateHudText() {
    this.hud?.setScore(this.score);
    this.hud?.setTime(this.timeRemaining);
    this.hud?.setProgress(this.correctCount, mixtureDetectiveGame.questions.length);
  }

  setupKeyboardShortcuts() {
    this.input.keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.ESC,
      Phaser.Input.Keyboard.KeyCodes.BACKSPACE,
    ]);

    this.input.keyboard.on('keydown-ESC', () => {
      this.goBackOrCloseModal();
    });

    this.input.keyboard.on('keydown-BACKSPACE', (event) => {
      event?.preventDefault?.();
      this.goBackOrCloseModal();
    });
  }

  goBackOrCloseModal() {
    if (this.currentModal) {
      closeOpenModal(this);
      this.returnToQuarter();
      return;
    }

    this.returnToQuarter();
  }

  retryGame() {
    this.scene.restart({
      islandId: this.islandId,
      quarterId: this.quarterId,
      majorId: this.majorId,
      lessonId: this.lessonId,
      returnScrollY: this.returnScrollY,
    });
  }

  startAssessment() {
    startPostGameAssessment(this, {
      islandId: this.islandId,
      quarterId: this.quarterId,
      majorId: this.majorId,
      lessonId: this.lessonId,
      returnScrollY: this.returnScrollY,
      minigameResult: this.result,
      minigameScore: this.score,
    });
  }

  returnToQuarter() {
    this.scene.start('QuarterDetailScene', {
      islandId: this.islandId,
      quarterId: this.quarterId,
      scrollY: this.returnScrollY,
    });
  }

  buildSubmissionPayload() {
    return {
      correct_question_count: this.correctCount,
      mistake_count: this.mistakes,
      final_selections: { ...this.finalSelections },
      time_remaining_seconds: Math.max(0, Math.round((this.timeRemaining ?? 0) * 100) / 100),
    };
  }

  submitResult() {
    submitMinigameResult(this, {
      lessonKey: this.lessonId,
      gameKey: mixtureDetectiveGame.id,
      payloadBuilder: () => this.buildSubmissionPayload(),
    });
  }

  buildTestState() {
    return {
      selectedIsland: this.islandId,
      selectedQuarter: this.quarterId,
      selectedMajor: this.majorId,
      selectedLesson: this.lessonId,
      minigameId: mixtureDetectiveGame.id,
      score: this.score,
      timeRemaining: Math.ceil(this.timeRemaining),
      gameResult: this.result,
      detectivePhase: this.phase,
      detectiveRoundIndex: this.currentRoundIndex,
      detectiveQuestionId: this.phase === 'question' || this.phase === 'feedback' ? this.getCurrentQuestion()?.id ?? null : null,
      detectiveSamples: this.sampleMetas,
      detectiveOptions: this.optionViews.map((option) => ({
        id: option.id,
        label: option.label,
        sampleKey: option.sampleKey,
        correct: option.correct,
        x: option.x,
        y: option.y,
        width: option.width,
        height: option.height,
      })),
      detectiveCorrectCount: this.correctCount,
      detectiveMistakes: this.mistakes,
      detectiveFinalSelections: { ...this.finalSelections },
      detectiveFinalChips: this.finalChipViews.map((chip) => ({
        slot: chip.slot,
        value: chip.value,
        label: chip.label,
        x: chip.x,
        y: chip.y,
        selected: this.finalSelections[chip.slot] === chip.value,
      })),
      detectiveNextButton: this.nextButtonMeta,
      detectiveCheckButton: this.checkButtonMeta,
    };
  }

  updateTestState() {
    setTestState(this.buildTestState());
  }
}

function questionTextSize(label) {
  if (label.length > 70) {
    return 15;
  }

  if (label.length > 38) {
    return 17;
  }

  return 21;
}
