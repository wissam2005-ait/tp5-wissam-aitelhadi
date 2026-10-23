// « Fitness function » minimale, sans dépendance : le code situé dans un dossier
// domain/ ne doit importer QUE d'autres fichiers du domaine.
// (Équivalent professionnel : dependency-cruiser, eslint-plugin-boundaries.)
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const violations = [];

async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full);
    else if (full.endsWith('.js') && full.split(path.sep).includes('domain'))
      await check(full);
  }
}
async function check(file) {
  const src = await readFile(file, 'utf8');
  // lignes du type : import X from '...';  import '...';  export ... from '...';
  const re = /^\s*(?:import|export)\s(?:[\s\S]*?\sfrom\s*)?['"]([^'"]+)['"]/gm;
  for (const [, spec] of src.matchAll(re)) {
    const target = spec.startsWith('.') ? path.resolve(path.dirname(file), spec) : spec;
    const ok = spec.startsWith('.') && target.split(path.sep).includes('domain');
    if (!ok) violations.push(`${path.relative(ROOT, file)}  ->  ${spec}`);
  }
}
await walk(ROOT);
if (violations.length) {
  console.error("✗ Règle violée : le domaine dépend de l'extérieur :");
  violations.forEach(v => console.error('   ' + v));
  process.exit(1);
}
console.log(
  "✓ Règle de dépendance respectée : aucun fichier domain/ n'importe l'extérieur.",
);
