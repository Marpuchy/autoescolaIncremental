#!/usr/bin/env node
// ===== SALA D'ESTUDI (generador) =====
// La sala del joc d'estudi (s'hi entra per la motxilla de l'habitació): una sala arcana fosca, amb traços de neó com les
// criatures. Escriu js/data/td-lobby-art.js, que pinta js/td/lobby.js. Ús: node tools/sala-estudi.js [--preview fitxer.svg]
// Sala: 9 m d'ample (x de -4.5 a 4.5), 4,5 m d'alt i 9 m de fons. Càmera a 1,7 m.
// Punts: portal (mons), altar (invocar), escriptori (estudiar), grimori (criatures), faristol (bestiari),
// cristall (millores), estudiant (artefactes), porta (eixida) i rellotge de sorra (reiniciar).
const fs = require("fs"), path = require("path");
const { camera, r } = require("./perspectiva");

const cam = camera({ cx: 800, cy: 380, eye: 1.7, d: 4, f: 1500 });
const { P, poly, box, face, quad, shadow, figure, line, bbox, corners } = cam;
const W = 4.5, H = 4.5, BACK = 9;
const layers = [];
const add = (svg, spot) => layers.push({ svg, ...(spot || {}) });
const wallRect = (x0, y0, x1, y1, attrs) => { const [a, b] = P(x0, y1, BACK), [c, d] = P(x1, y0, BACK); return `<rect x="${r(a)}" y="${r(b)}" width="${r(c - a)}" height="${r(d - b)}" ${attrs}/>`; };
// traç de neó en pantalla (mateix acabat que les criatures)
const neon = (d, c, w = 4) => `<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${d}" stroke="${c}" stroke-width="${w * 2.8}" opacity="0.16"/><path d="${d}" stroke="${c}" stroke-width="${w}"/><path d="${d}" stroke="#fff" stroke-width="${Math.max(1, w * 0.3)}" opacity="0.85"/></g>`;
const ellipseOnFloor = (x, z, rx, rz, n = 48) => { const pts = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; pts.push(P(x + Math.cos(a) * rx, 0.005, z + Math.sin(a) * rz)); } return "M" + pts.map(p => p.map(r).join(" ")).join(" L"); };
const V = "#9d8bff", G = "#3fdc8a", PINK = "#ff5ab0", GOLD = "#ffc23f", CYAN = "#7fe8ff", RED = "#ff5a4a";

