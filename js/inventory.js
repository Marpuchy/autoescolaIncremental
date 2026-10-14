// ===== INVENTARI I EQUIPAMENT =====
// state.inventory = { items: [ids], equipped: { slot: id } }. Es conserva en reiniciar la partida.
// L'inventari es desbloqueja amb el primer objecte (Pixel, en derrotar-lo als Carreronets de Sogorb).
const inventoryUnlocked = () => state.inventory.items.length > 0;
const equippedItem = slot => ITEMS[state.inventory.equipped[slot]] || null;
// Mascota equipada: ataca pel seu compte i no té vida (vegeu update() a combat.js)
const equippedAlly = () => equippedItem("pet");
// Dany de la mascota (amb les evolucions que en pugen el dany)
const allyDamage = ally => state.player.atk * ally.ally.atkPct / 100 * (1 + (state.player.petDmgPct || 0) / 100);

let selectedSlot = "pet"; // espai seleccionat al panell

// Bonus de tot l'equipament posat i de les seues evolucions: els números se sumen, els límits (critCap) es queden
// amb el més alt i els interruptors (petCrit) valen si algun els té
function equipmentStats() {
  const total = {};
  for (const s of EQUIP_SLOTS) {
    const id = state.inventory.equipped[s.id];
    if (!ITEMS[id]) continue;
    for (const st of [ITEMS[id].stats || {}, evoStats(id)]) {
      for (const [k, v] of Object.entries(st)) {
        if (k === "txt") continue;
        if (k === "critCap" || k === "petHealLow" || k === "possessEvery" || k === "stunEvery" || k === "tracaEvery") total[k] = Math.max(total[k] || 0, v);
        else if (typeof v === "boolean") total[k] = total[k] || v;
        else total[k] = (total[k] || 0) + v;
      }
    }
  }
  return total;
}

function grantItem(id, announce = true) {
  const inv = state.inventory;
  const item = ITEMS[id];
  if (!item || inv.items.includes(id)) return;
  const first = !inventoryUnlocked();
  inv.items.push(id);
  if (!inv.equipped[item.slot]) inv.equipped[item.slot] = id;
  selectedSlot = item.slot;
  recomputeStats();
  if (announce) {
    if (first) toast("🎒 Inventari desbloquejat!", "good");
    if (item.found) toast(item.found, "good");
  }
  refreshInventory();
}

// Objectes que donen els caps. Es mira el compendi, així les partides d'abans també els reben.
function checkItemRewards(announce = true) {
  for (const [id, item] of Object.entries(ITEMS)) {
    if (item.from && state.bestiary[item.from]?.defeated > 0) grantItem(id, announce);
  }
}

function toggleEquip(id) {
  const inv = state.inventory;
  const item = ITEMS[id];
  if (!item || !inv.items.includes(id)) return;
  if (inv.equipped[item.slot] === id) delete inv.equipped[item.slot];
  else inv.equipped[item.slot] = id;
  selectedSlot = item.slot;
  state.player.allyTimer = 0;
  recomputeStats();
  renderUpgrades(); // les fitxes de les millores mostren el crític total
  refreshInventory();
  save();
}

// ----- Aspecte: els objectes equipats es dibuixen damunt/al costat de la granoteta -----
// Mascotes: al costat de la granoteta (fora del sprite, perquè es mouen pel seu compte)
// L'aspecte de cada objecte inclou la seua evolució (itemVisual a evolutions.js)
const equippedVisual = slot => ITEMS[state.inventory.equipped[slot]] ? itemVisual(state.inventory.equipped[slot]) : null;
function gearHtml() {
  return EQUIP_SLOTS.map(s => {
    const v = equippedVisual(s.id);
    return v?.ally ? `<div class="gear gear-ally">${v.look}</div>` : "";
  }).join("");
}

