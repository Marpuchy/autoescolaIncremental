// ===== ESTUDI: PRÉSTECS ENTRE MARC I ALBA (pel correu) =====
// Cadascú pot demanar-li a l'altre una criatura concreta o prestar-li'n una. La prestada va a un buit propi (td.loan):
// es pot posar en els combats de la teua sala amb el nivell i les estrelles que té l'amo, i s'hi queda fins que la
// canvies per una altra. Qui la presta no la perd: la poden fer servir tots dos.
// No hi ha cap taula nova: cadascú escriu els seus missatges dins de la seua partida (td.share.out) i llig els de
// l'altre de la partida que l'altre té al núvol (que es pot llegir). Quan ja n'ha contestat un, el posa a td.share.done.
//   ask  {n, k:"ask", def}              → et demane esta criatura
//   give {n, k:"give", def, re?}        → et deixe esta criatura (re: el número de la petició que contesta)
//   no   {n, k:"no", re}                → no te la puc deixar
// Res del que ve de l'altra partida es posa a l'HTML sense passar per TD_DEFENDERS (els id) o Number (els nombres).

let tdShareOther = null;   // l'última partida d'estudi de l'altre llegida del núvol: { data, at }
let tdShareTab = "";       // pestanya del correu: "loans" (préstecs) o "mail" (missatges); buida: la que tinga coses noves
let tdSharePick = "";      // llista oberta per a triar: "ask" (demanar-ne una) o "give" (prestar-ne una)

// Només entre Marc i Alba, cadascú a la seua sala (el perfil comú de proves ja té les dues carreres)
const tdShareWho = () => (typeof cloudWho === "function" ? cloudWho() : null);
const tdShareOn = () => ["marc", "parella"].includes(tdShareWho()) && !tdViewingOf;
const tdShareOtherName = () => PLAYERS[cloudOther()].name;
const tdShareOtherRoom = () => (cloudOther() === "parella" ? "forestal" : "informatic");
const tdShareNum = () => Math.max(Date.now(), ...td.share.out.map(m => m.n + 1)); // número únic per a cada missatge

// Versió de proves: res no arriba al núvol, així que el correu va entre els perfils d'este navegador. Cada perfil deixa
// en local els seus missatges, la prestada i les criatures de la seua sala (tdShareStore), i en tornar a ser-ho, els
// recupera encara que s'haja tornat a copiar la partida real (tdShareRestore). L'altre els llig d'ací (tdShareFetch).
const tdShareTest = () => typeof cloudProd === "function" && !cloudProd();
const tdShareKey = who => `estudi-proves-correu-${who}`;
function tdShareLocal(who) { try { const d = JSON.parse(localStorage.getItem(tdShareKey(who))); return d && typeof d === "object" ? d : null; } catch { return null; } }
function tdShareStore() {
  if (!tdShareTest() || !tdShareOn()) return;
  const owned = Object.fromEntries(Object.entries(td.owned).filter(([id]) => tdModeOf(id) === tdLoanRoom()));
  try { localStorage.setItem(tdShareKey(tdShareWho()), JSON.stringify({ share: td.share, loan: td.loan, owned })); } catch {}
}
function tdShareRestore() {
  if (!tdShareTest() || !tdShareOn()) return;
  const d = tdShareLocal(tdShareWho());
  td.share = tdCleanShare(d?.share); td.loan = tdCleanLoan(d?.loan); // sense res guardat: buit (la partida local pot ser d'un altre perfil)
}

async function tdShareFetch(force = false) {
  if (!tdShareOn()) return null;
  if (!force && tdShareOther && Date.now() - tdShareOther.at < 20000) return tdShareOther.data;
  try {
    const row = await cloudGet(cloudOther(), "estudi");
    tdShareOther = { data: row?.data && typeof row.data === "object" ? row.data : {}, at: Date.now(), ok: true };
  } catch { tdShareOther = { data: tdShareOther?.data || {}, at: Date.now(), ok: tdShareTest() }; }
  const local = tdShareTest() && tdShareLocal(cloudOther()); // proves: el que ha fet l'altre perfil en este navegador
  if (local) tdShareOther.data = { ...tdShareOther.data, share: local.share, owned: { ...(tdShareOther.data.owned || {}), ...(local.owned || {}) } };
  if (tdShareSync()) tdSave();
  return tdShareOther.data;
}
// Missatges de l'altre (només els ben formats) i les seues criatures de la seua sala
const tdShareOut = () => (Array.isArray(tdShareOther?.data?.share?.out) ? tdShareOther.data.share.out : [])
  .filter(m => m && Number.isFinite(m.n) && ["ask", "give", "no"].includes(m.k) && (m.k === "no" || TD_DEFENDERS[m.def]));
