import Phaser from 'phaser';
import { closeMinigameHelp } from '../ui/minigameHelp.js';
import { createMinigameNavigation } from '../ui/minigameNavigation.js';
import { createMinigameHeader } from '../ui/minigameHeader.js';
import { createMixtureIcon } from '../ui/assetIcons.js';
import { mixtureDetectiveGame } from '../config/content.js';
import { supplyControl, supplyGlyph, supplyPanel, supplyText, supplyHeading } from '../ui/supplyCartUi.js';
import { getPostGameAssessmentLabel, startPostGameAssessment } from '../systems/assessmentFlow.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import { createBottomFeedback, createSparkles } from '../ui/minigameUi.js';
import { closeOpenModal, showModal, textStyle } from '../ui/ui.js';

const SAMPLE_CARD_WIDTH = 310;
const SAMPLE_CARD_HEIGHT = 352;
const QUESTION_PANEL_X = 1050;
const QUESTION_PANEL_Y = 306;
const QUESTION_PANEL_WIDTH = 370;
const QUESTION_PANEL_HEIGHT = 372;

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
    this.streak = 0;
    this.selectedOptionId = null;
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
    this.submitButtonMeta = null;
    this.submitButton = null;

    this.add.rectangle(640, 360, 1280, 720, 0x080d16);
    this.add.image(640, 384, 'detective-sample-stage').setDisplaySize(1280, 640).setAlpha(0.25);
    this.createHud();
    this.renderQuestion();
    this.setupKeyboardShortcuts();

    markSceneReady('MixtureDetectiveScene', this.buildTestState());
  }

  update(_time, delta) {
    if (this.result || this.currentModal) {
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

  createHud() {
    createMinigameNavigation(this);
    const header = createMinigameHeader(this, {
      day: 3, detail: 'CASE 01', title: 'MIXTURE COMPARE CARDS', subtitle: 'Compare the samples. Choose your evidence.',
      counters: [{ label: 'TIME', glyph: 'clock', color: '#e8dcc0' }, { label: 'SCORE', glyph: 'star' }, { label: 'STREAK', glyph: 'star', color: '#ffad39' }],
    });
    this.caseText = header.detailText;
    const values = header.values;
    this.hud = {
      setTime: value => values[0].setText(`${Math.floor(value / 60).toString().padStart(2, '0')}:${Math.ceil(value % 60).toString().padStart(2, '0')}`),
      setScore: value => values[1].setText(String(value)),
      setProgress: () => values[2].setText(`x ${this.streak}`),
    };
    supplyPanel(this, 225, 567, 414, 146, { fill: 0x191e23, edge: 0x956037 });
    supplyHeading(this, 225, 516, 'ROUND PROGRESS', 21, '#c094ed').setDepth(6);
    this.progressDots = [];
    for (let i = 0; i < mixtureDetectiveGame.questions.length; i++) {
      const x = 65 + i * 80;
      if (i < 4) this.add.rectangle(x + 40, 565, 36, 4, 0x916d3d).setDepth(6);
      const panel = supplyPanel(this, x, 565, 48, 48, { fill: 0x383835, edge: 0x827b69 });
      const label = supplyText(this, x, 565, String(i + 1), 29).setDepth(6);
      this.progressDots.push({ panel, label, x });
    }
    this.progressText = supplyText(this, 225, 613, '', 18, '#c7baa1').setDepth(6);
    supplyPanel(this, 651, 567, 414, 146, { fill: 0x15301b, edge: 0x826035 });
    supplyHeading(this, 619, 516, 'SCIENTIST FEEDBACK', 20, '#97d144').setDepth(6);
    this.add.image(809, 578, 'supply-guide').setDisplaySize(90, 108).setDepth(7);
    const primary = supplyText(this, 464, 555, '', 23, '#ffdb78', 'left').setDepth(6);
    const secondary = supplyText(this, 464, 603, '', 18, '#e8dcc0', 'left').setDepth(6).setWordWrapWidth(280);
    this.feedback = { setText: (a, b) => { primary.setText(a); secondary.setText(b); } };
    supplyPanel(this, 1050, 567, 370, 146, { fill: 0x261c17, edge: 0x956037 });
    supplyHeading(this, 1050, 516, 'DETECTIVE BADGE', 21, '#c094ed').setDepth(6);
    this.add.image(915, 580, 'detective-detective-badge').setDisplaySize(76, 76).setDepth(6);
    this.badgeTitle = supplyHeading(this, 974, 555, 'SHARP OBSERVER', 22, '#ffce58', 'left').setDepth(6);
    supplyText(this, 974, 598, 'Notice details\nlike a scientist!', 20, '#e8dcc0', 'left').setDepth(6);
    createBottomFeedback(this, { primary: 'COMPARE TWO SAMPLES', secondary: 'Choose an answer and submit it before time runs out.' });
    this.controlsMeta = { settings: this.navigationMeta.settings, back: this.navigationMeta.back };

  }

  renderQuestion() {
    this.phase = 'question';
    this.selectedOptionId = null;
    this.clearRoundLayer();
    this.roundLayer = this.add.container(0, 0);
    this.roundLayer.setDepth(5);
    this.optionViews = [];
    this.sampleMetas = [];
    this.finalChipViews = [];
    this.nextButtonMeta = null;
    this.checkButtonMeta = null;
    this.submitButtonMeta = null;
    this.submitButton = null;

    const question = this.getCurrentQuestion();
    this.createSampleCard(question.samples[0], 230, 300, 0x406d1e);
    this.createSampleCard(question.samples[1], 644, 300, 0x225683);
    const versus = supplyPanel(this, 437, 300, 70, 70, { fill: 0xdba326, edge: 0xffde71 });
    this.roundLayer.add(versus);
    this.roundLayer.add(supplyText(this, 437, 300, 'VS', 37, '#231b12'));
    this.createQuestionPanel(question);
    this.feedback.setText('COMPARE THE SAMPLES', 'Choose your answer, then press SUBMIT.');
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
    const container = this.add.container(x, y).setDepth(10);
    const frame = supplyPanel(this, 0, 0, SAMPLE_CARD_WIDTH, SAMPLE_CARD_HEIGHT, { fill: 0x342619, edge: 0xb78336, highlight: 0xffdf83 });
    const stage = this.add.image(0, 18, 'detective-sample-stage').setDisplaySize(294, 240);
    const headerBg = this.add.rectangle(0, -153, 292, 33, color);
    const header = supplyHeading(this, 0, -153, `SAMPLE ${sample.key}`, 26);
    const nameBg = this.add.rectangle(0, -118, 292, 36, 0xe8d9b2);
    const name = supplyText(this, 0, -118, sample.name, 24, '#292017');
    const shadow = this.add.ellipse(0, 115, 148, 18, 0x21180e, 0.5);
    const icon = createMixtureIcon(this, sample.icon, { x: 0, y: 34, width: 196, height: 180 });
    const noteBg = this.add.rectangle(0, 151, 292, 39, color);
    const note = supplyText(this, 0, 151, sample.note, 18);
    note.setWordWrapWidth(272);
    const hitArea = this.add.zone(0, 0, SAMPLE_CARD_WIDTH, SAMPLE_CARD_HEIGHT).setInteractive({ useHandCursor: true });
    hitArea.on('pointerover', () => { if (this.getSampleOption(sample.key)) container.setScale(1.015); });
    hitArea.on('pointerout', () => container.setScale(1));
    hitArea.on('pointerup', () => { const option = this.getSampleOption(sample.key); if (option) this.selectOption(option); });
    container.add([frame, stage, headerBg, header, nameBg, name, shadow, icon, noteBg, note, hitArea]);
    this.roundLayer.add(container);
    this.sampleMetas.push({ key: sample.key, name: sample.name, icon: sample.icon, type: sample.type, x, y });
  }

  createQuestionPanel(question) {
    const panel = this.add.container(QUESTION_PANEL_X, QUESTION_PANEL_Y).setDepth(11);
    panel.add(supplyPanel(this, 0, 0, QUESTION_PANEL_WIDTH, QUESTION_PANEL_HEIGHT, { fill: 0x3b2547, edge: 0xb78336, highlight: 0xe0ba76 }));
    panel.add(this.add.rectangle(0, 15, 344, 312, 0xe8d9b2));
    panel.add(supplyHeading(this, 0, -160, `QUESTION ${this.currentRoundIndex + 1} / ${mixtureDetectiveGame.questions.length}`, 23, '#e2c6ee'));
    const prompt = supplyText(this, 0, -100, question.prompt, 26, '#292017');
    prompt.setWordWrapWidth(314);
    panel.add(prompt);
    this.roundLayer.add(panel);
    const count = question.options.length;
    const height = count > 2 ? 55 : 72;
    const startY = count > 2 ? 270 : 300;
    question.options.forEach((option, i) => this.createAnswerButton(option, i, QUESTION_PANEL_X, startY + i * (height + 10), 316, height));
    const submit = supplyControl(this, QUESTION_PANEL_X, 453, 'SUBMIT', () => this.submitSelectedOption(), { width: 210, height: 44, fill: 0x345b16, edge: 0x88b837 });
    this.roundLayer.add(submit);
    this.submitButton = submit;
    this.submitButtonMeta = { x: QUESTION_PANEL_X, y: 453 };
    submit.setAlpha(0.5);
  }

  createAnswerButton(option, index, x, y, width, height) {
    const container = this.add.container(x, y).setDepth(12);
    const graphics = this.add.graphics();
    const draw = (fill, stroke) => {
      graphics.clear();
      graphics.fillStyle(fill); graphics.fillRect(-width / 2, -height / 2, width, height);
      graphics.lineStyle(3, stroke); graphics.strokeRect(-width / 2, -height / 2, width, height);
      graphics.lineStyle(1, 0xfff4cf, 0.6); graphics.strokeRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8);
    };
    draw(0xded0af, 0x8d7953);
    const badge = supplyPanel(this, -width / 2 + 27, 0, 34, 36, { fill: option.sampleKey === 'B' ? 0x235b90 : 0x375b20, edge: 0x272718 });
    const badgeText = supplyText(this, -width / 2 + 27, 0, option.sampleKey ?? String.fromCharCode(65 + index), 23);
    const label = supplyText(this, -width / 2 + 54, 0, option.label, option.label.length > 38 ? 17 : 21, '#292017', 'left');
    label.setWordWrapWidth(width - 65);
    const zone = this.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => { if (this.phase === 'question') container.setScale(1.015); });
    zone.on('pointerout', () => container.setScale(1));
    zone.on('pointerup', () => this.selectOption(option));
    container.add([graphics, badge, badgeText, label, zone]);
    this.roundLayer.add(container);
    this.optionViews.push({ id: option.id, label: option.label, sampleKey: option.sampleKey ?? null, correct: option.correct, x, y, width, height, container, draw, text: label, zone });
  }

  selectOption(option) {
    if (this.phase !== 'question' || this.result || this.currentModal) return;
    this.selectedOptionId = option.id;
    this.optionViews.forEach(view => {
      const selected = view.id === option.id;
      view.draw(selected ? 0x3b6c1c : 0xded0af, selected ? 0xc3d76c : 0x8d7953);
      view.text.setColor(selected ? '#fff2c9' : '#292017');
    });
    this.submitButton?.setAlpha(1);
    this.updateTestState();
  }

  submitSelectedOption() {
    const option = this.getCurrentQuestion().options.find(item => item.id === this.selectedOptionId);
    if (option) this.answerOption(option);
  }

  answerOption(option) {
    if (this.phase !== 'question' || this.result || this.currentModal) {
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
    this.streak += 1;
    this.correctCount += 1;
    this.score += mixtureDetectiveGame.score.correctQuestion;
    this.showStatusMark(true);
    this.markOption(option.id, true);
    this.lockAnswerButtons();

    const sparkleTarget = this.sampleMetas.find((sample) => sample.key === option.sampleKey) ?? { x: QUESTION_PANEL_X, y: QUESTION_PANEL_Y };
    createSparkles(this, sparkleTarget.x, sparkleTarget.y);

    const question = this.getCurrentQuestion();
    this.feedback.setText(`CORRECT +${mixtureDetectiveGame.score.correctQuestion}`, question.feedback);
    this.createNextButton();
    this.updateHudText();
    this.updateTestState();
  }

  lockAnswerButtons() {
    this.optionViews.forEach(view => view.zone.disableInteractive());
    this.submitButton?.destroy(true);
    this.submitButton = null;
  }

  handleWrongAnswer(option) {
    this.mistakes += 1;
    this.streak = 0;
    this.updateHudText();
    this.showStatusMark(false);
    this.markOption(option.id, false);

    const question = this.getCurrentQuestion();
    this.feedback.setText(`TRY AGAIN (${this.mistakes}/${mixtureDetectiveGame.maxMistakes})`, question.hint);

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

    optionView.draw(correct ? 0x3b6c1c : 0xffd6d6, correct ? 0xc3d76c : 0xff5a66);
    optionView.text.setColor(correct ? '#fff2c9' : '#292017');
  }

  showStatusMark(correct) {
    this.statusMark?.destroy(true);
    const mark = this.add.container(750, 548).setDepth(12);
    mark.add(supplyGlyph(this, 0, 0, correct ? 'check' : 'cross', correct ? 0x93d442 : 0xff685c, 3));
    this.roundLayer?.add(mark);
    this.statusMark = mark;
  }

  createNextButton() {
    const label = this.currentRoundIndex === mixtureDetectiveGame.questions.length - 1 ? 'FINAL CASE' : 'NEXT';
    const button = supplyControl(this, QUESTION_PANEL_X, 453, label, () => this.advanceAfterFeedback(), { width: 210, height: 44, fill: 0x345b16, edge: 0x88b837 });
    this.roundLayer.add(button);
    this.nextButtonMeta = { x: QUESTION_PANEL_X, y: 453, label };
  }

  advanceAfterFeedback() {
    if (this.phase !== 'feedback' || this.result || this.currentModal) {
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
    this.submitButtonMeta = null;
    this.submitButton = null;

    this.createSampleCard(mixtureDetectiveGame.finalComparison.samples[0], 230, 300, 0x406d1e);
    this.createSampleCard(mixtureDetectiveGame.finalComparison.samples[1], 644, 300, 0x225683);
    this.createFinalPanel();
    this.feedback.setText('FINAL COMPARISON', 'Choose each type and its reason.');
    this.updateHudText();
    this.updateTestState();
  }

  createFinalPanel() {
    const panel = this.add.container(QUESTION_PANEL_X, QUESTION_PANEL_Y).setDepth(10);
    panel.add(supplyPanel(this, 0, 0, 370, 372, { fill: 0x3b2547, edge: 0xb78336 }));
    panel.add(supplyHeading(this, 0, -158, 'FINAL COMPARISON', 24, '#e2c6ee'));
    this.roundLayer.add(panel);
    const rows = [
      { slot: 'aType', label: 'SAMPLE A IS', choices: [['uniform', 'UNIFORM'], ['nonuniform', 'NON-UNIFORM']] },
      { slot: 'aReason', label: 'A BECAUSE', choices: [['looks-same', 'LOOKS SAME'], ['visible-parts', 'HAS PARTS']] },
      { slot: 'bType', label: 'SAMPLE B IS', choices: [['uniform', 'UNIFORM'], ['nonuniform', 'NON-UNIFORM']] },
      { slot: 'bReason', label: 'B BECAUSE', choices: [['looks-same', 'LOOKS SAME'], ['visible-parts', 'HAS PARTS']] },
    ];
    rows.forEach((row, i) => {
      const y = 196 + i * 72;
      panel.add(supplyText(this, -152, y - QUESTION_PANEL_Y - 23, row.label, 17, '#e2c6ee', 'left'));
      row.choices.forEach(([value, label], n) => this.roundLayer.add(this.createFinalChip(row.slot, value, label, QUESTION_PANEL_X - 80 + n * 160, y + 5).container));
    });
    const check = supplyControl(this, QUESTION_PANEL_X, 466, 'CHECK', () => this.checkFinalComparison(), { width: 210, height: 40, fill: 0x345b16, edge: 0x88b837 });
    this.roundLayer.add(check);
    this.checkButtonMeta = { x: QUESTION_PANEL_X, y: 466, label: 'CHECK' };
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
      if (this.currentModal || this.result) return;
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
    if (this.phase !== 'final' || this.result || this.currentModal) {
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
      this.feedback.setText(`CASE SOLVED +${mixtureDetectiveGame.score.finalComparison}`, mixtureDetectiveGame.finalComparison.hint);
      createSparkles(this, 1034, 382);
      this.updateHudText();
      this.finishGame(true);
      return;
    }

    this.mistakes += 1;
    this.streak = 0;
    this.updateHudText();
    this.feedback.setText(`TRY AGAIN (${this.mistakes}/${mixtureDetectiveGame.maxMistakes})`, mixtureDetectiveGame.finalComparison.hint);
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
    if (this.phase !== 'question' || this.result || this.currentModal) {
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
    this.hud?.setTime(Math.ceil(this.timeRemaining));
    this.hud?.setProgress();
    this.caseText?.setText(this.phase === 'final' ? 'FINAL CASE' : `CASE ${String(this.currentRoundIndex + 1).padStart(2, '0')}`);
    this.progressDots?.forEach(({ panel, label }, i) => {
      const done = i < this.correctCount;
      const active = i === this.currentRoundIndex && this.phase !== 'final';
      panel.clear();
      panel.fillStyle(done ? 0x375b20 : active ? 0xcba22a : 0x383835);
      panel.fillRect(-24, -24, 48, 48);
      panel.lineStyle(3, done ? 0x7bab3b : active ? 0xffd76a : 0x827b69);
      panel.strokeRect(-24, -24, 48, 48);
      label.setColor(active && !done ? '#292017' : '#e8dcc0');
    });
    this.progressText?.setText(`${this.correctCount} / ${mixtureDetectiveGame.questions.length} QUESTIONS SOLVED`);
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
    if (this.minigameHelpOpen) {
      closeMinigameHelp(this);
      return;
    }
    if (this.currentModal) {
      closeOpenModal(this);
      if (this.result) this.returnToQuarter();
      else this.updateTestState();
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

  buildTestState() {
    return {
      minigameHelpOpen: Boolean(this.minigameHelpOpen),
      minigameHelpButton: this.helpButtonMeta,
      minigameControls: this.navigationMeta,
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
      paused: false,
      hintsRemaining: 0,
      detectiveControls: this.controlsMeta,
      detectiveStreak: this.streak,
      detectiveSelectedOption: this.selectedOptionId,
      detectiveSubmitButton: this.submitButtonMeta,
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
