import { test, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { clickGame, ready, startFromMenu } from './helpers/intro.js';

test.use({ trace: 'off' });
const state = page => page.evaluate(() => window.__TEST__.state());
const captions = [
  'Sieving removes larger stones from the sand. The building yard can reuse the recovered fine sand.',
  'A magnet attracts iron from the sand. The repair yard can reuse the recovered iron instead of throwing it away.',
  'Evaporation removes water as vapor and leaves salt in the dish. The salt maker recovers a useful product for the community.',
];
async function control(page, id) {
  const item = (await state(page)).science.controls.find(c => c.id === id);
  expect(item, `Missing ${id}`).toBeTruthy(); await clickGame(page, item.x, item.y);
}
async function compose(page, caption) {
  for (let i = 0; i < 3; i++) { await control(page, `panel-${i}`); await control(page, `photo-${i}`); }
  const field = page.getByRole('textbox', { name: 'Field report explanation' });
  await field.fill(caption); await field.blur();
}
async function download(page) {
  const result = page.waitForEvent('download'); await control(page, 'download');
  const file = await result;
  expect(file.suggestedFilename()).toBe('lumify-science-field-reports.json');
  return JSON.parse(await readFile(await file.path(), 'utf8'));
}

test('Lumi Field Report preserves writing, validates picture order and downloads all three reports for review', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const shots = `screenshots/field-report/${testInfo.project.name}`;
  await mkdir(shots, { recursive: true });
  await page.goto('/?test=1'); await ready(page, 'MenuScene'); await startFromMenu(page);
  await clickGame(page, 200, 515); await clickGame(page, 200, 515); await ready(page, 'IslandMapScene');
  await clickGame(page, 620, 524); await ready(page, 'QuarterDetailScene');
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1250));
  await clickGame(page, 820, 650); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  expect((await state(page)).minigameId).toBe('science-report');
  const nav = (await state(page)).minigameControls;
  expect(nav.back).toMatchObject({ x: 46, y: 678 });
  expect(nav.help).toMatchObject({ x: 1135, y: 37 });
  expect(nav.settings).toMatchObject({ x: 1209, y: 37 });
  const field = page.getByRole('textbox', { name: 'Field report explanation' });
  await expect(field).toBeVisible(); await expect(field).toHaveAttribute('maxlength', '180');
  const box = await field.boundingBox(), canvas = await page.locator('canvas').boundingBox();
  expect((box.x - canvas.x) / canvas.width * 1280).toBeCloseTo(710, 0);
  expect(box.x + box.width).toBeLessThan(canvas.x + canvas.width);
  await page.screenshot({ path: `${shots}/initial.png` });
  await control(page, 'check');
  expect((await state(page)).science.state.message).toContain('Fill Before');
  await compose(page, captions[0]);
  await control(page, 'panel-0'); await control(page, 'photo-4'); await control(page, 'check');
  expect((await state(page)).science.phase).toBe('playing');
  expect((await state(page)).science.state.message).toContain('Check the images');
  await page.screenshot({ path: `${shots}/wrong-image.png` });
  await control(page, 'reset');
  await compose(page, 'Sand.'); await control(page, 'check');
  expect((await state(page)).science.state.message).toContain('20 characters');
  await control(page, 'reset');
  await compose(page, captions[0]);
  await field.fill('a'.repeat(180)); await field.press('End'); await field.pressSequentially('extra');
  await expect(field).toHaveValue('a'.repeat(180));
  expect((await state(page)).science.state.caption).toHaveLength(180);
  await field.fill(captions[0]); await field.blur();
  const before = (await state(page)).science.state;
  for (const [name, modal] of [['help', 'minigame-help'], ['settings', 'science-settings']]) {
    await clickGame(page, nav[name].x, nav[name].y);
    await expect.poll(async () => (await state(page)).openModal).toBe(modal);
    await expect(field).toBeHidden();
    if (name === 'help') {
      await page.screenshot({ path: `${shots}/how-to-play.png` });
      await clickGame(page, 100, 545); expect((await state(page)).science.state).toEqual(before);
      await clickGame(page, 640, 611);
    } else await page.keyboard.press('Escape');
    await expect(field).toBeVisible(); await expect(field).toHaveValue(captions[0]);
    expect((await state(page)).science.state).toEqual(before);
  }
  await page.screenshot({ path: `${shots}/building-report.png` });
  await control(page, 'check'); expect((await state(page)).score).toBe(25);
  await expect(field).toHaveAttribute('readonly', '');
  const complete = (await state(page)).science.state;
  await control(page, 'panel-0'); await control(page, 'photo-4');
  await field.press('End'); await field.pressSequentially('x'); await field.blur();
  expect((await state(page)).science.state).toEqual(complete);
  await page.screenshot({ path: `${shots}/saved-for-review.png` });
  let exported = await download(page);
  expect(exported.reports).toHaveLength(1);
  expect(exported.reports[0]).toMatchObject({ title: 'SAND FOR BUILDING', explanation: captions[0], reviewRequired: true });
  expect(exported.reports[0].images.map(i => i.label)).toEqual(['Sand + stones', 'Sieve', 'Usable sand']);
  await control(page, 'retry'); expect((await state(page)).score).toBe(0);
  await expect(field).not.toHaveAttribute('readonly'); await expect(field).toHaveValue('');
  expect((await state(page)).science.state.panels).toEqual([null, null, null]);
  await compose(page, captions[0]); await control(page, 'check'); expect((await state(page)).score).toBe(25);
  await control(page, 'next');
  for (let round = 1; round < 3; round++) {
    await compose(page, captions[round]);
    await page.screenshot({ path: `${shots}/${round === 1 ? 'iron-report' : 'salt-report'}.png` });
    await control(page, 'check');
    expect((await state(page)).science.phase).toBe(round === 2 ? 'finished' : 'complete');
    expect((await state(page)).score).toBe((round + 1) * 25);
    if (round === 1) await control(page, 'next');
  }
  await page.screenshot({ path: `${shots}/completed-activity.png` });
  exported = await download(page);
  expect(exported.reports).toHaveLength(3);
  expect(exported.reports.map(r => r.explanation)).toEqual(captions);
  expect(exported.records.every(r => r.reviewRequired)).toBe(true);
  expect(exported.reviewNote).toContain('teacher review');
  await control(page, 'next'); await ready(page, 'QuarterDetailScene');
  await expect(field).toHaveCount(0);
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('lumify-science-q1-v1')));
  expect(progress['q1-m3-l5']).toMatchObject({ completed: true, bestScore: 75, reviewRequired: true });
  await clickGame(page, 820, 650); await clickGame(page, 535, 527); await ready(page, 'ScienceAdventureScene');
  await expect(field).toHaveCount(1); await expect(field).toHaveValue('');
  expect((await download(page)).reports).toHaveLength(3);
  await clickGame(page, nav.back.x, nav.back.y); await ready(page, 'QuarterDetailScene');
  await expect(field).toHaveCount(0);
  expect(errors).toEqual([]);
});
