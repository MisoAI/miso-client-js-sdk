import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { lorem as _lorem } from '@miso.ai/lorem';

import { TestRunner, presetMiso } from '../src/index.js';
import MockElement from './mock-element.js';

test('render: multiple seeds', () => {
  const seedLorem = _lorem({ seed: 1 });

  for (let i = 0; i < 10; i++) {
    const seed = seedLorem.prng.seed();
    console.log(`[#${i}] seed = ${seed}`);

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
});

test.run();
