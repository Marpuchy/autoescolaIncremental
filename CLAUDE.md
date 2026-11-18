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
- Salas del juego de estudio: `node tools/sala-estudi.js` (Informàtica, regenera `js/data/td-lobby-art.js`) y
  `node tools/sala-forestal.js` (Forestal, el interior de un árbol: regenera `js/data/td-forest-art.js`).
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
  Segunda excepción (pedida por el usuario): **las partidas en la nube** (`js/cloud.js`, Supabase, con `fetch` y sin
  librerías). Solo juegan Marc y su pareja, Alba (id `parella`): cada uno elige quién es (se recuerda en el dispositivo; se cambia en los
  ajustes de la vitrina). Marc juega a Informàtica; la pareja, a Forestal y a la autoescola; lo del otro solo se mira
  (modo visita, sin guardar). La base de datos lo impone (`save_game` comprueba quién puede escribir qué; la tabla
  solo se lee) y guarda un historial (`saves_history`). Solo la web publicada (`CLOUD_PROD_HOST`) escribe en la nube;
  local/file:// es **versión de pruebas** («🧪 PROVES»): empieza con una copia de la partida real y nunca la toca.
  **Nunca perder la partida de la autoescola de la pareja**: antes de sustituir una partida local se guarda una copia
  (`…-backup-nuvol-…`) y la primera vez en un dispositivo gana la más avanzada (`cloudProgress`). No probar escribiendo
  en la base de datos real: simular `fetch` en el navegador.
- Pruebas en navegador: `webapp-testing` (Playwright en Python, cualquier ancho, errores de consola) o `tools/captura.js`.
- Toda interfaz nueva debe caber sin scroll (horizontal siempre; vertical en ventanas como el inventario) en
  escritorio, tablet y móvil (1440 / 820 / 390 px). Comprobarlo con captura.
- Rumbo: el juego pasa a ser de **estudio general** con varios juegos (autoescuela, grado, carrera…) unidos como
  salas dibujadas, sin menús. Se entra por la **habitación** (`js/room.js`, dibujada a partir del cuarto real del autor): la placa L lleva a la DGT,
  el ordenador a la sala de estudio de Informàtica y la mochila a la sala del bosc de Forestal (`tdRoom`; mismos puntos,
  otra temática y distribución). Cada sala solo muestra sus campos (`TD_SUBJECTS[k].mode`, `tdFields`), su equipo (`tdTeam`),
  sus misiones y sus mundos (`TD_WORLDS[].mode`; los del bosque, id 101+). Desde la DGT se vuelve por la puerta de eixida.
