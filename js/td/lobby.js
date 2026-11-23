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
  setPlace("td-" + tdRoom);
  const sb = document.querySelector('#td-lobby [data-td="student"]'); // icona de l'estudiant: ajolot (Marc) o granoteta (Alba)
  if (sb?.firstChild) sb.firstChild.textContent = tdRoom === "forestal" ? "🐸" : "🎓";
  const settle = () => {
    if (!tdFields().includes(tdSubj)) tdSubj = tdFields()[0];
    if (tdViewingOf) return;
    tdUseRoomArtifacts(tdRoom);
    tdUseRoomUpgrades(tdRoom);
    if (tdStartRoom(tdRoom)) toast(`🎁 Benvinguda: dues criatures i 5 pergamins de cada camp`, "good");
  };
  settle();
  cloudTdEnter(tdRoom).then(() => { settle(); cloudVisitBanner(); if (tdLobbyOpen()) tdRenderLobby(); return Promise.all([tdShareFetch(), typeof cloudMail === "function" && cloudMail()]); }).then(() => tdMailboxFlag());
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
    let svg = l.svg.replace("%STUDENT%", student).replace("%CRYSTAL%", crystal);
    if (!l.spot) return svg;
    if (l.portal) svg = tdPortalLive(l.portal) + svg; // el combat en marxa, darrere del portal
    const [x, y, w, h] = l.hit;
    spots.push([w * h, `<rect class="hub-hit" data-td="${l.spot}" tabindex="0" role="button" aria-label="${l.title}" x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"><title>${l.title}</title></rect>`]);
    return `<g class="hub-art td-art" id="td-art-${l.spot}">${svg}</g>`;
  }).join("");
  const mailbox = `<g class="hub-art td-art td-mailbox${tdMailNews() ? " has-news" : ""}" id="td-mailbox">${TD_MAILBOX_SVG[tdRoom]}</g>`;
  spots.push([0, tdMailboxHit]);
  $("td-lobby-scene").innerHTML = `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-label="${TD_ROOMS[tdRoom].label}"><defs>${ART.defs}</defs>${layers}${mailbox}${spots.sort((x, y) => y[0] - x[0]).map(x => x[1]).join("")}</svg>`; // les zones menudes, damunt
  tdLobbyHud();
}
// Dins del portal es veu el combat que continua sol: el mateix dibuix (un <use> de #tdb-root), retallat per l'el·lipse
function tdPortalLive([cx, cy, rx, ry]) {
  const on = tdb?.idle && tdb.world.mode === tdRoom && $("tdb-root");
  document.getElementById("td-lobby-scene")?.classList.toggle("portal-live", !!on);
  if (!on) return "";
  const vb = $("tdb-svg").getAttribute("viewBox").split(" ").map(Number);
  const k = Math.max(2 * rx / vb[2], 2 * ry / vb[3]) * 1.05; // omplir l'el·lipse
  // sense el fons del combat (pesa molt): només el camí, i damunt el joc (#tdb-play), que es pinta poques vegades per segon
  const paths = tdbWorldPaths(tdb.world).map(p => `<polyline points="${p.map(q => (tdb.portrait ? [900 - q[1], q[0]] : q).join(",")).join(" ")}" fill="none" stroke="${tdRoom === "forestal" ? "#4a3824" : "#24304e"}" stroke-width="80" stroke-linejoin="round" stroke-linecap="round"/>`).join("");
  return `<defs><clipPath id="td-portal-clip"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath></defs>
    <g class="td-portal-live" clip-path="url(#td-portal-clip)"><rect x="${cx - rx}" y="${cy - ry}" width="${2 * rx}" height="${2 * ry}" fill="${tdRoom === "forestal" ? "#0c140c" : "#0b0e14"}"/>
      <g transform="translate(${cx} ${cy}) scale(${k.toFixed(4)}) translate(${-(vb[0] + vb[2] / 2)} ${-(vb[1] + vb[3] / 2)})">${paths}<use href="#tdb-play"/></g></g>`;
}
function tdLobbyHud() {
  $("td-saber").textContent = fmtNum(Math.floor(td.saber));
  const P = TD_POINTS[tdRoom], pts = td.stelles[tdRoom] || 0;
  $("td-perg").innerHTML = tdFields().map(s => `<span title="Pergamins de ${TD_SUBJECTS[s].name}">${tdScrollSvg(s)} <strong>${td.pergamins[s]}</strong></span>`).join("") +
    (pts ? `<span title="${P.name}: compren còpies al grimori">${P.icon} <strong>${pts}</strong></span>` : "");
}

// ---------------------------------------------------------------- finestretes
const TD_PANELS = {
  gacha: "🔮 Altar d'invocació", study: "📚 Prestatgeria d'estudi", grimori: "📖 Grimori", bestiary: "👾 Bestiari",
  worlds: "🌀 Portal dels mons", upgrades: "💎 Cristall", student: "🎓 Estudiant", mail: "✉️ Correu", record: "📒 Registre d'estudi",
};
// al bosc, alguns punts tenen un altre nom
const TD_PANELS_FOREST = { record: "📒 Quadern de camp", student: "🐸 Estudiant", upgrades: "🟢 Jade", gacha: "🌱 Altar d'invocació", worlds: "🌳 Portal dels mons" };
function tdSpot(name) {
  if (name === "exit") { tdCloseLobby(); openRoom(); return; }
  if (name === "reset") { if (tdViewingOf) { toast("👀 És la partida de l'altra persona: no es pot reiniciar", "bad"); return; } tdAskRestart(); return; }
  $("td-card").dataset.panel = name;
  if (name === "mail") Promise.all([tdShareFetch(true), typeof cloudMail === "function" && cloudMail(true)]).then(() => { if ($("td-card").dataset.panel === "mail" && !$("td-dialog").hidden) tdRenderPanel(); }); // el correu, sempre al dia
  if (name === "grimori" || name === "bestiary") tdBook = { tab: name === "grimori" ? tdSubj : "best", page: 0 };
  $("td-card-title").textContent = (tdRoom === "forestal" && TD_PANELS_FOREST[name]) || TD_PANELS[name];
  $("td-dialog").hidden = false;
  tdRenderPanel();
  $("td-card-close").focus();
}
function tdClosePanel() { $("td-dialog").hidden = true; }
function tdRenderPanel() {
  const name = $("td-card").dataset.panel;
  const body = $("td-card-body");
  const html = ({ gacha: tdGachaHtml, study: tdStudyHtml, grimori: tdGrimoriHtml, bestiary: tdBestiaryHtml,
    worlds: tdWorldsHtml, upgrades: tdUpgradesHtml, student: tdStudentHtml, mail: tdMailHtml, record: tdRecordHtml })[name]();
  // si la pàgina continua sent la mateixa criatura (p. ex. en comprar una còpia o pujar de nivell), el combat de
  // demostració no es toca: es canvia tot lo altre i l'iframe segueix on estava, sense tornar a començar
  const live = body.querySelector("iframe.tdbook-arena"), src = live?.getAttribute("src");
  if (live && html.includes(`src="${src}"`) && !body.querySelector(".tdbook-spread[data-turning]")) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    tmp.querySelector(`iframe.tdbook-arena`)?.remove();
    const swap = sel => { const a = body.querySelector(sel), b = tmp.querySelector(sel); if (a && b) a.replaceWith(b); };
    for (const sel of [".tdbook-tabs", ".tdbook-head", ".tdbook-page.right", ".tdbook-nav"]) swap(sel);
  } else body.innerHTML = html;
  tdLobbyHud();
}
const tdSubjTabs = () => `<div class="td-tabs">${tdFields().map(s => [s, TD_SUBJECTS[s]]).map(([s, d]) =>
  `<button class="td-tab s-${s}${tdSubj === s ? " on" : ""}" data-subj="${s}">${d.icon} ${d.short}</button>`).join("")}</div>`;
const tdStarStr = n => `<span class="td-stars">${"★".repeat(n)}<span class="off">${"★".repeat(5 - n)}</span></span>`;

// Llista de quines assignatures va a cada camp (a la dreta de la prestatgeria), perquè se sàpia on apuntar cada cosa
function tdSubjectListHtml() {
  return `<aside class="td-subjlist" aria-label="Assignatures de cada camp"><h4>📋 Assignatures</h4>
    ${tdFields().map(s => { const F = TD_SUBJECTS[s];
      return `<div class="td-subjlist-f s-${s}" style="--fc:hsl(${TD_FIELD_HUE[s]} 70% 62%)"><strong>${F.icon} ${F.name}</strong>
        <ul>${F.classes.map(c => `<li>${c}</li>`).join("")}</ul></div>`; }).join("")}</aside>`;
}

