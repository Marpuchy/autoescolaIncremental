// ===== ESTUDI: COMBAT (tower defense) =====
// Les distraccions avancen pel camí cap al Cristall del Coneixement; les criatures, posades als buits, les ataquen.
// El maná (per a posar i potenciar criatures) és només l'inicial més el que deixa cada distracció en morir i saber (es queda en acabar, per a pujar-les de
// nivell a la sala). Del combat no ix mai res del gacha: els pergamins només venen d'estudiar.
// Coordenades del mapa: 1600 × 900. En pantalles verticals el mapa es gira (tdbS) però els dibuixos es queden drets.
const SVGNS = "http://www.w3.org/2000/svg";
let tdb = null; // combat en marxa
const tdBattleOpen = () => !!tdb && !$("td-battle").hidden;

// ---------------------------------------------------------------- camí
function tdbPath(points) {
  const segs = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1], [x1, y1] = points[i];
    const len = Math.hypot(x1 - x0, y1 - y0);
    segs.push({ x0, y0, x1, y1, len, from: total });
    total += len;
  }
  return { segs, total, at(d) {
    d = Math.max(0, Math.min(d, total));
    const s = segs.find(sg => d <= sg.from + sg.len) || segs[segs.length - 1];
    const t = (d - s.from) / s.len;
    return [s.x0 + (s.x1 - s.x0) * t, s.y0 + (s.y1 - s.y0) * t];
  } };
}
// Mapa → pantalla (vertical: girat 90°)
const tdbS = (x, y) => tdb.portrait ? [900 - y, x] : [x, y];
const tdbM = (sx, sy) => tdb.portrait ? [sy, 900 - sx] : [sx, sy]; // pantalla → mapa
const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};

// ---------------------------------------------------------------- obrir i tancar
// Botó de velocitat: ×1 / ×2, amb la que va marcada. Cada combat comença a ×1 (també el botó)
// ×4 quan el món ja ha arribat a l'onada 50
const tdbSpeeds = () => tdb?.idle && (td.worlds[tdb.world.id]?.best || 0) >= TD_IDLE.fastAt ? [1, 2, 4] : [1, 2];
function tdbSpeedBtn() {
  const b = $("tdb-speed"), sp = tdbSpeeds(), cur = tdb?.speed || 1;
  b.innerHTML = sp.map(v => `<span class="${v === cur ? "sel" : ""}">${v === 1 ? "▶" : v === 2 ? "⏩" : "⏭"} ×${v}</span>`).join("");
  b.classList.toggle("on", cur > 1);
  b.setAttribute("aria-pressed", cur > 1);
  b.title = `Velocitat ×${cur} (toca per a canviar-la)`;
}
// ---------------------------------------------------------------- mons idle (TD_IDLE): 100 onades que no es perden
// El progrés de cada món (td.worlds[id]): best, clears i run = { snap: com començava l'onada en marxa (per a repetir-la),
// tens: com començava l'última onada després d'un múltiple de 10 (per a tornar-hi) }. El combat continua encara que
// ixques de la pantalla (tdb es queda viu) i, amb el joc tancat, el temps es guarda i després va més ràpid (tdb.bank).
const tdbViewing = () => typeof tdViewingOf !== "undefined" && !!tdViewingOf; // mirant la partida de l'altra persona: el combat espera
const tdIdleWorld = w => !w.demo && TD_WORLDS.includes(w) && w.id !== 999;
const tdRun = id => td.worlds[id] || (td.worlds[id] = { best: 0, clears: 0 });
function tdWorldExtended(world) {
  if (!world.ext || world.extended) return world;
  const pre = world.ext.pre;
  return { ...world, path: world.path && [...pre, ...world.path], paths: world.paths?.map(p => [...pre, ...p]), slots: [...world.slots, ...world.ext.slots], extended: true, base: world };
}
const tdWorldBosses = world => [...new Set(world.waves.flat().map(x => x[0]).filter(t => TD_ENEMIES[t]?.boss))];
const tdWorldTypes = world => [...new Set(world.waves.flat().map(x => x[0]).filter(t => TD_ENEMIES[t] && !TD_ENEMIES[t].boss && !TD_ENEMIES[t].hidden))];
// Onada n d'un món: la plantilla de les 10 onades del món (sense els caps), cada vegada amb més distraccions; cada 10, una
// gegant; a la 30, 50, 70 i 100, els caps amb nom
function tdWaveSpec(world, n) {
  const I = TD_IDLE, src = world.base || world, T = src.waves[(n - 1) % src.waves.length].filter(([t]) => !TD_ENEMIES[t].boss);
  const grow = 1 + I.countGrow * (n - 1);
  const spec = (T.length ? T : src.waves[0]).map(([t, c, g]) => [t, Math.max(1, Math.round(c * grow)), +(g / Math.sqrt(grow)).toFixed(2), ""]);
  const bosses = tdWorldBosses(src);
  if (I.bossWaves[n]) for (const i of I.bossWaves[n]) spec.push([bosses[i] || bosses[0], 1, 3, n === I.waves ? "big" : ""]);
  else if (n % I.giantEvery === 0) { const types = tdWorldTypes(src); spec.push([types[(n / I.giantEvery) % types.length], 1, 1, "giant"]); }
  return spec;
}
// Vida de les distraccions a l'onada n: puja de pressa al principi i encara més al final (els caps, la meitat)
const tdIdleHp = (n, boss) => 1 + (boss ? 0.5 : 1) * (TD_IDLE.waveHp * (n - 1) + TD_IDLE.waveHp2 * (n - 1) ** 2);
const tdbWaveCount = () => tdb.idle ? TD_IDLE.waves : tdb.world.waves.length;
const tdbMaxLives = () => TD_BATTLE.lives + 3 * td.upgrades.vida;
const tdbWaveMana = n => Math.round((TD_IDLE.waveMana[0] + TD_IDLE.waveMana[1] * n) * (1 + 0.08 * td.upgrades.mana));
// El saber guanyat passa a la partida (a cada onada, en perdre-la i en eixir)
function tdbBank() {
  if (!tdb?.idle || tdbViewing()) return;
  const s = Math.floor(tdb.saber);
  if (s > 0) { td.saber += s; tdb.saberTotal = (tdb.saberTotal || 0) + s; tdb.saber -= s; }
}
// Com comença l'onada: per a repetir-la si es perd (i, després de cada múltiple de 10, per a poder-hi tornar)
function tdbSnap() {
  const run = tdRun(tdb.world.id), snap = { wave: tdb.wave, mana: Math.floor(tdb.mana),
    towers: Object.values(tdb.towers).map(t => [t.slot, t.id, t.up, t.spent]) };
  run.run = { ...(run.run || {}), snap, speed: tdb.speed };
  if (tdb.wave > 1 && (tdb.wave - 1) % 10 === 0) run.run.tens = snap;
  td.idle = { world: tdb.world.id, at: Date.now() };
  tdSave();
}
// Torna a posar el combat tal com estava a l'inici d'una onada (sense pagar res) i la torna a començar
function tdbRestore(snap) {
  for (const e of tdb.enemies) e.el?.remove();
  for (const p of tdb.projs) p.el?.remove();
  Object.assign(tdb, { enemies: [], projs: [], lines: [], pulses: [], zones: [], chains: [], waves: [], hooks: [], spawnQueue: [], towers: {},
    over: false, lost: false, won: false, shattering: false, ended: false, rushT: 0, waveRunning: false });
  const base = tdb.world.base || tdb.world;
  tdb.world = snap.wave > TD_IDLE.extAt ? tdWorldExtended(base) : base;
  tdb.paths = tdbWorldPaths(tdb.world).map(tdbPath);
  tdb.wave = snap.wave - 1;
  tdb.mana = snap.mana;
  tdb.lives = tdbMaxLives();
  tdbBuildView();
  for (const [slot, id, up, spent] of snap.towers) tdbPut(slot, id, up, spent);
  tdb.started = true;
  tdb.pause = 3;
  if (!$("td-battle").hidden) { tdbRenderDeck(); tdbCloseBottom(); }
  tdbHud();
}
function tdbPut(slot, id, up = 0, spent = 0) { // una criatura, sense pagar-la ni animació (en tornar a una onada)
  if (!TD_DEFENDERS[id] || !tdb.world.slots[slot] || tdb.towers[slot]) return;
  const t = { uid: ++tdb.uid, slot, id, up: Math.max(0, Math.min(2, up | 0)), cd: 0.3, shots: 0, stacks: 0, sleepT: 0, side: 0, spent: spent || TD_DEFENDERS[id].cost, burst: 0 };
  t.stats = tdStats(id, t.up);
  tdb.towers[slot] = t;
  tdbDrawTower(t);
  if (TD_DEFENDERS[id].role === "line") tdbPlaceLine(t);
  tdbAuraMarks(true);
}
// L'onada s'ha perdut: el saber es queda, i es torna a fer tal com havia començat
function tdbWaveLost() {
  tdbBank();
  tdb.over = true; tdb.lost = true;
  tdbBanner(`Onada ${tdb.wave} perduda · es torna a fer`);
  const B = tdb, snap = tdRun(tdb.world.id).run?.snap;
  setTimeout(() => { if (tdb === B && B.lost && snap) tdbRestore(snap); }, 1800);
}
// Para del tot el combat (en obrir-ne un altre, reiniciar o tornar a començar la sala)
function tdStopBattle() {
  if (!tdb) return;
  tdbBank();
  if (tdb.idle) { td.idle = { world: 0, at: 0 }; tdSave(); }
  tdb = null;
  $("td-battle").hidden = true;
}
// Torna a començar un món: des de l'última onada després d'un múltiple de 10, o des de zero
function tdResetWorld(id, tens) {
  const w = tdRun(id), run = w.run || {};
  if (tdb?.world.id === id) tdStopBattle();
  if (tens && run.tens) w.run = { ...run, snap: run.tens }; else delete w.run;
  tdSave();
}
// Temps amb el joc tancat: es guarda i després el combat va més ràpid fins que s'acaba (com si haguera seguit)
function tdbOffline(at) {
  if (!tdb?.idle || !at) return;
  const away = Math.min(TD_IDLE.offlineMax, Math.max(0, (Date.now() - at) / 1000));
  if (away > 60) { tdb.bank = Math.min(TD_IDLE.offlineMax, (tdb.bank || 0) + away); toast(`⏳ Mentre no hi eres: ${Math.round(away / 60)} min de combat que ara van ×${TD_IDLE.offlineBoost}`, "good"); }
}
// En carregar: el món que estava en marxa continua sol, en segon pla (i recupera el temps que el joc ha estat tancat)
function tdResumeActive() {
  if (tdb || tdbViewing() || !td.idle?.world) return;
  const w = TD_WORLDS.find(o => o.id === td.idle.world);
  if (!w || w.soon || !tdRun(w.id).run?.snap) return;
  const at = td.idle.at;
  tdOpenBattle(w.id, true);
  tdbOffline(at);
}

function tdOpenBattle(worldId = 1, background = false) {
  const world = TD_WORLDS.find(w => w.id === worldId && !w.soon);
  if (!world || tdWorldShut(world)) return;
  if (tdb && (tdb.world.base || tdb.world).id === worldId && tdb.idle) { if (!background) tdbShow(); return; } // ja està en marxa: només es mira
  if (!tdTeam(world.mode).length) { toast("Tria almenys una criatura per a l'equip (al grimori)", "bad"); return; }
  if (tdb) tdStopBattle(); // un món en marxa cada vegada
  tdb = {

    // camins: un, o diversos que es bifurquen i tornen a ajuntar-se (world.paths). Les distraccions es reparteixen.
    world, paths: (world.paths || [world.path]).map(tdbPath), wave: 0, waveRunning: false, pause: 0, spawnQueue: [], spawnT: 0,
    lives: TD_BATTLE.lives + 3 * td.upgrades.vida, mana: TD_BATTLE.startMana + (world.mana || 0) + 20 * td.upgrades.mana,
    saber: 0, kills: 0, enemies: [], towers: {}, projs: [], selected: null, selectedTower: null,
    speed: 1, over: false, time: 0, rushT: 0, uid: 0, artifactsWon: [], bossesSeen: new Set(),
    god: false, lines: [], pulses: [], zones: [], idle: tdIdleWorld(world), bank: 0,
  };
  const run = tdb.idle && tdRun(world.id).run;
  if (run?.snap) { tdb.speed = tdbSpeeds().includes(run.speed) ? run.speed : 1; tdbRestore(run.snap); }
  else tdbBuildView();
  tdb.last = performance.now();
  requestAnimationFrame(tdbLoop);
  if (tdb.idle) { td.idle = { world: world.id, at: Date.now() }; tdSave(); }
  if (!background) tdbShow();
}
// Mostra la pantalla del combat (el combat ja pot estar en marxa)
function tdbShow() {
  if (typeof roomOpen === "function" && roomOpen()) closeRoom();
  $("td-lobby").hidden = true;
  $("td-battle").hidden = false;
  document.body.classList.add("td-open");
  tdbBuildView();
  tdbRenderDeck();
  tdbCloseBottom();
  tdbHud();
  tdbSpeedBtn();
  $("tdb-end").hidden = !(tdb.over && tdb.won);
}
// Eixir del combat: als mons de 100 onades continua en segon pla (el portal de la sala el deixa veure)
function tdCloseBattle(toLobby = true) {
  if (tdb && !tdb.idle) { if (!tdb.over || (tdb.shattering && !tdb.ended)) { tdb.ended = true; tdbFinish(false, true); } tdb = null; }
  else if (tdb) { tdbBank(); tdbCloseBottom(); tdSave(); }
  $("td-battle").hidden = true;
  if (toLobby) tdOpenLobby(tdRoom);
}


// ---------------------------------------------------------------- vista
function tdbBuildView() {
  tdb.portrait = innerWidth < innerHeight * 0.9;
  const svg = $("tdb-svg");
  const V = tdb.world.extended ? tdb.world.ext.view : [0, 0, 1600, 900]; // el mapa ampliat (onada 51+) es veu més lluny
  svg.setAttribute("viewBox", (tdb.portrait ? [900 - V[1] - V[3], V[0], V[3], V[2]] : V).join(" "));
  svg.innerHTML = "";
  const root = el("g", { id: "tdb-root" }, svg); // tot el combat (el portal de la sala el mostra amb un <use>)
  const bg = el("g", { id: "tdb-bg", transform: tdb.portrait ? "translate(900 0) rotate(90)" : "" }, root);
  bg.innerHTML = tdbBackground(tdb.world);
  // cristall
  const [cx, cy] = tdbS(...tdb.world.crystal);
  const crystal = el("g", { id: "tdb-crystal", transform: `translate(${cx} ${cy})` }, root);
  const forest = tdb.world.mode === "forestal";
  crystal.innerHTML = forest ? `<circle r="70" fill="#9ff07a" opacity="0.12"/><circle r="70" class="tdb-crystal-glow"/><g class="tdb-crystal-gem"><g transform="translate(0 8)">
    <path d="M0 -60 C30 -60 38 -20 36 6 C34 34 18 44 0 44 C-18 44 -34 34 -36 6 C-38 -20 -30 -60 0 -60 Z" fill="#1f6a3e" stroke="#9ff07a" stroke-width="5"/>
    <ellipse cx="-10" cy="-26" rx="8" ry="14" fill="#bff7a0" opacity="0.45"/></g></g>
    <text y="74" text-anchor="middle" font-size="26" font-weight="800" fill="#d8ffc0" id="tdb-lives-map"></text>` : `<circle r="70" fill="#4ad8ff" opacity="0.12"/><circle r="70" class="tdb-crystal-glow"/><g class="tdb-crystal-gem"><g transform="translate(0 11)">
    <path d="M0 -62 L30 -14 L0 40 L-30 -14 Z" fill="#0b2a3a" stroke="#7fe8ff" stroke-width="5" stroke-linejoin="round"/>
    <path d="M0 -62 L0 40 M-30 -14 H30" stroke="#bff4ff" stroke-width="2" opacity="0.8"/></g></g>
    <text y="74" text-anchor="middle" font-size="26" font-weight="800" fill="#bff4ff" id="tdb-lives-map"></text>`;
  // buits
  const slots = el("g", { id: "tdb-slots" }, root);
  tdb.world.slots.forEach(([x, y], i) => {
    const [sx, sy] = tdbS(x, y);
    const g = el("g", { class: "tdb-slot", "data-slot": i, transform: `translate(${sx} ${sy})` }, slots);
    g.innerHTML = `<ellipse rx="62" ry="22" cy="34" class="tdb-slot-ring"/><ellipse rx="44" ry="15" cy="34" class="tdb-slot-ring2"/>
      <circle r="70" fill="transparent" class="tdb-slot-hit"/>`;
  });
  el("g", { id: "tdb-range" }, root);
  const lines = el("g", { id: "tdb-lines" }, root); // línies de foc del Contrafoc (davall de tot)
  for (const l of tdb.lines) { l.el = null; tdbDrawLine(l, lines); }
  el("g", { id: "tdb-towers" }, root);
  el("g", { id: "tdb-enemies" }, root);
  el("g", { id: "tdb-proj" }, root);
  el("g", { id: "tdb-fx" }, root);
  // estudiant a la cantonada, amb els artefactes que porta
  const [stx, sty] = tdbS(...tdb.world.student);
  // torre arcana on està l'estudiant: plataforma rúnica i cos de pedra que es perd cap avall
  const perch = el("g", { class: "tdb-perch", transform: `translate(${stx} ${sty})` }, root);
  if (forest) { // al bosc, l'estudiant està dalt d'una soca tallada (anells de dalt i escorça)
    perch.innerHTML = `<defs><linearGradient id="tdb-stump-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a1a"/><stop offset="0.75" stop-color="#22180e"/><stop offset="1" stop-color="#22180e" stop-opacity="0"/></linearGradient></defs>
      <path d="M-62 58 V168 H62 V58 Z" fill="url(#tdb-stump-fade)"/>${[-40, -14, 12, 38].map(x => `<path d="M${x} 74 Q${x + 4} 110 ${x - 2} 160" stroke="#14100a" stroke-width="3" fill="none" opacity="0.7"/>`).join("")}
      <path d="M-62 58 Q-80 150 -96 160 M62 58 Q82 150 98 162" stroke="#3a2a1a" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.8"/>
      <ellipse cy="58" rx="64" ry="17" fill="#c9a26a" stroke="#6b4a24" stroke-width="3"/>
      ${[48, 34, 20, 8].map(r => `<ellipse cy="58" rx="${r}" ry="${r * 0.26}" fill="none" stroke="#8a6438" stroke-width="1.6"/>`).join("")}
      ${[-1, 1].map(sx => `<circle cx="${sx * 54}" cy="54" r="5" fill="#d8ff6a" opacity="0.9"/><circle cx="${sx * 54}" cy="54" r="12" fill="#d8ff6a" opacity="0.18"/>`).join("")}`;
  } else {
  const bricks = [0, 1, 2, 3].map(r => [0, 1, 2, 3].map(c => {
    const x = -54 + c * 27 + (r % 2 ? 13 : 0), y = 70 + r * 22;
    return `<path d="M${x} ${y} h24" stroke="#2a3150" stroke-width="2"/><path d="M${x + 25} ${y - 21} v20" stroke="#2a3150" stroke-width="2"/>`;
  }).join("")).join("");
  perch.innerHTML = `<defs><linearGradient id="tdb-perch-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2138"/><stop offset="0.75" stop-color="#121628"/><stop offset="1" stop-color="#121628" stop-opacity="0"/></linearGradient>
      <clipPath id="tdb-perch-clip"><rect x="-58" y="58" width="116" height="110"/></clipPath></defs>
    <rect x="-58" y="58" width="116" height="110" fill="url(#tdb-perch-fade)"/>
    <g clip-path="url(#tdb-perch-clip)" opacity="0.8">${bricks}</g>
    <path d="M-58 58 V168 M58 58 V168" stroke="#7d5cff" stroke-width="2" opacity="0.35"/>
    <ellipse cx="0" cy="58" rx="70" ry="17" fill="#232a48" stroke="#7d5cff" stroke-width="2.5"/>
    <ellipse cx="0" cy="58" rx="52" ry="11" fill="none" stroke="#b39dff" stroke-width="1.4" stroke-dasharray="4 6" opacity="0.8"/>
    ${[-1, 1].map(sx => `<circle cx="${sx * 60}" cy="54" r="5" fill="#ffc23f" opacity="0.9"/><circle cx="${sx * 60}" cy="54" r="11" fill="#ffc23f" opacity="0.18"/>`).join("")}`;
  }
  const st = el("g", { id: "tdb-student", transform: `translate(${stx} ${sty})` }, root);
  st.innerHTML = tdStudentSvg(td.equipped, `x="-76" y="-84" width="152" height="160"`) +
    `<title>Estudiant${td.equipped.length ? ": " + td.equipped.map(id => TD_ARTIFACTS[id].name).join(", ") : ""}</title>`;
  // tornar a pintar les criatures que ja hi havia (canvi d'orientació)
  for (const t of Object.values(tdb.towers)) tdbDrawTower(t);
  tdbAuraMarks(true); // en tornar a pintar el mapa (girar la pantalla), les arrels ja estan crescudes
}
const tdbWorldPaths = world => world.paths || [world.path];
function tdbBackground(world) {
  if (world.mode === "forestal") return tdbForestBackground(world);
  if (world.id === 2) return tdbLabBackground(world);
  const pts = world.path.map(p => p.join(",")).join(" ");
  // fons fosc amb paper quadriculat, fórmules que suren i el camí de runes
  let grid = "";
  // el paper quadriculat continua fora del mapa (pantalles més amples o més altes: sense bandes)
  for (let x = -1600; x <= 3200; x += 50) grid += `<line x1="${x}" y1="-900" x2="${x}" y2="1800"/>`;
  for (let y = -900; y <= 1800; y += 50) grid += `<line x1="-1600" y1="${y}" x2="3200" y2="${y}"/>`;
  const glyphs = [["∫", 180, 110], ["Σ", 640, 80], ["e^iπ + 1 = 0", 980, 60], ["∇", 1480, 360], ["det(A)", 520, 520], ["f(x)", 1360, 560],
    ["∞", 80, 330], ["λ", 1100, 380], ["{ }", 360, 820], ["if", 1480, 840], ["0110", 900, 470]];
  return `<rect x="-1600" y="-900" width="4800" height="2700" fill="#0b0e14"/>
    <radialGradient id="tdb-vig" gradientUnits="userSpaceOnUse" cx="800" cy="450" r="1150"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="0.85" stop-color="#000" stop-opacity="0.55"/></radialGradient>
    <g stroke="#1a2233" stroke-width="1">${grid}</g>
    <g class="tdb-glyphs" fill="#9d8bff" opacity="0.08" font-family="ui-monospace, Consolas, monospace" font-weight="800">${glyphs.map(([t, x, y], i) =>
      `<text x="${x}" y="${y}" font-size="${i % 3 ? 44 : 64}" style="animation-delay:${-i * 1.3}s">${t}</text>`).join("")}</g>
    <polyline points="${pts}" fill="none" stroke="#141a27" stroke-width="86" stroke-linejoin="round" stroke-linecap="round"/>
    <polyline points="${pts}" fill="none" stroke="#2b3a5c" stroke-width="86" stroke-linejoin="round" stroke-linecap="round" opacity="0.35" stroke-dasharray="2 10"/>
    <polyline points="${pts}" fill="none" stroke="#4a5f8f" stroke-width="3" stroke-linejoin="round" stroke-dasharray="14 18" class="tdb-flow"/>
    <rect x="-1600" y="-900" width="4800" height="2700" fill="url(#tdb-vig)" pointer-events="none"/>`;
}

