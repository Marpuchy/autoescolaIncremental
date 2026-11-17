#!/usr/bin/env node
// ===== HABITACIÓ (generador) =====
// L'habitació és la pantalla d'inici: des d'ací es va a cada joc d'estudi. Es descriu en metres i es projecta amb
// tools/perspectiva.js. Escriu js/data/room-art.js, que pinta js/room.js. Ús: node tools/habitacio.js [--preview fitxer.svg]
// Habitació: 4,8 m d'ample (x de -2.4 a 2.4), 2,7 m d'alt i 3,6 m de fons (paret del fons a z = 3.6). Càmera a 1,55 m.
// Punts interactius: la placa L penjada a la paret (→ DGT) i la motxilla recolzada a l'escriptori (→ joc d'estudi).
const fs = require("fs"), path = require("path");
const { camera, r } = require("./perspectiva");

const cam = camera({ cx: 800, cy: 380, eye: 1.55, d: 2.5, f: 900 });
const { P, poly, box, face, quad, shadow, figure, line, bbox, corners } = cam;
const W = 2.4, H = 2.7, BACK = 3.6;
const layers = [];
const add = (svg, spot) => layers.push({ svg, ...(spot || {}) });

function wallRect(x0, y0, x1, y1, attrs) {
  const [a, b] = P(x0, y1, BACK), [c, d] = P(x1, y0, BACK);
  return `<rect x="${r(a)}" y="${r(b)}" width="${r(c - a)}" height="${r(d - b)}" ${attrs}/>`;
}

// ---------------------------------------------------------------- parets, sostre i terra
{
  let s = "";
  s += poly([[-W, H, 0], [W, H, 0], [W, H, BACK], [-W, H, BACK]], `fill="#f1ede4"`);
  s += poly([[-W, 0, 0], [-W, 0, BACK], [-W, H, BACK], [-W, H, 0]], `fill="url(#room-wall-l)"`);
  s += poly([[W, 0, 0], [W, 0, BACK], [W, H, BACK], [W, H, 0]], `fill="url(#room-wall-r)"`);
  s += wallRect(-W, 0, W, H, `fill="url(#room-wall-b)"`);
  // terra de parquet: taules al llarg del fons, juntes cada 18 cm
  s += poly([[-W, 0, 0], [W, 0, 0], [W, 0, BACK], [-W, 0, BACK]], `fill="url(#room-floor)"`);
  let joints = "";
  for (let x = -W + 0.18; x < W; x += 0.18) joints += line([x, 0, 0], [x, 0, BACK], "");
  // juntes transversals al tresbolillo
  for (let i = 0, x = -W; x < W - 0.01; x += 0.18, i++) {
    for (let z = (i % 3) * 0.45 + 0.2; z < BACK; z += 1.35) joints += line([x, 0, z], [x + 0.18, 0, z], "");
  }
  s += `<g stroke="#9c6f45" stroke-width="1.3" opacity="0.55">${joints}</g>`;
  // sòcol blanc
  s += wallRect(-W, 0, W, 0.07, `fill="#f6f3ec"`);
  s += poly([[-W, 0, 0], [-W, 0, BACK], [-W, 0.07, BACK], [-W, 0.07, 0]], `fill="#e7e2d7"`);
  s += poly([[W, 0, 0], [W, 0, BACK], [W, 0.07, BACK], [W, 0.07, 0]], `fill="#e2ddd1"`);
  // llum del sostre (plafó rodó) i la seua claror
  const [lx, ly] = P(0, H, 1.9);
  s += `<ellipse cx="${r(lx)}" cy="${r(ly + 120)}" rx="520" ry="300" fill="url(#room-lamp)"/>`;
  s += `<ellipse cx="${r(lx)}" cy="${r(ly + 8)}" rx="${r(cam.scale(1.9) * 0.24)}" ry="${r(cam.scale(1.9) * 0.05)}" fill="#fffdf0" stroke="#e2dccb" stroke-width="2"/>`;
  add(s);
}

