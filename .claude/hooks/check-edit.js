#!/usr/bin/env node
// Hook PostToolUse: tras cada Edit/Write avisa de texto mal codificado ("Â")
// y, en .ts/.tsx, muestra los errores de tsc solo del archivo editado.
// En .js comprueba la sintaxis con node --check (el juego no tiene compilación).
// Sale con 2 si hay problemas (Claude los recibe y corrige) y con 0 si no.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  try { run(JSON.parse(input || '{}')); } catch { process.exit(0); }
});

function run(data) {
  const file = data.tool_input && data.tool_input.file_path;
  if (!file || !/\.(tsx?|jsx?|css)$/.test(file) || !fs.existsSync(file)) process.exit(0);
  const problems = [];

  const bad = fs.readFileSync(file, 'utf8').split(/\r?\n/)
    .map((l, i) => (l.includes('Â') ? `  línea ${i + 1}: ${l.trim().slice(0, 100)}` : null))
    .filter(Boolean);
  if (bad.length) problems.push(`Texto mal codificado ("Â") en ${file}. Guarda en UTF-8 y corrige:\n${bad.slice(0, 5).join('\n')}`);

  if (/\.js$/.test(file)) {
    const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (r.status !== 0) problems.push(`Error de sintaxis en ${file}:\n${(r.stderr || '').split(/\r?\n/).slice(0, 8).join('\n')}`);
  }

  if (/\.tsx?$/.test(file)) {
    const root = findUp(path.dirname(file), 'tsconfig.json');
    if (root) {
      const r = spawnSync('npx', ['--no-install', 'tsc', '--noEmit', '--pretty', 'false'], {
        cwd: root, encoding: 'utf8', shell: process.platform === 'win32', timeout: 80000,
      });
      const out = `${r.stdout || ''}${r.stderr || ''}`;
      const rel = path.relative(root, file).split(path.sep).join('/');
      const errors = out.split(/\r?\n/)
        .filter((l) => l.split(path.sep).join('/').includes(rel) && /error TS\d+/.test(l));
      if (errors.length) problems.push(`Errores de TypeScript en ${rel}:\n${errors.slice(0, 10).map((e) => '  ' + e).join('\n')}`);
    }
  }

  if (problems.length) { console.error(problems.join('\n\n')); process.exit(2); }
  process.exit(0);
}

function findUp(dir, name) {
  let d = dir;
  while (true) {
    if (fs.existsSync(path.join(d, name))) return d;
    const p = path.dirname(d);
    if (p === d) return null;
    d = p;
  }
}
