// ===== LÒGICA DE COMBAT =====
function update(dt) {
  const p = state.player;
  const e = state.enemy;
  const mech = bossMech(e); // habilitat del cap especial (js/bosses.js), si en té
  const s = e.mech;
  mech?.tick?.(s, dt, e);

  p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);

  // Dany en el temps: cremades (Pell de foc) i sagnat (gos Mossegador)
  if (tickDot(e, "burn", "🔥", dt) || tickDot(e, "bleed", "🩸", dt)) { onEnemyDefeated(); return; }
  // Possessió (Aura fantasma): 1 s intangible cada N segons
  if (p.possessEvery) p.possessT = ((p.possessT || 0) + dt) % p.possessEvery;
  // Ninot de la falla: crema la granoteta tot el rato
  if (mech?.burnPlayer) {
    const dmg = e.atk * mech.burnPlayer * dt * (1 - p.dmgTaken);
    if (!CONFIG.debug.godMode) p.hp -= dmg;
    s.burnShown = (s.burnShown || 0) + dmg;
    if (s.burnShown >= e.atk * mech.burnPlayer) { spawnText($("player-avatar"), `🔥 -${fmtNum(s.burnShown)}`, "burn"); s.burnShown = 0; }
    if (p.hp <= 0) { onPlayerDefeated(); return; }
  }
  // Aliat del cap (el gos del Pastor): ataca la granoteta pel seu compte, sense vida
  if (mech?.ally) {
    s.allyT = (s.allyT || 0) + dt;
    while (s.allyT >= mech.ally.interval) {
      s.allyT -= mech.ally.interval;
      const dodged = playerDodge();
      if (dodged) { enemyAllyAttackFx(0, dodged); if (counter(e)) { onEnemyDefeated(); return; } continue; }
      const dmg = e.atk * mech.ally.pct * (1 - p.dmgTaken);
      if (!CONFIG.debug.godMode) p.hp -= dmg;
      enemyAllyAttackFx(dmg);
      if (p.hp <= 0) { onPlayerDefeated(); return; }
    }
  }

  p.timer += dt;
  while (p.timer >= p.attackInterval) {
    p.timer -= p.attackInterval;
    const missed = bossAvoids(mech, s);
    if (missed) {
      attackFx("player", "enemy", 0, { missed });
      continue;
    }
    // Doble volta: de vegades el colp es repetix (el segon pot ser crític per si mateix)
    const hits = roll(p.doubleChance) ? 2 : 1;
    for (let h = 0; h < hits; h++) {
      const crit = roll(p.critChance);
      const dmg = crit ? p.atk * p.critMult : p.atk;
      e.hp -= dmg;
      if (h === 0) attackFx("player", "enemy", dmg, { crit });
      else spawnText($("enemy-avatar"), `🔄 -${fmtNum(dmg)}`, crit ? "by-player crit" : "by-player");
      lifesteal(dmg);
      ignite(e);
    }
    // Traca (Pell de foc): cada N colps, un petard
    if (p.tracaEvery && (p.hits = (p.hits || 0) + 1) % p.tracaEvery === 0) {
      e.hp -= p.atk * p.tracaPct;
      spawnText($("enemy-avatar"), `🧨 -${fmtNum(p.atk * p.tracaPct)}`, "skill big");
    }
    if (e.hp <= 0) { onEnemyDefeated(); return; }
  }

  // Mascota (Pixel): ataca amb el seu propi ritme, independent de la granoteta. No té vida.
  const ally = equippedAlly();
  if (ally) {
    p.allyTimer = (p.allyTimer || 0) + dt;
    while (p.allyTimer >= ally.ally.interval) {
      p.allyTimer -= ally.ally.interval;
      const missed = bossAvoids(mech, s);
      if (missed) { allyAttackFx(0, { missed }); continue; }
      let dmg = allyDamage(ally);
      if (p.petCrit && roll(p.critChance)) dmg *= p.critMult; // Gat de carrer III
      e.hp -= dmg;
      allyAttackFx(dmg);
      lifesteal(dmg);
      // Gat de casa: cada colp cura (el doble amb poca vida)
      if (p.petHeal) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * p.petHeal * (p.hp < p.maxHp * 0.3 ? p.petHealLow : 1));
      // el gos d'atura endarrerix l'atac de l'enemic (Pastor: més, i cada N colps l'atura 1 s)
      if (ally.ally.herd) e.timer -= ally.ally.herd + p.herdAdd;
      if (p.stunEvery && (p.petHits = (p.petHits || 0) + 1) % p.stunEvery === 0) {
        e.timer -= 1;
        spawnText($("enemy-avatar"), "💫 Aturat!", "skill");
      }
      if (p.bleed) e.bleed = { dps: dmg * p.bleed, time: 3, shown: e.bleed?.shown || 0 }; // Mossegador III
      if (e.hp <= 0) { onEnemyDefeated(); return; }
    }
  }

  if (mech?.canAttack && !mech.canAttack(s)) return;
  e.timer += dt;
  while (e.timer >= e.attackInterval) {
    e.timer -= e.attackInterval;
    const special = mech?.attack?.(s) || { mult: 1 };
    const atk = e.atk * special.mult;
    if (special.text) spawnText($("enemy-avatar"), special.text, special.big ? "skill big" : "skill");
    // Capa roja (esquivar) o Possessió (intangible): l'atac no toca; amb Contraatac, es torna
    const dodged = playerDodge();
    if (dodged) {
      attackFx("enemy", "player", 0, { missed: dodged });
      if (counter(e)) { onEnemyDefeated(); return; }
      continue;
    }
    // Mentre el cap és intangible, tampoc li fan res la parada ni les espines
    const immune = mech?.immune?.(s);
    if (roll(p.parryChance)) {
      // Parada: la granoteta no rep res i l'enemic es menja el seu propi atac
      if (!immune) e.hp -= atk;
      attackFx("enemy", "player", 0, { parried: immune ? 0 : atk });
      if (e.hp <= 0) { onEnemyDefeated(); return; }
      continue;
    }
    if (!CONFIG.debug.godMode) p.hp -= atk * (1 - p.dmgTaken);
    // Espines: l'enemic rep una part del dany que fa
    const thorns = immune ? 0 : atk * p.thorns;
    e.hp -= thorns;
    attackFx("enemy", "player", atk, { thorns });
    mech?.onHitPlayer?.(e, atk);
    ignite(e); // Pell de foc: també crema qui et toca
    if (p.hp <= 0) { onPlayerDefeated(); return; }
    if (e.hp <= 0) { onEnemyDefeated(); return; }
  }
}

