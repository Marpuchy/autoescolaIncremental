// ===== NÚVOL (partides de Marc i d'Alba a Supabase) =====
// Cadascú tria qui és (es recorda en este dispositiu; es canvia als ajustos de la vitrina de l'habitació).
//   · Marc: juga a Informàtica (partida «estudi»); l'autoescola i Forestal d'Alba només les pot mirar.
//   · La parella: juga a Forestal (partida «estudi») i a l'autoescola; la sala d'Informàtica de Marc, només mirar-la.
// Només la web publicada (CLOUD_PROD_HOST) guarda al núvol. Qualsevol altra (local, file://, proves) és experimental:
// comença amb una còpia de la partida real però no la toca mai.
// La base de dades també ho imposa: només es pot escriure amb la funció save_game, que comprova qui pot escriure què.
const CLOUD_URL = "https://iiprvxftsfagfegeeesz.supabase.co";
const CLOUD_KEY = "sb_publishable_ivwJNv4MQdPuOVX4CFfG7Q_3dYk58YG"; // clau pública (només llegir i cridar save_game)
const CLOUD_PROD_HOST = "marpuchy.github.io";
const PLAYERS = {
  marc:    { name: "Marc",    icon: "💻", games: ["estudi"] },
  parella: { name: "Alba", icon: "🌳", games: ["autoescola", "estudi"] },
  // Només a la versió de proves: un perfil comú que juga a tot (Informàtica, Forestal i l'autoescola) amb una còpia de
  // les dues partides reals juntes. No existix a la web publicada, i la base de dades tampoc el deixaria escriure.
  comu:    { name: "Comú (proves)", icon: "🧪", games: ["autoescola", "estudi"], test: true },
};
const ROOM_OWNER = { informatic: "marc", forestal: "parella", autoescola: "parella" };
const CLOUD_WHO_KEY = "estudi-qui";
const cloudProd = () => location.hostname === CLOUD_PROD_HOST;
const cloudWho = () => { try { const w = localStorage.getItem(CLOUD_WHO_KEY); return PLAYERS[w] && !(PLAYERS[w].test && cloudProd()) ? w : null; } catch { return null; } };
const cloudPlayers = () => Object.entries(PLAYERS).filter(([, p]) => !p.test || !cloudProd()); // els que es poden triar ací
const cloudCanWrite = game => !!cloudWho() && PLAYERS[cloudWho()].games.includes(game);
const cloudOther = () => (cloudWho() === "marc" ? "parella" : "marc");
let cloudStatus = "";                                  // última cosa que ha passat (es veu als ajustos)

