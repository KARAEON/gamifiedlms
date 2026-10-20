import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { clickGame, ready, startFromMenu } from './helpers/intro.js';

test.use({ trace: 'off' });
const state = page => page.evaluate(() => window.__TEST__.state());
async function control(page, id) {
  const button = (await state(page)).science.controls.find(c => c.id === id);
  expect(button, `Missing ${id}`).toBeTruthy();
  await clickGame(page, button.x, button.y);
}
async function opening(page, target) {
  let current = (await state(page)).science.state.opening;
  while (current !== target) {
    await control(page, current > target ? 'opening-less' : 'opening-more');
    const next = (await state(page)).science.state.opening;
    expect(next).toBe(current + (current > target ? -1 : 1));
    current = next;
  }
}

test('Sieve Gate shows both outputs and keeps its illustrated example in Help', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const screenshots = `screenshots/sieve-workshop/${testInfo.project.name}`;
  await mkdir(screenshots, { recursive: true });
  await page.goto('/?test=1'); await ready(page, 'MenuScene'); await startFromMenu(page);
  await clickGame(page, 200, 515); await clickGame(page, 200, 515); await ready(page, 'IslandMapScene');
  await clickGame(page, 620, 524); await ready(page, 'QuarterDetailScene');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(700));
  await clickGame(page, 650, 420); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).minigameId).toBe('science-sieve');
  const nav = (await state(page)).minigameControls;
  expect(nav.back).toMatchObject({ x: 46, y: 678 });
  expect(nav.help).toMatchObject({ x: 1135, y: 37 });
  expect(nav.settings).toMatchObject({ x: 1209, y: 37 });
  await page.screenshot({ path: `${screenshots}/initial.png` });
  for (const [name, modal] of [['help', 'minigame-help'], ['settings', 'science-settings']]) {
    const before = (await state(page)).science.state;
    await clickGame(page, nav[name].x, nav[name].y);
    await expect.poll(async () => (await state(page)).openModal).toBe(modal);
    if (name === 'help') {
      await page.screenshot({ path: `${screenshots}/how-to-play.png` });
      await control(page, 'opening-less');
      expect((await state(page)).science.state).toEqual(before);
      await clickGame(page, 640, 611);
    } else await page.keyboard.press('Escape');
    await expect.poll(async () => (await state(page)).openModal).toBe(null);
    expect((await state(page)).science.state).toEqual(before);
  }

  await control(page, 'run'); // Oversized mesh passes both materials.
  expect((await state(page)).science.state.run).toEqual({ sandPasses: true, stonesPass: true });
  await control(page, 'check');
  expect((await state(page)).science.phase).toBe('playing');
  expect((await state(page)).score).toBe(0);
  await page.screenshot({ path: `${screenshots}/opening-too-large.png` });
  await opening(page, 1);
  expect((await state(page)).science.state.run).toBe(null); // Output clears when mesh changes.
  await control(page, 'opening-less');
  expect((await state(page)).science.state.opening).toBe(1);
  await control(page, 'run');
  expect((await state(page)).science.state.run).toEqual({ sandPasses: false, stonesPass: false });
  await page.screenshot({ path: `${screenshots}/opening-too-small.png` });
  await control(page, 'reset');
  expect((await state(page)).science.state.opening).toBe(9);

  for (let round = 0; round < 3; round++) {
    await opening(page, 4 + round); await control(page, 'run');
    expect((await state(page)).science.state.run).toEqual({ sandPasses: true, stonesPass: false });
    if (round === 0) {
      await page.screenshot({ path: `${screenshots}/separated.png` });
      const before = (await state(page)).science.state;
      await clickGame(page, nav.help.x, nav.help.y);
      await page.keyboard.press('Escape');
      expect((await state(page)).science.state).toEqual(before);
    }
    await control(page, 'check');
    expect((await state(page)).science.phase).toBe(round === 2 ? 'finished' : 'complete');
    expect((await state(page)).score).toBe((round + 1) * 25);
    if (round === 0) {
      await control(page, 'retry');
      expect((await state(page)).score).toBe(0);
      await opening(page, 4); await control(page, 'run'); await control(page, 'check');
      expect((await state(page)).score).toBe(25);
    }
    if (round === 2) await page.screenshot({ path: `${screenshots}/completed.png` });
    await control(page, 'next');
  }
  await ready(page, 'QuarterDetailScene');
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('lumify-science-q1-v1')));
  expect(progress['q1-m2-l2']).toMatchObject({ completed: true, bestScore: 75 });
  await clickGame(page, 650, 420); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.state).toMatchObject({ opening: 9, run: null });
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  // The next separation game retains its existing interface and navigation.
  await clickGame(page, 490, 500); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.kind).toBe('filter');
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  expect(errors).toEqual([]);
});