// ---------------------------------------------------------------- sala
{
  let s = "";
  s += poly([[-W, H, 0], [W, H, 0], [W, H, BACK], [-W, H, BACK]], `fill="#0c0f1a"`);
  s += poly([[-W, 0, 0], [-W, 0, BACK], [-W, H, BACK], [-W, H, 0]], `fill="url(#sl-wall-l)"`);
  s += poly([[W, 0, 0], [W, 0, BACK], [W, H, BACK], [W, H, 0]], `fill="url(#sl-wall-r)"`);
  s += wallRect(-W, 0, W, H, `fill="url(#sl-wall-b)"`);
  // pedres de les parets (juntes)
  let j = "";
  for (let y = 0.6; y < H; y += 0.6) { j += line([-W, y, BACK], [W, y, BACK]); j += line([-W, y, 0.5], [-W, y, BACK]); j += line([W, y, 0.5], [W, y, BACK]); }
  s += `<g stroke="#232a40" stroke-width="1.4" opacity="0.7">${j}</g>`;
  // terra: lloses fosques amb juntes violeta molt suaus
  s += poly([[-W, 0, 0], [W, 0, 0], [W, 0, BACK], [-W, 0, BACK]], `fill="url(#sl-floor)"`);
  let f = "";
  for (let x = -W; x <= W + 0.01; x += 0.9) f += line([x, 0, 0.6], [x, 0, BACK]);
  for (let z = 1.2; z < BACK; z += 0.9) f += line([-W, 0, z], [W, 0, z]);
  s += `<g stroke="#2b2350" stroke-width="1.4">${f}</g>`;
  // finestres altes en arc amb estrels (paret del fons, als costats del portal)
  for (const cx of [-3.1, 3.1]) {
    const [a] = P(cx - 0.45, 0, BACK), [b] = P(cx + 0.45, 0, BACK), [, top] = P(0, 3.7, BACK), [, bot] = P(0, 1.8, BACK);
    const w = b - a, rr = w / 2;
    const d = `M${r(a)} ${r(bot)} V${r(top + rr)} A${r(rr)} ${r(rr)} 0 0 1 ${r(b)} ${r(top + rr)} V${r(bot)} Z`;
    s += `<path d="${d}" fill="url(#sl-night)"/>`;
    for (let i = 0; i < 7; i++) s += `<circle cx="${r(a + w * ((i * 37) % 100) / 100)}" cy="${r(top + rr + (bot - top - rr) * ((i * 53) % 90) / 100)}" r="${1 + (i % 3) * 0.6}" fill="#fff" opacity="0.8"/>`;
    s += neon(d, V, 2.4);
  }
  // espelmes que suren
  for (const [x, y, z] of [[-2.2, 3.4, 6.5], [-0.9, 3.8, 7.6], [1.3, 3.6, 7.2], [2.6, 3.3, 6], [0.3, 3.55, 5]]) {
    const [px, py] = P(x, y, z), k = cam.scale(z) / 150;
    s += `<g class="sl-candle" transform="translate(${r(px)} ${r(py)}) scale(${k.toFixed(3)})"><ellipse cx="0" cy="-26" rx="22" ry="26" fill="#ffd27a" opacity="0.12"/>
      <rect x="-5" y="-14" width="10" height="26" rx="2" fill="#efe6d0"/><path d="M0 -26 C5 -20 4 -15 0 -13 C-4 -15 -5 -20 0 -26 Z" fill="#ffd27a"/></g>`;
  }
  add(s);
}

// ---------------------------------------------------------------- porta d'eixida (paret esquerra, al fons) i rellotge de sorra
{
  let s = "";
  const dB = { x0: -W - 0.01, x1: -W, y0: 0, y1: 2.3, z0: 6.6, z1: 7.8 };
  const df = face(dB, "right");
  s += quad(df, -0.06, -0.04, 1.06, 1, `fill="#2a2235"`) + quad(df, 0, 0, 1, 1, `fill="url(#sl-door)"`);
  for (const u of [0.33, 0.66]) s += line(df(u, 0.05), df(u, 0.98), `stroke="#1f1828" stroke-width="2"`);
  const [hx, hy] = P(...df(0.85, 0.5));
  s += `<circle cx="${r(hx)}" cy="${r(hy)}" r="5" fill="${GOLD}"/>`;
  // cartell d'eixida verd, com el de la DGT
  const [sx, sy] = P(...df(0.5, -0.12));
  s += `<g transform="translate(${r(sx)} ${r(sy)}) scale(0.9)"><rect x="-34" y="-14" width="68" height="28" rx="3" fill="#1e9e4a" stroke="#fff" stroke-width="1.5"/>
    <path d="M-26 0 H-12 M-17 -6 L-11 0 L-17 6" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="12" y="-10" width="14" height="20" fill="none" stroke="#fff" stroke-width="2.4"/><circle cx="2" cy="-6" r="3" fill="#fff"/>
    <path d="M1 -2 L-1 6 M-1 2 L-5 4 M1 0 L6 2" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`;
  add(s, { spot: "exit", title: "Porta: tornar a l'habitació", hit: bbox([...corners(dB), df(0.5, -0.2)]) });
  // rellotge de sorra damunt d'una tauleta (reiniciar sense perdre la col·lecció)
  let h = "";
  const tB = { x0: -2.2, x1: -1.65, y0: 0, y1: 0.75, z0: 7.3, z1: 7.85 };
  h += shadow(tB, 0.05, 0.3) + box(tB, { front: "#2a2235", side: "#221c2c", top: "#3a3050" });
  const [gx, gy] = P(-1.925, 0.75, 7.575), k = cam.scale(7.575) / 100;
  h += `<g class="sl-hourglass" transform="translate(${r(gx)} ${r(gy)}) scale(${k.toFixed(3)})">
    <rect x="-16" y="-4" width="32" height="4" rx="2" fill="${GOLD}"/><rect x="-16" y="-44" width="32" height="4" rx="2" fill="${GOLD}"/>
    ${neon("M-12 -40 C-12 -28 0 -26 0 -22 C0 -18 -12 -16 -12 -4 M12 -40 C12 -28 0 -26 0 -22 C0 -18 12 -16 12 -4", CYAN, 1.8)}
    <path d="M-8 -36 H8 L0 -24 Z" fill="#ffd27a"/><path d="M-9 -6 H9 L0 -14 Z" fill="#ffd27a"/></g>`;
  add(h, { spot: "reset", title: "Rellotge de sorra: tornar a començar (sense perdre les criatures)", hit: bbox([...corners(tB), [-1.925, 1.3, 7.575]]) });
}

