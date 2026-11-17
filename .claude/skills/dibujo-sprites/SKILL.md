---
name: dibujo-sprites
description: Usar al dibujar o retocar fondos de escenario, sprites de enemigos o jefes, mascotas, iconos de objetos o piezas que se pone la granoteta (SVG a mano) en Autoescola Incremental.
---

# Dibujo de sprites y fondos (SVG a mano)

Todo se dibuja como SVG escrito a mano: formas planas, colores vivos, sombras con negro semitransparente y algún
degradado suave. Sin imágenes externas salvo las fotos de jefes (`img/*.jpeg`).

## Antes de dibujar
- Sigue la skill importada `svg-creator` (bucle escribir → renderizar → mirar → corregir; personajes por partes;
  sombras de color y degradados suaves) sin perder el estilo plano del juego.
- **Interiores y escenas con perspectiva: nunca calcules las esquinas a ojo.** Descríbelos en metros con el motor
  `tools/perspectiva.js` (cámara única, cajas, caras, sombras, figuras escaladas por profundidad). Ejemplos completos:
  `tools/dgt.js` y `tools/habitacio.js` (habitación de inicio), que genera `js/data/hub-art.js` (`node tools/dgt.js --preview fichero.svg` para ver el resultado).
  Los objetos de la derecha muestran su cara izquierda y al revés; todo apoya en y = 0; el orden de pintado es del
  fondo hacia delante (z decreciente).
- Sin textos dentro de los dibujos: pictogramas y formas.
- **Personajes: decide primero la postura** (de frente, de perfil o tres cuartos) y que TODO la siga: torso, cuello de la
  ropa, hombros, brazos. Nada de torso de lado con cara de frente, ni brazos que salen del pecho. Si las manos quedan
  detrás de un mueble, dibújalas en 3D encima (ver el funcionario y el teclado en `tools/dgt.js`).
- **Señales de tráfico reales**, nunca inventadas: STOP = octógono rojo con texto; prohibido el paso = círculo rojo con
  barra blanca; ceda el paso = triángulo invertido con borde rojo. No mezcles formas.

## Fondos de escenario (`img/escenari-N.svg`)
- `viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice"`: se recorta por los lados en móvil, así que lo
  importante va en el centro (x 400–1200).
- Primera línea: comentario en valenciano describiendo qué sale (lugar, monumentos, detalles graciosos).
- Capas de atrás a delante: cielo (`linearGradient id="sky"`) → nubes/sol → montañas o ciudad lejana → monumento
  central → edificios laterales → vegetación y detalles → **carretera/suelo desde y = 700 hasta 900** (ahí se ponen
  los luchadores) → viñeta (`radialGradient id="vinyeta"`) a pantalla completa al final.
- Reutiliza los patrones de los demás fondos: `gra` (grano del asfalto), `boira`, `pedra`, `teules`, `balcons`,
  `<symbol>` para árboles, palmeras, conos… y `<use>` para repetirlos.
- Detalles con humor local (carteles en valenciano, "GRATUÏT" en el peaje, cosas de la zona).
- **Errores típicos a revisar en la captura**: franjas de cielo asomando entre capas (cubre siempre hasta y ≈ 600–700
  con una capa de fondo continua), formas que acaban en diagonal donde no toca, texto tapado por iconos, elementos
  que quedan detrás de otro por el orden del documento.

## Enemigos y jefes (`ENEMY_TYPES` en `js/data/enemies.js`, jefes en `js/data/scenes.js`)
- **Siempre SVG propio, nunca emoji** (los emoji cambian según el móvil y no casan con el estilo). Los dibujos viven en
  `js/data/enemy-art.js` (`ENEMY_ART.clave`, con ayudantes `car()`, `wheel()`, `rider()`…); los tres primeros SVG
  (`YIELD_SVG`, `BOAT_SVG`, `FORKLIFT_SVG`) siguen en `enemies.js`.
- Vehículos largos: `preserveAspectRatio="xMidYMax meet"` (en móvil se encogen sin despegarse del suelo; `.sprite svg`
  tiene `max-width: 44vw`). Personas de frente; vehículos y animales de perfil con el morro a la izquierda.
- SVG: `viewBox` ajustado al dibujo, `aria-label` con el nombre, base del dibujo abajo (se alinea al suelo).
  El enemigo está a la derecha: si tiene "frente", que mire a la izquierda (hacia la granoteta).
- Jefes con animación: una clase en el SVG o en el sprite y keyframes en `style.css` (p. ej. `.on-fire-svg .flames`).
- `gradient id` dentro de sprites: usa nombres únicos (`ghost-glow`), porque el SVG aparece a la vez en el combate y en el compendio.

## Granoteta y equipamiento (`js/data/items.js`)
- La granoteta es `svg.frog` en `index.html`, `viewBox="0 0 140 124"`. Colores base: cuerpo `#6cc96a`, patas
  `#4fa64d`, barriga `#d4f5b5`, sonrisa `#2c5e2c`. Ojos en (40, 36) y (100, 36), r 21; patas delanteras en (46, 114) y
  (94, 114) con clases `frog-hand-l` / `frog-hand-r`; placa L en `g.frog-lplate`.
- **Piezas puestas (`wear`)**: SVG en esas mismas coordenadas; se dibuja dentro del sprite y se mueve con la granoteta.
  Puede salirse del recuadro (`overflow="visible"`). Si sustituye una parte, ocúltala con `hides: ["frog-hand-r"]`.
  Los colores de la granoteta que uses en la pieza cambian solos con la pell.
- **Pells (`skin.colors`)**: mapa de color original → nuevo de los 4 colores base, más un aura opcional (clase CSS
  `aura-…` con `drop-shadow` animado).
- **Mascotas**: imagen o SVG aparte (`look`), sentada detrás de la granoteta, a la izquierda, mirando a la derecha.
  Si el mismo dibujo lo usa un jefe, se gira con CSS (`scale: -1 1`).
- Icono para el inventario (`look`): SVG pequeño (`class="item-icon"`), legible a 2,2 rem.

## Comprobar siempre
1. Validar el XML: `python -c "import xml.dom.minidom as m; m.parse('img/escenari-N.svg')"` o `node --check` si va en un `.js`.
2. Renderizar y mirar la imagen: `node tools/captura.js --svg img/escenari-N.svg` (fondos y sprites sueltos) o
   `node tools/captura.js --level N --items id` (en el juego, con la granoteta y el enemigo).
3. Para sprites pequeños, renderizarlos también grandes (crea una página con el SVG a 26 rem) y revisar detalles.
4. Corregir lo que se vea raro y volver a capturar antes de dar el trabajo por hecho.
