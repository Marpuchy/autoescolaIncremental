// ===== CONFIGURACIÓ (ajusta ací el balanç) =====
const CONFIG = {
  debug: {
    autoPassExams: false, // 🧪 PER A PROVAR: posa-ho a true perquè els exàmens d'escenari s'aproven sols.
  },
  player: { maxHp: 150, atk: 10, attackInterval: 1.0, regen: 0, minInterval: 0.2 },
  enemy: {
    // Amb millores planes, la simulació topa cap al nivell 20-30 (lineal contra exponencial)
    baseHp: 20, hpGrowth: 1.15,
    baseAtk: 2, atkGrowth: 1.12,
    attackInterval: 1.2,
    baseReward: 5, rewardGrowth: 1.15,
  },
  bossEvery: 10,          // cada X nivells apareix un cap
  bossMultiplier: 3,
  enemyBias: 15,          // com més baix, més ràpid augmenta la probabilitat dels enemics grans
  levelsPerScene: 10,     // en derrotar el cap del nivell 10, 20... hi ha examen i canvia l'escenari
  levelCap: {
    initial: 5,           // nivell màxim inicial de cada millora
    step: 5,              // nivells que desbloqueja cada ampliació
    baseLCost: 2,         // cost en L de la primera ampliació
    lCostGrowth: 1,       // +X L per cada ampliació ja feta
    scalingPct: 10,       // cada ampliació multiplica l'escalat per (1 + X%): 100% -> 110% -> 121% -> 133%...
  },
  testRewards: { 0: 5, 1: 3, 2: 1 },   // errades -> L
  shop: {
    enemiesWorth: 15,     // cada compra dona els diners d'X enemics normals del nivell actual
    baseLCost: 1,         // preu en L de la primera compra
    lCostGrowth: 1,       // +X L per cada compra ja feta (es reinicia en reiniciar la partida)
  },
  // Ratxa: cada test amb 0-2 errades la fa créixer; només es perd amb 3 o més errades.
  // L extra = ratxa (fins a maxStreak) × rate segons les errades del test → màx. +5 / +3 / +1
  streak: { maxStreak: 10, rate: { 0: 0.5, 1: 0.3, 2: 0.1 } },
  exam: { questions: 8, maxErrors: 1 }, // si se suspén, la partida es reinicia (es mantenen les L)
  hitDelay: 190,          // ms fins que l'envestida "impacta" (efectes visuals)
};

// Pixel: el gatet gris, cap especial dels Carreronets de Sogorb
const PIXEL_SVG = `<svg viewBox="0 0 140 144" aria-label="Pixel">
  <path d="M104 124 Q138 118 132 84 Q128 66 114 72" stroke="#868c95" stroke-width="12" fill="none" stroke-linecap="round"/>
  <ellipse cx="70" cy="110" rx="38" ry="28" fill="#9ca2ab"/>
  <ellipse cx="70" cy="116" rx="20" ry="16" fill="#dde1e6"/>
  <polygon points="34,46 38,10 64,34" fill="#9ca2ab"/><polygon points="106,46 102,10 76,34" fill="#9ca2ab"/>
  <polygon points="40,40 42,20 56,34" fill="#f5a9ba"/><polygon points="100,40 98,20 84,34" fill="#f5a9ba"/>
  <ellipse cx="70" cy="62" rx="42" ry="35" fill="#9ca2ab"/>
  <g stroke="#7b8089" stroke-width="4" stroke-linecap="round"><path d="M62 30 L65 41"/><path d="M70 28 L70 41"/><path d="M78 30 L75 41"/></g>
  <circle cx="53" cy="60" r="11" fill="#fff"/><circle cx="87" cy="60" r="11" fill="#fff"/>
  <circle cx="51" cy="61" r="8.5" fill="#8fd16a"/><circle cx="85" cy="61" r="8.5" fill="#8fd16a"/>
  <ellipse cx="50" cy="61" rx="3" ry="6.5" fill="#23262d"/><ellipse cx="84" cy="61" rx="3" ry="6.5" fill="#23262d"/>
  <circle cx="54" cy="56" r="2.6" fill="#fff"/><circle cx="88" cy="56" r="2.6" fill="#fff"/>
  <ellipse cx="42" cy="76" rx="7" ry="4.5" fill="#f5a9ba" opacity="0.7"/><ellipse cx="98" cy="76" rx="7" ry="4.5" fill="#f5a9ba" opacity="0.7"/>
  <polygon points="65,72 75,72 70,78" fill="#f28aa6"/>
  <path d="M70 78 Q66 85 60 82 M70 78 Q74 85 80 82" stroke="#4a4d54" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <g stroke="#5b5f66" stroke-width="1.6" stroke-linecap="round">
    <line x1="30" y1="72" x2="8" y2="68"/><line x1="30" y1="77" x2="8" y2="79"/>
    <line x1="110" y1="72" x2="132" y2="68"/><line x1="110" y1="77" x2="132" y2="79"/>
  </g>
  <rect x="44" y="92" width="52" height="7" rx="3" fill="#e0453e"/>
  <rect x="64" y="97" width="12" height="12" fill="#3fb6e8" stroke="#1d7fa8" stroke-width="2"/>
  <ellipse cx="54" cy="136" rx="11" ry="7" fill="#dde1e6"/><ellipse cx="86" cy="136" rx="11" ry="7" fill="#dde1e6"/>
</svg>`;
const PIXEL_BOSS = {
  name: "Pixel",
  icon: PIXEL_SVG,
  desc: "Un gatet gris que viu als carreronets de Sogorb. Tan adorable que no li pots tocar el clàxon... i ell ho sap perfectament.",
};