// Laboratori de Circuits: una placa de circuit vista des de dalt (verd fosc), amb pistes de coure que giren en angle
// recte, forats amb soldadura, xips amb potes, resistències i LEDs que parpellegen. El camí és un bus ample de coure
// daurat amb les línies de dades que hi corren. Tot continua fora del mapa.
function tdbLabBackground(world) {
  const P = tdbWorldPaths(world), PP = P.map(tdbPath);
  const lines = (w, attrs) => P.map(p => `<polyline points="${p.map(q => q.join(",")).join(" ")}" fill="none" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${attrs}/>`).join("");
  const free = (x, y, m = 80) => PP.every(pa => { for (let d = 0; d <= pa.total; d += 20) { const [px, py] = pa.at(d); if (Math.hypot(px - x, py - y) < m) return false; } return true; })
    && world.slots.every(([sx, sy]) => Math.hypot(sx - x, sy - y) > m) && Math.hypot(world.student[0] - x, world.student[1] - y) > 130 && Math.hypot(world.crystal[0] - x, world.crystal[1] - y) > 120;
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // pistes: trossos en L que van d'un forat a un altre (també fora del mapa)
  let traces = "", pads = "";
  for (let i = 0; i < 90; i++) {
    const x = Math.round((-500 + rnd() * 2600) / 25) * 25, y = Math.round((-300 + rnd() * 1500) / 25) * 25;
    const dx = (rnd() < 0.5 ? -1 : 1) * (75 + Math.round(rnd() * 8) * 25), dy = (rnd() < 0.5 ? -1 : 1) * (50 + Math.round(rnd() * 6) * 25);
    traces += `<path d="M${x} ${y} H${x + dx} V${y + dy}${rnd() < 0.5 ? ` H${x + dx + (dx > 0 ? 50 : -50)}` : ""}"/>`;
    pads += `<circle cx="${x}" cy="${y}" r="7"/><circle cx="${x + dx}" cy="${y + dy}" r="7"/>`;
  }
  // components a llocs lliures: xips, resistències i LEDs
  const chip = (x, y, w, h) => `<g transform="translate(${x} ${y})"><rect x="${-w / 2 - 4}" y="${-h / 2 + 4}" width="${w + 8}" height="${h}" fill="#000" opacity="0.35"/>
    ${Array.from({ length: Math.floor(w / 16) }, (_, i) => { const px = -w / 2 + 10 + i * 16; return `<rect x="${px - 3}" y="${-h / 2 - 9}" width="6" height="10" fill="#c9c9c9"/><rect x="${px - 3}" y="${h / 2 - 1}" width="6" height="10" fill="#c9c9c9"/>`; }).join("")}
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="4" fill="#15171c" stroke="#2c3038" stroke-width="2"/><circle cx="${-w / 2 + 10}" cy="${-h / 2 + 10}" r="3.5" fill="#2c3038"/>
    <text y="6" text-anchor="middle" font-size="13" font-family="ui-monospace, Consolas, monospace" fill="#5a6270">${["μC", "ALU", "RAM", "CPU", "IO"][Math.floor(rnd() * 5)]}</text></g>`;
  const res = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-34 0 H34" stroke="#b8b8b8" stroke-width="3"/><rect x="-20" y="-8" width="40" height="16" rx="7" fill="#d8b98a"/>
    ${[-10, -3, 4, 12].map((xx, i) => `<rect x="${xx}" y="-8" width="3.5" height="16" fill="${["#8a4a1a", "#000", "#d43a2a", "#d8a83a"][i]}"/>`).join("")}</g>`;
  const led = (x, y, c, i) => `<g transform="translate(${x} ${y})"><circle r="14" fill="${c}" opacity="0.18" class="tdb-led" style="animation-delay:${(-i * 0.7).toFixed(1)}s"/><circle r="7" fill="${c}"/><circle cx="-2" cy="-2" r="2.4" fill="#fff" opacity="0.8"/></g>`;
  let comps = "";
  for (let i = 0, n = 0; i < 500 && n < 16; i++) {
    const x = Math.round(rnd() * 1600), y = Math.round(40 + rnd() * 820), kind = n % 4;
    if (!free(x, y, kind === 0 ? 120 : 80)) continue;
    comps += kind === 0 ? chip(x, y, 64 + Math.round(rnd() * 3) * 16, 40) : kind === 1 ? res(x, y, rnd() < 0.5 ? 0 : 90) : led(x, y, ["#ff4a5a", "#4aff8a", "#ffd84a", "#4ad8ff"][n % 4], n);
    n++;
  }
  return `<rect x="-1600" y="-900" width="4800" height="2700" fill="#0a1a12"/>
    <radialGradient id="tdb-vig" gradientUnits="userSpaceOnUse" cx="800" cy="450" r="1150"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="0.85" stop-color="#000" stop-opacity="0.55"/></radialGradient>
    <g stroke="#14382a" stroke-width="7" fill="none" stroke-linejoin="round">${traces}</g>
    <g stroke="#1f5a3e" stroke-width="2.5" fill="none" stroke-linejoin="round">${traces}</g>
    <g fill="#c9a24a" opacity="0.55">${pads}</g><g fill="#0a1a12">${pads.replace(/r="7"/g, 'r="3"')}</g>
    ${comps}
    ${lines(96, 'stroke="#061009" opacity="0.7"')}${lines(80, 'stroke="#7a5a1e"')}${lines(68, 'stroke="#b8862a"')}${lines(60, 'stroke="#d9a63a" opacity="0.35"')}
    ${lines(46, 'stroke="#8a6420" opacity="0.5"')}${lines(3, 'stroke="#fff2c0" stroke-dasharray="10 30" opacity="0.55" class="tdb-flow"')}
    <rect x="-1600" y="-900" width="4800" height="2700" fill="url(#tdb-vig)" pointer-events="none"/>`;
}

// Bosc de nit vist des de dalt: terra de molsa i fulles, capçades fosques a les vores (continuen fora del mapa), el sender
// de terra amb arrels que el creuen i pedretes, bolets i falgueres entre les lleixes de buits, i cucs de llum que suren.
function tdbForestBackground(world) {
  const pine = world.id === 102; // la Pineda: terra de pinassa, pinyes i capçades de pi
  const P = tdbWorldPaths(world), PP = P.map(tdbPath), lines = (w, attrs) => P.map(p => `<polyline points="${p.map(q => q.join(",")).join(" ")}" fill="none" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${attrs}/>`).join("");
  // lluny del camí i dels buits (per a no tapar res amb la decoració)
  const free = (x, y, m = 70) => PP.every(pa => { for (let d = 0; d <= pa.total; d += 20) { const [px, py] = pa.at(d); if (Math.hypot(px - x, py - y) < m) return false; } return true; })
    && world.slots.every(([sx, sy]) => Math.hypot(sx - x, sy - y) > m) && Math.hypot(world.student[0] - x, world.student[1] - y) > 120 && Math.hypot(world.crystal[0] - x, world.crystal[1] - y) > 110;
  let seed = pine ? 29 : 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // fulles i molsa escampades per tot (també fora del mapa)
  const leaves = Array.from({ length: 150 }, () => { const x = -700 + rnd() * 3000, y = -500 + rnd() * 1900, r = rnd() * 360, k = 0.6 + rnd() * 0.9;
    return pine ? `<path d="M-9 0 L9 0 M-7 3 L7 -3" stroke="${["#5a3a1a", "#6a4422", "#4a3016", "#7a5228"][Math.floor(rnd() * 4)]}" stroke-width="1.6" stroke-linecap="round" transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${r.toFixed(0)}) scale(${(k * 1.3).toFixed(2)})"/>`
      : `<path d="M-8 0 Q0 -6 8 0 Q0 6 -8 0 Z" fill="${["#2a3a1a", "#3a2a14", "#24321a", "#4a3418"][Math.floor(rnd() * 4)]}" transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${r.toFixed(0)}) scale(${k.toFixed(2)})"/>`; }).join("");
  const moss = Array.from({ length: 40 }, () => `<ellipse cx="${(-600 + rnd() * 2800).toFixed(0)}" cy="${(-400 + rnd() * 1700).toFixed(0)}" rx="${(60 + rnd() * 120).toFixed(0)}" ry="${(30 + rnd() * 60).toFixed(0)}" fill="#1c2a14" opacity="0.6"/>`).join("");
  // capçades dels arbres de les vores, vistes des de dalt (cercles de fulles amb llum de lluna per un costat)
  // pi vist des de dalt: estrella de branques amb agulles i el centre més clar
  const pineCrown = (x, y, r) => `<g transform="translate(${x} ${y})"><circle r="${r}" fill="#000" opacity="0.35" transform="translate(16 20)"/>
    ${Array.from({ length: 11 }, (_, i) => { const a = i / 11 * Math.PI * 2, L = r * (0.85 + (i % 3) * 0.08); return `<path d="M0 0 L${(Math.cos(a - 0.22) * L * 0.55).toFixed(0)} ${(Math.sin(a - 0.22) * L * 0.55).toFixed(0)} L${(Math.cos(a) * L).toFixed(0)} ${(Math.sin(a) * L).toFixed(0)} L${(Math.cos(a + 0.22) * L * 0.55).toFixed(0)} ${(Math.sin(a + 0.22) * L * 0.55).toFixed(0)} Z" fill="${i % 2 ? "#13261c" : "#183022"}"/>`; }).join("")}
    <circle r="${r * 0.35}" fill="#1f3a28"/><circle cx="${-r * 0.12}" cy="${-r * 0.12}" r="${r * 0.14}" fill="#2a4a30" opacity="0.8"/></g>`;
  const crown = pine ? pineCrown : (x, y, r) => `<g transform="translate(${x} ${y})"><circle r="${r + 14}" fill="#000" opacity="0.35" transform="translate(16 20)"/>
    ${[0, 1, 2, 3, 4, 5, 6].map(i => { const a = i / 7 * Math.PI * 2; return `<circle cx="${(Math.cos(a) * r * 0.55).toFixed(0)}" cy="${(Math.sin(a) * r * 0.55).toFixed(0)}" r="${(r * 0.55).toFixed(0)}" fill="#13241a"/>`; }).join("")}
    <circle r="${r * 0.7}" fill="#173020"/><circle cx="${-r * 0.3}" cy="${-r * 0.3}" r="${r * 0.35}" fill="#20402a" opacity="0.8"/></g>`;
  const crowns = [[-120, -40, 170], [260, -120, 120], [760, -150, 140], [1240, -130, 130], [1720, -40, 180], [1760, 360, 150], [-160, 420, 160], [-120, 980, 190],
    [520, 1010, 130], [960, 1040, 150], [1760, 1000, 200], [1700, 880, 90]].map(c => crown(...c)).join("");
  // arrels que creuen el sender
  const rootSpots = world.id === 101 ? [[200, 120, 260, 190], [820, 120, 900, 185], [1340, 260, 1260, 330], [700, 400, 640, 470], [1100, 400, 1180, 470], [420, 680, 360, 750], [1000, 680, 1080, 745]]
    : PP.flatMap(pa => [0.2, 0.42, 0.63, 0.82].map(f => { const d = pa.total * f, [x, y] = pa.at(d), [x2, y2] = pa.at(d + 2), a = Math.atan2(y2 - y, x2 - x) + Math.PI / 2;
      return [x - Math.cos(a) * 46, y - Math.sin(a) * 46, x + Math.cos(a) * 46 + 14, y + Math.sin(a) * 46 + 10].map(v => Math.round(v)); }));
  const roots = rootSpots
    .map(([x0, y0, x1, y1]) => `<path d="M${x0} ${y0} Q${(x0 + x1) / 2 + 30} ${(y0 + y1) / 2} ${x1} ${y1}" stroke="#3a2614" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M${x0} ${y0} Q${(x0 + x1) / 2 + 30} ${(y0 + y1) / 2} ${x1} ${y1}" stroke="#5a3e22" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.7"/>`).join("");
  const pebbles = Array.from({ length: 50 }, () => { const pa = PP[Math.floor(rnd() * PP.length)], d = rnd() * pa.total, [x, y] = pa.at(d);
    return `<ellipse cx="${(x + (rnd() - 0.5) * 60).toFixed(0)}" cy="${(y + (rnd() - 0.5) * 50).toFixed(0)}" rx="${(3 + rnd() * 5).toFixed(1)}" ry="${(2 + rnd() * 3).toFixed(1)}" fill="#5a4a38" opacity="0.8"/>`; }).join("");
  const shroom = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cy="4" rx="16" ry="5" fill="#000" opacity="0.3"/><path d="M-4 2 V-10 H4 V2 Z" fill="#e8dcc4"/><path d="M-14 -8 Q0 -26 14 -8 Z" fill="#a8321e"/><circle cx="-4" cy="-14" r="2" fill="#fff4e0"/><circle cx="5" cy="-12" r="1.6" fill="#fff4e0"/></g>`;
  const fern = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})" stroke="#3f6a2a" stroke-width="3" fill="none" stroke-linecap="round">${[-50, -20, 10, 40, 70].map(a => `<path d="M0 0 Q${(Math.cos((a - 90) * Math.PI / 180) * 20).toFixed(0)} ${(Math.sin((a - 90) * Math.PI / 180) * 20 - 6).toFixed(0)} ${(Math.cos((a - 90) * Math.PI / 180) * 40).toFixed(0)} ${(Math.sin((a - 90) * Math.PI / 180) * 34).toFixed(0)}"/>`).join("")}</g>`;
  const cone = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k}) rotate(${Math.round(rnd() * 360)})"><ellipse rx="9" ry="14" fill="#6a4422"/>${[-8, -2, 4].map(yy => `<path d="M-8 ${yy} Q0 ${yy + 5} 8 ${yy}" stroke="#3a2412" stroke-width="2" fill="none"/>`).join("")}</g>`;
  let deco = "";
  if (world.id === 101) deco = [shroom(560, 300), fern(870, 310, 0.9), shroom(1220, 300, 0.8), fern(300, 300), fern(380, 590), shroom(760, 585, 0.9), fern(1060, 590, 0.8), shroom(1380, 570), fern(560, 850), shroom(940, 860, 0.8), fern(1300, 850)].join("");
  else for (let i = 0, n = 0; i < 400 && n < 18; i++) { const x = rnd() * 1600, y = 40 + rnd() * 820; if (!free(x, y)) continue; n++;
    deco += pine ? (n % 3 ? cone(Math.round(x), Math.round(y), 0.8 + rnd() * 0.5) : fern(Math.round(x), Math.round(y), 0.8)) : (n % 2 ? shroom(Math.round(x), Math.round(y), 0.9) : fern(Math.round(x), Math.round(y), 0.9)); }
  const flies = Array.from({ length: 16 }, (_, i) => `<g class="tdb-ffly" style="animation-delay:${(-i * 1.7).toFixed(1)}s"><circle cx="${(rnd() * 1600).toFixed(0)}" cy="${(rnd() * 900).toFixed(0)}" r="9" fill="#d8ff6a" opacity="0.18"/><circle cx="0" cy="0" r="0"/></g>`)
    .join("").replace(/<circle cx="0" cy="0" r="0"\/>/g, "");
  return `<rect x="-1600" y="-900" width="4800" height="2700" fill="#0c140c"/>
    <radialGradient id="tdb-vig" gradientUnits="userSpaceOnUse" cx="800" cy="450" r="1150"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="0.85" stop-color="#000" stop-opacity="0.6"/></radialGradient>
    <radialGradient id="tdb-moon" gradientUnits="userSpaceOnUse" cx="1100" cy="250" r="900"><stop offset="0" stop-color="#9fd0ff" stop-opacity="0.08"/><stop offset="1" stop-color="#9fd0ff" stop-opacity="0"/></radialGradient>
    ${moss}<g>${leaves}</g>
    ${lines(100, 'stroke="#1a120a" opacity="0.6"')}${lines(84, `stroke="${pine ? "#4a3420" : "#3a2c1c"}"`)}${lines(56, `stroke="${pine ? "#5e4428" : "#4a3824"}" opacity="0.7"`)}
    ${lines(3, 'stroke="#6a5234" stroke-dasharray="4 26" opacity="0.6"')}
    ${pebbles}${roots}${deco}${crowns}
    <rect x="-1600" y="-900" width="4800" height="2700" fill="url(#tdb-moon)" pointer-events="none"/>
    <g class="tdb-fflies">${flies}</g>
    <rect x="-1600" y="-900" width="4800" height="2700" fill="url(#tdb-vig)" pointer-events="none"/>`;
}

// ---------------------------------------------------------------- criatures (torres)
const TDB_TOWER_Y = -77; // el cercle rúnic de la criatura (y 108 del dibuix) cau damunt de l'anell de la plataforma (y 34)
function tdbDrawTower(t) {
  t.el?.remove();
  const [x, y] = tdbS(...tdb.world.slots[t.slot]);
  t.el = el("g", { class: `tdb-tower rar-${TD_DEFENDERS[t.id].rar}`, "data-slot": t.slot, transform: `translate(${x} ${y})` }, $("tdb-towers"));
  t.el.innerHTML = tdCreatureSvg(t.id).replace("<svg ", `<svg x="-62" y="${TDB_TOWER_Y}" width="124" height="124" `) +
    `<text class="tdb-tower-lvl" y="62" text-anchor="middle">${"◆".repeat(t.up + 1)}</text><text class="tdb-zz" x="30" y="-70" opacity="0">Zz</text>`;
  t.svg = t.el.querySelector(".tdc");
  t.svg.style.setProperty("--regrow", `${tdRegrowTime(t.id)}s`);
  if (t.charge) t.svg.style.setProperty("--q", (t.charge / TD_DEFENDERS[t.id].charge.max).toFixed(3));
  for (const part of ["l", "r"]) if (t.parts?.[part]?.out) t.svg.classList.add(`thrown-${part}`);
}
// Punt del mapa d'on ix la peça que llança la criatura (l / r / c), a partir del dibuix (viewBox -6 -10 132 132 en 124 px)
function tdbThrowFrom(t, side) {
  const part = side === "c" ? null : t.svg?.querySelector(side === "r" ? ".ar" : ".al");
  const r = part?.getBoundingClientRect();
  if (r && r.width > 1) {
    const ctm = $("tdb-svg").getScreenCTM();
    if (ctm) {
      const p = new DOMPoint(r.x + r.width / 2, r.y + r.height / 2).matrixTransform(ctm.inverse());
      return tdbM(p.x, p.y);
    }
  }
  const th = TD_ART[t.id].throw || {};
  const [ax, ay] = th[side] || th.l || th.c || [60, 60];
  const [sx, sy] = tdbS(...tdb.world.slots[t.slot]);
  const k = 124 / 132;
  return tdbM(sx - 62 + (ax + 6) * k, sy + TDB_TOWER_Y + (ay + 10) * k);
}
function tdbPlace(slot, id) {
  const cost = TD_DEFENDERS[id].cost;
  if (tdb.towers[slot] || tdb.mana < cost) return false;
  tdb.mana -= cost;
  const t = { uid: ++tdb.uid, slot, id, up: 0, cd: 0.3, shots: 0, stacks: 0, sleepT: 0, side: 0, spent: cost, burst: 0 };
  t.stats = tdStats(id, 0);
  tdb.towers[slot] = t;
  tdbDrawTower(t);
  if (!tdb.demo) tdbSummonFromStudent(t); // a la demostració del grimori ja hi són des del principi
  tdbAuraMarks();
  if (TD_DEFENDERS[id].role === "line") tdbPlaceLine(t);
  return true;
}
// Les criatures ja posades es posen al dia quan canvia alguna cosa de fora (nivell, estrelles, artefactes): es crida en guardar
function tdbRefreshStats() {
  if (!tdb?.towers || tdb.demo) return;
  for (const t of Object.values(tdb.towers)) t.stats = tdStats(t.id, t.up); // el dibuix no canvia: només dany, ritme, abast…
}
const tdbUpCost = t => t.up >= 2 ? null : Math.round(TD_DEFENDERS[t.id].cost * TD_BATTLE.upgradeCost[t.up]);
function tdbUpgrade(t) {
  const cost = tdbUpCost(t);
  if (cost == null || tdb.mana < cost) return;
  tdb.mana -= cost;
  t.spent += cost;
  t.up++;
  t.stats = tdStats(t.id, t.up);
  tdbDrawTower(t);
  tdbAuraMarks();
  tdbFx("summon", ...tdbS(...tdb.world.slots[t.slot]), "#ffe27a");
}
function tdbSell(t) {
  tdb.mana += Math.round(t.spent * TD_BATTLE.sellBack);
  t.el.remove();
  t.aimEl?.remove();
  delete tdb.towers[t.slot];
  if (t.lines) { t.lines.forEach(l => l.el?.remove()); tdb.lines = tdb.lines.filter(l => !t.lines.includes(l)); }
  tdbAuraMarks();
}

// ---------------------------------------------------------------- distraccions
function tdbSpawn(type, dist = 0, small = false, P = null, kind = "") {
  let def = tdEnemy(type);
  // gegant (cada 10 onades): la mateixa distracció, més gran, amb molta més vida i el seu truc; a la 100, els caps encara més grans
  if (kind === "giant") { const G = TD_IDLE.giant; def = { ...def, size: def.size * G.size, hp: def.hp * G.hp, lives: G.lives, saber: def.saber * G.saber, giant: true, name: `${def.name} gegant` }; }
  if (kind === "big") { const G = TD_IDLE.bigBoss; def = { ...def, size: def.size * G.size, hp: def.hp * G.hp }; }
  // camí: el que se li diu (les que naixen d'una altra van pel mateix) o, si n'hi ha diversos, un per torns
  P ||= tdb.paths[(tdb.pathTurn = ((tdb.pathTurn ?? -1) + 1) % tdb.paths.length)];
  const hp = def.hp * TD_DIFFICULTY.hp * (tdb.world.hp || 1) * (tdb.idle ? tdIdleHp(tdb.wave, def.boss) : 1 + TD_WAVE_HP * (def.boss ? 0.5 : 1) * (tdb.wave - 1)); // els caps ja són durs: pugen la meitat per onada
  const e = { uid: ++tdb.uid, type, def, P, hp, maxHp: hp, dist, slowT: 0, slowMult: 1, stunT: 0, vuln: 0, vulnT: 0,
    dotT: 0, dot: 0, abilityT: 0, convertT: 0, size: def.size };
  e.el = el("g", { class: `tdb-enemy${def.boss || def.giant ? " boss" : ""}${def.giant ? " giant" : ""}` }, $("tdb-enemies"));
  const s = def.size;
  e.el.innerHTML = tdEnemySvg(def.art || type).replace("<svg ", `<svg x="${-s / 2}" y="${-s * 0.96}" width="${s}" height="${s}" `) +
    `<g class="tdb-hp" transform="translate(0 ${-s - 10})"><rect x="-26" y="-4" width="52" height="7" rx="3" fill="#000" opacity="0.6"/><rect class="tdb-hp-bar" x="-25" y="-3" width="50" height="5" rx="2.5" fill="#ff5a4a"/></g>`;
  e.hpBar = e.el.querySelector(".tdb-hp-bar");
  tdb.enemies.push(e);
  if (!td.seen.includes(type) && !def.hidden) td.seen.push(type);
  if ((def.boss || def.giant) && !tdb.bossesSeen.has(`${type}${kind}${tdb.wave}`)) { tdb.bossesSeen.add(`${type}${kind}${tdb.wave}`); if (!$("td-battle").hidden) toast(`⚠️ ${def.giant ? "Gegant" : "Cap"}: ${def.name}`, "bad"); }
  return e;
}
// Camí de cada distracció (tdb.path: el primer, per a les coses que no depenen d'una distracció)
const tdbP = e => e?.P || tdb.paths[0];
// Posició al camí; si està enganxat a l'ham, ix del camí cap a la canya a mesura que es recull el fil
const tdbPos = e => {
  if (!e.hooked) return tdbP(e).at(e.dist);
  const h = e.hooked, k = 1 - Math.max(0, h.left) / h.total, q = k * k * (3 - 2 * k); // suau al principi i al final
  return [h.from[0] + (h.to[0] - h.from[0]) * q, h.from[1] + (h.to[1] - h.from[1]) * q];
};
const tdbVisible = e => !(e.def.stealth && e.dist < e.def.stealth * tdbP(e).total && !(e.revealT > 0)) && !e.convertT && e.hp > 0; // l'escaneig del dron les fa visibles

// src: la criatura que pega (o directament l'element). L'element decidix el multiplicador (feble ×2, forta ×0,3) i
// el color del número; si és feble, el número ix gran, i si és forta, menut i apagat. Sense element (null): dany pur.
const tdbElOf = src => typeof src === "string" ? src : src ? TD_DEFENDERS[src.id]?.el : null;
function tdbDamage(e, amount, src = null, big = false, tick = 0) { // tick: segons d'un dany continu
  if (e.hp <= 0) return;
  const elem = tdbElOf(src), k = tdElemMult(e.def, elem), color = TD_ELEMENTS[elem]?.color || "#fff";
  amount *= (1 + e.vuln) * (1 + (e.mark || 0)) * k;
  e.hp -= amount;
  const [x, y] = tdbS(...tdbPos(e)), cls = k > 1 ? "weak" : k < 1 ? "strong" : "";
  if (tick) { // dany continu (verí, foc): el número es mostra junt cada mig segon, no a cada fotograma
    e.tickAcc = (e.tickAcc || 0) + amount;
    if ((e.tickT = (e.tickT || 0) + tick) >= 0.5 || e.hp <= 0) { tdbNumber(x, y - e.size, Math.round(e.tickAcc), color, false, cls); e.tickAcc = 0; e.tickT = 0; }
  } else tdbNumber(x, y - e.size, Math.round(amount), color, big || k > 1, cls);
  if (e.hp <= 0) tdbKill(e);
}
// La criatura ix del llibre de l'estudiant, vola fent un arc i creix fins al buit
const TDB_FLY = 520; // ms
function tdbSummonFromStudent(t) {
  const color = TD_RARITIES[TD_DEFENDERS[t.id].rar].color;
  const [x0, y0] = tdbS(...tdb.world.student), [x1, y1] = tdbS(...tdb.world.slots[t.slot]);
  const bx = x0 + 8, by = y0 + 24; // el llibre obert
  const mx = (bx + x1) / 2, my = Math.min(by, y1) - 160;
  const st = $("tdb-student");
  st.classList.remove("cast"); void st.getBBox(); st.classList.add("cast");
  setTimeout(() => st.classList.remove("cast"), 500);
  tdbFx("summon", bx, by - 30, color);
  t.cd += TDB_FLY / 1000;
  t.el.animate([
    { transform: `translate(${bx}px, ${by}px) scale(0.15)`, opacity: 0.4 },
    { transform: `translate(${mx}px, ${my}px) scale(0.55)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${x1}px, ${y1}px) scale(1)`, opacity: 1 },
  ], { duration: TDB_FLY, easing: "ease-in-out" });
  // estela de llum darrere
  const trail = el("path", { d: `M${bx} ${by} Q${2 * mx - (bx + x1) / 2} ${2 * my - (by + y1) / 2} ${x1} ${y1}`, class: "tdb-trail", stroke: color, style: `color:${color}`, pathLength: 1 }, $("tdb-fx"));
  setTimeout(() => trail.remove(), TDB_FLY + 300);
  setTimeout(() => tdb && tdbFx("summon", x1, y1, color), TDB_FLY);
}
// L'ànima de l'enemic vola fins al cristall, que s'il·lumina en rebre-la
function tdbSoul(e) {
  const fx = $("tdb-fx");
  if (fx.querySelectorAll(".tdb-soul").length > 24) return;
  const [x0, y0] = tdbS(...tdbPos(e)), [x1, y1] = tdbS(...tdb.world.crystal);
  const c = TD_ENEMY_GLOW[e.def.art || e.type] || "#aab3c0";
  const g = el("g", { class: "tdb-soul" }, fx);
  g.innerHTML = `<circle r="${e.def.boss ? 16 : 9}" fill="${c}" opacity="0.35"/><circle r="${e.def.boss ? 8 : 4.5}" fill="#fff"/>`;
  const sy = y0 - e.size * 0.45, mx = (x0 + x1) / 2 + (Math.random() - 0.5) * 120, my = Math.min(sy, y1) - 120 - Math.random() * 80;
  const dur = 650 + Math.hypot(x1 - x0, y1 - y0) * 0.35;
  const a = g.animate([
    { transform: `translate(${x0}px, ${sy}px) scale(0.3)` },
    { transform: `translate(${x0}px, ${sy - 30}px) scale(1)`, offset: 0.15 },
    { transform: `translate(${mx}px, ${my}px) scale(1)`, offset: 0.55 },
    { transform: `translate(${x1}px, ${y1 - 10}px) scale(0.6)` },
  ], { duration: dur, easing: "ease-in", delay: 250, fill: "backwards" });
  a.onfinish = () => {
    g.remove();
    const cr = $("tdb-crystal");
    if (!cr) return;
    cr.style.setProperty("--soul", c);
    cr.classList.remove("feed"); void cr.getBBox(); cr.classList.add("feed");
  };
}
function tdbKill(e, byTower) {
  e.hp = 0;
  tdbDissolve(e);
  tdbSoul(e);
  tdb.kills++;
  // als mons de 100 onades les distraccions no donen maná (es guanya en passar l'onada); el de les criatures, sí
  tdb.mana += (tdb.idle ? 0 : e.def.mana) + (byTower ? TD_DEFENDERS[byTower.id].manaOnKill || 0 : 0);
  tdb.saber += e.def.saber * TD_DIFFICULTY.saber * (1 + 0.1 * td.upgrades.saber + tdArtBonus("saber")) * (tdb.idle && tdb.wave > TD_IDLE.extAt ? TD_IDLE.lateSaber : 1);
  if (e.def.splitInto) for (const off of [-18, 18]) tdbSpawn(e.def.splitInto, Math.max(0, e.dist + off), false, tdbP(e));
  if (e.mark) tdbMarkJump(e);
  if (e.def.boss) tdbBossDown(e.type);
}
// Un cap derrotat dona el seu artefacte (o el puja de nivell si ja el tens)
function tdbBossDown(type) {
  const id = Object.keys(TD_ARTIFACTS).find(k => TD_ARTIFACTS[k].boss === type && (TD_ARTIFACTS[k].world || 1) === (tdb.world.base || tdb.world).id);
  if (!id) return;
  const had = td.artifacts[id] || 0;
  if (had >= 5) return;
  td.artifacts[id] = had + 1;
  if (!had && !td.equipped.some(o => tdArtSlot(o) === tdArtSlot(id))) td.equipped.push(id); // si el seu espai està lliure
  tdb.artifactsWon.push(id);
  tdSave();
  $("tdb-student")?.classList.add("cheer");
  setTimeout(() => $("tdb-student")?.classList.remove("cheer"), 1200);
  toast(`${TD_ARTIFACTS[id].icon} ${had ? `${TD_ARTIFACTS[id].name} puja al nivell ${had + 1}` : `Artefacte nou: ${TD_ARTIFACTS[id].name}`}`, "good");
}

// ---------------------------------------------------------------- atacs
// On és una criatura: al seu buit, o (el dron) on vola
const tdbTPos = t => t.fx != null ? [t.fx, t.fy] : tdb.world.slots[t.slot];
function tdbTargets(t, n = 1, mode = "first") {
  const [tx, ty] = tdbTPos(t);
  const inRange = tdb.enemies.filter(e => tdbVisible(e) && Math.hypot(...tdbPos(e).map((v, i) => v - [tx, ty][i])) <= t.stats.range);
  if (mode === "smart") {
    const strong = inRange.filter(e => e.def.boss || e.maxHp >= 100);
    inRange.sort(strong.length ? (a, b) => b.hp - a.hp : (a, b) => b.def.speed - a.def.speed);
  } else if (mode === "strong") inRange.sort((a, b) => (!!a.mark - !!b.mark) || b.hp - a.hp); // el més fort sense anella
  else inRange.sort((a, b) => b.dist - a.dist); // el que està més a prop del cristall
  return inRange.slice(0, n);
}
// Habilitats que canvien el tir següent (la llança escalada, la llavor que arrela, la sobrecàrrega, la mel, el gran
// bramit): tdbSpecial ho apunta a t.boostShot i el tir d'eixe mateix atac ho porta (p.sp)
const TD_SHOT_SPECIALS = ["scale", "sprout", "overload", "honey", "roar"];
function tdbFire(t) {
  const r = tdbFire0(t);
  t.boostShot = null;
  return r;
}
function tdbFire0(t) {
  const d = TD_DEFENDERS[t.id], ab = t.stats.ability;
  const n = d.role === "multi" ? d.targets + (ab > 1 ? 1 : 0) : d.role === "swarm" ? 2 : 1;
  const targets = tdbTargets(t, n, d.role === "smart" ? "smart" : d.role === "mark" ? "strong" : "first");
  if (!targets.length) return false;
  const nextSide = d.alt ? 1 - t.side : 0, th = TD_ART[t.id].throw || {};
  if (d.role === "swarm" && !(tdbPartReady(t, "l") && tdbPartReady(t, "r"))) { // les abelles encara no han tornat
    for (const k of ["l", "r"]) if (t.parts?.[k]?.out) tdbPartGrow(t, k);
    return false;
  }
  if (!th.c && !tdbPartReady(t, nextSide ? "r" : "l")) { // la peça encara no ha tornat a créixer: espera
    const P = t.parts[nextSide ? "r" : "l"];
    if (P.out) tdbPartGrow(t, nextSide ? "r" : "l");
    return false;
  }
  t.shots++;
  // animació: la peça que llança (alterna esquerra / dreta si en té dues)
  t.side = nextSide;
  t.svg.classList.remove("fire");
  void t.svg.getBoundingClientRect();
  t.svg.classList.add("fire");
  // especial cada N atacs
  if (d.special && t.shots % d.special.every === 0) tdbSpecial(t, targets[0]);
  if (d.role === "stacks") {
    t.stacks++;
    if (t.stacks >= d.stacks) { t.stacks = 0; tdbBlast(t); }
  }
  const part = (TD_ART[t.id].throw || {}).c ? "c" : t.side ? "r" : "l";
  if (d.role === "pulse") { tdbPulse(t); return true; }
  if (d.pulseEvery && t.shots % d.pulseEvery === 0) tdbPulse(t); // el Pi Mare: un anell del tronc, a més de la pinya
  if (d.role === "line") return true; // ja crema sempre; el tir només fa l'animació d'abocar
  if (d.role === "clock") { tdbClock(t); return true; }
  if (d.role === "bellow") { tdbBellow(t, t.boostShot === "roar"); return true; }
  if (d.role === "swarm") { // una abella a cada objectiu (si només n'hi ha un, les dues hi van)
    tdbProjectile(t, targets[0], t.stats.dmg, { part: "l" });
    tdbProjectile(t, targets[1] || targets[0], t.stats.dmg, { part: "r", sp: null }); // la mel la porta només una
    return true;
  }
  if (d.role === "hook") { // l'ham ix amb el fil lligat a la punta de la canya
    tdbProjectile(t, targets[0], t.stats.dmg, { part: "l" });
    (tdb.hooks ||= []).push({ t, p: tdb.projs[tdb.projs.length - 1], e: null });
    return true;
  }
  if (d.aim) { // la fletxa es posa dins de la V (o l'agulla gira), s'encara a l'objectiu i dispara
    tdbAim(t, targets[0], part === "r");
    t.svg.classList.add("load");
    t.pending = { target: targets[0], wait: d.aimWait || 0.26, part, sp: t.boostShot };
    return true;
  }
  const shoot = target => tdbProjectile(t, target, t.stats.dmg, { part, depth: d.depth || 0, bounces: d.role === "bounce" ? d.bounces + (ab > 1 ? 1 : 0) : 0 });
  if (d.role === "burst") { t.burst = d.burst - 1; t.burstT = 0.12; t.burstTarget = targets[0]; shoot(targets[0]); }
  else targets.forEach(shoot);
  return true;
}
function tdbAim(t, target, flip = false) { // flip: la peça que dispara mira avall (la meitat blanca de l'agulla)
  const aim = t.svg?.querySelector(".aim");
  if (!aim) return;
  const [sx, sy] = tdbS(...tdb.world.slots[t.slot]), [ex, ey] = tdbS(...tdbPos(target));
  let a = Math.atan2(ey - (sy - 30), ex - sx) * 180 / Math.PI + 90 + (flip ? 180 : 0); // la fletxa mira cap amunt
  const prev = t.aimA ?? 0;
  a = prev + ((a - prev + 540) % 360 - 180); // el camí curt
  t.aimA = a;
  aim.style.transform = `rotate(${a}deg)`;
}
function tdbProjectile(t, target, dmg, opts = {}) {
  const d = TD_DEFENDERS[t.id];
  const [sx, sy] = opts.from || tdbThrowFrom(t, opts.part || "l");
  // la peça que es llança desapareix de la criatura mentre vola (es torna a formar en arribar)
  if (!opts.from && opts.part && opts.part !== "c") tdbPartOut(t, opts.part);
  const p = { t, d, target, dmg, x: sx, y: sy, hit: new Set(), traveled: 0, ...opts };
  if (p.sp === undefined) p.sp = opts.from ? null : t.boostShot || null;
  if (p.sp === "scale") p.dmg *= d.special.mult; // la llança escalada
  if (d.role === "pierce") { // la llança va recta en la direcció de l'objectiu i travessa
    const [ex, ey] = tdbPos(target);
    const len = Math.hypot(ex - sx, ey - sy) || 1;
    p.dir = [(ex - sx) / len, (ey - sy) / len];
  }
  p.el = el("g", { class: `tdb-proj pj-${t.id}` }, $("tdb-proj"));
  const art = TD_ART[t.id];
  p.scale = (art.projScale || 1.25) * (p.sp === "scale" ? 2 : p.sp ? 1.35 : 1);
  if (p.sp) p.el.classList.add("sp-" + p.sp); // es veu que el tir porta l'habilitat
  p.el.innerHTML = `<g class="tdb-proj-in">${opts.part === "r" && art.projR ? art.projR : art.proj}</g>`;
  tdb.projs.push(p);
}
function tdbHit(p, e) {
  const d = p.d, ab = p.t.stats.ability;
  let dmg = p.dmg * tdbAuraMult(p.t), color = TD_GLOW[d.subj] || "#fff", big = false;
  if (d.role === "capacitor") { tdbDischarge(p.t, e, dmg); return; }
  if (p.sp === "sprout" || p.sp === "honey") tdbZone(p.t, p.sp, tdbPos(e));
  if (d.role === "swarm") { // verí: fa mal uns segons (no s'acumula: es renova)
    e.dot = Math.max(e.dotT > 0 ? e.dot : 0, d.poison.dps * ab * tdbAuraMult(p.t)); e.dotT = Math.max(e.dotT, d.poison.dur); e.poison = true; e.dotEl = d.el;
  }
  if (d.role === "hook") { // l'ham enganxa: tarda a recollir el fil (l'arrossega a poc a poc) i al final la pesca
    const reel = d.hook.reel / ab, [sx, sy] = tdb.world.slots[p.t.slot];
    e.hooked = { t: p.t, left: reel, total: reel, from: tdbPos(e), to: [sx + 18, sy + 22] }; // fins als peus de la canya
    e.el?.classList.add("hooked"); // forceja poquet (sense tremolar)
    const h = tdb.hooks?.find(h => h.p === p);
    if (h) h.e = e;
    return;
  }
  if (d.role === "mark") tdbMark(e, d.mark * p.t.stats.ability);
  if (d.role === "crit" && Math.random() < d.crit) { dmg *= 2; color = "#ff8a1f"; big = true; }
  if (d.role === "scaling") dmg *= 1 + Math.min(d.maxScale, tdb.kills * d.perKill);
  if (d.role === "aoe") {
    const [x, y] = tdbPos(e);
    tdbFx("ring", ...tdbS(x, y), color, d.aoe * ab);
    for (const o of tdb.enemies) if (o.hp > 0 && !o.convertT && Math.hypot(...tdbPos(o).map((v, i) => v - [x, y][i])) <= d.aoe * ab) {
      if (d.slow) tdbSlow(o, d.slow, d.slowDur * ab);
      tdbDamage(o, dmg, p.t);
    }
    return;
  }
  if (d.role === "slow") { tdbSlow(e, d.slow, d.slowDur * ab); if (d.band) tdbBand(e, d.band[p.part === "r" ? "r" : "l"]); }
  if (d.role === "bounce" && d.slow) { tdbSlow(e, d.slow, d.slowDur * ab); e.el?.classList.add("tangled"); setTimeout(() => e.el?.classList.remove("tangled"), d.slowDur * 1000); } // enredada en un fideu
  if (d.role === "vuln") { e.vuln = Math.max(e.vuln, d.vuln); e.vulnT = d.vulnDur * ab; }
  if (d.role === "lasso") { e.stunT = Math.max(e.stunT, d.stun * ab); e.dot = d.dot; e.dotT = d.stun * ab; e.dotEl = d.el; }
  const willDie = e.hp - dmg * (1 + e.vuln) <= 0;
  if (d.role === "execute" && !willDie && (e.hp - dmg * (1 + e.vuln)) / e.maxHp < d.execute * ab) {
    tdbNumber(...tdbS(...tdbPos(e)).map((v, i) => v - (i ? e.size : 0)), "det = 0", TD_GLOW.gold, true);
    tdbKill(e, p.t);
    return;
  }
  tdbDamage(e, dmg, p.t, big);
  // rebot: el raig salta a l'enemic més pròxim que encara no ha tocat
  if (p.bounces > 0) {
    const [x, y] = tdbPos(e);
    const near = tdb.enemies.filter(o => tdbVisible(o) && o !== e && !p.hit.has(o.uid))
      .map(o => [o, Math.hypot(...tdbPos(o).map((v, i) => v - [x, y][i]))]).filter(([, dd]) => dd < (d.random ? 280 : 180)).sort((a, b) => a[1] - b[1]);
    const next = d.random ? near[Math.floor(Math.random() * near.length)] : near[0]; // el spaghetti: a qualsevol (a l'atzar)
    if (next) { p.hit.add(e.uid); tdbProjectile(p.t, next[0], dmg * 0.85, { from: [x, y], bounces: p.bounces - 1, hit: p.hit, part: p.part }); }
  }
  // recursió: es dividix en dos projectils més menuts
  if (d.role === "split" && p.depth > 0) {
    const [x, y] = tdbPos(e);
    tdb.enemies.filter(o => tdbVisible(o) && o !== e).map(o => [o, Math.hypot(...tdbPos(o).map((v, i) => v - [x, y][i]))])
      .filter(([, dd]) => dd < 220).sort((a, b) => a[1] - b[1]).slice(0, d.splits)
      .forEach(([o]) => { tdbBolt(tdbS(x, y - e.size * 0.45), tdbS(...tdbPos(o)).map((v, i) => v - (i ? o.size * 0.45 : 0)), TD_GLOW.prg); tdbProjectile(p.t, o, dmg * 0.6, { from: [x, y], depth: p.depth - 1 }); });
  }
  if (d.role === "chain") tdbChain(p.t, e, dmg, p.sp === "overload");
}
// ---- màquina
// Bobina de Tesla: el raig salta de la distracció tocada a la més pròxima (sense repetir), perdent força a cada salt.
// Els salts van en temps de joc (tdb.chains), un cada 0,09 s. Cada enllaç és un llamp viu que espurneja i segueix les
// dues distraccions mentre dura (TD_CHAIN_ARC s), i a cada distracció tocada li queda una espurna.
const TD_CHAIN_ARC = 0.55, TD_OVER_COLOR = "#a64dff"; // la sobrecàrrega, de color violeta
function tdbChain(t, first, dmg, over = false) {
  const d = TD_DEFENDERS[t.id], c = d.chain, S = d.special;
  const g = el("g", { class: `tdb-chain${over ? " over" : ""}` }, $("tdb-fx"));
  // sobrecàrrega: més salts, sense perdre força, i cada tocada queda parada un moment
  if (over) { first.stunT = Math.max(first.stunT, S.stun); tdbNumber(...tdbS(...tdbPos(first)).map((v, i) => v - (i ? first.size : 0)), "⚡ sobrecàrrega", TD_OVER_COLOR, true); }
  const tick = d.tick && t.shots % d.tick === 0; // el processador: cada 4 tics del rellotge, el raig salta el doble
  if (tick) { g.classList.add("tick"); t.svg?.classList.remove("tick"); void t.svg?.getBoundingClientRect(); t.svg?.classList.add("tick"); const sv = t.svg; setTimeout(() => sv?.classList.remove("tick"), 450); }
  (tdb.chains ||= []).push({ t, cur: first, hit: new Set([first]), k: 0, jumps: ((over ? S.jumps : c.jumps) + (t.stats.ability > 1 ? 1 : 0)) * (tick ? 2 : 1), dmg, big: over,
    falloff: over ? 1 : c.falloff, wait: 0.06, links: [], zaps: [{ e: first, life: TD_CHAIN_ARC, p: tdbPos(first) }], g, flick: 0 });
}
function tdbChains(dt) {
  for (const ch of tdb.chains) {
    if (!ch.done && (ch.wait -= dt) <= 0) {
      const c = TD_DEFENDERS[ch.t.id].chain, [x, y] = tdbPos(ch.cur);
      const next = ch.k < ch.jumps && tdb.enemies.filter(o => tdbVisible(o) && !ch.hit.has(o))
        .map(o => [o, Math.hypot(...tdbPos(o).map((v, i) => v - [x, y][i]))]).filter(([, dd]) => dd < c.radius * (ch.big ? 1.4 : 1)).sort((a, b) => a[1] - b[1])[0]?.[0];
      if (!next) ch.done = true;
      else {
        ch.k++;
        ch.hit.add(next);
        ch.links.push({ a: ch.cur, b: next, life: TD_CHAIN_ARC, pa: tdbPos(ch.cur), pb: tdbPos(next) });
        tdbDamage(next, ch.dmg * ch.falloff ** ch.k, ch.t, ch.big);
        if (ch.big) next.stunT = Math.max(next.stunT, TD_DEFENDERS.tesla.special.stun);
        ch.zaps.push({ e: next, life: TD_CHAIN_ARC, p: tdbPos(next) });
        ch.cur = next;
        ch.wait = 0.09;
      }
    }
    for (const l of [...ch.links, ...ch.zaps]) l.life -= dt;
    ch.links = ch.links.filter(l => l.life > 0);
    ch.zaps = ch.zaps.filter(z => z.life > 0);
    if ((ch.flick -= dt) <= 0) { ch.flick = 0.05; tdbChainDraw(ch); } // el llamp canvia de forma (espurneja)
    if (ch.done && !ch.links.length && !ch.zaps.length) { ch.g.remove(); ch.over = true; }
  }
  tdb.chains = tdb.chains.filter(ch => !ch.over);
}
// Punt de cada enllaç: el centre de la distracció (si ja ha caigut, on era)
function tdbChainEnd(e, keep) {
  if (e.hp > 0) keep.splice(0, 2, ...tdbPos(e));
  return tdbS(keep[0], keep[1] - e.size * 0.45);
}
function tdbChainDraw(ch) {
  ch.g.innerHTML = ch.links.map(l => {
    const [x0, y0] = tdbChainEnd(l.a, l.pa), [x1, y1] = tdbChainEnd(l.b, l.pb), k = l.life / TD_CHAIN_ARC;
    const L = Math.hypot(x1 - x0, y1 - y0), main = tdbZig(x0, y0, x1, y1, Math.max(3, Math.round(L / 14)), Math.min(30, L * 0.3)),
      fork = tdbZig(...tdbForkFrom(x0, y0, x1, y1, Math.min(26, L * 0.5)), 3, 10);
    const w = ch.big ? 1.9 : 1, C = ch.big ? [TD_OVER_COLOR, "#d9a8ff", "#c07aff"] : [TD_GLOW.maq, "#e8fbff", "#b8f0ff"]; // la sobrecàrrega, més gros i violeta
    return `<g opacity="${Math.min(1, k * 1.8).toFixed(2)}"><polyline points="${main}" fill="none" stroke="${C[0]}" stroke-width="${9 * w}" opacity="0.3" stroke-linejoin="round"/>
      <polyline points="${main}" fill="none" stroke="${C[1]}" stroke-width="${2.6 * w}" stroke-linejoin="round"/><polyline points="${fork}" fill="none" stroke="${C[2]}" stroke-width="1.4" stroke-linejoin="round"/></g>`;
  }).join("") + ch.zaps.map(z => { // espurna damunt de cada distracció tocada, que la seguix
    const [x, y] = tdbChainEnd(z.e, z.p), k = z.life / TD_CHAIN_ARC, r = (z.e.size * 0.36).toFixed(0);
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" opacity="${Math.min(1, k * 1.6).toFixed(2)}"><circle r="${r}" fill="${ch.big ? TD_OVER_COLOR : TD_GLOW.maq}" opacity="${ch.big ? 0.35 : 0.22}"/>
      <polyline points="${tdbZig(-r * 0.7, -r * 0.8, r * 0.6, r * 0.8, 3, 8)}" fill="none" stroke="${ch.big ? "#d9a8ff" : "#e8fbff"}" stroke-width="1.8"/></g>`;
  }).join("");
}
function tdbZig(x0, y0, x1, y1, n, amp) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  return Array.from({ length: n + 1 }, (_, i) => { const t = i / n, j = i && i < n ? (Math.random() - 0.5) * amp : 0; return `${(x0 + dx * t + nx * j).toFixed(1)},${(y0 + dy * t + ny * j).toFixed(1)}`; }).join(" ");
}
function tdbForkFrom(x0, y0, x1, y1, len = 26) { // una branca curta que ix d'un punt del llamp
  const t = 0.3 + Math.random() * 0.4, mx = x0 + (x1 - x0) * t, my = y0 + (y1 - y0) * t, a = Math.random() * Math.PI * 2;
  return [mx, my, mx + Math.cos(a) * len, my + Math.sin(a) * len];
}
// Rellotge de CPU: a cada tic l'ona quadrada de la cara baixa al camí i el recorre (cada tram dins de l'abast, des
// del punt més pròxim cap als dos costats); colpeja totes les distraccions del tram. Cada `every` tics, tic doble.
function tdbClock(t) {
  const d = TD_DEFENDERS[t.id], double = (t.ticks = (t.ticks || 0) + 1) % d.every === 0;
  tdbPartOut(t, "l");
  if (double) { t.svg?.classList.remove("tick2"); void t.svg?.getBoundingClientRect(); t.svg?.classList.add("tick2"); }
  const color = double ? TD_GLOW.gold : TD_GLOW.maq, [x, y] = tdb.world.slots[t.slot], R = t.stats.range;
  for (const P of tdb.paths) { // l'ona recorre cada camí (on dos camins comparteixen tram, es dibuixa igual)
  // trams del camí dins de l'abast
  const runs = []; let run = null;
  for (let dd = 0; dd <= P.total + 6; dd += 6) {
    const [px, py] = P.at(dd), inside = dd <= P.total && Math.hypot(px - x, py - y) <= R;
    if (inside) { if (!run) run = { a: dd, b: dd, best: dd, r: Infinity }; run.b = dd; const r = Math.hypot(px - x, py - y); if (r < run.r) { run.r = r; run.best = dd; } }
    else if (run) { runs.push(run); run = null; }
  }
  const half = 16, A = double ? 15 : 11;
  for (const r of runs) for (const dir of [1, -1]) { // des del punt més pròxim cap a cada costat
    const end = dir > 0 ? r.b : r.a, pts = [];
    let sign = 1;
    for (let dd = r.best; dir > 0 ? dd < end : dd > end; dd += dir * half) {
      const n = Math.min(half, Math.abs(end - dd)), [ax, ay] = P.at(dd), [bx, by] = P.at(dd + dir * n);
      const L = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / L, ny = (bx - ax) / L;
      pts.push(tdbS(ax + nx * A * sign, ay + ny * A * sign), tdbS(bx + nx * A * sign, by + ny * A * sign));
      sign = -sign;
      pts.push(tdbS(bx + nx * A * sign, by + ny * A * sign));
    }
    if (pts.length < 2) continue;
    const g = el("g", { class: `tdb-clockwave${double ? " double" : ""}` }, $("tdb-lines"));
    const pl = pts.map(p => p.map(v => v.toFixed(1)).join(",")).join(" ");
    g.innerHTML = `<polyline points="${pl}" pathLength="1" fill="none" stroke="${color}" stroke-width="${double ? 11 : 8}" opacity="0.3" stroke-linejoin="miter"/>
      <polyline points="${pl}" pathLength="1" fill="none" stroke="#e8fbff" stroke-width="${double ? 3.4 : 2.4}" stroke-linejoin="miter"/>`;
    setTimeout(() => g.remove(), 600);
  }
  }
  const mult = (double ? 2 : 1) * tdbAuraMult(t);
  for (const e of tdb.enemies) if (tdbVisible(e) && Math.hypot(...tdbPos(e).map((v, i) => v - [x, y][i])) <= R) tdbDamage(e, t.stats.dmg * mult, t, double);
}
// Canya de pescar: el fil va de la punta de la canya (.tip) a l'ham mentre vola i, quan enganxa, a la distracció
// mentre l'arrossega. Quan acaba d'estirar (o cau), el fil desapareix.
function tdbTipPos(t) {
  const r = t.svg?.querySelector(".tip")?.getBoundingClientRect(), ctm = $("tdb-svg").getScreenCTM();
  if (!r || !ctm) return null;
  const q = new DOMPoint(r.x + r.width / 2, r.y + r.height / 2).matrixTransform(ctm.inverse());
  return [q.x, q.y];
}
function tdbHooksDraw() {
  const layer = $("tdb-proj");
  for (const h of tdb.hooks) {
    const flying = !h.e && !h.p.done, pulling = h.e && h.e.hp > 0 && !!h.e.hooked;
    if (!flying && !pulling) { h.el?.remove(); h.over = true; continue; }
    const a = tdbTipPos(h.t);
    if (!a) continue;
    const b = flying ? tdbS(h.p.x, h.p.y) : tdbS(...tdbPos(h.e)).map((v, i) => v - (i ? h.e.size * 0.4 : 0));
    h.el ||= el("path", { class: "tdb-fil", fill: "none", stroke: "#bff7f0", "stroke-width": "1.6", opacity: "0.9" }, layer);
    const mx = (a[0] + b[0]) / 2, my = Math.max(a[1], b[1]) + (pulling ? 6 : 24); // panxa del fil (tens quan estira)
    h.el.setAttribute("d", `M${a[0].toFixed(1)} ${a[1].toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`);
  }
  tdb.hooks = tdb.hooks.filter(h => !h.over);
  for (const t of Object.values(tdb.towers)) if (TD_DEFENDERS[t.id].role === "hook") // el fil de la canya penja només si l'ham hi és
    t.svg?.querySelector(".fil")?.setAttribute("opacity", tdb.hooks.some(h => h.t === t) ? "0" : "0.8");
}
// Pescat: la distracció ix volant cap a la punta de la canya i desapareix (els caps no: perden part de la vida)
function tdbCatch(e) {
  const t = e.hooked.t, d = TD_DEFENDERS[t.id];
  e.el?.classList.remove("hooked");
  const [x, y] = tdbS(...tdbPos(e));
  tdbFx("ring", x, y - e.size * 0.4, TD_GLOW.fau, 46);
  if (e.def.boss) { // un cap no cap a la cistella: torna al camí on era, amb menys vida
    e.hooked = null; // (no ha avançat mentre estava enganxat: torna on era)
    tdbDamage(e, e.maxHp * d.hook.boss, null, true); return; // la pesca no depén de l'element
  }
  e.hooked = null;
  const tip = tdbTipPos(t), ghost = e.el?.cloneNode(true);
  if (ghost && tip) { // el peix ix del camí cap a la canya
    ghost.classList.add("tdb-pescat"); $("tdb-proj").append(ghost);
    ghost.style.setProperty("--dx", `${(tip[0] - x).toFixed(0)}px`); ghost.style.setProperty("--dy", `${(tip[1] - y).toFixed(0)}px`);
    setTimeout(() => ghost.remove(), 700);
  }
  tdbDamage(e, e.hp, null, true);
}
// Cérvol de la brama: brama i ix una ona (tres anells de llum) que s'expandix per tot el mapa; quan l'anell arriba a
// una distracció, li fa mal i la fa recular (en temps de joc: tdb.waves)
const TD_WAVE_SPEED = 620, TD_WAVE_MAX = 1500;
function tdbBellow(t, roar = false) {
  const d = TD_DEFENDERS[t.id], [x, y] = tdb.world.slots[t.slot];
  const g = el("g", { class: `tdb-wave${roar ? " roar" : ""}` }, $("tdb-fx"));
  // el gran bramit: cinc anells més gruixuts, d'or, i un esclat al tòtem
  g.innerHTML = (roar ? [0, 1, 2, 3, 4] : [0, 1, 2]).map(i => `<circle r="0" fill="none" stroke="${roar ? (i % 2 ? "#fff3c0" : TD_GLOW.gold) : i === 1 ? "#e8ffd8" : TD_GLOW.fau}" stroke-width="${(6 - i * 1.1) * (roar ? 2 : 1)}"/>`).join("");
  if (roar) {
    tdbFx("blast", ...tdbS(x, y - 60), TD_GLOW.gold, 170);
    tdbNumber(...tdbS(x, y - 150), "🦌 gran bramit", TD_GLOW.gold, true);
    t.svg?.classList.remove("roar"); void t.svg?.getBoundingClientRect(); t.svg?.classList.add("roar");
  }
  (tdb.waves ||= []).push({ t, d, x, y, r: 0, hit: new Set(), g, roar });
}
function tdbWaves(dt) {
  for (const w of tdb.waves) {
    w.r += TD_WAVE_SPEED * dt;
    const ab = w.t.stats.ability;
    for (const e of tdb.enemies) if (tdbVisible(e) && !w.hit.has(e.uid) && Math.hypot(...tdbPos(e).map((v, i) => v - [w.x, w.y][i])) <= w.r) {
      w.hit.add(e.uid);
      const R = w.roar ? w.d.special : null; // el gran bramit: més mal, més empenta i més temps parades
      e.dist = Math.max(0, e.dist - w.d.bellow.push * ab * (R ? R.push : 1) * (e.def.boss ? 0.5 : 1));
      e.stunT = Math.max(e.stunT, R ? R.stun : w.d.bellow.stun);
      tdbDamage(e, w.t.stats.dmg * (R ? R.mult : 1) * (w.t.echo || 1) * tdbAuraMult(w.t), w.t, true);
    }
    // els tres anells, un darrere de l'altre, es fan transparents en allunyar-se
    const [cx, cy] = tdbS(w.x, w.y), k = tdbS(w.x + 1, w.y)[0] - cx;
    [...w.g.children].forEach((c, i) => {
      const r = Math.max(0, w.r - i * (w.roar ? 34 : 46)) * k;
      c.setAttribute("cx", cx.toFixed(1)); c.setAttribute("cy", cy.toFixed(1)); c.setAttribute("r", r.toFixed(1));
      c.setAttribute("opacity", Math.max(0, 1 - w.r / TD_WAVE_MAX).toFixed(2));
    });
    if (w.r > TD_WAVE_MAX) { w.g.remove(); w.over = true; }
  }
  tdb.waves = tdb.waves.filter(w => !w.over);
}
// Condensador (com la Guspira del Clash Royale): no dispara mentre es carrega. La càrrega puja entre les plaques i
// l'electró del mig creix amb ella (--q); quan està ple i té algú a tir, el llança d'un colp, com un canó, i a l'impacte
// esclata en zona: llamps a cada distracció del voltant (blast × el dany) que les deixen parades un moment.
function tdbCapacitor(t, dt) {
  const c = TD_DEFENDERS[t.id].charge;
  tdbCapAim(t);
  if ((t.charge ?? 0) < 1) {
    t.charge = Math.min(1, (t.charge ?? 0) + dt * t.stats.rate);
    t.svg?.style.setProperty("--q", t.charge.toFixed(3));
    t.svg?.classList.toggle("full", t.charge >= 1);
    return;
  }
  const tg = tdbTargets(t)[0];
  if (!tg) return; // ple: espera algú a tir
  t.charge = 0;
  t.svg?.style.setProperty("--q", "0");
  t.svg?.classList.remove("full", "discharge"); void t.svg?.getBoundingClientRect(); t.svg?.classList.add("discharge");
  tdbProjectile(t, tg, t.stats.dmg * c.blast, { part: "c", from: tdbThrowFrom(t, "l") }); // ix d'on està l'electró (gira amb el cos)
}
// Mentre es carrega, apunta: un raig fi de l'electró a la distracció que té a tir (cada vegada més intens) i una mira
// damunt d'ella que es tanca a mesura que puja la càrrega; ple, la mira es queda tancada i fa pampallugues
function tdbCapAim(t) {
  // segueix també les que s'acosten (fins a 1,8 × l'abast); fora de tir, la mira és més tènue
  const q = t.charge ?? 0, [tx, ty] = tdb.world.slots[t.slot], far = e => Math.hypot(...tdbPos(e).map((v, i) => v - [tx, ty][i]));
  const tg = tdbTargets(t)[0] || tdb.enemies.filter(e => tdbVisible(e) && far(e) <= t.stats.range * 1.8).sort((a, b) => far(a) - far(b))[0];
  if (!tg) { t.aimEl?.remove(); t.aimEl = null; return; }
  tdbAim(t, tg); // el condensador gira sencer cap a ella
  const inRange = far(tg) <= t.stats.range;
  if (!t.aimEl) t.aimEl = el("g", { class: "tdb-capaim" }, $("tdb-fx"));
  const [x0, y0] = tdbS(...tdbThrowFrom(t, "l")), [ex, ey] = tdbPos(tg), [x1, y1] = tdbS(ex, ey - tg.size * 0.45);
  const r = 34 - 18 * q, C = TD_GLOW.maq, o = ((0.55 + 0.45 * q) * (inRange ? 1 : 0.45)).toFixed(2);
  t.aimEl.classList.toggle("full", q >= 1 && inRange);
  t.aimEl.innerHTML = `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${C}" stroke-width="${(1.6 + 1.8 * q).toFixed(1)}" stroke-dasharray="7 6" opacity="${o}" class="tdb-capaim-ray"/>
    <g transform="translate(${x1.toFixed(1)} ${y1.toFixed(1)})" opacity="${o}"><circle r="${r.toFixed(1)}" fill="none" stroke="${C}" stroke-width="2.4"/>
    ${[0, 90, 180, 270].map(a => `<path d="M0 ${(-r - 7).toFixed(1)} V${(-r + 6).toFixed(1)}" transform="rotate(${a})" stroke="#e8fbff" stroke-width="2.4" stroke-linecap="round"/>`).join("")}
    <circle r="2.6" fill="#e8fbff"/></g>`;
}
function tdbDischarge(t, e, dmg) {
  const c = TD_DEFENDERS[t.id].charge, [x, y] = tdbPos(e), r = c.radius * t.stats.ability;
  const [sx, sy] = tdbS(x, y - e.size * 0.45);
  tdbFx("blast", sx, sy, TD_GLOW.maq, r);
  for (const o of tdb.enemies) if (tdbVisible(o) && Math.hypot(...tdbPos(o).map((v, i) => v - [x, y][i])) <= r) {
    if (o !== e) tdbBolt([sx, sy], tdbS(...tdbPos(o)).map((v, i) => v - (i ? o.size * 0.45 : 0)), TD_GLOW.maq);
    o.stunT = Math.max(o.stunT, c.stun * t.stats.ability);
    tdbDamage(o, dmg, t, true);
  }
}
// ---- bosc
// Anells del tronc: un anell gran ix del centre de la criatura i s'eixampla fins a l'abast; fa mal (una vegada) a cada
// distracció que travessa
function tdbPulse(t) {
  const pc = TD_ART[t.id].throw?.pulse; // d'on ix l'anell (el Pi Mare: del tronc tallat, al mig)
  const [x, y] = pc ? (() => { const [sx0, sy0] = tdbS(...tdb.world.slots[t.slot]), k = 124 / 132; return tdbM(sx0 - 62 + (pc[0] + 6) * k, sy0 + TDB_TOWER_Y + (pc[1] + 10) * k); })() : tdbThrowFrom(t, "c");
  const max = t.stats.range, [sx, sy] = tdbS(x, y);
  const g = el("g", { class: "tdb-pulse", transform: `translate(${sx} ${sy})` }, $("tdb-fx"));
  g.innerHTML = `<circle r="1" fill="none" stroke="${TD_GLOW.mnt}" stroke-width="10" opacity="0.25"/><circle r="1" fill="none" stroke="#e8ffb0" stroke-width="3.5"/>`;
  tdb.pulses.push({ t, x, y, r: 12, max, dmg: t.stats.dmg * tdbAuraMult(t), hit: new Set(), el: g });
}
function tdbPulses(dt) {
  for (const p of tdb.pulses) {
    p.r += TD_DEFENDERS[p.t.id].pulse * dt;
    const k = Math.min(1, p.r / p.max);
    for (const c of p.el.children) c.setAttribute("r", p.r.toFixed(1));
    p.el.setAttribute("opacity", (1 - k * k).toFixed(2));
    for (const e of tdb.enemies) {
      if (e.hp <= 0 || e.convertT || p.hit.has(e)) continue;
      const [ex, ey] = tdbPos(e);
      if (Math.hypot(ex - p.x, ey - p.y) <= p.r + e.size * 0.3) { p.hit.add(e); tdbDamage(e, p.dmg, p.t); }
    }
    if (p.r >= p.max) p.el.remove();
  }
  tdb.pulses = tdb.pulses.filter(p => p.r < p.max);
}
// Atrapats: arrels que pugen des de terra i s'enrosquen al cos, o resina d'ambre que els cobrix de baix a dalt.
// Es dibuixa dins del dibuix de la distracció (viewBox 0-100, base a y = 96); l'enemic forceja mentre dura.
function tdbTrap(e, kind) {
  const svg = e.el.querySelector("svg");
  if (!svg) return;
  svg.querySelector(".tdb-trap")?.remove();
  const roots = [[22, 1], [38, -1], [62, 1], [78, -1]].map(([x, d], i) =>
    `<path class="tdb-root" style="animation-delay:${i * 0.06}s" d="M${x} 99 C${x + d * 6} 80 ${50 - d * 26} 74 ${50 + d * 4} 62 S${50 + d * 22} 44 ${50 + d * 10} 36" pathLength="100"/>`).join("");
  svg.insertAdjacentHTML(kind === "resin" ? "beforeend" : "beforeend", kind === "root"
    ? `<g class="tdb-trap root">${roots}${[[30, 96], [70, 96], [50, 98]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="3" fill="#2a1a0c"/>`).join("")}</g>`
    : `<g class="tdb-trap resin"><path d="M8 98 C6 74 18 58 30 62 C36 48 48 44 56 52 C66 44 82 52 80 64 C94 66 96 84 92 98 Z" fill="#e8a64a" opacity="0.55" stroke="#ffd27a" stroke-width="2.4"/>
        <path d="M24 70 Q30 64 36 68 M62 60 Q68 56 72 62" stroke="#fff3c8" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>
        <path d="M30 98 Q31 104 29 108 M72 98 Q73 103 71 106" stroke="#e8a64a" stroke-width="4" fill="none" stroke-linecap="round" class="tdb-drip"/></g>`);
  e.trapped = true;
}
function tdbUntrap(e) {
  const g = e.el.querySelector(".tdb-trap");
  e.trapped = false;
  if (!g) return;
  g.classList.add("off"); // les arrels es retiren / la resina es trenca
  setTimeout(() => g.remove(), 300);
}
// Carrasca: les criatures del voltant (no ella mateixa) fan més dany
function tdbAuraMult(t) {
  let m = 1;
  const [x, y] = tdb.world.slots[t.slot];
  for (const o of Object.values(tdb.towers)) {
    const a = TD_DEFENDERS[o.id].aura;
    if (a && o !== t && (!a.el || TD_DEFENDERS[t.id].el === a.el) && Math.hypot(tdb.world.slots[o.slot][0] - x, tdb.world.slots[o.slot][1] - y) <= a.radius) m += a.dmg * Math.min(1.5, o.stats.ability);
  }
  return m;
}
// Les criatures que reben l'aura brillen de verd (es recalcula en posar o vendre)
// Les arrels de la Carrasca ixen de terra fins a les criatures del voltant i s'hi lliguen; mentre hi estan, aquelles
// tenen una aura verda (i fan més dany). Es tornen a dibuixar en posar, millorar o vendre.
function tdbAuraMarks(instant = false) {
  const layer = $("tdb-lines"), keep = new Set(); // les arrels que ja hi són no es tornen a fer créixer
  for (const t of Object.values(tdb.towers)) {
    const on = tdbAuraMult(t) > 1;
    t.el?.classList.toggle("tdb-aura", on);
    if (on && t.el && !t.el.querySelector(".tdb-aura-ring")) t.el.insertAdjacentHTML("afterbegin", `<ellipse class="tdb-aura-ring" cy="34" rx="66" ry="23"/>`);
    if (!on) t.el?.querySelector(".tdb-aura-ring")?.remove();
  }
  if (!layer) return;
  for (const c of Object.values(tdb.towers)) {
    const a = TD_DEFENDERS[c.id].aura;
    if (!a) continue;
    const [cx, cy] = tdbS(...tdb.world.slots[c.slot]);
    for (const o of Object.values(tdb.towers)) {
      if (o === c || (a.el && TD_DEFENDERS[o.id].el !== a.el) || Math.hypot(...tdb.world.slots[o.slot].map((v, i) => v - tdb.world.slots[c.slot][i])) > a.radius) continue;
      const key = `${c.uid}-${o.uid}`;
      keep.add(key);
      if (layer.querySelector(`[data-roots="${key}"]`)) continue;
      const [ox, oy] = tdbS(...tdb.world.slots[o.slot]), y0 = cy + 34, y1 = oy + 34, mx = (cx + ox) / 2, my = (y0 + y1) / 2;
      const g = el("g", { class: `tdb-auraroots${instant ? " grown" : ""}`, "data-roots": key }, layer);
      g.innerHTML = [-1, 1].map(s => `<path d="M${cx} ${y0} Q${mx + s * 18} ${my + s * 26} ${ox} ${y1} q${s * 14} -6 ${s * 6} -18 q${-s * 10} -8 ${-s * 18} 2" pathLength="100" class="tdb-auraroot"/>`).join("");
    }
  }
  layer.querySelectorAll(".tdb-auraroots").forEach(n => { if (!keep.has(n.dataset.roots)) n.remove(); }); // les de criatures que ja no hi són
}
// Contrafoc: no dispara. A cada tram de camí que té dins de l'abast (el de dalt i el de baix, si està entre dos) hi
// deixa una línia recta de foc que travessa el camí i crema sempre: tota distracció que la creua es crema mentre hi és.
// On es posa és estratègic (un buit entre trams en cobrix més). El Projecte en pot fer una de temporal.
function tdbLineAt(t, x, y, ang, len, dps, dur = Infinity) {
  const L = TD_DEFENDERS.contrafoc.line;
  const l = { t, x, y, ang, len, half: L.width / 2 * Math.min(1.4, t.stats.ability), dps, dur };
  tdbDrawLine(l, $("tdb-lines"));
  tdb.lines.push(l);
  return l;
}
const tdbLineDist = (l, px, py) => { // distància d'un punt a la línia (segment)
  const dx = Math.cos(l.ang), dy = Math.sin(l.ang), u = Math.max(-l.len / 2, Math.min(l.len / 2, (px - l.x) * dx + (py - l.y) * dy));
  return Math.hypot(px - (l.x + dx * u), py - (l.y + dy * u));
};
function tdbDrawLine(l, layer) {
  const [sx, sy] = tdbS(l.x, l.y), a = l.ang * 180 / Math.PI + (tdb.portrait ? 90 : 0);
  const n = Math.max(5, Math.round(l.len / 45)), flames = Array.from({ length: n }, (_, i) => { const u = (i / (n - 1) - 0.5) * l.len;
    return `<g transform="translate(${u.toFixed(0)} 0) rotate(${(-a).toFixed(0)})"><path class="tdb-burn-f" style="animation-delay:${(-i * 0.13).toFixed(2)}s" d="M0 -26 C11 -10 11 4 0 9 C-11 4 -11 -10 0 -26 Z" fill="#ff8a3a" stroke="#ffc23f" stroke-width="2"/><path d="M0 -10 C4 -5 4 0 0 4 C-4 0 -4 -5 0 -10 Z" fill="#fff3c0"/></g>`; }).join("");
  l.el = el("g", { class: "tdb-fireline", transform: `translate(${sx} ${sy}) rotate(${a.toFixed(1)})` }, layer);
  l.el.innerHTML = `<rect x="${-l.len / 2 - 10}" y="${-l.half}" width="${l.len + 20}" height="${l.half * 2}" rx="${l.half}" fill="#ff6a1a" opacity="0.14"/>
    <path d="M${-l.len / 2} 0 H${l.len / 2}" stroke="#2a1206" stroke-width="16" stroke-linecap="round" opacity="0.75"/>
    <path d="M${-l.len / 2} 0 H${l.len / 2}" stroke="#ff8a3a" stroke-width="5" stroke-linecap="round" class="tdb-embers"/>${flames}`;
}
// En posar-lo: busca els trams de camí dins de l'abast i, de cada un, el punt més pròxim; hi va una línia que travessa
// el camí (perpendicular)
function tdbFireSpots(slot, range) {
  const [x, y] = tdb.world.slots[slot], out = [];
  for (const P of tdb.paths) { // a cada camí; on comparteixen tram, la línia només una vegada
    const spots = [];
    let run = null;
    for (let d = 0; d <= P.total + 8; d += 8) {
      const [px, py] = P.at(d), r = Math.hypot(px - x, py - y), inside = d <= P.total && r <= range;
      if (inside) { if (!run || r < run.r) run = { r, best: d }; }
      else if (run) { spots.push(run.best); run = null; }
    }
    for (const d of spots) {
      const [px, py] = P.at(d), [qx, qy] = P.at(d + 2);
      if (!out.some(o => Math.hypot(o.x - px, o.y - py) < 30)) out.push({ x: px, y: py, ang: Math.atan2(qy - py, qx - px) + Math.PI / 2 });
    }
  }
  return out;
}
function tdbPlaceLine(t) {
  const L = TD_DEFENDERS.contrafoc.line;
  t.lines = tdbFireSpots(t.slot, t.stats.range).map(s => tdbLineAt(t, s.x, s.y, s.ang, L.len, t.stats.dmg * L.dps));
}
function tdbLines(dt) {
  for (const l of tdb.lines) {
    if (l.dur !== Infinity) l.dur -= dt;
    if (l.t.lines?.includes(l)) l.dps = l.t.stats.dmg * TD_DEFENDERS.contrafoc.line.dps * tdbAuraMult(l.t); // puja amb les millores
    for (const e of tdb.enemies) if (e.hp > 0 && !e.convertT && tdbLineDist(l, ...tdbPos(e)) <= l.half) {
      e.burnFx = (e.burnFx || 0) - dt;
      if (e.burnFx <= 0) { e.burnFx = 0.4; e.el.classList.remove("burning"); void e.el.getBoundingClientRect(); e.el.classList.add("burning"); }
      tdbDamage(e, l.dps * dt, l.t, false, dt); // el número del cremat, junt cada mig segon, del color del foc
    }
    if (l.dur <= 0) l.el?.remove();
  }
  tdb.lines = tdb.lines.filter(l => l.dur > 0);
}
// Anellador: l'anella marca la distracció (rep més dany de tots); quan mor, salta a la més pròxima
function tdbMark(e, amount) {
  if (!e.el) return;
  if (e.mark >= amount) return;
  e.mark = amount;
  const svg = e.el.querySelector("svg");
  if (svg && !svg.querySelector(".tdb-mark")) { // l'anella es posa a la pota (o a la tija) de la distracció, dins del seu dibuix
    const [x, y, k] = TD_MARK_SPOT[e.type] || TD_MARK_SPOT[e.def.art] || [50, 62, 0.8];
    svg.insertAdjacentHTML("beforeend", `<g class="tdb-mark" style="transform-origin:${x}px ${y}px">${anella(x, y, k)}</g>`);
  }
}
// On es posa l'anella a cada distracció del bosc (x, y, mida al viewBox 0-100 del dibuix): potes i tiges
const TD_MARK_SPOT = { notificacio: [44, 75, 0.5], procrastinacio: [23, 68, 0.5], son: [49, 84, 0.55], scroll: [50, 86, 0.6],
  scrollet: [50, 86, 0.6], meme: [58, 89, 0.5], series: [50, 84, 0.6], diumenge: [38, 84, 0.6] };
function tdbMarkJump(e) {
  const [x, y] = tdbPos(e);
  const next = tdb.enemies.filter(o => o !== e && o.hp > 0 && !o.mark && !o.convertT)
    .map(o => [o, Math.hypot(...tdbPos(o).map((v, i) => v - [x, y][i]))]).filter(([, d]) => d < 260).sort((a, b) => a[1] - b[1])[0];
  if (!next) return;
  tdbBolt(tdbS(x, y - e.size * 0.45), tdbS(...tdbPos(next[0])).map((v, i) => v - (i ? next[0].size * 0.45 : 0)), "#d8dde6");
  tdbMark(next[0], e.mark);
}
function tdbSlow(e, amount, dur) { e.slowMult = Math.min(e.slowMult, 1 - amount); e.slowT = Math.max(e.slowT, dur); }
// Resistència: la banda de color s'estreny al voltant de la distracció i hi queda mentre la frena (es lleva en acabar)
function tdbBand(e, color) {
  if (!e.el) return;
  e.band?.remove();
  const s = e.size, r = (s * 0.5).toFixed(1);
  e.band = el("g", { class: "tdb-band", transform: `translate(0 ${(-s * 0.48).toFixed(1)})` }, e.el);
  e.band.innerHTML = `<g class="tdb-band-in"><circle r="${r}" fill="none" stroke="${color}" stroke-width="7" opacity="0.85"/>
    <circle r="${r}" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="3 9" class="tdb-band-run" opacity="0.8"/></g>`;
}

// Zones a terra (capa de baix): el plançó que naix on arrela la sàmara i el toll de mel del rusc. Frenen el que hi passa.
function tdbZone(t, type, [x, y]) {
  const S = TD_DEFENDERS[t.id].special, k = Math.min(1.5, t.stats.ability), r = S.radius * k;
  const z = { type, x, y, r, slow: S.slow, life: S.dur * k, max: S.dur * k };
  const [sx, sy] = tdbS(x, y), rs = tdbS(x + r, y)[0] - sx;
  z.el = el("g", { class: `tdb-zone ${type}`, transform: `translate(${sx.toFixed(1)} ${sy.toFixed(1)})` }, $("tdb-lines"));
  z.el.innerHTML = type === "honey"
    ? `<path d="M${-rs} 0 C${-rs} ${-rs * 0.42} ${-rs * 0.3} ${-rs * 0.5} 0 ${-rs * 0.44} C${rs * 0.5} ${-rs * 0.52} ${rs} ${-rs * 0.36} ${rs * 0.96} 0 C${rs} ${rs * 0.4} ${rs * 0.3} ${rs * 0.46} 0 ${rs * 0.4} C${-rs * 0.5} ${rs * 0.5} ${-rs} ${rs * 0.36} ${-rs} 0 Z" fill="#e8a020" opacity="0.7" stroke="#ffd04a" stroke-width="3"/>
       <ellipse cx="${-rs * 0.3}" cy="${-rs * 0.14}" rx="${rs * 0.26}" ry="${rs * 0.08}" fill="#fff3c0" opacity="0.7"/><circle cx="${rs * 0.4}" cy="${rs * 0.1}" r="${rs * 0.07}" fill="#fff3c0" opacity="0.6"/>`
    : `<ellipse rx="${rs}" ry="${rs * 0.42}" fill="${TD_GLOW.mnt}" opacity="0.13" stroke="${TD_GLOW.mnt}" stroke-width="2" stroke-dasharray="6 8"/>
       <g class="tdb-sprout"><path d="M0 4 V-30" stroke="#8ad06a" stroke-width="4" stroke-linecap="round"/><path d="M0 -14 C-16 -16 -22 -28 -20 -34 C-10 -32 -2 -24 0 -14 Z" fill="#7cd36a"/>
       <path d="M0 -22 C14 -24 22 -36 20 -42 C10 -40 2 -32 0 -22 Z" fill="#a8ec7a"/><ellipse cy="4" rx="10" ry="3" fill="#2a1a0c"/></g>`;
  tdb.zones.push(z);
}
function tdbZones(dt) {
  for (const z of tdb.zones) {
    z.life -= dt;
    for (const e of tdb.enemies) if (tdbVisible(e) && Math.hypot(...tdbPos(e).map((v, i) => v - [z.x, z.y][i])) <= z.r) tdbSlow(e, z.slow, 0.25);
    z.el.setAttribute("opacity", Math.min(1, z.life / 0.6).toFixed(2)); // s'apaga al final
    if (z.life <= 0) z.el.remove();
  }
  tdb.zones = tdb.zones.filter(z => z.life > 0);
}
function tdbSpecial(t, target) {
  const s = TD_DEFENDERS[t.id].special, ab = t.stats.ability;
  const [tx, ty] = tdb.world.slots[t.slot];
  if (TD_SHOT_SPECIALS.includes(s.type)) {
    if (t.svg) { t.boostShot = s.type; return; } // la criatura: el tir d'ara porta l'habilitat
    // el Projecte (sense dibuix propi): la fa ell mateix des del seu lloc, amb l'empenta de l'eco
    const from = [tx, ty - 60], dmg = t.stats.dmg * (t.echo || 1);
    if (s.type === "scale") tdbProjectile(t, target, dmg, { from, sp: "scale" });
    else if (s.type === "overload") { tdbBolt(tdbS(...from), tdbS(...tdbPos(target)).map((v, i) => v - (i ? target.size * 0.45 : 0)), TD_OVER_COLOR); tdbDamage(target, dmg, t, true); tdbChain(t, target, dmg, true); }
    else if (s.type === "roar") tdbBellow(t, true);
    else tdbZone(t, s.type, tdbPos(target)); // el plançó o la mel, directament al camí
    return;
  }
  if (s.type === "freeze") {
    const [x, y] = tdbPos(target);
    tdbFx("freeze", ...tdbS(x, y), "#9fe0ff", s.radius * ab);
    for (const e of tdb.enemies) if (e.hp > 0 && Math.hypot(...tdbPos(e).map((v, i) => v - [x, y][i])) <= s.radius * ab) {
      e.stunT = Math.max(e.stunT, s.dur * ab);
      if (TD_DEFENDERS[t.id].subj === "mnt") tdbTrap(e, "resin"); // la resina dels anells els deixa enganxats
    }
  } else if (s.type === "root") { // la gla cau i en brollen arrels que atrapen
    const [x, y] = tdbPos(target), r = s.radius * Math.min(1.5, ab);
    const g = tdbFx("roots", ...tdbS(x, y), TD_GLOW.mnt, r);
    if (g) g.innerHTML = `<ellipse rx="${r}" ry="${r * 0.4}" fill="${TD_GLOW.mnt}" opacity="0.14"/>${Array.from({ length: 7 }, (_, i) => { const a = i / 7 * Math.PI * 2, ex = Math.cos(a) * r * 0.9, ey = Math.sin(a) * r * 0.36;
      return `<path d="M0 0 Q${(ex * 0.5 + ey * 0.4).toFixed(0)} ${(ey * 0.5 - 26).toFixed(0)} ${ex.toFixed(0)} ${ey.toFixed(0)}" stroke="#c98a4a" stroke-width="6" fill="none" stroke-linecap="round"/>`; }).join("")}`;
    for (const e of tdb.enemies) if (e.hp > 0 && Math.hypot(...tdbPos(e).map((v, i) => v - [x, y][i])) <= r) { e.stunT = Math.max(e.stunT, s.dur * ab); tdbTrap(e, "root"); }
  } else if (s.type === "echo") { // fa l'especial d'una altra criatura del mapa, més fort
    const others = Object.values(tdb.towers).filter(o => o !== t && (TD_DEFENDERS[o.id].special?.type && TD_DEFENDERS[o.id].special.type !== "echo" || ["line", "mark", "stacks"].includes(TD_DEFENDERS[o.id].role)));
    const o = others[Math.floor(Math.random() * others.length)];
    const boost = s.boost * ab;
    tdbNumber(...tdbS(tx, ty - 120), o ? `🧩 ${TD_DEFENDERS[o.id].name}` : "🧩 projecte", TD_GLOW.myth, true);
    if (!o) { tdbDamage(target, t.stats.dmg * 3 * boost, t, true); return; }
    const od = TD_DEFENDERS[o.id], fake = { ...o, slot: t.slot, svg: null, echo: s.boost, stats: { ...t.stats, dmg: o.stats.dmg, ability: o.stats.ability * s.boost } };
    tdbBolt(tdbS(...tdb.world.slots[o.slot]).map((v, i) => v - (i ? 60 : 0)), tdbS(tx, ty - 60), TD_GLOW.myth);
    if (od.special && od.special.type !== "echo") tdbSpecial(fake, target);
    else if (od.role === "line") { // una línia de foc de 4 s que travessa el camí davant de l'objectiu
      const d0 = target.dist + 40, [lx, ly] = tdbP(target).at(d0), [lx2, ly2] = tdbP(target).at(d0 + 2);
      tdbLineAt(fake, lx, ly, Math.atan2(ly2 - ly, lx2 - lx) + Math.PI / 2, TD_DEFENDERS.contrafoc.line.len, o.stats.dmg * TD_DEFENDERS.contrafoc.line.dps * s.boost, 4 * s.boost);
    }
    else if (od.role === "mark") tdbMark(target, od.mark * s.boost);
    else if (od.role === "stacks") tdbBlast({ ...fake, stats: { ...fake.stats, dmg: o.stats.dmg * s.boost / od.blast * 4 } });
  } else if (s.type === "scan") { // el dron escaneja: les del con queden marcades (més dany i visibles)
    const [x, y] = tdbTPos(t), r = s.radius * Math.min(1.5, ab);
    const g = tdbFx("scan", ...tdbS(x, y), "#4fd1c5", r);
    if (g) g.innerHTML = `<path d="M0 -40 L${-r * 0.7} ${r * 0.55} L${r * 0.7} ${r * 0.55} Z" fill="#4fd1c5" opacity="0.16"/>${[0.2, 0.4, 0.6, 0.8].map(k => `<path d="M${-r * 0.7 * k} ${-40 + (r * 0.55 + 40) * k} H${r * 0.7 * k}" stroke="#bff7f0" stroke-width="2" opacity="0.6"/>`).join("")}`;
    for (const e of tdb.enemies) if (e.hp > 0 && Math.hypot(...tdbPos(e).map((v, i) => v - [x, y][i])) <= r) {
      e.vuln = Math.max(e.vuln, s.vuln); e.vulnT = Math.max(e.vulnT, s.dur * ab); e.revealT = s.dur * ab;
      e.el?.classList.add("scanned"); setTimeout(() => e.el?.classList.remove("scanned"), s.dur * ab * 1000 / Math.max(1, tdb.speed));
    }
    tdbNumber(...tdbS(x, y - 80), "📡 escaneig", "#4fd1c5", true);
  } else if (s.type === "collapse") { // el qubit col·lapsa: un quadrat de llum ix del xip, un llamp a cada distracció i es queden parades
    const [x, y] = tdbTPos(t), [sx, sy] = tdbS(x, y);
    const g = el("g", { class: "tdb-collapse", transform: `translate(${sx} ${sy - 50})` }, $("tdb-fx"));
    g.innerHTML = [0, 1, 2].map(i => `<rect class="tdb-collapse-sq" x="-40" y="-40" width="80" height="80" rx="6" fill="none" stroke="${i % 2 ? "#5ad8ff" : "#ff3b4e"}" stroke-width="5" style="animation-delay:${i * 0.12}s"/>`).join("")
      + `<circle r="26" fill="#fff" class="tdb-collapse-core"/>`;
    setTimeout(() => g.remove(), 900);
    t.svg?.classList.remove("collapse"); void t.svg?.getBoundingClientRect(); t.svg?.classList.add("collapse");
    for (const e of tdb.enemies) if (tdbVisible(e) && Math.hypot(...tdbPos(e).map((v, i) => v - [x, y][i])) <= t.stats.range) {
      e.stunT = Math.max(e.stunT, s.stun * ab); e.el?.classList.add("collapsed"); setTimeout(() => e.el?.classList.remove("collapsed"), 700);
      tdbBolt([sx, sy - 50], tdbS(...tdbPos(e)).map((v, i) => v - (i ? e.size * 0.45 : 0)), "#ff3b4e");
    }
    tdbNumber(...tdbS(x, y - 120), "⟨ψ| col·lapse", "#ff3b4e", true);
  } else if (s.type === "goto") { // GOTO: la més avançada torna enrere pel camí
    const e = tdb.enemies.filter(o => tdbVisible(o)).sort((a, b) => b.dist - a.dist)[0];
    if (e) {
      // GOTO: es desfà en píxels on és, un fil de codi salta enrere pel camí i torna a aparéixer allà
      const from = tdbPos(e), d0 = e.dist;
      e.dist = Math.max(0, e.dist - s.back * Math.min(1.5, ab));
      const P = tdbP(e), pts = Array.from({ length: 9 }, (_, i) => tdbS(...P.at(d0 - (d0 - e.dist) * i / 8)));
      const g = el("g", { class: "tdb-goto" }, $("tdb-fx"));
      g.innerHTML = `<polyline points="${pts.map(([x, y], i) => `${x.toFixed(0)},${(y - 40 - Math.sin(i / 8 * Math.PI) * 70).toFixed(0)}`).join(" ")}" fill="none" stroke="#3fdc8a" stroke-width="4" stroke-dasharray="10 8" class="tdb-goto-line"/>
        ${[0, 1].map(j => { const [x, y] = j ? pts[8] : pts[0]; return `<g transform="translate(${x} ${y - 30})">${Array.from({ length: 10 }, (_, i) => `<rect class="tdb-goto-px" x="${(i % 4) * 9 - 18}" y="${Math.floor(i / 4) * 9 - 14}" width="7" height="7" fill="${j ? "#3fdc8a" : "#ff3b4e"}" style="animation-delay:${(i * 0.03 + j * 0.35).toFixed(2)}s"/>`).join("")}</g>`; }).join("")}
        <text x="${pts[4][0]}" y="${pts[4][1] - 130}" text-anchor="middle" class="tdb-goto-txt">goto ${Math.round(s.back)};</text>`;
      setTimeout(() => g.remove(), 1100);
      e.el?.classList.remove("warped"); void e.el?.getBoundingClientRect(); e.el?.classList.add("warped");
    }
  } else if (s.type === "align") {
    const R = t.stats.range * (s.area || 1); // la paràlisi arriba molt més lluny que el seu tir
    tdbFx("ring", ...tdbS(tx, ty), TD_GLOW.myth, R);
    for (const e of tdb.enemies) if (tdbVisible(e) && Math.hypot(...tdbPos(e).map((v, i) => v - [tx, ty][i])) <= R) {
      e.stunT = Math.max(e.stunT, s.dur * ab); e.vuln = Math.max(e.vuln, s.vuln); e.vulnT = s.vulnDur * ab;
    }
    tdbNumber(...tdbS(tx, ty - 120), "λ · diagonalitzat", TD_GLOW.myth, true);
  } else if (s.type === "convert") {
    const weak = tdbTargets(t, 20).filter(e => !e.def.boss).sort((a, b) => a.hp - b.hp)[0];
    if (weak) {
      // la roda dentada de dalt ix volant, colpeja l'enemic i el compila; després es torna a formar
      const gear = t.svg?.querySelector(".gear"), ctm = $("tdb-svg").getScreenCTM();
      const gr = gear?.getBoundingClientRect();
      const [ex, ey] = tdbS(...tdbPos(weak));
      const hitIt = () => {
        if (weak.hp <= 0) return;
        weak.convertT = s.dur * ab;
        weak.el.classList.add("converted");
        tdbFx("ring", ex, ey - weak.size * 0.45, TD_GLOW.gold, 40);
        tdbNumber(ex, ey - weak.size, "compilat!", TD_GLOW.gold, true);
      };
      if (!gear || !gr?.width || !ctm) { hitIt(); return; }
      const p0 = new DOMPoint(gr.x + gr.width / 2, gr.y + gr.height / 2).matrixTransform(ctm.inverse());
      const k = gr.width / (ctm.a || 1) / 26; // mida de la roda en unitats del mapa
      const fly = el("g", { class: "tdb-gearfly" }, $("tdb-fx"));
      fly.innerHTML = `<g transform="scale(${k.toFixed(2)})"><circle r="12" fill="none" stroke="${TD_GLOW.gold}" stroke-width="6" stroke-dasharray="4.4 3"/><circle r="7" fill="none" stroke="#fff" stroke-width="2"/></g>`;
      gear.classList.add("gone");
      const a = fly.animate([
        { transform: `translate(${p0.x}px, ${p0.y}px) rotate(0deg)` },
        { transform: `translate(${(p0.x + ex) / 2}px, ${Math.min(p0.y, ey) - 90}px) rotate(360deg)`, offset: 0.5 },
        { transform: `translate(${ex}px, ${ey - weak.size * 0.45}px) rotate(720deg)` },
      ], { duration: 520 / (tdb.speed * tdDevSpeed), easing: "ease-in" });
      a.onfinish = () => { fly.remove(); hitIt(); gear.classList.remove("gone"); gear.classList.add("regrow"); setTimeout(() => gear.classList.remove("regrow"), 600); };
    }
  }
}
// Dron de mostreig: ix del seu buit i vola per tot el mapa fins a posar-se damunt de la distracció més avançada (la
// segueix); si no n'hi ha cap, torna a la seua plataforma. Dispara des d'on és (tdbTPos)
function tdbDrone(t, dt) {
  const d = TD_DEFENDERS[t.id], home = tdb.world.slots[t.slot];
  if (t.fx == null) [t.fx, t.fy] = home;
  const e = tdb.enemies.filter(tdbVisible).sort((a, b) => b.dist - a.dist)[0];
  const [gx, gy] = e ? tdbPos(e) : home;
  const dx = gx - t.fx, dy = gy - t.fy, dd = Math.hypot(dx, dy), step = d.fly * dt;
  if (dd > 1) { const k = Math.min(1, step / dd); t.fx += dx * k; t.fy += dy * k; }
  t.tilt = dd > 4 ? Math.max(-14, Math.min(14, dx / Math.max(dd, 1) * 14)) : 0; // s'inclina cap on va
  // alçada: s'enlaira quan ix a caçar i aterra a la plataforma quan torna; dispara des de dalt cap avall
  const want = e || Math.hypot(t.fx - home[0], t.fy - home[1]) > 30 ? d.height : 0;
  t.alt = (t.alt || 0) + Math.sign(want - (t.alt || 0)) * Math.min(Math.abs(want - (t.alt || 0)), 260 * dt);
}
// Stack Overflow: el desbordament explota per tot el mapa
function tdbBlast(t) {
  const d = TD_DEFENDERS[t.id];
  $("tdb-map").classList.remove("shake");
  void $("tdb-map").offsetWidth;
  $("tdb-map").classList.add("shake");
  tdbFx("blast", ...tdbS(...tdb.world.slots[t.slot]), "#ff8a1f", 900);
  for (const e of [...tdb.enemies]) if (e.hp > 0 && !e.convertT) tdbDamage(e, t.stats.dmg * d.blast * t.stats.ability, t, true);
}

