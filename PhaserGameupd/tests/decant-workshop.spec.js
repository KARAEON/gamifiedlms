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
async function prepare(page, angle = 20) {
  await control(page, 'settle'); await control(page, 'settle');
  for (let i = 0; i < angle / 10; i++) await control(page, 'angle-more');
}
async function pour(page, count) {
  for (let i = 0; i < count; i++) await control(page, 'pour');
}

test('Steady Pour settles the source, shows transfer and rejects sediment contamination', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const screenshots = `screenshots/decant-workshop/${testInfo.project.name}`;
  await mkdir(screenshots, { recursive: true });
  await page.goto('/?test=1'); await ready(page, 'MenuScene'); await startFromMenu(page);
  await clickGame(page, 200, 515); await clickGame(page, 200, 515); await ready(page, 'IslandMapScene');
  await clickGame(page, 620, 524); await ready(page, 'QuarterDetailScene');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(700));
  await clickGame(page, 460, 660); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).minigameId).toBe('science-decant');
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
      await control(page, 'settle'); // Outside the modal close button.
      expect((await state(page)).science.state).toEqual(before);
      await clickGame(page, 640, 611);
    } else await page.keyboard.press('Escape');
    await expect.poll(async () => (await state(page)).openModal).toBe(null);
    expect((await state(page)).science.state).toEqual(before);
  }
  await control(page, 'angle-less'); await control(page, 'pour');
  expect((await state(page)).science.state).toMatchObject({ angle: 0, collected: 0, remaining: 100 });
  expect((await state(page)).science.state.message).toContain('Tilt');
  await control(page, 'angle-more'); await control(page, 'pour'); await control(page, 'check');
  expect((await state(page)).science.state).toMatchObject({ sediment: 1, collected: 20, remaining: 80 });
  expect((await state(page)).science.phase).toBe('playing');
  await control(page, 'settle'); expect((await state(page)).science.state.settled).toBe(0);
  await page.screenshot({ path: `${screenshots}/unsettled-pour.png` });
  await control(page, 'reset'); await prepare(page, 50);
  await control(page, 'angle-more'); expect((await state(page)).science.state.angle).toBe(50);
  await control(page, 'pour'); await control(page, 'check');
  expect((await state(page)).science.state.sediment).toBe(1);
  await page.screenshot({ path: `${screenshots}/steep-pour.png` });
  await control(page, 'reset'); await prepare(page); await pour(page, 5); await control(page, 'check');
  expect((await state(page)).science.state).toMatchObject({ collected: 100, remaining: 0, sediment: 1 });
  await control(page, 'pour'); expect((await state(page)).science.state.collected).toBe(100);
  expect((await state(page)).science.phase).toBe('playing');
  await page.screenshot({ path: `${screenshots}/overpour.png` });
  await control(page, 'reset');

  for (let round = 0; round < 3; round++) {
    await prepare(page, [20, 10, 30][round]);
    if (round === 0) {
      await control(page, 'settle'); await control(page, 'settle');
      expect((await state(page)).science.state.settled).toBe(3);
      await pour(page, 2);
      expect((await state(page)).science.state).toMatchObject({ collected: 40, remaining: 60, sediment: 0 });
      await page.screenshot({ path: `${screenshots}/gentle-pour.png` });
      const before = (await state(page)).science.state;
      await clickGame(page, nav.help.x, nav.help.y); await page.keyboard.press('Escape');
      expect((await state(page)).science.state).toEqual(before);
      await control(page, 'pour');
    } else await pour(page, round === 2 ? 4 : 3);
    expect((await state(page)).science.state.remaining + (await state(page)).science.state.collected).toBe(100);
    expect((await state(page)).science.state.sediment).toBe(0);
    await control(page, 'check');
    expect((await state(page)).science.phase).toBe(round === 2 ? 'finished' : 'complete');
    expect((await state(page)).score).toBe((round + 1) * 25);
    if (round === 0) {
      await page.screenshot({ path: `${screenshots}/separated.png` });
      await control(page, 'retry'); expect((await state(page)).score).toBe(0);
      expect((await state(page)).science.state).toMatchObject({ collected: 0, remaining: 100, sediment: 0, settled: 0, angle: 0 });
      await prepare(page); await pour(page, 3); await control(page, 'check');
      expect((await state(page)).score).toBe(25);
    }
    if (round === 2) await page.screenshot({ path: `${screenshots}/completed.png` });
    await control(page, 'next');
  }
  await ready(page, 'QuarterDetailScene');
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('lumify-science-q1-v1')));
  expect(progress['q1-m2-l5']).toMatchObject({ completed: true, bestScore: 75 });
  await clickGame(page, 460, 660); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.state).toMatchObject({ angle: 0, collected: 0, remaining: 100, settled: 0, sediment: 0 });
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1250));
  await clickGame(page, 760, 330); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.kind).toBe('schedule');
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  expect(errors).toEqual([]);
});
