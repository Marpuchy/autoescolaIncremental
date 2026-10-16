#!/usr/bin/env node
// ===== ESCENA DE LA DGT (generador) =====
// Descriu l'interior de la DGT en metres i el projecta amb tools/perspectiva.js. Escriu js/data/hub-art.js, que el joc
// pinta en la pantalla de la DGT (js/hub.js). Ús: node tools/dgt.js [--preview fitxer.svg]
// Habitació: 9 m d'ample (x de -4.5 a 4.5), 4,05 m d'alt i 10 m de fons (paret del fons a z = 10). Càmera a 1,8 m.
const fs = require("fs"), path = require("path");
const { camera, r } = require("./perspectiva");

const cam = camera({ cx: 800, cy: 360, eye: 1.8, d: 4, f: 1555.5 });
const { P, poly, box, face, quad, shadow, figure, line, affine, bbox, corners } = cam;
const W = 4.5, H = 4.05, BACK = 10;
const layers = [];
const add = (svg, spot) => layers.push({ svg, ...(spot || {}) });

// Rectangle a la paret del fons (és paral·lela a la pantalla: es projecta com un rectangle)
function wallRect(x0, y0, x1, y1, attrs) {
  const [a, b] = P(x0, y1, BACK), [c, d] = P(x1, y0, BACK);
  return `<rect x="${r(a)}" y="${r(b)}" width="${r(c - a)}" height="${r(d - b)}" ${attrs}/>`;
}

// ---------------------------------------------------------------- habitació
let room = "";
room += poly([[-W, H, 0], [W, H, 0], [W, H, BACK], [-W, H, BACK]], `fill="#f3efe3"`);
room += poly([[-W, 0, 0], [-W, 0, BACK], [-W, H, BACK], [-W, H, 0]], `fill="url(#dgt-wall-l)"`);
room += poly([[W, 0, 0], [W, 0, BACK], [W, H, BACK], [W, H, 0]], `fill="url(#dgt-wall-r)"`);
room += wallRect(-W, 0, W, H, `fill="url(#dgt-wall-b)"`);
// sòcol d'1 m a les tres parets
room += wallRect(-W, 0, W, 1, `fill="#9cbfb3"`) + wallRect(-W, 0.98, W, 1.03, `fill="#7fa396"`);
room += poly([[-W, 0, 0], [-W, 0, BACK], [-W, 1, BACK], [-W, 1, 0]], `fill="#8db1a4"`);
room += poly([[W, 0, 0], [W, 0, BACK], [W, 1, BACK], [W, 1, 0]], `fill="#86aa9d"`);
room += poly([[-W, 0.98, 0], [-W, 0.98, BACK], [-W, 1.03, BACK], [-W, 1.03, 0]], `fill="#76998c"`);
room += poly([[W, 0.98, 0], [W, 0.98, BACK], [W, 1.03, BACK], [W, 1.03, 0]], `fill="#719487"`);
// terra amb rajoles de 60 cm
room += poly([[-W, 0, 0], [W, 0, 0], [W, 0, BACK], [-W, 0, BACK]], `fill="url(#dgt-floor)"`);
let grout = "";
for (let x = -W; x <= W + 0.01; x += 0.6) grout += line([x, 0, 0.8], [x, 0, BACK], "");
for (let z = 1.2; z < BACK; z += 0.6) grout += line([-W, 0, z], [W, 0, z], "");
room += `<g stroke="#bdb7aa" stroke-width="1.6">${grout}</g>`;
// sòcols de terra (rodapeu fosc)
room += wallRect(-W, 0, W, 0.08, `fill="#6b8e81"`);
// llums del sostre (fluorescents encastats) i la seua claror
for (const z of [3.2, 6.2, 9.0]) {
  const b = { x0: -0.9, x1: 0.9, y0: 4.0, y1: H, z0: z, z1: z + 0.55 };
  const [cx, cy] = P(0, H, z + 0.3);
  room += `<ellipse cx="${r(cx)}" cy="${r(cy + 30)}" rx="${r(cam.scale(z) * 2.2)}" ry="${r(cam.scale(z) * 0.9)}" fill="url(#dgt-lamp)"/>`;
  room += box(b, { bottom: "#fffdf2" });
  room += quad(face(b, "bottom"), 0, 0, 1, 1, `fill="none" stroke="#d8d0bb" stroke-width="2"`);
}
add(room);

// ---------------------------------------------------------------- paret del fons
let wall = "";
// finestra: per ella es veu l'escenari on està la granoteta (el joc substituïx %WINDOW_IMG% per la imatge del fons)
{
  const wx0 = -4.0, wx1 = -2.45, wy0 = 1.65, wy1 = 3.3;
  const [ix, iy] = P(wx0, wy1, BACK), [jx, jy] = P(wx1, wy0, BACK);
  wall += wallRect(wx0 - 0.07, wy0 - 0.07, wx1 + 0.07, wy1 + 0.07, `fill="#cfc8b8"`);
  wall += wallRect(wx0, wy0, wx1, wy1, `fill="url(#dgt-sky)"`);
  wall += `<image href="%WINDOW_IMG%" x="${r(ix)}" y="${r(iy)}" width="${r(jx - ix)}" height="${r(jy - iy)}" preserveAspectRatio="xMidYMax slice"/>`;
  wall += wallRect(wx0, wy0, wx1, wy1, `fill="#bfe4ff" opacity="0.12"`);
  wall += poly([[wx0 + 0.15, wy1, BACK], [wx0 + 0.55, wy1, BACK], [wx0 + 0.2, wy0, BACK], [wx0 - 0.0, wy0, BACK]], `fill="#fff" opacity="0.12"`);
  // persiana recollida a dalt, travesser i ampit
  wall += wallRect(wx0, wy1 - 0.28, wx1, wy1, `fill="url(#dgt-blinds)"`) + wallRect(wx0, wy1 - 0.31, wx1, wy1 - 0.27, `fill="#d8d2c4"`);
  wall += wallRect((wx0 + wx1) / 2 - 0.03, wy0, (wx0 + wx1) / 2 + 0.03, wy1 - 0.28, `fill="#cfc8b8"`);
  wall += wallRect(wx0 - 0.12, wy0 - 0.12, wx1 + 0.12, wy0 - 0.05, `fill="#e9e3d4"`);
}
// rètol de serveis: tres pictogrames blancs sobre blau (cotxe, carnet i aprovat)
wall += wallRect(-1.3, 2.95, 1.3, 3.6, `fill="#1f4f9e" rx="6"`);
const icon = (x, svg) => figure(svg, x, 3.05, BACK);
wall += icon(-0.85, `<rect x="-20" y="-30" width="40" height="18" rx="7" fill="#fff"/><rect x="-13" y="-42" width="26" height="14" rx="5" fill="#fff"/>
  <rect x="-9" y="-39" width="18" height="8" rx="2" fill="#1f4f9e"/><circle cx="-12" cy="-10" r="5" fill="#fff"/><circle cx="12" cy="-10" r="5" fill="#fff"/>`);