// img: imatge de fons de l'escenari (es pot substituir per un .png/.jpg amb el mateix nom de camp)
// boss (opcional): cap especial de l'escenari en lloc de l'Examinador de Trànsit
const SCENES = [
  { name: "Afores d'Eslida",                bg: "#3a4a3f", img: "img/escenari-1.svg" },
  { name: "Polígon industrial",             bg: "#4a4450", img: "img/escenari-2.svg" },
  { name: "Afores de Castelló",             bg: "#6b5a3a", img: "img/escenari-3.svg" },
  { name: "Avinguda València (Violència)",  bg: "#3a2440", img: "img/escenari-4.svg" },
  { name: "La Vall d'Uixó",                 bg: "#5a6b52", img: "img/escenari-5.svg" },
  { name: "Carreronets de Sogorb",          bg: "#6b5f53", img: "img/escenari-6.svg", boss: PIXEL_BOSS },
  { name: "La Vall d'Alba",                 bg: "#6b7a4a", img: "img/escenari-7.svg" },
  { name: "València Centre",                bg: "#4a5a6b", img: "img/escenari-8.svg" },
];
const DEFAULT_SCENE_BG = "#3a4250";

// Enemics de xicotet a gran. Als nivells 1-10 només ixen els 2 primers;
// cada escenari nou (cada 10 nivells) afig el següent de la llista.
// mult: multiplicador de vida, atac i recompensa respecte a l'enemic "normal" del nivell.
// icon: HTML del sprite (emoji o SVG). Es pot substituir per <img src="..."> quan hi haja sprites.
const YIELD_SVG = `<svg viewBox="0 0 140 126" aria-label="Cediu el pas">
  <polygon points="6,8 134,8 70,120" fill="#d1261f" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>
  <polygon points="32,24 108,24 70,90" fill="#fff"/>
</svg>`;
// desc: descripció que es mostra en el compendi en fer clic
const ENEMY_TYPES = [
  { name: "Semàfor en groc",          mult: 0.9,  icon: "🚦",
    desc: "Ni verd ni roig: el dubte etern. Accelere o frene? Mentre ho penses, ell ja t'ha atacat." },
  { name: "Cediu el pas",             mult: 1.0,  icon: YIELD_SVG,
    desc: "Un triangle cap per avall que exigix respecte. Si no li cedixes el pas, te'l pren ell." },
  { name: "Patinet elèctric",         mult: 1.15, icon: "🛴",
    desc: "Apareix del no-res per la vorera, pel carril bici o per on li ve de gust. Silenciós i imprevisible." },
  { name: "Ciclista en la calçada",   mult: 1.3,  icon: "🚴",
    desc: "Circula en columna de dos i té tot el dret del món. Recorda: 1,5 metres en avançar-lo." },
  { name: "Conductor de diumenge",    mult: 1.45, icon: "🚗",
    desc: "Va a 40 pel carril esquerre amb l'intermitent posat des de fa tres quilòmetres." },
  { name: "Furgoneta de repartiment", mult: 1.65, icon: "🚐",
    desc: "Sempre té pressa i sempre para en doble fila. El paquet és més important que tu." },
  { name: "Tractor a 20 km/h",        mult: 1.85, icon: "🚜",
    desc: "El rei de les carreteres secundàries. Per a avançar-lo cal paciència i una recta molt llarga." },
  { name: "Autobús urbà",             mult: 2.1,  icon: "🚌",
    desc: "Quan posa l'intermitent per a eixir de la parada, té preferència. I ho sap." },
  { name: "Camió del fem",            mult: 2.4,  icon: "🚚",
    desc: "Treballa de matinada, ocupa tot el carrer i fa marxa arrere sense avisar." },
  { name: "Grua municipal",           mult: 2.7,  icon: "🛻",
    desc: "Si has aparcat malament, ja és tard. Se l'emporta tot, i tu pagues." },
  { name: "Camió articulat",          mult: 3.0,  icon: "🚛",
    desc: "Quaranta tones d'angles morts. Si no li veus els espills, ell no et veu a tu." },
  { name: "Tren de mercaderies",      mult: 3.4,  icon: "🚂",
    desc: "Pas a nivell sense barreres? No intentes mai guanyar-li la carrera." },
];
const BOSS_NAME = "Examinador de Trànsit"; // sempre és el cap dels nivells 10, 20, 30...
const BOSS_DESC = "Carpeta en mà i cara de pòquer. Apunta cada falta, per xicoteta que siga. El teu pitjor malson.";
const BOSS_ICON = `🧑‍💼<span class="badge">📋</span>`;
// Mida del sprite segons com de gran és l'enemic
const spriteSize = mult => Math.min(1.35, 0.7 + 0.2 * mult);

// scene: índex de l'escenari (0 = primer) a partir del qual apareix la millora
// base: efecte per nivell amb escalat al 100%
// per(e): el que dona un nivell · total(lv, e): el que donen tots els nivells · stat(p): estadística resultant
// Millores planes (+X per nivell). El que creix exponencialment és l'escalat de les L sobre eixe X.
// base: efecte per nivell amb escalat al 100% · per(e): el que dona un nivell · total(lv, e): tots els nivells
const UPGRADES = [
  { id: "atk",   scene: 0, icon: "📘", name: "Classes teòriques",    base: 5,   baseCost: 5,  costGrowth: 1.3,
    per: e => `+${fmtPct(e)} d'atac`,
    total: (lv, e) => `+${fmtNum(lv * e)} d'atac`,
    stat: p => `Atac total: ${fmtNum(p.atk)}` },
  { id: "hp",    scene: 0, icon: "🦺", name: "Cinturó de seguretat", base: 50,  baseCost: 5,  costGrowth: 1.3,
    per: e => `+${fmtPct(e)} de vida`,
    total: (lv, e) => `+${fmtNum(lv * e)} de vida`,
    stat: p => `Vida màxima: ${fmtNum(p.maxHp)}` },
  { id: "speed", scene: 1, icon: "⚙️", name: "Canvi de marxes",      base: 5,   baseCost: 25, costGrowth: 1.4,
    per: e => `${fmtPct(e)}% més ràpid`,
    total: (lv, e) => `${fmtPct((1 - Math.pow(1 - e / 100, lv)) * 100)}% més ràpid`,
    stat: p => `Ataca cada ${fmtNum(p.attackInterval)} s` },
  { id: "regen", scene: 1, icon: "☕", name: "Café en el descans",   base: 2,   baseCost: 30, costGrowth: 1.35,
    per: e => `+${fmtPct(e)} vida/s`,
    total: (lv, e) => `+${fmtNum(lv * e)} vida/s`,
    stat: p => `Regeneració: ${fmtNum(p.regen)} vida/s` },
];

