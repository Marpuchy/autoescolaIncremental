---
name: autoescola-design-system
description: Hoja de datos visuales de Autoescola Incremental (paleta con contrastes medidos, colores de combate, iconos por concepto, medidas del panel). Consultarla junto a frontend-design o ux-mobile-responsiveness-audit siempre que se cree, modifique o revise un componente, panel o estilo del juego.
---

# Datos visuales de Autoescola Incremental

Esta hoja no define reglas de diseño: para eso están `frontend-design` (crear o rehacer interfaz) y
`ux-mobile-responsiveness-audit` (revisar y auditar). Aquí solo están los datos del juego que esas skills deben respetar.

## Contexto
Juego incremental para amigos, escritorio y móvil, **tema solo oscuro**. Prioridad: ver el combate de un vistazo y
pulsar mejoras sin fallar. Identidad ya establecida (no rediseñar sin que el usuario lo pida): plano, colores vivos,
emoji como iconos, granoteta verde con la placa L. Fuente de verdad: `style.css`.

## Paleta (contrastes WCAG medidos)
| Rol | Valor | Uso | Contraste |
|---|---|---|---|
| surface | `#1e2229` | fondo de la página | — |
| panel | `#2b313b` | cabecera, ventanas, barra de la DGT | ink 10,5 · muted 6,2 |
| panel-raised | `#3a4250` | tarjetas, espacios del inventario, fichas | ink 8,1 · muted 4,8 |
| panel-active | `#323946` / `#424b5b` | pestaña activa / espacio seleccionado | — |
| ink | `#e6e6e6` | texto principal | ≥ 8 en todos los fondos |
| ink-muted | `#aab3c0` | texto secundario (`.muted`) | 4,8 en raised (mínimo) |
| accent | `#f2c200` | acción principal, pestaña activa | 7,8 sobre panel |
| on-accent | `#1e2229` | texto sobre botón amarillo | 9,5 |
| L verde | `--l-green #009b48` | todo lo de la moneda L | blanco encima 3,6: solo negrita ≥ 14 px |
| secondary | `#555c68` | botones secundarios | ink 5,4 |
| danger | `#a33` | Reiniciar, Esborrar | blanco 6,5 |
| ok | `#3cc46a` | vida de la granoteta, aprobado | 5,8 sobre panel |
| ko | `#e0514a` | vida del enemigo, suspendido | **3,4 sobre panel: no para texto pequeño** |
| next | `#7fd49c` | "Següent nivell" | 7,4 |
| dev | `#7b3fe4` | solo consola de desarrollo y "MODE PROVA" | blanco 5,7 |
| borde de control | `#4b5361` | bordes | **1,7 sobre panel**: si el borde es lo único que marca el control, usa `#6b7480` o más claro |

Números flotantes de combate (sobre el escenario, con sombra negra): jugador `#ffd23f`, enemigo `#ff4d4d`,
crítico `#ff8a1f`, parada `#7fd1ff`, espinas `#9be36a`, mascota `#ffb36b`, curación `#7dffb0`, quemadura `#ff8a1f`,
habilidades `#ffe27a` (grande `#ff5a3a`).

## Iconos por concepto
Los emoji son parte de la identidad del juego. Un concepto, siempre el mismo:
💰 diners · placa `.lplate` L (nunca emoji) · 🏁 nivell · 🏆 rècord · 🏢 DGT · 🏧 caixer · ☕ tests · 🪞 espill · 📖 compendi ·
🎒 inventari · 🎨 pell · 🕶️ accessori · 🐾 mascota · 🔥 cremada · 🛡️ parada · 🎯 crític.
Si importa hacia dónde mira (animales, vehículos que atacan), SVG en lugar de emoji: cada sistema dibuja el emoji
mirando a un lado distinto. Botones de solo icono: `title` + texto oculto (patrón `.tab-label`).

## Medidas y comportamiento
- Pantalla principal: combate a todo el ancho + franja de mejoras. Botón 🏢 DGT en la cabecera.
- Habitación (`js/room.js`): pantalla de inicio, igual que la DGT (SVG 1600×900 con puntos y fila de botones en móvil).
- DGT (`js/hub.js`): pantalla completa con el interior dibujado (SVG 1600×900, `meet`, pared y suelo continúan fuera)
  y 4 puntos (caixer, instructor, llibre, espill) que abren ventanitas; en móvil y tablet vertical, fila de botones.
- Inventario: ventana central de 980 px, granoteta con los 3 huecos en triángulo. **Nada puede necesitar scroll horizontal.**
- Espaciado en múltiplos de 4 (gaps de 6–8, padding 10–16). Radios: 5 botones, 6–8 tarjetas, 12 etiquetas.
- Texto mínimo 0,75 rem (12 px). Nombres largos en una línea con elipsis.
- Probar a 1300, 820 y 390 px: `webapp-testing` (Playwright, cualquier ancho) o `node tools/captura.js` (≥ 600 px).
