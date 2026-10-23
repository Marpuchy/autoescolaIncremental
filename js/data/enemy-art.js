// ===== DIBUIXOS DELS ENEMICS I DELS CAPS =====
// SVG plans com els fons: vehicles i animals de perfil mirant a l'esquerra (cap a la granoteta); les persones
// (fallera, pastor, examinadors) de front. La base de cada dibuix és el terra. Sense ids: el mateix SVG ix alhora
// al combat i al compendi. Les ombres són d'un blau fosc semitransparent (SH), mai negres.
// Els vehicles llargs porten preserveAspectRatio="xMidYMax meet": si no caben d'ample (mòbil), s'encongixen sense
// despegar-se del terra.
const ENEMY_ART = (() => {
  const SH = "#1a1a4e";
  const GLASS = "#a8d8ef";
  const svg = (w, h, label, body) =>
    `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax meet" aria-label="${label}">${body}</svg>`;
  const wheel = (cx, cy, r, rim = "#9aa3ad") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#23232b"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r * 0.56}" fill="${rim}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.2}" fill="#4a525c"/>`;
  const arch = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="#2a2a33"/>`;
  const glow = (cx, cy, r, c) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" opacity="0.35"/>`;
  const shine = d => `<path d="${d}" fill="#fff" opacity="0.35"/>`;

  // Algú assegut dins d'un vehicle, de perfil mirant a l'esquerra. wb: on acaba la finestra (els muscles no en passen)
  const rider = (x, y, wb, { skin = "#f0c8a0", hair = "#3a2a1a", shirt = "#3a5a8a", hat = "", shades = false, glasses = false } = {}) => `
    <path d="M${x - 10} ${wb} Q${x - 10} ${y + 8} ${x} ${y + 8} Q${x + 10} ${y + 8} ${x + 10} ${wb} Z" fill="${shirt}"/>
    <circle cx="${x}" cy="${y}" r="6.5" fill="${skin}"/><circle cx="${x - 6.2}" cy="${y + 1}" r="1.8" fill="${skin}"/>
    <path d="M${x - 5} ${y - 4} Q${x} ${y - 9.5} ${x + 6.5} ${y - 3} Q${x + 7.2} ${y + 3} ${x + 4} ${y + 5.5} Q${x + 2} ${y - 1} ${x - 5} ${y - 4} Z" fill="${hair}"/>
    <circle cx="${x - 3.2}" cy="${y - 0.6}" r="1.1" fill="#1d1d1f"/>
    ${shades ? `<rect x="${x - 7}" y="${y - 2.6}" width="6.5" height="3.2" rx="1.2" fill="#1d1d1f"/><path d="M${x - 1} ${y - 1.4} H${x + 4}" stroke="#1d1d1f" stroke-width="1"/>` : ""}
    ${glasses ? `<rect x="${x - 6.4}" y="${y - 2.6}" width="5" height="3.6" rx="1.2" fill="none" stroke="#1d1d1f" stroke-width="0.9"/><path d="M${x - 1.4} ${y - 1} H${x + 4}" stroke="#1d1d1f" stroke-width="0.9"/>` : ""}
    ${hat === "cap" ? `<path d="M${x - 6} ${y - 4} Q${x} ${y - 11} ${x + 7} ${y - 4} Z" fill="#6b5a44"/><path d="M${x - 10} ${y - 4} H${x - 3}" stroke="#4a3e30" stroke-width="2.4" stroke-linecap="round"/>` : ""}
    ${hat === "sun" ? `<ellipse cx="${x}" cy="${y - 4.5}" rx="11" ry="2.4" fill="#f2e2a8"/><path d="M${x - 5.5} ${y - 4.5} Q${x} ${y - 13} ${x + 5.5} ${y - 4.5} Z" fill="#f2e2a8"/><path d="M${x - 5.5} ${y - 5.5} H${x + 5.5}" stroke="#d1261f" stroke-width="1.6"/>` : ""}
    ${hat === "farmer" ? `<path d="M${x - 6} ${y - 4} Q${x} ${y - 12} ${x + 7} ${y - 4} Z" fill="#2f6fb5"/><path d="M${x - 11} ${y - 4} H${x - 2}" stroke="#1f4f86" stroke-width="2.6" stroke-linecap="round"/>` : ""}`;

  // Turisme de perfil (morro a l'esquerra) en 160×90: carrosseria, vidres, gent, llums, rodes
  const CAR_SHELL = "M6 70 V56 Q6 46 18 45 L48 42 L64 22 Q68 18 76 18 H114 Q122 18 128 24 L144 42 Q154 44 155 54 V70 Q155 76 149 76 H12 Q6 76 6 70 Z";
  const CAR_GLASS = "M52 42 L66 25 Q68 23 72 23 H88 V42 Z M92 23 H112 Q118 23 122 28 L134 42 H92 Z";
  const car = ({ body, glass = GLASS, people = "", roof = "", blink = false, trim = "#8a929c", extra = "" }) => `${roof}
    <path d="${CAR_SHELL}" fill="${body}"/>
    <path d="M18 45 L48 42 L64 22 Q68 18 76 18 H114 Q122 18 128 24 L144 42 Q150 43 153 47 Q120 44 90 45 Z" fill="#fff" opacity="0.12"/>
    <path d="${CAR_GLASS}" fill="${glass}"/>
    ${people}
    ${shine("M57 40 L68 26 H74 L63 40 Z M97 40 L105 26 H109 L101 40 Z")}
    <rect x="8" y="64" width="145" height="11" rx="5" fill="${SH}" opacity="0.18"/>
    <path d="M90 45 V68 M50 46 V68" stroke="${SH}" stroke-width="1.5" opacity="0.3"/>
    <rect x="94" y="49" width="9" height="3" rx="1.5" fill="${SH}" opacity="0.4"/><rect x="55" y="49" width="9" height="3" rx="1.5" fill="${SH}" opacity="0.4"/>
    <ellipse cx="11" cy="52" rx="4.5" ry="3.5" fill="#fff6c8"/>
    <rect x="149" y="48" width="6" height="10" rx="2" fill="#d1261f"/>
    <rect x="3" y="64" width="15" height="7" rx="3.5" fill="${trim}"/><rect x="143" y="64" width="14" height="7" rx="3.5" fill="${trim}"/>
    ${blink ? glow(10, 60, 8, "#ffb300") + `<rect x="7" y="57.5" width="7" height="5" rx="2" fill="#ffc533"/>` : `<rect x="7" y="57.5" width="7" height="5" rx="2" fill="#8a6a3a"/>`}
    ${arch(38, 76, 14)}${arch(124, 76, 14)}${wheel(38, 76, 14)}${wheel(124, 76, 14)}
    ${extra}`;

  // ---------------------------------------------------------------- 🚦 Semàfor en groc (de front: és un senyal)
  const semafor = svg(70, 150, "Semàfor en groc", `
    <ellipse cx="35" cy="146" rx="18" ry="4" fill="${SH}" opacity="0.25"/>
    <rect x="31" y="96" width="8" height="50" fill="#5a6470"/><rect x="31" y="96" width="3" height="50" fill="#fff" opacity="0.15"/>
    <rect x="12" y="2" width="46" height="98" rx="11" fill="#2b2f36"/>
    <rect x="12" y="2" width="10" height="98" rx="5" fill="#fff" opacity="0.08"/>
    <path d="M16 18 Q35 4 54 18 V22 H16 Z M16 49 Q35 35 54 49 V53 H16 Z M16 80 Q35 66 54 80 V84 H16 Z" fill="#1d1f24"/>
    <circle cx="35" cy="24" r="11" fill="#5a1a1a"/>
    ${glow(35, 55, 20, "#ffb300")}<circle cx="35" cy="55" r="11.5" fill="#ffb300"/><circle cx="31" cy="51" r="4" fill="#fff3c0"/>
    <circle cx="35" cy="86" r="11" fill="#1a4a2a"/>`);

  // ---------------------------------------------------------------- 🛴 Patinet elèctric (amb el mòbil a la mà)
  const patinet = svg(120, 130, "Patinet elèctric", `
    <ellipse cx="64" cy="127" rx="44" ry="3" fill="${SH}" opacity="0.2"/>
    <path d="M80 50 L64 58" stroke="#c4661a" stroke-width="7" stroke-linecap="round"/>
    <rect x="56" y="52" width="9" height="14" rx="2" fill="#1d1d1f"/><rect x="57.5" y="54" width="6" height="10" rx="1" fill="#7fd0ff"/>
    <path d="M78 74 L88 108" stroke="#2b4a78" stroke-width="10" stroke-linecap="round"/>
    <path d="M28 118 L38 44" stroke="#5a6470" stroke-width="5" stroke-linecap="round"/>
    <path d="M32 44 H46" stroke="#2b2f36" stroke-width="5" stroke-linecap="round"/>
    <circle cx="35" cy="62" r="2.6" fill="#fff6c8"/>
    <path d="M30 112 H100 Q104 112 104 116 H30 Z" fill="#2b2f36"/><path d="M92 112 Q100 104 108 114" stroke="#2b2f36" stroke-width="4" fill="none"/>
    ${wheel(28, 120, 8, "#7fc6e8")}${wheel(100, 120, 8, "#7fc6e8")}
    <path d="M76 74 L64 108" stroke="#3a5a8a" stroke-width="10" stroke-linecap="round"/>
    <path d="M58 106 H72 Q74 112 70 112 H56 Q54 108 58 106 Z M82 106 H96 Q98 112 94 112 H80 Q78 108 82 106 Z" fill="#f4f6f8"/>
    <path d="M64 80 Q60 56 66 44 Q74 36 84 42 Q90 58 88 80 Z" fill="#f28c28"/>
    <path d="M66 44 Q74 40 84 44 Q88 36 80 32 Q72 32 66 44 Z" fill="#d8731a"/>
    <path d="M70 50 L42 44" stroke="#f28c28" stroke-width="8" stroke-linecap="round"/>
    <circle cx="40" cy="44" r="4" fill="#f0c8a0"/>
    <circle cx="72" cy="28" r="11" fill="#f0c8a0"/><circle cx="61.5" cy="29.5" r="2.6" fill="#f0c8a0"/>
    <path d="M62 24 Q66 13 78 15 Q86 18 84 30 Q80 26 76 27 Q72 20 62 24 Z" fill="#2b1d14"/>
    <circle cx="66.5" cy="26" r="1.5" fill="#1d1d1f"/><path d="M63 33 Q66 35 69 33" stroke="#8a4a3a" stroke-width="1.3" fill="none"/>
    <circle cx="76" cy="30" r="2.4" fill="#fff"/>`);

  // ---------------------------------------------------------------- 🚴 Ciclista en la calçada
  const ciclista = svg(150, 128, "Ciclista en la calçada", `
    <ellipse cx="74" cy="125" rx="58" ry="3" fill="${SH}" opacity="0.2"/>
    <circle cx="34" cy="104" r="20" fill="none" stroke="#23232b" stroke-width="4"/><circle cx="114" cy="104" r="20" fill="none" stroke="#23232b" stroke-width="4"/>
    <g stroke="#9aa3ad" stroke-width="1"><path d="M34 86 V122 M16 104 H52 M21 91 L47 117 M47 91 L21 117"/><path d="M114 86 V122 M96 104 H132 M101 91 L127 117 M127 91 L101 117"/></g>
    <path d="M90 52 L96 78 L86 102" stroke="#14141c" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M82 104 H94" stroke="#1d1d1f" stroke-width="5" stroke-linecap="round"/>
    <g stroke="#d1261f" stroke-width="4.5" stroke-linecap="round" fill="none">
      <path d="M114 104 L74 104 L90 60 Z"/><path d="M90 60 L46 60 L42 72 L74 104"/>
    </g>
    <path d="M44 58 L42 72 L34 104" stroke="#3a3f46" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="74" cy="104" r="7" fill="none" stroke="#9aa3ad" stroke-width="2.5"/>
    <path d="M44 58 L37 57 Q29 57 31 65 Q33 69 38 67" stroke="#1d1d1f" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M84 56 H99" stroke="#1d1d1f" stroke-width="4" stroke-linecap="round"/>
    <path d="M90 52 L60 36" stroke="#f2c200" stroke-width="17" stroke-linecap="round"/>
    <path d="M86 50 L66 40" stroke="#1f4f9e" stroke-width="5" stroke-linecap="round"/>
    <path d="M90 52 L68 70 L64 100" stroke="#1d1d1f" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M68 70 L64 100" stroke="#f0c8a0" stroke-width="7" stroke-linecap="round"/>
    <path d="M58 100 H70" stroke="#f4f6f8" stroke-width="5" stroke-linecap="round"/>
    <path d="M60 40 L50 50" stroke="#f2c200" stroke-width="7" stroke-linecap="round"/>
    <path d="M50 50 L38 60" stroke="#f0c8a0" stroke-width="5.5" stroke-linecap="round"/><circle cx="37" cy="61" r="3.4" fill="#1d1d1f"/>
    <circle cx="48" cy="28" r="9" fill="#f0c8a0"/><circle cx="39.5" cy="29.5" r="2.2" fill="#f0c8a0"/>
    <path d="M38 24 Q42 12 56 15 Q66 18 66 26 Q58 24 52 25 Z" fill="#f4f6f8"/>
    <path d="M44 16 L48 22 M51 15 L54 22 M58 17 L59 24" stroke="#1f4f9e" stroke-width="2" stroke-linecap="round"/>
    <rect x="38" y="25" width="9" height="4" rx="1.6" fill="#1d1d1f"/>
    <path d="M41 33 Q43 35 46 34" stroke="#8a4a3a" stroke-width="1.2" fill="none"/>`);

  // ---------------------------------------------------------------- 🚗 Conductor de diumenge (intermitent posat)
  const diumenge = svg(160, 90, "Conductor de diumenge", car({
    body: "#d8c79a", trim: "#c9ced4", blink: true,
    people: rider(80, 32, 42, { skin: "#efc6a2", hair: "#c9c9c9", shirt: "#7a5a3a", hat: "cap", glasses: true }),
  }));

  // ---------------------------------------------------------------- 🚐 Furgoneta de repartiment (amb els warnings)
  const furgoneta = svg(180, 98, "Furgoneta de repartiment", `
    <path d="M6 82 V54 Q6 44 16 42 L32 16 Q35 10 42 10 H170 Q176 10 176 16 V82 Q176 84 174 84 H8 Q6 84 6 82 Z" fill="#f4f6f8"/>
    <path d="M42 10 H170 Q176 10 176 16 V24 H36 Z" fill="#fff" opacity="0.5"/>
    <path d="M14 44 L33 18 H50 V44 Z" fill="${GLASS}"/><rect x="54" y="18" width="24" height="26" rx="2" fill="${GLASS}"/>
    ${rider(66, 30, 44, { skin: "#c98f6a", hair: "#1d1d1f", shirt: "#2f8a4a" })}
    ${shine("M20 42 L35 21 H40 L25 42 Z M58 42 L64 20 H68 L62 42 Z")}
    <rect x="6" y="62" width="170" height="5" fill="#2f8a4a"/>
    <path d="M82 18 V80 M52 46 V80" stroke="${SH}" stroke-width="1.5" opacity="0.3"/>
    <rect x="102" y="26" width="38" height="28" rx="2" fill="#c8964a"/><path d="M102 34 H140" stroke="#a8763a" stroke-width="2"/>
    <rect x="117" y="26" width="8" height="28" fill="#e8c890" opacity="0.8"/>
    <path d="M147 30 V48 M141 42 L147 48 L153 42" stroke="#2f8a4a" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="8" y="70" width="168" height="13" rx="4" fill="${SH}" opacity="0.15"/>
    <ellipse cx="11" cy="52" rx="4.5" ry="3.5" fill="#fff6c8"/>
    ${glow(10, 64, 8, "#ffb300")}<rect x="7" y="61" width="7" height="6" rx="2" fill="#ffc533"/>
    ${glow(174, 46, 8, "#ffb300")}<rect x="171" y="42" width="6" height="8" rx="2" fill="#ffc533"/><rect x="171" y="52" width="6" height="8" rx="2" fill="#d1261f"/>
    <rect x="3" y="74" width="14" height="7" rx="3.5" fill="#5a6470"/><rect x="166" y="74" width="12" height="7" rx="3.5" fill="#5a6470"/>
    ${arch(36, 84, 14)}${arch(146, 84, 14)}${wheel(36, 84, 14)}${wheel(146, 84, 14)}`);

  // ---------------------------------------------------------------- 🚜 Tractor a 20 km/h
  const tractor = svg(160, 118, "Tractor a 20 km/h", `
    <path d="M90 62 L92 16 M134 50 L136 16" stroke="#3a3f46" stroke-width="4"/>
    <path d="M92 60 L94 18 H134 L134 50 Z" fill="${GLASS}" opacity="0.55"/>
    ${rider(114, 34, 56, { skin: "#d9a07a", hair: "#3a2a1a", shirt: "#c4161c", hat: "farmer" })}
    <path d="M100 52 L96 42" stroke="#2b2f36" stroke-width="3" stroke-linecap="round"/><path d="M92 40 L100 44" stroke="#2b2f36" stroke-width="3" stroke-linecap="round"/>
    <rect x="84" y="9" width="58" height="8" rx="3" fill="#f4f6f8"/>
    <path d="M14 96 V72 Q14 64 22 64 H96 V96 Z" fill="#2f9a3a"/>
    <path d="M22 64 H96 V70 H14 Q15 64 22 64 Z" fill="#fff" opacity="0.18"/>
    <path d="M14 72 H22 V94 H14 Z" fill="#1d4a22"/><path d="M15 77 H21 M15 82 H21 M15 87 H21" stroke="#3f6a44" stroke-width="1.5"/>
    <rect x="38" y="40" width="5" height="24" fill="#3a3f46"/><rect x="36" y="38" width="9" height="4" rx="1" fill="#2b2f36"/>
    <circle cx="44" cy="30" r="4" fill="#9aa3ad" opacity="0.5"/><circle cx="50" cy="22" r="5" fill="#9aa3ad" opacity="0.35"/>
    <ellipse cx="17" cy="68" rx="3" ry="2.6" fill="#fff6c8"/>
    <rect x="16" y="86" width="80" height="10" fill="${SH}" opacity="0.18"/>
    <circle cx="112" cy="84" r="32" fill="#23232b"/>
    <circle cx="112" cy="84" r="30" fill="none" stroke="#3a3a44" stroke-width="5" stroke-dasharray="5 6"/>
    <circle cx="112" cy="84" r="18" fill="#f2c200"/><circle cx="112" cy="84" r="7" fill="#c49a00"/>
    <path d="M74 88 Q76 46 112 46 Q148 46 150 88 H142 Q140 56 112 56 Q84 56 82 88 Z" fill="#2f9a3a"/>
    <path d="M78 70 Q84 50 112 48" stroke="#fff" stroke-width="2" opacity="0.25" fill="none"/>
    ${wheel(34, 102, 15, "#f2c200")}
    <circle cx="34" cy="102" r="13.5" fill="none" stroke="#3a3a44" stroke-width="3" stroke-dasharray="3 4"/>
    <path d="M18 92 Q22 80 34 80 Q46 80 50 92" stroke="#2f9a3a" stroke-width="5" fill="none"/>
    <circle cx="141" cy="20" r="4" fill="#ff7a1a"/>${glow(141, 20, 8, "#ff7a1a")}`);

  // ---------------------------------------------------------------- 🚌 Autobús urbà (ix de la parada)
  const autobus = svg(232, 109, "Autobús urbà", `
    <rect x="30" y="7" width="70" height="7" rx="3" fill="#c9ced4"/><rect x="130" y="7" width="60" height="7" rx="3" fill="#c9ced4"/>
    <path d="M10 92 V24 Q10 12 24 12 H220 Q228 12 228 20 V92 Z" fill="#d1261f"/>
    <path d="M24 12 H220 Q228 12 228 20 V24 H12 Q14 12 24 12 Z" fill="#fff" opacity="0.15"/>
    <path d="M12 64 V30 Q12 20 22 20 H40 V64 Z" fill="${GLASS}"/>
    <rect x="15" y="22" width="22" height="6" rx="1" fill="#1d1d1f"/><path d="M18 25 H34" stroke="#ff9a1a" stroke-width="2" stroke-dasharray="2 1.5"/>
    ${rider(30, 44, 64, { skin: "#f0c8a0", hair: "#5a3a28", shirt: "#1f4f9e" })}
    <rect x="62" y="22" width="24" height="66" rx="2" fill="${GLASS}"/><path d="M74 22 V88" stroke="#d1261f" stroke-width="2"/>
    ${[94, 126, 158, 190].map(x => `<rect x="${x}" y="22" width="28" height="32" rx="3" fill="${GLASS}"/>`).join("")}
    <g fill="#3a4a6a" opacity="0.45"><circle cx="106" cy="40" r="5"/><path d="M98 54 Q98 46 106 46 Q114 46 114 54 Z"/>
      <circle cx="170" cy="38" r="5"/><path d="M162 54 Q162 44 170 44 Q178 44 178 54 Z"/><circle cx="206" cy="41" r="4.5"/><path d="M199 54 Q199 47 206 47 Q213 47 213 54 Z"/></g>
    ${shine("M16 62 L28 22 H32 L20 62 Z M98 52 L106 24 H109 L101 52 Z M130 52 L138 24 H141 L133 52 Z M162 52 L170 24 H173 L165 52 Z M194 52 L202 24 H205 L197 52 Z")}
    <rect x="10" y="60" width="218" height="6" fill="#f4f6f8"/>
    <rect x="10" y="80" width="218" height="12" fill="${SH}" opacity="0.2"/>
    <path d="M12 22 L4 21 V36 H8" stroke="#2b2f36" stroke-width="3" fill="none" stroke-linejoin="round"/>
    <ellipse cx="14" cy="76" rx="4" ry="3.5" fill="#fff6c8"/>
    ${glow(13, 85, 8, "#ffb300")}<rect x="10" y="82" width="7" height="6" rx="2" fill="#ffc533"/>
    <rect x="223" y="66" width="5" height="12" rx="2" fill="#8a1010"/>
    ${arch(40, 94, 15)}${arch(190, 94, 15)}${wheel(40, 94, 15)}${wheel(190, 94, 15)}`);

  // ---------------------------------------------------------------- 🚚 Camió del fem
  const fem = svg(212, 109, "Camió del fem", `
    <path d="M66 92 V14 Q66 8 72 8 H182 Q190 8 194 16 L208 72 V92 Z" fill="#2f8a4a"/>
    <path d="M72 8 H182 Q190 8 194 16 L196 22 H66 V14 Q66 8 72 8 Z" fill="#fff" opacity="0.15"/>
    <path d="M94 12 V86 M122 12 V86 M150 12 V86" stroke="${SH}" stroke-width="3" opacity="0.25"/>
    <path d="M176 8 Q190 8 194 16 L208 72 V92 H176 Z" fill="#256e3b"/>
    <path d="M184 78 L196 78 L200 92 H184 Z" fill="#f2c200"/><path d="M188 78 L192 92 M194 78 L197 88" stroke="#d1261f" stroke-width="2.5"/>
    <g transform="rotate(-18 196 50)"><rect x="186" y="34" width="22" height="28" rx="2" fill="#4a7a3a"/><rect x="184" y="31" width="26" height="5" rx="2" fill="#3a5a2a"/></g>
    <path d="M100 40 L108 48 L120 32" stroke="#f4f6f8" stroke-width="0" fill="none"/>
    <circle cx="108" cy="48" r="12" fill="#f4f6f8" opacity="0.9"/>
    <path d="M102 44 H114 L112 58 H104 Z" fill="#2f8a4a"/><rect x="101" y="41" width="14" height="3" rx="1" fill="#2f8a4a"/>
    <path d="M8 90 V40 Q8 30 18 28 L30 14 Q32 12 36 12 H64 V90 Z" fill="#eef1f4"/>
    <path d="M13 42 L30 19 H58 V44 H13 Z" fill="${GLASS}"/>
    ${rider(44, 31, 44, { skin: "#d9a07a", hair: "#1d1d1f", shirt: "#ff8a1a" })}
    ${shine("M19 41 L32 22 H37 L24 41 Z")}
    <path d="M8 60 H64" stroke="#2f8a4a" stroke-width="5"/>
    <rect x="30" y="4" width="14" height="8" rx="3" fill="#ff8a1a"/>${glow(37, 8, 9, "#ff8a1a")}
    <ellipse cx="12" cy="52" rx="3.5" ry="3" fill="#fff6c8"/>
    <rect x="6" y="84" width="202" height="8" fill="#2b2f36"/>
    <rect x="8" y="72" width="56" height="12" fill="${SH}" opacity="0.15"/>
    <rect x="3" y="78" width="12" height="8" rx="3" fill="#5a6470"/>
    ${arch(36, 94, 15)}${arch(134, 94, 15)}${arch(168, 94, 15)}${wheel(36, 94, 15)}${wheel(134, 94, 15)}${wheel(168, 94, 15)}`);

  // ---------------------------------------------------------------- 🛻 Grua municipal (amb un cotxe a la plataforma)
  const towedCar = car({ body: "#c4161c", trim: "#8a929c" });
  const grua = svg(240, 113, "Grua municipal", `
    <g transform="translate(124 10.4) scale(0.62)">${towedCar}</g>
    <path d="M70 58 L126 54" stroke="#2b2f36" stroke-width="2"/>
    <rect x="62" y="66" width="174" height="12" rx="2" fill="#5a6470"/><rect x="62" y="66" width="174" height="4" fill="#fff" opacity="0.2"/>
    <path d="M62 78 H236 V84 H62 Z" fill="#f2c200"/><path d="M70 78 L76 84 M86 78 L92 84 M102 78 L108 84 M118 78 L124 84 M134 78 L140 84 M150 78 L156 84 M166 78 L172 84 M182 78 L188 84 M198 78 L204 84 M214 78 L220 84 M230 78 L236 84" stroke="#2b2f36" stroke-width="3"/>
    <rect x="64" y="52" width="12" height="14" rx="2" fill="#2b2f36"/>
    <path d="M8 92 V42 Q8 32 18 30 L30 16 Q32 14 36 14 H62 V92 Z" fill="#f4f6f8"/>
    <path d="M13 44 L30 21 H56 V46 H13 Z" fill="${GLASS}"/>
    ${rider(42, 33, 46, { skin: "#f0c8a0", hair: "#1d1d1f", shirt: "#1f4f9e", shades: true })}
    ${shine("M19 43 L32 24 H37 L24 43 Z")}
    <rect x="8" y="58" width="54" height="4" fill="#ff8a1a"/><rect x="8" y="64" width="54" height="3" fill="#1f4f9e"/>
    <rect x="24" y="7" width="26" height="7" rx="3" fill="#ff8a1a"/>${glow(30, 10, 9, "#ff8a1a")}${glow(44, 10, 9, "#ff8a1a")}
    <ellipse cx="12" cy="54" rx="3.5" ry="3" fill="#fff6c8"/>
    <rect x="6" y="86" width="230" height="7" fill="#2b2f36"/>
    <rect x="8" y="74" width="54" height="12" fill="${SH}" opacity="0.15"/>
    <rect x="3" y="80" width="12" height="8" rx="3" fill="#5a6470"/>
    ${arch(36, 98, 15)}${arch(176, 98, 15)}${arch(208, 98, 15)}${wheel(36, 98, 15)}${wheel(176, 98, 15)}${wheel(208, 98, 15)}`);

  // ---------------------------------------------------------------- 🚛 Camió articulat (espills enormes)
  const articulat = svg(266, 114, "Camió articulat", `
    <rect x="76" y="4" width="186" height="80" rx="4" fill="#eef1f4"/>
    <rect x="76" y="4" width="186" height="10" rx="4" fill="#fff" opacity="0.6"/>
    <path d="M100 6 V82 M124 6 V82 M148 6 V82 M172 6 V82 M196 6 V82 M220 6 V82" stroke="${SH}" stroke-width="1.5" opacity="0.12"/>
    <rect x="76" y="50" width="186" height="8" fill="#1f4f9e"/><rect x="76" y="60" width="186" height="3" fill="#1f4f9e"/>
    <path d="M244 6 V82 M253 6 V82" stroke="${SH}" stroke-width="2" opacity="0.25"/>
    <rect x="76" y="72" width="186" height="12" fill="${SH}" opacity="0.12"/>
    <rect x="76" y="84" width="186" height="6" fill="#2b2f36"/>
    <path d="M86 90 V100 M126 90 V100" stroke="#3a3f46" stroke-width="4"/>
    <rect x="60" y="86" width="56" height="8" fill="#2b2f36"/><rect x="70" y="82" width="20" height="5" rx="2" fill="#3a3f46"/>
    <path d="M30 8 Q50 0 72 2 V10 H30 Z" fill="#a8141a"/>
    <path d="M8 96 V16 Q8 8 16 8 H66 Q72 8 72 14 V96 Z" fill="#c4161c"/>
    <path d="M16 8 H66 Q72 8 72 14 V18 H8 V16 Q8 8 16 8 Z" fill="#fff" opacity="0.18"/>
    <rect x="10" y="16" width="24" height="30" rx="3" fill="${GLASS}"/>
    <rect x="38" y="16" width="28" height="26" rx="3" fill="${GLASS}"/>
    ${rider(50, 28, 42, { skin: "#c98f6a", hair: "#2b1d14", shirt: "#f4f6f8" })}
    ${shine("M14 44 L22 18 H26 L18 44 Z M42 40 L48 18 H51 L45 40 Z")}
    <path d="M36 48 V90" stroke="${SH}" stroke-width="1.5" opacity="0.3"/><rect x="40" y="58" width="8" height="3" rx="1.5" fill="${SH}" opacity="0.4"/>
    <rect x="8" y="60" width="10" height="20" fill="#2b2f36"/><path d="M9 64 H17 M9 68 H17 M9 72 H17 M9 76 H17" stroke="#5a6470" stroke-width="1.5"/>
    <ellipse cx="12" cy="56" rx="3.5" ry="3" fill="#fff6c8"/><rect x="9" y="84" width="7" height="5" rx="2" fill="#ffc533"/>
    <path d="M10 22 H4 V40" stroke="#2b2f36" stroke-width="2.5" fill="none"/><rect x="0" y="20" width="6" height="22" rx="2" fill="#2b2f36"/>
    <rect x="8" y="80" width="64" height="16" fill="${SH}" opacity="0.15"/>
    ${arch(34, 100, 14)}${arch(98, 100, 14)}${arch(206, 100, 14)}${arch(236, 100, 14)}
    ${wheel(34, 100, 14)}${wheel(98, 100, 14)}${wheel(206, 100, 14)}${wheel(236, 100, 14)}`);

  // ---------------------------------------------------------------- 🚂 Tren de mercaderies (locomotora dièsel)
  const tren = svg(232, 116, "Tren de mercaderies", `
    <rect x="0" y="108" width="232" height="4" fill="#7a7f88"/>
    <g fill="#6b4f2a">${[4, 30, 56, 82, 108, 134, 160, 186, 212].map(x => `<rect x="${x}" y="112" width="16" height="4"/>`).join("")}</g>
    <rect x="76" y="6" width="40" height="8" rx="2" fill="#5a6470"/><rect x="130" y="6" width="60" height="8" rx="2" fill="#5a6470"/>
    <path d="M6 90 V48 L18 18 Q20 14 26 14 H220 Q226 14 226 20 V90 Z" fill="#3a5a8a"/>
    <path d="M26 14 H220 Q226 14 226 20 V24 H16 L18 18 Q20 14 26 14 Z" fill="#fff" opacity="0.15"/>
    <path d="M6 90 V48 L12 34 H30 V90 Z" fill="#f2c200"/>
    <path d="M12 46 L22 22 H42 V46 Z" fill="${GLASS}"/>
    ${rider(34, 34, 46, { skin: "#efc6a2", hair: "#5a5a5a", shirt: "#ff8a1a" })}
    ${shine("M17 44 L25 25 H29 L21 44 Z")}
    <rect x="48" y="24" width="18" height="18" rx="2" fill="${GLASS}"/>
    <g fill="#2b3f60">${[78, 94, 110, 126, 142, 158, 174, 190, 206].map(x => `<rect x="${x}" y="26" width="10" height="30" rx="2"/>`).join("")}</g>
    <rect x="6" y="62" width="220" height="7" fill="#f2c200"/>
    <rect x="6" y="76" width="220" height="14" fill="${SH}" opacity="0.2"/>
    ${glow(12, 80, 8, "#fff6c8")}<circle cx="12" cy="80" r="3.5" fill="#fff6c8"/>
    <rect x="0" y="84" width="8" height="6" rx="2" fill="#2b2f36"/><rect x="226" y="84" width="6" height="6" rx="2" fill="#2b2f36"/>
    <rect x="6" y="88" width="220" height="6" fill="#2b2f36"/>
    <rect x="28" y="92" width="48" height="8" rx="3" fill="#3a3f46"/><rect x="156" y="92" width="48" height="8" rx="3" fill="#3a3f46"/>
    ${wheel(40, 99, 9)}${wheel(64, 99, 9)}${wheel(168, 99, 9)}${wheel(192, 99, 9)}`);

  // ---------------------------------------------------------------- 🚙 Conductor sense intermitent (SUV, vidres foscos)
  const sensIntermitent = svg(160, 90, "Conductor sense intermitent", `
    <rect x="66" y="8" width="76" height="3" rx="1.5" fill="#1d1d1f"/><path d="M70 11 V13 M138 11 V13" stroke="#1d1d1f" stroke-width="2"/>
    <path d="M6 70 V50 Q6 42 16 41 L42 38 L56 16 Q59 12 66 12 H146 Q154 12 154 20 V70 Q154 76 148 76 H12 Q6 76 6 70 Z" fill="#2b3440"/>
    <path d="M16 41 L42 38 L56 16 Q59 12 66 12 H146 Q154 12 154 20 V26 Q100 26 50 32 L44 42 Z" fill="#fff" opacity="0.1"/>
    <path d="M46 38 L58 18 H82 V38 Z M86 18 H112 V38 H86 Z M116 18 H146 Q149 18 149 22 V38 H116 Z" fill="#4a6070"/>
    ${rider(72, 28, 38, { skin: "#e8b890", hair: "#1d1d1f", shirt: "#f4f6f8", shades: true })}
    ${shine("M50 36 L60 20 H65 L55 36 Z M90 36 L96 20 H99 L93 36 Z")}
    <rect x="8" y="62" width="145" height="13" rx="5" fill="${SH}" opacity="0.25"/>
    <path d="M84 40 V68 M114 40 V68" stroke="#fff" stroke-width="1" opacity="0.15"/>
    <path d="M10 46 H40" stroke="#c9ced4" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M8 47 L20 45 L22 51 L9 52 Z" fill="#e8f4ff"/>
    <rect x="7" y="56" width="8" height="5" rx="2" fill="#5a4a3a"/>
    <rect x="148" y="28" width="6" height="14" rx="2" fill="#d1261f"/>
    <circle cx="152" cy="52" r="8" fill="#23232b"/><circle cx="152" cy="52" r="4.4" fill="#3a3f46"/>
    <rect x="2" y="62" width="16" height="9" rx="3" fill="#1d1d1f"/><rect x="142" y="64" width="16" height="7" rx="3" fill="#1d1d1f"/>
    ${arch(38, 75, 15)}${arch(124, 75, 15)}${wheel(38, 75, 15, "#c9ced4")}${wheel(124, 75, 15, "#c9ced4")}`);

  // ---------------------------------------------------------------- 💃 Fallera amb petards (de front, amb una traca)
  const fallera = svg(120, 182, "Fallera amb petards", `
    <ellipse cx="60" cy="178" rx="38" ry="4" fill="${SH}" opacity="0.2"/>
    <circle cx="60" cy="24" r="9" fill="#3a2418"/>
    <path d="M46 23 A14 14 0 0 1 74 23 Z" fill="#e8c050"/><path d="M60 23 L50 13 M60 23 L55 10 M60 23 V9 M60 23 L65 10 M60 23 L70 13" stroke="#b8902a" stroke-width="1.3"/>
    <path d="M46 23 A14 14 0 0 1 74 23" stroke="#b8902a" stroke-width="1.5" fill="none"/>
    <path d="M24 172 Q16 122 42 98 H78 Q104 122 96 172 Q60 180 24 172 Z" fill="#f4d77a"/>
    <g fill="#e8749a">${[[34, 150], [50, 160], [70, 162], [86, 148], [40, 128], [82, 126], [60, 140], [30, 166], [92, 166]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/><circle cx="${x}" cy="${y}" r="1.2" fill="#f4d77a"/>`).join("")}</g>
    <g fill="#5aa86a">${[[37, 147], [53, 157], [73, 159], [89, 145], [63, 137]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="1.2"/>`).join("")}</g>
    <path d="M24 172 Q60 180 96 172 L95 166 Q60 174 25 166 Z" fill="#c9a040"/>
    <path d="M44 100 H76 L82 166 Q60 172 38 166 Z" fill="#fffaf0" opacity="0.88"/>
    <g fill="#fffaf0">${[40, 46, 52, 58, 64, 70, 76, 81].map(x => `<circle cx="${x}" cy="${167 + Math.abs(60 - x) * 0.06}" r="3"/>`).join("")}</g>
    <path d="M48 110 Q60 116 72 110 M46 124 Q60 130 74 124 M45 138 Q60 144 75 138" stroke="#e8dcc0" stroke-width="1.5" fill="none"/>
    <ellipse cx="48" cy="176" rx="8" ry="4" fill="#f4f6f8"/><ellipse cx="72" cy="176" rx="8" ry="4" fill="#f4f6f8"/>
    <path d="M42 100 Q40 76 46 64 H74 Q80 76 78 100 Z" fill="#e8b84a"/>
    <g fill="#e8749a" opacity="0.8"><circle cx="50" cy="84" r="2.4"/><circle cx="70" cy="80" r="2.4"/><circle cx="60" cy="94" r="2.4"/></g>
    <path d="M78 66 L92 84 L80 98" stroke="#e8b84a" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M90 82 L80 97" stroke="#f0c8a0" stroke-width="6" stroke-linecap="round"/>
    <path d="M42 66 L30 86" stroke="#e8b84a" stroke-width="9" stroke-linecap="round"/>
    <path d="M30 86 L20 96" stroke="#f0c8a0" stroke-width="6" stroke-linecap="round"/><circle cx="19" cy="97" r="4" fill="#f0c8a0"/>
    <path d="M40 62 Q60 56 80 62 L84 72 Q66 88 60 100 Q54 88 36 72 Z" fill="#fffaf0" opacity="0.92"/>
    <path d="M38 70 Q60 80 82 70 M44 78 Q60 88 76 78" stroke="#e8dcc0" stroke-width="1.4" fill="none"/>
    <rect x="55" y="50" width="10" height="12" fill="#e8b890"/>
    <ellipse cx="60" cy="40" rx="12" ry="14" fill="#f0c8a0"/>
    <path d="M47 38 Q48 22 60 22 Q72 22 73 38 Q68 29 60 29 Q52 29 47 38 Z" fill="#3a2418"/>
    <circle cx="45" cy="38" r="8" fill="#3a2418"/><circle cx="75" cy="38" r="8" fill="#3a2418"/>
    <path d="M41 35 Q45 31 49 36 Q45 41 41 38 M79 35 Q75 31 71 36 Q75 41 79 38" stroke="#5a3a28" stroke-width="1.5" fill="none"/>
    <g fill="#e8c050"><circle cx="41" cy="33" r="1.8"/><circle cx="44" cy="44" r="1.5"/><circle cx="79" cy="33" r="1.8"/><circle cx="76" cy="44" r="1.5"/></g>
    <circle cx="55" cy="40" r="1.5" fill="#1d1d1f"/><circle cx="65" cy="40" r="1.5" fill="#1d1d1f"/>
    <path d="M52 36 Q55 34.5 57 36 M63 36 Q65 34.5 68 36" stroke="#3a2418" stroke-width="1.2" fill="none"/>
    <ellipse cx="51.5" cy="46" rx="3" ry="1.8" fill="#ff8a9a" opacity="0.6"/><ellipse cx="68.5" cy="46" rx="3" ry="1.8" fill="#ff8a9a" opacity="0.6"/>
    <path d="M55 48 Q60 52 66 47" stroke="#b8333a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <circle cx="48" cy="47" r="1.8" fill="#e8c050"/><circle cx="72" cy="47" r="1.8" fill="#e8c050"/>
    <path d="M19 99 Q12 120 18 140 Q22 152 16 160" stroke="#5a3a28" stroke-width="1.4" fill="none"/>
    <g fill="#d1261f">${[[17, 106], [14, 116], [15, 126], [18, 136], [20, 146]].map(([x, y]) => `<rect x="${x - 4}" y="${y - 1.8}" width="8" height="3.6" rx="1"/>`).join("")}</g>
    <path d="M10 160 L16 156 L22 160 L18 154 L24 150 L17 151 L16 144 L14 151 L8 151 L13 155 Z" fill="#ffd23f"/>
    <circle cx="16" cy="155" r="2.2" fill="#ff7a1a"/>
    <circle cx="26" cy="146" r="1.4" fill="#ffd23f"/><circle cx="6" cy="148" r="1.2" fill="#ffd23f"/>`);

  // ---------------------------------------------------------------- 🚗🧳 Cotxe de lloguer de guiri
  const guiri = svg(160, 90, "Cotxe de lloguer de guiri", car({
    body: "#f4f6f8", trim: "#5a6470",
    people: rider(80, 32, 42, { skin: "#f4a28c", hair: "#f2d27a", shirt: "#f28cb0", hat: "sun", shades: true }),
    roof: `<path d="M72 16 H118" stroke="#2b2f36" stroke-width="2.5"/><path d="M78 16 V13 M112 16 V13" stroke="#2b2f36" stroke-width="2"/>
      <rect x="80" y="0" width="30" height="13" rx="3" fill="#2f6fb5"/><rect x="80" y="0" width="30" height="4" rx="2" fill="#fff" opacity="0.2"/>
      <path d="M90 0 V13 M100 0 V13" stroke="#1f4f86" stroke-width="1.5"/>
      <circle cx="85" cy="8" r="2.5" fill="#f2c200"/><rect x="102" y="5" width="6" height="4" rx="1" fill="#f28cb0"/>`,
  }));

  // ---------------------------------------------------------------- 🐗 Senglar
  const senglar = svg(160, 102, "Senglar", `
    <ellipse cx="86" cy="99" rx="62" ry="3" fill="${SH}" opacity="0.2"/>
    <path d="M46 76 V96 M118 74 V96" stroke="#3a2418" stroke-width="10" stroke-linecap="round"/>
    <path d="M144 44 Q154 40 152 50 Q150 56 156 54" stroke="#3a2418" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M30 50 Q34 26 70 22 Q120 18 140 40 Q150 58 138 74 Q120 84 80 82 Q44 82 34 70 Z" fill="#5a3a28"/>
    <path d="M44 32 l4 -8 l4 6 l4 -9 l4 8 l4 -9 l4 8 l4 -9 l4 8 l5 -9 l4 8 l5 -8 l4 8 l5 -7 l4 8 l5 -6 l4 8 l4 -4 l4 9 Q90 30 44 32 Z" fill="#3a2418"/>
    <path d="M40 72 Q80 86 136 72 Q120 84 80 82 Q48 82 40 72 Z" fill="${SH}" opacity="0.25"/>
    <path d="M60 40 Q90 32 124 44" stroke="#7a5238" stroke-width="2" fill="none" opacity="0.6"/>
    <path d="M42 34 Q20 40 12 56 Q8 64 14 67 L28 69 Q42 70 48 58 Z" fill="#4a2e1e"/>
    <ellipse cx="10" cy="61" rx="4.5" ry="6.5" fill="#c9a088"/><circle cx="9" cy="59" r="1.1" fill="#3a2418"/><circle cx="9.5" cy="64" r="1.1" fill="#3a2418"/>
    <path d="M22 66 Q14 62 15 52 Q19 60 25 62 Z" fill="#f4f1ea"/>
    <circle cx="30" cy="47" r="2.6" fill="#1d1d1f"/><circle cx="29.2" cy="46.2" r="0.9" fill="#fff"/>
    <path d="M26 42 L34 44" stroke="#2b1d14" stroke-width="2" stroke-linecap="round"/>
    <path d="M38 32 L46 16 L54 32 Z" fill="#3a2418"/><path d="M42 30 L46 21 L50 30 Z" fill="#8a5a4a"/>
    <path d="M58 78 V98 M130 72 V98" stroke="#4a2e1e" stroke-width="10" stroke-linecap="round"/>
    <path d="M54 96 H62 V100 H54 Z M126 96 H134 V100 H126 Z" fill="#1d1d1f"/>`);

  // ---------------------------------------------------------------- 🐑 Ramat d'ovelles
  const ovella = (x, y, s, wool, bell = false) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M22 50 V68 M58 48 V66" stroke="#3a3a40" stroke-width="5" stroke-linecap="round"/>
    <g fill="${wool}"><circle cx="28" cy="34" r="14"/><circle cx="44" cy="27" r="15"/><circle cx="60" cy="29" r="14"/><circle cx="72" cy="40" r="12"/>
      <circle cx="54" cy="45" r="14"/><circle cx="36" cy="46" r="13"/><circle cx="22" cy="42" r="11"/></g>
    <path d="M14 46 Q40 62 82 44 Q76 58 54 59 Q30 60 14 46 Z" fill="${SH}" opacity="0.15"/>
    <path d="M30 50 V70 M66 48 V68" stroke="#2b2b30" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="12" cy="34" rx="9" ry="11.5" fill="#2b2b30" transform="rotate(20 12 34)"/>
    <ellipse cx="21" cy="27" rx="7" ry="3" fill="#2b2b30" transform="rotate(-25 21 27)"/>
    <circle cx="16" cy="22" r="6.5" fill="${wool}"/>
    <circle cx="8" cy="31" r="1.8" fill="#fff"/><circle cx="7.6" cy="31.2" r="0.9" fill="#1d1d1f"/>
    ${bell ? `<path d="M14 44 Q20 48 26 44" stroke="#d1261f" stroke-width="2" fill="none"/><path d="M17 46 H23 L22 52 H18 Z" fill="#e8c050"/>` : ""}
  </g>`;
  const ovelles = svg(172, 112, "Ramat d'ovelles", `
    <ellipse cx="88" cy="109" rx="78" ry="3" fill="${SH}" opacity="0.2"/>
    ${ovella(88, 20, 0.85, "#e6e0d4")}${ovella(46, 32, 0.9, "#eee9df")}${ovella(4, 40, 1, "#f7f4ee", true)}`);

  // ---------------------------------------------------------------- 🏍️ Pilot de MotoGP (ajupit i amb el genoll fora)
  const motogp = svg(170, 122, "Pilot de MotoGP", `
    <ellipse cx="84" cy="119" rx="70" ry="3" fill="${SH}" opacity="0.2"/>
    ${wheel(132, 100, 20, "#f2c200")}
    <path d="M132 100 L98 80" stroke="#2b2f36" stroke-width="8" stroke-linecap="round"/>
    <path d="M36 100 L56 50" stroke="#c9a040" stroke-width="5" stroke-linecap="round"/>
    ${wheel(36, 100, 20, "#f2c200")}<circle cx="36" cy="100" r="9" fill="none" stroke="#c9ced4" stroke-width="3"/>
    <rect x="116" y="66" width="30" height="7" rx="3" fill="#5a6470"/><rect x="142" y="64" width="8" height="11" rx="2" fill="#3a3f46"/>
    <path d="M38 62 Q40 46 54 40 L70 36 Q84 40 94 46 L112 50 L150 42 Q158 42 154 52 L118 62 L108 84 Q84 92 58 84 Q44 78 38 62 Z" fill="#d1261f"/>
    <path d="M58 84 Q84 92 108 84 L112 74 Q84 82 52 78 Z" fill="${SH}" opacity="0.25"/>
    <path d="M46 60 Q58 48 80 50 L104 56" stroke="#f4f6f8" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="72" cy="66" r="7.5" fill="#f4f6f8"/><circle cx="72" cy="66" r="3.2" fill="#d1261f"/>
    <path d="M54 40 Q60 27 73 30 L70 36 Z" fill="${GLASS}"/>
    <ellipse cx="42" cy="60" rx="3" ry="2.6" fill="#fff6c8"/>
    <path d="M108 46 L94 66 L108 76" stroke="#1f4f9e" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M106 50 L95 64" stroke="#f2c200" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="93" cy="68" rx="5" ry="3.5" fill="#c9ced4"/>
    <path d="M102 72 H116 Q118 78 114 79 H102 Z" fill="#1d1d1f"/>
    <path d="M106 44 L80 32" stroke="#1f4f9e" stroke-width="16" stroke-linecap="round"/>
    <path d="M106 39 Q96 30 84 27" stroke="#f2c200" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M82 34 L72 46 L59 45" stroke="#1f4f9e" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="58" cy="45" r="4.2" fill="#1d1d1f"/>
    <circle cx="72" cy="27" r="11.5" fill="#f2c200"/>
    <path d="M60 27 Q61 19 70 18 L70 29 Q64 31 60 27 Z" fill="#1d1d1f"/>
    <path d="M74 16 Q84 17 84 27" stroke="#d1261f" stroke-width="3.5" fill="none"/>
    <path d="M82 21 L90 25 L82 29 Z" fill="#f2c200"/>`);

  // ---------------------------------------------------------------- 🚘 Cotxe de doble pedal (autoescola rival)
  const doblePedal = svg(160, 90, "Cotxe de doble pedal", car({
    body: "#f2c200", trim: "#5a6470",
    people: rider(76, 33, 42, { skin: "#f0c8a0", hair: "#7a4a2a", shirt: "#d1261f" }) +
      rider(104, 33, 42, { skin: "#e8b890", hair: "#2b2b30", shirt: "#3a4250", glasses: true }),
    roof: `<rect x="86" y="13" width="3" height="6" fill="#2b2f36"/><rect x="106" y="13" width="3" height="6" fill="#2b2f36"/>
      <rect x="82" y="1" width="31" height="13" rx="2" fill="#1f4f9e"/><path d="M93 4 V11 H101" stroke="#fff" stroke-width="2.6" fill="none"/>`,
  }));

  // ---------------------------------------------------------------- Caps (de front)
  // Examinador: vestit, carpeta amb la llista de faltes i cara de pòquer. El cap té galó daurat, corbata roja i bigot.
  const examinador = chief => svg(110, 180, chief ? "Examinador en cap" : "Examinador de Trànsit", `
    <ellipse cx="55" cy="176" rx="30" ry="3.5" fill="${SH}" opacity="0.2"/>
    <path d="M46 118 V170 M64 118 V170" stroke="${chief ? "#1d232c" : "#2b3440"}" stroke-width="12" stroke-linecap="round"/>
    <ellipse cx="44" cy="173" rx="9" ry="4" fill="#1d1d1f"/><ellipse cx="66" cy="173" rx="9" ry="4" fill="#1d1d1f"/>
    <path d="M34 124 Q32 76 40 66 H70 Q78 76 76 124 Z" fill="${chief ? "#2b3440" : "#4a5568"}"/>
    <path d="M47 66 L55 92 L63 66 Z" fill="#f4f6f8"/>
    <path d="M53 68 H57 L58.5 86 L55 92 L51.5 86 Z" fill="${chief ? "#c4161c" : "#1f4f9e"}"/>
    <path d="M47 66 L53 98 M63 66 L57 98" stroke="${SH}" stroke-width="2" opacity="0.4"/>
    ${chief ? `<path d="M66 74 L67.5 78 L71.5 78 L68.3 80.5 L69.5 84.5 L66 82 L62.5 84.5 L63.7 80.5 L60.5 78 L64.5 78 Z" fill="#e8c050"/>
      <path d="M36 70 H44 M66 70 H74" stroke="#e8c050" stroke-width="2.5" stroke-linecap="round"/>`
      : `<rect x="62" y="76" width="9" height="12" rx="1.5" fill="#f4f6f8"/><rect x="64" y="78" width="5" height="3" fill="#1f4f9e"/>`}
    <path d="M40 70 L33 100 L46 108" stroke="${chief ? "#2b3440" : "#4a5568"}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M70 70 L77 100 L64 108" stroke="${chief ? "#2b3440" : "#4a5568"}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${chief ? `<rect x="38" y="91" width="34" height="40" rx="2" fill="#f4f6f8"/><rect x="39" y="89" width="34" height="40" rx="2" fill="#e8e2d4"/>` : ""}
    <rect x="40" y="88" width="30" height="40" rx="2" fill="#b88a4a"/>
    <rect x="43" y="93" width="24" height="32" fill="#fff"/>
    <rect x="49" y="85" width="12" height="6" rx="1.5" fill="#9aa3ad"/>
    <path d="M50 100 H64 M50 108 H64 M50 116 H64" stroke="#c9ced4" stroke-width="2"/>
    <path d="M44.5 100 L46.5 102 L49 97.5" stroke="#2f9a3a" stroke-width="1.6" fill="none"/>
    <path d="M44.5 106 L48.5 110 M48.5 106 L44.5 110 M44.5 114 L48.5 118 M48.5 114 L44.5 118" stroke="#d1261f" stroke-width="1.6"/>
    <circle cx="45" cy="108" r="4.5" fill="#efc6a2"/><circle cx="65" cy="108" r="4.5" fill="#efc6a2"/>
    <rect x="50" y="52" width="10" height="14" fill="#e3b48e"/>
    <ellipse cx="55" cy="42" rx="13" ry="15" fill="#efc6a2"/>
    <ellipse cx="42" cy="44" rx="2.6" ry="4" fill="#e3b48e"/><ellipse cx="68" cy="44" rx="2.6" ry="4" fill="#e3b48e"/>
    ${chief ? `<path d="M42 40 Q42 30 46 28 L47 38 Z M68 40 Q68 30 64 28 L63 38 Z" fill="#c9c9c9"/>
      <path d="M45 50 Q50 46 55 49 Q60 46 65 50 Q60 53 55 51 Q50 53 45 50 Z" fill="#c9c9c9"/>
      <path d="M46 34 L53 36.5 M64 34 L57 36.5" stroke="#5a5a5a" stroke-width="2.2" stroke-linecap="round"/>`
      : `<path d="M42 40 Q40 26 55 25 Q70 26 68 40 Q66 32 60 32 Q52 30 46 34 Z" fill="#3a2a1a"/>
      <path d="M47 36 H53 M57 36 H63" stroke="#3a2a1a" stroke-width="1.8" stroke-linecap="round"/>`}
    <rect x="45.5" y="38" width="8" height="6" rx="2" fill="none" stroke="#1d1d1f" stroke-width="1.2"/>
    <rect x="56.5" y="38" width="8" height="6" rx="2" fill="none" stroke="#1d1d1f" stroke-width="1.2"/>
    <path d="M53.5 40.5 H56.5" stroke="#1d1d1f" stroke-width="1.2"/>
    <circle cx="49.5" cy="41" r="1.3" fill="#1d1d1f"/><circle cx="60.5" cy="41" r="1.3" fill="#1d1d1f"/>
    <path d="M55 43 V47 H53.5" stroke="#d3a07c" stroke-width="1.3" fill="none"/>
    <path d="M50 ${chief ? 53.5 : 51.5} H60" stroke="#8a4a3a" stroke-width="1.6" stroke-linecap="round"/>`);

  // Pastor de Morella: boina, samarra de pell, faixa i gaiato (el gos d'atura ix a banda, img/gos-atura.svg)
  const pastor = svg(120, 190, "Pastor de Morella", `
    <ellipse cx="62" cy="186" rx="36" ry="3.5" fill="${SH}" opacity="0.2"/>
    <path d="M98 184 V40 Q98 24 87 24 Q78 24 78 33" stroke="#8a5a2a" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M96 184 V44" stroke="#a8743a" stroke-width="1.5" opacity="0.6"/>
    <path d="M50 126 V176 M70 126 V176" stroke="#6b4f2a" stroke-width="13" stroke-linecap="round"/>
    <path d="M47 130 V170 M67 130 V170" stroke="#5a4020" stroke-width="1.2" stroke-dasharray="1 2.5"/>
    <path d="M38 180 Q40 172 50 172 Q58 172 58 180 Z M62 180 Q62 172 70 172 Q80 172 82 180 Z" fill="#2b1d14"/>
    <path d="M38 128 Q36 82 44 72 H76 Q84 82 82 128 Z" fill="#4a6a9a"/>
    <path d="M44 80 H76 M42 92 H78 M40 104 H80 M40 116 H80 M50 72 V128 M60 72 V128 M70 72 V128" stroke="#f4f6f8" stroke-width="1.5" opacity="0.35"/>
    <path d="M38 128 Q36 82 44 72 L54 72 L53 128 Z" fill="#a8743a"/>
    <path d="M82 128 Q84 82 76 72 L66 72 L67 128 Z" fill="#a8743a"/>
    <path d="M53.5 118 V73 Q48 73 42 75 M66.5 118 V73 Q72 73 78 75" stroke="#f2e6c8" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M53.5 116 V76 M66.5 116 V76" stroke="#e0d0a8" stroke-width="2.5" stroke-dasharray="2 3" stroke-linecap="round"/>
    <rect x="38" y="118" width="44" height="9" fill="#1d1d1f"/><path d="M76 122 L82 134 L78 136 Z" fill="#1d1d1f"/>
    <path d="M42 76 L35 102 L38 124" stroke="#4a6a9a" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="38" cy="127" r="5.5" fill="#d8a07a"/>
    <path d="M78 76 L90 96 L97 104" stroke="#4a6a9a" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="98" cy="104" r="6" fill="#d8a07a"/><path d="M94 102 H102" stroke="#b8805a" stroke-width="1.5"/>
    <rect x="54" y="60" width="12" height="14" fill="#c98f6a"/>
    <ellipse cx="60" cy="50" rx="13" ry="15" fill="#d8a07a"/>
    <ellipse cx="46.5" cy="51" rx="3" ry="4.5" fill="#c98f6a"/><ellipse cx="73.5" cy="51" rx="3" ry="4.5" fill="#c98f6a"/>
    <path d="M47 42 Q46 48 48 50 M73 42 Q74 48 72 50" stroke="#e8e8e8" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M51 45 L57 46.5 M69 45 L63 46.5" stroke="#e8e8e8" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M52 49 Q54.5 47.5 57 49 M63 49 Q65.5 47.5 68 49" stroke="#3a2418" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <ellipse cx="60" cy="53" rx="3.4" ry="4" fill="#c27a5a"/>
    <ellipse cx="52" cy="55" rx="3.4" ry="2" fill="#e0707a" opacity="0.5"/><ellipse cx="68" cy="55" rx="3.4" ry="2" fill="#e0707a" opacity="0.5"/>
    <path d="M50 59 Q55 55 60 58 Q65 55 70 59 Q65 62 60 60 Q55 62 50 59 Z" fill="#e8e8e8"/>
    <path d="M45 40 Q46 26 60 26 Q76 26 76 38 Q66 34 60 35 Q52 35 45 40 Z" fill="#1d1d1f"/>
    <ellipse cx="60" cy="38.5" rx="17" ry="4" fill="#1d1d1f"/><path d="M60 26 V22" stroke="#1d1d1f" stroke-width="2.4" stroke-linecap="round"/>`);

  return { semafor, patinet, ciclista, diumenge, furgoneta, tractor, autobus, fem, grua, articulat, tren,
    sensIntermitent, fallera, guiri, senglar, ovelles, motogp, doblePedal,
    examinador: examinador(false), examinadorCap: examinador(true), pastor };
})();
