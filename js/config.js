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
    // Balanç pensat en TESTS (la L ve dels tests): el nivell 1 es guanya sense millores i, per a passar cada món,
    // un jugador mitjà ha de fer uns 5-10 tests als mons 1-3, 10-15 als 4-6 i 20-25 als 7-9 (+10 cada 3 mons).
    // Referència real: amb ~17 tests (alguns en ratxa) s'està a punt de passar l'Avinguda València.
    // Ajustat amb un bot que juga amb el codi real i fa tests quan s'encalla (mitjana de 5 partides):
    //   jugador mitjà → 41 tests en acabar Av. València i 106 en arribar a València · jugador bo → 27 i 65.
    // growthAccel < 1: el creixement per nivell es va frenant a poc a poc (si no, els últims mons es disparen).
    baseHp: 57, hpGrowth: 1.11,
    baseAtk: 7.6, atkGrowth: 1.07,
    growthAccel: 0.99953,
    minGrowth: 1.01,      // creixement mínim per nivell (el fre de growthAccel no baixa d'ací; no afecta els nivells 1-120)
    attackInterval: 1.2,
    // Vida extra de cada escenari (índex 0 = primer). Compensa que crític i diners s'obrin als Afores de Castelló
    // i parada i espines a l'Avinguda València: ajustat amb el bot perquè cada escenari demane els mateixos tests
    // que quan s'obrien a la Vall d'Uixó i a Sogorb (jugador mitjà → 31 en acabar Av. València, 112 València).
    sceneHpMult: [1, 1, 1, 1.1, 1.65, 2.1, 2.15, 2.1, 1.75, 1.5, 1.5, 1.45],
    // Diners: n'hi ha prou per a omplir els límits que obri la L, sense que sobren a cabassos
    baseReward: 13, rewardGrowth: 1.0829,
  },
  bossEvery: 10,          // cada X nivells apareix un cap
  bossMultiplier: 4.66,   // els caps són el mur de cada món (el nivell 1 és fàcil, el cap del 10 ja demana L)
  enemyBias: 15,          // com més baix, més ràpid augmenta la probabilitat dels enemics grans
  levelsPerScene: 10,     // en derrotar el cap del nivell 10, 20... hi ha examen i canvia l'escenari
  levelCap: {
    startLevel: 1,        // nivell gratis amb què comença cada millora (en desbloquejar-la i en reiniciar)
    initial: 3,           // nivell màxim inicial de cada millora (la resta s'obri amb L)
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
