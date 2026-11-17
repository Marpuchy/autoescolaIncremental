#!/usr/bin/env node
// ===== SALA D'ESTUDI (generador) =====
// La sala del joc d'estudi (s'hi entra per la motxilla de l'habitació): una sala arcana fosca, amb traços de neó com les
// criatures. Escriu js/data/td-lobby-art.js, que pinta js/td/lobby.js. Ús: node tools/sala-estudi.js [--preview fitxer.svg]
// Sala: 9 m d'ample (x de -4.5 a 4.5), 4,5 m d'alt i 9 m de fons. Càmera a 1,7 m.
// Punts: portal (mons), altar (invocar), prestatgeria (apuntar l'estudi), grimori (criatures i equip), faristol (bestiari),
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

// Llibre obert en perspectiva damunt d'un faristol inclinat (mides reals: cada pàgina 24 × 33 cm).
// Pla del faristol: u d'esquerra a dreta (0-1), v de baix a dalt (0-1), inclinat `tilt` graus cap a la càmera.
function lectern({ x, z, top = 1.0, w = 0.62, h = 0.44, tilt = 32, wood = "#2a2235", woodSide = "#221c2c", woodTop = "#3a3050" }) {
  const t = tilt * Math.PI / 180;
  const plane = (u, v, lift = 0) => [x + (u - 0.5) * w, top + v * h * Math.sin(t) + lift, z - h * Math.cos(t) / 2 + v * h * Math.cos(t)];
  let s = shadow({ x0: x - 0.2, x1: x + 0.2, z0: z - 0.15, z1: z + 0.15 }, 0.12, 0.35);
  s += box({ x0: x - 0.06, x1: x + 0.06, y0: 0, y1: top, z0: z - 0.05, z1: z + 0.07 }, { front: wood, side: woodSide });
  s += box({ x0: x - 0.22, x1: x + 0.22, y0: 0, y1: 0.05, z0: z - 0.18, z1: z + 0.18 }, { front: wood, side: woodSide, top: woodTop });
  s += poly([plane(0, 0, -0.02), plane(1, 0, -0.02), plane(1, 1, -0.02), plane(0, 1, -0.02)], `fill="${woodTop}"`);
  s += poly([plane(0, 0, -0.02), plane(1, 0, -0.02), plane(1, 0, -0.06), plane(0, 0, -0.06)], `fill="${wood}"`);
  return { svg: s, plane };
}
function openBook(plane, { cover, page, line: lc, spine = "#00000055", lines = [7, 7], ink = [] }) {
  // el llibre ocupa el centre del faristol: 0,50 m × 0,33 m de pàgines, amb la coberta 1 cm més gran
  const bu = u => 0.1 + u * 0.8, bv = v => 0.12 + v * 0.75;
  let s = poly([plane(bu(-0.02), bv(-0.03)), plane(bu(1.02), bv(-0.03)), plane(bu(1.02), bv(1.03)), plane(bu(-0.02), bv(1.03))], `fill="${cover}"`);
  // gruix de les fulles (davall de cada pàgina) i les dues pàgines, una mica corbades cap al llom
  for (const [a, b] of [[0, 0.495], [0.505, 1]]) {
    const outer = a === 0 ? 0 : 1;
    s += poly([plane(bu(a), bv(0), 0.004), plane(bu(b), bv(0), 0.004), plane(bu(b), bv(0), 0.016), plane(bu(a), bv(0), 0.016)], `fill="${lc}" opacity="0.6"`);
    const lift = u => (Math.abs(u - outer) < 0.01 ? 0.012 : 0.02);
    s += poly([plane(bu(a), bv(0), lift(a)), plane(bu(b), bv(0), lift(b)), plane(bu(b), bv(1), lift(b)), plane(bu(a), bv(1), lift(a))], `fill="${page}"`);
    for (let i = 0; i < lines[a === 0 ? 0 : 1]; i++) {
      const v = 0.8 - i * 0.1, len = i % 3 === 2 ? 0.6 : 0.85;
      const u0 = a + 0.06, u1 = a + 0.06 + (b - a - 0.12) * len;
      s += line(plane(bu(u0), bv(v), 0.021), plane(bu(u1), bv(v), 0.021), `stroke="${lc}" stroke-width="1.6" opacity="0.7"`);
    }
  }
  s += line(plane(bu(0.5), bv(0), 0.02), plane(bu(0.5), bv(1), 0.02), `stroke="${spine}" stroke-width="3"`);
  // dibuixos a tinta: [color, gruix, [[u, v], ...]] (u de 0 a 1 en tota la doble pàgina, v de baix a dalt)
  for (const [c, w, pts] of ink) s += `<polyline points="${pts.map(([u, v]) => P(...plane(bu(u), bv(v), 0.022)).map(r).join(",")).join(" ")}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return s;
}

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
    s += `<g class="sl-candle" transform="translate(${r(px)} ${r(py)}) scale(${k.toFixed(3)})"><g class="sl-candle-in" style="animation-delay:${(-(x * 7 + z) % 4).toFixed(1)}s">
      <ellipse cx="0" cy="-26" rx="22" ry="26" fill="#ffd27a" opacity="0.12"/><rect x="-5" y="-14" width="10" height="26" rx="2" fill="#efe6d0"/>
      <path d="M-5 -12 q3 4 0 8" stroke="#d8ccb0" stroke-width="1.5" fill="none"/>
      <path class="sl-flame" d="M0 -26 C5 -20 4 -15 0 -13 C-4 -15 -5 -20 0 -26 Z" fill="#ffd27a"/></g></g>`;
  }
  // candelers de ferro a les parets laterals, amb una espelma cadascun
  for (const [sx, z] of [[-1, 5.8], [-1, 8.5], [1, 3.2], [1, 5.9], [1, 8.4]]) {
    const [px, py] = P(sx * W, 2.55, z), k = cam.scale(z) / 120, m = -sx; // m: cap a on ix de la paret
    s += `<g transform="translate(${r(px)} ${r(py)}) scale(${k.toFixed(3)})">
      <ellipse cx="${m * 14}" cy="-34" rx="30" ry="34" fill="#ffd27a" opacity="0.1"/>
      <rect x="-3" y="-6" width="6" height="22" rx="2" fill="#2a2f45"/>
      <path d="M0 8 Q${m * 14} 8 ${m * 16} -4" stroke="#3a4060" stroke-width="4" fill="none" stroke-linecap="round"/>
      <ellipse cx="${m * 16}" cy="-4" rx="9" ry="3" fill="#3a4060"/>
      <rect x="${m * 16 - 4}" y="-22" width="8" height="18" rx="1.5" fill="#efe6d0"/>
      <path class="sl-flame" style="animation-delay:-${(z % 1).toFixed(2)}s" d="M${m * 16} -34 C${m * 16 + 4} -29 ${m * 16 + 3} -25 ${m * 16} -23 C${m * 16 - 3} -25 ${m * 16 - 4} -29 ${m * 16} -34 Z" fill="#ffd27a"/></g>`;
  }
  add(s);
}

// ---------------------------------------------------------------- planta (racó del fons, a l'esquerra): llengua de sogra en un test de fang
{
  let s = "";
  const x = -3.9, z = 8.4, rad = 0.2, h = 0.42;
  const ring = y => Array.from({ length: 33 }, (_, i) => { const a = i / 32 * Math.PI * 2; return P(x + Math.cos(a) * rad, y, z + Math.sin(a) * rad); });
  const top = ring(h), bot = ring(0).map(([px, py]) => [px, py]);
  const xs = top.map(p => p[0]), lx = Math.min(...xs), rx = Math.max(...xs);
  const [, ty] = P(x, h, z), [, by] = P(x, 0, z), half = (rx - lx) / 2, cx = (lx + rx) / 2;
  s += `<ellipse cx="${r(cx)}" cy="${r(by + 2)}" rx="${r(half * 1.2)}" ry="${r(half * 0.3)}" fill="#000" opacity="0.3"/>`;
  s += `<path d="M${r(lx)} ${r(ty)} L${r(lx + half * 0.15)} ${r(by)} Q${r(cx)} ${r(by + half * 0.25)} ${r(rx - half * 0.15)} ${r(by)} L${r(rx)} ${r(ty)} Z" fill="#a8582e"/>`;
  s += `<path d="M${r(lx)} ${r(ty)} L${r(lx + half * 0.15)} ${r(by)} Q${r(cx - half * 0.4)} ${r(by + half * 0.2)} ${r(cx - half * 0.3)} ${r(by + half * 0.2)} L${r(cx - half * 0.35)} ${r(ty)} Z" fill="#8a4422" opacity="0.6"/>`;
  s += `<ellipse cx="${r(cx)}" cy="${r(ty)}" rx="${r(half * 1.08)}" ry="${r(half * 0.28)}" fill="#c06a38"/><ellipse cx="${r(cx)}" cy="${r(ty)}" rx="${r(half * 0.9)}" ry="${r(half * 0.2)}" fill="#3a2414"/>`;
  // fulles: llargues, punxegudes, verd fosc amb vora groguenca; cada una amb la seua inclinació
  const k = cam.scale(z) / 100;
  const leaves = [[-14, 120, -10], [-6, 150, -3], [4, 135, 4], [12, 112, 11], [-20, 92, -16], [18, 96, 17], [0, 104, 0]];
  s += `<g transform="translate(${r(cx)} ${r(ty)}) scale(${k.toFixed(3)})">${leaves.map(([dx, len, lean]) => {
    const tipX = dx + lean * 1.6, w = 7;
    return `<path d="M${dx - w} 0 C${dx - w} ${-len * 0.4} ${tipX - 3} ${-len * 0.8} ${tipX} ${-len} C${tipX + 3} ${-len * 0.8} ${dx + w} ${-len * 0.4} ${dx + w} 0 Z" fill="#2e6a3a" stroke="#c9c46a" stroke-width="1.6"/>
      <path d="M${dx - 3} ${-len * 0.25} q4 -6 7 0 M${dx - 3} ${-len * 0.5} q4 -6 6 0" stroke="#4a9a5a" stroke-width="1.6" fill="none"/>`; }).join("")}</g>`;
  add(s);
}

// ---------------------------------------------------------------- catifes: de la porta cap a dins, davall del cercle d'invocació i als peus dels faristols
const rugSvg = (X0, X1, Z0, Z1, { base = "#3a1830", inner = "#4a1f3e", line = GOLD, fringe = "z" } = {}) => {
  const y = 0.004, pts = a => a.map(([x, z]) => P(x, y, z).map(r).join(",")).join(" ");
  let t = `<polygon points="${pts([[X0, Z0], [X1, Z0], [X1, Z1], [X0, Z1]])}" fill="${base}"/>`;
  const m = Math.min(X1 - X0, Z1 - Z0) * 0.09;
  t += `<polygon points="${pts([[X0 + m, Z0 + m], [X1 - m, Z0 + m], [X1 - m, Z1 - m], [X0 + m, Z1 - m]])}" fill="${inner}" stroke="${line}" stroke-width="1.6" opacity="0.95"/>`;
  const n = 12;
  for (let i = 0; i <= n; i++) {
    if (fringe === "z") { const xx = X0 + 0.02 + i * (X1 - X0 - 0.04) / n; for (const [za, zb] of [[Z0, Z0 - 0.05], [Z1, Z1 + 0.05]]) { const [a, b] = P(xx, y, za), [c, d] = P(xx, y, zb); t += `<line x1="${r(a)}" y1="${r(b)}" x2="${r(c)}" y2="${r(d)}" stroke="#e8c98a" stroke-width="1.4"/>`; } }
    else { const zz = Z0 + 0.02 + i * (Z1 - Z0 - 0.04) / n; for (const [xa, xb] of [[X1, X1 + 0.05]]) { const [a, b] = P(xa, y, zz), [c, d] = P(xb, y, zz); t += `<line x1="${r(a)}" y1="${r(b)}" x2="${r(c)}" y2="${r(d)}" stroke="#e8c98a" stroke-width="1.4"/>`; } }
  }
  return t;
};
add(rugSvg(-W + 0.02, -2.6, 6.75, 7.65, { base: "#1f2a4a", inner: "#2a3a66", line: CYAN, fringe: "x" })   // davant de la porta, cap a dins
  + rugSvg(-1.7, 1.7, 3.45, 5.15, { base: "#2a1636", inner: "#341c44", line: PINK })                     // davall del cercle d'invocació
  + rugSvg(-2.65, -1.75, 1.75, 2.75, { base: "#241a3a", inner: "#2e2250", line: V })                     // als peus del grimori
  + rugSvg(3.25, 4.15, 4.05, 5.05, { base: "#2a1416", inner: "#3a1a1c", line: RED }));                  // als peus del bestiari

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
  // el cartell va pla damunt de la paret: el dibuix (68 × 28) es projecta sobre el pla de la paret
  const sp = (u, v) => P(...df(u, v));
  const SIGN = `<g transform="translate(34 14)"><rect x="-34" y="-14" width="68" height="28" rx="3" fill="#1e9e4a" stroke="#fff" stroke-width="1.5"/>
    <path d="M-26 0 H-12 M-17 -6 L-11 0 L-17 6" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="12" y="-10" width="14" height="20" fill="none" stroke="#fff" stroke-width="2.4"/><circle cx="2" cy="-6" r="3" fill="#fff"/>
    <path d="M1 -2 L-1 6 M-1 2 L-5 4 M1 0 L6 2" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`;
  s += `<g transform="${cam.affine(sp(0.12, -0.2), sp(0.88, -0.2), sp(0.12, -0.06), 68, 28)}">${SIGN}</g>`;
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
    <g class="sl-bob">%CRYSTAL%</g></g>`;
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
    // llibres de 3 a 5 cm de gruix i 24-30 cm d'alt (la balda fa 2,4 m de llarg i 0,64 m d'alt)
    let u = 0.04;
    for (let i = 0; u < 0.93; i++) {
      const th = 0.014 + ((i * 7 + row * 5) % 4) * 0.004, hh = 0.13 + ((i * 5 + row * 3) % 5) * 0.012;
      const c = ["#5a43d6", "#1f9e5c", "#8a2a4a", "#2f6fc0", "#a37a2a", "#3a4a8e"][(i * 3 + row) % 6];
      if ((i + row) % 9 !== 8) s += quad(sf, u, v0 + 0.2 - hh, u + th, v0 + 0.2, `fill="${c}"`);
      u += th + 0.002;
    }
  }
  // un pergamí desplegat que penja de la segona balda, damunt del pla de la prestatgeria (en perspectiva) i brilla
  const pu0 = 0.42, pu1 = 0.62, pv0 = 0.27, pv1 = 0.47; // u: al llarg de la paret · v: de dalt a baix
  s += poly([sf(pu0 - 0.05, pv0 - 0.05), sf(pu1 + 0.05, pv0 - 0.05), sf(pu1 + 0.05, pv1 + 0.06), sf(pu0 - 0.05, pv1 + 0.06)], `fill="${G}" opacity="0.18" filter="url(#pv-soft)"`);
  s += quad(sf, pu0, pv0, pu1, pv1, `fill="#efe6d0"`);
  s += quad(sf, pu0 - 0.008, pv0 - 0.012, pu1 + 0.008, pv0 + 0.012, `fill="#c9a678"`); // vareta de dalt
  s += quad(sf, pu0 - 0.008, pv1 - 0.012, pu1 + 0.008, pv1 + 0.012, `fill="#c9a678"`); // vareta de baix
  for (let i = 0; i < 5; i++) {
    const v = pv0 + 0.045 + i * 0.03, len = i % 2 ? 0.7 : 0.9;
    s += line(sf(pu0 + 0.025, v), sf(pu0 + 0.025 + (pu1 - pu0 - 0.05) * len, v), `stroke="#1f9e5c" stroke-width="1.6"`);
  }
  s += line(sf(pu1 - 0.04, pv1 - 0.04), sf(pu1 - 0.015, pv1 - 0.065), `stroke="#1f9e5c" stroke-width="2.2"`); // un ✓
  s += line(sf(pu1 - 0.055, pv1 - 0.055), sf(pu1 - 0.04, pv1 - 0.04), `stroke="#1f9e5c" stroke-width="2.2"`);
  add(s, { spot: "study", title: "Prestatgeria: apuntar el que has estudiat (pergamins d'invocació)", hit: bbox(corners(shB)) });
}

