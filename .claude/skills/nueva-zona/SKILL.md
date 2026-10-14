---
name: nueva-zona
description: Usar cuando el usuario pida añadir zonas o escenarios nuevos (o proponerlos) en Autoescola Incremental: escena, fondo, enemigo nuevo, jefe con habilidad y objeto, balance con el bot y comprobación.
---

# Añadir zonas nuevas

## 1. Proponer antes de hacer
Repasa las últimas zonas (tabla: zona · enemigo nuevo · jefe · objeto) y propón las nuevas. Espera la respuesta.
- **Patrón de jefes**: un jefe con nombre y luego 2 zonas "vacías" (jefe normal, el Examinador de Trànsit).
  Mira cuál fue el último jefe con nombre en `SCENES` para saber dónde cae el siguiente.
- Lugares reales de Castelló/València con humor local. Cada zona: nombre, gracia del fondo, enemigo nuevo.
- Cada jefe con nombre: **habilidad propia** + **objeto** que da al derrotarlo (Pell, Accessori o Mascota).
  Ofrece 2–3 opciones de efecto con su impacto; el usuario decide.
- La zona 20 (DGT) es un punto de inflexión, no el final: el juego continúa.

## 2. Contenido (`js/data/`)
- `scenes.js` → una línea por zona en `SCENES`: `{ name, bg, img: "img/escenari-N.svg", boss? }`.
- `enemies.js` → **un enemigo nuevo de verdad por zona** (nunca una versión más fuerte de uno que ya existe):
  `{ name, mult, icon, desc }`. `mult` entre el último tipo y 0,95 × `CONFIG.bossMultiplier` (4,66), creciendo poco
  a poco (+0,1 por zona). Descripción en valenciano, con humor. El nombre es clave del compendio: no lo cambies después.
- Jefe con nombre → constante en `scenes.js` (`name`, `icon`, `desc`, `mech`, `ability`, `hpMult`/`atkMult` de
  compensación) y su habilidad en `BOSS_MECHANICS` (`js/bosses.js`, ganchos documentados arriba del archivo).
- Objeto → entrada en `ITEMS` (`js/data/items.js`) con `from: "<nombre del jefe>"`; los campos están documentados
  arriba del archivo. Si el efecto es nuevo, súmalo en `equipmentStats` (`inventory.js`), aplícalo en
  `recomputeStats` (`upgrades.js`) o `combat.js`, y descríbelo en `itemEffect`.
- Fondo y sprites: skill `dibujo-sprites`.

## 3. Balance
1. `node tools/bot.js --profiles mitja` para ver cuántos tests pide cada zona nueva.
2. Ajusta la vida con `node tools/tune.js --targets '{"21": 15, "22": 30}'` (en segundo plano, tarda). Referencia
   actual del jugador medio: zonas vacías ≈ 5–20 tests, zonas con jefe ≈ 25–80.
3. Copia el array a `CONFIG.enemy.sceneHpMult` y verifica con `node tools/bot.js` (los dos perfiles, 16 partidas).
4. Desconfía de habilidades "todo o nada" (curaciones o inmunidades sin límite): hacen que una zona pase de 0 a
   cientos de tests con un cambio mínimo. Ponles límite (p. ej. una vez por combate).
5. Si la habilidad o el objeto llama a funciones de pintado nuevas desde la lógica, añádelas a `STUBS` en `tools/bot.js`.

## 4. Comprobar
- `node tools/captura.js --level <nivel del jefe> --items all --tab inventory --size 1300x900,600x1000`: sin errores,
  sin scroll horizontal, jefe y objetos bien dibujados.
- Prueba la lógica con una simulación en Node (patrón: cargar los scripts con `vm` como hace `tools/bot.js`) y comprueba
  los números de la habilidad y del objeto.
- Antes de subir: skill `publicar`.
