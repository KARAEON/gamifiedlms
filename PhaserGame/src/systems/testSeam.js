export const TEST_MODE = new URLSearchParams(window.location.search).get('test') === '1';

const defaultState = {
  sceneKey: null,
  openModal: null,
  selectedIsland: null,
  selectedNode: null,
  lockedFeedback: null,
};

export function setupTestSeam() {
  if (!TEST_MODE) {
    return;
  }

  window.__TEST__ = {
    ready: false,
    frameCount: 0,
    ...defaultState,
    state() {
      return {
        ready: this.ready,
        frameCount: this.frameCount,
        sceneKey: this.sceneKey,
        openModal: this.openModal,
        selectedIsland: this.selectedIsland,
        selectedNode: this.selectedNode,
        lockedFeedback: this.lockedFeedback,
      };
    },
  };
}

export function setTestState(partial) {
  if (!TEST_MODE || !window.__TEST__) {
    return;
  }

  Object.assign(window.__TEST__, partial);
}

export function markSceneReady(sceneKey, partial = {}) {
  setTestState({
    ready: false,
    sceneKey,
    openModal: null,
    selectedIsland: null,
    selectedNode: null,
    lockedFeedback: null,
    ...partial,
  });

  requestAnimationFrame(() => {
    if (window.__TEST__) {
      window.__TEST__.ready = true;
      window.__TEST__.frameCount += 1;
    }
  });
}