// ---------------------------------------------------------------- portal dels mons (paret del fons, al centre)
{
  let s = "";
  const [cx, cy] = P(0, 2.05, BACK), sc = cam.scale(BACK);
  const rx = sc * 1.05, ry = sc * 1.35;
  s += `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${r(rx * 1.5)}" ry="${r(ry * 1.3)}" fill="url(#sl-portal-glow)"/>`;
  s += `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${r(rx)}" ry="${r(ry)}" fill="url(#sl-portal)"/>`;
  s += `<g class="sl-swirl" style="transform-origin:${r(cx)}px ${r(cy)}px">${[0.82, 0.62, 0.42].map((k, i) =>
    `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${r(rx * k)}" ry="${r(ry * k)}" fill="none" stroke="${i % 2 ? CYAN : V}" stroke-width="3" stroke-dasharray="${18 + i * 8} ${12 + i * 6}" opacity="0.8"/>`).join("")}</g>`;
  s += neon(`M${r(cx - rx)} ${r(cy)} A${r(rx)} ${r(ry)} 0 1 1 ${r(cx + rx)} ${r(cy)} A${r(rx)} ${r(ry)} 0 1 1 ${r(cx - rx)} ${r(cy)}`, V, 5);
  // escaló i runes del marc
  const [bx0, by] = P(-1.4, 0.18, BACK - 0.3), [bx1] = P(1.4, 0.18, BACK - 0.3);
  s += box({ x0: -1.4, x1: 1.4, y0: 0, y1: 0.18, z0: BACK - 0.6, z1: BACK }, { front: "#241d3a", top: "#30285a", side: "#1c1630" });
  s += `<g font-family="serif" font-size="22" fill="${V}" opacity="0.8" text-anchor="middle">${["∫", "Σ", "λ", "π", "∞", "∂"].map((t, i) => {
    const a = Math.PI * (0.85 + i * 0.26); return `<text x="${r(cx + Math.cos(a) * rx * 1.18)}" y="${r(cy + Math.sin(a) * ry * 1.12 + 7)}">${t}</text>`; }).join("")}</g>`;
  add(s, { spot: "worlds", title: "Portal: anar a un món (combat)", hit: [r(cx - rx * 1.2), r(cy - ry * 1.2), r(rx * 2.4), r(ry * 2.4 + 20)] });
}

// ---------------------------------------------------------------- cristall de les millores (dreta, al fons)
{
  let s = "";
  const pB = { x0: 2.6, x1: 3.3, y0: 0, y1: 0.95, z0: 6.8, z1: 7.5 };
  s += shadow(pB, 0.1, 0.35) + box(pB, { front: "#241d3a", side: "#1c1630", top: "#30285a" });
  s += quad(face(pB, "front"), 0.15, 0.15, 0.85, 0.22, `fill="${CYAN}" opacity="0.6"`);
  const [cx, cy] = P(2.95, 1.55, 7.15), k = cam.scale(7.15) / 110;
  s += `<g class="sl-crystal" transform="translate(${r(cx)} ${r(cy)}) scale(${k.toFixed(3)})">
    <ellipse rx="60" ry="70" fill="${CYAN}" opacity="0.14"/>
    <path d="M0 -50 L24 -10 L0 34 L-24 -10 Z" fill="#0b2a3a" stroke="${CYAN}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M0 -50 L0 34 M-24 -10 H24" stroke="#bff4ff" stroke-width="1.6" opacity="0.8"/></g>`;
  add(s, { spot: "upgrades", title: "Cristall: millores (vida, maná, saber)", hit: bbox([...corners(pB), [2.95, 2.2, 7.15]]) });
}

