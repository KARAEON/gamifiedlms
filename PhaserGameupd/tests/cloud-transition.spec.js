import { expect, test } from '@playwright/test';
import { startFromMenu, exitWorld } from './helpers/intro.js';

async function ready(page, scene, timeout = 30000) {
  await page.waitForFunction((key) => window.__TEST__?.ready && window.__TEST__.sceneKey === key, scene, { timeout });
}

async function clickGame(page, x, y) {
  const box = await page.locator('canvas').boundingBox();
  await page.mouse.click(box.x + x * box.width / 1280, box.y + y * box.height / 720);
}

test('cloud transition reveals the world and blocks selection until complete', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?test=1');
  await ready(page, 'MenuScene');
  await page.evaluate(() => window.__TEST__.commands.playCloudTransition());
  await page.waitForFunction(() => window.__TEST__?.cloudTransition === 'playing');
  await clickGame(page, 200, 515);
  await expect.poll(() => page.evaluate(() => window.__TEST__.selectedIsland)).toBeNull();
  await ready(page, 'IslandSelectScene');
  await clickGame(page, 263, 143);
  await expect.poll(() => page.evaluate(() => window.__TEST__.lockedFeedback)).toBe('unknown');
  await exitWorld(page);
  await page.evaluate(() => window.__TEST__.commands.playCloudTransition());
  await page.waitForFunction(() => window.__TEST__?.cloudTransition === 'playing');
  await ready(page, 'IslandSelectScene');
  expect(errors).toEqual([]);
});

test('a failed reusable cloud video still opens the world', async ({ page }) => {
  await page.route('**/assets/video/cloud-zoom.webm', (route) => route.abort());
  await page.goto('/?test=1');
  await ready(page, 'MenuScene');
  await page.evaluate(() => window.__TEST__.commands.playCloudTransition());
  await ready(page, 'IslandSelectScene');
  await clickGame(page, 200, 515);
  await expect.poll(() => page.evaluate(() => window.__TEST__.selectedIsland)).toBe('vulcan-caverns');
});

test('world selections keep working after returning from Vulcan', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?test=1');
  await ready(page, 'MenuScene');
  await startFromMenu(page);

  for (let visit = 0; visit < 2; visit += 1) {
    await clickGame(page, 200, 515);
    await expect.poll(() => page.evaluate(() => window.__TEST__.selectedIsland)).toBe('vulcan-caverns');
    await clickGame(page, 200, 515);
    await ready(page, 'IslandMapScene');
    await clickGame(page, 64, 62);
    await ready(page, 'IslandSelectScene', 5000);
    await clickGame(page, 263, 143);
    await expect.poll(() => page.evaluate(() => window.__TEST__.lockedFeedback)).toBe('unknown');
  }

  await exitWorld(page);
  expect(errors).toEqual([]);
});
