// ===== ESTUDI: DADES =====
// Tower defense gacha d'estudi. Tot el balanç és ací. Unitats del mapa: 1600 × 900 (el camí i els buits en js/td/data.js,
// mon per mon). Les criatures es dibuixen a js/td/art.js.

const TD_SUBJECTS = {
  // Camps d'estudi: cada camp ajunta diverses assignatures (pergamins, garantia i criatures compartits),
  // perquè no cal estudiar tant per a omplir cada gacha. Les claus (alg, prg) són de la partida: no canviar-les.
  // Informàtica (1r del grau a l'UJI, pla EI26xx), per zones: Matemàtiques, Programació, Màquina i Lògica i dades.
  alg: { name: "Matemàtiques", short: "Matemàtiques", icon: "➕", mode: "informatic",
         classes: ["Àlgebra Lineal", "Càlcul"] },
  prg: { name: "Programació", short: "Programació", icon: "⌨️", mode: "informatic",
         classes: ["Programació I", "Programació II", "Eines de Programació", "Dret de les TIC"] },
  maq: { name: "Màquina", short: "Màquina", icon: "⚡", mode: "informatic",
         classes: ["Electrònica", "Fonaments de Computadors"] },
  dad: { name: "Lògica i dades", short: "Lògica", icon: "∀", mode: "informatic",
         classes: ["Matemàtica Discreta", "Estadística"] },
  // Forestal (2n del cicle superior de Gestió Forestal i Conservació del Medi): les 10 assignatures del pla d'estudis
  // (confirmades per Alba). La conservació (cns) ja té camp propi; les altres, agrupades per zones.
  // Camps per zones temàtiques: Monts, Quadern de camp, Fauna (cinegètica i pesca) i Conservació.
  mnt: { name: "Gestió de monts", short: "Monts", icon: "🌲", mode: "forestal",
         classes: ["Gestió de monts", "Defensa contra incendis forestals"] },
  pin: { name: "Quadern de camp", short: "Quadern", icon: "📒", mode: "forestal",
         classes: ["Projecte intermodular", "Itinerari personal per a l'ocupabilitat II",
                   "Digitalització aplicada al sistema productiu", "Sostenibilitat aplicada al sistema productiu", "Mòdul optatiu"] },
  fau: { name: "Fauna", short: "Fauna", icon: "🦌", mode: "forestal",
         classes: ["Gestió cinegètica", "Gestió de la pesca continental"] },
  cns: { name: "Conservació", short: "Conservació", icon: "🦋", mode: "forestal",
         classes: ["Gestió de la conservació del medi natural"] },
};
const tdFieldsOf = mode => Object.keys(TD_SUBJECTS).filter(s => TD_SUBJECTS[s].mode === mode);
// Temps que tarda a tornar a créixer la peça que llança una criatura (regrow a la seua fitxa; per defecte 0,7 s)
const tdRegrowTime = id => TD_DEFENDERS[id].regrow || 0.7;
const tdModeOf = id => TD_SUBJECTS[TD_DEFENDERS[id].subj].mode;

// Punts d'estrella (espores al bosc): els dona una tirada quan el camp no té criatura d'aquella raresa (no tots tenen
// les cinc) i, a vegades (TD_POINT_SWAP), una tirada per davall de llegendari en lloc de la còpia. Quants: TD_POINT_GAIN.
// Amb punts es compren còpies de qualsevol criatura de la carrera (menys la mítica): valor de la raresa × TD_POINT_COPY.
const TD_POINT_GAIN = { comu: 1, rar: 3, epic: 8 }; // com més rara la tirada, més punts
const TD_POINT_SWAP = 0.15;
const TD_POINTS = {
  informatic: { name: "punts d'estrella", one: "punt d'estrella", icon: "⭐" },
  forestal:   { name: "espores", one: "espora", icon: "🍄" },
};
const TD_POINT_COPY = 5;

// Correu de la sala: missatges de l'equip, sobretot per a compensar errors del joc. Cada un es recull una vegada per
// partida (td.mail guarda els recollits). gift.pergamins: tants de cada camp (de les dues sales). Els nous, a dalt.
const TD_MAIL = [
  { id: "perdo-2026-11", date: "23/11/2026", from: "L'equip de l'estudi", title: "Perdó pels errors",
    text: "Hi ha hagut uns quants errors (estrelles que pujaven soles, el ×2 que no anava, el llibre que botava i armes massa fortes). Ja estan arreglats. Ací tens uns pergamins per les molèsties!",
    gift: { pergamins: 10 } },
];

// Raresa: probabilitat de la invocació (el mític no ix mai: només amb un 8 o més a l'examen final)
const TD_RARITIES = {
  comu:       { name: "Comú",       chance: 0.66,  color: "#b8c0cc", value: 1 },
  rar:        { name: "Rar",        chance: 0.27,  color: "#4aa8ff", value: 3 },
  epic:       { name: "Èpic",       chance: 0.06,  color: "#b48cff", value: 10 },
  llegendari: { name: "Llegendari", chance: 0.01,  color: "#ffc23f", value: 40 },
  mitic:      { name: "Mític",      chance: 0,     color: "#ff5ab0", value: 100 },
  // Matrícula d'Honor: no ix mai a l'altar; s'aconseguix a l'onada 100 d'un món (fusió o evolució, TD_FORGE)
  mh:         { name: "Matrícula d'Honor", chance: 0, color: "#ff3b4e", value: 200 },
};
// Quantes criatures iguals es poden posar alhora en un mapa, segons la raresa (perquè no s'omplin tots els buits de la
// mateixa). Pagant 10.000 de maná en el combat, el límit es dobla per a aquella partida del món (es guarda amb l'onada).
const TD_PLACE_LIMIT = { comu: 4, rar: 3, epic: 3, llegendari: 2, mitic: 1, mh: 1 };
const TD_LIMIT_DOUBLE_COST = 10000;
// Abans del ×2 de límit: pagant 5.000 de maná, les criatures d'aquell món es poden potenciar fins a ◆◆◆◆◆ (normalment, ◆◆◆).
// Es guarda amb l'onada (tdb.up5, va en el snapshot). El ×2 de límit ix després d'este.
const TD_UP5_COST = 5000;
const TD_PITY = { epic: 30, llegendari: 50, mitic: 200 }; // garantia per camp: èpic a la tirada 30, llegendari a la 50, mític a la 200
// Còpies totals per a cada estrela (★1 en traure-la; ★5 amb 11 còpies). Les que sobren es tornen saber.
// Pujar d'estrella costa saber (a més de les còpies): base × √(valor de la raresa) × multiplicador de l'estrella
const TD_STAR_COST = [1, 3, 8, 20];
const TD_STAR_COPIES = [1, 2, 4, 7, 11];
// Matrícula d'Honor: una còpia per estrela (cada vegada que tornes a passar l'onada 100 del seu món, una còpia més)
const TD_MH_COPIES = [1, 2, 3, 4, 5];