// ---------------------------------------------------------------- grimori de les criatures (esquerra, davant), damunt d'un faristol
{
  let g = "";
  const gl = lectern({ x: -2.2, z: 2.3, top: 0.95 });
  g += gl.svg;
  const [gx, gy] = P(-2.2, 1.2, 2.3), gk = cam.scale(2.3) / 100;
  g += `<ellipse cx="${r(gx)}" cy="${r(gy)}" rx="${r(62 * gk)}" ry="${r(34 * gk)}" fill="${V}" opacity="0.16"/>`;
  // a la pàgina de l'esquerra, el + d'una criatura dibuixat a tinta; a la dreta, el text
  g += openBook(gl.plane, { cover: "#3a2a7a", page: "#efe6d0", line: "#8a80c8", lines: [2, 7], ink: [
    ["#5a43d6", 3, [[0.25, 0.78], [0.25, 0.38]]], ["#5a43d6", 3, [[0.13, 0.58], [0.37, 0.58]]],
    ["#8a80c8", 2, [[0.1, 0.83], [0.16, 0.83]]], ["#8a80c8", 2, [[0.13, 0.8], [0.13, 0.86]]], ["#8a80c8", 2, [[0.34, 0.83], [0.4, 0.83]]], ["#8a80c8", 2, [[0.37, 0.8], [0.37, 0.86]]]] });
  g += `<g class="sl-float" transform="translate(${r(gx)} ${r(gy - 34 * gk)}) scale(${gk.toFixed(3)})" font-family="ui-monospace, monospace" font-weight="700" font-size="13">
    <text class="sl-glyph" x="-22" y="-4" fill="${V}">+</text><text class="sl-glyph" x="2" y="-12" fill="${G}">;</text><text class="sl-glyph" x="20" y="-2" fill="${V}">λ</text></g>`;
  add(g, { spot: "grimori", title: "Grimori: les teues criatures i l'equip", hit: bbox([[-2.5, 0, 2.1], [-1.9, 0, 2.5], [-2.2, 1.65, 2.3]]) });
}