// ---------------------------------------------------------------- paret del fons: finestra amb cortines
{
  let s = "";
  const wx0 = -1.35, wx1 = -0.2, wy0 = 1.0, wy1 = 2.15;
  s += wallRect(wx0 - 0.06, wy0 - 0.06, wx1 + 0.06, wy1 + 0.06, `fill="#fbfaf6"`);
  s += wallRect(wx0, wy0, wx1, wy1, `fill="url(#room-sky)"`);
  // teulats i núvols llunyans per la finestra
  const [ax, ay] = P(wx0, wy0 + 0.32, BACK), [bx] = P(wx1, wy0, BACK), [, by] = P(0, wy0, BACK);
  const sw = bx - ax;
  s += `<path d="M${r(ax)} ${r(by)} V${r(ay + 6)} h${r(sw * 0.18)} v-14 h${r(sw * 0.16)} v22 h${r(sw * 0.2)} v-30 l${r(sw * 0.06)} -10 l${r(sw * 0.06)} 10 v18 h${r(sw * 0.34)} V${r(by)} Z" fill="#9db7c9"/>`;
  s += `<g fill="#fff" opacity="0.85"><ellipse cx="${r(ax + sw * 0.3)}" cy="${r(ay - 70)}" rx="22" ry="8"/><ellipse cx="${r(ax + sw * 0.4)}" cy="${r(ay - 74)}" rx="16" ry="9"/><ellipse cx="${r(ax + sw * 0.78)}" cy="${r(ay - 48)}" rx="18" ry="6"/></g>`;
  // marcs de la finestra (creu)
  s += wallRect((wx0 + wx1) / 2 - 0.025, wy0, (wx0 + wx1) / 2 + 0.025, wy1, `fill="#fbfaf6"`);
  s += wallRect(wx0, (wy0 + wy1) / 2 + 0.12, wx1, (wy0 + wy1) / 2 + 0.165, `fill="#fbfaf6"`);
  s += poly([[wx0 + 0.1, wy1, BACK], [wx0 + 0.32, wy1, BACK], [wx0 + 0.12, wy0, BACK], [wx0 - 0.0, wy0, BACK]], `fill="#fff" opacity="0.18"`);
  // ampit
  s += wallRect(wx0 - 0.12, wy0 - 0.1, wx1 + 0.12, wy0 - 0.04, `fill="#eeeae0"`);
  // barra i cortines (plecs amb degradat)
  s += wallRect(wx0 - 0.3, wy1 + 0.16, wx1 + 0.3, wy1 + 0.19, `fill="#7a5a3a"`);
  s += wallRect(wx0 - 0.3, wy0 - 0.25, wx0 + 0.05, wy1 + 0.16, `fill="url(#room-curtain)"`);
  s += wallRect(wx1 - 0.05, wy0 - 0.25, wx1 + 0.3, wy1 + 0.16, `fill="url(#room-curtain)"`);
  add(s);
}

// ---------------------------------------------------------------- prestatge amb llibres (damunt de l'escriptori, a la dreta)
{
  let s = "";
  const sB = { x0: 1.2, x1: 1.85, y0: 1.62, y1: 1.65, z0: 3.4, z1: BACK };
  s += box(sB, { front: "#8a6440", side: "#7a5636", bottom: "#6e4d30", top: "#a37a52" });
  const books = [["#d1261f", 0.045, 0.24], ["#1f6fb2", 0.05, 0.27], ["#f2c200", 0.04, 0.22], ["#2f9e55", 0.055, 0.26], ["#7b3fe4", 0.045, 0.23], ["#e46a2e", 0.05, 0.25]];
  let x = 1.24;
  for (const [c, w, h] of books) {
    s += box({ x0: x, x1: x + w, y0: 1.65, y1: 1.65 + h, z0: 3.42, z1: 3.58 }, { front: c, side: c, top: "#f3eee2" });
    s += quad(face({ x0: x, x1: x + w, y0: 1.65, y1: 1.65 + h, z0: 3.42, z1: 3.58 }, "front"), 0.2, 0.15, 0.8, 0.2, `fill="#fff" opacity="0.6"`);
    x += w + 0.008;
  }
  // un llibre caigut recolzat
  s += poly([[x + 0.02, 1.65, 3.42], [x + 0.1, 1.65, 3.42], [x + 0.2, 1.86, 3.42], [x + 0.13, 1.88, 3.42]], `fill="#3aa0c8"`);
  add(s);
}