// ---------------------------------------------------------------- prestatgeria (paret esquerra) i grimori de les criatures
{
  let s = "";
  const shB = { x0: -W, x1: -W + 0.45, y0: 0, y1: 3.2, z0: 2.6, z1: 5.0 };
  s += box(shB, { front: "#2a2235", side: "#30283f", top: "#3a3050" });
  const sf = face(shB, "right");
  for (let row = 0; row < 4; row++) {
    const v0 = 0.06 + row * 0.235;
    s += quad(sf, 0.03, v0, 0.97, v0 + 0.2, `fill="#151020"`);
    for (let i = 0; i < 9; i++) {
      const u = 0.06 + i * 0.1, h = 0.12 + ((i * 7 + row * 3) % 5) * 0.012;
      const c = ["#5a43d6", "#1f9e5c", "#8a2a4a", "#2f6fc0", "#a37a2a"][(i + row) % 5];
      s += quad(sf, u, v0 + 0.2 - h, u + 0.08, v0 + 0.2, `fill="${c}"`);
    }
  }
  add(s);
  // grimori: llibre gran obert damunt d'un faristol, davant de la prestatgeria; brilla violeta
  let g = "";
  const stB = { x0: -3.5, x1: -3.1, y0: 0, y1: 1.0, z0: 3.4, z1: 3.8 };
  g += shadow(stB, 0.1, 0.35) + box(stB, { front: "#2a2235", side: "#30283f", top: "#3a3050" });
  const [bx, by] = P(-3.3, 1.12, 3.55), k = cam.scale(3.55) / 100;
  g += `<g class="sl-book" transform="translate(${r(bx)} ${r(by)}) scale(${k.toFixed(3)})">
    <ellipse cx="0" cy="-10" rx="70" ry="44" fill="${V}" opacity="0.16"/>
    <path d="M-44 -6 L0 -16 L44 -6 L44 10 L0 0 L-44 10 Z" fill="#efe6d0" stroke="${V}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M0 -16 V0" stroke="#8a80c8" stroke-width="2"/>
    ${neon("M-30 -6 v-8 M-34 -10 h8", V, 1.6)}${neon("M18 -12 L26 -4 M26 -12 L18 -4", G, 1.6)}
    <g class="sl-float" fill="#fff" font-family="ui-monospace, monospace" font-weight="800" font-size="16"><text x="-20" y="-34" fill="${V}">+</text><text x="8" y="-44" fill="${G}">;</text><text x="24" y="-30" fill="${V}">λ</text></g></g>`;
  add(g, { spot: "grimori", title: "Grimori: les teues criatures (nivells, estrelles i equip)", hit: bbox([...corners(stB), [-3.3, 1.9, 3.55]]) });
}

