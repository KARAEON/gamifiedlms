import Phaser from 'phaser';
import { closeMinigameHelp } from '../ui/minigameHelp.js';
import { createMinigameNavigation } from '../ui/minigameNavigation.js';
import { createMinigameHeader } from '../ui/minigameHeader.js';
import { createMixtureIcon } from '../ui/assetIcons.js';
import { supplyControl, supplyGlyph, supplyPanel, supplyPalette, supplyText, supplyHeading } from '../ui/supplyCartUi.js';
import { supplyCartSortingGame } from '../config/content.js';
import { playAreaMusic } from '../systems/music.js';
import { getPostGameAssessmentLabel, startPostGameAssessment } from '../systems/assessmentFlow.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import {
  createBottomFeedback,
  createSparkles,
  drawMinigameBackdrop,
} from '../ui/minigameUi.js';
import { closeOpenModal, colors, createToggleRow, showModal, textStyle } from '../ui/ui.js';

const ITEM_CARD_WIDTH = 124;
const ITEM_CARD_HEIGHT = 112;
const ITEM_CARD_GAP = 14;
const ITEM_ROW_Y = 478;
const VISIBLE_ITEM_COUNT = 6;
const BIN_WIDTH = 328;
const BIN_HEIGHT = 224;

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
    this.completedItemCount = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.paused = false;
    this.hintsRemaining = 3;
    this.conveyorQueueKey = null;
    this.lastFeedback = { primary: 'READY TO SORT?', secondary: 'Drag the glowing item into a bin.' };

    drawMinigameBackdrop(this, 'supply-station-backdrop');
    this.createHud();
    this.createBins();
    this.createConveyor();
    this.createItemCards();
    this.renderUsePanel();
    this.setupDrag();
    this.setupKeyboardShortcuts();

    markSceneReady('SupplyCartScene', this.buildTestState());
  }

  update(_time, delta) {
    if (this.result || this.paused || this.currentModal) {
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
    createMinigameNavigation(this);
    const header = createMinigameHeader(this, {
      day: 2, title: 'SORT THE SUPPLY CART', subtitle: 'Sort each mixture. Choose its best use.',
      counters: [{ label: 'TIME', glyph: 'clock', color: '#e8dcc0' }, { label: 'SCORE', glyph: 'star' }, { label: 'STREAK', glyph: 'star', color: '#ffad39' }],
    });
    [this.timerText, this.scoreText, this.streakText] = header.values;

    supplyPanel(this, 478, 118, 896, 56, { edge: supplyPalette.blue });
    supplyHeading(this, 113, 118, 'PROGRESS', 21, '#67d8ee').setDepth(6);
    this.progressGraphics = this.add.graphics().setDepth(6);
    this.progressText = supplyText(this, 777, 118, '', 18, '#67d8ee').setDepth(6);
    this.hintButton = supplyControl(this, 1156, 678, 'HINT 3', () => this.showHint(), { icon: 'bulb', width: 174, height: 56 });
    createBottomFeedback(this, { primary: 'CLASSIFY. CHECK. COMPLETE.', secondary: 'Sort each mixture, then choose its best everyday use.', rightInset: 194 });
    this.feedback = { setText: (primary, secondary) => {
      this.lastFeedback = { primary, secondary };
      this.feedbackPrimary?.setText(primary);
      this.feedbackSecondary?.setText(secondary);
    } };
    this.updateHudText();
  }

  createBins() {
    this.bins = [
      {
        id: 'uniform',
        label: 'UNIFORM\nMIXTURE',
        x: 330,
        y: 270,
        width: BIN_WIDTH,
        height: BIN_HEIGHT,
        color: 0x2278c9,
      },
      {
        id: 'nonuniform',
        label: 'NON-UNIFORM\nMIXTURE',
        x: 702,
        y: 270,
        width: BIN_WIDTH,
        height: BIN_HEIGHT,
        color: 0x58cc02,
      },
    ];

    this.bins.forEach((bin) => {
      const container = this.add.container(bin.x, bin.y);
      container.setDepth(4);

      const graphics = this.add.image(0, 0, bin.id === 'uniform' ? 'supply-bin-blue' : 'supply-bin-green');
      graphics.setDisplaySize(bin.width, bin.height);
      const plate = supplyPanel(this, 26, 36, 174, 88, { fill: supplyPalette.cream, edge: 0x8d8067 });
      const label = this.add.text(26, 28, bin.label, textStyle(23, bin.id === 'uniform' ? '#153c72' : '#224820'));
      label.setOrigin(0.5);
      label.setLineSpacing(-5);

      const icon = supplyGlyph(this, 26, 63, 'flask', bin.id === 'uniform' ? 0x74c9ec : 0x70b529, 2);

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

      container.add([graphics, plate, label, icon, zone]);
      bin.bounds = new Phaser.Geom.Rectangle(bin.x - bin.width / 2, bin.y - bin.height / 2, bin.width, bin.height);
      bin.container = container;
    });
  }

  createConveyor() {
    this.add.image(478, 486, 'supply-conveyor').setDisplaySize(886, 174).setDepth(2);
    supplyPanel(this, 478, 396, 298, 29, { fill: 0x322240 });
    supplyText(this, 478, 396, 'DRAG AN ITEM TO A BIN', 19, '#d1a4d3').setDepth(6);
  }

  createItemCards() {
    const totalWidth = VISIBLE_ITEM_COUNT * ITEM_CARD_WIDTH + (VISIBLE_ITEM_COUNT - 1) * ITEM_CARD_GAP;
    const startX = 478 - totalWidth / 2 + ITEM_CARD_WIDTH / 2;

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
    const parchment = this.add.image(0, 0, 'supply-item-card').setDisplaySize(ITEM_CARD_WIDTH, ITEM_CARD_HEIGHT);
    const icon = createMixtureIcon(this, item.icon, { y: -15, width: 70, height: 70 });
    const label = this.add.text(0, 32, item.name.toUpperCase(), textStyle(17, '#2f2a2a'));
    label.setOrigin(0.5);
    label.setWordWrapWidth(ITEM_CARD_WIDTH - 14);
    label.setLineSpacing(-3);

    container.add([shadow, parchment, face, icon, label]);
    item.container = container;
    item.face = face;
    item.iconView = icon;
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
    if (this.selectedItem?.id === item.id || this.canUseItem(item)) {
      item.face.lineStyle(3, supplyPalette.gold, 1);
      item.face.strokeRect(-ITEM_CARD_WIDTH / 2 + 3, -ITEM_CARD_HEIGHT / 2 + 3, ITEM_CARD_WIDTH - 6, ITEM_CARD_HEIGHT - 6);
    }
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
    this.feedback.setText(item.name.toUpperCase(), 'DROP IT INTO THE CORRECT MIXTURE BIN.');
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
      this.updateHudText();
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
    this.activeUseItem = item;
    this.renderUsePanel(item);
  }

  renderUsePanel(item = null, answeredChoice = null) {
    this.usePanel?.destroy(true);
    this.useChoices = [];
    const panelX = 1103, panelY = 309;
    const panel = this.add.container(panelX, panelY).setDepth(30);
    panel.add(supplyPanel(this, 0, 0, 330, 444, { fill: 0x101a2b, edge: 0x805398 }));
    panel.add(supplyHeading(this, 0, -202, 'USE CHECK', 23, '#ec92b2'));
    panel.add(supplyPanel(this, 0, -144, 298, 80, { fill: 0x242339, edge: 0x805398 }));
    panel.add(supplyPanel(this, -101, -144, 70, 64, { fill: supplyPalette.cream, edge: 0x92806e }));
    if (item) {
      panel.add(createMixtureIcon(this, item.icon, { x: -101, y: -144, width: 58, height: 58 }));
      const name = supplyText(this, -47, -137, item.name.toUpperCase(), 22, '#ffcb4c', 'left');
      name.setWordWrapWidth(188);
      panel.add([supplyText(this, -47, -163, 'ITEM:', 17, '#ffcb4c', 'left'), name]);
    } else {
      panel.add(supplyGlyph(this, -101, -144, 'flask', 0x367096, 4));
      panel.add(supplyText(this, -47, -144, 'SORT AN ITEM\nTO CHECK ITS USE', 18, '#b5bbcf', 'left'));
    }
    panel.add(supplyText(this, 0, -91, 'What is its best use?', 19));
    const choices = item?.useChoices ?? ['SORT FIRST', 'CHECK ITS USE', 'EARN BONUS POINTS'];
    choices.forEach((choice, index) => {
      const y = -47 + index * 53;
      const answered = answeredChoice !== null;
      const correct = answered && choice === item.use;
      const selectedWrong = answered && choice === answeredChoice && !correct;
      const bg = supplyPanel(this, 0, y, 292, 43, {
        fill: correct ? 0x3c710d : selectedWrong ? 0x682b35 : item ? supplyPalette.cream : 0x1c2d40,
        edge: correct ? supplyPalette.green : selectedWrong ? 0xb96b74 : item ? 0x9b856c : 0x3c526b,
      });
      const label = supplyText(this, -118, y, `${String.fromCharCode(65 + index)}. ${choice}`, 20,
        correct || selectedWrong ? '#fff3cc' : item ? '#252727' : '#788ca5', 'left');
      label.setWordWrapWidth(242);
      panel.add([bg, label]);
      if (item && !answered) {
        const zone = this.add.zone(0, y, 292, 43).setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => bg.setAlpha(0.8));
        zone.on('pointerout', () => bg.setAlpha(1));
        zone.on('pointerup', () => this.answerUse(item, choice));
        panel.add(zone);
        this.useChoices.push({ label: choice, x: panelX, y: panelY + y, correct: choice === item.use });
      }
    });
    panel.add(supplyPanel(this, 0, 127, 298, 80, { fill: 0x122a17, edge: 0x467731 }));
    panel.add(supplyGlyph(this, -123, 126, 'star', supplyPalette.gold, 3));
    this.feedbackPrimary = supplyText(this, -94, 105, this.lastFeedback.primary, 21, '#b0ef39', 'left');
    this.feedbackPrimary.setWordWrapWidth(223);
    this.feedbackSecondary = supplyText(this, -94, 142, this.lastFeedback.secondary, 17, '#e8dcc0', 'left');
    this.feedbackSecondary.setWordWrapWidth(223);
    panel.add([this.feedbackPrimary, this.feedbackSecondary]);
    panel.add(supplyPanel(this, 0, 195, 298, 44, { fill: 0x2d1e3d, edge: 0x805398 }));
    panel.add(this.add.image(-121, 195, 'supply-guide').setDisplaySize(39, 39));
    panel.add(supplyText(this, -91, 195, answeredChoice !== null && answeredChoice === item.use
      ? 'Great job! Keep the streak going.' : 'Look closely at each mixture.', 16, '#ddd2e8', 'left'));
    this.usePanel = panel;
  }

  answerUse(item, choice) {
    if (this.paused || this.currentModal || !this.activeUseItem || item.id !== this.activeUseItem.id) {
      return;
    }

    const isCorrect = choice === item.use;

    if (isCorrect) {
      this.score += supplyCartSortingGame.score.correctUse;
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

    this.renderUsePanel(item, choice);

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
    const waiting = this.items.filter((item) => !item.sorted && !item.completed);
    const visible = new Set(waiting.slice(0, VISIBLE_ITEM_COUNT));
    const queueKey = waiting.map((item) => item.id).join(',');
    if (queueKey !== this.conveyorQueueKey) {
      waiting.forEach((item, index) => {
        item.homeX = 133 + (index % VISIBLE_ITEM_COUNT) * (ITEM_CARD_WIDTH + ITEM_CARD_GAP);
        this.setItemPosition(item, item.homeX, item.homeY);
      });
      this.conveyorQueueKey = queueKey;
    }
    this.items.forEach((item) => {
      if (!item.container) {
        return;
      }

      const active = this.canUseItem(item);
      item.container.setAlpha(active ? 1 : item.sorted ? 0.4 : 0.85);
      if (item.completed || item.sorted || !visible.has(item)) {
        item.container.setVisible(false);
        item.hitZone?.setVisible(false);
        item.hitZone?.disableInteractive();
      } else {
        item.container.setVisible(true);
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
    if (this.result || this.paused || this.currentModal || this.activeUseItem || item.sorted || item.completed) {
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
    const seconds = Math.ceil(this.timeRemaining);
    this.timerText?.setText(`${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`);
    this.scoreText?.setText(String(this.score));
    this.streakText?.setText(`x${this.combo}`);
    const max = this.items?.length ?? supplyCartSortingGame.items.length;
    this.progressGraphics?.clear();
    for (let i = 0; i < max; i += 1) {
      this.progressGraphics.fillStyle(i < this.correctSorts ? 0x6eb81c : 0x26374a);
      this.progressGraphics.fillRect(210 + i * (430 / max), 108, 430 / max - 4, 20);
      this.progressGraphics.lineStyle(2, i < this.correctSorts ? 0x9dde37 : 0x080f18);
      this.progressGraphics.strokeRect(210 + i * (430 / max), 108, 430 / max - 4, 20);
    }
    this.progressText?.setText(`${this.correctSorts} / ${max} ITEMS SORTED`);
  }

  resumePlay() {
    closeOpenModal(this);
    this.paused = false;
    this.refreshItemCards();
    this.updateTestState();
  }

  showHint() {
    if (this.result || this.currentModal || this.hintsRemaining <= 0) return;
    this.paused = true;
    this.hintsRemaining -= 1;
    this.hintButton.list.find((child) => child.type === 'Text')?.setText(`HINT ${this.hintsRemaining}`);
    if (this.hintsRemaining === 0) this.hintButton.setAlpha(0.5);
    const item = this.activeUseItem ?? this.getActiveItem();
    showModal(this, {
      name: 'supply-hint', title: 'QUICK HINT', height: 320,
      body: (_overlay, { panelX, panelY }) => {
        const hint = supplyText(this, panelX, panelY - 6, this.activeUseItem
          ? 'Think about where this mixture is used in everyday life.' : item?.hint ?? 'Look for visible separate parts.', 24);
        hint.setWordWrapWidth(430);
        return [hint];
      },
      buttons: [{ label: 'GOT IT', action: () => this.resumePlay() }],
    });
    this.updateTestState();
  }

  openSettings() {
    if (this.result || this.currentModal) return;
    this.paused = true;
    showModal(this, {
      name: 'supply-settings', title: 'SETTINGS', height: 360,
      body: (_overlay, { panelX, panelY }) => [
        createToggleRow(this, panelX - 16, panelY - 32, 'MUSIC', this.registry.get('musicEnabled'), (enabled) => {
          this.registry.set('musicEnabled', enabled); playAreaMusic(this, this.islandId);
        }),
        createToggleRow(this, panelX - 16, panelY + 34, 'SFX', this.registry.get('sfxEnabled'), (enabled) => {
          this.registry.set('sfxEnabled', enabled);
        }),
      ],
      buttons: [{ label: 'BACK', action: () => this.resumePlay() }],
    });
    this.updateTestState();
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
      if (this.result) this.returnToQuarter();
      else this.resumePlay();
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

  getSortAccuracy() {
    if (this.sortAttempts === 0) {
      return 100;
    }

    return Math.round((this.correctSorts / this.sortAttempts) * 100);
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
      minigameId: supplyCartSortingGame.id,
      totalItemCount: this.items?.length ?? supplyCartSortingGame.items.length,
      activeItemId: this.getActiveItem()?.id ?? null,
      sortedCount: this.correctSorts,
      completedItemCount: this.completedItemCount,
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
      paused: this.paused,
      hintsRemaining: this.hintsRemaining,
      supplyControls: { hint: { x: 1156, y: 678 }, settings: this.navigationMeta.settings },
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
