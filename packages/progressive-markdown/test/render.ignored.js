import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';

import { FreeController, presetMiso, generateTestSteps } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const str = readFileSync(resolve(__dirname, './test.md'), 'utf8');

const element = undefined;
const options = {
  presets: [presetMiso],
};
const controller = new FreeController(element, options);

//controller.response = { value: str, stage: '0', finished: true };
//controller.cursor = 10;

//console.log(element.innerHTML);

let index = 0;
for (const step of generateTestSteps()) {
  console.log(`${index++}: ${JSON.stringify(step)}`);
  if (index > 100) {
    break;
  }
}

/*
const query = new Query();

query.update(str);

const from = 10;
const to = 30;

console.log(JSON.stringify(query.positionOf(from).unlinked));
console.log(JSON.stringify(query.positionOf(to).unlinked));

console.log(JSON.stringify(query.overwrite(from)));
console.log(JSON.stringify(query.progress(from, to)));
*/
