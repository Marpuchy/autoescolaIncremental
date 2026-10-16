#!/usr/bin/env node
// ===== BOT DE BALANÇ =====
// Juga amb el codi real del joc (sense navegador) i compta quants tests necessita per a acabar cada escenari.
// Fa tests quan s'encalla (perd dues vegades seguides o el combat dura més de 3 minuts) i gasta diners i L amb cap.
//
// Ús (des de l'arrel del projecte):
//   node tools/bot.js                         16 partides per perfil fins a l'últim escenari, taula de tests
//   node tools/bot.js --runs 8 --scenes 12    menys partides / fins a l'escenari 12
//   node tools/bot.js --profiles mitja        només el jugador mitjà (més ràpid)
//   node tools/bot.js --hp "[1,1,1.2,...]"    prova uns altres CONFIG.enemy.sceneHpMult sense tocar el codi
//   node tools/bot.js --code "ITEMS.cape.stats.dodgePct = 25"   qualsevol canvi de prova (JS) abans de jugar
//   node tools/bot.js --json                  eixida en JSON: { perfil: { escenari: tests acumulats } }
//   node tools/bot.js --evo no                sense comprar evolucions dels objectes (per comparar)
//
// Els scripts es carreguen en l'ordre d'index.html, menys els que només pinten (vegeu SKIP). Si la lògica de combat
// crida una funció nova que toca el DOM, afig-la a STUBS.
const vm = require('vm'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP = ['js/fx.js', 'js/render.js', 'js/dev.js', 'js/main.js', 'js/exam.js'];
const STUBS = `var toast = () => 0, save = () => 0, renderUpgrades = () => 0, renderTestPanel = () => 0, renderShop = () => 0,
  renderBestiary = () => 0, spawnText = () => 0, attackFx = () => 0, allyAttackFx = () => 0, enemyAllyAttackFx = () => 0,
  refreshInventory = () => 0, renderInventory = () => 0, showExamIntro = () => 0, refreshEvoButtons = () => 0;`;

// Probabilitat de 0, 1, 2 i 3 o més errades en cada test
const PROFILES = {
  mitja: [0.25, 0.40, 0.25, 0.10],
  bo:    [0.60, 0.30, 0.10, 0.00],
};

const args = parseArgs(process.argv.slice(2));
const RUNS = Number(args.runs || 16);
const profiles = (args.profiles || Object.keys(PROFILES).join(',')).split(',');

const scripts = [...fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"/g)]
  .map(m => m[1]).filter(src => !SKIP.includes(src));
const override = (args.hp ? `;CONFIG.enemy.sceneHpMult = ${args.hp};` : '') + (args.code ? `;${args.code};` : '');
const code = scripts.map(src => fs.readFileSync(path.join(ROOT, src), 'utf8')).join('\n;\n') + override;

function newContext(seed) {
  // PRNG amb llavor: les comparacions entre versions són justes (mateixes tirades)
  let s = seed * 2654435761 >>> 0;
  const rand = () => {
    s = (s + 0x6D2B79F5) >>> 0; let t = s;
    t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const el = () => ({ hidden: true, style: { setProperty() {} }, classList: { add() {}, remove() {}, toggle() {} } });
  const ctx = { console, Math: Object.assign(Object.create(Math), { random: rand }), Image: function () {},
    localStorage: { getItem: () => null, setItem() {} }, location: { protocol: 'http:', hostname: 'bot' },
    document: { getElementById: el, querySelector: el, querySelectorAll: () => [] } };
  vm.createContext(ctx);
  vm.runInContext(code + STUBS + `
    CONFIG.debug.autoPassExams = true;
    state = newState(); recomputeStats(); grantStartingLevels(); state.player.hp = state.player.maxHp; state.enemy = makeEnemy(1);`, ctx);
  return ctx;
}

function play(profile, seed, maxScene) {
  const ctx = newContext(seed);
  return vm.runInContext(`(() => {
    const P = ${JSON.stringify(PROFILES[profile])};
    const PRIO = ["atk", "hp", "speed", "regen", "crit", "double", "petfood", "parry", "thorns", "money"];
    const maxScene = ${maxScene} || SCENES.length;
    const testsAt = {}; // tests acumulats en acabar cada escenari
    let losses = 0, lastLevel = 1, fightTime = 0, fightEnemy = null, lost = false, steps = 0;

    // Evolucions dels objectes equipats (branca a l'atzar la primera vegada; sense --evo no n'hi ha)
    const EVO = ${args.evo === undefined ? 'true' : String(args.evo !== 'no')};
    const equippedEvos = () => EVO && typeof EVOLUTIONS !== "undefined"
      ? Object.values(state.inventory.equipped).filter(id => EVOLUTIONS[id]) : [];
    const buyEvos = () => {
      for (const id of equippedEvos()) {
        const n = evoNext(id);
        if (n.status === "buy" && state.money >= n.cost && state.lcoins >= n.lcost) {
          const keys = Object.keys(EVOLUTIONS[id].branches);
          buyEvolution(id, evoState(id).branch || keys[Math.floor(Math.random() * keys.length)]);
        }
      }
    };
    // Diners: el nivell més barat disponible (en empat, segons PRIO)
    const spendMoney = () => {
      buyEvos();
      for (;;) {
        const opts = visibleUpgrades().filter(u => !isMaxed(u) && upgradeCost(u) <= state.money)
          .sort((a, b) => upgradeCost(a) - upgradeCost(b) || PRIO.indexOf(a.id) - PRIO.indexOf(b.id));
        if (!opts.length) return;
        buyUpgrade(opts[0].id);
      }
    };
    // L: primer amplia les millores al límit; si en queden per comprar però no hi ha diners, botiga
    const spendL = () => {
      for (;;) {
        const exp = visibleUpgrades().filter(u => isMaxed(u) && canExpand(u) && expandCost(u) <= state.lcoins)
          .sort((a, b) => expandCost(a) - expandCost(b) || PRIO.indexOf(a.id) - PRIO.indexOf(b.id));
        if (exp.length) { expandUpgrade(exp[0].id); spendMoney(); continue; }
        if (visibleUpgrades().some(u => !isMaxed(u)) && state.lcoins >= shopCost()) { buyCoins(); spendMoney(); continue; }
        return;
      }
    };
    const doTest = () => {
      const r = Math.random(); let f = 0, acc = P[0];
      while (r > acc && f < 3) { f++; acc += P[f]; }
      registerTest(f);
      spendL();
    };

    const realLost = onPlayerDefeated;
    onPlayerDefeated = () => { lost = true; realLost(); };
    while (state.level <= maxScene * CONFIG.levelsPerScene && state.testsDone < 3000 && ++steps < 5e7) {
      lost = false;
      update(0.1);
      // Empat (ni mor ni mata, p. ex. amb robatori de vida): un jugador real faria tests
      if (state.enemy !== fightEnemy) { fightEnemy = state.enemy; fightTime = 0; }
      fightTime += 0.1;
      if (fightTime > 180) { fightTime = 0; spendMoney(); doTest(); state.enemy.hp = state.enemy.maxHp; state.enemy.timer = 0; }
      if (state.level !== lastLevel) {
        if (sceneIndex(state.level) !== sceneIndex(lastLevel)) testsAt[sceneIndex(lastLevel) + 1] = state.testsDone;
        lastLevel = state.level; losses = 0; spendMoney();
      }
      if (lost) {
        fightTime = 0;
        losses++;
        spendMoney();
        if (losses >= 2) { doTest(); losses = 0; }
      }
    }
    return testsAt;
  })()`, ctx);
}

// Mitjana de RUNS partides per perfil: { perfil: { escenari: tests acumulats } }
function simulate(maxScene) {
  const out = {};
  for (const profile of profiles) {
    const acc = {};
    for (let r = 1; r <= RUNS; r++) {
      const t = play(profile, r, maxScene);
      for (const k in t) (acc[k] ||= []).push(t[k]);
    }
    out[profile] = Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, Math.round(v.reduce((a, b) => a + b, 0) / v.length)]));
  }
  return out;
}

