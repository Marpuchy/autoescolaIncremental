// ===== CONSOLA DE DESENVOLUPADOR =====
// Només existeix en local (file://, localhost): a la versió publicada no es pot activar de cap manera.
// S'obri amb la tecla º (o `) o amb el botó 🛠 de la capçalera.
// També es pot usar des de la consola del navegador: dev.gotoLevel(51), dev.addMoney(1e6)...
// Els ajustos es guarden a part (DEV_KEY), mai dins de la partida.
const DEV_KEY = "autoescuela-dev";
const DEV_ENABLED = location.protocol === "file:" ||
  ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);

// En local, l'aprovat automàtic d'exàmens ve activat de sèrie
const devSettings = { autoPassExams: true, godMode: false, speed: 1, open: false };
try { Object.assign(devSettings, JSON.parse(localStorage.getItem(DEV_KEY))); } catch {}

const debugActive = () => CONFIG.debug.autoPassExams || CONFIG.debug.godMode || CONFIG.debug.speed !== 1;

function applyDevSettings() {
  CONFIG.debug.autoPassExams = devSettings.autoPassExams;
  CONFIG.debug.godMode = devSettings.godMode;
  CONFIG.debug.speed = devSettings.speed;
  try { localStorage.setItem(DEV_KEY, JSON.stringify(devSettings)); } catch {}
  $("debug-badge").hidden = !debugActive();
}

// ----- Accions (també accessibles com a window.dev) -----
const dev = {
  addMoney(n) { state.money += n; save(); },
  multiplyMoney(n) { state.money *= n; save(); },
  addL(n) { state.lcoins += n; renderTestPanel(); save(); },

  // Salta a qualsevol nivell; els escenaris anteriors es donen per aprovats
  gotoLevel(n) {
    n = Math.floor(Number(n));
    if (!(n >= 1)) return;
    const before = visibleUpgrades().length;
    state.level = n;
    state.best = Math.max(state.best, n);
    state.examsPassed = Math.max(state.examsPassed, sceneIndex(n));
    state.examPending = false;
    $("exam-screen").hidden = true;
    state.enemy = makeEnemy(n);
    state.player.hp = state.player.maxHp;
    state.player.timer = 0;
    renderUpgrades(before);
    save();
  },
  gotoSceneBoss() { dev.gotoLevel((sceneIndex(state.level) + 1) * CONFIG.levelsPerScene); },
  gotoNextScene() { dev.gotoLevel((sceneIndex(state.level) + 1) * CONFIG.levelsPerScene + 1); },

  killEnemy() {
    if (examOpen()) return;
    state.enemy.hp = 0;
    onEnemyDefeated();
  },
  passExam() {
    if (!state.examPending) return;
    $("exam-screen").hidden = true;
    skipExam();
  },
  heal() { state.player.hp = state.player.maxHp; },
  maxUpgrades() {
    for (const u of visibleUpgrades()) state.upgrades[u.id] = Math.max(state.upgrades[u.id], upgradeCap(u));
    recomputeStats();
    renderUpgrades();
    save();
  },

  exportSave() {
    save();
    return localStorage.getItem(SAVE_KEY);
  },
  // Substituïx la partida per una altra (en JSON) i recarrega. Se'n guarda una còpia de l'actual.
  importSave(text) {
    const data = JSON.parse(text);
    if (!data || typeof data !== "object" || !data.player) throw new Error("No sembla una partida vàlida");
    backupRawSave(dev.exportSave(), "dev-import");
    savingSuspended = true;
    localStorage.setItem(SAVE_KEY, text);
    location.reload();
  },
  // Esborra la partida del tot (com un jugador nou). Se'n guarda una còpia abans.
  wipeSave() {
    if (!confirm("Esborrar la partida del tot (també les L, el rècord i el compendi)? Se'n guardarà una còpia de seguretat.")) return;
    backupRawSave(dev.exportSave(), "dev-wipe");
    savingSuspended = true;
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  },
};

// ----- Panell -----
const DEV_ACTIONS = {
  "money-1k": () => dev.addMoney(1e3),
  "money-1m": () => dev.addMoney(1e6),
  "money-x10": () => dev.multiplyMoney(10),
  "l-10": () => dev.addL(10),
  "l-100": () => dev.addL(100),
  "goto": () => dev.gotoLevel($("dev-level").value),
  "boss": dev.gotoSceneBoss,
  "next-scene": dev.gotoNextScene,
  "kill": dev.killEnemy,
  "pass-exam": dev.passExam,
  "heal": dev.heal,
  "max-upgrades": dev.maxUpgrades,
  "export": () => {
    const text = dev.exportSave();
    $("dev-save").value = text;
    $("dev-save").select();
    navigator.clipboard?.writeText(text).then(() => toast("📋 Partida copiada al porta-retalls"), () => {});
  },
  "import": () => {
    try { dev.importSave($("dev-save").value.trim()); }
    catch (err) { toast(`❌ ${err.message}`, "bad"); }
  },
  "wipe": dev.wipeSave,
};

