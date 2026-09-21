import Phaser from 'phaser';
import {
  inventMixWorkshopGame,
  mixMatchMixturesGame,
  mixtureDetectiveGame,
  scienceCourtGame,
  supplyCartSortingGame,
  vulcanQuarterDetails,
} from '../config/content.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { markSceneReady, setTestCommand, setTestState } from '../systems/testSeam.js';
import { drawMixtureIcon } from '../ui/minigameUi.js';
import { closeOpenModal, colors, createBackArrow, showModal, textStyle } from '../ui/ui.js';

const HEADER_HEIGHT = 112;
const FIRST_MAJOR_Y = 450;
const MAJOR_SPACING = 540;
const CONTENT_HEIGHT = 2280;
const LEFT_LESSON_OFFSETS = [
  { x: 760, y: 50 },
  { x: 640, y: 130 },
  { x: 790, y: 210 },
  { x: 670, y: 290 },
  { x: 820, y: 370 },
];
const RIGHT_LESSON_OFFSETS = [
  { x: 520, y: 50 },
  { x: 650, y: 130 },
  { x: 490, y: 210 },
  { x: 610, y: 290 },
  { x: 460, y: 370 },
];

const MINIGAMES = {
  [mixMatchMixturesGame.lessonId]: {
    sceneKey: 'MixMatchScene',
    game: mixMatchMixturesGame,
    kind: 'memory',
  },
  [supplyCartSortingGame.lessonId]: {
    sceneKey: 'SupplyCartScene',
    game: supplyCartSortingGame,
    kind: 'sorting',
  },
  [mixtureDetectiveGame.lessonId]: {
    sceneKey: 'MixtureDetectiveScene',
    game: mixtureDetectiveGame,
    kind: 'detective',
  },
  [scienceCourtGame.lessonId]: {
    sceneKey: 'ScienceCourtScene',
    game: scienceCourtGame,
    kind: 'court',
  },
  [inventMixWorkshopGame.lessonId]: {
    sceneKey: 'InventMixScene',
    game: inventMixWorkshopGame,
    kind: 'invent',
  },
};

export default class QuarterDetailScene extends Phaser.Scene {
  constructor() {
    super('QuarterDetailScene');
  }

  init(data) {
    this.islandId = data.islandId ?? 'vulcan-caverns';
    this.quarterId = data.quarterId ?? 'q1';
    this.quarter = vulcanQuarterDetails[this.quarterId] ?? vulcanQuarterDetails.q1;
    this.maxScrollY = CONTENT_HEIGHT - GAME_HEIGHT;
    this.initialScrollY = Number.isFinite(data.scrollY) ? data.scrollY : 0;
    this.dragStartY = 0;
    this.dragStartScrollY = 0;
    this.isDraggingPath = false;
    this.currentModal = null;
    this.majorAccess = globalThis.GLMS_PHASER?.majorAccess ?? {};
    this.lessonAccess = globalThis.GLMS_PHASER?.lessonAccess ?? {};
    this.lockedMessage = globalThis.GLMS_PHASER?.lockedMessage ?? 'This lesson is locked by your teacher.';
  }

  create() {
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, CONTENT_HEIGHT);
    this.drawScrollableWorld();
    this.drawQuarterPath();
    this.createHeader();
    this.setupScrolling();
    this.setupKeyboardShortcuts();
    this.setScrollY(this.initialScrollY);

