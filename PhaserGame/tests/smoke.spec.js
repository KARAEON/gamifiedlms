import { expect, test } from '@playwright/test';

async function waitForReady(page, sceneKey) {
  await page.waitForFunction((expectedScene) => {
    return window.__TEST__?.ready && window.__TEST__?.sceneKey === expectedScene;
  }, sceneKey);
}

async function canvasLooksNonBlank(page) {
  return page.evaluate(async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      return false;
    }

    const image = new Image();
    image.src = canvas.toDataURL('image/png');
    await image.decode();

    const probe = document.createElement('canvas');
    probe.width = 64;
    probe.height = 36;
    const context = probe.getContext('2d');
    context.drawImage(image, 0, 0, probe.width, probe.height);
    const pixels = context.getImageData(0, 0, probe.width, probe.height).data;
    let variedPixels = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      if (r !== g || g !== b || r > 20) {
        variedPixels += 1;
      }
    }

    return variedPixels > 400;
  });
}

async function clickGame(page, gameX, gameY) {
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  await page.mouse.click(
    box.x + (gameX / 1280) * box.width,
    box.y + (gameY / 720) * box.height,
  );
}

test.describe('Lumi Adventures UI flow', () => {
  test('menu, island select, and vulcan map nodes work', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    await page.goto('/?test=1');
    await waitForReady(page, 'MenuScene');
    await expect.poll(() => canvasLooksNonBlank(page)).toBe(true);

    await clickGame(page, 640, 344);
    await waitForReady(page, 'IslandSelectScene');
    await expect.poll(() => canvasLooksNonBlank(page)).toBe(true);

    await clickGame(page, 255, 378);
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).lockedFeedback).toBe('numeric-ruins');
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).sceneKey).toBe('IslandSelectScene');

    await clickGame(page, 640, 620);
    await waitForReady(page, 'IslandMapScene');
    await expect.poll(() => canvasLooksNonBlank(page)).toBe(true);

    await clickGame(page, 215, 530);
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).openModal).toBe('level');
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).selectedNode).toBe('level-1');

    await clickGame(page, 640, 435);
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).openModal).toBe(null);

    await clickGame(page, 520, 390);
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).openModal).toBe('level');
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).selectedNode).toBe('q2');

    expect(consoleErrors).toEqual([]);
  });
});
