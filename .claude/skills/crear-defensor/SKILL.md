---
name: crear-defensor
description: Usar al crear, rediseñar o retocar una criatura (defensor) del juego de estudio de Autoescola Incremental (Informàtica, Forestal u otra carrera): ficha y habilidad, dibujo SVG, animaciones en combate, demostración del grimorio e integración, para que salga bien a la primera.
---

# Crear o retocar un defensor (juego de estudio, `js/td/`)

Reúne lo que el usuario ha ido pidiendo criatura a criatura. Seguir el orden y no darla por terminada sin el punto 7.

## 1. Proponer antes de construir
- Proponer nombre, rareza, campo y habilidad, y preguntar (CLAUDE.md: el usuario decide el diseño de juego).
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
- Proyectiles con dirección (flechas, agujas): añadir el id a la lista de los que giran (`turn` en `tdbRender` y
  `rot` en `tdDemoLaunch`) y dibujarlos apuntando a la derecha y centrados en (0, 0).
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

## 5. Demostración del grimorio (`js/td/lobby.js`, `TD_DEMO_SETUP`, `tdDemo*`)
- La composición que mejor enseña la habilidad y sus mejoras: entrada por id (o por rol o habilidad) con `n`, `gap`,
  `spread`, `mix` (uno fuerte delante) y `allies` (otras criaturas en el carril; `shoot` si atacan; `bonus: "aura"`).
  Se pueden añadir otras criaturas o cambiarlas de sitio si así se entiende mejor.
- Los mismos efectos que en combate, dibujados igual: anillos redondos recortados a la caja, línea de fuego en el
  suelo y debajo de los enemigos, raíces, anilla en la pata, resina.
- El mismo ritmo de tiro y crecimiento que en combate (`D.parts`, `projSpeed`, `--regrow`).

## 6. Integración
- Estilos y animaciones en `td.css`. Si la pieza tiene un centro de giro propio, usar `transform-box: view-box` y su
  `transform-origin`.
- Habilidades nuevas: en combate (`tdbFire` / `tdbHit` / `tdbSpecial`), en la demostración (`tdDemoFire` /
  `tdDemoHit` / `tdDemoSpecial`) y, si el Projecte integrador puede copiarla, en `echo` (combate y demostración).
- Actualizar CLAUDE.md (la lista de criaturas de su carrera) si cambia el reparto.

## 7. Comprobar (antes de enseñarla)
1. `node --check` de los archivos tocados.
2. Galería de la criatura en grande (300 px) con todas las de su campo: mirar proporciones y piezas.
3. **Combate fotograma a fotograma** (Playwright: pausar con `tdb.paused = true`, avanzar con `tdbUpdate(0.05)`,
   capturar de 8 a 12 fotogramas): girar, apuntar, salir, volar, impactar, volver a crecer al ritmo del siguiente tiro.
4. Demostración del grimorio a los 2 s y a los 2,5 s: se ve la habilidad, los efectos están en su sitio y no hay
   elipses ni efectos tapando a los enemigos.
5. 1440 / 820 / 390 px sin errores de consola ni scroll horizontal.
6. Enseñar al usuario la secuencia de fotogramas, no solo el dibujo quieto.
