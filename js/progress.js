// ===== PROGRÉS: nivells, escenaris i reinicis =====

function advanceLevel() {
  state.level++;
  state.best = Math.max(state.best, state.level);
}

// Aprova l'examen de l'escenari actual i passa al següent
function passSceneExam() {
  state.examPending = false;
  state.examsPassed = Math.max(state.examsPassed, sceneIndex(state.level) + 1);
  advanceLevel();
  grantStartingLevels(); // les millores noves comencen al nivell 1
  state.enemy = makeEnemy(state.level);
}

// Passa al següent escenari sense fer l'examen
function skipExam() {
  const before = visibleUpgrades().length;
  passSceneExam();
  if (visibleUpgrades().length > before) toast("✨ Noves millores disponibles!", "good");
  renderUpgrades(before);
  save();
}

// Reinicia la partida: es desfan les ampliacions i les compres de la botiga i es tornen les L gastades.
// Es conserven les L, els tests i la ratxa. Retorna les L tornades.
function restartGame() {
  const shopSpent = linearCostSum(state.shopPurchases, CONFIG.shop.baseLCost, CONFIG.shop.lCostGrowth);
  const refunded = UPGRADES.reduce((sum, u) => sum + spentL(u), 0) + shopSpent;
  state = newState({
    lcoins: state.lcoins + refunded,
    testsDone: state.testsDone,
    perfectStreak: state.perfectStreak,
    examsPassed: state.examsPassed,
    best: state.best,
    bestiary: state.bestiary,
    inventory: state.inventory,
  });
  recomputeStats();
  grantStartingLevels();
  state.player.hp = state.player.maxHp;
  state.enemy = makeEnemy(1);
  renderUpgrades();
  save();
  return refunded;
}

function reset() {
  if (!confirm("Segur que vols reiniciar la partida? Perdràs els diners, el nivell i les millores. Es desfan les ampliacions i les compres de la botiga, i se't tornen totes les L gastades per a replantejar l'estratègia.")) return;
  const refunded = restartGame();
  $("exam-screen").hidden = true;
  toast("🚗 Nova partida. Primer dia d'autoescola!");
  if (refunded > 0) toast(`↩️ Se t'han tornat ${refunded} ${L_ICON}`, "good");
}
