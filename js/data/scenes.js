// ===== ESCENARIS =====

// Caps especials amb foto: es mostren amb les proporcions originals (vegeu .boss-photo a style.css)
const bossPhoto = (src, alt) => `<img class="boss-photo" src="${src}" alt="${alt}" draggable="false">`;

// Caps especials: cadascun té una habilitat pròpia (mech → js/bosses.js; ability: text del compendi)
// hpMult / atkMult (opcionals): compensen l'habilitat perquè el cap no siga molt més difícil que l'Examinador

// Pixel: el gatet, cap especial dels Carreronets de Sogorb
const PIXEL_BOSS = {
  name: "Pixel",
  icon: bossPhoto("img/pixel.jpeg", "Pixel"),
  desc: "Koshka",
  mech: "pixel",
  ability: "Esquiva felina: el 25% dels teus atacs no el toquen. Migdiada: cada 10 s s'adorm 3 s i no ataca.",
  hpMult: 0.8, atkMult: 1.3,
};

// Marc: cap especial de la Vall d'Alba
const MARC_BOSS = {
  name: "Marc",
  icon: bossPhoto("img/marc.jpeg", "Marc"),
  desc: "mierda loco cebolla coño",
  mech: "marc",
  ability: "Cada atac és un crit: MIERDA, LOCO, CEBOLLA... i el quart, «COÑO!», fa dany ×2,5.",
};

// Avió fantasma: cap especial de l'Aeroport de Castelló (l'aeroport sense avions)
const PLANE_SVG = `<svg class="ghost-plane" viewBox="0 0 220 150" aria-label="Avió fantasma">
  <defs>
    <radialGradient id="ghost-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#7dffb0" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#7dffb0" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ghost-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c8ffd8"/>
      <stop offset="0.5" stop-color="#6fe39a"/>
      <stop offset="1" stop-color="#2f9a5e"/>
    </linearGradient>
  </defs>
  <ellipse cx="110" cy="75" rx="110" ry="70" fill="url(#ghost-glow)"/>
  <!-- estela espectral -->
  <path d="M168 70 Q196 60 218 74 Q200 78 214 92 Q192 86 170 92 Z" fill="#7dffb0" opacity="0.35"/>
  <g opacity="0.88">
    <!-- ala del fons, esparracada -->
    <path d="M100 66 L134 18 L150 16 L140 34 L148 38 L132 50 L128 66 Z" fill="#3fae6e"/>
    <!-- cua -->
    <path d="M160 64 L184 30 L196 30 L188 50 L194 54 L182 66 Z" fill="url(#ghost-body)"/>
    <path d="M166 78 L196 82 L198 90 L170 88 Z" fill="#3fae6e"/>
    <!-- fuselatge (el morro mira a la granoteta) -->
    <path d="M20 80 Q22 62 50 60 H168 Q184 62 186 74 Q184 88 168 92 H50 Q22 94 20 80 Z" fill="url(#ghost-body)"/>
    <path d="M30 70 Q36 64 46 64 L44 74 H30 Z" fill="#0f3a24"/>
    <!-- finestretes buides (calaveretes) -->
    <g fill="#0f3a24"><circle cx="70" cy="72" r="4.5"/><circle cx="88" cy="72" r="4.5"/><circle cx="106" cy="72" r="4.5"/><circle cx="124" cy="72" r="4.5"/><circle cx="142" cy="72" r="4.5"/></g>
    <!-- ala del davant, esparracada i amb forats -->
    <path d="M90 84 L132 136 L148 138 L142 124 L150 120 L136 106 L130 84 Z" fill="url(#ghost-body)"/>
    <g fill="#0f3a24" opacity="0.7"><circle cx="122" cy="108" r="3"/><circle cx="134" cy="122" r="2.5"/></g>
    <!-- motor -->
    <rect x="106" y="98" width="26" height="12" rx="6" fill="#3fae6e"/>
    <!-- trossos de tela penjant -->
    <path d="M60 92 Q58 108 52 114 Q62 108 66 92 Z M100 92 Q100 110 94 120 Q106 110 108 92 Z" fill="#6fe39a" opacity="0.7"/>
  </g>
</svg>`;
const PLANE_BOSS = {
  name: "Avió fantasma",
  icon: PLANE_SVG,
  desc: "Com l'Holandès Errant, però amb ales: diuen que una vegada va aterrar un avió a Castelló i que el seu esperit encara vaga per la pista buida buscant passatgers.",
  mech: "ghost",
  ability: "Intangible: cada 6 s es torna translúcid 1,5 s i no rep dany. Xucla ànimes: es cura el 25% del dany que et fa.",
  hpMult: 0.75,
};