// Pell: la granoteta amb els colors canviats (el SVG original es guarda en initInventory)
let frogSvg = "";
// (també s'aplica a les peces posades: el braç que aguanta la capa és del color de la pell)
function skinned(svg) {
  const colors = equippedVisual("skin")?.skin?.colors || {};
  return Object.entries(colors).reduce((out, [from, to]) => out.split(`"${from}"`).join(`"${to}"`), svg);
}
// La granoteta amb la pell i sense les parts que amaga l'equipament (p. ex. la pota que aguanta la capa)
function skinnedFrog() {
  const hidden = EQUIP_SLOTS.flatMap(s => equippedVisual(s.id)?.hides || []);
  const svg = hidden.reduce((out, cls) => out.replace(`class="${cls}"`, `class="${cls}" display="none"`), frogSvg);
  return skinned(svg);
}
const auraClass = () => equippedVisual("skin")?.skin?.aura || "";
// Peces que porta posades (ulleres, gorra...): un SVG amb les mateixes coordenades que la granoteta, dins del sprite
function wearHtml() {
  const parts = EQUIP_SLOTS.map(s => equippedVisual(s.id)?.wear || "").join("");
  return parts ? `<svg class="wear-layer" viewBox="0 0 140 124" overflow="visible" aria-hidden="true">${skinned(parts)}</svg>` : "";
}

// ----- Finestra de l'inventari -----
const inventoryOpen = () => !$("inventory-modal").hidden;
let evoPick = null; // opció d'evolució triada per a la vista prèvia: { id, stage, branch }

function openInventory() {
  if (!inventoryUnlocked()) return;
  evoPick = null;
  $("inventory-modal").hidden = false;
  renderInventory();
  $("btn-inv-close").focus();
}
function closeInventory() {
  $("inventory-modal").hidden = true;
  evoPick = null;
}

// Granoteta amb l'equipament; amb una opció d'evolució triada, com quedarà (es prova i es desfà al moment)
function previewHtml() {
  const before = evoPick && state.evolutions[evoPick.id];
  if (evoPick) state.evolutions[evoPick.id] = { stage: evoPick.stage, branch: evoPick.branch };
  const html = `<div class="gear-layer">${gearHtml()}</div><div class="sprite inv-frog ${auraClass()}">${skinnedFrog()}${wearHtml()}</div>`;
  if (evoPick) { if (before) state.evolutions[evoPick.id] = before; else delete state.evolutions[evoPick.id]; }
  return html;
}

function renderInventory() {
  if (!inventoryOpen()) return;
  const inv = state.inventory;
  $("inventory-preview").innerHTML = previewHtml();
  $("inventory-preview-label").textContent = evoPick ? "Vista prèvia de l'evolució" : "";

  // Espais en triangle: l'ordre d'EQUIP_SLOTS és dalt, davall a l'esquerra, davall a la dreta (vegeu .inv-slot-N)
  $("inventory-slots").innerHTML = EQUIP_SLOTS.map((s, i) => {
    const id = inv.equipped[s.id];
    return `<button class="inv-slot inv-slot-${i}${s.id === selectedSlot ? " selected" : ""}${id ? "" : " empty"}" data-slot="${s.id}">
        <span class="inv-slot-item">${id ? itemVisual(id).look : s.icon}</span>
        <span class="inv-slot-name">${s.name}</span>
      </button>`;
  }).join("");

  // Objectes que tens per a l'espai triat: el que portes posat queda marcat (vora verda i ✔). Tocar-ne un l'equipa.
  const slot = EQUIP_SLOTS.find(s => s.id === selectedSlot);
  $("inventory-items-title").textContent = `${slot.icon} ${slot.name}`;
  const own = inv.items.filter(id => ITEMS[id].slot === selectedSlot);
  $("inventory-items").innerHTML = own.length
    ? own.map(id => {
        const on = inv.equipped[selectedSlot] === id;
        return `<button class="inv-item${on ? " equipped" : ""}" data-toggle="${id}" aria-pressed="${on}" title="${on ? "Llevar" : "Equipar"}">
          ${itemVisual(id).look}<span>${ITEMS[id].name}</span>${on ? `<span class="inv-item-check">✔ Equipat</span>` : ""}</button>`;
      }).join("")
    : `<p class="muted">Encara no tens res per a aquest espai.</p>`;

  const id = inv.equipped[selectedSlot];
  $("inventory-detail").innerHTML = id
    ? `<div class="inv-detail-name">${ITEMS[id].name}</div>
       <div class="inv-detail-desc">${ITEMS[id].desc}</div>
       <div class="inv-effect">${shortEffect(ITEMS[id])}</div>
       ${evolutionHtml(id)}`
    : own.length ? `<p class="muted">Toca un objecte per a equipar-lo.</p>` : "";
}

