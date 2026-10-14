// ===== EVOLUCIONS DELS OBJECTES =====
// Cada objecte té una etapa I comuna i, a partir de la II, dues branques (II i III). La branca es tria en comprar la II
// i l'altra queda bloquejada fins a reiniciar. Cada etapa es paga amb diners i L a la vegada. No es veu què farà una
// etapa fins que és la següent. Al reiniciar es perden les evolucions i es tornen les L. Els requisits de nivell es
// comproven amb el rècord (state.best), que es conserva: un nivell completat una vegada queda completat per sempre.
//
// EVOLUTIONS[id de l'objecte]:
//   reqs: nivell que cal haver completat per a cada etapa (I, II, III)
//   common: etapa I (igual per a les dues branques)
//   branches: { clau: { name, icon, desc, stages: [etapa II, etapa III] } }  (clau: es guarda a la partida, NO canviar)
// Cada etapa: name/txt (què fa), visual i bonus. Els bonus de l'etapa I sempre compten; els de la branca s'hi sumen.
// Mentre l'objecte està equipat se sumen als seus stats (vegeu equipmentStats a inventory.js):
//   petDmgPct · petCrit (la mascota pot fer crítics) · petHealPct (% de vida per colp de la mascota) ·
//   petHealLow (multiplicador amb < 30% de vida) · herdAdd (segons extra d'endarrerir) · stunEvery (cada N colps, -1 s) ·
//   bleedPct (sagnat 3 s, % del dany de la mascota per segon) · critPct · critMultAdd · xrayPct (% d'ignorar esquives
//   i immunitats dels caps) · dodgePct · counterPct (en esquivar, % del teu atac) · lifesteal · possessEvery
//   (1 s intangible cada N s) · burnPct · burnTime · tracaEvery / tracaPct · atkPct · hpPct · speedPct · dmgTakenPct
// visual: substituïx camps de l'aspecte de l'objecte (vegeu itemVisual a evolutions.js):
//   look (icona i, en les mascotes, el sprite) · wear (peces damunt de la granoteta) · skin { colors, aura } · hides
const EVO_COST = {
  enemiesWorth: [30, 45, 60], // diners de cada etapa: les recompenses d'X enemics normals del nivell requerit
  lCost: [1, 3, 6],           // L de cada etapa (es paguen amb els diners, a la vegada)
};

// ----- Peces de dibuix -----
// Mascota amb capes damunt del seu SVG (les capes usen el viewBox del dibuix de la mascota)
const petLook = (src, alt, viewBox, layers = "") => `<span class="pet"><img class="ally-img" src="${src}" alt="${alt}" draggable="false">${
  layers ? `<svg class="pet-overlay" viewBox="${viewBox}" overflow="visible" aria-hidden="true">${layers}</svg>` : ""}</span>`;
const PIXEL = (layers) => petLook("img/pixel.svg", "Pixel", "0 0 200 210", layers);
const DOG = (layers) => petLook("img/gos-atura.svg", "Gos d'atura", "0 0 140 104", layers);