// Torero feixista: cap especial dels Bous a Vila-real
const TORERO_SVG = `<svg viewBox="0 0 140 200" aria-label="Torero feixista">
  <!-- capa roja (muleta) -->
  <path d="M8 96 Q4 140 14 182 Q40 190 60 178 Q56 140 58 100 Z" fill="#c4161c"/>
  <path d="M8 96 Q4 140 14 182 Q22 184 28 182 Q18 140 22 98 Z" fill="#000" opacity="0.15"/>
  <rect x="4" y="92" width="58" height="6" rx="3" fill="#6b4426"/>
  <!-- cames: mitges roses i sabatilles -->
  <path d="M58 150 L56 188 H68 L72 150 Z M80 150 L84 188 H96 L94 150 Z" fill="#f2a8bf"/>
  <path d="M52 186 H70 V194 H52 Z M82 186 H100 V194 H82 Z" fill="#1b1b1b"/>
  <!-- calça del vestit de llums -->
  <path d="M54 120 H98 L96 156 H80 L76 136 L72 156 H56 Z" fill="#1f6e5a"/>
  <g stroke="#e8c04a" stroke-width="3"><line x1="56" y1="126" x2="57" y2="154"/><line x1="96" y1="126" x2="95" y2="154"/></g>
  <!-- jaqueta brodada -->
  <path d="M50 76 Q76 66 102 76 L104 122 H48 Z" fill="#1f6e5a"/>
  <path d="M50 76 Q38 80 36 96 L48 100 Z M102 76 Q114 80 116 96 L104 100 Z" fill="#e8c04a"/>
  <g fill="#e8c04a"><circle cx="56" cy="90" r="3"/><circle cx="96" cy="90" r="3"/><circle cx="56" cy="104" r="3"/><circle cx="96" cy="104" r="3"/><path d="M50 116 H104 V122 H50 Z"/></g>
  <path d="M68 72 L76 100 L84 72 Z" fill="#fff"/>
  <path d="M71 74 H81 L76 86 Z" fill="#c4161c"/>
  <!-- braços -->
  <path d="M48 82 Q34 90 30 98 L40 102 Q46 94 52 92 Z" fill="#1f6e5a"/>
  <path d="M104 82 Q122 72 126 58 L116 54 Q112 66 100 74 Z" fill="#1f6e5a"/>
  <circle cx="122" cy="52" r="7" fill="#f0c8a0"/>
  <!-- polsera rojigualda -->
  <g><rect x="112" y="58" width="12" height="3" fill="#c4161c" transform="rotate(-30 118 60)"/><rect x="112" y="61" width="12" height="3" fill="#f2c200" transform="rotate(-30 118 60)"/><rect x="112" y="64" width="12" height="3" fill="#c4161c" transform="rotate(-30 118 60)"/></g>
  <!-- estoc -->
  <line x1="124" y1="46" x2="138" y2="4" stroke="#cfd6db" stroke-width="3"/>
  <!-- cap: cara, ulleres de sol, bigotet i montera -->
  <rect x="70" y="60" width="12" height="12" fill="#e8b890"/>
  <ellipse cx="76" cy="48" rx="17" ry="19" fill="#f0c8a0"/>
  <path d="M60 44 H92 V50 Q86 54 80 50 H72 Q66 54 60 50 Z" fill="#111"/>
  <path d="M70 58 Q76 55 82 58 Q76 60 70 58 Z" fill="#3a2a1a"/>
  <path d="M70 64 Q76 62 82 64" stroke="#8a4a3a" stroke-width="2" fill="none"/>
  <path d="M56 36 Q58 22 76 22 Q94 22 96 36 Q90 32 84 34 Q76 26 68 34 Q62 32 56 36 Z" fill="#111"/>
  <circle cx="58" cy="36" r="6" fill="#111"/><circle cx="94" cy="36" r="6" fill="#111"/>
</svg>`;
const TORERO_BOSS = {
  name: "Torero feixista",
  icon: TORERO_SVG,
  desc: "Polsereta rojigualda, ulleres de sol i nostàlgia d'una època que no va viure. Diu que això és cultura. La granoteta no hi està d'acord.",
  mech: "torero",
  ability: "Capotazo: el 20% dels teus atacs es queden en la capa («Olé!»). Estocada: cada cinqué atac fa dany ×3.",
  hpMult: 0.8,
};

