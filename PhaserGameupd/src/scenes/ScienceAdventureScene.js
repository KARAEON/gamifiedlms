import Phaser from 'phaser';
import { scienceQuarterGames, getScienceGame, SCIENCE_TOOLS, REPORT_CASES, REPORT_CAPTION_LIMIT } from '../config/scienceQuarterGames.js';
import { initialScienceState, scienceAction, scienceOutcome } from '../games/science/scienceLogic.js';
import { renderSeparation } from '../games/science/separationViews.js';
import { renderCommunity } from '../games/science/communityViews.js';
import { createMinigameHeader } from '../ui/minigameHeader.js';
import { createMinigameNavigation } from '../ui/minigameNavigation.js';
import { createBottomFeedback } from '../ui/minigameUi.js';
import { supplyControl, supplyGlyph, supplyPanel, supplyText, supplyHeading } from '../ui/supplyCartUi.js';
import { qAsset, qPanel, qText } from '../ui/scienceQuarterUi.js';
import { BODY_FONT, closeOpenModal, coverImage, createToggleRow, showModal } from '../ui/ui.js';
import { markSceneReady, setTestState } from '../systems/testSeam.js';
import { playAreaMusic } from '../systems/music.js';
import { SCIENCE_SAVE_KEY, readScienceProgress } from '../systems/scienceProgress.js';
import { magnetControl, magnetPanel, magnetResults } from '../ui/magnetWorkshopUi.js';
import { openSieveHelp, sieveResults } from '../ui/sieveWorkshopUi.js';
import { filterResults } from '../ui/filterWorkshopUi.js';
import { evaporationResults, openEvaporationHelp } from '../ui/evaporationWorkshopUi.js';
import { decantResults, openDecantHelp } from '../ui/decantWorkshopUi.js';
import { communityShiftResults, openCommunityShiftHelp } from '../ui/communityShiftUi.js';
import { recoveryCircuitResults, openRecoveryCircuitHelp } from '../ui/recoveryCircuitUi.js';
import { villageImpactResults, openVillageImpactHelp } from '../ui/villageImpactUi.js';
import { brokenSeparatorResults, openBrokenSeparatorHelp } from '../ui/brokenSeparatorUi.js';
import { fieldReportResults, openFieldReportHelp, reportPhotoLabels } from '../ui/fieldReportUi.js';
import { renderMysterySample, mysteryResults, openMysteryHelp } from '../ui/mysterySampleUi.js';
import { MYSTERY_CASES } from '../games/science/mysterySampleLogic.js';
import { KIT_CASES } from '../games/science/recoveryKitLogic.js';
import { renderRecoveryKit, recoveryKitResults, openRecoveryKitHelp } from '../ui/recoveryKitUi.js';
import { RELAY_CASES } from '../games/science/separationRelayLogic.js';
import { renderSeparationRelay, separationRelayResults, openSeparationRelayHelp } from '../ui/separationRelayUi.js';
import { FAIR_CASES } from '../games/science/fairTestLogic.js';
import { renderFairTest, fairTestResults, openFairTestHelp } from '../ui/fairTestUi.js';
import { REVIVAL_CASES } from '../games/science/workshopRevivalLogic.js';
import { renderWorkshopRevival, workshopRevivalResults, openWorkshopRevivalHelp, materialName } from '../ui/workshopRevivalUi.js';

export default class ScienceAdventureScene extends Phaser.Scene {
  constructor() { super('ScienceAdventureScene'); }

  init(data = {}) {
    this.lessonId = data.lessonId ?? 'q1-m2-l1';
    this.gameDefinition = getScienceGame(this.lessonId) ?? scienceQuarterGames[0];
    this.lessonId = this.gameDefinition.lessonId;
    this.islandId = data.islandId ?? 'vulcan-caverns';
    this.quarterId = data.quarterId ?? 'q1';
    this.majorId = data.majorId ?? (this.gameDefinition.day < 11 ? 'q1-major-2' : this.gameDefinition.day < 16 ? 'q1-major-3' : 'q1-major-4');
    this.returnScrollY = Number.isFinite(data.returnScrollY) ? data.returnScrollY : this.gameDefinition.day < 11 ? 700 : this.gameDefinition.day < 16 ? 1250 : 1800;
    this.currentModal = null;
  }

