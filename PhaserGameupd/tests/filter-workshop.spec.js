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
async function drag(page, id, x, y) {
  const button = (await state(page)).science.controls.find(c => c.id === id);
  const box = await page.locator('canvas').boundingBox();
  const point = (px, py) => [box.x + px * box.width / 1280, box.y + py * box.height / 720];
  await page.mouse.move(...point(button.x, button.y)); await page.mouse.down();
  await page.mouse.move(...point(x, y), { steps: 12 }); await page.mouse.up();
}
async function assemble(page) {
  await control(page, 'place-receiver'); await control(page, 'place-filter'); await control(page, 'pour');
}

test('Filter Forge assembles the apparatus and traces residue versus dissolved salt', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const screenshots = `screenshots/filter-workshop/${testInfo.project.name}`;
  await mkdir(screenshots, { recursive: true });
  await page.goto('/?test=1'); await ready(page, 'MenuScene'); await startFromMenu(page);
  await clickGame(page, 200, 515); await clickGame(page, 200, 515); await ready(page, 'IslandMapScene');
  await clickGame(page, 620, 524); await ready(page, 'QuarterDetailScene');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(700));
  await clickGame(page, 490, 500); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).minigameId).toBe('science-filter');
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
      await control(page, 'place-filter');
      expect((await state(page)).science.state).toEqual(before);
      await clickGame(page, 640, 611);
    } else await page.keyboard.press('Escape');
    await expect.poll(async () => (await state(page)).openModal).toBe(null);
    expect((await state(page)).science.state).toEqual(before);
  }
  await control(page, 'output-paper');
  expect((await state(page)).science.state.output).toBe(null);
  await control(page, 'pour');
  expect((await state(page)).science.state.poured).toBe(false);
  await drag(page, 'place-receiver', 478, 279); // Wrong apparatus slot.
  expect((await state(page)).science.state.parts).toEqual([]);
  await drag(page, 'place-filter', 740, 380); // Outside any slot.
  expect((await state(page)).science.state.parts).toEqual([]);
  await drag(page, 'place-receiver', 478, 448);
  expect((await state(page)).science.state.parts).toEqual(['receiver']);
  await control(page, 'place-receiver'); // Placed parts cannot duplicate.
  expect((await state(page)).science.state.parts).toEqual(['receiver']);
  await control(page, 'pour');
  expect((await state(page)).science.state.poured).toBe(false);
  await drag(page, 'place-filter', 478, 279);
  expect((await state(page)).science.state.parts).toEqual(['receiver', 'filter']);
  await page.screenshot({ path: `${screenshots}/assembled.png` });
  await control(page, 'pour'); await control(page, 'output-liquid'); await control(page, 'check');
  expect((await state(page)).science.phase).toBe('playing');
  expect((await state(page)).score).toBe(0);
  await page.screenshot({ path: `${screenshots}/wrong-output.png` });
  await control(page, 'reset');
  expect((await state(page)).science.state).toMatchObject({ parts: [], poured: false, output: null });

  for (let round = 0; round < 3; round++) {
    await assemble(page);
    await control(page, round === 1 ? 'output-liquid' : 'output-paper');
    const before = (await state(page)).science.state;
    await clickGame(page, nav.help.x, nav.help.y); await page.keyboard.press('Escape');
    expect((await state(page)).science.state).toEqual(before);
    await control(page, 'check');
    expect((await state(page)).science.phase).toBe(round === 2 ? 'finished' : 'complete');
    expect((await state(page)).score).toBe((round + 1) * 25);
    await page.screenshot({ path: `${screenshots}/${['sand-residue', 'salt-filtrate', 'completed'][round]}.png` });
    if (round === 0) {
      await control(page, 'retry'); expect((await state(page)).score).toBe(0);
      await assemble(page); await control(page, 'output-paper'); await control(page, 'check');
      expect((await state(page)).score).toBe(25);
    }
    await control(page, 'next');
  }
  await ready(page, 'QuarterDetailScene');
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('lumify-science-q1-v1')));
  expect(progress['q1-m2-l3']).toMatchObject({ completed: true, bestScore: 75 });
  await clickGame(page, 490, 500); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.state).toMatchObject({ parts: [], poured: false, output: null });
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  await clickGame(page, 610, 580); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.kind).toBe('evaporate');
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  expect(errors).toEqual([]);
});
