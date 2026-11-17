#!/usr/bin/env node
// ===== SALA DEL BOSC (generador) =====
// La sala d'estudi de Forestal (s'hi entra per la motxilla de l'habitació): l'interior d'un arbre gegant i buit. Parets
// d'escorça viva, terra de molsa amb un camí de pedres, arrels que ixen de les parets, lianes que pengen, bolets que
// brillen i cuques de llum. Té els mateixos punts que la sala d'Informàtica, però amb una altra distribució:
//   portal (arc de dos troncs entrellaçats, al fons a l'esquerra), jade (agafat per les arrels d'una soca, al fons a
//   la dreta), prestatgeria (lleixes tallades a la paret dreta), porta (paret esquerra, amb un rètol de fusta),
//   grimori i bestiari (faristols d'arrels, davant), altar (cercle de bolets al mig), estudiant (damunt d'una catifa de
//   molsa) i rellotge de sorra (damunt d'una soca, al fons).
// Escriu js/data/td-forest-art.js, que pinta js/td/lobby.js. Ús: node tools/sala-forestal.js [--preview fitxer.svg]
// Sala: 9 m d'ample (x de -4.5 a 4.5), 4,6 m d'alt i 9 m de fons. Càmera a 1,7 m.
const fs = require("fs"), path = require("path");
const { camera, r } = require("./perspectiva");

const cam = camera({ cx: 800, cy: 380, eye: 1.7, d: 4, f: 1500 });
const { P, poly, box, face, quad, shadow, line, bbox, corners } = cam;
const W = 4.5, H = 4.6, BACK = 9, ZF = -2; // ZF: les superfícies continuen per darrere de la càmera (sense bandes)
const layers = [];
const add = (svg, spot) => layers.push({ svg, ...(spot || {}) });
const pt = p => P(...p).map(r).join(" ");
const path3 = (list, close = false) => "M" + list.map(pt).join(" L") + (close ? " Z" : "");

// colors del bosc
const BARK = "#4a3424", BARK_D = "#33231a", BARK_L = "#6a4a30", MOSS = "#3f6a2e", MOSS_L = "#5f8f3a", MOSS_D = "#2c4a22";
const LEAF = "#4f9a3a", LEAF_L = "#7cc04a", LEAF_D = "#2f6a2a", AMBER = "#ffc860", GLOW = "#b8ff7a", FLY = "#e8ff8a";

// cinta en 3D (arrels, branques, lianes): passa per una llista de punts amb un gruix en metres, que s'aprima
function ribbon(points, w0, w1, fill, attrs = "") {
  const n = points.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = points[Math.max(0, i - 1)], b = points[Math.min(n - 1, i + 1)];
    const [ax, ay] = P(...a), [bx, by] = P(...b), [px, py] = P(...points[i]);
    let dx = bx - ax, dy = by - ay; const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
    const w = (w0 + (w1 - w0) * i / (n - 1)) * cam.scale(points[i][2]) / 2;
    L.push([px - dy * w, py + dx * w]); R.push([px + dy * w, py - dx * w]);
  }
  return `<path d="M${[...L, ...R.reverse()].map(p => p.map(r).join(" ")).join(" L")} Z" fill="${fill}" ${attrs}/>`;
}
// corba suau (Catmull-Rom) entre punts de control 3D
function curve(ctrl, steps = 10) {
  const out = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map(k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}
// el·lipse damunt del terra (o a una altura y)
const ringPts = (x, y, z, rx, rz, n = 36) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return [x + Math.cos(a) * rx, y, z + Math.sin(a) * rz]; });
const floorEllipse = (x, z, rx, rz, attrs, y = 0.004) => poly(ringPts(x, y, z, rx, rz), attrs);
// soca o cilindre vertical: cos (el contorn de davant) i tapa
function stump(x, z, rad, h, { side = BARK, top = "#c9a070", ring = "#8a6a40" } = {}) {
  const topR = ringPts(x, h, z, rad, rad), botR = ringPts(x, 0, z, rad, rad);
  const scr = topR.map(p => P(...p)), xs = scr.map(p => p[0]);
  const iL = xs.indexOf(Math.min(...xs)), iR = xs.indexOf(Math.max(...xs));
  const front = []; // la meitat de davant (z menor) del contorn de baix i de dalt
  for (let i = iR; ; i = (i + 1) % topR.length) { front.push(botR[i]); if (i === iL) break; }
  let s = `<path d="${path3([topR[iL], ...front.reverse(), topR[iR]])} Z" fill="${side}"/>`;
  s += poly(topR, `fill="${top}"`);
  s += poly(ringPts(x, h + 0.001, z, rad * 0.62, rad * 0.62), `fill="none" stroke="${ring}" stroke-width="1.5"`);
  s += poly(ringPts(x, h + 0.001, z, rad * 0.3, rad * 0.3), `fill="none" stroke="${ring}" stroke-width="1.2"`);
  // estries de l'escorça
  for (let k = 0; k < 7; k++) { const a = Math.PI * (0.1 + k * 0.13); s += line([x - Math.cos(a) * rad, h * 0.95, z - Math.sin(a) * rad], [x - Math.cos(a) * rad * 1.02, 0.02, z - Math.sin(a) * rad * 1.02], `stroke="${BARK_D}" stroke-width="1.6" opacity="0.7"`); }
  return s;
}
// fulla (pantalla): centre, mida, angle i color
const leaf = (x, y, s, rot, c = LEAF, vein = LEAF_D) => `<g transform="translate(${r(x)} ${r(y)}) rotate(${r(rot)}) scale(${(s / 10).toFixed(2)})"><path d="M0 0 C4 -4 4 -12 0 -16 C-4 -12 -4 -4 0 0 Z" fill="${c}"/><path d="M0 -1 V-15" stroke="${vein}" stroke-width="0.8"/></g>`;
// bolet que brilla (pantalla)
const mushroom = (x, y, s, c = "#e8f8a0", stem = "#efe6d0") => `<g transform="translate(${r(x)} ${r(y)}) scale(${(s / 10).toFixed(2)})"><ellipse cy="-6" rx="10" ry="8" fill="${c}" opacity="0.18"/><path d="M-1.6 0 Q-2 -4 -1.2 -6 H1.2 Q2 -4 1.6 0 Z" fill="${stem}"/><path d="M-6 -6 Q-5 -12 0 -12 Q5 -12 6 -6 Z" fill="${c}"/><circle cx="-2" cy="-9" r="0.9" fill="#fff" opacity="0.8"/><circle cx="2.4" cy="-8" r="0.6" fill="#fff" opacity="0.8"/></g>`;
const fern = (x, y, s, flip = 1) => { // falguera: fulles corbades amb folíols
  let t = `<g transform="translate(${r(x)} ${r(y)}) scale(${(flip * s / 10).toFixed(2)} ${(s / 10).toFixed(2)})">`;
  for (const [a, len] of [[-70, 18], [-45, 22], [-20, 24], [10, 22], [35, 18]]) {
    const rad = a * Math.PI / 180, ex = Math.sin(rad) * len, ey = -Math.cos(rad) * len;
    t += `<path d="M0 0 Q${r(ex * 0.3)} ${r(ey * 0.7)} ${r(ex)} ${r(ey)}" stroke="${LEAF_D}" stroke-width="1" fill="none"/>`;
    for (let k = 1; k < 6; k++) { const f = k / 6, px = ex * f * (0.6 + 0.4 * f), py = ey * f; t += `<ellipse cx="${r(px)}" cy="${r(py)}" rx="${r(2.6 * (1 - f * 0.5))}" ry="1.1" transform="rotate(${r(a - 60)} ${r(px)} ${r(py)})" fill="${k % 2 ? LEAF : LEAF_L}"/>`; }
  }
  return t + "</g>";
};