// Pixel (viewBox 0 0 200 210: cap centrat a 100,88; coll a y ≈ 145: collars desplaçats 12 cap avall)
const PX = {
  bell: `<g transform="translate(0 12)"><path d="M64 130 Q100 152 136 130" stroke="#d1261f" stroke-width="9" fill="none" stroke-linecap="round"/>
    <circle cx="100" cy="148" r="8" fill="#f2c200" stroke="#a87c10" stroke-width="2"/><path d="M95 150 H105" stroke="#7a5a10" stroke-width="2"/></g>`,
  scar: `<path d="M118 66 L136 106" stroke="#c98a7a" stroke-width="4" stroke-linecap="round"/>
    <path d="M120 78 L131 75 M124 89 L135 86 M128 100 L137 97" stroke="#c98a7a" stroke-width="3" stroke-linecap="round"/>`,
  spikes: `<g transform="translate(0 12)"><path d="M64 130 Q100 152 136 130" stroke="#26262a" stroke-width="12" fill="none" stroke-linecap="round"/>
    <g fill="#dfe4ea"><polygon points="72,136 76,150 80,137"/><polygon points="86,142 90,156 94,143"/><polygon points="98,144 102,158 106,144"/>
    <polygon points="110,143 114,156 118,142"/><polygon points="122,137 126,150 130,136"/></g></g>`,
  plaster: `<g transform="rotate(-24 88 46)"><rect x="74" y="40" width="30" height="11" rx="4" fill="#f2dcb8"/>
    <path d="M85 40 V51 M93 40 V51" stroke="#d9bf94" stroke-width="1.5"/></g>`,
  claws: `<path d="M72 203 l-3 7 M80 205 l-1 7 M88 203 l1 7 M112 203 l-1 7 M120 205 l0 7 M128 203 l1 7" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  bow: `<g transform="translate(60 38) rotate(-22)"><path d="M0 0 L-18 -11 L-16 10 Z M0 0 L18 -11 L16 10 Z" fill="#ff7aa8" stroke="#d94f84" stroke-width="2"/>
    <circle r="6" fill="#ff4f8b"/></g>`,
  bowtie: `<g transform="translate(0 12)"><path d="M100 140 L82 129 L82 151 Z M100 140 L118 129 L118 151 Z" fill="#3a6fd0" stroke="#24509e" stroke-width="2"/>
    <circle cx="100" cy="140" r="6" fill="#24509e"/></g>`,
  crown: `<path d="M76 42 L80 16 L91 31 L100 10 L109 31 L120 16 L124 42 Z" fill="#f2c200" stroke="#a87c10" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="100" cy="30" r="4" fill="#e2483a"/><circle cx="84" cy="34" r="3" fill="#3a8ae0"/><circle cx="116" cy="34" r="3" fill="#3fb06a"/>`,
};
// Gos d'atura (viewBox 0 0 140 104: cap a 108,32; coll a 92-108, 44-52)
const DOG_NECK = `<clipPath id="dog-neck-evo"><path d="M83 44 L90 42 Q99 45.5 108 46 L104 56 L100 62 L84 60 Z"/></clipPath>`;
const DG = {
  // mocador lligat al coll: la banda va retallada amb el coll i el pic penja davant del pit
  bandana: `${DOG_NECK}<path d="M78 41 Q96 56 116 45" stroke="#2d6fd0" stroke-width="7" fill="none" clip-path="url(#dog-neck-evo)"/>
    <path d="M91 49 Q98 52 105 49 L99 64 Z" fill="#2d6fd0" stroke="#1f4f9e" stroke-width="1.2"/>
    <g fill="#fff"><circle cx="96" cy="52" r="1.4"/><circle cx="102" cy="52" r="1.4"/><circle cx="99" cy="57" r="1.3"/></g>`,
  hat: `<ellipse cx="106" cy="17" rx="18" ry="5" fill="#5a3d26"/><path d="M93 17 Q95 4 106 4 Q117 4 119 17 Z" fill="#7d5a3a"/>
    <rect x="94" y="12" width="24" height="3" fill="#c9a24a"/>`,
  cowbell: `<path d="M95 62 h9 l3 11 h-15 Z" fill="#c9a24a" stroke="#8a6a1a" stroke-width="1.5"/><circle cx="99.5" cy="74" r="2" fill="#5a4010"/>
    <path d="M99.5 58 V62" stroke="#5a3d26" stroke-width="2"/>`,
  spiked: `${DOG_NECK}<path d="M78 41 Q96 56 116 45" stroke="#26262a" stroke-width="7" fill="none" clip-path="url(#dog-neck-evo)"/>
    <g fill="#dfe4ea" clip-path="url(#dog-neck-evo)"><polygon points="86,46 87,51 89,47"/><polygon points="93,49 94,54 96,49"/>
    <polygon points="100,50 101,55 103,50"/></g>`,
  fury: `<circle cx="116" cy="29" r="3.8" fill="#ff2a2a"/><circle cx="116" cy="29" r="7" fill="#ff2a2a" opacity="0.25"/>
    <path d="M110 22 L121 25" stroke="#1d1d1f" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M121 46 l2 6 l2 -6 Z M126 45 l1.5 5 l1.5 -5 Z" fill="#fff"/>`,
};
// Granoteta (viewBox 0 0 140 124: ulls a 40,36 i 100,36; panxa a 70,92)
const glasses = (frame, width, lens, opacity, extra = "") => `<g stroke="${frame}" stroke-width="${width}" fill="${lens}" fill-opacity="${opacity}">
    <circle cx="40" cy="36" r="17"/><circle cx="100" cy="36" r="17"/></g>
  <path d="M57 33 Q70 25 83 33" stroke="${frame}" stroke-width="${width}" fill="none"/>
  <path d="M23 34 L12 30 M117 34 L128 30" stroke="#7a5a44" stroke-width="3" stroke-linecap="round"/>
  <path d="M30 27 L36 23 M90 27 L96 23" stroke="#fff" stroke-width="2.5" opacity="0.8"/>${extra}`;