// ===== ESTAT =====
let state;

function newState(keep = {}) {
  return {
    money: 0,
    lcoins: keep.lcoins || 0,
    testsDone: keep.testsDone || 0,
    perfectStreak: keep.perfectStreak || 0,
    shopPurchases: 0, // compres fetes en la botiga (es reinicien i es tornen les L)
    examsPassed: keep.examsPassed || 0, // exàmens d'escenari aprovats (es conserven en reiniciar)
    expansions: Object.fromEntries(UPGRADES.map(u => [u.id, 0])),
    level: 1,
    best: keep.best || 1,               // rècord de totes les partides (es conserva en reiniciar)
    bestiary: keep.bestiary || {},      // compendi: { nom: { seen, defeated, firstLevel } } de totes les partides
    examPending: false,
    upgrades: Object.fromEntries(UPGRADES.map(u => [u.id, 0])),
    player: { hp: CONFIG.player.maxHp, timer: 0 },
    enemy: null,
  };
}

const sceneIndex = level => Math.floor((level - 1) / CONFIG.levelsPerScene);
const sceneOf = level => {
  const i = sceneIndex(level);
  return SCENES[i] || { name: `Escenari ${i + 1}`, bg: DEFAULT_SCENE_BG };
};
const isSceneEnd = level => level % CONFIG.levelsPerScene === 0;

// Tipus d'enemic i-èsim; si s'acaba la llista, se'n generen variants cada vegada més fortes
function enemyType(i) {
  if (i < ENEMY_TYPES.length) return ENEMY_TYPES[i];
  const extra = i - ENEMY_TYPES.length + 1;
  const base = ENEMY_TYPES[ENEMY_TYPES.length - 1 - ((extra - 1) % 4)];
  return { name: `${base.name} ${"⭐".repeat(Math.ceil(extra / 4))}`, mult: 3.4 * Math.pow(1.15, extra), icon: base.icon };
}

// Tria un enemic: amb el nivell, els grans tenen més pes i els xicotets menys
function pickEnemyType(level) {
  const available = 2 + sceneIndex(level);
  // Primer nivell d'un escenari nou: apareix l'enemic nou garantit
  if (level > CONFIG.levelsPerScene && (level - 1) % CONFIG.levelsPerScene === 0) return enemyType(available - 1);
  const power = (level - 1) / CONFIG.enemyBias;
  const weights = Array.from({ length: available }, (_, i) => Math.pow(i + 1, power));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < available; i++) {
    r -= weights[i];
    if (r <= 0) return enemyType(i);
  }
  return enemyType(available - 1);
}

function makeEnemy(level) {
  const e = CONFIG.enemy;
  const isBoss = level % CONFIG.bossEvery === 0;
  const sceneBoss = sceneOf(level).boss;
  const type = !isBoss ? pickEnemyType(level)
    : sceneBoss ? { ...sceneBoss, mult: CONFIG.bossMultiplier }
    : { name: BOSS_NAME, mult: CONFIG.bossMultiplier, icon: BOSS_ICON };
  const mult = type.mult;
  const hp = Math.round(e.baseHp * Math.pow(e.hpGrowth, level - 1) * mult);
  return {
    name: type.name,
    icon: type.icon,
    size: spriteSize(type.mult),
    maxHp: hp,
    hp: hp,
    atk: Math.round(e.baseAtk * Math.pow(e.atkGrowth, level - 1) * mult * 10) / 10,
    attackInterval: e.attackInterval,
    reward: Math.round(e.baseReward * Math.pow(e.rewardGrowth, level - 1) * mult),
    timer: 0,
  };
}

// ===== MILLORES I LÍMITS =====
const byId = id => UPGRADES.find(u => u.id === id);
const upgradeCost = u => Math.round(u.baseCost * Math.pow(u.costGrowth, state.upgrades[u.id]));
const upgradeCap = u => CONFIG.levelCap.initial + state.expansions[u.id] * CONFIG.levelCap.step;
const expandCost = u => CONFIG.levelCap.baseLCost + state.expansions[u.id] * CONFIG.levelCap.lCostGrowth;
const isMaxed = u => state.upgrades[u.id] >= upgradeCap(u);
// Una millora desbloquejada ho queda per a sempre (encara que es reinicie la partida)
const visibleUpgrades = () => UPGRADES.filter(u => Math.max(sceneIndex(state.best), state.examsPassed) >= u.scene);
// Efecte per nivell segons les ampliacions (tier) fetes amb L
// Escalat en % segons les ampliacions (tier) fetes amb L: 100%, 110%, 120%...
const scalingFactor = (tier) => Math.pow(1 + CONFIG.levelCap.scalingPct / 100, tier);
const scalingPct = (u, tier = state.expansions[u.id]) => Math.round(100 * scalingFactor(tier));
const effect = (u, tier = state.expansions[u.id]) => u.base * scalingFactor(tier);

// Les estadístiques es calculen a partir dels nivells i ampliacions (així l'escalat és retroactiu)
function recomputeStats() {
  const p = state.player;
  const lv = id => state.upgrades[id];
  const oldMax = p.maxHp || CONFIG.player.maxHp;

  p.atk = CONFIG.player.atk + lv("atk") * effect(byId("atk"));
  p.maxHp = CONFIG.player.maxHp + lv("hp") * effect(byId("hp"));
  p.attackInterval = Math.max(CONFIG.player.minInterval,
    CONFIG.player.attackInterval * Math.pow(1 - effect(byId("speed")) / 100, lv("speed")));
  p.regen = CONFIG.player.regen + lv("regen") * effect(byId("regen"));

  // Si puja la vida màxima, es guanya eixa diferència de vida actual
  p.hp = Math.min(p.maxHp, (p.hp ?? p.maxHp) + Math.max(0, p.maxHp - oldMax));
}

