import Phaser from 'phaser';
import { scienceCourtGame } from '../config/content.js';
import { getPostGameAssessmentLabel, startPostGameAssessment } from '../systems/assessmentFlow.js';
import { submitMinigameResult } from '../systems/resultSubmission.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import { createSparkles, drawMixtureIcon } from '../ui/minigameUi.js';
import { closeOpenModal, colors, createBackArrow, createPixelButton, showModal, textStyle } from '../ui/ui.js';

const CLASSIFICATION_OPTIONS = [
  { id: 'uniform', label: 'UNIFORM', color: 0x58cc02 },
  { id: 'nonuniform', label: 'NON-UNIFORM', color: 0xc9362c },
];

const EVIDENCE_CARD_WIDTH = 190;
const EVIDENCE_CARD_HEIGHT = 56;

export default class ScienceCourtScene extends Phaser.Scene {
  constructor() {
    super('ScienceCourtScene');
  }

  init(data) {
    this.islandId = data.islandId ?? 'vulcan-caverns';
    this.quarterId = data.quarterId ?? 'q1';
    this.majorId = data.majorId ?? 'q1-major-1';
    this.lessonId = data.lessonId ?? scienceCourtGame.lessonId;
    this.returnScrollY = Number.isFinite(data.returnScrollY) ? data.returnScrollY : 0;
    this.currentModal = null;
  }

  create() {
    this.caseIndex = 0;
    this.phase = 'defense';
    this.result = null;
    this.selectedClassification = null;
    this.selectedEvidence = [];
    this.caseScores = Array(scienceCourtGame.cases.length).fill(null);
    this.caseDefenses = Array(scienceCourtGame.cases.length).fill(null);
    this.caseScore = 0;
    this.verdict = null;
    this.classificationViews = [];
    this.evidenceViews = [];
    this.submitButtonMeta = null;
    this.nextButtonMeta = null;
    this.retryButtonMeta = null;

    this.drawCourtroom();
    this.createHud();
    this.setupKeyboardShortcuts();
    this.renderCase();

    markSceneReady('ScienceCourtScene', this.buildTestState());
  }

  drawCourtroom() {
    this.add.rectangle(0, 0, 1280, 720, 0x172826, 1).setOrigin(0);
    this.add.rectangle(0, 0, 1280, 126, 0x161617, 0.98).setOrigin(0);
    this.add.rectangle(0, 126, 1280, 8, colors.gold, 1).setOrigin(0);

    const wall = this.add.graphics();
    wall.lineStyle(2, 0x31504a, 0.48);
    for (let x = 0; x <= 1280; x += 64) {
      wall.lineBetween(x, 134, x, 610);
    }
    for (let y = 134; y <= 610; y += 54) {
      wall.lineBetween(0, y, 1280, y);
    }

    const bench = this.add.graphics();
    bench.fillStyle(0x4a342e, 1);
    bench.fillRoundedRect(0, 610, 1280, 110, 8);
    bench.fillStyle(0x2f2420, 1);
    bench.fillRect(0, 654, 1280, 10);
    bench.lineStyle(4, 0x8a6048, 1);
    bench.lineBetween(0, 610, 1280, 610);
  }

  createHud() {
    const back = createBackArrow(this, () => this.returnToQuarter());
    back.setDepth(30);

    const titlePanel = this.add.graphics();
    titlePanel.setDepth(20);
    titlePanel.fillStyle(0x2d1839, 1);
    titlePanel.lineStyle(5, colors.gold, 1);
    titlePanel.fillRoundedRect(272, 18, 478, 86, 8);
    titlePanel.strokeRoundedRect(272, 18, 478, 86, 8);

    const title = this.add.text(511, 48, scienceCourtGame.title, textStyle(39, '#ffd76a'));
    title.setOrigin(0.5);
    title.setShadow(3, 3, '#000000', 0, false, true);
    const subtitle = this.add.text(511, 86, scienceCourtGame.subtitle, textStyle(22, '#fff2c9'));
    subtitle.setOrigin(0.5);
    const scaleA = this.add.text(305, 60, 'SCALE', textStyle(20, '#ffd76a'));
    scaleA.setOrigin(0.5);
    const scaleB = this.add.text(716, 60, 'SCALE', textStyle(20, '#ffd76a'));
    scaleB.setOrigin(0.5);

    this.scoreText = this.add.text(888, 42, 'CREDIBILITY 000 / 100', textStyle(24, '#fff2c9'));
    this.scoreText.setOrigin(0.5);
    this.scoreBar = this.add.graphics();

    this.progressText = this.add.text(1100, 42, 'CASE 1 / 5', textStyle(24, '#fff2c9'));
    this.progressText.setOrigin(0.5);
    this.progressDots = this.add.graphics();

    [title, subtitle, scaleA, scaleB, this.scoreText, this.progressText].forEach((item) => item.setDepth(21));
  }