wall += icon(0, `<rect x="-22" y="-44" width="44" height="30" rx="4" fill="#fff"/><rect x="-17" y="-38" width="12" height="16" rx="2" fill="#1f4f9e"/>
  <rect x="-1" y="-37" width="17" height="4" fill="#1f4f9e"/><rect x="-1" y="-30" width="13" height="4" fill="#1f4f9e"/><rect x="-1" y="-23" width="16" height="4" fill="#1f4f9e"/>`);
wall += icon(0.85, `<circle cx="0" cy="-28" r="17" fill="#fff"/><path d="M-9 -28 L-2 -20 L10 -36" stroke="#1f4f9e" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
// televisor amb el salvapantalles de disc: el logo el mou js/hub.js (rebota i canvia de color a cada xoc; quan toca
// exactament un racó, la tele posa un vídeo). Aquí només hi ha la pantalla i el logo a l'origen.
let TV;
{
  wall += wallRect(1.55, 2.55, 2.75, 3.25, `fill="#16181c" rx="4"`);
  wall += wallRect(1.6, 2.6, 2.7, 3.2, `fill="#0b0d12"`);
  const [sx, sy] = P(1.6, 3.2, BACK), [ex, ey] = P(2.7, 2.6, BACK);
  const lw = 34, lh = 17;
  TV = { x: r(sx), y: r(sy), w: r(ex - sx), h: r(ey - sy), lw, lh };
  wall += `<clipPath id="dgt-tv-clip"><rect x="${TV.x}" y="${TV.y}" width="${TV.w}" height="${TV.h}"/></clipPath>
  <g clip-path="url(#dgt-tv-clip)"><g id="hub-dvd" fill="#4aa8ff" transform="translate(${TV.x} ${TV.y})">
    <ellipse cx="${lw / 2}" cy="${lh * 0.62}" rx="${lw / 2}" ry="${lh * 0.32}" fill-opacity="0.35"/>
    <ellipse cx="${lw / 2}" cy="${lh * 0.62}" rx="${lw * 0.12}" ry="${lh * 0.08}" fill="#0b0d12"/>
    <text x="${lw / 2}" y="${lh * 0.52}" text-anchor="middle" font-size="${lh * 0.62}" font-weight="900" font-style="italic" font-family="system-ui, sans-serif">BD</text>
  </g></g>`;
}
// rellotge
const [ckx, cky] = P(2.15, 3.6, BACK), ckr = cam.scale(BACK) * 0.17;
wall += `<circle cx="${r(ckx)}" cy="${r(cky)}" r="${r(ckr)}" fill="#fff" stroke="#2b2b2b" stroke-width="3"/>`;
for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; wall += `<line x1="${r(ckx + Math.sin(a) * ckr * 0.78)}" y1="${r(cky - Math.cos(a) * ckr * 0.78)}" x2="${r(ckx + Math.sin(a) * ckr * 0.92)}" y2="${r(cky - Math.cos(a) * ckr * 0.92)}" stroke="#2b2b2b" stroke-width="2"/>`; }
// agulles: comencen a les 12 i giren des de l'hora actual (%HOUR%, %MIN%, %SEC% en graus, posats pel joc)
const hand = (len, width, color, key, dur) => `<line x1="${r(ckx)}" y1="${r(cky + ckr * 0.12)}" x2="${r(ckx)}" y2="${r(cky - ckr * len)}" stroke="${color}" stroke-width="${width}" stroke-linecap="round">
  <animateTransform attributeName="transform" type="rotate" from="%${key}% ${r(ckx)} ${r(cky)}" to="%${key}+360% ${r(ckx)} ${r(cky)}" dur="${dur}s" repeatCount="indefinite"/></line>`;
wall += hand(0.5, 3, "#2b2b2b", "HOUR", 43200) + hand(0.75, 2.2, "#2b2b2b", "MIN", 3600) + hand(0.8, 1.2, "#d1261f", "SEC", 60);
wall += `<circle cx="${r(ckx)}" cy="${r(cky)}" r="2" fill="#2b2b2b"/>`;
// cartells emmarcats amb senyals (prohibit el pas i cediu el pas)
wall += wallRect(-2.3, 1.45, -1.65, 2.35, `fill="#fff" stroke="#b9b3a6" stroke-width="3"`);
wall += figure(`<circle cx="0" cy="-30" r="22" fill="#d1261f"/><rect x="-15" y="-34" width="30" height="8" fill="#fff"/>`, -1.975, 1.6, BACK);
wall += wallRect(1.55, 1.45, 2.75, 2.25, `fill="#b9935a" rx="3"`);
wall += wallRect(1.62, 1.95, 1.98, 2.18, `fill="#fff"`) + wallRect(2.05, 1.9, 2.4, 2.15, `fill="#ffe27a"`) + wallRect(2.45, 1.6, 2.7, 1.98, `fill="#bfe4ff"`) + wallRect(1.7, 1.55, 2.05, 1.85, `fill="#f4c6d0"`);
add(wall);

// ---------------------------------------------------------------- mapa a la paret esquerra (decoratiu, per al futur canvi de zones)
// Mapa del País Valencià amb la costa, la mar a la dreta i els punts de les zones units per una ruta discontínua.
{
  let s = "";
  const mB = { x0: -W - 0.01, x1: -W, y0: 1.35, y1: 2.65, z0: 6.7, z1: 8.7 };
  const mf = face(mB, "right"); // u: de davant (esquerra a la pantalla) cap al fons · v: de dalt a baix
  const pt = (u, v) => mf(u, v);
  s += quad(mf, -0.03, -0.04, 1.03, 1.04, `fill="#8a6a3a"`); // marc
  s += quad(mf, 0, 0, 1, 1, `fill="#7fb8e6"`);              // mar
  // terra: de l'esquerra fins a la costa (que baixa de nord a sud fent corba cap a l'interior a València)
  const coast = [[0.66, 0], [0.64, 0.12], [0.6, 0.22], [0.62, 0.32], [0.58, 0.42], [0.55, 0.52], [0.54, 0.62], [0.57, 0.72], [0.62, 0.82], [0.6, 0.92], [0.64, 1]];
  s += poly([pt(0, 0), ...coast.map(([u, v]) => pt(u, v)), pt(0, 1)], `fill="#e8dcb8"`);
  s += poly(coast.map(([u, v]) => pt(u, v)), `fill="none" stroke="#5a8fb8" stroke-width="1.5"`);
  // muntanyes de l'interior i l'Albufera
  s += poly([pt(0.06, 0.18), pt(0.2, 0.1), pt(0.34, 0.2), pt(0.24, 0.3), pt(0.1, 0.3)], `fill="#c9b98a"`);
  s += poly([pt(0.12, 0.48), pt(0.26, 0.42), pt(0.34, 0.52), pt(0.2, 0.58)], `fill="#c9b98a"`);
  s += poly([pt(0.5, 0.74), pt(0.55, 0.72), pt(0.56, 0.79), pt(0.5, 0.8)], `fill="#7fb8e6"`);
  // ruta de les zones (de nord a sud, aproximada) i els punts
  // punts de les zones (sense repetir llocs) i la ruta que les uneix de nord a sud, seguint la costa
  const zones = [[0.22, 0.12], [0.48, 0.2], [0.57, 0.24], [0.52, 0.3], [0.42, 0.36], [0.5, 0.46], [0.36, 0.5],
    [0.56, 0.56], [0.53, 0.66], [0.36, 0.7], [0.52, 0.76]];
  s += poly(zones.map(([u, v]) => pt(u, v)), `fill="none" stroke="#d1261f" stroke-width="1.6" stroke-dasharray="4 3" opacity="0.75"`).replace("<polygon", "<polyline");
  for (const [u, v] of zones) { const [px, py] = P(...pt(u, v)); s += `<circle cx="${r(px)}" cy="${r(py)}" r="2.6" fill="#d1261f" stroke="#fff" stroke-width="0.8"/>`; }
  // xinxetes a les cantonades
  for (const [u, v] of [[0.02, 0.03], [0.98, 0.03], [0.02, 0.97], [0.98, 0.97]]) { const [px, py] = P(...pt(u, v)); s += `<circle cx="${r(px)}" cy="${r(py)}" r="2.4" fill="#f2c200"/>`; }
  add(s);
}

// ---------------------------------------------------------------- arxivador amb impressora (davall de la finestra)
let cab = "";
const cabB = { x0: -3.55, x1: -2.85, y0: 0, y1: 1.3, z0: 9.2, z1: 9.85 };
cab += box(cabB, { front: "#9aa5ae", side: "#7f8a93", top: "#b3bcc4" });
for (const v of [0.08, 0.4, 0.72]) cab += quad(face(cabB, "front"), 0.12, v, 0.88, v + 0.06, `fill="#6b757e"`);
const prB = { x0: -3.5, x1: -2.95, y0: 1.3, y1: 1.52, z0: 9.3, z1: 9.75 };
cab += box(prB, { front: "#e2e5e8", side: "#c3c8cd", top: "#f2f4f6" }) + quad(face(prB, "top"), 0.15, 0.3, 0.85, 0.7, `fill="#fff"`);
add(cab);

// ---------------------------------------------------------------- màquina de begudes (contra la paret dreta, mira cap a l'esquerra)
let vend = "";
const vB = { x0: 3.72, x1: W, y0: 0, y1: 1.95, z0: 7.4, z1: 8.35 };
vend += shadow(vB, 0.08, 0.25);
vend += box(vB, { front: "#9a1014", side: "#c4161c" });
const vf = face(vB, "left"); // la cara que mira a l'habitació
vend += quad(vf, 0.06, 0.04, 0.94, 0.07, `fill="#fff6d8"`);
vend += quad(vf, 0.06, 0.1, 0.66, 0.66, `fill="#1d2329"`);
const bottleColors = ["#3fb06a", "#f2c200", "#3a8ae0", "#ff7a1a"];
for (let row = 0; row < 4; row++) for (let c = 0; c < 4; c++) {
  const u0 = 0.09 + c * 0.14, v0 = 0.13 + row * 0.13;
  vend += quad(vf, u0, v0, u0 + 0.09, v0 + 0.1, `fill="${bottleColors[(row + c) % 4]}"`);
  vend += quad(vf, u0, v0 + 0.105, u0 + 0.12, v0 + 0.115, `fill="#4a525c"`);
}
vend += quad(vf, 0.06, 0.1, 0.36, 0.66, `fill="#fff" opacity="0.08"`);
vend += quad(vf, 0.72, 0.12, 0.92, 0.46, `fill="#2b2b2e"`);
for (let i = 0; i < 6; i++) vend += quad(vf, 0.76 + (i % 2) * 0.08, 0.16 + Math.floor(i / 2) * 0.07, 0.82 + (i % 2) * 0.08, 0.2 + Math.floor(i / 2) * 0.07, `fill="#cfd6db"`);
vend += quad(vf, 0.76, 0.38, 0.88, 0.42, `fill="#111"`);
vend += quad(vf, 0.06, 0.74, 0.66, 0.86, `fill="#3a0608"`);
add(vend);

// ---------------------------------------------------------------- funcionari de la DGT (assegut en un tamboret darrere del taulell)
// Dibuix pla en centímetres (origen als peus, y negativa cap amunt), mirant cap a la seua pantalla (a la dreta)
// POSTURA: assegut DE FRONT a la sala (torso simètric, espatles iguals). Els braços baixen pels costats i els avantbraços
// van cap avant fins al teclat, que té just davant. Només el cap gira en tres quarts cap al monitor (a la dreta).
// Animacions (SMIL): teclejar (les mans pugen i baixen alternant), parpellejar i mirar avall al teclat de tant en tant.
const CLERK = `
  <!-- respatler de la cadira, darrere -->
  <rect x="-20" y="-168" width="40" height="80" rx="10" fill="#26262a"/>
  <!-- cos de front -->
  <path d="M-25 -80 C-28 -112 -27 -134 -17 -140 Q0 -146 17 -140 C27 -134 28 -112 25 -80 Z" fill="#8fc0e8"/>
  <path d="M-25 -80 C-28 -112 -27 -134 -17 -140 Q-12 -142 -9 -143 C-16 -128 -18 -104 -16 -80 Z" fill="#7aaed8"/>
  <path d="M14 -141 C20 -132 22 -110 20 -80 L25 -80 C28 -112 27 -134 17 -140 Z" fill="#a6d2f2"/>
  <!-- coll de camisa en V amb samarreta, botons i targeta d'identificació -->
  <path d="M-7 -143 L0 -131 L7 -143 Z" fill="#fff"/>
  <path d="M-8 -144 L-1 -132 L-6 -129 L-11 -141 Z M8 -144 L1 -132 L6 -129 L11 -141 Z" fill="#b8dcf6"/>
  <path d="M0 -131 V-82" stroke="#7aaed8" stroke-width="1"/>
  <g fill="#e8f2fb"><circle cx="0" cy="-124" r="1"/><circle cx="0" cy="-114" r="1"/><circle cx="0" cy="-104" r="1"/></g>
  <rect x="7" y="-126" width="9" height="12" rx="1" fill="#fff" stroke="#1f4f9e" stroke-width="1"/>
  <rect x="8.5" y="-124" width="6" height="3" fill="#1f4f9e"/>
  <path d="M-16 -126 h8 v8 h-8 Z" fill="none" stroke="#7aaed8" stroke-width="1"/>
  <!-- braços: el de l'esquerra i el de la dreta, simètrics -->
  <path d="M-21 -137 C-26 -128 -27 -118 -24 -107" stroke="#7aaed8" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M21 -137 C26 -128 27 -118 24 -107" stroke="#9fcbee" stroke-width="10" fill="none" stroke-linecap="round"/>
  <g><path d="M-24 -107 L-12 -103" stroke="#7aaed8" stroke-width="9" stroke-linecap="round"/>
    <animateTransform attributeName="transform" type="translate" values="0 0; 0 -2; 0 0" dur="0.4s" repeatCount="indefinite"/></g>
  <g><path d="M24 -107 L12 -103" stroke="#9fcbee" stroke-width="9" stroke-linecap="round"/>
    <animateTransform attributeName="transform" type="translate" values="0 0; 0 -2; 0 0" dur="0.4s" begin="0.2s" repeatCount="indefinite"/></g>
  <!-- coll i cap en tres quarts, mirant el monitor (a la dreta) -->
  <rect x="-5" y="-156" width="10" height="14" fill="#e2b08c"/>
  <path d="M-5 -146 Q0 -142 5 -146 V-143 Q0 -139 -5 -143 Z" fill="#d49c78"/>
  <g>
    <ellipse cx="1" cy="-166" rx="11.5" ry="13" fill="url(#dgt-skin)"/>
    <ellipse cx="-10" cy="-165" rx="2.6" ry="3.6" fill="#e2b08c"/>
    <path d="M-11 -167 C-13 -181 -1 -184 7 -181 C13 -179 14 -173 12 -170 C6 -175 -3 -174 -8 -168 Z" fill="#3a2a1a"/>
    <!-- ulls (el de prop i el de lluny), ulleres, nas cap a la dreta i boca -->
    <circle cx="-1.5" cy="-166" r="1.2" fill="#1d1d1f"/><circle cx="7.5" cy="-166" r="1.3" fill="#1d1d1f"/>
    <g fill="#f0c8a0" opacity="0"><ellipse cx="-1.5" cy="-166" rx="2" ry="1.7"/><ellipse cx="7.5" cy="-166" rx="2" ry="1.7"/>
      <animate attributeName="opacity" values="0;0;1;0" keyTimes="0;0.93;0.96;1" dur="4.3s" repeatCount="indefinite"/></g>
    <g stroke="#2b2b2b" stroke-width="1.1" fill="#bfe4ff" fill-opacity="0.35"><rect x="-5" y="-169" width="7" height="5.6" rx="2"/><rect x="4" y="-169" width="7.5" height="5.8" rx="2"/></g>
    <path d="M2 -167 h2 M-5 -167 l-5 -0.5" stroke="#2b2b2b" stroke-width="1"/>
    <path d="M9.5 -163 l2.4 3.4 l-2.6 0.7" stroke="#c98a6a" stroke-width="1.2" fill="none" stroke-linejoin="round"/>
    <path d="M3 -156.5 q3 1.5 6 0" stroke="#a0584a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <animateTransform attributeName="transform" type="rotate" values="0 0 -154; 0 0 -154; 4 0 -154; 4 0 -154; 0 0 -154"
      keyTimes="0;0.7;0.74;0.9;0.94" dur="8s" repeatCount="indefinite"/>
  </g>`;
const clerkX = -0.25, clerkZ = 7.75;
{
  const [gx, gy] = P(0.3, 1.55, 7.2);
  add(`<ellipse cx="${r(gx)}" cy="${r(gy)}" rx="70" ry="55" fill="url(#dgt-screen-glow)"><animate attributeName="opacity" values="1;0.75;1;0.9;1" dur="2.6s" repeatCount="indefinite"/></ellipse>`);
  // zona de toc: tota la persona que es veu (del taulell fins al cap)
  add(figure(CLERK, clerkX, 0, clerkZ), { spot: "test", title: "Funcionari de la DGT: registrar un test",
    hit: bbox([[clerkX - 0.3, 1.1, clerkZ], [clerkX + 0.3, 1.9, clerkZ]]) });
}

// ---------------------------------------------------------------- taulell d'atenció amb mampara, ordinador i teclat
let desk = "";
const dB = { x0: -2.25, x1: 2.25, y0: 0, y1: 1.08, z0: 6.2, z1: 7.0 };
desk += shadow(dB, 0.1, 0.25);
desk += box(dB, { front: "url(#dgt-counter)", side: "#1b3a6a" });
const tB = { x0: -2.32, x1: 2.32, y0: 1.08, y1: 1.12, z0: 6.14, z1: 7.45 };
desk += box(tB, { front: "#b9935a", side: "#a07c48", top: "url(#dgt-wood)" });
const df = face(dB, "front");
desk += quad(df, 0, 0.1, 1, 0.16, `fill="#f2c200"`);
for (const u of [0.04, 0.37, 0.70]) desk += quad(df, u, 0.28, u + 0.26, 0.9, `fill="#fff" opacity="0.08"`);
desk += quad(df, 0, 0.94, 1, 1, `fill="#14305a"`);
// tassa de café, teclat, mans i monitor: tot damunt del taulell, entre el funcionari i la mampara
desk += figure(`<rect x="-5" y="-9" width="10" height="9" rx="1.5" fill="#fff" stroke="#cfc7b3" stroke-width="0.8"/>
  <path d="M5 -7 q3.5 0.5 0 4.5" stroke="#cfc7b3" stroke-width="1.4" fill="none"/>
  <g stroke="#ffffff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.8">
    <path d="M-2 -11 q-2 -3 0 -6 q2 -3 0 -6"><animateTransform attributeName="transform" type="translate" values="0 2; 0 -3" dur="2.4s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0;0.9;0" dur="2.4s" repeatCount="indefinite"/></path>
    <path d="M2 -11 q2 -3 0 -6 q-2 -3 0 -6"><animateTransform attributeName="transform" type="translate" values="0 2; 0 -3" dur="2.4s" begin="1.2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0;0.9;0" dur="2.4s" begin="1.2s" repeatCount="indefinite"/></path></g>`, -0.72, 1.12, 7.15);
// teclat just davant del funcionari
desk += box({ x0: -0.47, x1: -0.03, y0: 1.12, y1: 1.135, z0: 7.22, z1: 7.36 }, { front: "#b9bec4", top: "#e3e7ea" });
// avantbraços i mans damunt del teclat (dels colzes al teclat), teclejant
{
  const sw = cam.scale(7.5) * 0.085, hw = cam.scale(7.28) * 0.05;
  for (const [x, ex, col, skin, delay] of [[-0.36, -0.47, "#7aaed8", "#e8bc94", 0], [-0.14, -0.03, "#9fcbee", "#f0c8a0", 0.2]]) {
    const [ax, ay] = P(ex, 1.2, 7.72), [bx, by] = P(x, 1.15, 7.32), [hx, hy] = P(x, 1.15, 7.27);
    desk += `<g><path d="M${r(ax)} ${r(ay)} L${r(bx)} ${r(by)}" stroke="${col}" stroke-width="${r(sw)}" stroke-linecap="round"/>
      <ellipse cx="${r(hx)}" cy="${r(hy)}" rx="${r(hw)}" ry="${r(hw * 0.7)}" fill="${skin}"/>
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 -2; 0 0" dur="0.4s" begin="${delay}s" repeatCount="indefinite"/></g>`;
  }
}
// monitor davant del funcionari (a la seua dreta), girat cap a ell: el veiem per darrere
desk += box({ x0: 0.17, x1: 0.43, y0: 1.12, y1: 1.13, z0: 6.98, z1: 7.18 }, { front: "#2b2f35", side: "#24282d", top: "#3a3f46" });
desk += box({ x0: 0.27, x1: 0.33, y0: 1.13, y1: 1.24, z0: 7.06, z1: 7.1 }, { front: "#2b2f35", side: "#24282d" });
const mB = { x0: 0.02, x1: 0.58, y0: 1.22, y1: 1.56, z0: 7.0, z1: 7.06 };
desk += box(mB, { front: "#3a3f46", side: "#9fd8ff" });
desk += quad(face(mB, "front"), 0.42, 0.4, 0.58, 0.6, `fill="#2b2f35"`);
// mampara de vidre: és el més proper, es pinta l'últim
desk += poly([[-2.2, 1.12, 6.62], [2.2, 1.12, 6.62], [2.2, 1.68, 6.62], [-2.2, 1.68, 6.62]], `fill="#cfe8f5" opacity="0.18"`);
desk += poly([[-1.9, 1.66, 6.62], [-1.6, 1.66, 6.62], [-1.95, 1.14, 6.62], [-2.15, 1.14, 6.62]], `fill="#fff" opacity="0.12"`);
desk += poly([[0.9, 1.66, 6.62], [1.05, 1.66, 6.62], [0.75, 1.14, 6.62], [0.65, 1.14, 6.62]], `fill="#fff" opacity="0.1"`);
desk += line([-2.2, 1.68, 6.62], [2.2, 1.68, 6.62], `stroke="#e8f4fa" stroke-width="3" opacity="0.8"`);
for (const x of [-2.2, -0.75, 0.75, 2.2]) desk += line([x, 1.12, 6.62], [x, 1.68, 6.62], `stroke="#b9c3ca" stroke-width="3"`);
add(desk);

