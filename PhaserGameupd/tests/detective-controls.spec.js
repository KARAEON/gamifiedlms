import { test, expect } from '@playwright/test';
import { ready, clickGame, startFromMenu } from './helpers/intro.js';

test('detective preserves selection through help and settings without pause or hints', async ({ page }, testInfo) => {
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
  await clickGame(page, 790, 660);
  await page.waitForFunction(() => window.__TEST__.openModal === 'minigame-info-mixture-detective');
  await clickGame(page, 535, 527);
  await ready(page, 'MixtureDetectiveScene');
  const state = () => page.evaluate(() => window.__TEST__.state());
  const initial = await state();
  const correct = initial.detectiveOptions.find(option => option.correct);
  await clickGame(page, correct.x, correct.y);
  expect((await state()).score).toBe(0);
  expect((await state()).detectiveSelectedOption).toBe(correct.id);

  for (const kind of ['help', 'settings']) {
    const before = await state();
    const button = kind === 'help' ? before.minigameHelpButton : before.detectiveControls[kind];
    await clickGame(page, button.x, button.y);
    await expect.poll(async () => (await state()).openModal).toBe(kind === 'help' ? 'minigame-help' : `detective-${kind}`);
    const frozenTime = (await state()).timeRemaining;
    await page.waitForTimeout(1100);
    expect((await state()).timeRemaining).toBe(frozenTime);
    await clickGame(page, 1050, 453);
    expect((await state()).score).toBe(0);
    await page.keyboard.press('Escape');
    await expect.poll(async () => (await state()).openModal).toBe(null);
    expect((await state()).detectiveSelectedOption).toBe(correct.id);
    expect((await state()).sceneKey).toBe('MixtureDetectiveScene');
  }
  expect((await state()).detectiveControls.pause).toBeUndefined();
  expect((await state()).detectiveControls.hint).toBeUndefined();
  const runningTime = (await state()).timeRemaining;
  await page.keyboard.press('P');
  await page.waitForTimeout(1100);
  expect((await state()).openModal).toBe(null);
  expect((await state()).timeRemaining).toBeLessThan(runningTime);
  const submit = (await state()).detectiveSubmitButton;
  await clickGame(page, submit.x, submit.y);
  await expect.poll(async () => (await state()).detectivePhase).toBe('feedback');
  expect((await state()).score).toBe(10);
  expect((await state()).detectiveStreak).toBe(1);
  await page.screenshot({ path: testInfo.outputPath('detective-feedback.png') });
  const next = (await state()).detectiveNextButton;
  await clickGame(page, next.x, next.y);
  await expect.poll(async () => (await state()).detectiveRoundIndex).toBe(1);
  const second = await state();
  const wrong = second.detectiveOptions.find(option => !option.correct);
  await clickGame(page, wrong.x, wrong.y);
  await clickGame(page, second.detectiveSubmitButton.x, second.detectiveSubmitButton.y);
  await expect.poll(async () => (await state()).detectiveMistakes).toBe(1);
  expect((await state()).detectiveStreak).toBe(0);
  const right = second.detectiveOptions.find(option => option.correct);
  await clickGame(page, right.x, right.y);
  await clickGame(page, second.detectiveSubmitButton.x, second.detectiveSubmitButton.y);
  await expect.poll(async () => (await state()).detectivePhase).toBe('feedback');
  expect((await state()).detectiveStreak).toBe(1);
  await page.screenshot({ path: testInfo.outputPath('detective-lemonade-salad.png') });
  for (let round = 2; round <= 4; round++) {
    const nextButton = (await state()).detectiveNextButton;
    await clickGame(page, nextButton.x, nextButton.y);
    await expect.poll(async () => (await state()).detectiveRoundIndex).toBe(round);
    const current = await state();
    const answer = current.detectiveOptions.find(option => option.correct);
    await clickGame(page, answer.x, answer.y);
    if (round === 4) {
      await page.screenshot({ path: testInfo.outputPath('detective-long-answers.png') });
      break;
    }
    await clickGame(page, current.detectiveSubmitButton.x, current.detectiveSubmitButton.y);
    await expect.poll(async () => (await state()).detectivePhase).toBe('feedback');
  }
  expect(errors).toEqual([]);
});
