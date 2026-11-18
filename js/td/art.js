// ===== ESTUDI: DIBUIXOS (defensors, distraccions, estudiant) =====
// Estil: símbols d'energia sobre fons fosc (com a «Animation vs. Math»): cada criatura és una construcció feta amb els
// símbols de la seua assignatura, en traços de neó (halo de color + tub de color + nucli blanc), surant damunt d'un cercle
// de runes. Sense ulls ni boques. Les peces menudes (classes `al` / `ar`) són el que dispara: en disparar ixen volant
// com a projectil i es tornen a formar (td.css). Totes: viewBox 0 0 120 120, base a y ≈ 108.
// Projectils (`proj`): dibuix menut centrat en 0,0 (≈ 20×20).

const TD_GLOW = { alg: "#9d8bff", prg: "#3fdc8a", maq: "#5ad8ff", mnt: "#8fd45a", pin: "#e8a64a", fau: "#4fd1c5", gold: "#ffc23f", myth: "#ff5ab0", bad: "#ff5a4a" };

// Traç de neó: halo ample i transparent + tub de color + nucli blanc
function tube(d, c, w = 7, extra = "") {
  return `<g fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra}>
    <path d="${d}" stroke="${c}" stroke-width="${w * 2.6}" opacity="0.18"/>
    <path d="${d}" stroke="${c}" stroke-width="${w}"/>
    <path d="${d}" stroke="#fff" stroke-width="${Math.max(1.2, w * 0.32)}" opacity="0.9"/></g>`;
}
// Text-símbol amb el mateix acabat de neó
function glyphText(x, y, size, t, c, font = "ui-monospace, Consolas, monospace", extra = "") {
  const base = `x="${x}" y="${y}" font-size="${size}" font-weight="800" text-anchor="middle" font-family="${font}" ${extra}`;
  return `<text ${base} fill="none" stroke="${c}" stroke-width="${size * 0.22}" opacity="0.2" stroke-linejoin="round">${t}</text>
    <text ${base} fill="#fff" stroke="${c}" stroke-width="${size * 0.07}" paint-order="stroke">${t}</text>`;
}
// Cercle de runes de la base (gira a poc a poc) i nucli d'energia
const runeBase = c => `<g class="rune"><ellipse cx="60" cy="108" rx="34" ry="8" fill="${c}" opacity="0.12"/>
  <ellipse cx="60" cy="108" rx="34" ry="8" fill="none" stroke="${c}" stroke-width="1.6" stroke-dasharray="3 5" opacity="0.8"/>
  <ellipse cx="60" cy="108" rx="24" ry="5.5" fill="none" stroke="${c}" stroke-width="1" opacity="0.5"/></g>`;
const core = (x, y, c, r = 4.5) => `<g class="core"><circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="${c}" opacity="0.25"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/></g>`;
const sparks = c => `<g class="sparks">${[[30, 60], [92, 50], [84, 92], [38, 92]].map(([x, y], i) =>
  `<circle cx="${x}" cy="${y}" r="1.6" fill="${c}" style="animation-delay:${i * 0.4}s"/>`).join("")}</g>`;

const GA = TD_GLOW.alg, GP = TD_GLOW.prg;
const GM = TD_GLOW.mnt, GN = TD_GLOW.pin, GB = "#c98a4a"; // fulla, ambre i fusta
const GQ = TD_GLOW.maq; // blau elèctric
const GF = TD_GLOW.fau; // turquesa de riu
// Peces de la Màquina: la bola de càrrega de la Tesla (amb espurnes) i un electró (e⁻) del condensador
const bolaTesla = (x, y) => `<g transform="translate(${x} ${y})"><circle r="13" fill="${GQ}" opacity="0.2"/><circle r="6.5" fill="#e8fbff" stroke="${GQ}" stroke-width="2.4"/>
  ${tube("M7 -2 L11 -6 L10 -1 L15 -4 M-7 2 L-11 5 L-10 0 L-15 3", "#e8fbff", 1.4)}</g>`;
const electro = (x, y) => `<g transform="translate(${x} ${y})"><circle r="10" fill="${GQ}" opacity="0.22"/><circle r="5" fill="#e8fbff" stroke="${GQ}" stroke-width="2"/>${tube("M-2.4 0 H2.4", GQ, 1.8)}</g>`;
// Ona quadrada del rellotge de CPU (a la cara del cristall)
const ONA_CPU = tube("M40 66 H46 V52 H54 V66 H62 V52 H70 V66 H76", "#e8fbff", 2.6);
// Resistència: el cos (puntes bombades i cintura més estreta) i una banda de color (x al centre, des de y, alta h)
const RES_BODY = "M34 44 C22 44 22 68 34 68 C40 68 42 65 48 65 H72 C78 65 80 68 86 68 C98 68 98 44 86 44 C80 44 78 47 72 47 H48 C42 47 40 44 34 44 Z";
const banda = (x, y, h, c, edge = "#fff") => `<rect x="${x - 3.2}" y="${y}" width="6.4" height="${h}" rx="2" fill="${c}" stroke="${edge}" stroke-width="1" stroke-opacity="0.7"/>`;
// Peces de Fauna (centrades a x, y)
const LENT = (x, y) => `<g><circle cx="${x}" cy="${y}" r="6" fill="#bff7f0" opacity="0.35"/><path d="M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2} Z" fill="#fff"/></g>`;
const HAM = (x, y) => `<g>${tube(`M${x} ${y - 8} V${y + 3} Q${x} ${y + 9} ${x - 6} ${y + 9} Q${x - 11} ${y + 9} ${x - 11} ${y + 3} L${x - 8} ${y + 5}`, "#e8fbff", 2.4)}<circle cx="${x}" cy="${y - 9}" r="2.2" fill="none" stroke="#e8fbff" stroke-width="1.6"/></g>`;
const ABELLA = (x, y) => `<g><ellipse cx="${x - 2}" cy="${y - 6}" rx="5" ry="3.4" fill="#e8fbff" opacity="0.75" transform="rotate(-25 ${x - 2} ${y - 6})"/><ellipse cx="${x + 3}" cy="${y - 6}" rx="5" ry="3.4" fill="#e8fbff" opacity="0.75" transform="rotate(25 ${x + 3} ${y - 6})"/>
  <ellipse cx="${x}" cy="${y}" rx="7.5" ry="5.2" fill="#ffc23f"/><path d="M${x - 2} ${y - 5} v10 M${x + 2.5} ${y - 5} v10" stroke="#1a1204" stroke-width="2"/><circle cx="${x - 6}" cy="${y}" r="2.6" fill="#1a1204"/></g>`;
// Peces del bosc (centrades en x, y): pinya, flama, gla, sàmara, anella de marcatge i fulla
const pinya = (x, y) => `<g><ellipse cx="${x}" cy="${y}" rx="11" ry="13" fill="${GB}" opacity="0.2"/><ellipse cx="${x}" cy="${y}" rx="5.6" ry="8" fill="#5a3412" stroke="${GB}" stroke-width="2.2"/>
  <path d="M${x - 5} ${y - 3} L${x} ${y + 1} L${x + 5} ${y - 3} M${x - 5} ${y + 2} L${x} ${y + 6} L${x + 5} ${y + 2}" stroke="#ffd9a0" stroke-width="1.3" fill="none"/>${tube(`M${x} ${y - 8} V${y - 12}`, GB, 2)}</g>`;
const flama = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M0 -14 C9 -4 10 6 0 12 C-10 6 -9 -4 0 -14 Z" fill="#ff8a3a" opacity="0.3" transform="scale(1.6)"/>
  <path d="M0 -14 C9 -4 10 6 0 12 C-10 6 -9 -4 0 -14 Z" fill="#ff8a3a" stroke="#ffc23f" stroke-width="2"/><path d="M0 -4 C4 1 4 6 0 9 C-4 6 -4 1 0 -4 Z" fill="#fff6c8"/></g>`;
const gla = (x, y) => `<g><circle cx="${x}" cy="${y + 2}" r="12" fill="${GM}" opacity="0.18"/><path d="M${x - 6} ${y} Q${x - 6} ${y + 12} ${x} ${y + 13} Q${x + 6} ${y + 12} ${x + 6} ${y} Z" fill="#7a5a1a" stroke="#e8c070" stroke-width="2"/>
  <path d="M${x - 8} ${y} Q${x} ${y - 7} ${x + 8} ${y} Z" fill="#4a3a1a" stroke="${GB}" stroke-width="2" stroke-linejoin="round"/>${tube(`M${x} ${y - 4} V${y - 8}`, GB, 1.6)}</g>`;
// Sàmara d'auró: la llavor (nou) i l'ala ampla, amb els nervis que ixen de la nou i s'obrin cap a la vora
const samara = (x, y, dir = 1, k = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${dir * k} ${k})">
  <path d="M0 0 C2 -16 10 -34 24 -44 C34 -40 36 -30 30 -20 C24 -10 12 -4 0 0 Z" fill="${GN}" opacity="0.24"/>
  ${tube("M0 0 C2 -16 10 -34 24 -44 C34 -40 36 -30 30 -20 C24 -10 12 -4 0 0", GN, 2.6)}
  ${tube("M3 -3 Q12 -20 26 -38 M5 -6 Q16 -16 30 -24 M4 -4 Q14 -26 20 -40", GN, 1.1, 'opacity="0.6"')}
  <ellipse cx="0" cy="0" rx="6" ry="7.5" fill="#6a4a1a" stroke="#ffd9a0" stroke-width="2" transform="rotate(-20)"/></g>`;
