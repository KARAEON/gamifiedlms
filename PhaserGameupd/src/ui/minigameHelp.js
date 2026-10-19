import { createGeneralAsset, createIngredientIcon, createMixtureIcon } from './assetIcons.js';
import { supplyControl, supplyGlyph, supplyPanel, supplyText, supplyHeading } from './supplyCartUi.js';
import { closeOpenModal, showModal } from './ui.js';

const HELP = {
  MixMatchScene: {
    subtitle: 'Find a term, a picture, and a clue for the same kind of mixture.',
    steps: [['1. FLIP THREE CARDS', 'Choose one term, one picture, and one description.'], ['2. MATCH THE IDEA', 'All three cards must describe the same mixture type.'], ['3. CLEAR THE BOARD', 'Match every set before the timer runs out.']],
    tip: 'Uniform mixtures look the same throughout. Non-uniform mixtures have parts you can see separately.',
    goal: 'Complete all four sets. A quick match earns a bonus.',
  },
  SupplyCartScene: {
    subtitle: 'Sort each item to the correct bin, then pick its best use!',
    steps: [['1. SORT IT!', 'Drag an item into the uniform or non-uniform bin.'], ['2. CHECK USE!', 'Choose the best everyday use for that item.'], ['3. EARN POINTS!', 'Correct sorting and use choices earn points.']],
    tip: 'If you can see the parts separately, it is a non-uniform mixture. Uniform mixtures look the same throughout.',
    goal: 'Sort all 12 before time runs out. Aim for at least 80% sorting accuracy.',
  },
  MixtureDetectiveScene: {
    subtitle: 'Compare the two samples and use what you can see as evidence.',
    steps: [['1. LOOK AT BOTH', 'Compare Sample A and Sample B carefully.'], ['2. CHOOSE AN ANSWER', 'Pick the sample that matches the question.'], ['3. SUBMIT YOUR CLUE', 'Press SUBMIT, then finish the final comparison.']],
    tip: 'Look for separate ingredients or layers. A uniform mixture has the same appearance throughout.',
    goal: 'Complete five questions and the final comparison. Watch the timer.',
  },
  ScienceCourtScene: {
    subtitle: 'Observe the sample. Classify it. Defend your answer with evidence.',
    steps: [['1. EXAMINE THE SAMPLE', 'Choose uniform or non-uniform based on what you see.'], ['2. PICK EVIDENCE', 'Choose the required number of evidence cards.'], ['3. DEFEND YOUR CHOICE', 'Submit your defense. Retry if the judge asks for stronger evidence.']],
    tip: 'Use evidence about the sample: the same appearance, visible parts, or separate layers. Its use alone does not prove its type.',
    goal: 'Defend all five cases. Case Files keeps your completed verdicts.',
  },
  InventMixScene: {
    subtitle: 'Create a mixture, describe it, and present your invention.',
    steps: [['1. CHOOSE AND MIX', 'Drag to the cup or click to select up to three ingredients. Press MIX.'], ['2. DESCRIBE IT', 'Name your mixture. Choose its type, appearance, and use.'], ['3. PRESENT YOUR IDEA', 'Press PRESENT. Complete all three creations.']],
    tip: 'Look at the finished mixture before choosing a type. Describe visible parts or layers when you can see them.',
    goal: 'Each creation earns up to 45 points for your recipe, description, and presentation.',
  },
};

export function closeMinigameHelp(scene) {
  if (!scene.minigameHelpOpen) return;
  scene.minigameHelpOpen = false;
  closeOpenModal(scene);
  scene.updateTestState?.();
}

export function createMinigameHelpButton(scene, { x = 1135, y = 37, controlFactory = supplyControl } = {}) {
  scene.minigameHelpOpen = false;
  scene.helpButtonMeta = { x, y };
  const button = controlFactory(scene, x, y, '?', () => openMinigameHelp(scene), {
    width: 52, height: 48, size: 34, nav: true,
  });
  button.setData('testId', 'minigame-how-to-play');
  button.setData('label', 'How to play');
  return button;
}

function text(scene, nodes, x, y, value, size = 20, color = '#e8dcc0', width = null, role = 'body') {
  const node = (role === 'heading' ? supplyHeading : supplyText)(scene, x, y, value, size, color);
  if (width) node.setWordWrapWidth(width);
  nodes.push(node);
  return node;
}

