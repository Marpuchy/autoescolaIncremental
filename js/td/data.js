// ===== ESTUDI: DADES =====
// Tower defense gacha d'estudi. Tot el balanç és ací. Unitats del mapa: 1600 × 900 (el camí i els buits en js/td/data.js,
// mon per mon). Les criatures es dibuixen a js/td/art.js.

const TD_SUBJECTS = {
  // Camps d'estudi: cada camp ajunta diverses assignatures (pergamins, garantia i criatures compartits),
  // perquè no cal estudiar tant per a omplir cada gacha. Les claus (alg, prg) són de la partida: no canviar-les.
  // Informàtica (1r del grau a l'UJI, pla EI26xx), per zones: Matemàtiques, Programació i Màquina. Pròxima zona: Lògica
  // i dades (Discreta i Estadística); fins que tinga criatures, les seues assignatures continuen a Matemàtiques.
  alg: { name: "Matemàtiques", short: "Matemàtiques", icon: "➕", mode: "informatic",
         classes: ["Àlgebra Lineal", "Càlcul", "Matemàtica Discreta", "Estadística"] },
  prg: { name: "Programació", short: "Programació", icon: "⌨️", mode: "informatic",
         classes: ["Programació I", "Programació II", "Eines de Programació", "Dret de les TIC"] },
  maq: { name: "Màquina", short: "Màquina", icon: "⚡", mode: "informatic",
         classes: ["Electrònica", "Fonaments de Computadors"] },
  // Forestal (2n del cicle superior de Gestió Forestal i del Medi Natural). Llista provisional: falta que Alba la confirme.
  // Camps per zones temàtiques. Pròxima zona: Fauna (cinegètica i pesca); fins que tinga criatures, les seues
  // assignatures continuen al Quadern de camp.
  mnt: { name: "Gestió de monts", short: "Monts", icon: "🌲", mode: "forestal",
         classes: ["Gestió de monts", "Defensa contra incendis forestals", "Gestió de la conservació del medi natural"] },
  pin: { name: "Quadern de camp", short: "Quadern", icon: "📒", mode: "forestal",
         classes: ["Projecte intermodular", "Gestió cinegètica", "Gestió de la pesca continental", "Itinerari personal per a l'ocupabilitat II",
                   "Digitalització aplicada al sistema productiu", "Sostenibilitat aplicada al sistema productiu", "Mòdul optatiu"] },
};
const tdFieldsOf = mode => Object.keys(TD_SUBJECTS).filter(s => TD_SUBJECTS[s].mode === mode);
// Temps que tarda a tornar a créixer la peça que llança una criatura (regrow a la seua fitxa; per defecte 0,7 s)
const tdRegrowTime = id => TD_DEFENDERS[id].regrow || 0.7;
const tdModeOf = id => TD_SUBJECTS[TD_DEFENDERS[id].subj].mode;

// Punts d'estrella (espores al bosc): els dona una tirada quan el camp no té criatura d'aquella raresa (no tots tenen
// les cinc) i, a vegades (TD_POINT_SWAP), una tirada per davall de llegendari en lloc de la còpia. Quants: TD_POINT_GAIN.
// Amb punts es compren còpies de qualsevol criatura de la carrera (menys la mítica): valor de la raresa × TD_POINT_COPY.
const TD_POINT_GAIN = { comu: 1, rar: 1, epic: 3 };
const TD_POINT_SWAP = 0.15;
const TD_POINTS = {
  informatic: { name: "punts d'estrella", one: "punt d'estrella", icon: "⭐" },
  forestal:   { name: "espores", one: "espora", icon: "🍄" },
};
const TD_POINT_COPY = 5;

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
// Pujar d'estrella costa saber (a més de les còpies): base × √(valor de la raresa) × multiplicador de l'estrella
const TD_STAR_COST = [1, 3, 8, 20];
const TD_STAR_COPIES = [1, 2, 4, 7, 11];

