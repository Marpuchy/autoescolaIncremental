// ===== GENERACIÓ D'ENEMICS =====

// Mida del sprite segons com de gran és l'enemic
const spriteSize = mult => Math.min(1.35, 0.7 + 0.2 * mult);

// Tipus d'enemic i-èsim; si s'acaba la llista, se'n generen variants cada vegada més fortes
function enemyType(i) {
  if (i < ENEMY_TYPES.length) return ENEMY_TYPES[i];
  const extra = i - ENEMY_TYPES.length + 1;
  const base = ENEMY_TYPES[ENEMY_TYPES.length - 1 - ((extra - 1) % 4)];
  return { name: `${base.name} ${"⭐".repeat(Math.ceil(extra / 4))}`, mult: 3.4 * Math.pow(1.15, extra), icon: base.icon };
}

// Tria un enemic: amb el nivell, els grans tenen més pes i els xicotets menys
function pickEnemyType(level) {
  const available = 2 + sceneIndex(level);
  // Primer nivell d'un escenari nou: apareix l'enemic nou garantit
  if (level > CONFIG.levelsPerScene && (level - 1) % CONFIG.levelsPerScene === 0) return enemyType(available - 1);
  const power = (level - 1) / CONFIG.enemyBias;
  const weights = Array.from({ length: available }, (_, i) => Math.pow(i + 1, power));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < available; i++) {
    r -= weights[i];
    if (r <= 0) return enemyType(i);
  }
  return enemyType(available - 1);
}

// Vida, atac i recompensa d'un enemic amb multiplicador `mult` al nivell `level` (també ho usa el compendi)
// growthAccel: el creixement per nivell va augmentant (×growthAccel cada nivell), perquè cada escenari costi
// una mica més que l'anterior. S'aplica a vida, atac i recompensa (així els diners segueixen el ritme).
function enemyStats(mult, level) {
  const e = CONFIG.enemy;
  const n = level - 1;
  const accel = Math.pow(e.growthAccel ?? 1, n * (n - 1) / 2);
  return {
    maxHp: Math.round(e.baseHp * Math.pow(e.hpGrowth, n) * accel * mult),
    atk: Math.round(e.baseAtk * Math.pow(e.atkGrowth, n) * accel * mult * 10) / 10,
    attackInterval: e.attackInterval,
    reward: Math.round(e.baseReward * Math.pow(e.rewardGrowth, n) * accel * mult),
  };
}

function makeEnemy(level) {
  const isBoss = level % CONFIG.bossEvery === 0;
  const sceneBoss = sceneOf(level).boss;
  const type = !isBoss ? pickEnemyType(level)
    : sceneBoss ? { ...sceneBoss, mult: CONFIG.bossMultiplier }
    : { name: BOSS_NAME, mult: CONFIG.bossMultiplier, icon: BOSS_ICON };
  const stats = enemyStats(type.mult, level);
  return {
    name: type.name,
    icon: type.icon,
    size: spriteSize(type.mult),
    maxHp: stats.maxHp,
    hp: stats.maxHp,
    atk: stats.atk,
    attackInterval: stats.attackInterval,
    reward: stats.reward,
    timer: 0,
  };
}

// Recalcula les stats d'un enemic guardat amb el balanç actual. Si no, després de canviar CONFIG l'enemic de la
// partida guardada (p. ex. un cap contra el qual perds una vegada i una altra) es quedaria amb les stats velles.
// Es manté el tipus d'enemic i la proporció de vida que li quedava.
function refreshEnemyStats(e, level) {
  const isBoss = level % CONFIG.bossEvery === 0;
  let mult = isBoss ? CONFIG.bossMultiplier : null;
  for (let i = 0; mult === null && i < ENEMY_TYPES.length + 200; i++) if (enemyType(i).name === e.name) mult = enemyType(i).mult;
  if (mult === null) return e; // enemic desconegut: es deixa com està
  const s = enemyStats(mult, level);
  const ratio = e.maxHp > 0 ? Math.min(1, Math.max(0, e.hp / e.maxHp)) : 1;
  Object.assign(e, { maxHp: s.maxHp, hp: Math.max(1, Math.round(s.maxHp * ratio)), atk: s.atk,
    attackInterval: s.attackInterval, reward: s.reward, size: spriteSize(mult) });
  return e;
}

// Icona d'un enemic guardat: les partides antigues no guardaven la icona,
// i els caps especials sempre usen la icona actual (per si ha canviat des que es va guardar)
function enemyIcon(e) {
  const special = SCENES.find(sc => sc.boss && sc.boss.name === e.name);
  if (special) return special.boss.icon;
  if (e.icon) return e.icon;
  if (e.name.includes(BOSS_NAME)) return BOSS_ICON;
  const type = ENEMY_TYPES.find(t => e.name.startsWith(t.name));
  return type ? type.icon : "❓";
}
