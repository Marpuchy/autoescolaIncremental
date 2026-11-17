// ===== ESTUDI: ESTAT, GUARDAT, INVOCACIONS I ESTADÍSTIQUES =====
// La partida d'estudi es guarda a part de la de l'autoescola (TD_SAVE_KEY), i no s'ha de canviar mai.
// Camps nous: s'omplin sols amb els valors de tdNewState(). Si es canvia l'estructura, cal una migració ací.
const TD_SAVE_KEY = "estudi-save-v1";

function tdNewState() {
  return {
    v: 1,
    pergamins: { alg: 5, prg: 5 },                  // regal de benvinguda: 5 invocacions de cada assignatura
    pity: { alg: { epic: 0, llegendari: 0 }, prg: { epic: 0, llegendari: 0 } },
    owned: { sumador: { copies: 1, level: 1 }, puntcoma: { copies: 1, level: 1 } }, // les dues primeres criatures
    team: ["sumador", "puntcoma"],
    favs: [],                                         // criatures preferides (grimori)
    saber: 0,
    upgrades: { vida: 0, mana: 0, saber: 0 },
    artifacts: {},                                    // id → nivell
    equipped: [],                                     // artefactes que porta l'estudiant
    worlds: {},                                       // id → { best: onada, clears: vegades }
    seen: [],                                         // enemics vistos (bestiari)
    log: [],                                          // què s'ha estudiat (els 40 últims)
    daily: { date: "", alg: 0, prg: 0 },
    missions: { date: "", list: [] },                 // missions diàries (pergamins extra si es fan abans de mitjanit)
    pulls: 0,
  };
}

let td = tdNewState();
let tdSavingSuspended = false;

function tdSave() {
  if (tdSavingSuspended) return;
  try { localStorage.setItem(TD_SAVE_KEY, JSON.stringify(td)); } catch {}
}
function tdLoad() {
  let raw = null;
  try { raw = localStorage.getItem(TD_SAVE_KEY); } catch {}
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return;
    const base = tdNewState();
    // Només els camps coneguts; els desconeguts o malformats es queden amb el valor per defecte
    for (const k of Object.keys(base)) if (data[k] !== undefined && typeof data[k] === typeof base[k]) td[k] = data[k];
    for (const s of Object.keys(TD_SUBJECTS)) {
      td.pergamins[s] = Math.max(0, Number(td.pergamins[s]) || 0);
      td.pity[s] = { epic: 0, llegendari: 0, ...(td.pity[s] || {}) };
    }
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
    // criatures o artefactes que ja no existixen: fora
    for (const id of Object.keys(td.owned)) if (!TD_DEFENDERS[id]) delete td.owned[id];
    for (const id of Object.keys(td.artifacts)) if (!TD_ARTIFACTS[id]) delete td.artifacts[id];
    td.team = td.team.filter(id => td.owned[id]).slice(0, 6);
    td.favs = td.favs.filter(id => TD_DEFENDERS[id]);
    // un artefacte per espai
    td.equipped = td.equipped.filter((id, i, a) => td.artifacts[id] && a.findIndex(o => tdArtSlot(o) === tdArtSlot(id)) === i).slice(0, TD_ARTIFACT_SLOTS);
  } catch {}
}

// ---------------------------------------------------------------- criatures: estrelles i estadístiques
function tdStars(id) {
  const c = td.owned[id]?.copies || 0;
  let s = 0;
  for (const need of TD_STAR_COPIES) if (c >= need) s++;
  return s;
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
  const d = TD_DEFENDERS[id], o = td.owned[id] || { level: 1 };
  const stars = Math.max(1, tdStars(id));
  const dmgMult = (1 + 0.12 * (o.level - 1)) * (1 + 0.3 * (stars - 1)) * TD_BATTLE.upgradeMult[up];
  return {
    dmg: d.dmg * dmgMult,
    rate: d.rate * (1 + 0.1 * (stars - 1)) * (1 + tdArtBonus("rate")),
    range: d.range * (1 + tdArtBonus("range")),
    ability: tdAbility(stars, o.level), // ★3, ★5 i els nivells 10 i 20 milloren l'habilitat (durades, zones, objectius)
    stars, level: o.level,
  };
}

// ---------------------------------------------------------------- invocacions (gacha)
const tdRand = () => Math.random();
function tdRollRarity(subj) {
  const p = td.pity[subj];
  p.epic++; p.llegendari++;
  let rar;
  const r = tdRand();
  if (p.llegendari >= TD_PITY.llegendari || r < TD_RARITIES.llegendari.chance) rar = "llegendari";
  else if (p.epic >= TD_PITY.epic || r < TD_RARITIES.llegendari.chance + TD_RARITIES.epic.chance) rar = "epic";
  else if (r < TD_RARITIES.llegendari.chance + TD_RARITIES.epic.chance + TD_RARITIES.rar.chance) rar = "rar";
  else rar = "comu";
  if (rar === "llegendari") { p.llegendari = 0; p.epic = 0; }
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
  const after = tdStars(id);
  if (before === 0 && td.team.length < 6) td.team.push(id);
  return { id, isNew: before === 0, starUp: before > 0 && after > before, stars: after, saber };
}
function tdSummon(subj, n = 1) {
  n = Math.min(n, td.pergamins[subj]);
  const results = [];
  for (let i = 0; i < n; i++) {
    td.pergamins[subj]--;
    td.pulls++;
    const rar = tdRollRarity(subj);
    const pool = tdPool(subj, rar); // només criatures de l'assignatura triada
    results.push(tdGrant(pool[Math.floor(tdRand() * pool.length)]));
  }
  tdSave();
  return results;
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
function tdMissions() {
  const day = tdToday();
  if (td.missions.date !== day || !Array.isArray(td.missions.list)) {
    let seed = [...day].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const rnd = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296;
    const acts = TD_MISSION_ACTS.slice(), list = [];
    for (let i = 0; i < 3; i++) {
      const [a, need, bonus] = acts.splice(Math.floor(rnd() * acts.length), 1)[0];
      list.push({ f: Object.keys(TD_SUBJECTS)[Math.floor(rnd() * Object.keys(TD_SUBJECTS).length)], a, need, bonus, have: 0, done: false });
    }
    td.missions = { date: day, list };
  }
  return td.missions.list;
}
function tdMissionProgress(subj, actId) {
  const done = [];
  for (const m of tdMissions()) {
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
  td.worlds = {};
  tdSave();
}