// Anella de marcatge (de les que es posen a la pota dels ocells): un cilindre de metall curt amb la plaqueta del número
const anella = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><ellipse rx="15" ry="11" fill="${TD_GLOW.gold}" opacity="0.14"/>
  <path d="M-11 -5 V5 A11 4.5 0 0 0 11 5 V-5" fill="#9aa3b0" stroke="#eef2f7" stroke-width="2"/>
  <ellipse cy="-5" rx="11" ry="4.5" fill="#2a2f38" stroke="#eef2f7" stroke-width="2"/>
  <path d="M-6 2.5 H-1 M2 3 H7 M-4 6 H4" stroke="#3a4250" stroke-width="1.4" stroke-linecap="round"/></g>`;
// Meitat de l'agulla de la brúixola: triangle de 24 que ix del punt (x, y) cap amunt (rot gira al voltant d'eixe punt)
const agulla = (fill, edge, x, y, rot = 0) => `<path d="M${x} ${y - 24} L${x + 7} ${y} H${x - 7} Z" fill="${fill}" stroke="${edge}" stroke-width="2" stroke-linejoin="round" transform="rotate(${rot} ${x} ${y})"/>`;
const fulla = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})">${tube("M-10 0 Q0 -10 10 0 Q0 10 -10 0 M-10 0 H8", GM, 2.6)}</g>`;

