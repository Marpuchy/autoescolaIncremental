#!/usr/bin/env node
// ===== HABITACIÓ (generador) =====
// L'habitació és la pantalla d'inici: des d'ací es va a cada joc d'estudi. Es descriu en metres i es projecta amb
// tools/perspectiva.js. Escriu js/data/room-art.js, que pinta js/room.js. Ús: node tools/habitacio.js [--preview fitxer.svg]
// Basada en l'habitació de veritat de l'autor (fotos de referència): mirant cap a la finestra des dels peus del llit.
//   Paret del fons (z = 3.6), d'esquerra a dreta: prestatgeria blanca (llibres, còmics i figuretes), el doblec de la
//   paret, l'escriptori (pantalles i PC) amb dos prestatges damunt (figuretes, llibres i un focus d'anell), la finestra
//   amb persianes i l'armari de fusta. Davant de l'armari, les coses de la gata: menjador, sorral, peluix, rascador de
//   terra i rascador de torre. Paret dreta: calaixera amb la tele i una vitrina amb figuretes i records de viatges.
//   Paret esquerra: el llit gran amb l'edredó de cercles; la motxilla recolzada al llit.
// Punts interactius: la placa L a la prestatgeria (→ DGT) i la motxilla (→ joc d'estudi).
// Habitació: 3,6 m d'ample (x de -1.8 a 1.8), 2,6 m d'alt i 3,6 m de fons. Càmera a 1,45 m.
const fs = require("fs"), path = require("path");
const { camera, r } = require("./perspectiva");

const cam = camera({ cx: 800, cy: 410, eye: 1.45, d: 3.1, f: 1150 });
const { P, poly, box, face, quad, shadow, figure, line, bbox, corners } = cam;
const W = 1.8, H = 2.6, BACK = 3.6;
const layers = [];
const add = (svg, spot) => layers.push({ svg, ...(spot || {}) });
const wallRect = (x0, y0, x1, y1, attrs, z = BACK) => { const [a, b] = P(x0, y1, z), [c, d] = P(x1, y0, z); return `<rect x="${r(a)}" y="${r(b)}" width="${r(c - a)}" height="${r(d - b)}" ${attrs}/>`; };
const WHITE = { front: "#f4f2ec", side: "#e2dfd6", top: "#fbfaf6", bottom: "#d8d4ca" };

// ---------------------------------------------------------------- parets, sostre i terra (terratzo)
{
  let s = "";
  // les superfícies continuen per darrere de la càmera (z negativa) perquè no hi haja bandes als costats
  const Z = -2.6;
  s += poly([[-W, H, Z], [W, H, Z], [W, H, BACK], [-W, H, BACK]], `fill="#eceae4"`);
  s += poly([[-W, 0, Z], [-W, 0, BACK], [-W, H, BACK], [-W, H, Z]], `fill="url(#room-wall-l)"`);
  s += poly([[W, 0, Z], [W, 0, BACK], [W, H, BACK], [W, H, Z]], `fill="url(#room-wall-r)"`);
  s += wallRect(-W, 0, W, H, `fill="url(#room-wall-b)"`);
  s += poly([[-W, 0, Z], [W, 0, Z], [W, 0, BACK], [-W, 0, BACK]], `fill="url(#room-floor)"`);
  // pedretes del terratzo: escampades en perspectiva (més menudes al fons)
  let dots = "";
  for (let i = 0; i < 520; i++) {
    const x = -W + ((i * 0.6180339) % 1) * 2 * W, z = -1.2 + ((i * 0.4142135) % 1) * (BACK + 1.2), [px, py] = P(x, 0, z), k = cam.scale(z) / 300;
    dots += `<ellipse cx="${r(px)}" cy="${r(py)}" rx="${(2.2 * k).toFixed(1)}" ry="${(1.1 * k).toFixed(1)}" fill="${["#a08868", "#c9b08a", "#8a7356", "#e6d6b8"][i % 4]}"/>`;
  }
  s += `<g opacity="0.7">${dots}</g>`;
  // sòcol
  s += wallRect(-W, 0, W, 0.07, `fill="#e9e5dc"`);
  s += poly([[-W, 0, -2.6], [-W, 0, BACK], [-W, 0.07, BACK], [-W, 0.07, -2.6]], `fill="#dedad0"`);
  s += poly([[W, 0, -2.6], [W, 0, BACK], [W, 0.07, BACK], [W, 0.07, -2.6]], `fill="#d8d4ca"`);
  add(s);
}

// ---------------------------------------------------------------- finestra amb persianes (paret del fons)
const WIN = { x0: -0.02, x1: 1.26, y0: 0.82, y1: 2.28 };
{
  let s = "";
  const { x0, x1, y0, y1 } = WIN, split = 1.18; // persiana fins a 1,18 m; davall, el vidre amb els arbres
  s += wallRect(x0 - 0.05, y0 - 0.05, x1 + 0.05, y1 + 0.05, `fill="#fbfbf8"`);
  s += wallRect(x0, y0, x1, split, `fill="url(#room-trees)"`);
  // persiana: lamel·les blanques amb els foradets de llum
  s += wallRect(x0, split, x1, y1, `fill="#e8e6df"`);
  let sl = "";
  for (let y = split + 0.035; y < y1; y += 0.035) {
    sl += line([x0, y, BACK], [x1, y, BACK], `stroke="#cfccc2" stroke-width="1"`);
    for (let x = x0 + 0.03; x < x1; x += 0.055) { const [px, py] = P(x, y - 0.012, BACK); sl += `<rect x="${r(px)}" y="${r(py)}" width="2.2" height="1.4" fill="#fff6d6"/>`; }
  }
  s += sl;
  // tires de la persiana i marcs (tres fulles i un travesser)
  for (const x of [x0 + (x1 - x0) / 3, x0 + 2 * (x1 - x0) / 3]) s += wallRect(x - 0.025, y0, x + 0.025, y1, `fill="#fbfbf8"`);
  s += wallRect(x0, split - 0.02, x1, split + 0.02, `fill="#fbfbf8"`);
  s += wallRect(x0, y0 + 0.3, x1, y0 + 0.33, `fill="#fbfbf8"`);
  s += wallRect(x0 - 0.08, y0 - 0.08, x1 + 0.08, y0 - 0.04, `fill="#efede6"`); // ampit
  add(s);
}

