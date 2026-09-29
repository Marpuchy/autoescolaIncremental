// ===== ENEMICS =====
// Enemics de xicotet a gran. Als nivells 1-10 només ixen els 2 primers;
// cada escenari nou (cada 10 nivells) afig el següent de la llista.
// mult: multiplicador de vida, atac i recompensa respecte a l'enemic "normal" del nivell.
// icon: HTML del sprite (emoji o SVG). Es pot substituir per <img src="..."> quan hi haja sprites.
// desc: descripció que es mostra en el compendi en fer clic
// IMPORTANT: el compendi guardat usa el nom com a clau; si en canvies un, els jugadors perdran eixa entrada.
const YIELD_SVG = `<svg viewBox="0 0 140 126" aria-label="Cediu el pas">
  <polygon points="6,8 134,8 70,120" fill="#d1261f" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>
  <polygon points="32,24 108,24 70,90" fill="#fff"/>
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
];
const BOSS_NAME = "Examinador de Trànsit"; // sempre és el cap dels nivells 10, 20, 30...
const BOSS_DESC = "Carpeta en mà i cara de pòquer. Apunta cada falta, per xicoteta que siga. El teu pitjor malson.";
const BOSS_ICON = `🧑‍💼<span class="badge">📋</span>`;
