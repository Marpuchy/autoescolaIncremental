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
function tdOpenBattle(worldId = 1) {
  const world = TD_WORLDS.find(w => w.id === worldId && !w.soon);
  if (!world) return;
  if (!td.team.length) { toast("Tria almenys una criatura per a l'equip (al grimori)", "bad"); return; }
  tdb = {
    world, path: tdbPath(world.path), wave: 0, waveRunning: false, pause: 0, spawnQueue: [], spawnT: 0,
    lives: TD_BATTLE.lives + 3 * td.upgrades.vida, mana: TD_BATTLE.startMana + 20 * td.upgrades.mana,
    saber: 0, kills: 0, enemies: [], towers: {}, projs: [], selected: null, selectedTower: null,
    speed: 1, over: false, time: 0, rushT: 0, uid: 0, artifactsWon: [], bossesSeen: new Set(),
    god: false,
  };
  $("td-lobby").hidden = true;
  $("td-battle").hidden = false;
  document.body.classList.add("td-open");
  tdbBuildView();
  tdbRenderDeck();
  tdbCloseBottom();
  tdbHud();
  $("tdb-end").hidden = true;
  tdb.last = performance.now();
  requestAnimationFrame(tdbLoop);
}
function tdCloseBattle(toLobby = true) {
  if (tdb && !tdb.over) tdbFinish(false, true);
  tdb = null;
  $("td-battle").hidden = true;
  if (toLobby) tdOpenLobby();
}