// ---------------------------------------------------------------- radiador de la paret, davall de la finestra
{
  let s = "";
  const b = { x0: 0.25, x1: 1.05, y0: 0.14, y1: 0.66, z0: BACK - 0.1, z1: BACK - 0.02 };
  s += box(b, { front: "#f2f0ea", top: "#fbfaf6" });
  for (let u = 0.05; u < 1; u += 0.07) s += quad(face(b, "front"), u, 0.05, u + 0.012, 0.95, `fill="#d8d4ca"`);
  add(s);
}

// ---------------------------------------------------------------- prestatgeria blanca (al costat del capçal del llit): llibres, còmics i figuretes
const SHELF = { x0: -W + 0.02, x1: -1.2, y0: 0, y1: 2.05, z0: BACK - 0.33, z1: BACK };
let plate; // on va la placa L
{
  let s = "";
  s += box(SHELF, WHITE);
  const fr = face(SHELF, "front");
  const rows = [0.06, 0.24, 0.42, 0.6, 0.78]; // v de dalt de cada buit (de dalt a baix)
  for (const v of rows) s += quad(fr, 0.05, v, 0.95, v + 0.155, `fill="#2a2a2e"`); // fons fosc dels buits
  // calaix de baix
  s += quad(fr, 0.05, 0.955, 0.95, 0.995, `fill="#ebe8e0"`);
  const item = (u0, v0, u1, v1, c) => quad(fr, u0, v0, u1, v1, `fill="${c}"`);
  // fila 1: figuretes (formes genèriques: un ninot cabut taronja, un drac verd) i capses
  s += item(0.08, 0.13, 0.26, 0.215, "#e46a2e") + item(0.11, 0.1, 0.23, 0.14, "#f08a4a") + item(0.13, 0.115, 0.15, 0.125, "#1a1a1a") + item(0.19, 0.115, 0.21, 0.125, "#1a1a1a");
  s += item(0.32, 0.12, 0.52, 0.215, "#c84a3a") + item(0.36, 0.13, 0.48, 0.2, "#f3eee2");
  s += item(0.58, 0.1, 0.92, 0.215, "#3a4a8e") + item(0.62, 0.12, 0.88, 0.14, "#f2c200");
  // fila 2: còmics drets de colors
  { let u = 0.08; const cols = ["#d1261f", "#1f6fb2", "#f2c200", "#2f9e55", "#7b3fe4", "#e46a2e", "#2a2a2e", "#d1261f", "#1f6fb2", "#3fdc8a", "#f2f0ea", "#c84a3a"];
    for (let i = 0; u < 0.9; i++) { const w = 0.045 + (i % 3) * 0.012, top = 0.27 + (i % 4) * 0.012; s += item(u, top, u + w, 0.395, cols[i % cols.length]); u += w + 0.006; } }
  // fila 3: una figureta, llibres tombats i la placa L (es posa després, com a punt interactiu)
  s += item(0.08, 0.5, 0.36, 0.535, "#2f6fc0") + item(0.09, 0.535, 0.34, 0.56, "#d1261f") + item(0.1, 0.56, 0.33, 0.575, "#f2f0ea");
  s += item(0.72, 0.47, 0.84, 0.575, "#3fdc8a") + item(0.745, 0.445, 0.815, 0.48, "#2f9e55");
  plate = fr(0.55, 0.575);
  // fila 4: caixes de jocs i un altaveu
  s += item(0.08, 0.66, 0.5, 0.755, "#1d1d22") + item(0.11, 0.69, 0.47, 0.71, "#e8e8e8") + item(0.56, 0.68, 0.9, 0.755, "#2b5a3a");
  // fila 5: capses i un esprai
  s += item(0.08, 0.83, 0.42, 0.935, "#2a2f45") + item(0.5, 0.86, 0.6, 0.935, "#4aa8ff") + item(0.66, 0.85, 0.9, 0.935, "#c9a678");
  add(s);
}

// ---------------------------------------------------------------- doblec de la paret (pilar entre la prestatgeria i l'escriptori)
{
  let s = "";
  s += box({ x0: -1.2, x1: -0.98, y0: 0, y1: H, z0: BACK - 0.36, z1: BACK }, { front: "#e4e6e8", side: "#d6d9dc" });
  add(s);
}

