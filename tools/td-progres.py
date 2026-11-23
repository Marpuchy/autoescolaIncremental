"""Prova de progrés del joc d'estudi: un equip sencer de 6 criatures a diferents punts de la partida (nivell i
estrelles) juga el món 1 de cada sala com ho faria una persona: posa criatures mentre hi ha buits i maná i, quan ja
no en cap cap, millora (◆) les que té. Diu fins a quina onada arriba, les vides i el saber guanyat.

Serveix per a vore si el món és un mur o massa fàcil, i si pujar de nivell les criatures fa un salt exagerat.

Ús: python tools/td-progres.py            (les dues sales, món 1)
    python tools/td-progres.py --mon=2    (el món 2 de cada sala)
    python tools/td-progres.py --temps=3600   (segons de joc com a molt per etapa; per defecte 5400)
Cada etapa juga el món de 100 onades fins que perd dues vegades la mateixa onada: dona la millor onada.
    python tools/td-progres.py forestal   (només una)
No toca cap partida real: navegador nou i local (versió de proves), no escriu al núvol.
"""
import pathlib, shutil, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / "index.html").as_uri()
ROOMS = [a for a in sys.argv[1:] if not a.startswith("--")] or ["informatic", "forestal"]
WORLD = next((int(a.split("=")[1]) for a in sys.argv[1:] if a.startswith("--mon=")), 1)  # quin món de la sala (1, 2…)
MAXT = next((int(a.split("=")[1]) for a in sys.argv[1:] if a.startswith("--temps=")), 5400)  # segons de joc com a molt per tirada
# (nom, nivell, estrelles, quines raresas té l'equip)
STAGES = [
    ("Principi (Nv1 ★1, comunes i rares)", 1, 1, ["comu", "rar"]),
    ("Primers dies (Nv5 ★1-2)", 5, 2, ["comu", "rar", "epic"]),
    ("A mitjan (Nv10 ★3)", 10, 3, ["comu", "rar", "epic", "llegendari"]),
    ("Avançat (Nv15 ★3)", 15, 3, ["comu", "rar", "epic", "llegendari"]),
    ("Final (Nv25 ★5, totes)", 25, 5, ["comu", "rar", "epic", "llegendari", "mitic"]),
]

RUN_JS = """([mode, level, stars, rars, nth, maxT]) => {
  const world = TD_WORLDS.filter(w => w.mode === mode && !w.soon)[nth - 1];
  td.worlds = {}; td.idle = { world: 0, at: 0 };
  for (const w of TD_WORLDS) if (w.mode === mode) td.worlds[w.id] = { best: 50, clears: 1 }; // tots oberts (i sense partida a mitges)
  td.worlds[world.id] = { best: 0, clears: 0 };
  const order = ["mitic", "llegendari", "epic", "rar", "comu"];
  // equip: les 2 més barates (per a obrir) i les 4 de més raresa
  const pool = Object.keys(TD_DEFENDERS).filter(k => tdModeOf(k) === mode && rars.includes(TD_DEFENDERS[k].rar));
  const cheap = [...pool].sort((a, b) => TD_DEFENDERS[a].cost - TD_DEFENDERS[b].cost).slice(0, 2);
  const team = [...cheap, ...pool.filter(k => !cheap.includes(k)).sort((a, b) => order.indexOf(TD_DEFENDERS[a].rar) - order.indexOf(TD_DEFENDERS[b].rar))].slice(0, 6);
  for (const k of team) td.owned[k] = { copies: 11, level: Math.min(level, 5 * stars), stars };
  td.team = td.team.filter(k => tdModeOf(k) !== mode).concat(team);
  td.upgrades = { vida: 0, mana: 0, saber: 0 };
  tdRoom = mode;
  if (tdb) tdStopBattle();
  tdOpenBattle(world.id, true);
  tdb.speed = 0;
  const saber0 = td.saber;
  // posa primer les barates (per a aguantar el principi) i després les cares, per torns
  const byCost = [...team].sort((a, b) => TD_DEFENDERS[a].cost - TD_DEFENDERS[b].cost);
  let k = 0, fails = 0, failWave = 0, t = 0;
  tdbStartWave();
  for (; t < maxT; t += 0.05) {
    if (tdb.lost) { // onada perduda: es torna a fer (com al joc); dues vegades la mateixa → s'ha quedat ací
      if (tdb.wave === failWave) fails++; else { fails = 1; failWave = tdb.wave; }
      if (fails >= 2) break;
      tdbRestore(tdRun(world.id).run.snap);
    }
    if (tdb.over) break;
    const slots = tdb.world.slots.map((_, i) => i), free = slots.find(i => !tdb.towers[i]);
    const next = byCost[k % byCost.length], busy = tdb.enemies.length > 6;
    const pick = tdb.mana >= TD_DEFENDERS[next].cost ? next : busy ? byCost.find(id => tdb.mana >= TD_DEFENDERS[id].cost) : null;
    if (free !== undefined) { if (pick) { tdbPlace(free, pick); if (pick === next) k++; } }
    else {
      const up = Object.values(tdb.towers).filter(o => tdbUpCost(o) != null).sort((a, b) => tdbUpCost(a) - tdbUpCost(b))[0];
      if (up && tdb.mana >= tdbUpCost(up)) tdbUpgrade(up);
    }
    tdbUpdate(0.05);
  }
  tdbBank();
  const r = { team: team.join(","), wave: tdRun(world.id).best, fails, min: Math.round(t / 60), saber: Math.round(td.saber - saber0) };
  tdStopBattle();
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
            print(f"\n== {mode} · món {WORLD} ==")
            print(f"{'moment':40} {'onada':>7} {'min':>5} {'saber':>8}")
            for name, lvl, st, rars in STAGES:
                r = pg.evaluate(RUN_JS, [mode, lvl, st, rars, WORLD, MAXT])
                print(f"{name:40} {r['wave']:>3} /100 {r['min']:>5} {r['saber']:>8}", flush=True)
        if errs:
            print("\nErrors de JavaScript:", *set(errs), sep="\n  ")
        b.close()


main()
