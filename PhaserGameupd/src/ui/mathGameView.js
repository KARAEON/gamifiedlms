import { EnglishGameView } from './englishGameView.js';
import { MATH_UNITS } from '../config/mathWeekOne.js';
import { mathAccuracy, workedSolution } from '../games/math/mathLogic.js';
import { parseFraction, mixedLabel, fraction, add, subtract, partCount } from '../games/math/fractions.js';
import { playAreaMusic } from '../systems/music.js';
import './mathGames.css';

const make = (tag, className = '', text = '') => { const node = document.createElement(tag); node.className = className; node.textContent = text; return node; };
const append = (node, ...children) => { node.append(...children.filter(Boolean)); return node; };
const svgNode = (name, attrs) => { const node = document.createElementNS('http://www.w3.org/2000/svg', name); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value); return node; };
const TILE_COLORS = ['#ba762e', '#287e7d'];
const ROUTE_POINTS = { camp: [19, 76], A: [17, 38], B: [50, 17], C: [83, 38], D: [73, 76] };

export class MathGameView extends EnglishGameView {
  constructor(scene) {
    super(scene); this.root.classList.add('math-root');
    this.root.style.setProperty('--english-backdrop', `url('/assets/math-week1/${scene.gameDefinition.backdrop}.png')`);
  }
  render(actionType) {
    const focus = this.root.contains(document.activeElement) ? document.activeElement.dataset.focusKey : null;
    const scroll = this.workspace?.scrollTop ?? 0;
    const panelScroll = Array.from(this.root.querySelectorAll('.math-panel-visual'), panel => panel.scrollLeft);
    const game = this.scene.gameDefinition, state = this.scene.state, round = game.rounds[state.round];
    this.root.replaceChildren(); this.root.dataset.phase = state.phase; this.root.dataset.kind = game.kind;
    const header = make('header', 'english-header');
    append(header, append(make('div', 'english-heading'), make('h1', '', game.title), make('p', '', `Day ${game.day} · ${game.subtitle}`)),
      append(make('nav', 'english-navigation'), this.button('Help', () => this.openHelp(), { key: 'help' }), this.button('Pause', () => this.openPause(), { key: 'pause' }), this.button('Settings', () => this.openSettings(), { key: 'settings' })));
    const aside = make('aside', 'english-aside'), caption = make('div', 'english-field-note');
    append(caption, make('h2', '', state.phase === 'tutorial' ? 'Your Numeric Ruins mission' : state.phase === 'result' ? 'A journey in equal parts' : round.exit ? 'Exit check' : `Challenge ${state.round + 1} of 3`), make('p', '', game.tip));
    const progress = make('div', 'english-progress'); progress.setAttribute('aria-label', 'Challenge progress');
    game.rounds.forEach((r, i) => progress.append(make('span', state.records[r.id]?.resolved ? 'done' : i === state.round ? 'current' : '', r.exit ? 'E' : String(i + 1))));
    caption.append(progress); aside.append(caption);
    this.workspace = make('section', 'english-workspace'); this.workspace.setAttribute('aria-label', 'Fraction workbench');
    if (state.phase === 'tutorial') this.renderTutorial(this.workspace);
    else if (state.phase === 'result') this.renderResult(this.workspace);
    else this.renderRound(this.workspace, round, actionType === 'trial');
    const footer = make('footer', 'english-footer'), actions = make('div', 'english-footer-actions');
    const checkpoints = game.rounds.reduce((count, round) => count + round.checkpoints.length, 0);
    append(footer, this.button('← Back to week', () => this.scene.returnToQuarter(), { key: 'back' }), make('span', 'english-footer-note', `${mathAccuracy(state).correct}/${checkpoints} independent checkpoints · No timer`));
    if (state.phase === 'tutorial') actions.append(this.button('Start game', () => this.perform('start'), { key: 'start', className: 'primary' }));
    if (state.phase === 'playing') append(actions, this.button('Hint', () => this.perform('hint'), { key: 'hint' }), this.button('Check model', () => this.perform('check'), { key: 'check', className: 'primary' }));
    if (state.phase === 'round-complete') actions.append(this.button(state.round === 3 ? 'See results' : state.round === 2 ? 'Try the exit check' : 'Next challenge', () => this.perform('continue'), { key: 'continue', className: 'primary' }));
    if (state.phase === 'result') actions.append(this.button('Play again', () => this.scene.restartGame(), { key: 'replay', className: 'primary' }));
    footer.append(actions); append(this.root, header, append(make('div', 'english-main'), aside, this.workspace), footer);
    const section = ['playing', 'round-complete'].includes(state.phase) ? `round-${state.round}` : state.phase;
    if (this.lastSection === section) this.root.querySelectorAll('.math-panel-visual').forEach((panel, i) => { panel.scrollLeft = panelScroll[i] ?? 0; });
    this.workspace.scrollTop = this.lastSection === section ? scroll : 0; this.lastSection = section;
    if (focus) this.root.querySelector(`[data-focus-key="${CSS.escape(focus)}"]`)?.focus({ preventScroll: true });
    this.syncBounds();
  }
  renderTutorial(area) {
    const game = this.scene.gameDefinition;
    append(area, make('h2', '', 'A worked example'), make('p', 'english-explanation', game.tutorial));
    const example = make('div', 'math-worked-model');
    if (game.kind === 'bridge') example.append(this.strip(6, [1, 2], 'Example: 1/6 + 2/6 = 3/6 of one whole'));
    else if (game.kind === 'mosaic') append(example,
      this.strip(6, [3, 0], 'First fixed area: 1/2 = 3/6'),
      this.strip(6, [0, 2], 'Second fixed area: 1/3 = 2/6'),
      this.strip(6, [3, 2], 'Join the shared tiles: 3/6 + 2/6 = 5/6'));
    else if (game.kind === 'depot') append(example,
      this.strip(4, [12, 5], 'Before trade: 3 whole crates + 5/4 parcels = 17/4'),
      this.strip(4, [16, 1], 'After trading 4 quarters for a whole: 4 whole crates + 1/4. Value still 17/4.'));
    else if (game.kind === 'reservoir') append(example,
      this.strip(4, [8, 1], 'Starting water: 2 whole L + 1/4 L = 2 1/4 L', { water: true }),
      this.strip(4, [4, 5], 'Exchange 1 L: 1 whole L + 5/4 L. Total stays 2 1/4 L.', { water: true }),
      this.strip(4, [4, 2], 'After delivering 3/4 L: 1 whole L + 2/4 L remain.', { water: true }));
    else example.append(this.strip(4, [2, 1], 'Join rope: 1/2 m + 1/4 m = 3/4 m. Every full rail is 1 metre.'));
    area.append(example);
    const list = make('ol', 'english-tutorial-steps'); game.steps.forEach(step => list.append(make('li', '', step)));
    append(area, list, make('p', 'english-muted', 'Tap or use the keyboard. Dragging is optional. Practice is unscored; hints and worked examples are recorded as support.'));
  }
  renderRound(area, round, animateTrial) {
    const state = this.scene.state, board = state.board, solved = state.phase === 'round-complete';
    append(area, make('h2', 'english-task-heading', round.prompt));
    const tools = make('div', 'math-toolbar');
    append(tools, this.button('Undo', () => this.perform('undo'), { key: 'undo', className: 'small', disabled: solved || !state.history.length }), this.button('Reset model', () => this.perform('reset'), { key: 'reset', className: 'small', disabled: solved }), make('span', 'math-round-label', round.exit ? 'Exit check' : `Challenge ${state.round + 1} of 3`));
    area.append(tools);
    if (round.kind === 'bridge') this.renderBridge(area, round);
    else if (round.kind === 'mosaic') this.renderMosaic(area, round);
    else if (round.kind === 'depot') this.renderDepot(area, round);
    else if (round.kind === 'reservoir') this.renderReservoir(area, round);
    else if (round.kind === 'route') this.renderRoute(area, round, animateTrial);
    else this.renderCaravan(area, round);
    const answer = make('div', 'math-answer-row');
    append(answer, this.input(round.kind === 'route' ? 'Water left' : round.kind === 'reservoir' ? 'Water left' : 'Your answer', 'answer', board.answer, { placeholder: 'e.g. 1 1/2', disabled: solved }), round.unit ? this.choiceSelect('Measured unit', board.unit, [['', 'Choose unit'], ['m', 'metres (m)'], ['L', 'litres (L)']], value => this.perform('unit', value), 'unit', solved) : null);
    append(area, answer, make('p', 'english-muted', 'Equivalent fractions and improper fractions are accepted. Write mixed numbers with a space: 1 1/2.'));
    if (round.explanations) {
      const choices = make('fieldset', 'math-explanation-choices'); choices.append(make('legend', '', 'Which statement accounts for all the rope?'));
      round.explanations.forEach(option => choices.append(this.button(option.text, () => this.perform('explanation', option.id), { key: `explanation-${option.id}`, pressed: board.explanation === option.id, disabled: solved })));
      area.append(choices);
    }
    const feedback = make('div', `english-feedback ${state.feedbackKind}`, state.feedback || state.notice || 'Explore the model. Submit when you are ready.');
    feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite'); area.append(feedback);
    if (solved) area.append(make('p', 'math-complete-note', round.kind === 'bridge' ? 'Bridge section secured. The original unit stayed the same.' : round.kind === 'depot' ? 'Load secured. Whole crates and loose parcels balance.' : round.kind === 'reservoir' ? 'Delivery complete. Every part of the starting water is accounted for.' : round.kind === 'route' ? 'Caravan supplied. Your chosen route protects the reserve.' : 'Work checked. Your model preserves the original quantities.'));
  }
  input(label, field, value, { placeholder = '', index, disabled = false, numeric = false, onInput } = {}) {
    const wrapper = make('label', 'math-input-label', label), input = make('input');
    input.type = 'text'; input.inputMode = numeric ? 'numeric' : 'text'; input.value = value; input.placeholder = placeholder; input.maxLength = numeric ? 3 : 35; input.disabled = disabled;
    input.setAttribute('aria-label', label); input.dataset.focusKey = `input-${field}${index ?? ''}`;
    input.addEventListener('input', () => {
      this.perform('input', { field, text: input.value, index }, { render: false });
      onInput?.(input.value);
    });
    wrapper.append(input); return wrapper;
  }
  choiceSelect(label, selected, options, action, key, disabled = false) {
    const wrapper = make('label', 'math-select-label', label), select = make('select');
    select.setAttribute('aria-label', label); select.dataset.focusKey = key; select.disabled = disabled;
    for (const [value, text] of options) { const option = make('option', '', text); option.value = value; select.append(option); }
    select.value = String(selected); select.addEventListener('change', () => action(select.value)); wrapper.append(select); return wrapper;
  }
  unitSelect(area, label = 'Equal parts in one whole', options = MATH_UNITS) {
    const state = this.scene.state;
    area.append(this.choiceSelect(label, state.board.d, [[0, 'Choose a unit'], ...options.map(d => [d, `${d} parts · each 1/${d}`])], value => this.perform('denominator', value), 'denominator', state.phase !== 'playing'));
  }
  strip(d, counts, label, { water = false, wholesPerRow = 1, unitLabel = 'whole' } = {}) {
    const wrap = make('figure', 'math-strip'); wrap.setAttribute('aria-label', label); wrap.append(make('figcaption', '', label));
    if (!d) { wrap.append(make('p', 'english-muted', 'Choose a shared unit to reveal the parts.')); return wrap; }
    const rowParts = d * wholesPerRow;
    const total = counts.reduce((a, b) => a + b, 0), rows = Math.max(1, Math.ceil(total / rowParts));
    const svg = svgNode('svg', { viewBox: `0 0 600 ${rows * 32 + 18}`, role: 'img', 'aria-label': label, class: `math-rail${water ? ' water' : ''}` });
    for (let row = 0; row < rows; row++) {
      for (let part = 0; part < rowParts; part++) {
        const i = row * rowParts + part, fill = i < total ? TILE_COLORS[water || i >= counts[0] ? 1 : 0] : '#f6edcf';
        svg.append(svgNode('rect', { x: part * 596 / rowParts + 2, y: row * 32 + 2, width: 596 / rowParts, height: 26, fill, stroke: '#695c40', 'stroke-width': 1, class: i < total ? 'filled' : '' }));
      }
      if (wholesPerRow > 1) for (let whole = 0; whole <= wholesPerRow; whole++) svg.append(svgNode('line', { x1: 2 + whole * 596 / wholesPerRow, x2: 2 + whole * 596 / wholesPerRow, y1: row * 32 + 1, y2: row * 32 + 29, stroke: '#332b21', 'stroke-width': 2.5 }));
    }
    const zero = svgNode('text', { x: 2, y: rows * 32 + 13 }), end = svgNode('text', { x: 598, y: rows * 32 + 13, 'text-anchor': 'end' });
    zero.textContent = '0'; const wholeCount = rows * wholesPerRow; end.textContent = `${wholeCount} ${unitLabel}${unitLabel === 'whole' && wholeCount > 1 ? 's' : ''}`; svg.append(zero, end); wrap.append(svg); return wrap;
  }
  renderBridge(area, round) {
    const { board, phase } = this.scene.state, solved = phase !== 'playing';
    this.unitSelect(area, 'Choose the original piece size', [...new Set([round.d, round.d * 2, round.d + round.d])]);
    const supplies = make('div', 'math-supplies');
    ['Ochre', 'Teal'].forEach((name, source) => {
      const group = make('div', 'math-supply');
      const button = this.button(`Add ${name.toLowerCase()} 1/${board.d || round.d}`, () => this.perform('bridge-piece', { source }), { key: `piece-${source}`, className: `math-piece source-${source}`, disabled: solved || board.counts[source] >= round.counts[source] + (round.extras ? 2 : 0) });
      this.makeDraggable(button, { type: 'bridge', source, label: `${name} 1/${board.d}` }, solved);
      append(group, make('p', '', `${name} order: ${round.counts[source]}/${round.d}`), button,
        !round.extras ? this.button('Place whole tray', () => this.perform('bridge-tray', source), { key: `tray-${source}`, className: 'small', disabled: solved || board.counts[source] === round.counts[source] }) : null,
        this.button('Remove one', () => this.perform('bridge-piece', { source, delta: -1 }), { key: `remove-${source}`, className: 'small', disabled: solved || !board.counts[source] }), make('span', '', `${board.counts[source]} placed / ${round.counts[source] + (round.extras ? 2 : 0)} supplied`)); supplies.append(group);
    }); area.append(supplies);
    const rail = make('div', 'math-bridge-drop'); rail.dataset.mathDrop = 'bridge';
    // Use the original whole's width; a wrong denominator cannot stretch it.
    if (solved) {
      const crossing = make('div', 'math-crossing'); crossing.style.setProperty('--crossing-end', `${(board.counts[0] + board.counts[1]) / board.d * 100}%`);
      const quill = make('img'); quill.src = '/assets/characters/quill/quill-default.png'; quill.alt = 'Quill crosses the completed bridge section'; crossing.append(quill); rail.append(crossing);
    }
    rail.append(this.strip(board.d, board.counts, `Work rail: ${board.counts[0]} ochre + ${board.counts[1]} teal. Original whole = ${round.d} original pieces.`)); area.append(rail);
    area.append(this.choiceSelect('Which size stays unchanged?', board.unchanged, [['', 'Choose a piece size'], [round.d, `1/${round.d} of the original whole`], [round.d * 2, `1/${round.d * 2} of the original whole`]], value => this.perform('unchanged', value), 'unchanged', solved));
  }
  renderMosaic(area, round) {
    const { board, phase } = this.scene.state, solved = phase !== 'playing';
    this.unitSelect(area);
    area.append(this.button(board.zoom ? 'Fit panels' : 'Zoom panels', () => this.perform('zoom'), { key: 'zoom', className: 'small', disabled: solved }));
    if (board.d) area.append(make('p', 'english-muted', 'Move each tile handle to match the shaded area, or enter a tile count. Then transfer both groups.'));
    const panels = make('div', `math-mosaic-panels${board.zoom ? ' zoomed' : ''}`);
    const preview = make('div', 'math-mosaic-preview');
    [round.a, round.b].forEach((amount, index) => {
      const value = parseFraction(amount), panel = make('div', 'math-mosaic-panel');
      panel.append(make('p', '', `Panel ${index + 1}: ${amount} of one whole`));
      const svg = svgNode('svg', { viewBox: '0 0 300 55', role: 'img', 'aria-label': `${amount} of an equal-sized whole. Shaded area stays fixed.` });
      svg.append(svgNode('rect', { x: 1, y: 1, width: 298, height: 50, fill: '#f6edcf', stroke: '#695c40' }), svgNode('rect', { x: 1, y: 1, width: 298 * value.n / value.d, height: 50, fill: TILE_COLORS[index] }));
      const grid = board.d || value.d;
      for (let i = 1; i < grid; i++) svg.append(svgNode('line', { x1: 1 + 298 * i / grid, x2: 1 + 298 * i / grid, y1: 1, y2: 51, stroke: '#695c40', 'stroke-width': 1 }));
      const ruler = append(make('div', 'math-panel-ruler'), svg);
      const removing = round.op === '-' && index === 1;
      const transferLabel = removing ? 'Mark tiles to remove' : 'Transfer tiles';
      const transfer = this.button(board.transferred[index] ? `${removing ? 'Removal' : 'Tile'} group placed` : transferLabel, () => this.perform('transfer', index), { key: `transfer-${index}`, className: 'small', disabled: solved || !board.d, pressed: board.transferred[index] });
      const picker = make('input', 'math-tile-picker');
      const setPicker = value => {
        const count = /^\d+$/.test(value) ? Math.min(Number(value), grid) : 0;
        picker.value = count;
        ruler.style.setProperty('--selected', `${count / grid * 100}%`);
        picker.setAttribute('aria-valuetext', `${count} of ${grid} tiles`);
      };
      const numerator = this.input(`Panel ${index + 1} numerator / ${board.d || '?'}`, 'equivalent', board.equivalents[index], {
        index, numeric: true, disabled: solved,
        onInput: value => {
          setPicker(value);
          transfer.textContent = transferLabel;
          transfer.setAttribute('aria-pressed', 'false');
          this.renderMosaicPreview(preview, round);
        },
      });
      if (board.d) {
        picker.type = 'range'; picker.min = '0'; picker.max = String(board.d); picker.disabled = solved;
        picker.dataset.focusKey = `tile-picker-${index}`;
        picker.setAttribute('aria-label', `Select tiles on panel ${index + 1}`);
        ruler.style.setProperty('--tile-color', TILE_COLORS[index]);
        setPicker(board.equivalents[index]);
        picker.addEventListener('input', () => {
          setPicker(picker.value);
          numerator.querySelector('input').value = picker.value;
        });
        picker.addEventListener('change', () => this.perform('select-tiles', { index, count: picker.valueAsNumber }));
        ruler.append(picker);
      }
      append(panel, append(make('div', 'math-panel-visual'), ruler), numerator, transfer);
      panels.append(panel);
    });
    this.renderMosaicPreview(preview, round);
    append(area, panels, preview);
  }
  renderMosaicPreview(preview, round) {
    const { board } = this.scene.state;
    const nums = board.equivalents.map((v, i) => board.transferred[i] && /^\d+$/.test(v) ? Number(v) : 0);
    // A proposed numerator is explicitly distinct from the fixed original area.
    const remaining = round.op === '+' ? nums[0] + nums[1] : Math.max(0, nums[0] - nums[1]);
    const label = round.op === '+' ? `Work mosaic · ${nums[0]} + ${nums[1]} tiles` : `Work mosaic · ${nums[0]} − ${nums[1]} tiles${nums[1] > nums[0] ? ' · too many removed' : ''}`;
    preview.replaceChildren(this.strip(board.d, round.op === '+' ? nums : [remaining, 0], label));
  }
  renderDepot(area, round) {
    const { board, phase } = this.scene.state, solved = phase !== 'playing';
    this.unitSelect(area, 'Parcel parts per whole crate');
    const loads = make('div', 'math-control-row');
    [round.a, round.b].forEach((amount, index) => loads.append(this.button(board.loaded[index] ? `${amount} unloaded` : `Unload ${amount}`, () => this.perform('load', index), { key: `load-${index}`, disabled: solved || board.loaded[index] })));
    append(area, loads, make('p', 'math-inventory', `${board.whole} whole crate${board.whole === 1 ? '' : 's'} + ${board.parts} parcels${board.d ? ` of 1/${board.d}` : ''}`));
    if (board.whole) {
      const shelf = make('div', 'math-whole-shelf'); shelf.setAttribute('aria-label', 'Whole-crate unit models');
      for (let i = 0; i < board.whole; i++) {
        const unit = this.button('1 whole', () => this.perform('inspect-whole', i), { key: `whole-${i}`, className: 'math-whole-unit', title: `Inspect whole crate ${i + 1}`, disabled: solved, pressed: board.inspectWhole === i });
        if (board.inspectWhole === i) {
          const grid = make('span', 'math-unit-parts'); grid.style.setProperty('--parts', Math.min(board.d, 12));
          for (let j = 0; j < board.d; j++) grid.append(make('span'));
          append(unit, grid, make('span', '', `= ${board.d}/${board.d}`));
        }
        shelf.append(unit);
      }
      append(area, shelf, make('p', 'english-muted', 'Each outlined unit is one whole crate. Inspect a crate to see its equal parts.'));
    }
    if (board.parts) {
      const parts = make('div', 'math-parcel-rack'); parts.setAttribute('aria-label', 'Select parcels for one whole-crate trade');
      for (let i = 0; i < board.parts; i++) parts.append(this.button(`1/${board.d}`, () => this.perform('select-part', i), { key: `parcel-${i}`, className: 'math-parcel', title: `Parcel ${i + 1}, worth 1/${board.d}`, pressed: board.selected.includes(i), disabled: solved }));
      area.append(parts);
    }
    const trade = make('div', 'math-control-row');
    append(trade, this.input('Select this many parcels', 'group', board.group, { numeric: true, disabled: solved }), this.button('Select group', () => this.perform('select-group'), { key: 'select-group', className: 'small', disabled: solved }), this.button(`Trade selected (${board.selected.length})`, () => this.perform('trade'), { key: 'trade', disabled: solved || !board.loaded.every(Boolean) }), this.button('No exchange needed', () => this.perform('no-trade'), { key: 'no-trade', pressed: board.noTrade, disabled: solved || !board.loaded.every(Boolean) }));
    append(area, trade, make('p', 'english-muted', `One whole crate equals ${board.d || '?'} equal parcels. ${board.trades} exchange${board.trades === 1 ? '' : 's'} made.`));
  }
  renderReservoir(area, round) {
    const { board, phase } = this.scene.state, solved = phase !== 'playing';
    this.unitSelect(area, 'Equal measures per litre');
    const controls = make('div', 'math-control-row');
    append(controls, this.button(board.prepared ? 'Reservoir prepared' : 'Prepare reservoir', () => this.perform('prepare'), { key: 'prepare', disabled: solved || board.prepared }), this.button('Exchange 1 L for parts', () => this.perform('water-trade', 'one'), { key: 'water-trade', disabled: solved || !board.prepared || !board.whole }), this.button('Exchange all wholes', () => this.perform('water-trade', 'all'), { key: 'water-all', className: 'small', disabled: solved || !board.prepared || !board.whole }));
    const reservoir = make('section', 'math-water-source');
    reservoir.append(make('p', 'math-inventory', board.prepared ? `Reservoir: ${board.whole} whole L + ${board.parts}/${board.d} L` : `Starting water: ${round.a} L`));
    if (board.prepared && board.whole) {
      const tanks = make('div', 'math-whole-shelf');
      for (let i = 0; i < board.whole; i++) {
        const tank = this.button('1 L', () => this.perform('draw', 'whole'), { key: `water-tank-${i}`, className: 'math-litre-unit', disabled: solved });
        tank.setAttribute('aria-label', `Draw whole litre ${i + 1} from the reservoir`);
        tanks.append(tank);
      }
      append(reservoir, make('p', 'english-muted', 'Tap a full tank to draw 1 L.'), tanks);
    }
    if (board.prepared) reservoir.append(this.strip(board.d, [0, board.parts], `Loose measures: ${board.parts}/${board.d} L`, { water: true, unitLabel: 'L' }));
    const waterModel = append(make('div', 'math-water-model'), reservoir, this.renderDeliveryJug(round, board.delivered));
    const draws = make('div', 'math-control-row');
    append(draws, this.button('Draw 1 whole L', () => this.perform('draw', 'whole'), { key: 'draw-whole', disabled: solved || !board.prepared || !board.whole }), this.button(`Draw 1/${board.d || '?'} L`, () => this.perform('draw', 'part'), { key: 'draw-part', disabled: solved || !board.parts }), this.input('Parts to draw', 'drawCount', board.drawCount, { numeric: true, disabled: solved }), this.button('Draw these parts', () => this.perform('draw', 'group'), { key: 'draw-group', className: 'small', disabled: solved || !board.parts }));
    append(area, controls, waterModel, draws);
    if (board.prepared) {
      const remaining = add(fraction(board.whole), fraction(board.parts, board.d));
      area.append(make('p', 'math-water-ledger', `Reservoir + jug = ${mixedLabel(add(remaining, board.delivered))} L`));
    }
  }
  renderDeliveryJug(round, delivered) {
    const target = parseFraction(round.b);
    const targetLitres = target.n / target.d, capacity = Math.ceil(targetLitres);
    const bottom = 110, height = 84, goal = bottom - height * targetLitres / capacity;
    const fill = delivered.n / delivered.d / capacity;
    const previousFill = this.jugFill?.roundId === round.id ? this.jugFill.fill : fill;
    this.jugFill = { roundId: round.id, fill };
    const jug = make('figure', 'math-delivery-jug');
    const svg = svgNode('svg', { viewBox: '0 0 105 120', 'aria-hidden': 'true' });
    const outline = 'M18 23 H65 L59 36 L65 104 Q66 110 60 110 H24 Q18 110 19 104 L25 34 Z';
    const clip = svgNode('clipPath', { id: 'math-jug-clip' });
    clip.append(svgNode('path', { d: outline }));
    const water = svgNode('g', { 'clip-path': 'url(#math-jug-clip)' });
    const level = svgNode('rect', { x: 18, y: bottom - height, width: 48, height, fill: TILE_COLORS[1], class: 'math-jug-water' });
    level.style.setProperty('--water-start', previousFill);
    level.style.setProperty('--water-end', fill);
    water.append(level);
    svg.append(clip, svgNode('path', { d: 'M63 42 H74 Q93 42 90 61 L88 77 Q86 88 65 88', fill: 'none', stroke: '#695c40', 'stroke-width': 4 }), svgNode('path', { d: outline, fill: '#e9f0df' }), water);
    svg.append(svgNode('path', { d: outline, fill: 'none', stroke: '#695c40', 'stroke-width': 2 }));
    for (let litre = 1; litre <= capacity; litre++) {
      const y = bottom - height * litre / capacity;
      svg.append(svgNode('line', { x1: 22, x2: 31, y1: y, y2: y, stroke: '#695c40', 'stroke-width': 2 }));
    }
    svg.append(svgNode('line', { x1: 17, x2: 68, y1: goal, y2: goal, stroke: '#342819', 'stroke-width': 2, 'stroke-dasharray': '4 3' }));
    append(jug, make('figcaption', '', 'Delivery jug'), svg, make('p', '', `${mixedLabel(delivered)} L / ${round.b} L`));
    return jug;
  }
  operators(label, selected, type) {
    const row = make('fieldset', 'math-operators'); row.append(make('legend', '', label));
    for (const op of ['+', '-']) row.append(this.button(op === '+' ? '+ Add' : '− Subtract', () => this.perform(type, op), { key: `${type}-${op}`, pressed: selected === op, disabled: this.scene.state.phase !== 'playing' }));
    return row;
  }
  renderCaravan(area, round) {
    const { board, phase } = this.scene.state, solved = phase !== 'playing', quantities = make('div', 'math-quantity-row');
    [0, 1].forEach(index => quantities.append(this.choiceSelect(index ? 'Second quantity' : 'Starting quantity', board.operands[index], [['', 'Choose a quantity'], [round.a, `${round.a} ${round.unit}`], [round.b, `${round.b} ${round.unit}`]], amount => this.perform('operand', { index, amount }), `operand-${index}`, solved)));
    append(area, quantities, this.operators('What does the story ask you to do?', board.op, 'operator'), make('p', 'math-equation', `${board.operands[0] || '?'} ${board.op === '-' ? '−' : board.op || '?'} ${board.operands[1] || '?'} = ? ${round.unit}`));
    const lengths = make('div', 'math-length-model');
    const a = parseFraction(round.a), b = parseFraction(round.b), d = round.modelD;
    const first = partCount(a, d), second = partCount(b, d);
    lengths.append(make('p', 'english-muted', `Length model · every full row spans 4 metres. Dark marks separate metres; each metre has ${d} equal parts.`));
    const lengthOptions = { wholesPerRow: 4, unitLabel: 'm' };
    const sources = make('div', 'math-length-sources');
    append(sources, this.strip(d, [first, 0], `${round.op === '+' ? 'First rope' : 'Starting length'}: ${round.a} m`, lengthOptions), this.strip(d, [0, second], `${round.op === '+' ? 'Second rope' : 'Cut length'}: ${round.b} m`, lengthOptions));
    lengths.append(sources);
    if (board.operands.every(Boolean) && board.op) {
      // The learner's operation drives the preview, including incorrect choices.
      const x = parseFraction(board.operands[0]), y = parseFraction(board.operands[1]);
      const result = board.op === '+' ? add(x, y) : subtract(x, y);
      const xParts = partCount(x, d), yParts = partCount(y, d);
      if (result.n >= 0) {
        lengths.append(this.strip(d, board.op === '+' ? [xParts, yParts] : [partCount(result, d), 0], board.op === '+' ? 'Your join preview · ochre and teal lengths placed end to end.' : 'Your cut preview · ochre length is retained.', lengthOptions));
        if (board.op === '-') lengths.append(make('p', 'math-length-ledger', `${mixedLabel(y)} m cut + ${mixedLabel(result)} m retained = ${mixedLabel(x)} m starting length.`));
      } else lengths.append(make('p', 'english-feedback retry', 'This cut is longer than the selected starting length. Swap the quantities or reconsider the operation.'));
    }
    area.append(lengths);
    if (round.regroup) {
      this.unitSelect(area, 'Shared parts per metre');
      const ledger = make('div', 'math-control-row');
      append(ledger, make('span', '', 'Starting length after exchange:'), this.input('Whole metres', 'ledgerWhole', board.ledgerWhole, { numeric: true, disabled: solved }), this.input(`Parts / ${board.d || '?'}`, 'ledgerParts', board.ledgerParts, { numeric: true, disabled: solved })); area.append(ledger);
    }
  }
  renderRoute(area, round, animateTrial) {
    const { board, phase } = this.scene.state, solved = phase !== 'playing';
    const route = make('div', 'math-route-board');
    const map = make('div', 'math-route-map');
    const svg = svgNode('svg', { viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
    const points = ['camp', ...board.route].map(id => ROUTE_POINTS[id]);
    if (board.route.length) {
      svg.append(svgNode('polyline', { points: points.map(point => point.join(',')).join(' '), class: 'math-route-planned' }));
      if (board.trial) {
        const trace = svgNode('g', { class: `math-route-trial ${board.trial.valid ? 'valid' : 'retry'}${animateTrial ? ' tracing' : ''}` });
        points.slice(1).forEach(([x2, y2], index) => {
          const [x1, y1] = points[index];
          const leg = svgNode('line', { x1, y1, x2, y2 });
          leg.style.setProperty('--leg', index);
          trace.append(leg);
        });
        svg.append(trace);
      }
    }
    map.append(svg);
    const camp = make('span', 'math-route-camp', 'Camp');
    camp.style.left = `${ROUTE_POINTS.camp[0]}%`; camp.style.top = `${ROUTE_POINTS.camp[1]}%`;
    map.append(camp);
    for (const station of round.stations) {
      const order = board.route.indexOf(station.id) + 1;
      const stop = this.button('', () => this.perform('station', station.id), { key: `station-${station.id}`, className: 'math-route-stop', pressed: order > 0, disabled: solved });
      stop.setAttribute('aria-label', `Station ${station.id}, ${station.amount} L${order ? `, stop ${order}` : ''}`);
      stop.style.left = `${ROUTE_POINTS[station.id][0]}%`; stop.style.top = `${ROUTE_POINTS[station.id][1]}%`;
      append(stop, make('strong', '', order ? `${station.id} · ${order}` : station.id), make('span', '', `${station.amount} L`));
      map.append(stop);
    }
    append(route, map, make('p', '', board.route.length ? `Visit order: camp → ${board.route.join(' → ')}` : 'Choose up to three stops. Tap a selected stop to remove it.'));
    append(area, route, this.button('Try route · unscored', () => this.perform('trial'), { key: 'trial', className: 'small', disabled: solved }));
    if (board.trial) area.append(make('p', 'math-water-ledger', `Trial: delivered ${mixedLabel(board.trial.total)} L; reserve ${mixedLabel(board.trial.remaining)} L. ${board.trial.valid ? 'All supply conditions met.' : 'Adjust the route to meet every condition.'}`));
    append(area, this.operators('Delivery equation: station orders…', board.deliveryOp, 'delivery-op'), this.input('Total delivered', 'totalAnswer', board.totalAnswer, { disabled: solved, placeholder: 'e.g. 3 1/2' }), this.operators('Reserve equation: 5 L…total delivered', board.balanceOp, 'balance-op'));
  }
  renderResult(area) {
    const state = this.scene.state, game = this.scene.gameDefinition, accuracy = mathAccuracy(state);
    append(area, make('h2', '', 'Week 1 mission complete'), make('p', 'english-result-line', `${accuracy.correct} / ${accuracy.total} independent checkpoints`), make('p', '', 'You completed all three challenges and the exit check. Corrections and supported work are included in your journal.'));
    const list = make('ul', 'math-results');
    game.rounds.forEach((r, i) => { const record = state.records[r.id]; list.append(make('li', '', `${r.exit ? 'Exit check' : `Challenge ${i + 1}`}: complete · ${record.attempts} check${record.attempts > 1 ? 's' : ''}${record.supported ? ' · with support' : ''}`)); });
    append(area, list, make('p', 'english-muted', this.scene.storageAvailable ? 'Completion saved on this device.' : 'Device saving is unavailable. Download your journal before leaving.'), this.button('Download journal', () => this.downloadJournal(), { key: 'download' }));
  }
  openHelp() {
    this.openDialog('math-help', 'How to play', dialog => {
      const game = this.scene.gameDefinition;
      append(dialog, make('p', '', game.tutorial), make('p', 'english-explanation', game.tip), make('p', '', 'Every action has a tap or keyboard alternative. Undo changes the model; it keeps submitted checkpoint records. Equivalent and improper fractions are accepted.'));
      if (this.scene.state.phase === 'playing') dialog.append(this.button('Inspect a worked example', () => {
        dialog.addEventListener('close', () => this.scene.perform('solution'), { once: true }); dialog.close();
      }, { key: 'worked-example' }));
    });
  }
  openPause() { this.openDialog('math-pause', 'Take a breath', dialog => dialog.append(make('p', '', 'Your model stays here. Motion is paused and there is no countdown.'))); }
  openSettings() {
    this.openDialog('math-settings', 'Settings', dialog => {
      for (const [key, label] of [['musicEnabled', 'Music'], ['sfxEnabled', 'Sound effects']]) {
        const row = make('label', 'english-setting-row', label), input = make('input'); input.type = 'checkbox'; input.checked = Boolean(this.scene.registry.get(key)); input.setAttribute('aria-label', label);
        input.addEventListener('change', () => { this.scene.registry.set(key, input.checked); if (key === 'musicEnabled') playAreaMusic(this.scene, this.scene.islandId); }); append(row, input); dialog.append(row);
      }
    });
  }
  finishDrag(event) {
    if (!this.drag || this.drag.pointerId !== event.pointerId) return;
    if (this.drag.moving) {
      this.suppressClickUntil = performance.now() + 300;
      if (this.drag.type === 'bridge' && document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-math-drop="bridge"]')) this.perform('bridge-piece', { source: this.drag.source });
    }
    this.cancelDrag();
  }
  downloadJournal() {
    const game = this.scene.gameDefinition, state = this.scene.state;
    const content = `${game.title}\nMathematics · Quarter 1 · Week 1 · Day ${game.day}\n${mathAccuracy(state).correct}/${mathAccuracy(state).total} independent checkpoints\nHints: ${state.hintCount}; worked examples: ${state.solutionCount}\n\n${game.rounds.map((r, i) => `${r.exit ? 'Exit check' : `Challenge ${i + 1}`}: ${r.prompt}\n${workedSolution(r)}\nRecord: ${JSON.stringify(state.records[r.id])}`).join('\n\n')}`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' })), link = make('a'); link.href = url; link.download = `lumora-${game.id}-journal.txt`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