function buyUpgrade(id) {
  const u = byId(id);
  const cost = upgradeCost(u);
  if (isMaxed(u) || state.money < cost) return;
  state.money -= cost;
  state.upgrades[id]++;
  recomputeStats();
  renderUpgrades();
  save();
}

function expandUpgrade(id) {
  const u = byId(id);
  const cost = expandCost(u);
  if (state.lcoins < cost) return;
  state.lcoins -= cost;
  state.expansions[id]++;
  recomputeStats();
  toast(`🔓 ${u.name}: nivell màxim ${upgradeCap(u)} i escalat al ${scalingPct(u)}%`, "good");
  renderUpgrades();
  save();
}

// ===== LÒGICA DE COMBAT =====
function update(dt) {
  const p = state.player;
  const e = state.enemy;

  p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);

  p.timer += dt;
  while (p.timer >= p.attackInterval) {
    p.timer -= p.attackInterval;
    e.hp -= p.atk;
    attackFx("player", "enemy", p.atk);
    if (e.hp <= 0) { onEnemyDefeated(); return; }
  }

  e.timer += dt;
  while (e.timer >= e.attackInterval) {
    e.timer -= e.attackInterval;
    p.hp -= e.atk;
    attackFx("enemy", "player", e.atk);
    if (p.hp <= 0) { onPlayerDefeated(); return; }
  }
}

function onEnemyDefeated() {
  const e = state.enemy;
  state.money += e.reward;
  bestiaryEntry(e.name).defeated++;
  if (!$("tab-bestiary").hidden) renderBestiary();
  state.player.timer = 0;

  if (isSceneEnd(state.level) && (state.examsPassed > sceneIndex(state.level) || CONFIG.debug.autoPassExams)) {
    // Examen ja aprovat en una partida anterior (o mode prova): es passa directament
    const auto = state.examsPassed <= sceneIndex(state.level);
    skipExam();
    toast(auto ? `🧪 Mode prova: examen aprovat. Passes a «${sceneOf(state.level).name}»`
               : `🎫 Examen ja aprovat. Passes a «${sceneOf(state.level).name}»`, "good");
    return;
  }

  if (isSceneEnd(state.level)) {
    // Final d'escenari: el combat es para i apareix l'examen a pantalla completa
    state.examPending = true;
    state.enemy = makeEnemy(state.level);
    showExamIntro();
    save();
    return;
  }
  advanceLevel();
  state.enemy = makeEnemy(state.level);
}

// Passa al següent escenari sense fer l'examen
function skipExam() {
  const before = visibleUpgrades().length;
  state.examPending = false;
  state.examsPassed = Math.max(state.examsPassed, sceneIndex(state.level) + 1);
  advanceLevel();
  state.enemy = makeEnemy(state.level);
  if (visibleUpgrades().length > before) toast("✨ Noves millores disponibles!", "good");
  renderUpgrades(before);
  save();
}

function advanceLevel() {
  state.level++;
  state.best = Math.max(state.best, state.level);
}

function onPlayerDefeated() {
  toast("❌ SUSPÉS! Torna-ho a intentar", "bad");
  state.player.hp = state.player.maxHp;
  state.player.timer = 0;
  // El mateix enemic, amb la vida plena
  state.enemy.hp = state.enemy.maxHp;
  state.enemy.timer = 0;
}

// ===== TESTS (moneda L) =====
const streakBonus = (streak, fails) =>
  Math.round(Math.min(streak, CONFIG.streak.maxStreak) * (CONFIG.streak.rate[fails] || 0));
function testReward(fails) {
  const base = CONFIG.testRewards[fails] || 0;
  return base + streakBonus(state.perfectStreak, fails);
}

// ===== BOTIGA (L -> diners) =====
const shopCost = () => CONFIG.shop.baseLCost + state.shopPurchases * CONFIG.shop.lCostGrowth;
const shopCoins = () => Math.round(CONFIG.shop.enemiesWorth * CONFIG.enemy.baseReward *
  Math.pow(CONFIG.enemy.rewardGrowth, state.level - 1));

function renderShop() {
  const cost = shopCost();
  $("shop-coins").textContent = fmt(shopCoins());
  const label = `Comprar per ${cost} ${L_ICON}`;
  if ($("btn-shop-buy").innerHTML !== label) $("btn-shop-buy").innerHTML = label; // evita perdre clics
  $("btn-shop-buy").disabled = state.lcoins < cost;
  const info = `Compres fetes: ${state.shopPurchases}. Cada compra puja el preu ${CONFIG.shop.lCostGrowth} ${L_ICON}. ` +
    `Els diners que dona depenen del teu nivell actual.`;
  if ($("shop-info").innerHTML !== info) $("shop-info").innerHTML = info;
}

function buyCoins() {
  const cost = shopCost();
  if (state.lcoins < cost) return;
  const coins = shopCoins();
  state.lcoins -= cost;
  state.money += coins;
  state.shopPurchases++;
  toast(`🏪 +${fmt(coins)} 💰 (-${cost} ${L_ICON})`, "good");
  renderShop();
  save();
}

function renderTestPanel() {
  const labels = ["0 errades", "1 errada", "2 errades", "3 o més"];
  $("test-options").innerHTML = labels.map((label, fails) => `
    <button data-fails="${fails}" class="${fails === 3 ? "secondary" : ""}">
      ${label} <small>(+${testReward(fails)} ${L_ICON})</small>
    </button>`).join("");
  $("test-options").querySelectorAll("button").forEach(btn =>
    btn.addEventListener("click", () => registerTest(Number(btn.dataset.fails))));

  const s = state.perfectStreak;
  const max = CONFIG.streak.maxStreak;
  const maxBonus = f => Math.round(max * CONFIG.streak.rate[f]);
  $("streak-info").innerHTML = (s > 0
    ? `<span class="streak">🔥 Ratxa de ${s} ${s === 1 ? "test aprovat" : "tests aprovats"}</span>${s >= max ? " (màxima)" : ""}. `
    : "") +
    `Cada test amb 2 errades o menys fa créixer la ratxa i dona ${L_ICON} extra (fins a +${maxBonus(0)} / +${maxBonus(1)} / +${maxBonus(2)} segons les errades). Només es perd amb 3 o més errades.`;
  $("tests-done").textContent = state.testsDone;
}

