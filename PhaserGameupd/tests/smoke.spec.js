import { expect, test } from '@playwright/test';

test.setTimeout(240_000);

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

async function dragGame(page, fromX, fromY, toX, toY) {
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  await page.mouse.move(
    box.x + (fromX / 1280) * box.width,
    box.y + (fromY / 720) * box.height,
  );
  await page.mouse.down();
  await page.mouse.move(
    box.x + (toX / 1280) * box.width,
    box.y + (toY / 720) * box.height,
    { steps: 8 },
  );
  await page.mouse.up();
}

async function getState(page) {
  return page.evaluate(() => window.__TEST__.state());
}

async function clickCard(page, card) {
  await clickGame(page, card.x, card.y);
}

async function clickLessonOne(page) {
  await clickGame(page, 760, 500);
}

async function clickLessonTwo(page) {
  await clickGame(page, 640, 580);
}

async function clickLessonThree(page) {
  await clickGame(page, 790, 660);
}

async function clickLessonFour(page) {
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(170));
  await expect.poll(async () => (await getState(page)).scrollY).toBe(170);
  await clickGame(page, 670, 570);
}

async function clickLessonFive(page) {
  await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(170));
  await expect.poll(async () => (await getState(page)).scrollY).toBe(170);
  await clickGame(page, 820, 650);
}

async function clickModalStart(page) {
  await clickGame(page, 535, 527);
}

async function clickAssessmentCorrectChoice(page) {
  const state = await getState(page);
  const option = state.assessmentOptions.find((candidate) => candidate.correct);
  expect(option).toBeTruthy();
  await clickGame(page, option.x, option.y);
}

async function clickAssessmentNext(page) {
  const state = await getState(page);
  expect(state.assessmentNextButton).toBeTruthy();
  await clickGame(page, state.assessmentNextButton.x, state.assessmentNextButton.y);
}

async function completeAssessmentCorrectly(page) {
  while ((await getState(page)).assessmentResult === null) {
    const beforeIndex = (await getState(page)).assessmentItemIndex;
    await clickAssessmentCorrectChoice(page);
    await expect.poll(async () => (await getState(page)).assessmentScore).toBe(beforeIndex + 1);
    await clickAssessmentNext(page);
  }
}

async function startAssessmentAndReturn(page, expectedType, expectedItemCount, options = {}) {
  await clickGame(page, 640, 472);
  await waitForReady(page, 'AssessmentScene');
  await expect.poll(async () => (await getState(page)).openModal).toBe('assessment-intro');
  await expect.poll(async () => (await getState(page)).assessmentType).toBe(expectedType);
  await expect.poll(async () => (await getState(page)).assessmentItemCount).toBe(expectedItemCount);
  await expect.poll(async () => (await getState(page)).assessmentPhase).toBe('intro');

  await clickGame(page, 535, 487);
  await expect.poll(async () => (await getState(page)).assessmentPhase).toBe('quiz');
  await expect.poll(async () => (await getState(page)).assessmentOptions.length).toBeGreaterThan(0);

  if (options.complete) {
    await completeAssessmentCorrectly(page);
    await expect.poll(async () => (await getState(page)).openModal).toBe('assessment-pass');
    await expect.poll(async () => (await getState(page)).assessmentPercent).toBe(100);
    await clickGame(page, 640, 487);
    await waitForReady(page, 'QuarterDetailScene');
    return;
  }

  await page.keyboard.press('Backspace');
  await waitForReady(page, 'QuarterDetailScene');
}

async function clickMixedUniformSet(page) {
  const state = await getState(page);
  const cards = [
    state.mixMatchCards.find((card) => card.id === 'uniform-orange-juice-term'),
    state.mixMatchCards.find((card) => card.id === 'uniform-salt-water-picture'),
    state.mixMatchCards.find((card) => card.id === 'uniform-orange-juice-description'),
  ];

  for (const card of cards) {
    expect(card).toBeTruthy();
    await clickCard(page, card);
  }
}

