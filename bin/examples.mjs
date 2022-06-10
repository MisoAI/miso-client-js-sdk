import { fileURLToPath } from 'url';
import { dirname, join as joinPath } from 'path';
import { readdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'fs';
import { loadAll as readYamlMultiDocs, load as readYaml } from 'js-yaml';
import deepmerge from 'deepmerge';
import { readPackageFileSync, writePackageFileSync } from './package.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEEPMERGE_OPTIONS = {
  arrayMerge: (_, source) => source
};

const cmd = process.argv[2];
const args = Array.prototype.slice.call(process.argv, 3);

const examplesDir = joinPath(__dirname, '../examples');

const projects = getProjects(examplesDir);
const archetypes = getArchetypes(examplesDir);

validateArchetypes(archetypes);
validate(projects, archetypes);

switch (cmd) {
  case 'help':
    help();
    break;
  case 'sync':
    sync();
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
  for (const project of projects) {
    syncOne(project);
  }
}

function syncOne(project) {
  if (!project) {
    return;
  }
  if (!existsSync(project.absolutePath)) {
    mkdirSync(project.absolutePath, { recursive: true });
  }
  const context = {};
  for (const archetypeId of (project.archetypes || [])) {
    syncArchetype(context, project, archetypes[archetypeId]);
  }
  for (const path in context) {
    const [type, node] = context[path];
    const absolutePath = joinPath(project.absolutePath, path);
    switch (type) {
      case 'original':
        break;
      case 'copy':
        mkdirSync(dirname(absolutePath), { recursive: true });
        copyFileSync(node.absolutePath, absolutePath);
        //console.log(`[copy] ${node.absolutePath} -> ${absolutePath}`);
        break;
      case 'write':
        writeJsonSync(absolutePath, node.content);
        //console.log(`[write] ${absolutePath}`);
        break;
    }
  }
}

function syncArchetype(context, project, archetype) {
  for (const asset of archetype.assets) {
    const destPath = asset.destination || asset.source;
    let dest = context[destPath];
    if (!dest) {
      const destAbsolutePath = joinPath(project.absolutePath, destPath);
      dest = ['original', { absolutePath: destAbsolutePath, exist: existsSync(destAbsolutePath) }]
    }

    const action = asset.action;
    switch (asset.action) {
      case 'boilerplate':
        if (dest[0] === 'original' && !dest[1].exist) {
          dest = context[destPath] = ['copy', asset];
        }
        break;
      case 'overwrite':
        dest = context[destPath] = ['copy', asset];
        break;
      case 'merge-before':
      case 'merge-after':
      case 'merge-both':
        dest[1].content = dest[1].content || readJsonSync(dest[1].absolutePath);
        asset.content = asset.content || readJsonSync(asset.absolutePath);
        dest = ['write', { ...dest[1], content: mergeJson(action, dest[1].content, asset.content) }];
        break;
    }
    context[destPath] = dest;
  }
}

// commons //
function getProjects(examplesDir) {
  const projectsPath = joinPath(examplesDir, 'projects.yml');
  return readYamlMultiDocs(readFileSync(projectsPath, 'utf8'))
    .map(project => ({ ...project, absolutePath: joinPath(examplesDir, project.path) }));
}

function findProject(path) {
  return projects.find(project => project.path === path);
}

function getArchetypes(examplesDir) {
  const archetypeRootDir = joinPath(examplesDir, '_archetype');
  return readdirSync(archetypeRootDir)
    .reduce((m, id) => {
      const archetypeDirAbsolutePath = joinPath(archetypeRootDir, id);
      const manifestFile = joinPath(archetypeDirAbsolutePath, '_manifest.yml');
      if (!existsSync(manifestFile)) {
        throw new Error(`File not found: ${manifestFile}`);
      }
      const manifest = readYaml(readFileSync(manifestFile, 'utf8'));
      m[id] = { id, absolutePath: archetypeDirAbsolutePath, ...manifest };
      return m;
    }, {});
}

function validateArchetypes(archetypes) {
  for (const id in archetypes) {
    const archetype = archetypes[id];
    for (const asset of archetype.assets) {
      // TODO: check for instruction
      const absolutePath = asset.absolutePath = joinPath(archetype.absolutePath, asset.source);
      if (!existsSync(absolutePath)) {
        throw new Error(`File not found: ${absolutePath} (used in archetype ${id})`);
      }
      // TODO: make sure source file is mergable for merge-* action types
    }
    // TODO: warn for unused archetype files
  }
}

function validate(projects, archetypes) {
  for (const project of projects) {
    for (const id of (project.archetypes || [])) {
      if (!archetypes[id]) {
        throw new Error(`Archetype not found: ${id} (used in project ${project.path})`);
      }
    }
  }
}

function readJsonSync(file) {
  return existsSync(file) ? JSON.parse(readFileSync(file)) : undefined;
}

function writeJsonSync(file, value) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2));
}

function mergeJson(action, base, patch) {
  switch (action) {
    case 'merge-before':
      return deepmerge(patch, base, DEEPMERGE_OPTIONS);
    case 'merge-after':
      return deepmerge(base, patch, DEEPMERGE_OPTIONS);
    case 'merge-both':
      return deepmerge.all([patch, base, patch], DEEPMERGE_OPTIONS);
  }
}
