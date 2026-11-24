import Phaser from 'phaser';
import { ISLAND_STATES, isIslandUnlocked } from '../config/islandVisuals.js';

// Intro dialogue and island selection use the same focus, spacing, and depth.
export function layoutIslandCarousel(scene, views, cursor, { time = 0, reducedMotion = false, isMoving = false } = {}) {
  const narrow = scene.scale.displaySize.width < 700;
  views.forEach((view, index) => {
    const distance = Phaser.Math.Wrap(index - cursor + views.length / 2, 0, views.length) - views.length / 2;
    const absolute = Math.abs(distance);
    const scale = absolute <= 1 ? Phaser.Math.Linear(1, 0.57, absolute) : Phaser.Math.Linear(0.57, 0.28, Math.min(1, absolute - 1));
    const x = 640 + Math.sign(distance) * (absolute <= 1 ? absolute * 355 : 355 + (absolute - 1) * 215);
    const bob = reducedMotion || isMoving ? 0 : Math.sin(time / 1700 + index) * 5;
    view.setPosition(x, 332 + Math.min(absolute, 2) * 29 + bob);
    view.setScale(scale).setAlpha(Phaser.Math.Clamp(1 - absolute * 0.22, 0, 1));
    view.setDepth(10 - absolute).setVisible(absolute < (narrow ? 1.8 : 2.85));
    view.mist.x = reducedMotion ? 0 : Math.sin(time / 2400 + index) * 13;
  });
}

// Source margins differ; named frames normalize visible size without resampling.
export function prepareIslandFrames(scene, islands) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  for (const island of islands) {
    const texture = scene.textures.get(island.assetKey);
    if (texture.has('island')) continue;
    const source = texture.getSourceImage();
    canvas.width = source.width; canvas.height = source.height;
    context.drawImage(source, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let left = canvas.width, top = canvas.height, right = 0, bottom = 0;
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      if (data[(y * canvas.width + x) * 4 + 3] < 32) continue;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    if (right >= left && bottom >= top) texture.add('island', 0, left, top, right - left + 1, bottom - top + 1);
  }
}

export function createIslandArt(scene, island, { width = 500, height = 420 } = {}) {
  const container = scene.add.container(0, 0);
  const art = scene.add.image(0, 0, island.assetKey, 'island');
  art.setScale(Math.min(width / art.width, height / art.height));
  const mist = scene.add.image(0, 40, 'floating-mist');
  mist.setDisplaySize(width * 0.94, height * 0.34).setTint(0xb6c7cd);
  const lock = scene.add.graphics().setPosition(0, 24);
  lock.fillStyle(0x182b37, 0.88).fillRoundedRect(-28, -31, 56, 66, 8);
  lock.lineStyle(4, 0xfff2c9, 1).strokeRoundedRect(-15, -5, 30, 25, 2);
  lock.beginPath(); lock.arc(0, -6, 11, Math.PI, 0); lock.strokePath();
  lock.fillStyle(0xfff2c9).fillRect(-2, 4, 4, 9);
  container.add([art, mist, lock]).setSize(width, height);
  Object.assign(container, { art, mist, lock });
  container.setIslandState = (unlocked) => {
    const state = ISLAND_STATES[unlocked ? 'normal' : 'locked'];
    art.setTint(state.tint);
    mist.setAlpha(state.mistAlpha).setVisible(!unlocked);
    lock.setVisible(!unlocked);
    container.setData('state', unlocked ? 'normal' : 'locked');
  };
  container.setIslandState(isIslandUnlocked(scene, island));
  return container;
}

export function createWorldClouds(scene, { animate = true, depth = 1 } = {}) {
  return [
    { x: 65, y: 590, w: 430, h: 190, alpha: 0.65 },
    { x: 1210, y: 560, w: 460, h: 210, alpha: 0.6 },
    { x: 375, y: 690, w: 650, h: 155, alpha: 0.6 },
    { x: 960, y: 725, w: 670, h: 160, alpha: 0.58 },
  ].map((cloud, index) => {
    const image = scene.add.image(cloud.x, cloud.y, 'floating-mist')
      .setDisplaySize(cloud.w, cloud.h).setAlpha(cloud.alpha).setDepth(depth);
    if (animate) scene.tweens.add({ targets: image, x: image.x + 35, duration: 13000 + index * 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    return image;
  });
}
