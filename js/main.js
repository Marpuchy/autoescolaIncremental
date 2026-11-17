// ===== INICI =====
// Últim script: carrega la partida, connecta els botons i arranca el bucle.

state = load() || newState();
recomputeStats();
grantStartingLevels();
if (!state.enemy) state.enemy = makeEnemy(state.level);
else refreshEnemyStats(state.enemy, state.level); // per si el balanç ha canviat des que es va guardar

// Diari (compendi): triar un enemic de l'índex, passar pàgina o tornar a l'índex (mòbil)
$("bestiary-list").addEventListener("click", ev => {
  const page = ev.target.closest("[data-page]");
  if (page) { bestiaryPage = Number(page.dataset.page); renderBestiary(); return; }
  if (ev.target.closest("[data-back]")) { openBeast = null; renderBestiary(); return; }
  const beast = ev.target.closest(".beast");
  if (!beast) return;
  openBeast = beast.dataset.name;
  renderBestiary();
});

// ----- Velocitat del combat (×1 / ×2): preferència de cada jugador, es guarda a banda de la partida -----
const SPEED_KEY = "autoescuela-speed";
let gameSpeed = 1;
try { gameSpeed = localStorage.getItem(SPEED_KEY) === "2" ? 2 : 1; } catch {}
function setGameSpeed(speed) {
  gameSpeed = speed;
  const btn = $("btn-speed");
  btn.innerHTML = speed === 2 ? "⏩<span> ×2</span>" : "▶<span> ×1</span>";
  btn.setAttribute("aria-pressed", speed === 2);
  btn.classList.toggle("on", speed === 2);
  btn.title = speed === 2 ? "Velocitat del combat: ×2 (toca per a tornar a ×1)" : "Velocitat del combat: ×1 (toca per a anar a ×2)";
  try { localStorage.setItem(SPEED_KEY, String(speed)); } catch {}
}
$("btn-speed").addEventListener("click", () => setGameSpeed(gameSpeed === 2 ? 1 : 2));
setGameSpeed(gameSpeed);

// ----- Botons -----
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
  if (!examOpen()) update(dt * CONFIG.debug.speed * gameSpeed); // el combat es para mentre hi ha examen
  render();
  requestAnimationFrame(loop);
}

initInventory();
initHub();
initRoom();
checkItemRewards(false); // partides d'abans: si ja havien derrotat un cap que dona equipament, el reben ara
initDevConsole();
renderUpgrades();
renderTestPanel();
renderShop();
if (state.examPending && CONFIG.debug.autoPassExams) skipExam();
if (state.examPending) showExamIntro(); // l'examen pendent no es pot evitar recarregant
else { openRoom(); toast("🏠 Benvingut a casa!"); } // s'entra per l'habitació
requestAnimationFrame(loop);
