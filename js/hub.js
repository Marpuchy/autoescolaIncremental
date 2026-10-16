// ===== DGT: ESPAI COMÚ =====
// Pantalla completa amb l'interior de la DGT. Cada element és un punt interactiu:
//   🏧 caixer → botiga (L per diners) · funcionari darrere del taulell → tests i ratxa · 📖 diari → compendi · 🪞 espill → inventari
//   🗑️ destructora de paper → reiniciar la partida
// El combat continua de fons. Els panells (botiga, tests, compendi) són els mateixos d'abans, dins d'una finestreta.
const HUB_PANELS = { shop: "tab-shop", test: "tab-test", bestiary: "tab-bestiary" };
const hubOpen = () => !$("hub").hidden;

function openHub() {
  $("hub").hidden = false;
  document.body.classList.add("hub-open");
  renderHub();
  $("btn-hub-close").focus();
}
function closeHub() {
  stopDvdVideo(); // que no continue sonant amb la DGT tancada
  closeHubPanel();
  $("hub").hidden = true;
  document.body.classList.remove("hub-open");
}

function openHubPanel(name) {
  if (name === "reset") { reset(); return; } // la destructora de paper (demana confirmació)
  if (name === "inventory") {
    if (!inventoryUnlocked()) { toast("🔒 L'espill es desbloqueja quan derrotes Pixel", "bad"); return; }
    openInventory();
    return;
  }
  for (const [key, id] of Object.entries(HUB_PANELS)) $(id).hidden = key !== name;
  document.querySelector(".hub-card").dataset.panel = name; // tema: caixer, impres del funcionari o diari
  $("hub-dialog").hidden = false;
  if (name === "shop") renderShop();
  if (name === "test") renderTestPanel();
  if (name === "bestiary") renderBestiary();
  $("btn-hub-dialog-close").focus();
}
function closeHubPanel() {
  $("hub-dialog").hidden = true;
  for (const id of Object.values(HUB_PANELS)) $(id).hidden = true;
}
const hubPanelOpen = () => !$("hub-dialog").hidden;

// L'espill reflectix la granoteta amb l'equipament: es torna a pintar quan canvia l'inventari.
// Les animacions (SMIL) es reinicien a zero perquè el rellotge comence a l'hora que s'ha posat.
function renderHub() {
  if (!hubOpen()) return;
  $("hub-scene").innerHTML = hubSvg();
  $("hub-scene").querySelector("svg")?.setCurrentTime?.(0);
  if (dvdVideoOn) showDvdVideo();
  updateDvd();
}

// ----- Rellotge: angles de l'hora actual (les agulles giren a partir d'ací en temps real) -----
function clockAngles() {
  const d = new Date(), sec = d.getSeconds() + d.getMilliseconds() / 1000, min = d.getMinutes() + sec / 60;
  return { SEC: sec * 6, MIN: min * 6, HOUR: (d.getHours() % 12 + min / 60) * 30 };
}

// ----- Salvapantalles de la tele: el logo rebota i, quan toca EXACTAMENT un racó, la tele posa un vídeo -----
// Rebota amb dos períodes que no tenen divisor comú (4,73 s i 3,07 s): només arriba a un racó quan el temps és múltiple
// dels dos, cada ~24 minuts (DVD_CORNER). El temps compta des que es carrega la pàgina, encara que la DGT estiga tancada.
// Des de la consola de desenvolupament (dev.dvdCorner) es pot avançar perquè passe en uns segons.
const DVD_HALF = [4.73, 3.07];
const DVD_CORNER = 1452.11; // mínim comú múltiple de 4,73 i 3,07
const DVD_COLORS = ["#4aa8ff", "#ff5ab0", "#ffd23f", "#3fdc8a", "#b48cff", "#ff8a3d"];
const DVD_VIDEO = "https://www.youtube-nocookie.com/embed/zzAvrKlvFhQ?autoplay=1&playsinline=1";
const DVD_WATCH = "https://www.youtube.com/watch?v=zzAvrKlvFhQ";
let dvdOffset = 7.3;   // segons: perquè no comence en un racó
let dvdCornerSeen = 0; // últim racó comptat
let dvdVideoOn = false;
const dvdTime = () => performance.now() / 1000 + dvdOffset;
// ona triangular de 0 a 1 i tornada, amb mig període h
const bounce = (t, h) => { const v = (t % (2 * h)) / h; return v <= 1 ? v : 2 - v; };

