// ===== ESTUDI: ESTAT, GUARDAT, INVOCACIONS I ESTADÍSTIQUES =====
// La partida d'estudi es guarda a part de la de l'autoescola (TD_SAVE_KEY), i no s'ha de canviar mai.
// Camps nous: s'omplin sols amb els valors de tdNewState(). Si es canvia l'estructura, cal una migració ací.
const TD_SAVE_KEY = "estudi-save-v1";

function tdNewState() {
  return {
    v: 1,
    pergamins: Object.fromEntries(Object.keys(TD_SUBJECTS).map(s => [s, s === "alg" || s === "prg" ? 5 : 0])), // regal de benvinguda: 5 invocacions de cada assignatura (al bosc, tdStartRoom)
    pity: Object.fromEntries(Object.keys(TD_SUBJECTS).map(s => [s, { epic: 0, llegendari: 0, mitic: 0 }])),
    boost: {},                                        // camps potenciats (un 8+ a un examen final): millors probabilitats
    owned: { sumador: { copies: 1, level: 1 }, puntcoma: { copies: 1, level: 1 } }, // les dues primeres criatures
    team: ["sumador", "puntcoma"],
    favs: [],                                         // criatures preferides (grimori)
    mail: [],                                         // missatges del correu ja recollits (id de TD_MAIL)
    saber: 0,
    upgrades: { vida: 0, mana: 0, saber: 0 },          // millores del cristall de la sala on s'està (upRoom)
    upRoom: "informatic",                             // cada sala té el seu cristall: les millores no es compartixen
    upBank: {},                                       // millores dels cristalls de les altres sales
    artifacts: {},                                    // id → nivell
    equipped: [],                                     // artefactes que porta l'estudiant
    worlds: {},                                       // id → { best: onada, clears: vegades }
    seen: [],                                         // enemics vistos (bestiari)
    log: [],                                          // què s'ha estudiat (els 40 últims)
    daily: { date: "", alg: 0, prg: 0 },
    missions: { date: "", list: [] },                 // missions diàries (pergamins extra si es fan abans de mitjanit)
    artRoom: "informatic",                            // de quina sala són ara artifacts i equipped
    artBank: {},                                      // artefactes de les altres sales (no es compartixen entre carreres/mòduls)
    stelles: {},                                      // punts d'estrella per carrera (espores al bosc): mode → punts
    pulls: 0,
    // Préstecs entre Marc i Alba (js/td/share.js). share.out: el que he enviat (demanar o prestar), share.done: els
    // missatges de l'altre que ja he contestat. loan: la criatura que tinc prestada (un buit: dura fins que la canvie)
    share: { out: [], done: [] },
    loan: null,
  };
}

let td = tdNewState();
let tdSavingSuspended = false;