// Criatures. dmg: dany per atac · rate: atacs per segon · range: abast · cost: maná per a posar-la
// role: què fa a més del dany (vegeu js/td/battle.js). Tots els defensors fan dany.
// Criatures retirades (menys varietat, més qualitat): les còpies que en tenies passen a la de la mateixa raresa
const TD_MERGED = { escalar: "sumador", transposada: "vector", comentari: "puntcoma", bucle: "ifelse", matriu: "vector", recursio: "ifelse" };
const TD_DEFENDERS = {
  // ---- Matemàtiques
  sumador:     { subj: "alg", rar: "comu", name: "Sumador", dmg: 6, rate: 1.6, range: 230, cost: 30, role: "single", alt: true,
                 desc: "Llança alternativament els dos + menuts que té de braços." },
  vector:      { subj: "alg", rar: "epic", name: "Vector", dmg: 30, rate: 0.5, range: 430, cost: 80, role: "pierce", aim: true,
                 special: { every: 8, type: "scale", mult: 2.5 },
                 desc: "La llança travessa tots els enemics que troba en línia recta. Cada 8 tirs, la multiplica per un escalar: ix el doble de gran i fa 2,5 × el dany." },
  determinant: { subj: "alg", rar: "llegendari", name: "Determinant |A|", dmg: 40, rate: 0.5, range: 300, cost: 120, role: "execute", execute: 0.15, alt: true, regrow: 2.2,
                 desc: "Colps molt forts, un braç cada vegada. Si a l'enemic li queda menys d'un 15 % de vida, det = 0: l'elimina." },
  lambda:      { subj: "alg", rar: "mitic", name: "Diagonalitzador λ", dmg: 30, rate: 1.0, range: 340, cost: 150, role: "single",
                 special: { every: 15, type: "align", area: 1.8, dur: 2, vuln: 0.5, vulnDur: 5 },
                 desc: "Cada 15 atacs alinea els enemics d'una zona molt gran (gairebé el doble del seu abast): els para 2 s (més com més habilitat té) i reben un 50 % més de dany durant 5 s." },
  // ---- Informàtica
  puntcoma:    { subj: "prg", rar: "comu", name: "Punt i coma", dmg: 4, rate: 2.4, range: 200, cost: 25, role: "single", alt: true,
                 desc: "Barat i rapidíssim: escup punts sense parar." },
  ifelse:      { subj: "prg", rar: "rar", name: "If / else", dmg: 11, rate: 1.0, range: 260, cost: 55, role: "smart", alt: true,
                 desc: "Si n'hi ha un de fort, li dispara a ell; si no, al més ràpid." },
  compilador:  { subj: "prg", rar: "llegendari", name: "Compilador", dmg: 28, rate: 0.6, range: 280, cost: 120, role: "aoe", aoe: 80,
                 special: { every: 12, type: "convert", dur: 4 },
                 desc: "Dany en zona. Cada 12 atacs compila l'enemic més feble i el torna aliat 4 s: camina cap enrere fent mal als altres i després torna a ser una distracció." },
  stack:       { subj: "prg", rar: "mitic", name: "Stack Overflow", dmg: 20, rate: 1.2, range: 300, cost: 150, role: "stacks", stacks: 20, blast: 18,
                 desc: "Cada atac apila. Amb 20 piles, el desbordament explota per tot el mapa (18 × el dany)." },
  // ---- Màquina (Informàtica: electrònica i fonaments de computadors)
  rellotge:    { subj: "maq", rar: "epic", name: "Rellotge de CPU", dmg: 10, rate: 0.8, range: 210, cost: 80, role: "clock", regrow: 0.8, every: 10,
                 desc: "Un cristall de quars que marca el compàs. A cada tic, l'ona quadrada que du a la cara baixa al camí i recorre tot el tram al seu abast, i colpeja tot el que hi ha. Cada 10 tics, un tic doble (2 × el dany)." },
  tesla:       { subj: "maq", rar: "llegendari", name: "Bobina de Tesla", dmg: 24, rate: 0.6, range: 300, cost: 120, role: "chain", projSpeed: 1.6,
                 chain: { jumps: 4, falloff: 0.82, radius: 210 }, special: { every: 10, type: "overload", jumps: 8, stun: 0.5 },
                 desc: "Llança la bola de càrrega que té dalt: en tocar, el raig salta d'una distracció a la més pròxima fins a 4 vegades, i perd força a cada salt. Cada 10 tirs, sobrecàrrega: salta 8 vegades sense perdre força i deixa cada distracció parada mig segon." },
  resistencia: { subj: "maq", rar: "rar", name: "Resistència", dmg: 9, rate: 1.2, range: 250, cost: 55, role: "slow", alt: true, regrow: 0.9,
                 slow: 0.35, slowDur: 2, band: { l: "#ff5a4a", r: "#c97a3a" },
                 desc: "Llança les bandes de colors del cos, una i una: cada banda s'estreny al voltant de la distracció i la frena (s'oposa al pas, com al corrent) mentre la porta posada." },
  condensador: { subj: "maq", rar: "mitic", name: "Condensador", dmg: 14, rate: 0.25, range: 300, cost: 150, role: "capacitor", projSpeed: 1.3,
                 charge: { blast: 11, radius: 120, stun: 0.8 },
                 desc: "No dispara mentre es carrega: entre les plaques puja la càrrega i l'electró del mig creix. Quan està ple, el llança d'un colp, com un canó, i esclata en zona (11 × el dany) amb un llamp a cada distracció del voltant, que es queden parades un moment." },
  // ---- Fauna (cinegètica i pesca)
  prismatics: { subj: "fau", rar: "rar", name: "Prismàtics", dmg: 38, rate: 0.42, range: 400, cost: 60, role: "single", alt: true, projSpeed: 2.4, regrow: 1.2,
                desc: "Els prismàtics d'observar fauna: veuen molt lluny i, alternant les dues lents, llancen el seu reflex, que pega fort a una sola distracció. Tir lent." },
  canya:      { subj: "fau", rar: "llegendari", name: "Canya de pescar", dmg: 0, rate: 0.04, range: 320, cost: 120, role: "hook", projSpeed: 1.1, regrow: 6,
                hook: { reel: 6, boss: 0.3 },
                desc: "Cada molt de temps llança l'ham. Si enganxa una distracció, la trau del camí i, recollint el fil a poc a poc, la porta fins a la canya: pescada, desapareix. Als caps els lleva un 30 % de la vida i tornen al camí." },
  rusc:       { subj: "fau", rar: "llegendari", name: "Rusc d'abelles", dmg: 6, rate: 0.5, range: 270, cost: 120, role: "swarm", projSpeed: 0.7, regrow: 1.6,
                poison: { dps: 8, dur: 4 }, special: { every: 8, type: "honey", radius: 75, slow: 0.55, dur: 6 },
                desc: "Deixa anar les abelles: cadascuna persegueix una distracció diferent i la pica amb verí, que li fa mal durant uns segons. Després tornen al rusc. Cada 8 eixides, l'abella porta mel i en deixa un toll al camí que frena el que el trepitja." },
  // ---- Lògica i dades (Informàtica)
  veritat:     { subj: "dad", rar: "rar", name: "Taula de veritat", dmg: 14, rate: 1.0, range: 260, cost: 60, role: "truth", alt: true, regrow: 0.8,
                 truth: { v: 1.6, f: 0.6, slow: 0.35, slowDur: 1.6 },
                 desc: "Una taula de veritat que llança, per torns, la V i la F de la seua columna. La V és certa: pega fort. La F és falsa: pega poc però deixa la distracció més lenta." },
  grans:       { subj: "dad", rar: "llegendari", name: "Llei dels grans nombres", dmg: 20, rate: 1.0, range: 300, cost: 120, role: "ramp", regrow: 0.8,
                 ramp: { step: 0.15, max: 12 }, special: { every: 10, type: "converge", dur: 5 },
                 desc: "Llança les dades de l'histograma. Com més tirs seguits fa a la mateixa distracció, més mal fa (+15 % cada tir, fins a quasi el triple); si en canvia, torna a començar. Cada 10 tirs, convergència: durant 5 s pega al màxim encara que canvie d'objectiu." },
  quantif:     { subj: "dad", rar: "llegendari", name: "Quantificadors ∀∃", dmg: 22, rate: 0.55, range: 320, cost: 120, role: "quant", alt: true, regrow: 1.2,
                 quant: { all: 0.35, one: 3 }, special: { every: 12, type: "forall", mult: 3 },
                 desc: "Alterna els dos quantificadors. ∀ (per a tot): un colp menut a totes les distraccions del mapa a la vegada. ∃ (existix): en tria una a l'atzar i li fa un colp enorme. Cada 12 tirs, ∀ triple." },
  montecarlo:  { subj: "dad", rar: "mitic", name: "Mètode de Montecarlo", dmg: 24, rate: 0.9, range: 300, cost: 150, role: "buffer", regrow: 0.9,
                 buff: { every: 4, n: 3, dur: 5 }, special: { every: 12, type: "simulate" },
                 desc: "Llança els punts de la seua simulació. Cada 4 s tira els daus i dona una millora a l'atzar a 3 aliades durant 5 s: més dany, més rapidesa, més abast o l'especial carregat. Cada 12 tirs, simulació completa: la tirada és per a totes." },
  // ---- Conservació (Forestal)
  gla:         { subj: "cns", rar: "rar", name: "Gla", dmg: 15, rate: 0.9, range: 270, cost: 65, role: "bounce", bounces: 2, alt: true, regrow: 0.9, sproutEvery: 5,
                 desc: "Una branca de carrasca amb dues glans. Les llança i reboten en 2 distraccions. Cada 5 tirs, la gla brota on cau: el brot frena un moment el que passa." },
  micorriza:   { subj: "cns", rar: "epic", name: "Micorriza", dmg: 14, rate: 0.8, range: 260, cost: 85, role: "link", alt: true, regrow: 1,
                 link: { radius: 300, mult: 0.5, cd: 0.6 }, special: { every: 10, type: "spores", mult: 2, slow: 0.3, dur: 2 },
                 desc: "Un bolet amb la xarxa de fongs davall de terra. Llança espores i, a més, connecta les criatures del voltant: quan una d'elles pega, el fong també hi fa mal. Cada 10 tirs, esporada: totes les del seu abast, colpejades i més lentes." },
  ecoducte:    { subj: "cns", rar: "llegendari", name: "Ecoducte", dmg: 10, rate: 0.5, range: 320, cost: 120, role: "bridge",
                 bridge: { tax: 0.06, maxTax: 0.35, big: 0.6, width: 80 }, special: { every: 8, type: "fauna", stun: 1.2 },
                 desc: "Un pas de fauna que creua el camí més pròxim. Les distraccions que passen per davall perden un 6 % de la vida que els queda (un poc menys les grosses); el percentatge puja amb el nivell, les estrelles i les millores, fins a un 35 %. Cada 8 que hi passen, travessen els animals: les que estan davall es queden parades 1,2 s." },
  microreserva:{ subj: "cns", rar: "mitic", name: "Microreserva", dmg: 20, rate: 0.7, range: 320, cost: 150, role: "flora", alt: true, regrow: 1,
                 flora: { life: 20, radius: 60, slow: 0.3, dps: 0.6, max: 6 }, special: { every: 12, type: "bloom", mult: 2, dur: 4, extra: 3 },
                 desc: "Una parcel·la de flora protegida. Llança llavors al camí i on cauen hi creix una flor que frena i fa mal al que passa; dura 20 s i després es marcix (6 com a molt). Cada 12 tirs, floració: les flors fan el doble 4 s i en naixen 3 més." },
  cervol:     { subj: "fau", rar: "mitic", name: "Cérvol de la brama", dmg: 34, rate: 0.25, range: 900, cost: 150, role: "bellow",
                bellow: { push: 50, stun: 0.3 }, special: { every: 5, type: "roar", mult: 3, push: 2.5, stun: 1.2 },
                desc: "Un tòtem de cérvol tallat en fusta: cada poc brama i l'ona recorre tot el camí, fa mal a totes les distraccions i les fa recular uns passos (els caps, la meitat). Cada 5 bramits, el gran bramit: una explosió molt més gran que fa 3 × el dany, les fa recular molt més i les deixa parades." },
  // ---- Gestió de monts (Forestal)
  pi:          { subj: "mnt", rar: "comu", name: "Pi", dmg: 6, rate: 1.5, range: 230, cost: 30, role: "single", alt: true,
                 desc: "Llança les pinyes que li pengen de les branques." },
  anells:      { subj: "mnt", rar: "epic", name: "Anells del tronc", dmg: 5, rate: 1.6, range: 230, cost: 60, role: "pulse", pulse: 620,
                 special: { every: 12, type: "freeze", radius: 120, dur: 1.2 },
                 desc: "Li ixen anells grans del centre que s'eixamplen fins a l'abast i fan mal a tot el que travessen. Ataca molt sovint, amb poc dany. Cada 12 atacs, la resina deixa enganxada la zona 1,2 s." },
  contrafoc:   { subj: "mnt", rar: "llegendari", name: "Contrafoc", dmg: 16, rate: 1, range: 300, cost: 120, role: "line", line: { dps: 3, width: 70, len: 150, max: 3, touch: 190 },
                 desc: "No dispara: a cada tram de camí que té a l'abast hi deixa una línia de foc que el travessa i crema sempre (només els trams que toquen la seua plataforma: entre dos, dues; envoltada per tres costats, tres). Tria bé el lloc." },
  carrasca:    { subj: "mnt", rar: "mitic", name: "Carrasca mil·lenària", dmg: 26, rate: 0.9, range: 320, cost: 150, role: "single",
                 aura: { radius: 340, dmg: 0.3 }, special: { every: 14, type: "root", radius: 150, dur: 1.5 },
                 desc: "Les criatures que té a prop fan un 30 % més de dany. Cada 14 atacs deixa caure una gla: brollen arrels que atrapen els enemics 1,5 s." },
  // ---- Quadern de camp (Forestal: projecte intermodular i IPO)
  bruixola:    { subj: "pin", rar: "comu", name: "Brúixola", dmg: 4, rate: 2.4, range: 200, cost: 25, role: "single",
                 aim: true, aimHold: true, aimWait: 0.16, alt: true,
                 desc: "Barata i rapidíssima: l'agulla gira cap a l'enemic i dispara una meitat i després l'altra (la roja i la blanca), que tornen a créixer." },
  samara:      { subj: "pin", rar: "epic", name: "Disàmara", dmg: 24, rate: 0.45, range: 1900, cost: 85, role: "single", alt: true, projSpeed: 0.25, regrow: 1.2, fall: true,
                 special: { every: 8, type: "sprout", radius: 90, slow: 0.5, dur: 5 },
                 desc: "Una disàmara d'auró: deixa anar les seues dues sàmares (les llavors alades), una i després l'altra: volen a poc a poc per tot el mapa, girant com quan cauen dels arbres, fins a la distracció més avançada. Cada 8 llavors, la que cau arrela: hi naix un plançó que frena el que passa pel costat." },
  anellador:   { subj: "pin", rar: "llegendari", name: "Anellador", dmg: 30, rate: 0.75, range: 300, cost: 120, role: "mark", mark: 0.6, alt: true,
                 desc: "Posa una anella a la distracció més forta: totes les criatures li fan un 60 % més de dany. Si mor, l'anella salta a la més pròxima." },
  projecte:    { subj: "pin", rar: "mitic", name: "Projecte integrador", dmg: 22, rate: 1.0, range: 320, cost: 150, role: "single",
                 special: { every: 3, type: "echo", boost: 1.5 },
                 desc: "Com el projecte, que ajunta tots els mòduls: cada 3 atacs fa l'habilitat especial d'una altra criatura del mapa, un 50 % més forta." },
  // ---- Matrícula d'Honor (vermelles): una per món, a l'onada 100. Les fusions ajunten dues criatures (desapareixen i
  // queda la nova); l'evolució en transforma una amb la pedra del món. No ixen a l'altar (TD_FORGE, js/td/state.js)
  dron:        { subj: "pin", rar: "mh", name: "Dron de mostreig", dmg: 9, rate: 2.6, range: 170, cost: 160, role: "drone", fly: 240, height: 150, alt: true,
                 special: { every: 10, type: "scan", radius: 200, vuln: 0.3, dur: 4 },
                 desc: "La brúixola i els prismàtics, junts en el dron que inventaria el bosc. Ix del seu buit i vola per tot el mapa damunt de la distracció més avançada; dispara de pressa els flaixos de les dues lents. Cada 10 tirs, escaneja: les del con queden marcades (reben un 30 % més de dany i es veuen encara que s'amaguen)." },
  pimare:      { subj: "mnt", rar: "mh", name: "Pi Mare", dmg: 18, rate: 1.2, range: 300, cost: 170, role: "single", alt: true, pulseEvery: 3, pulse: 620,
                 aura: { radius: 360, dmg: 0.25, el: "natura" }, special: { every: 12, type: "root", radius: 220, dur: 1.6 },
                 desc: "El pi i els anells, en un pi vell que naix d'un tronc tallat. Llança pinyes i, cada 3 atacs, del tronc ix un anell que s'eixampla per terra. Les seues arrels arriben a les criatures de natura del voltant (+25 % de dany). Cada 12 atacs, les arrels atrapen tot el que hi ha al voltant de la distracció tocada." },
  quantic:     { subj: "maq", rar: "mh", name: "Processador quàntic", dmg: 13, rate: 0.95, range: 320, cost: 170, role: "chain", projSpeed: 1.6, tick: 4,
                 chain: { jumps: 5, falloff: 0.85, radius: 220 }, special: { every: 10, type: "collapse", stun: 0.6, area: 1.8 },
                 desc: "El rellotge i la Tesla, en un xip amb un qubit. Llança la bola de càrrega i el raig salta de distracció en distracció; cada 4 tics del rellotge, salta el doble de vegades. Cada 10, col·lapse: tot el que hi ha fins a quasi el doble del seu abast es queda parat mig segon." },
  turing:      { subj: "dad", rar: "mh", name: "Màquina de Turing", dmg: 30, rate: 0.9, range: 330, cost: 160, role: "tape", alt: true, regrow: 0.9,
                 tape: { dur: 3, vuln: 1, slow: 0.4 }, special: { every: 12, type: "halt", stun: 2 },
                 desc: "La taula de veritat i els quantificadors, fets cinta. Llança per torns el 0 i l'1 de la cinta i els escriu a les distraccions: les de l'1 reben el doble de mal 3 s i les del 0 van més lentes. Cada 12 tirs, HALT: totes les del mapa es queden parades 2 s." },
  os:          { subj: "fau", rar: "mh", name: "Ós de la mel", dmg: 40, rate: 1, range: 300, cost: 160, role: "walker",
                 walker: { speed: 170, reach: 560, rest: 3, bite: 0.45, radius: 60, poison: { dps: 0.35, dur: 3 } }, special: { every: 12, type: "growl", push: 140, stun: 0.6, radius: 200 },
                 desc: "La mel del rusc i la canya de pescar l'han fet eixir del bosc. Ix del cau, corre pel camí en contra de les distraccions i les mossega (la mel les enverina); després torna al cau i descansa menjant mel. Cada 12 mossos, grunyit: les del voltant reculen i es queden parades." },
  matriu:      { subj: "alg", rar: "mh", name: "Matriu inversa", dmg: 44, rate: 0.55, range: 440, cost: 160, role: "pierce", alt: true, regrow: 1.2, execute: 0.15, projSpeed: 1.3,
                 special: { every: 12, type: "invert", dur: 2 },
                 desc: "El vector i el determinant, en una matriu. Llança els seus dos claudàtors, que travessen tot el que troben en línia recta; si a una li queda menys d'un 15 % de vida, l'elimina (det = 0). Cada 12 tirs, A⁻¹: les del seu abast caminen cap enrere 2 s." },
  xarxa:       { subj: "cns", rar: "mh", name: "Xarxa del Bosc", dmg: 22, rate: 0.9, range: 300, cost: 160, role: "link", alt: true, regrow: 1,
                 link: { radius: 9999, mult: 0.6, cd: 0.5 }, special: { every: 10, type: "spores", mult: 2.4, slow: 0.35, dur: 2.5, all: true },
                 desc: "La micorriza, feta bosc: tres bolets i una xarxa de fongs que arriba a totes les criatures del mapa. Quan qualsevol d'elles pega, el fong també hi fa mal. Cada 10 tirs, esporada a tot el bosc: totes les distraccions de l'abast de cada criatura, colpejades i més lentes." },
  spaghetti:   { subj: "prg", rar: "mh", name: "Codi Spaghetti", dmg: 35, rate: 1.1, range: 300, cost: 160, role: "bounce", bounces: 4, random: true, randDmg: [0.1, 1], alt: true, projSpeed: 0.55,
                 slow: 0.3, slowDur: 1.5, special: { every: 12, type: "goto", upTo: 0.85 },
                 desc: "L'If/else, quan el codi se n'ix de mare. Llança els caps dels fideus, que reboten entre 4 distraccions a l'atzar, i cada colp fa un dany a l'atzar (entre el 10 % i el 100 % del seu) i les deixen enredades (més lentes). Cada 12 tirs, GOTO: la distracció més avançada salta a un lloc a l'atzar del seu camí (pot tocar-li davant o darrere)." },
};
// Com s'aconseguixen les de Matrícula d'Honor: a l'onada 100 del món (world) es guanya la recepta o la pedra
const TD_FORGE = {
  dron:      { world: 101, from: ["bruixola", "prismatics"], key: "📜 Recepta del dron" },
  pimare:    { world: 102, from: ["pi", "anells"], key: "📜 Recepta del Pi Mare" },
  quantic:   { world: 2, from: ["rellotge", "tesla"], key: "📜 Recepta del processador" },
  spaghetti: { world: 1, evolve: "ifelse", key: "💎 Pedra del spaghetti" },
  turing:    { world: 3, from: ["veritat", "quantif"], key: "📜 Recepta de la màquina de Turing" },
  os:        { world: 103, from: ["rusc", "canya"], key: "📜 Recepta de l'ós de la mel" },
  matriu:    { world: 4, from: ["vector", "determinant"], key: "📜 Recepta de la matriu inversa" },
  xarxa:     { world: 104, evolve: "micorriza", key: "💎 Pedra de la micorriza" },
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
  // Món 2: les pestanyes del navegador (al bosc, la formiga reina) en van obrint de noves mentre camina
  pestanyes:      { name: "Pestanyes obertes", hp: 70, speed: 48, lives: 2, mana: 7, saber: 3, size: 88, spawn: { every: 4, max: 3, type: "pestanyeta" },
                    lore: "«Ho mire després». Una pestanya, després una altra, i una altra… Mentre camina en va obrint de noves, i cada una et robarà cinc minuts que mai són cinc.",
                    desc: "Cada 4 s obri una pestanya menuda que va darrere seu (fins a 3)." },
  pestanyeta:     { name: "Pestanya", hp: 14, speed: 82, lives: 1, mana: 1, saber: 1, size: 50, art: "pestanyeta", hidden: true },
  meme:           { name: "Meme", hp: 45, speed: 70, lives: 1, mana: 6, saber: 2, size: 80, stealth: 0.4,
                    lore: "No el veus vindre: s'amaga entre les fotos del grup fins que és massa tard. Quan l'entens, ja t'ha robat mitja vesprada de riure.",
                    desc: "Invisible (no es pot atacar) durant el primer 40 % del camí." },
  series:         { name: "Marató de sèries", hp: 500, speed: 30, lives: 10, mana: 60, saber: 40, size: 150, boss: true, heal: { radius: 160, hps: 10 },
                    lore: "«L'últim capítol i a dormir». Porta les crispetes i la temporada sencera. Cura les distraccions que té a prop perquè sempre ve un capítol més.",
                    desc: "Cura 10 de vida per segon als enemics que té a prop." },
  // Cap del món 2: l'Algoritme (al bosc, la papallona irisada) canvia del que és feble i fort cada pocs segons
  algoritme:      { name: "L'Algoritme", hp: 1900, speed: 30, lives: 15, mana: 100, saber: 80, size: 158, boss: true, shift: { every: 6 },
                    lore: "Sap què t'agrada abans que tu. Quan creus que l'has entés, canvia: el que el feia caure ja no li fa res, i el que no li feia res ara el tomba. Mira-li la icona del cap i canvia d'estratègia.",
                    desc: "Cada 6 s canvia de debilitat i de fortalesa (la icona de damunt diu a què és feble ara)." },
  // Món 3: els Reels (al riu, el cranc) porten un escut de «m'agrada» que para els primers colps; quan es trenca, corren
  reels:          { name: "Reels", hp: 60, speed: 52, lives: 2, mana: 7, saber: 3, size: 84, shield: { hits: 5, rush: 1.6 },
                    lore: "Un vídeo de quinze segons, i un altre, i un altre. Porta un escut de cors i «m'agrada» que t'aguanta els primers intents de deixar-ho; quan per fi el trenques, fuig corrent cap al següent.",
                    desc: "Un escut para els 5 primers colps (el verí i el foc el travessen). Quan es trenca, va un 60 % més ràpid." },
  // Cap del món 3: la data d'entrega (al riu, la riuada) va més de pressa com menys vida li queda
  deadline:       { name: "La data d'entrega", hp: 2400, speed: 22, lives: 15, mana: 110, saber: 90, size: 156, boss: true, deadline: { max: 1.6 },
                    lore: "Al principi queda molt de temps i camina tranquil·la. Però com més s'acosta, més corre: l'última nit, a les tres de la matinada, ja va volant.",
                    desc: "Com menys vida li queda, més ràpid va (fins a 2,6 vegades al final)." },
  // Món 4: el Videojoc (al bosc, la llebre) fa salts cap avant; el Ransomware (la processionària) bloqueja una criatura
  videojoc:       { name: "Videojoc", hp: 55, speed: 50, lives: 2, mana: 7, saber: 3, size: 82, blink: { every: 3.5, dist: 130 },
                    lore: "«Una partida i ho deixe». Quan creus que el tens controlat, fa un salt de nivell i se t'ha menjat la vesprada. Mai està on el deixes.",
                    desc: "Cada 3,5 s fa un salt cap avant pel camí." },
  ransomware:     { name: "Ransomware", hp: 2600, speed: 24, lives: 15, mana: 120, saber: 100, size: 156, boss: true, lock: { every: 5, hp: 0.2 },
                    lore: "T'ha xifrat els apunts i et demana un rescat. Mentre no li baixes la vida, la criatura que ha bloquejat no pot fer res.",
                    desc: "Bloqueja una criatura a l'atzar (cadenat): no ataca fins que el Ransomware perd un 20 % de vida. Després en bloqueja una altra." },
  diumenge:       { name: "Diumenge a la nit", hp: 2200, speed: 28, lives: 20, mana: 120, saber: 100, size: 160, boss: true, rush: { every: 4, mult: 1.35, dur: 2 },
                    lore: "La nit que tot ho accelera: els deures que no has fet, l'examen de dilluns, l'agenda en blanc. Quan arriba, ja vas tard.",
                    desc: "Cada 4 s accelera tots els enemics un 35 % durant 2 s." },
};
const TD_WAVE_HP = 0.3; // cada onada, +30 % de vida als enemics
// Dificultat dels mons: vida de totes les distraccions (×) i saber que donen (×). Ajustat amb tools/td-progres.py
const TD_DIFFICULTY = { hp: 1.95, saber: 2, count: 1.25 }; // 24/11: +30 % de vida i +25 % de distraccions per onada (anaven massa fàcils)