// ---------------------------------------------------------------- l'arbre per dins: escorça, sostre de branques, terra de molsa
{
  let s = "";
  s += poly([[-W, H, ZF], [W, H, ZF], [W, H, BACK], [-W, H, BACK]], `fill="url(#fo-ceil)"`);
  s += poly([[-W, 0, ZF], [-W, 0, BACK], [-W, H, BACK], [-W, H, ZF]], `fill="url(#fo-wall-l)"`);
  s += poly([[W, 0, ZF], [W, 0, BACK], [W, H, BACK], [W, H, ZF]], `fill="url(#fo-wall-r)"`);
  s += poly([[-W, 0, BACK], [W, 0, BACK], [W, H, BACK], [-W, H, BACK]], `fill="url(#fo-wall-b)"`);
  // veta de l'escorça: línies ondulades verticals a les tres parets
  let g = "";
  for (let i = 0; i <= 26; i++) {
    const x = -W + i * (2 * W / 26), wob = k => Math.sin(i * 1.7 + k * 1.3) * 0.08;
    g += `<path d="${path3([0, 1, 2, 3, 4, 5].map(k => [x + wob(k), k * H / 5, BACK]))}" fill="none"/>`;
  }
  for (const sx of [-1, 1]) for (let i = 0; i <= 16; i++) {
    const z = 0.2 + i * (BACK - 0.2) / 16, wob = k => Math.sin(i * 2.1 + k) * 0.12;
    g += `<path d="${path3([0, 1, 2, 3, 4, 5].map(k => [sx * W, k * H / 5, z + wob(k)]))}" fill="none"/>`;
  }
  s += `<g stroke="${BARK_D}" stroke-width="2" opacity="0.55">${g}</g>`;
  // nusos de la fusta
  for (const [x, y] of [[-3.4, 3.6], [3.1, 1.2], [-1.8, 0.9], [3.6, 3.9]]) s += poly(ringPts(x, y, BACK - 0.005, 0.22, 0.001).map(([px, py]) => [px, py + 0.0, BACK]).map((p, i) => [p[0], y + Math.sin(i / 36 * Math.PI * 2) * 0.14, BACK]), `fill="${BARK_D}" stroke="${BARK_L}" stroke-width="2"`);
  // sostre: branques que es creuen
  for (const [a, b] of [[[-W, H, 1], [1.2, H, BACK]], [[W, H, 2], [-0.6, H, BACK]], [[-W, H, 5.5], [W, H, 7.5]]]) s += ribbon([a, b], 0.35, 0.18, BARK_D, `opacity="0.9"`);
  // terra de molsa amb clapes
  s += poly([[-W, 0, ZF], [W, 0, ZF], [W, 0, BACK], [-W, 0, BACK]], `fill="url(#fo-floor)"`);
  let m = "";
  for (let i = 0; i < 46; i++) { const x = -W + ((i * 0.618) % 1) * 2 * W, z = -0.5 + ((i * 0.414) % 1) * (BACK + 0.5); m += floorEllipse(x, z, 0.25 + (i % 4) * 0.12, 0.12 + (i % 3) * 0.05, `fill="${i % 3 ? MOSS_L : MOSS_D}" opacity="0.45"`); }
  s += m;
  add(s);
}