// ---------------------------------------------------------------- placa L penjada d'un clau (→ DGT)
{
  const lx = 0.88, ly = 1.66; // centre de la placa
  const [nx, ny] = P(lx, ly + 0.36, BACK);
  // dibuix pla en cm: placa quadrada verda amb vora blanca i la L blanca; penja d'un cordó en triangle, una mica torta
  const PLATE = `<g transform="translate(0 -38) scale(1.35) translate(0 38)"><g transform="rotate(5 0 -20)">
      <path d="M0 -38 L-13 -16 M0 -38 L13 -16" stroke="#3b2a1a" stroke-width="1" fill="none"/>
      <rect x="-15" y="-17" width="30" height="30" rx="2.6" fill="#fff" stroke="#c8c3b6" stroke-width="0.6"/>
      <rect x="-13" y="-15" width="26" height="26" rx="1.6" fill="#009b48"/>
      <path d="M-5.5 -10 H-0.5 V2.5 H7 V7 H-5.5 Z" fill="#fff"/>
      <rect x="-15" y="11" width="30" height="2" fill="#000" opacity="0.12"/>
    </g>
    </g><circle cx="0" cy="-38" r="1.8" fill="#6b6b6b"/>`;
  const s = figure(PLATE, lx, ly + 0.36 - 0.38, BACK)
    + `<ellipse cx="${r(nx)}" cy="${r(ny + 20)}" rx="60" ry="64" fill="url(#room-l-glow)"/>`;
  add(s, { spot: "dgt", title: "Placa L: anar a la DGT (autoescola)",
    hit: bbox([[lx - 0.3, ly - 0.36, BACK], [lx + 0.3, ly + 0.42, BACK]]) });
}


// ---------------------------------------------------------------- suro amb apunts i calendari (paret esquerra, damunt del llit)
{
  let s = "";
  const cB = { x0: -W - 0.01, x1: -W, y0: 1.15, y1: 1.85, z0: 1.75, z1: 2.95 };
  const cf = face(cB, "right"); // u: del davant cap al fons · v: de dalt a baix
  s += quad(cf, -0.03, -0.05, 1.03, 1.05, `fill="#8a6440"`);
  s += quad(cf, 0, 0, 1, 1, `fill="#c9955a"`);
  const notes = [[0.06, 0.1, 0.3, 0.42, "#fff27a"], [0.36, 0.08, 0.6, 0.4, "#ff9ec4"], [0.66, 0.12, 0.94, 0.5, "#fff"], [0.1, 0.55, 0.36, 0.9, "#9fe0ff"], [0.44, 0.52, 0.64, 0.88, "#b6f0a0"]];
  for (const [u0, v0, u1, v1, c] of notes) {
    s += quad(cf, u0, v0, u1, v1, `fill="${c}"`);
    for (let k = 1; k <= 3; k++) { const v = v0 + (v1 - v0) * (0.2 + k * 0.18); s += quad(cf, u0 + 0.04, v, u1 - 0.05, v + 0.015, `fill="#6b6b6b" opacity="0.45"`); }
    const [px, py] = P(...cf((u0 + u1) / 2, v0 + 0.03)); s += `<circle cx="${r(px)}" cy="${r(py)}" r="3" fill="#d1261f"/>`;
  }
  // calendari amb un dia marcat
  s += quad(cf, 0.7, 0.58, 0.94, 0.94, `fill="#fff"`) + quad(cf, 0.7, 0.58, 0.94, 0.66, `fill="#d1261f"`);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) s += quad(cf, 0.72 + j * 0.055, 0.69 + i * 0.08, 0.76 + j * 0.055, 0.74 + i * 0.08, i === 1 && j === 2 ? `fill="#d1261f"` : `fill="#c3c8cd"`);
  add(s);
}

