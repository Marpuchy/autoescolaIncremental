// ===== ESTUDI: DADES =====
// Tower defense gacha d'estudi. Tot el balanç és ací. Unitats del mapa: 1600 × 900 (el camí i els buits en js/td/data.js,
// mon per mon). Les criatures es dibuixen a js/td/art.js.

const TD_SUBJECTS = {
  // Camps d'estudi: cada camp ajunta diverses assignatures (pergamins, garantia i criatures compartits),
  // perquè no cal estudiar tant per a omplir cada gacha. Les claus (alg, prg) són de la partida: no canviar-les.
  alg: { name: "Matemàtiques", short: "Matemàtiques", icon: "➕", mode: "informatic",
         classes: ["Àlgebra Lineal", "Càlcul", "Matemàtica Discreta", "Estadística"] },
  prg: { name: "Informàtica", short: "Informàtica", icon: "⌨️", mode: "informatic",
         classes: ["Programació I", "Programació II", "Eines de Programació", "Fonaments de Computadors", "Electrònica", "Dret de les TIC"] },
};

// Raresa: probabilitat de la invocació (el mític no ix mai: només amb un 8 o més a l'examen final)
const TD_RARITIES = {
  comu:       { name: "Comú",       chance: 0.66,  color: "#b8c0cc", value: 1 },
  rar:        { name: "Rar",        chance: 0.27,  color: "#4aa8ff", value: 3 },
  epic:       { name: "Èpic",       chance: 0.06,  color: "#b48cff", value: 10 },
  llegendari: { name: "Llegendari", chance: 0.01,  color: "#ffc23f", value: 40 },
  mitic:      { name: "Mític",      chance: 0,     color: "#ff5ab0", value: 100 },
};
const TD_PITY = { epic: 30, llegendari: 90 }; // garantia: èpic com a molt a la tirada 30 i llegendari a la 90 (per camp)
// Còpies totals per a cada estrela (★1 en traure-la; ★5 amb 11 còpies). Les que sobren es tornen saber.
const TD_STAR_COPIES = [1, 2, 4, 7, 11];

// Criatures. dmg: dany per atac · rate: atacs per segon · range: abast · cost: maná per a posar-la
// role: què fa a més del dany (vegeu js/td/battle.js). Tots els defensors fan dany.
// Criatures retirades (menys varietat, més qualitat): les còpies que en tenies passen a la de la mateixa raresa
const TD_MERGED = { escalar: "sumador", transposada: "vector", comentari: "puntcoma", bucle: "ifelse" };
const TD_DEFENDERS = {
  // ---- Matemàtiques
  sumador:     { subj: "alg", rar: "comu", name: "Sumador", dmg: 6, rate: 1.6, range: 230, cost: 30, role: "single", alt: true,
                 desc: "Llança alternativament els dos + menuts que té de braços." },
  vector:      { subj: "alg", rar: "rar", name: "Vector", dmg: 19, rate: 0.45, range: 430, cost: 55, role: "pierce", aim: true,
                 desc: "La llança travessa tots els enemics que troba en línia recta." },
  matriu:      { subj: "alg", rar: "epic", name: "Matriu", dmg: 9, rate: 0.9, range: 240, cost: 85, role: "aoe", aoe: 70,
                 special: { every: 5, type: "freeze", radius: 120, dur: 1.4 },
                 desc: "Dany en zona. Cada 5 atacs, la seua quadrícula congela la zona 1,4 s." },
  determinant: { subj: "alg", rar: "llegendari", name: "Determinant |A|", dmg: 40, rate: 0.5, range: 300, cost: 120, role: "execute", execute: 0.15,
                 desc: "Colps molt forts. Si a l'enemic li queda menys d'un 15 % de vida, det = 0: l'elimina." },
  lambda:      { subj: "alg", rar: "mitic", name: "Diagonalitzador λ", dmg: 30, rate: 1.0, range: 340, cost: 150, role: "single",
                 special: { every: 6, type: "align", dur: 2, vuln: 0.5, vulnDur: 5 },
                 desc: "Cada 6 atacs alinea els enemics a l'abast: els para 2 s i reben un 50 % més de dany durant 5 s." },
  // ---- Informàtica
  puntcoma:    { subj: "prg", rar: "comu", name: "Punt i coma", dmg: 4, rate: 2.4, range: 200, cost: 25, role: "single", alt: true,
                 desc: "Barat i rapidíssim: escup punts sense parar." },
  ifelse:      { subj: "prg", rar: "rar", name: "If / else", dmg: 11, rate: 1.0, range: 260, cost: 55, role: "smart", alt: true,
                 desc: "Si n'hi ha un de fort, li dispara a ell; si no, al més ràpid." },
  recursio:    { subj: "prg", rar: "epic", name: "Recursió", dmg: 12, rate: 0.7, range: 260, cost: 85, role: "split", splits: 2, depth: 2,
                 desc: "El projectil es dividix en dos en impactar, i així fins a dues vegades." },
  compilador:  { subj: "prg", rar: "llegendari", name: "Compilador", dmg: 28, rate: 0.6, range: 280, cost: 120, role: "aoe", aoe: 80,
                 special: { every: 6, type: "convert", dur: 4 },
                 desc: "Dany en zona. Cada 6 atacs compila l'enemic més feble i el torna aliat 4 s." },
  stack:       { subj: "prg", rar: "mitic", name: "Stack Overflow", dmg: 20, rate: 1.2, range: 300, cost: 150, role: "stacks", stacks: 10, blast: 12,
                 desc: "Cada atac apila. Amb 10 piles, el desbordament explota per tot el mapa (12 × el dany)." },
};

