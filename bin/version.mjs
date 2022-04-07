import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';
import { dirname, join as joinPath } from 'path';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const VERSION_REGEXP = /^\d+\.\d+\.\d+(?:-beta\.\d+)?$/;
const version = process.argv[2];

if (!version) {
  console.log(`Usage: npm run version [version]`);
  process.exit();
}
if (!VERSION_REGEXP.test(version)) {
  console.error(`Illegal version: ${version}`);
  process.exit(1);
}

const rootDir = '..';
const packageFileName = 'package.json';

function readPackageFile(path) {
  return require(joinPath(rootDir, path, packageFileName));
}

function writePackageFile(path, data) {
  writeFileSync(joinPath(__dirname, rootDir, path, packageFileName), JSON.stringify(data, null, 2));
}

// read root package.json
const root = readPackageFile('.');

// find workspaces
// TODO: support wildcard
const projectPaths = root.workspaces;
const projectPathSet = new Set(projectPaths);

const projects = [];
const projectPathToModuleName = {};
//const moduleNameToProject = {};

function overwriteDependencyVersions(dependencies, version) {
  if (!dependencies) {
    return;
  }
  for (const moduleName in dependencies) {
    const oldVersion = dependencies[moduleName];
    if (oldVersion === '*' || (oldVersion.startsWith('file:') && projectPathToModuleName[oldVersion.substring(5)] === moduleName)) {
      dependencies[moduleName] = version;
    }
  }
}

for (const projectPath of projectPaths) {
  const project = readPackageFile(projectPath);
  !project.private && projects.push({ projectPath, project });
  projectPathToModuleName[projectPath] = project.name;
}

for (const { projectPath, project } of projects) {
  overwriteDependencyVersions(project.dependencies, version);
  overwriteDependencyVersions(project.devDependencies, version);
  overwriteDependencyVersions(project.peerDependencies, version);
  project.version = version;
  writePackageFile(projectPath, project);
}
