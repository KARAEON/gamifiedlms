import { test, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { clickGame, ready, startFromMenu } from './helpers/intro.js';
test.use({ trace: 'off' });
const state = page => page.evaluate(() => window.__TEST__.state());
const workshop = async page => (await state(page)).science.state;
async function control(page, id) {
  const c = (await state(page)).science.controls.find(c => c.id === id);
  expect(c, `Missing ${id}`).toBeTruthy(); await clickGame(page, c.x, c.y);
}
async function operate(page, tool, parts) {
  if (parts) {
    const stream = (await workshop(page)).streams.find(s => s.parts.join(',') === parts.join(','));
    expect(stream).toBeTruthy(); await control(page, `stream-${stream.id}`);
  }
  await control(page, `tool-${tool}`); await control(page, 'operate');
}

test('workshop recovers real supplies, carries three repairs, saves teacher-review explanations and exports records', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const dir = `screenshots/workshop-revival/${testInfo.project.name}`;
  await mkdir(dir, { recursive: true });
  await page.goto('/?test=1'); await ready(page, 'MenuScene'); await startFromMenu(page);
  await clickGame(page, 200, 515); await ready(page, 'IslandMapScene');
  await clickGame(page, 620, 524); await ready(page, 'QuarterDetailScene');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1900));
  await clickGame(page, 460, 540);
  await expect.poll(async () => (await state(page)).openModal).toBe('minigame-info-science-revival');
  await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).science.kind).toBe('revival');
  const caption = page.getByRole('textbox', { name: 'Workshop repair explanation' });
  await expect(caption).toBeVisible(); await expect(caption).toHaveAttribute('maxlength', '180');
  const bounds = await caption.boundingBox(), canvas = await page.locator('canvas').boundingBox();
  expect(bounds.x).toBeGreaterThan(canvas.x); expect(bounds.x + bounds.width).toBeLessThanOrEqual(canvas.x + canvas.width);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(canvas.y + canvas.height);
  await page.screenshot({ path: `${dir}/initial.png` });
  for (const id of ['tool-magnet', 'operate', 'apply', 'check']) await control(page, id);
  expect((await workshop(page)).steps).toEqual([]); expect((await workshop(page)).attempts).toBe(0);
  const nav = (await state(page)).minigameControls;
  await caption.fill('The recovered iron will secure the workbench brackets.');
  for (const name of ['help', 'settings']) {
    const before = await workshop(page);
    await clickGame(page, nav[name].x, nav[name].y);
    await expect.poll(async () => (await state(page)).openModal).toBe(name === 'help' ? 'minigame-help' : 'science-settings');
    await expect(caption).toBeHidden();
    if (name === 'help') { await page.screenshot({ path: `${dir}/help.png` }); await control(page, 'observe'); expect(await workshop(page)).toEqual(before); await clickGame(page, 640, 611); }
    else await page.keyboard.press('Escape');
    await expect(caption).toBeVisible(); expect(await workshop(page)).toEqual(before);
  }
  await control(page, 'observe'); await page.screenshot({ path: `${dir}/observed.png` });
  await operate(page, 'sieve'); expect((await workshop(page)).steps).toEqual([]);
  await operate(page, 'magnet'); await control(page, 'apply');
  expect((await workshop(page)).repairs).toEqual([true, false, false]);
  await page.screenshot({ path: `${dir}/workbench.png` });
  await control(page, 'check'); expect((await state(page)).score).toBe(25);
  await expect(caption).toHaveAttribute('readonly', '');
  await control(page, 'retry'); expect((await state(page)).score).toBe(0);
  expect((await workshop(page)).repairs).toEqual([false, false, false]); await expect(caption).toHaveValue('');
  await control(page, 'observe'); await operate(page, 'magnet'); await control(page, 'apply');
  await caption.fill('Recovered iron secures brackets so the workbench can be used again.');
  await control(page, 'check'); await control(page, 'next');
  expect((await workshop(page)).repairs).toEqual([true, false, false]);
  await expect(caption).toHaveValue('');
  await control(page, 'observe');
  await operate(page, 'filter'); await operate(page, 'sieve', ['stones', 'sand']);
  expect((await workshop(page)).streams.some(s => s.parts.join(',') === 'sand')).toBe(true);
  expect((await workshop(page)).streams.find(s => s.parts.join(',') === 'sand').damp).toBe(true);
  await page.screenshot({ path: `${dir}/reference-courtyard.png` });
  await control(page, 'apply'); await caption.fill('Recovered sand provides the courtyard repair bed and avoids wasting usable material.');
  await control(page, 'check'); await control(page, 'retry');
  expect((await workshop(page)).repairs).toEqual([true, false, false]); expect((await state(page)).score).toBe(25);
  await control(page, 'observe'); await operate(page, 'sieve'); await operate(page, 'filter');
  await page.screenshot({ path: `${dir}/courtyard-chain.png` });
  await control(page, 'apply'); await caption.fill('Recovered sand provides the courtyard repair bed and avoids wasting usable material.');
  await control(page, 'check'); await control(page, 'next');
  expect((await workshop(page)).repairs).toEqual([true, true, false]);
  await control(page, 'observe'); await operate(page, 'evaporate'); await control(page, 'apply');
  expect((await workshop(page)).repairs[2]).toBe(false);
  await control(page, 'reset'); expect((await workshop(page)).repairs).toEqual([true, true, false]);
  await control(page, 'observe'); await operate(page, 'filter'); await operate(page, 'evaporate');
  await control(page, 'apply'); await caption.fill('Recovered sand and dry salt are kept separately for future workshop jobs.');
  await page.screenshot({ path: `${dir}/storage.png` });
  await control(page, 'check'); expect((await state(page)).science.phase).toBe('finished');
  expect((await state(page)).score).toBe(75); expect((await workshop(page)).repairs).toEqual([true, true, true]);
  await page.screenshot({ path: `${dir}/completed.png` });
  const downloaded = page.waitForEvent('download'); await control(page, 'download');
  const file = await downloaded; expect(file.suggestedFilename()).toBe('lumify-workshop-mission-records.json');
  const report = JSON.parse(await readFile(await file.path(), 'utf8'));
  expect(report.reports).toHaveLength(3); expect(report.reports.every(r => r.reviewRequired && r.explanation.length >= 20)).toBe(true);
  expect(report.reports[2].outputsKept[0].parts).toEqual(['vapor']);
  await control(page, 'next'); await ready(page, 'QuarterDetailScene'); await expect(caption).toHaveCount(0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('lumify-science-q1-v1'))['q1-m4-l5']);
  expect(saved).toMatchObject({ completed: true, score: 75, bestScore: 75, reviewRequired: true });
  expect(saved.competencies).toHaveLength(3); expect(saved.records.every(r => r.reviewRequired)).toBe(true);
  await clickGame(page, 460, 540); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await workshop(page)).repairs).toEqual([false, false, false]);
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  expect(errors).toEqual([]);
});