// Ulls de la granoteta vistos a través de lents d'augment (més grans com més graduació)
const bigEyes = (white, pupil) => `<g><circle cx="40" cy="36" r="${white}" fill="#fff"/><circle cx="100" cy="36" r="${white}" fill="#fff"/>
  <circle cx="45" cy="37" r="${pupil}" fill="#23262d"/><circle cx="105" cy="37" r="${pupil}" fill="#23262d"/>
  <circle cx="${48 + pupil / 4}" cy="${32 - pupil / 6}" r="${pupil / 2.6}" fill="#fff"/><circle cx="${108 + pupil / 4}" cy="${32 - pupil / 6}" r="${pupil / 2.6}" fill="#fff"/></g>`;
// Ulleres de broma de raigs X: lents blanques amb espiral
const spiral = (cx) => `<path d="M${cx} 36 m0 -2 a2 2 0 1 1 -2 2 a4 4 0 1 1 4 4 a6 6 0 1 1 -6 -6 a8 8 0 1 1 8 8 a10 10 0 1 1 -10 -10"
  stroke="#1d1d1f" stroke-width="1.8" fill="none"/>`;
const XRAY_SPECS = `<g stroke="#c4161c" stroke-width="3.5" fill="#f4f1ea"><circle cx="40" cy="36" r="16"/><circle cx="100" cy="36" r="16"/></g>
  ${spiral(40)}${spiral(100)}
  <path d="M56 33 Q70 25 84 33" stroke="#c4161c" stroke-width="3.5" fill="none"/>
  <path d="M24 34 L12 30 M116 34 L128 30" stroke="#c4161c" stroke-width="3" stroke-linecap="round"/>`;
// Visor de raigs X: una sola peça que tapa els dos ulls, verd lluminós amb línia d'escaneig i l'esquelet que hi veu
const XRAY_VISOR = `<rect x="14" y="16" width="112" height="40" rx="20" fill="#7dffb0" opacity="0.25"/>
  <rect x="18" y="20" width="104" height="32" rx="16" fill="#0f3a24" stroke="#2b6a4a" stroke-width="3"/>
  <rect x="22" y="24" width="96" height="24" rx="12" fill="#39ff9a" opacity="0.55"/>
  <path d="M26 36 H114" stroke="#c8ffd8" stroke-width="2" opacity="0.9"/>
  <g stroke="#0f3a24" stroke-width="2" fill="none" opacity="0.7"><circle cx="45" cy="34" r="5"/><circle cx="100" cy="34" r="5"/>
    <path d="M52 44 h36 M60 41 v6 M70 41 v6 M80 41 v6"/></g>
  <circle cx="12" cy="36" r="5" fill="#2b6a4a"/><circle cx="128" cy="36" r="5" fill="#2b6a4a"/><circle cx="128" cy="36" r="2" fill="#7dffb0"/>`;
const cape = (fill, hem, extra = "") => `<g transform="translate(104 74) scale(0.82)">
    <rect x="-6" y="0" width="48" height="5" rx="2.5" fill="#6b4426"/>
    <path d="M-2 5 Q-6 30 2 54 Q22 58 40 50 Q34 28 42 5 Z" fill="${fill}"/>
    <path d="M-2 5 Q-6 30 2 54 Q8 55 12 54 Q4 30 8 5 Z" fill="#000" opacity="0.18"/>
    <path d="M2 54 Q22 58 40 50" stroke="${hem}" stroke-width="3" fill="none"/>${extra}
  </g>
  <ellipse cx="103" cy="75" rx="9" ry="7" fill="#4fa64d"/>`;
