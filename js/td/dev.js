// ===== ESTUDI: CONSOLA DE DESENVOLUPADOR =====
// Afig una secció «📚 Estudi» a la consola de desenvolupador (només en local, com la de l'autoescola: tecla º).
// També des de la consola del navegador: tdDev.pergamins(50), tdDev.allCreatures(), tdDev.gotoWave(9)...
let tdDevSpeed = 1; // multiplicador del combat (només dev)

const tdDev = {
  pergamins(n = 10) { for (const s of Object.keys(TD_SUBJECTS)) td.pergamins[s] += n; tdSave(); tdRefreshAll(); },
  saber(n = 1000) { td.saber += n; tdSave(); tdRefreshAll(); },
  // totes les criatures (també les mítiques), amb les còpies indicades (1 → ★1, 11 → ★5)
  allCreatures(copies = 1) {
    for (const id of Object.keys(TD_DEFENDERS)) {
      const o = td.owned[id] || (td.owned[id] = { copies: 0, level: 1 });
      o.copies = Math.max(o.copies, copies);
    }
    tdSave(); tdRefreshAll();
  },
  maxStars() { tdDev.allCreatures(TD_STAR_COPIES[TD_STAR_COPIES.length - 1]); },
  allArtifacts() {
    for (const id of Object.keys(TD_ARTIFACTS)) td.artifacts[id] = Math.max(td.artifacts[id] || 0, 1);
    td.equipped = Object.keys(TD_ARTIFACTS).slice(0, TD_ARTIFACT_SLOTS);
    tdSave(); tdRefreshAll();
  },
  // combat
  mana(n = 500) { if (tdb) tdb.mana += n; },
  god(on = true) { if (tdb) tdb.god = on; },
  killAll() { if (tdb) for (const e of [...tdb.enemies]) if (e.hp > 0) tdbKill(e); },
  winWave() { if (!tdb) return; tdb.spawnQueue = []; tdDev.killAll(); },
  // salta a l'onada n (la següent que comence serà la n)
  gotoWave(n) {
    if (!tdb) return;
    n = Math.max(1, Math.min(Math.floor(n), tdb.world.waves.length));
    tdb.spawnQueue = [];
    for (const e of tdb.enemies) e.el.remove();
    tdb.enemies = [];
    tdb.waveRunning = false;
    tdb.wave = n - 1;
    tdb.pause = 0;
    tdbStartWave();
  },
  speed(x) { tdDevSpeed = x; },
  // esborra la partida d'estudi del tot (com un jugador nou); se'n guarda una còpia
  wipe() {
    if (!confirm("Esborrar del tot la partida del joc d'estudi (també les criatures i els pergamins)? Se'n guardarà una còpia.")) return;
    try { localStorage.setItem(`${TD_SAVE_KEY}-backup-${Date.now()}`, JSON.stringify(td)); } catch {}
    td = tdNewState();
    tdSave();
    tdRefreshAll();
  },
  export() { tdSave(); return localStorage.getItem(TD_SAVE_KEY); },
};
function tdRefreshAll() {
  if (tdLobbyOpen()) { tdRenderLobby(); if (!$("td-dialog").hidden) tdRenderPanel(); }
  if (tdBattleOpen()) tdbRenderDeck();
}

function initTdDev() {
  if (typeof DEV_ENABLED === "undefined" || !DEV_ENABLED || !$("dev-console")) return;
  const sec = document.createElement("div");
  sec.className = "dev-section";
  sec.innerHTML = `<div class="dev-row"><strong>📚 Estudi</strong>
      <button class="small" data-tddev="perg">+10 📜</button><button class="small" data-tddev="perg100">+100 📜</button>
      <button class="small" data-tddev="saber">+1.000 ✨</button></div>
    <div class="dev-row"><button class="small" data-tddev="all">Totes les criatures</button><button class="small" data-tddev="stars">★5 a totes</button>
      <button class="small" data-tddev="arts">Artefactes</button></div>
    <div class="dev-row">Combat <button class="small" data-tddev="mana">+500 🔮</button><button class="small" data-tddev="god">Cristall invencible</button>
      <button class="small" data-tddev="win">Guanyar onada</button></div>
    <div class="dev-row">Onada <input type="number" id="td-dev-wave" min="1" max="10" value="5"><button class="small" data-tddev="wave">Anar</button>
      Vel. ${[1, 3, 5].map(s => `<button class="small secondary" data-tdspeed="${s}">${s}×</button>`).join("")}</div>
    <div class="dev-row"><button class="small" data-tddev="export">Exportar estudi</button><button class="small danger" data-tddev="wipe">Esborrar estudi</button></div>`;
  $("dev-console").insertBefore(sec, $("dev-info"));
  const acts = {
    perg: () => tdDev.pergamins(10), perg100: () => tdDev.pergamins(100), saber: () => tdDev.saber(1000),
    all: () => tdDev.allCreatures(1), stars: tdDev.maxStars, arts: tdDev.allArtifacts,
    mana: () => tdDev.mana(500), god: () => tdDev.god(!(tdb && tdb.god)), win: tdDev.winWave,
    wave: () => tdDev.gotoWave(Number($("td-dev-wave").value)), wipe: tdDev.wipe,
    export: () => { const t = tdDev.export(); $("dev-save").value = t; navigator.clipboard?.writeText(t).then(() => toast("📋 Partida d'estudi copiada"), () => {}); },
  };
  sec.addEventListener("click", ev => {
    const sp = ev.target.closest("[data-tdspeed]");
    if (sp) { tdDev.speed(Number(sp.dataset.tdspeed)); sec.querySelectorAll("[data-tdspeed]").forEach(b => b.classList.toggle("active", b === sp)); return; }
    const a = ev.target.closest("[data-tddev]")?.dataset.tddev;
    if (acts[a]) acts[a]();
  });
  // botó 🛠 a les barres de la sala i del combat (la capçalera de l'autoescola no es veu)
  for (const bar of ["td-lobby-top", "tdb-top"]) {
    const b = document.createElement("button");
    b.className = "small secondary";
    b.textContent = "🛠";
    b.title = "Consola de desenvolupador (º)";
    b.addEventListener("click", () => setDevOpen($("dev-console").hidden));
    $(bar).appendChild(b);
  }
  window.tdDev = tdDev;
}