// ---------------------------------------------------------------- escriptori d'estudi (esquerra, davant): registrar el que has estudiat
{
  let s = "";
  const dB = { x0: -2.9, x1: -1.5, y0: 0, y1: 0.8, z0: 1.9, z1: 2.6 };
  s += shadow(dB, 0.08, 0.35);
  s += box({ ...dB, y0: 0.74 }, { front: "#5a3f2a", side: "#4a3322", top: "url(#sl-wood)" });
  for (const x of [dB.x0 + 0.04, dB.x1 - 0.1]) s += box({ x0: x, x1: x + 0.06, y0: 0, y1: 0.74, z0: dB.z0 + 0.04, z1: dB.z0 + 0.1 }, { front: "#3a2818", side: "#2e2013" });
  // llibres apilats, quadern obert i ploma, espelma
  [["#5a43d6", 0], ["#1f9e5c", 1], ["#8a2a4a", 2]].forEach(([c, i]) =>
    s += box({ x0: -2.8 + i * 0.01, x1: -2.45 - i * 0.02, y0: 0.8 + i * 0.06, y1: 0.86 + i * 0.06, z0: 2.25, z1: 2.5 }, { front: c, side: c, top: "#efe6d0" }));
  s += box({ x0: -2.25, x1: -1.8, y0: 0.8, y1: 0.81, z0: 2.05, z1: 2.35 }, { front: "#efe6d0", top: "#fffaf0" });
  s += line([-2.18, 0.811, 2.25], [-1.95, 0.811, 2.22], `stroke="#8a80c8" stroke-width="2"`) + line([-2.18, 0.811, 2.17], [-1.9, 0.811, 2.14], `stroke="#8a80c8" stroke-width="2"`);
  s += line([-1.85, 0.81, 2.1], [-1.65, 1.05, 2.25], `stroke="#efe6d0" stroke-width="4" stroke-linecap="round"`);
  const [cx, cy] = P(-1.7, 0.8, 2.45), k = cam.scale(2.45) / 120;
  s += `<g class="sl-candle" transform="translate(${r(cx)} ${r(cy)}) scale(${k.toFixed(3)})"><ellipse cx="0" cy="-34" rx="40" ry="44" fill="#ffd27a" opacity="0.14"/>
    <rect x="-6" y="-24" width="12" height="24" rx="2" fill="#efe6d0"/><path d="M0 -38 C6 -30 5 -26 0 -24 C-5 -26 -6 -30 0 -38 Z" fill="#ffd27a"/></g>`;
  add(s, { spot: "study", title: "Escriptori: apuntar el que has estudiat (pergamins d'invocació)", hit: bbox([...corners(dB), [-2.2, 1.3, 2.3]]) });
}

// ---------------------------------------------------------------- faristol del bestiari (dreta)
{
  let s = "";
  const lB = { x0: 3.55, x1: 3.85, y0: 0, y1: 1.05, z0: 4.45, z1: 4.75 };
  s += shadow(lB, 0.12, 0.35) + box(lB, { front: "#2a2235", side: "#221c2c", top: "#3a3050" });
  const [bx, by] = P(3.7, 1.16, 4.6), k = cam.scale(4.6) / 100;
  s += `<g transform="translate(${r(bx)} ${r(by)}) scale(${k.toFixed(3)})"><ellipse cx="0" cy="-8" rx="62" ry="36" fill="${RED}" opacity="0.14"/>
    <path d="M-40 -4 L0 -14 L40 -4 L40 10 L0 0 L-40 10 Z" fill="#2b1a1a" stroke="${RED}" stroke-width="3" stroke-linejoin="round"/>
    ${neon("M-26 -8 L-14 2 M-22 -10 L-10 0 M-18 -12 L-6 -2", RED, 1.4)}${neon("M14 -8 Q22 -14 30 -6", "#ffb347", 1.4)}</g>`;
  add(s, { spot: "bestiary", title: "Bestiari: les distraccions que has vist", hit: bbox([...corners(lB), [3.7, 1.6, 4.6]]) });
}

// ---------------------------------------------------------------- altar d'invocació (al centre del terra)
{
  let s = "";
  const z = 4.3;
  s += `<path d="${ellipseOnFloor(0, z, 1.25, 0.6)}" fill="${PINK}" opacity="0.08"/>`;
  s += `<g class="sl-runes">${neon(ellipseOnFloor(0, z, 1.25, 0.6), PINK, 3)}${neon(ellipseOnFloor(0, z, 0.85, 0.4), V, 2)}</g>`;
  // estrela de cinc puntes dibuixada al terra
  const star = [];
  for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; star.push(P(Math.cos(a) * 0.85, 0.006, z + Math.sin(a) * 0.4)); }
  s += neon("M" + star.map(p => p.map(r).join(" ")).join(" L"), PINK, 1.6);
  // pedestal i pergamí que sura
  const [px, py] = P(0, 0.6, z), k = cam.scale(z) / 100;
  s += `<g class="sl-scroll" transform="translate(${r(px)} ${r(py)}) scale(${k.toFixed(3)})"><ellipse rx="54" ry="40" fill="${PINK}" opacity="0.16"/>
    <rect x="-26" y="-18" width="52" height="34" rx="3" fill="#efe6d0"/><rect x="-30" y="-22" width="8" height="42" rx="4" fill="#c9a678"/><rect x="22" y="-22" width="8" height="42" rx="4" fill="#c9a678"/>
    ${neon("M-14 -4 h10 M-9 -9 v10 M4 -6 L14 4 M4 4 L14 -6", PINK, 1.4)}</g>`;
  add(s, { spot: "gacha", title: "Altar: invocar criatures amb pergamins", hit: bbox([[-1.25, 0, z - 0.6], [1.25, 0, z + 0.6], [0, 1.5, z]]) });
}