// ---------------------------------------------------------------- diari / compendi obert damunt d'un faristol, sobre el taulell
{
  let s = "";
  const xa = -1.7, xm = -1.36, xb = -1.02;   // marges i llom del llibre
  const yF = 1.16, zF = 6.36, yB = 1.42, zB = 6.56; // vora de davant i vora de dalt (inclinat cap al públic)
  const at = (x, t, lift = 0) => [x, yF + (yB - yF) * t + lift, zF + (zB - zF) * t];
  const [gx, gy] = P(xm, 1.32, 6.46);
  s += `<ellipse cx="${r(gx)}" cy="${r(gy)}" rx="85" ry="55" fill="url(#dgt-book-glow)"/>`;
  // faristol de fusta
  s += box({ x0: xa + 0.06, x1: xb - 0.06, y0: 1.12, y1: 1.15, z0: 6.32, z1: 6.62 }, { front: "#6b4426", side: "#5a3a1f", top: "#8a5a33" });
  s += poly([[xa - 0.02, yF - 0.02, zF - 0.01], [xb + 0.02, yF - 0.02, zF - 0.01], [xb + 0.02, yB + 0.02, zB + 0.01], [xa - 0.02, yB + 0.02, zB + 0.01]], `fill="#7a1a1a"`);
  // pàgines (corbades cap al llom)
  s += poly([at(xa, 0), at(xm - 0.01, 0, 0.012), at(xm - 0.01, 1, 0.012), at(xa, 1)], `fill="#f6efdc" stroke="#c9b48e" stroke-width="1.5"`);
  s += poly([at(xb, 0), at(xm + 0.01, 0, 0.012), at(xm + 0.01, 1, 0.012), at(xb, 1)], `fill="#fbf5e6" stroke="#c9b48e" stroke-width="1.5"`);
  let lines = "";
  for (const t of [0.22, 0.36, 0.5, 0.64, 0.78]) lines += line(at(xa + 0.04, t), at(xm - 0.04, t, 0.01), "") + line(at(xm + 0.04, t, 0.01), at(xb - 0.04, t), "");
  s += `<g stroke="#b8a37e" stroke-width="1.6">${lines}</g>`;
  // dibuixet d'enemic a la pàgina dreta i cinta de punt de llibre
  s += poly([at(xm + 0.08, 0.28), at(xb - 0.07, 0.28), at(xb - 0.07, 0.6), at(xm + 0.08, 0.6)], `fill="#d6e6f2" stroke="#9fb8c6" stroke-width="1"`);
  s += line(at(xm, 1, 0.015), at(xm + 0.02, -0.25), `stroke="#c4161c" stroke-width="3"`);
  [[-1.62, 1.55, 6.5, 3], [-1.1, 1.6, 6.55, 2.5], [-1.36, 1.68, 6.5, 3.5]].forEach(([x, y, z, rr], i) => {
    const [px, py] = P(x, y, z);
    s += `<circle cx="${r(px)}" cy="${r(py)}" r="${rr}" fill="#ffe27a"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" begin="${i * 0.6}s" repeatCount="indefinite"/></circle>`;
  });
  add(s, { spot: "bestiary", title: "Diari: compendi d'enemics",
    hit: bbox([[xa - 0.05, 1.1, 6.3], [xb + 0.05, 1.72, 6.3], [xb + 0.05, 1.1, 6.62]]) });
}