// ---------------------------------------------------------------- llit (contra la paret esquerra, capçal al fons)
{
  let s = "";
  const x0 = -W, x1 = -1.42, z0 = 1.35, z1 = BACK;
  s += shadow({ x0, x1, z0, z1 }, 0.05, 0.25);
  // capçal de fusta
  s += box({ x0, x1, y0: 0, y1: 0.95, z0: z1 - 0.05, z1 }, { front: "#a37a52", side: "#8a6440", top: "#b58b60" });
  // estructura i matalàs
  s += box({ x0, x1, y0: 0.1, y1: 0.32, z0, z1: z1 - 0.05 }, { front: "#946c46", side: "#7f5a38", top: "#946c46" });
  s += box({ x0: x0 + 0.02, x1: x1 - 0.02, y0: 0.32, y1: 0.5, z0: z0 + 0.03, z1: z1 - 0.06 }, { front: "#f4f1ea", side: "#e4dfd4", top: "#f4f1ea" });
  // potes
  s += box({ x0: x1 - 0.06, x1, y0: 0, y1: 0.1, z0, z1: z0 + 0.06 }, { front: "#6e4d30", side: "#5e4128" });
  // coixí
  s += box({ x0: x0 + 0.12, x1: x1 - 0.12, y0: 0.5, y1: 0.62, z0: z1 - 0.48, z1: z1 - 0.12 }, { front: "#ffffff", side: "#e9e6df", top: "#fbfaf7" });
  // edredó blau que cau pel costat i pels peus
  const dB = { x0: x0 + 0.01, x1: x1 + 0.03, y0: 0.26, y1: 0.54, z0: z0 - 0.03, z1: z1 - 0.55 };
  s += box(dB, { front: "#3d6fb6", side: "#335f9e", top: "url(#room-duvet)" });
  // plec de l'edredó girat damunt
  s += box({ x0: dB.x0, x1: dB.x1, y0: 0.54, y1: 0.57, z0: dB.z1 - 0.22, z1: dB.z1 }, { front: "#f2f0ea", side: "#dad6cc", top: "#f7f5f0" });
  // ratlles de l'edredó al lateral
  for (const v of [0.35, 0.7]) s += quad(face(dB, "right"), 0, v, 1, v + 0.06, `fill="#5a8ad0" opacity="0.7"`);
  add(s);
}

