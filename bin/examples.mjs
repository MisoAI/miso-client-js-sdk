import { fileURLToPath } from 'url';
import { dirname, join as joinPath } from 'path';
import { readFileSync, copyFileSync, existsSync, mkdirSync } from 'fs';
import { loadAll as readYamlMultiDocs } from 'js-yaml';
import glob from 'fast-glob';

const __dirname = dirname(fileURLToPath(import.meta.url));

const cmd = process.argv[2];
const path = process.argv[3];

if ((cmd !== 'sync' && cmd !== 'init') || (cmd === 'init' && !path)) {
  console.log(`Usage:\n  npm run examples sync`);
}

const examplesDir = joinPath(__dirname, '../examples');
const manifestsPath = joinPath(examplesDir, 'manifests.yml');
const manifests = readYamlMultiDocs(readFileSync(manifestsPath, 'utf8'));

switch (cmd) {
  case 'sync':
    sync();
    break;
}

function sync() {
  for (const manifest of manifests) {
    syncOne(manifest);
  }
}

function syncOne(manifest) {
  const projectDir = joinPath(examplesDir, manifest.path);
  if (!existsSync(projectDir)) {
    console.error(`Project directory not found: ${projectDir}`);
    return;
  }
  for (const archetype of (manifest.archetypes || [])) {
    syncArchetypeFiles(projectDir, archetype);
  }
}

function syncArchetypeFiles(projectDir, archetype) {
  const archetypeDir = joinPath(examplesDir, '_archetype', archetype);
  if (!existsSync(archetypeDir)) {
    console.error(`Archetype directory not found: ${archetypeDir}`);
    return;
  }
  for (const file of glob.sync('**/*', { cwd: archetypeDir })) {
    const destFile = joinPath(projectDir, file);
    mkdirSync(dirname(destFile), { recursive: true });
    copyFileSync(joinPath(archetypeDir, file), destFile);
  }
}
