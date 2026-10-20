import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { clickGame, ready, startFromMenu } from './helpers/intro.js';

test.use({ trace: 'off' });
const state = page => page.evaluate(() => window.__TEST__.state());
async function control(page, id) {
  const s = await state(page), target = s.science.controls.find(c => c.id === id);
  expect(target, `Missing control ${id}`).toBeTruthy();
  await clickGame(page, target.x, target.y);
}
async function dragMagnet(page, x, y) {
  const s = await state(page), target = s.science.controls.find(c => c.id === 'magnet-drag');
  const box = await page.locator('canvas').boundingBox();
  const point = (px, py) => [box.x + px * box.width / 1280, box.y + py * box.height / 720];
  await page.mouse.move(...point(target.x, target.y));
  await page.mouse.down();
  await page.mouse.move(...point(x, y), { steps: 14 });
  await page.mouse.up();
}

test('Magnet workshop preserves controls, magnetic separation, retries and saved progress', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const screenshots = `screenshots/magnet-workshop/${testInfo.project.name}`;
  await mkdir(screenshots, { recursive: true });
  await page.goto('/?test=1'); await ready(page, 'MenuScene'); await startFromMenu(page);
  await clickGame(page, 200, 515); await clickGame(page, 200, 515); await ready(page, 'IslandMapScene');
  await clickGame(page, 620, 524); await ready(page, 'QuarterDetailScene');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(700));
  await clickGame(page, 520, 340); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).minigameId).toBe('science-magnet');
  const nav = (await state(page)).minigameControls;
  expect(nav.back).toMatchObject({ x: 46, y: 678 });
  expect(nav.help).toMatchObject({ x: 1135, y: 37 });
  expect(nav.settings).toMatchObject({ x: 1209, y: 37 });
  await page.screenshot({ path: `${screenshots}/initial.png` });

  for (const [name, modal] of [['help', 'minigame-help'], ['settings', 'science-settings']]) {
    const before = (await state(page)).science.state;
    await clickGame(page, nav[name].x, nav[name].y);
    await expect.poll(async () => (await state(page)).openModal).toBe(modal);
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('Space');
    expect((await state(page)).science.state).toEqual(before);
    if (name === 'help') await page.screenshot({ path: `${screenshots}/how-to-play.png` });
    await page.keyboard.press('Escape');
    await expect.poll(async () => (await state(page)).openModal).toBe(null);
  }
  await control(page, 'check');
  expect((await state(page)).science.phase).toBe('playing');
  expect((await state(page)).score).toBe(0);
  await control(page, 'reset');
  for (let round = 0; round < 3; round++) {
    await control(page, 'material-1'); // Wood stays behind.
    await control(page, 'material-2'); // Stone or copper stays behind.
    expect((await state(page)).science.state.held).toEqual([]);
    const nail = (await state(page)).science.controls.find(c => c.id === 'material-0');
    await dragMagnet(page, nail.x, nail.y);
    expect((await state(page)).science.state.held).toContain(0);
    const before = (await state(page)).science.state.magnet;
    await page.keyboard.press('ArrowUp');
    expect((await state(page)).science.state.magnet.y).toBe(before.y - 25);
    await page.keyboard.press('Space');
    expect((await state(page)).science.state.recovered).toEqual([0]);
    await control(page, 'material-3');
    if (round === 1) {
      await dragMagnet(page, 690, 250);
      await page.screenshot({ path: `${screenshots}/copper-challenge.png` });
    }
    await control(page, 'material-6'); await control(page, 'release');
    expect((await state(page)).science.state.recovered.slice().sort()).toEqual([0, 3, 6]);
    await control(page, 'check');
    expect((await state(page)).science.phase).toBe(round === 2 ? 'finished' : 'complete');
    expect((await state(page)).score).toBe(25 * (round + 1));
    if (round === 0) {
      await control(page, 'retry');
      expect((await state(page)).score).toBe(0);
      expect((await state(page)).science.state.recovered).toEqual([]);
      for (const id of [0, 3, 6]) await control(page, `material-${id}`);
      await control(page, 'release'); await control(page, 'check');
      expect((await state(page)).score).toBe(25);
    }
    if (round === 2) await page.screenshot({ path: `${screenshots}/completed.png` });
    await control(page, 'next');
  }
  await ready(page, 'QuarterDetailScene');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('lumify-science-q1-v1')));
  expect(saved['q1-m2-l1'].completed).toBe(true);
  expect(saved['q1-m2-l1'].bestScore).toBe(75);

  // Returning to the lesson map must leave the next activity accessible.
  await clickGame(page, 650, 420); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.kind).toBe('sieve');
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  expect(errors).toEqual([]);
});