// Peces en vol de cada costat: quan torna l'última, la peça es torna a formar
// Peces que es llancen (al / ar): en llançar-la, desapareix del cos i torna a créixer de manera que acabe just al tir
// següent (quan creix una, ix la següent bala), i no es pot disparar una peça que no ha acabat de créixer.
function tdbPartOut(t, part) {
  const period = 1 / t.stats.rate, R = tdRegrowTime(t.id); // acaba de créixer just quan ix el tir següent
  t.parts = t.parts || {};
  t.parts[part] = { out: true, growIn: Math.max(0.05, period - R), ready: 0 };
  t.svg?.classList.remove(`regrow-${part}`);
  t.svg?.classList.add(`thrown-${part}`);
}
function tdbPartGrow(t, part) { // comença a créixer: estarà a punt quan acabe l'animació
  const P = t.parts[part];
  P.out = false; P.growIn = 0; P.ready = tdRegrowTime(t.id);
  if (!t.svg) return;
  t.svg.classList.remove(`thrown-${part}`, `regrow-${part}`);
  void t.svg.getBoundingClientRect();
  t.svg.classList.add(`regrow-${part}`);
}
function tdbParts(t, dt) {
  for (const part in t.parts || {}) {
    const P = t.parts[part];
    if (P.out && (P.growIn -= dt) <= 0) tdbPartGrow(t, part);
    else if (P.ready > 0) P.ready -= dt;
  }
}
const tdbPartReady = (t, part) => { const P = t.parts?.[part]; return !P || (!P.out && P.ready <= 0); };

