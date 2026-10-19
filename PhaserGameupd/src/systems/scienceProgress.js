export const SCIENCE_SAVE_KEY = 'lumify-science-q1-v1';

export function readScienceProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(SCIENCE_SAVE_KEY) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}
