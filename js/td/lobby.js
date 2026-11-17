// ===== ESTUDI: SALA (lobby) =====
// Sala arcana dibuixada (tools/sala-estudi.js → js/data/td-lobby-art.js). Cada objecte obri una finestreta:
//   altar → invocar · escriptori → apuntar l'estudi · grimori → criatures (nivells, equip) · faristol → bestiari
//   portal → mons · cristall → millores · estudiant → artefactes · rellotge de sorra → tornar a començar · porta → habitació
// Mentre s'està ací (o en combat), l'autoescola està parada.
const tdLobbyOpen = () => !$("td-lobby").hidden;
const tdOpen = () => tdLobbyOpen() || tdBattleOpen();
let tdSubj = "alg";       // camp triat als panells
let tdClass = {};         // assignatura triada dins de cada camp (prestatgeria d'estudi)

function tdOpenLobby() {
  if (typeof roomOpen === "function" && roomOpen()) closeRoom();
  $("td-lobby").hidden = false;
  document.body.classList.add("td-open");
  tdRenderLobby();
}
function tdCloseLobby() {
  tdClosePanel();
  $("td-lobby").hidden = true;
  document.body.classList.remove("td-open");
}

function tdRenderLobby() {
  const student = tdStudentSvg(td.equipped, `x="0" y="0" width="100" height="105"`);
  const spots = [];
  const layers = TD_LOBBY_ART.layers.map(l => {
    const svg = l.svg.replace("%STUDENT%", student);
    if (!l.spot) return svg;
    const [x, y, w, h] = l.hit;
    spots.push([w * h, `<rect class="hub-hit" data-td="${l.spot}" tabindex="0" role="button" aria-label="${l.title}" x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"><title>${l.title}</title></rect>`]);
    return `<g class="hub-art td-art" id="td-art-${l.spot}">${svg}</g>`;
  }).join("");
  $("td-lobby-scene").innerHTML = `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-label="Sala d'estudi"><defs>${TD_LOBBY_ART.defs}</defs>${layers}${spots.sort((x, y) => y[0] - x[0]).map(x => x[1]).join("")}</svg>`; // les zones menudes, damunt
  tdLobbyHud();
}
function tdLobbyHud() {
  $("td-saber").textContent = fmtNum(Math.floor(td.saber));
  $("td-perg").innerHTML = Object.entries(TD_SUBJECTS).map(([s, d]) => `<span title="Pergamins de ${d.name}">📜 ${d.short} <strong>${td.pergamins[s]}</strong></span>`).join("");
}

// ---------------------------------------------------------------- finestretes
const TD_PANELS = {
  gacha: "🔮 Altar d'invocació", study: "📚 Prestatgeria d'estudi", grimori: "📖 Grimori", bestiary: "👾 Bestiari",
  worlds: "🌀 Portal dels mons", upgrades: "💎 Cristall", student: "🐸 Estudiant",
};
function tdSpot(name) {
  if (name === "exit") { tdCloseLobby(); openRoom(); return; }
  if (name === "reset") { tdAskRestart(); return; }
  $("td-card").dataset.panel = name;
  if (name === "grimori" || name === "bestiary") tdBook = { tab: name === "grimori" ? tdSubj : "best", page: 0 };
  $("td-card-title").textContent = TD_PANELS[name];
  $("td-dialog").hidden = false;
  tdRenderPanel();
  $("td-card-close").focus();
}
function tdClosePanel() { $("td-dialog").hidden = true; }
function tdRenderPanel() {
  const name = $("td-card").dataset.panel;
  const body = $("td-card-body");
  body.innerHTML = ({ gacha: tdGachaHtml, study: tdStudyHtml, grimori: tdGrimoriHtml, bestiary: tdBestiaryHtml,
    worlds: tdWorldsHtml, upgrades: tdUpgradesHtml, student: tdStudentHtml })[name]();
  tdLobbyHud();
}
const tdSubjTabs = () => `<div class="td-tabs">${Object.entries(TD_SUBJECTS).map(([s, d]) =>
  `<button class="td-tab s-${s}${tdSubj === s ? " on" : ""}" data-subj="${s}">${d.icon} ${d.short}</button>`).join("")}</div>`;
const tdStarStr = n => `<span class="td-stars">${"★".repeat(n)}<span class="off">${"★".repeat(5 - n)}</span></span>`;