// ---------------------------------------------------------------- efectes
// La distracció es dissol: el dibuix s'apaga i en surten partícules del seu color
function tdbDissolve(e) {
  const el = e.el;
  el.classList.add("dying");
  setTimeout(() => el.remove(), 420);
  const [x, y] = tdbS(...tdbPos(e));
  const c = TD_ENEMY_GLOW[e.def.art || e.type] || "#aab3c0";
  const g = tdbFx("dissolve", x, y - e.size * 0.45, c);
  if (g) g.innerHTML = Array.from({ length: e.def.boss ? 18 : 9 }, (_, i) => {
    const a = i / (e.def.boss ? 18 : 9) * Math.PI * 2, rr = e.size * 0.25;
    return `<rect x="${(Math.cos(a) * rr).toFixed(1)}" y="${(Math.sin(a) * rr).toFixed(1)}" width="7" height="7" fill="${c}" style="--dx:${(Math.cos(a) * 30).toFixed(0)}px;--dy:${(Math.sin(a) * 20 - 30).toFixed(0)}px"/>`;
  }).join("");
}
function tdbNumber(x, y, text, color, big = false, cls = "") {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const fx = $("tdb-fx");
  if (fx.childElementCount > 60) return;
  const t = el("text", { x, y, class: `tdb-num${big ? " big" : ""}${cls ? " " + cls : ""}`, fill: color }, fx);
  t.textContent = text;
  setTimeout(() => t.remove(), 800);
}
// Rajolí en zig-zag entre dos punts (pantalla) que s'esvaïx
function tdbBolt([x0, y0], [x1, y1], color) {
  const n = 6, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const pts = Array.from({ length: n + 1 }, (_, i) => { const t = i / n, j = i && i < n ? (Math.random() - 0.5) * 26 : 0; return `${(x0 + dx * t + nx * j).toFixed(1)},${(y0 + dy * t + ny * j).toFixed(1)}`; }).join(" ");
  const g = el("g", { class: "tdb-bolt" }, $("tdb-fx"));
  g.innerHTML = `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="7" opacity="0.35" stroke-linejoin="round"/><polyline points="${pts}" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/>`;
  setTimeout(() => g.remove(), 320);
}
function tdbFx(kind, x, y, color, r = 60) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  // el translate va en un grup de fora: si anara en el mateix, l'escala de l'animació (td-fx) també el multiplicaria
  // i l'efecte naixeria lluny i viatjaria fins al seu lloc
  const at = el("g", { transform: `translate(${x} ${y})` }, $("tdb-fx")), g = el("g", { class: `tdb-fx-${kind}` }, at);
  if (kind === "pop") g.innerHTML = [0, 60, 120, 180, 240, 300].map(a => `<line x1="0" y1="0" x2="${Math.cos(a * Math.PI / 180) * 26}" y2="${Math.sin(a * Math.PI / 180) * 26}" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`).join("");
  else if (kind === "summon") g.innerHTML = `<ellipse rx="70" ry="24" cy="34" fill="none" stroke="${color}" stroke-width="4"/><ellipse rx="40" ry="14" cy="34" fill="${color}" opacity="0.3"/>`;
  else g.innerHTML = `<circle r="${r}" fill="${color}" opacity="${kind === "blast" ? 0.18 : 0.12}" stroke="${color}" stroke-width="${kind === "freeze" ? 4 : 3}"/>`;
  setTimeout(() => at.remove(), kind === "blast" ? 700 : kind === "dissolve" ? 800 : 500);
  return g;
}

