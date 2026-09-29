// ===== RENDER DE CADA FOTOGRAMA (capçalera, escenari i combat) =====
let renderedEnemy = null;
let renderedSceneImg = null;
let spawnTimer = null;
const SPAWN_MS = 450; // ha de coincidir amb la durada de l'animació .sprite.spawn de style.css

function renderEnemySprite(e) {
  renderedEnemy = e;
  registerSeen(e);
  const sprite = $("enemy-sprite");
  sprite.innerHTML = enemyIcon(e);
  sprite.style.setProperty("--size", e.size || 1);
  restartAnim(sprite, "spawn");
  // Es lleva la classe en acabar: si no, cada colp (que substituïx l'animació) la tornaria a començar
  // i l'enemic es quedaria sempre a mitja aparició, menut i mig transparent
  clearTimeout(spawnTimer);
  spawnTimer = setTimeout(() => sprite.classList.remove("spawn"), SPAWN_MS);
}

function render() {
  const p = state.player, e = state.enemy;
  $("money").textContent = fmt(state.money);
  $("lcoins").textContent = fmt(state.lcoins);
  $("level").textContent = state.level;
  $("best").textContent = state.best;

  const scene = sceneOf(state.level);
  $("scene-num").textContent = sceneIndex(state.level) + 1;
  $("scene-name").textContent = scene.name;
  $("scene-level").textContent = ((state.level - 1) % CONFIG.levelsPerScene) + 1;
  $("scene-size").textContent = CONFIG.levelsPerScene;
  $("scene").style.setProperty("--scene-bg", scene.bg);
  const img = scene.img ? `url("${scene.img}")` : "none";
  if (renderedSceneImg !== img) { renderedSceneImg = img; $("scene").style.backgroundImage = img; }

  $("player-hp-bar").style.width = (Math.max(0, p.hp) / p.maxHp * 100) + "%";
  $("enemy-name").textContent = e.name;
  if (renderedEnemy !== e) renderEnemySprite(e);
  $("enemy-hp-bar").style.width = (Math.max(0, e.hp) / e.maxHp * 100) + "%";

  if (!$("tab-shop").hidden) renderShop();
  refreshUpgradeButtons();
}