- Juego de estudio: se entra por el ordenador de la habitación. Sala arcana con puntos (altar = invocar, prestatgeria = apuntar estudio,
  grimori (libro con páginas por asignatura + pestaña de equipo), bestiari (libro), portal = mundos, cristall = millores, estudiant = artefactos, rellotge = reiniciar, porta = habitación).
  Reglas del usuario: los pergamins (tiradas) **solo** salen de estudiar (nunca del combate); en combate se gana maná
  y saber (para subir niveles); el mítico solo con un 8+ en el final; los jefes dan artefactos al estudiante (3 espacios como en la autoescola sin mascota, `TD_EQUIP_SLOTS`: cap, mà, pell; uno por espacio). Los artefactos NO se comparten entre carreras/módulos: cada sala tiene los suyos (`tdUseRoomArtifacts`, `artRoom`/`artBank`). Cada mundo da su propio artefacto, uno por mundo (`TD_ARTIFACTS[].world`; la Biblioteca conserva los dos de antes). En Informàtica el estudiante es Marc, una sargantana (`TD_LIZARD_BACK`, `TD_LIZARD_WEAR` para artefactos que no le caen igual); en el bosque, Alba, la granoteta druida (`TD_DRUID_*`).
  Probabilidades 66 / 27 / 6 / 1 con garantía (épico 30, legendario 90); cada invocación solo da criaturas
  del campo elegido. Las asignaturas se agrupan en **campos** (`TD_SUBJECTS[k].classes`): pergamins, garantía y
  criaturas son por campo; se apunta el estudio en la prestatgeria (una lleixa por campo, 4 en total, libros de actividad de la gama del campo, también «Anar a classe» y «Fer un projecte», y al final el libro de exámenes, que se abre para elegir asignatura y nota). Cartel de missions diàries (3 al día, pergamins extra fuera del límite, `TD_MISSION_ACTS`). El cristal de la sala es el de la ventana de millores (`%CRYSTAL%`). Nivel máximo = 5 × estrellas; niveles 10 y 20 mejoran la habilidad. Maná del combate: solo el inicial y el que dan los enemigos al morir (nada por tiempo). Copias → estrellas (1/2/4/7/11), pero subir de estrella se paga con saber (`TD_STAR_COST`, botón en el grimorio; `o.stars` guarda las pagadas).
  Atención al detalle en todos los dibujos (lo pide el usuario): proporciones reales, mesas con 4 patas, nada de trazos
  sin sentido, cada proyectil es la pieza que la criatura lanza (desaparece del cuerpo mientras vuela y se vuelve a
  formar), los artefactos se llevan puestos en el estudiante (`TD_ARTIFACT_WEAR`), sin bandas en los lados de las escenas
  (el fondo y la viñeta continúan fuera del viewBox). Los enemigos mueren disolviéndose en su color.
  **Para crear o retocar una criatura: skill `crear-defensor`** (ficha, dibujo, animación, grimorio, integración y
  comprobación fotograma a fotograma). Lo esencial:
  **Criaturas participativas** (lo pide el usuario; tenerlo en cuenta al crear cualquiera): en combate el sprite
  actúa, no solo flota. Lo que lanza es una pieza real de su cuerpo con el mismo tamaño, forma y orientación, y el cuerpo
  reacciona para dispararla (gira, apunta, se recarga, alterna piezas). Ejemplo: la Brúixola gira la aguja para que la
  mitad que toca (roja o blanca, iguales) apunte al enemigo, la dispara y vuelve a crecer (`aim`, `aimHold`, `alt`, `projR`). La pieza lanzada vuelve a crecer
  despacio y acaba justo cuando sale el tiro siguiente; no se dispara una pieza a medio crecer (`regrow`, `tdbPartOut`).
  **Aparador del grimorio** (siempre, para cada criatura nueva o cambiada): la demostración del libro ES el combate real
  (`tddemo.html?d=<id>` en un iframe, `js/td/demo.js`: mismo código, mismas animaciones, no guarda nada). Solo cambian
  las condiciones, favorables para lucir el arma: escenario por criatura o rol en `TD_DEMO_SCENES` (camino, vista
  acercada, dónde va, amigas al lado —`allies`—, qué distracciones pasan y agrupadas cómo).
  Invocación: pantalla propia; «Saltar» se para en legendarias y míticas; la mítica se monta pieza a pieza.
  Estilo de las criaturas: símbolos de energía en neón sobre fondo oscuro (referencia: «Animation vs. Math»), sin
  caras; cada una hecha con los símbolos de su asignatura y la pieza que lanza forma parte del cuerpo. Pocas y cuidadas.
  Reiniciar (rellotge) conserva criaturas, pergamins, artefactos y registro; pierde saber, niveles, millores y mundos.
  Criaturas por campo: obligatorias solo la legendaria y la mítica; 2 comunes por carrera. Si una tirada saca una rareza
  que el campo no tiene, da puntos de estrella (`td.stelles[mode]`; «espores» en el bosque, `TD_POINTS`) que en el grimorio
  compran copias de cualquier criatura de la carrera menos la mítica (`tdBuyCopy`). Las retiradas se fusionan con `TD_MERGED`.
  Hoy: Informàtica (1.º del grado en la UJI, plan EI26xx) por zonas: Matemàtiques (`alg`: Sumador, Vector épico, Determinant, λ;
  Càlcul y Àlgebra, más Discreta y Estadística hasta que exista la zona Lògica i dades), Programació (`prg`: Punt i coma,
  If/else, Compilador, Stack; Prog I y II, Eines, Dret TIC) y Màquina (`maq`: Resistència, Rellotge de CPU, Bobina de Tesla, Condensador; Electrònica y
  Fonaments de Computadors). Forestal (Alba, asignaturas provisionales de 2.º de Gestió Forestal) con Gestió de monts (`mnt`: Pi,
  Anells, Contrafoc, Carrasca) y Quadern de camp (`pin`, projecte intermodular e IPO: Brúixola, Sàmara, Anellador, Projecte integrador). Los campos se hacen
  por zonas temáticas; las asignaturas de una zona futura (p. ej. Fauna: cinegètica y pesca) siguen en su campo actual hasta
  que la zona tenga criaturas. En el
  bosque los enemigos son los mismos (mismo nombre y truco) con otro aspecto (`TD_FOREST_ENEMIES`, `TD_FOREST_ENEMY_ART`,
  `tdEnemy`), y el mundo 1 es el mismo trazado con fondo de bosque (`tdbForestBackground`).
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