// Distraccions (enemics). lore: la descripció del bestiari (amb gràcia, com al compendi de l'autoescola); desc: què fa.
// hp a l'onada 1; mana i saber quan moren; lives: vida que lleven al cristall si hi arriben.
const TD_ENEMIES = {
  notificacio:    { name: "Notificació", hp: 22, speed: 95, lives: 1, mana: 4, saber: 1, size: 70,
                    lore: "«Només un segon, que m'ha escrit algú». Tres quarts d'hora després encara estàs mirant vídeos de gats. Mai ve sola: on n'hi ha una, n'arriben deu.",
                    desc: "Ràpida i feble. Arriben en grup." },
  procrastinacio: { name: "Procrastinació", hp: 110, speed: 38, lives: 2, mana: 8, saber: 3, size: 96,
                    lore: "Té tot el temps del món i el gasta tot. Es mou a poc a poc perquè ja ho farà demà, i no hi ha qui la tombe: és d'allò més resistent.",
                    desc: "Lenta però amb molta vida. Sempre ho deixa per a demà." },
  son:            { name: "Son", hp: 50, speed: 55, lives: 1, mana: 6, saber: 2, size: 84, sleep: { every: 6, radius: 170, dur: 2 },
                    lore: "Apareix just quan obris els apunts. Un badall seu i les teues criatures fan una becadeta de cinc minuts… que mai són cinc.",
                    desc: "Cada 6 s adorm la torre més pròxima durant 2 s." },
  scroll:         { name: "Scroll infinit", hp: 40, speed: 60, lives: 1, mana: 5, saber: 2, size: 78, splitInto: "scrollet",
                    lore: "Sempre hi ha un vídeo més. Quan creus que l'has acabat, se'n parteix en dos i continua baixant per la pantalla.",
                    desc: "En morir es dividix en dos scrolls menuts." },
  scrollet:       { name: "Scroll menut", hp: 15, speed: 85, lives: 1, mana: 2, saber: 1, size: 52, art: "scroll", hidden: true },
  meme:           { name: "Meme", hp: 45, speed: 70, lives: 1, mana: 6, saber: 2, size: 80, stealth: 0.4,
                    lore: "No el veus vindre: s'amaga entre les fotos del grup fins que és massa tard. Quan l'entens, ja t'ha robat mitja vesprada de riure.",
                    desc: "Invisible (no es pot atacar) durant el primer 40 % del camí." },
  series:         { name: "Marató de sèries", hp: 900, speed: 30, lives: 10, mana: 60, saber: 40, size: 150, boss: true, heal: { radius: 160, hps: 10 },
                    lore: "«L'últim capítol i a dormir». Porta les crispetes i la temporada sencera. Cura les distraccions que té a prop perquè sempre ve un capítol més.",
                    desc: "Cura 10 de vida per segon als enemics que té a prop." },
  diumenge:       { name: "Diumenge a la nit", hp: 2200, speed: 28, lives: 20, mana: 120, saber: 100, size: 160, boss: true, rush: { every: 4, mult: 1.35, dur: 2 },
                    lore: "La nit que tot ho accelera: els deures que no has fet, l'examen de dilluns, l'agenda en blanc. Quan arriba, ja vas tard.",
                    desc: "Cada 4 s accelera tots els enemics un 35 % durant 2 s." },
};
const TD_WAVE_HP = 0.2; // cada onada, +20 % de vida als enemics

