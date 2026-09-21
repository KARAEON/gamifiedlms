import Phaser from 'phaser';
import { inventMixWorkshopGame } from '../config/content.js';
import { getPostGameAssessmentLabel, startPostGameAssessment } from '../systems/assessmentFlow.js';
import { submitMinigameResult } from '../systems/resultSubmission.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import { createSparkles } from '../ui/minigameUi.js';
import { closeOpenModal, colors, createBackArrow, createPixelButton, showModal, textStyle } from '../ui/ui.js';

const INGREDIENT_CARD_WIDTH = 92;
const INGREDIENT_CARD_HEIGHT = 76;
const CHOICE_WIDTH = 208;
const CHOICE_HEIGHT = 42;
const MAX_SELECTED_INGREDIENTS = 3;

export default class InventMixScene extends Phaser.Scene {
  constructor() {
    super('InventMixScene');
  }

  init(data) {
    this.islandId = data.islandId ?? 'vulcan-caverns';
    this.quarterId = data.quarterId ?? 'q1';
    this.majorId = data.majorId ?? 'q1-major-1';
    this.lessonId = data.lessonId ?? inventMixWorkshopGame.lessonId;
    this.returnScrollY = Number.isFinite(data.returnScrollY) ? data.returnScrollY : 0;
    this.currentModal = null;
  }

  create() {
    this.missionIndex = 0;
    this.phase = 'choose';
    this.result = null;
    this.missionResult = null;
    this.selectedIngredients = [];
    this.selectedClassification = null;
    this.selectedAppearance = null;
    this.selectedUse = null;
    this.missionScore = 0;
    this.missionScores = Array(inventMixWorkshopGame.missions.length).fill(null);
    this.completedMissions = Array(inventMixWorkshopGame.missions.length).fill(null);
    this.customMissionNames = inventMixWorkshopGame.missions.map((mission) => mission.name);
    this.nameInputActive = false;
    this.nameFieldMeta = null;
    this.ingredientViews = [];
    this.classificationViews = [];
    this.appearanceViews = [];
    this.useViews = [];
    this.mixButtonMeta = null;
    this.presentButtonMeta = null;
    this.nextButtonMeta = null;
    this.retryButtonMeta = null;

    this.drawWorkshopBackground();
    this.createHud();
    this.setupKeyboardShortcuts();
    this.renderMission(true);

    markSceneReady('InventMixScene', this.buildTestState());
  }

  drawWorkshopBackground() {
    this.add.rectangle(0, 0, 1280, 720, 0x142523, 1).setOrigin(0);
    this.add.rectangle(0, 0, 1280, 132, 0x201628, 0.98).setOrigin(0);
    this.add.rectangle(0, 132, 1280, 7, colors.gold, 1).setOrigin(0);

    const wall = this.add.graphics();
    wall.lineStyle(2, 0x31504a, 0.45);
    for (let x = 0; x <= 1280; x += 64) {
      wall.lineBetween(x, 139, x, 700);
    }
    for (let y = 139; y <= 700; y += 56) {
      wall.lineBetween(0, y, 1280, y);
    }

    const bench = this.add.graphics();
    bench.fillStyle(0x4a342e, 1);
    bench.fillRoundedRect(0, 638, 1280, 82, 8);
    bench.lineStyle(4, 0x8a6048, 1);
    bench.lineBetween(0, 638, 1280, 638);
  }

  createHud() {
    const back = createBackArrow(this, () => this.returnToQuarter());
    back.setDepth(30);

    const badge = this.add.graphics();
    badge.setDepth(20);
    badge.fillStyle(0x3b2547, 1);
    badge.lineStyle(5, colors.gold, 1);
    badge.fillRoundedRect(118, 18, 218, 86, 8);
    badge.strokeRoundedRect(118, 18, 218, 86, 8);

    const day = this.add.text(228, 43, 'DAY 5', textStyle(28, '#ffd76a'));
    day.setOrigin(0.5);
    const mode = this.add.text(228, 78, 'INVENT-A-MIX WORKSHOP', textStyle(16, '#fff2c9'));
    mode.setOrigin(0.5);

    this.creationText = this.add.text(640, 30, 'CREATION 1', textStyle(24, '#fff2c9'));
    this.creationText.setOrigin(0.5);
    this.titleText = this.add.text(640, 74, 'ENERGY JUICE', textStyle(43, '#fff2c9'));
    this.titleText.setOrigin(0.5);
    this.titleText.setShadow(3, 3, '#000000', 0, false, true);
    this.promptText = this.add.text(640, 118, 'MISSION', textStyle(21, '#2f2a2a'));
    this.promptText.setOrigin(0.5);
    this.promptText.setBackgroundColor('#fff2c9');
    this.promptText.setPadding(24, 4, 24, 5);

    this.scoreText = this.add.text(1110, 42, 'CREATIVITY 000 / 135', textStyle(24, '#fff2c9'));
    this.scoreText.setOrigin(0.5);
    this.progressDots = this.add.graphics();

    [day, mode, this.creationText, this.titleText, this.promptText, this.scoreText].forEach((item) => item.setDepth(21));
  }

  renderMission(reset = false) {
    if (reset) {
      this.phase = 'choose';
      this.missionResult = null;
      this.missionScore = 0;
      this.selectedIngredients = [];
      this.selectedClassification = null;
      this.selectedAppearance = null;
      this.selectedUse = null;
      this.nameInputActive = false;
    }

    this.ingredientViews = [];
    this.classificationViews = [];
    this.appearanceViews = [];
    this.useViews = [];
    this.mixButtonMeta = null;
    this.presentButtonMeta = null;
    this.nextButtonMeta = null;
    this.retryButtonMeta = null;

    if (this.missionLayer) {
      this.missionLayer.destroy(true);
    }
    this.missionLayer = this.add.container(0, 0);
    this.missionLayer.setDepth(5);

    this.drawIngredientShelf();
    this.drawMixStation();
    this.drawDescriptionPanel();
    this.updateHud();
    this.updateTestState();
  }

