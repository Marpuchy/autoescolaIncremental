// ===== ESTUDI: SALA (lobby) =====
// Sala arcana dibuixada (tools/sala-estudi.js → js/data/td-lobby-art.js). Cada objecte obri una finestreta:
//   altar → invocar · escriptori → apuntar l'estudi · grimori → criatures (nivells, equip) · faristol → bestiari
//   portal → mons · cristall → millores · estudiant → artefactes · rellotge de sorra → tornar a començar · porta → habitació
// Mentre s'està ací (o en combat), l'autoescola està parada.
const tdLobbyOpen = () => !$("td-lobby").hidden;
const tdFields = () => tdFieldsOf(tdRoom); // camps de la sala on s'està
const tdOpen = () => tdLobbyOpen() || tdBattleOpen();
let tdSubj = "alg";       // camp triat als panells
let tdClass = {};         // assignatura triada dins de cada camp (prestatgeria d'estudi)

// Dues sales amb els mateixos punts: Informàtica (sala arcana, tools/sala-estudi.js) i Forestal (l'interior d'un
// arbre, tools/sala-forestal.js). Cada sala només mostra els seus camps (tdFields), el seu equip i els seus mons.
let tdRoom = "informatic";
const TD_ROOMS = {
  informatic: { art: () => TD_LOBBY_ART, title: "📚 Sala d'estudi · Informàtica", label: "Sala d'estudi d'Informàtica" },
  forestal:   { art: () => TD_FOREST_ART, title: "🌳 Sala del bosc · Forestal", label: "Sala del bosc de Forestal" },
};
function tdOpenLobby(room = tdRoom) {
  if (typeof roomOpen === "function" && roomOpen()) closeRoom();
  tdRoom = TD_ROOMS[room] ? room : "informatic";
  const settle = () => {
    if (!tdFields().includes(tdSubj)) tdSubj = tdFields()[0];
    if (tdViewingOf) return;
    tdUseRoomArtifacts(tdRoom);
    if (tdStartRoom(tdRoom)) toast(`🎁 Benvinguda: dues criatures i 5 pergamins de cada camp`, "good");
  };
  settle();
  cloudTdEnter(tdRoom).then(() => { settle(); cloudVisitBanner(); if (tdLobbyOpen()) tdRenderLobby(); });
  $("td-lobby").hidden = false;
  $("td-lobby").classList.toggle("forest", tdRoom === "forestal");
  $("td-lobby-top").querySelector("h2").textContent = TD_ROOMS[tdRoom].title;
  document.body.classList.add("td-open");
  tdRenderLobby();
}
function tdCloseLobby() {
  tdClosePanel();
  cloudTdLeave(); cloudVisitBanner(); // en eixir de la sala, s'acaba la visita
  $("td-lobby").hidden = true;
  document.body.classList.remove("td-open");
}

function tdRenderLobby() {
  const student = tdStudentSvg(td.equipped, `x="0" y="0" width="100" height="105"`);
  // el cristall de la sala és el mateix que el de la finestra de millores: s'encén igual
  const ups = Object.keys(TD_UPGRADES), frac = ups.reduce((a, id) => a + td.upgrades[id], 0) / ups.reduce((a, id) => a + TD_UPGRADES[id].max, 0);
  const crystal = (tdRoom === "forestal" ? tdJadeSvg : tdCrystalSvg)(frac).replace("<svg ", `<svg x="-42" y="-64" width="84" height="114" `);
  const spots = [];
  const ART = TD_ROOMS[tdRoom].art();
  const layers = ART.layers.map(l => {
    const svg = l.svg.replace("%STUDENT%", student).replace("%CRYSTAL%", crystal);
    if (!l.spot) return svg;
    const [x, y, w, h] = l.hit;
    spots.push([w * h, `<rect class="hub-hit" data-td="${l.spot}" tabindex="0" role="button" aria-label="${l.title}" x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"><title>${l.title}</title></rect>`]);
    return `<g class="hub-art td-art" id="td-art-${l.spot}">${svg}</g>`;
  }).join("");
  $("td-lobby-scene").innerHTML = `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-label="${TD_ROOMS[tdRoom].label}"><defs>${ART.defs}</defs>${layers}${spots.sort((x, y) => y[0] - x[0]).map(x => x[1]).join("")}</svg>`; // les zones menudes, damunt
  tdLobbyHud();
}
function tdLobbyHud() {
  $("td-saber").textContent = fmtNum(Math.floor(td.saber));
  const P = TD_POINTS[tdRoom], pts = td.stelles[tdRoom] || 0;
  $("td-perg").innerHTML = tdFields().map(s => `<span title="Pergamins de ${TD_SUBJECTS[s].name}">📜 ${TD_SUBJECTS[s].short} <strong>${td.pergamins[s]}</strong></span>`).join("") +
    (pts ? `<span title="${P.name}: compren còpies al grimori">${P.icon} <strong>${pts}</strong></span>` : "");
}

