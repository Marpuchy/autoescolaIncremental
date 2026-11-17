#!/usr/bin/env node
// ===== HABITACIÓ (generador) =====
// L'habitació és la pantalla d'inici: des d'ací es va a cada joc d'estudi. Es descriu en metres i es projecta amb
// tools/perspectiva.js. Escriu js/data/room-art.js, que pinta js/room.js. Ús: node tools/habitacio.js [--preview fitxer.svg]
// Planta (segons el plànol de l'autor), mirant des de la porta:
//   la part esquerra és menys fonda (paret a z = 2.0) i a la dreta la paret del fons fa un racó més fons (z = 3.6),
//   amb el doblec de la paret a x = -0.4. Llit a l'esquerra davant; prestatgeria menuda al racó esquerre (amb la
//   placa L); escriptori a la paret del fons, a l'esquerra del racó; zona de la gata al racó del fons a la dreta;
//   moble llarg (calaixera i vitrina) a la paret dreta. Versió minimalista: després es detalla.
// Punts interactius: la placa L (→ DGT) i la motxilla recolzada al llit (→ joc d'estudi).
const fs = require("fs"), path = require("path");
const { camera, r } = require("./perspectiva");

const cam = camera({ cx: 800, cy: 410, eye: 1.45, d: 3.1, f: 1150 });
const { P, poly, box, face, quad, shadow, figure, line, bbox } = cam;
const W = 1.8, H = 2.6, BACK = 3.6, NEAR = 2.0, STEP = -0.4, Z = -2.6; // Z: les superfícies continuen per darrere
const layers = [];
const add = (svg, spot) => layers.push({ svg, ...(spot || {}) });
const wallRect = (x0, y0, x1, y1, attrs, z = BACK) => { const [a, b] = P(x0, y1, z), [c, d] = P(x1, y0, z); return `<rect x="${r(a)}" y="${r(b)}" width="${r(c - a)}" height="${r(d - b)}" ${attrs}/>`; };
const WHITE = { front: "#f4f2ec", side: "#e2dfd6", top: "#fbfaf6", bottom: "#d8d4ca" };

// ---------------------------------------------------------------- parets, sostre i terra (planta en L)
{
  let s = "";
  s += poly([[-W, H, Z], [W, H, Z], [W, H, BACK], [STEP, H, BACK], [STEP, H, NEAR], [-W, H, NEAR]], `fill="#eceae4"`);
  s += poly([[-W, 0, Z], [W, 0, Z], [W, 0, BACK], [STEP, 0, BACK], [STEP, 0, NEAR], [-W, 0, NEAR]], `fill="url(#room-floor)"`);
  s += poly([[W, 0, Z], [W, 0, BACK], [W, H, BACK], [W, H, Z]], `fill="url(#room-wall-r)"`);
  s += poly([[-W, 0, Z], [-W, 0, NEAR], [-W, H, NEAR], [-W, H, Z]], `fill="url(#room-wall-l)"`);
  s += wallRect(STEP, 0, W, H, `fill="url(#room-wall-b)"`);                                   // paret del fons del racó
  s += poly([[STEP, 0, NEAR], [STEP, 0, BACK], [STEP, H, BACK], [STEP, H, NEAR]], `fill="#d9dcde"`); // doblec
  s += wallRect(-W, 0, STEP, H, `fill="url(#room-wall-b)"`, NEAR);                             // paret del fons esquerra
  // arestes suaus perquè es llija la planta
  s += `<g stroke="#c4c7ca" stroke-width="1.5">${line([STEP, 0, NEAR], [STEP, H, NEAR])}${line([STEP, 0, BACK], [STEP, H, BACK])}${line([W, 0, BACK], [W, H, BACK])}${line([-W, 0, NEAR], [-W, H, NEAR])}</g>`;
  add(s);
}

// ---------------------------------------------------------------- finestra (paret del fons del racó)
{
  let s = "";
  const x0 = 0.55, x1 = 1.45, y0 = 0.95, y1 = 2.2;
  s += wallRect(x0 - 0.05, y0 - 0.05, x1 + 0.05, y1 + 0.05, `fill="#fbfbf8"`);
  s += wallRect(x0, y0, x1, 1.3, `fill="#9cc77a"`) + wallRect(x0, 1.3, x1, y1, `fill="#e8e6df"`);
  for (let y = 1.34; y < y1; y += 0.06) s += line([x0, y, BACK], [x1, y, BACK], `stroke="#d4d1c8" stroke-width="1"`);
  s += wallRect((x0 + x1) / 2 - 0.02, y0, (x0 + x1) / 2 + 0.02, y1, `fill="#fbfbf8"`);
  add(s);
}

