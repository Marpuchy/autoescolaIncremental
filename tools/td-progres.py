"""Prova de progrés del joc d'estudi: un equip sencer de 6 criatures a diferents punts de la partida (nivell i
estrelles) juga el món 1 de cada sala com ho faria una persona: posa criatures mentre hi ha buits i maná i, quan ja
no en cap cap, millora (◆) les que té. Diu fins a quina onada arriba, les vides i el saber guanyat.

Serveix per a vore si el món és un mur o massa fàcil, i si pujar de nivell les criatures fa un salt exagerat.

Ús: python tools/td-progres.py            (les dues sales)
    python tools/td-progres.py forestal   (només una)
No toca cap partida real: navegador nou i local (versió de proves), no escriu al núvol.
"""
import pathlib, shutil, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / "index.html").as_uri()
ROOMS = [a for a in sys.argv[1:] if not a.startswith("--")] or ["informatic", "forestal"]
# (nom, nivell, estrelles, quines raresas té l'equip)
STAGES = [
    ("Principi (Nv1 ★1, comunes i rares)", 1, 1, ["comu", "rar"]),
    ("Primers dies (Nv5 ★1-2)", 5, 2, ["comu", "rar", "epic"]),
    ("A mitjan (Nv10 ★3)", 10, 3, ["comu", "rar", "epic", "llegendari"]),
    ("Avançat (Nv15 ★3)", 15, 3, ["comu", "rar", "epic", "llegendari"]),
    ("Final (Nv25 ★5, totes)", 25, 5, ["comu", "rar", "epic", "llegendari", "mitic"]),
]

RUN_JS = """([mode, level, stars, rars]) => {
  const world = TD_WORLDS.find(w => w.mode === mode && !w.soon);
  // equip: les millors de cada raresa permesa (com a molt 6), de la sala
  const order = ["mitic", "llegendari", "epic", "rar", "comu"];
  // equip: les 2 més barates (per a obrir) i les 4 de més raresa
  const pool = Object.keys(TD_DEFENDERS).filter(k => tdModeOf(k) === mode && rars.includes(TD_DEFENDERS[k].rar));
  const cheap = [...pool].sort((a, b) => TD_DEFENDERS[a].cost - TD_DEFENDERS[b].cost).slice(0, 2);
  const team = [...cheap, ...pool.filter(k => !cheap.includes(k)).sort((a, b) => order.indexOf(TD_DEFENDERS[a].rar) - order.indexOf(TD_DEFENDERS[b].rar))].slice(0, 6);
  for (const k of team) td.owned[k] = { copies: 11, level: Math.min(level, 5 * stars), stars };
  td.team = td.team.filter(k => tdModeOf(k) !== mode).concat(team);
  td.upgrades = { vida: 0, mana: 0, saber: 0 };
  tdRoom = mode;
  tdOpenBattle(world.id);
  tdb.speed = 0;
  const slots = tdb.world.slots.map((_, i) => i);
  // posa primer les barates (per a aguantar el principi) i després les cares, per torns
  const byCost = [...team].sort((a, b) => TD_DEFENDERS[a].cost - TD_DEFENDERS[b].cost);
  let k = 0;
  for (let t = 0; t < 1500 && !tdb.over; t += 0.05) {
    if (!tdb.waveRunning && !tdb.spawnQueue.length && !tdb.enemies.length) tdbStartWave();
    const free = slots.find(i => !tdb.towers[i]);
    const next = byCost[k % byCost.length];
    if (free !== undefined) { if (tdb.mana >= TD_DEFENDERS[next].cost) { tdbPlace(free, next); k++; } } // si no es pot posar ací, la següent
    else {
      const up = Object.values(tdb.towers).filter(o => tdbUpCost(o) != null).sort((a, b) => tdbUpCost(a) - tdbUpCost(b))[0];
      if (up && tdb.mana >= tdbUpCost(up)) tdbUpgrade(up);
    }
    tdbUpdate(0.05);
    if (tdb.wave >= tdb.world.waves.length && !tdb.spawnQueue.length && !tdb.enemies.some(e => e.hp > 0)) break;
  }
  const won = tdb.wave >= tdb.world.waves.length && tdb.lives > 0;
  const r = { team: team.join(","), wave: tdb.wave, of: tdb.world.waves.length, lives: Math.round(tdb.lives), saber: Math.round(tdb.saber + (won ? TD_BATTLE.worldBonusSaber : 0)) };
  tdCloseBattle(false);
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
        for mode in ROOMS:
            print(f"\n== {mode} ==")
            print(f"{'moment':40} {'onada':>9} {'vides':>6} {'saber':>6}")
            for name, lvl, st, rars in STAGES:
                runs = [pg.evaluate(RUN_JS, [mode, lvl, st, rars]) for _ in range(2)]
                r = min(runs, key=lambda x: (x["wave"], x["lives"]))
                print(f"{name:40} {r['wave']:>4} / {r['of']:<3} {r['lives']:>6} {r['saber']:>6}")
        if errs:
            print("\nErrors de JavaScript:", *set(errs), sep="\n  ")
        b.close()


main()
