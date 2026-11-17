---
name: crear-defensor
description: Usar al crear, rediseñar o retocar una criatura (defensor) del juego de estudio de Autoescola Incremental (Informàtica, Forestal u otra carrera): ficha y habilidad, dibujo SVG, animaciones en combate, demostración del grimorio e integración, para que salga bien a la primera.
---

# Crear o retocar un defensor (juego de estudio, `js/td/`)

Reúne lo que el usuario ha ido pidiendo criatura a criatura. Seguir el orden y no darla por terminada sin el punto 7.

## 1. Proponer antes de construir
- Proponer **2 o 3 ideas** (nombre, rareza, campo, qué es y qué hace) y construir solo la que elija el usuario
  (CLAUDE.md: él decide el diseño de juego).
- Reglas del reparto: en cada campo solo son obligatorias la legendaria y la mítica; 2 comunes por carrera en total.
  Si falta una rareza en un campo, sus tiradas dan puntos de estrella (espores en el bosque): no hay que rellenar huecos.
- Legendarias y míticas: habilidad **nueva**, que no repita la de otra carrera (ejecutar, alinear, convertir, apilar,
  línea de fuego, aura, anilla, copiar ya existen). Comunes y raras pueden compartir rol si cambia la representación.
- La habilidad tiene que tener sentido con lo que es (la Brúixola apunta, el Contrafoc quema una línea, la Sàmara cae
  girando, el Anellador marca como se marca a los animales). Si la asignatura ya inspira a otra criatura, no repetirla.

## 2. Ficha (`js/td/data.js`, `TD_DEFENDERS`)
- `subj`, `rar`, `name`, `dmg`, `rate`, `range`, `cost`, `role`, `desc` en valenciano, explicando qué se ve.
- Opciones de animación y tiro:
  - `alt`: alterna dos piezas (`.al` / `.ar`).
  - `aim` + `aimHold` + `aimWait`: el cuerpo gira hacia el enemigo antes de disparar.
  - `projSpeed`: velocidad del proyectil (las cosas que planean o caen, lentas: 0,25–0,4).
  - `regrow`: segundos que tarda en volver a crecer la pieza lanzada (por defecto 0,7; nada de animaciones rápidas).
- Si se quita una criatura: `TD_MERGED` (las copias pasan a otra) y no se cambia ninguna clave guardada.

## 3. Dibujo (`js/td/art.js`, `TD_ART`): seguir también la skill `dibujo-sprites`
- Estilo: símbolos de su asignatura en neón sobre fondo oscuro; en el bosque, bioluminiscencia (hoja, ámbar, madera).
  Sin caras. Proporciones reales del objeto (si es una brújula, que parezca una brújula de verdad).
- **Lo que lanza es una pieza real de su cuerpo** (`.al`, `.ar`), con el mismo tamaño, forma, color y orientación que
  el proyectil (`proj`, y `projR` si la derecha es distinta). Si tiene dos piezas iguales (la aguja roja y la blanca),
  las dos se lanzan.
- Proyectiles con dirección (flechas, agujas): añadir el id a la lista de los que giran (`turn` en
  `tdbRender`) y dibujarlos apuntando a la derecha y centrados en (0, 0).
- Movimiento realista del proyectil. Ejemplo: la sàmara gira en horizontal (`scaleX` de 1 a −1, como un helicóptero
  visto de lado), no como una rueda.
- Círculos que deben ser círculos (anillos, ondas): nunca elipses.

## 4. Animaciones en combate (`js/td/battle.js`, `td.css`): criaturas participativas
- El sprite actúa, no solo flota: gira y apunta, se inclina al echar fuego, alterna piezas, retrocede…
- **Ritmo de tiro y crecimiento (para todas)**: al lanzar, la pieza desaparece del cuerpo y vuelve a crecer
  terminando justo cuando sale el disparo siguiente (`tdbPartOut` / `tdbParts`). No se puede disparar una pieza que
  no ha acabado de crecer. El crecimiento es lento y visible.
- Efectos en el mundo, no flotando:
  - La anilla va puesta en una pata o un tallo del enemigo (`TD_MARK_SPOT`).
  - Las líneas y zonas de fuego van en el suelo, debajo de los enemigos (capa `tdb-lines`).
  - Las raíces salen de la tierra y se atan a lo que tocan.
