// ===== ESTUDI: DIBUIXOS (defensors, distraccions, estudiant) =====
// Estil: símbols d'energia sobre fons fosc (com a «Animation vs. Math»): cada criatura és una construcció feta amb els
// símbols de la seua assignatura, en traços de neó (halo de color + tub de color + nucli blanc), surant damunt d'un cercle
// de runes. Sense ulls ni boques. Les peces menudes (classes `al` / `ar`) són el que dispara: en disparar ixen volant
// com a projectil i es tornen a formar (td.css). Totes: viewBox 0 0 120 120, base a y ≈ 108.
// Projectils (`proj`): dibuix menut centrat en 0,0 (≈ 20×20).

const TD_GLOW = { alg: "#9d8bff", prg: "#3fdc8a", gold: "#ffc23f", myth: "#ff5ab0", bad: "#ff5a4a" };

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

const TD_ART = {
  // ---------------------------------------------------------------- ÀLGEBRA LINEAL (violeta)
  // Sumador: un + gran d'energia; els dos + menuts de les espatles són els que llança
  sumador: {
    svg: `${runeBase(GA)}<g class="b">${tube("M60 42 V100 M31 71 H89", GA, 9)}${core(60, 71, GA)}</g>
      <g class="al">${tube("M30 22 V42 M20 32 H40", GA, 4)}</g><g class="ar">${tube("M90 22 V42 M80 32 H100", GA, 4)}</g>${sparks(GA)}`,
    proj: tube("M0 -7 V7 M-7 0 H7", GA, 3.4), throw: { l: [30, 32], r: [90, 32] },
  },
  // Escalar ×2: una × que gira sense parar (més ràpid quan dispara); llança el 2 de l'exponent
  escalar: {
    svg: `${runeBase(GA)}<g class="b"><g class="spin">${tube("M36 46 L84 94 M84 46 L36 94", GA, 9)}</g>${core(60, 70, GA)}</g>
      <g class="al">${glyphText(92, 38, 26, "2", GA)}</g>${sparks(GA)}`,
    proj: glyphText(0, 8, 24, "2", GA), throw: { l: [92, 30] },
  },
  // Vector: la lletra v amb la fletxa damunt; la fletxa és la llança que travessa
  vector: {
    svg: `${runeBase(GA)}<g class="b">${tube("M38 56 L60 100 L82 56", GA, 9)}${core(60, 100, GA, 3.6)}</g>
      <g class="al">${tube("M30 36 H86 M76 26 L88 36 L76 46", GA, 5.5)}</g>${sparks(GA)}`,
    proj: tube("M-14 0 H12 M4 -7 L13 0 L4 7", GA, 4.2), throw: { l: [58, 36] },
  },
  // Transposada: una T que gira 90° (es transposa) en disparar; llança un raig que rebota
  transposada: {
    svg: `${runeBase(GA)}<g class="b"><g class="flip">${tube("M28 44 H92 M60 44 V100", GA, 9)}</g>${core(60, 44, GA)}</g>
      <g class="al">${glyphText(98, 28, 22, "T", GA)}</g>${sparks(GA)}`,
    proj: glyphText(0, 7, 20, "T", GA), throw: { l: [98, 21] },
  },
  // Matriu: dos claudàtors i la matriu identitat dins, que s'il·lumina; congela per zones
  matriu: {
    svg: `${runeBase(GA)}<g class="b">${tube("M42 30 H28 V102 H42 M78 30 H92 V102 H78", GA, 7)}
      <g class="cells">${[[0, 0, "1"], [1, 0, "0"], [2, 0, "0"], [0, 1, "0"], [1, 1, "1"], [2, 1, "0"], [0, 2, "0"], [1, 2, "0"], [2, 2, "1"]]
        .map(([c, r, t]) => t === "1" ? glyphText(44 + c * 16, 51 + r * 22, 17, t, "#9fe0ff") : `<text x="${44 + c * 16}" y="${51 + r * 22}" font-size="15" font-weight="700" text-anchor="middle" fill="${GA}" opacity="0.55" font-family="ui-monospace, Consolas, monospace">0</text>`).join("")}</g></g>${sparks("#9fe0ff")}`,
    proj: glyphText(0, 6, 16, "1", "#9fe0ff"), throw: { c: [60, 66] },
  },
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
  comentari: {
    svg: `${runeBase(GP)}<g class="b">${tube("M42 100 L60 40 M62 100 L80 40", GP, 8)}
      <g class="txt">${[0, 1, 2].map(i => `<rect x="${30 + i * 4}" y="${18 + i * 7}" width="${48 - i * 14}" height="3" rx="1.5" fill="${GP}" opacity="${0.6 - i * 0.15}"/>`).join("")}</g></g>
      <g class="al">${tube("M92 50 L100 30", GP, 4)}</g>${sparks(GP)}`,
    proj: tube("M-4 10 L4 -10", GP, 4), throw: { l: [96, 40] },
  },
  // Bucle for: un anell-fletxa que gira cada ràfega, amb la paraula for dins
  bucle: {
    svg: `${runeBase(GP)}<g class="b"><g class="ring">${tube("M88 70 A28 28 0 1 1 76 48", GP, 8)}${tube("M70 38 L80 48 L68 56", GP, 6)}</g>
      ${glyphText(60, 76, 15, "for", GP)}</g>
      <g class="al">${[0, 1, 2].map(i => `<circle cx="${24 + i * 9}" cy="${30 - i * 3}" r="3.4" fill="#fff" stroke="${GP}" stroke-width="2"/>`).join("")}</g>${sparks(GP)}`,
    proj: `<circle r="7" fill="${GP}" opacity="0.25"/><circle r="3.6" fill="#fff" stroke="${GP}" stroke-width="2"/>`, throw: { l: [33, 27] },
  },
  // If / else: el rombe de decisió amb l'interrogant; les branques sí / no són els braços
  ifelse: {
    svg: `${runeBase(GP)}<g class="b">${tube("M60 36 L90 68 L60 100 L30 68 Z", GP, 7)}${glyphText(60, 78, 28, "?", GP)}</g>
      <g class="al">${tube("M28 62 L12 46 M12 46 H22 M12 46 V56", "#7fd49c", 4)}</g>
      <g class="ar">${tube("M92 62 L108 46 M108 46 H98 M108 46 V56", "#ff8a8a", 4)}</g>${sparks(GP)}`,
    proj: tube("M-8 8 L8 -8 M8 -8 H0 M8 -8 V0", "#7fd49c", 4), projR: tube("M-8 8 L8 -8 M8 -8 H0 M8 -8 V0", "#ff8a8a", 4), throw: { l: [18, 52], r: [102, 52] },
  },
  // Recursió: cercles dins de cercles que s'encenen un darrere l'altre; el projectil es dividix
  recursio: {
    svg: `${runeBase(GP)}<g class="b">
      <g class="nest n1">${tube("M60 34 A34 34 0 1 1 59.9 34", GP, 6)}</g>
      <g class="nest n2">${tube("M64 50 A20 20 0 1 1 63.9 50", GP, 5)}</g>
      </g><g class="al"><g class="nest n3">${tube("M66 62 A9 9 0 1 1 65.9 62", GP, 4)}${core(66, 71, GP, 2.6)}</g></g>${sparks(GP)}`,
    proj: `${tube("M0 -9 A9 9 0 1 1 -0.1 -9", GP, 4)}<circle r="2.6" fill="#fff"/>`, throw: { l: [66, 71] },
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

// ---------------------------------------------------------------- ESTUDIANT: la granoteta (colors de l'autoescola) amb barret de mag
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
const TD_STUDENT_FRONT = `<g class="td-book"><path d="M34 128 L70 120 L106 128 L106 146 L70 138 L34 146 Z" fill="#fff6d8" stroke="#8a6440" stroke-width="2.5" stroke-linejoin="round"/>
  <line x1="70" y1="120" x2="70" y2="138" stroke="#8a6440" stroke-width="2"/>${[0, 1, 2].map(i => `<line x1="42" y1="${131 + i * 4}" x2="64" y2="${127 + i * 4}" stroke="#aab3c0" stroke-width="1.6"/><line x1="76" y1="${127 + i * 4}" x2="98" y2="${131 + i * 4}" stroke="#aab3c0" stroke-width="1.6"/>`).join("")}</g>
  <ellipse cx="38" cy="140" rx="12" ry="7" fill="#4fa64d"/><ellipse cx="102" cy="140" rx="12" ry="7" fill="#4fa64d"/>`;
// Peces dels artefactes: `back` es pinta davall del barret (diadema), `front` damunt de tot
const TD_ARTIFACT_WEAR = {
  auriculars: { back: `<path d="M20 64 C18 30 122 30 120 64" stroke="#2b2f35" stroke-width="7" fill="none" stroke-linecap="round"/>`,
    front: `<g><rect x="10" y="52" width="16" height="26" rx="7" fill="#2b2f35"/><rect x="114" y="52" width="16" height="26" rx="7" fill="#2b2f35"/>
      <rect x="13" y="56" width="10" height="18" rx="5" fill="#9d8bff"/><rect x="117" y="56" width="10" height="18" rx="5" fill="#9d8bff"/></g>` },
  cafe: { front: `<g><path d="M116 108 h22 v20 q0 8 -8 8 h-6 q-8 0 -8 -8 z" fill="#fff6d8" stroke="#8a6440" stroke-width="2.2"/>
      <path d="M138 114 q8 0 8 7 q0 7 -8 7" stroke="#8a6440" stroke-width="2.4" fill="none"/><rect x="118" y="110" width="18" height="4" fill="#6b4220"/>
      <g class="steam" stroke="#cfe6f5" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.8"><path d="M122 104 q-3 -5 0 -10 q3 -5 0 -10"/><path d="M130 104 q-3 -5 0 -10 q3 -5 0 -10"/></g>
      <ellipse cx="114" cy="124" rx="9" ry="6" fill="#4fa64d"/></g>` },
};
// Estudiant amb els artefactes posats. attrs: atributs extra de l'<svg> (posició i mida dins d'un altre SVG)
function tdStudentSvg(equipped = [], attrs = "") {
  const w = equipped.map(id => TD_ARTIFACT_WEAR[id]).filter(Boolean);
  return `<svg viewBox="-4 -6 152 160" class="td-student-svg" aria-label="Estudiant" overflow="visible" ${attrs}>${TD_STUDENT_BACK}
    ${w.map(x => x.back || "").join("")}${TD_STUDENT_HAT}${TD_STUDENT_FRONT}${w.map(x => x.front || "").join("")}</svg>`;
}
const TD_STUDENT_SVG = tdStudentSvg();

// Embolcalls
function tdCreatureSvg(id, extraClass = "") {
  return `<svg viewBox="-6 -10 132 132" class="tdc tdc-${id} ${extraClass}" aria-hidden="true" overflow="visible">${TD_ART[id].svg}</svg>`;
}
function tdEnemySvg(id) {
  return `<svg viewBox="0 0 100 100" class="tde tde-${id}" aria-hidden="true" overflow="visible">${TD_ENEMY_ART[id]}</svg>`;
}
