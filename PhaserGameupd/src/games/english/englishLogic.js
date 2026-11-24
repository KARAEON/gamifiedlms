import { ENGLISH_DEVICES } from '../../config/englishWeekOne.js';

export const ENGLISH_PROGRESS_KEY = 'lumora-english-week1-v1';
export const ENGLISH_DRAFT_KEY = 'lumora-poetry-draft-v1';
const sameSet = (a, b) => a.length === b.length && new Set(a).size === a.length && a.every(id => b.includes(id));
const samePhrase = (a, b) => a.length === b.length && a.every((word, index) => word === b[index]);
export const emptyEnglishDraft = () => ({ version: 1, theme: 'A garden morning', lines: Array(12).fill(''), annotations: [], note: '', stanza: 0, status: 'draft' });

export function annotationIsPlaced(draft, annotation) {
  const line = draft.lines[annotation.line];
  return annotation.placed !== false && ENGLISH_DEVICES.includes(annotation.device)
    && Number.isInteger(annotation.line) && annotation.line >= 0 && annotation.line < 12
    && typeof line === 'string' && Number.isInteger(annotation.start) && Number.isInteger(annotation.end)
    && annotation.start >= 0 && annotation.end <= line.length && annotation.end > annotation.start
    && Boolean(annotation.quote?.trim()) && line.slice(annotation.start, annotation.end) === annotation.quote;
}

export function normalizeEnglishDraft(value) {
  const draft = { ...emptyEnglishDraft(), ...(value && typeof value === 'object' ? value : {}) };
  draft.lines = Array.from({ length: 12 }, (_, index) => String(value?.lines?.[index] ?? '').slice(0, 120));
  draft.note = String(draft.note ?? '').slice(0, 600);
  draft.theme = ['A garden morning', 'A library journey', 'A rainy afternoon'].includes(draft.theme) ? draft.theme : 'A garden morning';
  draft.stanza = Math.max(0, Math.min(3, Math.floor(Number(draft.stanza) || 0)));
  draft.annotations = (Array.isArray(value?.annotations) ? value.annotations : []).slice(0, 48).filter(annotation => annotation && ENGLISH_DEVICES.includes(annotation.device))
    .map(annotation => ({ ...annotation, placed: annotationIsPlaced(draft, annotation) }));
  draft.status = draft.status === 'submitted' ? 'submitted' : 'draft';
  return draft;
}

export function poemSubmissionIssues(draft) {
  const issues = [];
  const missing = draft.lines.flatMap((line, index) => line.trim() ? [] : [index + 1]);
  if (missing.length) issues.push(`Write all twelve lines. Empty: ${missing.join(', ')}.`);
  const placed = draft.annotations.filter(annotation => annotationIsPlaced(draft, annotation));
  const devices = ENGLISH_DEVICES.filter(device => !placed.some(annotation => annotation.device === device));
  if (devices.length) issues.push(`Mark intended sound effects for: ${devices.join(', ')}.`);
  if (draft.annotations.some(annotation => !annotationIsPlaced(draft, annotation))) issues.push('Reattach or remove the unplaced annotations after your edits.');
  if (draft.note.trim().length < 8) issues.push('Add a short explanation of one sound effect and how it fits your poem.');
  return issues;
}

function roundFields(round) {
  return {
    selected: [], positions: {}, mappings: {}, sound: null, reason: null,
    repair: null, activeWord: null, supported: false, transcript: false,
    slots: round.kind === 'phrase' ? round.acceptedPhrases[0].map((_, index) => round.fixed?.[index] ?? null) : [],
    feedback: '', feedbackKind: 'info', attempts: 0,
  };
}