function registerTest(fails) {
  const reward = testReward(fails);
  state.testsDone++;
  state.lcoins += reward;
  if (fails < 3) {
    const bonus = streakBonus(state.perfectStreak, fails);
    state.perfectStreak++;
    toast(`📝 +${reward} ${L_ICON}` + (bonus > 0 ? ` (${bonus} de ratxa)` : "") + ` · 🔥 ratxa ${state.perfectStreak}`, "good");
  } else {
    if (state.perfectStreak > 1) toast(`💔 S'ha trencat la ratxa de ${state.perfectStreak}`, "bad");
    state.perfectStreak = 0;
    toast(`📝 Sense ${L_ICON}. Continua practicant!`, "bad");
  }
  renderTestPanel();
  renderUpgrades();
  save();
}

// ===== EXAMEN D'ESCENARI (pantalla completa) =====
let currentExam = null;
let upgradesBeforeExam = 0; // per a saber quines millores són noves en aprovar

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const examOpen = () => !$("exam-screen").hidden;

function showExamIntro() {
  const max = CONFIG.exam.maxErrors;
  $("exam-current").textContent = sceneOf(state.level).name;
  const boss = sceneOf(state.level).boss;
  $("exam-boss").textContent = boss ? boss.name : "l'Examinador de Trànsit";
  $("exam-next").textContent = sceneOf(state.level + 1).name;
  $("exam-rules").textContent =
    `${CONFIG.exam.questions} preguntes. Pots tindre com a màxim ${max} ${max === 1 ? "errada" : "errades"}.`;
  $("exam-intro").hidden = false;
  $("exam-body").hidden = true;
  $("exam-screen").hidden = false;
}

function startExam() {
  currentExam = shuffle(QUESTIONS).slice(0, CONFIG.exam.questions).map(q => ({
    q: q.q,
    options: shuffle(q.o.map((text, i) => ({ text, correct: i === 0 }))),
  }));

  $("exam-form").innerHTML = currentExam.map((item, qi) => `
    <div class="question">
      <p>${qi + 1}. ${item.q}</p>
      ${item.options.map((o, oi) => `
        <label><input type="radio" name="q${qi}" value="${oi}"> ${o.text}</label>`).join("")}
    </div>`).join("");
  $("exam-result").textContent = "";
  $("exam-result").className = "";
  $("btn-exam-submit").hidden = false;
  $("btn-exam-retry").hidden = true;
  $("btn-exam-continue").hidden = true;
  $("exam-intro").hidden = true;
  $("exam-body").hidden = false;
  $("exam-screen").scrollTop = 0;
}

function submitExam() {
  const form = $("exam-form");
  const unanswered = currentExam.filter((_, qi) => !form.querySelector(`input[name="q${qi}"]:checked`)).length;
  if (unanswered > 0) {
    $("exam-result").textContent = `Et ${unanswered === 1 ? "queda 1 pregunta" : `queden ${unanswered} preguntes`} per respondre.`;
    $("exam-result").className = "ko";
    return;
  }

  let errors = 0;
  currentExam.forEach((item, qi) => {
    form.querySelectorAll(`input[name="q${qi}"]`).forEach((input, oi) => {
      input.disabled = true;
      const label = input.parentElement;
      if (item.options[oi].correct) label.classList.add("correct");
      else if (input.checked) { label.classList.add("wrong"); errors++; }
    });
  });

  $("btn-exam-submit").hidden = true;
  const result = $("exam-result");
  const errText = `${errors} ${errors === 1 ? "errada" : "errades"}`;
  if (errors <= CONFIG.exam.maxErrors) {
    result.textContent = `APTE! ${errText}. Benvingut a «${sceneOf(state.level + 1).name}».`;
    result.className = "ok";
    upgradesBeforeExam = visibleUpgrades().length;
    state.examPending = false;
    state.examsPassed = Math.max(state.examsPassed, sceneIndex(state.level) + 1);
    advanceLevel();
    state.enemy = makeEnemy(state.level);
    state.player.hp = state.player.maxHp;
    state.player.timer = 0;
    $("btn-exam-continue").hidden = false;
  } else {
    result.className = "ko";
    const refunded = restartGame(); // es reinicia ja (i es guarda) perquè no es puga evitar recarregant
    result.innerHTML = `NO APTE. ${errText}. Tornes a començar des del principi.` +
      (refunded > 0 ? ` Se t'han tornat ${refunded} ${L_ICON} (ampliacions i botiga).` : "");
    $("btn-exam-retry").hidden = false;
  }
  save();
}

function continueAfterExam() {
  const before = upgradesBeforeExam;
  $("exam-screen").hidden = true;
  toast(`🎉 Nou escenari: ${sceneOf(state.level).name}`, "good");
  if (visibleUpgrades().length > before) toast("✨ Noves millores disponibles!", "good");
  renderUpgrades(before);
}

// ===== EFECTES VISUALS =====
function restartAnim(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth; // força el reflow perquè l'animació torne a començar
  el.classList.add(cls);
}

function attackFx(attacker, target, dmg) {
  const aAv = $(attacker + "-avatar");
  const tAv = $(target + "-avatar");
  const a = aAv.getBoundingClientRect();
  const t = tAv.getBoundingClientRect();
  const dx = (t.left + t.width / 2) - (a.left + a.width / 2);
  const dy = (t.top + t.height / 2) - (a.top + a.height / 2);

  aAv.style.setProperty("--dx", `${dx}px`);
  aAv.style.setProperty("--dy", `${dy}px`);
  aAv.style.setProperty("--rot", `${dx >= 0 ? 14 : -14}deg`);
  $(attacker).classList.add("attacking");
  $(target).classList.remove("attacking");
  restartAnim(aAv, "lunge");

  setTimeout(() => {
    restartAnim($(target), "hit");
    spawnDamage(tAv, dmg, attacker);
  }, CONFIG.hitDelay);
}