// Criatures. dmg: dany per atac · rate: atacs per segon · range: abast · cost: maná per a posar-la
// role: què fa a més del dany (vegeu js/td/battle.js). Tots els defensors fan dany.
// Criatures retirades (menys varietat, més qualitat): les còpies que en tenies passen a la de la mateixa raresa
const TD_MERGED = { escalar: "sumador", transposada: "vector", comentari: "puntcoma", bucle: "ifelse", matriu: "vector", recursio: "ifelse" };
const TD_DEFENDERS = {
  // ---- Matemàtiques
  sumador:     { subj: "alg", rar: "comu", name: "Sumador", dmg: 6, rate: 1.6, range: 230, cost: 30, role: "single", alt: true,
                 desc: "Llança alternativament els dos + menuts que té de braços." },
  vector:      { subj: "alg", rar: "epic", name: "Vector", dmg: 30, rate: 0.5, range: 430, cost: 80, role: "pierce", aim: true,
                 desc: "La llança travessa tots els enemics que troba en línia recta." },
  determinant: { subj: "alg", rar: "llegendari", name: "Determinant |A|", dmg: 40, rate: 0.5, range: 300, cost: 120, role: "execute", execute: 0.15, alt: true, regrow: 2.2,
                 desc: "Colps molt forts, un braç cada vegada. Si a l'enemic li queda menys d'un 15 % de vida, det = 0: l'elimina." },
  lambda:      { subj: "alg", rar: "mitic", name: "Diagonalitzador λ", dmg: 30, rate: 1.0, range: 340, cost: 150, role: "single",
                 special: { every: 6, type: "align", dur: 2, vuln: 0.5, vulnDur: 5 },
                 desc: "Cada 6 atacs alinea els enemics a l'abast: els para 2 s i reben un 50 % més de dany durant 5 s." },
  // ---- Informàtica
  puntcoma:    { subj: "prg", rar: "comu", name: "Punt i coma", dmg: 4, rate: 2.4, range: 200, cost: 25, role: "single", alt: true,
                 desc: "Barat i rapidíssim: escup punts sense parar." },
  ifelse:      { subj: "prg", rar: "rar", name: "If / else", dmg: 11, rate: 1.0, range: 260, cost: 55, role: "smart", alt: true,
                 desc: "Si n'hi ha un de fort, li dispara a ell; si no, al més ràpid." },
  compilador:  { subj: "prg", rar: "llegendari", name: "Compilador", dmg: 28, rate: 0.6, range: 280, cost: 120, role: "aoe", aoe: 80,
                 special: { every: 6, type: "convert", dur: 4 },
                 desc: "Dany en zona. Cada 6 atacs compila l'enemic més feble i el torna aliat 4 s." },
  stack:       { subj: "prg", rar: "mitic", name: "Stack Overflow", dmg: 20, rate: 1.2, range: 300, cost: 150, role: "stacks", stacks: 10, blast: 12,
                 desc: "Cada atac apila. Amb 10 piles, el desbordament explota per tot el mapa (12 × el dany)." },
  // ---- Màquina (Informàtica: electrònica i fonaments de computadors)
  rellotge:    { subj: "maq", rar: "epic", name: "Rellotge de CPU", dmg: 10, rate: 0.8, range: 210, cost: 80, role: "clock", regrow: 0.8, every: 4,
                 desc: "Un cristall de quars que marca el compàs. A cada tic, l'ona quadrada que du a la cara baixa al camí i recorre tot el tram al seu abast, i colpeja tot el que hi ha. Cada 4 tics, un tic doble (2 × el dany)." },
  tesla:       { subj: "maq", rar: "llegendari", name: "Bobina de Tesla", dmg: 18, rate: 0.6, range: 300, cost: 120, role: "chain", projSpeed: 1.6,
                 chain: { jumps: 4, falloff: 0.75, radius: 210 },
                 desc: "Llança la bola de càrrega que té dalt: en tocar, el raig salta d'una distracció a la més pròxima fins a 4 vegades, i perd força a cada salt." },
  resistencia: { subj: "maq", rar: "rar", name: "Resistència", dmg: 9, rate: 1.2, range: 250, cost: 55, role: "slow", alt: true, regrow: 0.9,
                 slow: 0.35, slowDur: 2, band: { l: "#ff5a4a", r: "#c97a3a" },
                 desc: "Llança les bandes de colors del cos, una i una: cada banda s'estreny al voltant de la distracció i la frena (s'oposa al pas, com al corrent) mentre la porta posada." },
  condensador: { subj: "maq", rar: "mitic", name: "Condensador", dmg: 14, rate: 0.25, range: 300, cost: 150, role: "capacitor", projSpeed: 1.3,
                 charge: { blast: 11, radius: 120, stun: 0.8 },
                 desc: "No dispara mentre es carrega: entre les plaques puja la càrrega i l'electró del mig creix. Quan està ple, el llança d'un colp, com un canó, i esclata en zona (11 × el dany) amb un llamp a cada distracció del voltant, que es queden parades un moment." },
  // ---- Gestió de monts (Forestal)
  pi:          { subj: "mnt", rar: "comu", name: "Pi", dmg: 6, rate: 1.5, range: 230, cost: 30, role: "single", alt: true,
                 desc: "Llança les pinyes que li pengen de les branques." },
  anells:      { subj: "mnt", rar: "rar", name: "Anells del tronc", dmg: 5, rate: 1.6, range: 230, cost: 60, role: "pulse", pulse: 620,
                 special: { every: 5, type: "freeze", radius: 120, dur: 1.2 },
                 desc: "Li ixen anells grans del centre que s'eixamplen fins a l'abast i fan mal a tot el que travessen. Ataca molt sovint, amb poc dany. Cada 5 atacs, la resina deixa enganxada la zona 1,2 s." },
  contrafoc:   { subj: "mnt", rar: "llegendari", name: "Contrafoc", dmg: 16, rate: 1, range: 300, cost: 120, role: "line", line: { dps: 3, width: 70, len: 150 },
                 desc: "No dispara: a cada tram de camí que té a l'abast hi deixa una línia de foc que el travessa i crema sempre (entre dos trams, en fa dues). Tria bé el lloc." },
  carrasca:    { subj: "mnt", rar: "mitic", name: "Carrasca mil·lenària", dmg: 26, rate: 0.9, range: 320, cost: 150, role: "single",
                 aura: { radius: 340, dmg: 0.3 }, special: { every: 6, type: "root", radius: 150, dur: 1.5 },
                 desc: "Les criatures que té a prop fan un 30 % més de dany. Cada 6 atacs deixa caure una gla: brollen arrels que atrapen els enemics 1,5 s." },
  // ---- Quadern de camp (Forestal: projecte intermodular i IPO)
  bruixola:    { subj: "pin", rar: "comu", name: "Brúixola", dmg: 4, rate: 2.4, range: 200, cost: 25, role: "single",
                 aim: true, aimHold: true, aimWait: 0.16, alt: true,
                 desc: "Barata i rapidíssima: l'agulla gira cap a l'enemic i dispara una meitat i després l'altra (la roja i la blanca), que tornen a créixer." },
  samara:      { subj: "pin", rar: "epic", name: "Sàmara", dmg: 24, rate: 0.45, range: 1900, cost: 85, role: "single", alt: true, projSpeed: 0.25, regrow: 1.2, fall: true,
                 desc: "Deixa anar les seues dues llavors alades, una i després l'altra: volen a poc a poc per tot el mapa, girant com quan cauen dels arbres, fins a la distracció més avançada." },
  anellador:   { subj: "pin", rar: "llegendari", name: "Anellador", dmg: 30, rate: 0.6, range: 300, cost: 120, role: "mark", mark: 0.4, alt: true,
                 desc: "Posa una anella a la distracció més forta: totes les criatures li fan un 40 % més de dany. Si mor, l'anella salta a la més pròxima." },
  projecte:    { subj: "pin", rar: "mitic", name: "Projecte integrador", dmg: 22, rate: 1.0, range: 320, cost: 150, role: "single",
                 special: { every: 6, type: "echo", boost: 1.5 },
                 desc: "Com el projecte, que ajunta tots els mòduls: cada 6 atacs fa l'habilitat especial d'una altra criatura del mapa, un 50 % més forta." },
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
// L'estudiant en porta 3 com a molt. value: efecte a nivell 1 (cada nivell +25 %). world: el món on cau (cada món
// té els seus; els de la Biblioteca, de quan encara n'hi havia dos per món).
const TD_ARTIFACTS = {
  // (els id auriculars i cafe es queden per no trencar partides: ara són la pols d'estrelles i el bastó de l'ajolot)
  auriculars: { name: "Pols d'estrelles", icon: "✨", slot: "branquies", boss: "diumenge", world: 1, stat: "range", value: 0.08,
                desc: lvl => `Pols màgica a les branquies: el Son no adorm les teues torres. +${Math.round(0.08 * tdArtMult(lvl) * 100)} % d'abast.` },
  cafe:       { name: "Bastó d'aprenent", icon: "🪄", slot: "ma", boss: "series", world: 1, stat: "rate", value: 0.15,
                desc: lvl => `Sura al costat de l'ajolot i canalitza la màgia. +${Math.round(0.15 * tdArtMult(lvl) * 100)} % de velocitat d'atac.` },
  // Bosc. Sendera de les Arrels: el Corro de bolets deixa la pell de bolet (la granoteta es torna d'amanita)
  setes:      { name: "Pell de bolet", icon: "🍄", slot: "pell", boss: "series", world: 101, stat: "rate", value: 0.15,
                desc: lvl => `La granoteta es torna roja d'amanita, amb pigues blanques. +${Math.round(0.15 * tdArtMult(lvl) * 100)} % de velocitat d'atac.` },
  // Bosc. Sendera de les Arrels: la pell del Llop de la lluna, sobre les espatles; espanta les distraccions
  capallop:   { name: "Capa de llop", icon: "🐺", slot: "pell", boss: "diumenge", world: 101, stat: "slowAll", value: 0.06,
                desc: lvl => `Les distraccions s'espanten: van un ${Math.round(0.06 * tdArtMult(lvl) * 100)} % més lentes.` },
};
const tdArtMult = lvl => 1 + 0.25 * (lvl - 1);
const TD_ARTIFACT_SLOTS = 3;
// Espais de l'estudiant (com a l'autoescola, sense la mascota): cada artefacte va en el seu; un per espai.
const TD_EQUIP_SLOTS = [
  { id: "cap",     icon: "🎩", name: "Cap" },
  { id: "ma",      icon: "✋", name: "Mà" },
  { id: "pell",    icon: "🎨", name: "Pell" },     // com a l'autoescola (cap, mà i pell), sense mascota
];
// A Informàtica l'estudiant és un ajolot (en Marc): el barret no es canvia i en lloc del cap té les branquies
const TD_EQUIP_SLOTS_AXO = [
  { id: "branquies", icon: "🪸", name: "Branquies" },
  { id: "ma",        icon: "✋", name: "Mà" },
  { id: "pell",      icon: "🎨", name: "Pell" },
];
const tdEquipSlots = () => typeof tdRoom !== "undefined" && tdRoom === "forestal" ? TD_EQUIP_SLOTS : TD_EQUIP_SLOTS_AXO;
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
// Missions diàries possibles: [activitat, quantes vegades, pergamins extra]
const TD_MISSION_ACTS = [["exercici", 2, 3], ["resum", 1, 2], ["repas", 3, 2], ["llarg", 1, 2], ["esquema", 2, 3], ["classe", 2, 2], ["projecte", 1, 3]];
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
// Al bosc, les mateixes distraccions (mateix nom, mateix truc) es disfressen de coses del bosc: look (què pareixen),
// lore propi. Els dibuixos, a TD_FOREST_ENEMY_ART (js/td/art.js).
const TD_FOREST_ENEMIES = {
  notificacio:    { look: "Cuc de llum",
                    lore: "Parpelleja com la llumeta del mòbil: una vegada, dues, i ja l'estàs mirant. Al bosc no venen soles, venen a eixams, i a la nit el sender pareix un grup de WhatsApp." },
  procrastinacio: { look: "Caragol",
                    lore: "Porta la casa a coll i no té cap pressa: tot ho deixa per a demà, i si el toques es tanca dins la closca. Lent però duríssim; la baba que deixa és la llista de coses pendents." },
  son:            { look: "Rosella",
                    lore: "Una flor roja preciosa que fa badallar només de mirar-la. Quan se sacseja, el pol·len adorm la criatura més pròxima: «cinc minutets i continue»." },
  scroll:         { look: "Brot de falguera",
                    lore: "Una espiral que es desenrotlla i mai s'acaba: quan creus que ja està, en trau una altra. Si la talles, en naixen dos brots menuts que continuen baixant pel sender." },
  scrollet:       { look: "Brot menut" },
  meme:           { look: "Camaleó",
                    lore: "Es posa del color de les branques i no el veus fins que és massa tard. Quan l'enxampes, ja t'ha robat mitja vesprada rient-te'n amb la llengua fora." },
  series:         { look: "Corro de bolets",
                    lore: "Un bolet darrere l'altre, en rogle, com els capítols d'una temporada. Per davall de terra, el micel·li alimenta les distraccions que té a prop: sempre en naix un més." },
  diumenge:       { look: "Llop de la lluna",
                    lore: "Ix quan es fa fosc el diumenge i udola a la lluna: els deures que no has fet, l'examen de dilluns… Quan udola, tot el bosc arranca a córrer." },
};
const tdEnemy = id => (typeof tdRoom !== "undefined" && tdRoom === "forestal" && TD_FOREST_ENEMIES[id]) ? { ...TD_ENEMIES[id], ...TD_FOREST_ENEMIES[id] } : TD_ENEMIES[id];

const TD_WORLDS = [
  {
    id: 1, mode: "informatic", name: "Biblioteca Arcana", layout: "Serp",
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
  { id: 2, mode: "informatic", name: "Laboratori de Circuits", layout: "Bifurcació", soon: true },
  { id: 3, mode: "informatic", name: "Torre del Compilador", layout: "Espiral", soon: true },
  { id: 4, mode: "informatic", name: "El Núvol", layout: "Doble entrada", soon: true },
  { id: 5, mode: "informatic", name: "Servidor Abissal", layout: "Doble entrada", soon: true },
];
// Mons del bosc: el primer té el mateix traçat i les mateixes onades que la Biblioteca, però és un sender entre arrels
// (fons a tdbBackground). Les distraccions són les mateixes, dibuixades com a coses del bosc (TD_FOREST_ENEMIES).
TD_WORLDS.push(
  { ...TD_WORLDS[0], id: 101, mode: "forestal", name: "Sendera de les Arrels" },
  { id: 102, mode: "forestal", name: "La Pineda", layout: "Bifurcació", soon: true },
  { id: 103, mode: "forestal", name: "El Barranc", layout: "Espiral", soon: true },
  { id: 104, mode: "forestal", name: "La Muntanya Cremada", layout: "Doble entrada", soon: true },
  { id: 105, mode: "forestal", name: "El Cor del Bosc", layout: "Doble entrada", soon: true },
);
const tdWorldNum = w => TD_WORLDS.filter(o => o.mode === w.mode).indexOf(w) + 1;