// ---------------------------------------------------------------- forat del fons: una obertura redona a l'escorça amb el bosc de fora i raigs de llum
{
  let s = "";
  const cx = 0.6, cy = 2.7, rx = 1.05, ry = 1.15;
  const hole = Array.from({ length: 40 }, (_, i) => { const a = i / 40 * Math.PI * 2; return [cx + Math.cos(a) * rx * (1 + Math.sin(a * 3) * 0.04), cy + Math.sin(a) * ry, BACK]; });
  s += `<path d="${path3(hole, true)}" fill="url(#fo-sky)"/>`;
  // arbres llunyans i boira
  const [hx, hy] = P(cx, cy, BACK), sc = cam.scale(BACK);
  s += `<clipPath id="fo-hole"><path d="${path3(hole, true)}"/></clipPath><g clip-path="url(#fo-hole)">`;
  for (let i = 0; i < 9; i++) { const tx = hx - rx * sc + i * rx * sc * 0.26, th = 60 + (i * 37) % 50; s += `<path d="M${r(tx)} ${r(hy + ry * sc)} L${r(tx)} ${r(hy + ry * sc * 0.25 - th * 0.2)} L${r(tx - 18)} ${r(hy + ry * sc * 0.3)} L${r(tx)} ${r(hy - th * 0.6)} L${r(tx + 18)} ${r(hy + ry * sc * 0.3)} Z" fill="${i % 2 ? "#2f5a3a" : "#3a6a44"}" opacity="0.9"/>`; }
  s += `<rect x="${r(hx - rx * sc)}" y="${r(hy + ry * sc * 0.35)}" width="${r(2 * rx * sc)}" height="${r(ry * sc)}" fill="#cfe8c8" opacity="0.35"/></g>`;
  // vora de l'escorça al voltant del forat
  s += `<path d="${path3(hole, true)}" fill="none" stroke="${BARK_L}" stroke-width="10"/><path d="${path3(hole, true)}" fill="none" stroke="${BARK_D}" stroke-width="3"/>`;
  // raigs de llum que entren cap al terra
  // raigs de llum: ixen del forat (de la meitat de baix) i s'esvaïxen abans d'arribar a terra
  s += `<g class="fo-rays">${[[-0.45, 0.16], [0.05, 0.12], [0.5, 0.18]].map(([dx, w]) => poly([[cx + dx - w, cy - 0.2, BACK], [cx + dx + w, cy - 0.2, BACK], [cx + dx * 1.8 + w * 2.6, 0, 5.4], [cx + dx * 1.8 - w * 2.6, 0, 5.4]], `fill="url(#fo-ray)"`)).join("")}</g>`;
  add(s);
}

// ---------------------------------------------------------------- arrels grosses que ixen de les cantonades i corren pel terra
{
  let s = "";
  for (const ctrl of [
    [[-W, 1.2, 8.6], [-W + 0.4, 0.2, 8.2], [-3.2, 0.03, 7.6], [-2.6, 0.02, 7.9]],
    [[W, 0.6, 8.7], [W - 0.4, 0.12, 8.5], [3.5, 0.03, 8.6], [3.0, 0.02, 8.8]],
    [[-W, 0.9, 1.4], [-W + 0.5, 0.1, 1.6], [-3.3, 0.03, 2.4], [-3.0, 0.02, 3.4]],
    [[W, 0.8, 1.6], [W - 0.4, 0.1, 1.8], [3.6, 0.03, 1.2]],
  ]) {
    const pts = curve(ctrl, 8);
    s += ribbon(pts, 0.42, 0.08, BARK) + ribbon(pts, 0.14, 0.03, BARK_L, `opacity="0.6"`);
  }
  add(s);
}

// ---------------------------------------------------------------- portal dels mons: dos troncs que s'entrellacen fent un arc, amb boira verda que gira
{
  let s = "";
  const x = -2.5, z = 7.7, w = 1.0, h = 2.9;
  const [cx, cy] = P(x, h * 0.48, z), sc = cam.scale(z), prx = w * 0.72 * sc, pry = h * 0.42 * sc;
  s += `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${r(prx * 1.5)}" ry="${r(pry * 1.25)}" fill="url(#fo-portal-glow)"/>`;
  s += `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${r(prx)}" ry="${r(pry)}" fill="url(#fo-portal)"/>`;
  s += `<g class="sl-swirl" style="transform-origin:${r(cx)}px ${r(cy)}px">${[0.8, 0.58, 0.36].map((k, i) => `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${r(prx * k)}" ry="${r(pry * k)}" fill="none" stroke="${i % 2 ? GLOW : "#7fe0a0"}" stroke-width="3" stroke-dasharray="${20 + i * 8} ${14 + i * 6}" opacity="0.7"/>`).join("")}</g>`;
  // els dos troncs: pugen pels costats i es creuen dalt
  for (const sx of [-1, 1]) {
    const pts = curve([[x + sx * w, 0, z], [x + sx * w * 1.05, h * 0.45, z], [x + sx * w * 0.7, h * 0.85, z], [x - sx * w * 0.2, h * 1.02, z], [x - sx * w * 0.7, h * 0.92, z]], 8);
    s += ribbon(pts, 0.34, 0.12, sx < 0 ? BARK : "#553a26") + ribbon(pts, 0.1, 0.03, BARK_L, `opacity="0.7"`);
  }
  // peus amb arrels i fulles a dalt
  for (const sx of [-1, 1]) s += ribbon(curve([[x + sx * w, 0.25, z], [x + sx * (w + 0.35), 0.03, z - 0.2], [x + sx * (w + 0.6), 0.01, z - 0.1]], 6), 0.18, 0.03, BARK);
  const [tx, ty] = P(x, h * 1.02, z);
  for (let i = 0; i < 16; i++) { const a = -Math.PI * (0.05 + i / 16 * 0.9); s += leaf(tx + Math.cos(a) * 70 * (0.6 + (i % 3) * 0.2), ty + Math.sin(a) * 30 + 6, 9 + (i % 3) * 3, a * 57 + 90, i % 3 ? LEAF : LEAF_L); }
  add(s, { spot: "worlds", title: "Portal del bosc: anar a un món (combat)", hit: bbox([[x - w - 0.3, 0, z], [x + w + 0.3, h * 1.1, z]]) });
}

