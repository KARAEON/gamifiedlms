import { SERVICE_ROUNDS, SCIENCE_TOOLS } from '../config/scienceQuarterGames.js';
import { impactRecovery } from '../games/science/scienceLogic.js';
import { magnetPanel as panel, magnetControl as control } from './magnetWorkshopUi.js';
import { toolSprite, circuitSample } from './recoveryCircuitUi.js';
import { qText, qZone, qHeading } from './scienceQuarterUi.js';
import { supplyGlyph, supplyText, supplyHeading } from './supplyCartUi.js';
import { closeOpenModal, showModal } from './ui.js';

const toolName = id => SCIENCE_TOOLS.find(t => t.id === id)?.label ?? id;
const maximum = sites => sites.map(site => site.amount).sort((a,b) => b-a).slice(0,2).reduce((sum, value) => sum + value, 0);

function sprite(scene, key, x, y, width, height = width, frame) {
  const texture = scene.textures.get(key);
  const image = scene.add.image(x, y, key, frame ?? (texture.has('trimmed') ? 'trimmed' : undefined));
  image.setScale(Math.min(width / image.width, height / image.height));
  return image;
}

function product(scene, site, x, y, size) {
  if (site.product === 'Clay') return sprite(scene, 'general-sand-mound', x, y, size, size, 'sieve-trimmed').setTint(0xa58b76);
  return circuitSample(scene, [site.product === 'Iron' ? 'iron' : site.product === 'Salt' ? 'salt' : site.product === 'Upper liquid' ? 'water' : 'sand'], x, y, size);
}

function resident(scene, site, x, y, width, height) {
  const key = site.id === 'repair' ? 'science-village-mechanic' : site.id === 'saltmaker' ? 'science-village-saltmaker' : site.id === 'potter' ? 'general-civilian' : 'science-community-worker';
  return sprite(scene, key, x, y, width, height);
}

function token(scene, x, y, used = false) {
  const group = scene.add.container(x, y), g = scene.add.graphics();
  g.fillStyle(0x493519).fillRect(-18, -12, 36, 24).fillRect(-12, -18, 24, 36);
  g.fillStyle(used ? 0x827c63 : 0xffd54a).fillRect(-15,-10,30,20).fillRect(-10,-15,20,30);
  group.add(g); group.add(supplyGlyph(scene, 0, 0, used ? 'check' : 'star', used ? 0xc5d2b4 : 0xa56820, 2));
  return group;
}