// ---------------------------------------------------------------- caixer automàtic (contra la paret esquerra, mira cap a la dreta)
{
  let s = "";
  const aB = { x0: -W, x1: -3.86, y0: 0, y1: 1.75, z0: 5.35, z1: 6.15 };
  s += shadow(aB, 0.08, 0.28);
  s += box(aB, { front: "#4f6274", side: "url(#dgt-atm)", top: "#8aa0b2" });
  const af = face(aB, "right"); // u: de davant (esquerra a la pantalla) al fons
  s += quad(af, 0, 0, 1, 0.08, `fill="#2fa84f"`);
  s += quad(af, 0.42, 0.015, 0.58, 0.065, `fill="#009b48" stroke="#fff" stroke-width="1.5"`);
  s += quad(af, 0.47, 0.022, 0.5, 0.056, `fill="#fff"`) + quad(af, 0.47, 0.05, 0.54, 0.056, `fill="#fff"`);
  s += quad(af, 0.14, 0.15, 0.86, 0.41, `fill="#1d2a36"`);
  s += quad(af, 0.19, 0.18, 0.81, 0.38, `fill="url(#dgt-atm-screen)"`);
  s += quad(af, 0.25, 0.23, 0.6, 0.25, `fill="#bff3ff" opacity="0.8"`) + quad(af, 0.25, 0.28, 0.5, 0.3, `fill="#bff3ff" opacity="0.6"`);
  for (let row = 0; row < 4; row++) for (let c = 0; c < 3; c++) s += quad(af, 0.18 + c * 0.11, 0.47 + row * 0.04, 0.26 + c * 0.11, 0.5 + row * 0.04, `fill="#cfd6db"`);
  s += quad(af, 0.62, 0.46, 0.84, 0.56, `fill="#7f93a4"`) + quad(af, 0.65, 0.5, 0.81, 0.515, `fill="#1d1d1f"`);
  s += quad(af, 0.18, 0.66, 0.82, 0.69, `fill="#1d1d1f"`) + quad(af, 0.3, 0.635, 0.7, 0.665, `fill="#7fbf6a"`);
  s += quad(af, 0.1, 0.78, 0.9, 0.95, `fill="#45576a"`);
  add(s, { spot: "shop", title: "Caixer: canviar L per diners", hit: bbox(corners(aB)) });
}

