# Autoescola Incremental

Joc incremental de la granoteta que es trau el carnet. HTML + CSS + JavaScript sense dependències ni compilació:
n'hi ha prou amb obrir `index.html` (també funciona des de `file://`).

## Estructura

```
index.html          Maquetació i ordre de càrrega dels scripts
style.css           Estils (inclou mòbil)
img/                Fons dels escenaris
js/
  config.js         CONFIG: tot el balanç del joc
  util.js           $(), formatació de números, shuffle...
  data/             Continguts: escenaris, enemics, millores, preguntes d'examen
  state.js          Estat de la partida (newState) i escenari de cada nivell
  save.js           Guardat, càrrega i migracions de partides
  enemies.js        Generació d'enemics
  upgrades.js       Millores i ampliacions amb L (lògica + panell)
  progress.js       Pujar de nivell, passar d'escenari, reiniciar
  combat.js         Bucle de combat
  exam.js           Examen de final d'escenari
  tests.js          Registre de tests (moneda L) i ratxa
  shop.js           Botiga (L -> diners)
  bestiary.js       Compendi d'enemics
  fx.js             Animacions, números de dany i avisos
  render.js         Render de cada fotograma
  main.js           Arrencada: carrega la partida, connecta botons i inicia el bucle
```

Són scripts clàssics que compartixen l'àmbit global, així que **l'ordre de `<script>` d'`index.html` importa**:
les dades han d'anar abans que el codi que les usa en carregar-se, i `main.js` sempre l'últim.

## Consola de desenvolupador

Només en local (`file://`, `localhost`) apareix el botó 🛠 (o la tecla `º`): aprovar exàmens sols
(activat per defecte), invulnerabilitat, velocitat 1-10×, diners i L, saltar de nivell o d'escenari, exportar/importar
la partida... Des de la consola del navegador també es pot usar l'objecte `dev` (p. ex. `dev.gotoLevel(51)`).
Els ajustos es guarden a part de la partida, i `CONFIG.debug` es queda desactivat per als jugadors.

## No perdre les partides dels jugadors

Les partides es guarden en `localStorage` amb la clau `autoescuela-save-v2`. Abans de canviar res:

- No canvies mai `SAVE_KEY`.
- No canvies els noms dels camps de l'estat, els `id` de les millores ni els noms dels enemics.
- Si canvies l'estructura de l'estat, puja `SAVE_VERSION` i afig una migració a `MIGRATIONS` (`js/save.js`).
- Els camps nous no necessiten migració: s'omplin amb els valors per defecte de `newState()`.
