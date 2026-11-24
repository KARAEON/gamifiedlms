import { add, subtract, equal, compare, fraction, parseFraction, mixedLabel, commonUnit, split, partCount, sum } from './fractions.js';

export const MATH_PROGRESS_KEY = 'lumora-math-week1-v1';
const clone = value => JSON.parse(JSON.stringify(value));
const number = value => /^\d{1,3}$/.test(String(value)) ? Number(value) : NaN;
export const roundValue = round => round.op === '-' || round.kind === 'reservoir' ? subtract(parseFraction(round.a), parseFraction(round.b)) : add(parseFraction(round.a), parseFraction(round.b));
export function initialBoard(round) {
  return {
    d: round.kind === 'bridge' ? round.d : 0, counts: [0, 0], unchanged: '',
    equivalents: ['', ''], transferred: [false, false], loaded: [false, false],
    whole: 0, parts: 0, selected: [], group: '', trades: 0, noTrade: false,
    prepared: false, delivered: fraction(0), drawCount: '',
    operands: ['', ''], op: '', unit: '', ledgerWhole: '', ledgerParts: '',
    route: [], deliveryOp: '', balanceOp: '', totalAnswer: '', trial: null,
    answer: '', zoom: false, inspectWhole: null, explanation: '',
  };
}
export function initialMathState(game) {
  return { phase: 'tutorial', round: 0, board: initialBoard(game.rounds[0]), history: [], records: {}, assistance: {}, hintCount: 0, solutionCount: 0, feedback: '', feedbackKind: '', notice: '' };
}
export function routeValues(round, board) {
  const deliveries = board.route.map(id => round.stations.find(station => station.id === id)).filter(Boolean).map(station => parseFraction(station.amount));
  const total = sum(deliveries), remaining = subtract(fraction(5), total);
  return { total, remaining, valid: board.route.length === 3 && new Set(board.route).size === 3 && compare(total, parseFraction('3 1/2')) >= 0 && compare(remaining, fraction(1)) >= 0 };
}
export function mathChecks(round, board) {
  const a = parseFraction(round.a), b = round.b ? parseFraction(round.b) : null;
  if (round.kind === 'route') {
    const route = routeValues(round, board);
    return {
      route: { ok: route.valid, message: 'Choose exactly three different stations, deliver at least 3 1/2 L, and retain at least 1 L.' },
      equations: { ok: board.deliveryOp === '+' && board.balanceOp === '-', message: 'Add the station orders for delivered water. Subtract that total from 5 L for the reserve.' },
      ledger: { ok: equal(parseFraction(board.totalAnswer), route.total) && equal(parseFraction(board.answer), route.remaining), message: 'Check both ledger values against the stations on your route.' },
      unit: { ok: board.unit === 'L', message: 'Water is measured in litres (L).' },
    };
  }
  const target = roundValue(round);
  const answer = { ok: equal(parseFraction(board.answer), target), message: 'Check your total. Use a whole number, a fraction, or a mixed number such as 1 1/2.' };
  if (round.kind === 'bridge') return {
    pieces: { ok: board.d === round.d && board.counts.every((count, i) => count === round.counts[i]), message: `Place exactly ${round.counts[0]} ochre and ${round.counts[1]} teal pieces, each worth 1/${round.d}.` },
    unit: { ok: board.unchanged === String(round.d), message: `Joining pieces does not change their size. Each is still 1/${round.d} of the original whole.` },
    answer,
  };
  const shared = commonUnit(board.d, [a, b]);
  if (round.kind === 'mosaic') return {
    grid: { ok: shared, message: 'Choose a shared denominator that divides both original whole panels into equal parts.' },
    conversions: { ok: shared && board.equivalents.every((value, i) => number(value) === partCount([a, b][i], board.d)), message: 'Each new numerator must preserve its own original shaded area.' },
    transfer: { ok: board.transferred.every(Boolean), message: 'Transfer both tile groups to the work rail before checking.' }, answer,
  };
  if (round.kind === 'depot') {
    const originalParts = shared ? split(a, board.d).parts + split(b, board.d).parts : 0;
    const modelValue = board.d ? add(fraction(board.whole), fraction(board.parts, board.d)) : null;
    return {
      load: { ok: shared && board.loaded.every(Boolean), message: 'Choose equal parcel units and unload both source loads.' },
      exchange: { ok: shared && board.parts < board.d && (originalParts >= board.d ? board.trades > 0 : board.noTrade), message: originalParts >= board.d ? `Select exactly ${board.d} equal parcels for each whole-crate trade. Finish with fewer than ${board.d} loose parcels.` : 'There are fewer parts than a whole. Choose “No exchange needed”.' },
      conservation: { ok: equal(modelValue, target), message: 'Your crates and remaining parcels must equal the combined load. A trade must preserve that value.' }, answer,
    };
  }
  if (round.kind === 'reservoir') {
    const remaining = board.d ? add(fraction(board.whole), fraction(board.parts, board.d)) : null;
    return {
      delivery: { ok: shared && board.prepared && equal(board.delivered, b), message: 'Prepare the reservoir and draw exactly the delivery order into the jug.' },
      conservation: { ok: remaining && equal(add(remaining, board.delivered), a) && equal(remaining, target), message: 'The water left plus the delivered water must equal the starting water.' },
      unit: { ok: board.unit === 'L', message: 'Record water in litres (L).' }, answer,
    };
  }
  const canonicalWhole = Math.floor(a.n / a.d);
  // Any positive number of whole-to-part exchanges is valid, including
  // conversion of all wholes to an improper fraction.
  const ledgerWhole = number(board.ledgerWhole), ledgerParts = number(board.ledgerParts);
  const ledgerOk = shared && ledgerWhole < canonicalWhole && ledgerParts >= board.d && equal(add(fraction(ledgerWhole || 0), fraction(Number.isFinite(ledgerParts) ? ledgerParts : 0, board.d)), a);
  return {
    equation: { ok: equal(parseFraction(board.operands[0]), a) && equal(parseFraction(board.operands[1]), b) && board.op === round.op || round.op === '+' && equal(parseFraction(board.operands[1]), a) && equal(parseFraction(board.operands[0]), b) && board.op === '+', message: `Choose the story's two quantities and ${round.op === '+' ? 'add them to join the ropes' : 'subtract the cut from the starting length'}.` },
    ...(round.regroup ? { regroup: { ok: ledgerOk, message: 'Show an equivalent starting length after exchanging one or more whole metres for shared parts.' } } : {}),
    unit: { ok: board.unit === round.unit, message: `Record this length in metres (${round.unit}).` }, answer,
    ...(round.explanations ? { explanation: { ok: board.explanation === round.explanation, message: 'Choose the conservation statement: the rope used and rope left must account for the starting length.' } } : {}),
  };
}

