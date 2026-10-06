// ===== GENERACIÓ D'ENEMICS =====

// Mida del sprite segons com de gran és l'enemic
const spriteSize = mult => Math.min(1.35, 0.7 + 0.2 * mult);

// Tipus d'enemic i-èsim. Quan s'acaba la llista, els escenaris de després repetixen els que ja hi ha
// (sense variants: ja són més forts pel nivell)
const enemyType = i => ENEMY_TYPES[Math.min(i, ENEMY_TYPES.length - 1)];
// Quants tipus poden eixir en un nivell: un més per escenari, fins que s'acaba la llista
const availableTypes = level => Math.min(2 + sceneIndex(level), ENEMY_TYPES.length);

// Tria un enemic: amb el nivell, els grans tenen més pes i els xicotets menys
function pickEnemyType(level) {
  const available = availableTypes(level);
  // Primer nivell d'un escenari nou: apareix l'enemic nou garantit (si n'hi ha de nou)
  const newType = 2 + sceneIndex(level) <= ENEMY_TYPES.length;
  if (newType && level > CONFIG.levelsPerScene && (level - 1) % CONFIG.levelsPerScene === 0) return enemyType(available - 1);
  const power = (level - 1) / CONFIG.enemyBias;
  const weights = Array.from({ length: available }, (_, i) => Math.pow(i + 1, power));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < available; i++) {
    r -= weights[i];
    if (r <= 0) return enemyType(i);
  }
  return enemyType(available - 1);
}

// Creixement acumulat de `n` nivells: cada nivell multiplica per `growth`, frenat per growthAccel (×accel cada nivell)
// perquè els últims mons no es disparen. El creixement per nivell mai baixa de minGrowth: si no, a partir del
// nivell ~200 els enemics es tornarien més dèbils en lloc de més forts (i cap al 800 tindrien 0 de vida).
function grown(growth, n) {
  const { growthAccel: accel = 1, minGrowth = 1 } = CONFIG.enemy;
  // nivells que passen abans que el creixement frenat arribe al mínim
  const k0 = accel < 1 && growth > minGrowth ? Math.ceil(Math.log(minGrowth / growth) / Math.log(accel)) : Infinity;
  const k = Math.min(n, k0);
  return Math.pow(growth, k) * Math.pow(accel, k * (k - 1) / 2) * Math.pow(minGrowth, n - k);
}

// Vida, atac i recompensa d'un enemic amb multiplicador `mult` al nivell `level` (també ho usa el compendi).
// El creixement s'aplica a vida, atac i recompensa (així els diners segueixen el ritme).
// sceneHpMult: ajust de la vida de cada escenari (vegeu CONFIG.enemy); els escenaris de després usen l'últim valor
function enemyStats(mult, level) {
  const e = CONFIG.enemy;
  const n = level - 1;
  const hpMults = e.sceneHpMult || [];
  const sceneHp = hpMults.length ? hpMults[Math.min(sceneIndex(level), hpMults.length - 1)] : 1;
  return {
    maxHp: Math.round(e.baseHp * grown(e.hpGrowth, n) * mult * sceneHp),
    atk: Math.round(e.baseAtk * grown(e.atkGrowth, n) * mult * 10) / 10,
    attackInterval: e.attackInterval,
    reward: Math.round(e.baseReward * grown(e.rewardGrowth, n) * mult),
  };
}

// Stats d'un cap especial: les del cap normal, compensades segons la seua habilitat (hpMult / atkMult)
function bossStats(boss, level) {
  const s = enemyStats(CONFIG.bossMultiplier, level);
  return { ...s, maxHp: Math.round(s.maxHp * (boss.hpMult ?? 1)), atk: Math.round(s.atk * (boss.atkMult ?? 1) * 10) / 10 };
}

function makeEnemy(level) {
  const isBoss = level % CONFIG.bossEvery === 0;
  const sceneBoss = sceneOf(level).boss;
  const type = !isBoss ? pickEnemyType(level)
    : sceneBoss ? { ...sceneBoss, mult: CONFIG.bossMultiplier }
    : { name: BOSS_NAME, mult: CONFIG.bossMultiplier, icon: BOSS_ICON };
  const stats = isBoss && sceneBoss ? bossStats(sceneBoss, level) : enemyStats(type.mult, level);
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
  if (mult === null) mult = ENEMY_TYPES.find(t => t.name === e.name)?.mult ?? null;
  if (mult === null) return e; // enemic desconegut: es deixa com està
  const special = isBoss && specialBoss(e.name);
  const s = special ? bossStats(special, level) : enemyStats(mult, level);
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