function tdSave() {
  if (tdSavingSuspended) return;
  const json = JSON.stringify(td);
  try { localStorage.setItem(TD_SAVE_KEY, json); } catch {}
  if (typeof cloudSaved === "function") cloudSaved("estudi", json); // i al núvol (js/cloud.js)
}
function tdLoad(fromRaw = null) { // fromRaw: una partida que no és la d'este dispositiu (mode visita)
  let raw = fromRaw;
  if (raw == null) try { raw = localStorage.getItem(TD_SAVE_KEY); } catch {}
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return;
    const base = tdNewState();
    // Només els camps coneguts; els desconeguts o malformats es queden amb el valor per defecte
    for (const k of Object.keys(base)) if (data[k] !== undefined && typeof data[k] === typeof base[k]) td[k] = data[k];
    for (const s of Object.keys(TD_SUBJECTS)) {
      td.pergamins[s] = Math.max(0, Number(td.pergamins[s]) || 0);
      td.pity[s] = { epic: 0, llegendari: 0, mitic: 0, ...(td.pity[s] || {}) };
    }
    for (const k of Object.keys(td.boost)) if (!TD_SUBJECTS[k] || td.boost[k] !== true) delete td.boost[k];
    // criatures retirades: les seues còpies se sumen a la de la mateixa raresa i assignatura
    for (const [old, to] of Object.entries(TD_MERGED)) {
      const o = td.owned[old];
      if (!o || typeof o !== "object") continue;
      const t = td.owned[to] || (td.owned[to] = { copies: 0, level: 1 });
      t.copies = Math.min(TD_STAR_COPIES[TD_STAR_COPIES.length - 1], (Number(t.copies) || 0) + (Number(o.copies) || 0));
      t.level = Math.max(Number(t.level) || 1, Number(o.level) || 1);
      td.team = td.team.map(id => id === old ? to : id).filter((id, i, a) => a.indexOf(id) === i);
      td.favs = td.favs.map(id => id === old ? to : id).filter((id, i, a) => a.indexOf(id) === i);
      delete td.owned[old];
    }
    // estrelles pagades: si en falta el número (partida rara o d'una versió antiga), es queda a ★1. Abans es donaven les
    // de les còpies, i això pujava estrelles sense pagar-les
    for (const o of Object.values(td.owned)) if (o && typeof o === "object") o.stars = Math.max(1, Math.min(TD_STAR_COPIES.length, Math.floor(Number(o.stars) || 1)));
    // criatures o artefactes que ja no existixen: fora
    for (const id of Object.keys(td.owned)) if (!TD_DEFENDERS[id]) delete td.owned[id];
    for (const id of Object.keys(td.artifacts)) if (!TD_ARTIFACTS[id]) delete td.artifacts[id];
    // artefactes de les altres sales: només objectes ben formats
    if (!["informatic", "forestal"].includes(td.artRoom)) td.artRoom = "informatic";
    for (const [k, b] of Object.entries(td.artBank)) {
      if (!b || typeof b !== "object" || k === td.artRoom) { delete td.artBank[k]; continue; }
      b.artifacts = b.artifacts && typeof b.artifacts === "object" ? b.artifacts : {};
      b.equipped = Array.isArray(b.equipped) ? b.equipped.filter(id => b.artifacts[id]) : [];
    }
    td.team = td.team.filter(id => td.owned[id]).filter((id, i, a) => a.slice(0, i).filter(o => tdModeOf(o) === tdModeOf(id)).length < 6);
    // cristalls: cada sala el seu. Les partides d'abans tenien unes millores per a tot: són de la sala on es jugava
    if (!["informatic", "forestal"].includes(data.upRoom)) td.upRoom = td.artRoom;
    if (!td.upBank || typeof td.upBank !== "object") td.upBank = {};
    const okUps = u => Object.fromEntries(Object.keys(TD_UPGRADES).map(id => [id, Math.max(0, Math.min(TD_UPGRADES[id].max, Math.floor(Number(u?.[id]) || 0)))]));
    td.upgrades = okUps(td.upgrades);
    for (const k of Object.keys(td.upBank)) { if (k === td.upRoom || !["informatic", "forestal"].includes(k)) delete td.upBank[k]; else td.upBank[k] = okUps(td.upBank[k]); }
    for (const [m, n] of Object.entries(td.stelles)) if (!TD_POINTS[m] || !(n >= 0)) delete td.stelles[m];
    td.favs = td.favs.filter(id => TD_DEFENDERS[id]);
    td.mail = td.mail.filter(id => typeof id === "string");
    td.share = { out: Array.isArray(td.share?.out) ? td.share.out.filter(m => m && typeof m === "object" && Number.isFinite(m.n)).slice(-30) : [],
      done: Array.isArray(td.share?.done) ? td.share.done.filter(Number.isFinite).slice(-80) : [] };
    td.loan = tdCleanLoan(td.loan);
    // un artefacte per espai
    td.equipped = td.equipped.filter((id, i, a) => td.artifacts[id] && a.findIndex(o => tdArtSlot(o) === tdArtSlot(id)) === i).slice(0, TD_ARTIFACT_SLOTS);
  } catch {}
}