// ---------------------------------------------------------------- dispensador de torns
{
  let s = "";
  const pole = { x0: -2.63, x1: -2.59, y0: 0, y1: 1.15, z0: 5.88, z1: 5.92 };
  s += shadow({ x0: -2.75, x1: -2.47, z0: 5.78, z1: 6.02 }, 0, 0.25);
  s += box({ x0: -2.75, x1: -2.47, y0: 0, y1: 0.03, z0: 5.78, z1: 6.02 }, { front: "#5a636a", side: "#4a525a", top: "#7a838a" });
  s += box(pole, { front: "#7a838a", side: "#5a636a" });
  const hB = { x0: -2.74, x1: -2.48, y0: 1.15, y1: 1.43, z0: 5.82, z1: 5.98 };
  s += box(hB, { front: "#d1261f", side: "#a51c16", top: "#e2483a" });
  s += quad(face(hB, "front"), 0.25, 0.15, 0.75, 0.35, `fill="#1d1d1f"`) + quad(face(hB, "front"), 0.3, 0.45, 0.7, 0.95, `fill="#fff"`);
  add(s);
}

// ---------------------------------------------------------------- espill penjat a la paret dreta (reflectix la granoteta)
{
  let s = "";
  const mB = { x0: 4.42, x1: W, y0: 0.95, y1: 2.35, z0: 6.0, z1: 7.05 };
  const [nx, ny] = P(W, 2.6, 6.52);
  const mf = face(mB, "left");
  const [tlx, tly] = P(...mf(0.5, 0));
  s += `<path d="M${r(P(...mf(0.15, 0))[0])} ${r(P(...mf(0.15, 0))[1])} L${r(nx)} ${r(ny)} L${r(P(...mf(0.85, 0))[0])} ${r(P(...mf(0.85, 0))[1])}" stroke="#6b4f2a" stroke-width="2" fill="none"/>`;
  s += `<circle cx="${r(nx)}" cy="${r(ny)}" r="3" fill="#6b4f2a"/>`;
  s += box(mB, { front: "#8a6a3a", side: "url(#dgt-frame)" });
  const g = [mf(0.09, 0.05), mf(0.91, 0.05), mf(0.91, 0.95), mf(0.09, 0.95)];
  const gp = g.map(p => P(...p));
  const clip = `<clipPath id="dgt-mirror-clip"><polygon points="${gp.map(p => p.map(r).join(",")).join(" ")}"/></clipPath>`;
  s += poly(g, `fill="url(#dgt-mirror-glass)"`);
  // el cristal és un trapezi (el costat de prop és més alt): el reflex es deforma amb l'alçada mitjana dels dos costats
  // i el que queda fora el retalla el clip; els buits els omple el degradat del cristal, que és el mateix del reflex
  const down = [((gp[3][0] - gp[0][0]) + (gp[2][0] - gp[1][0])) / 2, ((gp[3][1] - gp[0][1]) + (gp[2][1] - gp[1][1])) / 2];
  s += `<g clip-path="url(#dgt-mirror-clip)"><g transform="${affine(gp[0], gp[1], [gp[0][0] + down[0], gp[0][1] + down[1]], 100, 170)}"><foreignObject x="0" y="0" width="100" height="170">%REFLECTION%</foreignObject></g>`;
  s += poly([mf(0.2, 0.1), mf(0.4, 0.1), mf(0.25, 0.55), mf(0.15, 0.55)], `fill="#fff" opacity="0.3"`);
  s += `</g>`;
  add(clip + s, { spot: "inventory", title: "Espill: inventari", hit: bbox([...corners(mB), [W, 2.6, 6.5]]) });
}