// ---------------------------------------------------------------- escriptori (verd al plànol): paret del fons, a l'esquerra del racó
{
  let s = "";
  const top = 0.74, x0 = STEP + 0.05, x1 = 0.45, z0 = BACK - 0.6, z1 = BACK;
  s += shadow({ x0, x1, z0, z1 }, 0.03, 0.18);
  for (const x of [x0, x1 - 0.04]) for (const z of [z0, z1 - 0.04]) s += box({ x0: x, x1: x + 0.04, y0: 0, y1: top - 0.03, z0: z, z1: z + 0.04 }, { front: "#e2e2de", side: "#cfcfcb" });
  s += box({ x0, x1, y0: top - 0.03, y1: top, z0, z1 }, { front: "#e8e6e0", side: "#d8d6d0", top: "#f6f5f1" });
  const m = { x0: -0.2, x1: 0.3, y0: top + 0.1, y1: top + 0.42, z0: BACK - 0.2, z1: BACK - 0.17 };
  s += box({ x0: 0.03, x1: 0.07, y0: top, y1: top + 0.12, z0: BACK - 0.16, z1: BACK - 0.13 }, { front: "#2b2f35" });
  s += box(m, { front: "#16181c", side: "#101216", top: "#22252b" });
  s += quad(face(m, "front"), 0.04, 0.06, 0.96, 0.92, `fill="#3f7ad8"`);
  s += box({ x0: -0.15, x1: 0.2, y0: top, y1: top + 0.02, z0: BACK - 0.5, z1: BACK - 0.38 }, { front: "#2b2f35", top: "#3a3f48" });
  // un prestatge damunt amb el focus d'anell
  s += box({ x0, x1, y0: 1.6, y1: 1.63, z0: BACK - 0.25, z1: BACK }, WHITE);
  const [rx, ry] = P(-0.2, 1.82, BACK - 0.12), k = cam.scale(BACK - 0.12) / 100;
  s += `<circle cx="${r(rx)}" cy="${r(ry)}" r="${r(18 * k)}" fill="url(#room-ring-glow)"/><circle cx="${r(rx)}" cy="${r(ry)}" r="${r(8 * k)}" fill="none" stroke="#fffdf2" stroke-width="${r(3 * k)}"/>`;
  add(s);
}

// ---------------------------------------------------------------- zona de la gata (groc al plànol): racó del fons a la dreta
{
  let s = "";
  s += box({ x0: W - 0.4, x1: W - 0.04, y0: 0, y1: 0.05, z0: BACK - 0.7, z1: BACK - 0.05 }, { front: "#e6dcc8", side: "#d6ccb8", top: "#efe6d4" });
  s += box({ x0: W - 0.28, x1: W - 0.18, y0: 0.05, y1: 1.1, z0: BACK - 0.45, z1: BACK - 0.35 }, { front: "url(#room-sisal)", side: "url(#room-sisal-side)" });
  s += box({ x0: W - 0.4, x1: W - 0.04, y0: 1.1, y1: 1.15, z0: BACK - 0.6, z1: BACK - 0.2 }, { front: "#efe6d4", side: "#ddd2be", top: "#f6efe0" });
  s += box({ x0: 0.95, x1: 1.2, y0: 0, y1: 0.05, z0: BACK - 0.45, z1: BACK - 0.3 }, { front: "#d8c6a8", top: "#e6d6b8" }); // menjador
  s += box({ x0: 1.0, x1: 1.35, y0: 0, y1: 0.1, z0: 2.55, z1: 2.85 }, { front: "#2a2620", side: "#221f1a", top: "#d8cba8" });  // sorral
  add(s);
}

// ---------------------------------------------------------------- prestatgeria menuda (morat al plànol): racó esquerre, contra la paret de davant del llit
let plate;
{
  let s = "";
  const b = { x0: -W + 0.02, x1: -1.2, y0: 0, y1: 1.8, z0: NEAR - 0.32, z1: NEAR };
  s += box(b, WHITE);
  const fr = face(b, "front");
  for (const v of [0.06, 0.28, 0.5, 0.72]) s += quad(fr, 0.06, v, 0.94, v + 0.18, `fill="#2a2a2e"`);
  { let u = 0.1; const cols = ["#d1261f", "#1f6fb2", "#f2c200", "#2f9e55", "#7b3fe4", "#e46a2e"];
    for (let i = 0; u < 0.88; i++) { const w = 0.07 + (i % 2) * 0.02; s += quad(fr, u, 0.31 + (i % 3) * 0.015, u + w, 0.46, `fill="${cols[i % 6]}"`); u += w + 0.01; } }
  plate = fr(0.5, 0.235); // al buit de dalt, que el llit no tapa
  add(s);
}

