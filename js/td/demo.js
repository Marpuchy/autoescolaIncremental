// ===== DEMOSTRACIÓ DEL GRIMORI: el combat de veritat, en petit =====
// El grimori obri tddemo.html?d=<criatura> en un iframe. Ací corre el mateix codi del combat (battle.js) amb un món
// fet a mida perquè es veja bé l'arma: el camí, on va la criatura, quines amigues té al costat i quines distraccions
// passen. No guarda res (ni l'estudi ni l'autoescola): tot és una partida nova en memòria.

let tdRoom = "informatic";
let tdDevSpeed = 1;                       // (de la consola dev, que ací no es carrega)
function toast() {}                       // a la demostració no hi ha avisos
tdSave = () => {};                        // ni es guarda res
const TD_DEMO_ID = new URLSearchParams(location.search).get("d");

// Camins (coordenades del mapa 1600×900). view: el tros que es veu (proporció ~1,4, com el requadre del llibre),
// centrat en la criatura; les distraccions entren per la dreta
const TD_DEMO_ROAD = [[1400, 470], [-160, 470]];                                   // un camí recte de dreta a esquerra
const TD_DEMO_U = [[1640, 300], [330, 300], [330, 640], [1760, 640]];              // dos trams, un damunt de l'altre

// Escenaris: per criatura i, si no n'hi ha, per rol. slots: on va cada criatura (la primera és la que es mostra);
// allies: les amigues; spawn: [distraccions que ixen juntes, segons entre grups]; gap: segons entre les d'un grup.
const TD_DEMO_SCENES = {
  default:   { view: [420, 150, 720, 500], path: TD_DEMO_ROAD, slots: [[640, 320]], spawn: [["notificacio"], 1.3] },
  pierce:    { view: [200, 150, 720, 500], path: TD_DEMO_ROAD, slots: [[380, 330]], spawn: [["notificacio", "notificacio", "notificacio", "notificacio"], 3.6], gap: 0.3 },
  aoe:       { view: [440, 150, 720, 500], path: TD_DEMO_ROAD, slots: [[680, 320]], spawn: [["notificacio", "notificacio", "notificacio", "notificacio"], 3.4], gap: 0.22 },
  pulse:     { view: [460, 150, 720, 500], path: TD_DEMO_ROAD, slots: [[700, 320]], spawn: [["notificacio", "notificacio", "notificacio", "notificacio"], 3], gap: 0.25 },
  smart:     { path: TD_DEMO_ROAD, slots: [[640, 320]], spawn: [["notificacio", "procrastinacio", "notificacio"], 3.4], gap: 0.5 },
  execute:   { path: TD_DEMO_ROAD, slots: [[640, 320]], spawn: [["procrastinacio"], 3.5] },
  stacks:    { path: TD_DEMO_ROAD, slots: [[640, 320]], spawn: [["notificacio", "notificacio", "notificacio"], 2.6], gap: 0.4 },
  line:      { view: [560, 180, 760, 540], path: TD_DEMO_U, slots: [[980, 470]], spawn: [["notificacio", "notificacio"], 1.8], gap: 0.6 },
  mark:      { view: [400, 150, 720, 500], path: TD_DEMO_ROAD, slots: [[560, 320], [880, 320]], allies: ["pi"], spawn: [["procrastinacio", "notificacio", "notificacio"], 3.6], gap: 0.6 },
  lambda:    { path: TD_DEMO_ROAD, slots: [[640, 320]], spawn: [["notificacio", "notificacio", "notificacio", "notificacio"], 3.6], gap: 0.4 },
  chain:     { view: [420, 150, 720, 500], path: TD_DEMO_ROAD, slots: [[600, 320]], spawn: [["notificacio", "notificacio", "notificacio", "notificacio", "notificacio"], 4], gap: 0.75 },
  slow:      { view: [420, 150, 720, 500], path: TD_DEMO_ROAD, slots: [[640, 320]], spawn: [["notificacio", "notificacio", "notificacio"], 3.4], gap: 0.8 },
  clock:     { view: [420, 150, 720, 500], path: TD_DEMO_ROAD, slots: [[640, 300]], spawn: [["notificacio", "notificacio", "notificacio", "notificacio"], 3.6], gap: 0.55 },
  hook:      { view: [420, 150, 720, 500], path: TD_DEMO_ROAD, slots: [[640, 330]], spawn: [["son", "meme"], 5], gap: 1.4 },
  swarm:     { view: [420, 150, 720, 500], path: TD_DEMO_ROAD, slots: [[640, 330]], spawn: [["meme", "son", "meme"], 3.6], gap: 0.9 },
  bellow:    { view: [420, 150, 720, 500], path: TD_DEMO_ROAD, slots: [[640, 330]], spawn: [["son", "meme", "son", "meme"], 3.2], gap: 0.7 },
  capacitor: { view: [420, 150, 720, 500], path: TD_DEMO_ROAD, slots: [[640, 320]], spawn: [["notificacio", "notificacio", "notificacio", "notificacio"], 5], gap: 0.3 },
  samara:    { view: [40, 120, 1000, 700], path: TD_DEMO_ROAD, slots: [[180, 320]], spawn: [["notificacio"], 1.6] },
  carrasca:  { view: [400, 150, 720, 500], path: TD_DEMO_ROAD, slots: [[560, 320], [880, 320]], allies: ["pi"], spawn: [["notificacio", "notificacio", "notificacio"], 3], gap: 0.25 },
  projecte:  { view: [260, 110, 1060, 740], path: TD_DEMO_ROAD, slots: [[640, 320], [380, 320], [900, 320], [1160, 320]], allies: ["carrasca", "contrafoc", "anells"],
               spawn: [["notificacio", "notificacio", "procrastinacio", "notificacio"], 3.2], gap: 0.35 },
};

