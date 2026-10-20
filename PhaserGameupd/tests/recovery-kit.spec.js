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

test('Recovery Kit Quest trials real outputs, requires minimal equipment, and saves all three challenges', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const dir = `screenshots/recovery-kit/${testInfo.project.name}`;
  await mkdir(dir, { recursive: true });
  await page.goto('/?test=1'); await ready(page, 'MenuScene'); await startFromMenu(page);
  await clickGame(page, 200, 515); await ready(page, 'IslandMapScene');
  await clickGame(page, 620, 524); await ready(page, 'QuarterDetailScene');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1800));
  await clickGame(page, 650, 400);
  await expect.poll(async () => (await state(page)).openModal).toBe('minigame-info-science-kit');
  await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.kind).toBe('kit');
  await page.screenshot({ path: `${dir}/initial.png` });
  await control(page, 'check'); expect((await state(page)).science.phase).toBe('playing');
  await control(page, 'module-magnet');
  const nav = (await state(page)).minigameControls;
  for (const name of ['help', 'settings']) {
    const before = (await state(page)).science.state;
    await clickGame(page, nav[name].x, nav[name].y);
    await expect.poll(async () => (await state(page)).openModal).toBe(name === 'help' ? 'minigame-help' : 'science-settings');
    if (name === 'help') {
      await page.screenshot({ path: `${dir}/help.png` });
      await control(page, 'module-magnet'); expect((await state(page)).science.state).toEqual(before);
      await clickGame(page, 640, 611);
    } else await page.keyboard.press('Escape');
    expect((await state(page)).science.state).toEqual(before);
  }
  await control(page, 'module-sieve'); await control(page, 'module-filter');
  expect((await state(page)).science.state.kit).toEqual(['magnet', 'sieve']);
  await control(page, 'trial'); await control(page, 'check');
  expect((await state(page)).science.phase).toBe('playing');
  expect((await state(page)).science.state.message).toContain('unnecessary');
  await control(page, 'remove-1'); expect((await state(page)).science.state.trial).toBe(null);
  await control(page, 'reset');
  for (let round = 0; round < 3; round++) {
    const kit = [['magnet'], ['sieve'], ['evaporate', 'filter']][round];
    for (const tool of kit) await control(page, `module-${tool}`);
    await control(page, 'trial');
    if (round === 2) {
      await control(page, 'check'); expect((await state(page)).science.phase).toBe('playing');
      await page.screenshot({ path: `${dir}/wrong-order.png` });
      await control(page, 'swap'); expect((await state(page)).science.state.trial).toBe(null);
      await control(page, 'trial');
      expect((await state(page)).science.state.trial.recovered).toEqual(['sand', 'salt']);
    }
    await page.screenshot({ path: `${dir}/${['iron-recovery', 'sand-recovery', 'reference-trial'][round]}.png` });
    await control(page, 'check');
    expect((await state(page)).science.phase).toBe(round === 2 ? 'finished' : 'complete');
    if (round === 0) {
      await control(page, 'retry'); expect((await state(page)).score).toBe(0);
      await control(page, 'module-magnet'); await control(page, 'trial'); await control(page, 'check');
      expect((await state(page)).score).toBe(25);
    }
    if (round === 2) await page.screenshot({ path: `${dir}/completed.png` });
    await control(page, 'next');
  }
  await ready(page, 'QuarterDetailScene');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('lumify-science-q1-v1'))['q1-m4-l2']);
  expect(saved).toMatchObject({ completed: true, score: 72, bestScore: 72 });
  expect(saved.records[2].state.trials.map(t => t.kit)).toEqual([['evaporate', 'filter'], ['filter', 'evaporate']]);
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1900));
  await clickGame(page, 460, 540); await expect.poll(async () => (await state(page)).openModal).toBe('minigame-info-science-revival');
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1800));
  await clickGame(page, 650, 400); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.state.kit).toEqual([]);
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  expect(errors).toEqual([]);
});
