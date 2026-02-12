import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { lorem as _lorem } from '@miso.ai/lorem';

import { MockElement, FreeController, generateTestSteps, presetMiso } from '../src/index.js';

test('render: multiple seeds', () => {
  const seedLorem = _lorem({ seed: 1 });

  for (let i = 0; i < 10; i++) {
    const seed = seedLorem.prng.seed();
    console.log(`[#${i}] seed = ${seed}`);
    const lorem = _lorem({ seed });

    const actualElement = new MockElement();
    const expectedElement = new MockElement();

    const actualController = new FreeController(actualElement, {
      presets: [presetMiso],
    });
    const expectedController = new FreeController(expectedElement, {
      presets: [presetMiso],
      forceOverwrite: true,
    });
    const controllers = [actualController, expectedController];

    let stepIndex = 1;
    let passed = true;

    for (const step of generateTestSteps({ lorem })) {
      switch (step.type) {
        case 'response':
          for (const controller of controllers) {
            controller.response = step.response;
          }
          break;
        case 'cursor':
          for (const controller of controllers) {
            controller.cursor += step.increment;
          }
          break;
      }
      if (actualController.html !== expectedController.html) {
        passed = false;
        break;
      }
      if (actualController.done !== expectedController.done) {
        passed = false;
        break;
      }
      if (actualController.done && expectedController.done) {
        break;
      }
      stepIndex++;
    }

    assert.ok(passed, `Seed ${seed}: Rendering failed at step ${stepIndex}`);
    assert.ok(actualController.done, `Seed ${seed}: Rendering should complete`);
  }
});

test.run();
