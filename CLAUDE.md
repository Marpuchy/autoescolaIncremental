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
  En pruebas hay además un perfil **Comú** (`PLAYERS.comu`, `test: true`; no existe en la web publicada) que juega a todo
  a la vez: copia la autoescola de Alba y junta las dos partidas de estudio (`tdMergeRooms`). La consola dev tiene
  «🔓 Desbloquejar-ho TOT» (`dev.unlockAll`, `tdDev.unlockAll`).
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
  y saber (para subir niveles); el mítico solo con un 8+ en el final; los jefes dan artefactos al estudiante (3 espacios como en la autoescola sin mascota, `TD_EQUIP_SLOTS`: cap, mà, pell; uno por espacio). Los artefactos NO se comparten entre carreras/módulos: cada sala tiene los suyos (`tdUseRoomArtifacts`, `artRoom`/`artBank`). Cada mundo da su propio artefacto, uno por mundo (`TD_ARTIFACTS[].world`; la Biblioteca conserva los dos de antes). En Informàtica el estudiante es Marc, un ajolote sin bordes con sombrero de mago fijo (`tdAxoSvg`, pieles en `TD_AXO_SKINS` vía `TD_ARTIFACTS[].skin`, piezas en `TD_AXO_WEAR`); sus espacios son branquies, mà y pell (`tdEquipSlots`, `TD_EQUIP_SLOTS_AXO`); los artefactos de la Biblioteca son el Bastó d'aprenent (id `cafe`) y la Pols d'estrelles (id `auriculars`): los id no cambian para no romper partidas; en el bosque, Alba, la granoteta druida (`TD_DRUID_*`): el Bastó de la natura (id `capallop`, hueco de mano; antes era la capa de lobo) se coge con la mano derecha (la capa de musgo del druida se queda siempre) y la Pell de bolet (`setes`, del Corro de bolets) cambia sus colores (`TD_FROG_SKINS`).
  Probabilidades (`TD_RATES`): común 66 / raro 27 / épico 6 / legendario 0,9 / mítico 0,1 %; un 8+ en el examen final da la
  mítica y además potencia el campo para siempre (`td.boost[campo]`: 55 / 30 / 10 / 4 / 1 %). Garantía (`TD_PITY`): épico 30,
  legendario 50, mítico 200, con «pity suave» en el último 15 % (`tdSoftChance`). El altar es un banner tipo gacha con fondo
  temático por campo (`tdBannerBg`) y legendarias y mítica en grande; las probabilidades, en «Detalls». Cada invocación solo da criaturas
  del campo elegido. Las asignaturas se agrupan en **campos** (`TD_SUBJECTS[k].classes`): pergamins, garantía y
  criaturas son por campo; se apunta el estudio en la prestatgeria (una lleixa por campo, 4 en total, libros de actividad de la gama del campo, también «Anar a classe» y «Fer un projecte», y al final el libro de exámenes, que se abre para elegir asignatura y nota). Cartel de missions diàries (3 al día, pergamins extra fuera del límite, `TD_MISSION_ACTS`). El cristal de la sala es el de la ventana de millores (`%CRYSTAL%`); cada sala tiene su cristal con sus millores, independientes (`upRoom`/`upBank`, `tdUseRoomUpgrades`). Nivel máximo = 5 × estrellas; niveles 10 y 20 mejoran la habilidad. Maná del combate: solo el inicial y el que dan los enemigos al morir (nada por tiempo). Copias → estrellas (1/2/4/7/11), pero subir de estrella se paga con saber (`TD_STAR_COST`, botón en el grimorio; `o.stars` guarda las pagadas). Nunca se dan estrellas por copias al cargar (sin `stars` → ★1).
  Balance (`tools/td-progres.py`: equipo de 6 en el mundo 1 de cada sala, de Nv1 a Nv25 ★5): nivel +7 % de daño, estrella +15 % (+5 %
  de velocidad), mejoras en combate ×1,35/×1,75; dificultad de los mundos en `TD_DIFFICULTY` (vida ×1,5, saber ×2) y `TD_WAVE_HP`
  (los jefes suben la mitad por oleada). Objetivo: al principio se pierde, con Nv5 se gana justo, desde Nv10 holgado.
  Correo (`TD_MAIL`, `td.mail` = recogidos): mensajes del equipo con regalos (p. ej. compensar errores). Se entra por un foradet
  en la pared de la habitación con una carta que asoma (`ROOM_MAIL_SVG`, `roomMail` en `js/room.js`); sin correo no se ve nada.
  Además cada sala tiene su bústia dibujada (`TD_MAILBOX_SVG`, bandereta alzada si hay algo nuevo; botón «Correu» en móvil).
  El correo tiene dos pestañas: Missatges (`TD_MAIL`) y **Préstecs** entre Marc y Alba (`js/td/share.js`): se pide una criatura
  concreta del otro o se le deja una; quien la recibe la acepta (si la había pedido, entra sola). Va a un **buit de préstec**
  (`td.loan`, uno solo, dura hasta cambiarlo por otra), sale en los combates de su sala (`tdDeck`, marca 🤝) con el nivel y las
  estrellas del dueño (`tdStats`), y el dueño la sigue usando. Sin tablas nuevas: cada uno escribe sus mensajes en su partida
  (`td.share.out`: ask/give/no) y lee los del otro de su partida en la nube; `td.share.done` = contestados. El comú no presta.
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
  **Habilidades especiales** (lo pide el usuario): toda épica, legendaria y mítica tiene una además del ataque normal, y
  salen **poco** (cada 8-15 ataques, `special.every`) para que el Projecte integrador (cada 3) tenga valor copiándolas. Las
  que cambian el tiro (`TD_SHOT_SPECIALS`: llança escalada, disàmara que arrela, sobrecàrrega de la Tesla, mel del rusc, gran
  bramit del cérvol) van en `t.boostShot`/`p.sp`; el Projecte las hace desde su sitio. Zonas de suelo: `tdbZone`. La Canya y el
  Contrafoc se quedan como están (decisión del usuario).
  **Elementos** (`TD_ELEMENTS`, `d.el` por criatura en `TD_DEFENDER_ELEMENT`): físic, elèctric, foc, natura, arcà, buit (∅: las matemáticas y el Compilador), y
  llum/ombra (siempre con ventaja; aún ninguna criatura). Cada distracción es débil a uno (×2) y fuerte contra otro (×0,3)
  (`TD_ENEMY_ELEMENTS`, `tdElemMult`); el número de daño sale del color del elemento (grande si es débil, pequeño si resiste).
  `tdbDamage(e, n, src)`: src es la criatura (o el elemento; null = daño puro, p. ej. la pesca). Se ve en el bestiario, el
  grimorio, el equipo y al elegir criatura en combate (`tdElemTag`, `tdElemDot`). En el grimorio solo el elemento, no contra qué.
  **Aparador del grimorio** (siempre, para cada criatura nueva o cambiada): la demostración del libro ES el combate real
  (`tddemo.html?d=<id>` en un iframe, `js/td/demo.js`: mismo código, mismas animaciones, no guarda nada). Solo cambian
  las condiciones, favorables para lucir el arma: escenario por criatura o rol en `TD_DEMO_SCENES` (camino, vista
  acercada, dónde va, amigas al lado —`allies`—, qué distracciones pasan y agrupadas cómo). La demo empieza con todo cargado
  a la mitad (especial, tic doble, pilas, carga) y luego va al ritmo real; **antes de publicar, comprobar que sale** (`python tools/td-demo-check.py`).
