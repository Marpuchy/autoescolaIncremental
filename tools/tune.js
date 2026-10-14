#!/usr/bin/env node
// ===== AJUSTADOR DE VIDA PER ESCENARI =====
// Busca (per bisecció, amb el bot) el CONFIG.enemy.sceneHpMult de cada escenari perquè el jugador mitjà hi faça
// els tests que li demanes. Els escenaris s'ajusten en ordre: cada un depén de com arriba la granoteta dels anteriors.
//
// Ús (des de l'arrel):
//   node tools/tune.js --targets '{"13":14,"14":26}'            escenari (1 = primer) -> tests objectiu
//   node tools/tune.js --targets '{"21":20}' --runs 8 --steps 7  més partides = menys soroll, però més lent
// Al final imprimix l'array per a copiar a CONFIG.enemy.sceneHpMult (js/config.js) i recomana verificar-lo amb
// node tools/bot.js. Pot tardar molt: deixa'l en segon pla.
// Compte: amb mecàniques "tot o res" (curacions sense límit, empats) el resultat salta molt; és senyal de redissenyar.
const vm = require('vm'), fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const { parseArgs } = require('./bot.js');

const ROOT = path.join(__dirname, '..');
const args = parseArgs(process.argv.slice(2));
if (!args.targets) { console.error('Falta --targets \'{"escenari": tests}\''); process.exit(1); }
const targets = JSON.parse(args.targets);
const RUNS = String(args.runs || 8);
const STEPS = Number(args.steps || 7);

// Punt de partida: els valors actuals de CONFIG, allargats fins a l'últim escenari
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8') + ';this.CONFIG = CONFIG;', ctx);
const mults = [...(ctx.CONFIG.enemy.sceneHpMult || [])];
const maxScene = Math.max(...Object.keys(targets).map(Number));
while (mults.length < maxScene) mults.push(mults[mults.length - 1] ?? 1);

const sceneTests = scene => {
  const out = JSON.parse(execFileSync('node', [path.join(__dirname, 'bot.js'), '--json', '--profiles', 'mitja',
    '--runs', RUNS, '--scenes', String(scene), '--hp', JSON.stringify(mults)], { cwd: ROOT, encoding: 'utf8' })).mitja;
  return out[scene] - (out[scene - 1] || 0);
};

for (const scene of Object.keys(targets).map(Number).sort((a, b) => a - b)) {
  let lo = 0.2, hi = 5;
  for (let i = 0; i < STEPS; i++) {
    mults[scene - 1] = (lo + hi) / 2;
    if (sceneTests(scene) < targets[scene]) lo = mults[scene - 1]; else hi = mults[scene - 1];
  }
  mults[scene - 1] = Math.round((lo + hi) / 2 * 100) / 100;
  console.log(`escenari ${scene}: ×${mults[scene - 1]} → ${sceneTests(scene)} tests (objectiu ${targets[scene]})`);
}
console.log('\nsceneHpMult:', JSON.stringify(mults));
