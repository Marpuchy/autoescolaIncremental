# Demostracions del grimori: en temps real (com es veuen al llibre), quan salta l habilitat de cada criatura.
# Ús: python tools/td-demo-check.py [id,id,...]   (sense ids: totes les que tenen habilitat). Ha d eixir en menys de ~12 s.
import pathlib, sys
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent.as_uri()
ids = sys.argv[1].split(",") if len(sys.argv) > 1 else ["vector","lambda","compilador","stack","rellotge","tesla","rusc","cervol","anells","carrasca","samara","projecte","condensador"]
HOOK = """()=>{window.EV=[]; const sp=tdbSpecial, bl=tdbBlast, cl=tdbClock, dc=tdbDischarge, ch=tdbChain;
  tdbSpecial=(t,g)=>{EV.push('especial@'+tdb.time.toFixed(1)); return sp(t,g)}; tdbBlast=t=>{EV.push('desbordament@'+tdb.time.toFixed(1)); return bl(t)};
  tdbClock=t=>{const d=TD_DEFENDERS[t.id]; const b=(t.ticks||0)+1; cl(t); if(b%d.every===0) EV.push('tic doble@'+tdb.time.toFixed(1));};
  tdbDischarge=(...a)=>{EV.push('descàrrega@'+tdb.time.toFixed(1)); return dc(...a)};
  tdbChain=(...a)=>{ if(a[3]) EV.push('cadena sobrecàrrega@'+tdb.time.toFixed(1)); return ch(...a)}; }"""
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={"width":700,"height":490})
    pages = []
    for cid in ids:
        pg = ctx.new_page(); pg.goto(f"{root}/tddemo.html?d={cid}"); pages.append((cid, pg))
    for cid, pg in pages: pg.wait_for_function("()=>typeof tdb!=='undefined' && tdb"); pg.evaluate(HOOK)
    pages[0][1].wait_for_timeout(24000)
    for cid, pg in pages:
        ev = pg.evaluate("()=>EV"); en = pg.evaluate("()=>tdb.enemies.length")
        print(f"{cid:12} {' · '.join(ev[:5]) or '— CAP en 24 s'}")
    b.close()