- Al recargar (F5) se vuelve a donde se estaba (DGT, carretera, sala de Informàtica o de Forestal): `setPlace`/`getPlace`
  en `sessionStorage` (`estudi-lloc`, `js/room.js`) y `restorePlace` en `main.js`; la autoescola del otro no se reabre sola.
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
  Anells, Contrafoc, Carrasca) Quadern de camp (`pin`, projecte intermodular, IPO y transversales: Brúixola, Disàmara (id `samara`), Anellador, Projecte integrador) y
  Fauna (`fau`, cinegètica y pesca: Prismàtics, Canya de pescar —arrastra hacia atrás, `hook`—, Rusc d'abelles —veneno, `swarm`— y
  Cérvol de la brama —onda que hace retroceder a todas, `bellow`—). Los campos se hacen por zonas temáticas; las asignaturas de
  una zona futura siguen en su campo actual hasta que la zona tenga criaturas. En el
  bosque los enemigos son los mismos (mismo nombre y truco) con otro aspecto (`TD_FOREST_ENEMIES`, `TD_FOREST_ENEMY_ART`,
  `tdEnemy`), y el mundo 1 es el mismo trazado con fondo de bosque (`tdbForestBackground`).
  Mundo 2 de cada sala (Laboratori de Circuits, id 2 · La Pineda, id 102; se abren al superar el 1, `needs`/`tdWorldShut`):
  camino en bifurcación (`world.paths`, cada distracción lleva el suyo, `e.P`/`tdbP`), fondos `tdbLabBackground` y pinar
  (`tdbForestBackground` con `pine`), `hp`/`mana` propios del mundo (vida ×1,25 en el Laboratori; ×0,95 en la Pineda, porque las formigues resisten lo físico y el bosque tiene muchas físicas). Distracción nueva Pestanyes obertes / Formiga reina
  (`spawn`: deja pestañas/hormigas detrás) y jefe L'Algoritme / Papallona irisada (`shift`: cambia de debilidad cada 6 s,
  icono encima, color `--shift`). Artefactos: Pell bioluminescent (Marc, `biolum`, +15 % saber) y Banyes de cervatell (Alba, `banyes`, cap).
  Balance de mundos: `python tools/td-progres.py [--mon=2]`.
  Un jefe que llega al cristal lo rompe (`tdbShatter`: se pierde el mundo con las vidas que queden, animación de trozos).
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