// Criatura prestada: només una de bona (una que existix, d'una persona coneguda, amb nivell i estrelles possibles)
function tdCleanLoan(l) {
  if (!l || typeof l !== "object" || !TD_DEFENDERS[l.def] || !["marc", "parella"].includes(l.from)) return null;
  const stars = Math.max(1, Math.min(TD_STAR_COPIES.length, Math.floor(Number(l.stars) || 1)));
  return { def: l.def, from: l.from, stars, level: Math.max(1, Math.min(TD_LEVEL_PER_STAR * stars, TD_LEVEL_MAX, Math.floor(Number(l.level) || 1))), t: Number(l.t) || 0 };
}
// La prestada es pot fer servir als mons de la sala de qui la té (no és seua: no puja de nivell ni d'estrella)
const tdLoanFor = mode => td.loan && !td.owned[td.loan.def] && mode === tdLoanRoom() ? td.loan.def : null;
const tdLoanRoom = () => (typeof cloudWho === "function" && cloudWho() === "parella" ? "forestal" : "informatic");
// Les criatures que es poden posar en un combat: l'equip de la carrera i, si n'hi ha, la prestada
const tdDeck = mode => { const l = tdLoanFor(mode), t = tdTeam(mode); return l && !t.includes(l) ? [...t, l] : t; };

// L'equip es guarda tot junt, però cada carrera porta les seues 6 criatures
const tdTeam = mode => td.team.filter(id => tdModeOf(id) === mode);
// Primera vegada en una sala: les dues criatures comunes de la carrera i 5 pergamins de cada camp
function tdStartRoom(mode) {
  const fields = tdFieldsOf(mode);
  if (Object.keys(td.owned).some(id => fields.includes(TD_DEFENDERS[id].subj))) return false;
  for (const f of fields) {
    td.pergamins[f] = (td.pergamins[f] || 0) + 5;
    const c = tdPool(f, "comu")[0];
    if (c) tdGrant(c);
  }
  tdSave();
  return true;
}

// ---------------------------------------------------------------- criatures: estrelles i estadístiques
// Estrelles: les copies només ho permeten; per a pujar-la cal pagar (tdAscend). o.stars guarda les pagades.
function tdStarsByCopies(c) {
  let s = 0;
  for (const need of TD_STAR_COPIES) if (c >= need) s++;
  return s;
}
function tdStars(id) {
  const o = td.owned[id];
  if (!o) return 0;
  return Math.max(1, Math.min(o.stars || 1, tdStarsByCopies(o.copies || 0)));
}
const tdAscendCost = id => Math.round(100 * TD_RARITIES[TD_DEFENDERS[id].rar].value ** 0.5 * TD_STAR_COST[tdStars(id) - 1]);
const tdCanAscend = id => { const n = tdNextStar(id); return !!n && n.have >= n.need; };
function tdAscend(id) {
  if (!tdCanAscend(id)) return false;
  const cost = tdAscendCost(id);
  if (td.saber < cost) return false;
  td.saber -= cost;
  td.owned[id].stars = tdStars(id) + 1;
  tdSave();
  return true;
}
// Còpies que falten per a la pròxima estrela (null si ja té ★5)
function tdNextStar(id) {
  const s = tdStars(id);
  if (s >= TD_STAR_COPIES.length) return null;
  return { have: td.owned[id]?.copies || 0, need: TD_STAR_COPIES[s] };
}
const tdArtBonus = stat => td.equipped.reduce((sum, id) => sum + (TD_ARTIFACTS[id].stat === stat ? TD_ARTIFACTS[id].value * tdArtMult(td.artifacts[id]) : 0), 0);
const tdHasArtifact = id => td.equipped.includes(id);

// Estadístiques d'una criatura fora del combat (nivell, estrelles i artefactes). up: nivell de millora dins del combat (0-2).
const tdLevelCap = id => Math.min(TD_LEVEL_MAX, TD_LEVEL_PER_STAR * Math.max(1, tdStars(id)));
const tdAbility = (stars, level) => 1 + 0.3 * (stars >= 3) + 0.3 * (stars >= 5) + 0.15 * TD_ABILITY_LEVELS.filter(l => level >= l).length;
function tdStats(id, up = 0) {
  const loan = !td.owned[id] && td.loan?.def === id ? td.loan : null; // la prestada va amb el nivell i les estrelles de l'amo
  const d = TD_DEFENDERS[id], o = td.owned[id] || loan || { level: 1 };
  const stars = loan ? loan.stars : Math.max(1, tdStars(id));
  // cada nivell +7 % de dany i cada estrela +15 % (+5 % de velocitat): a Nv25 ★5, uns 3,9 × el dany de Nv1 ★1
  const dmgMult = (1 + 0.07 * (o.level - 1)) * (1 + 0.15 * (stars - 1)) * TD_BATTLE.upgradeMult[up];
  return {
    dmg: d.dmg * dmgMult,
    rate: d.rate * (1 + 0.05 * (stars - 1)) * (1 + tdArtBonus("rate")),
    range: d.range * (1 + tdArtBonus("range")),
    ability: tdAbility(stars, o.level), // ★3, ★5 i els nivells 10 i 20 milloren l'habilitat (durades, zones, objectius)
    stars, level: o.level,
  };
}