  drawIngredientShelf() {
    const mission = this.getCurrentMission();
    const panel = this.add.graphics();
    panel.fillStyle(0x0b3651, 0.96);
    panel.lineStyle(4, 0x66e5ff, 1);
    panel.fillRoundedRect(18, 154, 470, 500, 8);
    panel.strokeRoundedRect(18, 154, 470, 500, 8);
    panel.fillStyle(0x2f2420, 0.9);
    panel.fillRoundedRect(38, 206, 430, 330, 6);

    const title = this.add.text(253, 181, '1. CHOOSE INGREDIENTS', textStyle(22, '#fff2c9'));
    title.setOrigin(0.5);
    const instruction = this.add.text(253, 610, `PICK UP TO ${MAX_SELECTED_INGREDIENTS} INGREDIENTS`, textStyle(17, '#fff2c9'));
    instruction.setOrigin(0.5);
    const selectedCount = this.add.text(253, 632, `SELECTED ${this.selectedIngredients.length} / ${MAX_SELECTED_INGREDIENTS}`, textStyle(16, '#66e5ff'));
    selectedCount.setOrigin(0.5);

    this.missionLayer.add([panel, title, instruction, selectedCount]);

    mission.ingredientOptions.forEach((ingredientId, index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);
      const x = 88 + column * 105;
      const y = 248 + row * 98;
      this.createIngredientCard(ingredientId, x, y);
    });
  }

  createIngredientCard(ingredientId, x, y) {
    const ingredient = this.getIngredient(ingredientId);
    const mission = this.getCurrentMission();
    const container = this.add.container(x, y);
    container.setDepth(8);

    const graphics = this.add.graphics();
    const icon = this.add.graphics();
    icon.setPosition(0, -12);
    const label = this.add.text(0, 23, ingredient.label.toUpperCase(), textStyle(13, '#fff2c9'));
    label.setOrigin(0.5);
    label.setWordWrapWidth(84);
    label.setLineSpacing(-5);
    const count = this.add.text(34, 30, this.selectedIngredients.includes(ingredientId) ? 'x1' : 'x0', textStyle(13, '#fff2c9'));
    count.setOrigin(0.5);

    const zone = this.add.zone(0, 0, INGREDIENT_CARD_WIDTH, INGREDIENT_CARD_HEIGHT).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      if (this.phase !== 'result') {
        container.setScale(1.05);
      }
    });
    zone.on('pointerout', () => container.setScale(1));
    zone.on('pointerup', () => this.toggleIngredient(ingredientId));

    container.add([graphics, icon, label, count, zone]);
    this.missionLayer.add(container);

    const view = {
      id: ingredientId,
      label: ingredient.label,
      x,
      y,
      correct: mission.correctIngredients.includes(ingredientId),
      selected: this.selectedIngredients.includes(ingredientId),
      container,
      graphics,
      icon,
    };
    this.ingredientViews.push(view);
    this.drawIngredientCard(view);
  }

  drawIngredientCard(view) {
    const selected = this.selectedIngredients.includes(view.id);
    view.graphics.clear();
    view.graphics.fillStyle(selected ? 0x2e8c00 : 0x1b1b1b, 1);
    view.graphics.lineStyle(3, selected ? 0x9fe870 : 0x8a6048, 1);
    view.graphics.fillRoundedRect(-INGREDIENT_CARD_WIDTH / 2, -INGREDIENT_CARD_HEIGHT / 2, INGREDIENT_CARD_WIDTH, INGREDIENT_CARD_HEIGHT, 7);
    view.graphics.strokeRoundedRect(-INGREDIENT_CARD_WIDTH / 2, -INGREDIENT_CARD_HEIGHT / 2, INGREDIENT_CARD_WIDTH, INGREDIENT_CARD_HEIGHT, 7);
    if (selected) {
      view.graphics.fillStyle(0x58cc02, 1);
      view.graphics.fillRoundedRect(-37, 23, 24, 18, 4);
    }
    this.drawIngredientIcon(view.icon, this.getIngredient(view.id).icon);
  }

  drawMixStation() {
    const mission = this.getCurrentMission();
    const panel = this.add.graphics();
    panel.fillStyle(0x0b3651, 0.96);
    panel.lineStyle(4, 0x66e5ff, 1);
    panel.fillRoundedRect(508, 154, 330, 500, 8);
    panel.strokeRoundedRect(508, 154, 330, 500, 8);
    panel.fillStyle(0xcceeff, 1);
    panel.fillRoundedRect(548, 214, 250, 184, 6);
    panel.lineStyle(4, 0x2f2a2a, 1);
    panel.strokeRoundedRect(548, 214, 250, 184, 6);

    const title = this.add.text(673, 181, '2. MIX YOUR INGREDIENTS', textStyle(22, '#fff2c9'));
    title.setOrigin(0.5);
    const icon = this.add.graphics();
    icon.setPosition(648, 318);
    icon.setScale(2.15);
    this.drawMixturePreviewIcon(icon, mission);

    const spoon = this.add.graphics();
    spoon.lineStyle(7, 0x2f2a2a, 1);
    spoon.lineBetween(706, 226, 706, 352);
    spoon.fillStyle(0x2278c9, 1);
    spoon.fillRoundedRect(692, 221, 28, 44, 5);

    const statusBox = this.add.graphics();
    statusBox.fillStyle(0x132e24, 1);
    statusBox.lineStyle(4, 0x58cc02, 1);
    statusBox.fillRoundedRect(532, 420, 282, 76, 8);
    statusBox.strokeRoundedRect(532, 420, 282, 76, 8);
    const status = this.phase === 'choose'
      ? 'SELECT INGREDIENTS, THEN MIX.'
      : mission.mixedMessage.toUpperCase();
    const statusText = this.add.text(673, 457, status, textStyle(20, this.phase === 'choose' ? '#ffd76a' : '#9fe870'));
    statusText.setOrigin(0.5);
    statusText.setWordWrapWidth(252);
    statusText.setLineSpacing(-4);

    const presentation = this.add.text(536, 518, this.buildStationSummary(), textStyle(17, '#fff2c9', 'left'));
    presentation.setWordWrapWidth(274);
    presentation.setLineSpacing(-3);

    const mix = createPixelButton(this, 673, 616, 'MIX', () => this.mixIngredients(), {
      width: 154,
      height: 50,
      fontSize: 23,
      textColor: '#fff2c9',
      fill: this.selectedIngredients.length > 0 && this.phase !== 'result' ? 0x58cc02 : 0x585858,
      hoverFill: 0x6ee617,
      stroke: 0x2e8c00,
    });
    mix.setDepth(12);
    this.mixButtonMeta = { x: 673, y: 616, label: 'MIX' };

    this.missionLayer.add([panel, title, icon, spoon, statusBox, statusText, presentation, mix]);
  }

  drawDescriptionPanel() {
    const mission = this.getCurrentMission();
    const panel = this.add.graphics();
    panel.fillStyle(0x3b2547, 0.98);
    panel.lineStyle(5, colors.gold, 1);
    panel.fillRoundedRect(858, 154, 404, 500, 8);
    panel.strokeRoundedRect(858, 154, 404, 500, 8);
    panel.fillStyle(0xfff2c9, 1);
    panel.fillRoundedRect(880, 202, 360, 426, 7);

    const title = this.add.text(1060, 181, '3. DESCRIBE YOUR MIXTURE', textStyle(22, '#fff2c9'));
    title.setOrigin(0.5);
    const nameLabel = this.add.text(906, 218, 'A. NAME YOUR MIXTURE', textStyle(17, '#2f2a2a', 'left'));
    const nameBox = this.add.rectangle(1060, 264, 312, 44, this.nameInputActive ? 0xe7ffd6 : 0xffffff, 0.86);
    nameBox.setStrokeStyle(3, 0x9e6b47, 1);
    nameBox.setInteractive({ useHandCursor: true });
    nameBox.on('pointerup', () => this.focusNameInput());
    const nameValue = this.getMissionName();
    this.nameText = this.add.text(926, 264, nameValue || 'TYPE A NAME', textStyle(20, nameValue ? '#2f2a2a' : '#8a6a50', 'left'));
    this.nameText.setOrigin(0, 0.5);
    this.nameText.setWordWrapWidth(262);
    this.nameCursor = this.add.text(926 + Math.min(260, nameValue.length * 12), 264, this.nameInputActive ? '|' : '', textStyle(20, '#2f2a2a', 'left'));
    this.nameCursor.setOrigin(0, 0.5);
    this.nameFieldMeta = { x: 1060, y: 264, width: 312, height: 44 };

    this.missionLayer.add([panel, title, nameLabel, nameBox, this.nameText, this.nameCursor]);

    if (this.phase === 'choose') {
      const locked = this.add.text(1060, 374, 'MIX YOUR INGREDIENTS FIRST.\nTHEN DESCRIBE WHAT YOU CREATED.', textStyle(24, '#2f2a2a'));
      locked.setOrigin(0.5);
      locked.setWordWrapWidth(300);
      locked.setLineSpacing(-3);
      this.missionLayer.add(locked);
      return;
    }

    const classLabel = this.add.text(906, 314, 'B. IS IT UNIFORM OR NON-UNIFORM?', textStyle(17, '#2f2a2a', 'left'));
    this.missionLayer.add(classLabel);
    inventMixWorkshopGame.classifications.forEach((option, index) => {
      this.createChoiceButton('classification', option, 972 + index * 176, 352, 156, 42);
    });

    if (this.selectedClassification) {
      const appearanceLabel = this.add.text(906, 400, 'C. DESCRIBE ITS APPEARANCE', textStyle(17, '#2f2a2a', 'left'));
      this.missionLayer.add(appearanceLabel);
      this.getAppearanceChoices().forEach((option, index) => {
        this.createChoiceButton('appearance', option, 936 + index * 124, 442, 112, 52);
      });
    }

    if (this.selectedAppearance) {
      const useLabel = this.add.text(906, 502, 'D. WHAT IS ITS USE?', textStyle(17, '#2f2a2a', 'left'));
      this.missionLayer.add(useLabel);
      this.getUseChoices().forEach((option, index) => {
        this.createChoiceButton('use', option, 936 + index * 124, 546, 112, 56);
      });
    }

    const present = createPixelButton(this, 1060, 604, 'PRESENT', () => this.presentInvention(), {
      width: 214,
      height: 52,
      fontSize: 22,
      textColor: '#fff2c9',
      fill: this.canPresent() ? 0x58cc02 : 0x585858,
      hoverFill: 0x6ee617,
      stroke: 0x2e8c00,
    });
    present.setDepth(12);
    this.missionLayer.add(present);
    this.presentButtonMeta = this.phase === 'result' ? null : { x: 1060, y: 604, label: 'PRESENT' };
  }

  createChoiceButton(kind, option, x, y, width = CHOICE_WIDTH, height = CHOICE_HEIGHT) {
    const selected = this.getSelectedChoice(kind) === option.id;
    const correct = this.isCorrectChoice(kind, option.id);
    const container = this.add.container(x, y);
    container.setDepth(9);
    const graphics = this.add.graphics();
    graphics.fillStyle(selected ? 0xe7ffd6 : 0xfff2c9, 1);
    graphics.lineStyle(3, selected ? 0x58cc02 : 0x9e6b47, 1);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);

    const labelSize = width < 120 ? 11 : width < 170 ? 13 : 16;
    const label = this.add.text(0, -1, option.label.toUpperCase(), textStyle(labelSize, '#2f2a2a'));
    label.setOrigin(0.5);
    label.setWordWrapWidth(width - 12);
    label.setLineSpacing(-4);
    const zone = this.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      if (this.phase !== 'result') {
        container.setScale(1.04);
      }
    });
    zone.on('pointerout', () => container.setScale(1));
    zone.on('pointerup', () => this.selectChoice(kind, option.id));

    container.add([graphics, label, zone]);
    this.missionLayer.add(container);

    const meta = {
      id: option.id,
      label: option.label,
      x,
      y,
      correct,
      selected,
    };
    if (kind === 'classification') {
      this.classificationViews.push(meta);
    } else if (kind === 'appearance') {
      this.appearanceViews.push(meta);
    } else {
      this.useViews.push(meta);
    }
  }

  drawBottomPanels() {
    this.drawMixPreviewPanel();
    this.drawPresentationPanel();
    this.drawResultPanel();
  }

  drawMixPreviewPanel() {
    const mission = this.getCurrentMission();
    const panel = this.add.graphics();
    panel.fillStyle(0x0b3651, 0.96);
    panel.lineStyle(4, 0x66e5ff, 1);
    panel.fillRoundedRect(18, 526, 310, 136, 8);
    panel.strokeRoundedRect(18, 526, 310, 136, 8);
    const title = this.add.text(52, 548, 'MIX PREVIEW', textStyle(20, '#fff2c9', 'left'));
    const icon = this.add.graphics();
    icon.setPosition(88, 604);
    icon.setScale(1.04);
    this.drawMixturePreviewIcon(icon, mission);
    const preview = this.phase === 'choose'
      ? 'Choose ingredients to see your mixture.'
      : mission.preview;
    const text = this.add.text(150, 588, preview, textStyle(18, this.phase === 'choose' ? '#ffd76a' : '#fff2c9', 'left'));
    text.setWordWrapWidth(154);
    text.setLineSpacing(-4);
    this.missionLayer.add([panel, title, icon, text]);
  }

  drawPresentationPanel() {
    const panel = this.add.graphics();
    panel.fillStyle(0x0b3651, 0.96);
    panel.lineStyle(4, 0x66e5ff, 1);
    panel.fillRoundedRect(348, 526, 430, 136, 8);
    panel.strokeRoundedRect(348, 526, 430, 136, 8);
    const title = this.add.text(563, 548, '4. PRESENT YOUR INVENTION', textStyle(20, '#fff2c9'));
    title.setOrigin(0.5);
    const bubble = this.add.graphics();
    bubble.fillStyle(0xfff2c9, 1);
    bubble.lineStyle(3, 0x9e6b47, 1);
    bubble.fillRoundedRect(476, 568, 282, 82, 7);
    bubble.strokeRoundedRect(476, 568, 282, 82, 7);
    const text = this.add.text(492, 580, this.buildPresentationText(), textStyle(15, '#2f2a2a', 'left'));
    text.setWordWrapWidth(250);
    text.setLineSpacing(-5);
    const helper = this.add.graphics();
    helper.fillStyle(0xffd8b8, 1);
    helper.fillCircle(420, 605, 31);
    helper.fillStyle(0x2f2a2a, 1);
    helper.fillRoundedRect(389, 631, 62, 34, 8);
    helper.fillCircle(410, 600, 3);
    helper.fillCircle(430, 600, 3);
    this.missionLayer.add([panel, title, helper, bubble, text]);
  }

  drawResultPanel() {
    const panel = this.add.graphics();
    panel.fillStyle(0x0b3651, 0.96);
    panel.lineStyle(4, colors.gold, 1);
    panel.fillRoundedRect(798, 526, 462, 136, 8);
    panel.strokeRoundedRect(798, 526, 462, 136, 8);
    const title = this.add.text(1029, 548, 'RESULT & REWARDS', textStyle(20, '#ffd76a'));
    title.setOrigin(0.5);

    const resultTitle = this.phase === 'result'
      ? this.getResultTitle()
      : 'READY TO INVENT';
    const resultBody = this.phase === 'result'
      ? this.getResultBody()
      : 'Mix, describe, and present your creation.';
    const resultText = this.add.text(832, 585, resultTitle, textStyle(25, this.missionResult === 'perfect' ? '#9fe870' : '#ffd76a', 'left'));
    const body = this.add.text(832, 617, resultBody, textStyle(17, '#fff2c9', 'left'));
    body.setWordWrapWidth(270);
    body.setLineSpacing(-4);
    this.missionLayer.add([panel, title, resultText, body]);

    const present = createPixelButton(this, 1116, 617, this.phase === 'result' ? 'DONE' : 'PRESENT', () => this.presentInvention(), {
      width: 172,
      height: 54,
      fontSize: 22,
      textColor: '#fff2c9',
      fill: this.canPresent() ? 0x58cc02 : 0x585858,
      hoverFill: 0x6ee617,
      stroke: 0x2e8c00,
    });
    present.setDepth(12);
    this.missionLayer.add(present);
    this.presentButtonMeta = this.phase === 'result' ? null : { x: 1116, y: 617, label: 'PRESENT' };

    if (this.phase === 'result') {
      this.drawResultActionButtons();
    }
  }

  drawResultActionButtons() {
    const isFinalMission = this.missionIndex === inventMixWorkshopGame.missions.length - 1;
    const next = createPixelButton(this, 1116, 688, isFinalMission ? 'FINISH' : 'NEXT MISSION', () => this.advanceMission(), {
      width: 220,
      height: 50,
      fontSize: 22,
      textColor: '#fff2c9',
      fill: 0x58cc02,
      hoverFill: 0x6ee617,
      stroke: 0x2e8c00,
    });
    next.setDepth(12);
    this.missionLayer.add(next);
    this.nextButtonMeta = { x: 1116, y: 688, label: isFinalMission ? 'FINISH' : 'NEXT MISSION' };

    if (this.missionResult !== 'perfect') {
      const retry = createPixelButton(this, 908, 688, 'RETRY', () => this.retryMission(), {
        width: 154,
        height: 50,
        fontSize: 22,
        textColor: '#2f2a2a',
        fill: colors.gold,
        hoverFill: 0xffe493,
        stroke: 0x9e6b47,
      });
      retry.setDepth(12);
      this.missionLayer.add(retry);
      this.retryButtonMeta = { x: 908, y: 688, label: 'RETRY' };
    }
  }

  toggleIngredient(ingredientId) {
    if (this.phase === 'result') {
      return;
    }

    this.nameInputActive = false;
    if (this.selectedIngredients.includes(ingredientId)) {
      this.selectedIngredients = this.selectedIngredients.filter((id) => id !== ingredientId);
    } else if (this.selectedIngredients.length >= MAX_SELECTED_INGREDIENTS) {
      this.flashWarning(`ONLY ${MAX_SELECTED_INGREDIENTS} INGREDIENTS CAN BE USED.`);
      return;
    } else {
      this.selectedIngredients.push(ingredientId);
    }

    if (this.phase === 'mixed') {
      this.phase = 'choose';
    }
    this.renderMission(false);
  }

  mixIngredients() {
    if (this.phase === 'result') {
      return;
    }

    if (this.selectedIngredients.length === 0) {
      this.flashWarning('CHOOSE AT LEAST ONE INGREDIENT FIRST.');
      return;
    }

    this.nameInputActive = false;
    this.phase = 'mixed';
    createSparkles(this, 648, 318);
    this.renderMission(false);
  }

  selectChoice(kind, value) {
    if (this.phase === 'result') {
      return;
    }

    this.nameInputActive = false;
    if (kind === 'classification') {
      this.selectedClassification = value;
      this.selectedAppearance = null;
      this.selectedUse = null;
    } else if (kind === 'appearance') {
      this.selectedAppearance = value;
      this.selectedUse = null;
    } else {
      this.selectedUse = value;
    }

    this.renderMission(false);
  }

  presentInvention() {
    if (this.phase === 'result') {
      return;
    }

    if (!this.canPresent()) {
      this.flashWarning('MIX FIRST, THEN COMPLETE TYPE, APPEARANCE, AND USE.');
      return;
    }

    this.missionScore = this.calculateMissionScore();
    this.missionScores[this.missionIndex] = this.missionScore;
    this.completedMissions[this.missionIndex] = {
      mission_id: this.getCurrentMission().id,
      custom_name: this.getMissionName(),
      selected_ingredients: [...this.selectedIngredients],
      classification: this.selectedClassification,
      appearance: this.selectedAppearance,
      use: this.selectedUse,
    };
    this.missionResult = this.missionScore === inventMixWorkshopGame.missionMaxScore
      ? 'perfect'
      : this.missionScore > 0
        ? 'partial'
        : 'retry';
    this.phase = 'result';
    createSparkles(this, 1060, 604);
    this.renderMission(false);
    this.showMissionResultModal();
  }

  retryMission() {
    closeOpenModal(this);
    this.missionScores[this.missionIndex] = null;
    this.completedMissions[this.missionIndex] = null;
    this.renderMission(true);
  }

  advanceMission() {
    if (this.phase !== 'result') {
      return;
    }

    closeOpenModal(this);
    if (this.missionIndex >= inventMixWorkshopGame.missions.length - 1) {
      this.showFinalResult();
      return;
    }

    this.missionIndex += 1;
    this.renderMission(true);
  }

  showMissionResultModal() {
    const isFinalMission = this.missionIndex === inventMixWorkshopGame.missions.length - 1;
    const nextLabel = isFinalMission ? 'FINISH' : 'NEXT MISSION';
    const hasRetry = this.missionResult !== 'perfect';
    this.nextButtonMeta = {
      x: hasRetry ? 745 : 640,
      y: 467,
      label: nextLabel,
    };
    this.retryButtonMeta = hasRetry ? { x: 535, y: 467, label: 'RETRY' } : null;

    showModal(this, {
      name: 'invent-result',
      title: this.getResultTitle(),
      width: 640,
      height: 350,
      titleSize: 34,
      body: (_overlay, { panelX, panelY }) => {
        const score = this.add.text(panelX, panelY - 48, `CREATIVITY +${this.missionScore}`, textStyle(30, '#66e5ff'));
        score.setOrigin(0.5);
        const body = this.add.text(panelX, panelY + 2, this.getResultBody(), textStyle(23, '#fff2c9'));
        body.setOrigin(0.5);
        body.setWordWrapWidth(500);
        body.setLineSpacing(-2);
        const name = this.add.text(panelX, panelY + 58, this.getMissionName().toUpperCase(), textStyle(22, '#ffd76a'));
        name.setOrigin(0.5);
        name.setWordWrapWidth(500);
        return [score, body, name];
      },
      buttons: hasRetry
        ? [
            {
              label: 'RETRY',
              width: 180,
              action: () => this.retryMission(),
            },
            {
              label: nextLabel,
              width: 220,
              action: () => this.advanceMission(),
            },
          ]
        : [
            {
              label: nextLabel,
              width: 220,
              action: () => this.advanceMission(),
            },
        ],
    });
    this.updateTestState();
  }

  showFinalResult() {
    const totalScore = this.getTotalScore();
    const won = totalScore >= inventMixWorkshopGame.winScore;
    this.result = won ? 'win' : 'lose';
    this.phase = 'final';
    this.updateTestState();
    this.submitResult();

    showModal(this, {
      name: won ? 'result-win' : 'result-lose',
      title: won ? 'MASTER MIXTURE INVENTOR' : 'KEEP INVENTING',
      height: 370,
      body: (_overlay, { panelX, panelY }) => {
        const scoreText = this.add.text(panelX, panelY - 46, `CREATIVITY ${totalScore} / ${inventMixWorkshopGame.maxScore}`, textStyle(31, '#66e5ff'));
        scoreText.setOrigin(0.5);
        const message = this.add.text(
          panelX,
          panelY + 5,
          won ? 'YOU CREATED AND EXPLAINED ALL MIXTURES.' : 'RETRY MISSIONS TO REACH 120 CREATIVITY.',
          textStyle(23, '#fff2c9'),
        );
        message.setOrigin(0.5);
        message.setWordWrapWidth(440);
        const missions = this.add.text(panelX, panelY + 58, `MISSIONS: ${this.missionScores.map((score) => score ?? 0).join(' / ')}`, textStyle(20, '#ffd76a'));
        missions.setOrigin(0.5);
        return [scoreText, message, missions];
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

  flashWarning(message) {
    if (this.warningText) {
      this.warningText.destroy();
    }

    this.warningText = this.add.text(640, 698, message, textStyle(22, '#ffd76a'));
    this.warningText.setOrigin(0.5);
    this.warningText.setDepth(900);
    this.warningText.setShadow(2, 2, '#000000', 0, false, true);
    this.tweens.add({
      targets: this.warningText,
      alpha: 0,
      y: 682,
      duration: 1100,
      onComplete: () => {
        this.warningText?.destroy();
        this.warningText = null;
      },
    });
  }

  calculateMissionScore() {
    const mission = this.getCurrentMission();
    let score = 0;
    if (this.selectedClassification === mission.type) {
      score += inventMixWorkshopGame.score.classification;
    }
    if (this.selectedAppearance === mission.appearance) {
      score += inventMixWorkshopGame.score.appearance;
    }
    if (this.selectedUse === mission.use) {
      score += inventMixWorkshopGame.score.use;
    }
    if (this.hasExactIngredients()) {
      score += inventMixWorkshopGame.score.validMixture;
    }
    if (this.phase === 'mixed' && this.selectedClassification && this.selectedAppearance && this.selectedUse) {
      score += inventMixWorkshopGame.score.creativity;
    }
    return score;
  }

  canPresent() {
    return this.phase === 'mixed' && this.selectedClassification && this.selectedAppearance && this.selectedUse;
  }

  hasExactIngredients() {
    const mission = this.getCurrentMission();
    return this.selectedIngredients.length === mission.correctIngredients.length
      && mission.correctIngredients.every((id) => this.selectedIngredients.includes(id));
  }

  isCorrectChoice(kind, value) {
    const mission = this.getCurrentMission();
    if (kind === 'classification') {
      return value === mission.type;
    }
    if (kind === 'appearance') {
      return value === mission.appearance;
    }
    return value === mission.use;
  }

  getSelectedChoice(kind) {
    if (kind === 'classification') {
      return this.selectedClassification;
    }
    if (kind === 'appearance') {
      return this.selectedAppearance;
    }
    return this.selectedUse;
  }

  getAppearanceChoices() {
    const mission = this.getCurrentMission();
    const ids = [mission.appearance, mission.secondaryAppearance, 'same-throughout', 'visible-parts', 'separates-layers'];
    return [...new Set(ids)]
      .filter(Boolean)
      .slice(0, 3)
      .map((id) => inventMixWorkshopGame.appearances.find((option) => option.id === id));
  }

  getUseChoices() {
    const mission = this.getCurrentMission();
    const ids = [mission.use, 'beverage-energy', 'snack-energy', 'art-demo', 'cleaning'];
    return [...new Set(ids)]
      .filter(Boolean)
      .slice(0, 3)
      .map((id) => inventMixWorkshopGame.uses.find((option) => option.id === id));
  }

  getCurrentMission() {
    return inventMixWorkshopGame.missions[this.missionIndex];
  }

  getMissionName() {
    return this.customMissionNames[this.missionIndex] ?? this.getCurrentMission().name;
  }

  getDisplayMissionName() {
    return this.getMissionName().trim() || 'Untitled Mixture';
  }

  getPresentationMissionName() {
    return this.getMissionName().trim() || 'my mixture';
  }

  setMissionName(value) {
    const cleaned = value.replace(/\s+/g, ' ').slice(0, 24);
    this.customMissionNames[this.missionIndex] = cleaned.trimStart();
  }

  focusNameInput() {
    if (this.phase === 'result' || this.currentModal) {
      return;
    }

    this.nameInputActive = true;
    this.refreshNameField();
    this.updateTestState();
  }

  blurNameInput() {
    this.nameInputActive = false;
    this.refreshNameField();
    this.updateTestState();
  }

  refreshNameField() {
    if (!this.nameText || !this.nameCursor) {
      return;
    }

    const name = this.getMissionName();
    this.nameText.setText(name || 'TYPE A NAME');
    this.nameText.setColor(name ? '#2f2a2a' : '#8a6a50');
    this.nameCursor.setText(this.nameInputActive ? '|' : '');
    this.nameCursor.setX(926 + Math.min(260, name.length * 12));
  }

  handleNameKey(event) {
    if (!this.nameInputActive || this.currentModal) {
      return false;
    }

    if (event.key === 'Enter' || event.key === 'Escape') {
      this.blurNameInput();
      return true;
    }

    if (event.key === 'Backspace') {
      const current = this.getMissionName();
      this.setMissionName(current.slice(0, -1));
      this.refreshNameField();
      this.updateTestState();
      return true;
    }

    if (event.key?.length === 1 && /^[a-z0-9 '&-]$/i.test(event.key)) {
      this.setMissionName(`${this.getMissionName()}${event.key}`);
      this.refreshNameField();
      this.updateTestState();
      return true;
    }

    return false;
  }

  getIngredient(ingredientId) {
    return inventMixWorkshopGame.ingredients.find((ingredient) => ingredient.id === ingredientId);
  }

  getTotalScore() {
    return this.missionScores.reduce((total, score) => total + (score ?? 0), 0);
  }

  getResultTitle() {
    if (this.missionResult === 'perfect') {
      return 'EXCELLENT CREATION!';
    }
    if (this.missionResult === 'partial') {
      return 'GOOD START!';
    }
    return 'TRY AGAIN!';
  }

  getResultBody() {
    if (this.missionResult === 'perfect') {
      return 'Your mixture is correct and well explained.';
    }

    const missing = [];
    const mission = this.getCurrentMission();
    if (!this.hasExactIngredients()) {
      missing.push('ingredients');
    }
    if (this.selectedClassification !== mission.type) {
      missing.push('classification');
    }
    if (this.selectedAppearance !== mission.appearance) {
      missing.push('appearance');
    }
    if (this.selectedUse !== mission.use) {
      missing.push('use');
    }

    return `Review: ${missing.join(', ') || 'presentation'}.`;
  }

  buildPresentationText() {
    const mission = this.getCurrentMission();
    const ingredients = this.selectedIngredients.length > 0
      ? this.selectedIngredients.map((id) => this.getIngredient(id).label.toLowerCase()).join(', ')
      : '_____';
    const type = this.selectedClassification
      ? inventMixWorkshopGame.classifications.find((option) => option.id === this.selectedClassification).label.toLowerCase()
      : '_____';
    const appearance = this.selectedAppearance
      ? inventMixWorkshopGame.appearances.find((option) => option.id === this.selectedAppearance).label.toLowerCase()
      : '_____';
    const use = this.selectedUse
      ? inventMixWorkshopGame.uses.find((option) => option.id === this.selectedUse).label.toLowerCase()
      : '_____';
    return `I created ${this.getPresentationMissionName()} by mixing ${ingredients}. It is a ${type} mixture because it ${appearance} It can be used as ${use}`;
  }

  buildStationSummary() {
    const ingredients = this.selectedIngredients.length > 0
      ? this.selectedIngredients.map((id) => this.getIngredient(id).label).join(', ')
      : 'No ingredients selected yet.';
    if (this.phase === 'choose') {
      return `Selected: ${ingredients}\n\nPick ingredients, then press MIX.`;
    }

    const type = this.selectedClassification
      ? inventMixWorkshopGame.classifications.find((option) => option.id === this.selectedClassification).label
      : 'choose a type';
    const appearance = this.selectedAppearance
      ? inventMixWorkshopGame.appearances.find((option) => option.id === this.selectedAppearance).label
      : 'choose an appearance';
    return `Selected: ${ingredients}\nType: ${type}\nLooks: ${appearance}`;
  }

  updateHud() {
    const mission = this.getCurrentMission();
    this.creationText.setText(`CREATION ${mission.creationNumber}`);
    this.titleText.setText(this.getDisplayMissionName().toUpperCase());
    this.promptText.setText(`MISSION: ${mission.prompt.toUpperCase()}`);
    this.scoreText.setText(`CREATIVITY ${String(this.getTotalScore()).padStart(3, '0')} / ${inventMixWorkshopGame.maxScore}`);
    this.drawProgressDots();
  }

  drawProgressDots() {
    this.progressDots.clear();
    this.progressDots.setDepth(21);
    const startX = 1042;
    for (let index = 0; index < inventMixWorkshopGame.missions.length; index += 1) {
      const filled = this.missionScores[index] !== null;
      const active = index === this.missionIndex;
      this.progressDots.fillStyle(filled ? 0x58cc02 : active ? colors.gold : 0x4b4b4b, 1);
      this.progressDots.fillCircle(startX + index * 38, 82, active ? 13 : 10);
      this.progressDots.lineStyle(3, 0x1b1b1b, 1);
      this.progressDots.strokeCircle(startX + index * 38, 82, active ? 13 : 10);
    }
  }

  drawMixturePreviewIcon(graphics, mission) {
    graphics.clear();
    if (mission.id === 'trail-snack-mix') {
      graphics.fillStyle(0x8a6048, 1);
      graphics.fillEllipse(0, 26, 104, 30);
      graphics.fillStyle(0xffefb5, 1);
      graphics.fillEllipse(0, 14, 96, 26);
      graphics.fillStyle(0xd99a3d, 1);
      for (let index = 0; index < 10; index += 1) {
        const angle = (Math.PI * 2 * index) / 10;
        graphics.fillCircle(Math.cos(angle) * 32, 8 + Math.sin(angle) * 14, 6);
      }
      graphics.fillStyle(0x9b6bd3, 1);
      graphics.fillCircle(-18, 2, 6);
      graphics.fillCircle(22, 0, 6);
      graphics.fillStyle(0xff5a66, 1);
      graphics.fillCircle(4, 20, 6);
      return;
    }

    graphics.lineStyle(5, 0x2f2a2a, 1);
    graphics.strokeRoundedRect(-34, -44, 68, 88, 8);
    if (mission.id === 'color-paint-mix') {
      graphics.fillStyle(0xffd76a, 0.95);
      graphics.fillRoundedRect(-28, -2, 56, 22, 4);
      graphics.fillStyle(0x2278c9, 0.85);
      graphics.fillRoundedRect(-28, 20, 56, 20, 4);
      graphics.fillStyle(0xff5a66, 1);
      graphics.fillCircle(-15, 24, 4);
      graphics.fillCircle(7, 31, 4);
      return;
    }

    graphics.fillStyle(0xff9b42, 0.95);
    graphics.fillRoundedRect(-28, -4, 56, 42, 5);
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(-8, 9, 3);
    graphics.fillCircle(12, 23, 3);
  }

  drawIngredientIcon(graphics, icon) {
    graphics.clear();
    graphics.lineStyle(3, 0x2f2a2a, 1);

    if (icon === 'water' || icon === 'alcohol') {
      graphics.fillStyle(icon === 'water' ? 0x66e5ff : 0xaeefff, 1);
      graphics.fillTriangle(0, -26, -17, 10, 17, 10);
      graphics.fillCircle(0, 12, 17);
      graphics.strokeCircle(0, 12, 17);
      return;
    }

    if (icon === 'powdered-juice') {
      graphics.fillStyle(0xff9b42, 1);
      graphics.fillRoundedRect(-19, -25, 38, 42, 4);
      graphics.fillStyle(0xfff2c9, 1);
      graphics.fillRoundedRect(-13, -9, 26, 13, 3);
      graphics.strokeRoundedRect(-19, -25, 38, 42, 4);
      return;
    }

    if (icon === 'milk') {
      graphics.fillStyle(0xffffff, 1);
      graphics.fillRoundedRect(-16, -26, 32, 48, 4);
      graphics.fillStyle(0x66e5ff, 0.75);
      graphics.fillRect(-11, -4, 22, 14);
      graphics.strokeRoundedRect(-16, -26, 32, 48, 4);
      return;
    }

    if (icon === 'sugar' || icon === 'salt' || icon === 'cornstarch') {
      graphics.fillStyle(icon === 'sugar' ? 0xf7f7ff : icon === 'salt' ? 0xffffff : 0xfff2c9, 1);
      graphics.fillRoundedRect(-18, -18, 36, 34, 5);
      graphics.strokeRoundedRect(-18, -18, 36, 34, 5);
      graphics.fillStyle(0xd8d8d8, 1);
      graphics.fillCircle(-6, 2, 3);
      graphics.fillCircle(7, 8, 3);
      return;
    }

    if (icon === 'nuts') {
      graphics.fillStyle(0xd99a3d, 1);
      graphics.fillCircle(-12, 3, 11);
      graphics.fillCircle(2, -8, 11);
      graphics.fillCircle(14, 6, 11);
      return;
    }

    if (icon === 'raisins') {
      graphics.fillStyle(0x6e2b8f, 1);
      graphics.fillCircle(-13, -3, 9);
      graphics.fillCircle(1, 4, 9);
      graphics.fillCircle(15, -5, 9);
      return;
    }

    if (icon === 'candy') {
      graphics.fillStyle(0xff5a66, 1);
      graphics.fillCircle(-16, 0, 8);
      graphics.fillStyle(0xffd76a, 1);
      graphics.fillCircle(0, -3, 9);
      graphics.fillStyle(0x66e5ff, 1);
      graphics.fillCircle(16, 2, 8);
      return;
    }

    if (icon === 'oil' || icon === 'vinegar' || icon === 'food-coloring') {
      graphics.fillStyle(icon === 'oil' ? 0xffd76a : icon === 'vinegar' ? 0xaeefff : 0xff5a66, 1);
      graphics.fillRoundedRect(-14, -25, 28, 48, 5);
      graphics.fillStyle(0xfff2c9, 1);
      graphics.fillRect(-10, -4, 20, 12);
      graphics.strokeRoundedRect(-14, -25, 28, 48, 5);
      return;
    }

    if (icon === 'sand') {
      graphics.fillStyle(0xd7a35a, 1);
      graphics.fillTriangle(0, -20, -28, 20, 28, 20);
      graphics.fillStyle(0x7c5b34, 1);
      graphics.fillCircle(-8, 8, 2);
      graphics.fillCircle(12, 13, 2);
      return;
    }

    if (icon === 'soap') {
      graphics.fillStyle(0x8ff3c6, 1);
      graphics.fillRoundedRect(-24, -12, 48, 25, 9);
      graphics.strokeRoundedRect(-24, -12, 48, 25, 9);
      graphics.fillStyle(0xffffff, 0.8);
      graphics.fillCircle(17, -19, 5);
      graphics.fillCircle(25, -27, 3);
      return;
    }

    if (icon === 'glitter') {
      graphics.fillStyle(0xffd76a, 1);
      for (let index = 0; index < 5; index += 1) {
        graphics.fillCircle(-18 + index * 9, -9 + (index % 2) * 18, 4);
      }
      return;
    }

    graphics.fillStyle(0xfff2c9, 1);
    graphics.fillCircle(0, 0, 18);
  }

  setupKeyboardShortcuts() {
    this.input.keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.ESC,
      Phaser.Input.Keyboard.KeyCodes.BACKSPACE,
    ]);

    this.input.keyboard.on('keydown', (event) => {
      if (event.key === 'Backspace' || event.key === 'Escape') {
        return;
      }
      if (this.handleNameKey(event)) {
        event?.preventDefault?.();
      }
    });

    this.input.keyboard.on('keydown-ESC', () => {
      if (this.nameInputActive) {
        this.blurNameInput();
        return;
      }
      this.goBackOrCloseModal();
    });

    this.input.keyboard.on('keydown-BACKSPACE', (event) => {
      event?.preventDefault?.();
      if (this.nameInputActive) {
        this.handleNameKey(event);
        return;
      }
      this.goBackOrCloseModal();
    });
  }

  goBackOrCloseModal() {
    if (this.currentModal) {
      if (this.phase === 'result') {
        return;
      }
      closeOpenModal(this);
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
      minigameScore: this.getTotalScore(),
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
      missions: this.completedMissions.filter(Boolean).map((mission) => ({
        mission_id: mission.mission_id,
        custom_name: mission.custom_name,
        selected_ingredients: [...mission.selected_ingredients],
        classification: mission.classification,
        appearance: mission.appearance,
        use: mission.use,
      })),
    };
  }

  submitResult() {
    submitMinigameResult(this, {
      lessonKey: this.lessonId,
      gameKey: inventMixWorkshopGame.id,
      payloadBuilder: () => this.buildSubmissionPayload(),
    });
  }

  buildTestState() {
    return {
      selectedIsland: this.islandId,
      selectedQuarter: this.quarterId,
      selectedMajor: this.majorId,
      selectedLesson: this.lessonId,
      minigameId: inventMixWorkshopGame.id,
      score: this.getTotalScore(),
      gameResult: this.result,
      inventPhase: this.phase,
      inventMissionIndex: this.missionIndex,
      inventMissionId: this.getCurrentMission()?.id ?? null,
      inventMissionCount: inventMixWorkshopGame.missions.length,
      inventCustomName: this.getMissionName(),
      inventNameInputActive: this.nameInputActive,
      inventNameField: this.nameFieldMeta,
      inventSelectedIngredients: [...this.selectedIngredients],
      inventIngredientOptions: this.ingredientViews.map((view) => ({
        id: view.id,
        label: view.label,
        x: view.x,
        y: view.y,
        correct: view.correct,
        selected: this.selectedIngredients.includes(view.id),
      })),
      inventSelectedClassification: this.selectedClassification,
      inventClassificationOptions: this.classificationViews,
      inventSelectedAppearance: this.selectedAppearance,
      inventAppearanceOptions: this.appearanceViews,
      inventSelectedUse: this.selectedUse,
      inventUseOptions: this.useViews,
      inventMissionScore: this.missionScore,
      inventTotalScore: this.getTotalScore(),
      inventMissionScores: [...this.missionScores],
      inventCompletedMissions: this.completedMissions.filter(Boolean),
      inventResult: this.missionResult,
      inventMixButton: this.mixButtonMeta,
      inventPresentButton: this.presentButtonMeta,
      inventNextButton: this.nextButtonMeta,
      inventRetryButton: this.retryButtonMeta,
    };
  }

  updateTestState() {
    setTestState(this.buildTestState());
  }
}