const tdShareDoneByOther = n => Array.isArray(tdShareOther?.data?.share?.done) && tdShareOther.data.share.done.includes(n);
function tdShareOtherCreature(id) {
  const o = tdShareOther?.data?.owned?.[id];
  if (!o || typeof o !== "object" || !TD_DEFENDERS[id] || tdModeOf(id) !== tdShareOtherRoom()) return null;
  const stars = Math.max(1, Math.min(Math.floor(Number(o.stars) || 1), tdStarsByCopies(Number(o.copies) || 0, id) || 1));
  return { level: Math.max(1, Math.min(TD_LEVEL_PER_STAR * stars, Math.floor(Number(o.level) || 1))), stars };
}
const tdShareOtherList = () => Object.keys(tdShareOther?.data?.owned || {}).filter(id => tdShareOtherCreature(id));
const tdShareMine = () => Object.keys(td.owned).filter(id => tdModeOf(id) === tdLoanRoom());

// Amb la partida de l'altre llegida: la prestada s'actualitza (nivell i estrelles de l'amo) i, si m'ha deixat la que li
// havia demanat, se'm posa sola al buit. Torna si ha canviat alguna cosa.
function tdShareSync() {
  let changed = false;
  if (td.loan && td.loan.from === cloudOther()) {
    const c = tdShareOtherCreature(td.loan.def);
    if (c && (c.level !== td.loan.level || c.stars !== td.loan.stars)) { Object.assign(td.loan, c); changed = true; }
  }
  const asked = new Set(td.share.out.filter(m => m.k === "ask").map(m => m.n));
  for (const m of tdShareOut()) if (m.k === "give" && asked.has(m.re) && !td.share.done.includes(m.n)) {
    tdShareTake(m); changed = true;
    toast(`🤝 ${tdShareOtherName()} t'ha prestat ${TD_DEFENDERS[m.def].name}`, "good");
  }
  return changed;
}
function tdShareTake(m) {
  const c = tdShareOtherCreature(m.def) || { level: 1, stars: 1 };
  td.loan = tdCleanLoan({ def: m.def, from: cloudOther(), ...c, t: Date.now() });
  td.share.done = [...td.share.done, m.n].slice(-80);
}

// El que m'ha arribat i encara no he contestat (per al correu i per a avisar a la bústia i al forat de l'habitació)
function tdShareInbox() {
  if (!tdShareOn() || !tdShareOther) return [];
  const mine = new Set(td.share.out.map(m => m.n));
  return tdShareOut().filter(m => !td.share.done.includes(m.n) && (m.k === "ask" || (m.k === "give" && !mine.has(m.re)) || (m.k === "no" && mine.has(m.re))));
}
const tdShareNews = () => tdShareInbox().length;
// Les meues peticions i préstecs que l'altre encara no ha contestat
const tdSharePending = () => td.share.out.filter(m => m.k !== "no" && !tdShareDoneByOther(m.n) && !tdShareOut().some(o => o.re === m.n));

function tdShareSend(m) {
  td.share.out = [...td.share.out, { n: tdShareNum(), ...m }].slice(-30);
  tdSave();
}
function tdShareAction(btn) {
  const n = Number(btn.dataset.n), m = tdShareOut().find(x => x.n === n), def = btn.dataset.def;
  tdShareTab = "loans"; // es queda als préstecs encara que ja no quede res per contestar
  const done = () => { td.share.done = [...td.share.done, n].slice(-80); tdSave(); };
  switch (btn.dataset.share) {
    case "pick": tdSharePick = tdSharePick === btn.dataset.pick ? "" : btn.dataset.pick; break;
    case "ask":
      if (!tdShareOtherCreature(def) || tdSharePending().some(x => x.k === "ask" && x.def === def)) break;
      tdShareSend({ k: "ask", def }); tdSharePick = "";
      toast(`📨 Has demanat ${TD_DEFENDERS[def].name} a ${tdShareOtherName()}`, "good"); break;
    case "give":
      if (!td.owned[def] || tdModeOf(def) !== tdLoanRoom()) break;
      tdShareSend({ k: "give", def }); tdSharePick = "";
      toast(`🎁 Li has enviat ${TD_DEFENDERS[def].name} a ${tdShareOtherName()}: ara l'ha d'acceptar`, "good"); break;
    case "cancel": td.share.out = td.share.out.filter(x => x.n !== n); tdSave(); break;
    case "lend": // em demana una: li la deixe
      if (!m || m.k !== "ask" || !td.owned[m.def]) break;
      tdShareSend({ k: "give", def: m.def, re: n }); done();
      toast(`🤝 Li has deixat ${TD_DEFENDERS[m.def].name} a ${tdShareOtherName()}`, "good"); break;
    case "refuse": if (m?.k === "ask") { tdShareSend({ k: "no", re: n }); done(); } break;
    case "accept":
      if (!m || m.k !== "give") break;
      if (td.loan && !confirm(`Ja tens prestada ${TD_DEFENDERS[td.loan.def].name}. La canvies per ${TD_DEFENDERS[m.def].name}?`)) break;
      tdShareTake(m); tdSave();
      toast(`🤝 ${TD_DEFENDERS[m.def].name} ja és al teu buit de préstec`, "good"); break;
    case "reject": case "ok": done(); break;
  }
  tdRenderPanel();
  tdMailboxFlag();
}

