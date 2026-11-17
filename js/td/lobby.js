// ===== ESTUDI: SALA (lobby) =====
// Sala arcana dibuixada (tools/sala-estudi.js → js/data/td-lobby-art.js). Cada objecte obri una finestreta:
//   altar → invocar · escriptori → apuntar l'estudi · grimori → criatures (nivells, equip) · faristol → bestiari
//   portal → mons · cristall → millores · estudiant → artefactes · rellotge de sorra → tornar a començar · porta → habitació
// Mentre s'està ací (o en combat), l'autoescola està parada.
const tdLobbyOpen = () => !$("td-lobby").hidden;
const tdOpen = () => tdLobbyOpen() || tdBattleOpen();
let tdSubj = "alg";       // assignatura triada als panells
let tdGrimSel = null;     // criatura triada al grimori

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
  const student = `<svg x="0" y="0" width="100" height="108" viewBox="0 -4 140 154" overflow="visible">${TD_STUDENT_SVG.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</svg>`;
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
  gacha: "🔮 Altar d'invocació", study: "📝 Escriptori d'estudi", grimori: "📖 Grimori", bestiary: "👾 Bestiari",
  worlds: "🌀 Portal dels mons", upgrades: "💎 Cristall", student: "🐸 Estudiant",
};
function tdSpot(name) {
  if (name === "exit") { tdCloseLobby(); openRoom(); return; }
  if (name === "reset") { tdAskRestart(); return; }
  $("td-card").dataset.panel = name;
  $("td-card-title").textContent = TD_PANELS[name];
  $("td-dialog").hidden = false;
  tdRenderPanel();
  $("td-card-close").focus();
}
function tdClosePanel() { $("td-dialog").hidden = true; tdGrimSel = null; }
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
    <p class="td-hint">Cada pergamí de <strong>${TD_SUBJECTS[s].name}</strong> invoca una criatura (un 20 % de vegades, de l'altra assignatura). Els pergamins només s'aconseguixen estudiant.</p>
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
// Revelació: les cartes ixen d'una en una; les èpiques i llegendàries amb més cerimònia
function tdReveal(results) {
  const box = $("td-reveal");
  const best = results.some(r => TD_DEFENDERS[r.id].rar === "llegendari") ? "llegendari" : results.some(r => TD_DEFENDERS[r.id].rar === "epic") ? "epic" : "";
  box.className = best ? `best-${best}` : "";
  box.hidden = false;
  $("td-reveal-cards").innerHTML = results.map((r, i) => {
    const d = TD_DEFENDERS[r.id];
    return `<div class="td-rcard rar-${d.rar}" style="animation-delay:${(best ? 0.6 : 0) + i * 0.18}s">
      <div class="td-rcard-art">${tdCreatureSvg(r.id)}</div><div class="td-rcard-name">${d.name}</div>
      <div class="td-rcard-tag">${r.isNew ? "NOVA!" : r.starUp ? `★ ${r.stars}` : r.saber ? `+${r.saber} ✨` : `${tdStarStr(r.stars)}`}</div></div>`;
  }).join("");
}

// ---- escriptori (apuntar l'estudi)
function tdStudyHtml() {
  const s = tdSubj, left = tdDailyLeft(s);
  const log = td.log.filter(l => l.subj === s).slice(0, 6);
  return `${tdSubjTabs()}
    <p class="td-hint">Apunta el que has estudiat de <strong>${TD_SUBJECTS[s].name}</strong>. Et queden <strong>${left}</strong> pergamins per a hui (sense comptar els exàmens).</p>
    <div class="td-acts">${TD_ACTIVITIES.map(a => `<button class="td-act" data-act="${a.id}" ${left <= 0 ? "disabled" : ""}><span>${a.icon}</span>${a.name}<strong>+${a.rolls} 📜</strong></button>`).join("")}</div>
    <div class="td-exam"><label>Nota de l'examen <input type="number" id="td-nota" min="0" max="10" step="0.1" placeholder="7,5"></label>
      <button class="secondary" data-exam="parcial">📄 Parcial</button><button data-exam="final">🎓 Final</button></div>
    <p class="td-hint">Parcial o final: 5 → 3 pergamins … 10 → 10. Amb un <strong>${TD_MYTHIC_GRADE} o més al final</strong>, la criatura mítica de l'assignatura.</p>
    ${log.length ? `<ul class="td-log">${log.map(l => `<li>${l.what} <span>+${l.rolls} 📜${l.mythic ? " · ✨ mític" : ""}</span></li>`).join("")}</ul>` : ""}`;
}
function tdDoStudy(actId) {
  const r = tdRegisterStudy(tdSubj, actId);
  if (!r) return;
  if (r.rolls) toast(`📜 +${r.rolls} pergamins de ${TD_SUBJECTS[tdSubj].short}${r.capped ? " (has arribat al límit d'avui)" : ""}`, "good");
  else toast("Ja has arribat al límit d'avui per a aquesta assignatura", "bad");
  tdRenderPanel();
}
function tdDoExam(kind) {
  const nota = Number(String($("td-nota").value).replace(",", "."));
  if (!(nota >= 0 && nota <= 10) || $("td-nota").value === "") { toast("Escriu una nota de 0 a 10", "bad"); return; }
  const r = tdRegisterExam(tdSubj, nota, kind === "final");
  toast(`📜 +${r.rolls} pergamins de ${TD_SUBJECTS[tdSubj].short}`, "good");
  if (r.mythic) tdReveal([r.mythic]);
  tdRenderPanel();
}

// ---- grimori (criatures)
function tdGrimoriHtml() {
  const s = tdSubj;
  const order = ["comu", "rar", "epic", "llegendari", "mitic"];
  const list = Object.entries(TD_DEFENDERS).filter(([, d]) => d.subj === s).sort((a, b) => order.indexOf(a[1].rar) - order.indexOf(b[1].rar));
  if (!tdGrimSel || TD_DEFENDERS[tdGrimSel].subj !== s) tdGrimSel = list.find(([id]) => td.owned[id])?.[0] || null;
  return `${tdSubjTabs()}
    <p class="td-hint">Equip: <strong>${td.team.length} / 6</strong> criatures. Toca'n una per a vore-la, pujar-la de nivell o posar-la a l'equip.</p>
    <div class="td-grim">${list.map(([id, d]) => {
      const own = td.owned[id];
      return `<button class="td-gcell rar-${d.rar}${own ? "" : " locked"}${tdGrimSel === id ? " sel" : ""}${td.team.includes(id) ? " inteam" : ""}" data-grim="${id}" title="${own ? d.name : "???"}">
        <span class="td-gcell-art">${tdCreatureSvg(id)}</span><span class="td-gcell-name">${own ? d.name : "???"}</span>
        ${own ? `<span class="td-gcell-meta">${tdStarStr(tdStars(id))} Nv. ${own.level}</span>` : `<span class="td-gcell-meta">${TD_RARITIES[d.rar].name}</span>`}</button>`;
    }).join("")}</div>
    ${tdGrimSel ? tdGrimDetail(tdGrimSel) : ""}`;
}
function tdGrimDetail(id) {
  const d = TD_DEFENDERS[id], o = td.owned[id], st = tdStats(id), next = tdNextStar(id);
  const cost = o.level < TD_LEVEL_MAX ? tdLevelCost(d.rar, o.level) : null;
  return `<div class="td-detail rar-${d.rar}"><div class="td-detail-art">${tdCreatureSvg(id)}</div>
    <div class="td-detail-info"><h3>${d.name} <small style="color:${TD_RARITIES[d.rar].color}">${TD_RARITIES[d.rar].name}</small></h3>
      <div>${tdStarStr(st.stars)} · Nivell ${o.level}${next ? ` · <span class="muted">còpies ${next.have} / ${next.need} per a la ★${st.stars + 1}</span>` : " · <span class='muted'>estreles al màxim</span>"}</div>
      <div class="td-detail-stats">⚔️ ${fmtNum(st.dmg)} · ⏱ ${st.rate.toFixed(2)}/s · 🎯 ${Math.round(st.range)} · 🔮 ${d.cost}</div>
      <p>${d.desc}</p><p class="muted">★3 i ★5 milloren l'habilitat. Cada estrela: +30 % de dany i +10 % de velocitat. Cada nivell: +12 % de dany.</p>
      <div class="td-detail-btns">${cost != null ? `<button data-lvl="${id}" ${td.saber < cost ? "disabled" : ""}>⬆ Nivell ${o.level + 1} · ✨ ${fmtNum(cost)}</button>` : `<button disabled>Nivell màxim</button>`}
        <button class="secondary" data-team="${id}">${td.team.includes(id) ? "➖ Traure de l'equip" : "➕ Posar a l'equip"}</button></div></div></div>`;
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

// ---- bestiari
function tdBestiaryHtml() {
  return `<p class="td-hint">Les distraccions que t'han atacat. Les que encara no has vist, amagades.</p>
    <div class="td-beasts">${Object.entries(TD_ENEMIES).filter(([, e]) => !e.hidden).map(([id, e]) => {
      const seen = td.seen.includes(id);
      return `<div class="td-beast${seen ? "" : " locked"}${e.boss ? " boss" : ""}"><div class="td-beast-art">${tdEnemySvg(id)}</div>
        <div><strong>${seen ? e.name : "???"}</strong>${e.boss ? ' <span class="td-boss-tag">CAP</span>' : ""}<p>${seen ? e.desc : "Encara no l'has vista."}</p>
        ${seen ? `<p class="muted">❤️ ${e.hp} · 🏃 ${e.speed} · 💎 −${e.lives}</p>` : ""}</div></div>`;
    }).join("")}</div>`;
}

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
  return `<div class="td-student-row"><div class="td-student-big">${TD_STUDENT_SVG}</div>
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
  $("td-reveal").addEventListener("click", () => { $("td-reveal").hidden = true; });
  $("td-card-body").addEventListener("click", ev => {
    const b = ev.target.closest("button");
    if (!b || b.disabled) return;
    const ds = b.dataset;
    if (ds.subj) { tdSubj = ds.subj; tdGrimSel = null; tdRenderPanel(); }
    else if (ds.summon) tdDoSummon(Number(ds.summon));
    else if (ds.act) tdDoStudy(ds.act);
    else if (ds.exam) tdDoExam(ds.exam);
    else if (ds.grim) { if (td.owned[ds.grim]) { tdGrimSel = ds.grim; tdRenderPanel(); } }
    else if (ds.lvl) { if (tdLevelUp(ds.lvl)) tdRenderPanel(); }
    else if (ds.team) tdToggleTeam(ds.team);
    else if (ds.play) { tdClosePanel(); tdOpenBattle(Number(ds.play)); }
    else if (ds.up) { if (tdBuyUpgrade(ds.up)) tdRenderPanel(); }
    else if (ds.equip) tdToggleEquip(ds.equip);
  });
  document.addEventListener("keydown", ev => {
    if (ev.key !== "Escape" || !tdLobbyOpen()) return;
    if (!$("td-reveal").hidden) $("td-reveal").hidden = true;
    else if (!$("td-dialog").hidden) tdClosePanel();
  });
}
