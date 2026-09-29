// ===== MILLORES I LÍMITS =====
const byId = id => UPGRADES.find(u => u.id === id);
const upgradeCost = u => Math.round(u.baseCost * Math.pow(u.costGrowth, state.upgrades[u.id]));
// Nivell màxim actual: el desbloquegen les ampliacions amb L, fins al maxLevel de la millora (si en té)
const capAfter = (u, tier) => Math.min(u.maxLevel ?? Infinity, CONFIG.levelCap.initial + tier * CONFIG.levelCap.step);
const upgradeCap = u => capAfter(u, state.expansions[u.id]);
// Encara es pot ampliar amb L? (no, si ja s'ha arribat al nivell màxim definitiu)
const canExpand = u => capAfter(u, state.expansions[u.id] + 1) > upgradeCap(u);
const expandCost = u => CONFIG.levelCap.baseLCost + state.expansions[u.id] * CONFIG.levelCap.lCostGrowth;
const isMaxed = u => state.upgrades[u.id] >= upgradeCap(u);
// L gastades en totes les ampliacions fetes d'una millora
const spentL = u => linearCostSum(state.expansions[u.id], CONFIG.levelCap.baseLCost, CONFIG.levelCap.lCostGrowth);
// Una millora desbloquejada ho queda per a sempre (encara que es reinicie la partida)
const visibleUpgrades = () => UPGRADES.filter(u => Math.max(sceneIndex(state.best), state.examsPassed) >= u.scene);
// Escalat en % segons les ampliacions (tier) fetes amb L: 100%, 110%, 121%... (cada millora pot tindre el seu %)
const scalingFactor = (u, tier) => Math.pow(1 + (u.scalingPct ?? CONFIG.levelCap.scalingPct) / 100, tier);
const scalingPct = (u, tier = state.expansions[u.id]) => Math.round(100 * scalingFactor(u, tier));
// Efecte per nivell segons les ampliacions
const effect = (u, tier = state.expansions[u.id]) => u.base * scalingFactor(u, tier);
// Probabilitat (0-1) d'una millora de probabilitat, amb límit
const chance = (id, maxPct) => Math.min(maxPct, state.upgrades[id] * effect(byId(id))) / 100;

// Les estadístiques es calculen a partir dels nivells i ampliacions (així l'escalat és retroactiu)
function recomputeStats() {
  const p = state.player;
  const lv = id => state.upgrades[id];
  const oldMax = p.maxHp || CONFIG.player.maxHp;

  p.atk = CONFIG.player.atk + lv("atk") * effect(byId("atk"));
  p.maxHp = CONFIG.player.maxHp + lv("hp") * effect(byId("hp"));
  p.attackInterval = Math.max(CONFIG.player.minInterval,
    CONFIG.player.attackInterval * Math.pow(1 - effect(byId("speed")) / 100, lv("speed")));
  p.regen = CONFIG.player.regen + lv("regen") * effect(byId("regen"));
  p.critChance = chance("crit", CONFIG.combat.maxCritChance);
  p.parryChance = chance("parry", CONFIG.combat.maxParryChance);
  p.moneyBonus = lv("money") * effect(byId("money")) / 100;
  p.thorns = lv("thorns") * effect(byId("thorns")) / 100;

  // Si puja la vida màxima, es guanya eixa diferència de vida actual
  p.hp = Math.min(p.maxHp, (p.hp ?? p.maxHp) + Math.max(0, p.maxHp - oldMax));
}

function buyUpgrade(id) {
  const u = byId(id);
  const cost = upgradeCost(u);
  if (!visibleUpgrades().includes(u) || isMaxed(u) || state.money < cost) return;
  state.money -= cost;
  state.upgrades[id]++;
  recomputeStats();
  renderUpgrades();
  save();
}

function expandUpgrade(id) {
  const u = byId(id);
  const cost = expandCost(u);
  if (!visibleUpgrades().includes(u) || !canExpand(u) || state.lcoins < cost) return;
  state.lcoins -= cost;
  state.expansions[id]++;
  recomputeStats();
  const scaled = scalingPct(u) !== scalingPct(u, state.expansions[id] - 1);
  toast(`🔓 ${u.name}: nivell màxim ${upgradeCap(u)}` + (scaled ? ` i escalat al ${scalingPct(u)}%` : "") +
    (canExpand(u) ? "" : " (definitiu)"), "good");
  renderUpgrades();
  save();
}

// ===== RENDER DE LES MILLORES =====
let openInfo = null; // mòbil: millora amb la info de la L desplegada (botó ⓘ)