async function clickNextConceptSet(page) {
  const state = await getState(page);
  const conceptIds = ['uniform', 'nonuniform'];

  for (const conceptId of conceptIds) {
    const cards = ['term', 'picture', 'description'].map((type) => {
      return state.mixMatchCards.find((card) => {
        return card.conceptId === conceptId && card.type === type && !card.matched && !card.flipped;
      });
    });

    if (cards.every(Boolean)) {
      for (const card of cards) {
        await clickCard(page, card);
      }
      return conceptId;
    }
  }

  throw new Error('No playable concept set was available.');
}

async function clickSupplyCartActiveItem(page) {
  const state = await getState(page);
  const item = state.supplyCartItems.find((candidate) => candidate.id === state.activeItemId);
  expect(item).toBeTruthy();
  await clickGame(page, item.x, item.y + 34);
  return item;
}

async function clickSupplyCartBin(page, binId) {
  const state = await getState(page);
  const bin = state.supplyCartBins.find((candidate) => candidate.id === binId);
  expect(bin).toBeTruthy();
  await clickGame(page, bin.x, bin.y);
}

async function clickCorrectUse(page) {
  const state = await getState(page);
  const choice = state.useChoices.find((candidate) => candidate.correct);
  expect(choice).toBeTruthy();
  await clickGame(page, choice.x, choice.y);
}

async function sortActiveSupplyItem(page) {
  const item = await clickSupplyCartActiveItem(page);
  await clickSupplyCartBin(page, item.type);
  await expect.poll(async () => (await getState(page)).usePanelOpen).toBe(true);
  await clickCorrectUse(page);
}

async function openQuarterOne(page) {
  await page.goto('/?test=1');
  await waitForReady(page, 'MenuScene');
  await clickGame(page, 640, 344);
  await waitForReady(page, 'IslandSelectScene');
  await clickGame(page, 640, 620);
  await waitForReady(page, 'IslandMapScene');
  await clickGame(page, 620, 524);
  await waitForReady(page, 'QuarterDetailScene');
}

async function clickDetectiveCorrectOption(page) {
  const state = await getState(page);
  const option = state.detectiveOptions.find((candidate) => candidate.correct);
  expect(option).toBeTruthy();
  await clickGame(page, option.x, option.y);
}

async function clickDetectiveWrongOption(page) {
  const state = await getState(page);
  const option = state.detectiveOptions.find((candidate) => !candidate.correct);
  expect(option).toBeTruthy();
  await clickGame(page, option.x, option.y);
}

async function clickDetectiveNext(page) {
  const state = await getState(page);
  expect(state.detectiveNextButton).toBeTruthy();
  await clickGame(page, state.detectiveNextButton.x, state.detectiveNextButton.y);
}

async function clickDetectiveChip(page, slot, value) {
  const state = await getState(page);
  const chip = state.detectiveFinalChips.find((candidate) => candidate.slot === slot && candidate.value === value);
  expect(chip).toBeTruthy();
  await clickGame(page, chip.x, chip.y);
}

async function clickDetectiveCheck(page) {
  const state = await getState(page);
  expect(state.detectiveCheckButton).toBeTruthy();
  await clickGame(page, state.detectiveCheckButton.x, state.detectiveCheckButton.y);
}

async function clickCourtClassification(page, predicate) {
  const state = await getState(page);
  const option = state.courtClassificationOptions.find(predicate);
  expect(option).toBeTruthy();
  await clickGame(page, option.x, option.y);
}

async function clickCourtEvidence(page, predicate) {
  const state = await getState(page);
  const option = state.courtEvidenceOptions.find(predicate);
  expect(option).toBeTruthy();
  await clickGame(page, option.x, option.y);
}

async function clickCourtSubmit(page) {
  const state = await getState(page);
  expect(state.courtSubmitButton).toBeTruthy();
  await clickGame(page, state.courtSubmitButton.x, state.courtSubmitButton.y);
}