// ---------------------------------------------------------------- rellotge de sorra damunt d'una soca (tornar a començar)
{
  let s = "";
  const x = -0.9, z = 7.5;
  s += floorEllipse(x, z, 0.5, 0.45, `fill="#000" opacity="0.25"`);
  s += stump(x, z, 0.32, 0.55);
  const [gx, gy] = P(x, 0.55, z), k = cam.scale(z) / 100;
  s += `<g class="sl-hourglass" transform="translate(${r(gx)} ${r(gy)}) scale(${k.toFixed(3)})">
    <rect x="-17" y="-5" width="34" height="5" rx="2" fill="#7a5230"/><rect x="-17" y="-48" width="34" height="5" rx="2" fill="#7a5230"/>
    <rect x="-15" y="-44" width="3" height="40" fill="#5a3a20"/><rect x="12" y="-44" width="3" height="40" fill="#5a3a20"/>
    <path d="M-11 -43 C-11 -31 0 -29 0 -24 C0 -19 -11 -17 -11 -5 H11 C11 -17 0 -19 0 -24 C0 -29 11 -31 11 -43 Z" fill="#dff0e8" opacity="0.5" stroke="#a8c8b8" stroke-width="1"/>
    <path d="M-8 -39 H8 L0 -27 Z" fill="${AMBER}"/><path d="M-9 -6 H9 L0 -14 Z" fill="${AMBER}"/>
    <path d="M-14 -46 q-6 -8 2 -12 M14 -46 q6 -8 -2 -12" stroke="${LEAF}" stroke-width="2" fill="none"/>${leaf(-12, -58, 7, -30)}${leaf(12, -58, 7, 30)}</g>`;
  add(s, { spot: "reset", title: "Rellotge de sorra: tornar a començar (sense perdre les criatures)", hit: bbox([[x - 0.35, 0, z], [x + 0.35, 1.3, z]]) });
}

// ---------------------------------------------------------------- cristall de les millores, agafat per les arrels d'una soca (s'encén amb les millores)
{
  let s = "";
  const x = 2.6, z = 7.4, h = 0.8;
  s += floorEllipse(x, z, 0.75, 0.6, `fill="#000" opacity="0.25"`);
  s += stump(x, z, 0.45, h, { side: "#553a26" });
  const [cx, cy] = P(x, 1.45, z), k = cam.scale(z) / 110;
  s += `<ellipse cx="${r(cx)}" cy="${r(cy + 10)}" rx="${r(60 * k)}" ry="${r(70 * k)}" fill="${GLOW}" opacity="0.1"/>`;
  s += `<g class="sl-crystal" transform="translate(${r(cx)} ${r(cy)}) scale(${k.toFixed(3)})"><g class="sl-bob">%CRYSTAL%</g></g>`;
  // arrels que pugen de la soca i abracen la base del cristall
  for (const sx of [-1, 1]) s += ribbon(curve([[x + sx * 0.3, h, z - 0.1], [x + sx * 0.32, h + 0.25, z - 0.1], [x + sx * 0.12, h + 0.42, z - 0.12], [x - sx * 0.05, h + 0.5, z - 0.12]], 6), 0.08, 0.02, BARK_L);
  add(s, { spot: "upgrades", title: "Cristall de la soca: millores (vida, maná, saber)", hit: bbox([[x - 0.5, 0, z], [x + 0.5, 2.2, z]]) });
}

// ---------------------------------------------------------------- porta (paret esquerra): fusta en arc dins d'un marc d'arrels, amb un rètol tallat
{
  let s = "";
  const z0 = 4.3, z1 = 5.5, top = 2.3, xw = -W + 0.005;
  const arc = Array.from({ length: 17 }, (_, i) => { const a = Math.PI * i / 16; return [xw, top - 0.45 + Math.sin(a) * 0.45, (z0 + z1) / 2 - Math.cos(a) * (z1 - z0) / 2]; });
  const door = [[xw, 0, z0], ...arc, [xw, 0, z1]];
  s += `<path d="${path3(door, true)}" fill="url(#fo-door)"/>`;
  for (const f of [0.25, 0.5, 0.75]) { const z = z0 + (z1 - z0) * f; s += line([xw, 0.05, z], [xw, top - 0.45 + Math.sin(Math.PI * f) * 0.4, z], `stroke="#3a2416" stroke-width="2"`); }
  for (const y of [0.5, 1.5]) s += line([xw, y, z0 + 0.05], [xw, y, z1 - 0.05], `stroke="#2a1a10" stroke-width="5"`);
  const [hx, hy] = P(xw, 1.05, z0 + 0.15);
  s += `<circle cx="${r(hx)}" cy="${r(hy)}" r="6" fill="none" stroke="${AMBER}" stroke-width="2.5"/>`;
  // marc d'arrels
  s += ribbon(curve([[xw, 0, z0 - 0.1], [xw, top * 0.7, z0 - 0.12], [xw, top + 0.05, (z0 + z1) / 2], [xw, top * 0.7, z1 + 0.12], [xw, 0, z1 + 0.1]], 8), 0.16, 0.16, BARK);
  // rètol de fusta penjat damunt: fletxa i porta tallades, pla sobre la paret
  const sp = (u, v) => P(xw, top + 0.55 - v * 0.32, z0 + 0.1 + u * (z1 - z0 - 0.2));
  const SIGN = `<rect x="2" y="2" width="64" height="24" rx="5" fill="#8a5a32" stroke="#5a3a20" stroke-width="2"/><path d="M6 9 H62 M6 19 H62" stroke="#7a4e2a" stroke-width="1"/>
    <path d="M12 14 H28 M22 8 L28 14 L22 20" stroke="${LEAF_L}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M40 22 V10 Q46 4 52 10 V22 Z" fill="none" stroke="${LEAF_L}" stroke-width="2.4"/><circle cx="49" cy="16" r="1.4" fill="${LEAF_L}"/>`;
  s += `<g transform="${cam.affine(sp(0, 0), sp(1, 0), sp(0, 1), 68, 28)}">${SIGN}</g>`;
  s += line([xw, top + 0.62, z0 + 0.3], [xw, top + 0.55, z0 + 0.3], `stroke="#c9a070" stroke-width="1.5"`) + line([xw, top + 0.62, z1 - 0.3], [xw, top + 0.55, z1 - 0.3], `stroke="#c9a070" stroke-width="1.5"`);
  add(s, { spot: "exit", title: "Porta: tornar a l'habitació", hit: bbox([[xw, 0, z0], [xw, top + 0.7, z1]]) });
}