// ---------------------------------------------------------------- invocacions (gacha)
const tdRand = () => Math.random();
const tdRates = subj => td.boost?.[subj] ? TD_RATES.boost : TD_RATES.base;
// Probabilitat amb «pity suau»: en l'últim 15 % de tirades abans de la garantia, la probabilitat puja a poc a poc
// fins arribar al 100 % a la tirada garantida
function tdSoftChance(base, count, pity) {
  const start = Math.floor(pity * 0.85);
  return count <= start ? base : Math.min(1, base + (1 - base) * (count - start) / (pity - start));
}
function tdRollRarity(subj) {
  const p = td.pity[subj] || (td.pity[subj] = { epic: 0, llegendari: 0, mitic: 0 }), R = tdRates(subj);
  p.mitic = (p.mitic || 0) + 1; p.epic++; p.llegendari++;
  let rar;
  if (tdRand() < tdSoftChance(R.mitic, p.mitic, TD_PITY.mitic)) rar = "mitic";
  else if (tdRand() < tdSoftChance(R.llegendari, p.llegendari, TD_PITY.llegendari)) rar = "llegendari";
  else if (tdRand() < tdSoftChance(R.epic, p.epic, TD_PITY.epic)) rar = "epic";
  else rar = tdRand() < R.rar / (R.rar + R.comu) ? "rar" : "comu";
  if (rar === "mitic") p.mitic = 0;
  if (rar === "llegendari" || rar === "mitic") { p.llegendari = 0; p.epic = 0; }
  if (rar === "epic") p.epic = 0;
  return rar;
}
function tdPool(subj, rar) {
  return Object.keys(TD_DEFENDERS).filter(id => TD_DEFENDERS[id].subj === subj && TD_DEFENDERS[id].rar === rar);
}
// Dona una còpia d'una criatura. Torna què ha passat (nova, puja d'estrela, saber per les sobrants)
function tdGrant(id) {
  const before = tdStars(id);
  if (!td.owned[id]) td.owned[id] = { copies: 0, level: 1 };
  const o = td.owned[id];
  let saber = 0;
  if (o.copies >= TD_STAR_COPIES[TD_STAR_COPIES.length - 1]) {
    saber = 20 * TD_RARITIES[TD_DEFENDERS[id].rar].value;
    td.saber += saber;
  } else o.copies++;
  if (before === 0) td.owned[id].stars = 1;
  const after = tdStars(id);
  if (before === 0 && tdTeam(tdModeOf(id)).length < 6) td.team.push(id);
  return { id, isNew: before === 0, ready: before > 0 && tdCanAscend(id), stars: after, saber };
}
function tdSummon(subj, n = 1) {
  n = Math.min(n, td.pergamins[subj]);
  const results = [];
  for (let i = 0; i < n; i++) {
    td.pergamins[subj]--;
    td.pulls++;
    const rar = tdRollRarity(subj);
    const pool = tdPool(subj, rar); // només criatures de l'assignatura triada
    const swap = rar in TD_POINT_GAIN && pool.length && tdRand() < TD_POINT_SWAP; // a vegades, punts en lloc de la còpia
    if (pool.length && !swap) results.push(tdGrant(pool[Math.floor(tdRand() * pool.length)]));
    else { // el camp no té criatura d'esta raresa (o ha tocat canviar-la): punts d'estrella (espores al bosc)
      const mode = TD_SUBJECTS[subj].mode, pts = TD_POINT_GAIN[rar] || 1;
      td.stelles[mode] = (td.stelles[mode] || 0) + pts;
      results.push({ points: pts, mode, rar, subj });
    }
  }
  tdSave();
  return results;
}