// ---------------------------------------------------------------- bucle
function tdbLoop(now) {
  const B = tdb;
  if (!B || (!B.idle && $("td-battle").hidden)) return; // els mons de 100 onades continuen encara que no es miren
  const dt = Math.min((now - B.last) / 1000, 0.1);
  B.last = now;
  if (!B.over && !tdbViewing() && (B.started || B.wave > 0 || !B.idle || B.demo)) {
    let speed = B.speed * tdDevSpeed;
    if (B.bank > 0) { const extra = dt * speed * (TD_IDLE.offlineBoost - 1); B.bank = Math.max(0, B.bank - extra); speed *= TD_IDLE.offlineBoost; } // temps guardat
    let left = dt * speed;
    while (left > 0 && tdb === B && !B.over) { const step = Math.min(left, 0.05); tdbUpdate(step); left -= step; }
  }
  if (tdb !== B) return;
  tdbRender();
  requestAnimationFrame(tdbLoop);
}
function tdbUpdate(dt) {
  tdb.time += dt;
  // pausa entre onades (als mons de 100 onades, la següent comença sola)
  if (!tdb.waveRunning && (tdb.wave > 0 || tdb.started) && tdb.pause > 0) {
    tdb.pause -= dt;
    if (tdb.pause <= 0) tdbStartWave();
  }
  // aparicions
  if (tdb.spawnQueue.length) {
    tdb.spawnT -= dt;
    while (tdb.spawnQueue.length && tdb.spawnT <= 0) {
      const [type, gap, kind] = tdb.spawnQueue.shift();
      tdbSpawn(type, 0, false, null, kind);
      tdb.spawnT += gap;
    }
  }
  if (tdb.rushT > 0) tdb.rushT -= dt;
  if (tdb.lines.length) tdbLines(dt);
  if (tdb.pulses.length) tdbPulses(dt);
  if (tdb.chains?.length) tdbChains(dt);
  if (tdb.waves?.length) tdbWaves(dt);
  if (tdb.zones?.length) tdbZones(dt);
  // enemics
  for (const e of tdb.enemies) {
    if (e.hp <= 0) continue;
    for (const k of ["slowT", "vulnT", "dotT", "stunT", "revealT"]) if (e[k] > 0) e[k] -= dt;
    if (e.slowT <= 0) { e.slowMult = 1; if (e.band) { e.band.remove(); e.band = null; } }
    if (e.vulnT <= 0) e.vuln = 0;
    if (e.dotT > 0) tdbDamage(e, e.dot * dt, e.dotEl || null, false, dt);
    else e.poison = false;
    if (e.hp <= 0) continue;
    // aliat compilat: torna enrere i fa mal als que toca
    if (e.convertT > 0) {
      e.convertT -= dt;
      e.dist -= 70 * dt;
      const [x, y] = tdbPos(e);
      for (const o of tdb.enemies) if (o !== e && o.hp > 0 && !o.convertT && Math.hypot(...tdbPos(o).map((v, i) => v - [x, y][i])) < 50) tdbDamage(o, 30 * dt, "arca"); // el compilat: dany de codi
      if (e.convertT <= 0 || e.dist <= 0) tdbKill(e);
      continue;
    }
    tdbEnemyAbility(e, dt);
    if (e.hooked) { // enganxat a l'ham: el fil el porta fins a la canya i, quan arriba, és pescat
      if ((e.hooked.left -= dt) <= 0) tdbCatch(e);
      continue;
    }
    if (e.stunT > 0) continue;
    e.dist += e.def.speed * e.slowMult * (tdb.rushT > 0 ? 1.35 : 1) * (1 - tdArtBonus("slowAll")) * dt;
    if (e.dist >= tdbP(e).total) {
      e.hp = 0;
      e.el.remove();
      // un cap que arriba al cristall el trenca: es perd el món, siguen les vides que siguen
      if (e.def.boss && !tdb.god) { tdb.lives = 0; tdbShatter(e); return; }
      if (!tdb.god) tdb.lives -= e.def.lives;
      $("tdb-student")?.classList.add("hurt");
      setTimeout(() => $("tdb-student")?.classList.remove("hurt"), 500);
      if (tdb.lives <= 0) { tdb.lives = 0; if (tdb.idle) tdbWaveLost(); else tdbFinish(false); return; }
    }
  }
  tdb.enemies = tdb.enemies.filter(e => e.hp > 0);
  // criatures
  for (const t of Object.values(tdb.towers)) {
    if (t.sleepT > 0) { t.sleepT -= dt; continue; }
    if (t.burst > 0) {
      t.burstT -= dt;
      if (t.burstT <= 0) {
        const target = t.burstTarget?.hp > 0 ? t.burstTarget : tdbTargets(t)[0];
        if (target) tdbProjectile(t, target, t.stats.dmg, { part: "l" });
        t.burst--; t.burstT = 0.12;
      }
    }
    if (t.pending) {
      t.pending.wait -= dt;
      if (t.pending.wait <= 0) {
        const { target, part, sp } = t.pending;
        t.pending = null;
        const tg = target.hp > 0 ? target : tdbTargets(t)[0];
        if (tg) tdbProjectile(t, tg, t.stats.dmg, { part, sp });
        t.svg?.classList.remove("load");
        if (!TD_DEFENDERS[t.id].aimHold) t.aimBack = 0.45;
      }
    }
    if (t.aimBack > 0 && (t.aimBack -= dt) <= 0) { // la V torna a estar dreta
      t.aimA = 0;
      const aim = t.svg?.querySelector(".aim");
      if (aim) aim.style.transform = "rotate(0deg)";
    }
    tdbParts(t, dt);
    if (TD_DEFENDERS[t.id].role === "drone") tdbDrone(t, dt);
    if (TD_DEFENDERS[t.id].role === "capacitor") { tdbCapacitor(t, dt); continue; } // no dispara: es carrega
    t.cd -= dt;
    if (t.cd <= 0 && tdbFire(t)) t.cd = 1 / t.stats.rate;
    else if (t.cd < 0) t.cd = 0;
  }
  // projectils
  const speed0 = TD_BATTLE.projSpeed;
  for (const p of tdb.projs) {
    const speed = speed0 * (p.d.projSpeed || 1); // la sàmara baixa a poc a poc, girant
    if (p.dir) { // llança que travessa
      p.x += p.dir[0] * speed * dt; p.y += p.dir[1] * speed * dt; p.traveled += speed * dt;
      for (const e of tdb.enemies) if (tdbVisible(e) && !p.hit.has(e.uid) && Math.hypot(...tdbPos(e).map((v, i) => v - [p.x, p.y][i])) < 40) { p.hit.add(e.uid); tdbHit(p, e); }
      if (p.traveled > p.t.stats.range * (p.sp === "scale" ? 2 : 1.3)) p.done = true;
      continue;
    }
    if (!p.target || p.target.hp <= 0) { // l'objectiu ja no hi és: les que planegen (sàmara) busquen una altra
      const next = p.d.fall && tdbTargets(p.t)[0];
      if (next) p.target = next; else { p.done = true; continue; }
    }
    const [ex, ey] = tdbPos(p.target);
    const ty = ey - p.target.size * 0.45;
    const dx = ex - p.x, dy = ty - p.y, dd = Math.hypot(dx, dy);
    if (dd < speed * dt + 8) { p.done = true; tdbHit(p, p.target); continue; }
    p.x += dx / dd * speed * dt; p.y += dy / dd * speed * dt; p.ang = Math.atan2(dy, dx);
  }
  for (const p of tdb.projs) if (p.done) {
    if (p.d.fall) { // no desapareix en l'aire: cau a terra girant i s'apaga
      const inner = p.el.firstElementChild;
      inner?.classList.add("tdb-falling");
      setTimeout(() => p.el.remove(), 900);
    } else p.el.remove();
  }
  tdb.projs = tdb.projs.filter(p => !p.done);
  // fi de l'onada
  if (tdb.waveRunning && !tdb.spawnQueue.length && !tdb.enemies.length) tdbWaveDone();
}
function tdbEnemyAbility(e, dt) {
  const d = e.def;
  if (d.sleep && !tdHasArtifact("auriculars")) {
    e.abilityT += dt;
    if (e.abilityT >= d.sleep.every) {
      e.abilityT = 0;
      const [x, y] = tdbPos(e);
      const t = Object.values(tdb.towers).map(t => [t, Math.hypot(tdb.world.slots[t.slot][0] - x, tdb.world.slots[t.slot][1] - y)])
        .filter(([, dd]) => dd < d.sleep.radius).sort((a, b) => a[1] - b[1])[0];
      if (t) t[0].sleepT = d.sleep.dur;
    }
  }
  if (d.heal) {
    const [x, y] = tdbPos(e);
    for (const o of tdb.enemies) if (o.hp > 0 && !o.convertT && Math.hypot(...tdbPos(o).map((v, i) => v - [x, y][i])) < d.heal.radius) o.hp = Math.min(o.maxHp, o.hp + d.heal.hps * dt);
  }
  if (d.rush) {
    e.abilityT += dt;
    if (e.abilityT >= d.rush.every) { e.abilityT = 0; tdb.rushT = d.rush.dur; }
  }
  // pestanyes / formiga reina: en va deixant de menudes darrere, pel mateix camí
  if (d.spawn && (e.spawned || 0) < d.spawn.max) {
    e.spawnT = (e.spawnT || 0) + dt;
    if (e.spawnT >= d.spawn.every) { e.spawnT = 0; e.spawned = (e.spawned || 0) + 1; tdbSpawn(d.spawn.type, Math.max(0, e.dist - 30), false, tdbP(e)); }
  }
  // l'Algoritme / la papallona: canvia de debilitat i de fortalesa
  if (d.shift) {
    e.shiftT = (e.shiftT ?? d.shift.every) + dt;
    if (e.shiftT >= d.shift.every) { e.shiftT = 0; tdbShift(e); }
  }
}
// Tria una debilitat i una fortalesa noves (diferents de les d'ara) entre els elements de les criatures; la icona de
// damunt del cap mostra la debilitat, i el cos agafa el seu color
function tdbShift(e) {
  const els = Object.keys(TD_ELEMENTS).filter(k => !TD_ELEMENTS[k].always);
  const pick = not => { const o = els.filter(k => !not.includes(k)); return o[Math.floor(Math.random() * o.length)]; };
  const weak = pick([e.def.weak]), strong = pick([weak, e.def.strong]);
  e.def = { ...e.def, weak, strong };
  const E = TD_ELEMENTS[weak];
  let tag = e.el.querySelector(".tdb-shift");
  if (!tag) tag = el("g", { class: "tdb-shift" }, e.el);
  tag.innerHTML = `<g class="tdb-shift-in" transform="translate(${(e.size * 0.42).toFixed(0)} ${(-e.size * 0.82).toFixed(0)})"><circle r="21" fill="#0b0f17" stroke="${E.color}" stroke-width="3"/>
    <text y="7" text-anchor="middle" font-size="22">${E.icon}</text><title>Ara és feble a ${E.name} i forta contra ${TD_ELEMENTS[strong].name}</title></g>`;
  e.el.style.setProperty("--shift", E.color);
  e.el.classList.remove("shifted"); void e.el.getBoundingClientRect(); e.el.classList.add("shifted");
}

