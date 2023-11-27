import { CLASS_PREFIX } from './constants.js';
import * as DEFAULT_PHRASES from './phrases.js';

// TODO: refactor
// TODO: make ids constants
// TODO: placeholder

export function root(options = {}) {
  const { classPrefix = CLASS_PREFIX } = options;
  return `
<section id="${classPrefix}__question" class="${classPrefix}__section ${classPrefix}__question">
  <miso-ask class="${classPrefix}__query-container">
    <miso-query></miso-query>
  </miso-ask>
</section>
<section class="${classPrefix}__section ${classPrefix}__answer">
  ${answer(options)}
  ${sources(options)}
  <miso-ask class="${classPrefix}__bottom-spacing-container" visible-when="ongoing"></miso-ask>
</section>
<div id="${classPrefix}__follow-ups" class="${classPrefix}__follow-ups"></div>
<section id="${classPrefix}__related-resources" class="${classPrefix}__section ${classPrefix}__related-resources">
  <miso-ask visible-when="nonempty" logo="true">
    <h2 class="${classPrefix}__phrase ${classPrefix}__related-resources-phrase">${phraseText(options, 'relatedResources')}</h2>
    <miso-related-resources></miso-related-resources>
  </miso-ask>
</section>`.trim();
};

export function followUp(options = {}) {
  const { classPrefix = CLASS_PREFIX, parentQuestionId } = options;
  return `
<section class="${classPrefix}__section ${classPrefix}__follow-up">
  <miso-ask class="${classPrefix}__query-suggestions-container" visible-when="initial+nonempty" parent-question-id="${parentQuestionId}">
    <h3 class="${classPrefix}__phrase ${classPrefix}__related-questions-phrase">${phraseText(options, 'relatedQuestions')}</h3>
    <miso-query-suggestions></miso-query-suggestions>
  </miso-ask>
  <miso-ask class="${classPrefix}__query-container" visible-when="initial loading" parent-question-id="${parentQuestionId}">
    <miso-query></miso-query>
  </miso-ask>
  ${answer(options)}
  ${sources(options)}
  <miso-ask class="${classPrefix}__bottom-spacing-container" visible-when="ongoing" parent-question-id="${parentQuestionId}"></miso-ask>
</section>`.trim();
};



// helpers //
function answer(options) {
  const { classPrefix = CLASS_PREFIX } = options;
  return `
${containerOpenTag('answer', { ...options, visibleWhen: 'ready' })}
  ${ options.parentQuestionId ? '<hr>' : '' }
  <div class="${classPrefix}__phrase ${classPrefix}__question-phrase">${phraseText(options, 'question')}</div>
  <miso-question></miso-question>
  <miso-answer></miso-answer>
  <miso-feedback></miso-feedback>
</miso-ask>`.trim();
};

function sources(options) {
  const { classPrefix = CLASS_PREFIX } = options;
  return `
${containerOpenTag('sources', { ...options, visibleWhen: 'nonempty' })}
  <hr>
  <h3 class="${classPrefix}__phrase ${classPrefix}__sources-phrase">${phraseText(options, 'sources')}</h3>
  <miso-sources></miso-sources>
</miso-ask>`.trim();
};

function phraseText(options, key) {
  const { phrases = {} } = options;
  const fn = phrases[key] || DEFAULT_PHRASES[key];
  switch (typeof fn) {
    case 'function':
      return fn(options);
    case 'string':
      return fn;
    default:
      return '';
  }
}

function containerOpenTag(name, {
  visibleWhen,
  classPrefix = CLASS_PREFIX,
  logo = false,
  circledCitationIndex = true,
  parentQuestionId,
}) {
  let className = `${classPrefix}__${name}-container`;
  if (circledCitationIndex) {
    className += ` miso-circled-citation-index`;
  }
  const attributes = [
    ` class="${className}"`,
    ` logo="${logo ? 'true' : 'false'}"`,
  ];
  if (visibleWhen) {
    attributes.push(` visible-when="${visibleWhen}"`);
  }
  if (parentQuestionId) {
    attributes.push(` parent-question-id="${parentQuestionId}"`);
  }
  return `<miso-ask${attributes.join('')}>`;
}
