import Phaser from 'phaser';
import { closeMinigameHelp } from '../ui/minigameHelp.js';
import { createMinigameNavigation } from '../ui/minigameNavigation.js';
import { createMixtureIcon } from '../ui/assetIcons.js';
import { mixMatchMixturesGame } from '../config/content.js';
import { GAME_WIDTH } from '../config/gameConfig.js';
import { getPostGameAssessmentLabel, startPostGameAssessment } from '../systems/assessmentFlow.js';
import { markSceneReady, setTestState, TEST_MODE } from '../systems/testSeam.js';
import {
  createBottomFeedback,
  createMinigameHud,
  createSparkles as createSharedSparkles,
  drawMinigameBackdrop,
} from '../ui/minigameUi.js';
import { closeOpenModal, showModal, textStyle } from '../ui/ui.js';

const CARD_WIDTH = 178;
const CARD_HEIGHT = 116;
const CARD_GAP_X = 24;
const CARD_GAP_Y = 24;
const GRID_COLUMNS = 4;
const GRID_START_Y = 218;

export default class MixMatchScene extends Phaser.Scene {
  constructor() {
    super('MixMatchScene');
  }

  init(data) {
    this.islandId = data.islandId ?? 'vulcan-caverns';
    this.quarterId = data.quarterId ?? 'q1';
    this.majorId = data.majorId ?? 'q1-major-1';
    this.lessonId = data.lessonId ?? mixMatchMixturesGame.lessonId;
    this.returnScrollY = Number.isFinite(data.returnScrollY) ? data.returnScrollY : 0;
    this.currentModal = null;
  }

