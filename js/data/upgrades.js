// ===== MILLORES =====
// Millores planes (+X per nivell). El que creix exponencialment és l'escalat de les L sobre eixe X.
// Nivells barats (costGrowth 1.15) però que donen poc: el que limita és la L, no els diners.
// id: clau de la partida guardada (NO s'ha de canviar mai)
// scene: índex de l'escenari (0 = primer) a partir del qual apareix la millora
// base: efecte per nivell amb escalat al 100%
// scalingPct (opcional): % que multiplica l'efecte cada ampliació amb L (per defecte, CONFIG.levelCap.scalingPct)
// maxLevel (opcional): nivell màxim definitiu; quan les ampliacions amb L hi arriben, ja no es pot ampliar més
// per(e): el que dona un nivell · total(lv, e): el que donen tots els nivells · stat(p): estadística resultant
const capped = (value, max) => value >= max ? `${fmtPct(max)}% (màx.)` : `${fmtPct(value)}%`;

const UPGRADES = [
  { id: "atk",   scene: 0, icon: "📘", name: "Classes teòriques",    base: 3,   baseCost: 5,  costGrowth: 1.15, scalingPct: 25,
    per: e => `+${fmtPct(e)} d'atac`,
    total: (lv, e) => `+${fmtNum(lv * e)} d'atac`,
    stat: p => `Atac total: ${fmtNum(p.atk)}` },
  { id: "hp",    scene: 0, icon: "🦺", name: "Cinturó de seguretat", base: 30,  baseCost: 5,  costGrowth: 1.15,
    per: e => `+${fmtPct(e)} de vida`,
    total: (lv, e) => `+${fmtNum(lv * e)} de vida`,
    stat: p => `Vida màxima: ${fmtNum(p.maxHp)}` },
  { id: "speed", scene: 1, icon: "⚙️", name: "Canvi de marxes",      base: 3,   baseCost: 25, costGrowth: 1.15,
    per: e => `${fmtPct(e)}% més ràpid`,
    total: (lv, e) => `${fmtPct((1 - Math.pow(1 - e / 100, lv)) * 100)}% més ràpid`,
    stat: p => `Ataca cada ${fmtNum(p.attackInterval)} s` },
  { id: "regen", scene: 1, icon: "☕", name: "Café en el descans",   base: 1.2, baseCost: 30, costGrowth: 1.15,
    per: e => `+${fmtPct(e)} vida/s`,
    total: (lv, e) => `+${fmtNum(lv * e)} vida/s`,
    stat: p => `Regeneració: ${fmtNum(p.regen)} vida/s` },

  // Després d'aprovar l'Avinguda València (Violència)
  { id: "crit",  scene: 4, icon: "🎯", name: "Maniobra perfecta",    base: 3,   baseCost: 500,  costGrowth: 1.15,
    per: e => `+${fmtPct(e)}% de crític`,
    total: (lv, e) => `${capped(lv * e, CONFIG.combat.maxCritChance)} de crític`,
    stat: p => `Crític: ${fmtPct(p.critChance * 100)}% · dany ×${CONFIG.combat.critMultiplier}` },
  { id: "money", scene: 4, icon: "💳", name: "Carnet jove",          base: 10,  baseCost: 600,  costGrowth: 1.15,
    per: e => `+${fmtPct(e)}% de diners`,
    total: (lv, e) => `+${fmtPct(lv * e)}% de diners`,
    stat: p => `Recompenses i botiga ×${fmtNum(1 + p.moneyBonus)}` },

  // A partir dels Carreronets de Sogorb
  { id: "parry", scene: 5, icon: "🛡️", name: "Conducció defensiva",  base: 3,   baseCost: 2000, costGrowth: 1.15,
    maxLevel: 20, scalingPct: 0, // 20 nivells × 3% = 60%: les ampliacions només pugen el nivell màxim
    per: e => `+${fmtPct(e)}% de parada`,
    total: (lv, e) => `${capped(lv * e, CONFIG.combat.maxParryChance)} de parada`,
    stat: p => `Para i torna el ${fmtPct(p.parryChance * 100)}% dels atacs` },
  { id: "thorns", scene: 5, icon: "🌵", name: "Para-xocs de punxes", base: 5,   baseCost: 1800, costGrowth: 1.15,
    per: e => `+${fmtPct(e)}% de dany retornat`,
    total: (lv, e) => `${fmtPct(lv * e)}% de dany retornat`,
    stat: p => `Retorna el ${fmtPct(p.thorns * 100)}% del dany rebut` },
];
