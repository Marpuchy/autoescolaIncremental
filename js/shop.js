// ===== BOTIGA (L -> diners) =====
const shopCost = () => CONFIG.shop.baseLCost + state.shopPurchases * CONFIG.shop.lCostGrowth;
// Els diners d'X enemics normals del nivell actual, amb el bonus de diners (millora «Carnet jove») inclòs
const shopCoins = () => Math.round(CONFIG.shop.enemiesWorth * enemyStats(1, state.level).reward *
  (1 + (state.player.moneyBonus || 0)));

function renderShop() {
  const cost = shopCost();
  $("shop-coins").textContent = fmt(shopCoins());
  const label = `Comprar per ${cost} ${L_ICON}`;
  if ($("btn-shop-buy").innerHTML !== label) $("btn-shop-buy").innerHTML = label; // evita perdre clics
  $("btn-shop-buy").disabled = state.lcoins < cost;
  const bonus = state.player.moneyBonus > 0 ? ` Inclou el teu bonus de diners (+${fmtPct(state.player.moneyBonus * 100)}%).` : "";
  const info = `Compres fetes: ${state.shopPurchases}. Cada compra puja el preu ${CONFIG.shop.lCostGrowth} ${L_ICON}. ` +
    `Els diners que dona depenen del teu nivell actual.${bonus}`;
  if ($("shop-info").innerHTML !== info) $("shop-info").innerHTML = info;
}

function buyCoins() {
  const cost = shopCost();
  if (state.lcoins < cost) return;
  const coins = shopCoins();
  state.lcoins -= cost;
  state.money += coins;
  state.shopPurchases++;
  toast(`🏪 +${fmt(coins)} 💰 (-${cost} ${L_ICON})`, "good");
  renderShop();
  save();
}
