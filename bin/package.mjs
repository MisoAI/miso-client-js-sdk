import { createRequire } from 'module';
import { dirname, join as joinPath } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

const require = createRequire(import.meta.url);

const PACKAGE_FILE_NAME = 'package.json';

export function readPackageFileSync(path) {
  const file = joinPath(path, PACKAGE_FILE_NAME);
  return existsSync(file) ? require(file) : undefined;
}

export function writePackageFileSync(path, data) {
  const file = joinPath(path, PACKAGE_FILE_NAME);
  if (!existsSync(file)) {
    mkdirSync(dirname(file), { recursive: true });
  }
  writeFileSync(joinPath(path, PACKAGE_FILE_NAME), JSON.stringify(data, null, 2));
}
