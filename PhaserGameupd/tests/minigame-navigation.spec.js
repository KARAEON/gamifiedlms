import { test, expect } from '@playwright/test';
import { ready, clickGame, startFromMenu } from './helpers/intro.js';

test('five minigames share navigation positions and preserve play through help and settings', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/?test=1');
  await ready(page, 'MenuScene');
  await startFromMenu(page);
  await clickGame(page, 200, 515);
  await clickGame(page, 200, 515);
  await ready(page, 'IslandMapScene');
  await clickGame(page, 620, 524);
  await ready(page, 'QuarterDetailScene');
  const state = () => page.evaluate(() => window.__TEST__.state());
  const lessons = [
    ['MixMatchScene', 760, 500, 0, 'mix-settings'],
    ['SupplyCartScene', 640, 580, 0, 'supply-settings'],
    ['MixtureDetectiveScene', 790, 660, 0, 'detective-settings'],
    ['ScienceCourtScene', 670, 570, 170, 'court-settings'],
    ['InventMixScene', 820, 650, 170, 'invent-settings'],
  ];
  let sharedControls;
  for (const [index, [scene, x, y, scroll, settingsModal]] of lessons.entries()) {
    await page.evaluate(value => window.__TEST__.commands.setQuarterScrollY(value), scroll);
    await clickGame(page, x, y);
    await page.waitForFunction(() => window.__TEST__.openModal?.startsWith('minigame-info-'));
    await clickGame(page, 535, 527);
    await ready(page, scene);
    const initial = await state();
    if (index === 0) sharedControls = initial.minigameControls;
    expect(initial.minigameControls).toEqual(sharedControls);
    expect(initial.minigameControls.back).toMatchObject({ x: 46, y: 678 });
    expect(initial.minigameControls.help).toMatchObject({ x: 1135, y: 37 });
    expect(initial.minigameControls.settings).toMatchObject({ x: 1209, y: 37 });
    await page.screenshot({ path: testInfo.outputPath(`minigame-${index + 1}-navigation.png`) });
    if (index === 0) await clickGame(page, initial.mixMatchCards[0].x, initial.mixMatchCards[0].y);
    if (index === 2) await clickGame(page, initial.detectiveOptions[0].x, initial.detectiveOptions[0].y);
    if (index === 3) await clickGame(page, initial.courtClassificationOptions[0].x, initial.courtClassificationOptions[0].y);
    if (index === 4) await clickGame(page, initial.inventIngredientOptions[0].x, initial.inventIngredientOptions[0].y);
    const selection = current => ({
      flipped: current.flippedCount,
      activeSupply: current.activeItemId,
      answer: current.detectiveSelectedOption,
      classification: current.courtSelectedClassification,
      ingredients: current.inventSelectedIngredients,
      score: current.score,
    });
    for (const kind of ['help', 'settings']) {
      const before = await state();
      const button = before.minigameControls[kind];
      await clickGame(page, button.x, button.y);
      await expect.poll(async () => (await state()).openModal).toBe(kind === 'help' ? 'minigame-help' : settingsModal);
      const frozenTime = (await state()).timeRemaining;
      // Cross a timer tick to verify time is stopped in both overlays.
      if (index < 3) {
        await page.waitForTimeout(1100);
        expect((await state()).timeRemaining).toBe(frozenTime);
      }
      if (kind === 'help') await page.screenshot({ path: testInfo.outputPath(`minigame-${index + 1}-illustrated-help.png`) });
      if (kind === 'help') await clickGame(page, 640, 611);
      else await page.keyboard.press('Escape');
      await expect.poll(async () => (await state()).openModal).toBe(null);
      expect((await state()).sceneKey).toBe(scene);
      expect(selection(await state())).toEqual(selection(before));
    }
    await clickGame(page, sharedControls.back.x, sharedControls.back.y);
    await ready(page, 'QuarterDetailScene');
  }
  expect(errors).toEqual([]);
});