// ---- Elements: el tipus de dany de cada criatura (segons com pega). Cada distracció és feble a un (×2) i forta contra
// un altre (×0,3). La llum i l'ombra peguen sempre amb avantatge (encara no les té cap criatura).
const TD_ELEMENTS = {
  fisic:    { name: "Físic",    icon: "🪨", color: "#e0c8a0" },
  electric: { name: "Elèctric", icon: "⚡", color: "#ffe14a" },
  foc:      { name: "Foc",      icon: "🔥", color: "#ff7a2f" },
  natura:   { name: "Natura",   icon: "🌿", color: "#7ddc5a" },
  arca:     { name: "Arcà",     icon: "✨", color: "#c58bff" },
  buit:     { name: "Buit",     icon: "∅",  color: "#b9c2e0" }, // el conjunt buit: el de les criatures matemàtiques
  llum:     { name: "Llum",     icon: "☀️", color: "#fff4b0", always: true },
  ombra:    { name: "Ombra",    icon: "🌑", color: "#8e7dff", always: true },
};
const TD_ELEM_WEAK = 2, TD_ELEM_STRONG = 0.3; // feble: el doble de dany; forta: menys d'un terç
const TD_DEFENDER_ELEMENT = {
  sumador: "buit", vector: "buit", determinant: "buit", lambda: "buit",
  puntcoma: "arca", ifelse: "arca", compilador: "buit", stack: "arca",
  rellotge: "electric", tesla: "electric", resistencia: "electric", condensador: "electric",
  prismatics: "fisic", canya: "fisic", rusc: "natura", cervol: "arca",
  pi: "natura", anells: "natura", contrafoc: "foc", carrasca: "natura",
  bruixola: "fisic", samara: "fisic", anellador: "fisic", projecte: "arca",
  dron: "fisic", pimare: "natura", quantic: "electric", spaghetti: "arca", turing: "electric", os: "fisic", matriu: "buit", xarxa: "natura",
  veritat: "electric", grans: "buit", quantif: "arca", montecarlo: "arca",
  gla: "fisic", micorriza: "natura", ecoducte: "fisic", microreserva: "natura",
};
// Les Matrícules d'Honor tenen dos elements: cada colp fa la meitat del dany amb cadascun
const TD_DEFENDER_ELEMENT2 = { dron: "electric", pimare: "arca", quantic: "buit", spaghetti: "foc", turing: "arca", os: "natura", matriu: "arca", xarxa: "arca" };
for (const [id, d] of Object.entries(TD_DEFENDERS)) { d.el = TD_DEFENDER_ELEMENT[id] || "fisic"; if (TD_DEFENDER_ELEMENT2[id]) d.el2 = TD_DEFENDER_ELEMENT2[id]; }
// weak: feble a; strong: forta contra; why: per què (al bestiari)
const TD_ENEMY_ELEMENTS = {
  notificacio:    { weak: "electric", why: "Un curtcircuit i el mòbil s'apaga. És tan feble que no és forta contra res." },
  procrastinacio: { weak: "foc", strong: "fisic", why: "Quan li crema la data d'entrega, corre; els colps, però, els esmorteïx com un sofà." },
  son:            { weak: "electric", strong: "buit", why: "Un cafè ben carregat la desperta de colp; en el buit, en canvi, s'hi està de meravella: no pensar en res." },
  scroll:         { weak: "buit", strong: "electric", why: "El conjunt buit s'empassa fins i tot l'infinit; la bateria, però, la té infinita." },
  scrollet:       { weak: "buit", strong: "electric" },
  meme:           { weak: "natura", strong: "arca", why: "Eixir a tocar herba el desfà; la màgia només el fa més viral." },
  series:         { weak: "fisic", strong: "foc", why: "Tancar el portàtil d'un colp l'atura; ja té les crispetes calentes: el foc no li fa res." },
  pestanyes:      { weak: "foc", strong: "fisic", why: "Quan el portàtil s'escalfa, es tanquen totes de colp; a colps, en canvi, només se n'obrin més." },
  pestanyeta:     { weak: "foc", strong: "fisic" },
  algoritme:      { why: "No té debilitat fixa: canvia cada pocs segons. Ara és feble a l'element que du damunt del cap." },
  reels:          { weak: "foc", strong: "buit", why: "Si el mòbil s'escalfa massa, s'apaga i s'acaba el bucle; el buit, en canvi, és el que l'alimenta: sempre en vols un més." },
  deadline:       { weak: "electric", strong: "natura", why: "Una nit amb l'energia a tope la tomba; anar a passejar per a despejar-se no fa més que acostar-la." },
  videojoc:       { weak: "fisic", strong: "electric", why: "Desendolla la consola d'un colp i s'acaba; amb més corrent, en canvi, encara juga més." },
  ransomware:     { weak: "arca", strong: "fisic", why: "Només un encanteri de desxifrat el desfà; a colps contra l'ordinador no es recupera res." },
  diumenge:       { weak: "arca", strong: "natura", why: "Un encanteri de concentració l'escurça; ni eixir a passejar el salva." },
};
for (const [id, e] of Object.entries(TD_ENEMIES)) Object.assign(e, TD_ENEMY_ELEMENTS[id] || {});
// Multiplicador d'un element contra una distracció
function tdElemMult(enemyDef, el) {
  if (!el || !TD_ELEMENTS[el]) return 1;
  if (TD_ELEMENTS[el].always || enemyDef.weak === el) return TD_ELEM_WEAK;
  return enemyDef.strong === el ? TD_ELEM_STRONG : 1;
}

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
  // Bosc. Sendera de les Arrels: el Llop de la lluna deixa el bastó de la natura (id capallop: abans era la capa)
  capallop:   { name: "Bastó de la natura", icon: "🌿", slot: "ma", boss: "diumenge", world: 101, stat: "slowAll", value: 0.06,
                desc: lvl => `Arrels i fulles responen a la granoteta: les distraccions van un ${Math.round(0.06 * tdArtMult(lvl) * 100)} % més lentes.` },
};
// Món 2 (l'Algoritme): la pell bioluminescent de l'ajolot i les banyes de cervatell de la granoteta
Object.assign(TD_ARTIFACTS, {
  biolum:     { name: "Pell bioluminescent", icon: "🟢", slot: "pell", boss: "algoritme", world: 2, stat: "saber", value: 0.15, skin: "biolum",
                desc: lvl => `L'ajolot brilla en la foscor, verd neó. +${Math.round(0.15 * tdArtMult(lvl) * 100)} % de saber guanyat als mons.` },
  banyes:     { name: "Banyes de cervatell", icon: "🦌", slot: "cap", boss: "algoritme", world: 102, stat: "slowAll", value: 0.06,
                desc: lvl => `Dues banyetes de cervatell entre les flors del cap: les distraccions van un ${Math.round(0.06 * tdArtMult(lvl) * 100)} % més lentes.` },
  // Món 3 (la data d'entrega / la riuada): la corona de LEDs de l'ajolot i la fona de vímet de la granoteta
  leds:       { name: "Corona de LEDs", icon: "💡", slot: "branquies", boss: "deadline", world: 3, stat: "range", value: 0.15,
                desc: lvl => `LEDs de colors per les branquies, que fan pampallugues com un rack de servidors. +${Math.round(0.15 * tdArtMult(lvl) * 100)} % d'abast.` },
  // Món 4 (el Ransomware / la processionària): la pell de núvol de l'ajolot i la corona de cendra de la granoteta
  nuvol:      { name: "Pell de núvol", icon: "☁️", slot: "pell", boss: "ransomware", world: 4, stat: "waveMana", value: 0.1, skin: "nuvol",
                desc: lvl => `L'ajolot es torna blanc i blau cel, amb la pell de cotó de núvol. +${Math.round(0.1 * tdArtMult(lvl) * 100)} % de maná a cada onada.` },
  cendra:     { name: "Corona de cendra", icon: "🌸", slot: "cap", boss: "ransomware", world: 104, stat: "dmg", value: 0.1,
                desc: lvl => `Branquetes cremades i flors que han tornat a nàixer després del foc. +${Math.round(0.1 * tdArtMult(lvl) * 100)} % de dany.` },
  fona:       { name: "Fona de vímet", icon: "🪃", slot: "ma", boss: "deadline", world: 103, stat: "rate", value: 0.12,
                desc: lvl => `Una fona de vímet trenat, amb una pedreta de riu a punt. +${Math.round(0.12 * tdArtMult(lvl) * 100)} % de velocitat d'atac.` },
});
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
  mana:  { name: "Concentració", icon: "🔮", desc: "+8 % de maná en passar cada onada", per: lvl => `+${8 * lvl} % de maná per onada`, base: 50, growth: 1.3, max: 30 },
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
// Probabilitats de l'altar. Normal: la mítica hi és però és minúscula. Amb un 8 o més en un examen final, el camp
// queda «potenciat» per sempre (td.boost): més èpiques, llegendàries i mítiques. (La mítica es regala igualment.)
const TD_RATES = {
  base:  { comu: 0.66, rar: 0.27, epic: 0.06, llegendari: 0.009, mitic: 0.001 },
  boost: { comu: 0.55, rar: 0.30, epic: 0.10, llegendari: 0.04,  mitic: 0.01 },
};