function spawnDamage(avatar, dmg, attacker) {
  const n = document.createElement("span");
  n.className = `dmg by-${attacker}`;
  n.textContent = `-${fmtNum(dmg)}`;
  n.style.setProperty("--ox", `${Math.round(Math.random() * 60 - 30)}px`);
  n.addEventListener("animationend", () => n.remove());
  avatar.appendChild(n);
}

// html: els missatges són interns (permeten la icona de la L)
function toast(html, type = "") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = html;
  el.addEventListener("animationend", () => el.remove());
  const box = $("toasts");
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
}

// ===== RENDER =====
const $ = id => document.getElementById(id);
const L_ICON = `<span class="lplate sm">L</span>`;
// Números: a partir de 100.000 s'abreugen (K, M, B, T...) i, més enllà, notació científica
const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
function abbreviate(n) {
  if (!isFinite(n)) return "∞";
  const tier = Math.floor(Math.log10(Math.abs(n)) / 3);
  if (tier >= SUFFIXES.length) return n.toExponential(2).replace(".", ",");
  const v = n / Math.pow(1000, tier);
  return v.toLocaleString("ca-ES", { maximumFractionDigits: v < 10 ? 2 : v < 100 ? 1 : 0 }) + " " + SUFFIXES[tier];
}
const fmt = n => Math.abs(n) >= 1e5 ? abbreviate(n) : Math.floor(n).toLocaleString("ca-ES");
const fmtPct = n => n.toLocaleString("ca-ES", { maximumFractionDigits: 1 });
const fmtNum = n => Math.abs(n) >= 1e5 ? abbreviate(n) : n.toLocaleString("ca-ES", { maximumFractionDigits: 2 });

// ===== COMPENDI D'ENEMICS =====
function bestiaryEntry(name) {
  return state.bestiary[name] ||= { seen: 0, defeated: 0, firstLevel: state.level };
}

let lastSeenEnemy = null;
function registerSeen(e) {
  if (lastSeenEnemy === e) return;
  lastSeenEnemy = e;
  const isNew = !state.bestiary[e.name];
  bestiaryEntry(e.name).seen++;
  if (isNew && state.enemy === e) toast(`📖 Nou enemic al compendi: ${e.name}`, "good");
  if (!$("tab-bestiary").hidden) renderBestiary();
}

// Nivell a partir del qual pot aparéixer cada tipus d'enemic
const typeFromLevel = i => i < 2 ? 1 : (i - 1) * CONFIG.levelsPerScene + 1;
const sizeLabel = mult => mult < 1.1 ? "Xicotet" : mult < 1.7 ? "Mitjà" : mult < 2.6 ? "Gran" : "Enorme";

let openBeast = null; // entrada del compendi desplegada

function renderBestiary() {
  // Només: els ja vistos + els que poden eixir en l'escenari actual (els futurs no es mostren)
  const availableNow = 2 + sceneIndex(state.level);
  const entries = [
    ...ENEMY_TYPES.map((t, i) => ({ ...t, from: `Des del nivell ${typeFromLevel(i)}`, now: i < availableNow })),
    { name: BOSS_NAME, icon: BOSS_ICON, mult: CONFIG.bossMultiplier, desc: BOSS_DESC, now: !sceneOf(state.level).boss,
      from: `Cap dels nivells ${CONFIG.bossEvery}, ${CONFIG.bossEvery * 2}...` },
    // Caps especials d'alguns escenaris
    ...SCENES.map((sc, i) => sc.boss && { ...sc.boss, mult: CONFIG.bossMultiplier,
      now: sceneIndex(state.level) === i, from: `Cap de «${sc.name}»` }).filter(Boolean),
  ];
  // Variants amb estreles que ja s'han vist
  for (const name of Object.keys(state.bestiary)) {
    if (!entries.some(e => e.name === name)) {
      const base = ENEMY_TYPES.find(t => name.startsWith(t.name));
      entries.push({ name, icon: base ? base.icon : "❓", mult: 3.5, from: "Variant",
        desc: `Una versió encara més forta i empipadora de «${base ? base.name : "?"}».` });
    }
  }
  const shown = entries.filter(e => state.bestiary[e.name] || e.now);
  const found = shown.filter(e => state.bestiary[e.name]).length;
  $("bestiary-count").textContent = `${found} ${found === 1 ? "descobert" : "descoberts"}`;

  $("bestiary-list").innerHTML = shown.map(e => {
    const b = state.bestiary[e.name];
    const open = openBeast === e.name;
    if (!b) return `
      <div class="beast unknown${open ? " open" : ""}" data-name="${e.name}">
        <div class="beast-row">
          <div class="beast-icon">${e.icon}</div>
          <div class="beast-info"><div class="beast-name">???</div><div class="beast-meta">Pot aparéixer en aquest escenari</div></div>
        </div>
        <div class="beast-desc">Encara no l'has vist. Continua avançant!</div>
      </div>`;
    return `
      <div class="beast${open ? " open" : ""}" data-name="${e.name}">
        <div class="beast-row">
          <div class="beast-icon">${e.icon}</div>
          <div class="beast-info">
            <div class="beast-name">${e.name}</div>
            <div class="beast-meta">${sizeLabel(e.mult)} · ${e.from}</div>
            <div class="beast-meta">Vist ${b.seen} ${b.seen === 1 ? "vegada" : "vegades"} · Derrotat ${b.defeated}</div>
          </div>
        </div>
        <div class="beast-desc">${e.desc || ""}</div>
      </div>`;
  }).join("");
}

let renderedEnemy = null;
let renderedSceneImg = null;
function renderEnemySprite(e) {
  renderedEnemy = e;
  registerSeen(e);
  const type = ENEMY_TYPES.find(t => e.name.startsWith(t.name)); // partides antigues sense icona
  const sprite = $("enemy-sprite");
  const special = SCENES.find(sc => sc.boss && sc.boss.name === e.name);
  sprite.innerHTML = e.icon || (e.name.includes(BOSS_NAME) ? BOSS_ICON : special ? special.boss.icon : type ? type.icon : "❓");
  sprite.style.setProperty("--size", e.size || 1);
  restartAnim(sprite, "spawn");
}