// ---- altar (invocar)
function tdGachaHtml() {
  const s = tdSubj, p = td.pity[s], n = td.pergamins[s];
  const pool = Object.entries(TD_DEFENDERS).filter(([, d]) => d.subj === s && d.rar !== "mitic");
  return `${tdSubjTabs()}
    <p class="td-hint">Cada pergamí de <strong>${TD_SUBJECTS[s].name}</strong> (${TD_SUBJECTS[s].classes.join(", ")}) invoca una criatura d'aquest camp. Els pergamins només s'aconseguixen estudiant.</p>
    <div class="td-gacha-pool">${pool.map(([id, d]) => `<div class="td-mini rar-${d.rar}" title="${d.name} (${TD_RARITIES[d.rar].name})">${tdCreatureSvg(id)}</div>`).join("")}</div>
    <div class="td-rates">${["comu", "rar", "epic", "llegendari"].map(r => `<span style="color:${TD_RARITIES[r].color}">${TD_RARITIES[r].name} ${String(TD_RARITIES[r].chance * 100).replace(".", ",")} %</span>`).join(" · ")}</div>
    <div class="td-pity"><span>Èpic garantit en <strong>${TD_PITY.epic - p.epic}</strong></span><span>Llegendari garantit en <strong>${TD_PITY.llegendari - p.llegendari}</strong></span></div>
    <div class="td-summon-btns">
      <button class="big td-summon" data-summon="1" ${n < 1 ? "disabled" : ""}>Invocar ×1 · 📜 1</button>
      <button class="big td-summon" data-summon="10" ${n < 10 ? "disabled" : ""}>Invocar ×10 · 📜 10</button></div>
    <p class="td-hint">Tens <strong>${n}</strong> pergamins de ${TD_SUBJECTS[s].short}. ${n < 1 ? "Ves a l'escriptori a apuntar el que has estudiat." : ""}</p>`;
}
function tdDoSummon(n) {
  const res = tdSummon(tdSubj, n);
  if (!res.length) return;
  tdReveal(res);
  tdRenderPanel();
}
// ---------------------------------------------------------------- pantalla d'invocació
// Cada criatura té la seua cerimònia: el cercle de runes es carrega (més llarg i fosc com més rara és), el pergamí
// es crema en un esclat, ix un raig del color de la raresa i la criatura es materialitza. Tocar: avança (o accelera la
// càrrega, menys en llegendàries i mítiques). «Saltar» passa les normals però s'atura en cada llegendària o mítica.
// La mítica té la seua pròpia cerimònia: es munta peça a peça (cercle, traços, nucli i la peça que llança).
let tdsRun = null;
const TDS_CHARGE = { comu: 900, rar: 1000, epic: 1500, llegendari: 2400, mitic: 3600 };
const TDS_BIG = ["llegendari", "mitic"]; // aquestes no es poden saltar: es veu tota la cerimònia
// Símbols del cercle segons l'assignatura (repartits pel cercle, fins i rectes)
const TDS_GLYPHS = { alg: ["+", "×", "λ", "Σ", "det", "[ ]", "Aᵀ", "v⃗", "−", "∑"], prg: [";", "{ }", "if", "for", "//", "</>", "( )", "==", "[i]", "++"] };
function tdsGlyphs(subj) {
  const list = TDS_GLYPHS[subj] || TDS_GLYPHS.alg;
  document.querySelector("#td-summon .tds-glyphs").innerHTML = list.map((t, i) => {
    const a = i / list.length * Math.PI * 2 - Math.PI / 2;
    return `<text x="${(Math.cos(a) * 137).toFixed(1)}" y="${(Math.sin(a) * 137).toFixed(1)}" transform="rotate(${(a * 180 / Math.PI + 90).toFixed(1)} ${(Math.cos(a) * 137).toFixed(1)} ${(Math.sin(a) * 137).toFixed(1)})">${t}</text>`;
  }).join("");
}
function tdReveal(results) {
  clearTimeout(tdsRun?.timer);
  tdsRun = { res: results, i: -1, phase: "", skipping: false };
  const box = $("td-summon");
  box.hidden = false;
  box.querySelector(".tds-summary").hidden = true;
  box.dataset.subj = TD_DEFENDERS[results[0].id].subj;
  tdsGlyphs(box.dataset.subj);
  $("tds-skip").hidden = results.length < 2;
  tdsNext();
}
// «Saltar»: passa de llarg les normals, però s'atura en cada llegendària o mítica perquè es veja; després, el resum
function tdsSkip() {
  if (!tdsRun) return;
  tdsRun.skipping = true;
  const cur = tdsRun.res[tdsRun.i];
  if (cur && TD_BIG_SHOWN(cur) && tdsRun.phase === "charging") return; // ja s'està mostrant una gran
  clearTimeout(tdsRun.timer);
  tdsNext();
}
const TD_BIG_SHOWN = r => TDS_BIG.includes(TD_DEFENDERS[r.id].rar);
function tdsNext() {
  const run = tdsRun;
  run.i++;
  if (run.skipping) while (run.i < run.res.length && !TD_BIG_SHOWN(run.res[run.i])) run.i++;
  if (run.i >= run.res.length) { run.res.length > 1 ? tdsSummary() : tdsClose(); return; }
  const r = run.res[run.i], d = TD_DEFENDERS[r.id], box = $("td-summon");
  box.className = `rar-${d.rar}${d.rar === "mitic" ? " assemble" : ""}`;
  box.style.setProperty("--rc", TD_RARITIES[d.rar].color);
  box.querySelector(".tds-creature").innerHTML = tdCreatureSvg(r.id);
  box.querySelector(".tds-rar").textContent = TD_RARITIES[d.rar].name;
  box.querySelector(".tds-name").textContent = d.name;
  box.querySelector(".tds-tag").innerHTML = r.isNew ? "NOVA!" : r.starUp ? `Puja a ${tdStarStr(r.stars)}` : r.saber ? `Repetida al màxim: +${r.saber} ✨` : `Còpia · ${tdStarStr(r.stars)}`;
  box.querySelector(".tds-desc").textContent = d.desc;
  box.querySelector(".tds-count").textContent = run.res.length > 1 ? `${run.i + 1} / ${run.res.length}` : "";
  void box.offsetWidth; // reinicia les animacions
  box.classList.add("charging");
  run.phase = "charging";
  run.timer = setTimeout(tdsShow, TDS_CHARGE[d.rar]);
}
function tdsShow() {
  const box = $("td-summon");
  clearTimeout(tdsRun.timer);
  box.classList.remove("charging");
  void box.offsetWidth;
  box.classList.add("shown");
  tdsRun.phase = "shown";
}
function tdsSummary() {
  const box = $("td-summon");
  box.className = "summary";
  box.querySelector(".tds-cards").innerHTML = tdsRun.res.map((r, i) => {
    const d = TD_DEFENDERS[r.id];
    return `<div class="td-rcard rar-${d.rar}" style="animation-delay:${i * 0.06}s"><div class="td-rcard-art">${tdCreatureSvg(r.id)}</div>
      <div class="td-rcard-name">${d.name}</div><div class="td-rcard-tag">${r.isNew ? "NOVA!" : r.starUp ? `★ ${r.stars}` : r.saber ? `+${r.saber} ✨` : tdStarStr(r.stars)}</div></div>`;
  }).join("");
  box.querySelector(".tds-summary").hidden = false;
  tdsRun.phase = "summary";
}
function tdsClose() {
  clearTimeout(tdsRun?.timer);
  tdsRun = null;
  $("td-summon").hidden = true;
  if (!$("td-dialog").hidden) tdRenderPanel();
}
function tdsTap(ev) {
  if (!tdsRun || ev.target.closest("#tds-skip, #tds-done")) return;
  const big = TD_BIG_SHOWN(tdsRun.res[tdsRun.i] || tdsRun.res[0]);
  if (tdsRun.phase === "charging" && !big) tdsShow(); // les llegendàries i mítiques no s'acceleren
  else if (tdsRun.phase === "shown") tdsNext();
}