// animateFrom: índex a partir del qual les millores són noves (per animar-les)
function renderUpgrades(animateFrom = Infinity) {
  const list = $("upgrade-list");
  const upgrades = visibleUpgrades();
  list.style.setProperty("--cols", Math.min(upgrades.length, 4)); // com a molt 4 per fila
  list.classList.toggle("compact", upgrades.length > 4); // dues files: targetes compactes (vegeu style.css)
  list.innerHTML = "";
  upgrades.forEach((u, i) => {
    const lv = state.upgrades[u.id];
    const cap = upgradeCap(u);
    const maxed = isMaxed(u);
    const tier = state.expansions[u.id];
    const e = effect(u), eNext = effect(u, tier + 1);
    const expandable = canExpand(u);
    const scales = scalingPct(u, tier + 1) !== scalingPct(u); // si l'ampliació també millora l'escalat

    const div = document.createElement("div");
    div.className = "upgrade" + (maxed ? " maxed" : "") + (i >= animateFrom ? " new" : "") + (openInfo === u.id ? " show-ltip" : "");
    div.innerHTML = `
      <div class="upgrade-head">
        <span class="upgrade-icon">${u.icon}</span>
        <span class="upgrade-title" title="${u.name}">${u.name}</span>
        <span class="upgrade-level">Nv. ${lv} / ${cap}</span>
      </div>
      <div class="upgrade-progress"><div style="width:${lv / cap * 100}%"></div></div>
      <div class="upgrade-total" title="${u.stat(state.player)}"><small>Total</small> ${u.total(lv, e)}</div>
      <div class="upgrade-stat">${u.stat(state.player)}</div>
      <div class="upgrade-next">${!maxed ? `Següent nivell: ${u.per(e)}` : expandable ? "🔒 Límit assolit: amplia'l amb L" : "🏁 Nivell màxim definitiu"}</div>
      <div class="upgrade-buttons">
        <button id="buy-${u.id}" class="buy">${maxed ? "Màxim" : `Millorar · ${fmt(upgradeCost(u))} 💰`}</button>
        <button class="linfo" aria-label="Què fa l'ampliació amb L">ⓘ</button>
        <span class="lwrap">
          <button id="expand-${u.id}" class="lbtn">${L_ICON} ${expandable ? expandCost(u) : "Màx."}</button>
          <div class="ltip">${!expandable ? `
            <div class="ltip-title">Ampliació amb ${L_ICON}</div>
            <div class="ltip-row"><span>Nivell màxim definitiu</span><b>${cap}</b></div>
            <div class="ltip-foot">Ja no es pot ampliar més. Ampliacions fetes: ${tier}.</div>` : `
            <div class="ltip-title">Ampliació amb ${L_ICON} (cost: ${expandCost(u)})</div>
            <div class="ltip-row"><span>Nivell màxim</span><b>${cap} → ${capAfter(u, tier + 1)}</b></div>${scales ? `
            <div class="ltip-row"><span>Escalat</span><b>${scalingPct(u)}% → ${scalingPct(u, tier + 1)}%</b></div>
            <div class="ltip-row"><span>Per nivell</span><b>${u.per(e)} → ${u.per(eNext)}</b></div>
            <div class="ltip-row"><span>Total actual</span><b>${u.total(lv, e)} → ${u.total(lv, eNext)}</b></div>` : ""}
            <div class="ltip-foot">${scales ? "L'escalat també s'aplica als nivells que ja tens. " : ""}${u.maxLevel ? `Nivell màxim definitiu: ${u.maxLevel}. ` : ""}Ampliacions fetes: ${tier}.</div>`}
          </div>
        </span>
      </div>`;
    div.querySelector(`#buy-${u.id}`).addEventListener("click", () => buyUpgrade(u.id));
    div.querySelector(`#expand-${u.id}`).addEventListener("click", () => expandUpgrade(u.id));
    div.querySelector(".linfo").addEventListener("click", () => {
      openInfo = openInfo === u.id ? null : u.id;
      renderUpgrades();
    });
    list.appendChild(div);
  });
}

// S'executa cada fotograma: només actualitza si els botons es poden prémer
function refreshUpgradeButtons() {
  for (const u of visibleUpgrades()) {
    const buy = $("buy-" + u.id);
    const exp = $("expand-" + u.id);
    if (buy) buy.disabled = isMaxed(u) || state.money < upgradeCost(u);
    if (exp) exp.disabled = !canExpand(u) || state.lcoins < expandCost(u);
  }
}
