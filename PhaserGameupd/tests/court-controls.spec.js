import { test, expect } from '@playwright/test';
import { ready, clickGame, startFromMenu } from './helpers/intro.js';

test('court defense fields and overlays preserve the active case', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?test=1');
  await ready(page, 'MenuScene');
  await startFromMenu(page);
  await clickGame(page, 200, 515);
  await clickGame(page, 200, 515);
  await ready(page, 'IslandMapScene');
  await clickGame(page, 620, 524);
  await ready(page, 'QuarterDetailScene');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(170));
  await clickGame(page, 670, 570);
  await page.waitForFunction(() => window.__TEST__.openModal === 'minigame-info-science-court');
  await clickGame(page, 535, 527);
  await ready(page, 'ScienceCourtScene');
  const state = () => page.evaluate(() => window.__TEST__.state());
  const initial = await state();
  expect(initial.courtControls.caseFiles).toBeUndefined();
  const type = initial.courtClassificationOptions.find(option => option.correct);
  await clickGame(page, type.x, type.y);
  for (const evidence of [initial.courtEvidenceOptions.find(option => option.correct), initial.courtEvidenceOptions.find(option => !option.correct)]) {
    await clickGame(page, evidence.x, evidence.y);
  }
  await clickGame(page, initial.courtSubmitButton.x, initial.courtSubmitButton.y);
  await expect.poll(async () => (await state()).courtVerdict).toBe('partial');
  const partial = await state();
  expect(partial.courtNextButton.y).toBe(partial.courtRetryButton.y);
  expect(partial.courtNextButton.y).toBeLessThan(649);
  await page.screenshot({ path: testInfo.outputPath('court-partial.png') });
  await clickGame(page, partial.courtRetryButton.x, partial.courtRetryButton.y);
  await expect.poll(async () => (await state()).courtPhase).toBe('defense');
  await clickGame(page, initial.courtDefenseFields.type.x, initial.courtDefenseFields.type.y);
  await expect.poll(async () => (await state()).openModal).toBe('court-choice');
  await clickGame(page, 640, 285);
  await expect.poll(async () => (await state()).courtSelectedClassification).toBe('nonuniform');
  for (const [field, y] of [['first', 245], ['second', 285]]) {
    await clickGame(page, initial.courtDefenseFields[field].x, initial.courtDefenseFields[field].y);
    await expect.poll(async () => (await state()).openModal).toBe('court-choice');
    await clickGame(page, 640, y);
    await expect.poll(async () => (await state()).openModal).toBe(null);
  }
  expect((await state()).courtSelectedEvidence).toEqual(['visible-parts', 'not-evenly-mixed']);
  const extra = (await state()).courtEvidenceOptions.find(option => !option.correct);
  await clickGame(page, extra.x, extra.y);
  expect((await state()).courtSelectedEvidence).toHaveLength(2);

  for (const [kind, modal] of [['settings', 'court-settings'], ['help', 'minigame-help']]) {
    const before = await state();
    const button = kind === 'help' ? before.minigameHelpButton : before.courtControls[kind];
    await clickGame(page, button.x, button.y);
    await expect.poll(async () => (await state()).openModal).toBe(modal);
    await page.keyboard.press('Escape');
    await expect.poll(async () => (await state()).openModal).toBe(null);
    expect((await state()).courtSelectedEvidence).toEqual(before.courtSelectedEvidence);
    expect((await state()).courtSelectedClassification).toBe('nonuniform');
  }
  const submit = (await state()).courtSubmitButton;
  await clickGame(page, submit.x, submit.y);
  await expect.poll(async () => (await state()).courtVerdict).toBe('accepted');
  expect((await state()).openModal).toBe(null);
  await page.screenshot({ path: testInfo.outputPath('court-accepted.png') });
  for (let index = 1; index <= 4; index++) {
    const next = (await state()).courtNextButton;
    await clickGame(page, next.x, next.y);
    await expect.poll(async () => (await state()).courtCaseIndex).toBe(index);
    const current = await state();
    const classification = current.courtClassificationOptions.find(option => option.correct);
    await clickGame(page, classification.x, classification.y);
    for (const evidence of current.courtEvidenceOptions.filter(option => option.correct)) await clickGame(page, evidence.x, evidence.y);
    const submitButton = (await state()).courtSubmitButton;
    await clickGame(page, submitButton.x, submitButton.y);
    await expect.poll(async () => (await state()).courtVerdict).toBe('accepted');
    if (index === 3) await page.screenshot({ path: testInfo.outputPath('court-three-evidence.png') });
  }
  expect((await state()).courtTotalScore).toBe(100);
  await page.screenshot({ path: testInfo.outputPath('court-shampoo-reference.png') });
  expect(errors).toEqual([]);
});