const TD_ART = {
  // ---------------------------------------------------------------- ÀLGEBRA LINEAL (violeta)
  // Sumador: un + gran d'energia; els dos + menuts de les espatles són els que llança
  sumador: {
    svg: `${runeBase(GA)}<g class="b">${tube("M60 42 V100 M31 71 H89", GA, 9)}${core(60, 71, GA)}</g>
      <g class="al">${tube("M30 22 V42 M20 32 H40", GA, 4)}</g><g class="ar">${tube("M90 22 V42 M80 32 H100", GA, 4)}</g>${sparks(GA)}`,
    proj: tube("M0 -7 V7 M-7 0 H7", GA, 3.4), throw: { l: [30, 32], r: [90, 32] },
  },
  // Escalar ×2: una × que gira sense parar (més ràpid quan dispara); llança el 2 de l'exponent
  // Vector: la lletra v amb la fletxa damunt; la fletxa és la llança que travessa
  vector: {
    // en repòs: la V i la fletxa per damunt. En disparar, la fletxa es posa dins de la V, que gira per a
    // apuntar (.aim), i ix disparada
    svg: `${runeBase(GA)}<g class="aim"><g class="b">${tube("M38 56 L60 100 L82 56", GA, 9)}${core(60, 100, GA, 3.6)}</g>
      <g class="al">${tube("M37 32 H79 M70 24 L81 32 L70 40", GA, 5)}</g></g>${sparks(GA)}`,
    proj: tube("M-15 0 H12 M4 -7 L13 0 L4 7", GA, 4.6), throw: { l: [58, 32] },
  },
  // Transposada: una T que gira 90° (es transposa) en disparar; llança un raig que rebota
  // Determinant |A|: la A entre les dues barres d'or (que llança com a colps), amb una aurèola
  determinant: {
    svg: `${runeBase(TD_GLOW.gold)}<g class="b">${tube("M44 102 L60 40 L76 102 M50 82 H70", GA, 8)}
      <g class="halo">${tube("M44 26 Q60 18 76 26 Q60 32 44 26", TD_GLOW.gold, 2.6)}</g>${core(60, 62, TD_GLOW.gold, 3.6)}</g>
      <g class="al">${tube("M24 34 V102", TD_GLOW.gold, 7)}</g><g class="ar">${tube("M96 34 V102", TD_GLOW.gold, 7)}</g>${sparks(TD_GLOW.gold)}`,
    proj: tube("M0 -30 V30", TD_GLOW.gold, 6), projScale: 1.15, throw: { l: [24, 68], r: [96, 68] },
  },
  // Diagonalitzador λ: una lambda gegant que camina, amb la matriu diagonal orbitant-la
  lambda: {
    svg: `${runeBase(TD_GLOW.myth)}<g class="b">${tube("M44 28 L86 102 M65 64 L38 102", TD_GLOW.myth, 10)}${core(44, 28, TD_GLOW.myth, 5)}</g>
      <g class="al"><g class="orbit">${tube("M84 30 H104 V50 H84 Z", GA, 2.6)}${[0, 1, 2].map(i => `<circle cx="${88 + i * 6}" cy="${34 + i * 6}" r="2.2" fill="#fff"/>`).join("")}</g></g>${sparks(TD_GLOW.myth)}`,
    proj: `${tube("M-10 -10 H10 V10 H-10 Z", GA, 2.6)}${[-6, 0, 6].map(d => `<circle cx="${d}" cy="${d}" r="2.2" fill="#fff"/>`).join("")}`, throw: { l: [94, 40] },
  },

  // ---------------------------------------------------------------- PROGRAMACIÓ I (verd terminal)
  // Punt i coma: el punt i la coma, i dos punts que suren als costats i són la munició
  puntcoma: {
    svg: `${runeBase(GP)}<g class="b"><g class="hop"><circle cx="60" cy="46" r="20" fill="${GP}" opacity="0.15"/><circle cx="60" cy="46" r="9" fill="#fff" stroke="${GP}" stroke-width="5"/>
      ${tube("M62 72 C70 74 70 86 64 94 C60 99 54 102 48 104", GP, 8)}</g></g>
      <g class="al"><circle cx="30" cy="54" r="5" fill="#fff" stroke="${GP}" stroke-width="3"/></g>
      <g class="ar"><circle cx="90" cy="54" r="5" fill="#fff" stroke="${GP}" stroke-width="3"/></g>${sparks(GP)}`,
    proj: `<circle r="8" fill="${GP}" opacity="0.25"/><circle r="4.5" fill="#fff" stroke="${GP}" stroke-width="2.4"/>`, throw: { l: [30, 54], r: [90, 54] },
  },
  // Comentari //: dues barres i línies de text que s'apaguen; llança barres que alenteixen
  // Bucle for: un anell-fletxa que gira cada ràfega, amb la paraula for dins
  // If / else: el rombe de decisió amb l'interrogant; les branques sí / no són els braços
  ifelse: {
    svg: `${runeBase(GP)}<g class="b">${tube("M60 36 L90 68 L60 100 L30 68 Z", GP, 7)}${glyphText(60, 78, 28, "?", GP)}</g>
      <g class="al">${tube("M28 62 L12 46 M12 46 H22 M12 46 V56", "#7fd49c", 4)}</g>
      <g class="ar">${tube("M92 62 L108 46 M108 46 H98 M108 46 V56", "#ff8a8a", 4)}</g>${sparks(GP)}`,
    proj: tube("M-8 8 L8 -8 M8 -8 H0 M8 -8 V0", "#7fd49c", 4), projR: tube("M-8 8 L8 -8 M8 -8 H0 M8 -8 V0", "#ff8a8a", 4), throw: { l: [18, 52], r: [102, 52] },
  },
  // Compilador: </> gegant amb un engranatge d'energia damunt; la barra és el seu bastó
  compilador: {
    svg: `${runeBase(TD_GLOW.gold)}<g class="al">${tube("M44 48 L22 72 L44 96 M76 48 L98 72 L76 96", GP, 8)}</g><g class="b">
      <g class="gear"><circle cx="60" cy="28" r="12" fill="none" stroke="${TD_GLOW.gold}" stroke-width="6" stroke-dasharray="4.4 3"/><circle cx="60" cy="28" r="7" fill="none" stroke="#fff" stroke-width="2"/></g></g>
      ${tube("M68 46 L52 102", TD_GLOW.gold, 6)}</g>${sparks(TD_GLOW.gold)}`,
    proj: tube("M-8 -12 L-20 0 L-8 12 M8 -12 L20 0 L8 12", GP, 5), projScale: 1, throw: { l: [60, 72] },
  },
  // Stack Overflow: una pila de blocs d'energia que trontolla i vessa espurnes per dalt
  stack: {
    svg: `${runeBase(TD_GLOW.myth)}<g class="b">${[0, 1, 2, 3].map(i =>
        `<g class="blk" style="animation-delay:${i * 0.15}s">${tube(`M${36 + (i % 2) * 4} ${98 - i * 17} H${84 - (i % 2) * 4}`, i === 3 ? "#ff8a1f" : GP, 9)}</g>`).join("")}
      <g class="flame">${[[52, 36], [60, 28], [68, 34], [56, 22], [65, 18]].map(([x, y], i) =>
        `<circle cx="${x}" cy="${y}" r="${3.4 - i * 0.4}" fill="#ffe27a" stroke="#ff8a1f" stroke-width="2" style="animation-delay:${i * 0.12}s"/>`).join("")}</g></g>`,
    proj: `<circle r="9" fill="#ff8a1f" opacity="0.3"/><circle r="5" fill="#ffe27a" stroke="#ff8a1f" stroke-width="2"/>`, throw: { c: [60, 28] },
  },

  // ================================================================ MÀQUINA (electrònica): blau elèctric
  // Bobina de Tesla: base, el cilindre amb el bobinat de fil en espiral i el toroide de dalt; la bola de càrrega que
  // sura damunt del toroide és el que llança (en tocar, el raig salta de distracció en distracció)
  tesla: {
    svg: `${runeBase(TD_GLOW.gold)}<g class="b">${tube("M38 98 H82 V106 H38 Z", GQ, 5)}${tube("M50 50 V98 M70 50 V98", GQ, 4)}
      ${Array.from({ length: 12 }, (_, i) => tube(`M50 ${54 + i * 3.6} L70 ${52 + i * 3.6}`, "#b8f0ff", 1.4, 'opacity="0.8"')).join("")}
      <g class="torus">${tube("M38 44 C38 36 82 36 82 44 C82 52 38 52 38 44 Z", GQ, 6)}${tube("M50 44 C50 41 70 41 70 44 C70 47 50 47 50 44 Z", GQ, 2)}</g>
      ${core(60, 76, GQ, 3.2)}</g>
      <g class="al">${bolaTesla(60, 22)}</g>${sparks(GQ)}`,
    proj: bolaTesla(0, 0), throw: { l: [60, 22] },
  },
  // Rellotge de CPU: el cristall de quars de la placa (la càpsula de metall ovalada amb les dues potes) i, a la cara,
  // l'ona quadrada del rellotge: és el que llança a cada tic (baixa al camí) i es torna a dibuixar
  rellotge: {
    svg: `${runeBase(TD_RARITIES.epic.color)}<g class="b">${tube("M50 92 V104 M70 92 V104", "#d8dde6", 3)}
      <rect x="34" y="30" width="52" height="62" rx="20" fill="#12303f"/>${tube("M54 30 H66 A20 20 0 0 1 86 50 V72 A20 20 0 0 1 66 92 H54 A20 20 0 0 1 34 72 V50 A20 20 0 0 1 54 30 Z", GQ, 4.4)}
      ${tube("M44 40 H76", GQ, 1.4, 'opacity="0.5"')}${core(60, 82, GQ, 2.4)}
      <g class="al">${ONA_CPU}</g></g>${sparks(GQ)}`,
    proj: ONA_CPU, throw: { l: [60, 60] },
  },
  // Resistència: el cilindre amb les puntes bombades i les potes doblegades cap avall (punxada a la placa), amb les
  // bandes de colors de debò (marró, negre, roig, or = 1 kΩ). Llança la roja i la marró, que es tornen a pintar
  resistencia: {
    svg: `${runeBase(GQ)}<g class="b">${tube("M26 56 H20 V100 M94 56 H100 V100", "#d8dde6", 3)}
      <path d="${RES_BODY}" fill="#12303f"/>${tube(RES_BODY, GQ, 4)}
      ${banda(52, 47.5, 17, "#2a2f38", GQ)}${banda(82, 45.5, 21, TD_GLOW.gold)}${core(58, 56, GQ, 2)}
      <g class="al">${banda(64, 47.5, 17, "#ff5a4a")}</g><g class="ar">${banda(38, 45, 22, "#c97a3a")}</g></g>${sparks(GQ)}`,
    proj: banda(0, -8.5, 17, "#ff5a4a"), projR: banda(0, -11, 22, "#c97a3a"), throw: { l: [64, 56], r: [38, 56] },
  },
  // Condensador: les dues plaques paral·leles amb els fils (com el símbol del circuit), + a una i − a l'altra; entre les
  // plaques es veu com puja la càrrega (--q). No dispara: es carrega com un canó i, ple, llança l'electró gran
  condensador: {
    svg: `${runeBase(TD_GLOW.myth)}<g class="b">${tube("M22 70 H44 M76 70 H98 M22 70 V100 M98 70 V100", GQ, 3.4)}
      <rect class="charge" x="47" y="40" width="26" height="58" rx="2" fill="${GQ}" opacity="0.35"/>
      ${tube("M45 36 V102", GQ, 7)}${tube("M75 36 V102", GQ, 7)}
      ${tube("M30 52 H38 M34 48 V56", "#ffffff", 2.4)}${tube("M82 52 H90", "#ffffff", 2.4)}
      ${core(60, 108, TD_GLOW.myth, 3.4)}
      <g class="arc">${tube("M47 50 L54 56 L50 61 L58 66 L53 72 L60 78 L56 84 L66 90 L73 96", "#e8fbff", 1.6)}${tube("M73 44 L66 50 L70 56 L62 60", "#b8f0ff", 1.2)}</g>
      <g class="al"><g class="q">${electro(0, 0)}</g></g></g>${sparks(TD_GLOW.myth)}`,
    proj: `<g transform="scale(1.6)">${electro(0, 0)}</g>`, throw: { c: [60, 68] },
  },

  // ================================================================ FORESTAL: bioluminescència (verd fulla i ambre)
  // Mateix acabat de neó, però fet de coses del bosc. Les peces que llancen (al / ar) es tornen a formar al cos.
  // Pi: la silueta del pi a capes amb el tronc; les dues pinyes que li pengen són les que llança
  pi: {
    svg: `${runeBase(GM)}<g class="b"><g class="sway">${tube("M60 16 L76 38 H67 L84 60 H74 L92 84 H28 L46 60 H36 L53 38 H44 Z", GM, 6)}
      ${tube("M52 50 L60 44 L68 50 M46 72 L60 64 L74 72", GM, 2.4, 'opacity="0.7"')}</g>${tube("M60 84 V104", GB, 7)}${core(60, 76, GM, 3.4)}</g>
      <g class="al">${pinya(36, 68)}</g><g class="ar">${pinya(84, 68)}</g>${sparks(GM)}`,
    proj: pinya(0, 0), throw: { l: [36, 68], r: [84, 68] },
  },
  // ---- Fauna
  // Prismàtics: els binocles damunt d'un trípode, amb les dues lents; el reflex de cada lent és el que llança
  prismatics: {
    svg: `${runeBase(GF)}<g class="b">${tube("M60 74 L42 104 M60 74 L78 104 M60 74 V104", GB, 3)}
      ${tube("M36 30 h16 M68 30 h16", GF, 3)}<rect x="37" y="26" width="14" height="8" rx="3" fill="#0d2a2c"/><rect x="69" y="26" width="14" height="8" rx="3" fill="#0d2a2c"/>
      <rect x="30" y="34" width="28" height="42" rx="13" fill="#0d2a2c"/><rect x="62" y="34" width="28" height="42" rx="13" fill="#0d2a2c"/>
      ${tube("M43 34 h2 a13 13 0 0 1 13 13 v16 a13 13 0 0 1 -13 13 h-2 a13 13 0 0 1 -13 -13 v-16 a13 13 0 0 1 13 -13 Z M75 34 h2 a13 13 0 0 1 13 13 v16 a13 13 0 0 1 -13 13 h-2 a13 13 0 0 1 -13 -13 v-16 a13 13 0 0 1 13 -13 Z", GF, 3.4)}
      ${tube("M57 46 H63 M57 62 H63", GF, 3)}${tube("M44 58 m-11 0 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 M76 58 m-11 0 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0", "#bff7f0", 2.2)}
      ${core(60, 80, GF, 2.6)}</g>
      <g class="al">${LENT(44, 58)}</g><g class="ar">${LENT(76, 58)}</g>${sparks(GF)}`,
    proj: LENT(0, 0), throw: { l: [44, 58], r: [76, 58] },
  },
  // Canya de pescar: la canya inclinada amb el rodet a baix i l'ham penjant del fil a la punta (.tip: d'on ix el fil)
  canya: {
    svg: `${runeBase(GF)}<g class="b">${tube("M30 100 L98 22", GB, 4.4)}${tube("M44 84 l6 4 M60 66 l6 4 M76 48 l6 4", GF, 2.2)}
      ${tube("M40 92 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0", GF, 3)}${tube("M40 92 l6 -4", "#bff7f0", 2)}
      <circle class="tip" cx="98" cy="22" r="1.5" fill="#bff7f0"/><path class="fil" d="M98 22 V50" stroke="#bff7f0" stroke-width="1.2" opacity="0.8"/>${core(40, 92, GF, 2.4)}</g>
      <g class="al">${HAM(98, 58)}</g>${sparks(GF)}`,
    proj: HAM(0, 0), throw: { l: [98, 58] },
  },
  // Rusc d'abelles: el rusc de palla (anells que s'estrenyen cap amunt) penjat d'una branca, amb la porteta;
  // les dues abelles que volen al voltant són les que ix a picar
  rusc: {
    svg: `${runeBase(GF)}<g class="b">${tube("M18 22 Q60 14 104 24", GB, 4)}${tube("M60 18 V28", GB, 3)}
      <path d="M60 28 C80 28 90 48 90 70 C90 90 78 100 60 100 C42 100 30 90 30 70 C30 48 40 28 60 28 Z" fill="#3a2a10"/>
      ${[40, 52, 64, 76, 88].map((y, i) => tube(`M${36 - (i === 0 ? -6 : 0)} ${y} Q60 ${y + 6} ${84 + (i === 0 ? -6 : 0)} ${y}`, "#ffc23f", 2.6, 'opacity="0.85"')).join("")}
      <ellipse cx="60" cy="84" rx="7" ry="6" fill="#120c04"/>${tube("M53 84 a7 6 0 1 1 14 0", GF, 1.6)}${core(60, 60, "#ffc23f", 2.4)}</g>
      <g class="al">${ABELLA(24, 56)}</g><g class="ar">${ABELLA(98, 48)}</g>${sparks("#ffc23f")}`,
    proj: ABELLA(0, 0), throw: { l: [24, 56], r: [98, 48] },
  },
  // Cérvol de la brama: un cérvol de llum de perfil (mira a l'esquerra), amb la cornamenta gran que s'encén quan brama
  cervol: {
    svg: `${runeBase(TD_GLOW.myth)}<g class="b">
      ${tube("M44 64 C56 58 80 58 92 64 C98 70 96 80 88 82 C74 86 56 86 46 82 C40 78 40 70 44 64 Z", GF, 3.6)}
      ${tube("M50 82 L48 104 M58 84 L60 104 M80 84 L78 104 M88 80 L92 104", GF, 3)}${tube("M92 64 Q100 62 98 72", GF, 2.4)}
      <g class="cap">${tube("M46 66 L34 42 M40 66 L30 46", GF, 3.4)}${tube("M34 42 C30 38 22 38 16 42 C14 46 18 48 24 48 L30 46", GF, 3.4)}
        ${tube("M30 38 l-4 -6", GF, 2)}<circle cx="17" cy="44" r="1.6" fill="#fff"/>
        <g class="antlers">${tube("M32 36 C30 26 26 18 18 12 M28 24 L20 22 M30 30 L22 32 M36 36 C40 26 46 20 54 16 M44 24 L50 28 M40 30 L48 32 M50 18 L56 10", "#e8ffd8", 2.8)}</g></g>
      ${core(50, 70, TD_GLOW.myth, 2.6)}</g>${sparks(TD_GLOW.myth)}`,
    proj: "",
  },
  // Anells del tronc: la secció d'un tronc dreta, amb l'escorça i els anells que s'encenen; l'anell del mig ix volant
  anells: {
    svg: `${runeBase(GM)}<g class="b">${tube("M60 26 C84 26 98 42 98 64 C98 88 82 102 60 102 C36 102 22 86 22 64 C22 42 38 26 60 26 Z", GB, 8)}
      <g class="rings">${tube("M60 37 A27 27 0 1 1 59.9 37", GM, 3)}${tube("M60 55 A9 9 0 1 1 59.9 55", GM, 2.6)}</g>
      ${tube("M66 40 L74 30", GB, 2.6)}${core(60, 64, GM, 3.4)}</g>
      <g class="al">${tube("M60 46 A18 18 0 1 1 59.9 46", "#e8ffb0", 3.4)}</g>${sparks(GM)}`,
    proj: tube("M0 -12 A12 12 0 1 1 -0.1 -12", "#e8ffb0", 3.6), throw: { c: [60, 64] },
  },
  // Contrafoc: el bidó de goteig dels incendis controlats (dipòsit, nansa i bec corbat); la flama del bec és el que tira
  contrafoc: {
    svg: `${runeBase(TD_GLOW.gold)}<g class="b">${tube("M40 52 H74 V100 H40 Z", "#ff8a3a", 7)}${tube("M44 52 V40 Q57 30 70 40 V52", "#ff8a3a", 4)}
      ${tube("M74 60 Q92 58 94 38", "#ffc23f", 4.4)}${tube("M46 66 H68 M46 80 H68", "#ff8a3a", 2, 'opacity="0.6"')}${core(57, 88, "#ffc23f", 3.4)}</g>
      <g class="al flicker">${flama(94, 28, 1.1)}</g>${sparks("#ff8a3a")}`,
    proj: flama(0, 0, 0.9), throw: { l: [94, 28] },
  },
  // Carrasca mil·lenària: tronc retorçut, capçada de fulles lobulades i arrels; la gla que penja és la que deixa caure
  carrasca: {
    svg: `${runeBase(TD_GLOW.myth)}<g class="b">${tube("M53 104 Q57 88 50 72 M67 104 Q63 88 72 70 M60 96 V74 M53 104 Q42 104 34 109 M67 104 Q78 104 86 109", GB, 6)}
      <g class="sway">${tube("M30 56 Q20 42 34 32 Q34 16 52 18 Q60 8 70 18 Q88 16 88 32 Q102 42 92 56 Q98 70 82 70 Q72 78 60 70 Q48 78 38 70 Q22 70 30 56 Z", GM, 6)}
      ${[[44, 42, -30], [62, 32, 10], [78, 46, 40], [54, 56, -10], [70, 58, 20]].map(([x, y, r]) => tube(`M${x - 6} ${y} Q${x} ${y - 6} ${x + 6} ${y} Q${x} ${y + 6} ${x - 6} ${y}`, GM, 2, `transform="rotate(${r} ${x} ${y})" opacity="0.8"`)).join("")}</g>
      ${core(60, 44, TD_GLOW.myth, 4)}</g>
      <g class="al">${gla(42, 80)}</g>${sparks(TD_GLOW.myth)}`,
    proj: gla(0, 0), throw: { l: [42, 80] },
  },
  // Brúixola: la caixa redona amb les marques. L'agulla té dues meitats iguals, la roja i la blanca: gira perquè la
  // que toca dispare apunte a l'enemic (la blanca ha de fer mitja volta) i la meitat llançada torna a créixer
  bruixola: {
    svg: `${runeBase(GN)}<g class="b">${tube("M60 34 A30 30 0 1 1 59.9 34", GN, 6)}
      ${tube("M60 40 V46 M60 82 V88 M36 64 H42 M78 64 H84", GN, 2.4)}${tube("M60 26 V34", GN, 4)}</g>
      <g class="aim"><g class="al">${agulla("#ff5a4a", "#ffd0c4", 60, 64)}</g><g class="ar">${agulla("#e9eef5", "#ffffff", 60, 64, 180)}</g>${core(60, 64, GN, 3)}</g>${sparks(GN)}`,
    proj: agulla("#ff5a4a", "#ffd0c4", -12, 0, 90), projR: agulla("#e9eef5", "#ffffff", -12, 0, 90), throw: { l: [60, 52], r: [60, 76] },
  },
  // Sàmara: dues llavors alades d'auró unides pel peduncle; la de l'esquerra vola girant fins a l'altra punta del mapa
  samara: {
    svg: `${runeBase(GN)}<g class="b">${tube("M60 82 Q62 94 60 104", GB, 3)}${core(60, 82, GN, 3)}</g>
      <g class="al"><g class="flutter">${samara(56, 80, -1, 1.05, -4)}</g></g><g class="ar"><g class="flutter">${samara(64, 80, 1, 1.05, 4)}</g></g>${sparks(GN)}`,
    // en l'aire gira en horitzontal com un helicòpter: la llavor davall i l'ala que fa voltes al seu voltant (vista de
    // costat, l'ala passa d'un costat a l'altre i s'estreny quan està de cara)
    proj: `<g class="samara-spin">${samara(0, 0, -1, 0.8, 18)}</g>`,
    projR: `<g class="samara-spin rev">${samara(0, 0, 1, 0.8, -18)}</g>`, throw: { l: [44, 58], r: [76, 58] },
  },
  // Anellador: una ploma gran amb l'anella al cànem; les dues anelles amb plaqueta dels costats són les que llança
  anellador: {
    svg: `${runeBase(TD_GLOW.gold)}<g class="b">${tube("M60 104 V26", "#fff3d8", 3)}
      ${tube("M60 26 Q40 44 44 84 L60 92 Q78 72 74 44 Q70 32 60 26 Z", GN, 5)}
      ${[40, 52, 64, 76].map(y => tube(`M60 ${y} L${48 + (y - 40) * 0.05} ${y + 8} M60 ${y} L${71 - (y - 40) * 0.05} ${y + 6}`, GN, 1.6, 'opacity="0.75"')).join("")}
      ${tube("M50 98 Q60 92 70 98 Q60 104 50 98", TD_GLOW.gold, 3)}${core(60, 58, TD_GLOW.gold, 3.4)}</g>
      <g class="al">${anella(30, 52, 0.8)}</g><g class="ar">${anella(90, 52, 0.8)}</g>${sparks(TD_GLOW.gold)}`,
    proj: anella(0, 0, 0.8), throw: { l: [30, 52], r: [90, 52] },
  },
  // Projecte integrador: el quadern de camp obert (en V) amb el pla dibuixat; al voltant orbiten les peces de tots
  // els mòduls (fulla, anella i flama), i és això el que llança
  projecte: {
    svg: `${runeBase(TD_GLOW.myth)}<g class="b">${tube("M60 58 L26 50 L26 92 L60 102 L94 92 L94 50 Z M60 58 V102", "#fff3d8", 4)}
      ${tube("M34 62 L42 56 L50 64 M34 76 Q42 70 52 78", GM, 2.2)}${tube("M77 62 L80 72 L90 75 L80 78 L77 88 L74 78 L64 75 L74 72 Z", GN, 2)}
      ${core(60, 80, TD_GLOW.myth, 3.6)}</g>
      <g class="al"><g class="orbit">${fulla(60, 22)}${anella(92, 42, 0.7)}${flama(28, 40, 0.6)}</g></g>${sparks(TD_GLOW.myth)}`,
    proj: `${fulla(-6, -4, 0.7)}${anella(8, 6, 0.55)}`, throw: { c: [60, 36] },
  },
};

