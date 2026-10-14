// ===== EQUIPAMENT =====
// Espais de l'inventari (es mostren en aquest ordre, damunt de la granoteta)
// id: clau de la partida guardada (NO s'ha de canviar mai)
const EQUIP_SLOTS = [
  { id: "skin",      icon: "🎨", name: "Pell" },
  { id: "accessory", icon: "🕶️", name: "Accessori" },
  { id: "pet",       icon: "🐾", name: "Mascota" },
];

// id: clau de la partida guardada (NO s'ha de canviar mai)
// slot: espai on s'equipa · look: HTML que es dibuixa damunt/al costat de la granoteta
// from (opcional): nom del cap que el dona en derrotar-lo per primera vegada
// skin (opcional): pell de la granoteta. colors: { color original del SVG: color nou } · aura: classe CSS de l'aura
//   (vegeu .sprite.aura-... a style.css)
// ally (opcional): l'objecte és una mascota que ataca pel seu compte, sense vida.
//   atkPct: % de l'atac de la granoteta que fa cada colp · interval: segons entre colps (independent de la granoteta)
// wear (opcional): peces que es dibuixen DINS del sprite de la granoteta (coordenades del seu viewBox 0 0 140 124),
//   així es mouen amb ella. `look` és aleshores només la icona dels espais i la motxilla.
//   Els colors de la granoteta que hi aparega (p. ex. un braç) també canvien amb la pell.
// hides (opcional): parts de la granoteta que s'amaguen mentre està equipat (classes del SVG: frog-hand-l, frog-hand-r, frog-lplate)
// stats (opcional): bonus mentre està equipat (vegeu recomputeStats a upgrades.js)
//   critPct: punts de % de crític · critCap: límit de crític mentre es porta (per defecte CONFIG.combat.maxCritChance)
//   lifesteal: % del dany que fas (granoteta i mascota) que et cura · dodgePct: % d'atacs enemics que esquives
//   burnPct: en contacte (colpejar o ser colpejat), l'enemic crema 3 s fent aquest % del teu atac cada segon
//   atkPct / hpPct / speedPct: % més d'atac, vida màxima i velocitat d'atac
// ally.herd (opcional): segons que cada colp de la mascota endarrerix l'atac de l'enemic
const ITEMS = {
  pixel: {
    slot: "pet",
    name: "Pixel",
    look: `<img class="ally-img" src="img/pixel.svg" alt="Pixel" draggable="false">`,
    desc: "Després de la batalla als Carreronets de Sogorb, Pixel ha decidit que la granoteta és prou interessant per a seguir-la. O potser és pel menjar.",
    from: "Pixel",
    found: "🐱 Pixel s'unix a la granoteta com a mascota!",
    ally: { atkPct: 30, interval: 1.4 },
  },
  glasses: {
    slot: "accessory",
    name: "Ulleres de Marc",
    look: `<svg class="item-icon" viewBox="0 0 100 44" aria-label="Ulleres de Marc">
      <g stroke="#b8b4ac" stroke-width="5" fill="#dfeef5" fill-opacity="0.25"><circle cx="26" cy="24" r="17"/><circle cx="74" cy="24" r="17"/></g>
      <path d="M43 20 Q50 13 57 20" stroke="#b8b4ac" stroke-width="5" fill="none"/>
      <path d="M9 22 L1 18 M91 22 L99 18" stroke="#7a5a44" stroke-width="5" stroke-linecap="round"/>
      <path d="M16 16 L22 12 M64 16 L70 12" stroke="#fff" stroke-width="3" opacity="0.8"/>
    </svg>`,
    wear: `<g stroke="#b8b4ac" stroke-width="3" fill="#dfeef5" fill-opacity="0.22">
        <circle cx="40" cy="36" r="17"/><circle cx="100" cy="36" r="17"/>
      </g>
      <path d="M57 33 Q70 25 83 33" stroke="#b8b4ac" stroke-width="3" fill="none"/>
      <path d="M23 34 L12 30 M117 34 L128 30" stroke="#7a5a44" stroke-width="3" stroke-linecap="round"/>
      <path d="M30 27 L36 23 M90 27 L96 23" stroke="#fff" stroke-width="2.5" opacity="0.8"/>`,
    desc: "Redones, de metall fi i amb més hores de pantalla que un servidor. Marc diu que sense elles no veu res; amb elles, la granoteta ho veu tot.",
    from: "Marc",
    found: "👓 Marc t'ha deixat les seues ulleres!",
    stats: { critPct: 25, critCap: 100 },
  },
  ghostAura: {
    slot: "skin",
    name: "Aura fantasma",
    look: `<svg class="item-icon" viewBox="0 0 70 62" aria-label="Aura fantasma">
      <ellipse cx="35" cy="34" rx="34" ry="27" fill="#7dffb0" opacity="0.3"/>
      <ellipse cx="35" cy="40" rx="24" ry="17" fill="#6fe39a"/>
      <ellipse cx="35" cy="45" rx="14" ry="10" fill="#c8ffd8"/>
      <circle cx="22" cy="22" r="10" fill="#6fe39a"/><circle cx="48" cy="22" r="10" fill="#6fe39a"/>
      <circle cx="22" cy="21" r="6.5" fill="#fff"/><circle cx="48" cy="21" r="6.5" fill="#fff"/>
      <circle cx="24" cy="22" r="3.5" fill="#0f3a24"/><circle cx="50" cy="22" r="3.5" fill="#0f3a24"/>
    </svg>`,
    // La granoteta es torna del verd espectral de l'Avió fantasma i l'envolta una aura
    skin: {
      colors: { "#6cc96a": "#6fe39a", "#4fa64d": "#3fae6e", "#d4f5b5": "#c8ffd8", "#2c5e2c": "#0f3a24" },
      aura: "aura-ghost",
    },
    desc: "El que queda de l'Avió fantasma quan el derrotes: una brillantor verda que se t'apega a la pell. Fa olor de querosé i xucla un poquet l'ànima de cada enemic que colpeges.",
    from: "Avió fantasma",
    found: "👻 L'Avió fantasma t'ha deixat la seua aura!",
    stats: { lifesteal: 4 },
  },
  firePell: {
    slot: "skin",
    name: "Pell de foc",
    look: `<svg class="item-icon" viewBox="0 0 70 62" aria-label="Pell de foc">
      <path d="M14 58 Q2 36 16 22 Q16 36 26 38 Q22 22 34 6 Q36 26 46 30 Q50 18 58 14 Q70 34 56 58 Z" fill="#ff7a1a" opacity="0.55"/>
      <ellipse cx="35" cy="42" rx="22" ry="15" fill="#ff8a3d"/>
      <ellipse cx="35" cy="47" rx="13" ry="9" fill="#ffd27a"/>
      <circle cx="23" cy="26" r="9" fill="#ff8a3d"/><circle cx="47" cy="26" r="9" fill="#ff8a3d"/>
      <circle cx="23" cy="25" r="6" fill="#fff"/><circle cx="47" cy="25" r="6" fill="#fff"/>
      <circle cx="25" cy="26" r="3.2" fill="#2b1206"/><circle cx="49" cy="26" r="3.2" fill="#2b1206"/>
    </svg>`,
    skin: {
      colors: { "#6cc96a": "#ff8a3d", "#4fa64d": "#d9541e", "#d4f5b5": "#ffd27a", "#2c5e2c": "#6a2410" },
      aura: "aura-fire",
    },
    desc: "El que queda del Ninot de la falla després de la cremà: una pell que no s'apaga mai. Qui la toca, se'n recorda.",
    from: "Ninot de la falla",
    found: "🔥 De les cendres del Ninot ix la Pell de foc!",
    stats: { burnPct: 20 },
  },
  dog: {
    slot: "pet",
    name: "Gos d'atura",
    look: `<img class="ally-img" src="img/gos-atura.svg" alt="Gos d'atura" draggable="false">`,
    desc: "El gos del Pastor de Morella ha vist que la granoteta guia millor que el seu amo. Ara és ell qui t'acompanya.",
    from: "Pastor de Morella",
    found: "🐕 El Gos d'atura del Pastor ara és la teua mascota!",
    ally: { atkPct: 15, interval: 0.8, herd: 0.1 },
  },
  license: {
    slot: "skin",
    name: "Carnet de conduir",
    look: `<svg class="item-icon" viewBox="0 0 86 56" aria-label="Carnet de conduir">
      <rect x="2" y="2" width="82" height="52" rx="7" fill="#f4b8c8" stroke="#c9768e" stroke-width="2"/>
      <rect x="2" y="2" width="82" height="12" rx="7" fill="#3a5fb0"/><rect x="2" y="8" width="82" height="6" fill="#3a5fb0"/>
      <rect x="9" y="20" width="22" height="26" rx="3" fill="#6cc96a"/><circle cx="16" cy="28" r="3" fill="#fff"/><circle cx="24" cy="28" r="3" fill="#fff"/>
      <path d="M38 24 H76 M38 31 H70 M38 38 H74" stroke="#9a5a6e" stroke-width="3" stroke-linecap="round"/>
      <text x="70" y="50" font-size="11" font-weight="900" fill="#3a5fb0" font-family="system-ui, sans-serif">B</text>
    </svg>`,
    // Amb el carnet, la granoteta ja no porta la placa L de novell
    skin: { colors: {} },
    hides: ["frog-lplate"],
    desc: "Aprovat! La granoteta ja no és novella: fora la L. Ara comença la carretera de veritat.",
    from: "Examinador en cap",
    found: "🪪 Has aprovat l'examen pràctic! Ja tens el Carnet de conduir!",
    stats: { atkPct: 10, hpPct: 10, speedPct: 10 },
  },
  cape: {
    slot: "accessory",
    name: "Capa roja",
    look: `<svg class="item-icon" viewBox="0 0 70 70" aria-label="Capa roja">
      <rect x="4" y="8" width="62" height="6" rx="3" fill="#6b4426"/>
      <path d="M8 14 Q4 40 12 66 Q34 70 54 62 Q48 40 60 14 Z" fill="#c4161c"/>
      <path d="M8 14 Q4 40 12 66 Q18 67 22 66 Q14 40 18 14 Z" fill="#000" opacity="0.15"/>
      <path d="M12 66 Q34 70 54 62" stroke="#e8c04a" stroke-width="3" fill="none"/>
    </svg>`,
    // La muleta a la dreta de la granoteta (cap a l'enemic), com un torero de debò
    wear: `<g transform="translate(104 74) scale(0.82)">
        <rect x="-6" y="0" width="48" height="5" rx="2.5" fill="#6b4426"/>
        <path d="M-2 5 Q-6 30 2 54 Q22 58 40 50 Q34 28 42 5 Z" fill="#c4161c"/>
        <path d="M-2 5 Q-6 30 2 54 Q8 55 12 54 Q4 30 8 5 Z" fill="#000" opacity="0.15"/>
        <path d="M2 54 Q22 58 40 50" stroke="#e8c04a" stroke-width="2.5" fill="none"/>
      </g>
      <!-- la pota davantera dreta, ara agafant el pal de la muleta (una mica més gran) -->
      <ellipse cx="103" cy="75" rx="9" ry="7" fill="#4fa64d"/>`,
    hides: ["frog-hand-r"],
    desc: "Confiscada al Torero feixista (la polsereta rojigualda ha acabat al contenidor groc). Ara és la granoteta qui diu «Olé!» mentre els enemics pegen a la tela.",
    from: "Torero feixista",
    found: "🟥 Has confiscat la capa roja del Torero feixista!",
    stats: { dodgePct: 15 },
  },
};
