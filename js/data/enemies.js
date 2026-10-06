// ===== ENEMICS =====
// Enemics de xicotet a gran. Als nivells 1-10 només ixen els 2 primers;
// cada escenari nou (cada 10 nivells) afig el següent de la llista.
// IMPORTANT: cada escenari nou ha de portar un enemic nou de debò (temàtic). Les versions més fortes no són
// enemics nous: ja ho són els mateixos enemics en pujar de nivell.
// mult: multiplicador de vida, atac i recompensa respecte a l'enemic "normal" del nivell.
// icon: HTML del sprite (emoji o SVG). Es pot substituir per <img src="..."> quan hi haja sprites.
// desc: descripció que es mostra en el compendi en fer clic
// IMPORTANT: el compendi guardat usa el nom com a clau; si en canvies un, els jugadors perdran eixa entrada.
const YIELD_SVG = `<svg viewBox="0 0 140 126" aria-label="Cediu el pas">
  <polygon points="6,8 134,8 70,120" fill="#d1261f" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>
  <polygon points="32,24 108,24 70,90" fill="#fff"/>
</svg>`;
const BOAT_SVG = `<svg viewBox="0 0 150 130" aria-label="Barca de l'Albufera">
  <line x1="74" y1="100" x2="74" y2="8" stroke="#4a3426" stroke-width="4"/>
  <path d="M28 30 L130 10 L76 98 Z" fill="#f4ead6"/>
  <path d="M76 98 L130 10 L112 66 Z" fill="#000" opacity="0.1"/>
  <path d="M30 31 L128 12" stroke="#c9b48e" stroke-width="3"/>
  <path d="M6 96 Q74 116 144 94 L132 114 Q74 126 18 114 Z" fill="#3a2a20"/>
  <path d="M10 98 Q74 116 140 96" stroke="#c9472f" stroke-width="5" fill="none"/>
  <rect x="120" y="98" width="12" height="20" rx="3" fill="#5a6470"/>
  <path d="M4 120 Q20 112 36 120 T68 120 T100 120 T132 120 T150 118" stroke="#7fc6e8" stroke-width="5" fill="none" stroke-linecap="round"/>
  <g fill="#bfe6f7"><circle cx="140" cy="108" r="4"/><circle cx="146" cy="100" r="3"/><circle cx="8" cy="110" r="3"/></g>
</svg>`;
const ENEMY_TYPES = [
  { name: "Semàfor en groc",          mult: 0.9,  icon: "🚦",
    desc: "Ni verd ni roig: el dubte etern. Accelere o frene? Mentre ho penses, ell ja t'ha atacat." },
  { name: "Cediu el pas",             mult: 1.0,  icon: YIELD_SVG,
    desc: "Un triangle cap per avall que exigix respecte. Si no li cedixes el pas, te'l pren ell." },
  { name: "Patinet elèctric",         mult: 1.15, icon: "🛴",
    desc: "Apareix del no-res per la vorera, pel carril bici o per on li ve de gust. Silenciós i imprevisible." },
  { name: "Ciclista en la calçada",   mult: 1.3,  icon: "🚴",
    desc: "Circula en columna de dos i té tot el dret del món. Recorda: 1,5 metres en avançar-lo." },
  { name: "Conductor de diumenge",    mult: 1.45, icon: "🚗",
    desc: "Va a 40 pel carril esquerre amb l'intermitent posat des de fa tres quilòmetres." },
  { name: "Furgoneta de repartiment", mult: 1.65, icon: "🚐",
    desc: "Sempre té pressa i sempre para en doble fila. El paquet és més important que tu." },
  { name: "Tractor a 20 km/h",        mult: 1.85, icon: "🚜",
    desc: "El rei de les carreteres secundàries. Per a avançar-lo cal paciència i una recta molt llarga." },
  { name: "Autobús urbà",             mult: 2.1,  icon: "🚌",
    desc: "Quan posa l'intermitent per a eixir de la parada, té preferència. I ho sap." },
  { name: "Camió del fem",            mult: 2.4,  icon: "🚚",
    desc: "Treballa de matinada, ocupa tot el carrer i fa marxa arrere sense avisar." },
  { name: "Grua municipal",           mult: 2.7,  icon: "🛻",
    desc: "Si has aparcat malament, ja és tard. Se l'emporta tot, i tu pagues." },
  { name: "Camió articulat",          mult: 3.0,  icon: "🚛",
    desc: "Quaranta tones d'angles morts. Si no li veus els espills, ell no et veu a tu." },
  { name: "Tren de mercaderies",      mult: 3.4,  icon: "🚂",
    desc: "Pas a nivell sense barreres? No intentes mai guanyar-li la carrera." },
  { name: "Barca de l'Albufera",      mult: 3.6,  icon: BOAT_SVG,
    desc: "Vela llatina, motoret fumejant i cap respecte pel codi. Ix dels canals de l'arròs i, quan s'acaba l'aigua, segueix per la carretera." },
];
const BOSS_NAME = "Examinador de Trànsit"; // sempre és el cap dels nivells 10, 20, 30...
const BOSS_DESC = "Carpeta en mà i cara de pòquer. Apunta cada falta, per xicoteta que siga. El teu pitjor malson.";
const BOSS_ICON = `🧑‍💼<span class="badge">📋</span>`;