function updateDvd() {
  const logo = $("hub-dvd"), tv = HUB_ART.tv;
  if (!logo) return;
  const t = dvdTime();
  const x = tv.x + bounce(t, DVD_HALF[0]) * (tv.w - tv.lw), y = tv.y + bounce(t, DVD_HALF[1]) * (tv.h - tv.lh);
  logo.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  logo.setAttribute("fill", DVD_COLORS[(Math.floor(t / DVD_HALF[0]) + Math.floor(t / DVD_HALF[1])) % DVD_COLORS.length]);
  const corner = Math.floor(t / DVD_CORNER);
  if (corner > dvdCornerSeen) {
    dvdCornerSeen = corner;
    if (hubOpen() && !dvdVideoOn) {
      dvdVideoOn = true;
      toast("📀 Ha tocat el racó!", "good");
      showDvdVideo();
    }
  }
}

// El vídeo dins de la pantalla de la tele. Primer el fitxer del joc (img/tele.mp4: funciona sempre, també amb file://);
// si no hi és, YouTube (en una pàgina oberta com a fitxer YouTube no deixa incrustar-lo: botó per a obrir-lo fora).
const DVD_FILE = "img/tele.mp4";
function showDvdVideo() {
  const svg = $("hub-scene").querySelector("svg"), tv = HUB_ART.tv;
  if (!svg || svg.querySelector("#hub-tv-video")) return;
  $("hub-dvd")?.setAttribute("visibility", "hidden");
  const fo = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
  fo.id = "hub-tv-video";
  for (const [k, v] of Object.entries({ x: tv.x, y: tv.y, width: tv.w, height: tv.h })) fo.setAttribute(k, v);
  const video = document.createElement("video");
  video.src = DVD_FILE;
  video.autoplay = true;
  video.playsInline = true;
  video.controls = false;             // sense barra, botó de pausa ni menú de tres punts
  video.disablePictureInPicture = true;
  video.className = "hub-tv-media";
  video.addEventListener("contextmenu", ev => ev.preventDefault());
  // si el navegador l'ha hagut d'engegar sense so, tocar la tele li'l posa
  video.addEventListener("click", () => { if (video.muted) { video.muted = false; video.play().catch(() => {}); } });
  video.addEventListener("error", () => { video.remove(); fo.appendChild(youtubeTv()); }, { once: true });
  fo.appendChild(video);
  // amb so si el navegador ho permet (el jugador ja ha tocat la pàgina); si no, sense so fins que es toque la tele
  video.play()?.catch(() => { video.muted = true; video.play().catch(() => {}); });
  svg.querySelector(".hub-hit")?.before(fo) ?? svg.appendChild(fo); // davall de les zones de toc
}
function youtubeTv() {
  if (location.protocol === "file:") {
    const btn = document.createElement("button");
    btn.className = "hub-tv-play";
    btn.innerHTML = "▶<span>Obrir el vídeo</span>";
    btn.title = "Obrir el vídeo en YouTube";
    btn.addEventListener("click", () => window.open(DVD_WATCH, "_blank", "noopener"));
    return btn;
  }
  const frame = document.createElement("iframe");
  frame.src = DVD_VIDEO;
  frame.title = "Vídeo de la tele";
  frame.allow = "autoplay; encrypted-media; picture-in-picture";
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  frame.className = "hub-tv-media";
  return frame;
}
function stopDvdVideo() {
  dvdVideoOn = false;
  $("hub-tv-video")?.querySelector("video")?.pause();
  $("hub-tv-video")?.remove();
  $("hub-dvd")?.setAttribute("visibility", "visible");
}