async function cloudFetch(pathAndQuery, opts = {}) {
  const res = await fetch(`${CLOUD_URL}${pathAndQuery}`, {
    ...opts, headers: { apikey: CLOUD_KEY, Authorization: `Bearer ${CLOUD_KEY}`, "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}
async function cloudGet(player, game) {
  const rows = await cloudFetch(`/rest/v1/saves?player=eq.${encodeURIComponent(player)}&game=eq.${encodeURIComponent(game)}&select=data,updated_at`);
  return rows[0] || null;
}

// ---- correu del joc: la taula `mail` (només es llig; s'hi escriu des del panell de Supabase). Es baixa en entrar a una
// sala i en obrir la bústia (com a molt cada minut). Cada missatge: per als dos o per a un (to_player)
let cloudMailAt = 0;
async function cloudMail(force = false) {
  if (!force && Date.now() - cloudMailAt < 60000) return;
  cloudMailAt = Date.now();
  try {
    const rows = await cloudFetch("/rest/v1/mail?select=id,title,sender,body,gift_pergamins,gift_saber,to_player,created_at&order=created_at.desc&limit=50");
    const who = cloudWho();
    tdCloudMail = (Array.isArray(rows) ? rows : []).filter(r => r && typeof r.id === "string" && (!r.to_player || r.to_player === who || PLAYERS[who]?.test))
      .map(r => ({ id: `n:${r.id}`, title: String(r.title || ""), from: String(r.sender || ""), text: String(r.body || ""),
        date: r.created_at ? new Date(r.created_at).toLocaleDateString("ca") : "", gift: { pergamins: Number(r.gift_pergamins) || 0, saber: Number(r.gift_saber) || 0 } }));
  } catch { /* sense connexió: es queden els que hi havia */ }
}

// ---- pujar: cada vegada que es guarda en local (amb un poc d'espera per no pujar a cada fotograma)
const cloudTimers = {};
function cloudSaved(game, json) {
  if (!cloudProd() || !cloudCanWrite(game) || cloudViewing(game) || PLAYERS[cloudWho()].test) return;
  clearTimeout(cloudTimers[game]);
  cloudTimers[game] = setTimeout(() => cloudPush(game, json), 4000);
}
async function cloudPush(game, json) {
  try {
    const t = await cloudFetch("/rest/v1/rpc/save_game", { method: "POST", body: JSON.stringify({ p_player: cloudWho(), p_game: game, p_data: JSON.parse(json) }) });
    localStorage.setItem(`estudi-nuvol-${game}`, String(Date.parse(t) || Date.now()));
    cloudStatus = `☁️ Guardat al núvol (${new Date().toLocaleTimeString()})`;
  } catch { cloudStatus = "⚠️ No s'ha pogut guardar al núvol (es tornarà a provar)"; }
}
// en tancar o amagar la pàgina, puja el que quede pendent
addEventListener("pagehide", () => { for (const g of Object.keys(cloudTimers)) { clearTimeout(cloudTimers[g]); } });

// ---- baixar en obrir: si al núvol hi ha una versió més nova que la d'este dispositiu, es posa i es recarrega.
// En una versió experimental, la primera vegada es copia la partida real (i ja no es torna a tocar el núvol).
const CLOUD_LOCAL = { autoescola: () => SAVE_KEY, estudi: () => TD_SAVE_KEY };
async function cloudBoot() {
  const who = cloudWho();
  if (!who) return;
  if (!cloudProd()) {
    if (localStorage.getItem("estudi-proves-copiat")) return;
    await cloudCopyReal(false);
    return;
  }
  if (sessionStorage.getItem("estudi-sincronitzat")) return;
  sessionStorage.setItem("estudi-sincronitzat", "1");
  let changed = false;
  for (const game of PLAYERS[who].games) {
    try {
      const row = await cloudGet(who, game);
      const localT = Number(localStorage.getItem(`estudi-nuvol-${game}`)) || 0, cloudT = row ? Date.parse(row.updated_at) : 0;
      const localRaw = localStorage.getItem(CLOUD_LOCAL[game]());
      // primera vegada en este dispositiu amb partida pròpia i també al núvol: guanya la que va més avançada
      // (la del dispositiu puja). Mai es perd res: abans de substituir la local se'n guarda una còpia.
      const firstHere = !localT && localRaw && row && cloudProgress(game, localRaw) > cloudProgress(game, JSON.stringify(row.data));
      if (firstHere) { await cloudPush(game, localRaw); }
      else if (row && cloudT > localT) {
        if (localRaw) localStorage.setItem(`${CLOUD_LOCAL[game]()}-backup-nuvol-${Date.now()}`, localRaw);
        localStorage.setItem(CLOUD_LOCAL[game](), JSON.stringify(row.data));
        localStorage.setItem(`estudi-nuvol-${game}`, String(cloudT));
        changed = true;
      } else if (!row) {
        const raw = localStorage.getItem(CLOUD_LOCAL[game]());
        if (raw) await cloudPush(game, raw); // primera vegada: la partida d'este dispositiu puja al núvol
      }
    } catch { cloudStatus = "⚠️ Sense connexió amb el núvol: jugues en local"; }
  }
  if (changed) { savingSuspended = true; tdSavingSuspended = true; location.reload(); }
}
// Com d'avançada va una partida (per a no substituir mai la bona per una de nova o menys avançada)
function cloudProgress(game, raw) {
  try {
    const d = JSON.parse(raw);
    if (game === "autoescola") return (Number(d.maxLevel) || Number(d.level) || 0) * 1e6 + (Number(d.totalLessons) || 0);
    return Object.keys(d.owned || {}).length * 1e4 + (Number(d.pulls) || 0) * 10 + (Array.isArray(d.log) ? d.log.length : 0);
  } catch { return 0; }
}
// Proves: copia la partida real d'este jugador al dispositiu (no toca el núvol). manual: des dels ajustos
async function cloudCopyReal(manual) {
  const who = cloudWho();
  if (!who || cloudProd()) return;
  if (PLAYERS[who].test) return cloudCopyCommon(manual);
  try {
    let any = false;
    for (const game of PLAYERS[who].games) {
      const row = await cloudGet(who, game);
      if (row) {
        const old = localStorage.getItem(CLOUD_LOCAL[game]());
        if (old) localStorage.setItem(`${CLOUD_LOCAL[game]()}-backup-proves-${Date.now()}`, old);
        localStorage.setItem(CLOUD_LOCAL[game](), JSON.stringify(row.data)); any = true;
      }
    }
    localStorage.setItem("estudi-proves-copiat", "1");
    if (any) { savingSuspended = true; tdSavingSuspended = true; location.reload(); }
    else if (manual) toast("Encara no hi ha cap partida real guardada al núvol", "info");
  } catch { if (manual) toast("⚠️ No s'ha pogut copiar: sense connexió", "bad"); }
}

// Perfil comú (proves): l'autoescola d'Alba i, al joc d'estudi, les dues partides juntes (Informàtica de Marc i Forestal
// d'Alba en una sola). Abans de substituir les locals se'n guarda una còpia.
async function cloudCopyCommon(manual) {
  try {
    const [auto, mE, aE] = await Promise.all([cloudGet("parella", "autoescola"), cloudGet("marc", "estudi"), cloudGet("parella", "estudi")]);
    const put = (key, data) => { const old = localStorage.getItem(key); if (old) localStorage.setItem(`${key}-backup-proves-${Date.now()}`, old); localStorage.setItem(key, JSON.stringify(data)); };
    if (auto) put(SAVE_KEY, auto.data);
    if (mE || aE) put(TD_SAVE_KEY, tdMergeRooms(mE?.data, aE?.data));
    localStorage.setItem("estudi-proves-copiat", "1");
    if (auto || mE || aE) { savingSuspended = true; tdSavingSuspended = true; location.reload(); }
    else if (manual) toast("Encara no hi ha cap partida real guardada al núvol", "info");
  } catch { if (manual) toast("⚠️ No s'ha pogut copiar: sense connexió", "bad"); }
}
// Ajunta dues partides del joc d'estudi: de la primera, tot el d'Informàtica; de la segona, tot el de Forestal
function tdMergeRooms(a, b) {
  if (!a || !b) return a || b;
  const r = JSON.parse(JSON.stringify(a)), F = "forestal";
  const isF = id => TD_DEFENDERS[id] && tdModeOf(id) === F, fields = Object.keys(TD_SUBJECTS).filter(s => TD_SUBJECTS[s].mode === F);
  r.owned = Object.fromEntries([...Object.entries(r.owned || {}).filter(([id]) => !isF(id)), ...Object.entries(b.owned || {}).filter(([id]) => isF(id))]);
  r.team = [...(r.team || []).filter(id => !isF(id)), ...(b.team || []).filter(isF)];
  r.favs = [...(r.favs || []).filter(id => !isF(id)), ...(b.favs || []).filter(isF)];
  for (const k of ["pergamins", "pity", "boost"]) { r[k] = r[k] || {}; for (const f of fields) if (b[k]?.[f] !== undefined) r[k][f] = b[k][f]; else delete r[k][f]; }
  const fw = id => TD_WORLDS.find(w => String(w.id) === String(id))?.mode === F;
  r.worlds = Object.fromEntries([...Object.entries(r.worlds || {}).filter(([id]) => !fw(id)), ...Object.entries(b.worlds || {}).filter(([id]) => fw(id))]);
  r.seen = [...new Set([...(r.seen || []), ...(b.seen || [])])];
  r.log = [...(r.log || []), ...(b.log || [])].slice(-40);
  r.stelles = { ...(r.stelles || {}), [F]: b.stelles?.[F] || 0 };
  // artefactes: cada sala els seus
  const bF = b.artRoom === F ? { artifacts: b.artifacts, equipped: b.equipped } : b.artBank?.[F];
  r.artBank = r.artBank || {};
  if (r.artRoom === F) { r.artifacts = bF?.artifacts || {}; r.equipped = bF?.equipped || []; } else if (bF) r.artBank[F] = bF;
  // cristalls: el d'Informàtica de la primera i el de Forestal de la segona
  const upsOf = (x, room) => (x.upRoom || x.artRoom || "informatic") === room ? x.upgrades : x.upBank?.[room];
  r.upgrades = upsOf(a, "informatic") || { vida: 0, mana: 0, saber: 0 }; r.upRoom = "informatic";
  r.upBank = { forestal: upsOf(b, "forestal") || { vida: 0, mana: 0, saber: 0 } };
  r.saber = (Number(r.saber) || 0) + (Number(b.saber) || 0);
  r.pulls = (Number(r.pulls) || 0) + (Number(b.pulls) || 0);
  return r;
}

// ---- mirar la partida de l'altre (sense poder canviar-la)
// Autoescola: es recarrega la pàgina amb la seua partida en memòria i el guardat desactivat.
const cloudViewing = game => game === "autoescola" ? !!sessionStorage.getItem("estudi-visita-autoescola") : !!tdViewingOf;
function cloudViewRaw(game) { return game === "autoescola" ? sessionStorage.getItem("estudi-visita-autoescola") : null; }
async function cloudVisitAutoescola() {
  const owner = ROOM_OWNER.autoescola;
  try {
    const row = await cloudGet(owner, "autoescola");
    if (!row) { toast(`${PLAYERS[owner].name} encara no té partida de l'autoescola`, "info"); return; }
    savingSuspended = true;
    save(); // (no fa res: el guardat ja està parat)
    sessionStorage.setItem("estudi-visita-autoescola", JSON.stringify(row.data));
    sessionStorage.setItem("estudi-visita-obrir", "dgt");
    location.reload();
  } catch { toast("⚠️ No s'ha pogut obrir: sense connexió", "bad"); }
}
function cloudEndVisit() {
  sessionStorage.removeItem("estudi-visita-autoescola");
  location.reload();
}
// Joc d'estudi: la partida de l'altre es carrega en memòria (tdViewingOf) i no es guarda
let tdViewingOf = null;
async function cloudTdEnter(room) {
  const owner = ROOM_OWNER[room], who = cloudWho();
  if (!who || owner === who || PLAYERS[who].test) { if (tdViewingOf) cloudTdLeave(); return; } // el comú juga a les dues
  if (tdViewingOf === owner) return;
  tdSave();
  tdViewingOf = owner;
  tdSavingSuspended = true;
  td = tdNewState();
  try {
    const row = await cloudGet(owner, "estudi");
    if (row) tdLoad(JSON.stringify(row.data));
  } catch { toast("⚠️ Sense connexió: no es pot veure la partida", "bad"); }
  if (tdLobbyOpen()) tdRenderLobby();
}
function cloudTdLeave() {
  if (!tdViewingOf) return;
  tdViewingOf = null;
  tdSavingSuspended = false;
  td = tdNewState();
  tdLoad();
}
const cloudVisitBanner = () => {
  const who = tdViewingOf || (sessionStorage.getItem("estudi-visita-autoescola") ? ROOM_OWNER.autoescola : null);
  $("visit-banner").hidden = !who;
  if (who) $("visit-banner-text").textContent = `👀 Mires la partida de ${PLAYERS[who].name}: no es guarda res`;
};

// ---- triar qui eres (la primera vegada) i ajustos (vitrina de l'habitació)
function cloudChooser() {
  $("who-dialog").hidden = false;
  $("who-dialog").innerHTML = `<div class="who-card"><h2>Qui eres?</h2><p class="muted">Es recordarà en este dispositiu. Ho pots canviar als ajustos (la vitrina de l'habitació).</p>
    <div class="who-btns">${cloudPlayers().map(([id, p]) => `<button data-who="${id}"><span>${p.icon}</span>${p.name}</button>`).join("")}</div></div>`;
}
function cloudSetWho(id) {
  if (!PLAYERS[id] || (PLAYERS[id].test && cloudProd())) return;
  try { localStorage.setItem(CLOUD_WHO_KEY, id); localStorage.removeItem("estudi-proves-copiat"); } catch {}
  sessionStorage.removeItem("estudi-sincronitzat");
  savingSuspended = true; tdSavingSuspended = true;
  location.reload();
}
function cloudSettingsHtml() {
  const who = cloudWho(), prod = cloudProd();
  return `<p>${prod ? "🌐 <strong>Versió real</strong>: el progrés es guarda al núvol." : "🧪 <strong>Versió de proves</strong>: comença amb una còpia de la partida real i no la toca mai."}</p>
    <p>Eres <strong>${who ? `${PLAYERS[who].icon} ${PLAYERS[who].name}` : "—"}</strong>. ${who && PLAYERS[who].test ? "Jugues a tot: Informàtica, Forestal i l'autoescola, amb una còpia de les dues partides reals." : `Pots jugar a: ${who ? PLAYERS[who].games.map(g => g === "estudi" ? (who === "marc" ? "Informàtica" : "Forestal") : "l'autoescola").join(" i ") : "—"}. La resta, només mirar-la.`}</p>
    <div class="who-btns">${cloudPlayers().map(([id, p]) => `<button class="${id === who ? "" : "secondary"}" data-who="${id}"><span>${p.icon}</span>${p.name}</button>`).join("")}</div>
    ${prod ? "" : `<p><button class="secondary" data-copyreal="1">⬇️ Tornar a copiar la partida real</button></p>`}
    ${cloudStatus ? `<p class="muted">${cloudStatus}</p>` : ""}`;
}
function initCloud() {
  document.addEventListener("click", ev => {
    const w = ev.target.closest("[data-who]");
    if (w) cloudSetWho(w.dataset.who);
    if (ev.target.closest("[data-copyreal]")) { localStorage.removeItem("estudi-proves-copiat"); cloudCopyReal(true); }
    if (ev.target.closest("#visit-end")) {
      if (sessionStorage.getItem("estudi-visita-autoescola")) cloudEndVisit();
      else { cloudTdLeave(); tdCloseLobby(); openRoom(); cloudVisitBanner(); }
    }
  });
  $("settings-close").addEventListener("click", () => { $("settings-dialog").hidden = true; });
  if (!cloudProd()) document.body.classList.add("proves");
  if (!cloudWho()) cloudChooser();
  else cloudBoot();
  cloudVisitBanner();
}