// ---- escriptori (apuntar l'estudi)
function tdStudyHtml() {
  const s = tdSubj, left = tdDailyLeft(s), cls = tdClass[s] || TD_SUBJECTS[s].classes[0];
  const log = td.log.filter(l => l.subj === s).slice(0, 6);
  return `${tdSubjTabs()}
    <div class="td-classes">${TD_SUBJECTS[s].classes.map(c => `<button class="tdbook-filter${c === cls ? " on" : ""}" data-cls="${c}">${c}</button>`).join("")}</div>
    <p class="td-hint">Apunta el que has fet de <strong>${cls}</strong>: els pergamins són de ${TD_SUBJECTS[s].name}. Et queden <strong>${left}</strong> per a hui en aquest camp (sense comptar els exàmens).</p>
    <div class="td-acts">${TD_ACTIVITIES.map(a => `<button class="td-act" data-act="${a.id}" ${left <= 0 ? "disabled" : ""}><span>${a.icon}</span>${a.name}<strong>+${a.rolls} 📜</strong></button>`).join("")}</div>
    <div class="td-exam"><label>Nota de l'examen <input type="number" id="td-nota" min="0" max="10" step="0.1" placeholder="7,5"></label>
      <button class="secondary" data-exam="parcial">📄 Parcial</button><button data-exam="final">🎓 Final</button></div>
    <p class="td-hint">Parcial o final: 5 → 3 pergamins … 10 → 10. Amb un <strong>${TD_MYTHIC_GRADE} o més al final</strong>, la criatura mítica del camp.</p>
    ${log.length ? `<ul class="td-log">${log.map(l => `<li>${l.what} <span>+${l.rolls} 📜${l.mythic ? " · ✨ mític" : ""}</span></li>`).join("")}</ul>` : ""}`;
}
function tdDoStudy(actId) {
  const r = tdRegisterStudy(tdSubj, actId, tdClass[tdSubj] || TD_SUBJECTS[tdSubj].classes[0]);
  if (!r) return;
  if (r.rolls) toast(`📜 +${r.rolls} pergamins de ${TD_SUBJECTS[tdSubj].short}${r.capped ? " (has arribat al límit d'avui)" : ""}`, "good");
  else toast("Ja has arribat al límit d'avui per a aquest camp", "bad");
  tdRenderPanel();
}
function tdDoExam(kind) {
  const nota = Number(String($("td-nota").value).replace(",", "."));
  if (!(nota >= 0 && nota <= 10) || $("td-nota").value === "") { toast("Escriu una nota de 0 a 10", "bad"); return; }
  const r = tdRegisterExam(tdSubj, nota, kind === "final", tdClass[tdSubj] || TD_SUBJECTS[tdSubj].classes[0]);
  toast(`📜 +${r.rolls} pergamins de ${TD_SUBJECTS[tdSubj].short}`, "good");
  if (r.mythic) tdReveal([r.mythic]);
  tdRenderPanel();
}