// ---------------------------------------------------------------- prestatgeria tallada a la paret dreta: llibres, rotlles, plantetes i lianes
{
  let s = "";
  const b = { x0: W - 0.5, x1: W, y0: 0, y1: 3.2, z0: 3.0, z1: 6.3 };
  const lf = face(b, "left"); // u: del fons cap al davant · v: de dalt a baix
  // buit tallat a l'escorça, amb la vora gruixuda
  s += quad(lf, -0.03, -0.03, 1.03, 1.0, `fill="${BARK_L}"`);
  const rows = [0.04, 0.29, 0.54, 0.79];
  for (const v of rows) {
    s += quad(lf, 0.03, v, 0.97, v + 0.2, `fill="#22170f"`);
    s += quad(lf, 0.02, v + 0.2, 0.98, v + 0.225, `fill="#7a5a3a"`); // lleixa
    let u = 0.06, i = 0;
    while (u < 0.92) {
      const kind = (i * 7 + Math.round(v * 10)) % 9, th = 0.022 + (i % 3) * 0.006;
      if (kind === 4) { // rotlle tombat
        s += quad(lf, u, v + 0.15, u + 0.09, v + 0.2, `fill="#e9dcbc"`) + quad(lf, u + 0.085, v + 0.15, u + 0.095, v + 0.2, `fill="#c9a678"`); u += 0.11;
      } else if (kind === 7) { // test amb un brot
        s += quad(lf, u, v + 0.15, u + 0.06, v + 0.2, `fill="#a8582e"`);
        const [px, py] = P(...lf(u + 0.03, v + 0.15)); s += leaf(px - 4, py, 9, -30) + leaf(px + 4, py, 9, 30) + leaf(px, py - 2, 11, 0, LEAF_L); u += 0.08;
      } else {
        const hh = 0.13 + (i % 4) * 0.012, c = ["#6a3a24", "#3a5a2a", "#8a6a3a", "#2f4a3a", "#7a2a22", "#5a4a2a"][(i + Math.round(v * 9)) % 6];
        s += quad(lf, u, v + 0.2 - hh, u + th, v + 0.2, `fill="${c}"`) + quad(lf, u, v + 0.2 - hh + 0.02, u + th, v + 0.2 - hh + 0.03, `fill="#c9a070" opacity="0.6"`); u += th + 0.004;
      }
      i++;
    }
  }
  // lianes fixades dalt de la prestatgeria: cauen fent una essa i creixen i s'encongixen (la tija es dibuixa
  // i es desdibuixa amb stroke-dashoffset); les fulles de dalt queden sempre
  [[0.15, 0], [0.48, 2.2], [0.82, 4.1]].forEach(([u, d]) => {
    const pts = curve([lf(u, -0.03), lf(u + 0.05, 0.12), lf(u - 0.04, 0.28), lf(u + 0.04, 0.44), lf(u - 0.02, 0.58)].map(p => [p[0] - 0.02, p[1], p[2]]), 8);
    const dd = "M" + pts.map(pt).join(" L");
    s += `<path d="${dd}" pathLength="1" class="fo-grow" style="animation-delay:-${d}s" stroke="${LEAF_D}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
    s += pts.slice(1, 12).filter((_, k) => k % 4 === 1).map((p, k) => { const [px, py] = P(...p); return leaf(px + (k % 2 ? 6 : -6), py, 10, k % 2 ? 50 : -50, k % 2 ? LEAF : LEAF_L); }).join("");
  });
  add(s, { spot: "study", title: "Prestatgeria: apuntar el que has estudiat (pergamins d'invocació)", hit: bbox(corners(b)) });
}

// ---------------------------------------------------------------- catifes i camí de pedres
{
  let s = "";
  // camí de lloses planes des de davant fins al cercle de bolets i el portal
  for (const [x, z, a, b2] of [[0.1, 0.6, 0.38, 0.22], [-0.25, 1.4, 0.32, 0.2], [0.15, 2.2, 0.34, 0.2], [-0.2, 3.0, 0.3, 0.18], [-1.0, 6.2, 0.28, 0.16], [-1.6, 6.9, 0.26, 0.15]])
    s += floorEllipse(x, z, a, b2, `fill="#8a8a7a" stroke="#6a6a5a" stroke-width="1.5"`) + floorEllipse(x - 0.03, z + 0.02, a * 0.6, b2 * 0.5, `fill="#a0a090" opacity="0.6"`, 0.006);
  // catifa de molsa als peus dels faristols i davall de l'estudiant
  for (const [x, z, a, b2] of [[-2.3, 2.5, 0.6, 0.4], [3.0, 2.7, 0.55, 0.38], [1.5, 2.3, 0.62, 0.36]])
    s += floorEllipse(x, z, a, b2, `fill="${MOSS_L}"`) + floorEllipse(x, z, a * 0.75, b2 * 0.7, `fill="${MOSS}"`, 0.006);
  add(s);
}

// ---------------------------------------------------------------- altar d'invocació: un cercle de bolets que brillen, amb un pergamí d'escorça de bedoll que sura
{
  let s = "";
  const z = 4.6, rx = 1.15, rz = 0.55;
  s += floorEllipse(0, z, rx * 1.15, rz * 1.15, `fill="${GLOW}" opacity="0.08"`);
  s += `<g class="sl-runes">${poly(ringPts(0, 0.005, z, rx * 0.7, rz * 0.7), `fill="none" stroke="${LEAF_L}" stroke-width="2" stroke-dasharray="6 8" opacity="0.8"`)}</g>`;
  // bolets al voltant (els de darrere primer)
  const shrooms = Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2; return [Math.cos(a) * rx, z + Math.sin(a) * rz]; }).sort((p, q) => q[1] - p[1]);
  for (const [x, zz] of shrooms) { const [px, py] = P(x, 0, zz), k = cam.scale(zz) / 100; s += `<g class="fo-glow">${mushroom(px, py, 9 * k + 4, zz > z ? "#d8f088" : "#e8ff9a")}</g>`; }
  // pergamí d'escorça de bedoll amb un cordill i un segell de cera en forma de fulla
  const [px, py] = P(0, 0.75, z), k = cam.scale(z) / 100;
  const halo = `<ellipse rx="64" ry="46" fill="${GLOW}" opacity="0.12"/>`;
  const paper = `<path d="M-30 -24 Q-8 -28 30 -24 L30 22 Q8 26 -30 22 Z" fill="#f2efe6" stroke="#c8c2b0" stroke-width="1.2"/>
    <g fill="#3a3530" opacity="0.7"><rect x="-24" y="-14" width="7" height="1.6" rx="0.8"/><rect x="10" y="-10" width="9" height="1.6" rx="0.8"/><rect x="-14" y="12" width="6" height="1.4" rx="0.7"/><rect x="18" y="14" width="5" height="1.4" rx="0.7"/></g>
    <circle cy="-2" r="11" fill="none" stroke="${LEAF}" stroke-width="1.2"/><path d="M0 -12 C6 -6 6 2 0 8 C-6 2 -6 -6 0 -12 Z M0 -10 V7" fill="none" stroke="${LEAF_D}" stroke-width="1"/>`;
  const roll = yy => `<rect x="-34" y="${yy - 4}" width="68" height="8" rx="4" fill="#6a4a2a"/><rect x="-34" y="${yy - 4}" width="68" height="3" rx="1.5" fill="#8a6a40" opacity="0.8"/>
    <circle cx="-36" cy="${yy}" r="4.2" fill="#5a3a20"/><circle cx="36" cy="${yy}" r="4.2" fill="#5a3a20"/>`;
  const seal = `<path d="M-2 24 C-8 30 -4 36 0 34 C4 36 8 30 2 24" fill="#c9a050"/><path d="M0 22 C5 26 5 31 0 35 C-5 31 -5 26 0 22 Z" fill="${LEAF}" stroke="${LEAF_D}" stroke-width="0.8"/>`;
  s += `<g class="sl-scroll" transform="translate(${r(px)} ${r(py)}) scale(${k.toFixed(3)})"><g class="sl-bob">${halo}<g transform="rotate(-5)">
    <g class="sl-paper">${paper}</g><g class="sl-roll-t">${roll(-26)}</g><g class="sl-roll-b">${roll(24)}${seal}</g></g></g></g>`;
  add(s, { spot: "gacha", title: "Cercle de bolets: invocar criatures amb pergamins", hit: bbox([[-rx - 0.1, 0, z - rz], [rx + 0.1, 0, z + rz], [0, 1.4, z]]) });
}

// ---------------------------------------------------------------- faristols d'arrels: el grimori (esquerra) i el bestiari (dreta)
function rootLectern(x, z, top = 0.98) {
  const w = 0.62, h = 0.44, t = 32 * Math.PI / 180;
  const plane = (u, v, lift = 0) => [x + (u - 0.5) * w, top + v * h * Math.sin(t) + lift, z - h * Math.cos(t) / 2 + v * h * Math.cos(t)];
  let s = floorEllipse(x, z, 0.4, 0.3, `fill="#000" opacity="0.3"`);
  // tres arrels que pugen trenades des del terra fins al tauler
  for (const [dx, dz, c] of [[-0.18, 0.1, BARK], [0.18, 0.1, "#553a26"], [0, -0.12, BARK_L]]) {
    const pts = curve([[x + dx * 2.2, 0, z + dz * 1.6], [x + dx, 0.25, z + dz], [x - dx * 0.6, 0.55, z + dz * 0.3], [x + dx * 0.4, top - 0.05, z]], 8);
    s += ribbon(pts, 0.12, 0.07, c);
  }
  s += poly([plane(0, 0, -0.02), plane(1, 0, -0.02), plane(1, 1, -0.02), plane(0, 1, -0.02)], `fill="#7a5230"`);
  s += poly([plane(0, 0, -0.02), plane(1, 0, -0.02), plane(1, 0, -0.06), plane(0, 0, -0.06)], `fill="#5a3a20"`);
  // un brot que s'enfila pel costat
  const [lx, ly] = P(...plane(0, 0.2, -0.04));
  s += leaf(lx - 6, ly + 6, 10, -60) + leaf(lx - 10, ly + 16, 9, -100, LEAF_L);
  return { svg: s, plane };
}
function openBook(plane, { cover, page, line: lc, lines = [7, 7], ink = [] }) {
  const bu = u => 0.1 + u * 0.8, bv = v => 0.12 + v * 0.75;
  let s = poly([plane(bu(-0.02), bv(-0.03)), plane(bu(1.02), bv(-0.03)), plane(bu(1.02), bv(1.03)), plane(bu(-0.02), bv(1.03))], `fill="${cover}"`);
  for (const [a, b] of [[0, 0.495], [0.505, 1]]) {
    const outer = a === 0 ? 0 : 1, lift = u => (Math.abs(u - outer) < 0.01 ? 0.012 : 0.02);
    s += poly([plane(bu(a), bv(0), 0.004), plane(bu(b), bv(0), 0.004), plane(bu(b), bv(0), 0.016), plane(bu(a), bv(0), 0.016)], `fill="${lc}" opacity="0.6"`);
    s += poly([plane(bu(a), bv(0), lift(a)), plane(bu(b), bv(0), lift(b)), plane(bu(b), bv(1), lift(b)), plane(bu(a), bv(1), lift(a))], `fill="${page}"`);
    for (let i = 0; i < lines[a === 0 ? 0 : 1]; i++) { const v = 0.8 - i * 0.1, len = i % 3 === 2 ? 0.6 : 0.85; s += line(plane(bu(a + 0.06), bv(v), 0.021), plane(bu(a + 0.06 + (b - a - 0.12) * len), bv(v), 0.021), `stroke="${lc}" stroke-width="1.6" opacity="0.7"`); }
  }
  s += line(plane(bu(0.5), bv(0), 0.02), plane(bu(0.5), bv(1), 0.02), `stroke="#00000055" stroke-width="3"`);
  for (const [c, w, pts] of ink) s += `<polyline points="${pts.map(([u, v]) => P(...plane(bu(u), bv(v), 0.022)).map(r).join(",")).join(" ")}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return s;
}
{
  // grimori: coberta verda; a la pàgina esquerra, una fulla dibuixada a tinta
  let g = "";
  const gl = rootLectern(-2.3, 2.5);
  g += gl.svg;
  g += openBook(gl.plane, { cover: "#2f5a2a", page: "#efe6d0", line: "#7a9a6a", lines: [2, 7], ink: [
    ["#2f6a2a", 2.6, [[0.25, 0.3], [0.17, 0.55], [0.25, 0.85], [0.33, 0.55], [0.25, 0.3]]], ["#2f6a2a", 1.8, [[0.25, 0.3], [0.25, 0.8]]],
    ["#2f6a2a", 1.4, [[0.25, 0.45], [0.2, 0.52]]], ["#2f6a2a", 1.4, [[0.25, 0.6], [0.3, 0.67]]]] });
  const [gx, gy] = P(-2.3, 1.62, 2.5), gk = cam.scale(2.5) / 100;
  g += `<ellipse cx="${r(gx)}" cy="${r(gy)}" rx="${r(62 * gk)}" ry="${r(34 * gk)}" fill="${GLOW}" opacity="0.12"/>`;
  // damunt, sura una fulla, una gla i una llavor (es mouen)
  g += `<g transform="translate(${r(gx)} ${r(gy - 20 * gk)}) scale(${gk.toFixed(3)})">
    <g class="sl-glyph">${leaf(-22, 0, 14, -20, LEAF_L)}</g>
    <g class="sl-glyph"><ellipse cx="2" cy="-12" rx="4.5" ry="5.5" fill="#a8743a"/><path d="M-3 -16 Q2 -21 7 -16 Z" fill="#6a4a2a"/></g>
    <g class="sl-glyph"><path d="M20 -2 Q24 -8 28 -2 Q24 2 20 -2 Z" fill="#c9a050"/><path d="M24 -6 q2 -6 6 -7" stroke="${LEAF}" stroke-width="1.4" fill="none"/></g></g>`;
  add(g, { spot: "grimori", title: "Grimori: les teues criatures i l'equip", hit: bbox([[-2.65, 0, 2.3], [-1.95, 0, 2.7], [-2.3, 1.9, 2.5]]) });
  // bestiari: coberta d'escorça fosca; a la pàgina dreta, la Notificació (campana) a tinta
  let s = "";
  const bl = rootLectern(3.0, 2.7);
  s += bl.svg;
  s += openBook(bl.plane, { cover: "#4a2a1a", page: "#d8c49e", line: "#7a4a2a", lines: [7, 1], ink: [
    ["#4a2a1a", 2.4, [[0.64, 0.3], [0.67, 0.42], [0.67, 0.6], [0.7, 0.72], [0.75, 0.76], [0.8, 0.72], [0.83, 0.6], [0.83, 0.42], [0.86, 0.3], [0.64, 0.3]]],
    ["#4a2a1a", 2.4, [[0.72, 0.24], [0.75, 0.21], [0.78, 0.24]]], ["#a8321e", 2.4, [[0.87, 0.78], [0.9, 0.82], [0.87, 0.86], [0.84, 0.82], [0.87, 0.78]]]] });
  add(s, { spot: "bestiary", title: "Bestiari: les distraccions que has vist", hit: bbox([[2.65, 0, 2.5], [3.35, 0, 2.9], [3.0, 1.6, 2.7]]) });
}

// ---------------------------------------------------------------- estudiant damunt de la catifa de molsa
{
  let s = "";
  const [sx, sy] = P(1.5, 0, 2.3), k = cam.scale(2.3) / 100;
  s += `<ellipse cx="${r(sx)}" cy="${r(sy)}" rx="${r(46 * k)}" ry="${r(10 * k)}" fill="#000" opacity="0.35"/>`;
  s += `<g transform="translate(${r(sx)} ${r(sy)}) scale(${k.toFixed(3)})"><g transform="translate(-50 -101)">%STUDENT%</g></g>`;
  add(s, { spot: "student", title: "Estudiant: artefactes", hit: [r(sx - 60 * k), r(sy - 112 * k), r(120 * k), r(120 * k)] });
}

// ---------------------------------------------------------------- vida del bosc: lianes del sostre, falgueres, bolets a les parets, fulles caigudes i cuques de llum
{
  let s = "";
  // lianes que pengen del sostre, cada una amb el seu balanceig
  for (const [x, z, len, d] of [[-3.6, 1.2, 1.6, 0], [-1.2, 1.0, 1.1, 1.2], [2.2, 1.3, 1.4, 0.6], [3.9, 2.5, 1.9, 1.8], [-3.9, 3.4, 1.3, 2.4], [0.4, 6.0, 1.2, 0.9]]) {
    const pts = curve([[x, H, z], [x + 0.08, H - len * 0.35, z], [x - 0.06, H - len * 0.7, z], [x + 0.04, H - len, z]], 6);
    const [tx, ty] = P(x, H, z);
    s += `<g class="fo-vine" style="transform-origin:${r(tx)}px ${r(ty)}px;animation-delay:-${d}s">${ribbon(pts, 0.05, 0.02, LEAF_D)}${pts.filter((_, k) => k % 2 === 1).map((p, k) => { const [px, py] = P(...p), sc = cam.scale(z) / 100; return leaf(px + (k % 2 ? 4 : -4) * sc, py, 9 * sc, k % 2 ? 55 : -55, k % 2 ? LEAF : LEAF_L); }).join("")}</g>`;
  }
  // falgueres i bolets al peu de les parets
  for (const [x, z, sc, f] of [[-4.2, 6.0, 1.0, 1], [-4.1, 2.6, 1.4, 1], [4.1, 6.8, 1.1, -1], [4.0, 1.4, 1.6, -1], [-3.3, 8.6, 0.9, 1], [1.4, 8.7, 0.9, -1]]) { const [px, py] = P(x, 0, z), k = cam.scale(z) / 100; s += fern(px, py, sc * k * 18, f); }
  for (const [x, z] of [[-4.3, 5.9], [-3.9, 8.0], [4.3, 2.4], [4.2, 7.5], [-1.8, 8.8], [3.4, 8.7]]) { const [px, py] = P(x, 0, z), k = cam.scale(z) / 100; s += `<g class="fo-glow">${mushroom(px, py, 8 * k + 3)}${mushroom(px + 12 * k, py + 2, 6 * k + 2, "#9ff0d8")}</g>`; }
  // fulles caigudes pel terra
  for (let i = 0; i < 22; i++) { const x = -3.8 + ((i * 0.37) % 1) * 7.6, z = 0.3 + ((i * 0.61) % 1) * 7.5, [px, py] = P(x, 0, z), k = cam.scale(z) / 100; s += leaf(px, py, 7 * k, (i * 47) % 360, ["#c9a040", "#a86a2a", LEAF, "#8a9a3a"][i % 4], "#00000033"); }
  // cuques de llum que van i venen
  for (let i = 0; i < 16; i++) { const x = -3.5 + ((i * 0.53) % 1) * 7, y = 0.8 + ((i * 0.29) % 1) * 2.6, z = 1.5 + ((i * 0.71) % 1) * 6.5, [px, py] = P(x, y, z); s += `<g class="fo-fly" style="animation-delay:-${(i * 0.7) % 5}s"><circle cx="${r(px)}" cy="${r(py)}" r="5" fill="${FLY}" opacity="0.25"/><circle cx="${r(px)}" cy="${r(py)}" r="1.8" fill="#fffde0"/></g>`; }
  add(s);
}

// ---------------------------------------------------------------- definicions
const defs = `${cam.defs}
  <linearGradient id="fo-wall-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2818"/><stop offset="1" stop-color="#4e3622"/></linearGradient>
  <linearGradient id="fo-wall-l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a1c12"/><stop offset="1" stop-color="#3e2a1a"/></linearGradient>
  <linearGradient id="fo-wall-r" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#2a1c12"/><stop offset="1" stop-color="#3e2a1a"/></linearGradient>
  <linearGradient id="fo-ceil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e140c"/><stop offset="1" stop-color="#2e2014"/></linearGradient>
  <linearGradient id="fo-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e4a22"/><stop offset="1" stop-color="#3f6a2e"/></linearGradient>
  <linearGradient id="fo-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe6c8"/><stop offset="0.6" stop-color="#e8f2c0"/><stop offset="1" stop-color="#f6e6a8"/></linearGradient>
  <linearGradient id="fo-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8d0" stop-opacity="0.32"/><stop offset="0.8" stop-color="#fff8d0" stop-opacity="0"/></linearGradient>
  <linearGradient id="fo-door" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a3a22"/><stop offset="1" stop-color="#7a5232"/></linearGradient>
  <radialGradient id="fo-portal"><stop offset="0" stop-color="#f6ffd8" stop-opacity="0.95"/><stop offset="0.35" stop-color="#9fe88a"/><stop offset="0.75" stop-color="#2f7a4a"/><stop offset="1" stop-color="#143a24"/></radialGradient>
  <radialGradient id="fo-portal-glow"><stop offset="0" stop-color="#b8ff7a" stop-opacity="0.35"/><stop offset="1" stop-color="#b8ff7a" stop-opacity="0"/></radialGradient>
  <radialGradient id="fo-vignette" gradientUnits="userSpaceOnUse" cx="800" cy="450" r="1150"><stop offset="0.5" stop-color="#0a1208" stop-opacity="0"/><stop offset="0.8" stop-color="#0a1208" stop-opacity="0.55"/></radialGradient>`;
add(`<rect x="-1600" y="-900" width="4800" height="2700" fill="url(#fo-vignette)" pointer-events="none"/>`); // també fora del viewBox: sense bandes

// ---------------------------------------------------------------- eixida
const out = `// GENERAT per tools/sala-forestal.js (no l'edites a mà: canvia l'escena allà i torna a executar-lo)
// Capes de la sala del bosc (Forestal) en ordre de pintat. Les capes amb \`spot\` són punts interactius (js/td/lobby.js).
// %STUDENT% es substituïx pel dibuix de l'estudiant i %CRYSTAL% pel cristall de les millores.
const TD_FOREST_ART = ${JSON.stringify({ defs, layers }, null, 0)};
`;
fs.writeFileSync(path.join(__dirname, "..", "js", "data", "td-forest-art.js"), out);
const pi = process.argv.indexOf("--preview");
if (pi > 0) fs.writeFileSync(process.argv[pi + 1], `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs>${defs}</defs>${layers.map(l => l.svg.replace("%STUDENT%", '<rect width="100" height="105" fill="#3fdc8a" opacity="0.4"/>').replace("%CRYSTAL%", '<path d="M0 -50 L24 -10 L0 34 L-24 -10 Z" fill="#7fe8ff"/>')).join("")}</svg>`);
console.log(`js/data/td-forest-art.js: ${layers.length} capes, ${(out.length / 1024).toFixed(0)} KB`);
