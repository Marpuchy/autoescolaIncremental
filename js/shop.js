// ===== BOTIGA (L -> diners) =====
const shopCost = () => CONFIG.shop.baseLCost + state.shopPurchases * CONFIG.shop.lCostGrowth;
const shopCoins = () => Math.round(CONFIG.shop.enemiesWorth * CONFIG.enemy.baseReward *
  Math.pow(CONFIG.enemy.rewardGrowth, state.level - 1));

function renderShop() {
  const cost = shopCost();
  $("shop-coins").textContent = fmt(shopCoins());
  const label = `Comprar per ${cost} ${L_ICON}`;
  if ($("btn-shop-buy").innerHTML !== label) $("btn-shop-buy").innerHTML = label; // evita perdre clics
  $("btn-shop-buy").disabled = state.lcoins < cost;
  const info = `Compres fetes: ${state.shopPurchases}. Cada compra puja el preu ${CONFIG.shop.lCostGrowth} ${L_ICON}. ` +
    `Els diners que dona depenen del teu nivell actual.`;
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