async function clickCourtNext(page) {
  const state = await getState(page);
  expect(state.courtNextButton).toBeTruthy();
  await clickGame(page, state.courtNextButton.x, state.courtNextButton.y);
}

async function clickCourtRetry(page) {
  const state = await getState(page);
  expect(state.courtRetryButton).toBeTruthy();
  await clickGame(page, state.courtRetryButton.x, state.courtRetryButton.y);
}

async function completeCourtCaseCorrectly(page) {
  await clickCourtClassification(page, (option) => option.correct);
  let state = await getState(page);
  const correctEvidence = state.courtEvidenceOptions.filter((option) => option.correct);
  for (const evidence of correctEvidence) {
    await clickGame(page, evidence.x, evidence.y);
  }
  await clickCourtSubmit(page);
}

async function clickInventIngredient(page, predicate) {
  const state = await getState(page);
  const option = state.inventIngredientOptions.find(predicate);
  expect(option).toBeTruthy();
  await clickGame(page, option.x, option.y);
}

async function clickInventClassification(page, predicate) {
  const state = await getState(page);
  const option = state.inventClassificationOptions.find(predicate);
  expect(option).toBeTruthy();
  await clickGame(page, option.x, option.y);
}

async function clickInventAppearance(page, predicate) {
  const state = await getState(page);
  const option = state.inventAppearanceOptions.find(predicate);
  expect(option).toBeTruthy();
  await clickGame(page, option.x, option.y);
}

async function clickInventUse(page, predicate) {
  const state = await getState(page);
  const option = state.inventUseOptions.find(predicate);
  expect(option).toBeTruthy();
  await clickGame(page, option.x, option.y);
}

async function clickInventMix(page) {
  const state = await getState(page);
  expect(state.inventMixButton).toBeTruthy();
  await clickGame(page, state.inventMixButton.x, state.inventMixButton.y);
}

async function clickInventNameField(page) {
  const state = await getState(page);
  expect(state.inventNameField).toBeTruthy();
  await clickGame(page, state.inventNameField.x, state.inventNameField.y);
}

async function clickInventPresent(page) {
  const state = await getState(page);
  expect(state.inventPresentButton).toBeTruthy();
  await clickGame(page, state.inventPresentButton.x, state.inventPresentButton.y);
}

async function clickInventNext(page) {
  const state = await getState(page);
  expect(state.inventNextButton).toBeTruthy();
  await clickGame(page, state.inventNextButton.x, state.inventNextButton.y);
}

async function clickInventRetry(page) {
  const state = await getState(page);
  expect(state.inventRetryButton).toBeTruthy();
  await clickGame(page, state.inventRetryButton.x, state.inventRetryButton.y);
}

async function completeInventMissionCorrectly(page) {
  const state = await getState(page);
  const correctIngredients = state.inventIngredientOptions.filter((option) => option.correct);
  for (const ingredient of correctIngredients) {
    await clickGame(page, ingredient.x, ingredient.y);
  }
  await clickInventMix(page);
  await clickInventClassification(page, (option) => option.correct);
  await clickInventAppearance(page, (option) => option.correct);
  await clickInventUse(page, (option) => option.correct);
  await clickInventPresent(page);
}