// Ninot de la falla: cap especial de les Falles de València (crema tot el rato)
const NINOT_SVG = `<svg class="on-fire-svg" viewBox="0 0 150 210" aria-label="Ninot de la falla">
  <rect x="30" y="182" width="90" height="22" fill="#8a5a33"/><rect x="24" y="176" width="102" height="8" fill="#6b4426"/>
  <path d="M46 180 Q40 130 60 112 H90 Q110 130 104 180 Z" fill="#3a7bd5"/>
  <path d="M46 180 Q60 160 75 176 Q90 160 104 180" fill="#f2c200"/>
  <g fill="#ff5ab0"><circle cx="62" cy="140" r="5"/><circle cx="88" cy="136" r="5"/><circle cx="76" cy="156" r="5"/></g>
  <path d="M60 116 Q36 120 30 98 L40 94 Q48 108 62 108 Z M90 116 Q114 120 120 96 L110 92 Q102 108 88 108 Z" fill="#3a7bd5"/>
  <circle cx="34" cy="94" r="8" fill="#ffd9b8"/><circle cx="116" cy="92" r="8" fill="#ffd9b8"/>
  <ellipse cx="75" cy="66" rx="38" ry="44" fill="#ffd9b8"/>
  <circle cx="58" cy="60" r="9" fill="#fff"/><circle cx="92" cy="60" r="9" fill="#fff"/>
  <circle cx="60" cy="61" r="4.5" fill="#1d1d1d"/><circle cx="90" cy="61" r="4.5" fill="#1d1d1d"/>
  <ellipse cx="75" cy="80" rx="12" ry="16" fill="#ff9a8a"/>
  <path d="M52 96 Q64 88 75 96 Q86 88 98 96 Q86 104 75 98 Q64 104 52 96 Z" fill="#3a2a1a"/>
  <ellipse cx="50" cy="82" rx="8" ry="5" fill="#ff7a8a" opacity="0.7"/><ellipse cx="100" cy="82" rx="8" ry="5" fill="#ff7a8a" opacity="0.7"/>
  <path d="M36 40 Q40 10 75 12 Q110 10 114 40 Q96 30 75 32 Q54 30 36 40 Z" fill="#c4161c"/>
  <circle cx="75" cy="10" r="7" fill="#c4161c"/>
  <g class="flames">
    <path d="M22 204 Q10 176 26 160 Q24 178 36 182 Q34 164 46 150 Q44 176 56 204 Z" fill="#ff7a1a"/>
    <path d="M128 204 Q140 176 124 160 Q126 178 114 182 Q116 164 104 150 Q106 176 94 204 Z" fill="#ff7a1a"/>
    <path d="M30 204 Q24 186 34 176 Q34 190 44 194 Q44 182 50 176 Q52 194 50 204 Z" fill="#ffd23f"/>
    <path d="M120 204 Q126 186 116 176 Q116 190 106 194 Q106 182 100 176 Q98 194 100 204 Z" fill="#ffd23f"/>
    <path d="M56 204 Q50 186 62 172 Q62 188 75 190 Q88 188 88 172 Q100 186 94 204 Z" fill="#ff4a1a" opacity="0.9"/>
  </g>
</svg>`;
const NINOT_BOSS = {
  name: "Ninot de la falla",
  icon: NINOT_SVG,
  desc: "Cartó pedra, purpurina i una crítica satírica que ningú entén. Ja l'han encés abans de la cremà i no pensa apagar-se.",
  mech: "ninot",
  ability: "Cremà permanent: crema tot el rato i et crema a tu cada segon, a banda dels seus atacs.",
  atkMult: 0.75,
};

