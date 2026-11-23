// ===== HABITACIÓ: PANTALLA D'INICI =====
// L'habitació de l'estudiant, dibuixada en perspectiva (tools/habitacio.js → js/data/room-art.js). No hi ha menús:
// cada objecte porta a un joc d'estudi.
//   placa L penjada a la paret → DGT (autoescola) · motxilla → sala del joc d'estudi (js/td/lobby.js)
// Des de la DGT es torna ací per la porta d'eixida. Mentre s'està ací, l'autoescola està parada (js/main.js).
const roomOpen = () => !$("room").hidden;
// On s'està ara (habitació, DGT, carretera o una sala d'estudi), per a tornar-hi en recarregar (F5). Només dura la pestanya.
const PLACE_KEY = "estudi-lloc";
function setPlace(place) { try { sessionStorage.setItem(PLACE_KEY, place); } catch {} }
function getPlace() { try { return sessionStorage.getItem(PLACE_KEY); } catch { return null; } }

function openRoom() {
  if (hubOpen()) closeHub();
  $("room").hidden = false;
  document.body.classList.add("room-open");
  setPlace("room");
  renderRoom();
  roomMail();
}
function closeRoom() {
  $("room").hidden = true;
  document.body.classList.remove("room-open");
}

function openSettings() {
  $("settings-dialog").hidden = false;
  $("settings-body").innerHTML = cloudSettingsHtml();
}
function goRoomSpot(name) {
  if (name === "dgt") {
    // l'autoescola és de la parella: qui no hi pot jugar, la mira (js/cloud.js)
    if (cloudWho() && !cloudCanWrite("autoescola") && !cloudViewing("autoescola")) { cloudVisitAutoescola(); return; }
    closeRoom(); openHub(); return;
  }
  if (name === "settings") { openSettings(); return; }                // la vitrina: ajustos
  if (name === "mail") { closeRoom(); tdOpenLobby(roomMailRoom()); tdSpot("mail"); return; } // el forat de la paret: correu
  if (name === "study") { closeRoom(); tdOpenLobby("informatic"); }     // l'ordinador: sala d'estudi d'Informàtica
  if (name === "forestal") { closeRoom(); tdOpenLobby("forestal"); }  // la motxilla: sala del bosc de Forestal
}

// El dibuix no canvia: es pinta una vegada. Com a la DGT, la zona de toc de cada punt va al final, damunt de tot.
function renderRoom() {
  if ($("room-scene").firstChild) return;
  const spots = [];
  const layers = ROOM_ART.layers.map(l => {
    if (!l.spot) return l.svg;
    const [x, y, w, h] = l.hit;
    spots.push(`<rect class="hub-hit" data-room="${l.spot}" tabindex="0" role="button" aria-label="${l.title}"
      x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"><title>${l.title}</title></rect>`);
    return `<g class="hub-art" id="room-art-${l.spot}">${l.svg}</g>`;
  }).join("");
  $("room-scene").innerHTML = `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-label="La meua habitació"><defs>${ROOM_ART.defs}</defs>${layers}${ROOM_MAIL_SVG}${spots.join("")}</svg>`;
}

// Correu: un foradet a la paret del fons, al costat del llum. Quan hi ha correu, se'n veu el forat amb una carta que
// trau el cap i es mou una mica; quan no n'hi ha, no es veu res (ni el forat). Porta al correu de la sala de qui juga.
const ROOM_MAIL_SVG = `<g id="room-mail" class="room-mail" data-room="mail" tabindex="0" role="button" aria-label="Tens correu" style="display:none">
  <title>Tens correu!</title>
  <ellipse cx="822" cy="268" rx="17" ry="11" fill="#c9ccd2"/><ellipse cx="822" cy="269" rx="14" ry="8.5" fill="#2a2420"/>
  <ellipse cx="822" cy="272" rx="11" ry="4" fill="#120e0c"/>
  <clipPath id="room-mail-clip"><rect x="790" y="226" width="64" height="44"/><ellipse cx="822" cy="269" rx="14" ry="8.5"/></clipPath>
  <g clip-path="url(#room-mail-clip)"><g class="room-mail-letter"><g transform="translate(822 274) rotate(-14)">
    <rect x="-9" y="-13" width="18" height="12" rx="1.5" fill="#fffaf0" stroke="#c9b48a" stroke-width="1"/>
    <path d="M-9 -13 L0 -6 L9 -13" fill="none" stroke="#c9b48a" stroke-width="1"/><circle cx="0" cy="-6" r="2.2" fill="#d43a3a"/></g></g></g>
  <path d="M808 269 A14 8.5 0 0 0 836 269" fill="none" stroke="#120e0c" stroke-width="1.5" opacity="0.6"/>
  <rect x="796" y="244" width="52" height="40" fill="transparent"/></g>`;
// La sala on es llig el correu: la de qui juga (Alba, Forestal; Marc i el comú, Informàtica)
const roomMailRoom = () => (cloudWho() === "parella" ? "forestal" : "informatic");
function roomMail() {
  const has = typeof tdMailNew === "function" && !!tdMailNew().length;
  const g = $("room-mail");
  if (g) g.style.display = has ? "" : "none";
  $("room-mail-btn").hidden = !has;
}

function initRoom() {
  const activate = ev => {
    const spot = ev.target.closest("[data-room]");
    if (spot) goRoomSpot(spot.dataset.room);
  };
  $("room-scene").addEventListener("click", activate);
  $("room-actions").addEventListener("click", activate);
  $("room-scene").addEventListener("keydown", ev => {
    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); activate(ev); }
  });
  const highlight = (ev, on) => {
    const spot = ev.target.closest?.(".hub-hit");
    if (spot) $(`room-art-${spot.dataset.room}`)?.classList.toggle("hot", on);
  };
  for (const [type, on] of [["pointerover", true], ["pointerout", false], ["focusin", true], ["focusout", false]])
    $("room-scene").addEventListener(type, ev => highlight(ev, on));
}