function parseArgs(list) {
  const out = {};
  for (let i = 0; i < list.length; i++) {
    if (!list[i].startsWith('--')) continue;
    const key = list[i].slice(2);
    out[key] = list[i + 1] && !list[i + 1].startsWith('--') ? list[++i] : true;
  }
  return out;
}

if (require.main === module) {
  const result = simulate(Number(args.scenes || 0));
  if (args.json) { console.log(JSON.stringify(result)); process.exit(0); }
  const names = vm.runInContext('SCENES.map(s => s.name + (s.boss ? " · " + s.boss.name : ""))', newContext(1));
  console.log('Escenari'.padEnd(46) + profiles.map(p => `${p} (tests / acumulat)`.padEnd(26)).join(''));
  const last = Math.max(...profiles.flatMap(p => Object.keys(result[p]).map(Number)));
  for (let k = 1; k <= last; k++) {
    const row = profiles.map(p => {
      const t = result[p];
      return t[k] === undefined ? ''.padEnd(26) : `${String(t[k] - (t[k - 1] || 0)).padStart(5)} / ${String(t[k]).padEnd(16)}`;
    });
    console.log(`${String(k).padStart(2)}. ${(names[k - 1] || '').slice(0, 41).padEnd(42)}${row.join('')}`);
  }
}

module.exports = { simulate, parseArgs };
