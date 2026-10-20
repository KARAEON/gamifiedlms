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
async function install(page, index, tool) {
  await control(page, `tool-${tool}`); await control(page, `site-${index}`);
}
async function bestPlan(page, round) {
  for (let i = 0; i < 2; i++) await install(page, i, SERVICE_ROUNDS[round][i].tool);
}

test('Village Impact previews two services, compares recovery and preserves shared navigation', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const shots = `screenshots/village-impact/${testInfo.project.name}`;
  await mkdir(shots, { recursive: true });
  await page.goto('/?test=1'); await ready(page, 'MenuScene'); await startFromMenu(page);
  await clickGame(page, 200, 515); await clickGame(page, 200, 515); await ready(page, 'IslandMapScene');
  await clickGame(page, 620, 524); await ready(page, 'QuarterDetailScene');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1250));
  await clickGame(page, 790, 490); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).minigameId).toBe('science-impact');
  const nav = (await state(page)).minigameControls;
  expect(nav.back).toMatchObject({ x: 46, y: 678 });
  expect(nav.help).toMatchObject({ x: 1135, y: 37 });
  expect(nav.settings).toMatchObject({ x: 1209, y: 37 });
  await page.screenshot({ path: `${shots}/initial.png` });
  await install(page, 0, 'sieve');
  for (const [name, modal] of [['help', 'minigame-help'], ['settings', 'science-settings']]) {
    const before = (await state(page)).science.state;
    await clickGame(page, nav[name].x, nav[name].y);
    await expect.poll(async () => (await state(page)).openModal).toBe(modal);
    if (name === 'help') {
      await page.screenshot({ path: `${shots}/how-to-play.png` });
      await control(page, 'site-0');
      expect((await state(page)).science.state).toEqual(before);
      await clickGame(page, 640, 611);
    } else await page.keyboard.press('Escape');
    await expect.poll(async () => (await state(page)).openModal).toBe(null);
    expect((await state(page)).science.state).toEqual(before);
  }
  await install(page, 2, 'magnet'); await control(page, 'run'); await control(page, 'check');
  expect((await state(page)).science.phase).toBe('playing');
  expect((await state(page)).score).toBe(0);
  await page.screenshot({ path: `${shots}/unsuitable-services.png` });
  await control(page, 'site-1');
  expect(Object.keys((await state(page)).science.state.installations)).toHaveLength(2);
  expect((await state(page)).science.state.message).toContain('Both tokens');
  await page.screenshot({ path: `${shots}/token-limit.png` });
  await control(page, 'site-0');
  expect(Object.keys((await state(page)).science.state.installations)).toHaveLength(1);
  await install(page, 0, 'magnet');
  expect((await state(page)).science.state.installations[0]).toBe('magnet');
  await control(page, 'reset');
  await install(page, 0, 'magnet'); await install(page, 2, 'evaporate');
  await control(page, 'run'); await control(page, 'check');
  expect((await state(page)).science.phase).toBe('playing');
  await page.screenshot({ path: `${shots}/lower-impact-plan.png` });
  await control(page, 'reset');

  for (let round = 0; round < 3; round++) {
    await bestPlan(page, round);
    if (round === 0) {
      await page.screenshot({ path: `${shots}/installed-services.png` });
      await control(page, 'check'); expect((await state(page)).science.phase).toBe('playing');
      await control(page, 'reset'); await bestPlan(page, round);
    }
    await control(page, 'run');
    if (round === 0) {
      await page.screenshot({ path: `${shots}/preview-benefits.png` });
      const before = (await state(page)).science.state;
      await clickGame(page, nav.help.x, nav.help.y); await page.keyboard.press('Escape');
      expect((await state(page)).science.state).toEqual(before);
      await control(page, 'site-1'); expect((await state(page)).science.state.run).toBe(false);
      await install(page, 1, 'sieve'); await control(page, 'run');
    }
    await control(page, 'check');
    expect((await state(page)).science.phase).toBe(round === 2 ? 'finished' : 'complete');
    expect((await state(page)).score).toBe((round + 1) * 25);
    const completed = (await state(page)).science.state;
    await control(page, 'site-0'); await control(page, 'tool-decant');
    expect((await state(page)).science.state).toEqual(completed);
    if (round === 0) {
      await page.screenshot({ path: `${shots}/completed-shift.png` });
      await control(page, 'retry'); expect((await state(page)).score).toBe(0);
      expect((await state(page)).science.state.installations).toEqual({});
      await bestPlan(page, round); await control(page, 'run'); await control(page, 'check');
      expect((await state(page)).score).toBe(25);
    }
    if (round === 1) await page.screenshot({ path: `${shots}/pottery-recovery.png` });
    if (round === 2) await page.screenshot({ path: `${shots}/completed-activity.png` });
    await control(page, 'next');
  }
  await ready(page, 'QuarterDetailScene');
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('lumify-science-q1-v1')));
  expect(progress['q1-m3-l3']).toMatchObject({ completed: true, bestScore: 75 });
  await clickGame(page, 790, 490); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.state).toMatchObject({ tool: 'magnet', installations: {}, run: false });
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  await clickGame(page, 670, 570); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.kind).toBe('diagnose');
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  expect(errors).toEqual([]);
});
