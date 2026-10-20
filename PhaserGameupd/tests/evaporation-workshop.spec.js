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
async function recordSequence(page) {
  await control(page, 'record');
  for (let t = 1; t <= 4; t++) { await control(page, 'advance'); await control(page, 'record'); }
  await control(page, 'output-salt');
}

test('Salt Crystal Watch preserves journal stages and recovers salt rather than water', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const screenshots = `screenshots/evaporation-workshop/${testInfo.project.name}`;
  await mkdir(screenshots, { recursive: true });
  await page.goto('/?test=1'); await ready(page, 'MenuScene'); await startFromMenu(page);
  await clickGame(page, 200, 515); await clickGame(page, 200, 515); await ready(page, 'IslandMapScene');
  await clickGame(page, 620, 524); await ready(page, 'QuarterDetailScene');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(700));
  await clickGame(page, 610, 580); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).minigameId).toBe('science-evaporate');
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
      await control(page, 'record'); // Outside the modal's GOT IT hit area.
      expect((await state(page)).science.state).toEqual(before);
      await clickGame(page, 640, 611);
    } else await page.keyboard.press('Escape');
    await expect.poll(async () => (await state(page)).openModal).toBe(null);
    expect((await state(page)).science.state).toEqual(before);
  }
  await control(page, 'check');
  expect((await state(page)).science.phase).toBe('playing');
  expect((await state(page)).science.state.message).toContain('stage 5');
  for (let i = 0; i < 4; i++) await control(page, 'advance');
  await control(page, 'advance');
  expect((await state(page)).science.state.time).toBe(4);
  await control(page, 'record'); await control(page, 'output-salt'); await control(page, 'check');
  expect((await state(page)).science.state.message).toContain('Start observation missing');
  expect((await state(page)).score).toBe(0);
  await page.screenshot({ path: `${screenshots}/missing-start.png` });
  await control(page, 'reset');
  expect((await state(page)).science.state).toMatchObject({ time: 0, journal: [], output: null, attempts: 0 });

  for (let round = 0; round < 3; round++) {
    await control(page, 'record'); await control(page, 'record');
    expect((await state(page)).science.state.journal).toEqual([0]);
    for (let time = 1; time <= 4; time++) {
      await control(page, 'advance');
      expect((await state(page)).science.state.time).toBe(time);
      await control(page, 'record');
      if (round === 0 && time === 2) {
        await page.screenshot({ path: `${screenshots}/middle-stage.png` });
        const before = (await state(page)).science.state;
        await clickGame(page, nav.help.x, nav.help.y); await page.keyboard.press('Escape');
        expect((await state(page)).science.state).toEqual(before);
      }
    }
    expect((await state(page)).science.state.journal).toEqual([0, 1, 2, 3, 4]);
    await control(page, 'advance'); expect((await state(page)).science.state.time).toBe(4);
    if (round === 0) {
      await control(page, 'output-water'); await control(page, 'check');
      expect((await state(page)).science.phase).toBe('playing');
      expect((await state(page)).science.state.message).toContain('solid');
      await page.screenshot({ path: `${screenshots}/wrong-recovery.png` });
      await control(page, 'reset'); await recordSequence(page);
    } else await control(page, 'output-salt');
    await control(page, 'check');
    expect((await state(page)).science.phase).toBe(round === 2 ? 'finished' : 'complete');
    expect((await state(page)).score).toBe((round + 1) * 25);
    if (round === 0) {
      await page.screenshot({ path: `${screenshots}/salt-recovered.png` });
      await control(page, 'retry'); expect((await state(page)).score).toBe(0);
      await recordSequence(page); await control(page, 'check');
      expect((await state(page)).score).toBe(25);
    }
    if (round === 2) await page.screenshot({ path: `${screenshots}/completed.png` });
    await control(page, 'next');
  }
  await ready(page, 'QuarterDetailScene');
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('lumify-science-q1-v1')));
  expect(progress['q1-m2-l4']).toMatchObject({ completed: true, bestScore: 75 });
  await clickGame(page, 610, 580); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.state).toMatchObject({ time: 0, journal: [], output: null });
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  await clickGame(page, 460, 660); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.kind).toBe('decant');
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  expect(errors).toEqual([]);
});
