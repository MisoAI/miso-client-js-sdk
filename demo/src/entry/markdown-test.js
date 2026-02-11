import { FreeController, presetMiso, generateTestSteps } from '@miso.ai/progressive-markdown';
import { lorem as _lorem } from '@miso.ai/lorem';

const urlParams = new URLSearchParams(window.location.search);
const seedInUrl = urlParams.has('seed');
const lorem = _lorem({ seed: parseInt(urlParams.get('seed')) || undefined });
const { seed } = lorem;

const seedElement = document.getElementById('seed');
const stepElement = document.getElementById('step');
const resultElement = document.getElementById('result');
const copySeedButton = document.getElementById('copy-seed');
const seedToUrlButton = document.getElementById('seed-to-url');

seedElement.textContent = seed;

copySeedButton.addEventListener('click', () => navigator.clipboard.writeText(`${seed}`));

if (seedInUrl) {
  seedToUrlButton.style.display = 'none';
} else {
  seedToUrlButton.addEventListener('click', () => {
    urlParams.set('seed', seed);
    window.location.search = urlParams.toString();
  });
}

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

let stepIndex = 1;
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
  stepElement.textContent = `${stepIndex}`;
  console.log(stepIndex, step, actualController.rendered, expectedController.rendered);
  if (actualController.html !== expectedController.html) {
    console.error('html mismatch');
    console.log(actualController.html);
    console.log(expectedController.html);
    resultElement.style.color = 'red';
    resultElement.textContent = 'Failed';
    break;
  }
  if (actualController.done !== expectedController.done) {
    console.error('done mismatch', actualController.done, expectedController.done);
    resultElement.style.color = 'red';
    resultElement.textContent = 'Failed';
    break;
  }
  if (actualController.done && expectedController.done) {
    resultElement.style.color = 'green';
    resultElement.textContent = 'Passed';
    break;
  }
  stepIndex++;
}