    const lessonCount = this.quarter.majors.reduce((total, major) => total + major.lessons.length, 0);
    markSceneReady('QuarterDetailScene', {
      selectedIsland: this.islandId,
      selectedQuarter: this.quarter.id,
      selectedMajor: null,
      selectedLesson: null,
      quarterMajorCount: this.quarter.majors.length,
      quarterLessonCount: lessonCount,
      scrollY: this.cameras.main.scrollY,
    });
    setTestCommand('setQuarterScrollY', (value) => {
      this.setScrollY(value);
      return this.cameras.main.scrollY;
    });
  }

  drawScrollableWorld() {
    this.add.rectangle(0, 0, GAME_WIDTH, CONTENT_HEIGHT, 0xf5f4ef, 1).setOrigin(0);

    const banner = this.add.graphics();
    banner.fillStyle(0x54c900, 1);
    banner.fillRoundedRect(90, 136, 1100, 170, 8);
    banner.fillStyle(0x45a900, 1);
    banner.fillRoundedRect(1028, 136, 162, 170, 8);
    banner.fillStyle(0x2e8c00, 1);
    banner.fillRect(90, 292, 1100, 18);

    const section = this.add.text(142, 178, `${this.quarter.label} SCIENCE`, textStyle(32, '#d8ffc7', 'left'));
    section.setOrigin(0, 0.5);
    const title = this.add.text(142, 242, this.quarter.title.toUpperCase(), textStyle(44, '#ffffff', 'left'));
    title.setOrigin(0, 0.5);

    this.drawListIcon(1110, 222);
  }

  createHeader() {
    const blocker = this.add.rectangle(0, 0, GAME_WIDTH, HEADER_HEIGHT, 0xffffff, 0.97).setOrigin(0);
    blocker.setDepth(500);
    blocker.setScrollFactor(0);

    const bottomLine = this.add.rectangle(0, HEADER_HEIGHT - 3, GAME_WIDTH, 3, 0xd6d6d6, 1).setOrigin(0);
    bottomLine.setDepth(501);
    bottomLine.setScrollFactor(0);

    const back = createBackArrow(this, () => {
      this.scene.start('IslandMapScene', { islandId: this.islandId });
    });
    back.setDepth(502);
    back.setScrollFactor(0);
    back.each((child) => {
      child.setScrollFactor?.(0);
    });

    const backHitZone = this.add.zone(64, 62, 108, 84);
    backHitZone.setDepth(503);
    backHitZone.setScrollFactor(0);
    backHitZone.setInteractive({ useHandCursor: true });
    backHitZone.on('pointerup', () => {
      this.scene.start('IslandMapScene', { islandId: this.islandId });
    });

    const title = this.add.text(145, 43, this.quarter.title.toUpperCase(), textStyle(30, '#2f2a2a', 'left'));
    title.setOrigin(0, 0.5);
    title.setDepth(502);
    title.setScrollFactor(0);

    const subtitle = this.add.text(145, 78, this.quarter.subtitle, textStyle(23, '#7e7e7e', 'left'));
    subtitle.setOrigin(0, 0.5);
    subtitle.setDepth(502);
    subtitle.setScrollFactor(0);
  }

  drawQuarterPath() {
    this.quarter.majors.forEach((major, majorIndex) => {
      const majorX = majorIndex % 2 === 0 ? 430 : 850;
      const majorY = FIRST_MAJOR_Y + majorIndex * MAJOR_SPACING;
      const lessonOffsets = majorIndex % 2 === 0 ? LEFT_LESSON_OFFSETS : RIGHT_LESSON_OFFSETS;
      const lessonPoints = lessonOffsets.map((offset, lessonIndex) => ({
        x: offset.x,
        y: majorY + offset.y,
        lesson: major.lessons[lessonIndex],
      }));

      this.drawDottedPath([{ x: majorX, y: majorY }, ...lessonPoints]);
      this.createMajorNode(major, majorX, majorY);
      lessonPoints.forEach(({ x, y, lesson }, lessonIndex) => {
        this.createLessonNode(major, lesson, x, y, lessonIndex);
      });
    });
  }

  drawDottedPath(points) {
    const graphics = this.add.graphics();
    graphics.setDepth(1);
    graphics.fillStyle(0xd7c790, 0.9);

    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index];
      const end = points[index + 1];
      const distance = Phaser.Math.Distance.Between(start.x, start.y, end.x, end.y);
      const steps = Math.max(3, Math.floor(distance / 26));

      for (let step = 1; step < steps; step += 1) {
        const t = step / steps;
        const x = Phaser.Math.Linear(start.x, end.x, t);
        const y = Phaser.Math.Linear(start.y, end.y, t);
        graphics.fillCircle(x, y, 5);
      }
    }
  }

  createMajorNode(major, x, y) {
    const isLocked = this.isMajorLocked(major.id);
    const container = this.add.container(x, y);
    container.setDepth(10);
    container.setData('majorId', major.id);

    const shadow = this.add.ellipse(10, 18, 130, 42, 0x000000, 0.15);
    const base = this.add.circle(0, 0, 72, isLocked ? 0xc8d8ab : 0x58cc02, 1);
    base.setStrokeStyle(7, isLocked ? 0x8ea264 : 0x47a800, 1);
    const shine = this.add.arc(-14, -18, 50, 205, 320, false, isLocked ? 0xe6efd2 : 0x8eea32, isLocked ? 0.28 : 0.35);
    const icon = this.add.graphics();
    this.drawMajorIcon(icon, major.icon, isLocked);

    const label = this.add.text(0, 98, major.title.toUpperCase(), textStyle(23, isLocked ? '#6d755c' : '#2f2a2a'));
    label.setOrigin(0.5);
    label.setWordWrapWidth(255);
    const lockBadge = isLocked ? this.createMajorLockBadge(46, -46) : null;

    const hitArea = this.add.zone(0, 0, 150, 150).setInteractive({ useHandCursor: true });
    hitArea.on('pointerover', () => container.setScale(isLocked ? 1.04 : 1.08));
    hitArea.on('pointerout', () => container.setScale(1));
    hitArea.on('pointerup', () => this.openMajor(major));

    if (isLocked) {
      container.setAlpha(0.94);
    }

    container.add([shadow, base, shine, icon, label, hitArea, lockBadge].filter(Boolean));
  }

  createLessonNode(major, lesson, x, y, lessonIndex) {
    const isLocked = this.isLessonLocked(lesson.id);
    const container = this.add.container(x, y);
    container.setDepth(9);
    container.setData('lessonId', lesson.id);

    const shadow = this.add.circle(5, 7, 31, 0x000000, 0.14);
    const base = this.add.circle(0, 0, 31, isLocked ? 0xe6dece : colors.cream, 1);
    base.setStrokeStyle(5, isLocked ? 0xa78852 : 0xc4a55c, 1);
    const inner = this.add.circle(0, 0, 17, isLocked ? 0xf4ebd5 : 0xfff7cf, 1);
    const label = this.add.text(0, -1, `${lessonIndex + 1}`, textStyle(20, isLocked ? '#7c6545' : '#5b4322'));
    label.setOrigin(0.5);
    const lockBadge = isLocked ? this.createLessonLockBadge(21, -21) : null;

    const hitArea = this.add.zone(0, 0, 78, 78).setInteractive({ useHandCursor: true });
    hitArea.on('pointerover', () => container.setScale(isLocked ? 1.05 : 1.12));
    hitArea.on('pointerout', () => container.setScale(1));
    hitArea.on('pointerup', () => this.openLesson(major, lesson));

    if (isLocked) {
      container.setAlpha(0.94);
    }

    container.add([shadow, base, inner, label, hitArea, lockBadge].filter(Boolean));
  }

  drawMajorIcon(graphics, icon, isLocked = false) {
    const iconColor = isLocked ? 0xf6f1df : 0xffffff;
    const cutoutColor = isLocked ? 0xc8d8ab : 0x58cc02;
    graphics.fillStyle(iconColor, 1);
    graphics.lineStyle(8, iconColor, 1);

    if (icon === 'beaker') {
      graphics.strokeRect(-22, -38, 44, 62);
      graphics.fillCircle(0, 21, 26);
      graphics.fillRect(-18, 6, 36, 18);
      return;
    }

    if (icon === 'filter') {
      graphics.beginPath();
      graphics.moveTo(-38, -34);
      graphics.lineTo(38, -34);
      graphics.lineTo(12, 2);
      graphics.lineTo(12, 34);
      graphics.lineTo(-12, 34);
      graphics.lineTo(-12, 2);
      graphics.closePath();
      graphics.fillPath();
      return;
    }

    if (icon === 'spark' || icon === 'bolt') {
      graphics.beginPath();
      graphics.moveTo(8, -44);
      graphics.lineTo(-30, 8);
      graphics.lineTo(-4, 8);
      graphics.lineTo(-14, 46);
      graphics.lineTo(34, -10);
      graphics.lineTo(8, -10);
      graphics.closePath();
      graphics.fillPath();
      return;
    }

    if (icon === 'heart') {
      graphics.fillCircle(-18, -12, 22);
      graphics.fillCircle(18, -12, 22);
      graphics.beginPath();
      graphics.moveTo(-37, -2);
      graphics.lineTo(0, 42);
      graphics.lineTo(37, -2);
      graphics.closePath();
      graphics.fillPath();
      return;
    }

    if (icon === 'paw') {
      graphics.fillCircle(-27, -14, 11);
      graphics.fillCircle(-9, -26, 11);
      graphics.fillCircle(9, -26, 11);
      graphics.fillCircle(27, -14, 11);
      graphics.fillCircle(0, 17, 28);
      return;
    }

    if (icon === 'leaf') {
      graphics.fillEllipse(0, 0, 76, 44);
      graphics.lineStyle(6, cutoutColor, 1);
      graphics.lineBetween(-24, 16, 30, -16);
      return;
    }

    if (icon === 'arrow') {
      graphics.lineBetween(-36, 20, 34, -28);
      graphics.beginPath();
      graphics.moveTo(38, -32);
      graphics.lineTo(20, -31);
      graphics.lineTo(33, -12);
      graphics.closePath();
      graphics.fillPath();
      return;
    }

    if (icon === 'gear') {
      graphics.fillCircle(0, 0, 34);
      graphics.fillStyle(cutoutColor, 1);
      graphics.fillCircle(0, 0, 14);
      graphics.fillStyle(iconColor, 1);
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8;
        graphics.fillRect(Math.cos(angle) * 37 - 5, Math.sin(angle) * 37 - 5, 10, 10);
      }
      return;
    }

    if (icon === 'mountain') {
      graphics.beginPath();
      graphics.moveTo(-44, 38);
      graphics.lineTo(-12, -24);
      graphics.lineTo(10, 12);
      graphics.lineTo(26, -18);
      graphics.lineTo(48, 38);
      graphics.closePath();
      graphics.fillPath();
      return;
    }

    if (icon === 'sun') {
      graphics.fillCircle(0, 0, 25);
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8;
        graphics.lineBetween(Math.cos(angle) * 34, Math.sin(angle) * 34, Math.cos(angle) * 46, Math.sin(angle) * 46);
      }
      return;
    }

    graphics.strokeCircle(0, 0, 32);
    graphics.strokeEllipse(0, 0, 86, 34);
    graphics.fillCircle(24, -10, 8);
  }

  drawListIcon(x, y) {
    const icon = this.add.graphics();
    icon.fillStyle(0xffffff, 1);
    icon.fillRoundedRect(x - 38, y - 34, 76, 68, 8);
    icon.fillStyle(0x54c900, 1);
    for (let i = 0; i < 3; i += 1) {
      const yOffset = -20 + i * 20;
      icon.fillCircle(x - 18, y + yOffset, 5);
      icon.fillRoundedRect(x - 4, y + yOffset - 4, 32, 8, 4);
    }
  }

  openMajor(major) {
    setTestState({ selectedMajor: major.id, selectedLesson: null });

    if (this.isMajorLocked(major.id)) {
      this.showLockedMajorInfo(major);
      return;
    }

    showModal(this, {
      name: 'major',
      title: major.title.toUpperCase(),
      height: 285,
      body: (overlay, { panelX, panelY }) => {
        const body = this.add.text(panelX, panelY + 8, 'COMPETENCY PLACEHOLDER', textStyle(28, '#66e5ff'));
        body.setOrigin(0.5);
        return [body];
      },
      buttons: [
        {
          label: 'BACK',
          action: () => closeOpenModal(this),
        },
      ],
    });
  }

  openLesson(major, lesson) {
    setTestState({ selectedMajor: major.id, selectedLesson: lesson.id, lockedFeedback: null });

    const minigame = MINIGAMES[lesson.id];
    if (this.isLessonLocked(lesson.id)) {
      setTestState({ lockedFeedback: lesson.id });
      this.showLockedLessonInfo(major, lesson, minigame);
      return;
    }

    if (minigame) {
      this.showMinigameInfo(major, lesson, minigame);
      return;
    }

    showModal(this, {
      name: 'lesson',
      title: `${this.quarter.label} ${major.title} ${lesson.label}`.toUpperCase(),
      height: 285,
      body: (overlay, { panelX, panelY }) => {
        const body = this.add.text(panelX, panelY + 8, 'MINIGAME PLACEHOLDER', textStyle(28, '#66e5ff'));
        body.setOrigin(0.5);
        return [body];
      },
      buttons: [
        {
          label: 'BACK',
          action: () => closeOpenModal(this),
        },
      ],
    });
  }

  showLockedLessonInfo(major, lesson, minigame) {
    const lessonAccess = this.resolveLessonAccess(lesson.id);
    const lockedMessage = this.buildLockedLessonMessage(lessonAccess);

    showModal(this, {
      name: `lesson-locked-${lesson.id}`,
      title: `LESSON ${lesson.label} LOCKED`,
      width: 700,
      height: 380,
      body: (_overlay, { panelX, panelY, panelTop }) => {
        const topic = this.add.text(
          panelX,
          panelTop + 108,
          `${this.quarter.label} ${major.title} LESSON ${lesson.label}`.toUpperCase(),
          textStyle(23, '#66e5ff'),
        );
        topic.setOrigin(0.5);
        const gameTitle = this.add.text(panelX, panelY - 12, minigame?.game?.title ?? lesson.title.toUpperCase(), textStyle(30, '#fff2c9'));
        gameTitle.setOrigin(0.5);
        const message = this.add.text(panelX, panelY + 52, lockedMessage.toUpperCase(), textStyle(23, '#ffd76a'));
        message.setOrigin(0.5);
        message.setWordWrapWidth(520);
        message.setLineSpacing(-2);

        return [topic, gameTitle, message];
      },
      buttons: [
        {
          label: 'BACK',
          width: 180,
          action: () => closeOpenModal(this),
        },
      ],
    });
  }

  showLockedMajorInfo(major) {
    const lockedMessage = `${major.title} is locked by your teacher.`;

    showModal(this, {
      name: `major-locked-${major.id}`,
      title: `${major.title.toUpperCase()} LOCKED`,
      width: 700,
      height: 350,
      body: (_overlay, { panelX, panelY, panelTop }) => {
        const topic = this.add.text(
          panelX,
          panelTop + 108,
          `${this.quarter.label} ${this.quarter.title}`.toUpperCase(),
          textStyle(23, '#66e5ff'),
        );
        topic.setOrigin(0.5);
        const message = this.add.text(panelX, panelY + 8, lockedMessage.toUpperCase(), textStyle(28, '#ffd76a'));
        message.setOrigin(0.5);
        message.setWordWrapWidth(520);
        message.setLineSpacing(-2);

        return [topic, message];
      },
      buttons: [
        {
          label: 'BACK',
          width: 180,
          action: () => closeOpenModal(this),
        },
      ],
    });
  }

  showMinigameInfo(major, lesson, minigame) {
    showModal(this, {
      name: `minigame-info-${minigame.game.id}`,
      title: minigame.game.title,
      width: 760,
      height: 470,
      titleSize: minigame.game.title.length > 22 ? 34 : 38,
      body: (overlay, { panelX, panelY, panelTop }) => {
        const topic = this.add.text(panelX, panelTop + 105, `${this.quarter.label} ${major.title} LESSON ${lesson.label}`.toUpperCase(), textStyle(23, '#66e5ff'));
        topic.setOrigin(0.5);
        const instruction = this.add.text(panelX, panelTop + 148, this.getMinigameInstruction(minigame.kind), textStyle(24, '#fff2c9'));
        instruction.setOrigin(0.5);
        instruction.setWordWrapWidth(620);
        instruction.setLineSpacing(-2);

        const preview = this.createMinigamePreview(minigame.kind, panelX, panelY + 8);

        return [topic, instruction, ...preview];
      },
      buttons: [
        {
          label: 'START',
          width: 190,
          action: () => {
            const returnScrollY = this.cameras.main.scrollY;
            closeOpenModal(this);
            this.scene.start(minigame.sceneKey, {
              islandId: this.islandId,
              quarterId: this.quarter.id,
              majorId: major.id,
              lessonId: lesson.id,
              returnScrollY,
            });
          },
        },
        {
          label: 'BACK',
          width: 180,
          action: () => closeOpenModal(this),
        },
      ],
    });
  }

  getMinigameInstruction(kind) {
    if (kind === 'memory') {
      return 'Flip one term, one picture, and one description. Match the cards by mixture idea.';
    }

    if (kind === 'detective') {
      return 'Compare two samples, answer the case questions, then complete the final comparison.';
    }

    if (kind === 'court') {
      return 'Study each exhibit, choose a classification, pick evidence, and defend your decision.';
    }

    if (kind === 'invent') {
      return 'Choose ingredients, mix them, describe the result, and present your invention.';
    }

    return 'Drag each supply to the correct bin. Then choose the best real-life use.';
  }

  createMinigamePreview(kind, panelX, panelY) {
    if (kind === 'memory') {
      return this.createMemoryPreview(panelX, panelY);
    }

    if (kind === 'detective') {
      return this.createDetectivePreview(panelX, panelY);
    }

    if (kind === 'court') {
      return this.createCourtPreview(panelX, panelY);
    }

    if (kind === 'invent') {
      return this.createInventPreview(panelX, panelY);
    }

    return this.createSortingPreview(panelX, panelY);
  }

  createMemoryPreview(panelX, panelY) {
    const items = [];
    const labels = ['TERM', 'PICTURE', 'DESCRIPTION'];
    const values = ['UNIFORM\nMIXTURE', 'SALT\nWATER', 'LOOKS THE\nSAME'];

    labels.forEach((label, index) => {
      const x = panelX - 190 + index * 190;
      const y = panelY + 16;
      const card = this.add.graphics();
      card.fillStyle(0xfff2c9, 1);
      card.lineStyle(4, index === 1 ? 0x66e5ff : 0x9e6b47, 1);
      card.fillRoundedRect(x - 76, y - 58, 152, 116, 8);
      card.strokeRoundedRect(x - 76, y - 58, 152, 116, 8);
      const typeText = this.add.text(x, y - 39, label, textStyle(16, '#7c5b34'));
      typeText.setOrigin(0.5);
      const valueText = this.add.text(x, y + 15, values[index], textStyle(22, '#2f2a2a'));
      valueText.setOrigin(0.5);
      valueText.setLineSpacing(-5);
      items.push(card, typeText, valueText);
    });

    const note = this.add.text(panelX, panelY + 104, '1 TERM + 1 PICTURE + 1 DESCRIPTION', textStyle(22, '#ffd76a'));
    note.setOrigin(0.5);
    items.push(note);
    return items;
  }

  createSortingPreview(panelX, panelY) {
    const items = [];
    const arrow = this.add.graphics();
    arrow.fillStyle(0xffd76a, 1);
    arrow.beginPath();
    arrow.moveTo(panelX - 36, panelY + 8);
    arrow.lineTo(panelX + 12, panelY - 20);
    arrow.lineTo(panelX + 12, panelY - 5);
    arrow.lineTo(panelX + 58, panelY - 5);
    arrow.lineTo(panelX + 58, panelY + 21);
    arrow.lineTo(panelX + 12, panelY + 21);
    arrow.lineTo(panelX + 12, panelY + 36);
    arrow.closePath();
    arrow.fillPath();

    const itemCard = this.add.graphics();
    itemCard.fillStyle(0xfff2c9, 1);
    itemCard.lineStyle(4, 0x9e6b47, 1);
    itemCard.fillRoundedRect(panelX - 262, panelY - 52, 130, 104, 8);
    itemCard.strokeRoundedRect(panelX - 262, panelY - 52, 130, 104, 8);
    const icon = this.add.graphics();
    icon.setPosition(panelX - 197, panelY - 14);
    icon.setScale(0.58);
    drawMixtureIcon(icon, 'fruit-salad');
    const itemLabel = this.add.text(panelX - 197, panelY + 34, 'FRUIT SALAD', textStyle(17, '#2f2a2a'));
    itemLabel.setOrigin(0.5);

    const binA = this.add.rectangle(panelX + 144, panelY - 28, 150, 70, 0x2278c9, 1);
    binA.setStrokeStyle(4, 0x153045, 1);
    const binB = this.add.rectangle(panelX + 144, panelY + 58, 150, 70, 0x58cc02, 1);
    binB.setStrokeStyle(4, 0x2e8c00, 1);
    const binTextA = this.add.text(panelX + 144, panelY - 28, 'UNIFORM', textStyle(18, '#fff2c9'));
    binTextA.setOrigin(0.5);
    const binTextB = this.add.text(panelX + 144, panelY + 58, 'NON-UNIFORM', textStyle(18, '#fff2c9'));
    binTextB.setOrigin(0.5);
    const useText = this.add.text(panelX, panelY + 112, 'AFTER SORTING: CHOOSE FOOD, BEVERAGE, OR OTHER USE', textStyle(20, '#ffd76a'));
    useText.setOrigin(0.5);

    items.push(arrow, itemCard, icon, itemLabel, binA, binB, binTextA, binTextB, useText);
    return items;
  }

  createDetectivePreview(panelX, panelY) {
    const items = [];
    const samples = [
      { key: 'A', name: 'SALT WATER', icon: 'salt-water', color: 0x2278c9 },
      { key: 'B', name: 'SAND WATER', icon: 'sand-water', color: 0x58cc02 },
    ];

    samples.forEach((sample, index) => {
      const x = panelX - 158 + index * 316;
      const card = this.add.graphics();
      card.fillStyle(0xfff2c9, 1);
      card.lineStyle(4, sample.color, 1);
      card.fillRoundedRect(x - 112, panelY - 58, 224, 152, 8);
      card.strokeRoundedRect(x - 112, panelY - 58, 224, 152, 8);
      card.fillStyle(sample.color, 1);
      card.fillRoundedRect(x - 112, panelY - 58, 224, 36, 8);

      const sampleLabel = this.add.text(x, panelY - 39, `SAMPLE ${sample.key}`, textStyle(18, '#fff2c9'));
      sampleLabel.setOrigin(0.5);
      const icon = this.add.graphics();
      icon.setPosition(x, panelY + 12);
      icon.setScale(0.76);
      drawMixtureIcon(icon, sample.icon);
      const name = this.add.text(x, panelY + 65, sample.name, textStyle(19, '#2f2a2a'));
      name.setOrigin(0.5);
      items.push(card, sampleLabel, icon, name);
    });

    const lens = this.add.graphics();
    lens.lineStyle(8, 0x66e5ff, 1);
    lens.strokeCircle(panelX, panelY + 10, 24);
    lens.lineBetween(panelX + 17, panelY + 27, panelX + 44, panelY + 54);
    lens.fillStyle(0xffd76a, 1);
    lens.fillCircle(panelX, panelY + 10, 7);

    const note = this.add.text(panelX, panelY + 118, 'OBSERVE, COMPARE, CHOOSE, EXPLAIN', textStyle(21, '#ffd76a'));
    note.setOrigin(0.5);
    items.push(lens, note);
    return items;
  }

  createCourtPreview(panelX, panelY) {
    const items = [];

    const judge = this.add.graphics();
    judge.fillStyle(0xfff2c9, 1);
    judge.fillCircle(panelX - 238, panelY - 24, 27);
    judge.fillStyle(0x2f2a2a, 1);
    judge.fillRoundedRect(panelX - 268, panelY + 0, 60, 50, 8);
    judge.fillStyle(0xd6d6d6, 1);
    judge.fillCircle(panelX - 255, panelY - 30, 11);
    judge.fillCircle(panelX - 221, panelY - 30, 11);
    judge.fillStyle(0x8a6048, 1);
    judge.fillRoundedRect(panelX - 188, panelY - 8, 48, 9, 4);
    judge.fillRoundedRect(panelX - 148, panelY - 26, 11, 42, 4);

    const exhibit = this.add.graphics();
    exhibit.fillStyle(0xfff2c9, 1);
    exhibit.lineStyle(4, 0x9e6b47, 1);
    exhibit.fillRoundedRect(panelX - 78, panelY - 66, 156, 116, 8);
    exhibit.strokeRoundedRect(panelX - 78, panelY - 66, 156, 116, 8);
    const icon = this.add.graphics();
    icon.setPosition(panelX, panelY - 16);
    icon.setScale(0.72);
    drawMixtureIcon(icon, 'halo-halo');
    const exhibitText = this.add.text(panelX, panelY + 34, 'EXHIBIT', textStyle(17, '#2f2a2a'));
    exhibitText.setOrigin(0.5);

    const evidenceLabels = ['TYPE', 'EVIDENCE', 'DEFENSE'];
    evidenceLabels.forEach((label, index) => {
      const x = panelX + 174;
      const y = panelY - 58 + index * 46;
      const card = this.add.rectangle(x, y, 154, 34, 0xfff2c9, 1);
      card.setStrokeStyle(3, index === 1 ? 0x58cc02 : 0x9e6b47, 1);
      const text = this.add.text(x, y, label, textStyle(16, index === 1 ? '#2e8c00' : '#2f2a2a'));
      text.setOrigin(0.5);
      items.push(card, text);
    });

    const note = this.add.text(panelX, panelY + 92, 'OBSERVE -> DECIDE -> JUSTIFY -> VERDICT', textStyle(19, '#ffd76a'));
    note.setOrigin(0.5);
    note.setWordWrapWidth(560);
    items.push(judge, exhibit, icon, exhibitText, note);
    return items;
  }

  createInventPreview(panelX, panelY) {
    const items = [];
    const ingredientLabels = ['WATER', 'JUICE', 'MIX'];
    ingredientLabels.forEach((label, index) => {
      const x = panelX - 218 + index * 102;
      const card = this.add.graphics();
      card.fillStyle(0xfff2c9, 1);
      card.lineStyle(4, index < 2 ? 0x58cc02 : 0x9e6b47, 1);
      card.fillRoundedRect(x - 42, panelY - 58, 84, 96, 8);
      card.strokeRoundedRect(x - 42, panelY - 58, 84, 96, 8);
      card.fillStyle(index === 0 ? 0x66e5ff : index === 1 ? 0xff9b42 : 0xffd76a, 1);
      card.fillCircle(x, panelY - 22, 18);
      const text = this.add.text(x, panelY + 20, label, textStyle(15, '#2f2a2a'));
      text.setOrigin(0.5);
      items.push(card, text);
    });

    const cup = this.add.graphics();
    cup.lineStyle(5, 0x2f2a2a, 1);
    cup.strokeRoundedRect(panelX + 50, panelY - 50, 94, 108, 8);
    cup.fillStyle(0xff9b42, 0.94);
    cup.fillRoundedRect(panelX + 58, panelY + 2, 78, 48, 5);
    cup.fillStyle(0x66e5ff, 0.35);
    cup.fillCircle(panelX + 78, panelY + 21, 4);
    cup.fillCircle(panelX + 115, panelY + 31, 3);

    const checklist = this.add.graphics();
    checklist.fillStyle(0xfff2c9, 1);
    checklist.lineStyle(4, 0x9e6b47, 1);
    checklist.fillRoundedRect(panelX + 188, panelY - 58, 130, 120, 8);
    checklist.strokeRoundedRect(panelX + 188, panelY - 58, 130, 120, 8);
    const checks = this.add.text(panelX + 253, panelY - 8, 'TYPE\nLOOKS\nUSE', textStyle(18, '#2f2a2a'));
    checks.setOrigin(0.5);
    checks.setLineSpacing(4);

    const note = this.add.text(panelX, panelY + 118, 'CHOOSE -> MIX -> DESCRIBE -> PRESENT', textStyle(21, '#ffd76a'));
    note.setOrigin(0.5);
    items.push(cup, checklist, checks, note);
    return items;
  }

  createLessonLockBadge(x, y) {
    const container = this.add.container(x, y);
    const badge = this.add.circle(0, 0, 12, 0x8a6048, 1);
    const icon = this.add.graphics();
    icon.lineStyle(2.5, 0xfff2c9, 1);
    icon.strokeRoundedRect(-4, -8, 8, 8, 3);
    icon.strokeRoundedRect(-5, -1, 10, 8, 2);
    container.add([badge, icon]);

    return container;
  }

  createMajorLockBadge(x, y) {
    const container = this.add.container(x, y);
    const badge = this.add.circle(0, 0, 16, 0x7c6545, 1);
    const icon = this.add.graphics();
    icon.lineStyle(3, 0xfff2c9, 1);
    icon.strokeRoundedRect(-5, -11, 10, 10, 3);
    icon.strokeRoundedRect(-7, -1, 14, 10, 3);
    container.add([badge, icon]);

    return container;
  }

  resolveMajorAccess(majorId) {
    const entry = this.majorAccess?.[majorId];
    if (!entry || typeof entry.locked !== 'boolean') {
      return { locked: false };
    }

    return entry;
  }

  resolveLessonAccess(lessonId) {
    const entry = this.lessonAccess?.[lessonId];
    if (!entry || typeof entry.locked !== 'boolean') {
      return { locked: false };
    }

    return entry;
  }

  isMajorLocked(majorId) {
    return this.resolveMajorAccess(majorId).locked === true;
  }

  isLessonLocked(lessonId) {
    return this.resolveLessonAccess(lessonId).locked === true;
  }

  buildLockedLessonMessage(lessonAccess) {
    if (lessonAccess?.lockReason === 'major' && lessonAccess?.parentMajorTitle) {
      return `This lesson is locked because ${lessonAccess.parentMajorTitle} is locked by your teacher.`;
    }

    return this.lockedMessage;
  }

  setupScrolling() {
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      if (this.currentModal) {
        return;
      }

      this.setScrollY(this.cameras.main.scrollY + deltaY * 0.75);
    });

    this.input.on('pointerdown', (pointer) => {
      if (this.currentModal || pointer.y < HEADER_HEIGHT) {
        return;
      }

      this.isDraggingPath = true;
      this.dragStartY = pointer.y;
      this.dragStartScrollY = this.cameras.main.scrollY;
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.isDraggingPath || this.currentModal) {
        return;
      }

      this.setScrollY(this.dragStartScrollY + this.dragStartY - pointer.y);
    });

    this.input.on('pointerup', (pointer) => {
      this.isDraggingPath = false;

      if (!this.currentModal && pointer.x <= 126 && pointer.y <= HEADER_HEIGHT) {
        this.scene.start('IslandMapScene', { islandId: this.islandId });
      }
    });

    this.input.on('pointerupoutside', () => {
      this.isDraggingPath = false;
    });
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
      return;
    }

    this.scene.start('IslandMapScene', { islandId: this.islandId });
  }

  setScrollY(value) {
    const nextY = Phaser.Math.Clamp(value, 0, this.maxScrollY);
    this.cameras.main.setScroll(0, nextY);
    setTestState({ scrollY: nextY });
  }
}