// Artefactes: els donen els caps (la primera vegada i les següents, que els pugen de nivell, fins a 5).
// L'estudiant en porta 3 com a molt. value: efecte a nivell 1 (cada nivell +25 %).
const TD_ARTIFACTS = {
  auriculars: { name: "Auriculars antisoroll", icon: "🎧", slot: "cap", boss: "series", stat: "range", value: 0.08,
                desc: lvl => `El Son no adorm les teues torres. +${Math.round(0.08 * tdArtMult(lvl) * 100)} % d'abast.` },
  cafe:       { name: "Cafè arcà", icon: "☕", slot: "ma", boss: "diumenge", stat: "rate", value: 0.15,
                desc: lvl => `+${Math.round(0.15 * tdArtMult(lvl) * 100)} % de velocitat d'atac.` },
};
const tdArtMult = lvl => 1 + 0.25 * (lvl - 1);
const TD_ARTIFACT_SLOTS = 3;
// Espais de l'estudiant (com a l'autoescola): cada artefacte va en el seu; un per espai.
const TD_EQUIP_SLOTS = [
  { id: "cap",     icon: "🎩", name: "Cap" },
  { id: "ma",      icon: "✋", name: "Mà" },
  { id: "esquena", icon: "🎒", name: "Esquena" },
];
const tdArtSlot = id => TD_ARTIFACTS[id]?.slot;

// Millores del cristall (es paguen amb saber)
const TD_UPGRADES = {
  // més nivells que abans (fins a 30) però creixement més suau; la vida del cristall és la més cara
  vida:  { name: "Cristall resistent", icon: "💎", desc: "+3 de vida del cristall", per: lvl => `+${3 * lvl} de vida`, base: 110, growth: 1.38, max: 30 },
  mana:  { name: "Concentració", icon: "🔮", desc: "+20 de maná inicial", per: lvl => `+${20 * lvl} de maná`, base: 50, growth: 1.3, max: 30 },
  saber: { name: "Curiositat", icon: "✨", desc: "+10 % de saber guanyat", per: lvl => `+${10 * lvl} % de saber`, base: 80, growth: 1.33, max: 30 },
};

// Pujar de nivell una criatura (saber). Nivell màxim 30.
const TD_LEVEL_MAX = 25;              // amb ★5
const TD_LEVEL_PER_STAR = 5;          // nivell màxim = 5 × estreles (★1 → 5, ★2 → 10…)
const TD_ABILITY_LEVELS = [10, 20];   // nivells que també milloren l'habilitat especial (a més de ★3 i ★5)
const tdLevelCost = (rar, lvl) => Math.round(15 * TD_RARITIES[rar].value ** 0.5 * 1.28 ** (lvl - 1));

