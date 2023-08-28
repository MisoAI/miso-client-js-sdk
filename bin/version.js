import { fileURLToPath } from 'url';
import { writeFileSync, existsSync } from 'fs';
import { dirname, join as joinPath } from 'path';
import { readPackageFileSync, writePackageFileSync } from './package.js';

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

const rootDir = joinPath(__dirname, '..');
const versionFileName = 'src/version.js';

function writeVersionFile(path, version) {
  const filePath = joinPath(rootDir, path, versionFileName);
  if (existsSync(filePath)) {
    writeFileSync(filePath, `export default '${version}';`);
  }
}

// read root package.json
const root = readPackageFileSync(rootDir);

// find workspaces
// TODO: support wildcard
const projectPaths = root.workspaces;
const projects = [];
const projectPathToModuleName = {};

// first pass: collect some info
for (const projectPath of projectPaths) {
  const project = readPackageFileSync(joinPath(rootDir, projectPath));
  !project.private && projects.push({ projectPath, project });
  projectPathToModuleName[projectPath] = project.name;
}

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

// second pass: overwrite versions
for (const { projectPath, project } of projects) {
  overwriteDependencyVersions(project.dependencies, version);
  overwriteDependencyVersions(project.devDependencies, version);
  overwriteDependencyVersions(project.peerDependencies, version);
  project.version = version;
  writePackageFileSync(joinPath(rootDir, projectPath), project);
  writeVersionFile(projectPath, version);
}
