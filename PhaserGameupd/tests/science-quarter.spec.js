import { test, expect } from '@playwright/test';
import { clickGame, ready, startFromMenu } from './helpers/intro.js';
import { scienceQuarterGames, SERVICE_ROUNDS } from '../src/config/scienceQuarterGames.js';

// This suite already captures each game and result explicitly. Recording every
// large texture in a trace made the complete-quarter flow exceed its time limit.
test.use({ trace: 'off' });

const state = page => page.evaluate(() => window.__TEST__.state());
async function control(page, id) {
  const s = await state(page);
  const button = s.science.controls.find(c => c.id === id);
  expect(button, `Missing control ${id} in ${s.minigameId}`).toBeTruthy();
  await clickGame(page, button.x, button.y);
}

async function dragControl(page, id, x, y) {
  const s = await state(page), target = s.science.controls.find(c => c.id === id);
  expect(target).toBeTruthy();
  const box = await page.locator('canvas').boundingBox();
  const point = (px, py) => [box.x + px * box.width / 1280, box.y + py * box.height / 720];
  await page.mouse.move(...point(target.x, target.y)); await page.mouse.down();
  await page.mouse.move(...point(x, y), { steps: 12 }); await page.mouse.up();
}

async function solve(page, kind, round) {
  if (kind === 'magnet') {
    if (round === 0) {
      const item = (await state(page)).science.controls.find(c => c.id === 'material-0');
      await dragControl(page, 'magnet-drag', item.x, item.y);
      expect((await state(page)).science.state.held).toContain(0);
    }
    for (const i of [0, 3, 6]) {
      if (!(await state(page)).science.state.held.includes(i)) await control(page, `material-${i}`);
    }
    await control(page, 'release');
  } else if (kind === 'sieve') {
    for (let i = 0; i < 5 - round; i++) await control(page, 'opening-less');
    await control(page, 'run');
  } else if (kind === 'filter') {
    if (round === 0) {
      await dragControl(page, 'place-receiver', 477, 422);
      await dragControl(page, 'place-filter', 477, 284);
    } else { await control(page, 'place-receiver'); await control(page, 'place-filter'); }
    await control(page, 'pour'); await control(page, round === 1 ? 'output-liquid' : 'output-paper');
  } else if (kind === 'evaporate') {
    await control(page, 'record'); await control(page, 'advance'); await control(page, 'record');
    for (let i = 0; i < 3; i++) await control(page, 'advance');
    await control(page, 'record'); await control(page, 'output-salt');
  } else if (kind === 'decant') {
    await control(page, 'settle'); await control(page, 'settle');
    await control(page, 'angle-more'); await control(page, 'angle-more');
    for (let i = 0; i < 3; i++) await control(page, 'pour');
  } else if (kind === 'schedule') {
    for (const [i, job] of SERVICE_ROUNDS[round].entries()) {
      await control(page, `job-${i}`); await control(page, `book-${job.tool}-0`);
    }
    await control(page, 'run');
  } else if (kind === 'circuit') {
    const order = [['magnet', 'filter'], ['sieve', 'filter'], ['filter', 'evaporate']][round];
    for (const tool of order) { await control(page, `tool-${tool}`); await control(page, 'apply'); }
  } else if (kind === 'impact') {
    for (let i = 0; i < 2; i++) { await control(page, `tool-${SERVICE_ROUNDS[round][i].tool}`); await control(page, `site-${i}`); }
    await control(page, 'run');
  } else if (kind === 'diagnose') {
    if (round === 0) { for (let i = 0; i < 5; i++) await control(page, 'opening-less'); }
    if (round === 1) await control(page, 'tool-evaporate');
    if (round === 2) {
      await control(page, 'settle'); await control(page, 'settle'); await control(page, 'test');
      await control(page, 'angle-less'); await control(page, 'angle-less');
    }
    await control(page, 'test');
  } else if (kind === 'report') {
    for (let i = 0; i < 3; i++) { await control(page, `panel-${i}`); await control(page, `photo-${i}`); }
    await page.getByRole('textbox', { name: 'Field report explanation' }).fill('This method recovers a useful material so the community can reuse it instead of discarding it.');
    await page.getByRole('textbox', { name: 'Field report explanation' }).blur();
  }
}

