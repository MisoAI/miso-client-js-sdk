import { prettify } from 'htmlfy';
import { TestRunner, presetMiso } from '@miso.ai/progressive-markdown';

const urlParams = new URLSearchParams(window.location.search);
const seedInUrl = urlParams.has('seed');
const seed = parseInt(urlParams.get('seed')) || undefined;

const seedElement = document.getElementById('seed');
const stepElement = document.getElementById('step');
const resultElement = document.getElementById('result');
const responsesElement = document.getElementById('responses');
const conflictsElement = document.getElementById('conflicts');

const copySeedButton = document.getElementById('copy-seed');
const lockSeedButton = document.getElementById('lock-seed');
const modeButtons = document.querySelectorAll('.mode-toggle [data-mode]');

const actualDomElement = document.getElementById('answer-dom-actual');
const expectedDomElement = document.getElementById('answer-dom-expected');
const actualHtmlElement = document.querySelector('#answer-html-actual code');
const expectedHtmlElement = document.querySelector('#answer-html-expected code');
const actualMdElement = document.querySelector('#answer-md-actual code');
const expectedMdElement = document.querySelector('#answer-md-expected code');
const groupsElement = document.querySelector('.groups');

const runner = new TestRunner([actualDomElement, expectedDomElement], {
  seed,
  renderer: { presets: [presetMiso] },
});

seedElement.textContent = runner.seed;

copySeedButton.addEventListener('click', () => navigator.clipboard.writeText(`${runner.seed}`));

if (seedInUrl) {
  lockSeedButton.style.display = 'none';
} else {
  lockSeedButton.addEventListener('click', () => {
    urlParams.set('seed', runner.seed);
    window.location.search = urlParams.toString();
  });
}

let htmlStale = true;
let mdStale = true;
let responses = 0;
let conflicts = 0;

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

runner.on('state', state => {
  logState(state);

  const { step, controllers: [{ rendered }] } = state;
  if (step.type === 'response') {
    responses++;
  }
  if (rendered && rendered.conflict) {
    conflicts++;
  }

  stepElement.textContent = `${step.index}`;
  responsesElement.textContent = `${responses}`;
  conflictsElement.textContent = `${conflicts}`;

  htmlStale = true;
  mdStale = true;
  if (groupsElement.dataset.mode === 'html') {
    renderHtml();
  } else if (groupsElement.dataset.mode === 'md') {
    renderMd();
  }
});

try {
  runner.run();
  resultElement.style.color = 'green';
  resultElement.textContent = 'Passed';
} catch (error) {
  console.error(error);
  resultElement.style.color = 'red';
  resultElement.textContent = 'Failed';
}

// helpers //
function renderHtml() {
  if (!htmlStale) {
    return;
  }
  htmlStale = false;

  actualHtmlElement.textContent = prettify(runner.controllers[0].html);
  expectedHtmlElement.textContent = prettify(runner.controllers[1].html);
  Prism.highlightElement(actualHtmlElement);
  Prism.highlightElement(expectedHtmlElement);
}

function renderMd() {
  if (!mdStale) {
    return;
  }
  mdStale = false;

  const actualResponse = runner.controllers[0].response;
  const expectedResponse = runner.controllers[1].response;
  actualMdElement.textContent = actualResponse ? actualResponse.value : '';
  expectedMdElement.textContent = expectedResponse ? expectedResponse.value : '';
  Prism.highlightElement(actualMdElement);
  Prism.highlightElement(expectedMdElement);
}

function logState({ step, controllers } = {}) {
  const { index, type, increment, ...rest } = step;
  const indexTag = `[#${index}]`;
  switch (type) {
    case 'response':
      console.log(`${indexTag} ${type}`, rest);
      break;
    case 'cursor':
      console.log(`${indexTag} ${type} +${increment}`);
      break;
  }
  console.log(indexTag, ...controllers);
}