- Atrapados (raíces, resina): animación de atrapar clara pero con un forcejeo mínimo (±1°, lento). Nada de temblores.
- Si mejora a otras criaturas, se tiene que ver el vínculo (las raíces de la Carrasca hasta la criatura y un aura
  mientras dura), no textos repetidos de «+30 %».
- Si es constante (no dispara), que se vea algo que lo mantiene (el bidón vuelve a echar fuego de vez en cuando).

## 5. Demostración del grimorio (`tddemo.html`, `js/td/demo.js`, `TD_DEMO_SCENES`)
- **Es el combate real** dentro de un iframe: el mismo código y las mismas animaciones (raíces, fuego, anillos, anilla,
  crecimiento de las piezas…). Nunca hacer una animación aparte para el libro: si algo se ve distinto, es un error.
- Solo cambian las condiciones, favorables para lucir el arma: un escenario por criatura (o por rol) en
  `TD_DEMO_SCENES` con `path` (recto o en U, entre dos tramos), `view` (vista acercada a la acción, proporción ~1,4), `slots` (la primera
  es la criatura), `allies` (otras criaturas al lado, p. ej. un Pi dentro del aura de la Carrasca), `spawn` (qué
  distracciones salen juntas y cada cuánto) y `gap`.
- No guarda nada (`tdSave` vacío, partida en memoria) y no carga la autoescola ni la nube.
- Página izquierda del grimorio: arriba (1/3) dibujo, nombre, rareza, estrellas, progreso y botones de copias; abajo
  (2/3) el recuadro del combate, siempre dentro de la página.

## 6. Balance: `python tools/td-bot.py <id> [--mon]`
- Prueba de daño: DPS y DPS por 100 de maná de la criatura sola, comparado con la media de su rareza. Las de zona salen
  infladas (14 distracciones a la vez) y las que paran, marcan o mejoran a otras no cuentan aquí.
- Prueba de mundo (`--mon`): juega el mundo 1 de su carrera con ella (y 2 comunes al principio); da onda y vidas.
- Pasarlo antes y después del cambio y avisar si una queda muy por encima o por debajo de su rareza.

## 7. Integración
- Estilos y animaciones en `td.css`. Si la pieza tiene un centro de giro propio, usar `transform-box: view-box` y su
  `transform-origin`.
- Habilidades nuevas: en combate (`tdbFire` / `tdbHit` / `tdbSpecial`; la demostración las hereda sola) y, si el
  Projecte integrador puede copiarla, en `echo`.
- Actualizar CLAUDE.md (la lista de criaturas de su carrera) si cambia el reparto.

## 8. Comprobar (antes de enseñarla)
1. `node --check` de los archivos tocados.
2. Galería de la criatura en grande (300 px) con todas las de su campo: mirar proporciones y piezas.
3. **Combate fotograma a fotograma** (Playwright: pausar con `tdb.paused = true`, avanzar con `tdbUpdate(0.05)`,
   capturar de 8 a 12 fotogramas): girar, apuntar, salir, volar, impactar, volver a crecer al ritmo del siguiente tiro.
4. Demostración del grimorio (`tddemo.html?d=<id>` a 340×110 y dentro del libro): se ve la habilidad desde el
   principio y la vista está centrada en la acción.
5. 1440 / 820 / 390 px sin errores de consola ni scroll horizontal.
6. Pasar el bot (punto 6).

## 9. Qué enseñar al usuario al terminar
- **Fotogramas del combate**: secuencia de 8-12 capturas (de girar o cargar a volver a crecer).
- **GIF animado** del combate: los mismos fotogramas, o más, unidos con PIL
  (`frames[0].save("x.gif", save_all=True, append_images=frames[1:], duration=120, loop=0)`), enviado con SendUserFile.
- **Captura del grimorio**: la página del libro con su demostración en marcha.
- **Si su habilidad afecta a otras** (aura, marca, copiar, curar, potenciar…): además, una demostración en combate que
  saque todo su potencial (varias criaturas amigas colocadas donde mejor se ve, enemigos agrupados), en fotogramas o GIF.
