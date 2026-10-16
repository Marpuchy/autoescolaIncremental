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

let openBeast = null;   // enemic que es mostra a la fitxa del diari
let bestiaryPage = 0;   // pàgina de l'índex del diari

// Stats d'un enemic a un nivell, per a la fitxa del compendi (la recompensa ja inclou el bonus de diners)
// boss: cap especial (les seues stats estan compensades per l'habilitat)
function beastStats(mult, level, boss) {
  const s = boss ? bossStats(boss, level) : enemyStats(mult, level);
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
function renderBestiary() {
  // Només: els ja vistos + els que poden eixir en l'escenari actual (els futurs no es mostren)
  const availableNow = availableTypes(state.level);
  const entries = [
    ...ENEMY_TYPES.map((t, i) => ({ ...t, from: `Des del nivell ${typeFromLevel(i)}`, now: i < availableNow,
      lvl: i < availableNow ? state.level : typeFromLevel(i) })),
    { name: BOSS_NAME, icon: BOSS_ICON, mult: CONFIG.bossMultiplier, desc: BOSS_DESC, now: !sceneOf(state.level).boss, lvl: nextBossLevel(),
      from: `Cap dels nivells ${CONFIG.bossEvery}, ${CONFIG.bossEvery * 2}...` },
    // Caps especials d'alguns escenaris
    ...SCENES.map((sc, i) => sc.boss && { ...sc.boss, special: sc.boss, mult: CONFIG.bossMultiplier, lvl: (i + 1) * CONFIG.levelsPerScene,
      now: sceneIndex(state.level) === i, from: `Cap de «${sc.name}»` }).filter(Boolean),
  ];
  const shown = entries.filter(e => state.bestiary[e.name] || e.now);
  const found = shown.filter(e => state.bestiary[e.name]).length;
  $("bestiary-count").textContent = `${found} ${found === 1 ? "descobert" : "descoberts"}`;

  // Diari obert: índex paginat a l'esquerra i fitxa a la dreta (al mòbil, una pàgina: índex o fitxa)
  const narrow = matchMedia("(max-width: 700px)").matches;
  const perPage = narrow ? 6 : 8;
  const pages = Math.max(1, Math.ceil(shown.length / perPage));
  if (!shown.some(e => e.name === openBeast)) openBeast = narrow ? null : (shown.find(e => state.bestiary[e.name]) || shown[0])?.name || null;
  bestiaryPage = Math.min(Math.max(0, bestiaryPage), pages - 1);
  const pageItems = shown.slice(bestiaryPage * perPage, (bestiaryPage + 1) * perPage);

  const row = e => {
    const b = state.bestiary[e.name];
    return `<button class="beast${b ? "" : " unknown"}${openBeast === e.name ? " open" : ""}" data-name="${e.name}">
        <span class="beast-icon">${e.icon}</span>
        <span class="beast-info"><span class="beast-name">${b ? e.name : "???"}</span>
          <span class="beast-meta">${b ? `Derrotat ${b.defeated}` : "Pot aparéixer ara"}</span></span>
      </button>`;
  };
  const index = `<div class="book-page book-index">
      ${pageItems.map(row).join("")}
      <div class="book-pager">
        <button class="small" data-page="${bestiaryPage - 1}" ${bestiaryPage === 0 ? "disabled" : ""} aria-label="Pàgina anterior">‹</button>
        <span>Pàgina ${bestiaryPage + 1} de ${pages}</span>
        <button class="small" data-page="${bestiaryPage + 1}" ${bestiaryPage >= pages - 1 ? "disabled" : ""} aria-label="Pàgina següent">›</button>
      </div>
    </div>`;

  const e = shown.find(x => x.name === openBeast);
  const b = e && state.bestiary[e.name];
  const back = narrow ? `<button class="small book-back" data-back>‹ Tornar a l'índex</button>` : "";
  const detail = !e ? `<div class="book-page book-detail"><p class="muted">Tria un enemic de l'índex.</p></div>`
    : !b ? `<div class="book-page book-detail unknown">${back}<div class="beast-big">${e.icon}</div>
        <h3>???</h3><p>Encara no l'has vist. Pot aparéixer en aquest escenari: continua avançant!</p></div>`
    : `<div class="book-page book-detail">${back}<div class="beast-big">${e.icon}</div>
        <h3>${e.name}</h3>
        <p class="beast-meta">${sizeLabel(e.mult)} · ${e.from}</p>
        <p class="beast-meta">Vist ${b.seen} ${b.seen === 1 ? "vegada" : "vegades"} · Derrotat ${b.defeated}</p>
        <p class="beast-desc">${e.desc || ""}</p>
        ${e.ability ? `<p class="beast-ability">⚡ ${e.ability}</p>` : ""}
        ${beastStats(e.mult, e.lvl, e.special)}
      </div>`;

  $("bestiary-list").innerHTML = narrow ? (openBeast ? detail : index) : `<div class="book">${index}${detail}</div>`;
}