// ---------------------------------------------------------------- prestatges damunt de l'escriptori: figuretes, llibres i el focus d'anell
{
  let s = "";
  for (const y of [1.48, 1.92]) {
    const b = { x0: -0.98, x1: -0.04, y0: y - 0.03, y1: y, z0: BACK - 0.26, z1: BACK };
    s += box(b, WHITE);
  }
  // figuretes del prestatge de dalt: dinosaures i ninots (siluetes genèriques)
  const dino = c => `<path d="M-14 0 L-12 -8 Q-8 -14 0 -13 L8 -18 Q12 -20 13 -16 L10 -12 Q8 -6 6 0 Z M-12 -8 L-20 -12" fill="${c}" stroke="#00000033" stroke-width="0.6"/>`;
  const doll = c => `<rect x="-3" y="-14" width="6" height="10" rx="2" fill="${c}"/><circle cy="-17" r="3.4" fill="#f3d2b0"/><path d="M-3 -4 L-4 0 M3 -4 L4 0" stroke="${c}" stroke-width="2"/>`;
  for (const [x, svg] of [[-0.88, dino("#9fbf6a")], [-0.72, doll("#3a4a8e")], [-0.6, dino("#d9c9a0")], [-0.44, doll("#d1261f")], [-0.3, doll("#2a2a2e")], [-0.16, dino("#6a9a5a")]])
    s += figure(`<g transform="scale(1.6)">${svg}</g>`, x, 1.92, BACK - 0.13);
  // prestatge de baix: llibres drets, una capsa i el focus d'anell
  { let x = -0.6; const cols = ["#1f6fb2", "#f2c200", "#d1261f", "#2a2a2e", "#2f9e55"];
    for (let i = 0; i < 5; i++) { const w = 0.035 + (i % 2) * 0.012, h = 0.2 + (i % 3) * 0.03; s += box({ x0: x, x1: x + w, y0: 1.48, y1: 1.48 + h, z0: BACK - 0.2, z1: BACK - 0.05 }, { front: cols[i], top: "#f3eee2" }); x += w + 0.005; } }
  s += figure(`<g transform="scale(1.6)">${dino("#c9b48e")}</g>`, -0.22, 1.48, BACK - 0.12);
  // focus d'anell amb el braç flexible: llum blanca que es reparteix
  const [rx, ry] = P(-0.82, 1.78, BACK - 0.14), k = cam.scale(BACK - 0.14) / 100;
  s += `<ellipse cx="${r(rx)}" cy="${r(ry + 40)}" rx="${r(150 * k)}" ry="${r(120 * k)}" fill="url(#room-ring-glow)"/>`;
  s += line([-0.9, 1.48, BACK - 0.14], [-0.9, 1.7, BACK - 0.14], `stroke="#2a2a2e" stroke-width="2.4"`);
  s += `<path d="M${r(P(-0.9, 1.7, BACK - 0.14)[0])} ${r(P(-0.9, 1.7, BACK - 0.14)[1])} Q${r(rx - 10)} ${r(ry - 14)} ${r(rx)} ${r(ry)}" stroke="#2a2a2e" stroke-width="2.4" fill="none"/>`;
  s += `<circle cx="${r(rx)}" cy="${r(ry)}" r="${r(11 * k * 1.6)}" fill="none" stroke="#2a2a2e" stroke-width="${(6 * k * 1.6).toFixed(1)}"/>`;
  s += `<circle cx="${r(rx)}" cy="${r(ry)}" r="${r(11 * k * 1.6)}" fill="none" stroke="#fffdf2" stroke-width="${(3.6 * k * 1.6).toFixed(1)}"/>`;

  add(s);
}

