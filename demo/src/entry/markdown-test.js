import { FreeController, presetMiso, generateTestSteps, loadStyles } from '@miso.ai/progressive-markdown';
import { lorem as _lorem } from '@miso.ai/lorem';

//loadStyles();

const element = document.getElementById('answer');
const controller = new FreeController(element, {
  presets: [presetMiso],
});

for (const step of generateTestSteps()) {
  switch (step.type) {
    case 'response':
      controller.response = step.response;
      break;
    case 'cursor':
      controller.cursor += step.increment;
      break;
  }
  console.log(step, controller.rendered);
  if (controller.done) {
    break;
  }
}
