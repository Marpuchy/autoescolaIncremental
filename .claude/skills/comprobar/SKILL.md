---
name: comprobar
description: Usar para verificar cualquier cambio en Autoescola Incremental antes de darlo por hecho: sintaxis, capturas del juego en escritorio y móvil, errores de JavaScript, scroll horizontal, lógica simulada y balance.
---

# Comprobar cambios

No digas que algo funciona sin haberlo visto. Elige lo que toque según el cambio:

## Sintaxis (siempre)
`for f in js/*.js js/data/*.js; do node --check $f || echo FAIL $f; done` (el hook ya lo hace al editar cada archivo).
SVG: `python -c "import xml.dom.minidom as m; m.parse('img/<archivo>.svg')"`.

## Visual (interfaz, sprites, fondos)
- `node tools/captura.js [--level N] [--items id,id|all] [--equip id] [--tab shop|test|bestiary|inventory] [--god]
  [--size 1300x900,600x1000]` y **lee las imágenes**. La cabecera de la captura dice:
  `ERRORS: …` (errores de JavaScript), el escenario y `scroll horitzontal: SÍ/no` de la pàgina. `--hub` obre la DGT i `--tab shop|test|bestiary|inventory` hi obri un punt.
- Fondos o sprites sueltos: `node tools/captura.js --svg img/a.svg,img/b.svg`.
- Mira: que nada se salga ni se tape, nombres con elipsis, que el móvil (600 px) también quepa.
- Móvil de verdad (390 px), interacción y errores de consola: skill `webapp-testing` (Playwright en Python, ya
  instalado). Abre `pathlib.Path("index.html").resolve().as_uri()`, usa `page.evaluate("dev.gotoLevel(140)")` y
  comprueba `document.documentElement.scrollWidth <= clientWidth`. `tools/captura.js` no baja de ~500 px de ancho.
- `--dump-dom` de Chrome se puede quedar colgado con el bucle del juego: usa las capturas.

## Lógica (combate, habilidades, objetos, guardado)
Simula en Node con el código real, como `tools/bot.js`: carga los scripts con `vm`, sustituye las funciones de
pintado por funciones vacías y comprueba números concretos (p. ej. "en 10 s la quemadura hace 3 × atac").
- Ojo con los decimales: 300 pasos de 0,1 s dan 29,9999 s, no 30.
- Guardado: prepara un `localStorage` falso con una partida antigua y comprueba que `load()` la convierte bien.

## Balance (tras tocar combate, objetos, vida o costes)
`node tools/bot.js` (16 partidas, jugador medio y bueno) y compáralo con lo anterior. Avisa al usuario si un
escenario pasa a 0 tests (trivial) o se dispara (muro). `--code "…"` prueba variantes sin tocar el código.

## Informar
Di qué has comprobado y cómo (captura, simulación, bot) y lo que no has podido comprobar. Si algo falla, enséñalo.
