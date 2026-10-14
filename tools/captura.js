#!/usr/bin/env node
// ===== CAPTURES DEL JOC (Chrome headless) =====
// Obri el joc amb una partida nova, fa accions de la consola de desenvolupador i guarda una captura.
// A la capçalera de la captura s'escriu: errors de JavaScript, escenari, i si el panell dret té scroll horitzontal.
//
// Ús (des de l'arrel):
//   node tools/captura.js --level 140 --items all --tab inventory
//   node tools/captura.js --level 60 --size 1300x900,600x1000 --out captures
//   node tools/captura.js --svg img/escenari-13.svg,img/escenari-14.svg   (fons o sprites solts, en graella)
// Opcions: --level N · --items id,id|all · --equip id,id · --hub (obri la DGT) · --tab shop|test|bestiary|inventory · --god
//          --size AMPLExALT[,...] (Chrome headless no baixa de ~500 px d'ample: el mòbil es prova a 600)
//          --wait ms (temps virtual abans de la captura, per defecte 1500) · --out carpeta (per defecte la temporal)
// Llig la imatge resultant per a revisar-la. La partida de prova es fa en una pàgina a part: no toca la del navegador.
const fs = require('fs'), path = require('path'), os = require('os');
const { spawnSync } = require('child_process');
const { parseArgs } = require('./bot.js');

const ROOT = path.join(__dirname, '..');
const args = parseArgs(process.argv.slice(2));
const OUT = path.resolve(args.out || path.join(os.tmpdir(), 'autoescola-captures'));
fs.mkdirSync(OUT, { recursive: true });

const chrome = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium'].find(p => p && fs.existsSync(p));
if (!chrome) { console.error('No trobe Chrome/Edge. Indica el camí amb la variable CHROME.'); process.exit(1); }

const fileUrl = p => 'file:///' + path.resolve(p).split(path.sep).join('/');
const list = v => (v && v !== true ? String(v).split(',') : []);

function shoot(html, name, size) {
  const page = path.join(OUT, `${name}.html`);
  fs.writeFileSync(page, html);
  const png = path.join(OUT, `${name}-${size}.png`);
  spawnSync(chrome, ['--headless', '--disable-gpu', '--allow-file-access-from-files', '--hide-scrollbars',
    `--virtual-time-budget=${args.wait || 1500}`, `--screenshot=${png}`, `--window-size=${size.replace('x', ',')}`,
    fileUrl(page)], { timeout: 60000 });
  console.log(fs.existsSync(png) ? png : `No s'ha pogut fer la captura ${png}`);
}

if (args.svg) {
  // Graella d'SVG (fons a 16:9; els sprites es veuen sencers)
  const imgs = list(args.svg).map(f => `<figure><img src="${fileUrl(path.join(ROOT, f))}"><figcaption>${f}</figcaption></figure>`).join('');
  const html = `<body style="margin:0;background:#2b313b;color:#ddd;font:12px sans-serif;display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:8px">
    <style>figure{margin:0}img{width:100%;aspect-ratio:16/9;object-fit:contain;background:#555}</style>${imgs}</body>`;
  shoot(html, 'svg', args.size || '1600x1000');
  process.exit(0);
}

// Joc amb una partida nova + accions de la consola de desenvolupador
const actions = `
  ${args.god ? 'CONFIG.debug.godMode = true;' : ''}
  ${args.level ? `dev.gotoLevel(${Number(args.level)});` : ''}
  ${args.items === 'all' ? 'dev.giveAllItems();' : list(args.items).map(id => `dev.giveItem(${JSON.stringify(id)});`).join('')}
  ${list(args.equip).map(id => `if (!Object.values(state.inventory.equipped).includes(${JSON.stringify(id)})) toggleEquip(${JSON.stringify(id)});`).join('')}
  ${args.tab ? `openHub(); openHubPanel(${JSON.stringify(args.tab)});` : ''}
  ${args.hub ? 'openHub();' : ''}`;
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
html = html.replace('<head>', `<head><base href="${fileUrl(ROOT)}/">
  <script>window.__errs = []; addEventListener("error", e => __errs.push(e.message)); try { localStorage.clear(); } catch {}</script>`);
html = html.replace('</body>', `<script>
  setTimeout(() => {
    try { ${actions} } catch (err) { __errs.push(err.message); }
    setTimeout(() => {
      const doc = document.documentElement;
      document.querySelector("h1").textContent = "ERRORS: " + (__errs.join(" | ") || "cap") +
        " · escenari " + (sceneIndex(state.level) + 1) + " · scroll horitzontal: " + (doc.scrollWidth > doc.clientWidth ? "SÍ" : "no");
    }, 300);
  }, 300);
</script></body>`);
for (const size of list(args.size || '1300x900')) shoot(html, 'joc', size);
