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

async function tdShareFetch(force = false) {
  if (!tdShareOn()) return null;
  if (!force && tdShareOther && Date.now() - tdShareOther.at < 20000) return tdShareOther.data;
  try {
    const row = await cloudGet(cloudOther(), "estudi");
    tdShareOther = { data: row?.data && typeof row.data === "object" ? row.data : {}, at: Date.now(), ok: true };
  } catch { tdShareOther = { data: tdShareOther?.data || {}, at: Date.now(), ok: false }; }
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
  const stars = Math.max(1, Math.min(Math.floor(Number(o.stars) || 1), tdStarsByCopies(Number(o.copies) || 0) || 1));
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
    <span><strong>${d.name}</strong> ${tdElemTag(d.el)}<span class="muted"> · Nv. ${lv} ${"★".repeat(st)}</span>${extra}</span></span>`;
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
      ${loan ? tdShareCard(loan.def, loan.level, loan.stars, `<span class="td-share-what">de ${PLAYERS[loan.from].name} · la pots posar als teus mons fins que la canvies</span>`)
        : `<span class="muted">Buit. Demana-li una criatura a ${other} o accepta la que et deixe.</span>`}</div>
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

// ---- la bústia de cada sala (dibuixada a la vora de la catifa) i l'avís de coses noves
const TD_MAILBOX_SVG = {
  // Informàtica: una bústia arcana de metall fosc amb runes, sobre una pota; la bandereta s'alça quan hi ha correu
  informatic: `<g transform="translate(430 820)">
    <ellipse cx="0" cy="2" rx="34" ry="7" fill="#000" opacity="0.35"/>
    <rect x="-5" y="-62" width="10" height="64" fill="#2d2548"/><rect x="-14" y="-4" width="28" height="6" rx="2" fill="#3b3160"/>
    <path d="M-30 -62 V-92 A30 22 0 0 1 30 -92 V-62 Z" fill="#3b3160" stroke="#8b7bff" stroke-width="2"/>
    <path d="M-30 -70 H30" stroke="#8b7bff" stroke-width="1" opacity="0.5"/>
    <rect x="-16" y="-98" width="32" height="4" rx="2" fill="#120e22"/>
    <text x="0" y="-74" text-anchor="middle" font-size="13" fill="#b9adff" opacity="0.8">✉</text>
    <g class="td-mailbox-flag"><rect x="30" y="-104" width="3" height="34" fill="#9a8fb8"/><path d="M33 -104 h16 l-4 6 l4 6 h-16 Z" fill="#ff5a6e"/></g>
    <g class="td-mailbox-letter"><rect x="-12" y="-109" width="24" height="15" rx="2" fill="#fffaf0" stroke="#c9b48a"/><path d="M-12 -109 L0 -100 L12 -109" fill="none" stroke="#c9b48a"/></g></g>`,
  // Forestal: una caseta de fusta damunt d'un pal, com les dels ocells, amb molsa al teulat
  forestal: `<g transform="translate(430 820)">
    <ellipse cx="0" cy="2" rx="34" ry="7" fill="#1d3a12" opacity="0.5"/>
    <rect x="-5" y="-62" width="10" height="64" fill="#6b4a2b"/><path d="M-5 -30 h10" stroke="#4e3420" stroke-width="2"/>
    <rect x="-28" y="-94" width="56" height="34" rx="3" fill="#8a5f36" stroke="#5a3b1f" stroke-width="2"/>
    <path d="M-34 -92 L0 -116 L34 -92 Z" fill="#5a3b1f"/><path d="M-30 -94 Q-10 -104 0 -112 Q14 -102 30 -94" fill="none" stroke="#7fbf4a" stroke-width="4" stroke-linecap="round"/>
    <rect x="-14" y="-84" width="28" height="5" rx="2.5" fill="#2e1d0e"/>
    <path d="M-20 -68 h40" stroke="#5a3b1f" stroke-width="1.5" opacity="0.6"/>
    <g class="td-mailbox-flag"><rect x="28" y="-100" width="3" height="32" fill="#b58a5a"/><path d="M31 -100 h16 l-4 6 l4 6 h-16 Z" fill="#ff7a3d"/></g>
    <g class="td-mailbox-letter"><rect x="-12" y="-98" width="24" height="15" rx="2" fill="#fffaf0" stroke="#c9b48a"/><path d="M-12 -98 L0 -89 L12 -98" fill="none" stroke="#c9b48a"/></g></g>`,
};
const tdMailboxHit = `<rect class="hub-hit" data-td="mail" tabindex="0" role="button" aria-label="Bústia: correu i préstecs" x="390" y="700" width="90" height="130" fill="transparent"><title>Bústia: correu i préstecs</title></rect>`;
const tdMailNews = () => (tdViewingOf ? 0 : tdMailNew().length) + tdShareNews();
function tdMailboxFlag() {
  const n = tdMailNews();
  document.getElementById("td-mailbox")?.classList.toggle("has-news", n > 0);
  document.querySelector('#td-lobby-actions [data-td="mail"]')?.classList.toggle("has-news", n > 0);
  if (typeof roomMail === "function") roomMail();
}
