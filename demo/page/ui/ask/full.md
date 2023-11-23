{% raw %}
<h1 class="hero-title">Miso Answers</h1>
<div id="miso-ask-combo" class="miso-ask-combo" style="display: none;">
  <section id="miso-ask-combo__question" class="miso-ask-combo__section miso-ask-combo__question">
    <miso-ask class="miso-ask-combo__query-container" status="initial nonempty">
      <miso-query></miso-query>
    </miso-ask>
  </section>
  <section class="miso-ask-combo__section miso-ask-combo__answer">
    <miso-ask class="miso-ask-combo__answer-container miso-circled-citation-index" visible-when="ready" logo="false" status="initial nonempty">
      <div class="miso-ask-combo__phrase miso-ask-combo__question-phrase">You asked...</div>
      <miso-question></miso-question>
      <miso-answer></miso-answer>
      <miso-feedback></miso-feedback>
    </miso-ask>
    <miso-ask class="miso-ask-combo__sources-container miso-circled-citation-index" visible-when="nonempty" logo="false" status="initial empty">
      <hr>
      <h3 class="miso-ask-combo__phrase miso-ask-combo__sources-phrase">My reply is based on the following</h3>
      <miso-sources></miso-sources>
    </miso-ask>
    <miso-ask class="miso-ask-combo__bottom-spacing-container" visible-when="ongoing" status="initial empty"></miso-ask>
  </section>
  <div id="miso-ask-combo__follow-ups" class="miso-ask-combo__follow-ups"></div>
  <section id="miso-ask-combo__related-resources" class="miso-ask-combo__section miso-ask-combo__related-resources">
    <miso-ask visible-when="nonempty" logo="true" status="initial empty">
      <h2 class="miso-ask-combo__phrase miso-ask-combo__related-resources-phrase">Go beyond, and learn more about this topic</h2>
      <miso-related-resources></miso-related-resources>
    </miso-ask>
  </section>
</div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  const MisoClient = window.MisoClient;
  const client = new MisoClient({
    apiKey: '...',
    apiHost: 'http://localhost:9901/api',
  });
  const context = client.ui.asks;
  const rootWorkflow = client.ui.ask;
  // elements
  const rootElement = document.querySelector('#miso-ask-combo');
  const elements = {
    rootQuery: rootElement.querySelector(`#miso-ask-combo__question miso-query`),
    followUpsSection: rootElement.querySelector(`#miso-ask-combo__follow-ups`),
    relatedResourcesContainer: rootElement.querySelector(`#miso-ask-combo__related-resources miso-ask`),
  };
  // when a answer is fully populated, insert a new section for the follow-up question
  context.on('done', ({ workflow }) => {
    elements.followUpsSection.insertAdjacentHTML('beforeend', renderFollowUp(workflow.questionId));
  });
  // when a new query starts, associate the last section container (for related resources) to that workflow
  context.on('loading', ({ workflow }) => {
    elements.relatedResourcesContainer.workflow = workflow;
  });
  // if user starts over, clean up current follow-up questions
  rootWorkflow.on('loading', () => {
    // clean up the entire follow-ups section
    elements.followUpsSection.innerHTML = '';
    // destroy all follow-up workflows
    context.reset({ root: false });
  });
  // wait for miso-query content to be populated
  if (!rootWorkflow.states['view:query']) {
    await rootWorkflow._hub.once('view:query');
  }
  // show the root element
  rootElement.style.display = '';
  // start query if specified in URL
  const rootInputElement = elements.rootQuery.querySelector(`[data-role="input"]`);
  const q = new URLSearchParams(window.location.search).get('q');
  if (q) {
    rootInputElement.value = q;
    rootWorkflow.query({ q });
  } else {
    rootInputElement.focus();
  }
});
function renderFollowUp(parentQuestionId) {
  return `
<section class="miso-ask-combo__section miso-ask-combo__follow-up">
  <miso-ask class="miso-ask-combo__query-suggestions-container" visible-when="initial+nonempty" parent-question-id="${parentQuestionId}">
    <h3 class="miso-ask-combo__phrase miso-ask-combo__related-questions-phrase">Related questions you can explore</h3>
    <miso-query-suggestions></miso-query-suggestions>
  </miso-ask>
  <miso-ask class="miso-ask-combo__query-container" visible-when="initial loading" parent-question-id="${parentQuestionId}">
    <miso-query></miso-query>
  </miso-ask>
  <miso-ask class="miso-ask-combo__answer-container miso-circled-citation-index" visible-when="ready" logo="false" parent-question-id="${parentQuestionId}">
    <hr>
    <div class="miso-ask-combo__phrase miso-ask-combo__question-phrase">You asked...</div>
    <miso-question></miso-question>
    <miso-answer></miso-answer>
    <miso-feedback></miso-feedback>
  </miso-ask>
  <miso-ask class="miso-ask-combo__sources-container miso-circled-citation-index" visible-when="nonempty" logo="false" parent-question-id="${parentQuestionId}">
    <hr>
    <h3 class="miso-ask-combo__phrase miso-ask-combo__sources-phrase">My reply is based on the following</h3>
    <miso-sources></miso-sources>
  </miso-ask>
</section>
`.trim();
}
</script>
{% endraw %}