export function initialEnglishState(game, savedDraft) {
  const records = {};
  const saved = savedDraft?.analysisRecords;
  const valid = game.kind === 'festival' && game.rounds.every(round => {
    const record = saved?.[round.id];
    const keys = ['evidence', 'explanation', ...(round.sound ? ['sound'] : []), ...(round.position ? ['position'] : [])];
    return record?.resolved === true && record.first && keys.every(key => typeof record.first[key] === 'boolean');
  });
  if (valid) for (const round of game.rounds) {
    const record = saved[round.id];
    const keys = ['evidence', 'explanation', ...(round.sound ? ['sound'] : []), ...(round.position ? ['position'] : [])];
    records[round.id] = { first: Object.fromEntries(keys.map(key => [key, record.first[key]])), resolved: true, supported: Boolean(record.supported), attempts: Math.max(1, Math.min(999, Number(record.attempts) || 1)) };
  }
  const support = valid ? savedDraft?.analysisSupport : null;
  return { phase: 'tutorial', round: 0, records,
    hintCount: Math.max(0, Number(support?.hintCount) || 0), solutionCount: Math.max(0, Number(support?.solutionCount) || 0),
    assistance: Array.isArray(support?.assistance) ? support.assistance.filter(value => ['transcript', 'hint', 'worked example'].includes(value)) : [],
    draft: normalizeEnglishDraft(savedDraft), ...roundFields(game.rounds[0]) };
}

export function checkEnglishRound(round, state) {
  const missing = [];
  if (round.kind === 'phrase') {
    if (state.slots.some(word => !word)) missing.push('Fill each sail socket.');
  } else if (!state.selected.length) missing.push('Choose evidence words first.');
  if (round.events?.some(event => !state.mappings[event.id])) missing.push('Give every event a sound word.');
  if (round.sound && !state.sound) missing.push('Choose the sound you hear.');
  if (round.position && state.selected.some(id => !state.positions[id])) missing.push('Choose a sound position on each selected word.');
  if (round.repair && !state.repair) missing.push('Repair the missing word first.');
  if (!state.reason) missing.push('Choose an explanation.');
  if (missing.length) return { ready: false, correct: false, missing, checks: {} };
  const checks = {
    evidence: round.kind === 'phrase'
      ? round.acceptedPhrases.some(phrase => samePhrase(state.slots, phrase))
      : round.acceptedTargets.some(targets => sameSet(state.selected, targets)),
    explanation: state.reason === round.reasonId,
  };
  if (round.sound) checks.sound = state.sound === round.sound;
  if (round.position) checks.position = state.selected.every(id => state.positions[id] === round.position);
  if (round.repair) checks.repair = state.repair === round.repair.answer;
  if (round.events) checks.events = round.events.every(event => round.words.find(word => word.id === state.mappings[event.id])?.word === event.word);
  return { ready: true, checks, correct: Object.values(checks).every(Boolean), missing: [] };
}

export function englishAccuracy(state) {
  const values = Object.values(state.records).flatMap(record => Object.values(record.first));
  const correct = values.filter(Boolean).length;
  return { correct, total: values.length, percent: values.length ? Math.round(correct / values.length * 100) : 0 };
}