// Comprar una còpia amb punts d'estrella (o espores): qualsevol criatura de la carrera menys la mítica
const tdCopyPrice = id => TD_RARITIES[TD_DEFENDERS[id].rar].value * TD_POINT_COPY;
const tdCanBuyCopy = id => TD_DEFENDERS[id].rar !== "mitic" && td.owned[id]?.copies < TD_STAR_COPIES[TD_STAR_COPIES.length - 1];
function tdBuyCopy(id) {
  const mode = tdModeOf(id), price = tdCopyPrice(id);
  if (!tdCanBuyCopy(id) || (td.stelles[mode] || 0) < price) return null;
  td.stelles[mode] -= price;
  const r = tdGrant(id);
  tdSave();
  return r;
}

// ---------------------------------------------------------------- correu
const tdMailNew = () => TD_MAIL.filter(m => !td.mail.includes(m.id));
function tdClaimMail(id) {
  const m = TD_MAIL.find(x => x.id === id);
  if (!m || td.mail.includes(id)) return false;
  if (m.gift?.pergamins) for (const s of Object.keys(TD_SUBJECTS)) td.pergamins[s] += m.gift.pergamins;
  td.mail.push(id);
  tdSave();
  return true;
}

// ---------------------------------------------------------------- estudi registrat → pergamins
const tdToday = () => new Date().toISOString().slice(0, 10);
function tdDailyLeft(subj) {
  if (td.daily.date !== tdToday()) td.daily = { date: tdToday(), alg: 0, prg: 0 };
  return Math.max(0, TD_DAILY_CAP - (td.daily[subj] || 0));
}
// Torna { rolls, capped, mythic } o null si no hi ha res a donar
// Missions del dia: 3, iguals per a tot el dia (es trien a partir de la data). Donen pergamins extra
// (fora del límit diari) si es completen abans de mitjanit.
// Cada sala (carrera o mòdul) té els seus artefactes: en canviar de sala, es guarden els d'una i es trauen els de l'altra
// De quina sala és un artefacte: la del món on cau (els de la Biblioteca, d'Informàtica; els del bosc, de Forestal)
const tdArtMode = id => (TD_WORLDS.find(w => w.id === (TD_ARTIFACTS[id]?.world || 1)) || {}).mode || "informatic";
// Si un artefacte ha acabat en una sala que no és la seua (partides d'abans de separar-les), torna a la seua
function tdSortRoomArtifacts() {
  for (const id of Object.keys(td.artifacts)) {
    const m = tdArtMode(id);
    if (m === td.artRoom) continue;
    const b = td.artBank[m] ||= { artifacts: {}, equipped: [] };
    b.artifacts[id] = Math.max(b.artifacts[id] || 0, td.artifacts[id]);
    delete td.artifacts[id];
  }
  td.equipped = td.equipped.filter(id => td.artifacts[id]);
}
// En entrar a una sala, el cristall és el d'eixa sala: es guarden les millores de l'altra i es trauen les seues
function tdUseRoomUpgrades(room) {
  if (td.upRoom === room) return;
  td.upBank[td.upRoom] = td.upgrades;
  td.upgrades = td.upBank[room] || { vida: 0, mana: 0, saber: 0 };
  delete td.upBank[room];
  td.upRoom = room;
  tdSave();
}
function tdUseRoomArtifacts(room) {
  if (td.artRoom === room) { tdSortRoomArtifacts(); return; }
  td.artBank[td.artRoom] = { artifacts: td.artifacts, equipped: td.equipped };
  const b = td.artBank[room] || { artifacts: {}, equipped: [] };
  td.artifacts = b.artifacts; td.equipped = b.equipped;
  delete td.artBank[room];
  td.artRoom = room;
  tdSortRoomArtifacts();
  tdSave();
}
function tdMissions(mode) {
  const day = tdToday();
  if (td.missions.date !== day || !Array.isArray(td.missions.list)) td.missions = { date: day, list: [] };
  const fields = tdFieldsOf(mode);
  if (!td.missions.list.some(m => fields.includes(m.f))) { // tres per carrera, iguals tot el dia
    let seed = [...day + mode].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const rnd = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296;
    const acts = TD_MISSION_ACTS.slice();
    for (let i = 0; i < 3; i++) {
      const [a, need, bonus] = acts.splice(Math.floor(rnd() * acts.length), 1)[0];
      td.missions.list.push({ f: fields[Math.floor(rnd() * fields.length)], a, need, bonus, have: 0, done: false });
    }
  }
  return td.missions.list.filter(m => fields.includes(m.f));
}
function tdMissionProgress(subj, actId) {
  const done = [];
  for (const m of tdMissions(TD_SUBJECTS[subj].mode)) {
    if (m.done || m.f !== subj || m.a !== actId) continue;
    m.have++;
    if (m.have >= m.need) { m.done = true; td.pergamins[subj] += m.bonus; tdLog(subj, `🏅 Missió: ${TD_ACTIVITIES.find(a => a.id === m.a).name}`, m.bonus); done.push(m); }
  }
  return done;
}
function tdRegisterStudy(subj, actId, cls = "") {
  const act = TD_ACTIVITIES.find(a => a.id === actId);
  if (!act || !TD_SUBJECTS[subj]) return null;
  const rolls = Math.min(act.rolls, tdDailyLeft(subj));
  const missions = tdMissionProgress(subj, actId); // la missió compta encara que ja no queden pergamins per hui
  if (rolls <= 0) { tdSave(); return { rolls: 0, capped: true, missions }; }
  td.daily[subj] = (td.daily[subj] || 0) + rolls;
  td.pergamins[subj] += rolls;
  tdLog(subj, `${act.icon} ${act.name}${cls ? ` · ${cls}` : ""}`, rolls);
  tdSave();
  return { rolls, capped: rolls < act.rolls, missions };
}
function tdRegisterExam(subj, nota, final, cls = "") {
  nota = Math.round(Number(nota) * 10) / 10;
  if (!TD_SUBJECTS[subj] || !(nota >= 0 && nota <= 10)) return null;
  const rolls = tdExamRolls(nota);
  td.pergamins[subj] += rolls;
  let mythic = null;
  if (final && nota >= TD_MYTHIC_GRADE) {
    const id = Object.keys(TD_DEFENDERS).find(k => TD_DEFENDERS[k].subj === subj && TD_DEFENDERS[k].rar === "mitic");
    if (id) mythic = tdGrant(id);
    td.boost[subj] = true; // i el camp queda potenciat per sempre
  }
  tdLog(subj, `${final ? "🎓 Examen final" : "📄 Examen parcial"}: ${String(nota).replace(".", ",")}${cls ? ` · ${cls}` : ""}`, rolls, !!mythic);
  tdSave();
  return { rolls, mythic };
}
function tdLog(subj, what, rolls, mythic = false) {
  td.log.unshift({ t: Date.now(), subj, what, rolls, mythic });
  td.log.length = Math.min(td.log.length, 40);
}