// ---------------------------------------------------------------- onades
function tdbStartWave() {
  if (tdb.over || tdb.waveRunning || tdb.wave >= tdbWaveCount()) return;
  const id = (tdb.world.base || tdb.world).id;
  // passada l'onada 50, el mapa s'amplia: un tros de camí nou i 4 buits més (les criatures es queden on eren)
  if (tdb.idle && tdb.wave >= TD_IDLE.extAt && tdb.world.ext && !tdb.world.extended) {
    tdb.world = tdWorldExtended(tdb.world);
    tdb.paths = tdbWorldPaths(tdb.world).map(tdbPath);
    tdbBuildView();
    if (!$("td-battle").hidden) toast("🗺️ El mapa s'amplia: camí més llarg i 4 buits nous", "good");
  }
  tdb.wave++;
  tdb.started = true;
  tdb.waveRunning = true;
  tdb.pause = 0;
  tdb.spawnQueue = [];
  if (tdb.idle) {
    tdb.lives = tdbMaxLives(); // cada onada, el cristall sencer
    tdbSnap();
    for (const [type, count, gap, kind] of tdWaveSpec(tdb.world, tdb.wave)) for (let i = 0; i < count; i++) tdb.spawnQueue.push([type, gap, kind]);
  } else for (const [type, count, gap] of tdb.world.waves[tdb.wave - 1]) for (let i = 0; i < count; i++) tdb.spawnQueue.push([type, gap]);
  tdb.spawnT = 0.3;
  const w = tdRun(id);
  w.best = Math.max(w.best, tdb.wave - 1);
  tdbBanner(`Onada ${tdb.wave}${tdb.idle ? ` / ${TD_IDLE.waves}` : ""}`);
}
function tdbWaveDone() {
  tdb.waveRunning = false;
  const n = tdb.wave, id = (tdb.world.base || tdb.world).id, w = tdRun(id);
  tdb.saber += TD_BATTLE.waveBonusSaber * n * (tdb.idle && n > TD_IDLE.extAt ? TD_IDLE.lateSaber : 1);
  const wasBest = w.best;
  w.best = Math.max(w.best, n);
  if (tdb.idle) {
    const mana = tdbWaveMana(n);
    tdb.mana += mana;
    tdbBank();
    // els caps amb nom: la primera vegada que cauen, pergamins de cada camp de la sala
    const perg = TD_IDLE.bossScrolls[n];
    if (perg && !(w.scrolls ||= []).includes(n)) {
      w.scrolls.push(n);
      for (const s of tdFieldsOf(tdb.world.mode)) td.pergamins[s] += perg;
      toast(`📜 Caps derrotats! +${perg} pergamins de cada camp`, "good");
    }
    if (wasBest < TD_IDLE.openAt && n >= TD_IDLE.openAt) {
      const next = TD_WORLDS.find(o => o.needs === id && !o.soon);
      toast(next ? `🌀 Onada ${n}: s'obri «${next.name}» i ja pots anar a ×4` : `⏭ Onada ${n}: ja pots anar a ×4`, "good");
      tdbSpeedBtn();
    }
    if (!$("td-battle").hidden) tdbNumber(...tdbS(...tdb.world.crystal), `+${mana} 🔮`, "#b48cff", true);
  }
  tdSave();
  if (n >= tdbWaveCount()) { tdbFinish(true); return; }
  tdb.pause = tdb.idle ? 3 : TD_BATTLE.wavePause;
}
function tdbBanner(text) {
  const b = $("tdb-banner");
  b.textContent = text;
  b.classList.remove("show");
  void b.offsetWidth;
  b.classList.add("show");
}
// Fi del combat: el saber guanyat es queda sempre (també si perds o ixes)
// El cristall es trenca: tremola, esclata en trossos que salten i cauen, i després ix el final de la partida
function tdbShatter(e) {
  tdb.over = true; tdb.shattering = true; // ja no es mou res
  tdbHud?.();
  const cr = $("tdb-crystal"), [cx, cy] = tdbS(...tdb.world.crystal), forest = tdb.world.mode === "forestal";
  const C = forest ? ["#1f6a3e", "#9ff07a"] : ["#0b2a3a", "#7fe8ff"];
  cr.classList.add("shatter");
  toast(`💥 ${e.def.name} ha trencat el cristall!`, "bad");
  const g = el("g", { class: "tdb-shards", transform: `translate(${cx} ${cy})` }, $("tdb-fx"));
  g.innerHTML = `<circle r="20" fill="#fff" class="tdb-shard-flash"/>` + Array.from({ length: 14 }, (_, i) => {
    const a = i / 14 * Math.PI * 2 + Math.random() * 0.3, d = 90 + Math.random() * 110, r = 6 + Math.random() * 12;
    return `<g class="tdb-shard" style="--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d - 30).toFixed(0)}px;--rot:${Math.round(Math.random() * 540 - 270)}deg;animation-delay:${(0.35 + Math.random() * 0.1).toFixed(2)}s">
      <path d="M0 ${-r} L${r * 0.7} ${r * 0.2} L${-r * 0.4} ${r}" fill="${C[0]}" stroke="${C[1]}" stroke-width="2.5" stroke-linejoin="round"/></g>`; }).join("");
  const B = tdb;
  if (B.idle) { setTimeout(() => { if (tdb === B && !B.ended) { $("tdb-crystal")?.classList.remove("shatter"); tdbWaveLost(); } }, 1500); return; }
  setTimeout(() => { if (tdb === B && !B.ended) { B.ended = true; tdbFinish(false); } }, 1500);
}
function tdbFinish(won, quiet = false) {
  tdb.over = true; tdb.won = won;
  const id = (tdb.world.base || tdb.world).id;
  if (won) {
    tdb.saber += TD_BATTLE.worldBonusSaber;
    tdRun(id).clears++;
    // onada 100: la recepta (o la pedra) de Matrícula d'Honor del món
    if (tdb.idle) for (const [k, F] of Object.entries(TD_FORGE)) if (F.world === id && !td.forge.includes(k)) { td.forge.push(k); toast(`${F.key}! Ves a l'altar → Fusió`, "good"); }
  }
  const saber = Math.round(tdb.saber) + (tdb.saberTotal || 0);
  td.saber += Math.round(tdb.saber);
  tdb.saber = 0;
  if (tdb.idle) { delete tdRun(id).run; td.idle = { world: 0, at: 0 }; } // món acabat: la pròxima vegada, des de zero
  tdSave();
  if (quiet) return;
  if (tdb.idle && $("td-battle").hidden) { toast(`🏆 Has acabat les ${TD_IDLE.waves} onades de «${tdb.world.name}»!`, "good"); return; }
  $("tdb-end-title").textContent = won ? "🏆 Món superat!" : "💥 El cristall s'ha trencat";
  $("tdb-end-body").innerHTML = `<p>Has arribat a l'onada <strong>${tdb.wave} / ${tdbWaveCount()}</strong> i has eliminat <strong>${tdb.kills}</strong> distraccions.</p>
    <p class="tdb-end-saber">✨ +${fmtNum(saber)} de saber</p>
    ${tdb.artifactsWon.map(id => `<p>${TD_ARTIFACTS[id].icon} ${TD_ARTIFACTS[id].name} (nivell ${td.artifacts[id]})</p>`).join("")}
    <p class="muted">Amb el saber pots pujar de nivell les criatures al grimori.</p>`;
  $("tdb-end").hidden = false;
}