// ---------------------------------------------------------------- escriptori blanc amb les pantalles i el PC
const DESK = { x0: -0.97, x1: 0.06, z0: BACK - 0.62, z1: BACK - 0.02, top: 0.74 };
{
  let s = "";
  s += shadow({ x0: DESK.x0, x1: DESK.x1, z0: DESK.z0, z1: DESK.z1 }, 0.03, 0.18);
  // torre del PC a terra, davall de l'escriptori, amb llum de colors
  const tB = { x0: -0.9, x1: -0.7, y0: 0, y1: 0.44, z0: BACK - 0.5, z1: BACK - 0.06 };
  s += box(tB, { front: "#1d2026", side: "#16181c", top: "#2a2e36" });
  s += quad(face(tB, "front"), 0.78, 0.15, 0.86, 0.9, `fill="url(#room-rgb)"`) + quad(face(tB, "front"), 0.15, 0.08, 0.3, 0.12, `fill="#3fdc8a"`);
  // potes metàl·liques blanques i la balda de baix
  for (const x of [DESK.x0, DESK.x1 - 0.035]) for (const z of [DESK.z0, DESK.z1 - 0.035])
    s += box({ x0: x, x1: x + 0.035, y0: 0, y1: DESK.top - 0.03, z0: z, z1: z + 0.035 }, { front: "#e8e8e4", side: "#d0d0cc" });
  s += box({ x0: DESK.x0, x1: DESK.x1, y0: 0.22, y1: 0.24, z0: DESK.z0 + 0.1, z1: DESK.z1 }, { front: "#e8e8e4", top: "#f2f2ee" });
  // uns quants cables penjant
  for (const [x, c] of [[-0.55, "#1a1a1a"], [-0.42, "#2a2a2a"], [-0.3, "#e8e8e8"]]) {
    const [ax, ay] = P(x, DESK.top - 0.03, DESK.z0 + 0.05), [bx, by] = P(x + 0.06, 0.05, DESK.z0 + 0.02);
    s += `<path d="M${r(ax)} ${r(ay)} C${r(ax - 10)} ${r((ay + by) / 2)} ${r(bx + 12)} ${r((ay + by) / 2 + 20)} ${r(bx)} ${r(by)}" stroke="${c}" stroke-width="2" fill="none"/>`;
  }
  // tauler blanc
  s += box({ x0: DESK.x0 - 0.01, x1: DESK.x1 + 0.01, y0: DESK.top - 0.03, y1: DESK.top, z0: DESK.z0 - 0.01, z1: DESK.z1 }, { front: "#e8e6e0", side: "#d8d6d0", top: "#f6f5f1" });
  // pantalla principal i la secundària, amb la sala del joc a la pantalla
  const mB = { x0: -0.62, x1: -0.06, y0: DESK.top + 0.1, y1: DESK.top + 0.44, z0: BACK - 0.22, z1: BACK - 0.19 };
  s += box({ x0: -0.37, x1: -0.31, y0: DESK.top, y1: DESK.top + 0.12, z0: BACK - 0.18, z1: BACK - 0.15 }, { front: "#2b2f35" });
  s += box(mB, { front: "#141619", side: "#0e1013", top: "#22252b" });
  const mf = face(mB, "front");
  s += quad(mf, 0.03, 0.05, 0.97, 0.92, `fill="url(#room-screen)"`);
  s += quad(mf, 0.1, 0.55, 0.9, 0.86, `fill="#e98a4a"`) + quad(mf, 0.4, 0.3, 0.55, 0.55, `fill="#3f7ad8"`) + quad(mf, 0.62, 0.36, 0.7, 0.55, `fill="#f2f0ea"`);
  const m2 = { x0: -0.95, x1: -0.78, y0: DESK.top + 0.08, y1: DESK.top + 0.5, z0: BACK - 0.3, z1: BACK - 0.27 };
  s += box(m2, { front: "#141619", side: "#0e1013", top: "#22252b" });
  s += quad(face(m2, "front"), 0.06, 0.04, 0.94, 0.96, `fill="#2a3a55"`);
  for (const v of [0.15, 0.25, 0.35, 0.45]) s += quad(face(m2, "front"), 0.14, v, 0.7, v + 0.03, `fill="#9fc3e6" opacity="0.7"`);
  // teclat, ratolí amb llum i ampolla d'aigua blava
  s += box({ x0: -0.6, x1: -0.2, y0: DESK.top, y1: DESK.top + 0.02, z0: BACK - 0.5, z1: BACK - 0.37 }, { front: "#2b2f35", side: "#23272e", top: "url(#room-keys)" });
  s += box({ x0: -0.12, x1: -0.07, y0: DESK.top, y1: DESK.top + 0.025, z0: BACK - 0.48, z1: BACK - 0.4 }, { front: "#1f2328", top: "#2b2f35" });
  s += quad(face({ x0: -0.12, x1: -0.07, y0: DESK.top, y1: DESK.top + 0.025, z0: BACK - 0.48, z1: BACK - 0.4 }, "front"), 0, 0.6, 1, 1, `fill="#4ad8ff"`);
  s += box({ x0: -0.03, x1: 0.03, y0: DESK.top, y1: DESK.top + 0.26, z0: BACK - 0.2, z1: BACK - 0.14 }, { front: "#1f5fd8", side: "#174ab0", top: "#2a6ae8" });
  s += box({ x0: -0.015, x1: 0.015, y0: DESK.top + 0.26, y1: DESK.top + 0.3, z0: BACK - 0.185, z1: BACK - 0.155 }, { front: "#f2f0ea" });
  // braç del micròfon
  const [m0x, m0y] = P(-0.72, DESK.top, BACK - 0.3), [m1x, m1y] = P(-0.66, DESK.top + 0.45, BACK - 0.35), [m2x, m2y] = P(-0.48, DESK.top + 0.3, BACK - 0.45);
  s += `<path d="M${r(m0x)} ${r(m0y)} L${r(m1x)} ${r(m1y)} L${r(m2x)} ${r(m2y)}" stroke="#1a1a1a" stroke-width="3" fill="none" stroke-linejoin="round"/>`;
  s += `<rect x="${r(m2x - 4)}" y="${r(m2y)}" width="8" height="16" rx="3" fill="#2a2a2e"/>`;
  add(s);
}

// ---------------------------------------------------------------- armari de fusta (a la dreta de la finestra)
{
  let s = "";
  const b = { x0: 1.3, x1: W, y0: 0, y1: 2.4, z0: BACK - 0.58, z1: BACK };
  s += box(b, { front: "url(#room-wood)", side: "#b98a4a", top: "#c99a5a" });
  const fr = face(b, "front");
  s += quad(fr, 0.49, 0.02, 0.51, 1, `fill="#9a6a32"`);
  for (const [u0, u1] of [[0.06, 0.44], [0.56, 0.94]]) { s += quad(fr, u0, 0.05, u1, 0.47, `fill="none" stroke="#a87a3e" stroke-width="2"`); s += quad(fr, u0, 0.53, u1, 0.96, `fill="none" stroke="#a87a3e" stroke-width="2"`); }
  for (const u of [0.44, 0.56]) { const [kx, ky] = P(...fr(u, 0.5)); s += `<circle cx="${r(kx)}" cy="${r(ky)}" r="3.4" fill="#6a4a22"/>`; }
  add(s);
}

// ---------------------------------------------------------------- radiador d'oli (entre l'escriptori i la cadira)
{
  let s = "";
  const b = { x0: 0.08, x1: 0.42, y0: 0.06, y1: 0.66, z0: 2.78, z1: 2.98 };
  s += shadow(b, 0.03, 0.2);
  s += box(b, { front: "#f2f1ec", side: "#dcdad3", top: "#fafaf6" });
  for (let u = 0.07; u < 0.95; u += 0.11) s += quad(face(b, "front"), u, 0.06, u + 0.04, 0.94, `fill="#d4d2ca"`);
  s += quad(face(b, "front"), 0.82, 0.04, 0.96, 0.2, `fill="#c8c6be"`);
  for (const x of [0.12, 0.38]) { const [wx, wy] = P(x, 0.03, 2.88); s += `<circle cx="${r(wx)}" cy="${r(wy)}" r="4" fill="#3a3a3a"/>`; }
  add(s);
}