// ---------------------------------------------------------------- faristol del bestiari (dreta)
{
  let s = "";
  const bl = lectern({ x: 3.7, z: 4.6, top: 0.95 });
  s += bl.svg;
  const [bx, by] = P(3.7, 1.2, 4.6), bk = cam.scale(4.6) / 100;
  s += `<ellipse cx="${r(bx)}" cy="${r(by)}" rx="${r(66 * bk)}" ry="${r(36 * bk)}" fill="${RED}" opacity="0.14"/>`;
  // a la pàgina dreta, la Notificació dibuixada a tinta (campana amb el «1»); a l'esquerra, les notes
  s += openBook(bl.plane, { cover: "#3a1414", page: "#c9b48e", line: "#7a2a22", lines: [7, 1], ink: [
    ["#5a2a1a", 2.4, [[0.64, 0.3], [0.67, 0.42], [0.67, 0.6], [0.7, 0.72], [0.75, 0.76], [0.8, 0.72], [0.83, 0.6], [0.83, 0.42], [0.86, 0.3], [0.64, 0.3]]],
    ["#5a2a1a", 2.4, [[0.72, 0.24], [0.75, 0.21], [0.78, 0.24]]],
    ["#a8321e", 2.4, [[0.87, 0.78], [0.9, 0.82], [0.87, 0.86], [0.84, 0.82], [0.87, 0.78]]] ] });
  add(s, { spot: "bestiary", title: "Bestiari: les distraccions que has vist", hit: bbox([[3.45, 0, 4.4], [3.95, 0, 4.8], [3.7, 1.6, 4.6]]) });
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
  // pergamí d'invocació que sura: paper vell desplegat entre dos rotlles de fusta amb poms, un cercle
  // d'invocació dibuixat a tinta que brilla i un segell de cera que el tanca per baix
  const sc = [];
  sc.push(`<ellipse rx="64" ry="46" fill="${PINK}" opacity="0.13"/>`);
  sc.push(`<path d="M-30 -24 Q-8 -28 30 -24 L30 22 Q8 26 -30 22 Z" fill="#e9dcbc" stroke="#b89a6a" stroke-width="1.2"/>`); // paper, una mica corbat
  sc.push(`<path d="M-30 -24 Q-8 -28 30 -24 L30 -16 Q8 -20 -30 -16 Z" fill="#d6c49c" opacity="0.7"/>`); // ombra del rotlle de dalt
  sc.push(`<g fill="none" stroke="#a88a5a" stroke-width="0.8" opacity="0.6"><path d="M-24 14 h14 M-24 18 h10 M12 14 h12 M16 18 h8"/></g>`); // línies d'escriptura
  sc.push(`<circle cy="-2" r="11" fill="none" stroke="${PINK}" stroke-width="1.2" opacity="0.9"/><circle cy="-2" r="7" fill="none" stroke="${PINK}" stroke-width="0.8" opacity="0.7"/>`);
  sc.push(`<path d="M0 -13 L9.5 3.5 L-9.5 3.5 Z M0 9 L9.5 -7.5 L-9.5 -7.5 Z" fill="none" stroke="${PINK}" stroke-width="0.9" opacity="0.85"/>`); // estrela de sis puntes
  // el paper (tot menys el halo) es plega cap al centre mentre els rotlles s'ajunten: s'obri i es tanca
  const halo = sc.shift(), paper = sc.join("");
  const roll = yy => `<rect x="-34" y="${yy - 4}" width="68" height="8" rx="4" fill="#8a5a32"/><rect x="-34" y="${yy - 4}" width="68" height="3" rx="1.5" fill="#b07a4a" opacity="0.8"/>
    <circle cx="-36" cy="${yy}" r="4.5" fill="${GOLD}"/><circle cx="36" cy="${yy}" r="4.5" fill="${GOLD}"/>`;
  const seal = `<path d="M-4 22 L-6 34 L0 30 L6 34 L4 22" fill="#9a1f2e"/><circle cy="22" r="6" fill="#b52a3a" stroke="#7a1420" stroke-width="1.2"/><text y="24.5" font-size="7" font-weight="900" text-anchor="middle" fill="#ffd0d6" font-family="Georgia, serif">Σ</text>`;
  s += `<g class="sl-scroll" transform="translate(${r(px)} ${r(py)}) scale(${k.toFixed(3)})"><g class="sl-bob">${halo}<g transform="rotate(-6)">
    <g class="sl-paper">${paper}</g><g class="sl-roll-t">${roll(-26)}</g><g class="sl-roll-b">${roll(24)}${seal}</g></g></g></g>`;
  add(s, { spot: "gacha", title: "Altar: invocar criatures amb pergamins", hit: bbox([[-1.25, 0, z - 0.6], [1.25, 0, z + 0.6], [0, 1.5, z]]) });
}

