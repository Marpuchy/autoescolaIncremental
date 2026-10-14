// ===== EVOLUCIONS: lògica, aspecte i fitxa de l'inventari =====
// state.evolutions = { idObjecte: { stage, branch } }
//   stage: etapes comprades (0-3) · branch: branca (des de la II)
// Es perd en reiniciar (es tornen les L gastades). Dades: js/data/evolutions.js
const ROMAN = ["I", "II", "III"];

const evoState = id => state.evolutions[id] || { stage: 0 };
const evoBranch = id => {
  const st = evoState(id);
  return st.branch ? EVOLUTIONS[id]?.branches[st.branch] : null;
};
// Etapa actual (objecte de dades) o null
function evoStage(id) {
  const st = evoState(id), evo = EVOLUTIONS[id];
  if (!evo || st.stage < 1) return null;
  return st.stage === 1 ? evo.common : evoBranch(id)?.stages[st.stage - 2] || evo.common;
}
// Bonus actuals: els de l'etapa I sempre, més els de l'etapa de la branca
function evoStats(id) {
  const st = evoState(id), evo = EVOLUTIONS[id];
  if (!evo || st.stage < 1) return {};
  const parts = [evo.common];
  if (st.stage >= 2 && evoBranch(id)) parts.push(evoBranch(id).stages[st.stage - 2]);
  const total = {};
  for (const part of parts) for (const [k, v] of Object.entries(part)) {
    if (["name", "icon", "txt", "visual"].includes(k)) continue;
    total[k] = typeof v === "number" ? (total[k] || 0) + v : v;
  }
  return total;
}
// Aspecte de l'objecte amb l'evolució (camps de `visual` de l'etapa damunt dels de l'objecte)
const itemVisual = id => ({ ...ITEMS[id], ...(evoStage(id)?.visual || {}) });

// Nivell completat: el rècord ja l'ha passat (el rècord es conserva en reiniciar)
const levelDone = level => state.best > level;
const evoCost = (id, k) => Math.round(enemyStats(1, EVOLUTIONS[id].reqs[k]).reward * EVO_COST.enemiesWorth[k]);
// L gastades en evolucions (es tornen en reiniciar)
const evoSpentL = () => Object.values(state.evolutions)
  .reduce((sum, st) => sum + EVO_COST.lCost.slice(0, st.stage).reduce((a, b) => a + b, 0), 0);

// Següent pas: { k, status: "done" | "level" | "buy", cost (diners), lcost, req }
function evoNext(id) {
  const st = evoState(id), evo = EVOLUTIONS[id];
  const k = st.stage;
  if (k >= 3) return { status: "done" };
  const req = evo.reqs[k];
  if (!levelDone(req)) return { k, status: "level", req };
  return { k, status: "buy", cost: evoCost(id, k), lcost: EVO_COST.lCost[k] };
}

// branchKey: només cal en comprar la II (és quan es tria la branca)
function buyEvolution(id, branchKey) {
  const evo = EVOLUTIONS[id];
  if (!evo || !state.inventory.items.includes(id)) return;
  const st = { ...evoState(id) };
  if (st.stage === 1 && !st.branch) {
    if (!evo.branches[branchKey]) return;
    st.branch = branchKey;
  }
  const next = evoNext(id);
  if (next.status !== "buy" || state.money < next.cost || state.lcoins < next.lcost) return;
  state.money -= next.cost;
  state.lcoins -= next.lcost;
  st.stage++;
  state.evolutions[id] = st;
  const stage = st.stage === 1 ? evo.common : evo.branches[st.branch].stages[st.stage - 2];
  const name = st.stage === 1 ? evo.common.name : evo.branches[st.branch].name;
  toast(`${stage.icon || evo.branches[st.branch].icon} ${ITEMS[id].name}: ${name} ${ROMAN[st.stage - 1]}`, "good");
  recomputeStats();
  renderUpgrades();
  renderTestPanel();
  refreshInventory();
  save();
}

// ----- Evolució a la finestra de l'inventari -----
// Només es veu l'etapa actual i les opcions de la següent (les posteriors no es poden preveure).
// Tocar una opció la tria i mostra com quedarà a la vista prèvia; el botó paga diners i L a la vegada.
function evoOptions(id) {
  const st = evoState(id), evo = EVOLUTIONS[id];
  if (st.stage === 0) return [{ stage: 1, name: evo.common.name, icon: evo.common.icon, txt: evo.common.txt }];
  if (st.stage === 1) return Object.entries(evo.branches).map(([key, b]) =>
    ({ stage: 2, branch: key, name: b.name, icon: b.icon, txt: b.stages[0].txt }));
  const b = evoBranch(id);
  return st.stage === 2 && b ? [{ stage: 3, branch: st.branch, name: b.name, icon: b.icon, txt: b.stages[1].txt }] : [];
}

function evolutionHtml(id) {
  const evo = EVOLUTIONS[id];
  if (!evo) return "";
  const st = evoState(id), cur = evoStage(id), next = evoNext(id);
  const name = st.stage >= 2 ? evoBranch(id).name : evo.common.name;
  const now = cur ? `<div class="evo-now">✨ ${name} ${ROMAN[st.stage - 1]}: ${cur.txt}</div>` : "";
  if (next.status === "done") return `<div class="evo">${now}<div class="evo-done">🏁 Evolució completa</div></div>`;
  if (next.status === "level") return `<div class="evo">${now}<div class="evo-lock">🔒 Etapa ${ROMAN[next.k]}: completa el nivell ${next.req}</div></div>`;
  const opts = evoOptions(id);
  if (!evoPick || evoPick.id !== id) evoPick = opts.length === 1 ? { id, stage: opts[0].stage, branch: opts[0].branch } : evoPick;
  const picked = evoPick?.id === id ? evoPick : null;
  return `<div class="evo">${now}
      <div class="evo-label">Etapa ${ROMAN[next.k]}${opts.length > 1 ? " · tria una branca" : ""}</div>
      <div class="evo-opts">${opts.map(o => {
        const data = JSON.stringify({ id, stage: o.stage, branch: o.branch }).replace(/"/g, "&quot;");
        const on = picked && picked.stage === o.stage && picked.branch === o.branch;
        return `<button class="evo-opt${on ? " on" : ""}" data-evo-pick="${data}"><b>${o.icon} ${o.name}</b><span>${o.txt}</span></button>`;
      }).join("")}</div>
      <button class="evo-btn" data-evo-buy data-cost="${next.cost}" data-lcost="${next.lcost}"${picked ? "" : " disabled"}>
        Evolucionar · ${fmt(next.cost)} 💰 · ${next.lcost} ${L_ICON}</button>
    </div>`;
}

// Cada fotograma: habilita el botó segons els diners i les L (sense tornar a pintar la finestra)
function refreshEvoButtons() {
  if ($("inventory-modal").hidden) return;
  document.querySelectorAll("[data-evo-buy]").forEach(b =>
    b.disabled = !evoPick || state.money < Number(b.dataset.cost) || state.lcoins < Number(b.dataset.lcost));
}