// ---------------------------------------------------------------- cadira d'oficina negra de malla, davant de la finestra
{
  let s = "";
  const cx = 0.68, cz = 2.95;
  s += shadow({ x0: cx - 0.3, x1: cx + 0.3, z0: cz - 0.25, z1: cz + 0.25 }, 0.02, 0.22);
  // base d'estrela cromada amb rodes
  const [bx, by] = P(cx, 0.08, cz);
  s += `<g stroke="#b8bcc2" stroke-width="5" stroke-linecap="round">${[-150, -100, -35, 20, 80].map(a => {
    const ex = cx + Math.cos(a * Math.PI / 180) * 0.3, ez = cz + Math.sin(a * Math.PI / 180) * 0.3, [px, py] = P(ex, 0.06, ez);
    return `<line x1="${r(bx)}" y1="${r(by)}" x2="${r(px)}" y2="${r(py)}"/>`; }).join("")}</g>`;
  for (const a of [-150, -100, -35, 20, 80]) { const [px, py] = P(cx + Math.cos(a * Math.PI / 180) * 0.3, 0.03, cz + Math.sin(a * Math.PI / 180) * 0.3); s += `<circle cx="${r(px)}" cy="${r(py)}" r="5" fill="#1a1a1a"/>`; }
  s += box({ x0: cx - 0.025, x1: cx + 0.025, y0: 0.08, y1: 0.45, z0: cz - 0.02, z1: cz + 0.02 }, { front: "#9a9ea4", side: "#80848a" });
  // seient, respatller de malla i capçal
  s += box({ x0: cx - 0.26, x1: cx + 0.26, y0: 0.45, y1: 0.53, z0: cz - 0.24, z1: cz + 0.2 }, { front: "#222428", side: "#1a1c20", top: "#2e3136" });
  const back = { x0: cx - 0.24, x1: cx + 0.24, y0: 0.62, y1: 1.18, z0: cz + 0.2, z1: cz + 0.24 };
  s += box(back, { front: "#222428", side: "#1a1c20", top: "#2e3136" });
  const bf = face(back, "front");
  s += quad(bf, 0.1, 0.08, 0.9, 0.9, `fill="url(#room-mesh)"`);
  s += box({ x0: cx - 0.13, x1: cx + 0.13, y0: 1.24, y1: 1.38, z0: cz + 0.21, z1: cz + 0.25 }, { front: "#222428", top: "#2e3136" });
  s += quad(face({ x0: cx - 0.13, x1: cx + 0.13, y0: 1.24, y1: 1.38, z0: cz + 0.21, z1: cz + 0.25 }, "front"), 0.1, 0.15, 0.9, 0.85, `fill="url(#room-mesh)"`);
  s += box({ x0: cx - 0.02, x1: cx + 0.02, y0: 1.18, y1: 1.24, z0: cz + 0.22, z1: cz + 0.24 }, { front: "#1a1c20" });
  // reposabraços
  for (const x of [cx - 0.3, cx + 0.26]) s += box({ x0: x, x1: x + 0.04, y0: 0.53, y1: 0.72, z0: cz - 0.05, z1: cz + 0.15 }, { front: "#1a1c20", side: "#141518", top: "#2e3136" });
  add(s);
}

// ---------------------------------------------------------------- racó de la gata: menjador, sorral, rascador de terra, peluix i rascador de torre
{
  let s = "";
  // menjador doble (aigua i menjar)
  const fB = { x0: 0.98, x1: 1.24, y0: 0, y1: 0.06, z0: 2.82, z1: 2.98 };
  s += box(fB, { front: "#d8c6a8", side: "#c8b698", top: "#e6d6b8" });
  for (const [x, c] of [[1.04, "#6aa8e8"], [1.17, "#a86a3a"]]) { const [px, py] = P(x, 0.06, 2.9), k = cam.scale(2.9) / 100; s += `<ellipse cx="${r(px)}" cy="${r(py)}" rx="${r(5.2 * k)}" ry="${r(1.8 * k)}" fill="#f2f0ea"/><ellipse cx="${r(px)}" cy="${r(py)}" rx="${r(3.8 * k)}" ry="${r(1.2 * k)}" fill="${c}"/>`; }
  // sorral (caixa negra amb sorra)
  const lB = { x0: 0.95, x1: 1.32, y0: 0, y1: 0.1, z0: 2.4, z1: 2.68 };
  s += box(lB, { front: "#2a2620", side: "#221f1a", top: "#d8cba8" });
  // rascador de terra rodó groc (pista amb pilota)
  const [rx, ry] = P(0.62, 0.02, 2.48), k = cam.scale(2.48) / 100;
  s += `<ellipse cx="${r(rx)}" cy="${r(ry)}" rx="${r(18 * k)}" ry="${r(6 * k)}" fill="#c9a83a"/><ellipse cx="${r(rx)}" cy="${r(ry - 2)}" rx="${r(18 * k)}" ry="${r(6 * k)}" fill="#e8c84a"/>
    <ellipse cx="${r(rx)}" cy="${r(ry - 2)}" rx="${r(11 * k)}" ry="${r(3.4 * k)}" fill="#8a6a3a"/><circle cx="${r(rx + 13 * k)}" cy="${r(ry - 3)}" r="${r(2 * k)}" fill="#d1261f"/>`;
  // peluix verd assegut (un dinosauret genèric)
  s += figure(`<g transform="scale(1.1)"><ellipse cy="0" rx="9" ry="2.5" fill="#000" opacity="0.2"/><ellipse cy="-7" rx="7" ry="7.5" fill="#6ac46a"/><ellipse cy="-6" rx="4" ry="4.5" fill="#f2f0c8"/>
    <circle cy="-17" r="5.8" fill="#6ac46a"/><circle cx="-2.2" cy="-18" r="1" fill="#1a1a1a"/><circle cx="2.2" cy="-18" r="1" fill="#1a1a1a"/><path d="M-2 -15 q2 1.5 4 0" stroke="#1a1a1a" stroke-width="0.8" fill="none"/>
    <path d="M5 -10 L9 -12 L8 -8 M-5 -21 l1 -3 l2 2 M0 -23 l1 -3 l2 2" fill="#3a9a3a"/></g>`, 0.86, 0, 2.9);
  // rascador de torre al costat de l'armari: base, pals de sisal i plataformes de pelfa
  const base = { x0: 1.34, x1: W - 0.02, y0: 0, y1: 0.05, z0: 2.3, z1: 2.98 };
  s += box(base, { front: "#e6dcc8", side: "#d6ccb8", top: "#efe6d4" });
  for (const [x0, z0, h] of [[1.44, 2.42, 1.0], [1.62, 2.75, 0.55]]) s += box({ x0, x1: x0 + 0.09, y0: 0.05, y1: h, z0, z1: z0 + 0.09 }, { front: "url(#room-sisal)", side: "url(#room-sisal-side)" });
  for (const [y, z0, z1] of [[0.55, 2.62, 2.98], [1.0, 2.32, 2.6]]) s += box({ x0: 1.36, x1: W - 0.04, y0: y, y1: y + 0.05, z0, z1 }, { front: "#efe6d4", side: "#ddd2be", top: "#f6efe0" });
  add(s);
}

