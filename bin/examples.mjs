import { fileURLToPath } from 'url';
import { dirname, join as joinPath } from 'path';
import { readFileSync, copyFileSync, existsSync, mkdirSync } from 'fs';
import { loadAll as readYamlMultiDocs } from 'js-yaml';
import glob from 'fast-glob';
import { readPackageFileSync, writePackageFileSync } from './package.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const cmd = process.argv[2];
const path = process.argv[3];
const args = Array.prototype.slice.call(process.argv, 3);

if ((cmd !== 'sync' && cmd !== 'init') || (cmd === 'init' && !path)) {
  console.log(`Usage:\n  npm run examples sync`);
}

const examplesDir = joinPath(__dirname, '../examples');
const manifestsPath = joinPath(examplesDir, 'manifests.yml');
const manifests = readYamlMultiDocs(readFileSync(manifestsPath, 'utf8'));

switch (cmd) {
  case 'help':
    help();
    break;
  case 'sync':
    sync();
    break;
  case 'init':
    init(...args);
    break;
  default:
    console.log(`Unrecognized command: ${cmd}`);
}

function help() {
  console.log(`
Usage:
  npm run examples sync: overwrites common files from archetypes to all projects
  npm run examples init [path]: initialize a project
`);
}

// sync //
function sync() {
  for (const manifest of manifests) {
    syncOne(manifest);
  }
}

function syncOne(manifest) {
  if (!manifest) {
    return;
  }
  const projectDir = getProjectDir(manifest.path);
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

// init //
function init(path) {
  const projectDir = getProjectDir(path);
  if (!existsSync(projectDir)) {
    mkdirSync(projectDir, { recursive: true });
  }
  writePackageFileSync(projectDir, {
    ...getDefaultPackage(path),
    ...readPackageFileSync(projectDir)
  });
  syncOne(findManifest(path));
}

function getDefaultPackage(path) {
  // TODO: work on keywords
  return {
    name: `@miso.ai/client-sdk-examples-${path.replaceAll('/', '-')}`,
    version: `1.0.0`,
    description: `Live Demo: Miso SDK`,
    keywords: [
      'Miso'
    ],
  };
}

// commons //
function getProjectDir(path) {
  return joinPath(examplesDir, path);
}

function findManifest(path) {
  for (const manifest of manifests) {
    if (manifest.path === path) {
      return manifest;
    }
  }
  return undefined;
}
