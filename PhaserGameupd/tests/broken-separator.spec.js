import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { clickGame, ready, startFromMenu } from './helpers/intro.js';

test.use({ trace: 'off' });
const state = page => page.evaluate(() => window.__TEST__.state());
async function control(page, id) {
  const item = (await state(page)).science.controls.find(c => c.id === id);
  expect(item, `Missing ${id}`).toBeTruthy(); await clickGame(page, item.x, item.y);
}

test('Broken Separator compares recorded trials and repairs all three processes with controlled changes', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const shots = `screenshots/broken-separator/${testInfo.project.name}`;
  await mkdir(shots, { recursive: true });
  await page.goto('/?test=1'); await ready(page, 'MenuScene'); await startFromMenu(page);
  await clickGame(page, 200, 515); await clickGame(page, 200, 515); await ready(page, 'IslandMapScene');
  await clickGame(page, 620, 524); await ready(page, 'QuarterDetailScene');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1250));
  await clickGame(page, 670, 570); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).minigameId).toBe('science-diagnose');
  const nav = (await state(page)).minigameControls;
  expect(nav.back).toMatchObject({ x: 46, y: 678 });
  expect(nav.help).toMatchObject({ x: 1135, y: 37 });
  expect(nav.settings).toMatchObject({ x: 1209, y: 37 });
  await page.screenshot({ path: `${shots}/initial.png` });
  await control(page, 'test');
  expect((await state(page)).science.state.tests).toHaveLength(1);
  await control(page, 'opening-less');
  const before = (await state(page)).science.state;
  for (const [name, modal] of [['help', 'minigame-help'], ['settings', 'science-settings']]) {
    await clickGame(page, nav[name].x, nav[name].y);
    await expect.poll(async () => (await state(page)).openModal).toBe(modal);
    if (name === 'help') {
      await page.screenshot({ path: `${shots}/how-to-play.png` });
      await clickGame(page, 773, 531); expect((await state(page)).science.state).toEqual(before);
      await clickGame(page, 640, 611);
    } else await page.keyboard.press('Escape');
    expect((await state(page)).science.state).toEqual(before);
  }
  await control(page, 'test');
  expect((await state(page)).science.state.tests.at(-1)).toMatchObject({ opening: 8, success: false, changed: 'opening' });
  const recorded = (await state(page)).science.state.tests;
  await control(page, 'opening-less');
  expect((await state(page)).science.state.tests).toEqual(recorded);
  await page.screenshot({ path: `${shots}/pending-change.png` });
  for (let i = 0; i < 3; i++) await control(page, 'opening-less');
  await control(page, 'check'); expect((await state(page)).science.phase).toBe('playing');
  await control(page, 'test');
  expect((await state(page)).science.state.tests.at(-1)).toMatchObject({ opening: 4, success: true });
  await page.screenshot({ path: `${shots}/sieve-working.png` });
  await control(page, 'log-previous');
  expect((await state(page)).science.state.tests.at(-1).opening).toBe(4);
  await page.screenshot({ path: `${shots}/earlier-test.png` });
  await control(page, 'log-next');
  await control(page, 'check'); expect((await state(page)).science.phase).toBe('complete');
  await control(page, 'retry'); expect((await state(page)).score).toBe(0);
  for (let i = 0; i < 5; i++) await control(page, 'opening-less');
  await control(page, 'test'); await control(page, 'check'); expect((await state(page)).score).toBe(25);
  const done = (await state(page)).science.state;
  await control(page, 'opening-more'); expect((await state(page)).science.state).toEqual(done);
  await control(page, 'next');

  await control(page, 'tool-magnet'); await control(page, 'test');
  expect((await state(page)).science.state.tests.at(-1)).toMatchObject({ tool: 'magnet', success: false });
  await control(page, 'tool-evaporate'); await control(page, 'test');
  expect((await state(page)).science.state.tests.at(-1)).toMatchObject({ tool: 'evaporate', success: true });
  await page.screenshot({ path: `${shots}/salt-recovered.png` });
  await control(page, 'check'); expect((await state(page)).score).toBe(50);
  await control(page, 'next');

  await control(page, 'settle'); await control(page, 'settle');
  await control(page, 'angle-less'); await control(page, 'test');
  expect((await state(page)).science.state.tests).toHaveLength(1);
  expect((await state(page)).science.state.changes).toEqual(['settled', 'angle']);
  await page.screenshot({ path: `${shots}/two-changes-blocked.png` });
  await control(page, 'angle-more');
  expect((await state(page)).science.state.changes).toEqual(['settled']);
  await control(page, 'test');
  expect((await state(page)).science.state.tests.at(-1)).toMatchObject({ settled: 2, angle: 40, success: false, changed: 'settled' });
  await page.screenshot({ path: `${shots}/settling-only.png` });
  await control(page, 'angle-less'); await control(page, 'angle-less'); await control(page, 'test');
  expect((await state(page)).science.state.tests.at(-1)).toMatchObject({ settled: 2, angle: 20, success: true, changed: 'angle' });
  await control(page, 'check'); expect((await state(page)).science.phase).toBe('finished');
  expect((await state(page)).score).toBe(75);
  await page.screenshot({ path: `${shots}/completed-activity.png` });
  await control(page, 'next'); await ready(page, 'QuarterDetailScene');
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('lumify-science-q1-v1')));
  expect(progress['q1-m3-l4']).toMatchObject({ completed: true, bestScore: 75 });
  await clickGame(page, 670, 570); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.state.tests).toHaveLength(1);
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  await clickGame(page, 820, 650); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.kind).toBe('report');
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  expect(errors).toEqual([]);
});