// Efecte de l'objecte en una línia (la descripció llarga queda com a title del nom)
function shortEffect(item) {
  const st = item.stats || {}, a = item.ally, parts = [];
  if (a) parts.push(`⚔️ ${a.atkPct}% del teu atac cada ${fmtNum(a.interval)} s`);
  if (a?.herd) parts.push(`🐑 endarrerix ${fmtNum(a.herd)} s`);
  if (st.critPct) parts.push(`🎯 +${st.critPct}% crític${st.critCap ? ` (màx. ${st.critCap}%)` : ""}`);
  if (st.lifesteal) parts.push(`💚 cura el ${fmtPct(st.lifesteal)}% del dany`);
  if (st.dodgePct) parts.push(`🟥 ${st.dodgePct}% d'esquivar`);
  if (st.burnPct) parts.push(`🔥 crema el ${st.burnPct}% del teu atac/s`);
  if (st.atkPct) parts.push(`🪪 +${st.atkPct}% atac, vida i velocitat`);
  return parts.join(" · ");
}

// Actualitza tot el que depén de l'inventari: pestanya, aspecte de la granoteta i panell
function refreshInventory() {
  refreshHubMirror(); // l'espill de la DGT reflectix l'equipament
  $("player-gear").innerHTML = gearHtml();
  $("player-wear").innerHTML = wearHtml();
  // pell: es canvia el SVG de la granoteta i l'aura del sprite
  const sprite = $("player-sprite");
  if (!frogSvg) return; // encara no s'ha guardat la granoteta original (initInventory)
  sprite.querySelector("svg.frog").outerHTML = skinnedFrog();
  sprite.classList.remove(...[...sprite.classList].filter(c => c.startsWith("aura-")));
  if (auraClass()) sprite.classList.add(auraClass());
  renderInventory();
}

function initInventory() {
  frogSvg = $("player-sprite").querySelector("svg.frog").outerHTML;
  const modal = $("inventory-modal");
  modal.addEventListener("click", ev => {
    if (ev.target === modal) { closeInventory(); return; } // clic fora de la finestra
    const slot = ev.target.closest("[data-slot]");
    if (slot) { selectedSlot = slot.dataset.slot; evoPick = null; renderInventory(); return; }
    const toggle = ev.target.closest("[data-toggle]");
    if (toggle) { evoPick = null; toggleEquip(toggle.dataset.toggle); return; }
    const pick = ev.target.closest("[data-evo-pick]");
    if (pick) { evoPick = JSON.parse(pick.dataset.evoPick); renderInventory(); return; }
    const buy = ev.target.closest("[data-evo-buy]");
    if (buy && evoPick) { const p = evoPick; evoPick = null; buyEvolution(p.id, p.branch); }
  });
  $("btn-inv-close").addEventListener("click", closeInventory);
  document.addEventListener("keydown", ev => {
    if (ev.key === "Escape" && inventoryOpen()) { ev.preventDefault(); closeInventory(); } // la DGT no es tanca alhora
  });
  refreshInventory();
}
