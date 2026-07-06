import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { lorem as _lorem } from '@miso.ai/lorem';

import { TestRunner, presetMiso } from '../src/index.js';
import MockElement from './mock-element.js';

// SEEDS=<n> sweeps n seeds (default 10); SEED=<seed> runs that single seed
const SEED = process.env.SEED ? parseInt(process.env.SEED) : undefined;
const COUNT = SEED !== undefined ? 1 : parseInt(process.env.SEEDS) || 10;

// seeds that exposed bugs in the past; always covered regardless of sweep size
const REGRESSION_SEEDS = [
  943595528,  // zero-size tree from a just-opened code fence
  1258853514, // from-index resolves deeper than the inherited ref when new content reopens a closed node
];

function runSeed(seed, tag) {
  console.log(`[${tag}] seed = ${seed}`);

  const elements = [new MockElement(), new MockElement()];
  const runner = new TestRunner(elements, {
    seed,
    renderer: { presets: [presetMiso] },
  });

  let passed = false;
  try {
    runner.run();
    passed = true;
  } catch(error) {
    console.error(error);
  }

  assert.ok(passed, `Seed ${seed}: Rendering failed`);
}

test('render: multiple seeds', () => {
  const seedLorem = _lorem({ seed: 1 });

  for (let i = 0; i < COUNT; i++) {
    runSeed(SEED !== undefined ? SEED : seedLorem.prng.seed(), `#${i}`);
  }
});

test('render: regression seeds', () => {
  for (const seed of REGRESSION_SEEDS) {
    runSeed(seed, 'regression');
  }
});

test.run();
