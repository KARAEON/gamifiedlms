import { expect, test } from '@playwright/test';
import { clickGame, hoverGame, ready, startFromMenu } from './helpers/intro.js';
import { islandCurricula } from '../src/config/content.js';

test('hover previews island subjects and a single click opens each pilot map', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const mapLoads = [];
  page.on('response', response => {
    if (new URL(response.url()).pathname === '/assets/world/3-pilot-world-map.png') mapLoads.push(response.status());
  });
  await page.goto('/?test=1');
  await ready(page, 'MenuScene');
  await startFromMenu(page);
  const regions = await page.evaluate(() => window.__TEST__.islandPositions);
  expect(regions.filter((region) => region.unlocked).map((region) => region.id))
    .toEqual(['vulcan-caverns', 'reading-island', 'numeric-ruins']);
  expect(await page.evaluate(() => window.__TEST__.worldBackground)).toBe('pilot-world');
  expect(mapLoads).toContain(200);
  await page.screenshot({ path: testInfo.outputPath('pilot-world.png') });

  for (const region of regions.filter((region) => !region.unlocked)) {
    await hoverGame(page, region.x, region.y);
    await expect.poll(() => page.evaluate(() => window.__TEST__.selectedOutline)).toBe(region.id);
    expect(await page.evaluate(() => window.__TEST__.islandEntryAvailable)).toBe(false);
    await clickGame(page, region.x, region.y);
    expect(await page.evaluate(() => window.__TEST__.sceneKey)).toBe('IslandSelectScene');
    if (region.id === 'concord-grove') {
      await page.screenshot({ path: testInfo.outputPath('covered-island-outline.png') });
    }
  }

  for (const region of regions.filter((region) => region.unlocked)) {
    await hoverGame(page, region.x, region.y);
    await expect.poll(() => page.evaluate(() => window.__TEST__.selectedOutline)).toBe(region.id);
    await expect.poll(() => page.evaluate(() => window.__TEST__.islandEntryAvailable)).toBe(true);
    expect(await page.evaluate(() => window.__TEST__.islandInfoSubject)).toBe({
      'vulcan-caverns': 'Science', 'reading-island': 'English', 'numeric-ruins': 'Mathematics',
    }[region.id]);
    expect(await page.evaluate(() => window.__TEST__.sceneKey)).toBe('IslandSelectScene');
    await page.screenshot({ path: testInfo.outputPath(`${region.id}-hover.png`) });
    await hoverGame(page, 1260, 700);
    await expect.poll(() => page.evaluate(() => window.__TEST__.selectedOutline)).toBeNull();
    expect(await page.evaluate(() => window.__TEST__.islandInfoSubject)).toBeNull();
    await clickGame(page, region.x, region.y);
    await ready(page, 'IslandMapScene');
    expect(await page.evaluate(() => window.__TEST__.selectedIsland)).toBe(region.id);
    expect(await page.evaluate(() => window.__TEST__.worldBackground)).toBe(`${region.id}-map`);
    expect(await page.evaluate(() => window.__TEST__.mapQuarterNodeCount)).toBe(4);
    await page.screenshot({ path: testInfo.outputPath(`${region.id}-map.png`) });
    if (region.id !== 'vulcan-caverns') {
      for (const quarter of islandCurricula[region.id].nodes) {
        await clickGame(page, quarter.x, quarter.y);
        await ready(page, 'QuarterDetailScene');
        const state = await page.evaluate(() => window.__TEST__.state());
        expect(state.selectedIsland).toBe(region.id);
        expect(state.selectedQuarter).toBe(quarter.id);
        expect(state.quarterMajorCount).toBe(4);
        expect(state.quarterLessonCount).toBe(20);
        if (quarter.id === 'q1') {
          await page.screenshot({ path: testInfo.outputPath(`${region.id}-daily-games.png`) });
          await clickGame(page, 760, 500);
          await expect.poll(() => page.evaluate(() => window.__TEST__.selectedLesson))
            .toBe(`${region.id}-q1-week-1-day-1`);
          await expect.poll(() => page.evaluate(() => window.__TEST__.openModal)).toBe('lesson');
          expect(await page.evaluate(() => window.__TEST__.sceneKey)).toBe('QuarterDetailScene');
          await page.screenshot({ path: testInfo.outputPath(`${region.id}-day-placeholder.png`) });
          await page.keyboard.press('Escape');
          await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(1700));
          const scrollY = await page.evaluate(() => window.__TEST__.scrollY);
          await clickGame(page, 850, 2070 - scrollY);
          await expect.poll(() => page.evaluate(() => window.__TEST__.selectedMajor))
            .toBe(`${region.id}-q1-week-4`);
          await expect.poll(() => page.evaluate(() => window.__TEST__.openModal)).toBe('major');
          await page.keyboard.press('Escape');
          await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(2020));
          await clickGame(page, 460, 420);
          await expect.poll(() => page.evaluate(() => window.__TEST__.selectedLesson))
            .toBe(`${region.id}-q1-week-4-day-5`);
          await expect.poll(() => page.evaluate(() => window.__TEST__.openModal)).toBe('lesson');
          await page.keyboard.press('Escape');
        }
        await clickGame(page, 64, 62);
        await ready(page, 'IslandMapScene');
        expect(await page.evaluate(() => window.__TEST__.selectedIsland)).toBe(region.id);
      }
    }
    await clickGame(page, 64, 62);
    await ready(page, 'IslandSelectScene');
  }
  expect(errors).toEqual([]);
});

test('touch previews an island before entering on a second tap', async ({ browser }, testInfo) => {
  test.setTimeout(60000);
  const context = await browser.newContext({
    viewport: testInfo.project.use.viewport, hasTouch: true,
  });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:5173/?test=1');
    await ready(page, 'MenuScene');
    await startFromMenu(page);
    const tap = async (x, y) => {
      const box = await page.locator('canvas').boundingBox();
      await page.touchscreen.tap(box.x + x * box.width / 1280, box.y + y * box.height / 720);
    };
    await tap(200, 515);
    await expect.poll(() => page.evaluate(() => window.__TEST__.islandInfoSubject)).toBe('Science');
    expect(await page.evaluate(() => window.__TEST__.sceneKey)).toBe('IslandSelectScene');
    await tap(200, 515);
    await ready(page, 'IslandMapScene');
    await tap(64, 62);
    await ready(page, 'IslandSelectScene');
    await tap(263, 143);
    await tap(263, 143);
    expect(await page.evaluate(() => window.__TEST__.sceneKey)).toBe('IslandSelectScene');
    await tap(52, 48);
    await expect.poll(() => page.evaluate(() => window.__TEST__.openModal)).toBe('settings');
    expect(await page.evaluate(() => window.__TEST__.islandInfoSubject)).toBeNull();
  } finally {
    await context.close();
  }
});
