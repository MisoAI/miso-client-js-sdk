import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { lorem as _lorem } from '@miso.ai/lorem';

import { TestRunner, presetMiso } from '../src/index.js';
import MockElement from './mock-element.js';

// SEEDS=<n> sweeps n seeds (default 10); SEED=<seed> runs that single seed
const SEED = process.env.SEED ? parseInt(process.env.SEED) : undefined;
const COUNT = SEED !== undefined ? 1 : parseInt(process.env.SEEDS) || 10;

function rate(count, total) {
  return `${count} / ${total} (${total ? (100 * count / total).toFixed(2) : '0.00'}%)`;
}

function formatStats({ conflicts, overwrites, updates }) {
  return `conflicts = ${rate(conflicts, updates)}, overwrites = ${rate(overwrites, updates)}`;
}

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

  return runner.stats;
}

test('render: multiple seeds', () => {
  const seedLorem = _lorem({ seed: 1 });

  const total = { conflicts: 0, overwrites: 0, updates: 0 };
  for (let i = 0; i < COUNT; i++) {
    const stats = runSeed(SEED !== undefined ? SEED : seedLorem.prng.seed(), `#${i}`);
    total.conflicts += stats.conflicts;
    total.overwrites += stats.overwrites;
    total.updates += stats.updates;
  }
  console.log(`[total] ${formatStats(total)}`);
});

// runs that exposed bugs in the past, pinned by recorded content so they survive
// changes to the lorem implementation; record new ones with `node test/record.mjs <seed>`
test('render: regression fixtures', () => {
  const dir = new URL('./fixtures/', import.meta.url);
  const files = readdirSync(dir).filter(file => file.endsWith('.json'));
  assert.ok(files.length > 0, 'No regression fixtures found');

  for (const file of files) {
    const { description, steps } = JSON.parse(readFileSync(new URL(file, dir), 'utf8'));
    console.log(`[fixture] ${file}${description ? ` — ${description}` : ''}`);

    const runner = new TestRunner([new MockElement(), new MockElement()], {
      replay: steps,
      renderer: { presets: [presetMiso] },
    });

    let passed = false;
    try {
      runner.run();
      passed = true;
    } catch(error) {
      console.error(error);
    }

    assert.ok(passed, `Fixture ${file}: rendering failed`);
  }
});

test.run();