  create() {
    this.score = 0;
    this.timeRemaining = mixMatchMixturesGame.timerSeconds;
    this.result = null;
    this.selectedCards = [];
    this.matchedSetCount = 0;
    this.isResolving = false;
    this.selectionStartedAt = 0;
    this.lastTimerSecond = Math.ceil(this.timeRemaining);

    this.drawLabBackground();
    this.createHud();
    this.createCards();
    this.setupKeyboardShortcuts();

    markSceneReady('MixMatchScene', this.buildTestState());
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
      this.finishGame(false);
    }
  }

  drawLabBackground() {
    drawMinigameBackdrop(this, 'mix-match-backdrop');
  }

  createHud() {
    createMinigameNavigation(this);
    this.hud = createMinigameHud(this, {
      title: mixMatchMixturesGame.title,
      topic: mixMatchMixturesGame.topic,
      progressLabel: 'MATCHED SETS',
      progressValue: this.matchedSetCount,
      progressMax: mixMatchMixturesGame.sets.length,
      score: this.score,
      time: this.timeRemaining,
    });

    this.feedback = createBottomFeedback(this, {
      primary: 'MATCH THREE CLUES',
      secondary: 'Choose a term, a picture, and a description.',
    });
    this.messageText = this.feedback.primaryText;
    this.clueText = this.feedback.secondaryText;
  }

  drawProgressBar() {
    this.hud?.setProgress(this.matchedSetCount, mixMatchMixturesGame.sets.length);
  }

  createCards() {
    this.cards = this.shuffleCards(this.createCardData());
    const gridStartX = (GAME_WIDTH - (GRID_COLUMNS * CARD_WIDTH + (GRID_COLUMNS - 1) * CARD_GAP_X)) / 2 + CARD_WIDTH / 2;

    this.cards.forEach((card, index) => {
      const column = index % GRID_COLUMNS;
      const row = Math.floor(index / GRID_COLUMNS);
      card.x = gridStartX + column * (CARD_WIDTH + CARD_GAP_X);
      card.y = GRID_START_Y + row * (CARD_HEIGHT + CARD_GAP_Y);
      this.createCardView(card);
    });
  }

  createCardData() {
    return mixMatchMixturesGame.sets.flatMap((set) => [
      {
        id: `${set.id}-term`,
        setId: set.id,
        conceptId: set.conceptId,
        type: 'term',
        label: set.term,
        clue: set.clue,
        flipped: false,
        matched: false,
      },
      {
        id: `${set.id}-picture`,
        setId: set.id,
        conceptId: set.conceptId,
        type: 'picture',
        label: set.picture,
        icon: set.icon,
        clue: set.clue,
        flipped: false,
        matched: false,
      },
      {
        id: `${set.id}-description`,
        setId: set.id,
        conceptId: set.conceptId,
        type: 'description',
        label: set.description,
        clue: set.clue,
        flipped: false,
        matched: false,
      },
    ]);
  }

  shuffleCards(cards) {
    const nextCards = [...cards];

    if (TEST_MODE) {
      return nextCards;
    }

    return Phaser.Utils.Array.Shuffle(nextCards);
  }

  createCardView(card) {
    const container = this.add.container(card.x, card.y);
    container.setDepth(5);
    container.setData('cardId', card.id);

    const shadow = this.add.rectangle(6, 8, CARD_WIDTH, CARD_HEIGHT, 0x000000, 0.26);
    shadow.setOrigin(0.5);
    const face = this.add.graphics();
    const content = this.add.container(0, 0);
    const hitArea = this.add.zone(0, 0, CARD_WIDTH, CARD_HEIGHT).setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      if (!card.matched && !card.flipped && !this.isResolving && !this.result) {
        container.setScale(1.04);
      }
    });
    hitArea.on('pointerout', () => {
      container.setScale(1);
    });
    hitArea.on('pointerup', () => this.flipCard(card));

    card.container = container;
    card.face = face;
    card.content = content;
    container.add([shadow, face, content, hitArea]);
    this.drawCard(card);
  }

  drawCard(card) {
    card.face.clear();
    card.content.removeAll(true);

    if (!card.flipped && !card.matched) {
      this.drawCardBack(card);
      return;
    }

    this.drawCardFront(card);
  }

  drawCardBack(card) {
    card.face.fillStyle(0x4f4b86, 1);
    card.face.lineStyle(4, 0xffefb5, 1);
    card.face.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 8);
    card.face.strokeRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 8);
    card.face.lineStyle(2, 0x66e5ff, 0.52);
    card.face.strokeRoundedRect(-CARD_WIDTH / 2 + 9, -CARD_HEIGHT / 2 + 9, CARD_WIDTH - 18, CARD_HEIGHT - 18, 6);
    card.face.fillStyle(0x2b2857, 0.55);
    card.face.fillCircle(0, 0, 36);

    const mark = this.add.text(0, -4, '?', textStyle(54, '#fff2c9'));
    mark.setOrigin(0.5);
    mark.setShadow(3, 3, '#000000', 0, false, true);
    card.content.add(mark);
  }

  drawCardFront(card) {
    const fill = card.matched ? 0xe7ffd6 : 0xfff2c9;
    const stroke = card.matched ? 0x58cc02 : 0x9e6b47;
    card.face.fillStyle(fill, 1);
    card.face.lineStyle(4, stroke, 1);
    card.face.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 8);
    card.face.strokeRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 8);
    card.face.lineStyle(2, 0xffffff, 0.58);
    card.face.strokeRoundedRect(-CARD_WIDTH / 2 + 8, -CARD_HEIGHT / 2 + 8, CARD_WIDTH - 16, CARD_HEIGHT - 16, 6);

    const typeLabel = this.add.text(0, -43, card.type.toUpperCase(), textStyle(15, '#7c5b34'));
    typeLabel.setOrigin(0.5);
    card.content.add(typeLabel);

    if (card.type === 'picture') {
      const icon = createMixtureIcon(this, card.icon, { y: -4, width: 80, height: 72 });
      const label = this.add.text(0, 35, card.label.toUpperCase(), textStyle(18, '#2f2a2a'));
      label.setOrigin(0.5);
      label.setWordWrapWidth(CARD_WIDTH - 22);
      card.content.add([icon, label]);
      return;
    }

    const labelSize = card.type === 'description' ? 18 : 24;
    const label = this.add.text(0, 12, card.label.toUpperCase(), textStyle(labelSize, '#2f2a2a'));
    label.setOrigin(0.5);
    label.setWordWrapWidth(CARD_WIDTH - 18);
    label.setLineSpacing(card.type === 'description' ? -6 : -3);
    card.content.add(label);

    const accent = this.add.graphics();
    accent.fillStyle(card.type === 'term' ? 0x66e5ff : 0xffd76a, 0.95);
    accent.fillRoundedRect(-36, -26, 72, 8, 4);
    card.content.add(accent);
  }

  flipCard(card) {
    if (this.result || this.currentModal || this.isResolving || card.flipped || card.matched || this.selectedCards.length >= 3) {
      return;
    }

    if (this.selectedCards.length === 0) {
      this.selectionStartedAt = this.time.now;
    }

    card.flipped = true;
    this.selectedCards.push(card);
    this.drawCard(card);

    this.tweens.add({
      targets: card.container,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 90,
      yoyo: true,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onComplete: () => {
        card.container.setScale(1);
      },
    });

    this.updateTestState();

    if (this.selectedCards.length === 3) {
      this.isResolving = true;
      this.time.delayedCall(280, () => this.checkSelection());
    }
  }

  checkSelection() {
    const selected = [...this.selectedCards];
    const typeSet = new Set(selected.map((card) => card.type));
    const conceptIdSet = new Set(selected.map((card) => card.conceptId));
    const hasAllTypes = ['term', 'picture', 'description'].every((type) => typeSet.has(type));
    const isCorrect = hasAllTypes && conceptIdSet.size === 1;

    if (isCorrect) {
      this.handleCorrectMatch(selected);
      return;
    }

    this.handleWrongMatch(selected);
  }

  handleCorrectMatch(cards) {
    const elapsedSeconds = (this.time.now - this.selectionStartedAt) / 1000;
    const fastBonus = elapsedSeconds <= mixMatchMixturesGame.score.fastMatchSeconds ? mixMatchMixturesGame.score.fastBonus : 0;

    cards.forEach((card) => {
      card.matched = true;
      this.drawCard(card);
      this.createSparkles(card.x, card.y);
    });

    this.matchedSetCount += 1;
    this.score += mixMatchMixturesGame.score.correct + fastBonus;
    this.selectedCards = [];
    this.isResolving = false;

    const clue = cards[0].clue;
    this.messageText.setText(fastBonus > 0 ? `CORRECT MATCH +${mixMatchMixturesGame.score.correct} FAST +${fastBonus}` : `CORRECT MATCH +${mixMatchMixturesGame.score.correct}`);
    this.clueText.setText(clue.toUpperCase());
    this.updateHudText();
    this.drawProgressBar();
    this.updateTestState();

    if (this.matchedSetCount === mixMatchMixturesGame.sets.length) {
      this.finishGame(true);
    }
  }

  handleWrongMatch(cards) {
    this.messageText.setText('TRY AGAIN');
    this.clueText.setText('CHECK IF THE CARDS SHARE THE SAME MIXTURE IDEA.');

    cards.forEach((card) => {
      this.tweens.add({
        targets: card.container,
        x: card.x + 10,
        duration: 55,
        yoyo: true,
        repeat: 4,
        ease: Phaser.Math.Easing.Sine.InOut,
        onComplete: () => {
          card.container.x = card.x;
        },
      });
    });

    this.time.delayedCall(950, () => {
      cards.forEach((card) => {
        if (!card.matched) {
          card.flipped = false;
          this.drawCard(card);
        }
      });
      this.selectedCards = [];
      this.isResolving = false;
      this.updateTestState();
    });
  }

  createSparkles(x, y) {
    createSharedSparkles(this, x, y);
  }

  finishGame(won) {
    if (this.result) {
      return;
    }

    this.result = won ? 'win' : 'lose';

    if (won) {
      this.score += mixMatchMixturesGame.score.finishEarly;
      this.messageText.setText(`LEVEL COMPLETE +${mixMatchMixturesGame.score.finishEarly}`);
      this.clueText.setText('ALL MIXTURE SETS MATCHED.');
    } else {
      this.messageText.setText('TIME IS UP');
      this.clueText.setText('RETRY THE MEMORY QUEST TO COMPLETE THE SETS.');
    }

    this.updateHudText();
    this.updateTestState();
    this.showResultModal(won);
  }

  showResultModal(won) {
    showModal(this, {
      name: won ? 'result-win' : 'result-lose',
      title: won ? 'QUEST COMPLETE' : 'TIME IS UP',
      height: won ? 330 : 340,
      body: (_overlay, { panelX, panelY }) => {
        const result = this.add.text(panelX, panelY - 14, won ? `FINAL SCORE ${this.score}` : `SCORE ${this.score}`, textStyle(31, '#66e5ff'));
        result.setOrigin(0.5);
        const message = this.add.text(
          panelX,
          panelY + 36,
          won ? 'YOU MATCHED EVERY MIXTURE SET.' : 'MATCH ALL SETS BEFORE THE TIMER ENDS.',
          textStyle(22, '#fff2c9'),
        );
        message.setOrigin(0.5);
        message.setWordWrapWidth(430);
        return [result, message];
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
    this.hud?.setProgress(this.matchedSetCount, mixMatchMixturesGame.sets.length);
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
      minigameId: mixMatchMixturesGame.id,
      totalCardCount: this.cards?.length ?? 0,
      totalSetCount: mixMatchMixturesGame.sets.length,
      matchedSetCount: this.matchedSetCount ?? 0,
      flippedCount: this.cards?.filter((card) => card.flipped && !card.matched).length ?? 0,
      score: this.score ?? 0,
      timeRemaining: Math.ceil(this.timeRemaining ?? mixMatchMixturesGame.timerSeconds),
      gameResult: this.result,
      mixMatchCards: this.cards?.map((card) => ({
        id: card.id,
        setId: card.setId,
        conceptId: card.conceptId,
        type: card.type,
        label: card.label,
        x: card.x,
        y: card.y,
        flipped: card.flipped,
        matched: card.matched,
      })) ?? [],
    };
  }

  updateTestState() {
    setTestState(this.buildTestState());
  }
}
