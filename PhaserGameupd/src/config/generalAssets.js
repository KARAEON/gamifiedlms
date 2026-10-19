// Transparent 64 x 64 pixel-art assets, shared across minigames 1–5.
export const GENERAL_ASSET_NAMES = [
  'alcohol', 'bottled-water', 'bowl-empty', 'bowl-full', 'bowl-half-full', 'bowl-little',
  'candies', 'cereal-in-milk', 'chocolate-drink', 'chocolate-sugar-cubes', 'civilian',
  'color-paint', 'cooking-oil', 'cornstarch', 'dessert-candies', 'energy-drink',
  'food-coloring', 'fruit-salad', 'glitter-patch', 'halo-halo', 'judge', 'lemonade-drink',
  'milk-carton', 'nut-pieces', 'oil-and-water', 'orange-juice-drink', 'powdered-juice',
  'raisins', 'salt', 'saltwater', 'sand-and-water', 'sand-mound', 'shampoo',
  'soap', 'soy-sauce-pouch', 'vegetable-salad', 'vinegar',
];

export const MIXTURE_ASSETS = {
  'salt-water': 'saltwater',
  'orange-juice': 'orange-juice-drink', juice: 'orange-juice-drink',
  'sand-water': 'sand-and-water', 'fruit-salad': 'fruit-salad',
  milk: 'milk-carton', 'cereal-milk': 'cereal-in-milk',
  lemonade: 'lemonade-drink', vinegar: 'vinegar', 'oil-water': 'oil-and-water',
  'soy-sauce': 'soy-sauce-pouch', 'chocolate-drink': 'chocolate-drink', shampoo: 'shampoo',
  'halo-halo': 'halo-halo', 'vegetable-salad': 'vegetable-salad',
};

export const INGREDIENT_ASSETS = {
  water: 'bottled-water', 'powdered-juice': 'powdered-juice', milk: 'milk-carton',
  sugar: 'chocolate-sugar-cubes', nuts: 'nut-pieces', raisins: 'raisins',
  candy: 'candies', oil: 'cooking-oil', 'food-coloring': 'food-coloring',
  sand: 'sand-mound', soap: 'soap', vinegar: 'vinegar', salt: 'salt',
  glitter: 'glitter-patch', cornstarch: 'cornstarch', alcohol: 'alcohol',
};

export const generalAssetKey = (name) => `general-${name}`;
