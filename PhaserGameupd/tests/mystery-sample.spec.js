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
async function choose(page, field, index) {
  await control(page, `choose-${field}`); await control(page, `${field}-${index}`);
}
test('Mystery Sample Trail collects evidence, checks conclusions, preserves answers and returns to its map slot', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const dir = `screenshots/mystery-sample/${testInfo.project.name}`;
  await mkdir(dir, { recursive: true });
  await page.goto('/?test=1'); await ready(page, 'MenuScene'); await startFromMenu(page);
  await clickGame(page, 200, 515); await ready(page, 'IslandMapScene');
  await clickGame(page, 620, 524); await ready(page, 'QuarterDetailScene');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1800));
  await clickGame(page, 520, 320);
  await expect.poll(async () => (await state(page)).openModal).toBe('minigame-info-science-mystery');
  await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.kind).toBe('mystery');
  await page.screenshot({ path: `${dir}/initial.png` });
  // Closing a conclusion menu must keep the player here and preserve the sample.
  await control(page, 'choose-components');
  await page.screenshot({ path: `${dir}/materials-menu.png` });
  await page.keyboard.press('Escape');
  expect((await state(page)).science.state.menu).toBeNull();
  expect((await state(page)).sceneKey).toBe('ScienceAdventureScene');
  await control(page, 'choose-classification');
  await control(page, 'inspect');
  expect((await state(page)).science.state.menu).toBeNull();
  expect((await state(page)).science.state.inspected).toBe(false);
  const nav = (await state(page)).minigameControls;
  for (const name of ['help', 'settings']) {
    const before = (await state(page)).science.state;
    await clickGame(page, nav[name].x, nav[name].y);
    await expect.poll(async () => (await state(page)).openModal).toBe(name === 'help' ? 'minigame-help' : 'science-settings');
    if (name === 'help') {
      await page.screenshot({ path: `${dir}/help.png` });
      await control(page, 'inspect');
      expect((await state(page)).science.state).toEqual(before);
      await clickGame(page, 640, 611);
    } else await page.keyboard.press('Escape');
    expect((await state(page)).science.state).toEqual(before);
  }
  // Guesses do not pass, even with both answers correct.
  await choose(page, 'components', 0); await choose(page, 'classification', 0);
  await control(page, 'check'); expect((await state(page)).science.phase).toBe('playing');
  expect((await state(page)).science.state.message).toContain('Inspect');
  await control(page, 'reset');
  for (let round = 0; round < 3; round++) {
    await control(page, 'inspect'); await control(page, round === 2 ? 'magnet' : 'rest');
    await choose(page, 'components', round); await choose(page, 'classification', round === 0 ? 0 : 1);
    if (round === 0) {
      await page.screenshot({ path: `${dir}/saltwater.png` });
      await control(page, 'check'); expect((await state(page)).score).toBe(25);
      await control(page, 'retry'); expect((await state(page)).score).toBe(0);
      await control(page, 'inspect'); await control(page, 'rest');
      await choose(page, 'components', 0); await choose(page, 'classification', 0);
    }
    if (round === 1) {
      await page.screenshot({ path: `${dir}/settled-reference.png` });
      await control(page, 'stir'); expect((await state(page)).science.state.settled).toBe(false);
      expect((await state(page)).science.state.evidence).toEqual(['inspect', 'rest']);
      await control(page, 'rest');
      await choose(page, 'classification', 0); await control(page, 'check');
      expect((await state(page)).science.phase).toBe('playing');
      await choose(page, 'classification', 1);
    }
    if (round === 2) await page.screenshot({ path: `${dir}/magnetic-response.png` });
    await control(page, 'check');
    expect((await state(page)).science.phase).toBe(round === 2 ? 'finished' : 'complete');
    if (round === 2) await page.screenshot({ path: `${dir}/completed.png` });
    await control(page, 'next');
  }
  await ready(page, 'QuarterDetailScene');
  expect((await state(page)).quarterLessonCount).toBe(20);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('lumify-science-q1-v1'))['q1-m4-l1']);
  expect(saved).toMatchObject({ completed: true, score: 72, bestScore: 72, reviewRequired: false });
  expect(saved.records[1].state.answers.map(a => a.correct)).toEqual([false, true]);
  expect(saved.records[1].state.answers.map(a => a.classification)).toEqual(['Uniform', 'Non-uniform']);
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1900));
  await clickGame(page, 460, 540);
  await expect.poll(async () => (await state(page)).openModal).toBe('minigame-info-science-revival');
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1800));
  await clickGame(page, 520, 320); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.state.evidence).toEqual([]);
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  expect(errors).toEqual([]);
});
