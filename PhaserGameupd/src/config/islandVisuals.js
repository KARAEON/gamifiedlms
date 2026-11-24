// One visual identity follows an island from the carousel into its quarter map.
export const ISLAND_VISUALS = {
  'vulcan-caverns': { subject: 'Science', accent: 0xf5a34d, terrain: 'VOLCANIC PATHWAYS' },
  'reading-island': { subject: 'English', accent: 0x9cbb73, terrain: 'STORYBOOK TRAILS' },
  'numeric-ruins': { subject: 'Mathematics', accent: 0x82bec6, terrain: 'GEOMETRIC COURTYARDS' },
  'hibla-archipelago': { subject: 'Filipino', accent: 0xd9a074, terrain: 'STORYTELLING PATHS' },
  'hearthwork-terraces': { subject: 'EPP', accent: 0xb4bc73, terrain: 'WORKSHOP TERRACES' },
  'tala-crossroad': { subject: 'Araling Panlipunan', accent: 0xd7bd8a, terrain: 'HERITAGE TRAILS' },
  'concord-grove': { subject: 'Edukasyon sa Pagpapakatao', accent: 0xa7bc9b, terrain: 'COMMUNITY GARDENS' },
  'grand-library': { subject: 'Knowledge hub', accent: 0xe1c78d, terrain: 'GRAND LIBRARY' },
};

export const ISLAND_STATES = {
  normal: { tint: 0xffffff, mistAlpha: 0, label: 'ENTER ISLAND' },
  locked: { tint: 0x596878, mistAlpha: 0.72, label: 'LOCKED · COMING SOON' },
};

export function isIslandUnlocked(scene, island) {
  return scene.registry.get('islandUnlocks')?.[island.id] ?? island.unlocked;
}

// Used by both the world reveal behind Krae and the interactive carousel.
export function drawFloatingSky(scene, width = 1280, height = 720) {
  const sky = scene.add.image(width / 2, height / 2, 'floating-sky');
  sky.setScale(Math.max(width / sky.width, height / sky.height));
  return sky;
}