// ---------------------------------------------------------------- estudiant (dreta, davant): els artefactes que porta
{
  const [sx, sy] = P(1.9, 0, 2.4), k = cam.scale(2.4) / 100;
  const rug = ellipseOnFloor(1.9, 2.4, 0.55, 0.28);
  add(`<path d="${rug}" fill="#2a2235"/>${neon(rug, GOLD, 1.6)}<g transform="translate(${r(sx)} ${r(sy)}) scale(${k.toFixed(3)})"><g transform="translate(-50 -108)">%STUDENT%</g></g>`,
    { spot: "student", title: "Estudiant: artefactes", hit: [r(sx - 60 * k), r(sy - 115 * k), r(120 * k), r(120 * k)] });
}

// ---------------------------------------------------------------- definicions
const defs = `${cam.defs}
  <linearGradient id="sl-wall-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121628"/><stop offset="1" stop-color="#1b1f36"/></linearGradient>
  <linearGradient id="sl-wall-l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d1020"/><stop offset="1" stop-color="#161a30"/></linearGradient>
  <linearGradient id="sl-wall-r" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#0d1020"/><stop offset="1" stop-color="#161a30"/></linearGradient>
  <linearGradient id="sl-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14111f"/><stop offset="1" stop-color="#1d1830"/></linearGradient>
  <linearGradient id="sl-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0f2a"/><stop offset="1" stop-color="#2a1f5a"/></linearGradient>
  <linearGradient id="sl-door" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a3322"/><stop offset="1" stop-color="#5a3f2a"/></linearGradient>
  <linearGradient id="sl-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4a32"/><stop offset="1" stop-color="#7a5a3a"/></linearGradient>
  <radialGradient id="sl-portal"><stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/><stop offset="0.25" stop-color="#b48cff"/><stop offset="0.7" stop-color="#3a1f8a"/><stop offset="1" stop-color="#120a30"/></radialGradient>
  <radialGradient id="sl-portal-glow"><stop offset="0" stop-color="#9d8bff" stop-opacity="0.35"/><stop offset="1" stop-color="#9d8bff" stop-opacity="0"/></radialGradient>
  <radialGradient id="sl-vignette" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></radialGradient>`;
add(`<rect width="1600" height="900" fill="url(#sl-vignette)" pointer-events="none"/>`);

const out = `// GENERAT per tools/sala-estudi.js (no l'edites a mà: canvia l'escena allà i torna a executar-lo)
// Capes de la sala d'estudi (del fons cap al davant). Les capes amb \`spot\` són punts interactius (js/td/lobby.js).
// %STUDENT% es substituïx pel dibuix de l'estudiant.
const TD_LOBBY_ART = ${JSON.stringify({ defs, layers }, null, 0)};
`;
fs.writeFileSync(path.join(__dirname, "..", "js", "data", "td-lobby-art.js"), out);
const pi = process.argv.indexOf("--preview");
if (pi > 0) fs.writeFileSync(process.argv[pi + 1], `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs>${defs}</defs>${layers.map(l => l.svg.replace("%STUDENT%", '<rect width="100" height="108" fill="#3fdc8a" opacity="0.4"/>')).join("")}</svg>`);
console.log(`js/data/td-lobby-art.js: ${layers.length} capes, ${(out.length / 1024).toFixed(0)} KB`);