// ---------------------------------------------------------------- destructora de paper: reiniciar la partida
// (destruir l'expedient i tornar a començar). Està al costat del taulell, a la dreta.
{
  let s = "";
  const kB = { x0: 1.62, x1: 2.0, y0: 0, y1: 0.66, z0: 5.5, z1: 5.82 };
  s += shadow(kB, 0.05, 0.28);
  s += box(kB, { front: "#3a3f46", side: "#2b2f35", top: "#4a525c" });
  const kf = face(kB, "front");
  // cubell transparent amb tires de paper triturat
  s += quad(kf, 0.06, 0.32, 0.94, 0.96, `fill="#cfe1ea" opacity="0.35"`);
  let strips = "";
  for (let i = 0; i < 9; i++) { const u = 0.12 + i * 0.09; strips += quad(kf, u, 0.55 + (i % 3) * 0.06, u + 0.035, 0.94, `fill="${i % 2 ? "#fff" : "#f2ecdc"}"`); }
  s += strips;
  s += quad(kf, 0.06, 0.32, 0.94, 0.96, `fill="none" stroke="#9fb8c6" stroke-width="1.5"`);
  // capçal amb el llum i la ranura
  s += quad(kf, 0, 0, 1, 0.28, `fill="#2b2f35"`);
  s += quad(kf, 0.72, 0.08, 0.86, 0.18, `fill="#d1261f"`);
  const kt = face(kB, "top");
  s += quad(kt, 0.12, 0.42, 0.88, 0.52, `fill="#111"`);
  // un full de l'expedient entrant per la ranura, amb línies i un segell
  const sheet = [[1.69, 0.66, 5.66], [1.93, 0.66, 5.66], [1.94, 0.9, 5.7], [1.68, 0.9, 5.7]];
  s += poly(sheet, `fill="#fff" stroke="#cfc7b3" stroke-width="1"`);
  let sl = "";
  for (const t of [0.25, 0.4, 0.55]) sl += line([1.71, 0.66 + 0.24 * t + 0.08, 5.67], [1.9, 0.66 + 0.24 * t + 0.08, 5.67], "");
  s += `<g stroke="#b8b0a2" stroke-width="1.4">${sl}</g>`;
  const [stx, sty] = P(1.86, 0.71, 5.67);
  s += `<circle cx="${r(stx)}" cy="${r(sty)}" r="4" fill="none" stroke="#d1261f" stroke-width="1.5"/>`;
  add(s, { spot: "reset", title: "Destructora: trencar l'expedient i reiniciar la partida",
    hit: bbox([...corners(kB), [1.68, 0.92, 5.7], [1.94, 0.92, 5.7]]) });
}