// ---- altar (invocar)
// Fons temàtic de cada banner (SVG): cel del color del camp, raigs de llum, els símbols del camp de fons i, a baix,
// el paisatge de la zona (constel·lació, terminal, circuit, pinar, mapa de camp, riu amb canyes)
function tdBannerBg(s) {
  const h = TD_FIELD_HUE[s], G = TDS_GLYPHS[s] || [], c = (l, a = 1) => `hsl(${h} 70% ${l}% / ${a})`;
  let seed = [...s].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7);
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
  const glyphs = Array.from({ length: 18 }, (_, i) => `<text x="${(rnd() * 800).toFixed(0)}" y="${(20 + rnd() * 200).toFixed(0)}" font-size="${(14 + rnd() * 30).toFixed(0)}"
    transform="rotate(${(rnd() * 40 - 20).toFixed(0)})" fill="${c(75, 0.12 + rnd() * 0.12)}" font-weight="700">${G[i % G.length] || "✦"}</text>`).join("");
  const stars = Array.from({ length: 30 }, () => `<circle cx="${(rnd() * 800).toFixed(0)}" cy="${(rnd() * 180).toFixed(0)}" r="${(0.6 + rnd() * 1.4).toFixed(1)}" fill="#fff" opacity="${(0.3 + rnd() * 0.5).toFixed(2)}"/>`).join("");
  const land = {
    alg: `<circle cx="600" cy="130" r="120" fill="none" stroke="${c(70, 0.25)}" stroke-width="2"/><circle cx="600" cy="130" r="80" fill="none" stroke="${c(70, 0.18)}" stroke-dasharray="6 8"/>
      <path d="M40 260 L160 200 L260 236 L360 190 L470 230" stroke="${c(80, 0.4)}" stroke-width="1.5" fill="none"/>${[[40, 260], [160, 200], [260, 236], [360, 190], [470, 230]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${c(85)}"/>`).join("")}`,
    prg: Array.from({ length: 9 }, (_, i) => `<rect x="${30 + (i % 3) * 18}" y="${160 + i * 15}" width="${60 + ((i * 53) % 180)}" height="6" rx="3" fill="${c(60, 0.3)}"/>`).join("") +
      `<text x="560" y="250" font-size="120" fill="${c(60, 0.18)}" font-weight="800">{ }</text>`,
    maq: `<path d="M0 240 H180 V200 H320 V260 H460 V210 H620 V250 H800 M80 240 V290 M400 260 V300 M700 250 V300" stroke="${c(65, 0.35)}" stroke-width="3" fill="none"/>` +
      [[180, 240], [320, 200], [460, 260], [620, 210]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${c(80)}"/>`).join(""),
    mnt: `<path d="M0 300 L0 230 L120 150 L230 220 L340 140 L470 230 L600 160 L800 250 L800 300 Z" fill="${c(14, 0.9)}"/>` +
      [40, 110, 190, 270, 520, 600, 690, 760].map((x, i) => `<path d="M${x} ${300 - (i % 3) * 10} l20 -70 l20 70 z" fill="${c(9)}"/>`).join(""),
    pin: Array.from({ length: 6 }, (_, i) => `<path d="M0 ${300 - i * 22} Q200 ${250 - i * 26} 400 ${280 - i * 20} T800 ${260 - i * 24}" stroke="${c(65, 0.22)}" stroke-width="2" fill="none"/>`).join("") +
      `<g transform="translate(110 90)" stroke="${c(75, 0.35)}" stroke-width="2" fill="none"><circle r="44"/><path d="M0 -58 V58 M-58 0 H58"/><path d="M0 -44 L8 0 L0 44 L-8 0 Z" fill="${c(70, 0.3)}"/></g>`,
    fau: `<circle cx="640" cy="70" r="34" fill="#f4f9ff" opacity="0.8"/><path d="M0 220 Q200 190 400 214 T800 206 V300 H0 Z" fill="${c(30, 0.6)}"/>
      <path d="M0 246 Q200 232 400 248 T800 240 V300 H0 Z" fill="${c(18, 0.85)}"/>${[600, 630, 660, 690].map((x, i) => `<path d="M${x - 20} ${236 + i * 8} h40" stroke="#f4f9ff" stroke-width="2" opacity="${0.5 - i * 0.1}"/>`).join("")}
      ${[60, 80, 96, 740, 760].map((x, i) => `<path d="M${x} 300 Q${x - 6} 230 ${x + (i % 2 ? 8 : -8)} 170" stroke="${c(12)}" stroke-width="4" fill="none"/><ellipse cx="${x + (i % 2 ? 8 : -8)}" cy="176" rx="4" ry="12" fill="${c(12)}"/>`).join("")}`,
  }[s] || "";
  return `<svg class="td-banner-bg" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="bb-${s}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c(26)}"/><stop offset="1" stop-color="${c(7)}"/></linearGradient>
      <radialGradient id="bl-${s}" cx="0.78" cy="0.15" r="0.7"><stop offset="0" stop-color="${c(80, 0.45)}"/><stop offset="1" stop-color="${c(50, 0)}"/></radialGradient></defs>
    <rect width="800" height="300" fill="url(#bb-${s})"/><rect width="800" height="300" fill="url(#bl-${s})"/>
    ${[0, 1, 2, 3].map(i => `<path d="M${620 + i * 30} -10 L${380 + i * 70} 310 L${430 + i * 70} 310 Z" fill="#fff" opacity="0.04"/>`).join("")}
    ${stars}${glyphs}${land}</svg>`;
}
let tdAltarTab = "summon"; // altar: invocar o Fusió (Matrícula d'Honor)
const tdForgeHow = k => { const F = TD_FORGE[k], w = TD_WORLDS.find(o => o.id === F.world);
  return `${F.from ? F.from.map(id => TD_DEFENDERS[id].name).join(" + ") : `${TD_DEFENDERS[F.evolve].name} + pedra`} · onada ${TD_IDLE.waves} de «${w?.name}»`; };
