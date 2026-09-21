import Phaser from 'phaser';
import { supplyCartSortingGame } from '../config/content.js';
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
import { closeOpenModal, colors, showModal, textStyle } from '../ui/ui.js';

const ITEM_CARD_WIDTH = 132;
const ITEM_CARD_HEIGHT = 92;
const ITEM_CARD_GAP = 16;
const ITEM_ROW_Y = 546;
const BIN_WIDTH = 280;
const BIN_HEIGHT = 172;

export default class SupplyCartScene extends Phaser.Scene {
  constructor() {
    super('SupplyCartScene');
  }

  init(data) {
    this.islandId = data.islandId ?? 'vulcan-caverns';
    this.quarterId = data.quarterId ?? 'q1';
    this.majorId = data.majorId ?? 'q1-major-1';
    this.lessonId = data.lessonId ?? supplyCartSortingGame.lessonId;
    this.returnScrollY = Number.isFinite(data.returnScrollY) ? data.returnScrollY : 0;
    this.currentModal = null;
  }

  create() {
    this.score = 0;
    this.timeRemaining = supplyCartSortingGame.timerSeconds;
    this.lastTimerSecond = Math.ceil(this.timeRemaining);
    this.result = null;
    this.selectedItem = null;
    this.activeUseItem = null;
    this.useChoices = [];
    this.dragJustEnded = false;
    this.sortAttempts = 0;
    this.correctSorts = 0;
    this.correctUseCount = 0;
    this.completedItemCount = 0;
    this.combo = 0;
    this.bestCombo = 0;

    drawMinigameBackdrop(this);
    this.createHud();
    this.createBins();
    this.createConveyor();
    this.createItemCards();
    this.setupDrag();
    this.setupKeyboardShortcuts();

    markSceneReady('SupplyCartScene', this.buildTestState());
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
      this.finishGame(false);
    }
  }

  createHud() {
    this.hud = createMinigameHud(this, {
      title: supplyCartSortingGame.title,
      topic: supplyCartSortingGame.topic,
      progressLabel: 'SORTED',
      progressValue: this.correctSorts,
      progressMax: supplyCartSortingGame.items.length,
      score: this.score,
      time: this.timeRemaining,
      onBack: () => this.returnToQuarter(),
    });

    this.feedback = createBottomFeedback(this, {
      primary: 'DRAG AN ITEM TO THE CORRECT MIXTURE BIN',
      secondary: 'THEN CHOOSE THE BEST REAL-LIFE USE.',
    });
  }

  createBins() {
    this.bins = [
      {
        id: 'uniform',
        label: 'UNIFORM\nMIXTURE',
        x: 390,
        y: 348,
        width: BIN_WIDTH,
        height: BIN_HEIGHT,
        color: 0x2278c9,
      },
      {
        id: 'nonuniform',
        label: 'NON-UNIFORM\nMIXTURE',
        x: 720,
        y: 348,
        width: BIN_WIDTH,
        height: BIN_HEIGHT,
        color: 0x58cc02,
      },
    ];

    this.bins.forEach((bin) => {
      const container = this.add.container(bin.x, bin.y);
      container.setDepth(4);

      const graphics = this.add.graphics();
      graphics.fillStyle(0x000000, 0.22);
      graphics.fillRoundedRect(-bin.width / 2 + 12, -bin.height / 2 + 14, bin.width, bin.height, 8);
      graphics.fillStyle(bin.color, 1);
      graphics.fillRoundedRect(-bin.width / 2, -bin.height / 2, bin.width, bin.height, 8);
      graphics.fillStyle(0x0b1720, 0.35);
      graphics.fillRoundedRect(-bin.width / 2 + 26, -bin.height / 2 + 18, bin.width - 52, 36, 6);
      graphics.lineStyle(5, 0x153045, 1);
      graphics.strokeRoundedRect(-bin.width / 2, -bin.height / 2, bin.width, bin.height, 8);
      graphics.fillStyle(0xfff2c9, 1);
      graphics.fillRoundedRect(-94, 20, 188, 72, 6);

      const label = this.add.text(0, 52, bin.label, textStyle(24, '#2f2a2a'));
      label.setOrigin(0.5);
      label.setLineSpacing(-5);

      const icon = this.add.graphics();
      icon.lineStyle(4, 0x2f2a2a, 1);
      icon.strokeRect(-11, 81, 22, 27);
      icon.fillStyle(0x66e5ff, 0.85);
      icon.fillRect(-8, 92, 16, 13);

      const zone = this.add.zone(0, 0, bin.width, bin.height).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => {
        if (this.selectedItem && !this.activeUseItem) {
          container.setScale(1.04);
        }
      });
      zone.on('pointerout', () => container.setScale(1));
      zone.on('pointerup', () => {
        container.setScale(1);
        if (this.selectedItem && !this.activeUseItem) {
          this.trySort(this.selectedItem, bin);
        }
      });

      container.add([graphics, label, icon, zone]);
      bin.bounds = new Phaser.Geom.Rectangle(bin.x - bin.width / 2, bin.y - bin.height / 2, bin.width, bin.height);
      bin.container = container;
    });
  }

  createConveyor() {
    const belt = this.add.graphics();
    belt.setDepth(2);
    belt.fillStyle(0x343030, 1);
    belt.fillRoundedRect(160, 492, 940, 110, 8);
    belt.lineStyle(5, 0x6e5241, 1);
    belt.strokeRoundedRect(160, 492, 940, 110, 8);
    belt.fillStyle(0xff9b42, 1);
    for (let x = 190; x < 1080; x += 84) {
      belt.fillRect(x, 496, 36, 8);
    }
    belt.fillStyle(0x201b1b, 0.9);
    belt.fillCircle(184, 548, 24);
    belt.fillCircle(1076, 548, 24);
  }

  createItemCards() {
    const totalWidth = supplyCartSortingGame.items.length * ITEM_CARD_WIDTH + (supplyCartSortingGame.items.length - 1) * ITEM_CARD_GAP;
    const startX = (GAME_WIDTH - totalWidth) / 2 + ITEM_CARD_WIDTH / 2;

    this.items = supplyCartSortingGame.items.map((item, index) => ({
      ...item,
      x: startX + index * (ITEM_CARD_WIDTH + ITEM_CARD_GAP),
      y: ITEM_ROW_Y,
      homeX: startX + index * (ITEM_CARD_WIDTH + ITEM_CARD_GAP),
      homeY: ITEM_ROW_Y,
      sorted: false,
      completed: false,
    }));

    this.items.forEach((item) => {
      this.createItemCard(item);
    });

    this.refreshItemCards();
  }

  createItemCard(item) {
    const container = this.add.container(item.x, item.y);
    container.setDepth(8);

    const shadow = this.add.rectangle(5, 7, ITEM_CARD_WIDTH, ITEM_CARD_HEIGHT, 0x000000, 0.25);
    shadow.setOrigin(0.5);
    const face = this.add.graphics();
    const icon = this.add.graphics();
    const label = this.add.text(0, 32, item.name.toUpperCase(), textStyle(17, '#2f2a2a'));
    label.setOrigin(0.5);
    label.setWordWrapWidth(ITEM_CARD_WIDTH - 14);
    label.setLineSpacing(-3);

    container.add([shadow, face, icon, label]);
    item.container = container;
    item.face = face;
    item.iconGraphics = icon;
    item.labelText = label;

    const hitZone = this.add.zone(item.x, item.y, ITEM_CARD_WIDTH, ITEM_CARD_HEIGHT);
    hitZone.setOrigin(0.5);
    hitZone.setDepth(25);
    hitZone.setData('itemId', item.id);
    hitZone.setInteractive({ useHandCursor: true });
    this.input.setDraggable(hitZone);
    item.hitZone = hitZone;

    hitZone.on('pointerdown', () => {
      if (this.canUseItem(item)) {
        this.selectItem(item);
      }
    });
    hitZone.on('pointerup', () => {
      if (this.dragJustEnded || !this.canUseItem(item)) {
        return;
      }
      this.selectItem(item);
    });

    this.drawItemCard(item);
  }

  drawItemCard(item) {
    item.face.clear();
    item.face.fillStyle(item.completed ? 0xe7ffd6 : 0xfff2c9, 1);
    item.face.lineStyle(4, this.selectedItem?.id === item.id ? colors.gold : 0x9e6b47, 1);
    item.face.fillRoundedRect(-ITEM_CARD_WIDTH / 2, -ITEM_CARD_HEIGHT / 2, ITEM_CARD_WIDTH, ITEM_CARD_HEIGHT, 8);
    item.face.strokeRoundedRect(-ITEM_CARD_WIDTH / 2, -ITEM_CARD_HEIGHT / 2, ITEM_CARD_WIDTH, ITEM_CARD_HEIGHT, 8);
    item.face.lineStyle(2, 0xffffff, 0.5);
    item.face.strokeRoundedRect(-ITEM_CARD_WIDTH / 2 + 7, -ITEM_CARD_HEIGHT / 2 + 7, ITEM_CARD_WIDTH - 14, ITEM_CARD_HEIGHT - 14, 6);

    item.iconGraphics.clear();
    item.iconGraphics.setScale(0.66);
    item.iconGraphics.setPosition(0, -18);
    drawMixtureIcon(item.iconGraphics, item.icon);
  }

  setupDrag() {
    this.input.on('dragstart', (_pointer, gameObject) => {
      const item = this.findItemByHitZone(gameObject);
      if (!item || !this.canUseItem(item)) {
        return;
      }

      this.selectItem(item);
      item.container.setDepth(20);
      item.hitZone.setDepth(40);
    });

    this.input.on('drag', (_pointer, gameObject, dragX, dragY) => {
      const item = this.findItemByHitZone(gameObject);
      if (!item || !this.canUseItem(item)) {
        return;
      }

      this.setItemPosition(item, dragX, Phaser.Math.Clamp(dragY, 168, 588));
    });

    this.input.on('dragend', (_pointer, gameObject) => {
      const item = this.findItemByHitZone(gameObject);
      this.dragJustEnded = true;
      this.time.delayedCall(40, () => {
        this.dragJustEnded = false;
      });

      if (!item || !this.canUseItem(item)) {
        return;
      }

      const targetBin = this.getBinAt(item.container.x, item.container.y);
      if (targetBin) {
        this.trySort(item, targetBin);
        return;
      }

      this.resetItemPosition(item);
    });
  }

  selectItem(item) {
    this.selectedItem = item;
    this.feedback.setText(`SELECTED: ${item.name.toUpperCase()}`, 'DROP IT INTO UNIFORM OR NON-UNIFORM MIXTURE.');
    this.refreshItemCards();
    this.updateTestState();
  }

  trySort(item, bin) {
    if (!this.canUseItem(item)) {
      return;
    }

    this.sortAttempts += 1;

    if (item.type !== bin.id) {
      this.combo = 0;
      this.feedback.setText('TRY ANOTHER BIN', item.hint.toUpperCase());
      this.shakeItem(item, () => this.resetItemPosition(item));
      this.selectedItem = null;
      this.refreshItemCards();
      this.updateTestState();
      return;
    }

    this.correctSorts += 1;
    this.score += supplyCartSortingGame.score.correctSort;
    item.sorted = true;
    this.selectedItem = null;
    this.snapItemToBin(item, bin);
    createSparkles(this, bin.x, bin.y - 20);
    this.feedback.setText(`CORRECT SORT +${supplyCartSortingGame.score.correctSort}`, item.appearance.toUpperCase());
    this.showUsePanel(item);
    this.updateHudText();
    this.refreshItemCards();
    this.updateTestState();
  }

  showUsePanel(item) {
    if (this.usePanel) {
      this.usePanel.destroy(true);
    }

    this.activeUseItem = item;
    this.useChoices = [];

    const panelX = 1044;
    const panelY = 344;
    const panelWidth = 300;
    const panelHeight = 282;
    const panel = this.add.container(panelX, panelY);
    panel.setDepth(30);

    const bg = this.add.graphics();
    bg.fillStyle(0x3e3a36, 0.96);
    bg.lineStyle(5, colors.cream, 1);
    bg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 8);
    bg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 8);

    const title = this.add.text(0, -112, 'CHOOSE THE BEST USE', textStyle(24, '#66e5ff'));
    title.setOrigin(0.5);
    const itemLabel = this.add.text(42, -72, item.name.toUpperCase(), textStyle(23, '#ffd76a', 'left'));
    itemLabel.setOrigin(0, 0.5);
    itemLabel.setWordWrapWidth(190);

    const iconFrame = this.add.rectangle(-84, -70, 76, 58, colors.cream, 1);
    iconFrame.setStrokeStyle(3, 0x9e6b47, 1);
    const icon = this.add.graphics();
    icon.setScale(0.58);
    icon.setPosition(-84, -67);
    drawMixtureIcon(icon, item.icon);

    panel.add([bg, title, iconFrame, icon, itemLabel]);

    item.useChoices.forEach((choice, index) => {
      const y = -14 + index * 58;
      const choiceContainer = this.add.container(0, y);
      const box = this.add.graphics();
      box.fillStyle(0xfff2c9, 1);
      box.lineStyle(3, 0x9e6b47, 1);
      box.fillRoundedRect(-120, -22, 240, 44, 6);
      box.strokeRoundedRect(-120, -22, 240, 44, 6);
      const choiceText = this.add.text(-94, 0, choice.toUpperCase(), textStyle(18, '#2f2a2a', 'left'));
      choiceText.setOrigin(0, 0.5);
      choiceText.setWordWrapWidth(190);
      const dot = this.add.circle(-104, 0, 7, choice === item.use ? 0x58cc02 : colors.gold, 1);
      const zone = this.add.zone(0, 0, 240, 44).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => choiceContainer.setScale(1.04));
      zone.on('pointerout', () => choiceContainer.setScale(1));
      zone.on('pointerup', () => this.answerUse(item, choice));

      choiceContainer.add([box, dot, choiceText, zone]);
      panel.add(choiceContainer);
      this.useChoices.push({
        label: choice,
        x: panelX,
        y: panelY + y,
        correct: choice === item.use,
      });
    });

    this.usePanel = panel;
  }

  answerUse(item, choice) {
    if (!this.activeUseItem || item.id !== this.activeUseItem.id) {
      return;
    }

    const isCorrect = choice === item.use;

    if (isCorrect) {
      this.score += supplyCartSortingGame.score.correctUse;
      this.correctUseCount += 1;
      this.combo += 1;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.feedback.setText(`BEST USE +${supplyCartSortingGame.score.correctUse}`, `${item.name.toUpperCase()} CAN BE USED FOR ${item.use.toUpperCase()}.`);
      createSparkles(this, item.container.x, item.container.y);
    } else {
      this.combo = 0;
      this.feedback.setText('NO BONUS', `BEST USE: ${item.use.toUpperCase()}.`);
    }

    item.completed = true;
    this.completedItemCount += 1;
    this.activeUseItem = null;
    this.useChoices = [];

    if (this.usePanel) {
      this.usePanel.destroy(true);
      this.usePanel = null;
    }

    item.container.setVisible(false);
    item.hitZone?.setVisible(false);
    item.hitZone?.disableInteractive();
    this.refreshItemCards();
    this.updateHudText();
    this.updateTestState();

    if (this.completedItemCount === this.items.length) {
      this.finishGame(this.getSortAccuracy() >= supplyCartSortingGame.accuracyTarget);
    }
  }

  refreshItemCards() {
    this.items.forEach((item) => {
      if (!item.container) {
        return;
      }

      const active = this.canUseItem(item);
      item.container.setAlpha(active ? 1 : 0.45);
      if (item.completed) {
        item.container.setVisible(false);
        item.hitZone?.setVisible(false);
        item.hitZone?.disableInteractive();
      } else {
        item.hitZone?.setVisible(true);
        item.hitZone?.setPosition(item.container.x, item.container.y);

        if (active) {
          item.hitZone?.setInteractive({ useHandCursor: true });
          this.input.setDraggable(item.hitZone, true);
        } else {
          this.input.setDraggable(item.hitZone, false);
          item.hitZone?.disableInteractive();
        }
      }
      this.drawItemCard(item);
    });
  }

  canUseItem(item) {
    if (this.result || this.activeUseItem || item.sorted || item.completed) {
      return false;
    }

    return item.id === this.getActiveItem()?.id;
  }

  getActiveItem() {
    return this.items?.find((item) => !item.sorted && !item.completed) ?? null;
  }

  findItemByHitZone(hitZone) {
    return this.items.find((item) => item.hitZone === hitZone);
  }

  getBinAt(x, y) {
    return this.bins.find((bin) => Phaser.Geom.Rectangle.Contains(bin.bounds, x, y));
  }

  snapItemToBin(item, bin) {
    item.container.setDepth(10);
    item.hitZone?.setDepth(24);
    this.tweens.add({
      targets: [item.container, item.hitZone],
      x: bin.x,
      y: bin.y - 18,
      duration: 180,
      ease: Phaser.Math.Easing.Quadratic.Out,
    });
  }

  resetItemPosition(item) {
    this.tweens.add({
      targets: [item.container, item.hitZone],
      x: item.homeX,
      y: item.homeY,
      duration: 180,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onComplete: () => {
        item.container.setDepth(8);
        item.hitZone?.setDepth(25);
        this.updateTestState();
      },
    });
  }

  setItemPosition(item, x, y) {
    item.container.setPosition(x, y);
    item.hitZone?.setPosition(x, y);
  }

  shakeItem(item, onComplete) {
    this.tweens.add({
      targets: item.container,
      x: item.container.x + 10,
      duration: 55,
      yoyo: true,
      repeat: 4,
      ease: Phaser.Math.Easing.Sine.InOut,
      onComplete,
    });
  }

  finishGame(won) {
    if (this.result) {
      return;
    }

    this.result = won ? 'win' : 'lose';
    this.updateHudText();
    this.updateTestState();
    this.submitResult();

    const accuracy = this.getSortAccuracy();
    showModal(this, {
      name: won ? 'result-win' : 'result-lose',
      title: won ? 'SUPPLIES SORTED' : 'TRY AGAIN',
      height: 360,
      body: (_overlay, { panelX, panelY }) => {
        const scoreText = this.add.text(panelX, panelY - 36, `SCORE ${this.score}`, textStyle(30, '#66e5ff'));
        scoreText.setOrigin(0.5);
        const accuracyText = this.add.text(panelX, panelY + 6, `ACCURACY ${accuracy}%`, textStyle(25, '#fff2c9'));
        accuracyText.setOrigin(0.5);
        const comboText = this.add.text(panelX, panelY + 46, `BEST COMBO x${this.bestCombo}`, textStyle(23, '#ffd76a'));
        comboText.setOrigin(0.5);
        return [scoreText, accuracyText, comboText];
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
    this.hud?.setProgress(this.correctSorts, this.items?.length ?? supplyCartSortingGame.items.length);
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
      correct_sort_count: this.correctSorts,
      sort_attempt_count: this.sortAttempts,
      correct_use_count: this.correctUseCount,
      completed_item_count: this.completedItemCount,
      best_combo: this.bestCombo,
      time_remaining_seconds: Math.max(0, Math.round((this.timeRemaining ?? 0) * 100) / 100),
    };
  }

  submitResult() {
    submitMinigameResult(this, {
      lessonKey: this.lessonId,
      gameKey: supplyCartSortingGame.id,
      payloadBuilder: () => this.buildSubmissionPayload(),
    });
  }

  getSortAccuracy() {
    if (this.sortAttempts === 0) {
      return 100;
    }

    return Math.round((this.correctSorts / this.sortAttempts) * 100);
  }

  buildTestState() {
    return {
      selectedIsland: this.islandId,
      selectedQuarter: this.quarterId,
      selectedMajor: this.majorId,
      selectedLesson: this.lessonId,
      minigameId: supplyCartSortingGame.id,
      totalItemCount: this.items?.length ?? supplyCartSortingGame.items.length,
      activeItemId: this.getActiveItem()?.id ?? null,
      sortedCount: this.correctSorts,
      completedItemCount: this.completedItemCount,
      correctUseCount: this.correctUseCount,
      sortAttempts: this.sortAttempts,
      sortAccuracy: this.getSortAccuracy(),
      combo: this.combo,
      bestCombo: this.bestCombo,
      usePanelOpen: Boolean(this.activeUseItem),
      activeUseItemId: this.activeUseItem?.id ?? null,
      useChoices: this.useChoices,
      score: this.score,
      timeRemaining: Math.ceil(this.timeRemaining),
      gameResult: this.result,
      supplyCartItems: this.items?.map((item) => ({
        id: item.id,
        type: item.type,
        use: item.use,
        x: item.container?.x ?? item.x,
        y: item.container?.y ?? item.y,
        homeX: item.homeX,
        homeY: item.homeY,
        sorted: item.sorted,
        completed: item.completed,
      })) ?? [],
      supplyCartBins: this.bins?.map((bin) => ({
        id: bin.id,
        x: bin.x,
        y: bin.y,
        width: bin.width,
        height: bin.height,
      })) ?? [],
    };
  }

  updateTestState() {
    setTestState(this.buildTestState());
  }
}