// ---------------------------------------------------------------- vista
function tdbBuildView() {
  tdb.portrait = innerWidth < innerHeight * 0.9;
  const svg = $("tdb-svg");
  svg.setAttribute("viewBox", tdb.portrait ? "0 0 900 1600" : "0 0 1600 900");
  svg.innerHTML = "";
  const bg = el("g", { id: "tdb-bg", transform: tdb.portrait ? "translate(900 0) rotate(90)" : "" }, svg);
  bg.innerHTML = tdbBackground(tdb.world);
  // cristall
  const [cx, cy] = tdbS(...tdb.world.crystal);
  const crystal = el("g", { id: "tdb-crystal", transform: `translate(${cx} ${cy})` }, svg);
  crystal.innerHTML = `<circle r="70" fill="#4ad8ff" opacity="0.12"/><circle r="70" class="tdb-crystal-glow"/><g class="tdb-crystal-gem">
    <path d="M0 -62 L30 -14 L0 40 L-30 -14 Z" fill="#0b2a3a" stroke="#7fe8ff" stroke-width="5" stroke-linejoin="round"/>
    <path d="M0 -62 L0 40 M-30 -14 H30" stroke="#bff4ff" stroke-width="2" opacity="0.8"/></g>
    <text y="74" text-anchor="middle" font-size="26" font-weight="800" fill="#bff4ff" id="tdb-lives-map"></text>`;
  // buits
  const slots = el("g", { id: "tdb-slots" }, svg);
  tdb.world.slots.forEach(([x, y], i) => {
    const [sx, sy] = tdbS(x, y);
    const g = el("g", { class: "tdb-slot", "data-slot": i, transform: `translate(${sx} ${sy})` }, slots);
    g.innerHTML = `<ellipse rx="62" ry="22" cy="34" class="tdb-slot-ring"/><ellipse rx="44" ry="15" cy="34" class="tdb-slot-ring2"/>
      <circle r="70" fill="transparent" class="tdb-slot-hit"/>`;
  });
  el("g", { id: "tdb-range" }, svg);
  el("g", { id: "tdb-towers" }, svg);
  el("g", { id: "tdb-enemies" }, svg);
  el("g", { id: "tdb-proj" }, svg);
  el("g", { id: "tdb-fx" }, svg);
  // estudiant a la cantonada, amb els artefactes que porta
  const [stx, sty] = tdbS(...tdb.world.student);
  const st = el("g", { id: "tdb-student", transform: `translate(${stx} ${sty})` }, svg);
  st.innerHTML = tdStudentSvg(td.equipped, `x="-76" y="-84" width="152" height="160"`) +
    `<title>Estudiant${td.equipped.length ? ": " + td.equipped.map(id => TD_ARTIFACTS[id].name).join(", ") : ""}</title>`;
  // tornar a pintar les criatures que ja hi havia (canvi d'orientació)
  for (const t of Object.values(tdb.towers)) tdbDrawTower(t);
}
function tdbBackground(world) {
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

// ---------------------------------------------------------------- criatures (torres)
function tdbDrawTower(t) {
  t.el?.remove();
  const [x, y] = tdbS(...tdb.world.slots[t.slot]);
  t.el = el("g", { class: `tdb-tower rar-${TD_DEFENDERS[t.id].rar}`, "data-slot": t.slot, transform: `translate(${x} ${y})` }, $("tdb-towers"));
  t.el.innerHTML = tdCreatureSvg(t.id).replace("<svg ", `<svg x="-62" y="-92" width="124" height="124" `) +
    `<text class="tdb-tower-lvl" y="62" text-anchor="middle">${"◆".repeat(t.up + 1)}</text><text class="tdb-zz" x="30" y="-70" opacity="0">Zz</text>`;
  t.svg = t.el.querySelector(".tdc");
}
// Punt del mapa d'on ix la peça que llança la criatura (l / r / c), a partir del dibuix (viewBox -6 -10 132 132 en 124 px)
function tdbThrowFrom(t, side) {
  const th = TD_ART[t.id].throw || {};
  const [ax, ay] = th[side] || th.l || th.c || [60, 60];
  const [sx, sy] = tdbS(...tdb.world.slots[t.slot]);
  const k = 124 / 132;
  return tdbM(sx - 62 + (ax + 6) * k, sy - 92 + (ay + 10) * k);
}
function tdbPlace(slot, id) {
  const cost = TD_DEFENDERS[id].cost;
  if (tdb.towers[slot] || tdb.mana < cost) return false;
  tdb.mana -= cost;
  const t = { uid: ++tdb.uid, slot, id, up: 0, cd: 0.3, shots: 0, stacks: 0, sleepT: 0, side: 0, spent: cost, burst: 0 };
  t.stats = tdStats(id, 0);
  tdb.towers[slot] = t;
  tdbDrawTower(t);
  tdbSummonFromStudent(t);
  return true;
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
  tdbFx("summon", ...tdbS(...tdb.world.slots[t.slot]), "#ffe27a");
}
function tdbSell(t) {
  tdb.mana += Math.round(t.spent * TD_BATTLE.sellBack);
  t.el.remove();
  delete tdb.towers[t.slot];
}

// ---------------------------------------------------------------- distraccions
function tdbSpawn(type, dist = 0, small = false) {
  const def = TD_ENEMIES[type];
  const hp = def.hp * (1 + TD_WAVE_HP * (tdb.wave - 1));
  const e = { uid: ++tdb.uid, type, def, hp, maxHp: hp, dist, slowT: 0, slowMult: 1, stunT: 0, vuln: 0, vulnT: 0,
    dotT: 0, dot: 0, abilityT: 0, convertT: 0, size: def.size };
  e.el = el("g", { class: `tdb-enemy${def.boss ? " boss" : ""}` }, $("tdb-enemies"));
  const s = def.size;
  e.el.innerHTML = tdEnemySvg(def.art || type).replace("<svg ", `<svg x="${-s / 2}" y="${-s * 0.96}" width="${s}" height="${s}" `) +
    `<g class="tdb-hp" transform="translate(0 ${-s - 10})"><rect x="-26" y="-4" width="52" height="7" rx="3" fill="#000" opacity="0.6"/><rect class="tdb-hp-bar" x="-25" y="-3" width="50" height="5" rx="2.5" fill="#ff5a4a"/></g>`;
  e.hpBar = e.el.querySelector(".tdb-hp-bar");
  tdb.enemies.push(e);
  if (!td.seen.includes(type) && !def.hidden) td.seen.push(type);
  if (def.boss && !tdb.bossesSeen.has(type)) { tdb.bossesSeen.add(type); toast(`⚠️ Cap: ${def.name}`, "bad"); }
  return e;
}
const tdbPos = e => tdb.path.at(e.dist);
const tdbVisible = e => !(e.def.stealth && e.dist < e.def.stealth * tdb.path.total) && !e.convertT && e.hp > 0;

function tdbDamage(e, amount, color = "#fff", big = false) {
  if (e.hp <= 0) return;
  amount *= 1 + e.vuln;
  e.hp -= amount;
  const [x, y] = tdbS(...tdbPos(e));
  tdbNumber(x, y - e.size, Math.round(amount), color, big);
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
  tdb.mana += e.def.mana + (byTower ? TD_DEFENDERS[byTower.id].manaOnKill || 0 : 0);
  tdb.saber += e.def.saber * (1 + 0.1 * td.upgrades.saber);
  if (e.def.splitInto) for (const off of [-18, 18]) tdbSpawn(e.def.splitInto, Math.max(0, e.dist + off));
  if (e.def.boss) tdbBossDown(e.type);
}
// Un cap derrotat dona el seu artefacte (o el puja de nivell si ja el tens)
function tdbBossDown(type) {
  const id = Object.keys(TD_ARTIFACTS).find(k => TD_ARTIFACTS[k].boss === type);
  if (!id) return;
  const had = td.artifacts[id] || 0;
  if (had >= 5) return;
  td.artifacts[id] = had + 1;
  if (!had && td.equipped.length < TD_ARTIFACT_SLOTS) td.equipped.push(id);
  tdb.artifactsWon.push(id);
  tdSave();
  $("tdb-student")?.classList.add("cheer");
  setTimeout(() => $("tdb-student")?.classList.remove("cheer"), 1200);
  toast(`${TD_ARTIFACTS[id].icon} ${had ? `${TD_ARTIFACTS[id].name} puja al nivell ${had + 1}` : `Artefacte nou: ${TD_ARTIFACTS[id].name}`}`, "good");
}

// ---------------------------------------------------------------- atacs
function tdbTargets(t, n = 1, mode = "first") {
  const [tx, ty] = tdb.world.slots[t.slot];
  const inRange = tdb.enemies.filter(e => tdbVisible(e) && Math.hypot(...tdbPos(e).map((v, i) => v - [tx, ty][i])) <= t.stats.range);
  if (mode === "smart") {
    const strong = inRange.filter(e => e.def.boss || e.maxHp >= 100);
    inRange.sort(strong.length ? (a, b) => b.hp - a.hp : (a, b) => b.def.speed - a.def.speed);
  } else inRange.sort((a, b) => b.dist - a.dist); // el que està més a prop del cristall
  return inRange.slice(0, n);
}
function tdbFire(t) {
  const d = TD_DEFENDERS[t.id], ab = t.stats.ability;
  const n = d.role === "multi" ? d.targets + (ab > 1 ? 1 : 0) : 1;
  const targets = tdbTargets(t, n, d.role === "smart" ? "smart" : "first");
  if (!targets.length) return false;
  t.shots++;
  // animació: la peça que llança (alterna esquerra / dreta si en té dues)
  t.side = d.alt ? 1 - t.side : 0;
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
  const shoot = target => tdbProjectile(t, target, t.stats.dmg, { part, depth: d.depth || 0, bounces: d.role === "bounce" ? d.bounces + (ab > 1 ? 1 : 0) : 0 });
  if (d.role === "burst") { t.burst = d.burst - 1; t.burstT = 0.12; t.burstTarget = targets[0]; shoot(targets[0]); }
  else targets.forEach(shoot);
  return true;
}
function tdbProjectile(t, target, dmg, opts = {}) {
  const d = TD_DEFENDERS[t.id];
  const [sx, sy] = opts.from || tdbThrowFrom(t, opts.part || "l");
  // la peça que es llança desapareix de la criatura mentre vola (es torna a formar en arribar)
  if (!opts.from && opts.part && opts.part !== "c") tdbPartOut(t, opts.part, 1);
  const p = { t, d, target, dmg, x: sx, y: sy, hit: new Set(), traveled: 0, ...opts };
  if (d.role === "pierce") { // la llança va recta en la direcció de l'objectiu i travessa
    const [ex, ey] = tdbPos(target);
    const len = Math.hypot(ex - sx, ey - sy) || 1;
    p.dir = [(ex - sx) / len, (ey - sy) / len];
  }
  p.el = el("g", { class: "tdb-proj" }, $("tdb-proj"));
  const art = TD_ART[t.id];
  p.scale = art.projScale || 1.25;
  p.el.innerHTML = `<g class="tdb-proj-in">${opts.part === "r" && art.projR ? art.projR : art.proj}</g>`;
  tdb.projs.push(p);
}
function tdbHit(p, e) {
  const d = p.d, ab = p.t.stats.ability;
  let dmg = p.dmg, color = TD_GLOW[d.subj] || "#fff", big = false;
  if (d.role === "crit" && Math.random() < d.crit) { dmg *= 2; color = "#ff8a1f"; big = true; }
  if (d.role === "scaling") dmg *= 1 + Math.min(d.maxScale, tdb.kills * d.perKill);
  if (d.role === "aoe") {
    const [x, y] = tdbPos(e);
    tdbFx("ring", ...tdbS(x, y), color, d.aoe * ab);
    for (const o of tdb.enemies) if (o.hp > 0 && !o.convertT && Math.hypot(...tdbPos(o).map((v, i) => v - [x, y][i])) <= d.aoe * ab) {
      if (d.slow) tdbSlow(o, d.slow, d.slowDur * ab);
      tdbDamage(o, dmg, color);
    }
    return;
  }
  if (d.role === "slow") tdbSlow(e, d.slow, d.slowDur * ab);
  if (d.role === "vuln") { e.vuln = Math.max(e.vuln, d.vuln); e.vulnT = d.vulnDur * ab; }
  if (d.role === "lasso") { e.stunT = Math.max(e.stunT, d.stun * ab); e.dot = d.dot; e.dotT = d.stun * ab; }
  const willDie = e.hp - dmg * (1 + e.vuln) <= 0;
  if (d.role === "execute" && !willDie && (e.hp - dmg * (1 + e.vuln)) / e.maxHp < d.execute * ab) {
    tdbNumber(...tdbS(...tdbPos(e)).map((v, i) => v - (i ? e.size : 0)), "det = 0", TD_GLOW.gold, true);
    tdbKill(e, p.t);
    return;
  }
  tdbDamage(e, dmg, color, big);
  // rebot: el raig salta a l'enemic més pròxim que encara no ha tocat
  if (p.bounces > 0) {
    const [x, y] = tdbPos(e);
    const next = tdb.enemies.filter(o => tdbVisible(o) && o !== e && !p.hit.has(o.uid))
      .map(o => [o, Math.hypot(...tdbPos(o).map((v, i) => v - [x, y][i]))]).filter(([, dd]) => dd < 180).sort((a, b) => a[1] - b[1])[0];
    if (next) { p.hit.add(e.uid); tdbProjectile(p.t, next[0], dmg * 0.85, { from: [x, y], bounces: p.bounces - 1, hit: p.hit }); }
  }
  // recursió: es dividix en dos projectils més menuts
  if (d.role === "split" && p.depth > 0) {
    const [x, y] = tdbPos(e);
    tdb.enemies.filter(o => tdbVisible(o) && o !== e).map(o => [o, Math.hypot(...tdbPos(o).map((v, i) => v - [x, y][i]))])
      .filter(([, dd]) => dd < 220).sort((a, b) => a[1] - b[1]).slice(0, d.splits)
      .forEach(([o]) => tdbProjectile(p.t, o, dmg * 0.6, { from: [x, y], depth: p.depth - 1 }));
  }
}
function tdbSlow(e, amount, dur) { e.slowMult = Math.min(e.slowMult, 1 - amount); e.slowT = Math.max(e.slowT, dur); }

function tdbSpecial(t, target) {
  const s = TD_DEFENDERS[t.id].special, ab = t.stats.ability;
  const [tx, ty] = tdb.world.slots[t.slot];
  if (s.type === "freeze") {
    const [x, y] = tdbPos(target);
    tdbFx("freeze", ...tdbS(x, y), "#9fe0ff", s.radius * ab);
    for (const e of tdb.enemies) if (e.hp > 0 && Math.hypot(...tdbPos(e).map((v, i) => v - [x, y][i])) <= s.radius * ab) e.stunT = Math.max(e.stunT, s.dur * ab);
  } else if (s.type === "align") {
    tdbFx("ring", ...tdbS(tx, ty), TD_GLOW.myth, t.stats.range);
    for (const e of tdb.enemies) if (tdbVisible(e) && Math.hypot(...tdbPos(e).map((v, i) => v - [tx, ty][i])) <= t.stats.range) {
      e.stunT = Math.max(e.stunT, s.dur * ab); e.vuln = Math.max(e.vuln, s.vuln); e.vulnT = s.vulnDur * ab;
    }
    tdbNumber(...tdbS(tx, ty - 120), "λ · diagonalitzat", TD_GLOW.myth, true);
  } else if (s.type === "convert") {
    const weak = tdbTargets(t, 20).filter(e => !e.def.boss).sort((a, b) => a.hp - b.hp)[0];
    if (weak) {
      weak.convertT = s.dur * ab;
      weak.el.classList.add("converted");
      tdbNumber(...tdbS(...tdbPos(weak)).map((v, i) => v - (i ? weak.size : 0)), "compilat!", TD_GLOW.gold, true);
    }
  }
}
// Stack Overflow: el desbordament explota per tot el mapa
function tdbBlast(t) {
  const d = TD_DEFENDERS[t.id];
  $("tdb-map").classList.remove("shake");
  void $("tdb-map").offsetWidth;
  $("tdb-map").classList.add("shake");
  tdbFx("blast", ...tdbS(...tdb.world.slots[t.slot]), "#ff8a1f", 900);
  for (const e of [...tdb.enemies]) if (e.hp > 0 && !e.convertT) tdbDamage(e, t.stats.dmg * d.blast * t.stats.ability, "#ff8a1f", true);
}

// Peces en vol de cada costat: quan torna l'última, la peça es torna a formar
function tdbPartOut(t, part, delta) {
  t.out = t.out || { l: 0, r: 0 };
  t.out[part] = Math.max(0, t.out[part] + delta);
  if (!t.svg) return;
  t.svg.classList.toggle(`thrown-${part}`, t.out[part] > 0);
  if (delta < 0 && t.out[part] === 0) {
    t.svg.classList.remove(`regrow-${part}`);
    void t.svg.getBoundingClientRect();
    t.svg.classList.add(`regrow-${part}`);
  }
}

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
function tdbNumber(x, y, text, color, big = false) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const fx = $("tdb-fx");
  if (fx.childElementCount > 60) return;
  const t = el("text", { x, y, class: `tdb-num${big ? " big" : ""}`, fill: color }, fx);
  t.textContent = text;
  setTimeout(() => t.remove(), 800);
}
function tdbFx(kind, x, y, color, r = 60) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const g = el("g", { class: `tdb-fx-${kind}`, transform: `translate(${x} ${y})` }, $("tdb-fx"));
  if (kind === "pop") g.innerHTML = [0, 60, 120, 180, 240, 300].map(a => `<line x1="0" y1="0" x2="${Math.cos(a * Math.PI / 180) * 26}" y2="${Math.sin(a * Math.PI / 180) * 26}" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`).join("");
  else if (kind === "summon") g.innerHTML = `<ellipse rx="70" ry="24" cy="34" fill="none" stroke="${color}" stroke-width="4"/><ellipse rx="40" ry="14" cy="34" fill="${color}" opacity="0.3"/>`;
  else g.innerHTML = `<circle r="${r}" fill="${color}" opacity="${kind === "blast" ? 0.18 : 0.12}" stroke="${color}" stroke-width="${kind === "freeze" ? 4 : 3}"/>`;
  setTimeout(() => g.remove(), kind === "blast" ? 700 : kind === "dissolve" ? 800 : 500);
  return g;
}