export function englishAction(game, previous, action) {
  const state = { ...previous };
  const round = game.rounds[state.round];
  if (action.type === 'start' && state.phase === 'tutorial') return { ...state, phase: 'playing', records: {}, assistance: [], hintCount: 0, solutionCount: 0 };
  if (action.type === 'resume-poem' && state.phase === 'tutorial' && game.kind === 'festival'
    && state.draft.lines.some(line => line.trim()) && game.rounds.every(round => state.records[round.id]?.resolved)) {
    return { ...state, phase: 'editor', round: game.rounds.length - 1 };
  }
  if (action.type === 'continue' && state.phase === 'round-complete') {
    const next = state.round + 1;
    if (next < game.rounds.length) return { ...state, round: next, phase: 'playing', ...roundFields(game.rounds[next]) };
    return { ...state, phase: game.kind === 'festival' ? 'editor' : 'result' };
  }
  if (action.type === 'edit-poem' && ['review', 'result'].includes(state.phase) && game.kind === 'festival') return { ...state, phase: 'editor', draft: { ...state.draft, status: 'draft' } };
  if (['editor', 'review'].includes(state.phase)) return poemAction(state, action);
  if (state.phase !== 'playing') return previous;
  const value = action.value;
  if (action.type === 'select' && round.kind !== 'phrase' && round.words.some(word => word.id === value)) {
    state.selected = state.selected.includes(value) ? state.selected.filter(id => id !== value) : [...state.selected, value];
    state.activeWord = value;
  } else if (action.type === 'activate' && state.selected.includes(value)) {
    state.activeWord = value;
  } else if (action.type === 'place' && round.kind === 'phrase') {
    const index = Number(value.index);
    if (!Number.isInteger(index) || index < 0 || index >= state.slots.length || round.fixed?.[index] !== undefined || !round.pool.includes(value.word)) return previous;
    state.slots = state.slots.map((word, slot) => slot === index ? value.word : word === value.word && round.fixed?.[slot] === undefined ? null : word);
    state.activeWord = round.words.find(word => word.label === value.word)?.id ?? null;
  } else if (action.type === 'remove' && round.kind === 'phrase' && round.fixed?.[value] === undefined) {
    state.slots = state.slots.map((word, index) => index === value ? null : word);
  } else if (action.type === 'anchor' && round.position && round.words.some(word => word.id === value.id) && ['start', 'middle', 'end'].includes(value.position)) {
    state.selected = state.selected.includes(value.id) ? [...state.selected] : [...state.selected, value.id];
    state.positions = { ...state.positions, [value.id]: value.position };
    state.activeWord = value.id;
  } else if (action.type === 'assign' && round.events?.some(event => event.id === value.event) && round.words.some(word => word.id === value.word)) {
    state.mappings = { ...state.mappings, [value.event]: value.word };
  } else if (action.type === 'sound' && round.soundOptions?.includes(value)) state.sound = value;
  else if (action.type === 'reason' && round.reasons.some(reason => reason.id === value)) state.reason = value;
  else if (action.type === 'repair' && round.repair?.choices.includes(value)) state.repair = value;
  else if (action.type === 'transcript') {
    state.transcript = !state.transcript;
    if (state.transcript) { state.supported = true; state.assistance = [...new Set([...state.assistance, 'transcript'])]; }
  } else if (action.type === 'hint') {
    state.supported = true; state.hintCount += 1;
    state.assistance = [...new Set([...state.assistance, 'hint'])];
    state.feedback = game.tip; state.feedbackKind = 'info';
  } else if (action.type === 'solution') {
    state.supported = true; state.solutionCount += 1;
    state.assistance = [...new Set([...state.assistance, 'worked example'])];
    state.selected = [...round.targets]; state.reason = round.reasonId;
    state.sound = round.sound ?? null; state.repair = round.repair?.answer ?? null;
    state.positions = Object.fromEntries(round.targets.map(id => [id, round.position]));
    state.mappings = Object.fromEntries((round.events ?? []).map(event => [event.id, round.words.find(word => word.word === event.word).id]));
    if (round.kind === 'phrase') state.slots = [...round.acceptedPhrases[0]];
    state.feedback = `Worked example: ${round.explanation} Press Check when you have inspected it.`;
    state.feedbackKind = 'info';
  } else if (action.type === 'reset') {
    return { ...state, ...roundFields(round), supported: state.supported, attempts: state.attempts };
  } else if (action.type === 'check') {
    const result = checkEnglishRound(round, state);
    if (!result.ready) return { ...state, feedback: result.missing.join(' '), feedbackKind: 'info' };
    const old = state.records[round.id];
    const first = old?.first ?? Object.fromEntries(Object.entries(result.checks).map(([key, correct]) => [key, Boolean(correct && !state.supported)]));
    state.records = { ...state.records, [round.id]: { first, attempts: (old?.attempts ?? 0) + 1, resolved: result.correct, supported: state.supported } };
    state.attempts += 1;
    if (result.correct) {
      state.phase = 'round-complete'; state.feedbackKind = 'success'; state.feedback = round.explanation;
    } else {
      const messages = [];
      if (!result.checks.evidence) messages.push(round.kind === 'phrase' ? 'Check the word order and meaning of your phrase.' : 'Check your evidence words: some are missing or do not share the target effect.');
      if (result.checks.events === false) messages.push('Match each sound word to the event it imitates.');
      if (result.checks.position === false) messages.push('Listen for where the consonant occurs: beginning, middle, or end.');
      if (result.checks.sound === false) messages.push('Replay the sound samples and compare the sound you chose.');
      if (result.checks.repair === false) messages.push('The replacement word must continue the target sound.');
      if (!result.checks.explanation) messages.push('Reconsider the explanation: sounds and meaning matter more than matching letters.');
      state.feedback = messages.join(' '); state.feedbackKind = 'retry';
    }
  } else return previous;
  return state;
}