function setDevOpen(open) {
  devSettings.open = open;
  $("dev-console").hidden = !open;
  applyDevSettings();
  if (open) { $("dev-level").value = state.level; refreshDevInfo(); }
}

function refreshDevInfo() {
  if ($("dev-console").hidden) return;
  const p = state.player, e = state.enemy;
  $("dev-info").innerHTML =
    `Nivell ${state.level} · escenari ${sceneIndex(state.level) + 1} · exàmens aprovats ${state.examsPassed}<br>` +
    `🐸 vida ${fmtNum(p.hp)} / ${fmtNum(p.maxHp)} · atac ${fmtNum(p.atk)} · cada ${fmtNum(p.attackInterval)} s<br>` +
    `👾 ${e.name}: vida ${fmtNum(e.hp)} / ${fmtNum(e.maxHp)} · atac ${fmtNum(e.atk)} · ${fmt(e.reward)} 💰`;
}

function initDevConsole() {
  if (!DEV_ENABLED) { $("debug-badge").hidden = !debugActive(); return; }

  const btn = document.createElement("button");
  btn.id = "btn-dev";
  btn.className = "small secondary";
  btn.title = "Consola de desenvolupador (º)";
  btn.textContent = "🛠";
  document.querySelector(".stats-top").appendChild(btn);

  const panel = document.createElement("div");
  panel.id = "dev-console";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="dev-head">🛠 Consola de desenvolupador <button class="small secondary" data-dev="close">✕</button></div>
    <div class="dev-section">
      <label><input type="checkbox" id="dev-autopass"> Aprovar exàmens sols</label>
      <label><input type="checkbox" id="dev-god"> Invulnerable</label>
      <div class="dev-row">Velocitat
        ${[1, 2, 5, 10].map(s => `<button class="small secondary" data-speed="${s}">${s}×</button>`).join("")}
      </div>
    </div>
    <div class="dev-section">
      <div class="dev-row">💰
        <button class="small" data-dev="money-1k">+1.000</button>
        <button class="small" data-dev="money-1m">+1 M</button>
        <button class="small" data-dev="money-x10">×10</button>
      </div>
      <div class="dev-row">${L_ICON}
        <button class="small lbtn" data-dev="l-10">+10</button>
        <button class="small lbtn" data-dev="l-100">+100</button>
      </div>
    </div>
    <div class="dev-section">
      <div class="dev-row">Nivell <input type="number" id="dev-level" min="1" value="1"><button class="small" data-dev="goto">Anar</button></div>
      <div class="dev-row">
        <button class="small" data-dev="boss">Cap de l'escenari</button>
        <button class="small" data-dev="next-scene">Escenari següent</button>
      </div>
      <div class="dev-row">
        <button class="small" data-dev="kill">Matar enemic</button>
        <button class="small" data-dev="pass-exam">Aprovar examen</button>
        <button class="small" data-dev="heal">Curar</button>
        <button class="small" data-dev="max-upgrades">Millores al màxim</button>
      </div>
    </div>
    <div class="dev-section">
      <div class="dev-row">Partida
        <button class="small" data-dev="export">Exportar</button>
        <button class="small" data-dev="import">Importar</button>
        <button class="small danger" data-dev="wipe">Esborrar</button>
      </div>
      <textarea id="dev-save" rows="3" spellcheck="false" placeholder="Enganxa ací una partida (JSON) i prem Importar"></textarea>
    </div>
    <div class="dev-section muted" id="dev-info"></div>`;
  document.body.appendChild(panel);

  $("dev-autopass").checked = devSettings.autoPassExams;
  $("dev-god").checked = devSettings.godMode;
  const markSpeed = () => panel.querySelectorAll("[data-speed]").forEach(b =>
    b.classList.toggle("active", Number(b.dataset.speed) === devSettings.speed));
  markSpeed();

  $("dev-autopass").addEventListener("change", ev => {
    devSettings.autoPassExams = ev.target.checked;
    applyDevSettings();
    if (devSettings.autoPassExams) dev.passExam(); // si hi havia un examen pendent, es passa ja
  });
  $("dev-god").addEventListener("change", ev => { devSettings.godMode = ev.target.checked; applyDevSettings(); });
  panel.addEventListener("click", ev => {
    const speed = ev.target.closest("[data-speed]");
    if (speed) { devSettings.speed = Number(speed.dataset.speed); applyDevSettings(); markSpeed(); return; }
    const act = ev.target.closest("[data-dev]")?.dataset.dev;
    if (act === "close") setDevOpen(false);
    else if (DEV_ACTIONS[act]) { DEV_ACTIONS[act](); refreshDevInfo(); }
  });
  $("dev-level").addEventListener("keydown", ev => { if (ev.key === "Enter") DEV_ACTIONS.goto(); });

  btn.addEventListener("click", () => setDevOpen($("dev-console").hidden));
  document.addEventListener("keydown", ev => {
    if (ev.target.matches("input, textarea")) return;
    if (ev.key === "º" || ev.key === "`") setDevOpen($("dev-console").hidden);
  });
  setInterval(refreshDevInfo, 250);

  window.dev = dev;
  setDevOpen(devSettings.open);
}
