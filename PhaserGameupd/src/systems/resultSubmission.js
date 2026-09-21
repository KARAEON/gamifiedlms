function getGameContext() {
  return window.GLMS_PHASER ?? null;
}

function generateUuid() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function getSubmissionStore(scene) {
  if (!scene.__glmsSubmissions) {
    scene.__glmsSubmissions = {};
  }

  return scene.__glmsSubmissions;
}

async function postSubmission(scene, {
  entryType,
  lessonKey,
  gameKey,
  payloadBuilder,
  submissionKey,
}) {
  const context = getGameContext();
  if (!context?.submitUrl || !context?.csrfToken) {
    return null;
  }

  const store = getSubmissionStore(scene);
  if (store[submissionKey]) {
    return store[submissionKey];
  }

  const submission = {
    submission_uuid: generateUuid(),
    entry_type: entryType,
    lesson_key: lessonKey,
    game_key: gameKey,
    payload: payloadBuilder(),
  };

  const promise = fetch(context.submitUrl, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': context.csrfToken,
    },
    body: JSON.stringify(submission),
  }).then(async (response) => {
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Submission failed (${response.status}): ${body}`);
    }

    return response.json();
  }).catch((error) => {
    delete store[submissionKey];
    console.error('GLMS Phaser result submission failed.', error);
    return null;
  });

  store[submissionKey] = promise;

  return promise;
}

export function submitMinigameResult(scene, options) {
  return postSubmission(scene, {
    ...options,
    entryType: 'minigame',
    submissionKey: `minigame:${options.gameKey}`,
  });
}

export function submitAssessmentResult(scene, options) {
  return postSubmission(scene, {
    ...options,
    entryType: 'assessment',
    submissionKey: `assessment:${options.gameKey}`,
  });
}
