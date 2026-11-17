// ===== HABITACIÓ: PANTALLA D'INICI =====
// L'habitació de l'estudiant, dibuixada en perspectiva (tools/habitacio.js → js/data/room-art.js). No hi ha menús:
// cada objecte porta a un joc d'estudi.
//   placa L penjada a la paret → DGT (autoescola) · motxilla → joc d'estudi (tower defense, encara per fer)
// Des de la DGT es torna ací per la porta d'eixida. El combat de l'autoescola continua de fons.
const roomOpen = () => !$("room").hidden;

function openRoom() {
  if (hubOpen()) closeHub();
  $("room").hidden = false;
  document.body.classList.add("room-open");
  renderRoom();
}
function closeRoom() {
  $("room").hidden = true;
  document.body.classList.remove("room-open");
}

function goRoomSpot(name) {
  if (name === "dgt") { closeRoom(); openHub(); return; }
  if (name === "study") toast("🎒 El joc d'estudi (tower defense) arriba prompte!", "good");
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
  $("room-scene").innerHTML = `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-label="La meua habitació"><defs>${ROOM_ART.defs}</defs>${layers}${spots.join("")}</svg>`;
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