// ---------------------------------------------------------------- bucle
function tdbLoop(now) {
  if (!tdb || $("td-battle").hidden) return;
  const dt = Math.min((now - tdb.last) / 1000, 0.1);
  tdb.last = now;
  if (!tdb.over) {
    const speed = tdb.speed * tdDevSpeed;
    let left = dt * speed;
    while (left > 0) { const step = Math.min(left, 0.05); tdbUpdate(step); left -= step; }
  }
  tdbRender();
  requestAnimationFrame(tdbLoop);
}
function tdbUpdate(dt) {
  tdb.time += dt;
  // pausa entre onades
  if (!tdb.waveRunning && tdb.wave > 0 && tdb.pause > 0) {
    tdb.pause -= dt;
    if (tdb.pause <= 0) tdbStartWave();
  }
  // aparicions
  if (tdb.spawnQueue.length) {
    tdb.spawnT -= dt;
    while (tdb.spawnQueue.length && tdb.spawnT <= 0) {
      const [type, gap] = tdb.spawnQueue.shift();
      tdbSpawn(type);
      tdb.spawnT += gap;
    }
  }
  if (tdb.rushT > 0) tdb.rushT -= dt;
  // enemics
  for (const e of tdb.enemies) {
    if (e.hp <= 0) continue;
    for (const k of ["slowT", "vulnT", "dotT", "stunT"]) if (e[k] > 0) e[k] -= dt;
    if (e.slowT <= 0) e.slowMult = 1;
    if (e.vulnT <= 0) e.vuln = 0;
    if (e.dotT > 0) tdbDamage(e, e.dot * dt, "#c8f7dd");
    if (e.hp <= 0) continue;
    // aliat compilat: torna enrere i fa mal als que toca
    if (e.convertT > 0) {
      e.convertT -= dt;
      e.dist -= 70 * dt;
      const [x, y] = tdbPos(e);
      for (const o of tdb.enemies) if (o !== e && o.hp > 0 && !o.convertT && Math.hypot(...tdbPos(o).map((v, i) => v - [x, y][i])) < 50) tdbDamage(o, 30 * dt, TD_GLOW.gold);
      if (e.convertT <= 0 || e.dist <= 0) tdbKill(e);
      continue;
    }
    tdbEnemyAbility(e, dt);
    if (e.stunT > 0) continue;
    e.dist += e.def.speed * e.slowMult * (tdb.rushT > 0 ? 1.35 : 1) * dt;
    if (e.dist >= tdb.path.total) {
      e.hp = 0;
      e.el.remove();
      if (!tdb.god) tdb.lives -= e.def.lives;
      $("tdb-student")?.classList.add("hurt");
      setTimeout(() => $("tdb-student")?.classList.remove("hurt"), 500);
      if (tdb.lives <= 0) { tdb.lives = 0; tdbFinish(false); return; }
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
    t.cd -= dt;
    if (t.cd <= 0 && tdbFire(t)) t.cd = 1 / t.stats.rate;
    else if (t.cd < 0) t.cd = 0;
  }
  // projectils
  const speed = TD_BATTLE.projSpeed;
  for (const p of tdb.projs) {
    if (p.dir) { // llança que travessa
      p.x += p.dir[0] * speed * dt; p.y += p.dir[1] * speed * dt; p.traveled += speed * dt;
      for (const e of tdb.enemies) if (tdbVisible(e) && !p.hit.has(e.uid) && Math.hypot(...tdbPos(e).map((v, i) => v - [p.x, p.y][i])) < 40) { p.hit.add(e.uid); tdbHit(p, e); }
      if (p.traveled > p.t.stats.range * 1.3) p.done = true;
      continue;
    }
    if (!p.target || p.target.hp <= 0) { p.done = true; continue; }
    const [ex, ey] = tdbPos(p.target);
    const ty = ey - p.target.size * 0.45;
    const dx = ex - p.x, dy = ty - p.y, dd = Math.hypot(dx, dy);
    if (dd < speed * dt + 8) { p.done = true; tdbHit(p, p.target); continue; }
    p.x += dx / dd * speed * dt; p.y += dy / dd * speed * dt; p.ang = Math.atan2(dy, dx);
  }
  for (const p of tdb.projs) if (p.done) { p.el.remove(); if (!p.from && p.part && p.part !== "c") tdbPartOut(p.t, p.part, -1); }
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
}

// ---------------------------------------------------------------- onades
function tdbStartWave() {
  if (tdb.over || tdb.waveRunning || tdb.wave >= tdb.world.waves.length) return;
  tdb.wave++;
  tdb.waveRunning = true;
  tdb.pause = 0;
  tdb.spawnQueue = [];
  for (const [type, count, gap] of tdb.world.waves[tdb.wave - 1]) for (let i = 0; i < count; i++) tdb.spawnQueue.push([type, gap]);
  tdb.spawnT = 0.3;
  const w = td.worlds[tdb.world.id] || (td.worlds[tdb.world.id] = { best: 0, clears: 0 });
  w.best = Math.max(w.best, tdb.wave - 1);
  tdbBanner(`Onada ${tdb.wave}`);
}
function tdbWaveDone() {
  tdb.waveRunning = false;
  tdb.saber += TD_BATTLE.waveBonusSaber * tdb.wave;
  const w = td.worlds[tdb.world.id];
  w.best = Math.max(w.best, tdb.wave);
  tdSave();
  if (tdb.wave >= tdb.world.waves.length) { tdbFinish(true); return; }
  tdb.pause = TD_BATTLE.wavePause;
}
function tdbBanner(text) {
  const b = $("tdb-banner");
  b.textContent = text;
  b.classList.remove("show");
  void b.offsetWidth;
  b.classList.add("show");
}
// Fi del combat: el saber guanyat es queda sempre (també si perds o ixes)
function tdbFinish(won, quiet = false) {
  tdb.over = true;
  if (won) {
    tdb.saber += TD_BATTLE.worldBonusSaber;
    td.worlds[tdb.world.id].clears++;
  }
  const saber = Math.round(tdb.saber);
  td.saber += saber;
  tdSave();
  if (quiet) return;
  $("tdb-end-title").textContent = won ? "🏆 Món superat!" : "💥 El cristall s'ha trencat";
  $("tdb-end-body").innerHTML = `<p>Has arribat a l'onada <strong>${tdb.wave} / ${tdb.world.waves.length}</strong> i has eliminat <strong>${tdb.kills}</strong> distraccions.</p>
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
    e.el.classList.toggle("stealth", !!e.def.stealth && e.dist < e.def.stealth * tdb.path.total);
    e.el.classList.toggle("stunned", e.stunT > 0);
    e.el.classList.toggle("slowed", e.slowT > 0);
    e.el.classList.toggle("rushed", tdb.rushT > 0);
  }
  for (const p of tdb.projs) {
    const [x, y] = tdbS(p.x, p.y);
    const ang = p.dir ? Math.atan2(p.dir[1], p.dir[0]) : p.ang || 0;
    const rot = (ang * 180 / Math.PI + (tdb.portrait ? 90 : 0)) || 0;
    // les peces simètriques (+, punts, ×) no giren; les fletxes i llances, sí
    const turn = ["vector", "comentari", "ifelse", "determinant", "compilador"].includes(p.t.id) ? rot : 0;
    p.el.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${turn.toFixed(0)}) scale(${p.scale})`);
  }
  for (const t of Object.values(tdb.towers)) {
    t.el.classList.toggle("asleep", t.sleepT > 0);
    if (TD_DEFENDERS[t.id].role === "stacks") t.el.style.setProperty("--stacks", t.stacks);
  }
  tdbHud();
}
function tdbHud() {
  $("tdb-world").textContent = `${tdb.world.id}. ${tdb.world.name}`;
  $("tdb-wave").textContent = `${Math.max(1, tdb.wave)} / ${tdb.world.waves.length}`;
  $("tdb-lives").textContent = tdb.god ? "∞" : tdb.lives;
  $("tdb-lives-map") && ($("tdb-lives-map").textContent = tdb.god ? "∞" : tdb.lives);
  $("tdb-mana").textContent = Math.floor(tdb.mana);
  $("tdb-saber").textContent = fmtNum(Math.round(tdb.saber));
  const next = $("tdb-next");
  if (tdb.over) next.hidden = true;
  else if (tdb.wave === 0) { next.hidden = false; next.textContent = "▶ Començar"; }
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
    <div class="tdb-pick-cards">${td.team.map(id => {
      const d = TD_DEFENDERS[id];
      return `<button class="tdb-card rar-${d.rar}${tdb.pickId === id ? " sel" : ""}${tdb.mana < d.cost ? " poor" : ""}" data-card="${id}" aria-pressed="${tdb.pickId === id}">
        <span class="tdb-card-art">${tdCreatureSvg(id)}</span><span class="tdb-card-name">${d.name}</span><span class="tdb-card-cost">🔮 ${d.cost}</span></button>`;
    }).join("")}</div>${tdbPickInfo()}`;
}
// Fitxa de la criatura triada: el que fa i les dades, abans d'invocar-la
function tdbPickInfo() {
  const id = tdb.pickId;
  if (!id) return "";
  const d = TD_DEFENDERS[id], s = tdStats(id), can = tdb.mana >= d.cost;
  return `<div class="tdb-pick-info"><div class="tdb-panel-info"><strong>${d.name}</strong> <span class="td-stars">${"★".repeat(s.stars)}</span> · Nv. ${s.level}
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
  tdbSelectCard(td.team.find(id => TD_DEFENDERS[id].cost <= tdb.mana) || td.team[0]);
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
  const [x, y] = tdbS(...tdb.world.slots[tdb.pickSlot]);
  const g = el("g", { class: "tdb-ghost", transform: `translate(${x} ${y})` }, $("tdb-range"));
  g.innerHTML = tdCreatureSvg(id).replace("<svg ", `<svg x="-62" y="-92" width="124" height="124" `);
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
  for (const type of ["pointerover", "focusin"]) $("tdb-deck").addEventListener(type, ev => {
    const c = ev.target.closest("[data-card]");
    if (c) tdbPreview(c.dataset.card);
  });
  $("tdb-deck").addEventListener("pointerleave", () => { if (tdb?.pickId) tdbPreview(tdb.pickId); });
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
    tdb.speed = tdb.speed === 2 ? 1 : 2;
    $("tdb-speed").innerHTML = tdb.speed === 2 ? "⏩ ×2" : "▶ ×1";
    $("tdb-speed").classList.toggle("on", tdb.speed === 2);
  });
  $("tdb-exit").addEventListener("click", () => {
    if (!tdb.over && tdb.wave > 0 && !confirm("Eixir del combat? Et quedes el saber que has guanyat fins ara.")) return;
    tdCloseBattle();
  });
  $("tdb-end-lobby").addEventListener("click", () => tdCloseBattle());
  $("tdb-end-retry").addEventListener("click", () => { const w = tdb.world.id; tdCloseBattle(false); tdOpenBattle(w); });
  // si es gira la pantalla, es torna a pintar el mapa
  let lastPortrait = null;
  addEventListener("resize", () => {
    if (!tdBattleOpen()) return;
    const p = innerWidth < innerHeight * 0.9;
    if (p !== lastPortrait && p !== tdb.portrait) { lastPortrait = p; tdbBuildView(); }
  });
}