// ---------------------------------------------------------------- calaixera blanca amb la tele (paret dreta) i espills damunt
{
  let s = "";
  const b = { x0: W - 0.48, x1: W, y0: 0, y1: 0.92, z0: 1.35, z1: 2.2 };
  s += shadow(b, 0.03, 0.2);
  s += box(b, { side: "#f2f0ea", top: "#faf9f5", front: "#e6e3db" });
  const lf = face(b, "left"); // la cara que mira l'habitació: u del fons cap al davant
  for (const [v0, v1, glass] of [[0.05, 0.33, true], [0.37, 0.65], [0.69, 0.97]]) {
    s += quad(lf, 0.05, v0, 0.95, v1, glass ? `fill="#dde2e4" stroke="#cfcac0" stroke-width="1.5"` : `fill="#f6f4ef" stroke="#d8d4ca" stroke-width="1.5"`);
    s += quad(lf, 0.38, v0 + 0.06, 0.62, v0 + 0.09, `fill="#c8c4ba"`); // tirador
  }
  // tele damunt, girada cap a l'habitació
  s += box({ x0: W - 0.32, x1: W - 0.22, y0: 0.92, y1: 0.95, z0: 1.62, z1: 1.94 }, { side: "#1a1a1a", top: "#2a2a2a", front: "#141414" });
  const tv = { x0: W - 0.3, x1: W - 0.26, y0: 0.95, y1: 1.42, z0: 1.4, z1: 2.16 };
  s += box(tv, { side: "#141414", top: "#2a2a2a", front: "#101010" });
  s += quad(face(tv, "left"), 0.04, 0.06, 0.96, 0.9, `fill="url(#room-tv)"`);
  // tres espills menuts recolzats a la paret
  for (const [z0, z1, y0, y1] of [[1.5, 1.68, 1.6, 1.85], [1.72, 1.86, 1.62, 1.8], [1.9, 2.1, 1.58, 1.9]]) {
    const m = { x0: W - 0.01, x1: W, y0, y1, z0, z1 };
    s += quad(face(m, "left"), 0, 0, 1, 1, `fill="#cfd6da" stroke="#e8e6e0" stroke-width="3"`);
    s += quad(face(m, "left"), 0.2, 0.15, 0.45, 0.85, `fill="#fff" opacity="0.5"`);
  }
  add(s);
}

// ---------------------------------------------------------------- vitrina de vidre amb figuretes i records de viatges (paret dreta, davant)
{
  let s = "";
  const b = { x0: W - 0.36, x1: W, y0: 0, y1: 1.75, z0: 0.45, z1: 1.15 };
  // vitrina de vidre: es veu l'interior per la cara que mira l'habitació i pel costat de davant (també de vidre)
  s += box(b, { side: "#2a2622", top: "#3a3530" });
  const lf = face(b, "left");
  s += quad(lf, 0.04, 0.02, 0.96, 0.98, `fill="#2a3036"`);
  const sh = [0.27, 0.52, 0.77];
  for (const v of sh) s += quad(lf, 0.04, v, 0.96, v + 0.012, `fill="#9aa6ae"`);
  // records: una torre petita, una bola de neu, un plat, figuretes de colors i un got
  const it = (u0, v0, u1, v1, c) => quad(lf, u0, v0, u1, v1, `fill="${c}"`);
  s += it(0.15, 0.12, 0.2, 0.27, "#b8a070") + it(0.13, 0.22, 0.22, 0.27, "#b8a070");                              // torre
  s += it(0.36, 0.18, 0.5, 0.27, "#cfe6f5") + it(0.38, 0.25, 0.48, 0.27, "#6a4a2a");                            // bola de neu
  s += it(0.62, 0.1, 0.86, 0.26, "#e8e2d0") + it(0.66, 0.14, 0.82, 0.22, "#4a7fc8");                             // plat
  s += it(0.12, 0.38, 0.22, 0.52, "#d1261f") + it(0.3, 0.4, 0.4, 0.52, "#2f9e55") + it(0.5, 0.36, 0.62, 0.52, "#7b3fe4") + it(0.72, 0.42, 0.82, 0.52, "#f2c200");
  s += it(0.14, 0.63, 0.3, 0.77, "#3a4a8e") + it(0.42, 0.66, 0.54, 0.77, "#e46a2e") + it(0.66, 0.6, 0.86, 0.77, "#9a6a3a");
  s += it(0.2, 0.86, 0.5, 0.96, "#5a5a6a") + it(0.6, 0.85, 0.8, 0.96, "#c9a678");
  // reflex del vidre
  s += quad(lf, 0.1, 0.02, 0.3, 0.98, `fill="#fff" opacity="0.08"`) + quad(lf, 0.34, 0.02, 0.4, 0.98, `fill="#fff" opacity="0.06"`);
  // costat de davant, de vidre amb marc fosc
  const ff = face(b, "front");
  s += quad(ff, 0, 0, 1, 1, `fill="#cfe0e8" opacity="0.18" stroke="#2a2622" stroke-width="4"`);
  for (const v of sh) s += quad(ff, 0, v, 1, v + 0.012, `fill="#9aa6ae" opacity="0.8"`);
  s += quad(ff, 0.15, 0.02, 0.3, 0.98, `fill="#fff" opacity="0.12"`);
  // figuretes damunt
  s += figure(`<path d="M-8 0 L-6 -12 L0 -18 L6 -12 L8 0 Z" fill="#6a5a8a"/><circle cy="-20" r="4" fill="#8a7aaa"/>`, W - 0.18, 1.75, 0.8);
  add(s);
}