test.describe('Lumi Adventures UI flow', () => {
  test('menu, island select, vulcan map, and mixture minigame work', async ({ page }, testInfo) => {
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

    for (let index = 0; index < 8; index += 1) {
      await clickGame(page, 255, 378);
    }
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).lockedFeedback).toBe('numeric-ruins');
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).sceneKey).toBe('IslandSelectScene');
    await expect.poll(async () => {
      const state = await getState(page);
      const numericIsland = state.islandPositions.find((island) => island.id === 'numeric-ruins');
      return numericIsland?.x;
    }).toBe(255);
    await expect.poll(async () => {
      const state = await getState(page);
      const numericIsland = state.islandPositions.find((island) => island.id === 'numeric-ruins');
      return numericIsland?.y;
    }).toBe(378);

    await clickGame(page, 640, 620);
    await waitForReady(page, 'IslandMapScene');
    await expect.poll(() => canvasLooksNonBlank(page)).toBe(true);
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).mapQuarterNodeCount).toBe(4);
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).mapSmallNodeCount).toBe(0);

    await clickGame(page, 1134, 543);
    await waitForReady(page, 'QuarterDetailScene');
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).selectedQuarter).toBe('q2');
    await page.keyboard.press('Backspace');
    await waitForReady(page, 'IslandMapScene');

    await clickGame(page, 620, 524);
    await waitForReady(page, 'QuarterDetailScene');
    await expect.poll(() => canvasLooksNonBlank(page)).toBe(true);
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).selectedQuarter).toBe('q1');
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).quarterMajorCount).toBe(3);
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).quarterLessonCount).toBe(15);

    await clickGame(page, 430, 450);
    await expect.poll(async () => (await getState(page)).openModal).toBe('major');
    await expect.poll(async () => (await getState(page)).selectedMajor).toBe('q1-major-1');

    await clickGame(page, 640, 435);
    await expect.poll(async () => (await getState(page)).openModal).toBe(null);

    await clickLessonOne(page);
    await expect.poll(async () => (await getState(page)).openModal).toBe('minigame-info-mix-match-memory-quest');
    await clickModalStart(page);
    await waitForReady(page, 'MixMatchScene');
    await expect.poll(() => canvasLooksNonBlank(page)).toBe(true);
    await expect.poll(async () => (await getState(page)).minigameId).toBe('mix-match-memory-quest');
    await expect.poll(async () => (await getState(page)).totalCardCount).toBe(12);
    await expect.poll(async () => (await getState(page)).totalSetCount).toBe(4);
    await page.screenshot({ path: testInfo.outputPath('mixmatch-initial.png') });

    await page.keyboard.press('Escape');
    await waitForReady(page, 'QuarterDetailScene');
    await clickLessonOne(page);
    await expect.poll(async () => (await getState(page)).openModal).toBe('minigame-info-mix-match-memory-quest');
    await clickModalStart(page);
    await waitForReady(page, 'MixMatchScene');
    await clickGame(page, 64, 62);
    await waitForReady(page, 'QuarterDetailScene');
    await clickLessonOne(page);
    await expect.poll(async () => (await getState(page)).openModal).toBe('minigame-info-mix-match-memory-quest');
    await clickModalStart(page);
    await waitForReady(page, 'MixMatchScene');

    let minigameState = await getState(page);
    const setIds = [...new Set(minigameState.mixMatchCards.map((card) => card.setId))];
    const wrongCards = [
      minigameState.mixMatchCards.find((card) => card.setId === setIds[0] && card.type === 'term'),
      minigameState.mixMatchCards.find((card) => card.setId === setIds[0] && card.type === 'picture'),
      minigameState.mixMatchCards.find((card) => card.setId === setIds[2] && card.type === 'description'),
    ];
    for (const card of wrongCards) {
      expect(card).toBeTruthy();
      await clickCard(page, card);
    }
    await expect.poll(async () => (await getState(page)).flippedCount).toBe(3);
    await page.screenshot({ path: testInfo.outputPath('mixmatch-wrong-feedback.png') });
    await expect.poll(async () => (await getState(page)).flippedCount).toBe(0);
    await expect.poll(async () => (await getState(page)).matchedSetCount).toBe(0);

    await clickMixedUniformSet(page);
    await expect.poll(async () => (await getState(page)).matchedSetCount).toBe(1);
    await page.screenshot({ path: testInfo.outputPath('mixmatch-correct-feedback.png') });

    while ((await getState(page)).matchedSetCount < 4) {
      const beforeCount = (await getState(page)).matchedSetCount;
      await clickNextConceptSet(page);
      await expect.poll(async () => (await getState(page)).matchedSetCount).toBe(beforeCount + 1);
    }

    await expect.poll(async () => (await getState(page)).openModal).toBe('result-win');
    await expect.poll(async () => (await getState(page)).gameResult).toBe('win');
    await expect.poll(async () => (await getState(page)).score).toBeGreaterThanOrEqual(130);
    await page.screenshot({ path: testInfo.outputPath('mixmatch-win-modal.png') });

    await startAssessmentAndReturn(page, 'formative', 5, { complete: true });

    await clickLessonTwo(page);
    await expect.poll(async () => (await getState(page)).openModal).toBe('minigame-info-supply-cart-sorting');
    await clickModalStart(page);
    await waitForReady(page, 'SupplyCartScene');
    await expect.poll(() => canvasLooksNonBlank(page)).toBe(true);
    await expect.poll(async () => (await getState(page)).minigameId).toBe('supply-cart-sorting');
    await expect.poll(async () => (await getState(page)).totalItemCount).toBe(6);
    await expect.poll(async () => (await getState(page)).activeItemId).toBe('salt-water');
    await page.screenshot({ path: testInfo.outputPath('supplycart-initial.png') });

    await clickSupplyCartActiveItem(page);
    await clickSupplyCartBin(page, 'nonuniform');
    await expect.poll(async () => (await getState(page)).sortAttempts).toBe(1);
    await expect.poll(async () => (await getState(page)).sortedCount).toBe(0);
    await expect.poll(async () => (await getState(page)).usePanelOpen).toBe(false);
    await page.screenshot({ path: testInfo.outputPath('supplycart-wrong-sort.png') });
    await expect.poll(async () => {
      const state = await getState(page);
      const item = state.supplyCartItems.find((candidate) => candidate.id === 'salt-water');
      return Math.round(item.x - item.homeX);
    }).toBe(0);

    await clickSupplyCartActiveItem(page);
    await clickSupplyCartBin(page, 'uniform');
    await expect.poll(async () => (await getState(page)).usePanelOpen).toBe(true);
    await expect.poll(async () => (await getState(page)).sortedCount).toBe(1);
    await expect.poll(async () => (await getState(page)).score).toBe(10);
    await page.screenshot({ path: testInfo.outputPath('supplycart-use-panel.png') });

    await clickCorrectUse(page);
    await expect.poll(async () => (await getState(page)).completedItemCount).toBe(1);
    await expect.poll(async () => (await getState(page)).score).toBe(15);
    await expect.poll(async () => (await getState(page)).activeItemId).toBe('juice');

    while ((await getState(page)).completedItemCount < 6) {
      const beforeCount = (await getState(page)).completedItemCount;
      await sortActiveSupplyItem(page);
      await expect.poll(async () => (await getState(page)).completedItemCount).toBe(beforeCount + 1);
    }

    await expect.poll(async () => (await getState(page)).openModal).toBe('result-win');
    await expect.poll(async () => (await getState(page)).gameResult).toBe('win');
    await expect.poll(async () => (await getState(page)).sortAccuracy).toBeGreaterThanOrEqual(80);
    await page.screenshot({ path: testInfo.outputPath('supplycart-win-modal.png') });
    await startAssessmentAndReturn(page, 'formative', 5);

    const initialScrollY = await page.evaluate(() => window.__TEST__.state().scrollY);
    await page.evaluate(() => window.__TEST__.commands.setQuarterScrollY(940));
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).scrollY).toBeGreaterThan(initialScrollY);

    const laterScrollY = await page.evaluate(() => window.__TEST__.state().scrollY);
    await clickGame(page, 430, 1530 - laterScrollY);
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).openModal).toBe('major');
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).selectedMajor).toBe('q1-major-3');
    await page.keyboard.press('Escape');
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).openModal).toBe(null);

    const currentScrollY = await page.evaluate(() => window.__TEST__.state().scrollY);
    await clickGame(page, 760, 1580 - currentScrollY);
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).openModal).toBe('lesson');
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).selectedLesson).toBe('q1-m3-l1');
    await clickGame(page, 640, 435);
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).openModal).toBe(null);

    await clickGame(page, 64, 62);
    await waitForReady(page, 'IslandMapScene');
    await expect.poll(async () => (await page.evaluate(() => window.__TEST__.state())).sceneKey).toBe('IslandMapScene');

    expect(consoleErrors).toEqual([]);
  });

  test('mixture detective lesson compares mixtures and completes the final case', async ({ page }, testInfo) => {
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    await openQuarterOne(page);
    await expect.poll(() => canvasLooksNonBlank(page)).toBe(true);

    await clickLessonThree(page);
    await expect.poll(async () => (await getState(page)).openModal).toBe('minigame-info-mixture-detective');
    await clickModalStart(page);
    await waitForReady(page, 'MixtureDetectiveScene');
    await expect.poll(() => canvasLooksNonBlank(page)).toBe(true);
    await expect.poll(async () => (await getState(page)).minigameId).toBe('mixture-detective');
    await expect.poll(async () => (await getState(page)).detectivePhase).toBe('question');
    await expect.poll(async () => (await getState(page)).detectiveSamples.length).toBe(2);
    await expect.poll(async () => (await getState(page)).detectiveOptions.length).toBe(2);
    await page.screenshot({ path: testInfo.outputPath('detective-initial.png') });

    await clickDetectiveWrongOption(page);
    await expect.poll(async () => (await getState(page)).detectiveMistakes).toBe(1);
    await expect.poll(async () => (await getState(page)).detectiveRoundIndex).toBe(0);
    await expect.poll(async () => (await getState(page)).detectiveCorrectCount).toBe(0);
    await page.screenshot({ path: testInfo.outputPath('detective-wrong-feedback.png') });

    await clickDetectiveCorrectOption(page);
    await expect.poll(async () => (await getState(page)).detectivePhase).toBe('feedback');
    await expect.poll(async () => (await getState(page)).detectiveCorrectCount).toBe(1);
    await expect.poll(async () => (await getState(page)).score).toBe(10);
    await page.screenshot({ path: testInfo.outputPath('detective-correct-feedback.png') });
    await clickDetectiveNext(page);

    while ((await getState(page)).detectivePhase === 'question') {
      const beforeCount = (await getState(page)).detectiveCorrectCount;
      await clickDetectiveCorrectOption(page);
      await expect.poll(async () => (await getState(page)).detectivePhase).toBe('feedback');
      await expect.poll(async () => (await getState(page)).detectiveCorrectCount).toBe(beforeCount + 1);
      await clickDetectiveNext(page);
      await expect.poll(async () => (await getState(page)).detectivePhase).toMatch(/question|final/);
    }

    await expect.poll(async () => (await getState(page)).detectivePhase).toBe('final');
    await expect.poll(async () => (await getState(page)).detectiveCorrectCount).toBe(5);
    await page.screenshot({ path: testInfo.outputPath('detective-final-comparison.png') });

    await clickDetectiveChip(page, 'aType', 'nonuniform');
    await clickDetectiveChip(page, 'aReason', 'visible-parts');
    await clickDetectiveChip(page, 'bType', 'uniform');
    await clickDetectiveChip(page, 'bReason', 'looks-same');
    await clickDetectiveCheck(page);
    await expect.poll(async () => (await getState(page)).detectiveMistakes).toBe(2);

    await clickDetectiveChip(page, 'aType', 'uniform');
    await clickDetectiveChip(page, 'aReason', 'looks-same');
    await clickDetectiveChip(page, 'bType', 'nonuniform');
    await clickDetectiveChip(page, 'bReason', 'visible-parts');
    await clickDetectiveCheck(page);
    await expect.poll(async () => (await getState(page)).openModal).toBe('result-win');
    await expect.poll(async () => (await getState(page)).gameResult).toBe('win');
    await expect.poll(async () => (await getState(page)).score).toBe(70);
    await page.screenshot({ path: testInfo.outputPath('detective-win-modal.png') });

    await startAssessmentAndReturn(page, 'formative', 5);
    await expect.poll(async () => (await getState(page)).selectedLesson).toBe(null);

    expect(consoleErrors).toEqual([]);
  });

  test('science court lesson evaluates mixture cases with evidence', async ({ page }, testInfo) => {
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    await openQuarterOne(page);
    await clickLessonFour(page);
    await expect.poll(async () => (await getState(page)).openModal).toBe('minigame-info-science-court');
    await clickModalStart(page);
    await waitForReady(page, 'ScienceCourtScene');
    await expect.poll(() => canvasLooksNonBlank(page)).toBe(true);
    await expect.poll(async () => (await getState(page)).minigameId).toBe('science-court');
    await expect.poll(async () => (await getState(page)).courtCaseCount).toBe(5);
    await expect.poll(async () => (await getState(page)).courtCaseIndex).toBe(0);
    await expect.poll(async () => (await getState(page)).courtTotalScore).toBe(0);
    await page.screenshot({ path: testInfo.outputPath('sciencecourt-case01-initial.png') });

    await clickCourtClassification(page, (option) => option.id === 'uniform');
    let wrongEvidence = (await getState(page)).courtEvidenceOptions.filter((option) => !option.correct).slice(0, 2);
    for (const evidence of wrongEvidence) {
      await clickGame(page, evidence.x, evidence.y);
    }
    await clickCourtSubmit(page);
    await expect.poll(async () => (await getState(page)).courtPhase).toBe('verdict');
    await expect.poll(async () => (await getState(page)).courtVerdict).toBe('objection');
    await expect.poll(async () => (await getState(page)).courtCaseScore).toBe(0);
    await expect.poll(async () => (await getState(page)).courtCaseIndex).toBe(0);
    await expect.poll(async () => Boolean((await getState(page)).courtRetryButton)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('sciencecourt-objection.png') });

    await clickCourtRetry(page);
    await expect.poll(async () => (await getState(page)).courtPhase).toBe('defense');
    await expect.poll(async () => (await getState(page)).courtTotalScore).toBe(0);

    await completeCourtCaseCorrectly(page);
    await expect.poll(async () => (await getState(page)).courtVerdict).toBe('accepted');
    await expect.poll(async () => (await getState(page)).courtCaseScore).toBe(20);
    await expect.poll(async () => (await getState(page)).courtTotalScore).toBe(20);
    await page.screenshot({ path: testInfo.outputPath('sciencecourt-accepted.png') });
    await clickCourtNext(page);

    while ((await getState(page)).courtCaseIndex < 4) {
      const caseIndex = (await getState(page)).courtCaseIndex;
      await completeCourtCaseCorrectly(page);
      await expect.poll(async () => (await getState(page)).courtVerdict).toBe('accepted');
      if (caseIndex === 3) {
        await expect.poll(async () => (await getState(page)).courtSelectedEvidence.length).toBe(3);
        await page.screenshot({ path: testInfo.outputPath('sciencecourt-case04-verdict.png') });
      }
      await clickCourtNext(page);
    }

    await completeCourtCaseCorrectly(page);
    await expect.poll(async () => (await getState(page)).courtVerdict).toBe('accepted');
    await expect.poll(async () => (await getState(page)).courtTotalScore).toBe(100);
    await clickCourtNext(page);
    await expect.poll(async () => (await getState(page)).openModal).toBe('result-win');
    await expect.poll(async () => (await getState(page)).gameResult).toBe('win');
    await page.screenshot({ path: testInfo.outputPath('sciencecourt-final-win.png') });

    await startAssessmentAndReturn(page, 'formative', 5);

    expect(consoleErrors).toEqual([]);
  });

  test('invent-a-mix workshop creates and presents three mixtures', async ({ page }, testInfo) => {
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    await openQuarterOne(page);
    await clickLessonFive(page);
    await expect.poll(async () => (await getState(page)).openModal).toBe('minigame-info-invent-a-mix-workshop');
    await clickModalStart(page);
    await waitForReady(page, 'InventMixScene');
    await expect.poll(() => canvasLooksNonBlank(page)).toBe(true);
    await expect.poll(async () => (await getState(page)).minigameId).toBe('invent-a-mix-workshop');
    await expect.poll(async () => (await getState(page)).inventMissionCount).toBe(3);
    await expect.poll(async () => (await getState(page)).inventMissionIndex).toBe(0);
    await expect.poll(async () => (await getState(page)).inventTotalScore).toBe(0);
    await page.screenshot({ path: testInfo.outputPath('inventmix-creation1-initial.png') });

    await clickInventNameField(page);
    await page.keyboard.type(' Plus');
    await expect.poll(async () => (await getState(page)).inventCustomName).toBe('Energy Juice Plus');

    await clickInventIngredient(page, (option) => !option.correct);
    await clickInventMix(page);
    await expect.poll(async () => (await getState(page)).inventPhase).toBe('mixed');
    await page.screenshot({ path: testInfo.outputPath('inventmix-ingredient-selected.png') });
    await clickInventClassification(page, (option) => option.correct);
    await clickInventAppearance(page, (option) => option.correct);
    await clickInventUse(page, (option) => option.correct);
    await clickInventPresent(page);
    await expect.poll(async () => (await getState(page)).inventPhase).toBe('result');
    await expect.poll(async () => (await getState(page)).inventResult).toBe('partial');
    await expect.poll(async () => (await getState(page)).inventMissionScore).toBe(35);
    await expect.poll(async () => Boolean((await getState(page)).inventRetryButton)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('inventmix-partial-result.png') });

    await clickInventRetry(page);
    await expect.poll(async () => (await getState(page)).inventPhase).toBe('choose');
    await expect.poll(async () => (await getState(page)).inventTotalScore).toBe(0);

    await completeInventMissionCorrectly(page);
    await expect.poll(async () => (await getState(page)).inventResult).toBe('perfect');
    await expect.poll(async () => (await getState(page)).inventMissionScore).toBe(45);
    await expect.poll(async () => (await getState(page)).inventTotalScore).toBe(45);
    await page.screenshot({ path: testInfo.outputPath('inventmix-creation1-perfect.png') });
    await clickInventNext(page);

    await expect.poll(async () => (await getState(page)).inventMissionIndex).toBe(1);
    await completeInventMissionCorrectly(page);
    await expect.poll(async () => (await getState(page)).inventResult).toBe('perfect');
    await expect.poll(async () => (await getState(page)).inventTotalScore).toBe(90);
    await page.screenshot({ path: testInfo.outputPath('inventmix-creation2-perfect.png') });
    await clickInventNext(page);

    await expect.poll(async () => (await getState(page)).inventMissionIndex).toBe(2);
    await completeInventMissionCorrectly(page);
    await expect.poll(async () => (await getState(page)).inventResult).toBe('perfect');
    await expect.poll(async () => (await getState(page)).inventTotalScore).toBe(135);
    await page.screenshot({ path: testInfo.outputPath('inventmix-creation3-perfect.png') });
    await clickInventNext(page);

    await expect.poll(async () => (await getState(page)).openModal).toBe('result-win');
    await expect.poll(async () => (await getState(page)).gameResult).toBe('win');
    await page.screenshot({ path: testInfo.outputPath('inventmix-final-win.png') });

    await startAssessmentAndReturn(page, 'summative', 20);

    expect(consoleErrors).toEqual([]);
  });
});
