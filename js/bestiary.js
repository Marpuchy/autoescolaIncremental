// ===== COMPENDI D'ENEMICS =====
function bestiaryEntry(name) {
  return state.bestiary[name] ||= { seen: 0, defeated: 0, firstLevel: state.level };
}

let lastSeenEnemy = null;
function registerSeen(e) {
  if (lastSeenEnemy === e) return;
  lastSeenEnemy = e;
  const isNew = !state.bestiary[e.name];
  bestiaryEntry(e.name).seen++;
  if (isNew && state.enemy === e) toast(`📖 Nou enemic al compendi: ${e.name}`, "good");
  if (!$("tab-bestiary").hidden) renderBestiary();
}

// Nivell a partir del qual pot aparéixer cada tipus d'enemic
const typeFromLevel = i => i < 2 ? 1 : (i - 1) * CONFIG.levelsPerScene + 1;
const sizeLabel = mult => mult < 1.1 ? "Xicotet" : mult < 1.7 ? "Mitjà" : mult < 2.6 ? "Gran" : "Enorme";

let openBeast = null; // entrada del compendi desplegada

// Stats d'un enemic a un nivell, per a la fitxa del compendi (la recompensa ja inclou el bonus de diners)
function beastStats(mult, level) {
  const s = enemyStats(mult, level);
  const reward = Math.round(s.reward * (1 + (state.player.moneyBonus || 0)));
  return `<div class="beast-stats">
      <div class="beast-stats-title">Al nivell ${level}${level === state.level ? " (el teu)" : ""}</div>
      <span>❤️ ${fmt(s.maxHp)} de vida</span>
      <span>⚔️ ${fmtNum(s.atk)} cada ${fmtNum(s.attackInterval)} s</span>
      <span>💰 ${fmt(reward)}</span>
    </div>`;
}
// Següent nivell de cap (10, 20, 30...) a partir del nivell actual
const nextBossLevel = () => Math.ceil(state.level / CONFIG.bossEvery) * CONFIG.bossEvery;
// Índex d'un tipus pel nom (també les variants amb estreles), per a saber-ne el multiplicador
function typeIndexByName(name) {
  for (let i = 0; i < ENEMY_TYPES.length + 200; i++) if (enemyType(i).name === name) return i;
  return -1;
}

function renderBestiary() {
  // Només: els ja vistos + els que poden eixir en l'escenari actual (els futurs no es mostren)
  const availableNow = 2 + sceneIndex(state.level);
  const entries = [
    ...ENEMY_TYPES.map((t, i) => ({ ...t, from: `Des del nivell ${typeFromLevel(i)}`, now: i < availableNow,
      lvl: i < availableNow ? state.level : typeFromLevel(i) })),
    { name: BOSS_NAME, icon: BOSS_ICON, mult: CONFIG.bossMultiplier, desc: BOSS_DESC, now: !sceneOf(state.level).boss, lvl: nextBossLevel(),
      from: `Cap dels nivells ${CONFIG.bossEvery}, ${CONFIG.bossEvery * 2}...` },
    // Caps especials d'alguns escenaris
    ...SCENES.map((sc, i) => sc.boss && { ...sc.boss, mult: CONFIG.bossMultiplier, lvl: (i + 1) * CONFIG.levelsPerScene,
      now: sceneIndex(state.level) === i, from: `Cap de «${sc.name}»` }).filter(Boolean),
  ];
  // Variants amb estreles que ja s'han vist
  for (const name of Object.keys(state.bestiary)) {
    if (!entries.some(e => e.name === name)) {
      const base = ENEMY_TYPES.find(t => name.startsWith(t.name));
      const idx = typeIndexByName(name);
      entries.push({ name, icon: base ? base.icon : "❓", mult: idx >= 0 ? enemyType(idx).mult : 3.5, from: "Variant",
        lvl: idx >= 0 ? Math.max(state.level, typeFromLevel(idx)) : state.level,
        desc: `Una versió encara més forta i empipadora de «${base ? base.name : "?"}».` });
    }
  }
  const shown = entries.filter(e => state.bestiary[e.name] || e.now);
  const found = shown.filter(e => state.bestiary[e.name]).length;
  $("bestiary-count").textContent = `${found} ${found === 1 ? "descobert" : "descoberts"}`;

  $("bestiary-list").innerHTML = shown.map(e => {
    const b = state.bestiary[e.name];
    const open = openBeast === e.name;
    if (!b) return `
      <div class="beast unknown${open ? " open" : ""}" data-name="${e.name}">
        <div class="beast-row">
          <div class="beast-icon">${e.icon}</div>
          <div class="beast-info"><div class="beast-name">???</div><div class="beast-meta">Pot aparéixer en aquest escenari</div></div>
        </div>
        <div class="beast-desc">Encara no l'has vist. Continua avançant!</div>
      </div>`;
    return `
      <div class="beast${open ? " open" : ""}" data-name="${e.name}">
        <div class="beast-row">
          <div class="beast-icon">${e.icon}</div>
          <div class="beast-info">
            <div class="beast-name">${e.name}</div>
            <div class="beast-meta">${sizeLabel(e.mult)} · ${e.from}</div>
            <div class="beast-meta">Vist ${b.seen} ${b.seen === 1 ? "vegada" : "vegades"} · Derrotat ${b.defeated}</div>
          </div>
        </div>
        <div class="beast-desc">${e.desc || ""}${beastStats(e.mult, e.lvl)}</div>
      </div>`;
  }).join("");
}