// ---------------------------------------------------------------- saber: nivells i millores
function tdLevelUp(id) {
  const o = td.owned[id];
  if (!o || o.level >= tdLevelCap(id)) return false;
  const cost = tdLevelCost(TD_DEFENDERS[id].rar, o.level);
  if (td.saber < cost) return false;
  td.saber -= cost;
  o.level++;
  tdSave();
  return true;
}
const tdUpgradeCost = id => Math.round(TD_UPGRADES[id].base * TD_UPGRADES[id].growth ** td.upgrades[id]);
function tdBuyUpgrade(id) {
  const u = TD_UPGRADES[id];
  if (!u || td.upgrades[id] >= u.max || td.saber < tdUpgradeCost(id)) return false;
  td.saber -= tdUpgradeCost(id);
  td.upgrades[id]++;
  tdSave();
  return true;
}

// Reiniciar sense perdre el que s'ha guanyat estudiant: es conserven les criatures (còpies i estrelles), els pergamins,
// els artefactes, l'equip i el registre d'estudi. Es perden el saber, els nivells, les millores i el progrés dels mons.
function tdRestart() {
  td.saber = 0;
  for (const o of Object.values(td.owned)) o.level = 1;
  td.upgrades = { vida: 0, mana: 0, saber: 0 };
  td.upBank = {}; // es perden les dels dos cristalls, com els mons
  td.worlds = {};
  tdSave();
}
