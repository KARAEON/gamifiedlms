import Phaser from 'phaser';
import { closeMinigameHelp } from '../ui/minigameHelp.js';
import { createMinigameNavigation } from '../ui/minigameNavigation.js';
import { createMinigameHeader } from '../ui/minigameHeader.js';
import { createGeneralAsset, createMixtureIcon } from '../ui/assetIcons.js';
import { scienceCourtGame } from '../config/content.js';
import { getPostGameAssessmentLabel, startPostGameAssessment } from '../systems/assessmentFlow.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import { createBottomFeedback, createSparkles } from '../ui/minigameUi.js';
import { closeOpenModal, colors, coverImage, createToggleRow, showModal, textStyle } from '../ui/ui.js';
import { courtButton, courtEvidenceIcon, courtField, courtPanel } from '../ui/scienceCourtUi.js';
import { supplyGlyph, supplyPanel, supplyText, supplyHeading } from '../ui/supplyCartUi.js';
import { playAreaMusic } from '../systems/music.js';

const CLASSIFICATION_OPTIONS = [
  { id: 'uniform', label: 'UNIFORM', color: 0x58cc02 },
  { id: 'nonuniform', label: 'NON-UNIFORM', color: 0xc9362c },
];

const EVIDENCE_CARD_WIDTH = 120;
const EVIDENCE_CARD_HEIGHT = 146;

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
    coverImage(this, 'science-court-backdrop');
    this.add.rectangle(640, 360, 1280, 720, 0x070b13, 0.52);
  }

  createHud() {
    createMinigameNavigation(this);
    const header = createMinigameHeader(this, {
      day: 4, title: 'SCIENCE COURT', subtitle: 'Defend your decision with evidence.',
      counters: [{ label: 'CREDIBILITY SCORE' }, { label: 'CASE PROGRESS' }],
    });
    [this.scoreText, this.progressText] = header.values;
    this.controlsMeta = { settings: this.navigationMeta.settings, back: this.navigationMeta.back };
    createBottomFeedback(this, { primary: 'CLASSIFY. CHOOSE EVIDENCE. DEFEND.', secondary: 'Use what you can see in the sample to support your decision.' });
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
    const panel = courtPanel(this, 182, 166, 340, 158);
    const judge = createGeneralAsset(this, 'judge', { x: 83, y: 157, width: 122, height: 128 });
    const label = courtPanel(this, 83, 226, 132, 32);
    const name = supplyText(this, 83, 226, 'JUDGE WISE', 17, '#ffc84a');
    const bubble = supplyPanel(this, 244, 162, 184, 132, { fill: 0xead4a7, edge: 0xb58b4f });
    const text = supplyText(this, 244, 160, 'Observe the sample.\nChoose a type.\nDefend your answer!', 20, '#282015');
    text.setWordWrapWidth(160);
    this.caseLayer.add([panel, judge, bubble, text, label, name]);
  }

  drawCaseBanner() {
    const current = this.getCurrentCase();
    const banner = courtPanel(this, 590, 153, 460, 122, { purple: true });
    const paper = this.add.rectangle(590, 197, 424, 32, 0xe9cf98);
    const caseLabel = supplyHeading(this, 590, 114, `CASE ${current.caseNumber}`, 24, '#ffe04d');
    const title = supplyHeading(this, 590, 150, current.title, current.title.length > 28 ? 24 : 27, '#ffdb45');
    title.setWordWrapWidth(404);
    const question = supplyText(this, 590, 197, 'Is this a UNIFORM or NON-UNIFORM mixture?', 18, '#282015');
    const accents = [388, 792].map(x => this.add.image(x, 117, 'court-scales').setDisplaySize(25, 32));
    this.caseLayer.add([banner, paper, caseLabel, title, question, ...accents]);
  }

  drawExhibit() {
    const current = this.getCurrentCase();
    const panel = courtPanel(this, 590, 369, 460, 284);
    const stage = this.add.image(590, 369, 'detective-sample-stage').setDisplaySize(424, 254);
    const icon = createMixtureIcon(this, current.icon, { x: 525, y: 375, width: 214, height: 236 });
    const label = courtPanel(this, 548, 234, 168, 34);
    const labelText = supplyHeading(this, 548, 234, 'EXHIBIT A', 19);
    const clipboard = courtPanel(this, 727, 414, 160, 172, { paper: true });
    const clip = this.add.rectangle(727, 326, 42, 13, 0xaaa99c).setStrokeStyle(2, 0x38332d);
    const clueTitle = supplyHeading(this, 727, 352, 'CLUE', 21, '#282015');
    const clues = supplyText(this, 727, 426, current.visualClues.join('\n'), 15, '#282015');
    clues.setWordWrapWidth(132).setLineSpacing(0);
    for (let size = 14; clues.height > 124 && size >= 13; size--) clues.setFontSize(size);
    this.caseLayer.add([panel, stage, icon, label, labelText, clipboard, clip, clueTitle, clues]);
  }

  drawClassificationPanel() {
    const panel = courtPanel(this, 182, 380, 340, 262, { paper: true });
    const header = this.add.rectangle(182, 270, 304, 27, 0x102135);
    const title = supplyHeading(this, 182, 270, 'STEP 1: MAKE YOUR DECISION', 20, '#f3cf8c');
    if (title.width > 296) title.setFontSize(Math.floor(parseFloat(title.style.fontSize) * 296 / title.width));
    const hint = supplyText(this, 182, 299, 'Choose the correct classification.', 18, '#282015');
    const uniformSample = createMixtureIcon(this, 'salt-water', { x: 104, y: 455, width: 46, height: 46 });
    const separateSample = createMixtureIcon(this, 'sand-water', { x: 260, y: 455, width: 46, height: 46 });
    const uniformCaption = supplyText(this, 104, 486, 'SAME THROUGHOUT', 12, '#282015');
    const separateCaption = supplyText(this, 260, 486, 'VISIBLE PARTS', 12, '#282015');
    this.caseLayer.add([panel, header, title, hint, uniformSample, separateSample, uniformCaption, separateCaption]);
    CLASSIFICATION_OPTIONS.forEach((option, i) => this.createClassificationButton(option, 104 + i * 156, 370));
  }

  createClassificationButton(option, x, y) {
    const container = this.add.container(x, y).setDepth(8);
    const width = 144, height = 108;
    const graphics = this.add.graphics();
    const icon = this.add.image(0, -16, 'court-magnifier').setDisplaySize(62, 62);
    const parts = this.add.graphics();
    if (option.id === 'nonuniform') {
      for (const [dx, dy, color] of [[-13, -28, 0xfb9657], [0, -15, 0xe3bc39], [10, -32, 0xa14630]]) {
        parts.fillStyle(color); parts.fillRect(dx, dy, 7, 7); parts.lineStyle(1, 0x392619); parts.strokeRect(dx, dy, 7, 7);
      }
    }
    const text = supplyText(this, 0, 33, option.label, 19);
    const zone = this.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => { if (this.phase === 'defense') container.setScale(1.02); });
    zone.on('pointerout', () => container.setScale(1));
    zone.on('pointerup', () => this.selectClassification(option.id));
    container.add([graphics, icon, parts, text, zone]);
    this.caseLayer.add(container);
    const view = { id: option.id, label: option.label, x, y, width, height, correct: option.id === this.getCurrentCase().type, container, graphics, icon };
    this.classificationViews.push(view);
    this.drawClassificationButton(view);
  }

  drawClassificationButton(view) {
    const selected = this.selectedClassification === view.id;
    const fill = view.id === 'uniform' ? 0x3b761a : 0xaa361a;
    view.graphics.clear();
    view.graphics.fillStyle(fill); view.graphics.fillRect(-view.width / 2, -view.height / 2, view.width, view.height);
    view.graphics.lineStyle(selected ? 4 : 3, selected ? 0xffdf77 : 0x2f2b19);
    view.graphics.strokeRect(-view.width / 2, -view.height / 2, view.width, view.height);
    view.graphics.lineStyle(2, view.id === 'uniform' ? 0x92b936 : 0xdf7437);
    view.graphics.strokeRect(-view.width / 2 + 6, -view.height / 2 + 6, view.width - 12, view.height - 12);
    if (selected) { view.graphics.fillStyle(0xffdf77); view.graphics.fillRect(view.width / 2 - 14, -view.height / 2 + 6, 8, 8); }
  }

  drawEvidencePanel() {
    const current = this.getCurrentCase();
    const panel = courtPanel(this, 1050, 302, 420, 418);
    const count = current.evidencePick.min === current.evidencePick.max ? `${current.evidencePick.min}` : `${current.evidencePick.min}-${current.evidencePick.max}`;
    const title = supplyHeading(this, 1050, 119, 'STEP 2: CHOOSE EVIDENCE', 22, '#f3cf8c');
    this.caseLayer.add([panel, title, supplyText(this, 1050, 147, `Pick ${count} cards to support your decision.`, 18, '#e8dcc0')]);
    current.evidenceOptions.forEach((id, i) => this.createEvidenceCard(id, 921 + i % 3 * 130, 235 + Math.floor(i / 3) * 156));
    this.evidenceHintText = supplyText(this, 1050, 491, '', 15);
    this.caseLayer.add(this.evidenceHintText);
    this.resetEvidenceHintText();
  }

  createEvidenceCard(evidenceId, x, y) {
    const evidence = this.getEvidence(evidenceId);
    const container = this.add.container(x, y).setDepth(8);
    const graphics = this.add.graphics();
    const icon = courtEvidenceIcon(this, evidenceId, 0, -49);
    const label = supplyText(this, 0, -20, evidence.label, 17, '#282015');
    label.setOrigin(0.5, 0).setWordWrapWidth(108).setLineSpacing(0);
    for (let size = 16; label.height > 66 && size >= 14; size--) label.setFontSize(size);
    const checkText = this.add.container(43, -56);
    checkText.add([this.add.rectangle(0, 0, 20, 20, 0x39771d), supplyGlyph(this, 0, 0, 'check', 0xffffff, 2)]);
    const checkbox = this.add.graphics();
    const zone = this.add.zone(0, 0, EVIDENCE_CARD_WIDTH, EVIDENCE_CARD_HEIGHT).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => { if (this.phase === 'defense') container.setScale(1.02); });
    zone.on('pointerout', () => container.setScale(1));
    zone.on('pointerup', () => this.toggleEvidence(evidenceId));
    container.add([graphics, icon, label, checkbox, checkText, zone]);
    this.caseLayer.add(container);
    const view = { id: evidenceId, label: evidence.label, iconName: evidence.icon, x, y, width: EVIDENCE_CARD_WIDTH, height: EVIDENCE_CARD_HEIGHT, correct: this.getCurrentCase().correctEvidence.includes(evidenceId), container, graphics, icon, checkText, checkbox };
    this.evidenceViews.push(view);
    this.drawEvidenceCard(view);
  }

  drawEvidenceCard(view) {
    const selected = this.selectedEvidence.includes(view.id);
    view.graphics.clear();
    view.graphics.fillStyle(0xe9cf98); view.graphics.fillRect(-view.width / 2, -view.height / 2, view.width, view.height);
    view.graphics.lineStyle(3, selected ? 0x74aa28 : 0x967043); view.graphics.strokeRect(-view.width / 2, -view.height / 2, view.width, view.height);
    view.graphics.lineStyle(1, 0xffeabd); view.graphics.strokeRect(-view.width / 2 + 5, -view.height / 2 + 5, view.width - 10, view.height - 10);
    view.checkText.setVisible(selected);
    view.checkbox.clear(); view.checkbox.lineStyle(1, 0x53412c); view.checkbox.strokeRect(-6, 54, 12, 12);
    if (selected) { view.checkbox.fillStyle(0x4c8b21); view.checkbox.fillRect(-4, 56, 8, 8); }
  }

  drawDefensePanel() {
    const panel = courtPanel(this, 411, 584, 802, 132, { paper: true });
    const header = this.add.rectangle(411, 536, 766, 25, 0x102135);
    const title = supplyHeading(this, 411, 536, 'STEP 3: DEFEND YOUR DECISION', 21, '#f3cf8c');
    const prefix = supplyText(this, 30, 568, 'I conclude that', 14, '#282015', 'left');
    const is = supplyText(this, 306, 568, 'is', 17, '#282015', 'left');
    const because = supplyText(this, 494, 568, 'because', 16, '#282015', 'left');
    const and = supplyText(this, 30, 609, 'and', 17, '#282015', 'left');
    const material = courtField(this, 217, 568, 162, this.getCurrentCase().material, null, { size: 18, height: 34 });
    const type = courtField(this, 411, 568, 144, 'CHOOSE TYPE', () => this.showDefenseChoices('type'), { size: 17 });
    const first = courtField(this, 674, 568, 220, 'CHOOSE EVIDENCE', () => this.showDefenseChoices('first'), { size: 16, height: 36 });
    const second = courtField(this, 359, 609, 570, 'CHOOSE EVIDENCE', () => this.showDefenseChoices('second'), { size: 17, height: 36 });
    this.defenseFields = { material, type, first, second };
    this.defenseFieldsMeta = { type: { x: 411, y: 568 }, first: { x: 674, y: 568 }, second: { x: 359, y: 609 } };
    this.defenseText = supplyText(this, 31, 635, '', 13, '#765625', 'left');
    this.defenseHintText = this.defenseText;
    const submit = courtButton(this, 743, 609, 'SUBMIT\nDEFENSE', () => this.submitDefense(), { width: 106, height: 56, size: 18 });
    this.submitButton = submit;
    this.submitButtonMeta = { x: 743, y: 609, label: 'SUBMIT DEFENSE' };
    this.caseLayer.add([panel, header, title, prefix, is, because, and, material.container, type.container, first.container, second.container, this.defenseText, submit]);
    this.updateDefenseText();
    this.drawVerdictPanel();
  }

  drawVerdictPanel() {
    this.verdictLayer?.destroy(true);
    this.verdictLayer = this.add.container(0, 0);
    const panel = courtPanel(this, 1050, 584, 420, 132, { paper: true });
    const header = this.add.rectangle(1050, 536, 384, 25, 0x39204f);
    const title = supplyHeading(this, 1050, 536, "JUDGE'S VERDICT", 21);
    const judge = createGeneralAsset(this, 'judge', { x: 894, y: 593, width: 74, height: 92 });
    const verdict = supplyText(this, 952, 563, this.verdict ? `${this.verdict.toUpperCase()}!` : 'AWAITING DEFENSE', 21, this.verdict ? this.getVerdictColor() : '#765625', 'left');
    const message = supplyText(this, 952, 578, this.verdict === 'accepted' ? 'Your classification and evidence are correct.' : this.verdict ? this.getVerdictMessage(this.getCurrentCase()) : 'Choose a type and evidence, then submit your defense.', 15, '#282015', 'left');
    message.setOrigin(0, 0).setWordWrapWidth(292);
    this.verdictLayer.add([panel, header, title, judge, verdict, message]);
    this.nextButtonMeta = null; this.retryButtonMeta = null;
    this.nextButton = null;
    if (this.verdict) {
      const label = this.caseIndex === scienceCourtGame.cases.length - 1 ? 'FINISH' : 'NEXT CASE';
      this.nextButton = courtButton(this, 1165, 626, label, () => this.advanceCase(), { width: 154, height: 32, fill: 0x18558c, edge: 0x5b94c4, size: 20 });
      this.verdictLayer.add(this.nextButton);
      this.nextButtonMeta = { x: 1165, y: 626, label };
      if (this.verdict !== 'accepted') {
        const retry = courtButton(this, 1014, 626, 'RETRY', () => this.retryCase(), { width: 124, height: 32, size: 20, fill: 0x7d361e });
        this.verdictLayer.add(retry);
        this.retryButtonMeta = { x: 1014, y: 626, label: 'RETRY' };
      }
    }
    this.caseLayer.add(this.verdictLayer);
  }

  selectClassification(type) {
    if (this.phase !== 'defense' || this.currentModal || this.result) {
      return;
    }

    this.selectedClassification = type;
    this.classificationViews.forEach((view) => this.drawClassificationButton(view));
    this.updateDefenseText();
    this.updateTestState();
  }

  toggleEvidence(evidenceId) {
    if (this.phase !== 'defense' || this.currentModal || this.result) {
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
    if (this.phase !== 'defense' || this.currentModal || this.result) {
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
    this.verdict = this.getVerdict(this.caseScore);
    this.phase = 'verdict';
    this.submitButtonMeta = null;
    createSparkles(this, 544, 384);
    this.drawVerdictPanel();
    this.updateHud();
    this.updateTestState();
  }

  setDefenseWarning(message) {
    this.pulseEvidenceHint(message);
  }

  retryCase() {
    closeOpenModal(this);
    this.caseScores[this.caseIndex] = null;
    this.renderCase();
  }

  advanceCase() {
    if (this.phase !== 'verdict' || this.currentModal) {
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
    if (!this.defenseFields) return;
    this.defenseFields.type.text.setText(this.selectedClassification === 'uniform' ? 'UNIFORM' : this.selectedClassification === 'nonuniform' ? 'NON-UNIFORM' : 'CHOOSE TYPE');
    const phrase = id => this.getEvidence(id).label.replace(/\.$/, '');
    this.defenseFields.first.text.setText(this.selectedEvidence[0] ? phrase(this.selectedEvidence[0]) : 'CHOOSE EVIDENCE');
    this.defenseFields.second.text.setText(this.selectedEvidence.length > 1 ? this.selectedEvidence.slice(1).map(phrase).join(' and ') : 'CHOOSE EVIDENCE');
    const current = this.getCurrentCase();
    const range = current.evidencePick.min === current.evidencePick.max ? `${current.evidencePick.min}` : `${current.evidencePick.min}-${current.evidencePick.max}`;
    this.defenseHintText?.setText('');
  }

  showDefenseChoices(kind) {
    if (this.phase !== 'defense' || this.currentModal) return;
    const choices = kind === 'type' ? CLASSIFICATION_OPTIONS.map(option => ({ id: option.id, label: option.label })) : this.getCurrentCase().evidenceOptions.map(id => this.getEvidence(id));
    showModal(this, {
      name: 'court-choice', title: kind === 'type' ? 'CHOOSE CLASSIFICATION' : 'CHOOSE EVIDENCE', width: 620, height: 480,
      body: (_overlay, { panelX, panelTop }) => choices.map((choice, i) => courtButton(this, panelX, panelTop + 125 + i * 40, choice.label, () => {
        closeOpenModal(this);
        if (kind === 'type') this.selectClassification(choice.id);
        else {
          const slot = kind === 'first' ? 0 : 1;
          if (this.selectedEvidence.includes(choice.id) && this.selectedEvidence[slot] !== choice.id) return;
          const values = [...this.selectedEvidence]; values[slot] = choice.id;
          this.selectedEvidence = values.filter(Boolean);
          this.evidenceViews.forEach(view => this.drawEvidenceCard(view));
          this.updateDefenseText(); this.updateTestState();
        }
      }, { width: 548, height: 34, size: 20, fill: 0x292b3a })),
      buttons: [{ label: 'CANCEL', action: () => { closeOpenModal(this); this.updateTestState(); } }],
    });
    this.updateTestState();
  }

  openSettings() {
    if (this.currentModal || this.result) return;
    showModal(this, {
      name: 'court-settings', title: 'SETTINGS', height: 360,
      body: (_overlay, { panelX, panelY }) => [
        createToggleRow(this, panelX - 16, panelY - 32, 'MUSIC', this.registry.get('musicEnabled'), enabled => { this.registry.set('musicEnabled', enabled); playAreaMusic(this, this.islandId); }),
        createToggleRow(this, panelX - 16, panelY + 34, 'SFX', this.registry.get('sfxEnabled'), enabled => this.registry.set('sfxEnabled', enabled)),
      ],
      buttons: [{ label: 'BACK', action: () => { closeOpenModal(this); this.updateTestState(); } }, { label: 'EXIT', action: () => this.returnToQuarter() }],
    });
    this.updateTestState();
  }

  formatEvidencePhrase() {
    const labels = this.selectedEvidence.map((id) => this.getEvidence(id).label.toLowerCase().replace(/\.$/, ''));
    if (labels.length <= 1) {
      return labels[0] ?? '_____';
    }

    return labels.slice(0, -1).join(', ') + ` and ${labels.at(-1)}`;
  }

  updateHud() {
    const total = this.getTotalScore();
    this.scoreText.setText(`${String(total).padStart(3, '0')} / 100`);
    this.progressText.setText(`${this.caseIndex + 1} / ${scienceCourtGame.cases.length}`);
    if (this.nextButton) this.nextButton.setAlpha(this.phase === 'verdict' ? 1 : 0.4);
    this.submitButton?.setAlpha(this.phase === 'defense' ? 1 : 0.4);
  }

  getCurrentCase() {
    return scienceCourtGame.cases[this.caseIndex];
  }

  getEvidence(evidenceId) {
    const evidence = scienceCourtGame.evidenceBank.find(item => item.id === evidenceId);
    if (evidenceId === 'not-evenly-mixed') return { ...evidence, label: 'The parts are not evenly mixed.' };
    if (evidenceId === 'common-use') return {
      ...evidence, label: this.getCurrentCase().icon === 'shampoo' ? 'It is used for cleaning.' : 'It is used in everyday life.',
    };
    return evidence;
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
    if (this.minigameHelpOpen) {
      closeMinigameHelp(this);
      return;
    }
    if (this.currentModal) {
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
      minigameId: scienceCourtGame.id,
      score: this.getTotalScore(),
      gameResult: this.result,
      courtControls: this.controlsMeta,
      courtDefenseFields: this.defenseFieldsMeta,
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
      courtSubmitButton: this.submitButtonMeta,
      courtNextButton: this.nextButtonMeta,
      courtRetryButton: this.retryButtonMeta,
    };
  }

  updateTestState() {
    setTestState(this.buildTestState());
  }
}
