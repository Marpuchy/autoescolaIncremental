// ===== INICI =====
// Últim script: carrega la partida, connecta els botons i arranca el bucle.

state = load() || newState();
recomputeStats();
if (!state.enemy) state.enemy = makeEnemy(state.level);
else refreshEnemyStats(state.enemy, state.level); // per si el balanç ha canviat des que es va guardar

// ----- Panell dret plegable: en plegar-lo només queden les icones de les pestanyes -----
const SIDE_KEY = "autoescuela-side-collapsed";
function setSideCollapsed(collapsed) {
  $("side").classList.toggle("collapsed", collapsed);
  $("btn-side-toggle").textContent = collapsed ? "«" : "»";
  $("btn-side-toggle").title = collapsed ? "Desplegar" : "Plegar";
  try { localStorage.setItem(SIDE_KEY, collapsed ? "1" : "0"); } catch {}
}
$("btn-side-toggle").addEventListener("click", () => setSideCollapsed(!$("side").classList.contains("collapsed")));
try { setSideCollapsed(localStorage.getItem(SIDE_KEY) === "1"); } catch { setSideCollapsed(false); }

// ----- Pestanyes -----
document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t === tab));
  document.querySelectorAll(".tab-panel").forEach(p => p.hidden = p.id !== "tab-" + tab.dataset.tab);
  if ($("side").classList.contains("collapsed")) setSideCollapsed(false);
  if (tab.dataset.tab === "bestiary") renderBestiary();
}));
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

initDevConsole();
renderUpgrades();
renderTestPanel();
renderShop();
if (state.examPending && CONFIG.debug.autoPassExams) skipExam();
if (state.examPending) showExamIntro(); // l'examen pendent no es pot evitar recarregant
else toast("🚗 Benvingut a l'autoescola!");
requestAnimationFrame(loop);