function render() {
  const p = state.player, e = state.enemy;
  $("money").textContent = fmt(state.money);
  $("lcoins").textContent = fmt(state.lcoins);
  $("level").textContent = state.level;
  $("best").textContent = state.best;

  const scene = sceneOf(state.level);
  $("scene-num").textContent = sceneIndex(state.level) + 1;
  $("scene-name").textContent = scene.name;
  $("scene-level").textContent = ((state.level - 1) % CONFIG.levelsPerScene) + 1;
  $("scene-size").textContent = CONFIG.levelsPerScene;
  $("scene").style.setProperty("--scene-bg", scene.bg);
  const img = scene.img ? `url("${scene.img}")` : "none";
  if (renderedSceneImg !== img) { renderedSceneImg = img; $("scene").style.backgroundImage = img; }

  $("player-hp-bar").style.width = (Math.max(0, p.hp) / p.maxHp * 100) + "%";
  $("enemy-name").textContent = e.name;
  if (renderedEnemy !== e) renderEnemySprite(e);
  $("enemy-hp-bar").style.width = (Math.max(0, e.hp) / e.maxHp * 100) + "%";

  if (!$("tab-shop").hidden) renderShop();

  for (const u of visibleUpgrades()) {
    const buy = $("buy-" + u.id);
    const exp = $("expand-" + u.id);
    if (buy) buy.disabled = isMaxed(u) || state.money < upgradeCost(u);
    if (exp) exp.disabled = state.lcoins < expandCost(u);
  }
}

// animateFrom: índex a partir del qual les millores són noves (per animar-les)
let openInfo = null; // mòbil: millora amb la info de la L desplegada (botó ⓘ)

function renderUpgrades(animateFrom = Infinity) {
  const list = $("upgrade-list");
  const upgrades = visibleUpgrades();
  list.style.setProperty("--cols", upgrades.length);
  list.innerHTML = "";
  upgrades.forEach((u, i) => {
    const lv = state.upgrades[u.id];
    const cap = upgradeCap(u);
    const maxed = isMaxed(u);
    const tier = state.expansions[u.id];
    const e = effect(u), eNext = effect(u, tier + 1);
    const step = CONFIG.levelCap.step;

    const div = document.createElement("div");
    div.className = "upgrade" + (maxed ? " maxed" : "") + (i >= animateFrom ? " new" : "") + (openInfo === u.id ? " show-ltip" : "");
    div.innerHTML = `
      <div class="upgrade-head">
        <span class="upgrade-icon">${u.icon}</span>
        <span class="upgrade-title">${u.name}</span>
        <span class="upgrade-level">Nv. ${lv} / ${cap}</span>
      </div>
      <div class="upgrade-progress"><div style="width:${lv / cap * 100}%"></div></div>
      <div class="upgrade-total"><small>Total</small> ${u.total(lv, e)}</div>
      <div class="upgrade-stat">${u.stat(state.player)}</div>
      <div class="upgrade-next">${maxed ? "🔒 Límit assolit: amplia'l amb L" : `Següent nivell: ${u.per(e)}`}</div>
      <div class="upgrade-buttons">
        <button id="buy-${u.id}" class="buy">${maxed ? "Màxim" : `Millorar · ${fmt(upgradeCost(u))} 💰`}</button>
        <button class="linfo" aria-label="Què fa l'ampliació amb L">ⓘ</button>
        <span class="lwrap">
          <button id="expand-${u.id}" class="lbtn">${L_ICON} ${expandCost(u)}</button>
          <div class="ltip">
            <div class="ltip-title">Ampliació amb ${L_ICON} (cost: ${expandCost(u)})</div>
            <div class="ltip-row"><span>Nivell màxim</span><b>${cap} → ${cap + step}</b></div>
            <div class="ltip-row"><span>Escalat</span><b>${scalingPct(u)}% → ${scalingPct(u, tier + 1)}%</b></div>
            <div class="ltip-row"><span>Per nivell</span><b>${u.per(e)} → ${u.per(eNext)}</b></div>
            <div class="ltip-row"><span>Total actual</span><b>${u.total(lv, e)} → ${u.total(lv, eNext)}</b></div>
            <div class="ltip-foot">L'escalat també s'aplica als nivells que ja tens. Ampliacions fetes: ${tier}.</div>
          </div>
        </span>
      </div>`;
    div.querySelector(`#buy-${u.id}`).addEventListener("click", () => buyUpgrade(u.id));
    div.querySelector(`#expand-${u.id}`).addEventListener("click", () => expandUpgrade(u.id));
    div.querySelector(".linfo").addEventListener("click", () => {
      openInfo = openInfo === u.id ? null : u.id;
      renderUpgrades();
    });
    list.appendChild(div);
  });
}


// ===== GUARDAT =====
// IMPORTANT per a no perdre les partides dels jugadors en actualitzar el joc:
//  - SAVE_KEY no s'ha de canviar MAI.
//  - Si canvies l'estructura de l'estat, puja SAVE_VERSION i afig una migració a MIGRATIONS.
//  - Els camps nous s'omplin sols amb els valors per defecte de newState().
const SAVE_KEY = "autoescuela-save-v2";
const SAVE_VERSION = 1;

// MIGRATIONS[n] converteix una partida de la versió n a la n+1
const MIGRATIONS = {
  // Partides d'abans de tindre versió: es donen per aprovats els escenaris ja superats
  0: data => ({ ...data, examsPassed: data.examsPassed ?? sceneIndex(data.best || 1) }),
};

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, saveVersion: SAVE_VERSION })); } catch {}
}

// Guarda una còpia del text original abans de tocar res, per si alguna cosa isquera malament
function backupRawSave(raw, reason) {
  try { localStorage.setItem(`${SAVE_KEY}-backup-${reason}-${Date.now()}`, raw); } catch {}
}