const flowers = (c1, c2) => `<g><circle cx="12" cy="20" r="4" fill="${c1}"/><circle cx="26" cy="34" r="4" fill="${c2}"/><circle cx="16" cy="44" r="3.5" fill="${c1}"/>
    <circle cx="30" cy="16" r="3" fill="${c2}"/><g fill="#fff" opacity="0.7"><circle cx="12" cy="20" r="1.3"/><circle cx="26" cy="34" r="1.3"/><circle cx="16" cy="44" r="1.2"/></g></g>`;
const WISPS = `<g opacity="0.75"><path d="M2 26 Q2 12 12 12 Q22 12 22 26 L18 22 L15 27 L12 22 L9 27 L6 22 Z" fill="#c8ffd8"/>
    <circle cx="9" cy="19" r="1.6" fill="#0f3a24"/><circle cx="15" cy="19" r="1.6" fill="#0f3a24"/>
    <path d="M124 54 Q124 42 132 42 Q140 42 140 54 L137 51 L134 55 L131 51 L128 55 L125 51 Z" fill="#c8ffd8"/>
    <circle cx="130" cy="48" r="1.4" fill="#0f3a24"/><circle cx="135" cy="48" r="1.4" fill="#0f3a24"/></g>`;
const ORBS = (c) => `<g fill="${c}"><circle cx="8" cy="70" r="5" opacity="0.8"/><circle cx="134" cy="84" r="4" opacity="0.7"/><circle cx="20" cy="4" r="3.5" opacity="0.6"/>
    <circle cx="126" cy="10" r="4.5" opacity="0.75"/></g>`;
const flameCrest = (c1, c2) => `<path d="M60 10 Q54 -6 66 -20 Q68 -6 74 -4 Q76 -14 82 -16 Q86 0 78 10 Z" fill="${c1}"/>
  <path d="M65 9 Q62 0 68 -8 Q70 0 74 1 Q76 -4 78 -5 Q80 4 75 9 Z" fill="${c2}"/>`;
const PETARDS = (n) => `<path d="M38 96 Q70 112 102 96" stroke="#5a3a1a" stroke-width="3" fill="none"/>
  ${Array.from({ length: n }, (_, i) => { const x = 44 + i * (52 / (n - 1)), y = 100 + Math.sin(Math.PI * i / (n - 1)) * 6;
    return `<rect x="${x - 3}" y="${y}" width="6" height="12" rx="1.5" fill="#d1261f"/><path d="M${x} ${y} l0 -4" stroke="#2b2b2b" stroke-width="1.5"/>`; }).join("")}`;
const SPARKS = `<g fill="#ffe27a"><circle cx="10" cy="60" r="2.5"/><circle cx="130" cy="70" r="2"/><circle cx="20" cy="100" r="2"/><circle cx="124" cy="104" r="2.5"/></g>`;
const PLATE = (bg, letter) => `<rect x="59" y="84" width="22" height="22" rx="3" fill="${bg}" stroke="#fff" stroke-width="2"/>
  <text x="70" y="101" text-anchor="middle" font-size="17" font-weight="900" fill="#fff" font-family="system-ui, sans-serif">${letter}</text>`;
const TRUCKER = `<path d="M44 26 Q44 6 70 5 Q96 6 96 26 Z" fill="#d1261f"/><path d="M58 8 Q70 4 82 8 L84 24 H56 Z" fill="#fff" opacity="0.9"/>
  <path d="M60 12 H80 M60 17 H80 M60 22 H80" stroke="#d6d6d6" stroke-width="1.5"/><path d="M96 24 Q110 24 116 30 L96 30 Z" fill="#a51c16"/>`;
const VEST = `<path d="M40 76 Q70 68 100 76 L104 112 Q70 122 36 112 Z" fill="#d6f000"/>
  <path d="M38 92 Q70 100 102 92 M37 102 Q70 110 103 102" stroke="#cfd6db" stroke-width="4" fill="none"/>`;
const HELMET = (c) => `<path d="M46 26 Q46 0 70 -1 Q94 0 94 26 Z" fill="${c}"/><path d="M52 18 Q70 10 88 18 L88 24 Q70 20 52 24 Z" fill="#1d2a3a"/>
  <path d="M54 6 Q62 2 70 2" stroke="#fff" stroke-width="3" opacity="0.6" fill="none" stroke-linecap="round"/>`;