function memoryExample(scene, nodes, x, matched) {
  for (const [index, label] of ['TERM', 'PICTURE', 'CLUE'].entries()) {
    const cx = x - 88 + index * 88;
    nodes.push(supplyPanel(scene, cx, 263, 80, 102, { fill: 0xe9d7b4, edge: matched ? 0x7bac40 : 0xa38a64 }));
    text(scene, nodes, cx, 226, label, 14, '#34271e');
    if (index === 1) nodes.push(createMixtureIcon(scene, 'salt-water', { x: cx, y: 266, width: 48, height: 58 }));
    else text(scene, nodes, cx, 266, index === 0 ? 'Uniform\nmixture' : 'Looks\nthe same', 15, '#34271e', 72);
    if (matched) nodes.push(supplyGlyph(scene, cx, 302, 'check', 0x568b26, 2));
  }
}

function figure(scene, nodes, index, x) {
  const key = scene.scene.key;
  if (key === 'MixMatchScene') {
    if (index < 2) memoryExample(scene, nodes, x, index === 1);
    else {
      nodes.push(supplyGlyph(scene, x - 95, 267, 'clock', 0x78c6e4, 5));
      for (let i = 0; i < 4; i++) nodes.push(supplyGlyph(scene, x - 25 + i * 38, 267, 'star', 0xffbd38, 3));
      text(scene, nodes, x, 310, '4 MATCHED SETS', 18, '#b9de75');
    }
  } else if (key === 'SupplyCartScene') {
    if (index === 0) {
      nodes.push(createMixtureIcon(scene, 'salt-water', { x: x - 89, y: 266, width: 53, height: 70 }));
      nodes.push(supplyGlyph(scene, x - 14, 266, 'arrow', 0x98dc39, 3).setAngle(180));
      nodes.push(scene.add.image(x + 73, 263, 'supply-bin-blue').setDisplaySize(100, 75));
    } else if (index === 1) {
      nodes.push(createMixtureIcon(scene, 'fruit-salad', { x: x - 66, y: 263, width: 85, height: 80 }));
      nodes.push(supplyPanel(scene, x + 63, 264, 112, 44, { fill: 0x356b23, edge: 0x8bbb46 }));
      text(scene, nodes, x + 63, 264, 'FOOD', 23, '#e8f4cc');
    } else {
      nodes.push(supplyGlyph(scene, x, 263, 'star', 0xffbd38, 8));
      text(scene, nodes, x, 312, 'SORT + USE = POINTS', 17, '#b9de75');
    }
  } else if (key === 'MixtureDetectiveScene') {
    if (index === 0) {
      nodes.push(createMixtureIcon(scene, 'lemonade', { x: x - 65, y: 261, width: 78, height: 89 }));
      nodes.push(createMixtureIcon(scene, 'vegetable-salad', { x: x + 65, y: 261, width: 100, height: 88 }));
      text(scene, nodes, x - 65, 311, 'A', 20, '#97d144');
      text(scene, nodes, x + 65, 311, 'B', 20, '#74b8de');
    } else if (index === 1) {
      text(scene, nodes, x, 239, 'Which has visible parts?', 19, '#e8dcc0');
      nodes.push(supplyPanel(scene, x, 284, 230, 46, { fill: 0x356b23, edge: 0x8bbb46 }));
      text(scene, nodes, x, 284, 'B. VEGETABLE SALAD', 18, '#e8f4cc');
    } else {
      nodes.push(supplyPanel(scene, x, 244, 218, 43, { fill: 0x356b23, edge: 0x8bbb46 }));
      text(scene, nodes, x, 244, 'SUBMIT', 23, '#e8f4cc');
      nodes.push(supplyGlyph(scene, x - 32, 302, 'check', 0x98dc39, 4));
      nodes.push(supplyGlyph(scene, x + 40, 302, 'star', 0xffbd38, 4));
    }
  } else if (key === 'ScienceCourtScene') {
    if (index === 0) {
      nodes.push(createGeneralAsset(scene, 'judge', { x: x - 69, y: 266, width: 84, height: 99 }));
      nodes.push(createMixtureIcon(scene, scene.getCurrentCase().icon, { x: x + 69, y: 266, width: 93, height: 104 }));
    } else if (index === 1) {
      for (const [i, glyph, label] of [[0, 'gem', 'VISIBLE PARTS'], [1, 'eye', 'NOT EVENLY MIXED']]) {
        const cx = x - 66 + i * 132;
        nodes.push(supplyPanel(scene, cx, 265, 120, 93, { fill: 0xe9d7b4, edge: 0x8bac47 }));
        nodes.push(supplyGlyph(scene, cx, 246, glyph, 0x4787a2, 4));
        text(scene, nodes, cx, 280, label, 14, '#34271e', 106);
        nodes.push(supplyGlyph(scene, cx + 43, 232, 'check', 0x568b26, 2));
      }
    } else {
      nodes.push(supplyPanel(scene, x, 248, 242, 44, { fill: 0x356b23, edge: 0x8bbb46 }));
      text(scene, nodes, x, 248, 'SUBMIT DEFENSE', 22, '#e8f4cc');
      nodes.push(supplyGlyph(scene, x, 305, 'star', 0xffbd38, 4));
    }
  } else if (key === 'InventMixScene') {
    if (index === 0) {
      nodes.push(createIngredientIcon(scene, 'water', { x: x - 104, y: 264, width: 41, height: 57 }));
      nodes.push(createIngredientIcon(scene, 'powdered-juice', { x: x - 57, y: 264, width: 41, height: 57 }));
      nodes.push(supplyGlyph(scene, x + 1, 264, 'arrow', 0x98dc39, 3).setAngle(180));
      nodes.push(scene.add.image(x + 81, 267, 'invent-empty-cup').setDisplaySize(98, 98));
    } else if (index === 1) {
      nodes.push(scene.add.image(x - 80, 262, 'invent-energy-cup').setDisplaySize(97, 97));
      nodes.push(supplyPanel(scene, x + 59, 242, 170, 33, { fill: 0x356b23, edge: 0x8bbb46 }));
      text(scene, nodes, x + 59, 242, 'UNIFORM', 18, '#e8f4cc');
      nodes.push(supplyPanel(scene, x + 59, 288, 170, 37, { fill: 0xe9d7b4, edge: 0xa38a64 }));
      text(scene, nodes, x + 59, 288, 'Looks the same.', 16, '#34271e');
    } else {
      nodes.push(scene.add.image(x - 64, 266, 'supply-guide').setDisplaySize(90, 103));
      nodes.push(scene.add.image(x + 62, 266, 'invent-trophy').setDisplaySize(91, 98));
    }
  }
}

