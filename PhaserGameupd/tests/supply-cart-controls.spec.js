import { expect, test } from '@playwright/test';
import { clickGame, ready, startFromMenu } from './helpers/intro.js';

test('supply cart keeps hints and settings without a pause control', async ({ page }, testInfo) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  const state = () => page.evaluate(() => window.__TEST__.state());
  await page.goto('/?test=1');
  await ready(page, 'MenuScene');
  await startFromMenu(page);
  await clickGame(page, 200, 515);
  await clickGame(page, 200, 515);
  await ready(page, 'IslandMapScene');
  await clickGame(page, 620, 524);
  await ready(page, 'QuarterDetailScene');
  await clickGame(page, 640, 580);
  await expect.poll(async () => (await state()).openModal).toBe('minigame-info-supply-cart-sorting');
  await clickGame(page, 535, 527);
  await ready(page, 'SupplyCartScene');
  expect((await state()).totalItemCount).toBe(12);
  await page.screenshot({ path: testInfo.outputPath('supply-reference-initial.png') });

  const help = (await state()).minigameHelpButton;
  await clickGame(page, help.x, help.y);
  await expect.poll(async () => (await state()).minigameHelpOpen).toBe(true);
  const studyTime = (await state()).timeRemaining;
  await page.waitForTimeout(1200);
  expect((await state()).timeRemaining).toBe(studyTime);
  await page.screenshot({ path: testInfo.outputPath('supply-how-to-play.png') });
  await clickGame(page, 640, 611);
  await expect.poll(async () => (await state()).minigameHelpOpen).toBe(false);
  expect((await state()).sceneKey).toBe('SupplyCartScene');

  const { hint, settings } = (await state()).supplyControls;
  expect((await state()).supplyControls.pause).toBeUndefined();
  const runningTime = (await state()).timeRemaining;
  await page.keyboard.press('P');
  await page.waitForTimeout(1100);
  expect((await state()).openModal).toBe(null);
  expect((await state()).timeRemaining).toBeLessThan(runningTime);

  await clickGame(page, hint.x, hint.y);
  await expect.poll(async () => (await state()).openModal).toBe('supply-hint');
  expect((await state()).hintsRemaining).toBe(2);
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await state()).paused).toBe(false);

  for (let index = 0; index < 12; index += 1) {
    const current = await state();
    const item = current.supplyCartItems.find((entry) => entry.id === current.activeItemId);
    const bin = current.supplyCartBins.find((entry) => entry.id === item.type);
    await clickGame(page, item.x, item.y + 34);
    await clickGame(page, bin.x, bin.y);
    await expect.poll(async () => (await state()).activeUseItemId).toBe(item.id);
    if (index === 2) {
      await page.screenshot({ path: testInfo.outputPath('supply-reference-fruit-use.png') });
      await clickGame(page, settings.x, settings.y);
      await expect.poll(async () => (await state()).openModal).toBe('supply-settings');
      expect((await state()).activeUseItemId).toBe(item.id);
      await page.keyboard.press('Escape');
      await expect.poll(async () => (await state()).paused).toBe(false);
      expect((await state()).usePanelOpen).toBe(true);
    }
    const choice = (await state()).useChoices.find((entry) => entry.correct);
    await clickGame(page, choice.x, choice.y);
    await expect.poll(async () => (await state()).completedItemCount).toBe(index + 1);
    expect((await state()).score).toBe((index + 1) * 15);
  }
  expect((await state()).combo).toBe(12);
  expect((await state()).gameResult).toBe('win');
  expect(errors).toEqual([]);
});