// ---- correu (finestra): pestanyes Préstecs i Missatges
function tdShareCard(id, lv, st, extra = "") {
  const d = TD_DEFENDERS[id];
  return `<span class="td-share-card rar-${d.rar}"><span class="td-share-art">${tdCreatureSvg(id)}</span>
    <span><strong>${d.name}</strong> ${tdElemTag(d.el, d.el2)}<span class="muted"> · Nv. ${lv} ${"★".repeat(st)}</span>${extra}</span></span>`;
}
function tdShareHtml() {
  if (!tdShareOn()) return `<p class="muted">${tdViewingOf ? "Els préstecs es fan des de la teua sala." : "Tria qui eres (als ajustos de la vitrina) per a poder prestar-vos criatures."}</p>`;
  const other = tdShareOtherName(), D = TD_DEFENDERS;
  if (!tdShareOther) { tdShareFetch(true).then(() => { if ($("td-card").dataset.panel === "mail") tdRenderPanel(); }); return `<p class="muted">Mirant el correu de ${other}…</p>`; }
  const inbox = tdShareInbox(), pend = tdSharePending(), loan = td.loan;
  const btn = (act, n, label, cls = "") => `<button class="small ${cls}" data-share="${act}" data-n="${n}">${label}</button>`;
  const item = m => {
    if (m.k === "ask") { const o = td.owned[m.def];
      return `<li>${tdShareCard(m.def, o?.level || 1, tdStars(m.def) || 1, `<span class="td-share-what">${other} te la demana</span>`)}
        <span class="td-share-btns">${o ? btn("lend", m.n, "🤝 Deixar-li-la") : `<span class="muted">No la tens</span>`}${btn("refuse", m.n, "No", "secondary")}</span></li>`; }
    if (m.k === "give") { const c = tdShareOtherCreature(m.def) || { level: 1, stars: 1 };
      return `<li>${tdShareCard(m.def, c.level, c.stars, `<span class="td-share-what">${other} te la vol deixar</span>`)}
        <span class="td-share-btns">${btn("accept", m.n, "✔ Acceptar")}${btn("reject", m.n, "No", "secondary")}</span></li>`; }
    const ask = td.share.out.find(x => x.n === m.re);
    return `<li><span class="td-share-note">😕 ${other} no et pot deixar ${ask ? D[ask.def].name : "la criatura"}.</span><span class="td-share-btns">${btn("ok", m.n, "D'acord", "secondary")}</span></li>`;
  };
  const list = tdSharePick === "ask" ? tdShareOtherList().filter(id => id !== loan?.def && !pend.some(x => x.k === "ask" && x.def === id))
    .map(id => { const c = tdShareOtherCreature(id); return `<button class="td-share-pick" data-share="ask" data-def="${id}">${tdShareCard(id, c.level, c.stars)}</button>`; })
    : tdSharePick === "give" ? tdShareMine().map(id => `<button class="td-share-pick" data-share="give" data-def="${id}">${tdShareCard(id, td.owned[id].level, tdStars(id))}</button>`) : [];
  return `<div class="td-share">
    <div class="td-share-slot"><span class="td-share-label">🤝 Buit de préstec</span>
      ${tdShareAltar(loan?.def)}
      ${loan ? `<div><strong>${D[loan.def].name}</strong> ${tdElemTag(D[loan.def].el, D[loan.def].el2)}<span class="muted"> · Nv. ${loan.level} ${"★".repeat(loan.stars)}</span></div>
        <span class="td-share-what">De ${PLAYERS[loan.from].name}. La pots posar als teus mons fins que la canvies per una altra.</span>`
        : `<span class="muted">L'altar està buit. Demana-li una criatura a ${other} o accepta la que et deixe.</span>`}</div>
    ${tdShareOther.ok ? "" : `<p class="muted">⚠️ Sense connexió: no es pot veure el que t'ha enviat ${other}.</p>`}
    ${inbox.length ? `<ul class="td-share-list">${inbox.map(item).join("")}</ul>` : ""}
    <div class="td-share-acts">
      <button class="${tdSharePick === "ask" ? "" : "secondary"}" data-share="pick" data-pick="ask" aria-pressed="${tdSharePick === "ask"}">📨 Demanar-li'n una</button>
      <button class="${tdSharePick === "give" ? "" : "secondary"}" data-share="pick" data-pick="give" aria-pressed="${tdSharePick === "give"}">🎁 Deixar-li'n una</button></div>
    ${tdSharePick ? `<div class="td-share-picks">${list.join("") || `<p class="muted">${tdSharePick === "ask" ? `${other} encara no té criatures que li pugues demanar.` : "No tens criatures."}</p>`}</div>` : ""}
    ${pend.length ? `<ul class="td-share-list sent">${pend.map(m => `<li><span class="td-share-note">${m.k === "ask" ? "📨 Has demanat" : "🎁 Li deixes"} <strong>${D[m.def].name}</strong> · esperant ${other}</span>
      <span class="td-share-btns">${btn("cancel", m.n, "Desfer", "secondary")}</span></li>`).join("")}</ul>` : ""}
  </div>`;
}

// L'altar del buit de préstec: la criatura prestada hi sura damunt (pedra arcana a Informàtica, soca amb molsa al bosc)
function tdShareAltar(def) {
  const forest = tdLoanRoom() === "forestal";
  const glow = forest ? "#9be36a" : "#a78bff", dark = forest ? "#4e3420" : "#2d2548", mid = forest ? "#7a5232" : "#3f3566", top = forest ? "#9a6b3f" : "#544883";
  const base = forest
    ? `<path d="M28 150 Q30 118 34 100 H106 Q110 118 112 150 Z" fill="${mid}" stroke="${dark}" stroke-width="2"/>
       <path d="M44 104 V146 M70 102 V148 M96 104 V146" stroke="${dark}" stroke-width="1.5" opacity="0.5"/>
       <ellipse cx="70" cy="100" rx="38" ry="10" fill="${top}" stroke="${dark}" stroke-width="2"/>
       <ellipse cx="70" cy="100" rx="24" ry="6" fill="none" stroke="${dark}" opacity="0.5"/><ellipse cx="70" cy="100" rx="11" ry="3" fill="none" stroke="${dark}" opacity="0.5"/>
       <path d="M32 98 Q46 90 58 96 M86 95 Q98 89 108 98" stroke="#7fbf4a" stroke-width="5" stroke-linecap="round" fill="none"/>
       <path d="M18 152 Q30 140 40 150 M100 150 Q112 138 124 152" stroke="${dark}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    : `<rect x="26" y="138" width="88" height="14" rx="3" fill="${dark}"/><rect x="42" y="106" width="56" height="34" fill="${mid}" stroke="${dark}" stroke-width="2"/>
       <path d="M56 116 h28 M52 128 h36" stroke="${glow}" stroke-width="2" opacity="0.7"/>
       <path d="M30 98 H110 L104 108 H36 Z" fill="${top}" stroke="${dark}" stroke-width="2"/>
       <ellipse cx="70" cy="98" rx="40" ry="6" fill="${top}" stroke="${glow}" stroke-width="1.5"/>`;
  return `<div class="td-altar${def ? "" : " empty"}" style="--glow:${glow}">
    <svg class="td-altar-base" viewBox="0 0 140 160" aria-hidden="true">
      <ellipse class="td-altar-light" cx="70" cy="96" rx="34" ry="7" fill="${glow}" opacity="0.5"/>${base}
      <path class="td-altar-beam" d="M40 96 L52 10 H88 L100 96 Z" fill="${glow}" opacity="0.08"/></svg>
    ${def ? `<div class="td-altar-float">${tdCreatureSvg(def)}</div>` : ""}</div>`;
}

// ---- la bústia de cada sala (dibuixada amb la sala als generadors tools/sala-*.js, punt «mail») i l'avís de coses noves
const tdMailNews = () => (tdViewingOf ? 0 : tdMailNew().length) + tdShareNews();
function tdMailboxFlag() {
  const n = tdMailNews();
  document.getElementById("td-mailbox")?.classList.toggle("has-news", n > 0);
  document.querySelector('#td-lobby-actions [data-td="mail"]')?.classList.toggle("has-news", n > 0);
}