// ---------------------------------------------------------------- llit gran amb l'edredó de cercles (paret esquerra)
{
  let s = "";
  const x0 = -W, x1 = -0.45, z0 = 0.15, z1 = 2.45;
  s += shadow({ x0, x1, z0, z1 }, 0.04, 0.25);
  s += box({ x0, x1, y0: 0, y1: 0.85, z0: z1, z1: z1 + 0.06 }, { front: "#3a2a20", side: "#2e2018", top: "#4a3628" }); // capçal
  s += box({ x0, x1, y0: 0.06, y1: 0.3, z0, z1 }, { front: "#3a2a20", side: "#2e2018" });                         // estructura
  s += box({ x0: x0 + 0.02, x1: x1 - 0.02, y0: 0.3, y1: 0.5, z0: z0 + 0.02, z1: z1 - 0.02 }, { front: "#f2f0ea", side: "#e2dfd6", top: "#f6f4ef" });
  s += box({ x0: x0 + 0.1, x1: x1 - 0.1, y0: 0.5, y1: 0.62, z0: z1 - 0.5, z1: z1 - 0.08 }, { front: "#2a3a6a", side: "#22305a", top: "#33467a" }); // coixí
  // edredó amb el patró de cercles (blau marí, verd i blau clar) que cau pel costat i pels peus
  const dB = { x0: x0 + 0.01, x1: x1 + 0.04, y0: 0.18, y1: 0.56, z0: z0 - 0.04, z1: z1 - 0.52 };
  s += box(dB, { front: "url(#room-duvet-v)", side: "url(#room-duvet-v)", top: "url(#room-duvet)" });
  s += quad(face(dB, "right"), 0, 0, 1, 0.08, `fill="#000" opacity="0.12"`);
  // comandament de consola damunt del llit
  s += figure(`<g transform="scale(1.4)"><path d="M-10 0 Q-12 -6 -6 -7 L6 -7 Q12 -6 10 0 Q8 4 4 1 L-4 1 Q-8 4 -10 0 Z" fill="#1a1a1e"/><circle cx="-5" cy="-3.5" r="1.3" fill="#3a3a40"/><circle cx="4" cy="-3" r="1.3" fill="#3a3a40"/></g>`, -0.95, 0.56, 1.2);
  add(s);
}

// ---------------------------------------------------------------- placa L, recolzada a la prestatgeria (→ DGT)
{
  const PLATE = `<g transform="scale(0.75)"><rect x="-15" y="-30" width="30" height="30" rx="2.6" fill="#fff" stroke="#c8c3b6" stroke-width="0.6"/>
      <rect x="-13" y="-28" width="26" height="26" rx="1.6" fill="#009b48"/>
      <path d="M-5.5 -23 H-0.5 V-10.5 H7 V-6 H-5.5 Z" fill="#fff"/>
      <rect x="-15" y="-2" width="30" height="2" fill="#000" opacity="0.12"/></g>`;
  const [px, py] = P(...plate);
  const s = `<ellipse cx="${r(px)}" cy="${r(py - 12)}" rx="42" ry="40" fill="url(#room-l-glow)"/>` + figure(PLATE, ...plate);
  add(s, { spot: "dgt", title: "Placa L: anar a la DGT (autoescola)", hit: [r(px - 30), r(py - 46), 60, 52] });
}

// ---------------------------------------------------------------- motxilla recolzada al llit (→ joc d'estudi)
{
  const bx = -0.32, bz = 1.15;
  const BAG = `<g transform="scale(1.15)"><ellipse cx="-4" cy="0" rx="22" ry="4" fill="#1a1a4e" opacity="0.25"/>
    <g transform="rotate(-12 0 0)">
      <path d="M-6 -44 C-6 -53 6 -53 6 -44" stroke="#7a1f1a" stroke-width="2.6" fill="none"/>
      <path d="M-17 -2 L-18 -34 C-18 -44 -10 -46 0 -46 C10 -46 18 -44 18 -34 L17 -2 Q0 2 -17 -2 Z" fill="url(#room-bag)"/>
      <path d="M-16 -33 C-12 -40 12 -40 16 -33" stroke="#f2c200" stroke-width="1.4" fill="none"/>
      <path d="M-12 -4 L-12 -18 Q0 -22 12 -18 L12 -4 Q0 -1 -12 -4 Z" fill="#b8312a"/>
      <path d="M-11 -17 Q0 -20.5 11 -17" stroke="#f2c200" stroke-width="1.2" fill="none"/>
      <rect x="-1.5" y="-21" width="3" height="5" rx="1" fill="#e6e6e6"/>
      <rect x="-15" y="-31" width="3" height="27" rx="1.5" fill="#8f2620"/><rect x="12" y="-31" width="3" height="27" rx="1.5" fill="#8f2620"/>
      <circle cx="8" cy="-28" r="3.2" fill="#3fdc8a"/><circle cx="8" cy="-28" r="1.4" fill="#fff"/>
    </g></g>`;
  add(figure(BAG, bx, 0, bz), { spot: "study", title: "Motxilla: anar a estudiar (tower defense)", hit: bbox([[bx - 0.3, 0, bz], [bx + 0.3, 0.62, bz]]) });
}

