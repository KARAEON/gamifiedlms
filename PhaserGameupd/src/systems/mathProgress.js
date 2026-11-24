import { MATH_PROGRESS_KEY, mathAccuracy } from '../games/math/mathLogic.js';
export function readMathProgress() {
  try { const value = JSON.parse(localStorage.getItem(MATH_PROGRESS_KEY) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch { return {}; }
}
export function persistMathResult(game, state) {
  const progress = readMathProgress(), previous = progress[game.lessonId], accuracy = mathAccuracy(state);
  progress[game.lessonId] = { completed: true, bestAccuracy: Math.max(previous?.bestAccuracy ?? 0, accuracy.percent), lastAccuracy: accuracy, attempts: (previous?.attempts ?? 0) + 1, hints: state.hintCount, workedExamples: state.solutionCount, assistance: state.assistance, records: state.records };
  try { localStorage.setItem(MATH_PROGRESS_KEY, JSON.stringify(progress)); return true; } catch { return false; }
}
