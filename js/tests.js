// ===== TESTS (moneda L) =====
const streakBonus = (streak, fails) =>
  Math.round(Math.min(streak, CONFIG.streak.maxStreak) * (CONFIG.streak.rate[fails] || 0));

function testReward(fails) {
  const base = CONFIG.testRewards[fails] || 0;
  return base + streakBonus(state.perfectStreak, fails);
}

function renderTestPanel() {
  const labels = ["0 errades", "1 errada", "2 errades", "3 o més"];
  $("test-options").innerHTML = labels.map((label, fails) => `
    <button data-fails="${fails}" class="${fails === 3 ? "secondary" : ""}">
      ${label} <small>(+${testReward(fails)} ${L_ICON})</small>
    </button>`).join("");
  $("test-options").querySelectorAll("button").forEach(btn =>
    btn.addEventListener("click", () => registerTest(Number(btn.dataset.fails))));

  const s = state.perfectStreak;
  const max = CONFIG.streak.maxStreak;
  const maxBonus = f => Math.round(max * CONFIG.streak.rate[f]);
  $("streak-info").innerHTML = (s > 0
    ? `<span class="streak">🔥 Ratxa de ${s} ${s === 1 ? "test aprovat" : "tests aprovats"}</span>${s >= max ? " (màxima)" : ""}. `
    : "") +
    `Cada test amb 2 errades o menys fa créixer la ratxa i dona ${L_ICON} extra (fins a +${maxBonus(0)} / +${maxBonus(1)} / +${maxBonus(2)} segons les errades). Només es perd amb 3 o més errades.`;
  $("tests-done").textContent = state.testsDone;
}

function registerTest(fails) {
  const reward = testReward(fails);
  state.testsDone++;
  state.lcoins += reward;
  if (fails < 3) {
    const bonus = streakBonus(state.perfectStreak, fails);
    state.perfectStreak++;
    toast(`📝 +${reward} ${L_ICON}` + (bonus > 0 ? ` (${bonus} de ratxa)` : "") + ` · 🔥 ratxa ${state.perfectStreak}`, "good");
  } else {
    if (state.perfectStreak > 1) toast(`💔 S'ha trencat la ratxa de ${state.perfectStreak}`, "bad");
    state.perfectStreak = 0;
    toast(`📝 Sense ${L_ICON}. Continua practicant!`, "bad");
  }
  renderTestPanel();
  renderUpgrades();
  save();
}