// ---- llibres (grimori i bestiari): una criatura o distracció per doble pàgina; es passa pàgina
// Marcapàgines: una assignatura per marcapàgines (cada una amb el seu paper) i, al grimori, l'equip.
let tdBook = { tab: "alg", page: 0 };
let tdTeamFilter = "all"; // filtre de «Les teues criatures»: all · fav · alg · prg
const TD_RAR_ORDER = ["comu", "rar", "epic", "llegendari", "mitic"];
function tdBookList(kind, tab) {
  if (kind === "bestiary") return Object.keys(TD_ENEMIES).filter(id => !TD_ENEMIES[id].hidden);
  return Object.keys(TD_DEFENDERS).filter(id => TD_DEFENDERS[id].subj === tab).sort((a, b) => TD_RAR_ORDER.indexOf(TD_DEFENDERS[a].rar) - TD_RAR_ORDER.indexOf(TD_DEFENDERS[b].rar));
}
function tdBookHtml(kind) {
  const tabs = kind === "bestiary" ? [] : [...Object.entries(TD_SUBJECTS).map(([s, d]) => [s, `${d.icon} ${d.short}`]), ["team", "⚔️ Equip"]];
  const tab = kind === "bestiary" ? "best" : tdBook.tab;
  const theme = kind === "bestiary" ? "best" : tab;
  let left, right, nav = "";
  if (tab === "team") [left, right] = tdTeamPages();
  else {
    // al grimori, cada assignatura comença amb un índex
    const list = kind === "bestiary" ? tdBookList(kind, tab) : ["index", ...tdBookList(kind, tab)];
    tdBook.page = Math.max(0, Math.min(tdBook.page, list.length - 1));
    const id = list[tdBook.page];
    [left, right] = kind === "bestiary" ? tdBeastPages(id) : id === "index" ? tdIndexPages(tab, list.slice(1)) : tdCreaturePages(id);
    nav = `${kind !== "bestiary" && tdBook.page > 0 ? `<button class="secondary small tdbook-toindex" data-goto="0">☰ Índex</button>` : ""}<button class="tdbook-turn prev" data-bk="prev" ${tdBook.page === 0 ? "disabled" : ""} aria-label="Pàgina anterior">◀</button>
      <span class="tdbook-num">${tdBook.page + 1} / ${list.length}</span>
      <button class="tdbook-turn next" data-bk="next" ${tdBook.page >= list.length - 1 ? "disabled" : ""} aria-label="Pàgina següent">▶</button>`;
  }
  return `<div class="tdbook theme-${theme}">
    ${tabs.length ? `<div class="tdbook-tabs">${tabs.map(([t, l]) => `<button class="tdbook-tab tab-${t}${t === tab ? " on" : ""}" data-bktab="${t}">${l}</button>`).join("")}</div>` : ""}
    <div class="tdbook-spread"><div class="tdbook-page left">${left}</div><div class="tdbook-spine"></div><div class="tdbook-page right">${right}</div></div>
    <div class="tdbook-nav">${nav}</div></div>`;
}
// Índex del camp: a l'esquerra, la introducció; a la dreta, l'índex (només text i pàgina).
// Les que no tens ixen amb interrogants.
const TD_FIELD_INTRO = {
  alg: "Criatures fetes de símbols matemàtics: sumes, vectors, matrius i determinants que prenen vida amb el que estudies. Colpegen fort i controlen el camí.",
  prg: "Criatures fetes de codi: puntuació, condicions, recursions i compiladors. Ràpides, llestes i plenes de trucs.",
};
function tdIndexPages(tab, list) {
  const f = TD_SUBJECTS[tab], have = list.filter(id => td.owned[id]).length;
  const row = (id, i) => {
    const d = TD_DEFENDERS[id], o = td.owned[id];
    return `<li><button class="tdbook-idx${o ? "" : " unknown"}" data-goto="${i + 1}" style="--rc:${TD_RARITIES[d.rar].color}">
      <span class="tdbook-idx-name">${o ? d.name : "???"}</span><span class="tdbook-idx-rar">${TD_RARITIES[d.rar].name}</span>
      <span class="tdbook-idx-dots"></span><span class="tdbook-idx-pg">${i + 2}</span></button></li>`;
  };
  return [`<div class="tdbook-intro"><div class="tdbook-intro-icon">${f.icon}</div><h3 class="tdbook-name">${f.name}</h3>
      <p class="tdbook-text">${TD_FIELD_INTRO[tab] || ""}</p>
      <p class="tdbook-text muted"><strong>Assignatures:</strong> ${f.classes.join(", ")}.</p>
      <p class="tdbook-text muted">Invoca-les a l'altar amb pergamins de ${f.name}; la mítica, amb un ${TD_MYTHIC_GRADE} o més en un examen final.</p>
      <p class="tdbook-intro-count">En tens <strong>${have}</strong> de <strong>${list.length}</strong></p></div>`,
    `<h3 class="tdbook-name">Índex</h3><ol class="tdbook-index">${list.map(row).join("")}</ol>`];
}
function tdCreaturePages(id) {
  const d = TD_DEFENDERS[id], o = td.owned[id], r = TD_RARITIES[d.rar];
  if (!o) return [`<div class="tdbook-art locked" style="--rc:${r.color}"><span class="tdbook-q">?</span></div><h3 class="tdbook-name">???</h3><div class="tdbook-rar" style="color:${r.color}">${r.name}</div>`,
    `<p class="tdbook-text">Encara no has invocat aquesta criatura.</p><p class="tdbook-text muted">${d.rar === "mitic" ? `Només es pot aconseguir traent un ${TD_MYTHIC_GRADE} o més a l'examen final d'una assignatura de ${TD_SUBJECTS[d.subj].name} (${TD_SUBJECTS[d.subj].classes.join(", ")}).` : `Pot eixir a l'altar, amb pergamins de ${TD_SUBJECTS[d.subj].name}.`}</p>`];
  const st = tdStats(id), next = tdNextStar(id), cap = tdLevelCap(id);
  const cost = o.level < cap ? tdLevelCost(d.rar, o.level) : null;
  // millores de l'habilitat: per estreles i per nivell
  const steps = [...TD_ABILITY_LEVELS.map(l => [`Nv. ${l}`, o.level >= l]), ["★3", st.stars >= 3], ["★5", st.stars >= 5]];
  const lvlBtn = cost != null ? `<button data-lvl="${id}" ${td.saber < cost ? "disabled" : ""}>⬆ Nv. ${o.level + 1} · ✨ ${fmtNum(cost)}</button>`
    : `<button disabled>${o.level >= TD_LEVEL_MAX ? "Nivell màxim" : `Cal ★${st.stars + 1}`}</button>`;
  return [`<div class="tdbook-demo" data-demo="${id}"><div class="tdbook-art rar-${d.rar}">${tdCreatureSvg(id)}</div><div class="tdbook-lane"></div></div>
      <h3 class="tdbook-name">${d.name}</h3>
      <div class="tdbook-rar" style="color:${r.color}">${r.name}</div><div class="tdbook-stars">${tdStarStr(st.stars)}</div>
      <div class="tdbook-prog" title="Còpies per a la següent estrela"><div style="width:${next ? Math.min(100, 100 * next.have / next.need) : 100}%"></div>
        <span>${next ? `${next.have} / ${next.need}` : "MÀX"}</span></div>`,
    `<p class="tdbook-text">${d.desc}</p>
     <table class="tdbook-stats"><tr><th>Nivell</th><td>${o.level} / ${cap}${cap < TD_LEVEL_MAX ? ` <span class="muted">(més amb ★${st.stars + 1})</span>` : ""}</td></tr><tr><th>Dany</th><td>${fmtNum(st.dmg)}</td></tr>
       <tr><th>Velocitat</th><td>${st.rate.toFixed(2)} / s</td></tr><tr><th>Abast</th><td>${Math.round(st.range)}</td></tr><tr><th>Cost</th><td>🔮 ${d.cost}</td></tr>
       <tr><th>Habilitat</th><td>×${st.ability.toFixed(2).replace(".", ",")} <span class="tdbook-steps">${steps.map(([t, on]) => `<span class="${on ? "on" : ""}">${t}</span>`).join("")}</span></td></tr></table>
     <div class="tdbook-btns">${lvlBtn}
       <button class="secondary" data-team="${id}" title="${td.team.includes(id) ? "Traure de l'equip" : "Posar a l'equip"}">${td.team.includes(id) ? "➖" : "➕"}<span class="lbl"> Equip</span></button>
       <button class="secondary tdbook-fav${td.favs.includes(id) ? " on" : ""}" data-fav="${id}" aria-pressed="${td.favs.includes(id)}" title="Preferida: ix primer a la llista de l'equip">${td.favs.includes(id) ? "★" : "☆"}<span class="lbl"> Preferida</span></button></div>`];
}
function tdBeastPages(id) {
  const e = TD_ENEMIES[id], seen = td.seen.includes(id);
  if (!seen) return [`<div class="tdbook-art locked">${tdEnemySvg(id)}</div><h3 class="tdbook-name">???</h3>`, `<p class="tdbook-text">Encara no t'ha atacat.</p>`];
  return [`<div class="tdbook-art">${tdEnemySvg(id)}</div><h3 class="tdbook-name">${e.name}</h3>${e.boss ? '<div class="tdbook-rar boss">CAP</div>' : ""}`,
    `<p class="tdbook-text tdbook-lore">${e.lore || ""}</p><p class="tdbook-text"><strong>Habilitat:</strong> ${e.desc}</p><table class="tdbook-stats"><tr><th>Vida</th><td>${e.hp} <span class="muted">(+${TD_WAVE_HP * 100} % per onada)</span></td></tr>
      <tr><th>Velocitat</th><td>${e.speed}</td></tr><tr><th>Dany al cristall</th><td>${e.lives}</td></tr><tr><th>Maná en morir</th><td>🔮 ${e.mana}</td></tr></table>`];
}
function tdTeamPages() {
  const slots = Array.from({ length: 6 }, (_, i) => td.team[i]);
  // les preferides, primer; després, per assignatura i raresa
  const owned = Object.keys(TD_DEFENDERS).filter(id => td.owned[id])
    .filter(id => tdTeamFilter === "all" || (tdTeamFilter === "fav" ? td.favs.includes(id) : TD_DEFENDERS[id].subj === tdTeamFilter))
    .sort((a, b) => (td.favs.includes(b) - td.favs.includes(a)) || 0);
  const filters = [["all", "Totes"], ["fav", "★ Preferides"], ...Object.entries(TD_SUBJECTS).map(([s, d]) => [s, `${d.icon} ${d.short}`])];
  return [`<h3 class="tdbook-name">Equip</h3><p class="tdbook-text muted">Les 6 criatures que portes al combat. Toca'n una per a traure-la.</p>
      <div class="tdbook-team">${slots.map(id => id ? `<button class="tdbook-tslot rar-${TD_DEFENDERS[id].rar}" data-team="${id}" title="Traure ${TD_DEFENDERS[id].name}">${tdCreatureSvg(id)}<span>${TD_DEFENDERS[id].name}</span><span class="tdbook-cost">🔮 ${TD_DEFENDERS[id].cost}</span></button>`
        : `<div class="tdbook-tslot empty">+</div>`).join("")}</div>`,
    `<h3 class="tdbook-name">Les teues criatures</h3>
      <div class="tdbook-filters">${filters.map(([f, l]) => `<button class="tdbook-filter${tdTeamFilter === f ? " on" : ""}" data-filter="${f}">${l}</button>`).join("")}</div>
      ${owned.length ? "" : `<p class="tdbook-text muted">${tdTeamFilter === "fav" ? "Encara no tens preferides: marca-les amb ☆ a les pàgines del grimori." : "No en tens cap d'aquest camp."}</p>`}
      <div class="tdbook-owned">${owned.map(id => `<button class="tdbook-mini rar-${TD_DEFENDERS[id].rar}${td.team.includes(id) ? " inteam" : ""}${td.favs.includes(id) ? " fav" : ""}" data-team="${id}" title="${TD_DEFENDERS[id].name} · ${TD_DEFENDERS[id].cost} de maná">${tdCreatureSvg(id)}<span class="tdbook-cost">🔮 ${TD_DEFENDERS[id].cost}</span></button>`).join("")}</div>`];
}
// Passar pàgina com en un llibre de veritat: la fulla gira sobre el llom (davant, la pàgina vella; darrere, la nova)
// i el que hi ha davall no canvia fins que la fulla cau. En mòbil (una pàgina damunt de l'altra), es fon.
function tdTurnPage(dir, to = null) {
  const spread = document.querySelector(".tdbook-spread");
  if (!spread || spread.dataset.turning) return;
  if (to != null) { if (to === tdBook.page) return; dir = to > tdBook.page ? 1 : -1; }
  const oldL = spread.querySelector(".left").innerHTML, oldR = spread.querySelector(".right").innerHTML;
  tdBook.page = to != null ? to : tdBook.page + dir;
  tdRenderPanel();
  const sp = document.querySelector(".tdbook-spread");
  if (getComputedStyle(sp).gridTemplateColumns.split(" ").length < 3) { sp.classList.add("fade-in"); return; }
  sp.dataset.turning = "1";
  const under = sp.querySelector(dir > 0 ? ".left" : ".right"), newUnder = under.innerHTML;
  const newFace = sp.querySelector(dir > 0 ? ".left" : ".right").innerHTML;
  under.innerHTML = dir > 0 ? oldL : oldR; // davall, la pàgina vella fins que la tapa la fulla
  const leaf = document.createElement("div");
  leaf.className = `tdbook-leaf ${dir > 0 ? "next" : "prev"}`;
  leaf.innerHTML = `<div class="tdbook-page face front ${dir > 0 ? "right" : "left"}">${dir > 0 ? oldR : oldL}</div>
    <div class="tdbook-page face back ${dir > 0 ? "left" : "right"}">${newFace}</div>`;
  sp.appendChild(leaf);
  leaf.addEventListener("animationend", () => {
    under.innerHTML = newUnder;
    leaf.remove();
    delete sp.dataset.turning;
  }, { once: true });
}
function tdToggleTeam(id) {
  if (!td.owned[id]) return;
  if (td.team.includes(id)) {
    if (td.team.length <= 1) { toast("Cal almenys una criatura a l'equip", "bad"); return; }
    td.team = td.team.filter(t => t !== id);
  } else {
    if (td.team.length >= 6) { toast("L'equip ja té 6 criatures: trau-ne una abans", "bad"); return; }
    td.team.push(id);
  }
  tdSave();
  tdRenderPanel();
}
const tdBestiaryHtml = () => tdBookHtml("bestiary");
const tdGrimoriHtml = () => tdBookHtml("grimori");

// ---- portal (mons)
function tdWorldsHtml() {
  return `<p class="td-hint">Cada món té 10 onades i dos caps, que deixen artefactes per a l'estudiant. El saber que guanyes es queda sempre, encara que perdes.</p>
    <div class="td-worlds">${TD_WORLDS.map(w => {
      const p = td.worlds[w.id] || { best: 0, clears: 0 };
      return `<div class="td-world${w.soon ? " locked" : ""}"><div><strong>${w.id}. ${w.name}</strong> <span class="muted">· ${w.layout}</span>
        <div class="muted">${w.soon ? "Pròximament" : `Millor onada: ${p.best} / ${w.waves.length}${p.clears ? ` · superat ${p.clears}×` : ""}`}</div></div>
        ${w.soon ? "<span>🔒</span>" : `<button data-play="${w.id}">▶ Jugar</button>`}</div>`;
    }).join("")}</div>
    <p class="td-hint">Equip: ${td.team.map(id => `<span class="td-chip rar-${TD_DEFENDERS[id].rar}">${TD_DEFENDERS[id].name}</span>`).join(" ")}</p>`;
}

// ---- cristall (millores)
function tdUpgradesHtml() {
  return `<p class="td-hint">Millores permanents, amb el saber que guanyes als mons. Tens ✨ <strong>${fmtNum(Math.floor(td.saber))}</strong>.</p>
    <div class="td-ups">${Object.entries(TD_UPGRADES).map(([id, u]) => {
      const lvl = td.upgrades[id], max = lvl >= u.max, cost = tdUpgradeCost(id);
      return `<div class="td-up"><span class="td-up-icon">${u.icon}</span><div><strong>${u.name}</strong> <span class="muted">${lvl} / ${u.max}</span><div class="muted">${u.desc}</div></div>
        <button data-up="${id}" ${max || td.saber < cost ? "disabled" : ""}>${max ? "Màxim" : `✨ ${fmtNum(cost)}`}</button></div>`;
    }).join("")}</div>`;
}

// ---- estudiant (artefactes)
function tdStudentHtml() {
  const owned = Object.keys(td.artifacts);
  return `<div class="td-student-row"><div class="td-student-big">${tdStudentSvg(td.equipped)}</div>
    <div><p class="td-hint">L'estudiant mira la partida des d'una cantonada del mapa i porta fins a <strong>${TD_ARTIFACT_SLOTS}</strong> artefactes, que milloren totes les criatures. Els caps els deixen; si en tornes a derrotar un, el seu artefacte puja de nivell (fins al 5).</p>
    <div class="td-slots">${Array.from({ length: TD_ARTIFACT_SLOTS }, (_, i) => { const id = td.equipped[i];
      return `<div class="td-aslot">${id ? `${TD_ARTIFACTS[id].icon}<small>${TD_ARTIFACTS[id].name}</small>` : "<small>buit</small>"}</div>`; }).join("")}</div></div></div>
    ${owned.length ? `<div class="td-arts">${owned.map(id => { const a = TD_ARTIFACTS[id], on = td.equipped.includes(id);
      return `<div class="td-art-row"><span class="td-up-icon">${a.icon}</span><div><strong>${a.name}</strong> <span class="muted">nivell ${td.artifacts[id]}</span><div class="muted">${a.desc(td.artifacts[id])}</div></div>
        <button class="${on ? "secondary" : ""}" data-equip="${id}">${on ? "Llevar" : "Posar"}</button></div>`; }).join("")}</div>`
      : `<p class="td-hint">Encara no tens artefactes. Derrota els caps dels mons (onades 5 i 10).</p>`}`;
}
function tdToggleEquip(id) {
  if (!td.artifacts[id]) return;
  if (td.equipped.includes(id)) td.equipped = td.equipped.filter(a => a !== id);
  else if (td.equipped.length < TD_ARTIFACT_SLOTS) td.equipped.push(id);
  else { toast(`L'estudiant ja porta ${TD_ARTIFACT_SLOTS} artefactes`, "bad"); return; }
  tdSave();
  tdRenderPanel();
}

// ---- rellotge de sorra (tornar a començar sense perdre el que has guanyat estudiant)
function tdAskRestart() {
  if (!confirm("Tornar a començar el joc d'estudi?\n\nEs conserven les criatures (còpies i estreles), els pergamins, els artefactes, l'equip i el que has apuntat.\nEs perden el saber, els nivells de les criatures, les millores del cristall i el progrés dels mons.")) return;
  tdRestart();
  tdRenderLobby();
  toast("⏳ Has tornat a començar. Les criatures continuen amb tu.", "good");
}

function initTdLobby() {
  tdLoad();
  const scene = $("td-lobby-scene");
  const activate = ev => { const s = ev.target.closest("[data-td]"); if (s) tdSpot(s.dataset.td); };
  scene.addEventListener("click", activate);
  $("td-lobby-actions").addEventListener("click", activate);
  scene.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); activate(ev); } });
  const highlight = (ev, on) => { const s = ev.target.closest?.(".hub-hit"); if (s) $(`td-art-${s.dataset.td}`)?.classList.toggle("hot", on); };
  for (const [type, on] of [["pointerover", true], ["pointerout", false], ["focusin", true], ["focusout", false]]) scene.addEventListener(type, ev => highlight(ev, on));
  $("btn-td-home").addEventListener("click", () => { tdCloseLobby(); openRoom(); });
  $("td-card-close").addEventListener("click", tdClosePanel);
  $("td-dialog").addEventListener("click", ev => { if (ev.target === $("td-dialog")) tdClosePanel(); });
  $("td-summon").addEventListener("click", tdsTap);
  $("tds-skip").addEventListener("click", tdsSkip);
  $("tds-done").addEventListener("click", tdsClose);
  $("td-card-body").addEventListener("click", ev => {
    const b = ev.target.closest("button");
    if (!b || b.disabled) return;
    const ds = b.dataset;
    if (ds.subj) { tdSubj = ds.subj; tdRenderPanel(); }
    else if (ds.cls) { tdClass[tdSubj] = ds.cls; tdRenderPanel(); }
    else if (ds.bktab) { tdBook = { tab: ds.bktab, page: 0 }; tdRenderPanel(); }
    else if (ds.bk) tdTurnPage(ds.bk === "next" ? 1 : -1);
    else if (ds.goto != null) tdTurnPage(0, Number(ds.goto));
    else if (ds.filter) { tdTeamFilter = ds.filter; tdRenderPanel(); }
    else if (ds.fav) { td.favs = td.favs.includes(ds.fav) ? td.favs.filter(f => f !== ds.fav) : [...td.favs, ds.fav]; tdSave(); tdRenderPanel(); }
    else if (ds.summon) tdDoSummon(Number(ds.summon));
    else if (ds.act) tdDoStudy(ds.act);
    else if (ds.exam) tdDoExam(ds.exam);
    else if (ds.lvl) {
      if (tdLevelUp(ds.lvl)) {
        if (TD_ABILITY_LEVELS.includes(td.owned[ds.lvl].level)) toast(`✨ ${TD_DEFENDERS[ds.lvl].name}: l'habilitat especial millora!`, "good");
        tdRenderPanel();
      }
    }
    else if (ds.team) tdToggleTeam(ds.team);
    else if (ds.play) { tdClosePanel(); tdOpenBattle(Number(ds.play)); }
    else if (ds.up) { if (tdBuyUpgrade(ds.up)) tdRenderPanel(); }
    else if (ds.equip) tdToggleEquip(ds.equip);
  });
  document.addEventListener("keydown", ev => {
    if (!tdLobbyOpen()) return;
    if ((ev.key === "ArrowRight" || ev.key === "ArrowLeft") && !$("td-dialog").hidden) {
      const b = document.querySelector(`.tdbook-turn.${ev.key === "ArrowRight" ? "next" : "prev"}`);
      if (b && !b.disabled) tdTurnPage(ev.key === "ArrowRight" ? 1 : -1);
      return;
    }
    if (ev.key !== "Escape") return;
    if (!$("td-summon").hidden) tdsClose();
    else if (!$("td-dialog").hidden) tdClosePanel();
  });
}