// ---------------------------------------------------------------- planta, paperera, cadires d'espera i con
{
  let s = "";
  const pB = { x0: 2.3, x1: 2.72, y0: 0, y1: 0.42, z0: 4.75, z1: 5.15 };
  s += shadow(pB, 0.06, 0.25) + box(pB, { front: "#b3542e", side: "#8f4024", top: "#4a3220" });
  s += figure(`<g fill="#2f6b33"><ellipse cx="-16" cy="-40" rx="12" ry="38" transform="rotate(-18 -16 -40)"/><ellipse cx="16" cy="-44" rx="12" ry="40" transform="rotate(16 16 -44)"/></g>
    <g fill="#3f8a3a"><ellipse cx="0" cy="-58" rx="13" ry="50"/><ellipse cx="-26" cy="-26" rx="10" ry="26" transform="rotate(-40 -26 -26)"/><ellipse cx="26" cy="-28" rx="10" ry="26" transform="rotate(40 26 -28)"/></g>
    <g fill="#5aa84f"><ellipse cx="-4" cy="-70" rx="5" ry="30"/></g>`, 2.51, 0.42, 4.95);
  const bB = { x0: -4.32, x1: -3.98, y0: 0, y1: 0.48, z0: 4.6, z1: 4.92 };
  s += shadow(bB, 0.05, 0.25) + box(bB, { front: "#6b757e", side: "#5a636a", top: "#2b2f35" });
  s += quad(face(bB, "front"), 0, 0, 1, 0.08, `fill="#8a949c"`);
  add(s);
}
{
  // bancada de tres cadires: una biga amb dues potes en T als extrems; cada seient va damunt d'un suport.
  // Les veiem per darrere (miren al taulell): primer el que està més lluny (potes, biga, suports), després seients i respatlers.
  let s = "";
  const xs = [-2.6, -2.06, -1.52], w = 0.46, bx0 = xs[0] + 0.05, bx1 = xs[2] + w - 0.05;
  s += shadow({ x0: xs[0], x1: xs[2] + w, z0: 3.2, z1: 3.66 }, 0.03, 0.22);
  for (const lx of [bx0 + 0.04, bx1 - 0.08]) {
    s += box({ x0: lx - 0.01, x1: lx + 0.05, y0: 0, y1: 0.03, z0: 3.24, z1: 3.62 }, { front: "#4a525a", side: "#3e454c", top: "#6b757e" });
    s += box({ x0: lx, x1: lx + 0.04, y0: 0.03, y1: 0.36, z0: 3.4, z1: 3.44 }, { front: "#5a636a", side: "#4a525a" });
  }
  s += box({ x0: bx0, x1: bx1, y0: 0.36, y1: 0.4, z0: 3.38, z1: 3.46 }, { front: "#5a636a", side: "#4a525a", top: "#6b757e" });
  for (const x of xs) {
    s += box({ x0: x + 0.2, x1: x + 0.26, y0: 0.4, y1: 0.44, z0: 3.36, z1: 3.48 }, { front: "#4a525a", side: "#3e454c" });
    s += box({ x0: x, x1: x + w, y0: 0.44, y1: 0.49, z0: 3.22, z1: 3.66 }, { front: "#d9612f", side: "#c4552a", top: "#ff8a4a" });
    s += box({ x0: x, x1: x + w, y0: 0.5, y1: 0.92, z0: 3.17, z1: 3.22 }, { front: "#ff7a3d", side: "#d9612f", top: "#ff9a62" });
  }
  add(s);
}
{
  const CONE = `<ellipse cx="0" cy="0" rx="22" ry="5" fill="#1a1a4e" opacity="0.25"/>
    <rect x="-20" y="-6" width="40" height="6" rx="2" fill="#d9a800"/>
    <path d="M-15 -6 L-4 -64 L4 -64 L15 -6 Z" fill="url(#dgt-cone)"/>
    <path d="M-12 -22 L12 -22 L10 -30 L-10 -30 Z M-8 -42 L8 -42 L6.5 -49 L-6.5 -49 Z" fill="#fff"/>`;
  add(figure(CONE, 0.25, 0, 2.7));
}