// ---------------------------------------------------------------- decoració: estendards a la paret, planta i piles de llibres
{
  let s = "";
  // dos estendards de tela que pengen d'una barra, entre les finestres i el portal
  for (const [bx, c, glyph] of [[-2.08, V, "Σ"], [2.08, G, "{ }"]]) {
    const y0 = 3.55, y1 = 2.05, hw = 0.32, zb = BACK - 0.01;
    const [ax, ay] = P(bx - hw, y0, zb), [cx, cy] = P(bx + hw, y1, zb), [mx, my] = P(bx, y1 - 0.18, zb);
    s += `<rect x="${r(ax - 8)}" y="${r(ay - 6)}" width="${r(cx - ax + 16)}" height="6" rx="3" fill="#c9a678"/>`;
    s += `<path d="M${r(ax)} ${r(ay)} H${r(cx)} V${r(cy)} L${r(mx)} ${r(my)} L${r(ax)} ${r(cy)} Z" fill="#241a3a" stroke="${c}" stroke-width="2"/>`;
    s += `<path d="M${r(ax + 6)} ${r(ay + 6)} H${r(cx - 6)} V${r(cy - 4)} L${r(mx)} ${r(my - 9)} L${r(ax + 6)} ${r(cy - 4)} Z" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.6"/>`;
    s += `<text x="${r(mx)}" y="${r((ay + cy) / 2 + 12)}" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-weight="700" fill="${c}" opacity="0.9">${glyph}</text>`;
  }
  // piles de llibres a terra, al costat de la prestatgeria (llibres de 4-6 cm de gruix)
  for (const [x, z, n] of [[-3.55, 3.3, 4], [-3.2, 2.15, 3]]) {
    let y = 0;
    for (let i = 0; i < n; i++) {
      const th = 0.055, w = 0.3, d = 0.21, dx = (i % 2 ? 1 : -1) * 0.012; // llibres de la mateixa mida, apilats una mica desplaçats
      const c = ["#8a2a4a", "#2f6fc0", "#1f9e5c", "#a37a2a", "#5a43d6"][(i + n) % 5];
      s += box({ x0: x - w / 2 + dx, x1: x + w / 2 + dx, y0: y, y1: y + th, z0: z - d / 2, z1: z + d / 2 },
        { front: c, side: "#efe6d0", top: c });
      y += th;
    }
  }
  add(s);
}

