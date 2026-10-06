// ===== INVENTARI I EQUIPAMENT =====
// state.inventory = { items: [ids], equipped: { slot: id } }. Es conserva en reiniciar la partida.
// L'inventari es desbloqueja amb el primer objecte (Pixel, en derrotar-lo als Carreronets de Sogorb).
const inventoryUnlocked = () => state.inventory.items.length > 0;
const equippedItem = slot => ITEMS[state.inventory.equipped[slot]] || null;
// Mascota equipada: ataca pel seu compte i no té vida (vegeu update() a combat.js)
const equippedAlly = () => equippedItem("pet");
const allyDamage = ally => state.player.atk * ally.ally.atkPct / 100;

let selectedSlot = "pet"; // espai seleccionat al panell

// Bonus de tot l'equipament posat (els suma; per als límits, es queda el més alt)
function equipmentStats() {
  const total = {};
  for (const s of EQUIP_SLOTS) {
    const st = equippedItem(s.id)?.stats || {};
    if (st.critPct) total.critPct = (total.critPct || 0) + st.critPct;
    if (st.critCap) total.critCap = Math.max(total.critCap || 0, st.critCap);
    if (st.lifesteal) total.lifesteal = (total.lifesteal || 0) + st.lifesteal;
    if (st.dodgePct) total.dodgePct = (total.dodgePct || 0) + st.dodgePct;
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
function gearHtml() {
  return EQUIP_SLOTS.map(s => {
    const item = equippedItem(s.id);
    return item?.ally ? `<div class="gear gear-ally">${item.look}</div>` : "";
  }).join("");
}

// Pell: la granoteta amb els colors canviats (el SVG original es guarda en initInventory)
let frogSvg = "";
// (també s'aplica a les peces posades: el braç que aguanta la capa és del color de la pell)
function skinned(svg) {
  const colors = equippedItem("skin")?.skin?.colors || {};
  return Object.entries(colors).reduce((out, [from, to]) => out.split(`"${from}"`).join(`"${to}"`), svg);
}
// La granoteta amb la pell i sense les parts que amaga l'equipament (p. ex. la pota que aguanta la capa)
function skinnedFrog() {
  const hidden = EQUIP_SLOTS.flatMap(s => equippedItem(s.id)?.hides || []);
  const svg = hidden.reduce((out, cls) => out.replace(`class="${cls}"`, `class="${cls}" display="none"`), frogSvg);
  return skinned(svg);
}
const auraClass = () => equippedItem("skin")?.skin?.aura || "";
// Peces que porta posades (ulleres, gorra...): un SVG amb les mateixes coordenades que la granoteta, dins del sprite
function wearHtml() {
  const parts = EQUIP_SLOTS.map(s => equippedItem(s.id)?.wear || "").join("");
  return parts ? `<svg class="wear-layer" viewBox="0 0 140 124" overflow="visible" aria-hidden="true">${skinned(parts)}</svg>` : "";
}

// ----- Panell de l'inventari -----

function renderInventory() {
  const inv = state.inventory;
  $("inventory-slots").innerHTML = EQUIP_SLOTS.map(s => {
    const item = equippedItem(s.id);
    return `<button class="inv-slot${s.id === selectedSlot ? " selected" : ""}${item ? "" : " empty"}" data-slot="${s.id}">
        <span class="inv-slot-item">${item ? item.look : s.icon}</span>
        <span class="inv-slot-name">${item ? item.name : s.name}</span>
      </button>`;
  }).join("");

  $("inventory-preview").innerHTML = `<div class="gear-layer">${gearHtml()}</div><div class="sprite inv-frog ${auraClass()}">${skinnedFrog()}${wearHtml()}</div>`;

  // Fitxa de l'espai seleccionat
  const slot = EQUIP_SLOTS.find(s => s.id === selectedSlot);
  const item = equippedItem(selectedSlot);
  $("inventory-detail").innerHTML = item ? `
      <div class="inv-detail-name">${item.name} <span class="muted">· ${slot.icon} ${slot.name}</span></div>
      <div class="inv-detail-desc">${item.desc}</div>
      ${itemEffect(item)}
      <button class="small secondary" data-toggle="${inv.equipped[selectedSlot]}">Desequipar</button>`
    : `<div class="inv-detail-name">${slot.icon} ${slot.name}</div>
      <div class="muted">Espai buit. ${inv.items.some(id => ITEMS[id].slot === selectedSlot)
        ? "Tria un objecte de la motxilla per a equipar-lo." : "Encara no tens res per a aquest espai."}</div>`;

  // Motxilla: objectes que tens però no portes posats
  const bag = inv.items.filter(id => !Object.values(inv.equipped).includes(id));
  $("inventory-bag").innerHTML = bag.length
    ? bag.map(id => `<button class="inv-bag-item" data-toggle="${id}" title="Equipar">${ITEMS[id].look}<span>${ITEMS[id].name}</span></button>`).join("")
    : `<p class="muted">La motxilla està buida.</p>`;
}

function itemEffect(item) {
  const lines = [];
  if (item.ally) {
    const a = item.ally;
    lines.push(`⚔️ Ataca pel seu compte cada ${fmtNum(a.interval)} s: el ${a.atkPct}% del teu atac
      (ara ${fmtNum(allyDamage(item))} de dany). No té vida: els enemics no la poden atacar.`);
  }
  const st = item.stats || {};
  if (st.critPct) lines.push(`🎯 +${st.critPct}% de crític` +
    (st.critCap ? `. Amb elles posades, el crític pot arribar al ${st.critCap}% (sense, el màxim és el ${CONFIG.combat.maxCritChance}%)` : "") + ".");
  if (st.lifesteal) lines.push(`💚 Et cures el ${fmtPct(st.lifesteal)}% del dany que fas (tu i la teua mascota).`);
  if (st.dodgePct) lines.push(`🟥 Esquives el ${st.dodgePct}% dels atacs enemics («Olé!»).`);
  return lines.map(l => `<div class="inv-effect">${l}</div>`).join("");
}

// Actualitza tot el que depén de l'inventari: pestanya, aspecte de la granoteta i panell
function refreshInventory() {
  $("tab-btn-inventory").hidden = !inventoryUnlocked();
  $("player-gear").innerHTML = gearHtml();
  $("player-wear").innerHTML = wearHtml();
  // pell: es canvia el SVG de la granoteta i l'aura del sprite
  const sprite = $("player-sprite");
  if (!frogSvg) return; // encara no s'ha guardat la granoteta original (initInventory)
  sprite.querySelector("svg.frog").outerHTML = skinnedFrog();
  sprite.classList.remove(...[...sprite.classList].filter(c => c.startsWith("aura-")));
  if (auraClass()) sprite.classList.add(auraClass());
  if (!$("tab-inventory").hidden) renderInventory();
}

function initInventory() {
  frogSvg = $("player-sprite").querySelector("svg.frog").outerHTML;
  // Clics als espais, a la fitxa i a la motxilla
  $("tab-inventory").addEventListener("click", ev => {
    const slot = ev.target.closest("[data-slot]");
    if (slot) { selectedSlot = slot.dataset.slot; renderInventory(); return; }
    const toggle = ev.target.closest("[data-toggle]");
    if (toggle) toggleEquip(toggle.dataset.toggle);
  });
  refreshInventory();
}
