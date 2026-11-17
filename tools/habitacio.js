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

// ---------------------------------------------------------------- catifa blanca entre el llit i la vitrina
{
  const pts = [[0.32, 0.2], [1.3, 0.2], [1.3, 1.35], [0.32, 1.35]].map(([x, z]) => P(x, 0.004, z).map(r).join(",")).join(" ");
  add(`<polygon points="${pts}" fill="#f4f2ee" stroke="#e2ded6" stroke-width="2"/>`);
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

// ---------------------------------------------------------------- escriptori (verd al plànol): de costat, contra el doblec de la paret, mirant a la dreta
{
  let s = "";
  const top = 0.74, x0 = STEP, x1 = STEP + 0.6, z0 = NEAR + 0.25, z1 = BACK - 0.05;
  s += shadow({ x0, x1, z0, z1 }, 0.03, 0.18);
  for (const x of [x0 + 0.02, x1 - 0.05]) for (const z of [z0, z1 - 0.04]) s += box({ x0: x, x1: x + 0.04, y0: 0, y1: top - 0.03, z0: z, z1: z + 0.04 }, { front: "#e2e2de", side: "#cfcfcb" });
  s += box({ x0, x1, y0: top - 0.03, y1: top, z0, z1 }, { front: "#e8e6e0", side: "#d8d6d0", top: "#f6f5f1" });
  // pantalla contra la paret, mirant a la dreta (cap al centre de l'habitació)
  // dues pantalles, una al costat de l'altra, girades un poc cap a la cadira (si no, des de la porta només es veuen de cantell)
  const screen = (cx, cz, wid, th, c) => {
    const n = [Math.cos(th), Math.sin(th)], wv = [-Math.sin(th), Math.cos(th)]; // normal i amplària al pla (x, z)
    const at = (u, y) => [cx + wv[0] * u, y, cz + wv[1] * u];
    const y0 = top + 0.1, y1 = top + 0.42, hw = wid / 2;
    let t = line([cx, top, cz], [cx, y0, cz], `stroke="#2b2f35" stroke-width="5"`);
    t += poly([at(-hw, y1), at(hw, y1), at(hw, y0), at(-hw, y0)], `fill="#16181c"`);
    t += poly([at(-hw + 0.02, y1 - 0.02), at(hw - 0.02, y1 - 0.02), at(hw - 0.02, y0 + 0.03), at(-hw + 0.02, y0 + 0.03)], `fill="${c}"`);
    return t;
  };
  s += screen(STEP + 0.17, 3.18, 0.52, -0.5, "#2a3a55") + screen(STEP + 0.17, 2.66, 0.52, -0.25, "#3f7ad8");
  s += box({ x0: STEP + 0.3, x1: STEP + 0.44, y0: top, y1: top + 0.02, z0: 2.75, z1: 3.1 }, { front: "#2b2f35", side: "#23272e", top: "#3a3f48" });
  // prestatge damunt, a la mateixa paret, amb el focus d'anell
  s += box({ x0: STEP, x1: STEP + 0.25, y0: 1.6, y1: 1.63, z0, z1 }, WHITE);
  const [rx, ry] = P(STEP + 0.12, 1.82, 2.6), k = cam.scale(2.6) / 100;
  s += `<circle cx="${r(rx)}" cy="${r(ry)}" r="${r(18 * k)}" fill="url(#room-ring-glow)"/><circle cx="${r(rx)}" cy="${r(ry)}" r="${r(8 * k)}" fill="none" stroke="#fffdf2" stroke-width="${r(3 * k)}"/>`;
  add(s);
}

// ---------------------------------------------------------------- cadira davant de l'escriptori, mirant cap a la paret (es veu de costat)
{
  let s = "";
  const cx = STEP + 0.85, cz = 2.9;
  s += shadow({ x0: cx - 0.28, x1: cx + 0.28, z0: cz - 0.28, z1: cz + 0.28 }, 0.02, 0.2);
  const [bx, by] = P(cx, 0.06, cz);
  s += `<g stroke="#b8bcc2" stroke-width="4" stroke-linecap="round">${[0, 72, 144, 216, 288].map(a => {
    const [px, py] = P(cx + Math.cos(a * Math.PI / 180) * 0.28, 0.05, cz + Math.sin(a * Math.PI / 180) * 0.28);
    return `<line x1="${r(bx)}" y1="${r(by)}" x2="${r(px)}" y2="${r(py)}"/>`; }).join("")}</g>`;
  s += box({ x0: cx - 0.02, x1: cx + 0.02, y0: 0.06, y1: 0.45, z0: cz - 0.02, z1: cz + 0.02 }, { front: "#9a9ea4" });
  s += box({ x0: cx - 0.24, x1: cx + 0.22, y0: 0.45, y1: 0.53, z0: cz - 0.25, z1: cz + 0.25 }, { front: "#222428", side: "#1a1c20", top: "#2e3136" });
  s += box({ x0: cx + 0.22, x1: cx + 0.27, y0: 0.55, y1: 1.2, z0: cz - 0.23, z1: cz + 0.23 }, { front: "#1a1c20", side: "#222428", top: "#2e3136" }); // respatller
  for (const z of [cz + 0.23, cz - 0.27]) s += box({ x0: cx - 0.1, x1: cx + 0.2, y0: 0.53, y1: 0.7, z0: z, z1: z + 0.04 }, { front: "#1a1c20", side: "#141518", top: "#2e3136" }); // dos reposabraços
  add(s);
}

// ---------------------------------------------------------------- zona de la gata (groc al plànol): racó del fons a la dreta
{
  let s = "";
  // torre de la gata, 3 nivells: (1) una caseta amb forat i una manteta, (2) una plataforma sobre dos pals
  // i (3) dalt de tot una plataforma sobre un sol pal
  const tx0 = W - 0.44, tx1 = W - 0.04, tz0 = BACK - 0.72, tz1 = BACK - 0.08, PL = { front: "#efe6d4", side: "#ddd2be", top: "#f6efe0" };
  const cave = { x0: tx0, x1: tx1, y0: 0, y1: 0.36, z0: tz0, z1: tz1 };
  s += box(cave, PL);
  const cf = face(cave, "left"); // forat redó a la cara que mira l'habitació, amb la manteta que en trau el cap
  const ring = Array.from({ length: 25 }, (_, i) => { const a = i / 24 * Math.PI * 2; return P(...cf(0.5 + Math.cos(a) * 0.26, 0.55 + Math.sin(a) * 0.32)).map(r).join(" "); });
  s += `<path d="M${ring.join(" L")} Z" fill="#3a3028"/>`;
  s += quad(cf, 0.3, 0.72, 0.7, 0.87, `fill="#c96a8a"`) + quad(cf, 0.36, 0.74, 0.44, 0.86, `fill="#e88aa8"`);
  for (const z of [tz0 + 0.12, tz1 - 0.2]) s += box({ x0: W - 0.29, x1: W - 0.2, y0: 0.36, y1: 0.72, z0: z, z1: z + 0.09 }, { front: "url(#room-sisal)", side: "url(#room-sisal-side)" });
  s += box({ x0: tx0, x1: tx1, y0: 0.72, y1: 0.77, z0: tz0 + 0.04, z1: tz1 - 0.04 }, PL);
  s += box({ x0: W - 0.29, x1: W - 0.2, y0: 0.77, y1: 1.1, z0: (tz0 + tz1) / 2 - 0.045, z1: (tz0 + tz1) / 2 + 0.045 }, { front: "url(#room-sisal)", side: "url(#room-sisal-side)" });
  s += box({ x0: tx0 + 0.04, x1: tx1, y0: 1.1, y1: 1.15, z0: tz0 + 0.14, z1: tz1 - 0.14 }, PL);
  s += box({ x0: 0.95, x1: 1.2, y0: 0, y1: 0.05, z0: BACK - 0.45, z1: BACK - 0.3 }, { front: "#d8c6a8", top: "#e6d6b8" }); // menjador
  s += box({ x0: 1.0, x1: 1.35, y0: 0, y1: 0.1, z0: 2.55, z1: 2.85 }, { front: "#2a2620", side: "#221f1a", top: "#d8cba8" });  // sorral
  add(s);
}

// ---------------------------------------------------------------- peluix menut de la gata, davall de la finestra (un cocodril blau genèric)
{
  const CROC = `<g transform="scale(0.9)"><ellipse cy="0" rx="10" ry="2.4" fill="#000" opacity="0.2"/>
    <ellipse cx="0" cy="-7" rx="8" ry="7" fill="#3a8ad8"/><ellipse cx="0" cy="-5.5" rx="4.5" ry="5" fill="#f2e2b0"/>
    <path d="M-3 -13 Q-9 -16 -14 -13 Q-15 -10 -9 -9.5 L-3 -10 Z" fill="#3a8ad8"/><path d="M-14 -11.5 L-4 -11" stroke="#1a3a6a" stroke-width="0.7"/>
    <circle cx="-1.5" cy="-15.5" r="3" fill="#3a8ad8"/><circle cx="-1.6" cy="-15.8" r="1.4" fill="#fff"/><circle cx="-2" cy="-15.8" r="0.7" fill="#1a1a1a"/>
    <path d="M6 -4 Q13 -3 14 -8" stroke="#3a8ad8" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <path d="M3 -13 l2 -2 l1 2 M6 -10 l2 -2 l1 2" fill="#2a6ab0"/>
    <ellipse cx="-5" cy="-0.8" rx="2.4" ry="1.4" fill="#3a8ad8"/><ellipse cx="4" cy="-0.8" rx="2.4" ry="1.4" fill="#3a8ad8"/></g>`;
  add(figure(CROC, 1.05, 0, BACK - 0.14));
}

// ---------------------------------------------------------------- prestatgeria menuda (morat al plànol): contra la paret esquerra, al costat del capçal, mirant a la dreta
let plate;
{
  let s = "";
  const b = { x0: -W, x1: -W + 0.32, y0: 0, y1: 1.8, z0: 1.6, z1: NEAR - 0.02 };
  s += box(b, { ...WHITE, front: "#e2dfd6" });
  const fr = face(b, "right"); // la cara que mira l'habitació · u: de davant cap al fons
  for (const v of [0.06, 0.28, 0.5, 0.72]) s += quad(fr, 0.06, v, 0.94, v + 0.18, `fill="#2a2a2e"`);
  { let u = 0.1; const cols = ["#d1261f", "#1f6fb2", "#f2c200", "#2f9e55", "#7b3fe4", "#e46a2e"];
    for (let i = 0; u < 0.88; i++) { const w = 0.08 + (i % 2) * 0.02; s += quad(fr, u, 0.31 + (i % 3) * 0.015, u + w, 0.46, `fill="${cols[i % 6]}"`); u += w + 0.01; } }
  plate = face(b, "front")(0.5, 0.42); // penjada del lateral blanc, el que es veu des de la porta
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
  // una vitrina de vidre: l'interior (lleixes i el que hi ha) en 3D, i al damunt els vidres i el marc
  const v = { x0: W - 0.38, x1: W, y0: 0, y1: 1.75, z0: 0.3, z1: 1.05 };
  s += box({ ...v, y0: 0, y1: 0.06 }, { side: "#2a2622", front: "#2a2622", top: "#3a3530" });
  for (const z of [v.z0, v.z1 - 0.025]) s += box({ x0: v.x1 - 0.025, x1: v.x1, y0: 0, y1: v.y1, z0: z, z1: z + 0.025 }, { side: "#2a2622", front: "#2a2622" }); // les dues columnes de darrere
  const levels = [0.06, 0.48, 0.9, 1.32];
  const goods = [ // [x, z, ample, alt, color] per lleixa: figuretes i records de viatges
    [[1.55, 0.45, 0.08, 0.2, "#d1261f"], [1.62, 0.7, 0.1, 0.14, "#cfe6f5"], [1.55, 0.9, 0.07, 0.24, "#b8a070"]],
    [[1.6, 0.42, 0.12, 0.16, "#2f9e55"], [1.55, 0.66, 0.08, 0.22, "#7b3fe4"], [1.62, 0.88, 0.1, 0.12, "#f2c200"]],
    [[1.58, 0.45, 0.1, 0.18, "#3a4a8e"], [1.6, 0.72, 0.14, 0.1, "#e8e2d0"], [1.55, 0.92, 0.07, 0.2, "#e46a2e"]],
    [[1.6, 0.5, 0.12, 0.14, "#9a6a3a"], [1.56, 0.8, 0.08, 0.22, "#c84a3a"]],
  ];
  levels.forEach((y, i) => {
    s += box({ x0: v.x0 + 0.02, x1: v.x1, y0: y, y1: y + 0.012, z0: v.z0 + 0.02, z1: v.z1 - 0.02 }, { side: "#b8c2c8", top: "#d8e0e4", front: "#b8c2c8", bottom: "#a8b2b8" });
    for (const [x, z, w, h, c] of goods[i]) s += box({ x0: x - w / 2, x1: x + w / 2, y0: y + 0.012, y1: y + 0.012 + h, z0: z - w / 2, z1: z + w / 2 }, { side: c, front: c, top: "#ffffff55" });
  });
  for (const [x, z] of [[v.x0, v.z0], [v.x0, v.z1 - 0.025]]) s += box({ x0: x, x1: x + 0.025, y0: 0, y1: v.y1, z0: z, z1: z + 0.025 }, { side: "#2a2622", front: "#2a2622" });
  s += box({ ...v, y0: v.y1 - 0.03 }, { side: "#2a2622", front: "#2a2622", top: "#3a3530" });
  // vidres (porta i costat) amb un reflex
  s += quad(face(v, "left"), 0, 0, 1, 1, `fill="#cfe0e8" opacity="0.16"`) + quad(face(v, "left"), 0.12, 0.04, 0.24, 0.96, `fill="#fff" opacity="0.14"`);
  s += quad(face(v, "front"), 0, 0, 1, 1, `fill="#cfe0e8" opacity="0.1"`);
  add(s);
}

// ---------------------------------------------------------------- llit (blau al plànol): capçal i coixí contra la paret esquerra, els peus cap a la dreta
{
  let s = "";
  const x0 = -W, x1 = 0.2, z0 = 0.15, z1 = 1.55; // 2 m de llarg (x) i 1,4 m d'ample (z)
  s += shadow({ x0, x1, z0, z1 }, 0.04, 0.25);
  s += box({ x0, x1: x0 + 0.06, y0: 0, y1: 0.9, z0, z1 }, { front: "#efede8", side: "#e0ddd6", top: "#f8f7f3" });  // capçal blanc, a la paret
  s += box({ x0: x0 + 0.06, x1, y0: 0, y1: 0.3, z0, z1 }, { front: "#ebe9e4", side: "#dcd9d2" });                 // estructura blanca, fins a terra

  // coixí al costat de la paret
  // edredó de cercles: de després del coixí fins als peus, i cau pel costat de davant i pels peus
  const dB = { x0: x0 + 0.07, x1: x1 + 0.04, y0: 0.18, y1: 0.54, z0: z0 - 0.04, z1: z1 + 0.02 };
  // el patró de cercles es dibuixa damunt de l'edredó en 3D (cada cercle projectat), així segueix la perspectiva
  const DUV = ["#1e2f5a", "#2f8a5a", "#9fb8d8", "#1e2f5a", "#3a5a9a", "#9fb8d8", "#2f8a5a", "#1e2f5a"];
  const pattern = (fn, uLen, vLen, id) => { // fn(u, v) en [0,1]² → punt 3D de la cara; uLen/vLen: mida en metres
    const R = 0.055, step = 0.085, pts = [];
    let out = `<clipPath id="${id}"><polygon points="${[fn(0, 0), fn(1, 0), fn(1, 1), fn(0, 1)].map(p => P(...p).map(r).join(",")).join(" ")}"/></clipPath><g clip-path="url(#${id})">`;
    out += poly([fn(0, 0), fn(1, 0), fn(1, 1), fn(0, 1)], `fill="#dfe8f2"`);
    for (let i = 0, v = 0; v < vLen + step; v += step * 0.5, i++) for (let j = 0, u = (i % 2) * step * 0.5; u < uLen + step; u += step, j++) {
      const c = DUV[(i * 3 + j) % DUV.length];
      const ring = Array.from({ length: 10 }, (_, k) => { const a = k / 10 * Math.PI * 2; return fn((u + Math.cos(a) * R) / uLen, (v + Math.sin(a) * R) / vLen); });
      out += poly(ring, `fill="${c}"`);
    }
    return out + "</g>";
  };
  s += pattern(face(dB, "top"), dB.x1 - dB.x0, dB.z1 - dB.z0, "duv-top");
  s += pattern(face(dB, "front"), dB.x1 - dB.x0, dB.y1 - dB.y0, "duv-front");
  { // coixí: blanc, una mica abombat
    const pb = { x0: x0 + 0.1, x1: x0 + 0.46, y0: 0.54, y1: 0.66, z0: z0 + 0.14, z1: z1 - 0.14 };
    s += box(pb, { front: "#e9edf2", side: "#dde2e8", top: "#f6f8fb" });
    s += quad(face(pb, "top"), 0.15, 0.1, 0.85, 0.9, `fill="#fff" opacity="0.6"`);
  }

  s += quad(face(dB, "front"), 0, 0, 0.012, 1, `fill="#000" opacity="0.15"`);
  add(s);
}

// ---------------------------------------------------------------- la Guppy, la gata, dormint feta un rogle damunt del llit
{
  // atigrada gris i bruna amb el pit, la panxa i les potes blanques, el nas rosa i la cua amb anells
  // menudeta (encara és una gateta): uns 25 cm feta un rogle. Atigrada gris i bruna, ratlles fosques al llom i la
  // «M» al front, la ratlla blanca entre els ulls, el morro, el pit, la panxa i les potes blancs; nas i orelles roses
  const GUPPY = `<g transform="scale(0.55)">
    <ellipse cx="2" cy="1" rx="23" ry="5.5" fill="#000" opacity="0.18"/>
    <ellipse cx="4" cy="-8" rx="20" ry="10.5" fill="#8f8676"/>
    <ellipse cx="6" cy="-12" rx="15" ry="5.5" fill="#6e665a" opacity="0.6"/>
    <path d="M-6 -17 Q-3 -10 -7 -2 M0 -18.5 Q3 -10 -0.5 -1 M6 -18.6 Q9 -10 5.5 -1 M12 -18 Q15 -10 12 -2 M18 -15.5 Q21 -9 18 -3 M23 -11 Q24.5 -8 22.5 -5" stroke="#2e2a26" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <ellipse cx="10" cy="-3" rx="12" ry="5" fill="#f8f6f2"/>
    <path d="M24 -6 Q27 2 12 3.2 Q-6 4.2 -14 0.5" stroke="#857c6e" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M22 -2 l-1.4 4.4 M16 0.4 l-0.8 4.4 M10 1.2 l-0.4 4.4 M4 1.4 l-0.2 4.4 M-2 1.4 l0.2 4.2 M-8 1 l0.4 4" stroke="#2a2622" stroke-width="2.1"/>
    <path d="M-14 0.5 Q-17 0.3 -18 -1.5" stroke="#2a2622" stroke-width="4.6" fill="none" stroke-linecap="round"/>
    <ellipse cx="-10" cy="-1.6" rx="7" ry="3.4" fill="#f8f6f2"/>
    <ellipse cx="-6" cy="0.8" rx="3" ry="1.8" fill="#fbfaf8"/><ellipse cx="-1.4" cy="1.2" rx="3" ry="1.8" fill="#fbfaf8"/>
    <path d="M-7.5 1.2 h-1 M-3 1.6 h-1" stroke="#e8c8c8" stroke-width="0.6"/>
    <circle cx="-13" cy="-9" r="8.4" fill="#968c7c"/>
    <path d="M-19.5 -13 L-21.5 -21.5 L-15 -16 Z M-9.5 -16.5 L-5.5 -22.5 L-5 -14 Z" fill="#968c7c"/>
    <path d="M-19 -14.5 L-20.4 -19.6 L-16.4 -16.2 Z M-8.8 -16.4 L-6.4 -20.4 L-6 -15.2 Z" fill="#f0b8c0"/>
    <path d="M-16.5 -15.5 l1.2 3.4 M-13.2 -17.2 l0 3.6 M-9.8 -15.6 l-1.2 3.4 M-19.5 -9.5 l2.6 0.6 M-6.5 -9.5 l-2.6 0.6" stroke="#2e2a26" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M-14.3 -17 Q-13 -13 -14.4 -6.8 L-11.6 -6.8 Q-13 -13 -11.7 -17 Z" fill="#f8f6f2"/>
    <path d="M-17.4 -5.8 Q-13 -1 -8.6 -5.8 Q-11 -3.6 -13 -3.6 Q-15 -3.6 -17.4 -5.8 Z" fill="#f8f6f2"/>
    <path d="M-17.8 -9.2 q1.7 1.4 3.4 0 M-11.6 -9.2 q1.7 1.4 3.4 0" stroke="#2a2622" stroke-width="1" fill="none" stroke-linecap="round"/>
    <path d="M-13.9 -6.4 L-12.1 -6.4 L-13 -5.3 Z" fill="#f2a0aa"/>
    <path d="M-13 -5.3 v0.9 M-13 -4.4 q-0.8 0.6 -1.5 0.2 M-13 -4.4 q0.8 0.6 1.5 0.2" stroke="#b07a7a" stroke-width="0.4" fill="none"/>
    <path d="M-16.5 -5.4 l-6 -1 M-16.5 -4.5 l-6 0.4 M-16.5 -3.6 l-5.4 1.6 M-9.5 -5.4 l6 -1 M-9.5 -4.5 l6 0.4 M-9.5 -3.6 l5.4 1.6" stroke="#ffffff" stroke-width="0.35" opacity="0.9"/>
  </g>`;
  add(figure(GUPPY, -0.75, 0.56, 0.95));
}

// ---------------------------------------------------------------- placa L, a la prestatgeria (→ DGT)
{
  const PLATE = `<g transform="scale(0.9)"><rect x="-15" y="-30" width="30" height="30" rx="2.6" fill="#fff" stroke="#c8c3b6" stroke-width="0.6"/>
      <rect x="-13" y="-28" width="26" height="26" rx="1.6" fill="#009b48"/><path d="M-5.5 -23 H-0.5 V-10.5 H7 V-6 H-5.5 Z" fill="#fff"/></g>`;
  const [px, py] = P(...plate);
  // un clau i el cordill d'on penja
  const k = cam.scale(plate[2]) / 100, [nx, ny] = P(plate[0], plate[1] + 0.12, plate[2]);
  const s = `<ellipse cx="${r(px)}" cy="${r(py - 14)}" rx="48" ry="44" fill="url(#room-l-glow)"/>`
    + `<path d="M${r(px - 11 * k)} ${r(py - 27 * k)} L${r(nx)} ${r(ny)} L${r(px + 11 * k)} ${r(py - 27 * k)}" stroke="#5a4a3a" stroke-width="1.2" fill="none"/><circle cx="${r(nx)}" cy="${r(ny)}" r="2" fill="#6b6b6b"/>`
    + figure(PLATE, ...plate);
  add(s, { spot: "dgt", title: "Placa L: anar a la DGT (autoescola)", hit: [r(px - 34), r(py - 52), 68, 58] });
}

// ---------------------------------------------------------------- motxilla, de costat, recolzada als peus del llit (→ joc d'estudi)
{
  const bx = 0.36, bz = 0.85;
  // es veu de perfil: l'esquena (amb les tires) toca el llit, a l'esquerra; la butxaca de davant, a la dreta
  const BAG = `<g transform="scale(1.15)"><ellipse cx="2" cy="0" rx="16" ry="3.5" fill="#1a1a4e" opacity="0.25"/>
    <g transform="rotate(-14 0 0)">
      <path d="M-6 -44 C-4 -52 4 -52 5 -45" stroke="#2a2a30" stroke-width="2.6" fill="none"/>
      <path d="M-9 -2 L-10 -38 C-10 -46 -4 -48 2 -47 C9 -46 11 -40 11 -32 L12 -2 Q2 1 -9 -2 Z" fill="url(#room-bag)"/>
      <!-- les dues tires de l'esquena: ixen de dalt, fan l'arc i s'enganxen a baix amb la sivella -->
      <path d="M-8 -41 C-19 -36 -19 -12 -9 -6" stroke="#0a0a0d" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M-9 -38 C-16 -33 -16 -14 -9 -9" stroke="#26262c" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <rect x="-12" y="-9" width="4" height="3" rx="0.6" fill="#5a5a62"/>
      <path d="M-8 -41 l0 -2" stroke="#0a0a0d" stroke-width="3"/>
      <path d="M8 -22 C15 -21 16 -6 12 -3 L9 -3 Z" fill="#1c1c20"/>
      <path d="M2 -46 C8 -45 11 -39 11 -32" stroke="#3a3a42" stroke-width="1" fill="none"/>
      <circle cx="12.2" cy="-14" r="3.2" fill="#1f4fa8" stroke="#c9d6e8" stroke-width="0.6"/><circle cx="12.2" cy="-14" r="1.4" fill="#4aa8ff"/>
      <ellipse cx="12.2" cy="-14" rx="2.6" ry="0.8" fill="none" stroke="#ff8a1f" stroke-width="0.7" transform="rotate(-20 12.2 -14)"/>
    </g></g>`;
  add(figure(BAG, bx, 0, bz), { spot: "study", title: "Motxilla: anar a estudiar (tower defense)", hit: bbox([[bx - 0.2, 0, bz], [bx + 0.22, 0.62, bz]]) });
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
  <linearGradient id="room-bag" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#18181c"/><stop offset="0.6" stop-color="#2e2e34"/><stop offset="1" stop-color="#16161a"/></linearGradient>
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