// Follow the actual menu/map/lesson entry flow on both configured viewports.
for (const block of ['separation', 'community']) {
test(`Science Q1 ${block} activities can be entered, explored, completed, and revisited`, async ({ page }, testInfo) => {
  test.setTimeout(600_000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/?test=1'); await ready(page, 'MenuScene'); await startFromMenu(page);
  await clickGame(page, 200, 515); await clickGame(page, 200, 515); await ready(page, 'IslandMapScene');
  await clickGame(page, 620, 524); await ready(page, 'QuarterDetailScene');
  const points = [[520, 340], [650, 420], [490, 500], [610, 580], [460, 660], [760, 330], [640, 410], [790, 490], [670, 570], [820, 650]];
  for (const [index, game] of scienceQuarterGames.entries()) {
    if (game.day > 15) continue; // Capstone activities have their own interaction tests.
    if ((index < 5 ? 'separation' : 'community') !== block) continue;
    await page.evaluate(y => window.__TEST__.commands.setQuarterScrollY(y), index < 5 ? 700 : 1250);
    await clickGame(page, ...points[index]);
    await expect.poll(async () => (await state(page)).openModal).toBe(`minigame-info-${game.id}`);
    await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
    expect((await state(page)).minigameId).toBe(game.id);
    const nav = (await state(page)).minigameControls;
    expect(nav.back).toMatchObject({ x: 46, y: 678 });
    expect(nav.help).toMatchObject({ x: 1135, y: 37 });
    expect(nav.settings).toMatchObject({ x: 1209, y: 37 });
    await page.screenshot({ path: testInfo.outputPath(`science-${game.day}-initial.png`) });
    await control(page, 'check');
    expect((await state(page)).science.phase).toBe('playing');
    expect((await state(page)).score).toBe(0);
    const before = (await state(page)).science.state;
    for (const [type, modal] of [['help', 'minigame-help'], ['settings', 'science-settings']]) {
      await clickGame(page, nav[type].x, nav[type].y);
      await expect.poll(async () => (await state(page)).openModal).toBe(modal);
      if (index === 0 && type === 'help') await page.screenshot({ path: testInfo.outputPath('science-illustrated-help.png') });
      await page.keyboard.press('Escape');
      await expect.poll(async () => (await state(page)).openModal).toBe(null);
      expect((await state(page)).science.state).toEqual(before);
    }
    for (let round = 0; round < 3; round++) {
      await solve(page, game.kind, round);
      if (game.kind === 'report' && round === 0) {
        const field = page.getByRole('textbox', { name: 'Field report explanation' });
        const caption = await field.inputValue();
        const box = await field.boundingBox(), canvas = await page.locator('canvas').boundingBox();
        expect(box.x).toBeCloseTo(canvas.x + 868 * canvas.width / 1280, 0);
        expect(box.y).toBeCloseTo(canvas.y + 306 * canvas.height / 720, 0);
        for (const type of ['help', 'settings']) {
          await clickGame(page, nav[type].x, nav[type].y); await expect(field).toBeHidden();
          await page.keyboard.press('Escape'); await expect(field).toBeVisible();
          expect(await field.inputValue()).toBe(caption);
          expect((await state(page)).science.state.caption).toBe(caption);
        }
        await page.screenshot({ path: testInfo.outputPath('science-report-writing.png') });
      }
      await control(page, 'check');
      await expect.poll(async () => (await state(page)).science.phase).toBe(round === 2 ? 'finished' : 'complete');
      if (round === 0) await page.screenshot({ path: testInfo.outputPath(`science-${game.day}-completed.png`) });
      if (index === 0 && round === 0) {
        await control(page, 'retry'); expect((await state(page)).score).toBe(0);
        await solve(page, game.kind, round); await control(page, 'check');
        expect((await state(page)).score).toBe(25);
      }
      if (game.kind === 'report' && round === 2) {
        const download = page.waitForEvent('download'); await control(page, 'download');
        expect((await download).suggestedFilename()).toBe('lumify-science-field-reports.json');
      }
      await control(page, 'next');
    }
    await ready(page, 'QuarterDetailScene');
    const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('lumify-science-q1-v1')));
    expect(progress[game.lessonId].completed).toBe(true);
    expect(progress[game.lessonId].records.filter(Boolean)).toHaveLength(3);
  }
  await page.reload(); await ready(page, 'MenuScene');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('lumify-science-q1-v1')));
  expect(Object.values(saved).filter(g => g.completed)).toHaveLength(5);
  expect(errors).toEqual([]);
});
}