// ---------------------------------------------------------------- escriptori (contra la paret del fons, a la dreta)
const desk = { x0: 0.1, x1: 1.75, z0: 2.95, z1: BACK - 0.02, top: 0.76 };
{
  let s = "";
  s += shadow({ x0: desk.x0, x1: desk.x1, z0: desk.z0, z1: desk.z1 }, 0.04, 0.22);
  // panell del fons (modèstia) i els dos laterals
  s += box({ x0: desk.x0 + 0.03, x1: desk.x1 - 0.03, y0: 0.3, y1: desk.top - 0.03, z0: desk.z1 - 0.06, z1: desk.z1 - 0.04 }, { front: "#d9c6a5" });
  for (const [a, b] of [[desk.x0, desk.x0 + 0.04], [desk.x1 - 0.04, desk.x1]])
    s += box({ x0: a, x1: b, y0: 0, y1: desk.top - 0.03, z0: desk.z0, z1: desk.z1 }, { front: "#e8dcc4", side: "#d9c6a5" });
  // torre del PC davall, a la dreta, amb llum de colors
  const tB = { x0: 1.36, x1: 1.6, y0: 0, y1: 0.46, z0: 3.0, z1: 3.48 };
  s += box(tB, { front: "#23272e", side: "#1a1d22", top: "#2e333b" });
  s += quad(face(tB, "front"), 0.12, 0.08, 0.88, 0.14, `fill="#3a3f48"`);
  s += quad(face(tB, "front"), 0.78, 0.25, 0.86, 0.9, `fill="url(#room-rgb)"`);
  s += quad(face(tB, "front"), 0.18, 0.25, 0.3, 0.3, `fill="#3fdc8a"`);
  // tauler
  s += box({ x0: desk.x0 - 0.02, x1: desk.x1 + 0.02, y0: desk.top - 0.03, y1: desk.top, z0: desk.z0 - 0.02, z1: desk.z1 }, { front: "#c9a678", side: "#b8956a", top: "url(#room-wood)" });
  // monitor: peu, pantalla i el que s'hi veu (apunts i un gràfic)
  s += box({ x0: 0.78, x1: 0.98, y0: desk.top, y1: desk.top + 0.015, z0: 3.3, z1: 3.44 }, { front: "#2b2f35", top: "#3a3f48" });
  s += box({ x0: 0.855, x1: 0.905, y0: desk.top, y1: desk.top + 0.2, z0: 3.4, z1: 3.43 }, { front: "#2b2f35", side: "#23272e" });
  const mB = { x0: 0.52, x1: 1.24, y0: desk.top + 0.12, y1: desk.top + 0.52, z0: 3.36, z1: 3.4 };
  s += box(mB, { front: "#16181c", side: "#101216", top: "#22252b" });
  const mf = face(mB, "front");
  s += quad(mf, 0.03, 0.05, 0.97, 0.9, `fill="url(#room-screen)"`);
  s += quad(mf, 0.07, 0.12, 0.45, 0.17, `fill="#ffd23f"`);
  for (const v of [0.26, 0.36, 0.46, 0.56, 0.66]) s += quad(mf, 0.07, v, 0.07 + 0.2 + ((v * 37) % 0.18), v + 0.04, `fill="#cfe6f5" opacity="0.8"`);
  for (const [u, h] of [[0.6, 0.25], [0.68, 0.4], [0.76, 0.32], [0.84, 0.55]]) s += quad(mf, u, 0.8 - h, u + 0.05, 0.8, `fill="#3fdc8a"`);
  // teclat i ratolí
  s += box({ x0: 0.6, x1: 1.1, y0: desk.top, y1: desk.top + 0.02, z0: 3.05, z1: 3.2 }, { front: "#2b2f35", side: "#23272e", top: "url(#room-keys)" });
  s += box({ x0: 1.2, x1: 1.26, y0: desk.top, y1: desk.top + 0.025, z0: 3.08, z1: 3.17 }, { front: "#2b2f35", side: "#23272e", top: "#3a3f48" });
  // tassa i llibreta amb boli
  s += box({ x0: 0.24, x1: 0.31, y0: desk.top, y1: desk.top + 0.1, z0: 3.3, z1: 3.37 }, { front: "#e0514a", side: "#c4413b", top: "#5a3a26" });
  s += box({ x0: 0.22, x1: 0.46, y0: desk.top, y1: desk.top + 0.012, z0: 3.02, z1: 3.2 }, { front: "#f2f0ea", side: "#dad6cc", top: "#fffdf6" });
  s += line([0.26, desk.top + 0.013, 3.12], [0.42, desk.top + 0.013, 3.06], `stroke="#1f6fb2" stroke-width="3" stroke-linecap="round"`);
  // làmpada d'escriptori
  s += box({ x0: 1.48, x1: 1.6, y0: desk.top, y1: desk.top + 0.015, z0: 3.38, z1: 3.5 }, { front: "#2b2f35", top: "#3a3f48" });
  s += line([1.54, desk.top + 0.015, 3.44], [1.5, desk.top + 0.36, 3.44], `stroke="#2b2f35" stroke-width="4"`);
  s += line([1.5, desk.top + 0.36, 3.44], [1.38, desk.top + 0.3, 3.36], `stroke="#2b2f35" stroke-width="4"`);
  const [hx, hy] = P(1.38, desk.top + 0.3, 3.36);
  s += `<path d="M${r(hx - 16)} ${r(hy + 2)} L${r(hx + 6)} ${r(hy - 12)} L${r(hx + 14)} ${r(hy + 4)} Z" fill="#f2c200"/>`;
  s += `<ellipse cx="${r(hx - 4)}" cy="${r(hy + 40)}" rx="46" ry="26" fill="url(#room-desk-glow)"/>`;
  add(s);
}

