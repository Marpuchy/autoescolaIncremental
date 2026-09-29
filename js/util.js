// ===== UTILITATS =====
const $ = id => document.getElementById(id);
const L_ICON = `<span class="lplate sm">L</span>`;

// Números: a partir de 100.000 s'abreugen (K, M, B, T...) i, més enllà, notació científica
const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
function abbreviate(n) {
  if (!isFinite(n)) return "∞";
  const tier = Math.floor(Math.log10(Math.abs(n)) / 3);
  if (tier >= SUFFIXES.length) return n.toExponential(2).replace(".", ",");
  const v = n / Math.pow(1000, tier);
  return v.toLocaleString("ca-ES", { maximumFractionDigits: v < 10 ? 2 : v < 100 ? 1 : 0 }) + " " + SUFFIXES[tier];
}
const fmt = n => Math.abs(n) >= 1e5 ? abbreviate(n) : Math.floor(n).toLocaleString("ca-ES");
const fmtPct = n => n.toLocaleString("ca-ES", { maximumFractionDigits: 1 });
const fmtNum = n => Math.abs(n) >= 1e5 ? abbreviate(n) : n.toLocaleString("ca-ES", { maximumFractionDigits: 2 });

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Suma dels costos d'una sèrie lineal: base, base + growth, base + 2·growth... (n termes)
const linearCostSum = (n, base, growth) =>
  Array.from({ length: n }, (_, k) => base + k * growth).reduce((a, b) => a + b, 0);