// Combat
const TD_BATTLE = {
  lives: 20, startMana: 100, upgradeCost: [0.8, 1.2, 1.8, 2.6], upgradeMult: [1, 1.35, 1.75, 2.2, 2.7], sellBack: 0.6,
  wavePause: 5, waveBonusSaber: 8, worldBonusSaber: 300, projSpeed: 950,
};
// Mons idle de 100 onades (com l'autoescola: no es perd mai el progrés). Les distraccions no donen maná: es guanya en passar
// cada onada (waveMana: base + per onada, ×(1 + 8 % per nivell de Concentració)). Si una onada es perd, es torna a fer tal com
// havia començat (criatures, maná). Cada 10 onades, una distracció gegant; els caps amb nom ixen a la 30 i a la 50 (cadascun
// sol), a la 70 junts i a la 100 junts i gegants. A partir de la 50: ×4, el mapa s'amplia i s'obri el món següent; fins a la
// 100, més saber.
const TD_IDLE = {
  waves: 100, waveMana: [30, 1.2], waveHp: 0.11, waveHp2: 0.0006, countGrow: 0.04, bossLives: 10, giantEvery: 10, giant: { size: 1.7, hp: 10, lives: 10, saber: 8 },
  bossWaves: { 30: [0], 50: [1], 70: [0, 1], 100: [0, 1] }, bigBoss: { size: 1.25, hp: 2 }, // a la 100, els caps encara més grans
  bossScrolls: { 30: 3, 50: 4, 70: 5, 100: 8 },    // pergamins de cada camp la primera vegada que cauen (per món i onada)
  fastAt: 50, extAt: 50, openAt: 50, lateSaber: 1.5, offlineMax: 2 * 3600, offlineBoost: 4,
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
  pestanyes:      { look: "Formiga reina",
                    lore: "Grossa i lenta, amb l'abdomen ple: mentre camina pel sender va deixant formigues obreres darrere seu, i cada una s'emporta una molleta del teu temps." },
  pestanyeta:     { look: "Formiga" },
  algoritme:      { look: "Papallona irisada",
                    lore: "Les ales li canvien de color segons com li dona la llum: ara blava, ara roja, ara verda. Cada color la fa feble a una cosa i forta contra una altra; mira quin porta abans de pegar." },
  reels:          { look: "Cranc de riu",
                    lore: "Un cranc americà que no para de multiplicar-se pel riu. La closca li aguanta els primers colps; quan se li trenca, fuig corrent de costat cap a l'aigua." },
  deadline:       { look: "La riuada",
                    lore: "Comença com un rierol que baixa tranquil i acaba portant-se'n tot: com més s'acosta, més aigua i més força. Si arriba a dalt, no hi ha qui l'aturi." },
  videojoc:       { look: "Llebre",
                    lore: "Corre per la cendra fent salts llarguíssims: ara la veus allà, ara ja és molt més avant. No para quieta ni un moment." },
  ransomware:     { look: "La processionària",
                    lore: "Una filera d'erugues que baixa del pi. Teixix un niu de seda damunt d'una criatura i la deixa embolicada fins que li fas prou mal a la filera." },
  diumenge:       { look: "Llop de la lluna",
                    lore: "Ix quan es fa fosc el diumenge i udola a la lluna: els deures que no has fet, l'examen de dilluns… Quan udola, tot el bosc arranca a córrer." },
};
const tdEnemy = id => (typeof tdRoom !== "undefined" && tdRoom === "forestal" && TD_FOREST_ENEMIES[id]) ? { ...TD_ENEMIES[id], ...TD_FOREST_ENEMIES[id] } : TD_ENEMIES[id];