// ---------------------------------------------------------------- motxilla recolzada i inclinada contra l'escriptori (→ joc d'estudi)
{
  const bx = -0.08, bz = 3.0;
  // dibuix pla en cm (origen als peus): motxilla de davant, inclinada cap a l'escriptori
  const BAG = `<g transform="scale(1.2)"><ellipse cx="4" cy="0" rx="22" ry="4" fill="#1a1a4e" opacity="0.25"/>
    <g transform="rotate(12 0 0)">
      <path d="M-6 -44 C-6 -53 6 -53 6 -44" stroke="#7a1f1a" stroke-width="2.6" fill="none"/>
      <path d="M-17 -2 L-18 -34 C-18 -44 -10 -46 0 -46 C10 -46 18 -44 18 -34 L17 -2 Q0 2 -17 -2 Z" fill="url(#room-bag)"/>
      <path d="M-16 -33 C-12 -40 12 -40 16 -33" stroke="#f2c200" stroke-width="1.4" fill="none"/>
      <path d="M-12 -4 L-12 -18 Q0 -22 12 -18 L12 -4 Q0 -1 -12 -4 Z" fill="#b8312a"/>
      <path d="M-11 -17 Q0 -20.5 11 -17" stroke="#f2c200" stroke-width="1.2" fill="none"/>
      <rect x="-1.5" y="-21" width="3" height="5" rx="1" fill="#e6e6e6"/>
      <rect x="-15" y="-31" width="3" height="27" rx="1.5" fill="#8f2620"/><rect x="12" y="-31" width="3" height="27" rx="1.5" fill="#8f2620"/>
      <circle cx="8" cy="-28" r="3.2" fill="#3fdc8a"/><circle cx="8" cy="-28" r="1.4" fill="#fff"/>
      <path d="M-18 -30 Q-17 -24 -18 -18" stroke="#fff" stroke-width="1" opacity="0.25" fill="none"/>
    </g></g>`;
  add(figure(BAG, bx, 0, bz), { spot: "study", title: "Motxilla: anar a estudiar (tower defense)",
    hit: bbox([[bx - 0.3, 0, bz], [bx + 0.32, 0.64, bz]]) });
}

// ---------------------------------------------------------------- cadira de l'escriptori (de darrere)
{
  let s = "";
  const cx0 = 1.12, cx1 = 1.6, cz = 2.5;
  s += shadow({ x0: cx0, x1: cx1, z0: cz - 0.1, z1: cz + 0.35 }, 0.02, 0.22);
  // base en estrela i pistó
  const [px, py] = P((cx0 + cx1) / 2, 0.06, cz + 0.12);
  s += `<g stroke="#2b2f35" stroke-width="7" stroke-linecap="round"><line x1="${r(px - 46)}" y1="${r(py + 8)}" x2="${r(px + 46)}" y2="${r(py + 8)}"/><line x1="${r(px - 20)}" y1="${r(py - 4)}" x2="${r(px + 20)}" y2="${r(py + 18)}"/></g>`;
  s += box({ x0: 1.335, x1: 1.385, y0: 0.06, y1: 0.42, z0: cz + 0.1, z1: cz + 0.14 }, { front: "#5a636a", side: "#4a525a" });
  s += box({ x0: cx0, x1: cx1, y0: 0.42, y1: 0.48, z0: cz - 0.06, z1: cz + 0.36 }, { front: "#2f3640", side: "#262c34", top: "#3a4250" });
  s += box({ x0: cx0 + 0.02, x1: cx1 - 0.02, y0: 0.55, y1: 0.98, z0: cz - 0.1, z1: cz - 0.05 }, { front: "#2f3640", side: "#262c34", top: "#3a4250" });
  s += quad(face({ x0: cx0 + 0.02, x1: cx1 - 0.02, y0: 0.55, y1: 0.98, z0: cz - 0.1, z1: cz - 0.05 }, "front"), 0.12, 0.1, 0.88, 0.85, `fill="#3a4250"`);
  s += box({ x0: 1.32, x1: 1.4, y0: 0.48, y1: 0.55, z0: cz - 0.08, z1: cz - 0.04 }, { front: "#5a636a" });
  add(s);
}

// ---------------------------------------------------------------- rascador per a gats (contra la paret dreta)
{
  let s = "";
  const base = { x0: 1.72, x1: 2.32, y0: 0, y1: 0.06, z0: 1.5, z1: 2.05 };
  s += shadow(base, 0.05, 0.25);
  s += box(base, { front: "#c9b48e", side: "#b8a27c", top: "url(#room-carpet)" });
  const post = (x0, x1, z0, z1, y0, y1) => {
    const b = { x0, x1, y0, y1, z0, z1 };
    let o = box(b, { front: "url(#room-sisal)", side: "url(#room-sisal-side)" });
    return o;
  };
  s += post(1.86, 1.96, 1.7, 1.8, 0.06, 0.62);
  s += post(2.12, 2.2, 1.85, 1.93, 0.06, 1.1);
  const p1 = { x0: 1.76, x1: 2.3, y0: 0.62, y1: 0.68, z0: 1.58, z1: 2.0 };
  s += box(p1, { front: "#c9b48e", side: "#b8a27c", top: "url(#room-carpet)" });
  // caseta al pis de dalt amb forat rodó
  const hB = { x0: 2.0, x1: 2.32, y0: 1.1, y1: 1.38, z0: 1.7, z1: 2.02 };
  s += box({ ...hB, y0: 1.06, y1: 1.1 }, { front: "#c9b48e", side: "#b8a27c", top: "#c9b48e" });
  s += box(hB, { front: "#d8c49c", side: "#c4ae86", top: "url(#room-carpet)" });
  const [hx, hy] = P(2.16, 1.22, 1.7);
  s += `<ellipse cx="${r(hx)}" cy="${r(hy)}" rx="${r(cam.scale(1.7) * 0.08)}" ry="${r(cam.scale(1.7) * 0.075)}" fill="#5a4630"/>`;
  // joguet penjant d'una corda (pompó)
  const [tx, ty] = P(1.8, 0.62, 1.6);
  s += `<line x1="${r(tx)}" y1="${r(ty)}" x2="${r(tx - 2)}" y2="${r(ty + 46)}" stroke="#7a5a3a" stroke-width="1.5"/><circle cx="${r(tx - 2)}" cy="${r(ty + 52)}" r="7" fill="#ff5ab0"/>`;
  add(s);
}

