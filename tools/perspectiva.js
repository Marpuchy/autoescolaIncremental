// ===== MOTOR DE PERSPECTIVA (per a dibuixar escenes en SVG) =====
// Les escenes es descriuen en METRES dins d'una habitació i el motor les projecta amb una sola càmera, així tot comparteix
// el mateix punt de fuga i els objectes toquen el terra. No calcules cantonades a ull: descriu caixes i cares.
//
// Coordenades del món: x a la dreta (0 = centre), y cap amunt (0 = terra), z cap al fons (0 = davant de la càmera).
// La càmera mira cap a +z des de l'altura `eye`. Un objecte de dreta (x > 0) mostra la cara esquerra, i al revés.
//
// Ús:
//   const pv = require("./perspectiva");
//   const cam = pv.camera({ w: 1600, h: 900, cx: 800, cy: 360, eye: 1.8, d: 4, f: 1555 });
//   cam.P(x, y, z)                    → [px, py] en pantalla
//   cam.poly([[x,y,z], ...], attrs)   → <polygon> projectat
//   cam.box(b, { front, side, top, bottom })  → cares visibles d'una caixa b = { x0, x1, y0, y1, z0, z1 }
//   cam.face(b, "front"|"back"|"left"|"right"|"top")  → funció (u, v) ∈ [0,1]² → punt 3D de la cara
//        (u d'esquerra a dreta tal com es veu a la pantalla, v de dalt a baix / del fons al davant en la de dalt)
//   cam.quad(fn, u0, v0, u1, v1, attrs)  → rectangle (en coordenades de la cara) projectat: pantalles, botons, finestres...
//   cam.shadow(b, spread, opacity)    → ombra suau al terra davall d'una caixa
//   cam.figure(svg, x, y, z)          → <g> amb un dibuix pla en CENTÍMETRES (origen als peus, y negativa cap amunt)
//                                        escalat segons la profunditat (persones, plantes, cons...)
//   cam.affine(p0, p1, p2, w, h)      → matrix(...) que porta (0,0)-(w,0)-(0,h) a tres punts de pantalla
//   cam.bbox(points3d)                → [x, y, w, h] en pantalla (zones per a tocar)
const r = n => Math.round(n * 10) / 10;

function camera({ cx = 800, cy = 360, eye = 1.8, d = 4, f = 1555 } = {}) {
  const P = (x, y, z) => { const s = f / (z + d); return [cx + x * s, cy - (y - eye) * s]; };
  const scale = z => f / (z + d); // píxels per metre a la profunditat z
  const pts = list => list.map(p => P(...p).map(r).join(",")).join(" ");
  const poly = (list, attrs = "") => `<polygon points="${pts(list)}" ${attrs}/>`;
  const line = (a, b, attrs = "") => { const [x1, y1] = P(...a), [x2, y2] = P(...b); return `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" ${attrs}/>`; };

  function face(b, side) {
    const { x0, x1, y0, y1, z0, z1 } = b;
    switch (side) {
      case "front": return (u, v) => [x0 + (x1 - x0) * u, y1 - (y1 - y0) * v, z0];
      case "back":  return (u, v) => [x0 + (x1 - x0) * u, y1 - (y1 - y0) * v, z1];
      // cara esquerra (x = x0), visible si l'objecte està a la dreta: el costat del fons queda a l'esquerra de la pantalla
      case "left":  return (u, v) => [x0, y1 - (y1 - y0) * v, z1 - (z1 - z0) * u];
      // cara dreta (x = x1), visible si l'objecte està a l'esquerra: el costat de davant queda a l'esquerra
      case "right": return (u, v) => [x1, y1 - (y1 - y0) * v, z0 + (z1 - z0) * u];
      case "top":   return (u, v) => [x0 + (x1 - x0) * u, y1, z1 - (z1 - z0) * v];
      case "bottom": return (u, v) => [x0 + (x1 - x0) * u, y0, z1 - (z1 - z0) * v];
    }
    throw new Error(`Cara desconeguda: ${side}`);
  }
  const quad = (fn, u0, v0, u1, v1, attrs = "") => poly([fn(u0, v0), fn(u1, v0), fn(u1, v1), fn(u0, v1)], attrs);

  // Cares visibles d'una caixa (sense tapar-se entre elles). fills: { front, side, top, bottom } (colors o url(#...))
  function box(b, fills, extra = "") {
    let out = "";
    if (b.y1 < eye && fills.top) out += quad(face(b, "top"), 0, 0, 1, 1, `fill="${fills.top}" ${extra}`);
    if (b.y0 > eye && fills.bottom) out += quad(face(b, "bottom"), 0, 0, 1, 1, `fill="${fills.bottom}" ${extra}`);
    if (b.x0 > 0 && fills.side) out += quad(face(b, "left"), 0, 0, 1, 1, `fill="${fills.side}" ${extra}`);
    if (b.x1 < 0 && fills.side) out += quad(face(b, "right"), 0, 0, 1, 1, `fill="${fills.side}" ${extra}`);
    if (fills.front) out += quad(face(b, "front"), 0, 0, 1, 1, `fill="${fills.front}" ${extra}`);
    return out;
  }

  // Ombra suau al terra (cal el filtre #pv-soft a <defs>)
  const shadow = (b, spread = 0.08, opacity = 0.22) => poly(
    [[b.x0 - spread, 0, b.z0 - spread], [b.x1 + spread, 0, b.z0 - spread], [b.x1 + spread, 0, b.z1 + spread], [b.x0 - spread, 0, b.z1 + spread]],
    `fill="#1a1a4e" opacity="${opacity}" filter="url(#pv-soft)"`);

  const figure = (svg, x, y, z) => { const [px, py] = P(x, y, z); return `<g transform="translate(${r(px)} ${r(py)}) scale(${(scale(z) / 100).toFixed(4)})">${svg}</g>`; };

  const affine = (p0, p1, p2, w, h) =>
    `matrix(${((p1[0] - p0[0]) / w).toFixed(4)},${((p1[1] - p0[1]) / w).toFixed(4)},${((p2[0] - p0[0]) / h).toFixed(4)},${((p2[1] - p0[1]) / h).toFixed(4)},${r(p0[0])},${r(p0[1])})`;

  const bbox = list => {
    const ps = list.map(p => P(...p)), xs = ps.map(p => p[0]), ys = ps.map(p => p[1]);
    const x = Math.min(...xs), y = Math.min(...ys);
    return [r(x), r(y), r(Math.max(...xs) - x), r(Math.max(...ys) - y)];
  };
  const corners = b => [[b.x0, b.y0, b.z0], [b.x1, b.y1, b.z0], [b.x0, b.y1, b.z1], [b.x1, b.y0, b.z1], [b.x0, b.y1, b.z0], [b.x1, b.y0, b.z0]];

  const defs = `<filter id="pv-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>`;
  return { P, scale, pts, poly, line, face, quad, box, shadow, figure, affine, bbox, corners, defs, eye };
}

module.exports = { camera, r };
