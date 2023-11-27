{% raw %}
<h1 class="hero-title">Miso Answers</h1>
<div id="miso-ask-combo" class="miso-ask-combo"></div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  // setup client
  const MisoClient = window.MisoClient;
  const client = new MisoClient({
    apiKey: '...',
    apiHost: 'http://localhost:9901/api',
  });
  const context = client.ui.asks;
  const rootWorkflow = client.ui.ask;
  // setup workflows
  // 1. when a answer is fully populated, insert a new section for the follow-up question
  context.on('done', ({ workflow }) => {
    elements.followUpsSection.insertAdjacentHTML('beforeend', templates.followUp({ parentQuestionId: workflow.questionId }));
  });
  // 2. when a new query starts, associate the last section container (for related resources) to that workflow
  context.on('loading', ({ workflow }) => {
    elements.relatedResourcesContainer.workflow = workflow;
  });
  // 3. if user starts over, clean up current follow-up questions
  rootWorkflow.on('loading', () => {
    // clean up the entire follow-ups section
    elements.followUpsSection.innerHTML = '';
    // destroy all follow-up workflows
    context.reset({ root: false });
  });
  // render DOM and find elements
  await client.ui.ready;
  const { templates } = MisoClient.ui.defaults.ask;
  const rootElement = document.querySelector('#miso-ask-combo');
  rootElement.innerHTML = templates.root();
  const elements = {
    rootQuery: rootElement.querySelector(`#miso-ask-combo__question miso-query`),
    followUpsSection: rootElement.querySelector(`#miso-ask-combo__follow-ups`),
    relatedResourcesContainer: rootElement.querySelector(`#miso-ask-combo__related-resources miso-ask`),
  };
  // miso-query auto focus/value
  const queryLayout = rootWorkflow.views.get('query').layout;
  const q = new URLSearchParams(window.location.search).get('q');
  if (q) {
    queryLayout.value = q;
    // start query if specified in URL
    rootWorkflow.query({ q });
  } else {
    queryLayout.focus();
  }
});
</script>
{% endraw %}