// ---------------------------------------------------------------- finestretes
const TD_PANELS = {
  gacha: "🔮 Altar d'invocació", study: "📚 Prestatgeria d'estudi", grimori: "📖 Grimori", bestiary: "👾 Bestiari",
  worlds: "🌀 Portal dels mons", upgrades: "💎 Cristall", student: "🐸 Estudiant",
};
function tdSpot(name) {
  if (name === "exit") { tdCloseLobby(); openRoom(); return; }
  if (name === "reset") { if (tdViewingOf) { toast("👀 És la partida de l'altra persona: no es pot reiniciar", "bad"); return; } tdAskRestart(); return; }
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
const tdSubjTabs = () => `<div class="td-tabs">${tdFields().map(s => [s, TD_SUBJECTS[s]]).map(([s, d]) =>
  `<button class="td-tab s-${s}${tdSubj === s ? " on" : ""}" data-subj="${s}">${d.icon} ${d.short}</button>`).join("")}</div>`;
const tdStarStr = n => `<span class="td-stars">${"★".repeat(n)}<span class="off">${"★".repeat(5 - n)}</span></span>`;

// ---- altar (invocar)
function tdGachaHtml() {
  const s = tdSubj, p = td.pity[s] || { epic: 0, llegendari: 0 }, n = td.pergamins[s] || 0;
  const pool = Object.entries(TD_DEFENDERS).filter(([, d]) => d.subj === s && d.rar !== "mitic");
  return `${tdSubjTabs()}
    <p class="td-hint">Cada pergamí de <strong>${TD_SUBJECTS[s].name}</strong> (${TD_SUBJECTS[s].classes.join(", ")}) invoca una criatura d'aquest camp. Els pergamins només s'aconseguixen estudiant.</p>
    <div class="td-gacha-pool">${pool.map(([id, d]) => `<div class="td-mini rar-${d.rar}" title="${d.name} (${TD_RARITIES[d.rar].name})">${tdCreatureSvg(id)}</div>`).join("")}</div>
    <div class="td-rates">${["comu", "rar", "epic", "llegendari"].map(r => `<span style="color:${TD_RARITIES[r].color}">${TD_RARITIES[r].name} ${String(TD_RARITIES[r].chance * 100).replace(".", ",")} %${tdPool(s, r).length ? "" : ` → ${TD_POINTS[tdRoom].icon} ${TD_RARITIES[r].value}`}</span>`).join(" · ")}</div>
    ${["comu", "rar", "epic", "llegendari"].some(r => !tdPool(s, r).length) ? `<p class="td-hint">Si ix una raresa que este camp no té, guanyes ${TD_POINTS[tdRoom].name} ${TD_POINTS[tdRoom].icon}: al grimori es canvien per còpies de qualsevol criatura.</p>` : ""}
    <div class="td-pity"><span>${tdPool(s, "epic").length ? "Èpic" : "Èpic (→ " + TD_POINTS[tdRoom].icon + ")"} garantit en <strong>${TD_PITY.epic - p.epic}</strong></span><span>Llegendari garantit en <strong>${TD_PITY.llegendari - p.llegendari}</strong></span></div>
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
const TDS_GLYPHS = { alg: ["+", "×", "λ", "Σ", "det", "[ ]", "Aᵀ", "v⃗", "−", "∑"], prg: [";", "{ }", "if", "for", "//", "</>", "( )", "==", "[i]", "++"],
  mnt: ["ᚠ", "ᚱ", "ᛉ", "ᛃ", "ᚦ", "ᛟ", "ᚨ", "ᛒ", "ᛚ", "ᛗ"], pin: ["N", "↗", "E", "⌖", "S", "↙", "O", "⊕", "△", "◯"] };
function tdsGlyphs(subj) {
  const list = TDS_GLYPHS[subj] || TDS_GLYPHS.alg;
  document.querySelector("#td-summon .tds-glyphs").innerHTML = list.map((t, i) => {
    const a = i / list.length * Math.PI * 2 - Math.PI / 2;
    return `<text x="${(Math.cos(a) * 137).toFixed(1)}" y="${(Math.sin(a) * 137).toFixed(1)}" transform="rotate(${(a * 180 / Math.PI + 90).toFixed(1)} ${(Math.cos(a) * 137).toFixed(1)} ${(Math.sin(a) * 137).toFixed(1)})">${t}</text>`;
  }).join("");
}
// Què es mostra de cada resultat: una criatura o, si el camp no tenia aquella raresa, punts d'estrella (espores)
function tdsInfo(r) {
  if (!r.points) { const d = TD_DEFENDERS[r.id]; return { rar: d.rar, name: d.name, art: tdCreatureSvg(r.id), desc: d.desc, subj: d.subj }; }
  const P = TD_POINTS[r.mode];
  return { rar: r.rar, name: `+${r.points} ${r.points === 1 ? P.one : P.name}`, art: tdPointsSvg(r.mode), subj: r.subj,
    desc: `${TD_SUBJECTS[r.subj].name} no té cap criatura ${TD_RARITIES[r.rar].name.toLowerCase()}. Al grimori, ${P.name} es canvien per còpies de qualsevol criatura.` };
}
// Dibuix dels punts: una estrella de neó (Informàtica) o una espora que brilla (bosc)
function tdPointsSvg(mode) {
  if (mode === "forestal") return `<svg viewBox="-60 -60 120 120" class="tdc tdc-points" aria-hidden="true">
    <circle r="50" fill="#9ff07a" opacity="0.12"/>${Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5;
      return `<path d="M0 0 Q${(Math.cos(a + 0.35) * 26).toFixed(1)} ${(Math.sin(a + 0.35) * 26).toFixed(1)} ${(Math.cos(a) * 44).toFixed(1)} ${(Math.sin(a) * 44).toFixed(1)}" stroke="#9ff07a" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>
        <circle cx="${(Math.cos(a) * 46).toFixed(1)}" cy="${(Math.sin(a) * 46).toFixed(1)}" r="4" fill="#e8ffb0"/>`; }).join("")}
    <circle r="15" fill="#2f7a3e" stroke="#9ff07a" stroke-width="4"/><circle r="6" fill="#e8ffb0"/></svg>`;
  return `<svg viewBox="-60 -60 120 120" class="tdc tdc-points" aria-hidden="true"><circle r="50" fill="#ffc23f" opacity="0.12"/>
    <path d="M0 -46 L13 -14 L46 -12 L20 9 L29 42 L0 23 L-29 42 L-20 9 L-46 -12 L-13 -14 Z" fill="#3a2a08" stroke="#ffc23f" stroke-width="5" stroke-linejoin="round"/>
    <path d="M0 -26 L6 -6 L26 -6 L10 6 L16 26 L0 14 L-16 26 L-10 6 L-26 -6 L-6 -6 Z" fill="#ffe27a"/></svg>`;
}
function tdReveal(results) {
  clearTimeout(tdsRun?.timer);
  tdsRun = { res: results, i: -1, phase: "", skipping: false };
  const box = $("td-summon");
  box.hidden = false;
  box.querySelector(".tds-summary").hidden = true;
  box.dataset.subj = tdsInfo(results[0]).subj;
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
const TD_BIG_SHOWN = r => !r.points && TDS_BIG.includes(TD_DEFENDERS[r.id].rar);
function tdsNext() {
  const run = tdsRun;
  run.i++;
  if (run.skipping) while (run.i < run.res.length && !TD_BIG_SHOWN(run.res[run.i])) run.i++;
  if (run.i >= run.res.length) { run.res.length > 1 ? tdsSummary() : tdsClose(); return; }
  const r = run.res[run.i], d = tdsInfo(r), box = $("td-summon");
  box.className = `rar-${d.rar}${d.rar === "mitic" ? " assemble" : ""}${r.points ? " points" : ""}`;
  box.style.setProperty("--rc", TD_RARITIES[d.rar].color);
  box.querySelector(".tds-creature").innerHTML = d.art;
  box.querySelector(".tds-rar").textContent = TD_RARITIES[d.rar].name;
  box.querySelector(".tds-name").textContent = d.name;
  box.querySelector(".tds-tag").innerHTML = r.points ? `Total: ${TD_POINTS[r.mode].icon} ${td.stelles[r.mode] || 0}` : r.isNew ? "NOVA!" : r.ready ? `Còpia · ja pot pujar a ★${r.stars + 1} (grimori)` : r.saber ? `Repetida al màxim: +${r.saber} ✨` : `Còpia · ${tdStarStr(r.stars)}`;
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
    const d = tdsInfo(r);
    return `<div class="td-rcard rar-${d.rar}" style="animation-delay:${i * 0.06}s"><div class="td-rcard-art">${d.art}</div>
      <div class="td-rcard-name">${r.points ? TD_POINTS[r.mode].name : d.name}</div><div class="td-rcard-tag">${r.points ? `+${r.points} ${TD_POINTS[r.mode].icon}` : r.isNew ? "NOVA!" : r.ready ? `⬆ ★${r.stars + 1}` : r.saber ? `+${r.saber} ✨` : tdStarStr(r.stars)}</div></div>`;
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
let tdExamOpen = null;  // camp de l'examen obert (llibre d'exàmens)
let tdExamClass = {};   // assignatura triada a l'examen, per camp
const TD_SHELF_ROWS = 4; // lleixes de la prestatgeria: una per camp; les que sobren, buides de moment
const TD_FIELD_HUE = { alg: 258, prg: 150, mnt: 105, pin: 32 };
// Color del llom: tots els llibres d'un camp són de la mateixa gamma
const tdSpineColor = (f, i) => `hsl(${TD_FIELD_HUE[f] + ((i * 5) % 3 - 1) * 14} ${42 + (i % 3) * 8}% ${26 + ((i * 3) % 4) * 5}%)`;
function tdMissionsHtml() {
  const now = new Date(), end = new Date(now); end.setHours(24, 0, 0, 0);
  const mins = Math.max(0, Math.round((end - now) / 60000));
  return `<div class="td-missions"><div class="td-missions-pin"></div><h4>📌 Missions d'avui</h4>
    <ul>${tdMissions(tdRoom).map(m => { const a = TD_ACTIVITIES.find(x => x.id === m.a), F = TD_SUBJECTS[m.f];
      return `<li class="${m.done ? "done" : ""}"><span>${a.icon} ${a.short} ×${m.need} <small>${F.short}</small></span>
        <span class="td-mission-bar"><i style="width:${100 * Math.min(m.have, m.need) / m.need}%"></i><b>${Math.min(m.have, m.need)}/${m.need}</b></span>
        <strong>${m.done ? "✔" : `+${m.bonus} 📜`}</strong></li>`; }).join("")}</ul>
    <p class="td-missions-time">⏳ Queden ${Math.floor(mins / 60)} h ${mins % 60} min</p></div>`;
}
function tdStudyHtml() {
  const fields = tdFields();
  const log = td.log.filter(l => fields.includes(l.subj)).slice(0, 4);
  const row = i => {
    const f = fields[i];
    if (!f) return `<div class="td-shelf empty"><div class="td-shelf-label">Pròximament</div><div class="td-shelf-books"></div></div>`;
    const F = TD_SUBJECTS[f], left = tdDailyLeft(f);
    return `<div class="td-shelf s-${f}"><div class="td-shelf-label">${F.icon} ${F.name}<small>${left} 📜 hui</small></div>
      <div class="td-shelf-books">${TD_ACTIVITIES.map((a, j) => `<button class="td-spine" data-act="${a.id}" data-field="${f}" style="--c:${tdSpineColor(f, j)};--h:${a.h}%" title="${a.name} · +${a.rolls} pergamins de ${F.name}" ${left <= 0 ? "disabled" : ""}>
          <span class="td-spine-i">${a.icon}</span><span class="td-spine-t">${a.short}</span><span class="td-spine-r">+${a.rolls}</span></button>`).join("")}
        <button class="td-tome" data-exambook="${f}" title="Exàmens de ${F.name}: obri'l per a apuntar una nota"><span>🎓</span><b>Exàmens</b></button></div></div>`;
  };
  return `<p class="td-hint">Cada lleixa és un camp: agafa el llibre del que has fet. Al final, el llibre d'exàmens.</p>
    <div class="td-study">${tdMissionsHtml()}<div class="td-bookcase">${Array.from({ length: TD_SHELF_ROWS }, (_, i) => row(i)).join("")}</div></div>
    ${log.length ? `<ul class="td-log">${log.map(l => `<li>${l.what} <span>+${l.rolls} 📜${l.mythic ? " · ✨ mític" : ""}</span></li>`).join("")}</ul>` : ""}
    ${tdExamOpen ? tdExamBookHtml(tdExamOpen) : ""}`;
}
// Llibre d'exàmens obert al mig de la pantalla: a l'esquerra l'assignatura, a la dreta la nota
function tdExamBookHtml(f) {
  const F = TD_SUBJECTS[f], cls = tdExamClass[f] || F.classes[0];
  return `<div class="td-exambook-bg" data-examclose="1"></div><div class="td-exambook" role="dialog" aria-label="Exàmens de ${F.name}">
    <button class="td-exambook-x" data-examclose="1" aria-label="Tancar">×</button>
    <div class="td-exambook-page"><h3>🎓 Exàmens · ${F.name}</h3><p class="muted">De quina assignatura?</p>
      <div class="td-exam-classes">${F.classes.map(c => `<button class="tdbook-filter${c === cls ? " on" : ""}" data-examcls="${c}">${c}</button>`).join("")}</div></div>
    <div class="td-exambook-page"><label class="td-exam-nota">Nota de <strong>${cls}</strong><input type="number" id="td-nota" min="0" max="10" step="0.1" placeholder="7,5"></label>
      <div class="td-exam-btns"><button class="secondary" data-exam="parcial">📄 Parcial</button><button data-exam="final">🎓 Final</button></div>
      <p class="muted">5 → 3 pergamins … 10 → 10. Amb un <strong>${TD_MYTHIC_GRADE} o més al final</strong>, la criatura mítica de ${F.name}.</p></div></div>`;
}
function tdDoStudy(actId, f = tdSubj) {
  const r = tdRegisterStudy(f, actId);
  if (!r) return;
  if (r.rolls) toast(`📜 +${r.rolls} pergamins de ${TD_SUBJECTS[f].short}${r.capped ? " (has arribat al límit d'avui)" : ""}`, "good");
  else toast("Ja has arribat al límit d'avui per a aquest camp", "bad");
  for (const m of r.missions || []) toast(`🏅 Missió feta: +${m.bonus} pergamins de ${TD_SUBJECTS[f].short}`, "good");
  tdRenderPanel();
}
function tdDoExam(kind) {
  const f = tdExamOpen, nota = Number(String($("td-nota").value).replace(",", "."));
  if (!f) return;
  if (!(nota >= 0 && nota <= 10) || $("td-nota").value === "") { toast("Escriu una nota de 0 a 10", "bad"); return; }
  const r = tdRegisterExam(f, nota, kind === "final", tdExamClass[f] || TD_SUBJECTS[f].classes[0]);
  toast(`📜 +${r.rolls} pergamins de ${TD_SUBJECTS[f].short}`, "good");
  tdExamOpen = null;
  if (r.mythic) tdReveal([r.mythic]);
  tdRenderPanel();
}

// ---- llibres (grimori i bestiari): una criatura o distracció per doble pàgina; es passa pàgina
// Marcapàgines: una assignatura per marcapàgines (cada una amb el seu paper) i, al grimori, l'equip.
let tdBook = { tab: "alg", page: 0 };
let tdTeamFilter = "all"; // filtre de «Les teues criatures»: all · fav · alg · prg
const TD_RAR_ORDER = ["comu", "rar", "epic", "llegendari", "mitic"];
function tdBookList(kind, tab) {
  if (kind === "bestiary") return Object.keys(TD_ENEMIES).filter(id => !TD_ENEMIES[id].hidden);  // les mateixes a les dues sales (al bosc, amb una altra pell)
  return Object.keys(TD_DEFENDERS).filter(id => TD_DEFENDERS[id].subj === tab).sort((a, b) => TD_RAR_ORDER.indexOf(TD_DEFENDERS[a].rar) - TD_RAR_ORDER.indexOf(TD_DEFENDERS[b].rar));
}
function tdBookHtml(kind) {
  const tabs = kind === "bestiary" ? [] : [...tdFields().map(s => [s, `${TD_SUBJECTS[s].icon} ${TD_SUBJECTS[s].short}`]), ["team", "⚔️ Equip"]];
  const tab = kind === "bestiary" ? "best" : tdBook.tab;
  const theme = kind === "bestiary" ? (tdRoom === "forestal" ? "best forest" : "best") : tab;
  let left, right, nav = "";
  if (tab === "team") [left, right] = tdTeamPages();
  else {
    // els dos llibres comencen amb un índex
    const list = ["index", ...tdBookList(kind, tab)];
    tdBook.page = Math.max(0, Math.min(tdBook.page, list.length - 1));
    const id = list[tdBook.page];
    [left, right] = id === "index" ? (kind === "bestiary" ? tdBeastIndexPages(list.slice(1)) : tdIndexPages(tab, list.slice(1)))
      : kind === "bestiary" ? tdBeastPages(id) : tdCreaturePages(id);
    nav = `${tdBook.page > 0 ? `<button class="secondary small tdbook-toindex" data-goto="0">☰ Índex</button>` : ""}<button class="tdbook-turn prev" data-bk="prev" ${tdBook.page === 0 ? "disabled" : ""} aria-label="Pàgina anterior">◀</button>
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
  prg: "Criatures fetes de codi: puntuació, condicions i compiladors. Ràpides, llestes i plenes de trucs.",
  mnt: "Criatures del mateix bosc: pins, anells de tronc, foc controlat i carrasques velles. Aguanten el camí i protegixen les del costat.",
  pin: "Criatures del treball de camp: brúixoles, llavors que volen lluny, anelles de marcatge i el projecte que ho ajunta tot.",
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
        <span>${next ? `${next.have} / ${next.need}` : "MÀX"}</span></div>
      ${tdCanBuyCopy(id) ? `<button class="secondary small tdbook-buy" data-buy="${id}" ${(td.stelles[tdModeOf(id)] || 0) < tdCopyPrice(id) ? "disabled" : ""} title="Tens ${td.stelles[tdModeOf(id)] || 0} ${TD_POINTS[tdModeOf(id)].name}">+1 còpia · ${TD_POINTS[tdModeOf(id)].icon} ${tdCopyPrice(id)}</button>` : ""}
      ${next && next.have >= next.need ? `<button class="tdbook-ascend" data-ascend="${id}" ${td.saber < tdAscendCost(id) ? "disabled" : ""}>⭐ Pujar a ★${st.stars + 1} · ✨ ${fmtNum(tdAscendCost(id))}</button>` : ""}`,
    `<p class="tdbook-text">${d.desc}</p>
     <table class="tdbook-stats"><tr><th>Nivell</th><td>${o.level} / ${cap}${cap < TD_LEVEL_MAX ? ` <span class="muted">(més amb ★${st.stars + 1})</span>` : ""}</td></tr><tr><th>Dany</th><td>${fmtNum(st.dmg)}</td></tr>
       <tr><th>Velocitat</th><td>${st.rate.toFixed(2)} / s</td></tr><tr><th>Abast</th><td>${Math.round(st.range)}</td></tr><tr><th>Cost</th><td>🔮 ${d.cost}</td></tr>
       <tr><th>Habilitat</th><td>×${st.ability.toFixed(2).replace(".", ",")} <span class="tdbook-steps">${steps.map(([t, on]) => `<span class="${on ? "on" : ""}">${t}</span>`).join("")}</span></td></tr></table>
     <div class="tdbook-btns">${lvlBtn}
       <button class="secondary" data-team="${id}" title="${td.team.includes(id) ? "Traure de l'equip" : "Posar a l'equip"}">${td.team.includes(id) ? "➖" : "➕"}<span class="lbl"> Equip</span></button>
       <button class="secondary tdbook-fav${td.favs.includes(id) ? " on" : ""}" data-fav="${id}" aria-pressed="${td.favs.includes(id)}" title="Preferida: ix primer a la llista de l'equip">${td.favs.includes(id) ? "★" : "☆"}<span class="lbl"> Preferida</span></button></div>`];
}
// Índex del bestiari: introducció a l'esquerra i, a la dreta, les distraccions (les que no has vist, amb interrogants)
function tdBeastIndexPages(list) {
  const seen = list.filter(id => td.seen.includes(id)).length;
  const row = (id, i) => {
    const e = tdEnemy(id), o = td.seen.includes(id);
    return `<li><button class="tdbook-idx${o ? "" : " unknown"}" data-goto="${i + 1}" style="--rc:${e.boss ? "#ff5a4a" : "#aab3c0"}">
      <span class="tdbook-idx-name">${o ? e.name : "???"}</span>${e.boss ? `<span class="tdbook-idx-rar">Cap</span>` : ""}
      <span class="tdbook-idx-dots"></span><span class="tdbook-idx-pg">${i + 2}</span></button></li>`;
  };
  return [`<div class="tdbook-intro"><div class="tdbook-intro-icon">🔔</div><h3 class="tdbook-name">Bestiari</h3>
      <p class="tdbook-text">${tdRoom === "forestal" ? "Les distraccions de sempre (notificacions, son, procrastinació…), però al bosc es disfressen de bestioles i plantes. Cada una té el seu truc." : "Les distraccions que intenten arribar al cristall mentre estudies: notificacions, son, procrastinació… Cada una té el seu truc."}</p>
      <p class="tdbook-text muted">Una pàgina s'escriu sola la primera vegada que una t'ataca. Els caps apareixen a les onades 5 i 10 i deixen artefactes.</p>
      <p class="tdbook-intro-count">N'has vist <strong>${seen}</strong> de <strong>${list.length}</strong></p></div>`,
    `<h3 class="tdbook-name">Índex</h3><ol class="tdbook-index">${list.map(row).join("")}</ol>`];
}
function tdBeastPages(id) {
  const e = tdEnemy(id), seen = td.seen.includes(id);
  if (!seen) return [`<div class="tdbook-art locked">${tdEnemySvg(id)}</div><h3 class="tdbook-name">???</h3>`, `<p class="tdbook-text">Encara no t'ha atacat.</p>`];
  return [`<div class="tdbook-art">${tdEnemySvg(id)}</div><h3 class="tdbook-name">${e.name}</h3>${e.look ? `<div class="tdbook-rar look">${e.look}</div>` : ""}${e.boss ? '<div class="tdbook-rar boss">CAP</div>' : ""}`,
    `<p class="tdbook-text tdbook-lore">${e.lore || ""}</p><p class="tdbook-text"><strong>Habilitat:</strong> ${e.desc}</p><table class="tdbook-stats"><tr><th>Vida</th><td>${e.hp} <span class="muted">(+${TD_WAVE_HP * 100} % per onada)</span></td></tr>
      <tr><th>Velocitat</th><td>${e.speed}</td></tr><tr><th>Dany al cristall</th><td>${e.lives}</td></tr><tr><th>Maná en morir</th><td>🔮 ${e.mana}</td></tr></table>`];
}
function tdTeamPages() {
  const team = tdTeam(tdRoom), slots = Array.from({ length: 6 }, (_, i) => team[i]);
  // les preferides, primer; després, per assignatura i raresa
  const owned = Object.keys(TD_DEFENDERS).filter(id => td.owned[id] && tdModeOf(id) === tdRoom)
    .filter(id => tdTeamFilter === "all" || (tdTeamFilter === "fav" ? td.favs.includes(id) : TD_DEFENDERS[id].subj === tdTeamFilter))
    .sort((a, b) => (td.favs.includes(b) - td.favs.includes(a)) || 0);
  if (!["all", "fav", ...tdFields()].includes(tdTeamFilter)) tdTeamFilter = "all";
  const filters = [["all", "Totes"], ["fav", "★ Preferides"], ...tdFields().map(s => [s, `${TD_SUBJECTS[s].icon} ${TD_SUBJECTS[s].short}`])];
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
  const mine = tdTeam(tdModeOf(id));
  if (td.team.includes(id)) {
    if (mine.length <= 1) { toast("Cal almenys una criatura a l'equip", "bad"); return; }
    td.team = td.team.filter(t => t !== id);
  } else {
    if (mine.length >= 6) { toast("L'equip ja té 6 criatures: trau-ne una abans", "bad"); return; }
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
    <div class="td-worlds">${TD_WORLDS.filter(w => w.mode === tdRoom).map(w => {
      const p = td.worlds[w.id] || { best: 0, clears: 0 };
      return `<div class="td-world${w.soon ? " locked" : ""}"><div><strong>${tdWorldNum(w)}. ${w.name}</strong> <span class="muted">· ${w.layout}</span>
        <div class="muted">${w.soon ? "Pròximament" : `Millor onada: ${p.best} / ${w.waves.length}${p.clears ? ` · superat ${p.clears}×` : ""}`}</div></div>
        ${w.soon ? "<span>🔒</span>" : `<button data-play="${w.id}">▶ Jugar</button>`}</div>`;
    }).join("")}</div>
    <p class="td-hint">Equip: ${tdTeam(tdRoom).map(id => `<span class="td-chip rar-${TD_DEFENDERS[id].rar}">${TD_DEFENDERS[id].name}</span>`).join(" ")}</p>`;
}

// ---- cristall (millores)
// Cristall al centre: cada millora comprada encén una faceta més i el fa brillar més
function tdCrystalSvg(frac) {
  const F = 16, lit = Math.round(frac * F);
  // facetes: dos anells de triangles al voltant de l'eix (part de dalt i de baix del cristall)
  const top = [0, -120], mid = [[-62, -14], [-34, -4], [0, 2], [34, -4], [62, -14]], bot = [0, 120];
  const mid2 = [[-62, -14], [-30, -26], [0, -30], [30, -26], [62, -14]];
  const tri = [];
  for (let i = 0; i < 4; i++) tri.push([top, mid2[i], mid2[i + 1]]);
  for (let i = 0; i < 4; i++) tri.push([mid2[i], mid2[i + 1], mid[i + 1]], [mid2[i], mid[i], mid[i + 1]]);
  for (let i = 0; i < 4; i++) tri.push([mid[i], mid[i + 1], bot]);
  const order = tri.map((_, i) => i).sort((a, b) => ((a * 7) % F) - ((b * 7) % F)); // s'encenen escampades
  const on = new Set(order.slice(0, lit));
  return `<svg viewBox="-110 -150 220 300" class="td-crys" style="--g:${(0.12 + 0.75 * frac).toFixed(2)}">
    <defs><radialGradient id="td-crys-glow"><stop offset="0" stop-color="#7fe8ff" stop-opacity="0.9"/><stop offset="1" stop-color="#7fe8ff" stop-opacity="0"/></radialGradient></defs>
    <ellipse class="td-crys-glow" rx="${100 + 30 * frac}" ry="${130 + 30 * frac}" fill="url(#td-crys-glow)"/>
    ${tri.slice(0, F).map((t, i) => `<polygon points="${t.map(p => p.join(",")).join(" ")}" class="td-facet${on.has(i) ? " on" : ""}"/>`).join("")}
    <path d="M0 -120 L-62 -14 L0 120 L62 -14 Z" fill="none" stroke="#7fe8ff" stroke-width="3" stroke-linejoin="round"/></svg>`;
}
// La versió del bosc: una pedra de jade arrodonida (com un ou), feta de grills que s'encenen amb les millores
function tdJadeSvg(frac) {
  const F = 16, lit = Math.round(frac * F), egg = "M0 -112 C62 -112 78 -30 74 20 C70 82 36 116 0 116 C-36 116 -70 82 -74 20 C-78 -30 -62 -112 0 -112 Z";
  // grills: dos anells de sectors al voltant d'un nucli
  const seg = (r0, r1, a0, a1) => { const p = (rr, a) => `${(Math.cos(a) * rr * 0.72).toFixed(1)},${(Math.sin(a) * rr + 4).toFixed(1)}`;
    return `M${p(r0, a0)} L${p(r1, a0)} A${r1 * 0.72} ${r1} 0 0 1 ${p(r1, a1)} L${p(r0, a1)} A${r0 * 0.72} ${r0} 0 0 0 ${p(r0, a0)} Z`; };
  const cells = [];
  for (let i = 0; i < 8; i++) cells.push(seg(30, 70, i * Math.PI / 4, (i + 1) * Math.PI / 4), seg(70, 125, i * Math.PI / 4 + 0.39, (i + 1) * Math.PI / 4 + 0.39));
  const on = new Set(cells.map((_, i) => i).sort((a, b) => ((a * 7) % F) - ((b * 7) % F)).slice(0, lit));
  return `<svg viewBox="-110 -150 220 300" class="td-crys td-jade" style="--g:${(0.12 + 0.75 * frac).toFixed(2)}">
    <defs><radialGradient id="td-jade-glow"><stop offset="0" stop-color="#9ff07a" stop-opacity="0.9"/><stop offset="1" stop-color="#9ff07a" stop-opacity="0"/></radialGradient>
      <radialGradient id="td-jade-body" cx="0.38" cy="0.3"><stop offset="0" stop-color="#4fae6a"/><stop offset="0.7" stop-color="#1f6a3e"/><stop offset="1" stop-color="#0f3a22"/></radialGradient>
      <clipPath id="td-jade-clip"><path d="${egg}"/></clipPath></defs>
    <ellipse class="td-crys-glow" rx="${110 + 30 * frac}" ry="${135 + 30 * frac}" fill="url(#td-jade-glow)"/>
    <path d="${egg}" fill="url(#td-jade-body)"/>
    <g clip-path="url(#td-jade-clip)">${cells.map((d, i) => `<path d="${d}" class="td-jcell${on.has(i) ? " on" : ""}"/>`).join("")}
      <ellipse cy="4" rx="21" ry="29" class="td-jcell${lit ? " on" : ""}"/></g>
    <path d="${egg}" fill="none" stroke="#9fe8b0" stroke-width="3"/>
    <ellipse cx="-26" cy="-58" rx="14" ry="26" fill="#fff" opacity="0.22" transform="rotate(-18 -26 -58)"/></svg>`;
}
function tdUpgradesHtml() {
  const ids = Object.keys(TD_UPGRADES);
  const total = ids.reduce((s, id) => s + td.upgrades[id], 0), max = ids.reduce((s, id) => s + TD_UPGRADES[id].max, 0);
  const node = (id, i) => {
    const u = TD_UPGRADES[id], lvl = td.upgrades[id], full = lvl >= u.max, cost = tdUpgradeCost(id);
    return `<div class="td-cnode td-cnode-${i}"><div class="td-cnode-head"><span class="td-up-icon">${u.icon}</span><strong>${u.name}</strong></div>
      <div class="td-cnode-bar"><div style="width:${100 * lvl / u.max}%"></div><span>${lvl} / ${u.max}</span></div>
      <div class="muted">${u.desc}${lvl ? ` · ara ${u.per(lvl)}` : ""}</div>
      <button data-up="${id}" ${full || td.saber < cost ? "disabled" : ""}>${full ? "Màxim" : `✨ ${fmtNum(cost)}`}</button></div>`;
  };
  return `<p class="td-hint">Millores permanents amb el saber dels mons: cada una encén el cristall. Tens ✨ <strong>${fmtNum(Math.floor(td.saber))}</strong>.</p>
    <div class="td-crystal-menu">${node(ids[0], 0)}<div class="td-crystal-core">${tdCrystalSvg(total / max)}<div class="td-crystal-pct">${Math.round(100 * total / max)} %</div></div>${ids.slice(1).map((id, i) => node(id, i + 1)).join("")}</div>`;
}

// ---- estudiant (artefactes)
let tdEquipSlot = "cap"; // espai triat a la finestra de l'estudiant
function tdStudentHtml() {
  const slot = TD_EQUIP_SLOTS.find(x => x.id === tdEquipSlot) || TD_EQUIP_SLOTS[0];
  const worn = sid => td.equipped.find(id => tdArtSlot(id) === sid);
  const own = Object.keys(td.artifacts).filter(id => tdArtSlot(id) === slot.id);
  const cur = worn(slot.id);
  return `<div class="td-inv">
    <div class="td-inv-stage"><div class="td-inv-student">${tdStudentSvg(td.equipped)}</div>
      ${TD_EQUIP_SLOTS.map((x, i) => { const id = worn(x.id);
        return `<button class="td-inv-slot td-inv-slot-${i}${x.id === slot.id ? " selected" : ""}${id ? "" : " empty"}" data-eslot="${x.id}">
          <span class="td-inv-slot-item">${id ? TD_ARTIFACTS[id].icon : x.icon}</span><span class="td-inv-slot-name">${x.name}</span></button>`; }).join("")}</div>
    <div class="td-inv-side"><h3>${slot.icon} ${slot.name}</h3>
      ${own.length ? `<div class="td-inv-items">${own.map(id => { const a = TD_ARTIFACTS[id], on = td.equipped.includes(id);
        return `<button class="td-inv-item${on ? " equipped" : ""}" data-equip="${id}" aria-pressed="${on}" title="${on ? "Llevar" : "Posar"}">
          <span class="td-inv-icon">${a.icon}</span><span><strong>${a.name}</strong> <span class="muted">Nv. ${td.artifacts[id]}</span>
          <span class="td-inv-desc">${a.desc(td.artifacts[id])}</span></span>${on ? `<span class="td-inv-check">✔ Posat</span>` : ""}</button>`; }).join("")}</div>`
        : `<p class="muted">Encara no tens res per a aquest espai.</p>`}
      ${cur ? "" : own.length ? `<p class="muted">Toca un artefacte per a posar-lo.</p>` : ""}
      <p class="td-hint">Els caps dels mons deixen artefactes; si en tornes a derrotar un, el seu puja de nivell (fins al 5). Milloren totes les criatures.</p></div></div>`;
}
function tdToggleEquip(id) {
  if (!td.artifacts[id]) return;
  if (td.equipped.includes(id)) td.equipped = td.equipped.filter(a => a !== id);
  else td.equipped = [...td.equipped.filter(a => tdArtSlot(a) !== tdArtSlot(id)), id]; // canvia el de l'espai
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
    else if (ds.cls && !ds.act) { tdClass[tdSubj] = ds.cls; tdRenderPanel(); }
    else if (ds.bktab) { tdBook = { tab: ds.bktab, page: 0 }; tdRenderPanel(); }
    else if (ds.bk) tdTurnPage(ds.bk === "next" ? 1 : -1);
    else if (ds.goto != null) tdTurnPage(0, Number(ds.goto));
    else if (ds.filter) { tdTeamFilter = ds.filter; tdRenderPanel(); }
    else if (ds.fav) { td.favs = td.favs.includes(ds.fav) ? td.favs.filter(f => f !== ds.fav) : [...td.favs, ds.fav]; tdSave(); tdRenderPanel(); }
    else if (ds.summon) tdDoSummon(Number(ds.summon));
    else if (ds.act) {
      const b = ev.target.closest("[data-act]");
      b.classList.add("taken");
      setTimeout(() => tdDoStudy(ds.act, ds.field), 380);
    }
    else if (ds.exambook) { tdExamOpen = ds.exambook; tdRenderPanel(); setTimeout(() => $("td-nota")?.focus(), 350); }
    else if (ds.examclose) { tdExamOpen = null; tdRenderPanel(); }
    else if (ds.examcls) { tdExamClass[tdExamOpen] = ds.examcls; const v = $("td-nota")?.value; tdRenderPanel(); if (v) $("td-nota").value = v; }
    else if (ds.exam) tdDoExam(ds.exam);
    else if (ds.lvl) {
      if (tdLevelUp(ds.lvl)) {
        if (TD_ABILITY_LEVELS.includes(td.owned[ds.lvl].level)) toast(`✨ ${TD_DEFENDERS[ds.lvl].name}: l'habilitat especial millora!`, "good");
        tdRenderPanel();
      }
    }
    else if (ds.team) tdToggleTeam(ds.team);
    else if (ds.play) { tdClosePanel(); tdOpenBattle(Number(ds.play)); }
    else if (ds.up) { if (tdBuyUpgrade(ds.up)) { tdRenderPanel(); tdRenderLobby(); document.querySelector(".td-card .td-crys")?.classList.add("flash"); } }
    else if (ds.equip) tdToggleEquip(ds.equip);
    else if (ds.buy) { const r = tdBuyCopy(ds.buy); if (r) { toast(`${TD_POINTS[tdModeOf(ds.buy)].icon} +1 còpia de ${TD_DEFENDERS[ds.buy].name}${r.saber ? ` (al màxim: +${r.saber} ✨)` : ""}`, "good"); tdRenderPanel(); } }
    else if (ds.ascend) { if (tdAscend(ds.ascend)) { toast(`⭐ ${TD_DEFENDERS[ds.ascend].name} puja a ★${tdStars(ds.ascend)}!`, "good"); tdRenderPanel(); } }
    else if (ds.eslot) { tdEquipSlot = ds.eslot; tdRenderPanel(); }
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
  execute: { n: 2, gap: 90 }, stacks: { n: 3, gap: 120 }, align: { n: 4, gap: 50, spread: 16 }, default: { n: 2, gap: 80 },
};
let tdDemo = null;
function tdDemoStart(box) {
  const id = box.dataset.demo, d = TD_DEFENDERS[id], lane = box.querySelector(".tdbook-lane");
  const set = TD_DEMO_SETUP[d.special?.type === "align" ? "align" : d.role] || TD_DEMO_SETUP.default;
  tdDemo = { box, id, d, lane, set, st: tdStats(id), enemies: [], shots: [], cd: 0.6, side: 0, n: d.special ? d.special.every - 2 : 0, aimA: 0, last: performance.now(), stacks: 0 };
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
    if (e.vuln > 0 && (e.vuln -= dt) <= 0) e.el.classList.remove("vuln");
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
    svg.classList.add("load"); // la fletxa es posa dins de la V
  }
  svg.classList.remove("fire"); void svg.getBoundingClientRect(); svg.classList.add("fire");
  setTimeout(() => tdDemo === D && tdDemoLaunch(svg, part, target), d.aim ? 200 : 0);
  // especials cada N atacs, com al combat
  const sp = d.special;
  if (sp && D.n % sp.every === 0) {
    if (sp.type === "freeze" || sp.type === "root") D.enemies.forEach(e => { e.stun = (sp.dur || 1.4) * D.st.ability; });
    if (sp.type === "align") { // els alinea en una recta, els para i els fa vulnerables (reben més dany)
      const h = D.lane.clientHeight;
      D.enemies.forEach(e => { if (!e.dead) { e.stun = sp.dur * D.st.ability; e.vuln = sp.vulnDur * D.st.ability; e.y = h * 0.8; e.el.classList.add("vuln"); } });
      const ring = document.createElement("i");
      ring.className = "tdbook-ring";
      D.lane.appendChild(ring);
      setTimeout(() => ring.remove(), 900);
    }
    if (sp.type === "convert") { const e = D.enemies.filter(e => !e.dead).sort((a, b) => a.hp - b.hp)[0]; if (e) { e.conv = sp.dur * D.st.ability; e.el.classList.add("conv"); } }
    if (sp.type === "echo") D.enemies.filter(e => !e.dead).forEach(e => tdDemoDamage(e, D.st.dmg * 1.5));
    tdDemoText(D.box.querySelector(".tdbook-art"), { freeze: d.subj === "mnt" ? "resina!" : "congela!", align: "λ · diagonalitzat", convert: "compilat!", root: "arrels!", echo: "🧩 projecte!" }[sp.type] || "!", TD_GLOW.gold);
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
  if (d.aim) { // ja ha disparat: la V torna a estar dreta
    svg.classList.remove("load");
    setTimeout(() => { if (tdDemo === D) { D.aimA = 0; svg.querySelector(".aim").style.transform = "rotate(0deg)"; } }, 450);
  }
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
  if (d.role === "burn") { hits = D.enemies.filter(e => !e.dead).slice(0, 3); tdDemoText(target.el, "🔥", "#ff8a3a"); }
  if (d.role === "mark" && !target.vuln) { target.vuln = 99; target.el.classList.add("vuln"); tdDemoText(target.el, "anellat!", "#d8dde6"); }
  for (const e of hits) tdDemoDamage(e, dmg * (target.vuln === 99 && e === target ? 1 + d.mark : 1));
  if (d.role === "split" && !target.child) { // es dividix en dos cap als enemics de darrere
    D.enemies.filter(e => !e.dead && e !== target).slice(0, 2).forEach((e, i) => setTimeout(() => tdDemo === D && !e.dead && tdDemoDamage(e, dmg * 0.6), 180 + i * 60));
  }
}
function tdDemoDamage(e, dmg) {
  if (e.dead) return;
  if (e.vuln > 0) dmg *= 1 + (tdDemo.d.special?.vuln || 0);
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
