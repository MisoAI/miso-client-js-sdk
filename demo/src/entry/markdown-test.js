import { prettify } from 'htmlfy';
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
const lockSeedButton = document.getElementById('lock-seed');
const actualDomElement = document.getElementById('answer-dom-actual');
const expectedDomElement = document.getElementById('answer-dom-expected');
const actualHtmlElement = document.querySelector('#answer-html-actual code');
const expectedHtmlElement = document.querySelector('#answer-html-expected code');
const actualMdElement = document.querySelector('#answer-md-actual code');
const expectedMdElement = document.querySelector('#answer-md-expected code');

seedElement.textContent = seed;

copySeedButton.addEventListener('click', () => navigator.clipboard.writeText(`${seed}`));

if (seedInUrl) {
  lockSeedButton.style.display = 'none';
} else {
  lockSeedButton.addEventListener('click', () => {
    urlParams.set('seed', seed);
    window.location.search = urlParams.toString();
  });
}

const groupsElement = document.querySelector('.groups');
const modeButtons = document.querySelectorAll('.mode-toggle [data-mode]');

const actualController = new FreeController(actualDomElement, {
  presets: [presetMiso],
});
const expectedController = new FreeController(expectedDomElement, {
  presets: [presetMiso],
  forceOverwrite: true,
});

let htmlStale = true;
let mdStale = true;

function renderHtml() {
  if (!htmlStale) {
    return;
  }
  actualHtmlElement.textContent = prettify(actualController.html);
  expectedHtmlElement.textContent = prettify(expectedController.html);
  Prism.highlightElement(actualHtmlElement);
  Prism.highlightElement(expectedHtmlElement);
  htmlStale = false;
}

function renderMd() {
  if (!mdStale) {
    return;
  }
  const actualResponse = actualController.response;
  const expectedResponse = expectedController.response;
  actualMdElement.textContent = actualResponse ? actualResponse.value : '';
  expectedMdElement.textContent = expectedResponse ? expectedResponse.value : '';
  Prism.highlightElement(actualMdElement);
  Prism.highlightElement(expectedMdElement);
  mdStale = false;
}

for (const button of modeButtons) {
  if (button.dataset.mode === groupsElement.dataset.mode) {
    button.classList.add('selected');
  }
  button.addEventListener('click', () => {
    groupsElement.dataset.mode = button.dataset.mode;
    for (const b of modeButtons) {
      b.classList.toggle('selected', b === button);
    }
    if (button.dataset.mode === 'html') {
      renderHtml();
    } else if (button.dataset.mode === 'md') {
      renderMd();
    }
  });
}

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

  htmlStale = true;
  mdStale = true;
  if (groupsElement.dataset.mode === 'html') {
    renderHtml();
  } else if (groupsElement.dataset.mode === 'md') {
    renderMd();
  }

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