export function renderVillageImpact(scene) {
  const s = scene.state, sites = SERVICE_ROUNDS[scene.round], entries = Object.entries(s.installations);
  sites.forEach((site, i) => {
    const x = 158 + i * 264, installed = s.installations[i], useful = installed === site.tool;
    const edge = installed ? s.run && !useful ? 0xe27b70 : installed === s.tool ? 0xffd54a : 0x6cd965 : 0xb98a43;
    scene.layer.add(panel(scene, x, 322, 252, 330, { fill: 0xe9cf98, edge }));
    if (installed) scene.layer.add(scene.add.rectangle(x, 322, 241, 319).setStrokeStyle(3, edge));
    const title = qHeading(scene, x, 179, site.label, 21, '#292116');
    if (title.width > 217) title.setFontSize(Math.floor(parseFloat(title.style.fontSize) * 217 / title.width));
    scene.layer.add(scene.add.image(x, 244, 'science-workshop-backdrop').setDisplaySize(220, 98));
    scene.layer.add(scene.add.rectangle(x, 244, 220, 98, 0x071521, 0.15));
    scene.layer.add(scene.add.rectangle(x + 49, 283, 120, 90, 0xf0ddb2));
    scene.layer.add(resident(scene, site, x - 61, 262, 99, 128));
    scene.layer.add(site.tool === 'decant'
      ? circuitSample(scene, ['sand'], x + 31, 255, 42)
      : product(scene, site, x + 31, 255, 42));
    const companion = site.tool === 'sieve' ? 'science-pebble' : site.tool === 'magnet' ? site.mixture.includes('wood') ? 'science-wood-chip' : 'general-sand-mound' : 'science-water-drop';
    scene.layer.add(sprite(scene, companion, x + 75, 260, 29, 29, companion === 'general-sand-mound' ? 'sieve-trimmed' : undefined));
    qText(scene, x + 49, 289, site.mixture, 14, '#292116', 114);
    qText(scene, x + 49, 318, `${site.amount} units`, 17, '#292116');
    const fill = installed ? s.run && !useful ? 0x422b2c : 0x102e24 : 0x343b46;
    scene.layer.add(scene.add.rectangle(x, 402, 221, 146, fill).setStrokeStyle(1, edge));
    if (installed) {
      qText(scene, x, 347, s.run && !useful ? 'UNSUITABLE SERVICE' : 'SERVICE INSTALLED', 17, s.run && !useful ? '#f3a698' : '#87ef9e');
      scene.layer.add(toolSprite(scene, installed, x - 55, 395, 66));
      qText(scene, x + 48, 379, toolName(installed), 18, '#fff0d6');
      if (s.run) {
        if (useful) scene.layer.add(product(scene, site, x - 5, 423, 34));
        else scene.layer.add(supplyGlyph(scene, x - 5, 423, 'cross', 0xe88f7b, 3));
        qText(scene, x + 57, 425, `Recovered:\n${useful ? site.amount : 0} units`, 14, useful ? '#b5e748' : '#f3a698', 86);
      } else qText(scene, x + 48, 421, 'PREVIEW\nPENDING', 15, '#c5b3ef');
      qText(scene, x, 461, 'TAP TO RECLAIM TOKEN', 12, '#b9d5cf');
    } else {
      qText(scene, x, 347, 'NO SERVICE INSTALLED', 16, '#aeb6bf');
      scene.layer.add(supplyGlyph(scene, x, 396, 'gear', 0x818c9b, 4));
      qText(scene, x, 439, 'Select a tool,\nthen tap this site.', 16, '#ccd3dc');
    }
    qZone(scene, `site-${i}`, x, 322, 252, 330, () => scene.perform('install', i));
  });
  SCIENCE_TOOLS.forEach((tool, i) => {
    const x = 96 + i * 160, selected = s.tool === tool.id, used = entries.some(([,id]) => id === tool.id);
    scene.layer.add(panel(scene, x, 550, 151, 109, { fill: used ? 0x102e24 : 0x081b2b, edge: selected ? 0xffd54a : used ? 0x6cd965 : 0xb98a43 }));
    if (selected) scene.layer.add(scene.add.rectangle(x, 550, 141, 100).setStrokeStyle(3, 0xffd54a));
    qText(scene, x, 516, tool.label, 18);
    scene.layer.add(toolSprite(scene, tool.id, x, 552, 57));
    scene.layer.add(scene.add.rectangle(x, 588, 122, 21, used ? 0x43974d : 0x344c61));
    qText(scene, x, 588, used ? 'IN USE' : 'AVAILABLE', 14, '#fff0d6');
    qZone(scene, `tool-${tool.id}`, x, 550, 151, 109, () => scene.perform('tool', tool.id));
  });
  scene.button('run', 420, 622, 'PREVIEW BENEFITS', () => scene.perform('run'), { width: 532, height: 36, size: 24, enabled: scene.phase === 'playing' });

  scene.layer.add(panel(scene, 1050, 391, 428, 488, { fill: 0x081b2b }));
  qHeading(scene, 1050, 179, 'SHIFT IMPACT', 25, '#67d8ee');
  scene.layer.add(panel(scene, 1050, 362, 388, 328, { fill: 0xe9cf98 }));
  qHeading(scene, 1050, 222, 'SERVICE TOKENS', 21, '#292116');
  qText(scene, 994, 251, `${2 - entries.length} / 2`, 27, entries.length === 2 ? '#ad342e' : '#326b34');
  qText(scene, 1110, 253, 'AVAILABLE', 17, '#292116');
  scene.layer.add(scene.add.rectangle(1050, 279, 342, 1, 0xb98a43));
  qHeading(scene, 1050, 304, 'USEFUL RECOVERY', 20, '#292116');
  qText(scene, 1050, 330, s.run ? `${impactRecovery(s)} UNITS` : 'NOT PREVIEWED', s.run ? 29 : 21, s.run ? '#326b34' : '#756b56');
  if (!entries.length) {
    scene.layer.add(token(scene, 996, 390)); scene.layer.add(token(scene, 1104, 390));
    qText(scene, 1050, 459, 'Choose a tool and a village site.\nTwo tokens are available.', 18, '#65512f', 329);
  } else {
    for (let row = 0; row < 2; row++) {
      const entry = entries[row], y = 385 + row * 87;
      scene.layer.add(scene.add.rectangle(1050, y, 340, 78, 0xf0ddb2).setStrokeStyle(1, 0xb98a43));
      if (!entry) {
        scene.layer.add(token(scene, 910, y));
        qText(scene, 1091, y, 'ONE TOKEN AVAILABLE\nChoose another service.', 17, '#65512f', 252);
        continue;
      }
      const site = sites[entry[0]], useful = entry[1] === site.tool;
      const icon = product(scene, site, 910, y + 3, 49);
      icon.setAlpha(s.run && useful ? 1 : 0.45); scene.layer.add(icon);
      qText(scene, 1084, y - 23, site.label, 16, '#292116', 256);
      const text = qText(scene, 956, y + 8, s.run ? useful ? site.benefit : 'Unsuitable tool.\nNo useful recovery here.' : 'Preview this installation\nto inspect its benefit.', 16, s.run && !useful ? '#a44136' : '#65512f', 259, 'left');
      for (let size = 15; text.height > 40 && size >= 13; size--) text.setFontSize(size);
    }
  }
}

