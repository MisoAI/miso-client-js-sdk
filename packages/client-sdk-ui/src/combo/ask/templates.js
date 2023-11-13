import { PREFIX } from './constants.js';

// TODO: make ids constants
// TODO: placeholder

export const root = (options) => `
<section id="${PREFIX}__question" class="${PREFIX}__section ${PREFIX}__question">
  <miso-ask class="${PREFIX}__query-container">
    <miso-query></miso-query>
  </miso-ask>
</section>
<section class="${PREFIX}__section ${PREFIX}__answer">
  ${options.templates.answer(options)}
</section>
<div id="${PREFIX}__follow-ups" class="${PREFIX}__follow-ups">
</div>
<section id="${PREFIX}__related-resources" class="${PREFIX}__section ${PREFIX}__related-resources">
  <miso-ask visible-when="ready" logo="true">
    <h2 class="${PREFIX}__related-resources-phrase"></h2>
    <miso-related-resources></miso-related-resources>
  </miso-ask>
</section>
`.trim();

export const followUp = (options, { parentQuestionId }) => `
<section class="${PREFIX}__section ${PREFIX}__follow-up">
  <miso-ask class="${PREFIX}__query-suggestions-container" visible-when="initial" parent-question-id="${parentQuestionId}">
    <h3 class="${PREFIX}__related-questions-phrase"></h3>
    <miso-query-suggestions></miso-query-suggestions>
  </miso-ask>
  <miso-ask class="${PREFIX}__query-container" visible-when="initial loading" parent-question-id="${parentQuestionId}">
    <miso-query></miso-query>
  </miso-ask>
  ${options.templates.answer(options, { parentQuestionId })}
</section>
`.trim();

export const answer = (options, { parentQuestionId } = {}) => {
  // TODO: include/omit miso-circled-citation-index by options
  const openTag = `<miso-ask class="${PREFIX}__answer-container miso-circled-citation-index" visible-when="ready" logo="false"${parentQuestionId ? ` parent-question-id="${parentQuestionId}"` : ''}>`;
  const closeTag = '</miso-ask>';
  return `
${openTag}
  ${ parentQuestionId ? '<hr>' : '' }
  <div class="${PREFIX}__question-phrase"></div>
  <miso-question></miso-question>
  <miso-answer></miso-answer>
  <miso-feedback></miso-feedback>
  <hr>
  <h3 class="${PREFIX}__sources-phrase"></h3>
  <miso-sources></miso-sources>
${closeTag}
`.trim();
};
