import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { clickGame, ready, startFromMenu } from './helpers/intro.js';
test.use({ trace: 'off' });
const state = page => page.evaluate(() => window.__TEST__.state());
const fair = async page => (await state(page)).science.state;
async function control(page, id) {
  const button = (await state(page)).science.controls.find(c => c.id === id);
  expect(button, `Missing ${id}`).toBeTruthy(); await clickGame(page, button.x, button.y);
}
async function evidence(page, id) { await control(page, 'evidence-menu'); await control(page, `evidence-${id}`); }

test('Fair Test Arena requires comparable observed trials and evidence, saves all challenges, and preserves the Game 20 launch', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const dir = `screenshots/fair-test/${testInfo.project.name}`;
  await mkdir(dir, { recursive: true });
  await page.goto('/?test=1'); await ready(page, 'MenuScene'); await startFromMenu(page);
  await clickGame(page, 200, 515); await ready(page, 'IslandMapScene');
  await clickGame(page, 620, 524); await ready(page, 'QuarterDetailScene');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1800));
  await clickGame(page, 610, 560);
  await expect.poll(async () => (await state(page)).openModal).toBe('minigame-info-science-fair');
  await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.kind).toBe('fair');
  await page.screenshot({ path: `${dir}/initial.png` });
  await control(page, 'run-A'); await control(page, 'check'); await control(page, 'choose-B'); await control(page, 'evidence-menu');
  expect((await fair(page)).trials).toEqual({}); expect((await fair(page)).attempts).toBe(0);
  await control(page, 'prepare');
  expect((await fair(page)).portions.A).toEqual((await fair(page)).portions.B);
  const nav = (await state(page)).minigameControls;
  for (const name of ['help', 'settings']) {
    const before = await fair(page);
    await clickGame(page, nav[name].x, nav[name].y);
    await expect.poll(async () => (await state(page)).openModal).toBe(name === 'help' ? 'minigame-help' : 'science-settings');
    if (name === 'help') {
      await page.screenshot({ path: `${dir}/help.png` });
      await control(page, 'run-A'); expect(await fair(page)).toEqual(before);
      await clickGame(page, 640, 611);
    } else await page.keyboard.press('Escape');
    expect(await fair(page)).toEqual(before);
  }
  await control(page, 'run-B'); await control(page, 'choose-B'); expect((await fair(page)).selected).toBe(null);
  await control(page, 'run-A');
  expect((await fair(page)).trials.A.outputs[0].amounts.sand).toBeGreaterThan(0);
  expect((await fair(page)).trials.B.outputs[0].amounts.sand).toBeUndefined();
  await control(page, 'choose-A'); await evidence(page, 'sand-retained'); await control(page, 'check');
  expect((await state(page)).science.phase).toBe('playing');
  expect((await fair(page)).message).toContain('does not best');
  await control(page, 'choose-B'); await evidence(page, 'clear-safe'); await control(page, 'check');
  expect((await fair(page)).message).toContain('drinking safety');
  await control(page, 'evidence-menu'); await page.screenshot({ path: `${dir}/evidence-menu.png` });
  await page.keyboard.press('Escape'); expect((await fair(page)).evidenceOpen).toBe(false);
  expect((await state(page)).sceneKey).toBe('ScienceAdventureScene');
  await evidence(page, 'sand-retained');
  await control(page, 'run-B'); expect((await fair(page)).selected).toBe(null); expect((await fair(page)).evidence).toBe(null);
  await control(page, 'choose-B'); await evidence(page, 'sand-retained');
  await page.screenshot({ path: `${dir}/reference-comparison.png` });
  await control(page, 'check'); expect((await state(page)).score).toBe(19);
  const savedAttempt = await page.evaluate(() => JSON.parse(localStorage.getItem('lumify-science-q1-v1'))['q1-m4-l4'].records[0].state.answers);
  expect(savedAttempt.map(a => a.correct)).toEqual([false, false, true]);
  await control(page, 'retry'); expect((await state(page)).score).toBe(0);
  expect((await fair(page)).prepared).toBe(false);
  for (let round = 0; round < 3; round++) {
    const [side, fact] = [['B', 'sand-retained'], ['A', 'mesh-retained'], ['B', 'salt-remained']][round];
    await control(page, 'prepare'); await control(page, 'run-A'); await control(page, 'run-B');
    await control(page, `choose-${side}`); await evidence(page, fact);
    await page.screenshot({ path: `${dir}/${['liquid', 'sieve', 'salt'][round]}-comparison.png` });
    await control(page, 'check');
    expect((await state(page)).science.phase).toBe(round === 2 ? 'finished' : 'complete');
    if (round === 2) await page.screenshot({ path: `${dir}/completed.png` });
    await control(page, 'next');
  }
  await ready(page, 'QuarterDetailScene');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('lumify-science-q1-v1'))['q1-m4-l4']);
  expect(saved).toMatchObject({ completed: true, score: 75, bestScore: 75, competency: 'S6MT-Id-f-2', reviewRequired: false });
  expect(saved.records.map(r => r.state.selected)).toEqual(['B', 'A', 'B']);
  expect(saved.records[2].state.trials.B.outputs[1].amounts).toEqual({ vapor: 50 });
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1900));
  await clickGame(page, 460, 540); await expect.poll(async () => (await state(page)).openModal).toBe('minigame-info-science-revival');
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1800));
  await clickGame(page, 610, 560); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await fair(page)).trials).toEqual({});
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  expect(errors).toEqual([]);
});