const GHOST_GREEN = { "#6cc96a": "#6fe39a", "#4fa64d": "#3fae6e", "#d4f5b5": "#c8ffd8", "#2c5e2c": "#0f3a24" };
const GHOST_EMERALD = { "#6cc96a": "#36d98a", "#4fa64d": "#1f9a5e", "#d4f5b5": "#a8ffd0", "#2c5e2c": "#063a20" };
const GHOST_PURPLE = { "#6cc96a": "#b48cff", "#4fa64d": "#8a5ce0", "#d4f5b5": "#ece2ff", "#2c5e2c": "#3a1f6a" };
const FIRE_ORANGE = { "#6cc96a": "#ff8a3d", "#4fa64d": "#d9541e", "#d4f5b5": "#ffd27a", "#2c5e2c": "#6a2410" };
const FIRE_BLUE = { "#6cc96a": "#4aa8ff", "#4fa64d": "#2a6fd0", "#d4f5b5": "#c4e6ff", "#2c5e2c": "#0f2a5a" };
const FIRE_WHITE = { "#6cc96a": "#d6ecff", "#4fa64d": "#7ab8ff", "#d4f5b5": "#ffffff", "#2c5e2c": "#1a3a7a" };
const FIRE_RED = { "#6cc96a": "#ff5a3a", "#4fa64d": "#c4261c", "#d4f5b5": "#ffd27a", "#2c5e2c": "#5a0f0a" };