// ---------------------------------------------------------------- menjadora i abeuradora damunt d'una catifeta
{
  let s = "";
  const mat = { x0: 1.0, x1: 1.6, z0: 0.95, z1: 1.3 };
  s += poly([[mat.x0, 0.003, mat.z0], [mat.x1, 0.003, mat.z0], [mat.x1, 0.003, mat.z1], [mat.x0, 0.003, mat.z1]], `fill="#7fd49c"`);
  // petjada de gat a la catifeta
  const [fx, fy] = P(1.08, 0.004, 1.02);
  s += `<g fill="#5bb37b" transform="translate(${r(fx)} ${r(fy)}) scale(1 0.45)"><circle r="7"/><circle cx="-8" cy="-9" r="3"/><circle cx="-3" cy="-12" r="3"/><circle cx="3" cy="-12" r="3"/><circle cx="8" cy="-9" r="3"/></g>`;
  const BOWL = (inside) => `<ellipse cx="0" cy="-1" rx="17" ry="4" fill="#1a1a4e" opacity="0.25"/>
    <path d="M-15 -12 L-12 -1 Q0 2 12 -1 L15 -12 Z" fill="#e6e6e6"/><path d="M-15 -12 L-12 -1 Q0 2 12 -1 L15 -12 Z" fill="none" stroke="#c3c8cd" stroke-width="1"/>
    <ellipse cx="0" cy="-12" rx="15" ry="4.5" fill="#c3c8cd"/><ellipse cx="0" cy="-11.5" rx="12" ry="3.4" fill="${inside}"/>`;
  s += figure(BOWL("#8a5a2b") + `<g fill="#6b4220"><circle cx="-5" cy="-13" r="1.6"/><circle cx="0" cy="-14" r="1.6"/><circle cx="4" cy="-12.5" r="1.6"/><circle cx="-1" cy="-11" r="1.6"/><circle cx="6" cy="-14" r="1.4"/></g>`, 1.17, 0, 1.12);
  s += figure(BOWL("#4aa8ff") + `<ellipse cx="-3" cy="-12.5" rx="4" ry="1" fill="#fff" opacity="0.6"/>`, 1.43, 0, 1.12);
  add(s);
}

// ---------------------------------------------------------------- catifa rodona al mig
{
  const pts = [];
  for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; pts.push([-0.55 + Math.cos(a) * 0.7, 0.002, 1.75 + Math.sin(a) * 0.5]); }
  const ring = k => poly(pts.map(([x, y, z]) => [-0.55 + (x + 0.55) * k, y, 1.75 + (z - 1.75) * k]), k === 1 ? `fill="#e8a33d"` : `fill="#f2c26a"`);
  // la posem ABANS de la cadira i el llit en pintat? Està a terra i per davant de tot: no tapa res perquè va a y = 0.
  layers.splice(1, 0, { svg: ring(1) + ring(0.7) + ring(0.4).replace("#f2c26a", "#e8a33d") });
}