// Consola de desenvolupament: el logo tocarà un racó d'ací a uns segons
function forceDvdCorner(seconds = 3) {
  const now = performance.now() / 1000;
  const next = (Math.floor((now + dvdOffset) / DVD_CORNER) + 1) * DVD_CORNER;
  dvdOffset += next - (now + dvdOffset) - seconds;
  dvdCornerSeen = Math.floor(dvdTime() / DVD_CORNER);
}
const refreshHubMirror = renderHub;

// ----- Escena -----
// El dibuix el genera tools/dgt.js (motor de perspectiva tools/perspectiva.js) en js/data/hub-art.js: capes del fons cap
// al davant. Les capes amb `spot` són punts interactius: brillen suaument, tenen <title> i un rectangle transparent
// (`hit`) perquè tot el seu espai es puga tocar. A l'espill, %REFLECTION% és el reflex de la granoteta.
function hubSvg() {
  const mirrorOn = inventoryUnlocked();
  const reflection = mirrorOn
    ? `<div class="hub-reflection"><div class="inv-preview">${previewHtml()}</div></div>`
    : `<div class="hub-reflection locked"><span>🔒</span></div>`;
  // el dibuix de cada punt va en el seu lloc (darrere del taulell, per exemple), però la zona de toc va al final,
  // damunt de tot, perquè res no la tape
  const spots = [];
  const clock = clockAngles();
  const layers = HUB_ART.layers.map(l => {
    // per la finestra es veu l'escenari on està la granoteta (la ruta ve de les dades del joc)
    const svg = l.svg.replace("%REFLECTION%", reflection).replace("%WINDOW_IMG%", sceneOf(state.level).img || "")
      .replace(/%(HOUR|MIN|SEC)(\+360)?%/g, (_, k, plus) => (clock[k] + (plus ? 360 : 0)).toFixed(2));
    if (!l.spot) return svg;
    const locked = l.spot === "inventory" && !mirrorOn;
    const title = locked ? "Espill (es desbloqueja quan derrotes Pixel)" : l.title;
    const [x, y, w, h] = l.hit;
    spots.push(`<rect class="hub-hit${locked ? " locked" : ""}" data-hub="${l.spot}" data-art="${l.spot}" tabindex="0" role="button"
      aria-label="${title}"${locked ? ' aria-disabled="true"' : ""} x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"><title>${title}</title></rect>`);
    return `<g class="hub-art${locked ? " locked" : ""}" id="hub-art-${l.spot}">${svg}</g>`;
  }).join("");
  return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-label="Interior de la DGT"><defs>${HUB_ART.defs}</defs>${layers}${spots.join("")}</svg>`;
}

function initHub() {
  dvdCornerSeen = Math.floor(dvdTime() / DVD_CORNER);
  $("btn-hub").addEventListener("click", openHub);
  $("btn-hub-close").addEventListener("click", closeHub);
  $("btn-hub-dialog-close").addEventListener("click", closeHubPanel);
  $("hub-dialog").addEventListener("click", ev => { if (ev.target === $("hub-dialog")) closeHubPanel(); });
  const activate = ev => {
    const spot = ev.target.closest("[data-hub]");
    if (spot) openHubPanel(spot.dataset.hub);
  };
  $("hub-scene").addEventListener("click", activate);
  const highlight = (ev, on) => {
    const spot = ev.target.closest?.(".hub-hit");
    if (spot) $(`hub-art-${spot.dataset.art}`)?.classList.toggle("hot", on);
  };
  for (const [type, on] of [["pointerover", true], ["pointerout", false], ["focusin", true], ["focusout", false]])
    $("hub-scene").addEventListener(type, ev => highlight(ev, on));
  $("hub-actions").addEventListener("click", activate);
  $("hub-scene").addEventListener("keydown", ev => {
    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); activate(ev); }
  });
  document.addEventListener("keydown", ev => {
    if (ev.key !== "Escape" || ev.defaultPrevented || !hubOpen()) return;
    if (hubPanelOpen()) closeHubPanel(); else closeHub();
  });
}