// Aura fantasma: la granoteta es cura una part del dany que fa (ella i la mascota)
function lifesteal(dmg) {
  const p = state.player;
  if (p.lifesteal > 0) p.hp = Math.min(p.maxHp, p.hp + dmg * p.lifesteal);
}

// Pell de foc: en contacte, l'enemic crema uns segons (es renova a cada contacte)
function ignite(e) {
  const p = state.player;
  if (p.burn > 0) e.burn = { dps: p.atk * p.burn, time: p.burnTime, shown: e.burn?.shown || 0 };
}

// Dany en el temps (e.burn, e.bleed): resta vida i mostra el número cada segon. Retorna true si l'enemic mor.
function tickDot(e, key, icon, dt) {
  const d = e[key];
  if (!d) return false;
  const t = Math.min(dt, d.time);
  e.hp -= d.dps * t;
  d.time -= t;
  d.shown = (d.shown || 0) + d.dps * t;
  if (d.time <= 0 || d.shown >= d.dps) { spawnText($("enemy-avatar"), `${icon} -${fmtNum(d.shown)}`, "burn"); d.shown = 0; }
  if (d.time <= 0) delete e[key];
  return e.hp <= 0;
}

// Esquives i immunitats dels caps (amb Raigs X, de vegades no serveixen de res)
const bossAvoids = (mech, s) => mech && !roll(state.player.xray) && (mech.immune?.(s) || mech.dodge?.(s));
// La granoteta evita un atac: intangible (Possessió) o esquiva (Capa roja). Retorna el text o res.
function playerDodge() {
  const p = state.player;
  if (p.possessEvery && p.possessT >= p.possessEvery - 1) return "👻 Intangible";
  return roll(p.dodgeChance) ? "🟥 Olé!" : "";
}
// Contraatac (Capa roja): en esquivar, torna part de l'atac. Retorna true si l'enemic mor.
function counter(e) {
  const p = state.player;
  if (!p.counter) return false;
  e.hp -= p.atk * p.counter;
  spawnText($("enemy-avatar"), `↩️ -${fmtNum(p.atk * p.counter)}`, "skill");
  return e.hp <= 0;
}

// Només es tira el dau si hi ha probabilitat: així qui no té la millora no gasta nombres aleatoris
const roll = probability => probability > 0 && Math.random() < probability;

function onEnemyDefeated() {
  const e = state.enemy;
  state.money += Math.round(e.reward * (1 + state.player.moneyBonus));
  bestiaryEntry(e.name).defeated++;
  checkItemRewards(); // alguns caps donen equipament (Pixel → mascota)
  if (!$("tab-bestiary").hidden) renderBestiary();
  state.player.timer = 0;

  if (isSceneEnd(state.level) && (state.examsPassed > sceneIndex(state.level) || CONFIG.debug.autoPassExams)) {
    // Examen ja aprovat en una partida anterior (o mode prova): es passa directament
    const auto = state.examsPassed <= sceneIndex(state.level);
    skipExam();
    toast(auto ? `🧪 Mode prova: examen aprovat. Passes a «${sceneOf(state.level).name}»`
               : `🎫 Examen ja aprovat. Passes a «${sceneOf(state.level).name}»`, "good");
    return;
  }

  if (isSceneEnd(state.level)) {
    // Final d'escenari: el combat es para i apareix l'examen a pantalla completa
    state.examPending = true;
    state.enemy = makeEnemy(state.level);
    showExamIntro();
    save();
    return;
  }
  advanceLevel();
  state.enemy = makeEnemy(state.level);
}

function onPlayerDefeated() {
  toast("❌ SUSPÉS! Torna-ho a intentar", "bad");
  state.player.hp = state.player.maxHp;
  state.player.timer = 0;
  // El mateix enemic, amb la vida plena
  state.enemy.hp = state.enemy.maxHp;
  state.enemy.timer = 0;
  delete state.enemy.burn;
  delete state.enemy.bleed;
  resetBossMech(state.enemy);
}