// ---------------------------------------------------------------- DISTRACCIONS: icones corruptes, en roig i colors apagats
// viewBox 0 0 100 100, base a y ≈ 96
const TD_ENEMY_GLOW = { notificacio: "#ffb347", procrastinacio: "#c7a4ff", son: "#7fb8ff", scroll: "#ff8a6a", meme: "#ffd23f", series: "#ff5a4a", diumenge: "#7fb8ff" };
const TD_ENEMY_ART = {
  notificacio: `<ellipse cx="50" cy="96" rx="16" ry="3.5" fill="${TD_GLOW.bad}" opacity="0.25"/>
    ${tube("M30 70 C34 62 32 50 34 42 C37 30 63 30 66 42 C68 50 66 62 70 70 Z M44 78 Q50 84 56 78", "#ffb347", 4.6)}
    <g class="badge"><circle cx="70" cy="30" r="16" fill="${TD_GLOW.bad}" opacity="0.25"/><circle cx="70" cy="30" r="11" fill="${TD_GLOW.bad}"/>
    <text x="70" y="35" font-size="14" font-weight="900" text-anchor="middle" fill="#fff" font-family="system-ui">1</text></g>`,
  procrastinacio: `<ellipse cx="50" cy="96" rx="38" ry="4" fill="#9b6cd6" opacity="0.25"/>
    <path d="M10 92 C8 68 26 52 50 52 C76 52 92 68 90 92 Z" fill="#2a1f3d" stroke="#9b6cd6" stroke-width="4"/>
    ${tube("M50 62 A16 16 0 1 1 49.9 62 M50 70 V78 L56 82", "#c7a4ff", 3.4)}
    <text class="zz" x="70" y="46" font-size="12" font-weight="800" fill="#c7a4ff" font-family="ui-monospace, monospace">demà</text>`,
  son: `<ellipse cx="50" cy="96" rx="24" ry="3.5" fill="#4aa8ff" opacity="0.2"/>
    ${tube("M58 22 C40 26 34 46 42 60 C50 74 70 74 80 64 C64 66 52 56 52 42 C52 32 56 26 58 22 Z", "#7fb8ff", 4)}
    <g class="zz">${glyphText(30, 70, 22, "Z", "#7fb8ff")}${glyphText(18, 48, 14, "z", "#7fb8ff")}</g>`,
  scroll: `<ellipse cx="50" cy="96" rx="18" ry="3.5" fill="${TD_GLOW.bad}" opacity="0.2"/>
    ${tube("M32 16 H68 Q74 16 74 22 V82 Q74 88 68 88 H32 Q26 88 26 82 V22 Q26 16 32 16 Z", "#ff8a6a", 4)}
    <svg x="30" y="22" width="40" height="60" viewBox="30 22 40 60"><g class="feed">${[24, 34, 44, 54, 64, 74, 84, 94].map((y, i) => `<rect x="34" y="${y}" width="${i % 2 ? 20 : 30}" height="4" rx="2" fill="#ffd0c4" opacity="0.85"/>`).join("")}</g></svg>`,
  meme: `<ellipse cx="50" cy="96" rx="22" ry="3.5" fill="#ffd23f" opacity="0.2"/>
    ${tube("M50 22 A32 32 0 1 1 49.9 22", "#ffd23f", 4.4)}
    ${tube("M32 44 L42 50 L32 56 M68 44 L58 50 L68 56 M32 64 Q50 86 68 64 Z", "#ffd23f", 3.4)}`,
  series: `<ellipse cx="50" cy="96" rx="36" ry="4.5" fill="${TD_GLOW.bad}" opacity="0.3"/>
    ${tube("M36 18 L48 30 M64 18 L52 30 M14 30 H86 Q90 30 90 34 V82 Q90 86 86 86 H14 Q10 86 10 82 V34 Q10 30 14 30 Z", TD_GLOW.bad, 4.6)}
    <path d="M42 46 L62 58 L42 70 Z" fill="#fff" stroke="${TD_GLOW.bad}" stroke-width="3" stroke-linejoin="round"/>
    <g class="badge">${glyphText(72, 80, 9, "EP 99", TD_GLOW.bad)}</g>`,
  diumenge: `<ellipse cx="50" cy="96" rx="34" ry="4.5" fill="#4a7fc8" opacity="0.3"/>
    ${tube("M60 10 C34 12 16 34 18 58 C20 82 44 96 68 90 C48 84 34 68 36 48 C38 30 50 16 60 10 Z", "#7fb8ff", 4.4)}
    ${tube("M54 34 H88 V74 H54 Z M54 44 H88", TD_GLOW.bad, 3.4)}
    ${glyphText(71, 66, 16, "DG", "#7fb8ff", "system-ui")}`,
};

