// ===== HABILITATS DELS CAPS ESPECIALS =====
// Cada cap amb nom (data/scenes.js, camp `mech`) té una habilitat pròpia. Tots els ganxos són opcionals:
//   tick(s, dt)         cada fotograma (temporitzadors)
//   canAttack(s)        false: ara no ataca (p. ex. dormint)
//   dodge(s)            text si esquiva un atac de la granoteta
//   immune(s)           text si ara mateix no rep cap dany
//   attack(s)           { mult, text } de l'atac que va a fer
//   onHitPlayer(e, dmg) després de fer dany a la granoteta
//   spriteClass(s)      classe CSS del sprite (vegeu .sprite.asleep / .sprite.phased a style.css)
// s: estat de l'habilitat en aquest combat (e.mech). Es guarda amb l'enemic i es reinicia si la granoteta perd.
const MARC_WORDS = ["MIERDA!", "LOCO!", "CEBOLLA!", "COÑO!"];

const BOSS_MECHANICS = {
  // Pixel: esquiva felina i migdiades (cicle de 10 s: els 3 últims dorm)
  pixel: {
    tick: (s, dt) => { s.t = (s.t || 0) + dt; },
    asleep: s => (s.t || 0) % 10 >= 7,
    canAttack(s) { return !this.asleep(s); },
    dodge: () => Math.random() < 0.25 && "🐾 Esquiva!",
    spriteClass(s) { return this.asleep(s) ? "asleep" : ""; },
  },
  // Marc: cada atac és una paraula i el quart pega fort
  marc: {
    attack(s) {
      s.n = (s.n || 0) + 1;
      const big = s.n % 4 === 0;
      return { mult: big ? 2.5 : 0.65, text: `💬 ${MARC_WORDS[(s.n - 1) % 4]}`, big };
    },
  },
  // Avió fantasma: fases intangibles (cicle de 6 s: l'últim segon i mig) i es cura amb el dany que fa
  ghost: {
    tick: (s, dt) => { s.t = (s.t || 0) + dt; },
    phased: s => (s.t || 0) % 6 >= 4.5,
    immune(s) { return this.phased(s) && "👻 Intangible"; },
    onHitPlayer(e, dmg) {
      const heal = Math.min(e.maxHp - e.hp, dmg * 0.25);
      if (heal <= 0) return;
      e.hp += heal;
      spawnText($("enemy-avatar"), `+${fmtNum(heal)}`, "heal");
    },
    spriteClass(s) { return this.phased(s) ? "phased" : ""; },
  },
  // Torero feixista: la capa desvia atacs i cada cinqué atac és una estocada
  torero: {
    dodge: () => Math.random() < 0.2 && "🟥 Olé!",
    attack(s) {
      s.n = (s.n || 0) + 1;
      const big = s.n % 5 === 0;
      return big ? { mult: 3, text: "⚔️ Estocada!", big } : { mult: 0.6 };
    },
  },
};

// Cap especial de l'escenari amb aquest nom (es busca pel nom: les partides guardades no en tenen el camp)
const specialBoss = name => SCENES.find(sc => sc.boss && sc.boss.name === name)?.boss;

// Habilitat de l'enemic (o null) i el seu estat per a aquest combat
function bossMech(e) {
  const boss = specialBoss(e.name);
  const mech = boss && BOSS_MECHANICS[boss.mech];
  if (!mech) return null;
  e.mech ||= {};
  return mech;
}

const resetBossMech = e => { if (e.mech) e.mech = {}; };
