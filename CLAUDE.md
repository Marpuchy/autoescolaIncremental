# Autoescola Incremental

Juego incremental en el navegador: una granoteta que se saca el carnet luchando contra el tráfico de pueblos y
ciudades valencianas. Lo juegan amigos del autor en escritorio y móvil. La "moneda" principal (L) sale de tests
reales de autoescuela que el jugador registra a mano. Publicado desde `main` (GitHub: Marpuchy/autoescolaIncremental).

## Stack
HTML + CSS + JavaScript sin dependencias ni compilación. Scripts clásicos que comparten el ámbito global
(no módulos): **el orden de `<script>` de `index.html` importa** y `main.js` va siempre el último.

## Comandos
- Jugar / probar: abrir `index.html` (vale con `file://`). En local aparece la consola 🛠 (tecla `º`) y el objeto `dev`.
- Sintaxis: `node --check js/<archivo>.js` (el hook de `.claude/` lo hace solo tras cada edición).
- Balance: `node tools/bot.js` (tests por escenario, jugador medio y bueno) · `node tools/tune.js --targets '{...}'`.
- Capturas: `node tools/captura.js --level 140 --items all --tab inventory` · `--svg img/escenari-13.svg`.
- Habitación (pantalla de inicio): `node tools/habitacio.js` (regenera `js/data/room-art.js`).
- Sala del juego de estudio: `node tools/sala-estudi.js` (regenera `js/data/td-lobby-art.js`).
- Escena de la DGT: `node tools/dgt.js` (regenera `js/data/hub-art.js`; motor de perspectiva en `tools/perspectiva.js`).
  Con Playwright (instalado para Python): skill `webapp-testing`, abriendo `index.html` como `file://`.
- No hay build, lint ni tests automáticos.

## Estructura
- `js/config.js` — todo el balance (`CONFIG`): vida/ataque/recompensa, `sceneHpMult` por escenario, costes.
- `js/data/` — contenidos: `scenes.js` (escenarios y jefes con nombre), `enemies.js`, `enemy-art.js` (dibujos SVG de enemigos y jefes), `upgrades.js`, `items.js`, `questions.js`.
- Lógica: `state.js` (estado), `save.js` (guardado y migraciones), `enemies.js`, `bosses.js` (habilidades de jefes),
  `combat.js`, `upgrades.js`, `inventory.js`, `evolutions.js` (ramas de evolución de objetos, datos en
  `data/evolutions.js`), `hub.js` (DGT: espacio común), `room.js` (habitación de inicio), `progress.js`, `exam.js`, `tests.js`, `shop.js`, `bestiary.js`.
- Pintado: `render.js` (cada fotograma), `fx.js` (animaciones y números), `style.css`. `dev.js`: consola de desarrollo.
- `js/td/` — **juego de estudio** (tower defense gacha), aparte de la autoescuela: `data.js` (todo su balance: criaturas,
  enemigos, mundos, probabilidades, tiradas por estudiar), `art.js` (criaturas SVG), `state.js` (guardado propio
  `TD_SAVE_KEY`, gacha, estrellas, niveles), `battle.js` (combate), `lobby.js` (sala y ventanas), `dev.js` (sección 📚 de
  la consola dev, `tdDev`). Estilos en `td.css`.
- `img/` — fondos `escenari-N.svg` (1600×900), sprites SVG y fotos de jefes. `tools/` — bot, ajustador y capturas (no los carga el juego).

## Convenciones
- Idioma: textos del juego, comentarios y commits en **valenciano**. Con el usuario se habla en castellano.
- **No romper partidas**: nunca cambiar `SAVE_KEY`, los campos del estado, los `id` de mejoras/objetos/espacios ni los
  nombres de enemigos (son claves del compendio). Si se renombra algo, añadirlo a `RENAMED_ENEMIES`/`applyRenames` (`save.js`).
- Diseño: skills importadas `frontend-design` (crear o rehacer interfaz) y `ux-mobile-responsiveness-audit` + `design-critique` + `accessibility-audit` (revisar), siempre
  con los datos del juego de `autoescola-design-system` (paleta, iconos, medidas). Sprites y fondos: `dibujo-sprites` + skill importada `svg-creator`.
