import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { clickGame, ready, startFromMenu } from './helpers/intro.js';
import { SERVICE_ROUNDS } from '../src/config/scienceQuarterGames.js';

test.use({ trace: 'off' });
const state = page => page.evaluate(() => window.__TEST__.state());
async function control(page, id) {
  const item = (await state(page)).science.controls.find(c => c.id === id);
  expect(item, `Missing ${id}`).toBeTruthy();
  await clickGame(page, item.x, item.y);
}
async function book(page, index, tool, start = 0) {
  await control(page, `job-${index}`);
  await control(page, `book-${tool}-${start}`);
}
async function plan(page, round) {
  for (const [i, job] of SERVICE_ROUNDS[round].entries()) await book(page, i, job.tool, i === 2 && job.duration === 3 ? 2 : 0);
}

test('Community Shift schedules all requests, previews benefits and preserves shared navigation', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const screenshots = `screenshots/community-shift/${testInfo.project.name}`;
  await mkdir(screenshots, { recursive: true });
  await page.goto('/?test=1'); await ready(page, 'MenuScene'); await startFromMenu(page);
  await clickGame(page, 200, 515); await clickGame(page, 200, 515); await ready(page, 'IslandMapScene');
  await clickGame(page, 620, 524); await ready(page, 'QuarterDetailScene');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1250));
  await clickGame(page, 760, 330); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).minigameId).toBe('science-schedule');
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
      await control(page, 'job-1');
      expect((await state(page)).science.state).toEqual(before);
      await clickGame(page, 640, 611);
    } else await page.keyboard.press('Escape');
    await expect.poll(async () => (await state(page)).openModal).toBe(null);
    expect((await state(page)).science.state).toEqual(before);
  }
  await control(page, 'run');
  expect((await state(page)).science.state.message).toContain('Book all three');
  await plan(page, 0);
  await book(page, 2, 'evaporate', 4); await control(page, 'run'); await control(page, 'check');
  expect((await state(page)).science.phase).toBe('playing');
  expect((await state(page)).science.state.message).toContain('after the shift');
  await page.screenshot({ path: `${screenshots}/late-job.png` });
  await book(page, 2, 'filter'); await control(page, 'run'); await control(page, 'check');
  expect((await state(page)).science.state.message).toContain('choose a method');
  expect((await state(page)).science.phase).toBe('playing');
  await page.screenshot({ path: `${screenshots}/unsuitable-method.png` });
  await control(page, 'reset');

  for (let round = 0; round < 3; round++) {
    await plan(page, round);
    if (round === 0) {
      await control(page, 'check');
      expect((await state(page)).science.phase).toBe('playing');
      expect((await state(page)).science.state.message).toContain('Run the shift');
      await control(page, 'reset'); await plan(page, round);
    }
    await control(page, 'run');
    expect((await state(page)).science.state.message).toContain('Every request');
    await control(page, 'job-1');
    if (round === 0) {
      await page.screenshot({ path: `${screenshots}/scheduled.png` });
      await book(page, 1, 'sieve', 2);
      expect((await state(page)).science.state.run).toBe(false);
      expect((await state(page)).science.state.message).toBe('');
      await control(page, 'run');
    }
    await control(page, 'check');
    expect((await state(page)).science.phase).toBe(round === 2 ? 'finished' : 'complete');
    expect((await state(page)).score).toBe((round + 1) * 25);
    const bookings = (await state(page)).science.state.bookings;
    await control(page, 'job-0');
    expect((await state(page)).science.state.selected).toBe(0);
    expect((await state(page)).science.state.bookings).toEqual(bookings);
    await control(page, 'book-filter-4');
    expect((await state(page)).science.state.bookings).toEqual(bookings);
    if (round === 0) {
      await page.screenshot({ path: `${screenshots}/completed-shift.png` });
      await control(page, 'retry');
      expect((await state(page)).score).toBe(0);
      expect((await state(page)).science.state.bookings).toEqual({});
      await plan(page, round); await control(page, 'run'); await control(page, 'check');
      expect((await state(page)).score).toBe(25);
    }
    if (round === 2) await page.screenshot({ path: `${screenshots}/completed-activity.png` });
    await control(page, 'next');
  }
  await ready(page, 'QuarterDetailScene');
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('lumify-science-q1-v1')));
  expect(progress['q1-m3-l1']).toMatchObject({ completed: true, bestScore: 75 });
  await clickGame(page, 760, 330); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.state).toMatchObject({ selected: 0, bookings: {}, run: false });
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  await clickGame(page, 640, 410); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.kind).toBe('circuit');
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  expect(errors).toEqual([]);
});
