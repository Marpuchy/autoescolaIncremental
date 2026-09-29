// ===== GUARDAT =====
// IMPORTANT per a no perdre les partides dels jugadors en actualitzar el joc:
//  - SAVE_KEY no s'ha de canviar MAI.
//  - No canvies els noms dels camps de l'estat, els `id` de UPGRADES ni els noms dels enemics
//    (són claus de la partida guardada).
//  - Si canvies l'estructura de l'estat, puja SAVE_VERSION i afig una migració a MIGRATIONS.
//  - Els camps nous s'omplin sols amb els valors per defecte de newState().
const SAVE_KEY = "autoescuela-save-v2";
const SAVE_VERSION = 1;

// MIGRATIONS[n] converteix una partida de la versió n a la n+1
const MIGRATIONS = {
  // Partides d'abans de tindre versió: es donen per aprovats els escenaris ja superats
  0: data => ({ ...data, examsPassed: data.examsPassed ?? sceneIndex(data.best || 1) }),
};

// Si la partida ve d'una versió més nova del joc (p. ex. una pestanya amb el codi antic en memòria cau),
// es conserva el seu número de versió perquè la versió nova no hi torne a aplicar migracions.
let loadedSaveVersion = SAVE_VERSION;
// La consola de desenvolupador el posa a true abans de substituir la partida i recarregar,
// perquè el guardat en tancar la pàgina no la sobreescriga
let savingSuspended = false;

function save() {
  if (savingSuspended) return;
  const saveVersion = Math.max(SAVE_VERSION, loadedSaveVersion);
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, saveVersion })); } catch {}
}

// Guarda una còpia del text original abans de tocar res, per si alguna cosa isquera malament
function backupRawSave(raw, reason) {
  try { localStorage.setItem(`${SAVE_KEY}-backup-${reason}-${Date.now()}`, raw); } catch {}
}

function load() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch { return null; }
  if (!raw) return null;

  try {
    let data = JSON.parse(raw);
    if (!data || typeof data !== "object" || !data.player) throw new Error("partida no vàlida");

    let version = data.saveVersion || 0;
    if (version > SAVE_VERSION) {
      // Partida d'una versió més nova del joc: no la toquem
      backupRawSave(raw, "future");
      loadedSaveVersion = version;
    }
    if (version < SAVE_VERSION) backupRawSave(raw, `v${version}`);
    while (version < SAVE_VERSION) {
      if (MIGRATIONS[version]) data = MIGRATIONS[version](data);
      version++;
    }

    // Es mescla amb l'estat per defecte perquè els camps nous tinguen valor
    const base = newState();
    const merged = {
      ...base, ...data,
      upgrades: { ...base.upgrades, ...data.upgrades },
      expansions: { ...base.expansions, ...data.expansions },
      bestiary: { ...data.bestiary },
      player: { ...base.player, hp: data.player.hp, maxHp: data.player.maxHp, timer: data.player.timer || 0 },
    };
    delete merged.saveVersion;
    // Enemic guardat incomplet o antic: se'n genera un de nou
    const e = merged.enemy;
    if (!e || !isFinite(e.hp) || !isFinite(e.maxHp) || !isFinite(e.atk) || !e.name) merged.enemy = null;
    return merged;
  } catch (err) {
    // No es pot llegir: es guarda una còpia i es comença de zero
    console.error("No s'ha pogut carregar la partida", err);
    backupRawSave(raw, "error");
    return null;
  }
}
