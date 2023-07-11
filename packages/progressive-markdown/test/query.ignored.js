import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';

import { Query } from '../lib/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const str = readFileSync(resolve(__dirname, './test.md'), 'utf8');

const query = new Query();

query.update(str);

const from = 10;
const to = 30;

console.log(JSON.stringify(query.positionOf(from).unlinked));
console.log(JSON.stringify(query.positionOf(to).unlinked));

console.log(JSON.stringify(query.overwrite(from)));
console.log(JSON.stringify(query.progress(from, to)));