// ---------------------------------------------------------------- definicions (degradats, patrons i filtres)
const defs = `${cam.defs}
  <linearGradient id="dgt-wall-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2ecde"/><stop offset="0.6" stop-color="#ebe4d3"/><stop offset="1" stop-color="#ddd5c2"/></linearGradient>
  <linearGradient id="dgt-wall-l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d3cbb6"/><stop offset="1" stop-color="#e4dcc9"/></linearGradient>
  <linearGradient id="dgt-wall-r" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#cdc5b0"/><stop offset="1" stop-color="#e0d8c4"/></linearGradient>
  <linearGradient id="dgt-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdc7b8"/><stop offset="0.5" stop-color="#d8d3c6"/><stop offset="1" stop-color="#e6e1d6"/></linearGradient>
  <radialGradient id="dgt-lamp"><stop offset="0" stop-color="#fffbe6" stop-opacity="0.65"/><stop offset="1" stop-color="#fffbe6" stop-opacity="0"/></radialGradient>
  <linearGradient id="dgt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb8e6"/><stop offset="1" stop-color="#cfe6f5"/></linearGradient>
  <pattern id="dgt-blinds" width="10" height="9" patternUnits="userSpaceOnUse"><rect width="10" height="9" fill="#f4f1e8"/><rect y="7" width="10" height="2" fill="#cfc9bb"/></pattern>
  <linearGradient id="dgt-tv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f6fc0"/><stop offset="1" stop-color="#173a6e"/></linearGradient>
  <linearGradient id="dgt-counter" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f5ea4"/><stop offset="1" stop-color="#1d3d70"/></linearGradient>
  <linearGradient id="dgt-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9ab7c"/><stop offset="1" stop-color="#dcc39a"/></linearGradient>
  <linearGradient id="dgt-shirt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6f9fca"/><stop offset="0.5" stop-color="#8fc0e8"/><stop offset="1" stop-color="#a8d2f2"/></linearGradient>
  <radialGradient id="dgt-skin" cx="0.65" cy="0.4" r="0.7"><stop offset="0" stop-color="#f6d4b2"/><stop offset="1" stop-color="#e2b08c"/></radialGradient>
  <radialGradient id="dgt-screen-glow"><stop offset="0" stop-color="#9fd8ff" stop-opacity="0.4"/><stop offset="1" stop-color="#9fd8ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="dgt-book-glow"><stop offset="0" stop-color="#ffe27a" stop-opacity="0.7"/><stop offset="1" stop-color="#ffe27a" stop-opacity="0"/></radialGradient>
  <linearGradient id="dgt-atm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7f95a8"/><stop offset="1" stop-color="#5f7486"/></linearGradient>
  <linearGradient id="dgt-atm-screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3aa0c8"/><stop offset="1" stop-color="#1f5f80"/></linearGradient>
  <linearGradient id="dgt-mirror-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3eff5"/><stop offset="0.6" stop-color="#b8ccd8"/><stop offset="1" stop-color="#94adbd"/></linearGradient>
  <linearGradient id="dgt-frame" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d0aa6a"/><stop offset="1" stop-color="#a8844f"/></linearGradient>
  <linearGradient id="dgt-cone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd23f"/><stop offset="1" stop-color="#e0a800"/></linearGradient>
  <radialGradient id="dgt-vignette" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="#1a1a4e" stop-opacity="0"/><stop offset="1" stop-color="#1a1a4e" stop-opacity="0.28"/></radialGradient>`;
add(`<rect width="1600" height="900" fill="url(#dgt-vignette)" pointer-events="none"/>`);

// ---------------------------------------------------------------- eixida
const out = `// GENERAT per tools/dgt.js (no l'edites a mà: canvia l'escena allà i torna a executar-lo)
// Capes de l'interior de la DGT en ordre de pintat (del fons cap al davant). Les capes amb \`spot\` són punts interactius
// (vegeu js/hub.js). %REFLECTION% es substituïx pel reflex de la granoteta i %WINDOW_IMG% pel fons de l'escenari actual.
const HUB_ART = ${JSON.stringify({ defs, layers, tv: TV }, null, 0)};
`;
fs.writeFileSync(path.join(__dirname, "..", "js", "data", "hub-art.js"), out);
const pi = process.argv.indexOf("--preview");
if (pi > 0) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs>${defs}</defs>${layers.map(l => l.svg.replace("%REFLECTION%", "").replace(/%[A-Z]+(\+360)?%/g, "0").replace("%WINDOW_IMG%", "../../img/escenari-9.svg")).join("")}</svg>`;
  fs.writeFileSync(process.argv[pi + 1], svg);
}
console.log(`js/data/hub-art.js: ${layers.length} capes, ${(out.length / 1024).toFixed(0)} KB`);
