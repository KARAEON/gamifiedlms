import { ENGLISH_DEVICES, ENGLISH_SOUND_BANK, englishWordAudioKey } from '../config/englishWeekOne.js';
import { annotationIsPlaced, buildPoemReport, englishAccuracy, poemSubmissionIssues } from '../games/english/englishLogic.js';
import { playAreaMusic } from '../systems/music.js';
import './englishGames.css';

const make = (tag, className = '', text = '') => {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
};
const append = (parent, ...children) => { parent.append(...children.filter(Boolean)); return parent; };
const soundText = sound => ENGLISH_SOUND_BANK[sound]?.label ?? sound;

export class EnglishGameView {
  constructor(scene) {
    this.scene = scene;
    this.overlay = make('div', 'english-overlay');
    this.root = make('main', 'english-root');
    this.root.setAttribute('aria-label', scene.gameDefinition.title);
    this.root.style.setProperty('--english-backdrop', `url('/assets/english-week1/${scene.gameDefinition.backdrop}.png')`);
    this.overlay.append(this.root); document.body.append(this.overlay);
    this.drag = null; this.suppressClickUntil = 0; this.lastSelection = null;
    this.onMove = event => this.moveDrag(event);
    this.onUp = event => this.finishDrag(event);
    this.onCancel = () => this.cancelDrag();
    document.addEventListener('pointermove', this.onMove);
    document.addEventListener('pointerup', this.onUp);
    document.addEventListener('pointercancel', this.onCancel);
    this.syncBounds();
  }

  button(label, action, { className = '', key = label, disabled = false, title, pressed } = {}) {
    const button = make('button', `english-button ${className}`, label);
    button.type = 'button'; button.dataset.focusKey = key;
    if (title) { button.title = title; if (label === '▶' || label === '×') button.setAttribute('aria-label', title); }
    button.disabled = disabled;
    if (pressed !== undefined) button.setAttribute('aria-pressed', String(pressed));
    button.addEventListener('click', event => {
      if (performance.now() < this.suppressClickUntil) { event.preventDefault(); return; }
      action();
    });
    return button;
  }

  perform(type, value, options) { this.scene.perform(type, value, options); }

