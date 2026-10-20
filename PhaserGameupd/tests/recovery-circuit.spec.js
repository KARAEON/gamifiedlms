import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { clickGame, ready, startFromMenu } from './helpers/intro.js';

test.use({ trace: 'off' });
const state = page => page.evaluate(() => window.__TEST__.state());
async function control(page, id) {
  const item = (await state(page)).science.controls.find(c => c.id === id);
  expect(item, `Missing ${id}`).toBeTruthy();
  await clickGame(page, item.x, item.y);
}
async function apply(page, tool) {
  await control(page, `tool-${tool}`); await control(page, 'apply');
}

test('Recovery Circuit connects both outputs, previews tools and recovers all requested components', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const shots = `screenshots/recovery-circuit/${testInfo.project.name}`;
  await mkdir(shots, { recursive: true });
  await page.goto('/?test=1'); await ready(page, 'MenuScene'); await startFromMenu(page);
  await clickGame(page, 200, 515); await clickGame(page, 200, 515); await ready(page, 'IslandMapScene');
  await clickGame(page, 620, 524); await ready(page, 'QuarterDetailScene');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1250));
  await clickGame(page, 640, 410); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).minigameId).toBe('science-circuit');
  const nav = (await state(page)).minigameControls;
  expect(nav.back).toMatchObject({ x: 46, y: 678 });
  expect(nav.help).toMatchObject({ x: 1135, y: 37 });
  expect(nav.settings).toMatchObject({ x: 1209, y: 37 });
  await page.screenshot({ path: `${shots}/initial.png` });
  await control(page, 'tool-magnet');
  expect((await state(page)).science.state).toMatchObject({ pendingTool: 'magnet', steps: [] });
  for (const [name, modal] of [['help', 'minigame-help'], ['settings', 'science-settings']]) {
    const before = (await state(page)).science.state;
    await clickGame(page, nav[name].x, nav[name].y);
    await expect.poll(async () => (await state(page)).openModal).toBe(modal);
    if (name === 'help') {
      await page.screenshot({ path: `${shots}/how-to-play.png` });
      await control(page, 'tool-sieve');
      expect((await state(page)).science.state).toEqual(before);
      await clickGame(page, 640, 611);
    } else await page.keyboard.press('Escape');
    await expect.poll(async () => (await state(page)).openModal).toBe(null);
    expect((await state(page)).science.state).toEqual(before);
  }
  await apply(page, 'decant');
  expect((await state(page)).science.state.steps).toEqual([]);
  expect((await state(page)).science.state.streams[0].parts).toEqual(['iron', 'sand', 'water']);
  await page.screenshot({ path: `${shots}/unsuitable-tool.png` });
  await control(page, 'reset'); await apply(page, 'evaporate'); await control(page, 'check');
  expect((await state(page)).science.phase).toBe('playing');
  expect((await state(page)).science.state.streams.some(v => v.parts.length === 1 && v.parts[0] === 'water')).toBe(false);
  await control(page, 'reset');

  for (let round = 0; round < 3; round++) {
    const order = [['magnet', 'filter'], ['sieve', 'filter'], ['filter', 'evaporate']][round];
    await apply(page, order[0]);
    expect((await state(page)).science.state.steps).toHaveLength(1);
    expect((await state(page)).science.state.streams.flatMap(v => v.parts)).toHaveLength(3);
    if (round === 0) {
      const mixed = (await state(page)).science.state.streams.find(v => v.parts.length > 1);
      const iron = (await state(page)).science.state.streams.find(v => v.parts.length === 1);
      await control(page, `stream-${iron.id}`); await apply(page, 'filter');
      expect((await state(page)).science.state.steps).toHaveLength(1);
      await control(page, `stream-${mixed.id}`);
      await control(page, 'tool-filter');
      await page.screenshot({ path: `${shots}/connected-process.png` });
      await control(page, 'apply');
    } else await apply(page, order[1]);
    expect((await state(page)).science.state.streams).toHaveLength(3);
    expect((await state(page)).science.state.streams.every(v => v.parts.length === 1)).toBe(true);
    await control(page, 'check');
    expect((await state(page)).science.phase).toBe(round === 2 ? 'finished' : 'complete');
    expect((await state(page)).score).toBe((round + 1) * 25);
    const products = (await state(page)).science.state.streams;
    for (const stream of products) {
      await control(page, `stream-${stream.id}`);
      expect((await state(page)).science.state.selected).toBe(stream.id);
    }
    await control(page, 'tool-decant');
    expect((await state(page)).science.state.streams).toEqual(products);
    if (round === 0) {
      await page.screenshot({ path: `${shots}/completed-circuit.png` });
      await control(page, 'retry'); expect((await state(page)).score).toBe(0);
      expect((await state(page)).science.state.steps).toEqual([]);
      await apply(page, 'filter'); await apply(page, 'magnet'); await control(page, 'check');
      expect((await state(page)).science.phase).toBe('complete');
      expect((await state(page)).score).toBe(25);
      await page.screenshot({ path: `${shots}/alternative-order.png` });
    }
    if (round === 2) {
      expect(products.flatMap(v => v.parts).sort()).toEqual(['salt', 'sand', 'vapor']);
      await page.screenshot({ path: `${shots}/completed-activity.png` });
    }
    await control(page, 'next');
  }
  await ready(page, 'QuarterDetailScene');
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('lumify-science-q1-v1')));
  expect(progress['q1-m3-l2']).toMatchObject({ completed: true, bestScore: 75 });
  await clickGame(page, 640, 410); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.state).toMatchObject({ selected: 'input', pendingTool: null, steps: [] });
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  await clickGame(page, 790, 490); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.kind).toBe('impact');
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  expect(errors).toEqual([]);
});
