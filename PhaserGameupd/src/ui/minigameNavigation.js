import { createMinigameHelpButton } from './minigameHelp.js';
import { supplyControl } from './supplyCartUi.js';
import { closeOpenModal, createToggleRow, showModal } from './ui.js';
import { playAreaMusic } from '../systems/music.js';

// Reference positions: Minigame 3 Back, Minigame 2 Help and Settings.
export const MINIGAME_NAVIGATION = Object.freeze({
  back: Object.freeze({ x: 46, y: 678, width: 62, height: 56 }),
  help: Object.freeze({ x: 1135, y: 37, width: 52, height: 48 }),
  settings: Object.freeze({ x: 1209, y: 37, width: 58, height: 54 }),
});

export function createMinigameNavigation(scene, { controlFactory = supplyControl } = {}) {
  scene.navigationMeta = MINIGAME_NAVIGATION;
  const help = createMinigameHelpButton(scene, { ...MINIGAME_NAVIGATION.help, controlFactory }).setDepth(60);
  const back = controlFactory(scene, 46, 678, '', () => scene.returnToQuarter(), {
    width: 62, height: 56, icon: 'arrow', iconColor: 0xffcf52, nav: true,
  }).setDepth(60);
  const settings = controlFactory(scene, 1209, 37, '', () => {
    if (scene.currentModal || scene.result) return;
    if (scene.openSettings) scene.openSettings();
    else openMinigameSettings(scene);
  }, { width: 58, height: 54, icon: 'gear', iconColor: 0xb7bec4, nav: true }).setDepth(60);
  for (const [button, label] of [[back, 'Back'], [settings, 'Settings']]) {
    button.setData('label', label);
    button.setData('testId', `minigame-${label.toLowerCase()}`);
  }
  return { help, settings, back };
}

function openMinigameSettings(scene) {
  const prefix = scene.scene.key === 'MixMatchScene' ? 'mix' : 'detective';
  showModal(scene, {
    name: `${prefix}-settings`, title: 'SETTINGS', height: 360,
    body: (_overlay, { panelX, panelY }) => [
      createToggleRow(scene, panelX - 16, panelY - 32, 'MUSIC', scene.registry.get('musicEnabled'), enabled => {
        scene.registry.set('musicEnabled', enabled);
        playAreaMusic(scene, scene.islandId);
      }),
      createToggleRow(scene, panelX - 16, panelY + 34, 'SFX', scene.registry.get('sfxEnabled'), enabled => scene.registry.set('sfxEnabled', enabled)),
    ],
    buttons: [{ label: 'DONE', action: () => { closeOpenModal(scene); scene.updateTestState(); } }],
  });
  scene.updateTestState();
}