// ---------------------------------------------------------------- pintar
function tdbRender() {
  for (const e of tdb.enemies) {
    const [x, y] = tdbS(...tdbPos(e));
    e.el.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    e.hpBar.setAttribute("width", Math.max(0, 50 * e.hp / e.maxHp).toFixed(1));
    // si la barra de vida (i la icona de l'Algoritme) quedaria fora per dalt, va davall dels peus
    const low = y - e.size - 16 < 0;
    if (low !== e.barLow) {
      e.barLow = low;
      e.hpBar.parentNode.setAttribute("transform", `translate(0 ${low ? 14 : -e.size - 10})`);
      e.el.classList.toggle("bar-low", low);
    }
    e.el.classList.toggle("stealth", !!e.def.stealth && e.dist < e.def.stealth * tdbP(e).total);
    e.el.classList.toggle("stunned", e.stunT > 0);
    e.el.classList.toggle("poisoned", !!e.poison && e.dotT > 0);
    if (e.trapped && e.stunT <= 0) tdbUntrap(e);
    e.el.classList.toggle("trapped", !!e.trapped);
    e.el.classList.toggle("slowed", e.slowT > 0);
    e.el.classList.toggle("rushed", tdb.rushT > 0);
  }
  if (tdb.hooks?.length) tdbHooksDraw();
  for (const p of tdb.projs) {
    const [x, y] = tdbS(p.x, p.y);
    const ang = p.dir ? Math.atan2(p.dir[1], p.dir[0]) : p.ang || 0;
    const rot = (ang * 180 / Math.PI + (tdb.portrait ? 90 : 0)) || 0;
    // les peces simètriques (+, punts, ×) no giren; les fletxes i llances, sí
    const turn = ["vector", "ifelse", "determinant", "compilador", "bruixola"].includes(p.t.id) ? rot : 0;
    p.el.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${turn.toFixed(0)}) scale(${p.scale})`);
  }
  for (const t of Object.values(tdb.towers)) {
    if (t.fx != null) { // el dron vola (el cercle de runes es queda al buit): es mou el grup .fly, en unitats del dibuix
      const fly = t.fly || (t.fly = t.el.querySelector(".fly"));
      if (fly) {
        const [hx, hy] = tdbS(...tdb.world.slots[t.slot]), [x, y] = tdbS(t.fx, t.fy), k = 124 / 132;
        const alt = tdb.portrait ? (t.alt || 0) : Math.min(t.alt || 0, Math.max(0, y - 90)); // que no se'n vaja per dalt de la pantalla
        fly.setAttribute("transform", `translate(${((x - hx) / k).toFixed(1)} ${((y - hy - alt) / k).toFixed(1)}) rotate(${(t.tilt || 0).toFixed(1)} 60 60)`);
        fly.querySelector(".fly-shadow")?.setAttribute("transform", `translate(0 ${(alt / k).toFixed(1)}) scale(${(1 - Math.min(0.5, alt / 400)).toFixed(2)})`);
      }
    }
    t.el.classList.toggle("asleep", t.sleepT > 0);
    if (TD_DEFENDERS[t.id].role === "stacks") t.el.style.setProperty("--stacks", t.stacks);
  }
  tdbHud();
}
function tdbHud() {
  $("tdb-world").textContent = `${tdWorldNum(tdb.world)}. ${tdb.world.name}`;
  $("tdb-wave").textContent = `${Math.max(1, tdb.wave)} / ${tdbWaveCount()}`;
  const bank = $("tdb-bank"), lost = $("tdb-lost");
  if (bank) { bank.hidden = !(tdb.bank > 0); if (tdb.bank > 0) bank.textContent = `⏳ ×${TD_IDLE.offlineBoost} ${Math.ceil(tdb.bank / 60)} min`; }
  if (lost) lost.hidden = !tdb.lost;
  $("tdb-lives").textContent = tdb.god ? "∞" : Math.max(0, tdb.lives);
  $("tdb-lives-map") && ($("tdb-lives-map").textContent = tdb.god ? "∞" : tdb.lives);
  $("tdb-mana").textContent = Math.floor(tdb.mana);
  $("tdb-saber").textContent = fmtNum(Math.round(tdb.saber));
  const next = $("tdb-next");
  if (tdb.over) next.hidden = true;
  else if (tdb.wave === 0 && !tdb.started) { next.hidden = false; next.textContent = "▶ Començar"; }
  else if (!tdb.waveRunning && tdb.pause > 0) { next.hidden = false; next.textContent = `▶ Ja! (${Math.ceil(tdb.pause)})`; }
  else next.hidden = true;
  // cartes: les que no et pots permetre, apagades
  document.querySelectorAll("#tdb-deck [data-card]").forEach(c => c.classList.toggle("poor", tdb.mana < TD_DEFENDERS[c.dataset.card].cost));
  const pb = document.querySelector("#tdb-deck [data-place]");
  if (pb && tdb.pickId && pb.disabled !== tdb.mana < TD_DEFENDERS[tdb.pickId].cost) $("tdb-deck").querySelector(".tdb-pick-info").outerHTML = tdbPickInfo();
  if (tdb.selectedTower) tdbTowerPanel();
}

// ---------------------------------------------------------------- selector (en tocar un buit buit) i panell de la criatura
// L'equip no està sempre a la vista: ix quan toques un buit buit. En passar per damunt d'una criatura (o enfocar-la),
// el buit mostra el seu abast; en tocar-la, es posa.
function tdbRenderDeck() {
  $("tdb-deck").innerHTML = `<div class="tdb-pick-head"><span>Tria una criatura per al buit</span><button class="secondary small" data-pick="close" aria-label="Tancar">✕</button></div>
    <div class="tdb-pick-cards">${tdDeck(tdb.world.mode).map(id => {
      const d = TD_DEFENDERS[id], lent = !td.owned[id] && td.loan?.def === id;
      return `<button class="tdb-card rar-${d.rar}${tdb.pickId === id ? " sel" : ""}${tdb.mana < d.cost ? " poor" : ""}${lent ? " lent" : ""}" data-card="${id}" aria-pressed="${tdb.pickId === id}" title="${d.name} · ${TD_ELEMENTS[d.el].name}${lent ? ` · prestada per ${PLAYERS[td.loan.from].name}` : ""}">
        ${lent ? `<span class="tdb-card-lent" aria-hidden="true">🤝</span>` : ""}${tdElemDot(id)}<span class="tdb-card-art">${tdCreatureSvg(id)}</span><span class="tdb-card-name">${d.name}</span><span class="tdb-card-cost">🔮 ${d.cost}</span></button>`;
    }).join("")}</div>${tdbPickInfo()}`;
}
// Fitxa de la criatura triada: el que fa i les dades, abans d'invocar-la
function tdbPickInfo() {
  const id = tdb.pickId;
  if (!id) return "";
  const d = TD_DEFENDERS[id], s = tdStats(id), can = tdb.mana >= d.cost;
  return `<div class="tdb-pick-info"><div class="tdb-panel-info"><strong>${d.name}</strong> ${tdElemTag(d.el)} <span class="td-stars">${"★".repeat(s.stars)}</span> · Nv. ${s.level}
      <div class="muted">⚔️ ${fmtNum(s.dmg)} · ⏱ ${s.rate.toFixed(1)}/s · 🎯 ${Math.round(s.range)} · ${fmtNum(s.dmg * s.rate)} de dany/s</div><div class="tdb-panel-desc">${d.desc}</div></div>
    <button data-place="${id}" ${can ? "" : "disabled"}>${can ? `✨ Invocar · 🔮 ${d.cost}` : `🔮 Et falten ${Math.ceil(d.cost - tdb.mana)}`}</button></div>`;
}
function tdbOpenPicker(slot) {
  tdbCloseBottom();
  tdb.pickSlot = slot;
  document.querySelector(`#tdb-slots [data-slot="${slot}"]`)?.classList.add("picking");
  tdbRenderDeck();
  tdbHud();
  $("tdb-deck").hidden = false;
  const team = tdDeck(tdb.world.mode);
  tdbSelectCard(team.find(id => TD_DEFENDERS[id].cost <= tdb.mana) || team[0]);
}
// Triar una carta: es veu la fitxa, l'abast i la criatura en transparència al buit; s'invoca amb el botó
function tdbSelectCard(id) {
  tdb.pickId = id;
  tdbRenderDeck();
  tdbPreview(id);
}
function tdbPreview(id) {
  if (tdb.pickSlot == null || !id) return tdbShowRange(null);
  tdbShowRange({ slot: tdb.pickSlot, stats: tdStats(id) }, true);
  if (TD_DEFENDERS[id].role === "line") { // on anirien les línies de foc des d'este buit
    for (const f of tdbFireSpots(tdb.pickSlot, tdStats(id).range)) {
      const [sx, sy] = tdbS(f.x, f.y), a = f.ang * 180 / Math.PI + (tdb.portrait ? 90 : 0), L = TD_DEFENDERS.contrafoc.line.len;
      el("path", { d: `M${-L / 2} 0 H${L / 2}`, transform: `translate(${sx} ${sy}) rotate(${a})`, class: "tdb-line-preview" }, $("tdb-range"));
    }
  }
  const [x, y] = tdbS(...tdb.world.slots[tdb.pickSlot]);
  const g = el("g", { class: "tdb-ghost", transform: `translate(${x} ${y})` }, $("tdb-range"));
  g.innerHTML = tdCreatureSvg(id).replace("<svg ", `<svg x="-62" y="${TDB_TOWER_Y}" width="124" height="124" `);
}
function tdbCloseBottom() {
  tdb.pickSlot = null;
  tdb.pickId = null;
  tdb.selectedTower = null;
  document.querySelectorAll("#tdb-slots .picking").forEach(e => e.classList.remove("picking"));
  $("tdb-deck").hidden = true;
  $("tdb-panel").hidden = true;
  $("tdb-panel").dataset.html = "";
  tdbShowRange(null);
}
function tdbShowRange(t, preview = false) {
  const g = $("tdb-range");
  g.innerHTML = "";
  if (!t) return;
  const [x, y] = tdbS(...tdb.world.slots[t.slot]);
  el("circle", { cx: x, cy: y, r: t.stats.range, class: `tdb-range-circle${preview ? " preview" : ""}` }, g);
}
function tdbTowerPanel() {
  const t = tdb.selectedTower, d = TD_DEFENDERS[t.id], cost = tdbUpCost(t);
  const p = $("tdb-panel");
  const html = `<div class="tdb-panel-art rar-${d.rar}">${tdCreatureSvg(t.id)}</div>
    <div class="tdb-panel-info"><strong>${d.name}</strong> <span class="td-stars">${"★".repeat(t.stats.stars)}</span> · Nv. ${t.stats.level} · ${"◆".repeat(t.up + 1)}
      <div class="muted">⚔️ ${fmtNum(t.stats.dmg)} · ⏱ ${t.stats.rate.toFixed(1)}/s · 🎯 ${Math.round(t.stats.range)}</div><div class="tdb-panel-desc">${d.desc}</div></div>
    <div class="tdb-panel-btns">
      ${cost != null ? `<button data-tp="up" ${tdb.mana < cost ? "disabled" : ""}>⬆ Potenciar · 🔮 ${cost}</button>` : `<button disabled>◆◆◆ Al màxim</button>`}
      <button class="secondary" data-tp="sell">♻ Retirar · +${Math.round(t.spent * TD_BATTLE.sellBack)} 🔮</button>
      <button class="secondary small" data-tp="close" aria-label="Tancar">✕</button></div>`;
  // només es torna a pintar si ha canviat (si es pinta a cada fotograma, els botons no reben el clic)
  if (p.dataset.html !== html) { p.innerHTML = html; p.dataset.html = html; }
}
function tdbClickMap(ev) {
  if (!tdb || tdb.over) return;
  const slotEl = ev.target.closest("[data-slot]");
  if (!slotEl) { tdbCloseBottom(); return; }
  const slot = Number(slotEl.dataset.slot), t = tdb.towers[slot];
  if (t) {
    tdbCloseBottom();
    tdb.selectedTower = t;
    tdbTowerPanel();
    $("tdb-panel").hidden = false;
    tdbShowRange(t);
    return;
  }
  if (tdb.pickSlot === slot) { tdbCloseBottom(); return; }
  tdbOpenPicker(slot);
}