export function mathAccuracy(state) {
  const checks = Object.values(state.records).flatMap(record => Object.values(record.first ?? {}));
  const correct = checks.filter(Boolean).length, total = checks.length;
  return { correct, total, percent: total ? Math.round(correct / total * 100) : 0 };
}

export function mathAction(game, previous, action) {
  if (action.type === 'start' && previous.phase === 'tutorial') return { ...previous, phase: 'playing', notice: 'Build your model, then check it.' };
  if (action.type === 'continue' && previous.phase === 'round-complete') {
    const next = previous.round + 1;
    return next === game.rounds.length ? { ...previous, phase: 'result' } : { ...previous, round: next, phase: 'playing', board: initialBoard(game.rounds[next]), history: [], feedback: '', notice: '' };
  }
  if (previous.phase !== 'playing') return previous;
  const state = clone(previous), board = state.board, round = game.rounds[state.round], type = action.type, value = action.value;
  const announce = text => { state.notice = text; return state; };
  if (type === 'hint' || type === 'solution') {
    state.assistance[round.id] = true;
    state[type === 'hint' ? 'hintCount' : 'solutionCount']++;
    state.feedback = type === 'hint' ? round.hint : workedSolution(round);
    state.feedbackKind = 'hint'; return state;
  }
  if (type === 'check') {
    const checks = mathChecks(round, board), record = state.records[round.id] ?? { first: {}, attempts: 0 };
    for (const [key, check] of Object.entries(checks)) if (!(key in record.first)) record.first[key] = check.ok && !state.assistance[round.id];
    record.attempts++; record.supported = Boolean(state.assistance[round.id]);
    record.resolved = Object.values(checks).every(check => check.ok);
    if (record.resolved) record.solution = clone(board);
    record.last = Object.fromEntries(Object.entries(checks).map(([key, check]) => [key, check.ok]));
    state.records[round.id] = record;
    if (record.resolved) { state.phase = 'round-complete'; state.feedbackKind = 'success'; state.feedback = `${round.kind === 'route' ? 'Your route meets every supply condition.' : `Model and answer agree: ${mixedLabel(roundValue(round))}${round.unit ? ` ${round.unit}` : ''}.`} ${record.supported ? 'Completed with support.' : 'Challenge complete.'}`; }
    else { state.feedbackKind = 'retry'; state.feedback = Object.values(checks).filter(check => !check.ok).map(check => check.message).join(' '); }
    return state;
  }
  if (type === 'undo') {
    if (state.history.length) { state.board = state.history.pop(); state.feedback = ''; state.notice = 'Last model action undone.'; }
    return state;
  }
  if (type === 'reset') { state.history.push(clone(board)); state.board = initialBoard(round); state.feedback = ''; return announce('Model reset. Your checkpoint record is kept.'); }
  if (type === 'input') {
    const fields = ['answer', 'group', 'drawCount', 'ledgerWhole', 'ledgerParts', 'totalAnswer'];
    if (fields.includes(value.field)) board[value.field] = String(value.text).slice(0, 35);
    if (value.field === 'equivalent' && [0, 1].includes(value.index)) { board.equivalents[value.index] = String(value.text).slice(0, 3); board.transferred[value.index] = false; }
    state.feedback = ''; return state;
  }
  const before = clone(board);
  const a = parseFraction(round.a), b = round.b ? parseFraction(round.b) : null;
  if (type === 'zoom' && round.kind === 'mosaic') { board.zoom = !board.zoom; return state; }
  if (type === 'inspect-whole' && round.kind === 'depot') { board.inspectWhole = board.inspectWhole === value ? null : value; return state; }
  if (type === 'denominator') {
    const d = Number(value);
    if (!Number.isInteger(d) || d < 1 || d > 48) return previous;
    const fresh = round.kind === 'caravan' ? { ...board, ledgerWhole: '', ledgerParts: '' } : initialBoard(round);
    fresh.d = d; fresh.answer = board.answer;
    state.board = fresh;
    state.notice = round.kind === 'bridge' ? 'The original rail stays fixed. Compare your chosen piece size.' : 'New shared grid selected. Rebuild the model in this unit.';
  } else if (type === 'bridge-piece' && round.kind === 'bridge') {
    const { source, delta = 1 } = value;
    if (![0, 1].includes(source) || ![-1, 1].includes(delta)) return previous;
    const cap = round.counts[source] + (round.extras ? 2 : 0);
    board.counts[source] = Math.max(0, Math.min(cap, board.counts[source] + delta));
  } else if (type === 'bridge-tray' && round.kind === 'bridge' && !round.extras && [0, 1].includes(value)) {
    board.counts[value] = round.counts[value];
  } else if (type === 'unchanged') board.unchanged = String(value);
  else if (type === 'select-tiles' && round.kind === 'mosaic') {
    const { index, count } = value;
    if (board.d === 0 || ![0, 1].includes(index) || !Number.isInteger(count) || count < 0 || count > board.d) return previous;
    if (board.equivalents[index] === String(count)) return previous;
    board.equivalents[index] = String(count);
    board.transferred[index] = false;
  } else if (type === 'transfer' && round.kind === 'mosaic' && [0, 1].includes(value)) {
    const count = number(board.equivalents[value]);
    if (board.d === 0 || !Number.isInteger(count) || count < 1 || count > board.d) return announce('Select a tile group within one whole panel before transferring it.');
    board.transferred[value] = true;
  }
  else if (type === 'load' && round.kind === 'depot') {
    if (![0, 1].includes(value) || board.loaded[value]) return previous;
    if (!commonUnit(board.d, [a, b])) return announce('Choose a common parcel unit before unloading.');
    const load = split([a, b][value], board.d);
    board.whole += load.whole; board.parts += load.parts; board.loaded[value] = true; board.noTrade = false;
  } else if (type === 'select-part' && round.kind === 'depot') {
    if (!Number.isInteger(value) || value < 0 || value >= board.parts) return previous;
    board.selected = board.selected.includes(value) ? board.selected.filter(id => id !== value) : [...board.selected, value];
  } else if (type === 'select-group' && round.kind === 'depot') {
    const n = number(board.group);
    if (!Number.isInteger(n) || n < 0 || n > board.parts) return announce('Enter a whole parcel count no larger than the available parts.');
    board.selected = Array.from({ length: n }, (_, i) => i);
  } else if (type === 'trade' && round.kind === 'depot') {
    if (!board.loaded.every(Boolean)) return announce('Unload both sources before trading.');
    if (board.selected.length !== board.d || board.parts < board.d) return announce(`A whole crate needs exactly ${board.d} parcels of 1/${board.d}. Change your selection.`);
    board.whole++; board.parts -= board.d; board.trades++; board.selected = []; board.noTrade = false;
    state.notice = `${board.d}/${board.d} exchanged for one whole. The load’s value is unchanged.`;
  } else if (type === 'no-trade' && round.kind === 'depot') board.noTrade = true;
  else if (type === 'prepare' && round.kind === 'reservoir') {
    if (!commonUnit(board.d, [a, b])) return announce('Choose a common measuring unit for both water amounts.');
    if (board.prepared) return previous;
    const start = split(a, board.d); board.whole = start.whole; board.parts = start.parts; board.prepared = true;
  } else if (type === 'water-trade' && round.kind === 'reservoir') {
    if (!board.prepared || !board.whole) return announce('A whole litre must be available before an exchange.');
    const count = value === 'all' ? board.whole : 1;
    board.whole -= count; board.parts += count * board.d; board.trades += count;
    state.notice = `${count} whole litre${count > 1 ? 's' : ''} exchanged for equal parts. Total water is unchanged.`;
  } else if (type === 'draw' && round.kind === 'reservoir') {
    if (!board.prepared) return announce('Prepare the reservoir first.');
    const isWhole = value === 'whole', count = isWhole || value === 'part' ? 1 : number(board.drawCount);
    if (!Number.isInteger(count) || count <= 0) return announce('Enter a positive whole number of parts to draw.');
    if (isWhole ? board.whole < 1 : board.parts < count) return announce('That water is unavailable in this form. Exchange a whole litre for parts if needed.');
    const amount = isWhole ? fraction(1) : fraction(count, board.d);
    if (compare(add(board.delivered, amount), b) > 0) return announce('That draw would overfill the order. Draw a smaller measured amount.');
    if (isWhole) board.whole--; else board.parts -= count;
    board.delivered = add(board.delivered, amount);
  } else if (type === 'operand' && round.kind === 'caravan') {
    if (![0, 1].includes(value.index) || ![round.a, round.b].includes(value.amount)) return previous;
    board.operands[value.index] = value.amount;
  } else if (type === 'operator' && ['+', '-'].includes(value)) board.op = value;
  else if (type === 'unit' && ['m', 'L'].includes(value)) board.unit = value;
  else if (type === 'explanation' && round.explanations?.some(option => option.id === value)) board.explanation = value;
  else if (type === 'delivery-op' && ['+', '-'].includes(value)) board.deliveryOp = value;
  else if (type === 'balance-op' && ['+', '-'].includes(value)) board.balanceOp = value;
  else if (type === 'station' && round.kind === 'route') {
    if (!round.stations.some(station => station.id === value)) return previous;
    if (board.route.includes(value)) board.route = board.route.filter(id => id !== value);
    else if (board.route.length < 3) board.route.push(value);
    else return announce('Three stops are already selected. Remove one before adding another.');
    board.trial = null;
  } else if (type === 'trial' && round.kind === 'route') {
    board.trial = routeValues(round, board);
    return announce('Trial run only. This preview does not submit a checkpoint.');
  } else return previous;
  state.history.push(before); state.history = state.history.slice(-80); state.feedback = '';
  return state;
}

export function workedSolution(round) {
  if (round.kind === 'route') return 'One route is A → C → D: 1 1/2 + 3/4 + 1 1/4 = 3 1/2 L delivered. 5 − 3 1/2 = 1 1/2 L left. Other routes can also work.';
  return `${round.hint} The result is ${mixedLabel(roundValue(round))}${round.unit ? ` ${round.unit}` : ''}. Rebuild the model yourself; this round is recorded as supported.`;
}
