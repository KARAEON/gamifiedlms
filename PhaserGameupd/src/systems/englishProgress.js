import { ENGLISH_DRAFT_KEY, ENGLISH_PROGRESS_KEY, englishAccuracy } from '../games/english/englishLogic.js';

function read(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}
export const readEnglishProgress = () => read(ENGLISH_PROGRESS_KEY);
export const readEnglishDraft = () => read(ENGLISH_DRAFT_KEY);
export function persistEnglishDraft(draft) {
  try { localStorage.setItem(ENGLISH_DRAFT_KEY, JSON.stringify(draft)); return true; } catch { return false; }
}
export function persistEnglishResult(game, state) {
  const accuracy = englishAccuracy(state);
  const progress = readEnglishProgress();
  const previous = progress[game.lessonId];
  progress[game.lessonId] = {
    completed: true, bestAccuracy: Math.max(previous?.bestAccuracy ?? 0, accuracy.percent),
    lastAccuracy: accuracy, attempts: (previous?.attempts ?? 0) + 1,
    hints: state.hintCount, workedExamples: state.solutionCount, assistance: state.assistance,
    status: game.kind === 'festival' ? 'submitted-review-pending' : 'completed',
    records: state.records,
  };
  try { localStorage.setItem(ENGLISH_PROGRESS_KEY, JSON.stringify(progress)); return true; } catch { return false; }
}