// ---------------------------------------------------------------- moble llarg de la paret dreta (morat al plànol): calaixera amb la tele i vitrina
{
  let s = "";
  const d = { x0: W - 0.45, x1: W, y0: 0, y1: 0.9, z0: 1.15, z1: 2.25 };
  s += shadow(d, 0.03, 0.18) + box(d, { side: "#f2f0ea", top: "#faf9f5", front: "#e6e3db" });
  const lf = face(d, "left");
  for (const v of [0.05, 0.37, 0.69]) s += quad(lf, 0.05, v, 0.95, v + 0.28, `fill="#f6f4ef" stroke="#d8d4ca" stroke-width="1.5"`);
  const tv = { x0: W - 0.3, x1: W - 0.26, y0: 0.92, y1: 1.4, z0: 1.3, z1: 2.1 };
  s += box(tv, { side: "#141414", top: "#2a2a2a", front: "#101010" });
  s += quad(face(tv, "left"), 0.04, 0.06, 0.96, 0.9, `fill="#1a1e24"`);
  const v = { x0: W - 0.38, x1: W, y0: 0, y1: 1.75, z0: 0.3, z1: 1.05 };
  s += box(v, { side: "#2a2622", top: "#3a3530" });
  const vf = face(v, "left");
  s += quad(vf, 0.04, 0.02, 0.96, 0.98, `fill="#3a4248"`);
  for (const y of [0.27, 0.52, 0.77]) s += quad(vf, 0.04, y, 0.96, y + 0.012, `fill="#9aa6ae"`);
  s += quad(face(v, "front"), 0, 0, 1, 1, `fill="#cfe0e8" opacity="0.18" stroke="#2a2622" stroke-width="4"`);
  add(s);
}

// ---------------------------------------------------------------- llit (blau al plànol): davant a l'esquerra
{
  let s = "";
  const x0 = -W, x1 = -0.35, z0 = -0.2, z1 = 1.55;
  s += shadow({ x0, x1, z0, z1 }, 0.04, 0.25);
  s += box({ x0, x1, y0: 0, y1: 0.85, z0: z1, z1: z1 + 0.06 }, { front: "#3a2a20", side: "#2e2018", top: "#4a3628" });
  s += box({ x0, x1, y0: 0.06, y1: 0.3, z0, z1 }, { front: "#3a2a20", side: "#2e2018" });
  s += box({ x0: x0 + 0.1, x1: x1 - 0.1, y0: 0.5, y1: 0.62, z0: z1 - 0.45, z1: z1 - 0.06 }, { front: "#2a3a6a", side: "#22305a", top: "#33467a" });
  const dB = { x0: x0 + 0.01, x1: x1 + 0.04, y0: 0.18, y1: 0.56, z0: z0 - 0.04, z1: z1 - 0.5 };
  s += box(dB, { front: "url(#room-duvet-v)", side: "url(#room-duvet-v)", top: "url(#room-duvet)" });
  add(s);
}

// ---------------------------------------------------------------- placa L, a la prestatgeria (→ DGT)
{
  const PLATE = `<g transform="scale(0.9)"><rect x="-15" y="-30" width="30" height="30" rx="2.6" fill="#fff" stroke="#c8c3b6" stroke-width="0.6"/>
      <rect x="-13" y="-28" width="26" height="26" rx="1.6" fill="#009b48"/><path d="M-5.5 -23 H-0.5 V-10.5 H7 V-6 H-5.5 Z" fill="#fff"/></g>`;
  const [px, py] = P(...plate);
  const s = `<ellipse cx="${r(px)}" cy="${r(py - 14)}" rx="48" ry="44" fill="url(#room-l-glow)"/>` + figure(PLATE, ...plate);
  add(s, { spot: "dgt", title: "Placa L: anar a la DGT (autoescola)", hit: [r(px - 34), r(py - 52), 68, 58] });
}

// ---------------------------------------------------------------- motxilla recolzada al llit (→ joc d'estudi)
{
  const bx = -0.22, bz = 0.6;
  const BAG = `<g transform="scale(1.15)"><ellipse cx="-4" cy="0" rx="22" ry="4" fill="#1a1a4e" opacity="0.25"/>
    <g transform="rotate(-12 0 0)">
      <path d="M-6 -44 C-6 -53 6 -53 6 -44" stroke="#7a1f1a" stroke-width="2.6" fill="none"/>
      <path d="M-17 -2 L-18 -34 C-18 -44 -10 -46 0 -46 C10 -46 18 -44 18 -34 L17 -2 Q0 2 -17 -2 Z" fill="url(#room-bag)"/>
      <path d="M-12 -4 L-12 -18 Q0 -22 12 -18 L12 -4 Q0 -1 -12 -4 Z" fill="#b8312a"/>
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
