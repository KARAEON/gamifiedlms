const musicByGame = new WeakMap();

const AREA_TRACKS = {
  'vulcan-caverns': 'bgm-vulcan_caverns',
  'numeric-ruins': 'bgm-numeric_ruins',
  'reading-island': 'bgm-reading_island',
};

export function stopAreaMusic(scene) {
  const current = musicByGame.get(scene.game);
  current?.sound?.stop();
  current?.sound?.destroy();
  musicByGame.delete(scene.game);
}

export function playAreaMusic(scene, islandId = null) {
  const wanted = AREA_TRACKS[islandId] ?? 'bgm-world_map';
  const key = scene.cache.audio.exists(wanted) ? wanted : 'bgm-world_map';
  const current = musicByGame.get(scene.game);
  if (!scene.registry.get('musicEnabled')) {
    current?.sound?.stop();
    musicByGame.delete(scene.game);
    return;
  }
  if (current?.key === key && current.sound?.isPlaying) return;

  current?.sound?.stop();
  current?.sound?.destroy();
  musicByGame.delete(scene.game);

  if (!scene.cache.audio.exists(key)) return;
  try {
    const sound = scene.sound.add(key, { loop: true, volume: 0.4 });
    musicByGame.set(scene.game, { key, sound });
    sound.play();
  } catch (error) {
    musicByGame.get(scene.game)?.sound?.destroy();
    musicByGame.delete(scene.game);
    console.warn('Background music unavailable:', error);
  }
}