  renderCase() {
    this.phase = 'defense';
    this.verdict = null;
    this.caseScore = 0;
    this.selectedClassification = null;
    this.selectedEvidence = [];
    this.classificationViews = [];
    this.evidenceViews = [];
    this.submitButtonMeta = null;
    this.nextButtonMeta = null;
    this.retryButtonMeta = null;

    if (this.caseLayer) {
      this.caseLayer.destroy(true);
    }
    this.caseLayer = this.add.container(0, 0);
    this.caseLayer.setDepth(5);

    this.drawJudgePrompt();
    this.drawCaseBanner();
    this.drawExhibit();
    this.drawClassificationPanel();
    this.drawEvidencePanel();
    this.drawDefensePanel();
    this.updateHud();
    this.updateTestState();
  }

  drawJudgePrompt() {
    const panel = this.add.container(20, 142);
    const judge = this.add.graphics();
    judge.fillStyle(0x202124, 1);
    judge.fillRoundedRect(0, 72, 138, 90, 8);
    judge.fillStyle(0xffd8b8, 1);
    judge.fillCircle(70, 54, 36);
    judge.fillStyle(0xd8d8d8, 1);
    judge.fillCircle(42, 42, 15);
    judge.fillCircle(98, 42, 15);
    judge.fillStyle(0x2f2a2a, 1);
    judge.fillCircle(58, 56, 4);
    judge.fillCircle(82, 56, 4);
    judge.fillRoundedRect(53, 75, 34, 6, 3);
    judge.fillStyle(colors.gold, 1);
    judge.fillRoundedRect(36, 151, 68, 10, 4);
    judge.fillRoundedRect(65, 111, 10, 44, 4);

    const bubble = this.add.graphics();
    bubble.fillStyle(0xfff2c9, 1);
    bubble.lineStyle(4, 0x9e6b47, 1);
    bubble.fillRoundedRect(150, 2, 230, 150, 8);
    bubble.strokeRoundedRect(150, 2, 230, 150, 8);
    bubble.beginPath();
    bubble.moveTo(150, 62);
    bubble.lineTo(128, 78);
    bubble.lineTo(150, 88);
    bubble.closePath();
    bubble.fillPath();
    bubble.strokePath();

    const prompt = this.add.text(166, 21, 'SCIENCE EXPERT,\nEXAMINE THE SAMPLE\nAND DEFEND YOUR\nDECISION.', textStyle(18, '#2f2a2a', 'left'));
    prompt.setWordWrapWidth(195);
    prompt.setLineSpacing(-2);
    const label = this.add.text(70, 176, 'JUDGE WISE', textStyle(18, '#ffd76a'));
    label.setOrigin(0.5);

    panel.add([judge, bubble, prompt, label]);
    this.caseLayer.add(panel);
  }

  drawCaseBanner() {
    const currentCase = this.getCurrentCase();
    const banner = this.add.graphics();
    banner.fillStyle(0x3b2547, 1);
    banner.lineStyle(5, colors.gold, 1);
    banner.fillRoundedRect(410, 142, 390, 102, 8);
    banner.strokeRoundedRect(410, 142, 390, 102, 8);
    banner.fillStyle(0xfff2c9, 1);
    banner.fillRoundedRect(432, 224, 346, 42, 6);

    const caseLabel = this.add.text(605, 164, `CASE ${currentCase.caseNumber}`, textStyle(27, '#ffd76a'));
    caseLabel.setOrigin(0.5);
    const title = this.add.text(605, 204, currentCase.title, textStyle(26, '#ffd76a'));
    title.setOrigin(0.5);
    title.setWordWrapWidth(350);
    const question = this.add.text(605, 245, 'IS THIS A UNIFORM OR NON-UNIFORM MIXTURE?', textStyle(16, '#2f2a2a'));
    question.setOrigin(0.5);

    this.caseLayer.add([banner, caseLabel, title, question]);
  }