function poemAction(state, action) {
  const draft = { ...state.draft, lines: [...state.draft.lines], annotations: state.draft.annotations.map(annotation => ({ ...annotation })) };
  const value = action.value;
  if (action.type === 'poem-line' && state.phase === 'editor' && Number.isInteger(value.index) && value.index >= 0 && value.index < 12) {
    draft.lines[value.index] = String(value.text).slice(0, 120);
    draft.annotations = draft.annotations.map(annotation => ({ ...annotation, placed: annotationIsPlaced(draft, annotation) }));
    draft.status = 'draft';
  } else if (action.type === 'poem-note' && state.phase === 'editor') { draft.note = String(value).slice(0, 600); draft.status = 'draft'; }
  else if (action.type === 'poem-theme' && state.phase === 'editor' && ['A garden morning', 'A library journey', 'A rainy afternoon'].includes(value)) draft.theme = value;
  else if (action.type === 'poem-stanza' && Number.isInteger(value) && value >= 0 && value < 4) draft.stanza = value;
  else if (action.type === 'annotate' && state.phase === 'editor') {
    const annotation = { device: value.device, line: value.line, start: value.start, end: value.end, quote: draft.lines[value.line]?.slice(value.start, value.end), placed: true };
    if (!annotationIsPlaced(draft, annotation)) return { ...state, feedback: 'Select some words in a poem line, then mark the intended device.', feedbackKind: 'info' };
    draft.annotations = draft.annotations.filter(old => !(old.device === annotation.device && (!annotationIsPlaced(draft, old) || old.line === annotation.line && old.start === annotation.start && old.end === annotation.end)));
    draft.annotations.push(annotation); draft.status = 'draft';
  } else if (action.type === 'remove-annotation' && state.phase === 'editor') draft.annotations = draft.annotations.filter((_, index) => index !== value);
  else if (action.type === 'review-poem' && state.phase === 'editor') {
    const issues = poemSubmissionIssues(draft);
    if (issues.length) return { ...state, feedback: issues.join(' '), feedbackKind: 'info' };
    return { ...state, draft, phase: 'review', feedback: '', feedbackKind: 'info' };
  } else if (action.type === 'submit-poem' && state.phase === 'review') {
    const issues = poemSubmissionIssues(draft);
    if (issues.length) return { ...state, phase: 'editor', feedback: issues.join(' '), feedbackKind: 'info' };
    return { ...state, phase: 'result', draft: { ...draft, status: 'submitted' }, feedback: 'Poem submitted. Teacher review pending.', feedbackKind: 'success' };
  } else return state;
  return { ...state, draft, feedback: '', feedbackKind: 'info' };
}

export function buildPoemReport(state) {
  const accuracy = englishAccuracy(state);
  const draft = state.draft;
  const body = [
    'LUMORA - POETRY LANTERN FESTIVAL', `Theme: ${draft.theme}`, `Status: ${draft.status === 'submitted' ? 'Submitted - teacher review pending' : 'Draft'}`,
    `Model analysis: ${accuracy.correct}/${accuracy.total} independent checkpoints`, '',
  ];
  for (let stanza = 0; stanza < 4; stanza++) body.push(`Stanza ${stanza + 1}`, ...draft.lines.slice(stanza * 3, stanza * 3 + 3), '');
  body.push('INTENDED SOUND EFFECTS (learner annotations, not automatic judgments)');
  for (const annotation of draft.annotations) body.push(`${annotation.device} - line ${annotation.line + 1}: "${annotation.quote}"${annotationIsPlaced(draft, annotation) ? '' : ' [unplaced after edit]'}`);
  body.push('', 'WRITER NOTE', draft.note, '', `Support used: ${state.assistance.join(', ') || 'None recorded'}`, 'Literary quality: human review pending.');
  return body.join('\n');
}