function illustratedHelp(scene, help) {
  const nodes = [];
  text(scene, nodes, 640, 148, help.subtitle, 20, '#67d8ee');
  help.steps.forEach(([title, caption], index) => {
    const x = 294 + index * 346;
    nodes.push(supplyPanel(scene, x, 277, 326, 228, { fill: 0x12263a, edge: 0x42678a }));
    text(scene, nodes, x, 185, title, 23, '#b5e748', null, 'heading');
    figure(scene, nodes, index, x);
    if (scene.scene.key === 'ScienceCourtScene' && index === 1) {
      const { min, max } = scene.getCurrentCase().evidencePick;
      caption = min === max ? `Choose exactly ${min} evidence cards for this case.` : `Choose ${min} to ${max} evidence cards for this case.`;
    }
    text(scene, nodes, x, 353, caption, 20, '#e8dcc0', 286);
  });
  nodes.push(supplyPanel(scene, 640, 477, 1054, 142, { fill: 0x11291f, edge: 0x547445 }));
  nodes.push(createMixtureIcon(scene, 'salt-water', { x: 188, y: 473, width: 63, height: 74 }));
  nodes.push(createMixtureIcon(scene, 'fruit-salad', { x: 343, y: 473, width: 88, height: 76 }));
  text(scene, nodes, 188, 526, 'UNIFORM', 18, '#aade6d');
  text(scene, nodes, 343, 526, 'NON-UNIFORM', 17, '#aade6d');
  nodes.push(supplyGlyph(scene, 447, 431, 'bulb', 0xffbd38, 3));
  text(scene, nodes, 562, 425, 'QUICK TIP!', 24, '#ffbd38', null, 'heading');
  const tip = text(scene, nodes, 478, 479, help.tip, 21, '#e8dcc0', 654);
  tip.setOrigin(0, 0.5).setAlign('left');
  const goal = scene.scene.key === 'ScienceCourtScene' ? scene.getCurrentCase().tip : help.goal;
  text(scene, nodes, 640, 564, goal, 18, '#67d8ee', 1020);
  return nodes;
}

export function openMinigameHelp(scene) {
  if (scene.openScienceHelp) { scene.openScienceHelp(); return; }
  if (scene.currentModal || scene.result) return;
  const help = HELP[scene.scene.key];
  if (!help) return;
  scene.minigameHelpOpen = true;
  showModal(scene, {
    name: 'minigame-help', title: 'HOW TO PLAY', width: 1120, height: 580,
    titleTop: 43, titleSize: 33, buttonY: 611,
    body: () => {
      const nodes = illustratedHelp(scene, help);
      const dismiss = supplyControl(scene, 640, 611, 'GOT IT', () => closeMinigameHelp(scene), { width: 180, height: 50, size: 25, fill: 0x356b23, edge: 0x8bbb46 });
      dismiss.setData('testId', 'minigame-help-got-it');
      nodes.push(dismiss);
      return nodes;
    },
    buttons: [],
  });
  scene.updateTestState?.();
}