// ---------------------------------------------------------------- estudiant (dreta, davant): els artefactes que porta
{
  // catifa rectangular amb vora, rombe al centre i serrell davant; l'estudiant hi trepitja de veritat
  const X0 = 1.35, X1 = 2.45, Z0 = 2.0, Z1 = 2.85, y = 0.006;
  const fl = (x, z) => P(x, y, z), pts = a => a.map(p => p.map(r).join(",")).join(" ");
  let rug = `<polygon points="${pts([fl(X0, Z0), fl(X1, Z0), fl(X1, Z1), fl(X0, Z1)])}" fill="#5a1f3a"/>`;
  rug += `<polygon points="${pts([fl(X0 + 0.07, Z0 + 0.06), fl(X1 - 0.07, Z0 + 0.06), fl(X1 - 0.07, Z1 - 0.06), fl(X0 + 0.07, Z1 - 0.06)])}" fill="#3a1830" stroke="${GOLD}" stroke-width="2"/>`;
  const cxr = (X0 + X1) / 2, czr = (Z0 + Z1) / 2;
  rug += `<polygon points="${pts([fl(cxr, Z0 + 0.14), fl(X1 - 0.2, czr), fl(cxr, Z1 - 0.14), fl(X0 + 0.2, czr)])}" fill="none" stroke="${PINK}" stroke-width="2" opacity="0.8"/>`;
  rug += `<polygon points="${pts([fl(cxr, Z0 + 0.25), fl(X1 - 0.38, czr), fl(cxr, Z1 - 0.25), fl(X0 + 0.38, czr)])}" fill="${GOLD}" opacity="0.25"/>`;
  for (let i = 0; i <= 14; i++) { // serrell
    const x = X0 + 0.03 + i * (X1 - X0 - 0.06) / 14, [ax, ay] = fl(x, Z0), [bx, by] = fl(x, Z0 - 0.05);
    rug += `<line x1="${r(ax)}" y1="${r(ay)}" x2="${r(bx)}" y2="${r(by)}" stroke="#e8c98a" stroke-width="1.6"/>`;
  }
  const [sx, sy] = P(1.9, 0, 2.4), k = cam.scale(2.4) / 100;
  // ombra de contacte als peus; el dibuix (viewBox -4 -6 152 160 → 100 × 105) toca terra a la y 150
  rug += `<ellipse cx="${r(sx)}" cy="${r(sy)}" rx="${r(46 * k)}" ry="${r(10 * k)}" fill="#000" opacity="0.35"/>`;
  add(`${rug}<g transform="translate(${r(sx)} ${r(sy)}) scale(${k.toFixed(3)})"><g transform="translate(-50 -101)">%STUDENT%</g></g>`,
    { spot: "student", title: "Estudiant: artefactes", hit: [r(sx - 60 * k), r(sy - 112 * k), r(120 * k), r(120 * k)] });
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
  <radialGradient id="sl-vignette" gradientUnits="userSpaceOnUse" cx="800" cy="450" r="1150"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="0.8" stop-color="#000" stop-opacity="0.55"/></radialGradient>`;
add(`<rect x="-1600" y="-900" width="4800" height="2700" fill="url(#sl-vignette)" pointer-events="none"/>`); // també fora del viewBox: sense bandes

const out = `// GENERAT per tools/sala-estudi.js (no l'edites a mà: canvia l'escena allà i torna a executar-lo)
// Capes de la sala d'estudi (del fons cap al davant). Les capes amb \`spot\` són punts interactius (js/td/lobby.js).
// %STUDENT% es substituïx pel dibuix de l'estudiant i %CRYSTAL% pel cristall de les millores (s'encén amb elles).
const TD_LOBBY_ART = ${JSON.stringify({ defs, layers }, null, 0)};
`;
fs.writeFileSync(path.join(__dirname, "..", "js", "data", "td-lobby-art.js"), out);
const pi = process.argv.indexOf("--preview");
if (pi > 0) fs.writeFileSync(process.argv[pi + 1], `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs>${defs}</defs>${layers.map(l => l.svg.replace("%STUDENT%", '<rect width="100" height="108" fill="#3fdc8a" opacity="0.4"/>').replace("%CRYSTAL%", '<path d="M0 -50 L24 -10 L0 34 L-24 -10 Z" fill="#7fe8ff"/>')).join("")}</svg>`);
console.log(`js/data/td-lobby-art.js: ${layers.length} capes, ${(out.length / 1024).toFixed(0)} KB`);