// Què has estudiat → pergamins d'invocació (del camp de l'assignatura). Límit diari per camp (sense comptar els exàmens).
const TD_ACTIVITIES = [
  // short i color: el llom del llibre a la prestatgeria; h: alçada del llibre (%)
  { id: "classe",   icon: "🏫", name: "Anar a classe",               short: "Classe",    color: "#3a6ea8", h: 78, rolls: 2 },
  { id: "resum",    icon: "📝", name: "Resum (1 pàgina)",            short: "Resum",     color: "#a8463a", h: 92, rolls: 3 },
  { id: "exercici", icon: "✏️", name: "Full d'exercicis",           short: "Exercicis", color: "#3a8a5a", h: 84, rolls: 2 },
  { id: "llarg",    icon: "📐", name: "Problemes llargs o difícils", short: "Problemes", color: "#6a4aa8", h: 100, rolls: 3 },
  { id: "esquema",  icon: "🗂️", name: "Esquema o apunts nets",       short: "Esquema",   color: "#b0862a", h: 74, rolls: 2 },
  { id: "repas",    icon: "🃏", name: "Repàs amb test o targetes",   short: "Repàs",     color: "#2a8a8e", h: 68, rolls: 1 },
  { id: "projecte", icon: "🛠️", name: "Fer un projecte (una sessió)", short: "Projecte", color: "#8e3a6e", h: 96, rolls: 4 },
];
const TD_DAILY_CAP = 15;
// Examen parcial o final: 5 → 3 pergamins … 10 → 10. Suspés: 1 (de consolació).
const tdExamRolls = nota => nota < 5 ? 1 : Math.round(3 + (nota - 5) * 1.4);
const TD_MYTHIC_GRADE = 8;

// Combat
const TD_BATTLE = {
  lives: 20, startMana: 100, upgradeCost: [0.8, 1.2], upgradeMult: [1, 1.5, 2.1], sellBack: 0.6,
  wavePause: 5, waveBonusSaber: 4, worldBonusSaber: 120, projSpeed: 950,
};

// Mons. path: punts del camí (del començament al cristall). slots: buits on es posen les criatures.
const TD_WORLDS = [
  {
    id: 1, name: "Biblioteca Arcana", layout: "Serp",
    path: [[-60, 150], [1300, 150], [1300, 430], [300, 430], [300, 710], [1460, 710]],
    slots: [[420, 290], [720, 290], [1020, 290], [1450, 290], [160, 570], [600, 570], [900, 570], [1200, 570], [760, 840], [1120, 840]],
    crystal: [1500, 700], student: [110, 790],
    // onades: [enemic, quantitat, interval en s] (en ordre)
    waves: [
      [["notificacio", 8, 0.9]],
      [["notificacio", 10, 0.8], ["procrastinacio", 2, 2.2]],
      [["notificacio", 6, 0.8], ["son", 4, 1.6]],
      [["scroll", 6, 1.3], ["notificacio", 6, 0.7]],
      [["notificacio", 6, 0.8], ["series", 1, 1], ["procrastinacio", 3, 2]],
      [["meme", 8, 1.1], ["son", 3, 1.6]],
      [["procrastinacio", 5, 1.8], ["scroll", 6, 1], ["notificacio", 10, 0.5]],
      [["son", 6, 1.2], ["meme", 6, 1], ["procrastinacio", 4, 1.6]],
      [["scroll", 10, 0.8], ["meme", 8, 0.8], ["procrastinacio", 6, 1.4]],
      [["notificacio", 12, 0.5], ["diumenge", 1, 1], ["son", 5, 1.4], ["procrastinacio", 5, 1.5]],
    ],
  },
  { id: 2, name: "Laboratori de Circuits", layout: "Bifurcació", soon: true },
  { id: 3, name: "Torre del Compilador", layout: "Espiral", soon: true },
  { id: 4, name: "El Núvol", layout: "Doble entrada", soon: true },
  { id: 5, name: "Servidor Abissal", layout: "Doble entrada", soon: true },
];
