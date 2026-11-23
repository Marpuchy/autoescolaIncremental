"""Bot del joc d'estudi: compara el balanç de les criatures (Playwright, obri index.html en local, mode de proves).

Dos proves per criatura:
  - dany: una sola criatura (nivell 1) davant d'un corrent de distraccions immortals que passen pel camí durant 30 s.
    Dona el dany per segon (DPS) i el DPS per cada 100 de maná, i el compara amb la mitjana de la seua raresa.
  - mon: juga el món 1 de la seua carrera: fins a 2 comunes per a aguantar el principi i després només la criatura
    provada, cada vegada que hi ha maná. Dona fins a quina onada arriba i les vides que li queden.

Ús:
  python tools/td-bot.py                    # totes les criatures
  python tools/td-bot.py contrafoc samara    # només estes (la comparació amb la raresa es fa igual amb totes)
  python tools/td-bot.py --mon               # afig la prova del món (més lenta)
No toca cap partida real: és un navegador nou i local (versió de proves), i no escriu en el núvol.
"""
import json, pathlib, shutil, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / "index.html").as_uri()
ids_wanted = [a for a in sys.argv[1:] if not a.startswith("--")]
with_world = "--mon" in sys.argv

DPS_JS = """(id) => {
  const d = TD_DEFENDERS[id], mode = tdModeOf(id), world = TD_WORLDS.find(w => w.mode === mode && !w.soon);
  td.owned[id] = td.owned[id] || { copies: 1, level: 1, stars: 1 };
  if (!tdTeam(mode).includes(id)) td.team.push(id);
  tdRoom = mode;
  if (tdb) tdStopBattle();
  td.worlds = {}; // un combat nou cada vegada (sense la partida guardada del món)
  tdOpenBattle(world.id);
  tdb.speed = 0; tdb.god = true; tdb.mana = 1e6;
  tdbPlace(1, id);
  // corrent de distraccions immortals que passen pel camí (tornen a començar en arribar al final)
  for (let k = 0; k < 14; k++) tdbSpawn("notificacio", k * 90);
  for (const e of tdb.enemies) { e.hp = e.maxHp = 1e9; e.def = { ...e.def, speed: 60, sleep: null }; }
  const T = 30;
  for (let t = 0; t < T; t += 0.05) {
    for (const e of tdb.enemies) if (e.dist > tdbP(e).total - 30) e.dist = 0;
    tdbUpdate(0.05);
  }
  const dmg = tdb.enemies.reduce((s, e) => s + (1e9 - Math.max(0, e.hp)), 0);
  tdStopBattle(); // (tancar-lo només el deixaria en marxa en segon pla: els mons són de 100 onades)
  return { id, name: d.name, rar: d.rar, cost: d.cost, dps: dmg / T };
}"""

WORLD_JS = """(id) => {
  const mode = tdModeOf(id), world = TD_WORLDS.find(w => w.mode === mode && !w.soon);
  const commons = Object.keys(TD_DEFENDERS).filter(k => tdModeOf(k) === mode && TD_DEFENDERS[k].rar === "comu");
  const team = [id, ...commons.filter(c => c !== id)];
  for (const k of team) td.owned[k] = td.owned[k] || { copies: 1, level: 1, stars: 1 };
  td.team = td.team.filter(k => tdModeOf(k) !== mode).concat(team);
  tdRoom = mode;
  if (tdb) tdStopBattle();
  td.worlds = {}; // un combat nou cada vegada (sense la partida guardada del món)
  tdOpenBattle(world.id);
  tdb.speed = 0;
  const slots = tdb.world.slots.map((_, i) => i);
  let placedCommons = 0;
  for (let t = 0; t < 900 && !tdb.over; t += 0.05) {
    if (!tdb.waveRunning && !tdb.spawnQueue.length && !tdb.enemies.length) tdbStartWave();
    // la criatura provada sempre que hi haja maná; mentrestant, fins a 2 comunes perquè no caiga a la primera onada
    const free = slots.find(i => !tdb.towers[i]);
    if (free !== undefined) {
      if (tdb.mana >= TD_DEFENDERS[id].cost) tdbPlace(free, id);
      else if (placedCommons < 2 && team[1] && tdb.mana >= TD_DEFENDERS[team[1 + placedCommons % (team.length - 1)]].cost && tdbPlace(free, team[1 + placedCommons % (team.length - 1)])) placedCommons++;
    }
    tdbUpdate(0.05);
    if (tdb.wave >= tdb.world.waves.length && !tdb.spawnQueue.length && !tdb.enemies.some(e => e.hp > 0)) break;
  }
  const r = { id, wave: tdb.wave, of: tdb.world.waves.length, lives: Math.round(tdb.lives) };
  tdStopBattle(); // (tancar-lo només el deixaria en marxa en segon pla: els mons són de 100 onades)
  return r;
}"""


def main():
    chrome = shutil.which("google-chrome")
    with sync_playwright() as p:
        b = p.chromium.launch(**({"executable_path": chrome, "args": ["--no-sandbox"]} if chrome else {}))
        pg = b.new_page(viewport={"width": 1440, "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.add_init_script("localStorage.setItem('estudi-qui','marc')")
        pg.goto(URL)
        pg.wait_for_timeout(1200)
        pg.evaluate("closeRoom && closeRoom()")
        ids = pg.evaluate("Object.keys(TD_DEFENDERS)")
        rows = [pg.evaluate(DPS_JS, i) for i in ids]
        by_rar = {}
        for r in rows:
            by_rar.setdefault(r["rar"], []).append(r["dps"])
        print(f"{'criatura':24} {'raresa':11} {'cost':>5} {'DPS':>7} {'DPS/100 maná':>13} {'vs raresa':>10}")
        for r in rows:
            if ids_wanted and r["id"] not in ids_wanted:
                continue
            avg = sum(by_rar[r["rar"]]) / len(by_rar[r["rar"]])
            print(f"{r['name'][:24]:24} {r['rar']:11} {r['cost']:>5} {r['dps']:>7.1f} {100 * r['dps'] / r['cost']:>13.1f} {r['dps'] / avg * 100 if avg else 0:>9.0f}%")
        print("(DPS només de dany, contra 14 distraccions que passen: les de zona hi ixen inflades i les que paren, marquen o")
        print(" milloren altres no hi compten. Per a eixes, mirar la prova del món o fer-ne una demostració amb amigues)")
        if with_world:
            print(f"\n{'criatura':24} {'onada':>9} {'vides':>6}")
            for i in (ids_wanted or ids):
                r = pg.evaluate(WORLD_JS, i)
                print(f"{i:24} {r['wave']:>4} / {r['of']:<3} {r['lives']:>6}")
        if errs:
            print("\nErrors de JavaScript:", *errs, sep="\n  ")
        b.close()


main()