  drawExhibit() {
    const currentCase = this.getCurrentCase();
    const panel = this.add.graphics();
    panel.fillStyle(0x4a342e, 1);
    panel.lineStyle(5, 0x8a6048, 1);
    panel.fillRoundedRect(410, 282, 390, 214, 8);
    panel.strokeRoundedRect(410, 282, 390, 214, 8);
    panel.fillStyle(0xcceeff, 1);
    panel.fillRoundedRect(434, 304, 196, 154, 6);
    panel.lineStyle(4, 0x2f2a2a, 1);
    panel.strokeRoundedRect(434, 304, 196, 154, 6);

    const exhibitLabel = this.add.text(544, 286, 'EXHIBIT A', textStyle(20, '#fff2c9'));
    exhibitLabel.setOrigin(0.5);
    const icon = this.add.graphics();
    icon.setPosition(532, 384);
    icon.setScale(currentCase.icon === 'halo-halo' ? 1.8 : 2);
    drawMixtureIcon(icon, currentCase.icon);

    const clueBox = this.add.graphics();
    clueBox.fillStyle(0xfff2c9, 1);
    clueBox.lineStyle(4, 0x9e6b47, 1);
    clueBox.fillRoundedRect(646, 310, 136, 168, 6);
    clueBox.strokeRoundedRect(646, 310, 136, 168, 6);
    const clueTitle = this.add.text(714, 331, 'CLUE', textStyle(20, '#2f2a2a'));
    clueTitle.setOrigin(0.5);
    const clueText = this.add.text(658, 356, currentCase.visualClues.join('\n'), textStyle(14, '#2f2a2a', 'left'));
    clueText.setWordWrapWidth(108);
    clueText.setLineSpacing(-2);

    this.caseLayer.add([panel, exhibitLabel, icon, clueBox, clueTitle, clueText]);
  }

  drawAudience() {
    const panel = this.add.graphics();
    panel.fillStyle(0x2d1839, 1);
    panel.lineStyle(4, 0x8a6048, 1);
    panel.fillRoundedRect(835, 142, 424, 116, 8);
    panel.strokeRoundedRect(835, 142, 424, 116, 8);
    panel.fillStyle(0x4a342e, 1);
    panel.fillRoundedRect(852, 222, 390, 22, 4);

    const label = this.add.text(1047, 161, 'COURTROOM AUDIENCE', textStyle(18, '#fff2c9'));
    label.setOrigin(0.5);
    const people = [];
    for (let index = 0; index < 5; index += 1) {
      const x = 900 + index * 74;
      const person = this.add.graphics();
      person.fillStyle([0x58cc02, 0xff5a66, 0x2278c9, 0xffd76a, 0x9b6bd3][index], 1);
      person.fillRoundedRect(x - 21, 203, 42, 34, 8);
      person.fillStyle(0xffd8b8, 1);
      person.fillCircle(x, 191, 18);
      person.fillStyle(0x2f2a2a, 1);
      person.fillCircle(x - 6, 190, 3);
      person.fillCircle(x + 6, 190, 3);
      people.push(person);
    }
    const speech = this.add.text(1046, 198, this.getAudienceLine(), textStyle(18, '#2f2a2a'));
    speech.setOrigin(0.5);
    speech.setBackgroundColor('#fff2c9');
    speech.setPadding(10, 4, 10, 5);

    this.caseLayer.add([panel, label, ...people, speech]);
  }

  drawClassificationPanel() {
    const panel = this.add.graphics();
    panel.fillStyle(0x0b3651, 0.96);
    panel.lineStyle(4, 0x66e5ff, 1);
    panel.fillRoundedRect(20, 348, 360, 150, 8);
    panel.strokeRoundedRect(20, 348, 360, 150, 8);
    panel.fillStyle(0xfff2c9, 1);
    panel.fillRoundedRect(38, 390, 324, 88, 6);

    const title = this.add.text(200, 372, 'STEP 1: MAKE YOUR DECISION', textStyle(21, '#fff2c9'));
    title.setOrigin(0.5);
    const hint = this.add.text(200, 410, 'CHOOSE THE CLASSIFICATION.', textStyle(17, '#2f2a2a'));
    hint.setOrigin(0.5);
    this.caseLayer.add([panel, title, hint]);

    CLASSIFICATION_OPTIONS.forEach((option, index) => {
      this.createClassificationButton(option, 124 + index * 154, 455);
    });
  }