function initTdBattle() {
  $("tdb-svg").addEventListener("click", tdbClickMap);
  $("tdb-deck").addEventListener("click", ev => {
    if (ev.target.closest('[data-pick="close"]')) { tdbCloseBottom(); return; }
    const c = ev.target.closest("[data-card], [data-place]");
    if (!c || tdb.pickSlot == null) return;
    const id = c.dataset.card || c.dataset.place;
    // primer toc: fitxa i previsualització; segon toc a la mateixa carta (o el botó): invocar
    if (c.dataset.card && tdb.pickId !== id) { tdbSelectCard(id); return; }
    if (tdb.mana < TD_DEFENDERS[id].cost) { toast("🔮 No tens prou maná", "bad"); return; }
    const slot = tdb.pickSlot;
    tdbCloseBottom();
    tdbPlace(slot, id);
  });
  $("tdb-panel").addEventListener("click", ev => {
    const b = ev.target.closest("[data-tp]");
    if (!b || !tdb.selectedTower) return;
    if (b.dataset.tp === "up") tdbUpgrade(tdb.selectedTower);
    if (b.dataset.tp === "sell") tdbSell(tdb.selectedTower);
    if (b.dataset.tp === "close" || b.dataset.tp === "sell") tdbCloseBottom();
    else if (tdb.selectedTower) tdbShowRange(tdb.selectedTower);
  });
  $("tdb-next").addEventListener("click", () => {
    tdbStartWave();
  });
  $("tdb-speed").addEventListener("click", () => {
    const sp = tdbSpeeds();
    tdb.speed = sp[(sp.indexOf(tdb.speed) + 1) % sp.length] || 1;
    if (tdb.idle && tdRun((tdb.world.base || tdb.world).id).run) tdRun((tdb.world.base || tdb.world).id).run.speed = tdb.speed;
    tdbSpeedBtn();
  });
  // eixir: el combat dels mons de 100 onades continua sol (es veu pel portal de la sala)
  $("tdb-exit").addEventListener("click", () => tdCloseBattle());
  $("tdb-end-lobby").addEventListener("click", () => { if (tdb?.idle) { tdStopBattle(); tdOpenLobby(tdRoom); } else tdCloseBattle(); });
  $("tdb-end-retry").addEventListener("click", () => { const w = (tdb.world.base || tdb.world).id; if (tdb.idle) tdStopBattle(); else tdCloseBattle(false); tdOpenBattle(w); });
  // amb el joc amagat (una altra pestanya, el mòbil bloquejat) el combat no avança: el temps es guarda i després va més ràpid
  document.addEventListener("visibilitychange", () => {
    if (!tdb?.idle) return;
    if (document.hidden) { tdb.hiddenAt = Date.now(); td.idle = { world: (tdb.world.base || tdb.world).id, at: Date.now() }; tdSave(); }
    else if (tdb.hiddenAt) { tdb.last = performance.now(); tdbOffline(tdb.hiddenAt); tdb.hiddenAt = 0; }
  });
  addEventListener("pagehide", () => { if (tdb?.idle) { tdbBank(); td.idle = { world: (tdb.world.base || tdb.world).id, at: Date.now() }; tdSave(); } });
  setTimeout(() => { if (typeof tdResumeActive === "function") tdResumeActive(); }, 1200); // el món que estava en marxa continua
  // si es gira la pantalla, es torna a pintar el mapa
  let lastPortrait = null;
  addEventListener("resize", () => {
    if (!tdBattleOpen()) return;
    const p = innerWidth < innerHeight * 0.9;
    if (p !== lastPortrait && p !== tdb.portrait) { lastPortrait = p; tdbBuildView(); }
  });
}