// Pastor de Morella: cap especial de Morella i els Ports (amb el seu gos d'atura)
const PASTOR_BOSS = {
  name: "Pastor de Morella",
  icon: ENEMY_ART.pastor,
  desc: "Gaiato, samarra i tres-centes ovelles a la carretera. No té pressa i el seu gos, menys encara.",
  mech: "pastor",
  ability: "Gos d'atura: el seu gos l'ajuda i t'ataca pel seu compte (no té vida).",
  atkMult: 0.7,
};

// Examinador en cap: cap especial de la DGT (punt d'inflexió: després, la carretera de veritat)
const CHIEF_BOSS = {
  name: "Examinador en cap",
  icon: ENEMY_ART.examinadorCap,
  desc: "El cap de tots els examinadors. Ha suspés més gent que ningú a la Comunitat Valenciana i en té una carpeta per a demostrar-ho.",
  mech: "chief",
  ability: "Falta eliminatòria: cada 10 s t'apunta una falta. A la tercera et suspén i es cura un 25% de la vida (una vegada per combat).",
  hpMult: 0.85,
};

// img: imatge de fons de l'escenari (es pot substituir per un .png/.jpg amb el mateix nom de camp)
// boss (opcional): cap especial de l'escenari en lloc de l'Examinador de Trànsit
const SCENES = [
  { name: "Afores d'Eslida",                bg: "#3a4a3f", img: "img/escenari-1.svg" },
  { name: "Polígon industrial",             bg: "#4a4450", img: "img/escenari-2.svg" },
  { name: "Afores de Castelló",             bg: "#6b5a3a", img: "img/escenari-3.svg" },
  { name: "Avinguda València (Violència)",  bg: "#3a2440", img: "img/escenari-4.svg" },
  { name: "Carreronets de Sogorb",          bg: "#6b5f53", img: "img/escenari-6.svg", boss: PIXEL_BOSS },
  { name: "La Vall d'Uixó",                 bg: "#5a6b52", img: "img/escenari-5.svg" },
  { name: "La Vall d'Alba",                 bg: "#6b7a4a", img: "img/escenari-7.svg", boss: MARC_BOSS },
  { name: "València Centre",                bg: "#4a5a6b", img: "img/escenari-8.svg" },
  { name: "Aeroport de Castelló",           bg: "#7a8a9a", img: "img/escenari-9.svg",  boss: PLANE_BOSS },
  { name: "Benicàssim en el FIB",           bg: "#3a3a5a", img: "img/escenari-10.svg" },
  { name: "Bous a Vila-real",               bg: "#7a5a3a", img: "img/escenari-11.svg", boss: TORERO_BOSS },
  { name: "L'Albufera",                     bg: "#5a7a6a", img: "img/escenari-12.svg" },
  { name: "Rotondes de Castelló",           bg: "#6b7a5a", img: "img/escenari-13.svg" },
  { name: "Falles de València",             bg: "#4a3a5a", img: "img/escenari-14.svg", boss: NINOT_BOSS },
  { name: "AP-7 (sense peatges)",           bg: "#5a6a7a", img: "img/escenari-15.svg" },
  { name: "Desert de les Palmes",           bg: "#5a6a4a", img: "img/escenari-16.svg" },
  { name: "Morella i els Ports",            bg: "#7a8090", img: "img/escenari-17.svg", boss: PASTOR_BOSS },
  { name: "Circuit de Cheste",              bg: "#4a4a50", img: "img/escenari-18.svg" },
  { name: "Port de Sagunt",                 bg: "#4a5a6a", img: "img/escenari-19.svg" },
  { name: "DGT: examen pràctic",            bg: "#5a6a7a", img: "img/escenari-20.svg", boss: CHIEF_BOSS },
];
const DEFAULT_SCENE_BG = "#3a4250";

// Es precarreguen les fotos dels caps perquè ja estiguen llestes quan apareguen
for (const src of ["img/pixel.jpeg", "img/marc.jpeg", "img/gos-atura.svg"]) new Image().src = src;
