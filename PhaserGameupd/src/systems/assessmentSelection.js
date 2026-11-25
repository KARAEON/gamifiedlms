const previousSelections = new Map();

function shuffle(values, random) {
  const items = [...values];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [items[index], items[other]] = [items[other], items[index]];
  }
  return items;
}

export function selectAssessmentItems(lessonId, assessment, random = Math.random) {
  const items = shuffle(assessment.items, random);

  const count = Math.min(assessment.itemsPerAttempt ?? items.length, items.length);
  const selected = items.slice(0, count);
  const previous = previousSelections.get(lessonId);
  if (previous && selected.map((item) => item.id).join('|') === previous.join('|')) {
    if (items.length > count) {
      selected[count - 1] = items[count];
    } else if (count > 1) {
      [selected[0], selected[1]] = [selected[1], selected[0]];
    }
  }
  previousSelections.set(lessonId, selected.map((item) => item.id));

  return {
    ...assessment,
    items: selected.map((item) => ({ ...item, choices: shuffle(item.choices ?? [], random) })),
  };
}
