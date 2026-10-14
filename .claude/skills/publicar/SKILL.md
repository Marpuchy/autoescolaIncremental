---
name: publicar
description: Usar cuando el usuario pida subir, publicar o hacer push de cambios de Autoescola Incremental para que lleguen a los jugadores.
---

# Publicar (subir a `main`)

Solo cuando el usuario lo pida. El juego se publica desde `main` de GitHub (Marpuchy/autoescolaIncremental).

## Antes de subir
1. `git status --short` y `git diff --stat`: revisa que solo va lo que toca (nada de capturas ni archivos de prueba).
2. `CONFIG.debug` en `js/config.js`: `autoPassExams: false, godMode: false, speed: 1`.
3. Sintaxis de todos los scripts: `for f in js/*.js js/data/*.js; do node --check $f || echo FAIL $f; done`.
4. Carga limpia como un jugador nuevo: `node tools/captura.js` → la cabecera debe decir `ERRORS: cap`.
5. Partidas existentes: si has renombrado enemigos, objetos o espacios, o has cambiado el estado, comprueba que
   `load()` convierte una partida antigua (`RENAMED_ENEMIES`, `applyRenames`, `MIGRATIONS` en `save.js`).
6. `git fetch` y comprueba que `main` no va por detrás del remoto.

## Commit y push
- Mensaje en valenciano: título corto con lo principal y una lista con guiones de los cambios que notará el jugador.
- Termina con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- `git add -A && git commit -F - <<'EOF' … EOF` y `git push origin main`.

## Después
Dile al usuario el hash del commit, que GitHub Pages tarda un par de minutos y que los jugadores pueden tener que
recargar con Ctrl+F5. Si el cambio afecta a partidas guardadas o a la dificultad, recuérdaselo en una línea.
