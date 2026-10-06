// ===== EFECTES VISUALS =====
function restartAnim(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth; // força el reflow perquè l'animació torne a començar
  el.classList.add(cls);
}

// opts.crit: cop crític · opts.parried: dany que la granoteta torna en parar · opts.thorns: dany de les espines
// opts.missed: text quan el cap esquiva o és immune (js/bosses.js)
function attackFx(attacker, target, dmg, opts = {}) {
  const aAv = $(attacker + "-avatar");
  const tAv = $(target + "-avatar");
  const a = aAv.getBoundingClientRect();
  const t = tAv.getBoundingClientRect();
  const dx = (t.left + t.width / 2) - (a.left + a.width / 2);
  const dy = (t.top + t.height / 2) - (a.top + a.height / 2);

  aAv.style.setProperty("--dx", `${dx}px`);
  aAv.style.setProperty("--dy", `${dy}px`);
  aAv.style.setProperty("--rot", `${dx >= 0 ? 14 : -14}deg`);
  $(attacker).classList.add("attacking");
  $(target).classList.remove("attacking");
  restartAnim(aAv, "lunge");

  setTimeout(() => {
    if (opts.missed) { spawnText(tAv, opts.missed, "skill"); return; }
    if (opts.parried !== undefined) {
      // Parada: l'atacant rep el seu propi cop
      spawnText(tAv, "🛡️ PARADA!", "parry");
      if (!opts.parried) return; // el cap era intangible: no li fa res
      restartAnim($(attacker), "hit");
      spawnDamage(aAv, opts.parried, target);
      return;
    }
    restartAnim($(target), "hit");
    spawnDamage(tAv, dmg, attacker, opts.crit ? "crit" : "");
    if (opts.thorns > 0) spawnDamage(aAv, opts.thorns, target, "thorns");
  }, CONFIG.hitDelay);
}

function spawnDamage(avatar, dmg, attacker, kind = "") {
  spawnText(avatar, kind === "crit" ? `💥 -${fmtNum(dmg)}!` : kind === "thorns" ? `🌵 -${fmtNum(dmg)}` : `-${fmtNum(dmg)}`,
    `by-${attacker} ${kind}`);
}

function spawnText(avatar, text, cls) {
  const n = document.createElement("span");
  n.className = `dmg ${cls}`;
  n.textContent = text;
  n.style.setProperty("--ox", `${Math.round(Math.random() * 60 - 30)}px`);
  n.addEventListener("animationend", () => n.remove());
  avatar.appendChild(n);
}

// html: els missatges són interns (permeten la icona de la L)
function toast(html, type = "") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = html;
  el.addEventListener("animationend", () => el.remove());
  const box = $("toasts");
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
}