// ---------------------------------------------------------------- definicions
// patró de l'edredó: cercles que es solapen en files (blau marí, verd i blau clar)
const circles = (size, cols) => { let t = ""; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) t += `<circle cx="${(j + (i % 2) * 0.5) * size / 2}" cy="${i * size / 4}" r="${size / 5}" fill="${cols[(i * 3 + j) % cols.length]}"/>`; return t; };
const DUV = ["#1e2f5a", "#2f8a5a", "#9fb8d8", "#1e2f5a", "#3a5a9a", "#9fb8d8", "#2f8a5a", "#1e2f5a"];
const defs = `${cam.defs}
  <linearGradient id="room-wall-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9ebec"/><stop offset="1" stop-color="#dfe2e4"/></linearGradient>
  <linearGradient id="room-wall-l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c8cbcd"/><stop offset="1" stop-color="#dcdfe1"/></linearGradient>
  <linearGradient id="room-wall-r" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#cfd2d4"/><stop offset="1" stop-color="#e2e5e7"/></linearGradient>
  <linearGradient id="room-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdb898"/><stop offset="1" stop-color="#d9c6a6"/></linearGradient>
  <linearGradient id="room-trees" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8d89a"/><stop offset="0.5" stop-color="#8ab86a"/><stop offset="1" stop-color="#6a9a4a"/></linearGradient>
  <linearGradient id="room-wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d6a868"/><stop offset="1" stop-color="#e0b47a"/></linearGradient>
  <linearGradient id="room-screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6efe0"/><stop offset="1" stop-color="#e6dcc8"/></linearGradient>
  <linearGradient id="room-tv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a1e24"/><stop offset="0.55" stop-color="#0c0e12"/><stop offset="1" stop-color="#22262e"/></linearGradient>
  <linearGradient id="room-rgb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5ab0"/><stop offset="0.5" stop-color="#b48cff"/><stop offset="1" stop-color="#4aa8ff"/></linearGradient>
  <pattern id="room-keys" width="6" height="5" patternUnits="userSpaceOnUse"><rect width="6" height="5" fill="#3a3f48"/><rect x="0.8" y="0.8" width="4.2" height="3" rx="0.6" fill="#5a636a"/></pattern>
  <pattern id="room-mesh" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#2a2d32"/><path d="M0 2 H4 M2 0 V4" stroke="#3a3e44" stroke-width="0.8"/></pattern>
  <pattern id="room-duvet" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="#dfe8f2"/>${circles(40, DUV)}</pattern>
  <pattern id="room-duvet-v" width="30" height="15" patternUnits="userSpaceOnUse"><rect width="30" height="15" fill="#c8d4e2"/>${circles(30, DUV)}</pattern>
  <radialGradient id="room-ring-glow"><stop offset="0" stop-color="#ffffff" stop-opacity="0.75"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
  <radialGradient id="room-l-glow"><stop offset="0" stop-color="#3fdc8a" stop-opacity="0.35"/><stop offset="1" stop-color="#3fdc8a" stop-opacity="0"/></radialGradient>
  <linearGradient id="room-bag" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c23a31"/><stop offset="0.6" stop-color="#e0514a"/><stop offset="1" stop-color="#b8312a"/></linearGradient>
  <pattern id="room-sisal" width="8" height="4" patternUnits="userSpaceOnUse"><rect width="8" height="4" fill="#d8c08f"/><rect y="2.6" width="8" height="1.4" fill="#b89c68"/></pattern>
  <pattern id="room-sisal-side" width="8" height="4" patternUnits="userSpaceOnUse"><rect width="8" height="4" fill="#c4ac7c"/><rect y="2.6" width="8" height="1.4" fill="#a68a58"/></pattern>
  <radialGradient id="room-vignette" gradientUnits="userSpaceOnUse" cx="800" cy="450" r="1150"><stop offset="0.5" stop-color="#1a1a2e" stop-opacity="0"/><stop offset="0.8" stop-color="#1a1a2e" stop-opacity="0.3"/></radialGradient>`;
add(`<rect x="-1600" y="-900" width="4800" height="2700" fill="url(#room-vignette)" pointer-events="none"/>`); // també fora del viewBox: sense bandes

// ---------------------------------------------------------------- eixida
const out = `// GENERAT per tools/habitacio.js (no l'edites a mà: canvia l'escena allà i torna a executar-lo)
// Capes de l'habitació en ordre de pintat (del fons cap al davant). Les capes amb \`spot\` són punts interactius (js/room.js).
const ROOM_ART = ${JSON.stringify({ defs, layers }, null, 0)};
`;
fs.writeFileSync(path.join(__dirname, "..", "js", "data", "room-art.js"), out);
const pi = process.argv.indexOf("--preview");
if (pi > 0) fs.writeFileSync(process.argv[pi + 1], `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs>${defs}</defs>${layers.map(l => l.svg).join("")}</svg>`);
console.log(`js/data/room-art.js: ${layers.length} capes, ${(out.length / 1024).toFixed(0)} KB`);