// ---------------------------------------------------------------- definicions
const defs = `${cam.defs}
  <linearGradient id="room-wall-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe0ea"/><stop offset="1" stop-color="#bcd1de"/></linearGradient>
  <linearGradient id="room-wall-l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a9c2d2"/><stop offset="1" stop-color="#bdd2df"/></linearGradient>
  <linearGradient id="room-wall-r" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#a3bccc"/><stop offset="1" stop-color="#b8cdda"/></linearGradient>
  <linearGradient id="room-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b98a5a"/><stop offset="1" stop-color="#cf9f6c"/></linearGradient>
  <radialGradient id="room-lamp"><stop offset="0" stop-color="#fffbe6" stop-opacity="0.35"/><stop offset="1" stop-color="#fffbe6" stop-opacity="0"/></radialGradient>
  <linearGradient id="room-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb36b"/><stop offset="0.55" stop-color="#ffd8a0"/><stop offset="1" stop-color="#cfe6f5"/></linearGradient>
  <linearGradient id="room-curtain" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8a33d"/><stop offset="0.25" stop-color="#f2c26a"/><stop offset="0.5" stop-color="#e8a33d"/><stop offset="0.75" stop-color="#f2c26a"/><stop offset="1" stop-color="#d9922f"/></linearGradient>
  <linearGradient id="room-duvet" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a7fc8"/><stop offset="1" stop-color="#5a8ad0"/></linearGradient>
  <linearGradient id="room-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9b88a"/><stop offset="1" stop-color="#e6c99c"/></linearGradient>
  <linearGradient id="room-screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f5f9e"/><stop offset="1" stop-color="#173a6e"/></linearGradient>
  <linearGradient id="room-rgb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5ab0"/><stop offset="0.5" stop-color="#b48cff"/><stop offset="1" stop-color="#4aa8ff"/></linearGradient>
  <pattern id="room-keys" width="6" height="5" patternUnits="userSpaceOnUse"><rect width="6" height="5" fill="#3a3f48"/><rect x="0.8" y="0.8" width="4.2" height="3" rx="0.6" fill="#5a636a"/></pattern>
  <radialGradient id="room-desk-glow"><stop offset="0" stop-color="#ffe27a" stop-opacity="0.45"/><stop offset="1" stop-color="#ffe27a" stop-opacity="0"/></radialGradient>
  <radialGradient id="room-l-glow"><stop offset="0" stop-color="#3fdc8a" stop-opacity="0.22"/><stop offset="1" stop-color="#3fdc8a" stop-opacity="0"/></radialGradient>
  <linearGradient id="room-bag" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c23a31"/><stop offset="0.6" stop-color="#e0514a"/><stop offset="1" stop-color="#b8312a"/></linearGradient>
  <pattern id="room-sisal" width="8" height="4" patternUnits="userSpaceOnUse"><rect width="8" height="4" fill="#d8c08f"/><rect y="2.6" width="8" height="1.4" fill="#b89c68"/></pattern>
  <pattern id="room-sisal-side" width="8" height="4" patternUnits="userSpaceOnUse"><rect width="8" height="4" fill="#c4ac7c"/><rect y="2.6" width="8" height="1.4" fill="#a68a58"/></pattern>
  <pattern id="room-carpet" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#9a8a78"/><circle cx="2" cy="2" r="0.9" fill="#ab9b88"/></pattern>
  <radialGradient id="room-vignette" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="#1a1a4e" stop-opacity="0"/><stop offset="1" stop-color="#1a1a4e" stop-opacity="0.3"/></radialGradient>`;
add(`<rect width="1600" height="900" fill="url(#room-vignette)" pointer-events="none"/>`);

// ---------------------------------------------------------------- eixida
const out = `// GENERAT per tools/habitacio.js (no l'edites a mà: canvia l'escena allà i torna a executar-lo)
// Capes de l'habitació en ordre de pintat (del fons cap al davant). Les capes amb \`spot\` són punts interactius (js/room.js).
const ROOM_ART = ${JSON.stringify({ defs, layers }, null, 0)};
`;
fs.writeFileSync(path.join(__dirname, "..", "js", "data", "room-art.js"), out);
const pi = process.argv.indexOf("--preview");
if (pi > 0) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs>${defs}</defs>${layers.map(l => l.svg).join("")}</svg>`;
  fs.writeFileSync(process.argv[pi + 1], svg);
}
console.log(`js/data/room-art.js: ${layers.length} capes, ${(out.length / 1024).toFixed(0)} KB`);
