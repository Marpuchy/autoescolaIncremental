// ===== CONFIGURACIÓ (ajusta ací el balanç) =====
const CONFIG = {
  // 🧪 PER A PROVAR. Deixa-ho tot desactivat ací: en local, la consola de desenvolupador (js/dev.js)
  // els activa sense tocar aquest fitxer, així no es puja mai el mode prova als jugadors.
  debug: {
    autoPassExams: false, // els exàmens d'escenari s'aproven sols
    godMode: false,       // la granoteta no rep dany
    speed: 1,             // multiplicador de la velocitat del joc
  },
  player: { maxHp: 150, atk: 10, attackInterval: 1.0, regen: 0, minInterval: 0.2 },
  enemy: {
    // Base alta i creixement suau: el principi ja costa una mica i no hi ha murs de cop més avant.
    // Ajustat amb una simulació (bot que compra el més barat i fa un test cada 5-10 min): el primer
    // cap es pot vèncer sense L amb totes les millores al límit inicial, i s'arriba al nivell 130+ en unes 8 h.
    baseHp: 80, hpGrowth: 1.05,
    baseAtk: 10, atkGrowth: 1.03,
    attackInterval: 1.2,
    baseReward: 8, rewardGrowth: 1.12,
  },
  bossEvery: 10,          // cada X nivells apareix un cap
  bossMultiplier: 3,
  enemyBias: 15,          // com més baix, més ràpid augmenta la probabilitat dels enemics grans
  levelsPerScene: 10,     // en derrotar el cap del nivell 10, 20... hi ha examen i canvia l'escenari
  levelCap: {
    initial: 5,           // nivell màxim inicial de cada millora
    step: 5,              // nivells que desbloqueja cada ampliació
    baseLCost: 2,         // cost en L de la primera ampliació
    lCostGrowth: 1,       // +X L per cada ampliació ja feta
    scalingPct: 10,       // cada ampliació multiplica l'escalat per (1 + X%): 100% -> 110% -> 121% -> 133%...
                          // (cada millora pot tindre el seu propi `scalingPct` a data/upgrades.js)
  },
  combat: {
    critMultiplier: 2,    // un crític fa ×X de dany
    maxCritChance: 75,    // % màxim de probabilitat de crític
    maxParryChance: 60,   // % màxim de probabilitat de parada (si no, la granoteta seria invencible)
  },
  testRewards: { 0: 5, 1: 3, 2: 1 },   // errades -> L
  shop: {
    enemiesWorth: 15,     // cada compra dona els diners d'X enemics normals del nivell actual
    baseLCost: 1,         // preu en L de la primera compra
    lCostGrowth: 1,       // +X L per cada compra ja feta (es reinicia en reiniciar la partida)
  },
  // Ratxa: cada test amb 0-2 errades la fa créixer; només es perd amb 3 o més errades.
  // L extra = ratxa (fins a maxStreak) × rate segons les errades del test → màx. +5 / +3 / +1
  streak: { maxStreak: 10, rate: { 0: 0.5, 1: 0.3, 2: 0.1 } },
  exam: { questions: 8, maxErrors: 1 }, // si se suspén, la partida es reinicia (es mantenen les L)
  hitDelay: 190,          // ms fins que l'envestida "impacta" (efectes visuals)
};
