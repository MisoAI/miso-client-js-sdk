import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';

import { Parser, Compiler, trees } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const str = readFileSync(resolve(__dirname, './test.md'), 'utf8');

const parser = new Parser();
const compiler = new Compiler();

const tree = trees.clean(trees.shim(await parser.parse(str)));

console.log(JSON.stringify(tree));

const html = compiler.stringify(tree);

//console.log(html);