// ---- demostració al grimori: enemics del món 1 caminen pel carril cap a la criatura, que els ataca com al combat.
// Quants i com es col·loquen depén de la criatura (en filera per a les que travessen, en grup per a les de zona…).
const TD_DEMO_SETUP = {
  pierce: { n: 4, gap: 30 }, aoe: { n: 4, gap: 22, spread: 14 }, split: { n: 3, gap: 55 }, smart: { n: 3, gap: 60, mix: true },
  execute: { n: 2, gap: 90 }, stacks: { n: 4, gap: 45 }, default: { n: 2, gap: 80 },
};
let tdDemo = null;
function tdDemoStart(box) {
  const id = box.dataset.demo, d = TD_DEFENDERS[id], lane = box.querySelector(".tdbook-lane");
  const set = TD_DEMO_SETUP[d.role] || TD_DEMO_SETUP.default;
  tdDemo = { box, id, d, lane, set, st: tdStats(id), enemies: [], shots: [], cd: 0.6, side: 0, n: 0, aimA: 0, last: performance.now(), stacks: 0 };
  for (let i = 0; i < set.n; i++) tdDemoSpawn(i);
}
function tdDemoSpawn(i, fromEdge = false) {
  const D = tdDemo, w = D.lane.clientWidth, h = D.lane.clientHeight;
  const type = D.set.mix && i === 0 ? "procrastinacio" : "notificacio", def = TD_ENEMIES[type];
  const size = Math.min(56, h * 0.62) * (def.size / 70);
  const e = { type, def, hp: def.hp, max: def.hp, size, x: fromEdge ? w + 20 : w * 0.55 + i * D.set.gap,
    y: h * 0.8 + (D.set.spread ? ((i % 2) * 2 - 1) * D.set.spread : 0), stun: 0, conv: 0, dead: false };
  e.el = document.createElement("div");
  e.el.className = "tdbook-foe";
  e.el.style.width = e.el.style.height = `${size}px`;
  e.el.innerHTML = `${tdEnemySvg(type)}<i class="tdbook-foe-hp"><b></b></i>`;
  D.lane.appendChild(e.el);
  D.enemies.push(e);
}
function tdDemoTick(now) {
  const box = document.querySelector("#td-dialog:not([hidden]) .tdbook-spread:not([data-turning]) .tdbook-demo");
  if (!box) { tdDemo = null; return; }
  if (!tdDemo || tdDemo.box !== box) tdDemoStart(box);
  const D = tdDemo, dt = Math.min(0.05, (now - D.last) / 1000);
  D.last = now;
  const w = D.lane.clientWidth, k = w / 520; // escala: el carril fa de tram de camí
  for (const e of D.enemies) {
    if (e.dead) continue;
    if (e.stun > 0) e.stun -= dt;
    else e.x += (e.conv > 0 ? 1 : -1) * e.def.speed * k * dt;
    if (e.conv > 0 && (e.conv -= dt) <= 0) e.el.classList.remove("conv");
    if (e.x < -e.size) { e.x = w + 20; e.hp = e.max; } // arriba al final del tram: torna a eixir
    e.el.classList.toggle("stun", e.stun > 0);
    e.el.style.transform = `translate(${e.x - e.size / 2}px, ${e.y - e.size}px)`;
    e.el.querySelector("b").style.width = `${100 * Math.max(0, e.hp) / e.max}%`;
  }
  D.enemies = D.enemies.filter(e => !e.gone);
  // atacar quan algun enemic és dins del carril
  D.cd -= dt;
  const alive = D.enemies.filter(e => !e.dead && e.x < w - 6 && e.conv <= 0).sort((a, b) => a.x - b.x);
  if (D.cd <= 0 && alive.length) {
    D.cd = 1 / D.st.rate;
    let target = alive[0];
    if (D.d.role === "smart") target = alive.reduce((a, b) => b.hp > a.hp ? b : a);
    tdDemoFire(target);
  }
  requestAnimationFrame(tdDemoTick);
}
function tdDemoPoint(el) { // centre d'un element respecte a la caixa de la demostració
  const b = tdDemo.box.getBoundingClientRect(), r = el.getBoundingClientRect();
  return [r.left - b.left + r.width / 2, r.top - b.top + r.height / 2];
}
function tdDemoFire(target) {
  const D = tdDemo, { d, id } = D, svg = D.box.querySelector(".tdc"), art = TD_ART[id], th = art.throw || {};
  D.n++;
  D.side = d.alt ? 1 - D.side : 0;
  const part = th.c ? "c" : D.side ? "r" : "l";
  const tp = () => { const [x, y] = tdDemoPoint(target.el); return [x, y - target.size * 0.05]; };
  if (d.aim) { // el vector gira cap a l'enemic i després la fletxa ix de la V
    const [x0, y0] = tdDemoPoint(svg), [x1, y1] = tp();
    let a = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI + 90;
    a = D.aimA + ((a - D.aimA + 540) % 360 - 180);
    D.aimA = a;
    svg.querySelector(".aim").style.transform = `rotate(${a}deg)`;
  }
  svg.classList.remove("fire"); void svg.getBoundingClientRect(); svg.classList.add("fire");
  setTimeout(() => tdDemo === D && tdDemoLaunch(svg, part, target), d.aim ? 200 : 0);
  // especials cada N atacs, com al combat
  const sp = d.special;
  if (sp && D.n % sp.every === 0) {
    if (sp.type === "freeze" || sp.type === "align") D.enemies.forEach(e => { e.stun = (sp.dur || 1.4) * D.st.ability; });
    if (sp.type === "convert") { const e = D.enemies.filter(e => !e.dead).sort((a, b) => a.hp - b.hp)[0]; if (e) { e.conv = sp.dur * D.st.ability; e.el.classList.add("conv"); } }
    tdDemoText(D.box.querySelector(".tdbook-art"), sp.type === "freeze" ? "congela!" : sp.type === "align" ? "λ · diagonalitzat" : "compilat!", TD_GLOW.gold);
  }
}
function tdDemoLaunch(svg, part, target) {
  const D = tdDemo, { d, id } = D, art = TD_ART[id];
  // ix d'on està la peça ara mateix (gira, salta, orbita…)
  const pe = part !== "c" && svg.querySelector(part === "r" ? ".ar" : ".al");
  let from;
  if (pe) from = tdDemoPoint(pe);
  else {
    const [ax, ay] = (art.throw || {}).c || [60, 60], b = D.box.getBoundingClientRect(), s = svg.getBoundingClientRect();
    from = [s.left - b.left + (ax + 6) / 132 * s.width, s.top - b.top + (ay + 10) / 132 * s.height];
  }
  if (pe) svg.classList.add(`thrown-${part}`);
  const [tx, ty] = tdDemoPoint(target.el);
  let to = [tx, ty], hitList = [target];
  if (d.role === "pierce") { // continua recte fins a la vora i travessa tota la filera
    const dx = tx - from[0], dy = ty - from[1], L = Math.hypot(dx, dy) || 1, far = D.box.clientWidth * 1.2;
    to = [from[0] + dx / L * far, from[1] + dy / L * far];
    hitList = D.enemies.filter(e => !e.dead && tdDemoNearLine(from, to, tdDemoPoint(e.el), 22));
  }
  const k = svg.getBoundingClientRect().width / 132 * (art.projScale || 1.25);
  const p = document.createElement("div");
  p.className = "tdbook-shot";
  p.innerHTML = `<svg viewBox="-40 -40 80 80" width="${80 * k}" height="${80 * k}" overflow="visible"><g>${part === "r" && art.projR ? art.projR : art.proj}</g></svg>`;
  D.box.appendChild(p);
  const rot = ["vector", "ifelse", "determinant", "compilador"].includes(id) ? Math.atan2(to[1] - from[1], to[0] - from[0]) * 180 / Math.PI : 0;
  const dist = Math.hypot(to[0] - from[0], to[1] - from[1]), dur = dist / 0.55;
  const fly = p.animate([
    { transform: `translate(${from[0]}px, ${from[1]}px) translate(-50%, -50%) rotate(${rot}deg)` },
    { transform: `translate(${to[0]}px, ${to[1]}px) translate(-50%, -50%) rotate(${rot}deg)` },
  ], { duration: dur, easing: "linear" });
  // cada enemic rep el colp quan el projectil hi arriba
  for (const e of hitList) {
    const [ex, ey] = tdDemoPoint(e.el);
    setTimeout(() => tdDemo === D && tdDemoHit(e, from), Math.hypot(ex - from[0], ey - from[1]) / 0.55);
  }
  const regrow = () => { if (pe) { svg.classList.remove(`thrown-${part}`, `regrow-${part}`); void svg.getBoundingClientRect(); svg.classList.add(`regrow-${part}`); } };
  fly.onfinish = () => { p.remove(); regrow(); };
  fly.oncancel = regrow;
}
function tdDemoNearLine([ax, ay], [bx, by], [px, py], r) {
  const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(ax + dx * t - px, ay + dy * t - py) <= r;
}
function tdDemoHit(target, from) {
  const D = tdDemo, { d } = D;
  if (target.dead) return;
  let hits = [target], dmg = D.st.dmg;
  if (d.role === "aoe") { const [tx, ty] = tdDemoPoint(target.el); hits = D.enemies.filter(e => !e.dead && Math.hypot(...tdDemoPoint(e.el).map((v, i) => v - [tx, ty][i])) <= 46); }
  if (d.role === "execute" && target.hp - dmg <= target.max * (d.execute || 0.15)) { dmg = target.hp; tdDemoText(target.el, "det = 0", TD_GLOW.gold); }
  if (d.role === "stacks" && ++D.stacks >= (d.stacks || 10)) { D.stacks = 0; hits = D.enemies.filter(e => !e.dead); dmg *= d.blast || 12; tdDemoText(D.box.querySelector(".tdbook-art"), "overflow!", "#ff8a1f"); }
  for (const e of hits) tdDemoDamage(e, dmg);
  if (d.role === "split" && !target.child) { // es dividix en dos cap als enemics de darrere
    D.enemies.filter(e => !e.dead && e !== target).slice(0, 2).forEach((e, i) => setTimeout(() => tdDemo === D && !e.dead && tdDemoDamage(e, dmg * 0.6), 180 + i * 60));
  }
}
function tdDemoDamage(e, dmg) {
  if (e.dead) return;
  e.hp -= dmg;
  e.el.classList.remove("hit"); void e.el.offsetWidth; e.el.classList.add("hit");
  tdDemoText(e.el, fmtNum(dmg), TD_GLOW[tdDemo.d.subj] || "#fff");
  if (e.hp <= 0) { // es dissol i n'ix un altre per la dreta
    e.dead = true;
    e.el.classList.add("dying");
    setTimeout(() => { e.el.remove(); e.gone = true; if (tdDemo) tdDemoSpawn(0, true); }, 500);
  }
}
function tdDemoText(el, text, color) {
  if (!tdDemo) return;
  const [x, y] = tdDemoPoint(el), n = document.createElement("span");
  n.className = "tdbook-dmg";
  n.style.left = `${x}px`; n.style.top = `${y - 26}px`; n.style.color = color;
  n.textContent = text;
  tdDemo.box.appendChild(n);
  setTimeout(() => n.remove(), 800);
}
setInterval(() => { if (!tdDemo && document.querySelector("#td-dialog:not([hidden]) .tdbook-demo")) requestAnimationFrame(tdDemoTick); }, 250);
