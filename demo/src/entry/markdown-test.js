import { FreeController, presetMiso, generateTestSteps } from '@miso.ai/progressive-markdown';
import { lorem as _lorem } from '@miso.ai/lorem';

//loadStyles();

const seed = new URLSearchParams(window.location.search).get('seed') || undefined;

const actualElement = document.getElementById('answer-element-actual');
const expectedElement = document.getElementById('answer-element-expected');
const actualController = new FreeController(actualElement, {
  presets: [presetMiso],
});
const expectedController = new FreeController(expectedElement, {
  presets: [presetMiso],
  forceOverwrite: true,
});

const controllers = [actualController, expectedController];

for (const step of generateTestSteps({ seed })) {
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
  console.log(step, actualController.rendered, expectedController.rendered);
  if (actualController.html !== expectedController.html) {
    console.error('html mismatch', actualController.html, expectedController.html);
    break;
  }
  if (actualController.done !== expectedController.done) {
    console.error('done mismatch', actualController.done, expectedController.done);
    break;
  }
  if (actualController.done && expectedController.done) {
    break;
  }
}
