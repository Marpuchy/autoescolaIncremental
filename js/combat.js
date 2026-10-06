// ===== LÒGICA DE COMBAT =====
function update(dt) {
  const p = state.player;
  const e = state.enemy;
  const mech = bossMech(e); // habilitat del cap especial (js/bosses.js), si en té
  const s = e.mech;
  mech?.tick?.(s, dt);

  p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);

  p.timer += dt;
  while (p.timer >= p.attackInterval) {
    p.timer -= p.attackInterval;
    const missed = mech && (mech.immune?.(s) || mech.dodge?.(s));
    if (missed) {
      attackFx("player", "enemy", 0, { missed });
      continue;
    }
    const crit = roll(p.critChance);
    const dmg = crit ? p.atk * CONFIG.combat.critMultiplier : p.atk;
    e.hp -= dmg;
    attackFx("player", "enemy", dmg, { crit });
    lifesteal(dmg);
    if (e.hp <= 0) { onEnemyDefeated(); return; }
  }

  // Mascota (Pixel): ataca amb el seu propi ritme, independent de la granoteta. No té vida.
  const ally = equippedAlly();
  if (ally) {
    p.allyTimer = (p.allyTimer || 0) + dt;
    while (p.allyTimer >= ally.ally.interval) {
      p.allyTimer -= ally.ally.interval;
      const missed = mech && (mech.immune?.(s) || mech.dodge?.(s));
      if (missed) { allyAttackFx(0, { missed }); continue; }
      const dmg = allyDamage(ally);
      e.hp -= dmg;
      allyAttackFx(dmg);
      lifesteal(dmg);
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
    // Capa roja: l'atac es queda en la tela
    if (roll(p.dodgeChance)) {
      attackFx("enemy", "player", 0, { missed: "🟥 Olé!" });
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
    if (!CONFIG.debug.godMode) p.hp -= atk;
    // Espines: l'enemic rep una part del dany que fa
    const thorns = immune ? 0 : atk * p.thorns;
    e.hp -= thorns;
    attackFx("enemy", "player", atk, { thorns });
    mech?.onHitPlayer?.(e, atk);
    if (p.hp <= 0) { onPlayerDefeated(); return; }
    if (e.hp <= 0) { onEnemyDefeated(); return; }
  }
}

// Aura fantasma: la granoteta es cura una part del dany que fa (ella i la mascota)
function lifesteal(dmg) {
  const p = state.player;
  if (p.lifesteal > 0) p.hp = Math.min(p.maxHp, p.hp + dmg * p.lifesteal);
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
  resetBossMech(state.enemy);
}