const EVOLUTIONS = {
  pixel: {
    reqs: [50, 70, 90],
    common: { name: "Adoptat", icon: "🔔", txt: "Collar amb cascavell: +15% de dany de Pixel", petDmgPct: 15,
      visual: { look: PIXEL(PX.bell) } },
    branches: {
      street: { name: "Gat de carrer", icon: "🐈‍⬛", desc: "Urpes afilades a força de baralles als carreronets.",
        stages: [
          { txt: "Cicatriu de guerra: +50% de dany de Pixel", petDmgPct: 35, visual: { look: PIXEL(PX.bell + PX.scar) } },
          { txt: "Collar de punxes: +80% de dany i les urpades poden ser crítiques", petDmgPct: 65, petCrit: true,
            visual: { look: PIXEL(PX.spikes + PX.scar + PX.plaster + PX.claws) } },
        ] },
      home: { name: "Gat de casa", icon: "🛋️", desc: "Mimat, gros i amb un ronroneig que ho cura tot.",
        stages: [
          { txt: "Llaçet: cada colp de Pixel et cura l'1,5% de la vida", petHealPct: 1.5, visual: { look: PIXEL(PX.bell + PX.bow) } },
          { txt: "Rei de la casa: et cura el 2%, i el doble si tens menys del 30% de vida", petHealPct: 2, petHealLow: 2,
            visual: { look: PIXEL(PX.bowtie + PX.crown) } },
        ] },
    },
  },
  glasses: {
    reqs: [70, 90, 110],
    common: { name: "Montura daurada", icon: "✨", txt: "Montura nova: +5% de crític", critPct: 5,
      visual: { wear: glasses("#e0b64a", 3, "#dfeef5", 0.22) } },
    branches: {
      lens: { name: "Lents graduades", icon: "🔍", desc: "Ara Marc hi veu de veritat: cada crític fa més mal.",
        stages: [
          { txt: "Lents d'augment: hi veu el doble (crítics ×2,3)", critMultAdd: 0.3,
            visual: { wear: bigEyes(15, 10) + glasses("#2b2b2b", 4.5, "#bfe6ff", 0.2) } },
          { txt: "Cul de got: ulls enormes (crítics ×2,6)", critMultAdd: 0.6,
            visual: { wear: bigEyes(16.5, 13) + glasses("#2b2b2b", 7, "#bfe6ff", 0.25,
              `<g fill="none" stroke="#fff" opacity="0.4"><circle cx="40" cy="36" r="12"/><circle cx="100" cy="36" r="12"/></g>`) } },
        ] },
      xray: { name: "Raigs X", icon: "🩻", desc: "Veus a través dels trucs dels caps.",
        stages: [
          { txt: "Ulleres de raigs X: 40% d'ignorar esquives i immunitats dels caps", xrayPct: 40,
            visual: { wear: XRAY_SPECS } },
          { txt: "Visor de raigs X: 75% d'ignorar esquives i immunitats dels caps", xrayPct: 75,
            visual: { wear: XRAY_VISOR } },
        ] },
    },
  },
  ghostAura: {
    reqs: [90, 110, 130],
    common: { name: "Esperits", icon: "👻", txt: "Dos fantasmets t'acompanyen: et cures el 5% del dany que fas", lifesteal: 1,
      visual: { skin: { colors: GHOST_GREEN, aura: "aura-ghost" }, wear: WISPS } },
    branches: {
      soul: { name: "Ànima", icon: "💚", desc: "L'aura xucla més ànima de cada enemic.",
        stages: [
          { txt: "Aura maragda: et cures el 8% del dany que fas", lifesteal: 3,
            visual: { skin: { colors: GHOST_EMERALD, aura: "aura-ghost-strong" }, wear: WISPS } },
          { txt: "Ànimes en òrbita: et cures el 10% del dany que fas", lifesteal: 5,
            visual: { skin: { colors: GHOST_EMERALD, aura: "aura-ghost-strong" }, wear: WISPS + ORBS("#7dffb0") } },
        ] },
      possess: { name: "Possessió", icon: "🫥", desc: "Com l'Avió fantasma, de tant en tant travesses els atacs.",
        stages: [
          { txt: "Espectre morat: cada 10 s, 1 s intangible", possessEvery: 10,
            visual: { skin: { colors: GHOST_PURPLE, aura: "aura-possess" } } },
          { txt: "Mig transparent: cada 8 s, 1 s intangible", possessEvery: 8,
            visual: { skin: { colors: GHOST_PURPLE, aura: "aura-possess-strong" }, wear: ORBS("#c9a8ff") } },
        ] },
    },
  },
  cape: {
    reqs: [110, 130, 150],
    common: { name: "Brodada", icon: "🧵", txt: "Brodats d'or: +3% d'esquivar (18% en total)", dodgePct: 3,
      visual: { wear: cape("#c4161c", "#e8c04a", `<g fill="#e8c04a"><circle cx="10" cy="20" r="2.5"/><circle cx="24" cy="30" r="2.5"/><circle cx="14" cy="40" r="2.5"/><circle cx="28" cy="16" r="2"/></g>`) } },
    branches: {
      veronica: { name: "Verònica", icon: "💃", desc: "Passades de capa cada vegada més elegants.",
        stages: [
          { txt: "Capa de flors: 25% d'esquivar", dodgePct: 7, visual: { wear: cape("#e84a8a", "#ffd27a", flowers("#ffd23f", "#fff")) } },
          { txt: "Capa d'or: 30% d'esquivar", dodgePct: 12, visual: { wear: cape("#e0b64a", "#c4161c", flowers("#c4161c", "#ff5ab0")) } },
        ] },
      counter: { name: "Contraatac", icon: "↩️", desc: "Després de cada «Olé!», toca tornar-li-la.",
        stages: [
          { txt: "Capa granat: en esquivar, tornes el 60% del teu atac", counterPct: 60, visual: { wear: cape("#7a0f14", "#1d1d1f") } },
          { txt: "Capa negra: en esquivar, tornes el 100% del teu atac", counterPct: 100,
            visual: { wear: cape("#1d1d1f", "#c4161c", `<path d="M-2 5 Q-6 30 2 54" stroke="#c4161c" stroke-width="4" fill="none"/>`) +
              `<line x1="96" y1="122" x2="136" y2="62" stroke="#cfd6db" stroke-width="3"/><rect x="92" y="114" width="12" height="4" rx="2" fill="#6b4426" transform="rotate(-56 98 116)"/>` } },
        ] },
    },
  },
  firePell: {
    reqs: [140, 160, 180],
    common: { name: "Cresta de foc", icon: "🔥", txt: "Cremada del 25% del teu atac", burnPct: 5,
      visual: { skin: { colors: FIRE_ORANGE, aura: "aura-fire" }, wear: flameCrest("#ffb02e", "#ffe27a") } },
    branches: {
      gas: { name: "Benzina", icon: "⛽", desc: "Un poquet de combustible i la flama es torna blava.",
        stages: [
          { txt: "Flama blava: cremada del 40% del teu atac durant 4 s", burnPct: 15, burnTime: 1,
            visual: { skin: { colors: FIRE_BLUE, aura: "aura-fire-blue" }, wear: flameCrest("#4aa8ff", "#c4e6ff") } },
          { txt: "Foc blanc: cremada del 50% del teu atac durant 4,5 s", burnPct: 25, burnTime: 1.5,
            visual: { skin: { colors: FIRE_WHITE, aura: "aura-fire-blue" }, wear: flameCrest("#ffffff", "#4aa8ff") } },
        ] },
      traca: { name: "Traca", icon: "🧨", desc: "Cada pocs colps, un petard de la mascletà.",
        stages: [
          { txt: "Cinturó de petards: cada 5 colps, un petard del 200% del teu atac", tracaEvery: 5, tracaPct: 200,
            visual: { skin: { colors: FIRE_RED, aura: "aura-fire" }, wear: flameCrest("#ffb02e", "#ffe27a") + PETARDS(5) } },
          { txt: "Mascletà: cada 5 colps, un petard del 400% del teu atac", tracaEvery: 5, tracaPct: 400,
            visual: { skin: { colors: FIRE_RED, aura: "aura-fire" }, wear: flameCrest("#ffb02e", "#ffe27a") + PETARDS(8) + SPARKS } },
        ] },
    },
  },
  dog: {
    reqs: [170, 190, 210],
    common: { name: "Mocador", icon: "🧣", txt: "Mocador blau: +10% de dany del gos", petDmgPct: 10,
      visual: { look: DOG(DG.bandana) } },
    branches: {
      shepherd: { name: "Pastor", icon: "🐑", desc: "Guia l'enemic com si fora una ovella esgarriada.",
        stages: [
          { txt: "Barret de pastor: endarrerix l'enemic 0,2 s per colp", herdAdd: 0.1, visual: { look: DOG(DG.bandana + DG.hat) } },
          { txt: "Esquella: 0,25 s per colp i, cada 10 colps, l'atura 1 s", herdAdd: 0.15, stunEvery: 10,
            visual: { look: DOG(DG.bandana + DG.cowbell + DG.hat) } },
        ] },
      biter: { name: "Mossegador", icon: "🦷", desc: "Ja no guia: mossega.",
        stages: [
          { txt: "Collar de punxes: +50% de dany del gos", petDmgPct: 40, visual: { look: DOG(DG.spiked) } },
          { txt: "Ulls rojos: +100% de dany i les mossegades fan sagnar", petDmgPct: 90, bleedPct: 50,
            visual: { look: DOG(DG.spiked + DG.fury) } },
        ] },
    },
  },
  license: {
    reqs: [200, 220, 240],
    common: { name: "Placa B", icon: "🅱️", txt: "Fora la L, ara la B: +5% de vida i +3% d'atac", hpPct: 5, atkPct: 3,
      visual: { wear: PLATE("#2d4f8a", "B") } },
    branches: {
      truck: { name: "Carnet de camió", icon: "🚛", desc: "Quaranta tones de granoteta.",
        stages: [
          { txt: "Gorra de camioner: +15% de vida i reps un 10% menys de dany", hpPct: 10, dmgTakenPct: 10,
            visual: { wear: PLATE("#2d4f8a", "C") + TRUCKER } },
          { txt: "Armilla reflectant: +25% de vida i reps un 15% menys de dany", hpPct: 20, dmgTakenPct: 15,
            visual: { wear: VEST + PLATE("#2d4f8a", "C") + TRUCKER } },
        ] },
      moto: { name: "Carnet de moto", icon: "🏍️", desc: "Genoll a terra i gas a fons.",
        stages: [
          { txt: "Casc: +15% de velocitat i +7% d'atac", speedPct: 15, atkPct: 4, visual: { wear: PLATE("#2d4f8a", "A") + HELMET("#e2483a") } },
          { txt: "Botes de cuir: +25% de velocitat i +12% d'atac", speedPct: 25, atkPct: 9,
            visual: { skin: { colors: { "#4fa64d": "#2b2b2e" } }, wear: PLATE("#2d4f8a", "A") + HELMET("#1d1d1f") } },
        ] },
    },
  },
};