  create() {
    this.input.dragDistanceThreshold = 8;
    this.round = 0;
    this.phase = 'playing';
    this.result = null;
    this.records = [];
    this.score = 0;
    this.state = initialScienceState(this.gameDefinition.kind);
    const workshop = ['magnet', 'sieve', 'filter', 'evaporate', 'decant', 'schedule', 'circuit', 'impact', 'diagnose', 'report', 'mystery', 'kit', 'relay', 'fair', 'revival'].includes(this.gameDefinition.kind);
    this.scienceControl = workshop ? magnetControl : supplyControl;
    coverImage(this, workshop ? 'science-workshop-backdrop' : this.gameDefinition.day < 11 ? 'invent-workshop-backdrop' : 'supply-station-backdrop');
    this.add.rectangle(640, 360, 1280, 720, 0x070d14, workshop ? 0.14 : 0.66);
    this.header = createMinigameHeader(this, {
      day: this.gameDefinition.day, detail: this.gameDefinition.day < 11 ? 'SEPARATION' : 'COMMUNITY',
      title: this.gameDefinition.title, subtitle: this.gameDefinition.subtitle,
      counters: [{ label: 'CHALLENGE' }, { label: 'SCORE', glyph: 'star' }],
      ...(workshop ? { panelFactory: magnetPanel } : {}),
    });
    createMinigameNavigation(this, { controlFactory: this.scienceControl });
    createBottomFeedback(this, { primary: this.gameDefinition.kind === 'sieve' ? 'Adjust the mesh. Run a batch. Inspect both trays.' : this.gameDefinition.summary,
      secondary: 'Three challenges. Explore, observe, and retry. No timer.',
      ...(workshop ? { panelFactory: magnetPanel, align: 'left', primarySize: 21, secondaryColor: '#c5b3ef' } : {}) });
    playAreaMusic(this, this.islandId);
    this.keyHandler = event => {
      if (event.key === 'Escape') {
        if (this.currentModal) { this.minigameHelpOpen = false; closeOpenModal(this); this.updateTestState(); }
        else if (this.gameDefinition.kind === 'mystery' && this.state.menu) { this.perform('menu', null); return; }
        else if (this.gameDefinition.kind === 'fair' && this.state.evidenceOpen) { this.perform('evidence-menu', false); return; }
        else if (document.activeElement === this.captionInput) this.captionInput.blur();
        else this.returnToQuarter();
      }
      if (this.currentModal || this.phase !== 'playing' || document.activeElement === this.captionInput) return;
      if (this.gameDefinition.kind === 'magnet') {
        const dx = event.key === 'ArrowLeft' ? -25 : event.key === 'ArrowRight' ? 25 : 0;
        const dy = event.key === 'ArrowUp' ? -25 : event.key === 'ArrowDown' ? 25 : 0;
        if (dx || dy) { event.preventDefault(); this.perform('sweep', { x: this.state.magnet.x + dx, y: this.state.magnet.y + dy }); }
        if (event.code === 'Space') { event.preventDefault(); this.perform('release'); }
      }
    };
    this.input.keyboard.on('keydown', this.keyHandler);
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown', this.keyHandler);
      this.captionOverlay?.remove(); this.captionOverlay = null; this.captionInput = null;
    });
    this.render();
    markSceneReady(this.scene.key, this.buildTestState());
  }

  perform(type, value) {
    if (this.currentModal || this.phase !== 'playing') return;
    this.state = scienceAction(this.state, { type, value });
    this.render();
  }

  button(id, x, y, label, action, options = {}) {
    const node = this.scienceControl(this, x, y, label, () => {
      if (!this.currentModal) action();
    }, { width: 160, height: 42, size: 20, fill: 0x214d61, edge: 0xb98a43, ...options });
    this.layer.add(node);
    node.setData('testId', id);
    this.controlViews.push({ id, x, y, width: options.width ?? 160, height: options.height ?? 42 });
    return node;
  }

  render() {
    this.layer?.destroy(true);
    this.layer = this.add.container(0, 0).setDepth(10);
    this.controlViews = [];
    this.header.values[0].setText(`${this.round + 1} / 3`);
    this.header.values[1].setText(`${this.score}`);
    if (['magnet', 'sieve', 'filter', 'evaporate', 'decant', 'schedule', 'circuit', 'impact', 'diagnose', 'report', 'mystery', 'kit', 'relay', 'fair', 'revival'].includes(this.gameDefinition.kind)) {
      this.layer.add(magnetPanel(this, 640, 119, 654, 46, { fill: 0xe9cf98, edge: 0xb98a43 }));
      const mission = this.gameDefinition.kind === 'magnet'
        ? ['Recover iron from sand and wood.', 'Recover iron. Copper stays behind.', 'Recover reusable iron from the sample.'][this.round]
        : this.challengeTitle().replace(/^CHALLENGE \d+: /, '');
      if (['impact', 'diagnose', 'report', 'kit', 'relay', 'fair', 'revival'].includes(this.gameDefinition.kind)) {
        const label = qText(this, 640, 119, mission, 20, '#292116');
        if (label.width > 610) label.setFontSize(Math.floor(20 * 610 / label.width));
      } else qText(this, 640, 119, mission, 22, '#292116', 610);
      if (this.gameDefinition.kind === 'mystery') renderMysterySample(this);
      else if (this.gameDefinition.kind === 'kit') renderRecoveryKit(this);
      else if (this.gameDefinition.kind === 'relay') renderSeparationRelay(this);
      else if (this.gameDefinition.kind === 'fair') renderFairTest(this);
      else if (this.gameDefinition.kind === 'revival') renderWorkshopRevival(this);
      else if (this.gameDefinition.day < 11) renderSeparation(this);
      else renderCommunity(this);
      this.drawFeedback(); this.updateTestState();
      return;
    }
    qPanel(this, 640, 131, 1248, 54, { fill: 0xe9cf98, edge: 0xb98a43 });
    qText(this, 640, 130, this.challengeTitle(), 23, '#292116', 1200);
    qPanel(this, 420, 399, 808, 470, { fill: 0x0b1b29, edge: 0xb98a43 });
    qPanel(this, 1050, 399, 428, 470, { fill: 0x102135, edge: 0xb98a43 });
    qText(this, 420, 187, this.gameDefinition.day < 11 ? 'EXPERIMENT BENCH' : this.gameDefinition.kind === 'report' ? 'FIELD PHOTOGRAPHS' : 'COMMUNITY WORKBOARD', 23, '#67d8ee');
    qText(this, 1050, 187, this.gameDefinition.kind === 'report' ? 'YOUR FIELD REPORT' : 'OBSERVATIONS & RESULTS', 22, '#caa5ec');
    if (this.gameDefinition.day < 11) renderSeparation(this);
    else renderCommunity(this);
    this.drawFeedback();
    this.updateTestState();
    this.syncCaptionInput();
  }

  challengeTitle() {
    if (this.gameDefinition.kind === 'revival') return `CHALLENGE ${this.round + 1}: ${REVIVAL_CASES[this.round].mission}`;
    if (this.gameDefinition.kind === 'fair') return `CHALLENGE ${this.round + 1}: ${FAIR_CASES[this.round].mission}`;
    if (this.gameDefinition.kind === 'relay') return `CHALLENGE ${this.round + 1}: ${RELAY_CASES[this.round].mission}`;
    if (this.gameDefinition.kind === 'kit') return `CHALLENGE ${this.round + 1}: ${KIT_CASES[this.round].mission}`;
    if (this.gameDefinition.kind === 'mystery') return `CHALLENGE ${this.round + 1}: ${MYSTERY_CASES[this.round].mission}`;
    const r = this.round + 1;
    const names = {
      magnet: ['Recover iron from sand and wood.', 'Copper is metal, but it is not attracted here.', 'Recover reusable iron from the repair sample.'],
      sieve: ['Pass size-2 grains; retain size-6 stones.', 'Pass size-3 grains; retain size-7 stones.', 'Pass size-4 grains; retain size-8 stones.'],
      filter: ['Find the sand recovered from sand and water.', 'Trace dissolved salt in a saltwater sample.', 'Recover insoluble clay from clay and water.'],
      evaporate: ['Record how saltwater changes over time.', 'Recover the salt; account for the water.', 'Make a complete evaporation observation record.'],
      decant: ['Collect upper liquid after sand settles.', 'Use a gentle tilt to keep sediment behind.', 'Recover liquid while leaving some above the sediment.'],
      schedule: ['Serve the repair yard, builder, and salt maker.', 'Recover useful materials for three local makers.', 'Plan three jobs that finish within the shift.'],
      circuit: ['Recover iron, sand, and water separately.', 'Recover stones, sand, and water separately.', 'Recover sand and salt; account for water vapor.'],
      impact: ['Choose two services with the greatest useful recovery.', 'Recover the most material with two service tokens.', 'Choose where separation can help most.'],
      diagnose: ['Sand and stones both pass through the sieve.', 'Paper filtration did not recover dissolved salt.', 'Sediment entered the liquid during a steep, unsettled pour.'],
      report: ['Report how sieving helps a building yard.', 'Report how magnetic separation helps repairs.', 'Report how evaporation produces useful salt.'],
    };
    return `CHALLENGE ${r}: ${names[this.gameDefinition.kind][this.round]}`;
  }

  drawFeedback() {
    if (this.gameDefinition.kind === 'revival') { workshopRevivalResults(this); return; }
    if (this.gameDefinition.kind === 'fair') { fairTestResults(this); return; }
    if (this.gameDefinition.kind === 'relay') { separationRelayResults(this); return; }
    if (this.gameDefinition.kind === 'kit') { recoveryKitResults(this); return; }
    if (this.gameDefinition.kind === 'mystery') { mysteryResults(this); return; }
    if (this.gameDefinition.kind === 'magnet') { magnetResults(this); return; }
    if (this.gameDefinition.kind === 'sieve') { sieveResults(this); return; }
    if (this.gameDefinition.kind === 'filter') { filterResults(this); return; }
    if (this.gameDefinition.kind === 'evaporate') { evaporationResults(this); return; }
    if (this.gameDefinition.kind === 'decant') { decantResults(this); return; }
    if (this.gameDefinition.kind === 'schedule') { communityShiftResults(this); return; }
    if (this.gameDefinition.kind === 'circuit') { recoveryCircuitResults(this); return; }
    if (this.gameDefinition.kind === 'impact') { villageImpactResults(this); return; }
    if (this.gameDefinition.kind === 'diagnose') { brokenSeparatorResults(this); return; }
    if (this.gameDefinition.kind === 'report') { fieldReportResults(this); return; }
    const report = this.gameDefinition.kind === 'report';
    const y = report ? 497 : 453, height = report ? 84 : 134;
    const success = this.phase !== 'playing';
    qPanel(this, 1050, y, 386, height, { fill: success ? 0x15311c : 0x182334, edge: success ? 0x85b548 : 0x466580 });
    qText(this, 1050, y - height / 2 + 19, success ? this.phase === 'finished' ? 'ACTIVITY COMPLETE' : report ? 'SAVED FOR REVIEW' : 'CHALLENGE COMPLETE!' : 'OBSERVE AND TRY', 20, success ? '#b5e748' : '#ffce58');
    qText(this, 1050, y + 13, this.state.message || 'Use the bench controls, inspect the outputs, then check your work.', report ? 16 : 18, '#efdfb8', 350);
    if (this.phase === 'playing') {
      this.button('reset', 914, 585, 'RESET', () => this.resetRound(), { width: 108, fill: 0x543248 });
      this.button('check', 1106, 585, report ? 'SAVE REPORT' : 'CHECK RESULT', () => this.checkRound(), { width: 240, fill: 0x32641f });
    } else {
      this.button('retry', 914, 585, 'RETRY', () => this.resetRound(), { width: 108, fill: 0x543248 });
      this.button('next', 1106, 585, this.phase === 'finished' ? 'LESSON MAP' : 'NEXT CHALLENGE', () => this.nextRound(), { width: 240, fill: 0x32641f });
    }
    qText(this, 1050, 619, this.phase === 'finished' ? report ? 'Reports saved locally for teacher review.' : 'All three challenges complete.' : 'Your choices stay when Help or Settings opens.', 15, '#9baec3', 370);
  }

  resetRound() {
    if (this.currentModal) return;
    // Retrying a completed challenge replaces its result, never adds score twice.
    const old = this.records[this.round];
    if (old) { this.score -= old.score; this.records[this.round] = null; }
    this.phase = 'playing'; this.result = null;
    this.state = initialScienceState(this.gameDefinition.kind, this.round);
    if (this.gameDefinition.kind === 'revival') this.state.repairs = Array.from({ length: 3 }, (_, i) => Boolean(this.records[i]));
    if (this.captionInput) this.captionInput.value = '';
    this.render();
  }

  checkRound() {
    if (this.currentModal || this.phase !== 'playing') return;
    const outcome = scienceOutcome(this.state);
    if (this.gameDefinition.kind === 'fair') {
      this.state.evidenceOpen = false;
      this.state.answers.push({ attempt: this.state.attempts + 1, selected: this.state.selected, evidence: this.state.evidence, correct: outcome.success });
    }
    if (this.gameDefinition.kind === 'mystery') this.state.answers.push({ attempt: this.state.attempts + 1,
      components: this.state.components, classification: this.state.classification, evidence: [...this.state.evidence], correct: outcome.success });
    this.state.message = outcome.message;
    this.state.attempts += 1;
    if (outcome.success) {
      const record = { score: Math.max(10, 25 - (this.state.attempts - 1) * 3), attempts: this.state.attempts,
        state: structuredClone(this.state), reviewRequired: ['report', 'revival'].includes(this.gameDefinition.kind) };
      this.records[this.round] = record;
      this.score += record.score;
      this.phase = this.round === 2 ? 'finished' : 'complete';
      if (this.phase === 'finished') this.result = 'completed';
      this.saveProgress();
    }
    this.render();
  }

  saveProgress() {
    const progress = readScienceProgress();
    const previous = progress[this.lessonId];
    const records = Array.from({ length: 3 }, (_, i) => this.records[i] ?? previous?.records?.[i] ?? null);
    progress[this.lessonId] = { id: this.gameDefinition.id, competency: this.gameDefinition.competency,
      ...(this.gameDefinition.competencies ? { competencies: this.gameDefinition.competencies } : {}),
      completed: this.phase === 'finished' || Boolean(previous?.completed), score: records.reduce((total, item) => total + (item?.score ?? 0), 0), records,
      bestScore: Math.max(this.score, previous?.bestScore ?? previous?.score ?? 0),
      reviewRequired: ['report', 'revival'].includes(this.gameDefinition.kind), savedAt: new Date().toISOString() };
    try { localStorage.setItem(SCIENCE_SAVE_KEY, JSON.stringify(progress)); } catch {
      this.state.message += ' Browser storage is unavailable; this result remains in the current session.';
    }
  }

  nextRound() {
    if (this.phase === 'finished') { this.returnToQuarter(); return; }
    if (this.phase !== 'complete') return;
    this.round += 1;
    this.state = initialScienceState(this.gameDefinition.kind, this.round);
    if (this.gameDefinition.kind === 'revival') this.state.repairs = Array.from({ length: 3 }, (_, i) => Boolean(this.records[i]));
    this.phase = 'playing';
    if (this.captionInput) this.captionInput.value = '';
    this.render();
  }

  returnToQuarter() {
    closeOpenModal(this);
    this.scene.start('QuarterDetailScene', { islandId: this.islandId, quarterId: this.quarterId, scrollY: this.returnScrollY });
  }

  openScienceHelp() {
    if (this.gameDefinition.kind === 'revival') { openWorkshopRevivalHelp(this); return; }
    if (this.gameDefinition.kind === 'fair') { openFairTestHelp(this); return; }
    if (this.gameDefinition.kind === 'relay') { openSeparationRelayHelp(this); return; }
    if (this.gameDefinition.kind === 'kit') { openRecoveryKitHelp(this); return; }
    if (this.gameDefinition.kind === 'mystery') { openMysteryHelp(this); return; }
    if (this.gameDefinition.kind === 'sieve') { openSieveHelp(this); return; }
    if (this.gameDefinition.kind === 'evaporate') { openEvaporationHelp(this); return; }
    if (this.gameDefinition.kind === 'decant') { openDecantHelp(this); return; }
    if (this.gameDefinition.kind === 'schedule') { openCommunityShiftHelp(this); return; }
    if (this.gameDefinition.kind === 'circuit') { openRecoveryCircuitHelp(this); return; }
    if (this.gameDefinition.kind === 'impact') { openVillageImpactHelp(this); return; }
    if (this.gameDefinition.kind === 'diagnose') { openBrokenSeparatorHelp(this); return; }
    if (this.gameDefinition.kind === 'report') { openFieldReportHelp(this); return; }
    if (this.currentModal) return;
    this.minigameHelpOpen = true;
    showModal(this, {
      name: 'minigame-help', title: 'HOW TO PLAY', width: 1120, height: 580,
      titleTop: 43, titleSize: 33, buttonY: 611,
      body: () => {
        const nodes = [];
        const kind = this.gameDefinition.kind;
        const toolId = kind === 'diagnose' ? ['sieve', 'evaporate', 'decant'][this.round] : kind;
        const tool = SCIENCE_TOOLS.find(t => t.id === toolId) ?? SCIENCE_TOOLS[this.round % 5];
        const addText = (x, y, label, size, color, width, role = 'body') => {
          const t = (role === 'heading' ? supplyHeading : supplyText)(this, x, y, label, size, color); if (width) t.setWordWrapWidth(width, true); nodes.push(t);
        };
        addText(640, 144, this.gameDefinition.subtitle, 22, '#67d8ee');
        this.gameDefinition.steps.forEach(([title, detail], index) => {
          const x = 294 + index * 346;
          nodes.push(supplyPanel(this, x, 279, 326, 234, { fill: 0x102436, edge: 0x42678a }));
          addText(x, 186, title, 23, '#b5e748', 0, 'heading');
          if (['report', 'schedule', 'circuit', 'impact'].includes(kind)) {
            const examples = {
              report: ['general-sand-mound', 'science-sieve', 'general-sand-mound'],
              schedule: ['general-civilian', 'science-sieve', 'general-sand-mound'],
              circuit: ['general-sand-and-water', 'science-magnet', 'science-funnel'],
              impact: ['general-civilian', 'science-magnet', 'science-iron-nail'],
            }[kind];
            for (let j = 0; j < 3; j++) {
              nodes.push(supplyPanel(this, x - 88 + j * 88, 264, 76, 66, { fill: j <= index ? 0x2c542c : 0x192b3c, edge: 0xb98a43 }));
              const example = this.add.image(x - 88 + j * 88, 256, examples[j]);
              example.setScale(Math.min(42 / example.width, 42 / example.height)); nodes.push(example);
              if (kind === 'report' && j === 0) {
                const stone = this.add.image(x - 75, 259, 'science-pebble');
                stone.setScale(17 / Math.max(stone.width, stone.height)); nodes.push(stone);
              }
              addText(x - 88 + j * 88, 285, kind === 'report' ? ['BEFORE', 'METHOD', 'AFTER'][j] : `${j + 1}`, 12, '#efdfb8');
            }
          } else if (kind === 'filter') {
            const names = index === 0 ? ['filter-beaker', 'filter-funnel'] : index === 1 ? ['filter-beaker', 'filter-funnel'] : ['filter-funnel', 'filter-beaker'];
            names.forEach((name, j) => {
              const image = this.add.image(x - 76 + j * 142, 268, `science-${name}`, 'trimmed');
              image.setScale(Math.min(83 / image.width, 90 / image.height)); nodes.push(image);
              addText(x - 76 + j * 142, 322, index === 0 ? ['JAR', 'FUNNEL'][j] : index === 1 ? ['SAMPLE', 'PAPER'][j] : ['RESIDUE', 'FILTRATE'][j], 15, '#67d8ee');
            });
            nodes.push(supplyGlyph(this, x, 268, index === 0 ? 'check' : 'arrow', 0xffce58, 3).setAngle(index === 0 ? 0 : 180));
          } else {
            const inputKey = toolId === 'evaporate' ? 'general-saltwater' : toolId === 'sieve' || toolId === 'magnet' ? 'general-sand-mound' : 'general-sand-and-water';
            const outputKey = toolId === 'evaporate' ? 'general-salt' : toolId === 'sieve' ? 'general-sand-mound' : toolId === 'magnet' ? 'science-iron-nail' : 'general-bottled-water';
            const key = index === 0 ? inputKey : index === 1 ? this.textures.exists(`science-${tool.asset}`) ? `science-${tool.asset}` : 'general-sand-and-water' : outputKey;
            const image = this.add.image(x - 34, 268, key); image.setScale(Math.min(92 / image.width, 92 / image.height)); nodes.push(image);
            nodes.push(supplyGlyph(this, x + 74, 268, index === 2 ? 'check' : 'arrow', 0xffce58, 4).setAngle(index === 2 ? 0 : 180));
          }
          addText(x, 352, detail, 19, '#efdfb8', 288);
        });
        nodes.push(supplyPanel(this, 640, 490, 1054, 152, { fill: 0x15301f, edge: 0x85b548 }));
        nodes.push(this.add.image(185, 490, 'supply-guide').setDisplaySize(90, 105));
        addText(691, 443, 'SCIENTIST NOTE', 24, '#ffce58');
        addText(691, 497, this.gameDefinition.tip, 21, '#efdfb8', 815);
        const close = supplyControl(this, 640, 611, 'GOT IT', () => {
          this.minigameHelpOpen = false; closeOpenModal(this); this.updateTestState();
        }, { width: 180, height: 50, fill: 0x32641f });
        nodes.push(close); return nodes;
      }, buttons: [],
    });
    this.updateTestState();
  }

  openSettings() {
    if (this.currentModal) return;
    showModal(this, {
      name: 'science-settings', title: 'SETTINGS', height: 360,
      body: (_overlay, { panelX, panelY }) => [
        createToggleRow(this, panelX - 16, panelY - 32, 'MUSIC', this.registry.get('musicEnabled'), enabled => {
          this.registry.set('musicEnabled', enabled); playAreaMusic(this, this.islandId);
        }),
        createToggleRow(this, panelX - 16, panelY + 34, 'SFX', this.registry.get('sfxEnabled'), enabled => this.registry.set('sfxEnabled', enabled)),
      ],
      buttons: [{ label: 'DONE', action: () => { closeOpenModal(this); this.updateTestState(); } }],
    });
    this.updateTestState();
  }

  syncCaptionInput() {
    if (!this.captionInput) return;
    const b = this.game.canvas.getBoundingClientRect();
    const sx = b.width / 1280, sy = b.height / 720;
    const field = this.captionBounds;
    this.captionInput.readOnly = this.phase !== 'playing';
    Object.assign(this.captionInput.style, { left: `${b.left + field.x * sx}px`, top: `${b.top + field.y * sy}px`, width: `${field.width * sx}px`, height: `${field.height * sy}px`, fontSize: `${field.fontSize * sx}px`, display: this.currentModal ? 'none' : 'block' });
  }

  update() { this.syncCaptionInput(); }

  ensureCaptionInput() {
    if (this.captionInput) return;
    const input = document.createElement('textarea');
    input.setAttribute('aria-label', this.gameDefinition.kind === 'revival' ? 'Workshop repair explanation' : 'Field report explanation');
    input.maxLength = REPORT_CAPTION_LIMIT;
    input.minLength = 20;
    input.placeholder = 'Explain the method, recovered material, and how it helps people...';
    // A dedicated overlay keeps the field out of the body's centered CSS grid.
    const overlay = document.createElement('div');
    Object.assign(overlay.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '5' });
    Object.assign(input.style, { position: 'absolute', pointerEvents: 'auto', display: 'none', resize: 'none', boxSizing: 'border-box', margin: '0', border: '0', borderRadius: '0', padding: '0', background: 'transparent', color: '#292116', fontFamily: BODY_FONT, fontWeight: '400', lineHeight: '1.35' });
    input.value = this.state.caption;
    input.addEventListener('input', () => {
      if (this.currentModal || this.phase !== 'playing') return;
      this.state = scienceAction(this.state, { type: 'caption', value: input.value });
      this.captionCount?.setText(`${this.state.caption.length} / ${REPORT_CAPTION_LIMIT}`);
      if (this.gameDefinition.kind === 'revival') {
        // Refresh save readiness without replacing the focused DOM field or caret.
        this.layer.getByName('revival-save-control')?.destroy(true);
        const before = this.controlViews.length;
        const node = this.button('check', 1135, 615, 'CHECK RESULT', () => this.checkRound(), { width: 232, height: 43, size: 22, fill: 0x32641f, enabled: scienceOutcome(this.state).success });
        node.setName('revival-save-control');
        this.controlViews.splice(before, 1);
      }
      this.reportStatusText?.setText(this.gameDefinition.kind === 'revival' ? 'Explain the recovered material and its benefit.' : 'Ready to save your report?').setFontSize(16).setColor('#fff0d6');
      this.updateTestState();
    });
    overlay.appendChild(input); document.body.appendChild(overlay);
    this.captionOverlay = overlay;
    this.captionInput = input;
  }

  downloadReports() {
    const progress = readScienceProgress()[this.lessonId];
    const records = progress?.records ?? this.records;
    const reports = records.flatMap((record, round) => {
      if (!record) return [];
      if (this.gameDefinition.kind === 'revival') {
        const c = REVIVAL_CASES[round];
        return [{ challenge: round + 1, repair: c.region, mixture: materialName(c.input), explanation: record.state.caption,
          methods: record.state.steps.map(step => step.tool), productsUsed: record.state.applied, outputsKept: record.state.streams,
          workshopRepairs: record.state.repairs, communityBenefit: c.benefit, reviewRequired: true }];
      }
      const c = REPORT_CASES[round], labels = reportPhotoLabels(round);
      return [{ challenge: round + 1, title: c.title, explanation: record.state.caption,
        images: record.state.panels.map((role, index) => ({ stage: ['BEFORE', 'PROCESS', 'AFTER'][index], label: labels[role], selection: role })),
        communityBenefit: c.benefit, reviewRequired: true }];
    });
    const content = JSON.stringify({ activity: this.gameDefinition.title, competency: this.gameDefinition.competency,
      reviewNote: 'Written explanations require teacher review. Completion is not automatic mastery.',
      reports, records }, null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = this.gameDefinition.kind === 'revival' ? 'lumify-workshop-mission-records.json' : 'lumify-science-field-reports.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  buildTestState() {
    return { minigameId: this.gameDefinition.id, minigameControls: this.navigationMeta,
      minigameHelpOpen: Boolean(this.minigameHelpOpen), minigameHelpButton: this.helpButtonMeta,
      selectedIsland: this.islandId, selectedQuarter: this.quarterId, selectedMajor: this.majorId, selectedLesson: this.lessonId,
      score: this.score, gameResult: this.result, science: { kind: this.gameDefinition.kind, round: this.round, phase: this.phase,
        state: structuredClone(this.state), controls: this.controlViews, records: this.records, competency: this.gameDefinition.competency } };
  }

  updateTestState() { setTestState(this.buildTestState()); }
}
