import { INGREDIENT_ASSETS, MIXTURE_ASSETS, generalAssetKey } from '../config/generalAssets.js';
import { drawMixtureIcon } from './minigameUi.js';

// Fit the original image without stretching. Images are visual only; their
// containing card or drop zone owns interaction and destroys them on redraw.
export function createGeneralAsset(scene, name, { x = 0, y = 0, width = 80, height = 80 } = {}) {
  const key = generalAssetKey(name);
  if (!scene.textures.exists(key)) return null;
  const image = scene.add.image(x, y, key);
  image.setScale(Math.min(width / image.width, height / image.height));
  image.setData('generalAsset', name);
  return image;
}

export function createMixtureIcon(scene, icon, options = {}) {
  const image = createGeneralAsset(scene, MIXTURE_ASSETS[icon], options);
  if (image) return image;
  // Retain a drawing as a fallback if an image cannot be loaded.
  const graphics = scene.add.graphics({ x: options.x ?? 0, y: options.y ?? 0 });
  graphics.setScale(Math.min((options.width ?? 80) / 80, (options.height ?? 80) / 80));
  drawMixtureIcon(graphics, icon);
  return graphics;
}

export function createIngredientIcon(scene, icon, options = {}) {
  return createGeneralAsset(scene, INGREDIENT_ASSETS[icon], options)
    ?? scene.add.text(options.x ?? 0, options.y ?? 0, '?').setOrigin(0.5);
}