- Sensación de juego (temblor, hit-stop, números, rebotes): skill importada `game-feel`, traducida a CSS/JS sin
  dependencias. Sonido y música (si se añaden): skill importada `game-audio` (Web Audio, sin archivos ni paquetes).
- Código: `/simplify` (ordenar y simplificar) y `/code-review` (buscar fallos) tras cambios grandes.
- Seguridad: `/security-review`. Juego estático sin backend: lo que viene de la partida guardada o de una importación
  no es fiable (nada de meterlo en `innerHTML` sin pasarlo por los datos del juego); nada de scripts ni recursos externos.
  Única excepción (pedida por el usuario): el vídeo de YouTube de la tele de la DGT, que solo se carga al tocar el
  logo un rincón (`DVD_VIDEO` en `js/hub.js`). Desde `file://` sale en negro; publicado funciona.
- Pruebas en navegador: `webapp-testing` (Playwright en Python, cualquier ancho, errores de consola) o `tools/captura.js`.
- Toda interfaz nueva debe caber sin scroll (horizontal siempre; vertical en ventanas como el inventario) en
  escritorio, tablet y móvil (1440 / 820 / 390 px). Comprobarlo con captura.
- Rumbo: el juego pasa a ser de **estudio general** con varios juegos (autoescuela, grado, carrera…) unidos como
  salas dibujadas, sin menús. Se entra por la **habitación** (`js/room.js`): la placa L lleva a la DGT y la mochila al
  juego de estudio (tower defense, aún por hacer: de momento un aviso). Desde la DGT se vuelve por la puerta de eixida.
- Juego de estudio: se entra por la mochila. Sala arcana con puntos (altar = invocar, escritorio = apuntar estudio,
  grimori, bestiari, portal = mundos, cristall = millores, estudiant = artefactos, rellotge = reiniciar, porta = habitación).
  Reglas del usuario: los pergamins (tiradas) **solo** salen de estudiar (nunca del combate); en combate se gana maná
  y saber (para subir niveles); el mítico solo con un 8+ en el final; los jefes dan artefactos al estudiante (3 huecos).
  Probabilidades 70 / 25 / 4,5 / 0,5 con garantía (épico 30, legendario 150). Copias → estrellas (1/2/4/7/11).
  Estilo de las criaturas: símbolos de energía en neón sobre fondo oscuro (referencia: «Animation vs. Math»), sin
  caras; cada una hecha con los símbolos de su asignatura y la pieza que lanza forma parte del cuerpo. Pocas y cuidadas.
  Reiniciar (rellotge) conserva criaturas, pergamins, artefactos y registro; pierde saber, niveles, millores y mundos.
  Hoy: modo Informático, Àlgebra Lineal y Programació I (7 criaturas cada una), mundo 1 (Serp). Asignaturas del usuario
  y modo Forestal: pendientes.
- Botiga, tests, compendio e inventario viven en la DGT (`js/hub.js`): pantalla completa con el interior dibujado y
  4 puntos interactivos (caixer, instructor, llibre, espill). Ya no hay panel derecho.
- Cada zona nueva trae un enemigo nuevo y temático (nunca una "versión más fuerte"); jefe con nombre cada 3 zonas,
  con habilidad propia y un objeto de recompensa. Proceso completo: skill `nueva-zona`.
- Commits terminan con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Forma de trabajar
- Proponer y preguntar antes de los cambios de diseño de juego (efectos de objetos, habilidades, zonas); el usuario decide.
- Tras cambiar balance, contenido de combate u objetos: pasar `tools/bot.js` y comparar con antes. Avisar si un
  cambio vuelve un escenario trivial o un muro (p. ej. curaciones sin límite).
- `CONFIG.debug` siempre desactivado en el repo (la consola dev lo activa solo en local).
- No subir (push) sin que el usuario lo pida. Antes de subir: skill `publicar`.
- No tocar la dificultad de escenarios ya publicados sin preguntar.
