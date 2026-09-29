// ===== LÒGICA DE COMBAT =====
function update(dt) {
  const p = state.player;
  const e = state.enemy;

  p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);

  p.timer += dt;
  while (p.timer >= p.attackInterval) {
    p.timer -= p.attackInterval;
    const crit = roll(p.critChance);
    const dmg = crit ? p.atk * CONFIG.combat.critMultiplier : p.atk;
    e.hp -= dmg;
    attackFx("player", "enemy", dmg, { crit });
    if (e.hp <= 0) { onEnemyDefeated(); return; }
  }

  e.timer += dt;
  while (e.timer >= e.attackInterval) {
    e.timer -= e.attackInterval;
    if (roll(p.parryChance)) {
      // Parada: la granoteta no rep res i l'enemic es menja el seu propi atac
      e.hp -= e.atk;
      attackFx("enemy", "player", 0, { parried: e.atk });
      if (e.hp <= 0) { onEnemyDefeated(); return; }
      continue;
    }
    if (!CONFIG.debug.godMode) p.hp -= e.atk;
    // Espines: l'enemic rep una part del dany que fa
    const thorns = e.atk * p.thorns;
    e.hp -= thorns;
    attackFx("enemy", "player", e.atk, { thorns });
    if (p.hp <= 0) { onPlayerDefeated(); return; }
    if (e.hp <= 0) { onEnemyDefeated(); return; }
  }
}

// Només es tira el dau si hi ha probabilitat: així qui no té la millora no gasta nombres aleatoris
const roll = probability => probability > 0 && Math.random() < probability;

function onEnemyDefeated() {
  const e = state.enemy;
  state.money += Math.round(e.reward * (1 + state.player.moneyBonus));
  bestiaryEntry(e.name).defeated++;
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
}
