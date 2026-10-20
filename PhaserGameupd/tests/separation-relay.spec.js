import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { clickGame, ready, startFromMenu } from './helpers/intro.js';
test.use({ trace: 'off' });
const state = page => page.evaluate(() => window.__TEST__.state());
const relay = async page => (await state(page)).science.state;
async function control(page, id) {
  const button = (await state(page)).science.controls.find(c => c.id === id);
  expect(button, `Missing ${id}`).toBeTruthy();
  await clickGame(page, button.x, button.y);
}
async function operate(page, tool) {
  await control(page, `tool-${tool}`); await control(page, 'operate');
}
async function carry(page, component) {
  if (component) {
    const out = (await relay(page)).waiting.find(o => o.parts.includes(component));
    expect(out).toBeTruthy(); await control(page, `output-${out.id}`);
  }
  await control(page, 'carry');
}

test('Separation Relay keeps both output branches, accepts valid orders, and saves three recoveries', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const dir = `screenshots/separation-relay/${testInfo.project.name}`;
  await mkdir(dir, { recursive: true });
  await page.goto('/?test=1'); await ready(page, 'MenuScene'); await startFromMenu(page);
  await clickGame(page, 200, 515); await ready(page, 'IslandMapScene');
  await clickGame(page, 620, 524); await ready(page, 'QuarterDetailScene');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1800));
  await clickGame(page, 490, 480);
  await expect.poll(async () => (await state(page)).openModal).toBe('minigame-info-science-relay');
  await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.kind).toBe('relay');
  await page.screenshot({ path: `${dir}/initial.png` });
  await control(page, 'operate'); await control(page, 'carry'); await control(page, 'check');
  expect((await relay(page)).attempts).toBe(0);
  await operate(page, 'filter'); expect((await relay(page)).steps).toEqual([]);
  expect((await relay(page)).message).toContain('dry');
  await control(page, 'reset');
  const nav = (await state(page)).minigameControls;
  for (const name of ['help', 'settings']) {
    const before = await relay(page);
    await clickGame(page, nav[name].x, nav[name].y);
    await expect.poll(async () => (await state(page)).openModal).toBe(name === 'help' ? 'minigame-help' : 'science-settings');
    if (name === 'help') {
      await page.screenshot({ path: `${dir}/help.png` });
      await control(page, 'tool-magnet'); expect(await relay(page)).toEqual(before);
      await clickGame(page, 640, 611);
    } else await page.keyboard.press('Escape');
    expect(await relay(page)).toEqual(before);
  }
  await operate(page, 'magnet'); await page.screenshot({ path: `${dir}/first-recovery.png` });
  await control(page, 'check'); expect((await state(page)).science.phase).toBe('complete');
  await control(page, 'retry'); expect((await state(page)).score).toBe(0);
  await operate(page, 'magnet'); await control(page, 'check');
  expect((await state(page)).score).toBe(25);
  await control(page, 'next');
  // Alternate workable order: filter, carry its mixed solids, then sieve.
  await operate(page, 'filter'); expect((await relay(page)).accounted[0].parts).toEqual(['water']);
  const beforeCarry = await relay(page);
  await control(page, 'tool-sieve'); await control(page, 'operate');
  expect(await relay(page)).toEqual(beforeCarry);
  await carry(page); await operate(page, 'sieve'); await control(page, 'check');
  expect((await state(page)).science.phase).toBe('complete'); await control(page, 'next');
  await operate(page, 'magnet'); await carry(page); await operate(page, 'filter');
  expect((await relay(page)).recovered.map(o => o.parts[0])).toEqual(['iron', 'sand']);
  expect((await relay(page)).waiting[0].parts).toEqual(['salt', 'water']);
  await page.screenshot({ path: `${dir}/reference-filter.png` });
  await control(page, 'check'); expect((await relay(page)).attempts).toBe(0);
  await carry(page); await operate(page, 'evaporate'); await control(page, 'check');
  expect((await state(page)).science.phase).toBe('finished');
  expect((await state(page)).score).toBe(75);
  await page.screenshot({ path: `${dir}/completed.png` });
  // Retry with filtration first; two pending branches must remain selectable.
  await control(page, 'retry'); expect((await state(page)).score).toBe(50);
  await operate(page, 'filter'); expect((await relay(page)).waiting).toHaveLength(2);
  const beforeSelect = await relay(page); await control(page, 'carry');
  expect(await relay(page)).toEqual(beforeSelect);
  await page.screenshot({ path: `${dir}/two-branches.png` });
  await carry(page, 'iron'); await carry(page, 'water'); // Switching keeps the carried solid branch.
  expect((await relay(page)).waiting[0].parts).toEqual(['iron', 'sand']);
  await operate(page, 'evaporate'); await carry(page); await operate(page, 'magnet');
  await control(page, 'check'); expect((await state(page)).score).toBe(75);
  await control(page, 'next'); await ready(page, 'QuarterDetailScene');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('lumify-science-q1-v1'))['q1-m4-l3']);
  expect(saved).toMatchObject({ completed: true, score: 75, bestScore: 75, competency: 'S6MT-Id-f-2' });
  expect(saved.records[2].state.steps.map(s => s.tool)).toEqual(['filter', 'evaporate', 'magnet']);
  expect(saved.records[2].state.accounted[0].parts).toEqual(['vapor']);
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1900));
  await clickGame(page, 460, 540); await expect.poll(async () => (await state(page)).openModal).toBe('minigame-info-science-revival');
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1800));
  await clickGame(page, 490, 480); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await relay(page)).steps).toEqual([]);
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  expect(errors).toEqual([]);
});