  createClassificationButton(option, x, y) {
    const container = this.add.container(x, y);
    container.setDepth(8);
    const width = 132;
    const height = 62;
    const graphics = this.add.graphics();
    const icon = this.add.graphics();
    const text = this.add.text(0, 18, option.label, textStyle(17, '#fff2c9'));
    text.setOrigin(0.5);
    const zone = this.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      if (this.phase === 'defense') {
        container.setScale(1.05);
      }
    });
    zone.on('pointerout', () => container.setScale(1));
    zone.on('pointerup', () => this.selectClassification(option.id));

    container.add([graphics, icon, text, zone]);
    this.caseLayer.add(container);

    const view = {
      id: option.id,
      label: option.label,
      x,
      y,
      width,
      height,
      correct: option.id === this.getCurrentCase().type,
      container,
      graphics,
      icon,
    };
    this.classificationViews.push(view);
    this.drawClassificationButton(view);
  }

  drawClassificationButton(view) {
    const selected = this.selectedClassification === view.id;
    const option = CLASSIFICATION_OPTIONS.find((candidate) => candidate.id === view.id);
    view.graphics.clear();
    view.graphics.fillStyle(selected ? colors.gold : option.color, 1);
    view.graphics.lineStyle(4, selected ? 0xfff2c9 : 0x2f2a2a, 1);
    view.graphics.fillRoundedRect(-view.width / 2, -view.height / 2, view.width, view.height, 7);
    view.graphics.strokeRoundedRect(-view.width / 2, -view.height / 2, view.width, view.height, 7);

    view.icon.clear();
    view.icon.lineStyle(4, 0x2f2a2a, 1);
    view.icon.strokeCircle(0, -13, 13);
    view.icon.lineBetween(10, -4, 28, 14);
    if (view.id === 'nonuniform') {
      view.icon.fillStyle(0xff5a66, 1);
      view.icon.fillCircle(-5, -15, 3);
      view.icon.fillCircle(3, -9, 3);
      view.icon.fillCircle(8, -17, 3);
    } else {
      view.icon.fillStyle(0x66e5ff, 1);
      view.icon.fillCircle(0, -13, 5);
    }
  }

  drawEvidencePanel() {
    const currentCase = this.getCurrentCase();
    const panel = this.add.graphics();
    panel.fillStyle(0x0b3651, 0.96);
    panel.lineStyle(4, 0x66e5ff, 1);
    panel.fillRoundedRect(820, 148, 440, 350, 8);
    panel.strokeRoundedRect(820, 148, 440, 350, 8);

    const rangeText = currentCase.evidencePick.min === currentCase.evidencePick.max
      ? `PICK ${currentCase.evidencePick.min}`
      : `PICK ${currentCase.evidencePick.min}-${currentCase.evidencePick.max}`;
    const title = this.add.text(1040, 178, `STEP 2: CHOOSE EVIDENCE (${rangeText})`, textStyle(21, '#fff2c9'));
    title.setOrigin(0.5);
    this.caseLayer.add([panel, title]);

    currentCase.evidenceOptions.forEach((evidenceId, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      this.createEvidenceCard(evidenceId, 936 + column * 208, 244 + row * 70);
    });

    this.evidenceHintText = this.add.text(
      1040,
      472,
      `YOU MUST CHOOSE ${currentCase.evidencePick.min === currentCase.evidencePick.max ? 'EXACTLY' : ''} ${rangeText.replace('PICK ', '')} EVIDENCE CARDS.`,
      textStyle(16, '#fff2c9'),
    );
    this.evidenceHintText.setOrigin(0.5);
    this.caseLayer.add(this.evidenceHintText);
  }

  createEvidenceCard(evidenceId, x, y) {
    const evidence = this.getEvidence(evidenceId);
    const container = this.add.container(x, y);
    container.setDepth(8);
    const graphics = this.add.graphics();
    const icon = this.add.graphics();
    icon.setPosition(-66, -3);
    const label = this.add.text(-36, 0, evidence.label.toUpperCase(), textStyle(14, '#2f2a2a', 'left'));
    label.setOrigin(0, 0.5);
    label.setWordWrapWidth(124);
    label.setLineSpacing(-4);
    const checkText = this.add.text(72, -19, '', textStyle(20, '#ffffff'));
    checkText.setOrigin(0.5);

    const zone = this.add.zone(0, 0, EVIDENCE_CARD_WIDTH, EVIDENCE_CARD_HEIGHT).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      if (this.phase === 'defense') {
        container.setScale(1.04);
      }
    });
    zone.on('pointerout', () => container.setScale(1));
    zone.on('pointerup', () => this.toggleEvidence(evidenceId));

    container.add([graphics, icon, label, checkText, zone]);
    this.caseLayer.add(container);

    const view = {
      id: evidenceId,
      label: evidence.label,
      iconName: evidence.icon,
      x,
      y,
      width: EVIDENCE_CARD_WIDTH,
      height: EVIDENCE_CARD_HEIGHT,
      correct: this.getCurrentCase().correctEvidence.includes(evidenceId),
      container,
      graphics,
      icon,
      checkText,
    };
    this.evidenceViews.push(view);
    this.drawEvidenceCard(view);
  }

  drawEvidenceCard(view) {
    const selected = this.selectedEvidence.includes(view.id);
    view.graphics.clear();
    view.graphics.fillStyle(selected ? 0xe7ffd6 : 0xfff2c9, 1);
    view.graphics.lineStyle(4, selected ? 0x58cc02 : 0x9e6b47, 1);
    view.graphics.fillRoundedRect(-EVIDENCE_CARD_WIDTH / 2, -EVIDENCE_CARD_HEIGHT / 2, EVIDENCE_CARD_WIDTH, EVIDENCE_CARD_HEIGHT, 7);
    view.graphics.strokeRoundedRect(-EVIDENCE_CARD_WIDTH / 2, -EVIDENCE_CARD_HEIGHT / 2, EVIDENCE_CARD_WIDTH, EVIDENCE_CARD_HEIGHT, 7);
    view.checkText.setText(selected ? 'OK' : '');
    this.drawEvidenceIcon(view.icon, view.iconName);
  }

  drawEvidenceIcon(graphics, iconName) {
    graphics.clear();
    graphics.lineStyle(4, 0x2f2a2a, 1);
    graphics.fillStyle(0xffd76a, 1);

    if (iconName === 'eye') {
      graphics.strokeEllipse(0, 0, 36, 20);
      graphics.fillCircle(0, 0, 6);
      return;
    }
    if (iconName === 'magnifier') {
      graphics.strokeCircle(-4, -4, 11);
      graphics.lineBetween(5, 5, 18, 18);
      return;
    }
    if (iconName === 'dots') {
      for (let x = -10; x <= 10; x += 10) {
        for (let y = -10; y <= 10; y += 10) {
          graphics.fillCircle(x, y, 3);
        }
      }
      return;
    }
    if (iconName === 'cube') {
      graphics.strokeRect(-12, -12, 24, 24);
      graphics.lineBetween(-12, -12, 0, -22);
      graphics.lineBetween(12, -12, 24, -22);
      graphics.lineBetween(0, -22, 24, -22);
      graphics.lineBetween(12, 12, 24, 2);
      graphics.lineBetween(24, -22, 24, 2);
      return;
    }
    if (iconName === 'layers') {
      graphics.strokeRoundedRect(-14, -16, 28, 32, 5);
      graphics.fillStyle(0xffd76a, 1);
      graphics.fillRect(-10, -2, 20, 8);
      graphics.fillStyle(0x66e5ff, 1);
      graphics.fillRect(-10, 7, 20, 7);
      return;
    }

    graphics.beginPath();
    graphics.moveTo(0, -20);
    graphics.lineTo(6, -6);
    graphics.lineTo(21, -5);
    graphics.lineTo(10, 4);
    graphics.lineTo(14, 19);
    graphics.lineTo(0, 10);
    graphics.lineTo(-14, 19);
    graphics.lineTo(-10, 4);
    graphics.lineTo(-21, -5);
    graphics.lineTo(-6, -6);
    graphics.closePath();
    graphics.fillPath();
  }

  drawDefensePanel() {
    const panel = this.add.graphics();
    panel.fillStyle(0x0b3651, 0.96);
    panel.lineStyle(4, 0x66e5ff, 1);
    panel.fillRoundedRect(138, 526, 1004, 158, 8);
    panel.strokeRoundedRect(138, 526, 1004, 158, 8);
    panel.fillStyle(0xfff2c9, 1);
    panel.fillRoundedRect(170, 570, 748, 96, 6);

    const title = this.add.text(640, 550, 'STEP 3: DEFEND YOUR DECISION', textStyle(22, '#fff2c9'));
    title.setOrigin(0.5);
    this.defenseText = this.add.text(198, 586, '', textStyle(18, '#2f2a2a', 'left'));
    this.defenseText.setWordWrapWidth(690);
    this.defenseText.setLineSpacing(-2);
    this.defenseHintText = this.add.text(198, 646, '', textStyle(15, '#9e6b00', 'left'));
    this.defenseHintText.setWordWrapWidth(690);

    const submit = createPixelButton(this, 1028, 616, 'SUBMIT\nDEFENSE', () => this.submitDefense(), {
      width: 160,
      height: 76,
      fontSize: 21,
      textColor: '#fff2c9',
      fill: 0x58cc02,
      hoverFill: 0x6ee617,
      stroke: 0x2e8c00,
    });
    submit.setDepth(12);
    this.submitButtonMeta = { x: 1028, y: 616, label: 'SUBMIT DEFENSE' };

    this.caseLayer.add([panel, title, this.defenseText, this.defenseHintText, submit]);
    this.updateDefenseText();
  }

  drawVerdictPanel() {
    const currentCase = this.getCurrentCase();
    const isFinalCase = this.caseIndex === scienceCourtGame.cases.length - 1;
    const nextLabel = isFinalCase ? 'FINISH' : 'NEXT CASE';
    const hasRetry = this.verdict !== 'accepted';
    this.nextButtonMeta = {
      x: hasRetry ? 745 : 640,
      y: 457,
      label: nextLabel,
    };
    this.retryButtonMeta = hasRetry ? { x: 535, y: 457, label: 'RETRY' } : null;

    showModal(this, {
      name: 'court-verdict',
      title: "JUDGE'S VERDICT",
      width: 620,
      height: 330,
      titleSize: 34,
      body: (_overlay, { panelX, panelY }) => {
        const verdictText = this.add.text(panelX, panelY - 46, this.verdict.toUpperCase(), textStyle(34, this.getVerdictColor()));
        verdictText.setOrigin(0.5);
        const score = this.add.text(panelX, panelY, `+${this.caseScore} CREDIBILITY`, textStyle(27, '#66e5ff'));
        score.setOrigin(0.5);
        const body = this.add.text(panelX, panelY + 46, this.getVerdictMessage(currentCase), textStyle(22, '#fff2c9'));
        body.setOrigin(0.5);
        body.setWordWrapWidth(500);
        body.setLineSpacing(-2);
        return [verdictText, score, body];
      },
      buttons: hasRetry
        ? [
            {
              label: 'RETRY',
              width: 180,
              action: () => this.retryCase(),
            },
            {
              label: nextLabel,
              width: 210,
              action: () => this.advanceCase(),
            },
          ]
        : [
            {
              label: nextLabel,
              width: 210,
              action: () => this.advanceCase(),
            },
          ],
    });
  }

  selectClassification(type) {
    if (this.phase !== 'defense') {
      return;
    }

    this.selectedClassification = type;
    this.classificationViews.forEach((view) => this.drawClassificationButton(view));
    this.updateDefenseText();
    this.updateTestState();
  }

  toggleEvidence(evidenceId) {
    if (this.phase !== 'defense') {
      return;
    }

    const currentCase = this.getCurrentCase();
    if (this.selectedEvidence.includes(evidenceId)) {
      this.selectedEvidence = this.selectedEvidence.filter((id) => id !== evidenceId);
    } else if (this.selectedEvidence.length < currentCase.evidencePick.max) {
      this.selectedEvidence.push(evidenceId);
    } else {
      this.pulseEvidenceHint(`YOU CAN ONLY CHOOSE ${currentCase.evidencePick.max} EVIDENCE CARDS.`);
    }

    this.evidenceViews.forEach((view) => this.drawEvidenceCard(view));
    this.updateDefenseText();
    this.updateTestState();
  }

  pulseEvidenceHint(message) {
    if (!this.evidenceHintText) {
      return;
    }

    this.evidenceHintText.setText(message);
    this.tweens.add({
      targets: this.evidenceHintText,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 90,
      yoyo: true,
      repeat: 1,
      onComplete: () => this.resetEvidenceHintText(),
    });
  }

  resetEvidenceHintText() {
    const currentCase = this.getCurrentCase();
    const rangeText = currentCase.evidencePick.min === currentCase.evidencePick.max
      ? `${currentCase.evidencePick.min}`
      : `${currentCase.evidencePick.min}-${currentCase.evidencePick.max}`;
    this.evidenceHintText?.setText(`YOU MUST CHOOSE ${currentCase.evidencePick.min === currentCase.evidencePick.max ? 'EXACTLY' : ''} ${rangeText} EVIDENCE CARDS.`);
  }

  submitDefense() {
    if (this.phase !== 'defense') {
      return;
    }

    const currentCase = this.getCurrentCase();
    if (!this.selectedClassification) {
      this.setDefenseWarning('CHOOSE UNIFORM OR NON-UNIFORM FIRST.');
      return;
    }
    if (this.selectedEvidence.length < currentCase.evidencePick.min) {
      this.setDefenseWarning(`CHOOSE AT LEAST ${currentCase.evidencePick.min} EVIDENCE CARDS.`);
      return;
    }
    if (currentCase.evidencePick.min === currentCase.evidencePick.max && this.selectedEvidence.length !== currentCase.evidencePick.min) {
      this.setDefenseWarning(`CHOOSE EXACTLY ${currentCase.evidencePick.min} EVIDENCE CARDS.`);
      return;
    }

    this.caseScore = this.calculateCaseScore();
    this.caseScores[this.caseIndex] = this.caseScore;
    this.caseDefenses[this.caseIndex] = {
      case_id: currentCase.id,
      classification: this.selectedClassification,
      evidence_ids: [...this.selectedEvidence],
    };
    this.verdict = this.getVerdict(this.caseScore);
    this.phase = 'verdict';
    this.submitButtonMeta = null;
    createSparkles(this, 544, 384);
    this.drawVerdictPanel();
    this.updateHud();
    this.updateTestState();
  }

  setDefenseWarning(message) {
    this.defenseText.setText(message);
    this.defenseText.setColor('#a31c1c');
    const startX = this.defenseText.x;
    this.tweens.add({
      targets: this.defenseText,
      x: startX + 8,
      duration: 60,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.defenseText.x = startX;
        this.defenseText.setColor('#2f2a2a');
        this.updateDefenseText();
      },
    });
  }

  retryCase() {
    closeOpenModal(this);
    this.caseScores[this.caseIndex] = null;
    this.caseDefenses[this.caseIndex] = null;
    this.renderCase();
  }

  advanceCase() {
    if (this.phase !== 'verdict') {
      return;
    }

    closeOpenModal(this);
    if (this.caseIndex >= scienceCourtGame.cases.length - 1) {
      this.showFinalResult();
      return;
    }

    this.caseIndex += 1;
    this.renderCase();
  }

  showFinalResult() {
    const totalScore = this.getTotalScore();
    const won = totalScore >= scienceCourtGame.winScore;
    this.result = won ? 'win' : 'lose';
    this.phase = 'result';
    this.updateTestState();
    this.submitResult();

    showModal(this, {
      name: won ? 'result-win' : 'result-lose',
      title: won ? 'COURT VICTORY' : 'REVIEW NEEDED',
      height: 360,
      body: (_overlay, { panelX, panelY }) => {
        const scoreText = this.add.text(panelX, panelY - 42, `CREDIBILITY ${totalScore} / ${scienceCourtGame.maxScore}`, textStyle(31, '#66e5ff'));
        scoreText.setOrigin(0.5);
        const message = this.add.text(
          panelX,
          panelY + 8,
          won ? 'YOUR DEFENSES CONVINCED THE COURT.' : 'RETRY THE COURT CASES TO REACH 80 CREDIBILITY.',
          textStyle(23, '#fff2c9'),
        );
        message.setOrigin(0.5);
        message.setWordWrapWidth(430);
        const cases = this.add.text(panelX, panelY + 56, `CASES: ${this.caseScores.map((score) => score ?? 0).join(' / ')}`, textStyle(20, '#ffd76a'));
        cases.setOrigin(0.5);
        return [scoreText, message, cases];
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

  calculateCaseScore() {
    const currentCase = this.getCurrentCase();
    let score = this.selectedClassification === currentCase.type ? scienceCourtGame.score.classification : 0;
    const correctEvidenceCount = this.selectedEvidence.filter((evidenceId) => currentCase.correctEvidence.includes(evidenceId)).length;
    score += Math.min(correctEvidenceCount * scienceCourtGame.score.evidence, scienceCourtGame.score.evidenceCap);
    return score;
  }

  getVerdict(score) {
    if (score >= 20) {
      return 'accepted';
    }
    if (score >= 10) {
      return 'partial';
    }
    return 'objection';
  }

  getVerdictMessage(currentCase) {
    if (this.verdict === 'accepted') {
      return currentCase.verdict;
    }
    if (this.verdict === 'partial') {
      return 'Partial. Your defense has some correct science evidence.';
    }
    return 'Objection. Recheck the classification and evidence.';
  }

  getVerdictColor() {
    if (this.verdict === 'accepted') {
      return '#2e8c00';
    }
    if (this.verdict === 'partial') {
      return '#b87800';
    }
    return '#a31c1c';
  }

  updateDefenseText() {
    if (!this.defenseText) {
      return;
    }

    const currentCase = this.getCurrentCase();
    const classification = this.selectedClassification ? this.getClassificationLabel(this.selectedClassification) : '_____';
    const evidence = this.selectedEvidence.length > 0
      ? this.formatEvidencePhrase()
      : '_____';
    this.defenseText.setText(`I conclude that ${currentCase.material} is ${classification} because ${evidence}.`);
    if (!this.defenseHintText) {
      return;
    }
    if (!this.selectedClassification) {
      this.defenseHintText.setText('Choose a classification to fill the first blank.');
    } else if (this.selectedEvidence.length === 0) {
      this.defenseHintText.setText('Now choose evidence to support your decision.');
    } else {
      const range = currentCase.evidencePick.min === currentCase.evidencePick.max
        ? `${currentCase.evidencePick.min}`
        : `${currentCase.evidencePick.min}-${currentCase.evidencePick.max}`;
      this.defenseHintText.setText(`Evidence chosen: ${this.selectedEvidence.length}. Needed: ${range}.`);
    }
  }

  formatEvidencePhrase() {
    const labels = this.selectedEvidence.map((id) => this.getEvidence(id).label.toLowerCase().replace(/\.$/, ''));
    if (labels.length <= 1) {
      return labels[0] ?? '_____';
    }

    return labels.slice(0, -1).join(', ') + ` and ${labels.at(-1)}`;
  }

  updateHud() {
    const totalScore = this.getTotalScore();
    this.scoreText.setText(`CREDIBILITY ${String(totalScore).padStart(3, '0')} / ${scienceCourtGame.maxScore}`);
    this.progressText.setText(`CASE ${this.caseIndex + 1} / ${scienceCourtGame.cases.length}`);
    this.drawScoreBar(totalScore);
    this.drawProgressDots();
  }

  drawScoreBar(totalScore) {
    this.scoreBar.clear();
    this.scoreBar.setDepth(21);
    const x = 782;
    const y = 78;
    const width = 208;
    const height = 12;
    this.scoreBar.fillStyle(0x272727, 1);
    this.scoreBar.fillRoundedRect(x, y, width, height, 5);
    this.scoreBar.fillStyle(0x58cc02, 1);
    this.scoreBar.fillRoundedRect(x, y, width * Phaser.Math.Clamp(totalScore / scienceCourtGame.maxScore, 0, 1), height, 5);
  }

  drawProgressDots() {
    this.progressDots.clear();
    this.progressDots.setDepth(21);
    const startX = 1036;
    for (let index = 0; index < scienceCourtGame.cases.length; index += 1) {
      const filled = this.caseScores[index] !== null;
      const active = index === this.caseIndex;
      this.progressDots.fillStyle(filled ? 0x58cc02 : active ? colors.gold : 0x4b4b4b, 1);
      this.progressDots.fillCircle(startX + index * 30, 80, active ? 11 : 9);
      this.progressDots.lineStyle(3, 0x1b1b1b, 1);
      this.progressDots.strokeCircle(startX + index * 30, 80, active ? 11 : 9);
    }
  }

  getAudienceLine() {
    const lines = [
      "LET'S HEAR THE EXPERT!",
      "WE'RE LISTENING!",
      'INTERESTING CASE!',
      'HMM... INTERESTING!',
      "LET'S SEE THAT DEFENSE!",
    ];
    return lines[this.caseIndex] ?? lines[0];
  }

  getCurrentCase() {
    return scienceCourtGame.cases[this.caseIndex];
  }

  getEvidence(evidenceId) {
    return scienceCourtGame.evidenceBank.find((evidence) => evidence.id === evidenceId);
  }

  getClassificationLabel(type) {
    return type === 'uniform' ? 'uniform mixture' : 'non-uniform mixture';
  }

  getTotalScore() {
    return this.caseScores.reduce((total, score) => total + (score ?? 0), 0);
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
      if (this.phase === 'verdict') {
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
      cases: this.caseDefenses.filter(Boolean).map((entry) => ({
        case_id: entry.case_id,
        classification: entry.classification,
        evidence_ids: [...entry.evidence_ids],
      })),
    };
  }

  submitResult() {
    submitMinigameResult(this, {
      lessonKey: this.lessonId,
      gameKey: scienceCourtGame.id,
      payloadBuilder: () => this.buildSubmissionPayload(),
    });
  }

  buildTestState() {
    return {
      selectedIsland: this.islandId,
      selectedQuarter: this.quarterId,
      selectedMajor: this.majorId,
      selectedLesson: this.lessonId,
      minigameId: scienceCourtGame.id,
      score: this.getTotalScore(),
      gameResult: this.result,
      courtPhase: this.phase,
      courtCaseIndex: this.caseIndex,
      courtCaseId: this.getCurrentCase()?.id ?? null,
      courtCaseCount: scienceCourtGame.cases.length,
      courtSelectedClassification: this.selectedClassification,
      courtClassificationOptions: this.classificationViews.map((view) => ({
        id: view.id,
        label: view.label,
        x: view.x,
        y: view.y,
        correct: view.correct,
        selected: this.selectedClassification === view.id,
      })),
      courtSelectedEvidence: [...this.selectedEvidence],
      courtEvidenceOptions: this.evidenceViews.map((view) => ({
        id: view.id,
        label: view.label,
        x: view.x,
        y: view.y,
        correct: view.correct,
        selected: this.selectedEvidence.includes(view.id),
      })),
      courtCaseScore: this.caseScore,
      courtTotalScore: this.getTotalScore(),
      courtVerdict: this.verdict,
      courtCaseScores: [...this.caseScores],
      courtCaseDefenses: this.caseDefenses.filter(Boolean),
      courtSubmitButton: this.submitButtonMeta,
      courtNextButton: this.nextButtonMeta,
      courtRetryButton: this.retryButtonMeta,
    };
  }

  updateTestState() {
    setTestState(this.buildTestState());
  }
}
