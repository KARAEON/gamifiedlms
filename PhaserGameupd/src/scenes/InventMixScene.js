import Phaser from 'phaser';
import { closeMinigameHelp } from '../ui/minigameHelp.js';
import { createMinigameNavigation } from '../ui/minigameNavigation.js';
import { createMinigameHeader } from '../ui/minigameHeader.js';
import { createGeneralAsset, createIngredientIcon } from '../ui/assetIcons.js';
import { inventMixWorkshopGame } from '../config/content.js';
import { getPostGameAssessmentLabel, startPostGameAssessment } from '../systems/assessmentFlow.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import { createBottomFeedback, createSparkles } from '../ui/minigameUi.js';
import { closeOpenModal, coverImage, createToggleRow, showModal, textStyle } from '../ui/ui.js';

import { courtButton, courtField, courtPanel } from '../ui/scienceCourtUi.js';
import { supplyGlyph, supplyPanel, supplyText, supplyHeading } from '../ui/supplyCartUi.js';
import { playAreaMusic } from '../systems/music.js';

const INGREDIENT_CARD_WIDTH = 92;
const INGREDIENT_CARD_HEIGHT = 85;
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

    this.input.dragDistanceThreshold = 8;
    this.drawWorkshopBackground();
    this.createHud();
    this.setupKeyboardShortcuts();
    this.renderMission(true);

    markSceneReady('InventMixScene', this.buildTestState());
  }

  drawWorkshopBackground() {
    coverImage(this, 'invent-workshop-backdrop');
    this.add.rectangle(640, 360, 1280, 720, 0x070d14, 0.56);
  }

  createHud() {
    createMinigameNavigation(this);
    createBottomFeedback(this, { primary: 'CREATE. MIX. EXPLAIN!', secondary: 'Build a mixture and describe its appearance and everyday use.' });
    const header = createMinigameHeader(this, {
      day: 5, detail: 'WORKSHOP', title: 'INVENT-A-MIX WORKSHOP', subtitle: 'Create your own mixture.',
      counters: [{ label: 'CREATIVITY SCORE' }, { label: 'TOTAL SCORE' }],
    });
    [this.scoreText, this.totalScoreText] = header.values;
    this.controlsMeta = { settings: this.navigationMeta.settings, back: this.navigationMeta.back };
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
    this.missionLayer?.destroy(true);
    this.missionLayer = this.add.container(0, 0).setDepth(5);
    this.drawIngredientShelf();
    this.drawMixStation();
    this.drawCreationPanel();
    this.drawDescriptionPanel();
    this.drawResultPanel();
    if (this.phase === 'result') this.drawResultActionButtons();
    this.updateHud();
    this.updateTestState();
  }

  workshopPanel(x, y, width, height, title, { purple = false, paper = false, icon = null } = {}) {
    const panel = courtPanel(this, x, y, width, height, { purple });
    panel.add(supplyPanel(this, 0, -height / 2 + 23, width - 28, 34, { fill: purple ? 0x352044 : 0x092d42, edge: 0x9d722b }));
    const heading = supplyHeading(this, icon ? 12 : 0, -height / 2 + 23, title, 21, '#ffda72');
    if (heading.width > width - 64) heading.setFontSize(Math.floor(parseFloat(heading.style.fontSize) * (width - 64) / heading.width));
    panel.add(heading);
    if (icon) panel.add(supplyGlyph(this, -width / 2 + 34, -height / 2 + 23, icon, 0xffc238, 2));
    if (paper) panel.add(supplyPanel(this, 0, 17, width - 34, height - 64, { fill: 0xe9cf98, edge: 0xb29160 }));
    this.missionLayer.add(panel);
    return panel;
  }

  drawIngredientShelf() {
    this.workshopPanel(217, 304, 414, 346, '1. CHOOSE INGREDIENTS', { icon: 'flask' });
    this.getCurrentMission().ingredientOptions.forEach((id, index) => {
      this.createIngredientCard(id, 67 + index % 4 * 100, 218 + Math.floor(index / 4) * 90);
    });
    this.missionLayer.add(supplyPanel(this, 217, 458, 380, 27, { fill: 0x21481d, edge: 0x8ead3e }));
    this.missionLayer.add(supplyText(this, 217, 458, 'Drag to the cup or click to select (up to 3).', 16, '#eaf0cf'));
  }

  createIngredientCard(ingredientId, x, y) {
    const ingredient = this.getIngredient(ingredientId);
    const selected = this.selectedIngredients.includes(ingredientId);
    const container = this.add.container(x, y);
    const panel = supplyPanel(this, 0, 0, INGREDIENT_CARD_WIDTH, INGREDIENT_CARD_HEIGHT, {
      fill: selected ? 0x243b17 : 0x17170f, edge: selected ? 0x90bb3c : 0x735224,
    });
    const icon = createIngredientIcon(this, ingredient.icon, { y: -15, width: 55, height: 53 });
    const label = supplyText(this, 0, 17, ingredient.label.toUpperCase(), 14, '#f1dca9');
    label.setWordWrapWidth(85).setLineSpacing(-3);
    const count = supplyText(this, 30, 33, selected ? 'x1' : 'x0', 14, selected ? '#fff2c9' : '#aa9b78');
    container.add([panel, icon, label, count]);
    if (selected) container.add(supplyGlyph(this, -32, 33, 'check', 0xa5e770, 2));
    const zone = this.add.zone(0, 0, INGREDIENT_CARD_WIDTH, INGREDIENT_CARD_HEIGHT).setInteractive({ useHandCursor: true });
    this.input.setDraggable(zone);
    zone.on('pointerdown', () => { this.draggedIngredient = null; });
    zone.on('pointerup', () => {
      if (this.draggedIngredient !== ingredientId) this.toggleIngredient(ingredientId);
    });
    zone.on('dragstart', pointer => {
      if (this.phase === 'result' || this.currentModal) return;
      this.draggedIngredient = ingredientId;
      this.dragGhost = createIngredientIcon(this, ingredient.icon, { x: pointer.x, y: pointer.y, width: 60, height: 60 }).setDepth(80);
    });
    zone.on('drag', pointer => this.dragGhost?.setPosition(pointer.x, pointer.y));
    zone.on('dragend', pointer => {
      this.dragGhost?.destroy();
      this.dragGhost = null;
      if (this.draggedIngredient === ingredientId && pointer.x >= 440 && pointer.x <= 762 && pointer.y >= 174 && pointer.y <= 413 && !this.selectedIngredients.includes(ingredientId)) this.toggleIngredient(ingredientId);
    });
    container.add(zone);
    this.missionLayer.add(container);
    this.ingredientViews.push({ id: ingredientId, label: ingredient.label, x, y, correct: this.getCurrentMission().correctIngredients.includes(ingredientId) });
  }

  drawMixStation() {
    this.workshopPanel(603, 304, 344, 346, '2. MIX YOUR INGREDIENTS', { icon: 'flask' });
    const stage = this.add.image(603, 292, 'detective-sample-stage').setDisplaySize(308, 239);
    const icon = this.createMixturePreviewIcon(this.getCurrentMission(), { x: 603, y: 285, width: 222, height: 235 });
    this.missionLayer.add([stage, icon]);
    const mixed = this.phase !== 'choose';
    this.missionLayer.add(supplyPanel(this, 603, 432, 306, 73, { fill: 0x0d2022, edge: 0x926923 }));
    this.missionLayer.add(supplyText(this, 603, 411, mixed ? 'MIXING COMPLETE!' : 'READY TO MIX?', 21, mixed ? '#b5e748' : '#ffda72'));
    const detail = supplyText(this, 603, mixed ? 445 : 431, mixed && this.hasExactIngredients() ? this.getCurrentMission().mixedMessage : mixed ? 'Check your recipe, then describe your mixture.' : `${this.selectedIngredients.length} / 3 selected. Press MIX.`, 15, '#efdfb8');
    detail.setWordWrapWidth(278);
    this.missionLayer.add(detail);
    if (!mixed) {
      const mix = courtButton(this, 603, 459, 'MIX', () => this.mixIngredients(), { width: 178, height: 31, size: 19, fill: this.selectedIngredients.length ? 0x28641e : 0x39413c });
      this.missionLayer.add(mix);
      this.mixButtonMeta = { x: 603, y: 459, label: 'MIX' };
    }
  }

  drawDescriptionPanel() {
    this.workshopPanel(1028, 390, 488, 518, '3. DESCRIBE YOUR MIXTURE', { purple: true, paper: true });
    this.missionLayer.add(supplyText(this, 811, 194, 'A. NAME YOUR MIXTURE', 20, '#292116', 'left'));
    const nameBox = supplyPanel(this, 1028, 230, 425, 46, { fill: 0xf0dbae, edge: 0xa2824e });
    const nameZone = this.add.zone(1028, 230, 425, 46).setInteractive({ useHandCursor: true });
    nameZone.on('pointerup', () => this.focusNameInput());
    this.nameText = supplyText(this, 824, 230, this.getMissionName() || 'TYPE A NAME', 21, '#292116', 'left');
    this.nameCursor = supplyText(this, 822, 230, this.nameInputActive ? '|' : '', 21, '#292116', 'left');
    this.nameCountText = supplyText(this, 1230, 264, `${this.getMissionName().length}/25`, 14, '#806644');
    this.nameFieldMeta = { x: 1028, y: 230, width: 425, height: 46 };
    this.missionLayer.add([nameBox, this.nameText, this.nameCursor, this.nameCountText, nameZone]);
    this.missionLayer.add(supplyText(this, 811, 304, 'B. IS IT UNIFORM OR NON-UNIFORM?', 20, '#292116', 'left'));
    inventMixWorkshopGame.classifications.forEach((option, index) => {
      const x = 921 + index * 215, y = 344;
      const selected = this.selectedClassification === option.id;
      const button = courtButton(this, x, y, option.label, () => {
        if (this.phase === 'choose') this.flashWarning('MIX YOUR INGREDIENTS FIRST.');
        else this.selectChoice('classification', option.id);
      }, { width: 207, height: 46, size: 20, fill: selected ? 0x38821e : index === 0 ? 0x405c26 : 0x963b23 });
      if (selected) button.list.find(child => child.type === 'Text').setX(-8);
      if (selected) button.add(supplyGlyph(this, 86, 0, 'check', 0xd4f1a0, 2));
      this.missionLayer.add(button);
      this.classificationViews.push({ ...option, x, y, selected, correct: option.id === this.getCurrentMission().type });
    });
    this.descriptionFields = { appearance: { x: 1028, y: 436 }, use: { x: 1028, y: 534 } };
    for (const [kind, label, y, choices, value] of [
      ['appearance', 'C. DESCRIBE ITS APPEARANCE', 436, this.getAppearanceChoices(), this.selectedAppearance],
      ['use', 'D. WHAT IS ITS USE?', 534, this.getUseChoices(), this.selectedUse],
    ]) {
      this.missionLayer.add(supplyText(this, 811, y - 37, label, 20, '#292116', 'left'));
      const field = courtField(this, 1028, y, 425, choices.find(option => option.id === value)?.label ?? `Choose ${kind}...`, () => this.openChoiceMenu(kind), { size: 21, height: 46 });
      this.missionLayer.add(field.container);
      const views = choices.map((option, index) => ({ ...option, x: 640, y: 294 + index * 47, selected: value === option.id, correct: this.isCorrectChoice(kind, option.id) }));
      if (kind === 'appearance') this.appearanceViews = views;
      else this.useViews = views;
    }
    if (this.phase !== 'result') {
      const present = courtButton(this, 1028, 602, 'PRESENT INVENTION', () => this.presentInvention(), { width: 310, height: 44, size: 23, fill: this.canPresent() ? 0x28641e : 0x6d644d });
      this.missionLayer.add(present);
    } else {
      this.missionLayer.add(supplyPanel(this, 1028, 602, 310, 44, { fill: 0x31551d, edge: 0x88a446 }));
      this.missionLayer.add(supplyText(this, 1028, 602, 'INVENTION PRESENTED!', 22, '#e9f3ce'));
    }
    this.presentButtonMeta = this.phase === 'result' ? null : { x: 1028, y: 602, label: 'PRESENT' };
    this.refreshNameField();
  }

  openChoiceMenu(kind) {
    if (this.phase === 'result' || this.currentModal) return;
    if (this.phase === 'choose' || !this.selectedClassification || (kind === 'use' && !this.selectedAppearance)) {
      this.flashWarning(this.phase === 'choose' ? 'MIX YOUR INGREDIENTS FIRST.' : 'COMPLETE THE PREVIOUS FIELD FIRST.');
      return;
    }
    this.blurNameInput();
    const choices = kind === 'appearance' ? this.appearanceViews : this.useViews;
    showModal(this, {
      name: 'invent-choice', title: kind === 'appearance' ? 'DESCRIBE ITS APPEARANCE' : 'CHOOSE ITS USE', width: 660, height: 350, titleSize: 28,
      body: () => choices.map(option => courtButton(this, option.x, option.y, option.label, () => {
        closeOpenModal(this);
        this.selectChoice(kind, option.id);
      }, { width: 570, height: 39, size: 21, fill: option.selected ? 0x386c28 : 0x34304c })),
      buttons: [{ label: 'CANCEL', action: () => { closeOpenModal(this); this.updateTestState(); } }],
    });
    this.updateTestState();
  }

  drawCreationPanel() {
    const panel = courtPanel(this, 217, 567, 414, 164, { purple: true });
    this.creationText = supplyHeading(this, 217, 513, '', 22, '#b5e748');
    this.titleText = supplyHeading(this, 217, 551, '', 29, '#fff0c4');
    const missionPaper = supplyPanel(this, 217, 607, 374, 53, { fill: 0xe9cf98, edge: 0xb29160 });
    this.promptText = supplyText(this, 217, 607, '', 18, '#241c16').setWordWrapWidth(350);
    this.missionLayer.add([panel, this.creationText, this.titleText, missionPaper, this.promptText]);
  }

  drawResultPanel() {
    this.workshopPanel(603, 567, 344, 164, 'RESULT & REWARDS');
    const complete = this.phase === 'result';
    const title = supplyHeading(this, 453, 533, complete ? this.missionResult === 'perfect' ? 'EXCELLENT!' : this.getResultTitle() : 'YOUR REWARD', 20, this.missionResult === 'perfect' ? '#b5e748' : '#ffda72', 'left').setOrigin(0, 0).setWordWrapWidth(180);
    const body = supplyText(this, 453, 559, complete ? this.getResultBody() : 'Not presented yet.', 16, '#eee0bf', 'left').setOrigin(0, 0).setWordWrapWidth(166);
    if (body.height > 52) body.setFontSize(16);
    const trophy = this.add.image(701, 564, 'invent-trophy').setDisplaySize(78, 84).setAlpha(complete ? 1 : 0.4);
    const ribbon = supplyText(this, 701, 604, this.missionResult === 'perfect' ? 'PERFECT!' : complete ? 'KEEP TRYING' : '', 14, '#ffdd76');
    this.missionLayer.add([title, body, trophy, ribbon]);
  }

  drawResultActionButtons() {
    const final = this.missionIndex === inventMixWorkshopGame.missions.length - 1;
    const retry = this.missionResult !== 'perfect';
    const x = 674;
    const next = courtButton(this, x, 627, final ? 'FINISH' : 'NEXT MISSION', () => this.advanceMission(), { width: 156, height: 30, size: 17 });
    this.missionLayer.add(next);
    this.nextButtonMeta = { x, y: 627, label: final ? 'FINISH' : 'NEXT MISSION' };
    if (retry) {
      const button = courtButton(this, 515, 627, 'RETRY', () => this.retryMission(), { width: 124, height: 30, size: 18, fill: 0x694227 });
      this.missionLayer.add(button);
      this.retryButtonMeta = { x: 515, y: 627, label: 'RETRY' };
    }
  }

  openSettings() {
    this.blurNameInput();
    showModal(this, {
      name: 'invent-settings', title: 'SETTINGS', height: 360,
      body: (_overlay, { panelX, panelY }) => [
        createToggleRow(this, panelX - 16, panelY - 32, 'MUSIC', this.registry.get('musicEnabled'), enabled => { this.registry.set('musicEnabled', enabled); playAreaMusic(this, this.islandId); }),
        createToggleRow(this, panelX - 16, panelY + 34, 'SFX', this.registry.get('sfxEnabled'), enabled => this.registry.set('sfxEnabled', enabled)),
      ],
      buttons: [{ label: 'DONE', action: () => { closeOpenModal(this); this.updateTestState(); } }],
    });
    this.updateTestState();
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
    this.missionResult = this.missionScore === inventMixWorkshopGame.missionMaxScore
      ? 'perfect'
      : this.missionScore > 0
        ? 'partial'
        : 'retry';
    this.phase = 'result';
    createSparkles(this, 1060, 604);
    this.renderMission(false);
  }

  retryMission() {
    closeOpenModal(this);
    this.missionScores[this.missionIndex] = null;
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

  showFinalResult() {
    const totalScore = this.getTotalScore();
    const won = totalScore >= inventMixWorkshopGame.winScore;
    this.result = won ? 'win' : 'lose';
    this.phase = 'final';
    this.updateTestState();

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

  setMissionName(value) {
    const cleaned = value.replace(/\s+/g, ' ').slice(0, 25);
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
    this.nameText.setFontSize(21);
    if (this.nameText.width > 383) this.nameText.setFontSize(Math.floor(21 * 383 / this.nameText.width));
    this.nameCursor.setText(this.nameInputActive ? '|' : '');
    this.nameCursor.setX(825 + Math.min(383, this.nameText.width));
    this.nameCountText.setText(`${name.length}/25`);
    this.updateHud();
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

  updateHud() {
    const mission = this.getCurrentMission();
    this.creationText?.setText(`CREATION ${mission.creationNumber}`);
    this.titleText?.setText(this.getDisplayMissionName().toUpperCase());
    this.titleText?.setFontSize(36);
    if (this.titleText?.width > 370) this.titleText.setFontSize(Math.floor(36 * 370 / this.titleText.width));
    this.promptText?.setText(`Mission: ${mission.prompt}`);
    this.scoreText.setText(`${String(this.missionScore).padStart(3, '0')} / 045`);
    this.totalScoreText.setText(`${String(this.getTotalScore()).padStart(3, '0')} / 135`);
  }

  createMixturePreviewIcon(mission, { x = 0, y = 0, width = 226, height = 166 } = {}) {
    const preview = this.add.container(x, y);
    if (this.phase === 'choose' || (mission.id === 'energy-juice' && this.hasExactIngredients())) {
      const size = Math.min(width, height);
      const cup = this.add.image(0, 0, this.phase === 'choose' ? 'invent-empty-cup' : 'invent-energy-cup').setDisplaySize(size, size);
      preview.add(cup);
      if (this.phase === 'choose') this.selectedIngredients.forEach((id, index) => preview.add(createIngredientIcon(this, this.getIngredient(id).icon, { x: (index - (this.selectedIngredients.length - 1) / 2) * size * 0.22, y: size * 0.12, width: size * 0.25, height: size * 0.25 })));
      return preview;
    }
    if (!this.hasExactIngredients()) {
      preview.setScale(Math.min(width / 226, height / 166));
      preview.add(createGeneralAsset(this, 'bowl-empty', { y: 16, width: 226, height: 166 }));
      this.selectedIngredients.forEach((id, index) => preview.add(createIngredientIcon(this, this.getIngredient(id).icon, { x: (index - (this.selectedIngredients.length - 1) / 2) * 38, y: -12, width: 46, height: 46 })));
      return preview;
    }
    preview.setScale(Math.min(width / 226, height / 166));
    const add = (name, options) => {
      const sprite = createGeneralAsset(this, name, options);
      if (sprite) preview.add(sprite);
    };
    if (mission.id === 'color-paint-mix') {
      // Keep the separated-liquid evidence visible beside the finished paint.
      add('oil-and-water', { x: -37, width: 132, height: 166 });
      add('color-paint', { x: 61, y: 22, width: 92, height: 112 });
      return preview;
    } else {
      add('bowl-empty', { y: 16, width: 226, height: 166 });
    }
    this.selectedIngredients.forEach((id, index) => {
      const ingredient = this.getIngredient(id);
      const sprite = createIngredientIcon(this, ingredient.icon, {
        x: (index - (this.selectedIngredients.length - 1) / 2) * 38,
        y: -12, width: 46, height: 46,
      });
      preview.add(sprite);
    });
    return preview;
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
      if (this.minigameHelpOpen) {
        closeMinigameHelp(this);
        return;
      }
      if (this.currentModal) {
        this.goBackOrCloseModal();
        return;
      }
      if (this.nameInputActive) {
        this.blurNameInput();
        return;
      }
      this.goBackOrCloseModal();
    });

    this.input.keyboard.on('keydown-BACKSPACE', (event) => {
      event?.preventDefault?.();
      if (this.minigameHelpOpen) {
        closeMinigameHelp(this);
        return;
      }
      if (this.nameInputActive) {
        this.handleNameKey(event);
        return;
      }
      this.goBackOrCloseModal();
    });
  }

  goBackOrCloseModal() {
    if (this.minigameHelpOpen) {
      closeMinigameHelp(this);
      return;
    }
    if (this.currentModal) {
      if (this.phase === 'final') return;
      closeOpenModal(this);
      this.updateTestState();
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

  buildTestState() {
    return {
      minigameHelpOpen: Boolean(this.minigameHelpOpen),
      minigameHelpButton: this.helpButtonMeta,
      minigameControls: this.navigationMeta,
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
      inventDescriptionFields: this.descriptionFields,
      inventControls: this.controlsMeta,
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