function load() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch { return null; }
  if (!raw) return null;

  try {
    let data = JSON.parse(raw);
    if (!data || typeof data !== "object" || !data.player) throw new Error("partida no vàlida");

    let version = data.saveVersion || 0;
    if (version > SAVE_VERSION) {
      // Partida d'una versió més nova del joc: no la toquem
      backupRawSave(raw, "future");
    }
    if (version < SAVE_VERSION) backupRawSave(raw, `v${version}`);
    while (version < SAVE_VERSION) {
      if (MIGRATIONS[version]) data = MIGRATIONS[version](data);
      version++;
    }

    // Es mescla amb l'estat per defecte perquè els camps nous tinguen valor
    const base = newState();
    const merged = {
      ...base, ...data,
      upgrades: { ...base.upgrades, ...data.upgrades },
      expansions: { ...base.expansions, ...data.expansions },
      bestiary: { ...data.bestiary },
      player: { ...base.player, hp: data.player.hp, maxHp: data.player.maxHp, timer: data.player.timer || 0 },
    };
    delete merged.saveVersion;
    // Enemic guardat incomplet o antic: se'n genera un de nou
    const e = merged.enemy;
    if (!e || !isFinite(e.hp) || !isFinite(e.maxHp) || !isFinite(e.atk) || !e.name) merged.enemy = null;
    return merged;
  } catch (err) {
    // No es pot llegir: es guarda una còpia i es comença de zero (sense esborrar l'original)
    console.error("No s'ha pogut carregar la partida", err);
    backupRawSave(raw, "error");
    return null;
  }
}

function reset() {
  if (!confirm("Segur que vols reiniciar la partida? Perdràs els diners, el nivell i les millores. Es desfan les ampliacions i les compres de la botiga, i se't tornen totes les L gastades per a replantejar l'estratègia.")) return;
  const refunded = restartGame();
  $("exam-screen").hidden = true;
  toast("🚗 Nova partida. Primer dia d'autoescola!");
  if (refunded > 0) toast(`↩️ Se t'han tornat ${refunded} ${L_ICON}`, "good");
}

// L gastades en ampliacions d'una millora
function spentL(u) {
  let total = 0;
  for (let k = 0; k < state.expansions[u.id]; k++) {
    total += CONFIG.levelCap.baseLCost + k * CONFIG.levelCap.lCostGrowth;
  }
  return total;
}

// Reinicia la partida: es desfan les ampliacions i les compres de la botiga i es tornen les L gastades.
// Es conserven les L, els tests i la ratxa. Retorna les L tornades.
function restartGame() {
  const shopSpent = Array.from({ length: state.shopPurchases },
    (_, k) => CONFIG.shop.baseLCost + k * CONFIG.shop.lCostGrowth).reduce((a, b) => a + b, 0);
  const refunded = UPGRADES.reduce((sum, u) => sum + spentL(u), 0) + shopSpent;
  state = newState({
    lcoins: state.lcoins + refunded,
    testsDone: state.testsDone,
    perfectStreak: state.perfectStreak,
    examsPassed: state.examsPassed,
    best: state.best,
    bestiary: state.bestiary,
  });
  recomputeStats();
  state.player.hp = state.player.maxHp;
  state.enemy = makeEnemy(1);
  renderUpgrades();
  save();
  return refunded;
}

function closeAfterFail() {
  $("exam-screen").hidden = true;
  toast("🚗 Tornes a començar. Ànim!", "bad");
}

// ===== BUCLE PRINCIPAL =====
let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 1);
  last = now;
  if (!examOpen()) update(dt); // el combat es para mentre hi ha examen
  render();
  requestAnimationFrame(loop);
}

// ===== INICI =====
state = load() || newState();
recomputeStats();
if (!state.enemy) state.enemy = makeEnemy(state.level);

$("btn-reset").addEventListener("click", reset);
// Panell dret plegable: en plegar-lo només queden les icones de les pestanyes
const SIDE_KEY = "autoescuela-side-collapsed";
function setSideCollapsed(collapsed) {
  $("side").classList.toggle("collapsed", collapsed);
  $("btn-side-toggle").textContent = collapsed ? "«" : "»";
  $("btn-side-toggle").title = collapsed ? "Desplegar" : "Plegar";
  try { localStorage.setItem(SIDE_KEY, collapsed ? "1" : "0"); } catch {}
}
$("btn-side-toggle").addEventListener("click", () => setSideCollapsed(!$("side").classList.contains("collapsed")));
try { setSideCollapsed(localStorage.getItem(SIDE_KEY) === "1"); } catch { setSideCollapsed(false); }

for (const id of ["player", "enemy"]) {
  $(id).addEventListener("animationend", ev => {
    if (ev.animationName === "shake") $(id).classList.remove("hit");
  });
}

document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t === tab));
  document.querySelectorAll(".tab-panel").forEach(p => p.hidden = p.id !== "tab-" + tab.dataset.tab);
  if ($("side").classList.contains("collapsed")) setSideCollapsed(false);
  if (tab.dataset.tab === "bestiary") renderBestiary();
}));
// Clic en una entrada del compendi: mostra/amaga la descripció
$("bestiary-list").addEventListener("click", ev => {
  const beast = ev.target.closest(".beast");
  if (!beast) return;
  openBeast = openBeast === beast.dataset.name ? null : beast.dataset.name;
  renderBestiary();
});
$("btn-shop-buy").addEventListener("click", buyCoins);
$("btn-exam-start").addEventListener("click", startExam);
$("btn-exam-retry").addEventListener("click", closeAfterFail);
$("btn-exam-submit").addEventListener("click", submitExam);
$("btn-exam-continue").addEventListener("click", continueAfterExam);

// Guardat periòdic i en tancar/amagar la pestanya
setInterval(save, 5000);
window.addEventListener("pagehide", save);
window.addEventListener("beforeunload", save);
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

$("debug-badge").hidden = !CONFIG.debug.autoPassExams;
renderUpgrades();
renderTestPanel();
renderShop();
if (state.examPending && CONFIG.debug.autoPassExams) skipExam();
if (state.examPending) showExamIntro(); // l'examen pendent no es pot evitar recarregant
else toast("🚗 Benvingut a l'autoescola!");
requestAnimationFrame(loop);