// ---------------------------------------------------------------- DISTRACCIONS DEL BOSC: les mateixes, disfressades
// Mateix truc i mateix nom; al bosc pareixen bestioles i plantes (TD_FOREST_ENEMIES a data.js). viewBox 0 0 100 100, base a y ≈ 96.
// De perfil miren a l'esquerra (cap a on van).
const TD_FOREST_ENEMY_ART = {
  // Cuc de llum: l'abdomen s'encén i s'apaga com la llumeta del mòbil; ales de baix, antenes
  notificacio: `<ellipse cx="50" cy="96" rx="16" ry="3.5" fill="#d8ff6a" opacity="0.25"/>
    <g class="badge"><ellipse cx="62" cy="62" rx="20" ry="16" fill="#d8ff6a" opacity="0.28"/><ellipse cx="62" cy="62" rx="12" ry="9" fill="#efffb0" stroke="#d8ff6a" stroke-width="3"/></g>
    <path d="M36 50 Q50 30 66 44" fill="#3a3a22" opacity="0.6"/>${tube("M40 54 Q54 26 70 46", "#c8d6a0", 2.4)}
    <ellipse cx="40" cy="58" rx="12" ry="9" fill="#2a2a1a" stroke="#ffb347" stroke-width="3"/><circle cx="30" cy="56" r="6" fill="#2a2a1a" stroke="#ffb347" stroke-width="2.6"/>
    ${tube("M27 51 Q20 40 14 38 M30 50 Q28 38 22 32", "#ffb347", 1.6)}${tube("M36 66 L32 80 M44 66 L44 80 M52 66 L56 80", "#ffb347", 1.8)}`,
  // Caragol: closca d'espiral enorme i el cos que s'allarga, amb les dues banyes; la baba darrere
  procrastinacio: `<ellipse cx="50" cy="96" rx="40" ry="4" fill="#9b6cd6" opacity="0.25"/>${tube("M70 93 H94", "#c7a4ff", 2, 'opacity="0.5"')}
    <path d="M8 92 Q8 80 22 80 H74 Q86 80 88 92 Z" fill="#3a2f2a" stroke="#d6b48a" stroke-width="3.4"/>
    ${tube("M18 82 Q14 68 10 58 M24 81 Q24 66 22 54", "#d6b48a", 2.4)}<circle cx="10" cy="57" r="2.6" fill="#fff"/><circle cx="22" cy="53" r="2.6" fill="#fff"/>
    <path d="M60 30 C82 30 92 48 88 64 C84 80 64 86 50 82 C32 78 28 56 40 46 C50 38 66 42 68 54 C70 66 56 70 50 62" fill="#2a1f3d" stroke="#c7a4ff" stroke-width="4.4" stroke-linecap="round"/>
    ${tube("M60 30 C82 30 92 48 88 64 C84 80 64 86 50 82 C32 78 28 56 40 46 C50 38 66 42 68 54 C70 66 56 70 50 62", "#c7a4ff", 2, 'opacity="0.6"')}`,
  // Rosella: quatre pètals rojos, el centre fosc amb els estams, la tija peluda; el pol·len que llança són els Z
  son: `<ellipse cx="50" cy="96" rx="20" ry="3.5" fill="#ff5a4a" opacity="0.2"/>${tube("M50 94 Q46 72 52 50", "#7fbf5a", 3)}
    ${tube("M48 80 Q36 74 30 78 Q38 84 48 82", "#7fbf5a", 2.4)}
    <g class="zz">${[[-34, 0], [34, 0], [0, -30], [0, 30]].map(([dx, dy], i) => `<ellipse cx="${52 + dx * 0.55}" cy="${36 + dy * 0.55}" rx="17" ry="14" fill="#e8322a" stroke="#ff8a7a" stroke-width="2" transform="rotate(${i * 45} ${52 + dx * 0.55} ${36 + dy * 0.55})"/>`).join("")}
    <circle cx="52" cy="36" r="9" fill="#1a1a2a" stroke="#7fb8ff" stroke-width="2"/>${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${(52 + Math.cos(i) * 12).toFixed(1)}" cy="${(36 + Math.sin(i) * 12).toFixed(1)}" r="1.8" fill="#1a1a2a"/>`).join("")}</g>
    ${glyphText(84, 20, 14, "z", "#7fb8ff")}`,
  // Brot de falguera: l'espiral que es desenrotlla (com el feed infinit), amb les fulletes als costats
  scroll: `<ellipse cx="50" cy="96" rx="18" ry="3.5" fill="#7fbf5a" opacity="0.25"/>
    <g class="feed-spin">${tube("M50 94 C50 70 70 60 70 40 C70 24 56 16 44 22 C34 28 36 42 46 44 C54 46 56 36 50 34", "#9fdc5a", 5)}</g>
    ${[[52, 78, -1], [54, 66, 1], [62, 56, -1]].map(([x, y, d]) => tube(`M${x} ${y} Q${x + d * 14} ${y - 6} ${x + d * 20} ${y + 2}`, "#9fdc5a", 2.4)).join("")}
    ${[[40, 82], [66, 70], [44, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#ff8a6a"/>`).join("")}`,
  // Camaleó: la cua en espiral, la cresta i l'ull que gira; la llengua fora (de riure)
  meme: `<ellipse cx="50" cy="96" rx="26" ry="3.5" fill="#ffd23f" opacity="0.2"/><g transform="translate(4 18)">${tube("M14 70 H88", "#8a6a3a", 4)}
    <path d="M24 66 C24 48 40 40 56 42 C70 44 78 52 78 64 Z" fill="#4a7a2a" stroke="#ffd23f" stroke-width="3.4" stroke-linejoin="round"/>
    ${tube("M78 62 C90 62 94 50 86 46 C80 44 78 52 84 54", "#ffd23f", 3.4)}${tube("M30 50 L36 40 L42 46 L48 38 L54 44", "#ffd23f", 2.4)}
    <path d="M24 66 C14 66 8 58 12 50 C16 44 24 44 28 50 Z" fill="#4a7a2a" stroke="#ffd23f" stroke-width="3"/>
    <circle cx="20" cy="52" r="5" fill="#fff" stroke="#ffd23f" stroke-width="2"/><circle class="eye-roll" cx="19" cy="51" r="2.2" fill="#1a1a1a"/>
    ${tube("M10 60 Q2 62 -2 58", "#ff7a9a", 2.2)}${tube("M34 66 L30 74 M52 66 L56 74 M66 64 L70 72", "#ffd23f", 2.2)}</g>`,
  // Corro de bolets: tres bolets en rogle (el del mig, gros) i el micel·li brillant per davall
  series: `<ellipse cx="50" cy="96" rx="40" ry="5" fill="${TD_GLOW.bad}" opacity="0.25"/>
    ${tube("M8 94 Q30 88 50 94 Q70 100 92 92 M22 92 Q30 98 40 94 M60 96 Q70 90 80 96", "#ffb3a0", 1.4, 'class="myc" opacity="0.7"')}
    ${[[20, 94, 0.7], [80, 94, 0.75], [50, 96, 1.15]].map(([x, y, k]) => `<g transform="translate(${x} ${y}) scale(${k})">
      <path d="M-7 0 Q-8 -18 -5 -26 H5 Q8 -18 7 0 Z" fill="#f2e2c8" stroke="#ffb3a0" stroke-width="2.4"/>
      <path d="M-24 -24 Q-22 -46 0 -48 Q22 -46 24 -24 Q0 -18 -24 -24 Z" fill="#c8321e" stroke="${TD_GLOW.bad}" stroke-width="3"/>
      ${[[-12, -36], [4, -42], [12, -30], [-2, -30]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="3" fill="#fff4e0"/>`).join("")}</g>`).join("")}`,
  // Llop de la lluna: assegut de perfil udolant, amb el musell amunt; darrere, la lluna creixent
  diumenge: `<ellipse cx="50" cy="96" rx="34" ry="4.5" fill="#4a7fc8" opacity="0.3"/>
    ${tube("M84 6 C70 8 62 20 64 32 C66 44 78 50 90 46 C80 44 72 36 74 26 C75 16 80 10 84 6 Z", "#ffe8a0", 2.8)}
    <path d="M30 94 C26 76 30 60 36 50 L30 34 L22 22 L30 24 L34 16 L40 26 C44 30 48 34 50 40 C58 48 72 56 74 74 C76 86 70 94 60 94 Z" fill="#2a3450" stroke="#7fb8ff" stroke-width="3.4" stroke-linejoin="round"/>
    ${tube("M60 94 C74 92 86 90 90 80", "#7fb8ff", 4)}${tube("M38 64 V94 M50 70 V94", "#7fb8ff", 1.6, 'opacity="0.6"')}
    <circle cx="35" cy="30" r="2.2" fill="#ffe8a0"/>${tube("M20 18 Q14 10 16 4 M14 22 Q6 18 4 12", "#7fb8ff", 1.6, 'class="howl"')}`,
};

// ---------------------------------------------------------------- ESTUDIANT: la granoteta (l'Alba, colors de l'autoescola) amb barret de mag
// Els artefactes equipats es porten posats (com l'equipament de la granoteta): cada un té `wear` en aquestes coordenades.
const TD_STUDENT_BACK = `<ellipse cx="70" cy="146" rx="54" ry="6" fill="#000" opacity="0.3"/>
  <ellipse cx="24" cy="126" rx="22" ry="14" fill="#4fa64d"/><ellipse cx="116" cy="126" rx="22" ry="14" fill="#4fa64d"/>
  <ellipse cx="70" cy="106" rx="52" ry="38" fill="#6cc96a"/><ellipse cx="70" cy="118" rx="32" ry="22" fill="#d4f5b5"/>
  <circle cx="40" cy="64" r="21" fill="#6cc96a"/><circle cx="100" cy="64" r="21" fill="#6cc96a"/>
  <g class="eyes"><circle cx="40" cy="62" r="14" fill="#fff"/><circle cx="100" cy="62" r="14" fill="#fff"/>
    <circle cx="45" cy="63" r="8" fill="#23262d"/><circle cx="105" cy="63" r="8" fill="#23262d"/><circle cx="48" cy="59" r="3" fill="#fff"/><circle cx="108" cy="59" r="3" fill="#fff"/></g>
  <ellipse cx="30" cy="96" rx="9" ry="6" fill="#ff8fa3" opacity="0.75"/><ellipse cx="110" cy="96" rx="9" ry="6" fill="#ff8fa3" opacity="0.75"/>
  <path d="M54 92 Q70 104 86 92" stroke="#2c5e2c" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
const TD_STUDENT_HAT = `<g class="hat"><path d="M30 46 L66 2 Q70 -2 74 2 L110 46 Z" fill="#3a4a8e" stroke="#1a1a4e" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M16 46 Q70 58 124 46 Q70 38 16 46 Z" fill="#2b3a7a" stroke="#1a1a4e" stroke-width="2"/>
  <path d="M34 42 Q70 50 106 42" stroke="#9d8bff" stroke-width="2.5" fill="none"/>
  <g fill="#ffe27a"><path d="M68 16 l2.4 5 5.4 0.8 -4 3.8 1 5.4 -4.8 -2.6 -4.8 2.6 1 -5.4 -4 -3.8 5.4 -0.8 z"/><circle cx="54" cy="34" r="2"/><circle cx="86" cy="28" r="1.7"/></g></g>`;
// Al bosc, la granoteta és druida: caputxa de molsa i capa de fulles darrere, corona de branquetes amb fulles i una
// floreta (en lloc del barret de mag) i el llibre d'herbes (pell verda amb una fulla) en lloc del grimori.
const TD_DRUID_BACK = `<path d="M8 146 C2 118 8 92 22 80 C30 54 46 30 70 26 C94 30 110 54 118 80 C132 92 138 118 132 146 Z" fill="#2f4a26" stroke="#1c2e16" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M70 26 C58 18 52 8 56 0 C62 10 66 16 70 26" fill="#2f4a26" stroke="#1c2e16" stroke-width="2"/>
  ${[[18, 132, -30], [26, 112, -20], [114, 112, 20], [122, 132, 30], [14, 100, -40], [126, 100, 40]].map(([x, y, r]) =>
    `<path d="M${x - 9} ${y} Q${x} ${y - 7} ${x + 9} ${y} Q${x} ${y + 7} ${x - 9} ${y} Z" fill="#4f7a34" stroke="#2a4a1c" stroke-width="1.2" transform="rotate(${r} ${x} ${y})"/>`).join("")}`;
const TD_DRUID_HAT = `<g class="hat">
  <path d="M42 46 Q34 30 26 26 M34 36 Q26 34 22 38 M98 46 Q106 30 114 26 M106 36 Q114 34 118 38" stroke="#7a5230" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M24 48 Q70 34 116 48" stroke="#6b4a2a" stroke-width="5" fill="none" stroke-linecap="round"/>
  ${[[30, 46, -30], [42, 42, -15], [56, 39, -5], [84, 39, 5], [98, 42, 15], [110, 46, 30]].map(([x, y, r]) =>
    `<path d="M${x - 8} ${y} Q${x} ${y - 7} ${x + 8} ${y} Q${x} ${y + 6} ${x - 8} ${y} Z" fill="#6fbf4a" stroke="#2f6a22" stroke-width="1.2" transform="rotate(${r} ${x} ${y})"/>`).join("")}
  <g transform="translate(70 37)">${[0, 72, 144, 216, 288].map(a => `<ellipse rx="3.4" ry="5.5" cy="-5" fill="#f7f0ff" transform="rotate(${a})"/>`).join("")}<circle r="3" fill="#ffd23f"/></g></g>`;
const tdDruidBook = front => front.replace(/#5e1f38/g, "#2f5a2a").replace(/#7a2a4a/g, "#3f7034").replace(/#3a1426/g, "#1c3416")
  .replace(/<path d="M93\.3 127\.8[^>]*\/>/, `<path d="M78 136 Q86 120 96 126 Q92 140 78 136 Z M78 136 L94 127" fill="#9fdc6a" stroke="#e8ffb0" stroke-width="1.4"/>`);
// El llibre el llig la granoteta: des de davant se'n veu la coberta, oberta en V i en perspectiva (el llom, al centre,
// és el que està més a prop; les vores de fora se'n van cap enrere i es veuen més curtes). Per dalt sobreïxen les fulles.
const TD_STUDENT_FRONT = `<g class="td-book">
  <path d="M39 119 Q54 108 70 110 Q86 108 101 119 L70 114 Z" fill="#fff6d8" stroke="#c9b48e" stroke-width="1"/>
  <path d="M70 112 L38 120 L38 142 L70 154 Z" fill="#5e1f38" stroke="#3a1426" stroke-width="2" stroke-linejoin="round"/>
  <path d="M70 112 L102 120 L102 142 L70 154 Z" fill="#7a2a4a" stroke="#3a1426" stroke-width="2" stroke-linejoin="round"/>
  <path d="M74 117 L98 123 L98 140 L74 149 Z" fill="none" stroke="#ffc23f" stroke-width="1.2" opacity="0.8"/>
  <path d="M93.3 127.8 L93.3 125.8 L79.9 124.1 L88.3 132.1 L79.9 141.1 L93.3 137.8 L93.3 135.8" fill="none" stroke="#ffc23f" stroke-width="2.2" stroke-linejoin="miter" stroke-linecap="square"/>
  <path d="M70 112 L70 154" stroke="#3a1426" stroke-width="3.5"/>
  <path d="M68 120 h4 M68 146 h4" stroke="#ffc23f" stroke-width="1.6"/></g>
  <ellipse class="hand-l" cx="38" cy="140" rx="12" ry="7" fill="#4fa64d"/><ellipse class="hand-r" cx="102" cy="140" rx="12" ry="7" fill="#4fa64d"/>`;
// A Informàtica l'estudiant és en Marc: un ajolot de cara, sense vores (silueta de colors plans), sobre quatre potes,
// amb el cap gran i rodó, les branquies en ventall, la boca oberta i un barret de mag tou (sempre posat). Els seus
// espais són branquies, mà i pell (TD_EQUIP_SLOTS_AXO). P = paleta de la pell (TD_AXO_SKINS); %BACK% i %FRONT%, artefactes.
const TD_AXO_SKINS = {
  leucistic: { body: "#fde6ee", body2: "#f6cddb", shade: "#f2c3d3", belly: "#fff6f9", line: "#2e1d26", gill: "#f59ab0", gillL: "#cf5a7c", mouth: "#e96a8e", tongue: "#f7a6c0" },
};
const tdAxoSvg = (() => {
  let P = TD_AXO_SKINS.leucistic; // paleta activa (la fan servir les peces de baix)
  const pt = (x, y) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  function taper(x0, y0, x1, y1, w0, w1, bend = 0) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, mx = (x0 + x1) / 2 + nx * bend, my = (y0 + y1) / 2 + ny * bend, wm = (w0 + w1) / 2;
    return `M${pt(x0 + nx * w0, y0 + ny * w0)} Q${pt(mx + nx * wm, my + ny * wm)} ${pt(x1 + nx * w1, y1 + ny * w1)} L${pt(x1 - nx * w1, y1 - ny * w1)} Q${pt(mx - nx * wm, my - ny * wm)} ${pt(x0 - nx * w0, y0 - ny * w0)} Z`;
  }
  const blob = (x, y, rx, ry) => `M${pt(x + rx, y)} A${rx} ${ry} 0 1 0 ${pt(x - rx, y)} A${rx} ${ry} 0 1 0 ${pt(x + rx, y)} Z`;
  const digit = (x, y, ang, len, w) => { const a = ang * Math.PI / 180; return taper(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len, w, 0.5); };
  // pota: de gruixuda (unida al cos) a prima, amb el peu i quatre dits en punta cap a `dir` (graus)
  const leg = (bx, by, fx, fy, dir, w0 = 15) => [taper(bx, by, fx, fy, w0, 10), blob(fx, fy, 11, 7.5),
    ...[-40, -13, 13, 40].map((d, i) => digit(fx, fy, dir + d, 7 - Math.abs(i - 1.5) * 0.6, 3.6))];
  // Cap ample i baix i cos rodó: dues peces que s'ajunten fent unes entradetes als costats (la cara queda rodanxona)
  // El cap ho ocupa quasi tot; el cos és una base curta davall i les potes, bonyets que ixen de la vora de baix
  const HEAD = blob(96, 70, 62, 45);
  const rrect = (x, y, w, h, r) => `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
  const BODY = rrect(56, 100, 80, 46, 20); // rectangular amb les vores corbes
  const TAIL = "";
  // De cara: les de davant, grans i a baix; les de darrere, més menudes, un poc més amunt i per fora (al fons)
  const BACK = [blob(62, 143, 15, 10), blob(130, 143, 15, 10)]; // potes de darrere: més fosques (queden al fons)
  const SIL = [blob(78, 149, 12.5, 9.5), blob(114, 149, 12.5, 9.5), BODY];
  const MOUTH = "M64 76 Q96 67 128 76 Q124 110 96 112 Q68 110 64 76 Z";
  const FAN = "M0 -16 C-2 -22 4 -28 10 -26 C14 -30 22 -28 22 -21 C28 -20 31 -12 26 -7 C32 -3 31 6 25 8 C29 13 26 21 19 20 C17 27 8 28 5 22 C0 24 -2 20 0 16 Z";
  const gill = (x, y, rot, flip) => `<g transform="translate(${x} ${y}) ${flip ? "scale(-1 1)" : ""} rotate(${rot})">
    <path d="${FAN}" fill="${P.gill}"/>
    <path d="M4 -10 Q12 -16 18 -18 M5 0 Q14 -1 22 -2 M4 10 Q12 14 17 16" stroke="${P.gillL}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.55"/></g>`;
  // Barret de mag tou: copa ampla (tapa tota la coroneta), punta caiguda cap a un costat amb una estrela, sense vores
  const STAR5 = (x, y, r, c) => `<path d="${[0,1,2,3,4,5,6,7,8,9].map(i => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; return `${i ? "L" : "M"}${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)}`; }).join(" ")} Z" fill="${c}"/>`;
  // Capes: primer l'ala sencera (darrere de tot), damunt la copa, que acaba en un arc (la seua base vista en perspectiva),
  // i la cinta seguint el mateix arc: així l'ala no es menja la copa ni la copa l'ala
  const HAT = `<ellipse cx="0" cy="3" rx="72" ry="13" fill="#26336e"/><path d="M-66 5 A66 10 0 0 0 66 5" stroke="#3a4c9a" stroke-width="2" fill="none" opacity="0.7"/>
    <path d="M-52 3 C-51 -16 -38 -38 -8 -46 C10 -51 28 -46 40 -38 C47 -33 56 -31 62 -35 C60 -25 50 -21 41 -23 C46 -15 51 -6 52 3 A52 9 0 0 1 -52 3 Z" fill="#2f3f86"/>
    <path d="M-52 3 C-51 -16 -38 -38 -8 -46 C-24 -35 -33 -18 -33 3 L-33 10 A52 9 0 0 1 -52 3 Z" fill="#3a4c9a"/>
    <path d="M-51 -6 A51 9 0 0 0 51 -6 L52 3 A52 9 0 0 1 -52 3 Z" fill="#9d8bff"/>
    ${STAR5(-8, -24, 7, "#ffe27a")}<circle cx="20" cy="-32" r="1.8" fill="#ffe27a"/><circle cx="-28" cy="-13" r="1.6" fill="#ffe27a"/><circle cx="24" cy="-13" r="1.3" fill="#fff"/>
    ${STAR5(63, -35, 5.5, "#ffe27a")}`;
  const cache = {};
  return (skin = "leucistic") => cache[skin] ||= (pal => { P = pal; return `<defs>
    <linearGradient id="axo-fin" x1="0" x2="1" y1="0" y2="0.3"><stop offset="0" stop-color="#ffd8e4" stop-opacity="0.9"/><stop offset="1" stop-color="#f7a6c0" stop-opacity="0.72"/></linearGradient></defs>
  <ellipse cx="96" cy="152" rx="64" ry="5.5" fill="#000" opacity="0.28"/>
  <!-- aleta de la cua: transparent per dalt i per baix, acaba en punta -->
  <g class="tail"><path d="M126 113 C138 109 147 104 155 99 C166 93 173 103 168 112 C160 127 144 140 126 149 Z" transform="rotate(-6 126 126) translate(126 130) scale(0.87 0.9) translate(-126 -130)" fill="#f7a6c0"/></g>
  <g class="branquies">${gill(40, 66, -4, true)}${gill(152, 66, -4)}</g>
  %BACK%
  <g class="silueta">
    <g fill="${P.shade}">${BACK.map(d => `<path d="${d}"/>`).join("")}</g>
    <g fill="${P.body}"><path class="foot-l" d="${SIL[0]}"/><path class="foot-r" d="${SIL[1]}"/><path d="${SIL[2]}"/></g>
    <clipPath id="axo-cos"><path d="${BODY}"/></clipPath>
    <g clip-path="url(#axo-cos)">
      <ellipse cx="96" cy="133" rx="26" ry="13" fill="${P.belly}"/>
      <path d="${HEAD}" transform="translate(0 4)" fill="${P.shade}"/>
    </g>
    <path d="${HEAD}" fill="${P.body}"/>
  </g>
  <!-- cara -->
  <g>
    <g class="eyes"><circle cx="58" cy="64" r="5.2" fill="${P.line}"/><circle cx="134" cy="64" r="5.2" fill="${P.line}"/></g>
    <clipPath id="axo-boca"><path d="${MOUTH}"/></clipPath>
    <path d="${MOUTH}" fill="${P.mouth}"/>
    <g clip-path="url(#axo-boca)"><ellipse cx="96" cy="112" rx="26" ry="15" fill="${P.tongue}"/></g>
    <ellipse cx="48" cy="80" rx="10" ry="6" fill="${P.tongue}" opacity="0.6"/><ellipse cx="144" cy="80" rx="10" ry="6" fill="${P.tongue}" opacity="0.6"/>
    <path d="M43 78 l7 1 M43 82.5 l7 1 M142 79 l7 -1 M142 83.5 l7 -1" stroke="#e05a80" stroke-width="1.8" stroke-linecap="round"/>
  </g>
  <g class="hat" transform="translate(92 36) rotate(-7)">${HAT}</g>
  %FRONT%`; })(TD_AXO_SKINS[skin] || TD_AXO_SKINS.leucistic);
})();
// Artefactes posats a l'ajolot: `back` va darrere del cap (davant de les branquies) i `front`, damunt de tot
const TD_AXO_WEAR = {
  // Pols d'estrelles (id auriculars): purpurina daurada, cian i rosa sobre els ventalls de les branquies, que titil·la
  auriculars: { front: `<g class="pols">${[[14, 52, 5.4, "#ffe27a"], [26, 72, 4.2, "#bff3ff"], [10, 84, 3.6, "#ff9ae8"], [30, 46, 3, "#fff"], [22, 94, 3.8, "#ffe27a"], [34, 60, 2.6, "#ff9ae8"],
      [178, 52, 5.4, "#ffe27a"], [166, 72, 4.2, "#bff3ff"], [182, 84, 3.6, "#ff9ae8"], [162, 46, 3, "#fff"], [170, 94, 3.8, "#ffe27a"], [158, 60, 2.6, "#bff3ff"]]
      .map(([x, y, r, c], i) => `<path class="tw tw${i % 3}" d="M${x} ${y - r * 1.6} L${x + r * 0.45} ${y - r * 0.45} L${x + r * 1.6} ${y} L${x + r * 0.45} ${y + r * 0.45} L${x} ${y + r * 1.6} L${x - r * 0.45} ${y + r * 0.45} L${x - r * 1.6} ${y} L${x - r * 0.45} ${y - r * 0.45} Z" fill="${c}"/>`).join("")}
      ${[[18, 60], [26, 86], [10, 70], [174, 60], [166, 86], [182, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#fff" opacity="0.85"/>`).join("")}</g>` },
  // Bastó d'aprenent (id cafe): dret davant seu (pot tapar-li la cara), agafat amb la pota de davant esquerra, que
  // s'alça (el peu de terra desapareix) i el subjecta un poc per davall de l'espatla
  cafe: { hides: ["foot-l"], front: () => `<g class="basto" transform="translate(-23 0)"><path d="M80 160 Q83 120 76 80 Q73 64 76 52" stroke="#5a3418" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M80.6 156 Q83.2 120 76.6 82" stroke="#8a5a30" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M76 52 Q68 48 68 40 M76 52 Q83 45 80 37" stroke="#5a3418" stroke-width="3" fill="none" stroke-linecap="round"/>
      <g class="cristall"><circle cx="74" cy="41" r="11" fill="#5ad8ff" opacity="0.22"/><path d="M74 32 L79.5 41 L74 50 L68.5 41 Z" fill="#bff3ff"/><circle cx="74" cy="41" r="2.2" fill="#5ad8ff"/></g>
      <path d="M58 30 l1.5 3 3 1.5 -3 1.5 -1.5 3 -1.5 -3 -3 -1.5 3 -1.5 z M90 26 l1 2 2 1 -2 1 -1 2 -1 -2 -2 -1 2 -1 z" fill="#ffe27a"/></g>
      <ellipse cx="57" cy="120" rx="11" ry="9" fill="${TD_AXO_SKINS.leucistic.body}"/>` },
};
// Peces dels artefactes: `back` es pinta davall del barret (diadema), `front` damunt de tot.
// `hides`: parts de la granoteta que deixen de veure's (la mà dreta, si l'artefacte la fa servir: només en té dues)
const TD_ARTIFACT_WEAR = {
  // Bastó de la natura (id capallop): dret davant seu (pot tapar-li la cara), branca torta amb fulles i una llavor que
  // brilla a dalt; la mà dreta es torna a pintar damunt i l'agafa (com l'ajolot)
  capallop: { front: `<g class="basto-natura"><path d="M104 158 Q108 120 102 84 Q98 60 104 40" stroke="#6b4a2a" stroke-width="5.5" fill="none" stroke-linecap="round"/>
      <path d="M104.6 152 Q108 120 102.6 86" stroke="#8a6440" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M104 40 Q96 34 96 24 M104 40 Q113 32 111 22 M102 80 Q110 76 116 70" stroke="#6b4a2a" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${[[94, 22, -40], [113, 20, 30], [118, 68, 50], [96, 108, -60]].map(([x, y, r]) => `<path d="M${x - 7} ${y} Q${x} ${y - 6} ${x + 7} ${y} Q${x} ${y + 6} ${x - 7} ${y} Z" fill="#6fbf4a" transform="rotate(${r} ${x} ${y})"/>`).join("")}
      <g class="llavor"><circle cx="104" cy="28" r="10" fill="#b8ff7a" opacity="0.25"/><circle cx="104" cy="28" r="4.5" fill="#d8ffb0"/><circle cx="104" cy="28" r="2" fill="#fff"/></g></g>
      <ellipse cx="102" cy="140" rx="12" ry="7" fill="#4fa64d"/>` },
  // pell de bolet: les pigues blanques de l'amanita (els colors canvien amb frogSkin)
  setes: { back: `<g fill="#fff6e8">${[[52, 84, 4.5], [86, 80, 3.5], [100, 100, 5], [38, 108, 4], [104, 124, 3.5], [30, 124, 3], [70, 76, 2.8], [28, 58, 3.2], [108, 56, 3], [44, 50, 2.4], [96, 48, 2.4]]
      .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>` },
};
// Pells de la granoteta: color original → nou (cos, potes, panxa, somriure)
const TD_FROG_SKINS = { setes: { "#6cc96a": "#cf4a34", "#4fa64d": "#a3342a", "#d4f5b5": "#f6e6c8", "#2c5e2c": "#5a1a10" } };

// Estudiant amb els artefactes posats. attrs: atributs extra de l'<svg> (posició i mida dins d'un altre SVG)
function tdStudentSvg(equipped = [], attrs = "") {
  const druid = typeof tdRoom !== "undefined" && tdRoom === "forestal"; // al bosc, l'Alba (granoteta druida)
  if (!druid) { // a Informàtica, en Marc (ajolot)
    const w = equipped.map(id => TD_AXO_WEAR[id]).filter(Boolean), skin = equipped.map(id => TD_ARTIFACTS[id]?.skin).find(Boolean);
    const part = x => typeof x === "function" ? x() : x || "";
    let art = tdAxoSvg(skin).replace("%BACK%", w.map(x => part(x.back)).join("")).replace("%FRONT%", w.map(x => part(x.front)).join(""));
    for (const cls of w.flatMap(x => x.hides || [])) art = art.replace(new RegExp(`<path class="${cls}"[^>]*/>`), "");
    return `<svg viewBox="2 -32 196 196" preserveAspectRatio="xMidYMax meet" class="td-student-svg axolot" aria-label="Estudiant (ajolot)" overflow="visible" ${attrs}>${art}</svg>`;
  }
  const w = equipped.map(id => TD_ARTIFACT_WEAR[id]).filter(Boolean);
  const skin = equipped.map(id => TD_FROG_SKINS[id]).find(Boolean) || {}; // pell: canvia els colors de la granoteta
  const paint = str => Object.entries(skin).reduce((t, [a, b]) => t.split(a).join(b), str);
  const front = paint(tdDruidBook(TD_STUDENT_FRONT));
  return `<svg viewBox="-4 -12 152 160" class="td-student-svg druid" aria-label="Estudiant (granoteta)" overflow="visible" ${attrs}>${TD_DRUID_BACK}${paint(TD_STUDENT_BACK)}
    ${w.map(x => x.back || "").join("")}${TD_DRUID_HAT}${w.flatMap(x => x.hides || []).reduce((f, cls) => f.replace(new RegExp(`<ellipse class="${cls}"[^>]*/>`), ""), front)}${w.map(x => paint(x.front || "")).join("")}</svg>`;
}
const TD_STUDENT_SVG = tdStudentSvg();

// Embolcalls
function tdCreatureSvg(id, extraClass = "") {
  return `<svg viewBox="-6 -10 132 132" class="tdc tdc-${id} ${extraClass}" aria-hidden="true" overflow="visible">${TD_ART[id].svg}</svg>`;
}
function tdEnemySvg(id) {
  const forest = typeof tdRoom !== "undefined" && tdRoom === "forestal" && typeof TD_FOREST_ENEMY_ART !== "undefined" && TD_FOREST_ENEMY_ART[id];
  return `<svg viewBox="0 0 100 100" class="tde tde-${id}${forest ? " forest" : ""}" aria-hidden="true" overflow="visible">${forest || TD_ENEMY_ART[id]}</svg>`;
}