// Fusió: les receptes de la sala (Matrícula d'Honor). Cada una s'obri a l'onada 100 d'un món
function tdForgeHtml() {
  const list = Object.keys(TD_FORGE).filter(k => tdModeOf(k) === tdRoom);
  const mini = (id, ok) => `<div class="td-forge-in rar-${TD_DEFENDERS[id].rar}${ok ? "" : " missing"}" title="${TD_DEFENDERS[id].name}${ok ? "" : " (no la tens)"}">${tdCreatureSvg(id)}<span>${TD_DEFENDERS[id].name}</span></div>`;
  return `<p class="td-hint">A l'onada ${TD_IDLE.waves} de cada món guanyes una recepta o una pedra. Les criatures que fusiones desapareixen i queda la nova, de <strong style="color:${TD_RARITIES.mh.color}">Matrícula d'Honor</strong> (amb la mitjana de les estrelles; per a pujar-la, les còpies de les dues).</p>
    <div class="td-forge">${list.map(k => { const F = TD_FORGE[k], have = td.forge.includes(k), own = !!td.owned[k], parts = tdForgeParts(k);
      const d = TD_DEFENDERS[k], w = TD_WORLDS.find(o => o.id === F.world);
      // la nova al mig i les ingredients (o la criatura i la pedra) als costats
      const left = mini(parts[0], !!td.owned[parts[0]] || own), right = F.evolve ? `<div class="td-forge-in td-forge-key${have ? "" : " missing"}" title="${F.key}"><span class="td-forge-gem">💎</span><span>Pedra</span></div>` : mini(parts[1], !!td.owned[parts[1]] || own);
      return `<div class="td-forge-row${own ? " done" : have ? "" : " locked"}" data-forgerow="${k}">
        <div class="td-forge-trio"><div class="td-forge-side l">${left}</div><b class="td-forge-arrow">→</b>
        <div class="td-forge-out rar-mh${own || have ? "" : " hidden"}">${own || have ? tdCreatureSvg(k) : `<span class="tdbook-q">?</span>`}<span>${own || have ? d.name : "???"}</span></div>
        <b class="td-forge-arrow">←</b><div class="td-forge-side r">${right}</div></div>
        <div class="td-forge-act">${own ? `<span class="muted">✔ Ja la tens</span>` : !have ? `<span class="muted">🔒 Onada ${TD_IDLE.waves} de «${w?.name}»</span>`
          : `<button data-forge="${k}" ${tdCanForge(k) ? "" : "disabled"}>${F.from ? "⚗️ Fusionar" : "✨ Evolucionar"}</button>${tdCanForge(k) ? "" : `<span class="muted">Et falta alguna criatura</span>`}`}</div></div>`; }).join("")}</div>`;
}
// Cerimònia de la fusió (més gran que la de les mítiques): les ingredients es desmunten peça a peça (cada traç d'energia
// salta i va a fer voltes al nucli del mig) i, amb eixes peces, la nova es munta com un robot, de baix a dalt: cada peça
// arriba volant, encaixa amb un colp (espurna i tremolor) i, al final, s'encén el nucli, gira el cercle de runes i ix el nom.
function tdForgeAnim(k) {
  const F = TD_FORGE[k], parts = tdForgeParts(k);
  if (!tdForge(k)) return;
  tdClosePanel();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const box = document.createElement("div");
  box.id = "td-forge-show";
  box.setAttribute("role", "dialog"); box.setAttribute("aria-label", `Fusió: ${TD_DEFENDERS[k].name}`);
  const S = 240, art = (id, x) => `<g class="fs-src" transform="translate(${x} 150) scale(${S / 132}) translate(6 10)"><g class="fs-root tdc tdc-${id}">${TD_ART[id].svg}</g></g>`;
  const right = F.evolve ? `<g class="fs-src" transform="translate(900 150)"><g class="fs-root fs-gem"><circle cx="120" cy="120" r="70" fill="#7fe8ff" opacity="0.15"/>
      <path d="M120 40 L176 100 L120 200 L64 100 Z" fill="#12303f" stroke="#7fe8ff" stroke-width="6" stroke-linejoin="round"/><path d="M64 100 H176 M120 40 L96 100 L120 200 L144 100 Z" stroke="#bff4ff" stroke-width="3" fill="none"/></g></g>` : art(parts[1], 900);
  box.innerHTML = `<div class="fs-bg"></div><svg class="fs-stage" viewBox="0 0 1380 620" aria-hidden="true">
      <defs><radialGradient id="fs-core-g"><stop offset="0" stop-color="#fff"/><stop offset="0.35" stop-color="#ff3b4e"/><stop offset="1" stop-color="#ff3b4e" stop-opacity="0"/></radialGradient></defs>
      <g class="fs-rays" transform="translate(690 300)">${Array.from({ length: 18 }, (_, i) => `<path d="M0 0 L${Math.cos(i / 18 * 6.283 - 0.06) * 900} ${Math.sin(i / 18 * 6.283 - 0.06) * 900} L${Math.cos(i / 18 * 6.283 + 0.06) * 900} ${Math.sin(i / 18 * 6.283 + 0.06) * 900} Z" fill="#ff3b4e" opacity="0.08"/>`).join("")}</g>
      <circle class="fs-core" cx="690" cy="300" r="70" fill="url(#fs-core-g)"/>
      ${art(parts[0], 240)}${right}
      <g class="fs-new" transform="translate(${690 - 1.45 * S / 2} ${300 - 1.45 * S / 2 - 20}) scale(${1.45 * S / 132}) translate(6 10)"><g class="fs-root tdc tdc-${k}">${TD_ART[k].svg}</g></g>
      <g class="fs-fx"></g></svg>
    <div class="fs-title"><div class="fs-kicker">Matrícula d'Honor</div><div class="fs-name">${TD_DEFENDERS[k].name}</div>
      <div class="fs-sub">${F.from ? parts.map(id => TD_DEFENDERS[id].name).join(" + ") : `${TD_DEFENDERS[F.evolve].name} + pedra`}</div></div>
    <div class="fs-btns"><button class="secondary small" data-fs="skip">Saltar ⏭</button><button data-fs="ok" hidden>✨ Continuar</button></div>`;
  $("td-lobby").appendChild(box);
  const svg = box.querySelector(".fs-stage"), fx = box.querySelector(".fs-fx");
  const finish = () => { box.querySelectorAll("*").forEach(n => n.getAnimations?.().forEach(a => { try { a.finish(); } catch {} })); box.classList.add("done"); box.querySelector('[data-fs="ok"]').hidden = false; box.querySelector('[data-fs="skip"]').hidden = true; };
  const close = () => { clearTimeout(box.timer); box.remove(); tdRenderLobby(); tdSpot("grimori"); tdBook = { tab: TD_DEFENDERS[k].subj, page: tdBookList("grimori", TD_DEFENDERS[k].subj).indexOf(k) + 1 }; tdRenderPanel(); };
  box.addEventListener("click", ev => { const b = ev.target.closest("[data-fs]"); if (!b) return; if (b.dataset.fs === "skip") finish(); else close(); });
  if (reduce) { finish(); return; }
  // les peces d'un dibuix: els traços de neó (cada tube és un <g>), els cercles i els grups de dalt (cercle de runes, nucli, peces)
  const pieces = root => { const out = []; const walk = n => { for (const c of n.children) {
    if (c.tagName === "defs" || c.tagName === "title") continue;
    if (c.tagName === "g" && c.children.length > 3 && !c.matches(".core, .al, .ar")) walk(c); else out.push(c); } };
    walk(root);
    // cada peça dins d'un <g> nou: l'animació va en el grup, i la peça es queda amb el seu transform
    return out.map(n => { const w = document.createElementNS("http://www.w3.org/2000/svg", "g"); w.setAttribute("class", "fs-p"); n.replaceWith(w); w.appendChild(n); return w; }); };
  const centerOf = n => { const b = n.getBBox(), m = n.getCTM(), sm = svg.getCTM().inverse(); const p = new DOMPoint(b.x + b.width / 2, b.y + b.height / 2).matrixTransform(m).matrixTransform(sm); return [p.x, p.y]; };
  const olds = [...box.querySelectorAll(".fs-src .fs-root")].flatMap(pieces), news = pieces(box.querySelector(".fs-new .fs-root"));
  // la nova es munta de baix a dalt: el cercle de runes, el cos, i al final el nucli i les peces que llança
  const rank = w => { const n = w.firstChild; return n.matches(".rune") ? 0 : n.matches(".sparks") ? 4 : n.matches(".core") ? 3 : n.matches(".al, .ar") ? 3.5 : 1; };
  news.forEach(n => { n._c = centerOf(n); });
  news.sort((a, b) => rank(a) - rank(b) || b._c[1] - a._c[1]);
  const kNew = 1.45 * S / 132; // escala de la nova (per a passar distàncies de l'escenari al dibuix)
  news.forEach(n => { n.style.opacity = "0"; n.style.transformBox = "fill-box"; n.style.transformOrigin = "center"; });
  box.querySelector(".fs-new .fs-root").style.animation = "none";
  const T0 = 700, step = Math.max(50, Math.min(110, 1700 / olds.length));
  // 1. desmuntar: cada peça salta, gira i se'n va a fer voltes al nucli
  olds.forEach((n, i) => {
    const [x, y] = centerOf(n), a = Math.random() * 6.283, r = 70 + Math.random() * 60, tx = 690 + Math.cos(a) * r, ty = 300 + Math.sin(a) * r * 0.6;
    const m = n.getCTM(), sm = svg.getCTM(), k2 = (m.a / sm.a) || 1; // l'escala del dibuix
    n.style.transformBox = "fill-box"; n.style.transformOrigin = "center";
    n.animate([{ transform: "translate(0,0) rotate(0) scale(1)", opacity: 1 },
      { transform: `translate(${(Math.random() - 0.5) * 30 / k2}px, ${-40 / k2}px) rotate(${(Math.random() - 0.5) * 60}deg) scale(1.1)`, opacity: 1, offset: 0.25 },
      { transform: `translate(${(tx - x) / k2}px, ${(ty - y) / k2}px) rotate(${(Math.random() - 0.5) * 720}deg) scale(0.45)`, opacity: 0.9, offset: 0.8 },
      { transform: `translate(${(tx - x) / k2}px, ${(ty - y) / k2}px) rotate(${(Math.random() - 0.5) * 900}deg) scale(0.2)`, opacity: 0 }],
      { duration: 1300, delay: T0 + i * step, easing: "cubic-bezier(.4,0,.6,1)", fill: "both" });
  });
  box.querySelector(".fs-core").animate([{ r: 0, opacity: 0 }, { r: 70, opacity: 0.9 }], { duration: 900, delay: T0 + 400, fill: "both" });
  // 2. muntar: cada peça de la nova ix del núvol del nucli, vola al seu lloc i encaixa amb un colp
  const T1 = T0 + olds.length * step + 450, step2 = Math.max(90, Math.min(170, 3200 / news.length));
  news.forEach((n, i) => {
    const [x, y] = n._c, a = Math.random() * 6.283, sx = 690 + Math.cos(a) * 110, sy = 300 + Math.sin(a) * 70;
    const at = T1 + i * step2;
    n.animate([{ transform: `translate(${(sx - x) / kNew}px, ${(sy - y) / kNew}px) rotate(${(Math.random() - 0.5) * 540}deg) scale(0.3)`, opacity: 0 },
      { transform: `translate(${(sx - x) / kNew}px, ${(sy - y) / kNew - 30}px) rotate(${(Math.random() - 0.5) * 180}deg) scale(0.6)`, opacity: 1, offset: 0.25 },
      { transform: "translate(0, -4px) rotate(0) scale(1.18)", opacity: 1, offset: 0.82 },
      { transform: "translate(0,0) rotate(0) scale(1)", opacity: 1 }],
      { duration: 620, delay: at, easing: "cubic-bezier(.3,.1,.3,1)", fill: "both" });
    // l'encaix: espurna on cau la peça i un tremolor menut
    setTimeout(() => {
      if (!box.isConnected || box.classList.contains("done")) return;
      const sp = document.createElementNS("http://www.w3.org/2000/svg", "g");
      sp.setAttribute("transform", `translate(${x} ${y})`);
      sp.innerHTML = `<circle r="18" fill="none" stroke="#ff8a96" stroke-width="3"/>${[0, 1, 2, 3, 4, 5].map(j => `<path d="M0 0 L${Math.cos(j * 1.047 + i) * 22} ${Math.sin(j * 1.047 + i) * 22}" stroke="#fff" stroke-width="2"/>`).join("")}`;
      fx.appendChild(sp);
      sp.animate([{ opacity: 1, transform: `translate(${x}px, ${y}px) scale(0.4)` }, { opacity: 0, transform: `translate(${x}px, ${y}px) scale(1.6)` }], { duration: 380, easing: "ease-out" }).onfinish = () => sp.remove();
      svg.animate([{ transform: "translate(0,0)" }, { transform: `translate(${(i % 2 ? 3 : -3)}px, 2px)` }, { transform: "translate(0,0)" }], { duration: 120 });
    }, at + 510);
  });
  // 3. s'encén: el nucli esclata, els raigs giren i ix el nom
  const T2 = T1 + news.length * step2 + 650;
  box.querySelector(".fs-core").animate([{ r: 70, opacity: 0.9 }, { r: 420, opacity: 0.85, offset: 0.35 }, { r: 120, opacity: 0.25 }], { duration: 1100, delay: T2, fill: "both" });
  box.timer = setTimeout(() => { if (!box.isConnected) return; box.classList.add("lit"); box.querySelector(".fs-new .fs-root").style.animation = ""; }, T2 + 300);
  setTimeout(() => { if (box.isConnected && !box.classList.contains("done")) finish(); }, T2 + 1500);
  toast(`✨ ${TD_DEFENDERS[k].name}: Matrícula d'Honor!`, "good");
}
function tdGachaHtml() {
  const tabs = `<div class="td-tabs td-altar-tabs"><button class="td-tab${tdAltarTab === "summon" ? " on" : ""}" data-atab="summon">🔮 Invocar</button>
    <button class="td-tab${tdAltarTab === "forge" ? " on" : ""}" data-atab="forge" style="--fc:${TD_RARITIES.mh.color}">⚗️ Fusió${Object.keys(TD_FORGE).some(k => tdModeOf(k) === tdRoom && tdCanForge(k)) ? ' <span class="td-mail-dot">!</span>' : ""}</button></div>`;
  if (tdAltarTab === "forge") return tabs + tdForgeHtml();
  return tabs + tdSummonHtml();
}
function tdSummonHtml() {
  const s = tdSubj, F = TD_SUBJECTS[s], p = td.pity[s] || { epic: 0, llegendari: 0, mitic: 0 }, n = td.pergamins[s] || 0, P = TD_POINTS[tdRoom];
  const ord = ["comu", "rar", "epic", "llegendari", "mitic"]; // el que pot eixir, de menys a més rar
  const pool = Object.entries(TD_DEFENDERS).filter(([, d]) => d.subj === s && d.rar !== "mh").sort((a, b) => ord.indexOf(a[1].rar) - ord.indexOf(b[1].rar));
  const R = tdRates(s), boost = !!td.boost[s], pct = x => String(+(x * 100).toFixed(1)).replace(".", ",") + " %";
  const small = pool.filter(([, d]) => !["llegendari", "mitic"].includes(d.rar)), feat = pool.filter(([, d]) => ["llegendari", "mitic"].includes(d.rar));
  const card = ([id, d]) => `<div class="td-banner-c rar-${d.rar}" title="${d.name} · ${TD_RARITIES[d.rar].name} · ${pct(R[d.rar])}${d.rar === "mitic" ? ` (segura amb un ${TD_MYTHIC_GRADE} o més a l'examen final)` : ""}">
    <div class="td-banner-art">${tdCreatureSvg(id)}</div><span style="color:${TD_RARITIES[d.rar].color}">${d.name}</span></div>`;
  // banner a l'estil dels gacha: a la dreta, les protagonistes (llegendàries i mítica) en gran; a l'esquerra, el títol i la resta
  return `${tdSubjTabs()}
    <div class="td-banner${boost ? " boost" : ""}" style="--fh:${TD_FIELD_HUE[s]}">${tdBannerBg(s)}
      <div class="td-banner-info">
        <div class="td-banner-kicker">Invocació${boost ? `<span class="td-banner-boost" title="Has tret un ${TD_MYTHIC_GRADE} o més en un examen final: este camp té millors probabilitats per sempre">✨ Potenciat</span>` : ""}</div>
        <div class="td-banner-title">${F.icon} ${F.name}</div>
        <div class="td-banner-row">${small.map(card).join("")}</div>
        <div class="td-banner-pity">Èpic en <strong>${TD_PITY.epic - p.epic}</strong> · Llegendari en <strong>${TD_PITY.llegendari - p.llegendari}</strong> · Mític en <strong>${TD_PITY.mitic - (p.mitic || 0)}</strong></div>
      </div>
      <div class="td-banner-feat n${feat.length}">${feat.map(card).join("")}</div>
    </div>
    <div class="td-summon-btns">
      <button class="big td-summon" data-summon="1" ${n < 1 ? "disabled" : ""}>Invocar ×1 · ${tdScrollSvg(s)} 1</button>
      <button class="big td-summon" data-summon="10" ${n < 10 ? "disabled" : ""}>Invocar ×10 · ${tdScrollSvg(s)} 10</button></div>
    <div class="td-gacha-foot"><span>${tdScrollSvg(s)} <strong>${n}</strong> pergamins de ${F.short}</span>
      <details class="td-gacha-det"><summary>Detalls</summary>
        <div class="td-rates">${ord.map(r => `<span style="color:${TD_RARITIES[r].color}">${TD_RARITIES[r].name} ${pct(R[r])}${tdPool(s, r).length ? "" : ` → ${P.icon} ${TD_POINT_GAIN[r] || 1}`}</span>`).join(" · ")}</div>
        <p class="td-hint">Garanties: èpic a la tirada ${TD_PITY.epic}, llegendari a la ${TD_PITY.llegendari} i mític a la ${TD_PITY.mitic}; en l'últim 15 % abans de cada una, la probabilitat va pujant.</p>
        <p class="td-hint">${boost ? "✨ Camp potenciat" : `Amb un ${TD_MYTHIC_GRADE} o més en un examen final, a més de la mítica, el camp queda potenciat per sempre`}: èpic ${pct(TD_RATES.boost.epic)}, llegendari ${pct(TD_RATES.boost.llegendari)}, mític ${pct(TD_RATES.boost.mitic)}.</p>
        <p class="td-hint">Assignatures: ${F.classes.join(", ")}. Els pergamins només s'aconseguixen estudiant.</p>
        <p class="td-hint">${P.icon} Per davall de llegendari, ${TD_POINT_SWAP * 100} % de les tirades donen ${P.name} en lloc de la còpia${["comu", "rar", "epic"].some(r => !tdPool(s, r).length) ? ", i també les rareses que este camp no té" : ""}; al grimori es canvien per còpies.</p>
      </details></div>`;
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
  maq: ["Ω", "V", "A", "∿", "⏚", "Hz", "1", "0", "+", "−"],
  fau: ["≈", "∿", "⋔", "ψ", "↟", "∴", "◦", "⌒", "~", "○"],
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
    desc: `${tdPool(r.subj, r.rar).length ? `En lloc d'una còpia ${TD_RARITIES[r.rar].name.toLowerCase()}` : `${TD_SUBJECTS[r.subj].name} no té cap criatura ${TD_RARITIES[r.rar].name.toLowerCase()}`}. Al grimori, ${P.name} es canvien per còpies de qualsevol criatura.` };
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
      <div class="td-rcard-name">${r.points ? TD_POINTS[r.mode].name : d.name}</div><div class="td-rcard-tag">${r.points ? `+${r.points} ${TD_POINTS[r.mode].icon}` : r.isNew ? "NOVA!" : r.ready ? `Pot pujar a ★${r.stars + 1}` : r.saber ? `+${r.saber} ✨` : tdStarStr(r.stars)}</div></div>`;
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
const TD_FIELD_HUE = { alg: 258, prg: 150, maq: 195, mnt: 105, pin: 32, fau: 174 };
// Color del llom: tots els llibres d'un camp són de la mateixa gamma
const tdSpineColor = (f, i) => `hsl(${TD_FIELD_HUE[f] + ((i * 5) % 3 - 1) * 14} ${42 + (i % 3) * 8}% ${26 + ((i * 3) % 4) * 5}%)`;
function tdMissionsHtml() {
  const now = new Date(), end = new Date(now); end.setHours(24, 0, 0, 0);
  const mins = Math.max(0, Math.round((end - now) / 60000));
  return `<div class="td-missions"><div class="td-missions-pin"></div><h4>📌 Missions d'avui</h4>
    <ul>${tdMissions(tdRoom).map(m => { const a = TD_ACTIVITIES.find(x => x.id === m.a), F = TD_SUBJECTS[m.f];
      return `<li class="${m.done ? "done" : ""}"><span>${a.icon} ${a.short} ×${m.need} <small>${F.short}</small></span>
        <span class="td-mission-bar"><i style="width:${100 * Math.min(m.have, m.need) / m.need}%"></i><b>${Math.min(m.have, m.need)}/${m.need}</b></span>
        <strong>${m.done ? "✔" : `+${m.bonus} ${tdScrollSvg(m.f)}`}</strong></li>`; }).join("")}</ul>
    <p class="td-missions-time">⏳ Queden ${Math.floor(mins / 60)} h ${mins % 60} min</p></div>`;
}
function tdStudyHtml() {
  const fields = tdFields();
  const log = td.log.filter(l => fields.includes(l.subj));
  const row = i => {
    const f = fields[i];
    if (!f) return `<div class="td-shelf empty"><div class="td-shelf-label">Pròximament</div><div class="td-shelf-books"></div></div>`;
    const F = TD_SUBJECTS[f], left = tdDailyLeft(f);
    return `<div class="td-shelf s-${f}"><div class="td-shelf-label">${F.icon} ${F.name}<small>${left} ${tdScrollSvg(f)} hui</small></div>
      <div class="td-shelf-books">${TD_ACTIVITIES.map((a, j) => `<button class="td-spine" data-act="${a.id}" data-field="${f}" style="--c:${tdSpineColor(f, j)};--h:${a.h}%" title="${a.name} · +${a.rolls} pergamins de ${F.name}" ${left <= 0 ? "disabled" : ""}>
          <span class="td-spine-i">${a.icon}</span><span class="td-spine-t">${a.short}</span><span class="td-spine-r">+${a.rolls}</span></button>`).join("")}
        <button class="td-tome" data-exambook="${f}" title="Exàmens de ${F.name}: obri'l per a apuntar una nota"><span>🎓</span><b>Exàmens</b></button></div></div>`;
  };
  return `<p class="td-hint">Cada lleixa és un camp: agafa el llibre del que has fet. Al final, el llibre d'exàmens.</p>
    <div class="td-study"><div class="td-study-side">${tdMissionsHtml()}
        <div class="td-log-card"><h4>🗒️ Últim que has apuntat</h4>${log.length ? `<ul class="td-log">${log.map(l => `<li><span>${l.what}</span><span>+${l.rolls} ${tdScrollSvg(l.subj)}${l.mythic ? " ✨" : ""}</span></li>`).join("")}</ul>` : `<p class="muted">Encara res.</p>`}</div></div>
      <div class="td-bookcase">${Array.from({ length: TD_SHELF_ROWS }, (_, i) => row(i)).join("")}</div>
      ${tdSubjectListHtml()}</div>
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
      <p class="muted">5 → 3 pergamins … 10 → 10. Amb un <strong>${TD_MYTHIC_GRADE} o més al final</strong>, la criatura mítica de ${F.name} i el seu altar potenciat per sempre.</p></div></div>`;
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
  if (r.mythic) { tdReveal([r.mythic]); toast(`✨ L'altar de ${TD_SUBJECTS[f].short} queda potenciat per sempre`, "good"); }
  tdRenderPanel();
}

// ---- llibres (grimori i bestiari): una criatura o distracció per doble pàgina; es passa pàgina
// Marcapàgines: una assignatura per marcapàgines (cada una amb el seu paper) i, al grimori, l'equip.
let tdBook = { tab: "alg", page: 0 };
let tdTeamFilter = "all"; // filtre de «Les teues criatures»: all · fav · alg · prg
let tdTeamSort = "rar";   // ordre de «Les teues criatures»: raresa, cost, element, nivell, nom
const TD_TEAM_SORTS = {
  rar: ["💎 Raresa", (a, b) => TD_RAR_ORDER.indexOf(TD_DEFENDERS[b].rar) - TD_RAR_ORDER.indexOf(TD_DEFENDERS[a].rar)],
  cost: ["🔮 Cost", (a, b) => TD_DEFENDERS[a].cost - TD_DEFENDERS[b].cost],
  el: ["⚛️ Element", (a, b) => Object.keys(TD_ELEMENTS).indexOf(TD_DEFENDERS[a].el) - Object.keys(TD_ELEMENTS).indexOf(TD_DEFENDERS[b].el)],
  lvl: ["⬆️ Nivell", (a, b) => (td.owned[b].level - td.owned[a].level) || (tdStars(b) - tdStars(a))],
  role: ["🎯 Tipus", (a, b) => TD_DEFENDERS[a].role.localeCompare(TD_DEFENDERS[b].role)],
};
const TD_RAR_ORDER = ["comu", "rar", "epic", "llegendari", "mitic", "mh"];
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
  fau: "Criatures de la fauna: caça i pesca. Observen de lluny, enganxen i arrosseguen, enverinen i fan recular les distraccions pel camí.",
  maq: "Criatures de la màquina: bobines, condensadors i corrent elèctric. Carreguen energia i la descarreguen de colp, saltant d'una distracció a l'altra.",
  mnt: "Criatures del mateix bosc: pins, anells de tronc, foc controlat i carrasques velles. Aguanten el camí i protegixen les del costat.",
  pin: "El quadern de camp: brúixoles, llavors que volen lluny, anelles de marcatge i el projecte que ho ajunta tot.",
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
      <p class="tdbook-text muted">Invoca-les a l'altar amb pergamins de ${f.name}; la mítica és raríssima a l'altar, però és segura amb un ${TD_MYTHIC_GRADE} o més en un examen final.</p>
      <p class="tdbook-intro-count">En tens <strong>${have}</strong> de <strong>${list.length}</strong></p></div>`,
    `<h3 class="tdbook-name">Índex</h3><ol class="tdbook-index">${list.map(row).join("")}</ol>`];
}
function tdCreaturePages(id) {
  const d = TD_DEFENDERS[id], o = td.owned[id], r = TD_RARITIES[d.rar];
  if (!o) return [`<div class="tdbook-art locked" style="--rc:${r.color}"><span class="tdbook-q">?</span></div><h3 class="tdbook-name">???</h3><div class="tdbook-rar" style="color:${r.color}">${r.name}</div>`,
    `<p class="tdbook-text">${d.rar === "mh" ? "Encara no la tens." : tdForgedInto(id) ? `L'has convertida en ${TD_DEFENDERS[tdForgedInto(id)].name}: les còpies que en traus van a ella.` : "Encara no has invocat aquesta criatura."}</p><p class="tdbook-text muted">${d.rar === "mh" ? `Matrícula d'Honor: ${tdForgeHow(id)} (altar → Fusió).` : d.rar === "mitic" ? `És raríssima a l'altar; segura traent un ${TD_MYTHIC_GRADE} o més a l'examen final d'una assignatura de ${TD_SUBJECTS[d.subj].name} (${TD_SUBJECTS[d.subj].classes.join(", ")}).` : `Pot eixir a l'altar, amb pergamins de ${TD_SUBJECTS[d.subj].name}.`}</p>`];
  const st = tdStats(id), next = tdNextStar(id), cap = tdLevelCap(id);
  const cost = o.level < cap ? tdLevelCost(d.rar, o.level) : null;
  // millores de l'habilitat: per estreles i per nivell
  const steps = [...TD_ABILITY_LEVELS.map(l => [`Nv. ${l}`, o.level >= l]), ["★3", st.stars >= 3], ["★5", st.stars >= 5]];
  const lvlBtn = cost != null ? `<button data-lvl="${id}" ${td.saber < cost ? "disabled" : ""}>⬆ Nv. ${o.level + 1} · ✨ ${fmtNum(cost)}</button>`
    : `<button disabled>${o.level >= TD_LEVEL_MAX ? "Nivell màxim" : `Cal ★${st.stars + 1}`}</button>`;
  // pàgina esquerra: dalt (1/3) la fitxa (dibuix, nom, raresa, estreles, còpies); baix (2/3) el combat de demostració
  return [`<div class="tdbook-creature"><div class="tdbook-head">
      <div class="tdbook-art rar-${d.rar}">${tdCreatureSvg(id)}</div>
      <div class="tdbook-id"><h3 class="tdbook-name">${d.name}</h3>
        <div class="tdbook-rar" style="color:${r.color}">${r.name}</div><div class="tdbook-stars">${tdStarStr(st.stars)}</div>
        <div class="tdbook-prog" title="Còpies per a la següent estrela"><div style="width:${next ? Math.min(100, 100 * next.have / next.need) : 100}%"></div>
          <span>${next ? `${next.have} / ${next.need}` : "MÀX"}</span></div>
        ${tdCanBuyCopy(id) ? `<button class="secondary small tdbook-buy" data-buy="${id}" ${(td.stelles[tdModeOf(id)] || 0) < tdCopyPrice(id) ? "disabled" : ""} title="Tens ${td.stelles[tdModeOf(id)] || 0} ${TD_POINTS[tdModeOf(id)].name}">+1 còpia · ${TD_POINTS[tdModeOf(id)].icon} ${tdCopyPrice(id)}</button>` : ""}
        ${next && next.have >= next.need ? `<button class="tdbook-ascend" data-ascend="${id}" ${td.saber < tdAscendCost(id) ? "disabled" : ""}>⭐ Pujar a ★${st.stars + 1} · ✨ ${fmtNum(tdAscendCost(id))}</button>` : ""}</div></div>
      <iframe class="tdbook-arena" src="tddemo.html?d=${id}" title="Demostració: ${d.name} en combat" tabindex="-1" loading="lazy"></iframe></div>`,
    `<p class="tdbook-text">${d.desc}</p>${d.rar === "mh" ? `<p class="tdbook-text muted">Matrícula d'Honor: ${tdForgeHow(id)}.</p>` : ""}
     <table class="tdbook-stats"><tr><th>Nivell</th><td>${o.level} / ${cap}${cap < TD_LEVEL_MAX ? ` <span class="muted">(més amb ★${st.stars + 1})</span>` : ""}</td></tr><tr><th>Dany</th><td>${fmtNum(st.dmg)}</td></tr>
       <tr><th>Velocitat</th><td>${st.rate.toFixed(2)} / s</td></tr><tr><th>Abast</th><td>${Math.round(st.range)}</td></tr><tr><th>Cost</th><td>🔮 ${d.cost}</td></tr>
       <tr><th>Element</th><td>${tdElemTag(d.el, d.el2)}</td></tr>
       ${d.special?.type === "align" ? `<tr><th>Paràlisi</th><td>${String(+(d.special.dur * st.ability).toFixed(1)).replace(".", ",")} s <span class="muted">(puja amb l'habilitat)</span></td></tr>` : ""}
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
    `<p class="tdbook-text tdbook-lore">${e.lore || ""}</p><p class="tdbook-text"><strong>Habilitat:</strong> ${e.desc}${e.boss ? ` <strong>Si arriba al cristall, en lleva ${TD_IDLE.bossLives}.</strong>` : ""}</p><table class="tdbook-stats"><tr><th>Vida</th><td>${Math.round(e.hp * TD_DIFFICULTY.hp)} <span class="muted">(+${Math.round(TD_WAVE_HP * (e.boss ? 50 : 100))} % per onada)</span></td></tr>
      <tr><th>Velocitat</th><td>${e.speed}</td></tr><tr><th>Dany al cristall</th><td>${e.boss ? TD_IDLE.bossLives : e.lives}</td></tr>
      ${e.weak ? `<tr><th>Feble a</th><td>${tdElemTag(e.weak)} <span class="muted">×${String(TD_ELEM_WEAK).replace(".", ",")}</span></td></tr>` : ""}
      ${e.strong ? `<tr><th>Forta contra</th><td>${tdElemTag(e.strong)} <span class="muted">×${String(TD_ELEM_STRONG).replace(".", ",")}</span></td></tr>` : ""}</table>
      ${e.why ? `<p class="tdbook-text muted">${e.why}</p>` : ""}`];
}
function tdTeamPages() {
  const team = tdTeam(tdRoom), slots = Array.from({ length: 6 }, (_, i) => team[i]);
  // les preferides, primer; després, per assignatura i raresa
  const owned = Object.keys(TD_DEFENDERS).filter(id => td.owned[id] && tdModeOf(id) === tdRoom)
    .filter(id => tdTeamFilter === "all" || (tdTeamFilter === "fav" ? td.favs.includes(id) : TD_DEFENDERS[id].subj === tdTeamFilter))
    .sort((a, b) => (td.favs.includes(b) - td.favs.includes(a)) || TD_TEAM_SORTS[tdTeamSort][1](a, b) || TD_DEFENDERS[a].name.localeCompare(TD_DEFENDERS[b].name));
  if (!["all", "fav", ...tdFields()].includes(tdTeamFilter)) tdTeamFilter = "all";
  const filters = [["all", "Totes"], ["fav", "★ Preferides"], ...tdFields().map(s => [s, `${TD_SUBJECTS[s].icon} ${TD_SUBJECTS[s].short}`])];
  return [`<h3 class="tdbook-name">Equip</h3><p class="tdbook-text muted">Les 6 criatures que portes al combat. Toca'n una per a traure-la.</p>
      <div class="tdbook-team">${slots.map(id => id ? `<button class="tdbook-tslot rar-${TD_DEFENDERS[id].rar}" data-team="${id}" title="Traure ${TD_DEFENDERS[id].name} · ${TD_ELEMENTS[TD_DEFENDERS[id].el].name}">${tdElemDot(id)}${tdCreatureSvg(id)}<span>${TD_DEFENDERS[id].name}</span><span class="tdbook-cost">🔮 ${TD_DEFENDERS[id].cost}</span></button>`
        : `<div class="tdbook-tslot empty">+</div>`).join("")}</div>`,
    `<h3 class="tdbook-name">Les teues criatures</h3>
      <div class="tdbook-filters">${filters.map(([f, l]) => `<button class="tdbook-filter${tdTeamFilter === f ? " on" : ""}" data-filter="${f}">${l}</button>`).join("")}</div>
      <div class="tdbook-filters tdbook-sorts"><span class="muted">Ordenar:</span>${Object.entries(TD_TEAM_SORTS).map(([k, [l]]) => `<button class="tdbook-filter${tdTeamSort === k ? " on" : ""}" data-tsort="${k}" aria-pressed="${tdTeamSort === k}">${l}</button>`).join("")}</div>
      ${owned.length ? "" : `<p class="tdbook-text muted">${tdTeamFilter === "fav" ? "Encara no tens preferides: marca-les amb ☆ a les pàgines del grimori." : "No en tens cap d'aquest camp."}</p>`}
      <div class="tdbook-owned">${owned.map(id => `<button class="tdbook-mini rar-${TD_DEFENDERS[id].rar}${td.team.includes(id) ? " inteam" : ""}${td.favs.includes(id) ? " fav" : ""}" data-team="${id}" title="${TD_DEFENDERS[id].name} · ${TD_ELEMENTS[TD_DEFENDERS[id].el].name} · ${TD_DEFENDERS[id].cost} de maná">${tdElemDot(id)}${tdCreatureSvg(id)}<span class="tdbook-cost">🔮 ${TD_DEFENDERS[id].cost}</span></button>`).join("")}</div>`];
}
// Passar pàgina com en un llibre de veritat: la fulla gira sobre el llom (davant, la pàgina vella; darrere, la nova)
// i el que hi ha davall no canvia fins que la fulla cau. En mòbil (una pàgina damunt de l'altra), es fon.
function tdTurnPage(dir, to = null) {
  const spread = document.querySelector(".tdbook-spread");
  if (!spread || spread.dataset.turning) return;
  if (to != null) { if (to === tdBook.page) return; dir = to > tdBook.page ? 1 : -1; }
  // les còpies de pàgina que fan la fulla no porten el combat de demostració (un iframe que es tornaria a carregar i
  // començaria de nou): un requadre quiet en el seu lloc. El de veritat només es carrega una vegada, al seu lloc final.
  const still = html => html.replace(/<iframe class="tdbook-arena"[^>]*><\/iframe>/g, '<div class="tdbook-arena still"></div>');
  const oldL = still(spread.querySelector(".left").innerHTML), oldR = still(spread.querySelector(".right").innerHTML);
  tdBook.page = to != null ? to : tdBook.page + dir;
  tdRenderPanel();
  const sp = document.querySelector(".tdbook-spread");
  if (getComputedStyle(sp).gridTemplateColumns.split(" ").length < 3) { sp.classList.add("fade-in"); return; }
  sp.dataset.turning = "1";
  const under = sp.querySelector(dir > 0 ? ".left" : ".right"), newUnder = under.innerHTML;
  const newFace = still(newUnder);
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
// ---- faristol del registre: tot el que s'ha apuntat per camp (activitats, pàgines, exàmens i notes)
function tdRecordHtml() {
  if (!tdFields().includes(tdSubj)) tdSubj = tdFields()[0];
  const R = td.record, f = tdSubj, F = TD_SUBJECTS[f], acts = R.acts[f] || {};
  const all = tdFields().reduce((n, s) => n + Object.values(R.acts[s] || {}).reduce((a, b) => a + b, 0), 0);
  const ex = R.exams.filter(e => e.f === f), avg = l => l.length ? (l.reduce((a, e) => a + e.nota, 0) / l.length) : null;
  const fmt = n => n == null ? "—" : n.toFixed(1).replace(".", ",");
  const byCls = F.classes.map(c => [c, ex.filter(e => e.cls === c)]).filter(([, l]) => l.length);
  const noCls = ex.filter(e => !e.cls);
  const date = t => t ? new Date(t).toLocaleDateString("ca", { day: "numeric", month: "short" }) : "";
  const grade = e => `<span class="td-rec-grade${e.nota >= 5 ? "" : " fail"}${e.final ? " final" : ""}" title="${e.final ? "Final" : "Parcial"} · ${date(e.t)}">${fmt(e.nota)}</span>`;
  return `<div class="td-record">
    <div class="td-rec-sum"><span>📅 <strong>${R.days.length}</strong> dies estudiant</span><span>📚 <strong>${all}</strong> coses apuntades</span>
      <span>🎓 <strong>${R.exams.filter(e => tdFields().includes(e.f)).length}</strong> exàmens · mitjana <strong>${fmt(avg(R.exams.filter(e => tdFields().includes(e.f))))}</strong></span></div>
    ${tdSubjTabs()}
    <div class="td-rec-cols">
      <section><h4>${F.icon} Què has fet de ${F.name}</h4>
        <ul class="td-rec-acts">${TD_ACTIVITIES.map(a => `<li><span>${a.icon} ${a.name}</span><strong>${acts[a.id] || 0}</strong></li>`).join("")}</ul>
        <p class="muted">${acts.resum ? `📝 ${acts.resum} ${acts.resum === 1 ? "pàgina" : "pàgines"} de resum · ` : ""}✏️ ${(acts.exercici || 0) + (acts.llarg || 0)} fulls i problemes · 🏫 ${acts.classe || 0} classes</p></section>
      <section><h4>🎓 Notes</h4>
        ${byCls.length || noCls.length ? `<ul class="td-rec-exams">${byCls.map(([c, l]) => `<li><span>${c}</span><span class="td-rec-grades">${l.map(grade).join("")}</span><small>mitjana ${fmt(avg(l))}</small></li>`).join("")}
          ${noCls.length ? `<li><span>Sense assignatura</span><span class="td-rec-grades">${noCls.map(grade).join("")}</span><small>mitjana ${fmt(avg(noCls))}</small></li>` : ""}</ul>
          <p class="muted">Vora daurada: examen final. En roig: suspés.</p>` : `<p class="muted">Encara no has apuntat cap examen de ${F.name}: es fa al llibre d'exàmens de la prestatgeria.</p>`}</section></div></div>`;
}

const tdBestiaryHtml = () => tdBookHtml("bestiary");
const tdGrimoriHtml = () => tdBookHtml("grimori");

// ---- portal (mons)
function tdWorldsHtml() {
  return `<div class="td-portal"><aside class="td-portal-team" aria-label="El teu equip"><h4>Equip</h4>
      ${tdDeck(tdRoom).map(id => { const d = TD_DEFENDERS[id], s = tdStats(id), lent = !td.owned[id];
        return `<div class="td-portal-mon rar-${d.rar}${lent ? " lent" : ""}" title="${d.name} · ${TD_ELEMENTS[d.el].name}${d.el2 ? " + " + TD_ELEMENTS[d.el2].name : ""}${lent ? " · prestada" : ""}">${tdElemDot(id)}<span class="td-portal-art">${tdCreatureSvg(id)}</span>
          <span class="td-portal-name">${d.name}${lent ? " 🤝" : ""}</span><span class="muted">Nv. ${s.level} ${"★".repeat(s.stars)} · 🔮 ${d.cost}</span></div>`; }).join("")}
      <button class="secondary small" data-go="grimori">📖 Canviar l'equip</button></aside>
    <div class="td-portal-main"><p class="td-hint">${TD_IDLE.waves} onades per món, i no es perd mai el que has fet: si una onada va mal, es torna a fer. El combat continua sol encara que te'n vages. A la 50, ×4, mapa més gran i el món següent.</p>
    <div class="td-worlds">${TD_WORLDS.filter(w => w.mode === tdRoom).map(w => {
      const p = td.worlds[w.id] || { best: 0, clears: 0 }, shut = tdWorldShut(w), prev = shut && TD_WORLDS.find(o => o.id === w.needs);
      const run = p.run, live = tdb?.idle && (tdb.world.base || tdb.world).id === w.id, now = live ? Math.max(1, tdb.wave) : run?.snap?.wave;
      const pct = Math.round(100 * Math.min(p.best, TD_IDLE.waves) / TD_IDLE.waves);
      return `<div class="td-world${w.soon || shut ? " locked" : ""}${live ? " live" : ""}"><div class="td-world-info"><strong>${tdWorldNum(w)}. ${w.name}</strong> <span class="muted">· ${w.layout}</span>
        ${w.soon ? `<div class="muted">Pròximament</div>` : shut ? `<div class="muted">Arriba a l'onada ${TD_IDLE.openAt} de «${prev.name}» per a obrir-lo</div>`
          : `<div class="td-world-bar" title="Millor onada: ${p.best} / ${TD_IDLE.waves}"><i style="width:${pct}%"></i><b>${p.best} / ${TD_IDLE.waves}</b></div>
          <div class="muted">${live ? `⚔️ En marxa · onada ${now}` : now ? `En pausa a l'onada ${now}` : "Encara no hi has jugat"}${p.clears ? ` · acabat ${p.clears}×` : ""}</div>`}</div>
        ${w.soon || shut ? "<span>🔒</span>" : `<div class="td-world-btns"><button data-play="${w.id}">${live ? "👀 Mirar" : now ? "▶ Continuar" : "▶ Jugar"}</button>
          ${run?.tens || live && tdRun(w.id).run?.tens ? `<button class="secondary small" data-wreset="${w.id}:10" title="Torna a com començava l'onada ${(run?.tens || tdRun(w.id).run.tens).wave}, amb les criatures i el maná d'aquell moment">↺ A l'onada ${(run?.tens || tdRun(w.id).run.tens).wave}</button>` : ""}
          ${now ? `<button class="secondary small" data-wreset="${w.id}:0" title="Des de l'onada 1, sense criatures posades">⟲ Des de 0</button>` : ""}</div>`}</div>`;
    }).join("")}</div></div></div>`;
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
// Quant millora el pròxim nivell respecte del total que ja dona el cristall (el saber, sobre el 100 % de base; la vida i
// el maná, sobre la vida i el maná inicials): cada nivell suma el mateix, però cada vegada es nota menys
function tdUpGain(id, lvl) {
  const base = { vida: TD_BATTLE.lives, mana: TD_BATTLE.startMana, saber: 100 }[id], step = { vida: 3, mana: 20, saber: 10 }[id];
  return String(+(100 * step / (base + step * lvl)).toFixed(1)).replace(".", ",");
}
function tdUpgradesHtml() {
  const ids = Object.keys(TD_UPGRADES);
  const total = ids.reduce((s, id) => s + td.upgrades[id], 0), max = ids.reduce((s, id) => s + TD_UPGRADES[id].max, 0);
  const node = (id, i) => {
    const u = TD_UPGRADES[id], lvl = td.upgrades[id], full = lvl >= u.max, cost = tdUpgradeCost(id);
    const jade = t => tdRoom === "forestal" ? t.replace(/Cristall/g, "Jade").replace(/cristall/g, "jade") : t; // al bosc, el cristall és el jade
    return `<div class="td-cnode td-cnode-${i}"><div class="td-cnode-head"><span class="td-up-icon">${tdRoom === "forestal" && u.icon === "💎" ? "🟢" : u.icon}</span><strong>${jade(u.name)}</strong></div>
      <div class="td-cnode-bar"><div style="width:${100 * lvl / u.max}%"></div><span>${lvl} / ${u.max}</span></div>
      <div class="muted">${jade(u.desc)}${lvl ? ` · ara ${jade(u.per(lvl))}` : ""}</div>
      ${full ? "" : `<div class="td-cnode-next">Següent: ${jade(u.per(lvl + 1))} <span title="Quant puja respecte del que ja tens: cada nivell suma el mateix, però com més en tens, menys es nota">(${lvl ? `+${tdUpGain(id, lvl)} % més` : "el primer"})</span></div>`}
      <button data-up="${id}" ${full || td.saber < cost ? "disabled" : ""}>${full ? "Màxim" : `✨ ${fmtNum(cost)}`}</button></div>`;
  };
  return `<p class="td-hint">Millores permanents amb el saber dels mons: cada una encén ${tdRoom === "forestal" ? "el jade" : "el cristall"}. Tens ✨ <strong>${fmtNum(Math.floor(td.saber))}</strong>.</p>
    <div class="td-crystal-menu">${node(ids[0], 0)}<div class="td-crystal-core">${(tdRoom === "forestal" ? tdJadeSvg : tdCrystalSvg)(total / max)}<div class="td-crystal-pct">${Math.round(100 * total / max)} %</div></div>${ids.slice(1).map((id, i) => node(id, i + 1)).join("")}</div>`;
}

// ---- correu (la bústia de cada sala): préstecs amb l'altra persona (js/td/share.js) i missatges de l'equip
function tdMailHtml() {
  const news = tdShareNews(), gifts = tdViewingOf ? 0 : tdMailNew().length;
  const tab = tdShareTab || (gifts && !news ? "mail" : "loans");
  const dot = n => n ? ` <span class="td-mail-dot">${n}</span>` : "";
  return `<div class="td-tabs td-mail-tabs"><button class="td-tab${tab === "loans" ? " on" : ""}" data-mtab="loans">🤝 Préstecs${dot(news)}</button>
    <button class="td-tab${tab === "mail" ? " on" : ""}" data-mtab="mail">✉️ Missatges${dot(gifts)}</button></div>${tab === "loans" ? tdShareHtml() : tdTeamMailHtml()}`;
}
// missatges de l'equip amb regals (es recullen una vegada)
function tdTeamMailHtml() {
  const fields = Object.keys(TD_SUBJECTS).filter(s => tdFields().includes(s));
  const E = tdMailEsc; // els del núvol venen de la base de dades: sempre escapats
  return `<div class="td-mail">${tdMailList().map(m => { const got = td.mail.includes(m.id); return `<article class="td-mail-item${got ? " read" : ""}">
    <div class="td-mail-head"><span class="td-mail-ic">${got ? "📭" : "📬"}</span><div><strong>${E(m.title)}</strong><div class="muted">${E(m.from)} · ${E(m.date)}</div></div></div>
    <p>${E(m.text)}</p>
    ${m.gift?.pergamins || m.gift?.saber ? `<div class="td-mail-gift">🎁 ${[...(m.gift.pergamins ? fields.map(s => `${tdScrollSvg(s)} ${m.gift.pergamins | 0} de ${TD_SUBJECTS[s].short}`) : []), ...(m.gift.saber ? [`✨ ${fmtNum(m.gift.saber | 0)} de saber`] : [])].join(" · ")}</div>` : ""}
    ${got ? `<div class="muted">✔ Recollit</div>` : tdViewingOf ? `<div class="muted">És la partida de l'altra persona</div>` : `<button data-mail="${E(m.id)}">Recollir</button>`}</article>`; }).join("") || `<p class="muted">No tens cap missatge.</p>`}</div>`;
}

// ---- estudiant (artefactes)
let tdEquipSlot = ""; // espai triat a la finestra de l'estudiant (buit: el primer de la sala)
function tdStudentHtml() {
  const slots = tdEquipSlots(), slot = slots.find(x => x.id === tdEquipSlot) || slots[0];
  const worn = sid => td.equipped.find(id => tdArtSlot(id) === sid);
  const own = Object.keys(td.artifacts).filter(id => tdArtSlot(id) === slot.id);
  const cur = worn(slot.id);
  return `<div class="td-inv">
    <div class="td-inv-stage"><div class="td-inv-student">${tdStudentSvg(td.equipped)}</div>
      ${slots.map((x, i) => { const id = worn(x.id);
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
  tdStopBattle();
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
    if (ds.share) tdShareAction(b);
    else if (ds.atab) { tdAltarTab = ds.atab; tdRenderPanel(); }
    else if (ds.forge) {
      const F = TD_FORGE[ds.forge], parts = tdForgeParts(ds.forge).map(id => TD_DEFENDERS[id].name).join(" i ");
      if (!confirm(F.from ? `Fusionar ${parts}? Les dues desapareixen i et queda ${TD_DEFENDERS[ds.forge].name}.` : `Evolucionar ${parts} amb la pedra? Es convertix en ${TD_DEFENDERS[ds.forge].name} (amb el seu nivell, estrelles i còpies).`)) return;
      tdForgeAnim(ds.forge);
    }
    else if (ds.mtab) { tdShareTab = ds.mtab; tdRenderPanel(); }
    else if (ds.subj) { tdSubj = ds.subj; tdRenderPanel(); }
    else if (ds.cls && !ds.act) { tdClass[tdSubj] = ds.cls; tdRenderPanel(); }
    else if (ds.bktab) { tdBook = { tab: ds.bktab, page: 0 }; tdRenderPanel(); }
    else if (ds.bk) tdTurnPage(ds.bk === "next" ? 1 : -1);
    else if (ds.goto != null) tdTurnPage(0, Number(ds.goto));
    else if (ds.filter) { tdTeamFilter = ds.filter; tdRenderPanel(); }
    else if (ds.tsort) { tdTeamSort = ds.tsort; tdRenderPanel(); }
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
    else if (ds.go) { tdSpot(ds.go); if (ds.go === "grimori") { tdBook = { tab: "team", page: 0 }; tdRenderPanel(); } }
    else if (ds.wreset) {
      const [id, tens] = ds.wreset.split(":").map(Number), w = TD_WORLDS.find(o => o.id === id), at = tdRun(id).run?.tens?.wave;
      if (!confirm(tens ? `Tornar «${w.name}» a l'onada ${at}, amb les criatures i el maná que hi havia?` : `Tornar a començar «${w.name}» des de l'onada 1? Les criatures es tornen a posar des de zero (el saber i el millor que has fet es queden).`)) return;
      tdResetWorld(id, !!tens); tdRenderPanel(); tdRenderLobby();
    }
    else if (ds.play) { tdClosePanel(); tdOpenBattle(Number(ds.play)); }
    else if (ds.up) { if (tdBuyUpgrade(ds.up)) { tdRenderPanel(); tdRenderLobby(); document.querySelector(".td-card .td-crys")?.classList.add("flash"); } }
    else if (ds.equip) tdToggleEquip(ds.equip);
    else if (ds.buy) { const r = tdBuyCopy(ds.buy); if (r) { toast(`${TD_POINTS[tdModeOf(ds.buy)].icon} +1 còpia de ${TD_DEFENDERS[ds.buy].name}${r.saber ? ` (al màxim: +${r.saber} ✨)` : ""}`, "good"); tdRenderPanel(); } }
    else if (ds.mail) { if (tdClaimMail(ds.mail)) { toast("🎁 Regal recollit!", "good"); tdRenderPanel(); tdLobbyHud(); tdMailboxFlag(); } }
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

// ---- demostració al grimori: el combat de veritat (tddemo.html + js/td/demo.js) dins d'un iframe, amb un escenari
// fet perquè es veja bé l'arma. És el mateix codi i els mateixos efectes que al joc.