export function villageImpactResults(scene) {
  const s = scene.state, complete = scene.phase !== 'playing', sites = SERVICE_ROUNDS[scene.round];
  const amount = impactRecovery(s), target = maximum(sites);
  scene.layer.add(panel(scene, 1050, 564, 386, 64, { fill: 0x142e21, edge: 0x81ac58 }));
  qHeading(scene, 1050, 541, complete ? scene.phase === 'finished' ? 'ACTIVITY COMPLETE' : 'GREATEST IMPACT' : 'FEEDBACK', 20, '#67d8ee');
  const message = complete ? `${amount} useful units recovered.\nBoth services help the community.` : s.message.startsWith('Both tokens') ? 'Both tokens are used. Tap a site\nto reclaim its token.' : s.run ? amount === target ? 'Greatest useful recovery reached.\nCheck Result to finish.' : `${amount} useful units recovered.\nCompare the other service choices.` : 'Preview your services to inspect\nthe materials recovered.';
  qText(scene, 1050, 568, message, 15, '#fff0d6', 339);
  scene.button(complete ? 'retry' : 'reset', 920, 611, complete ? 'RETRY' : 'RESET', () => scene.resetRound(), { width: 138, height: 43, size: 23 });
  scene.button(complete ? 'next' : 'check', 1112, 611, complete ? scene.phase === 'finished' ? 'LESSON MAP' : 'NEXT CHALLENGE' : 'CHECK RESULT', () => complete ? scene.nextRound() : scene.checkRound(), { width: 232, height: 43, size: 23 });
}

export function openVillageImpactHelp(scene) {
  if (scene.currentModal) return;
  scene.minigameHelpOpen = true;
  showModal(scene, { name: 'minigame-help', title: 'HOW TO PLAY', width: 1120, height: 580,
    titleTop: 43, titleSize: 33, buttons: [], body: () => {
      const nodes = [], text = (x, y, label, size = 20, color = '#fff0d6', width = 0, role = 'body') => {
        const t = (role === 'heading' ? supplyHeading : supplyText)(scene, x, y, label, size, color); if (width) t.setWordWrapWidth(width, true); nodes.push(t);
      };
      text(640, 145, 'Use two service tokens where suitable separation helps most.', 22, '#67d8ee');
      for (let i = 0; i < 3; i++) {
        const x = 294 + i * 346;
        nodes.push(panel(scene, x, 299, 326, 279, { fill: 0x102436 }));
        text(x, 187, ['1. INSPECT NEEDS', '2. INSTALL SERVICES', '3. PREVIEW AND COMPARE'][i], 21, '#b5e748', 0, 'heading');
        if (!i) {
          nodes.push(panel(scene, x, 276, 259, 132, { fill: 0xe9cf98 }));
          nodes.push(resident(scene, SERVICE_ROUNDS[0][0], x - 65, 274, 65, 100));
          nodes.push(product(scene, SERVICE_ROUNDS[0][0], x + 38, 261, 49));
          text(x + 38, 309, 'IRON + SAND\n8 UNITS', 16, '#292116');
        } else if (i === 1) {
          nodes.push(token(scene, x - 76, 249)); nodes.push(token(scene, x + 76, 249));
          nodes.push(toolSprite(scene, 'magnet', x - 76, 308, 57));
          nodes.push(toolSprite(scene, 'sieve', x + 76, 308, 57));
          text(x, 339, 'TWO SERVICE TOKENS', 15, '#67d8ee');
        } else {
          nodes.push(control(scene, x, 244, 'PREVIEW BENEFITS', () => {}, { width: 274, height: 36, size: 20 }));
          nodes.push(product(scene, SERVICE_ROUNDS[0][0], x - 72, 302, 55));
          nodes.push(product(scene, SERVICE_ROUNDS[0][1], x + 72, 302, 55));
          text(x, 338, 'USEFUL MATERIALS', 15, '#b5e748', 0, 'heading');
        }
        text(x, 386, ['Read each mixture and potential recovery amount. Find the material the village can reuse.', 'Select a tool, then tap a site. Tap an installed site to reclaim its token before replacing it.', 'Preview both services. Compare useful recovery and benefits, then Check Result.'][i], 18, '#fff0d6', 285);
      }
      nodes.push(panel(scene, 640, 505, 1054, 118, { fill: 0x142e21 }));
      nodes.push(scene.add.image(182, 505, 'supply-guide').setDisplaySize(75, 90));
      text(700, 470, 'SCIENTIST NOTE', 23, '#ffce58', 0, 'heading');
      text(700, 508, 'A service only helps when its method suits the mixture and desired material.\nCompare how much useful material each of your two services recovers.', 18, '#fff0d6', 851);
      text(700, 548, 'Recovery units are planning quantities. Separate liquid is not automatically safe to drink.', 17, '#c5b3ef', 851);
      nodes.push(control(scene, 640, 611, 'GOT IT', () => { scene.minigameHelpOpen = false; closeOpenModal(scene); scene.updateTestState(); }, { width: 180, height: 50, fill: 0x32641f }));
      return nodes;
    },
  });
  scene.updateTestState();
}
