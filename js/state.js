// ===== ESTAT =====
// Tot el que es guarda de la partida viu en `state` (vegeu save.js per a la compatibilitat).
let state;

function newState(keep = {}) {
  return {
    money: 0,
    lcoins: keep.lcoins || 0,
    testsDone: keep.testsDone || 0,
    perfectStreak: keep.perfectStreak || 0,
    shopPurchases: 0, // compres fetes en la botiga (es reinicien i es tornen les L)
    examsPassed: keep.examsPassed || 0, // exàmens d'escenari aprovats (es conserven en reiniciar)
    expansions: Object.fromEntries(UPGRADES.map(u => [u.id, 0])),
    level: 1,
    best: keep.best || 1,               // rècord de totes les partides (es conserva en reiniciar)
    bestiary: keep.bestiary || {},      // compendi: { nom: { seen, defeated, firstLevel } } de totes les partides
    examPending: false,
    upgrades: Object.fromEntries(UPGRADES.map(u => [u.id, 0])),
    player: { hp: CONFIG.player.maxHp, timer: 0 },
    enemy: null,
  };
}

const sceneIndex = level => Math.floor((level - 1) / CONFIG.levelsPerScene);
const sceneOf = level => {
  const i = sceneIndex(level);
  return SCENES[i] || { name: `Escenari ${i + 1}`, bg: DEFAULT_SCENE_BG };
};
const isSceneEnd = level => level % CONFIG.levelsPerScene === 0;
