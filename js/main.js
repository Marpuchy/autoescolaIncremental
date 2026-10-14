// ===== INICI =====
// Últim script: carrega la partida, connecta els botons i arranca el bucle.

state = load() || newState();
recomputeStats();
grantStartingLevels();
if (!state.enemy) state.enemy = makeEnemy(state.level);
else refreshEnemyStats(state.enemy, state.level); // per si el balanç ha canviat des que es va guardar

// Clic en una entrada del compendi: mostra/amaga la descripció
$("bestiary-list").addEventListener("click", ev => {
  const beast = ev.target.closest(".beast");
  if (!beast) return;
  openBeast = openBeast === beast.dataset.name ? null : beast.dataset.name;
  renderBestiary();
});

// ----- Botons -----
$("btn-reset").addEventListener("click", reset);
$("btn-shop-buy").addEventListener("click", buyCoins);
$("btn-exam-start").addEventListener("click", startExam);
$("btn-exam-retry").addEventListener("click", closeAfterFail);
$("btn-exam-submit").addEventListener("click", submitExam);
$("btn-exam-continue").addEventListener("click", continueAfterExam);

for (const id of ["player", "enemy"]) {
  $(id).addEventListener("animationend", ev => {
    if (ev.animationName === "shake") $(id).classList.remove("hit");
  });
}

// ----- Guardat periòdic i en tancar/amagar la pestanya -----
setInterval(save, 5000);
window.addEventListener("pagehide", save);
window.addEventListener("beforeunload", save);
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

// ----- Bucle principal -----
let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 1);
  last = now;
  if (!examOpen()) update(dt * CONFIG.debug.speed); // el combat es para mentre hi ha examen
  render();
  requestAnimationFrame(loop);
}

initInventory();
initHub();
checkItemRewards(false); // partides d'abans: si ja havien derrotat un cap que dona equipament, el reben ara
initDevConsole();
renderUpgrades();
renderTestPanel();
renderShop();
if (state.examPending && CONFIG.debug.autoPassExams) skipExam();
if (state.examPending) showExamIntro(); // l'examen pendent no es pot evitar recarregant
else toast("🚗 Benvingut a l'autoescola!");
requestAnimationFrame(loop);