function tdDemoBoot() {
  const d = TD_DEFENDERS[TD_DEMO_ID];
  if (!d) return;
  tdRoom = tdModeOf(TD_DEMO_ID);
  const scene = TD_DEMO_SCENES[TD_DEMO_ID] || TD_DEMO_SCENES[d.special?.type === "align" ? "lambda" : d.role] || TD_DEMO_SCENES.default;
  const ids = [TD_DEMO_ID, ...(scene.allies || [])];
  td = tdNewState();
  td.owned = Object.fromEntries(ids.map(id => [id, { copies: 1, level: 1, stars: 1 }]));
  td.team = ids.slice();
  // el món de la demostració: el cristall i l'estudiant queden fora de la vista
  const world = { id: 999, mode: tdRoom, name: "Demostració", path: scene.path, slots: scene.slots, crystal: [-300, 470], student: [-420, 900], waves: [[]] };
  TD_WORLDS.push(world);
  tdOpenBattle(999);
  // la vista s'acosta a on passa tot (el combat sencer seria massa menut dins del llibre)
  const view = (scene.view || TD_DEMO_SCENES.default.view).join(" ");
  const fit = () => $("tdb-svg").setAttribute("viewBox", view);
  fit();
  addEventListener("resize", () => setTimeout(fit, 0));
  tdb.god = true; tdb.mana = 1e9; tdb.wave = 1; tdb.waveRunning = false; tdb.demo = true;
  ids.forEach((id, i) => tdbPlace(i, id));
  // les distraccions passen en grups, una vegada i una altra (com a la primera onada)
  const [group, every] = scene.spawn, gap = scene.gap || 0.4;
  let next = 0;
  const spawn = () => {
    if (!tdb) return;
    if (tdb.time >= next) {
      next = tdb.time + every;
      group.forEach((type, i) => tdb.spawnQueue.push([type, i ? gap : 0.01]));
    }
    tdb.mana = 1e9;
    requestAnimationFrame(spawn);
  };
  requestAnimationFrame(spawn);
}
tdDemoBoot();
