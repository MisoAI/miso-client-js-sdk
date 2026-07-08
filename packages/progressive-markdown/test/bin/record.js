// Records a seeded render run into a content-based fixture, so the regression
// survives future changes to the lorem implementation.
//
// Usage: node test/bin/record.js <seed> [description]

import { writeFileSync, mkdirSync } from 'node:fs';
import { TestRunner, presetMiso } from '../../src/index.js';
import MockElement from '../mock-element.js';

const seed = parseInt(process.argv[2]);
const description = process.argv[3] || '';

if (!seed) {
  console.error('Usage: node test/bin/record.js <seed> [description]');
  process.exit(1);
}

const runner = new TestRunner([new MockElement(), new MockElement()], {
  seed,
  record: true,
  renderer: { presets: [presetMiso] },
});

let passed = false;
try {
  runner.run();
  passed = true;
} catch (error) {
  console.error(error.message);
}

const dir = new URL('../fixtures/', import.meta.url);
mkdirSync(dir, { recursive: true });
const file = new URL(`render-${seed}.json`, dir);
writeFileSync(file, JSON.stringify({ seed, description, passed, steps: runner.recording }, null, 1));
console.log(`${passed ? 'PASSED' : 'FAILED'} | ${runner.recording.length} steps -> ${file.pathname}`);