const TD_WORLDS = [
  {
    id: 1, mode: "informatic", name: "Biblioteca Arcana", layout: "Serp",
    path: [[-60, 150], [1300, 150], [1300, 430], [300, 430], [300, 710], [1460, 710]],
    slots: [[420, 290], [720, 290], [1020, 290], [1450, 290], [160, 570], [600, 570], [900, 570], [1200, 570], [760, 840], [1120, 840]],
    crystal: [1500, 710], student: [110, 790],
    // a partir de l'onada 50 el mapa s'amplia: les distraccions entren per baix a l'esquerra i pugen per una columna nova
    ext: { pre: [[-360, 960], [-160, 960], [-160, 150]], slots: [[-290, 330], [-290, 690], [-40, 300], [-40, 560]], view: [-400, -100, 2020, 1136] },
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
  {
    // Món 2: el camí es partix en dos i torna a ajuntar-se abans del cristall; les distraccions es reparteixen
    id: 2, mode: "informatic", name: "Laboratori de Circuits", layout: "Bifurcació", hp: 1.25, mana: 80, needs: 1, // dos camins: més maná per a començar
    paths: [
      [[-60, 450], [300, 450], [300, 170], [1050, 170], [1050, 450], [1460, 450]],
      [[-60, 450], [300, 450], [300, 730], [1050, 730], [1050, 450], [1460, 450]],
    ],
    slots: [[160, 300], [160, 600], [500, 330], [820, 330], [500, 570], [820, 570], [660, 450], [1220, 300], [1220, 600], [1380, 640]],
    crystal: [1500, 450], student: [110, 800],
    ext: { pre: [[-360, 960], [-160, 960], [-160, 450]], slots: [[-290, 290], [-290, 650], [-40, 290], [-40, 640]], view: [-400, -100, 2020, 1136] },
    waves: [
      [["notificacio", 10, 0.7]],
      [["notificacio", 8, 0.6], ["pestanyes", 2, 3]],
      [["procrastinacio", 4, 1.8], ["son", 4, 1.4]],
      [["pestanyes", 3, 2.4], ["scroll", 6, 1]],
      [["meme", 8, 0.9], ["series", 1, 1], ["pestanyes", 3, 2]],
      [["pestanyes", 4, 2], ["procrastinacio", 5, 1.5], ["notificacio", 10, 0.4]],
      [["son", 6, 1], ["scroll", 8, 0.8], ["pestanyes", 3, 2]],
      [["meme", 10, 0.7], ["procrastinacio", 6, 1.3], ["pestanyes", 4, 1.8]],
      [["series", 1, 1], ["pestanyes", 4, 1.6], ["scroll", 10, 0.7]],
      [["notificacio", 14, 0.4], ["algoritme", 1, 1], ["pestanyes", 4, 1.6], ["procrastinacio", 6, 1.3]],
    ],
  },
  {
    // Món 3: la sala de servidors. El camí fa ziga-zaga entre les files de racks (columnes amunt i avall)
    id: 3, mode: "informatic", name: "Sala de Servidors", layout: "Ziga-zaga", hp: 1.45, mana: 60, needs: 2,
    path: [[-60, 140], [260, 140], [260, 780], [620, 780], [620, 140], [980, 140], [980, 780], [1340, 780], [1340, 450], [1460, 450]],
    slots: [[110, 460], [440, 300], [440, 620], [800, 300], [800, 620], [1160, 300], [1160, 620], [1470, 640], [1470, 260], [110, 280]],
    crystal: [1500, 450], student: [110, 790],
    ext: { pre: [[-360, 960], [-160, 960], [-160, 140]], slots: [[-290, 330], [-290, 690], [-40, 330], [-40, 620]], view: [-400, -100, 2020, 1136] },
    waves: [
      [["notificacio", 10, 0.7], ["reels", 2, 2.4]],
      [["reels", 5, 1.6], ["procrastinacio", 3, 2]],
      [["son", 5, 1.3], ["reels", 4, 1.6]],
      [["scroll", 8, 0.9], ["reels", 4, 1.4]],
      [["meme", 8, 0.9], ["algoritme", 1, 1], ["reels", 4, 1.5]],
      [["pestanyes", 4, 2], ["reels", 6, 1.2], ["notificacio", 12, 0.4]],
      [["procrastinacio", 6, 1.3], ["reels", 6, 1.1], ["son", 6, 1]],
      [["reels", 10, 0.9], ["meme", 8, 0.8]],
      [["pestanyes", 5, 1.6], ["scroll", 10, 0.7], ["reels", 6, 1]],
      [["notificacio", 14, 0.4], ["deadline", 1, 1], ["reels", 8, 1], ["procrastinacio", 6, 1.2]],
    ],
  },
  {
    // Món 4: el núvol. Dos camins que entren per llocs diferents (dalt i baix) i s'ajunten abans del cristall
    id: 4, mode: "informatic", name: "El Núvol", layout: "Doble entrada", hp: 1.3, mana: 170, needs: 3,
    paths: [
      [[-60, 150], [700, 150], [700, 450], [1180, 450], [1180, 700], [1460, 700]],
      [[-60, 760], [460, 760], [460, 450], [700, 450], [1180, 450], [1180, 700], [1460, 700]],
    ],
    slots: [[100, 450], [300, 300], [300, 600], [580, 300], [580, 600], [860, 300], [860, 600], [1040, 300], [1040, 600], [1320, 850]],
    crystal: [1500, 700], student: [1450, 180],
    // a la 50, cada camí s'allarga per fora (el de dalt baixa del cel; el de baix ve de més avall)
    ext: { pres: [[[-360, -60], [-160, -60], [-160, 150]], [[-360, 1000], [-160, 1000], [-160, 760]]], slots: [[-290, 330], [-290, 620], [-40, 330], [-40, 600]], view: [-400, -100, 2020, 1136] },
    waves: [
      [["notificacio", 12, 0.6], ["videojoc", 2, 2]],
      [["videojoc", 5, 1.5], ["reels", 3, 1.6]],
      [["procrastinacio", 4, 1.6], ["videojoc", 4, 1.4]],
      [["scroll", 8, 0.8], ["videojoc", 5, 1.2]],
      [["meme", 8, 0.8], ["deadline", 1, 1], ["videojoc", 4, 1.3]],
      [["pestanyes", 4, 1.8], ["videojoc", 6, 1.1], ["reels", 4, 1.2]],
      [["son", 6, 1], ["videojoc", 6, 1], ["procrastinacio", 6, 1.2]],
      [["videojoc", 10, 0.8], ["meme", 8, 0.7]],
      [["reels", 6, 1], ["scroll", 10, 0.6], ["videojoc", 6, 0.9]],
      [["notificacio", 16, 0.35], ["ransomware", 1, 1], ["videojoc", 8, 0.9], ["pestanyes", 4, 1.5]],
    ],
  },
  { id: 5, mode: "informatic", name: "Servidor Abissal", layout: "Doble entrada", soon: true },
];
// Mons del bosc: el primer té el mateix traçat i les mateixes onades que la Biblioteca, però és un sender entre arrels
// (fons a tdbBackground). Les distraccions són les mateixes, dibuixades com a coses del bosc (TD_FOREST_ENEMIES).
TD_WORLDS.push(
  { ...TD_WORLDS[0], id: 101, mode: "forestal", name: "Sendera de les Arrels" },
  { ...TD_WORLDS[1], id: 102, mode: "forestal", name: "La Pineda", needs: 101, hp: 1.15 }, // al bosc hi ha més criatures físiques, que les formigues resistixen
  { ...TD_WORLDS[2], id: 103, mode: "forestal", name: "El Riu", needs: 102, hp: 1.35, river: true }, // el mateix ziga-zaga, entre l'aigua i els ponts
  { ...TD_WORLDS[3], id: 104, mode: "forestal", name: "La Muntanya Cremada", needs: 103, hp: 1.25, burnt: true }, // els dos camins entre troncs cremats i brases


  { id: 105, mode: "forestal", name: "El Cor del Bosc", layout: "Doble entrada", soon: true },
);
// Un món s'obri quan s'ha superat el d'abans (needs)
// Un món s'obri quan el d'abans arriba a l'onada 50 (o, de les partides d'abans de les 100 onades, si ja l'havies superat)
const tdWorldShut = w => !!w.needs && !(typeof td !== "undefined" && (td.worlds?.[w.needs]?.clears > 0 || td.worlds?.[w.needs]?.best >= TD_IDLE.openAt));
const tdWorldNum = w => TD_WORLDS.filter(o => o.mode === w.mode).indexOf(w.base || w) + 1;
