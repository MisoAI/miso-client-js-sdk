import { cpSync } from 'fs';
import { join as joinPath, basename } from 'path';

// Minimal stand-in for the copyfiles package: copy each source (a file or a
// directory, recursively) into the destination directory.

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node bin/copyfiles.js <source>... <dest-dir>');
  process.exit(1);
}

const dest = args.pop();

for (const source of args) {
  cpSync(source, joinPath(dest, basename(source)), { recursive: true });
}
