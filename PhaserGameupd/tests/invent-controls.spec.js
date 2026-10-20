import { test, expect } from '@playwright/test';
import { ready, clickGame, startFromMenu } from './helpers/intro.js';

test('workshop drag, name, dropdowns and overlays preserve the invention', async ({ page }, testInfo) => {
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
  await clickGame(page, 820, 650);
  await page.waitForFunction(() => window.__TEST__.openModal === 'minigame-info-invent-a-mix-workshop');
  await clickGame(page, 535, 527);
  await ready(page, 'InventMixScene');
  const state = () => page.evaluate(() => window.__TEST__.state());
  const initial = await state();
  expect(initial.inventIngredientOptions).toHaveLength(12);
  await clickGame(page, initial.inventPresentButton.x, initial.inventPresentButton.y);
  expect((await state()).inventPhase).toBe('choose');

  await clickGame(page, initial.inventNameField.x, initial.inventNameField.y);
  const help = (await state()).minigameHelpButton;
  await clickGame(page, help.x, help.y);
  await expect.poll(async () => (await state()).openModal).toBe('minigame-help');
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await state()).openModal).toBe(null);
  expect((await state()).inventNameInputActive).toBe(true);
  await page.keyboard.type('A'.repeat(40));
  expect((await state()).inventCustomName).toHaveLength(25);
  await page.keyboard.press('Backspace');
  expect((await state()).inventCustomName).toHaveLength(24);
  for (let index = 0; index < 24; index++) await page.keyboard.press('Backspace');
  await page.keyboard.type('Energy Juice');
  await page.keyboard.press('Enter');

  const water = initial.inventIngredientOptions.find(option => option.id === 'water');
  const box = await page.locator('canvas').boundingBox();
  const px = x => box.x + x * box.width / 1280;
  const py = y => box.y + y * box.height / 720;
  await page.mouse.move(px(water.x), py(water.y));
  await page.mouse.down();
  await page.mouse.move(px(603), py(285), { steps: 15 });
  await page.mouse.up();
  await expect.poll(async () => (await state()).inventSelectedIngredients).toEqual(['water']);
  for (const id of ['powdered-juice', 'milk', 'sugar']) {
    const option = (await state()).inventIngredientOptions.find(option => option.id === id);
    await clickGame(page, option.x, option.y);
  }
  expect((await state()).inventSelectedIngredients).toEqual(['water', 'powdered-juice', 'milk']);
  const milk = (await state()).inventIngredientOptions.find(option => option.id === 'milk');
  await clickGame(page, milk.x, milk.y);
  const mix = (await state()).inventMixButton;
  await clickGame(page, mix.x, mix.y);
  await expect.poll(async () => (await state()).inventPhase).toBe('mixed');
  const type = (await state()).inventClassificationOptions.find(option => option.correct);
  await clickGame(page, type.x, type.y);

  const appearanceField = (await state()).inventDescriptionFields.appearance;
  await clickGame(page, appearanceField.x, appearanceField.y);
  await expect.poll(async () => (await state()).openModal).toBe('invent-choice');
  await page.keyboard.press('Escape');
  expect((await state()).inventSelectedAppearance).toBe(null);
  for (const kind of ['appearance', 'use']) {
    const current = await state();
    const field = current.inventDescriptionFields[kind];
    await clickGame(page, field.x, field.y);
    await expect.poll(async () => (await state()).openModal).toBe('invent-choice');
    const options = kind === 'appearance' ? current.inventAppearanceOptions : current.inventUseOptions;
    const option = options.find(option => option.correct);
    await clickGame(page, option.x, option.y);
    await expect.poll(async () => (await state()).openModal).toBe(null);
  }
  for (const kind of ['settings', 'help']) {
    const before = await state();
    const button = kind === 'help' ? before.minigameHelpButton : before.inventControls.settings;
    await clickGame(page, button.x, button.y);
    await expect.poll(async () => (await state()).openModal).toBe(kind === 'help' ? 'minigame-help' : 'invent-settings');
    await page.keyboard.press('Escape');
    await expect.poll(async () => (await state()).openModal).toBe(null);
    expect((await state()).inventSelectedIngredients).toEqual(before.inventSelectedIngredients);
    expect((await state()).inventSelectedUse).toBe(before.inventSelectedUse);
  }
  const present = (await state()).inventPresentButton;
  await clickGame(page, present.x, present.y);
  await expect.poll(async () => (await state()).inventResult).toBe('perfect');
  expect((await state()).inventMissionScore).toBe(45);
  expect((await state()).openModal).toBe(null);
  await page.screenshot({ path: testInfo.outputPath('workshop-reference.png') });
  const settings = (await state()).inventControls.settings;
  await clickGame(page, settings.x, settings.y);
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await state()).openModal).toBe(null);
  expect((await state()).inventResult).toBe('perfect');
  expect(errors).toEqual([]);
});
