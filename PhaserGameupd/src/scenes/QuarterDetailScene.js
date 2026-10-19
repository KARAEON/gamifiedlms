import Phaser from 'phaser';
import { scienceQuarterGames, SCIENCE_TOOLS } from '../config/scienceQuarterGames.js';
import { readScienceProgress } from '../systems/scienceProgress.js';
import {
  inventMixWorkshopGame,
  mixMatchMixturesGame,
  mixtureDetectiveGame,
  scienceCourtGame,
  supplyCartSortingGame,
  islandCurricula,
} from '../config/content.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import { markSceneReady, setTestCommand, setTestState } from '../systems/testSeam.js';
import { createGeneralAsset, createMixtureIcon } from '../ui/assetIcons.js';
import { closeOpenModal, colors, createBackArrow, showModal, textStyle, titleStyle } from '../ui/ui.js';

const HEADER_HEIGHT = 112;
const FIRST_MAJOR_Y = 450;
const MAJOR_SPACING = 540;
const CONTENT_BOTTOM_PADDING = 380;
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
  ...Object.fromEntries(scienceQuarterGames.map(game => [game.lessonId, { sceneKey: 'ScienceAdventureScene', game, kind: game.kind }])),
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
    this.curriculum = islandCurricula[this.islandId] ?? islandCurricula['vulcan-caverns'];
    this.quarter = this.curriculum.quarters[this.quarterId] ?? this.curriculum.quarters.q1;
    const hasLessons = this.quarter.majors.some(major => major.lessons.length > 0);
    this.majorSpacing = hasLessons ? MAJOR_SPACING : 280;
    const lastLessonOffset = hasLessons ? Math.max(...LEFT_LESSON_OFFSETS.map(point => point.y), ...RIGHT_LESSON_OFFSETS.map(point => point.y)) : 0;
    this.contentHeight = FIRST_MAJOR_Y + (this.quarter.majors.length - 1) * this.majorSpacing
      + lastLessonOffset + CONTENT_BOTTOM_PADDING;
    this.maxScrollY = Math.max(0, this.contentHeight - GAME_HEIGHT);
    this.initialScrollY = Number.isFinite(data.scrollY) ? data.scrollY : 0;
    this.dragStartY = 0;
    this.dragStartScrollY = 0;
    this.isDraggingPath = false;
    this.currentModal = null;
  }

  create() {
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, this.contentHeight);
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
    this.add.rectangle(0, 0, GAME_WIDTH, this.contentHeight, 0xf5f4ef, 1).setOrigin(0);

    const banner = this.add.graphics();
    banner.fillStyle(0x54c900, 1);
    banner.fillRoundedRect(90, 136, 1100, 170, 8);
    banner.fillStyle(0x45a900, 1);
    banner.fillRoundedRect(1028, 136, 162, 170, 8);
    banner.fillStyle(0x2e8c00, 1);
    banner.fillRect(90, 292, 1100, 18);

    const section = this.add.text(142, 178, `${this.quarter.label} ${this.curriculum.subject.toUpperCase()}`, titleStyle(32, '#d8ffc7', 'left'));
    section.setOrigin(0, 0.5);
    const title = this.add.text(142, 242, this.quarter.title.toUpperCase(), titleStyle(44, '#ffffff', 'left'));
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

    const title = this.add.text(145, 43, this.quarter.title.toUpperCase(), titleStyle(30, '#2f2a2a', 'left'));
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
      const majorY = FIRST_MAJOR_Y + majorIndex * this.majorSpacing;
      const lessonOffsets = majorIndex % 2 === 0 ? LEFT_LESSON_OFFSETS : RIGHT_LESSON_OFFSETS;
      const lessonPoints = lessonOffsets.slice(0, major.lessons.length).map((offset, lessonIndex) => ({
        x: offset.x,
        y: majorY + offset.y,
        lesson: major.lessons[lessonIndex],
      }));

      this.drawDottedPath([{ x: majorX, y: majorY }, ...lessonPoints]);
      if (!major.lessons.length && majorIndex < this.quarter.majors.length - 1) {
        this.drawDottedPath([
          { x: majorX, y: majorY },
          { x: majorIndex % 2 === 0 ? 850 : 430, y: majorY + this.majorSpacing },
        ]);
      }
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
    const container = this.add.container(x, y);
    container.setDepth(10);
    container.setData('majorId', major.id);

    const shadow = this.add.ellipse(10, 18, 130, 42, 0x000000, 0.15);
    const base = this.add.circle(0, 0, 72, 0x58cc02, 1);
    base.setStrokeStyle(7, 0x47a800, 1);
    const shine = this.add.arc(-14, -18, 50, 205, 320, false, 0x8eea32, 0.35);
    const icon = this.add.graphics();
    this.drawMajorIcon(icon, major.icon);

    const label = this.add.text(0, 98, major.title.toUpperCase(), titleStyle(23, '#2f2a2a'));
    label.setOrigin(0.5, major.placeholder ? 0 : 0.5);
    label.setWordWrapWidth(255);

    const hitArea = this.add.zone(0, 0, 150, 150).setInteractive({ useHandCursor: true });
    hitArea.on('pointerover', () => container.setScale(1.08));
    hitArea.on('pointerout', () => container.setScale(1));
    hitArea.on('pointerup', () => this.openMajor(major));

    container.add([shadow, base, shine, icon, label, hitArea]);
    if (major.week) {
      const weekLabel = this.add.text(0, -102, `WEEK ${major.week}`, textStyle(20, '#7e7e7e')).setOrigin(0.5);
      container.add(weekLabel);
    }
  }

  createLessonNode(major, lesson, x, y, lessonIndex) {
    const container = this.add.container(x, y);
    container.setDepth(9);
    container.setData('lessonId', lesson.id);

    const shadow = this.add.circle(5, 7, 31, 0x000000, 0.14);
    const base = this.add.circle(0, 0, 31, colors.cream, 1);
    if (readScienceProgress()[lesson.id]?.completed) base.setFillStyle(0xb4d76d);
    base.setStrokeStyle(5, 0xc4a55c, 1);
    const inner = this.add.circle(0, 0, 17, 0xfff7cf, 1);
    const label = this.add.text(0, -1, `${lessonIndex + 1}`, textStyle(20, '#5b4322'));
    label.setOrigin(0.5);

    const hitArea = this.add.zone(0, 0, 78, 78).setInteractive({ useHandCursor: true });
    hitArea.on('pointerover', () => container.setScale(1.12));
    hitArea.on('pointerout', () => container.setScale(1));
    hitArea.on('pointerup', () => this.openLesson(major, lesson));

    container.add([shadow, base, inner, label, hitArea]);
    if (lesson.day) {
      const dayLabel = this.add.text(0, 48, lesson.label.toUpperCase(), textStyle(16, '#5b4322')).setOrigin(0.5);
      container.add(dayLabel);
    }
  }

  drawMajorIcon(graphics, icon) {
    graphics.fillStyle(0xffffff, 1);
    graphics.lineStyle(8, 0xffffff, 1);

    if (icon === 'placeholder') {
      graphics.strokeRoundedRect(-26, -34, 52, 68, 4);
      graphics.lineBetween(-14, -12, 14, -12);
      graphics.lineBetween(-14, 7, 14, 7);
      return;
    }

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
      graphics.lineStyle(6, 0x58cc02, 1);
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
      graphics.fillStyle(0x58cc02, 1);
      graphics.fillCircle(0, 0, 14);
      graphics.fillStyle(0xffffff, 1);
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

    showModal(this, {
      name: 'major',
      title: major.title.toUpperCase(),
      titleSize: major.placeholder ? 26 : 38,
      width: major.week ? 720 : 520,
      height: 285,
      body: (overlay, { panelX, panelY }) => {
        const available = major.lessons.filter(lesson => MINIGAMES[lesson.id]).length;
        const label = major.week ? `${major.lessons.length} DAILY GAMES COMING SOON` : major.placeholder && available ? `${available} ${available === 1 ? 'ACTIVITY' : 'ACTIVITIES'} AVAILABLE\n${major.lessons.length - available} LESSONS COMING SOON` : major.placeholder ? 'LESSONS COMING SOON' : 'COMPETENCY PLACEHOLDER';
        const body = this.add.text(panelX, panelY + 8, label, textStyle(28, '#66e5ff')).setAlign('center');
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
    setTestState({ selectedMajor: major.id, selectedLesson: lesson.id });

    const minigame = MINIGAMES[lesson.id];
    if (minigame) {
      this.showMinigameInfo(major, lesson, minigame);
      return;
    }

    showModal(this, {
      name: 'lesson',
      title: `${this.quarter.label} ${major.title} ${lesson.label}`.toUpperCase(),
      titleSize: lesson.day ? 22 : lesson.placeholder ? 26 : 38,
      width: lesson.day ? 720 : 520,
      height: lesson.day ? 340 : 285,
      body: (overlay, { panelX, panelY }) => {
        const body = this.add.text(panelX, panelY + 8, lesson.day ? 'GAME COMING SOON' : lesson.placeholder ? 'LESSON COMING SOON' : 'MINIGAME PLACEHOLDER', textStyle(28, '#66e5ff'));
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
        const instruction = this.add.text(panelX, panelTop + 148, minigame.game.brief ?? this.getMinigameInstruction(minigame.kind), textStyle(24, '#fff2c9'));
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
    if (scienceQuarterGames.some(game => game.kind === kind)) {
      const game = scienceQuarterGames.find(game => game.kind === kind);
      const tool = SCIENCE_TOOLS.find(item => item.id === kind) ?? SCIENCE_TOOLS[0];
      const key = kind === 'kit' ? 'science-kit-case' : kind === 'mystery' || kind === 'fair' ? 'general-sand-and-water' : kind === 'relay' ? 'science-filter-funnel' : `science-${tool.asset}`;
      const image = this.add.image(panelX - 183, panelY + 43, this.textures.exists(key) ? key : 'general-sand-and-water');
      image.setScale(Math.min(120 / image.width, 110 / image.height));
      const label = this.add.text(panelX + 42, panelY + 40, `${game.competency}\n3 CHALLENGES\nEXPLORE AND RETRY`, textStyle(24, '#ffd76a')).setOrigin(0.5);
      return [image, label];
    }
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
    const icon = createMixtureIcon(this, 'fruit-salad', { x: panelX - 197, y: panelY - 14, width: 60, height: 58 });
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
      const icon = createMixtureIcon(this, sample.icon, { x, y: panelY + 12, width: 72, height: 66 });
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

    const judge = createGeneralAsset(this, 'judge', { x: panelX - 238, y: panelY - 2, width: 114, height: 114 });

    const exhibit = this.add.graphics();
    exhibit.fillStyle(0xfff2c9, 1);
    exhibit.lineStyle(4, 0x9e6b47, 1);
    exhibit.fillRoundedRect(panelX - 78, panelY - 66, 156, 116, 8);
    exhibit.strokeRoundedRect(panelX - 78, panelY - 66, 156, 116, 8);
    const icon = createMixtureIcon(this, 'halo-halo', { x: panelX, y: panelY - 16, width: 72, height: 66 });
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
      const sprite = createGeneralAsset(this, ['bottled-water', 'powdered-juice', 'bowl-half-full'][index], { x, y: panelY - 22, width: 58, height: 54 });
      const text = this.add.text(x, panelY + 20, label, textStyle(15, '#2f2a2a'));
      text.setOrigin(0.5);
      items.push(card, sprite, text);
    });

    const cup = createGeneralAsset(this, 'energy-drink', { x: panelX + 97, y: panelY + 4, width: 118, height: 118 });

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