  render() {
    const active = document.activeElement;
    const focusKey = this.root.contains(active) ? active?.dataset.focusKey : null;
    const priorScroll = this.workspace?.scrollTop ?? 0;
    this.root.replaceChildren();
    const game = this.scene.gameDefinition, state = this.scene.state;
    this.root.dataset.game = game.kind; this.root.dataset.phase = state.phase;
    const header = make('header', 'english-header');
    const heading = make('div', 'english-heading');
    append(heading, make('h1', '', game.title), make('p', '', `Day ${game.day} · ${game.subtitle}`));
    const nav = make('nav', 'english-navigation'); nav.setAttribute('aria-label', 'Game controls');
    append(nav,
      this.button('Help', () => this.openHelp(), { key: 'help' }),
      this.button('Pause', () => this.openPause(), { key: 'pause' }),
      this.button('Settings', () => this.openSettings(), { key: 'settings' }),
    );
    append(header, heading, nav);
    const main = make('div', 'english-main');
    const aside = make('aside', 'english-aside');
    const caption = make('div', 'english-field-note');
    const round = game.rounds[state.round];
    const stage = state.phase === 'tutorial' ? 'A little practice first' : ['editor', 'review'].includes(state.phase) ? 'Your poem, your voice' : state.phase === 'result' ? 'Your Reading Island journal' : round.exit ? 'Exit check' : `Challenge ${state.round + 1} of ${game.kind === 'festival' ? 3 : 3}`;
    append(caption, make('h2', '', stage), make('p', '', ['editor', 'review'].includes(state.phase) ? 'Four stanzas. Three lines each. Mark the sound effects you intend.' : state.phase === 'result' ? 'Keep what you discovered. Return to your path whenever you are ready.' : game.tip));
    const progress = make('div', 'english-progress'); progress.setAttribute('aria-label', 'Challenge progress');
    game.rounds.forEach((item, index) => {
      const pip = make('span', state.records[item.id]?.resolved ? 'done' : index === state.round ? 'current' : '', item.exit ? 'E' : String(index + 1));
      pip.title = item.exit ? 'Exit check' : `Challenge ${index + 1}`; progress.append(pip);
    });
    append(caption, progress); aside.append(caption);
    this.workspace = make('section', 'english-workspace');
    this.workspace.setAttribute('aria-label', 'Activity work area');
    if (state.phase === 'tutorial') this.renderTutorial(this.workspace);
    else if (state.phase === 'result') this.renderResult(this.workspace);
    else if (state.phase === 'editor') this.renderEditor(this.workspace);
    else if (state.phase === 'review') this.renderReview(this.workspace);
    else this.renderRound(this.workspace);
    append(main, aside, this.workspace);
    const footer = make('footer', 'english-footer');
    append(footer, this.button('← Back to week', () => this.scene.returnToQuarter(), { key: 'back', className: 'english-back' }));
    const saveLabel = game.kind === 'festival' && ['editor', 'review', 'result'].includes(state.phase)
      ? this.scene.storageAvailable ? 'Draft saved on this device' : 'Device saving unavailable · download your poem'
      : `${englishAccuracy(state).correct}/${englishAccuracy(state).total} independent checkpoints · No timer`;
    append(footer, make('span', 'english-footer-note', saveLabel));
    const actions = make('div', 'english-footer-actions');
    if (state.phase === 'tutorial') actions.append(this.button('Start game', () => this.perform('start'), { key: 'start', className: 'primary' }));
    else if (state.phase === 'playing') append(actions,
      this.button('Hint', () => this.perform('hint'), { key: 'hint' }),
      this.button(round.kind === 'phrase' ? 'Launch phrase' : round.kind === 'timeline' ? 'Play scene' : round.kind === 'thread' ? 'Bind thread' : round.kind === 'echo' ? 'Connect echo' : 'Check evidence', () => this.perform('check'), { key: 'check', className: 'primary' }),
    );
    else if (state.phase === 'round-complete') actions.append(this.button(state.round + 1 === game.rounds.length ? game.kind === 'festival' ? 'Write my poem' : 'See results' : game.rounds[state.round + 1].exit ? 'Try the exit check' : 'Next challenge', () => this.perform('continue'), { key: 'continue', className: 'primary' }));
    else if (state.phase === 'editor') append(actions,
      this.button('Download draft', () => this.downloadPoem(), { key: 'download' }),
      this.button('Review my poem', () => this.perform('review-poem'), { key: 'review', className: 'primary' }),
    );
    else if (state.phase === 'review') append(actions,
      this.button('Keep revising', () => this.perform('edit-poem'), { key: 'revise' }),
      this.button('Save poem', () => this.perform('submit-poem'), { key: 'submit-poem', className: 'primary' }),
    );
    else if (state.phase === 'result') append(actions,
      game.kind === 'festival' ? this.button('Download poem', () => this.downloadPoem(), { key: 'download' }) : null,
      this.button(game.kind === 'festival' ? 'Revise poem' : 'Play again', () => game.kind === 'festival' ? this.perform('edit-poem') : this.scene.restartGame(), { key: 'replay', className: 'primary' }),
    );
    footer.append(actions); append(this.root, header, main, footer);
    const section = ['playing', 'round-complete'].includes(state.phase) ? `round-${state.round}` : state.phase === 'editor' ? `editor-${state.draft.stanza}` : state.phase;
    this.workspace.scrollTop = this.lastSection === section ? priorScroll : 0;
    this.lastSection = section;
    if (focusKey) {
      const target = this.root.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`);
      if (target && !target.disabled) target.focus({ preventScroll: true });
      else if (focusKey.startsWith('pool-')) this.root.querySelector('.english-pool .english-word-token:not(:disabled)')?.focus({ preventScroll: true });
    }
    this.syncBounds(); this.updateAudioStatus();
  }

  renderTutorial(area) {
    const game = this.scene.gameDefinition, round = game.rounds[0];
    append(area, make('h2', '', 'A worked example'), make('p', 'english-intro', game.tutorial));
    const model = make('div', 'english-demo');
    round.words.forEach(word => model.append(make('span', round.targets.includes(word.id) ? 'english-demo-evidence' : '', `${word.label} `)));
    area.append(model);
    append(area,
      this.button('Listen to the example', () => this.scene.playNarration(`english-${round.id}`), { key: 'listen' }),
      make('p', 'english-explanation', round.explanation),
    );
    const steps = make('ol', 'english-tutorial-steps');
    for (const text of game.kind === 'festival' ? ['Inspect three sound patterns.', 'Write twelve original lines in four stanzas.', 'Mark your intentions and save for review.'] : game.kind === 'soundscape' ? ['Choose the words that imitate a sound.', 'Select a chosen word, then tap its event slot.', 'Choose an explanation and play the scene.'] : game.kind === 'airship' ? ['Tap or drag word tiles into sail sockets.', 'Choose a matching opening sound.', 'Explain the sound pattern and launch.'] : game.kind === 'threadworks' ? ['Choose words by their sound evidence.', 'Use S, M or E to mark start, middle or end.', 'Choose the sound and bind your thread.'] : ['Select matching word lanterns.', 'Choose the vowel sound you hear.', 'Explain the echo and connect it.']) steps.append(make('li', '', text));
    area.append(steps);
    append(area, make('p', 'english-muted', 'Practice is unscored. You can replay recordings, use hints, and try again.'));
    if (game.kind === 'festival' && this.scene.state.draft.lines.some(line => line.trim()) && game.rounds.every(round => this.scene.state.records[round.id]?.resolved)) {
      area.append(this.button('Continue saved poem', () => this.perform('resume-poem'), { key: 'resume-poem', className: 'primary' }));
    }
  }

  renderRound(area) {
    const state = this.scene.state, round = this.scene.gameDefinition.rounds[state.round];
    const solved = state.phase === 'round-complete';
    area.append(make('h2', 'english-task-heading', round.prompt));
    const tools = make('div', 'english-listening-tools');
    append(tools,
      this.button('▶ Listen to line', () => this.scene.playNarration(`english-${round.id}`), { key: 'listen', className: 'small' }),
      this.button(state.transcript ? 'Hide transcript' : 'Show transcript', () => this.perform('transcript'), { key: 'transcript', className: 'small', disabled: solved }),
      this.button('Reset board', () => this.perform('reset'), { key: 'reset', className: 'small', disabled: solved }),
    );
    this.audioStatus = make('span', 'english-audio-status'); this.audioStatus.setAttribute('aria-live', 'polite'); tools.append(this.audioStatus); area.append(tools);
    if (round.contrast) tools.append(this.button('Compare rain / said', () => this.scene.playNarration(`english-contrast-${round.contrast}`), { key: 'contrast', className: 'small' }));
    if (state.transcript) area.append(make('blockquote', 'english-transcript', round.line));
    if (round.repair) {
      const repairs = make('div', 'english-repair'); repairs.append(make('span', '', 'Restore the final word:'));
      for (const word of round.repair.choices) repairs.append(this.button(word, () => this.perform('repair', word), { key: `repair-${word}`, className: `small ${state.repair === word ? 'selected' : ''}`, pressed: state.repair === word, disabled: solved }));
      area.append(repairs);
    }
    if (round.kind === 'phrase') this.renderPhrase(area, round, solved);
    else this.renderEvidence(area, round, solved);
    if (round.events) this.renderTimeline(area, round, solved);
    if (round.sound) {
      const sounds = make('fieldset', 'english-sounds'); sounds.append(make('legend', '', 'Which sound connects your words?'));
      for (const id of round.soundOptions) {
        const group = make('div', 'english-sound-option');
        append(group,
          this.button(soundText(id), () => this.perform('sound', id), { key: `sound-${id}`, className: `small ${state.sound === id ? 'selected' : ''}`, pressed: state.sound === id, disabled: solved }),
          this.button('▶', () => this.scene.playNarration(`english-sound-${id}`), { key: `hear-sound-${id}`, className: 'english-audio-button', title: `Listen to ${soundText(id)}` }),
        ); sounds.append(group);
      }
      area.append(sounds);
    }
    const reasons = make('fieldset', 'english-reasons'); reasons.append(make('legend', '', 'Explain your evidence'));
    // Rotate positions so the correct explanation is not always the first tile.
    const order = [...round.reasons]; for (let i = 0; i < state.round % 3; i++) order.push(order.shift());
    for (const reason of order) reasons.append(this.button(reason.text, () => this.perform('reason', reason.id), { key: `reason-${reason.id}`, className: `english-reason ${state.reason === reason.id ? 'selected' : ''}`, pressed: state.reason === reason.id, disabled: solved }));
    area.append(reasons);
    const feedback = make('p', `english-feedback ${state.feedbackKind}`, state.feedback || 'Explore the board, then use the action button below.');
    feedback.setAttribute('role', 'status'); area.append(feedback);
  }

  renderEvidence(area, round, solved) {
    const state = this.scene.state;
    const board = make('div', `english-wordboard ${round.kind === 'echo' ? 'lantern-board' : round.kind === 'thread' ? 'thread-board' : ''}`);
    board.style.setProperty('--word-count', Math.min(round.words.length, 8));
    board.setAttribute('aria-label', round.kind === 'thread' ? 'Words and sound positions' : 'Evidence words');
    if (['echo', 'thread'].includes(round.kind)) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 1000 100'); svg.setAttribute('preserveAspectRatio', 'none'); svg.classList.add('english-sound-thread'); svg.setAttribute('aria-hidden', 'true');
      const points = state.selected.map(id => round.words.findIndex(word => word.id === id)).sort((a, b) => a - b).map(index => `${(index + 0.5) * 1000 / round.words.length},${round.kind === 'echo' ? 48 : 72}`).join(' ');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline'); path.setAttribute('points', points); svg.append(path); board.append(svg);
    }
    round.words.forEach((word, index) => {
      const chosen = state.selected.includes(word.id);
      const item = make('div', `english-word-item ${chosen ? 'chosen' : ''}`);
      let label = word.label;
      if (round.repair?.index === index) label = state.repair ?? '___';
      if (round.kind === 'echo') { const lamp = make('img', 'english-lantern'); lamp.src = '/assets/english-week1/word-lantern.png'; lamp.alt = ''; item.append(lamp); }
      const tile = this.button(label, () => this.perform(round.kind === 'timeline' && chosen ? 'activate' : 'select', word.id), { key: `word-${word.id}`, className: 'english-word-token', pressed: chosen, disabled: solved || round.repair?.index === index && !state.repair });
      tile.dataset.wordId = word.id;
      this.makeDraggable(tile, { id: word.id, label, type: 'evidence' }, solved);
      item.append(tile);
      if (round.kind === 'timeline' && chosen) item.append(this.button('×', () => this.perform('select', word.id), { key: `unselect-${word.id}`, className: 'english-word-audio', disabled: solved, title: `Remove ${label} from the evidence` }));
      const audio = this.button('▶', () => this.scene.playNarration(englishWordAudioKey(label)), { key: `hear-${word.id}`, className: 'english-word-audio', title: `Hear ${label}` });
      audio.setAttribute('aria-label', `Hear ${label}`); audio.disabled = label === '___'; item.append(audio);
      if (round.position) {
        const anchors = make('div', 'english-anchors');
        for (const [position, initial] of [['start', 'S'], ['middle', 'M'], ['end', 'E']]) {
          const active = chosen && state.positions[word.id] === position;
          const anchor = this.button(initial, () => this.perform('anchor', { id: word.id, position }), { key: `anchor-${word.id}-${position}`, className: active ? 'selected' : '', pressed: active, disabled: solved || label === '___', title: `${label}: sound at the ${position}` });
          anchor.setAttribute('aria-label', `${label}: sound at the ${position}`); anchor.dataset.wordId = word.id; anchor.dataset.position = position; anchors.append(anchor);
        }
        item.append(anchors);
      }
      board.append(item);
    });
    area.append(board);
    if (round.position) area.append(make('p', 'english-position-key', 'S = start · M = middle · E = end of the word sound'));
  }

  renderTimeline(area, round, solved) {
    const state = this.scene.state;
    const active = round.words.find(word => word.id === state.activeWord);
    area.append(make('p', 'english-position-key', active && state.selected.includes(active.id) ? `Ready to place: ${active.label} · tap an event below. Tap × to remove evidence.` : 'Choose a sound word, then tap its event below.'));
    const timeline = make('div', 'english-timeline');
    round.events.forEach((event, index) => {
      const selected = round.words.find(word => word.id === state.mappings[event.id]);
      const slot = this.button(`${index + 1}. ${event.label}\n${selected?.label ?? 'Choose a word, then tap here'}`, () => {
        if (state.activeWord) this.perform('assign', { event: event.id, word: state.activeWord });
      }, { key: `event-${event.id}`, className: `english-event-slot ${selected ? 'filled' : ''}`, disabled: solved });
      slot.dataset.eventId = event.id; slot.dataset.dropEvent = event.id;
      timeline.append(slot);
    }); area.append(timeline);
  }

  renderPhrase(area, round, solved) {
    const state = this.scene.state;
    const sails = make('div', 'english-sail-row'); sails.setAttribute('aria-label', 'Sail phrase sockets');
    state.slots.forEach((word, index) => {
      const fixed = round.fixed?.[index] !== undefined;
      const slot = this.button(word ?? `${index + 1}. Place word`, () => this.perform('remove', index), { key: `slot-${index}`, className: `english-sail-slot ${word ? 'filled' : ''} ${fixed ? 'fixed' : ''}`, disabled: solved || fixed, title: fixed ? 'Given word' : 'Tap to remove, or drag a different word here' });
      slot.dataset.slotIndex = index; if (!fixed) slot.dataset.dropSlot = index;
      sails.append(slot);
    }); area.append(sails);
    const pool = make('div', 'english-pool'); pool.setAttribute('aria-label', 'Word supplies');
    round.pool.forEach(word => {
      const group = make('div', 'english-pool-item');
      const tile = this.button(word, () => {
        const index = state.slots.findIndex((value, slot) => value === null && round.fixed?.[slot] === undefined);
        if (index >= 0) this.perform('place', { index, word });
      }, { key: `pool-${word}`, className: 'english-word-token', disabled: solved || state.slots.includes(word) });
      tile.dataset.poolWord = word; this.makeDraggable(tile, { type: 'phrase', word, label: word }, solved || state.slots.includes(word));
      const play = this.button('▶', () => this.scene.playNarration(englishWordAudioKey(word)), { key: `hear-pool-${word}`, className: 'english-word-audio', title: `Hear ${word}` });
      play.setAttribute('aria-label', `Hear ${word}`); append(group, tile, play); pool.append(group);
    }); area.append(pool);
  }

  renderEditor(area) {
    const draft = this.scene.state.draft;
    append(area, make('h2', '', 'Write a poem for the lantern festival'));
    const themeLabel = make('label', 'english-theme-label', 'Your theme ');
    const themes = make('select'); themes.setAttribute('aria-label', 'Poem theme'); themes.dataset.focusKey = 'poem-theme';
    for (const value of ['A garden morning', 'A library journey', 'A rainy afternoon']) { const option = make('option', '', value); option.value = value; themes.append(option); }
    themes.value = draft.theme; themes.addEventListener('change', () => this.perform('poem-theme', themes.value)); append(themeLabel, themes); area.append(themeLabel);
    const tabs = make('div', 'english-stanza-tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Poem stanzas');
    for (let stanza = 0; stanza < 4; stanza++) {
      const tab = this.button(`Stanza ${stanza + 1}`, () => { this.lastSelection = null; this.perform('poem-stanza', stanza); }, { key: `stanza-${stanza}`, className: draft.stanza === stanza ? 'selected' : '' });
      tab.setAttribute('role', 'tab'); tab.setAttribute('aria-selected', String(draft.stanza === stanza)); tabs.append(tab);
    } area.append(tabs);
    const lines = make('div', 'english-poem-lines');
    for (let offset = 0; offset < 3; offset++) {
      const index = draft.stanza * 3 + offset;
      const label = make('label', 'english-line-field');
      const title = make('span', '', `Line ${index + 1}`); const count = make('span', 'english-character-count', `${draft.lines[index].length}/120`); append(title, count);
      const input = make('input'); input.type = 'text'; input.maxLength = 120; input.value = draft.lines[index]; input.autocomplete = 'off';
      input.setAttribute('aria-label', `Poem line ${index + 1}`); input.dataset.focusKey = `poem-line-${index}`;
      input.placeholder = ['What can you see or hear?', 'Let the scene grow...', 'Try a sound effect.'][offset];
      const remember = () => {
        if (input.selectionEnd > input.selectionStart) this.lastSelection = { line: index, start: input.selectionStart, end: input.selectionEnd };
      };
      input.addEventListener('select', remember); input.addEventListener('mouseup', remember); input.addEventListener('keyup', remember);
      input.addEventListener('input', () => {
        this.perform('poem-line', { index, text: input.value }, { render: false });
        count.textContent = `${input.value.length}/120`; this.renderAnnotations(); this.updateEditorStatus();
      });
      append(label, title, input); lines.append(label);
    } area.append(lines);
    const marking = make('div', 'english-annotation-tools');
    marking.append(make('p', '', 'Select words in a line, then mark your intended sound effect:'));
    for (const device of ENGLISH_DEVICES) marking.append(this.button(device, () => {
      this.perform('annotate', { ...this.lastSelection, device });
    }, { key: `mark-${device}`, className: 'small' }));
    area.append(marking);
    this.annotationList = make('div', 'english-annotation-list'); area.append(this.annotationList); this.renderAnnotations();
    const noteLabel = make('label', 'english-writer-note', 'Explain one sound effect and why it fits your poem');
    const note = make('textarea'); note.maxLength = 600; note.rows = 2; note.value = draft.note;
    note.setAttribute('aria-label', 'Writer note'); note.dataset.focusKey = 'writer-note'; note.placeholder = 'I used ... to help the reader hear ...';
    note.addEventListener('input', () => { this.perform('poem-note', note.value, { render: false }); this.updateEditorStatus(); });
    append(noteLabel, note); area.append(noteLabel);
    const status = make('p', 'english-feedback info', this.scene.state.feedback || 'Your labels show what you intend. A teacher will review the effects.'); status.dataset.editorFeedback = 'true'; status.setAttribute('role', 'status'); area.append(status);
    append(area, make('p', 'english-muted', 'Optional sound bank: buzz · rain · silver · sails · moon · room · boat · net. Your lines stay your own.'));
  }

  renderAnnotations() {
    if (!this.annotationList) return;
    this.annotationList.replaceChildren();
    const draft = this.scene.state.draft;
    if (!draft.annotations.length) this.annotationList.append(make('p', 'english-muted', 'No sound-effect intentions marked yet.'));
    draft.annotations.forEach((annotation, index) => {
      const placed = annotationIsPlaced(draft, annotation);
      const row = make('div', `english-annotation ${placed ? '' : 'unplaced'}`);
      append(row, make('span', '', `${annotation.device}: “${annotation.quote}” · line ${annotation.line + 1}${placed ? '' : ' · UNPLACED after edit'}`),
        this.button('Remove', () => this.perform('remove-annotation', index), { key: `remove-annotation-${index}`, className: 'small' }));
      this.annotationList.append(row);
    });
  }

  updateEditorStatus() {
    const node = this.root.querySelector('[data-editor-feedback]');
    if (node) node.textContent = this.scene.state.feedback || 'Draft updated. Review your annotations after changing a marked line.';
    const save = this.root.querySelector('.english-footer-note');
    if (save) save.textContent = this.scene.storageAvailable ? 'Draft saved on this device' : 'Device saving unavailable · download your poem';
  }

  renderReview(area) {
    const draft = this.scene.state.draft;
    append(area, make('h2', '', 'Read your poem before saving'), make('p', 'english-intro', draft.theme));
    this.renderManuscript(area, draft);
    const intention = make('div', 'english-intentions');
    append(intention, make('h3', '', 'Your intended effects'));
    for (const annotation of draft.annotations) intention.append(make('p', '', `${annotation.device} · line ${annotation.line + 1}: “${annotation.quote}”`));
    append(intention, make('p', '', draft.note)); area.append(intention);
    append(area, make('p', 'english-feedback info', 'Structure is complete. Your device labels and poem quality still need teacher review.'));
  }

  renderManuscript(area, draft) {
    const manuscript = make('article', 'english-manuscript'); manuscript.setAttribute('aria-label', 'Your poem manuscript');
    for (let stanza = 0; stanza < 4; stanza++) {
      const group = make('p', 'english-manuscript-stanza');
      draft.lines.slice(stanza * 3, stanza * 3 + 3).forEach(line => { const span = make('span', '', line || '[unwritten line]'); group.append(span); });
      manuscript.append(group);
    } area.append(manuscript);
  }

  renderResult(area) {
    const state = this.scene.state, game = this.scene.gameDefinition;
    const accuracy = englishAccuracy(state);
    append(area, make('h2', '', game.kind === 'festival' ? 'Poem submitted' : 'A little more of Reading Island restored'),
      make('p', 'english-result-line', `${accuracy.correct} of ${accuracy.total} independent checkpoints`),
      make('p', '', state.assistance.length ? `Support used: ${state.assistance.join(', ')}. You completed the work with support.` : accuracy.correct === accuracy.total ? 'You resolved the challenges independently on your first checks.' : 'You resolved the challenges after revising some answers.'),
    );
    if (game.kind === 'festival') {
      append(area, make('p', 'english-review-pending', 'Teacher review pending'), make('p', '', 'The poem and your intended sound effects are saved. Structure and completion were checked; literary quality was not automatically graded.'));
      const lights = make('div', 'english-festival-lights');
      for (let stanza = 0; stanza < 4; stanza++) {
        const figure = make('figure'); const lamp = make('img'); lamp.src = '/assets/english-week1/word-lantern.png'; lamp.alt = '';
        append(figure, lamp, make('figcaption', '', `Stanza ${stanza + 1}`)); lights.append(figure);
      }
      area.append(lights);
      this.renderManuscript(area, state.draft);
    } else append(area, make('p', 'english-explanation', game.tip), make('p', '', 'Completion is saved on this device. Revisit any day to explore it again.'));
    if (!this.scene.storageAvailable) area.append(make('p', 'english-feedback retry', 'Device saving is unavailable. Keep this page open or download your poem before leaving.'));
  }

  updateAudioStatus() {
    if (this.audioStatus) this.audioStatus.textContent = this.scene.audioStatus === 'playing' ? 'Playing recording…' : this.scene.audioStatus === 'paused' ? 'Recording paused' : this.scene.audioStatus === 'ready' ? 'Replay as often as you like' : this.scene.audioStatus;
  }

  openDialog(name, title, build) {
    if (this.scene.modal) return;
    this.scene.pauseNarration(); this.cancelDrag();
    const dialog = make('dialog', 'english-dialog'); dialog.dataset.modal = name; dialog.setAttribute('aria-label', title);
    dialog.append(make('h2', '', title)); build(dialog);
    this.scene.modal = dialog; this.scene.currentModal = dialog;
    const close = () => { dialog.close(); };
    dialog.append(this.button('Resume game', close, { key: 'modal-resume', className: 'primary' }));
    dialog.addEventListener('close', () => {
      dialog.remove(); this.scene.modal = null; this.scene.currentModal = null;
      this.scene.resumeNarration(); this.scene.updateTestState();
    });
    document.body.append(dialog); dialog.showModal(); this.scene.updateTestState();
  }

  openHelp() {
    this.openDialog('english-help', 'How to play', dialog => {
      append(dialog, make('p', '', this.scene.gameDefinition.tutorial), make('p', 'english-explanation', this.scene.gameDefinition.tip));
      if (this.scene.state.phase === 'playing') {
        append(dialog, make('p', '', 'Tap words and destinations, or drag a word onto an event or sail. Replay buttons let you hear each word. In Threadworks, S/M/E mark start, middle and end.'),
          this.button('Inspect a worked example', () => {
            dialog.addEventListener('close', () => this.scene.perform('solution'), { once: true });
            dialog.close();
          }, { key: 'worked-example' }));
      }
      if (this.scene.gameDefinition.kind === 'festival') dialog.append(make('p', '', 'In the editor, select a few words inside a line, then choose their intended device. Edited annotations may need to be attached again. Your poem is saved for human review.'));
    });
  }

  openPause() { this.openDialog('english-pause', 'Take a breath', dialog => dialog.append(make('p', '', 'Your work stays here. The recording is paused, and there is no countdown.'))); }

  openSettings() {
    this.openDialog('english-settings', 'Settings', dialog => {
      for (const [key, label] of [['musicEnabled', 'Music'], ['sfxEnabled', 'Sound effects'], ['englishNarrationEnabled', 'Narration']]) {
        const row = make('label', 'english-setting-row', label); const input = make('input'); input.type = 'checkbox'; input.checked = Boolean(this.scene.registry.get(key)); input.setAttribute('aria-label', label);
        input.addEventListener('change', () => {
          this.scene.registry.set(key, input.checked);
          if (key === 'musicEnabled') playAreaMusic(this.scene, this.scene.islandId);
          if (key === 'englishNarrationEnabled') { this.scene.stopNarration(); this.scene.audioStatus = input.checked ? 'ready' : 'Narration is off in Settings.'; }
          this.scene.updateTestState();
        }); append(row, input); dialog.append(row);
      }
    });
  }

  downloadPoem() {
    const blob = new Blob([buildPoemReport(this.scene.state)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = make('a'); link.href = url; link.download = 'lumora-poetry-lantern-festival.txt';
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  makeDraggable(node, payload, disabled) {
    if (disabled) return;
    node.addEventListener('pointerdown', event => {
      if (event.button !== 0 || this.scene.modal) return;
      this.drag = { ...payload, x: event.clientX, y: event.clientY, pointerId: event.pointerId, moving: false };
    });
  }

  moveDrag(event) {
    if (!this.drag || this.drag.pointerId !== event.pointerId) return;
    if (!this.drag.moving && Math.hypot(event.clientX - this.drag.x, event.clientY - this.drag.y) < 9) return;
    this.drag.moving = true;
    if (!this.ghost) {
      this.ghost = make('div', 'english-drag-ghost', this.drag.label); document.body.append(this.ghost); this.root.classList.add('dragging');
    }
    this.ghost.style.left = `${event.clientX + 12}px`; this.ghost.style.top = `${event.clientY + 12}px`;
  }

  finishDrag(event) {
    if (!this.drag || this.drag.pointerId !== event.pointerId) return;
    const drag = this.drag;
    if (drag.moving) {
      this.suppressClickUntil = performance.now() + 300;
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const slot = target?.closest('[data-drop-slot]'); const activity = target?.closest('[data-drop-event]');
      if (drag.type === 'phrase' && slot) this.perform('place', { index: Number(slot.dataset.dropSlot), word: drag.word });
      if (drag.type === 'evidence' && activity) {
        if (!this.scene.state.selected.includes(drag.id)) this.perform('select', drag.id);
        this.perform('assign', { event: activity.dataset.dropEvent, word: drag.id });
      }
    }
    this.cancelDrag();
  }

  cancelDrag() { this.drag = null; this.ghost?.remove(); this.ghost = null; this.root?.classList.remove('dragging'); }

  syncBounds() {
    const box = this.scene.game.canvas.getBoundingClientRect();
    // Below this width, scaling the 1280px workbench would shrink task text
    // and sound-position controls too far. Use native-sized controls instead.
    const compact = box.width < 1100;
    this.root.classList.toggle('compact', compact);
    Object.assign(this.root.style, compact
      ? { left: '0', top: '0', width: `${window.innerWidth}px`, height: `${window.innerHeight}px`, transform: 'none' }
      : { left: `${box.left}px`, top: `${box.top}px`, width: '1280px', height: '720px', transform: `scale(${box.width / 1280},${box.height / 720})` });
  }

  destroy() {
    this.scene.modal?.remove(); this.scene.modal = null;
    document.removeEventListener('pointermove', this.onMove); document.removeEventListener('pointerup', this.onUp); document.removeEventListener('pointercancel', this.onCancel);
    this.cancelDrag(); this.overlay.remove();
  }
}
