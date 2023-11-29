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
  // render DOM and get elements
  await client.ui.ready;
  const { templates } = MisoClient.ui.defaults.ask;
  const rootElement = document.querySelector('#miso-ask-combo');
  rootElement.innerHTML = templates.root();
  const followUpsSection = rootElement.querySelector(`.miso-ask-combo__follow-ups`);
  const relatedResourcesContainer = rootElement.querySelector(`.miso-ask-combo__related-resources miso-ask`);
  // setup workflows
  if (followUpsSection) {
    // 1. when a answer is fully populated, insert a new section for the follow-up question
    context.on('done', ({ workflow }) => {
      followUpsSection.insertAdjacentHTML('beforeend', templates.followUp({ parentQuestionId: workflow.questionId }));
    });
    // 2. if user starts over, clean up current follow-up questions
    rootWorkflow.on('loading', () => {
      // clean up the entire follow-ups section
      followUpsSection.innerHTML = '';
      // destroy all follow-up workflows
      context.reset({ root: false });
    });
  }
  if (relatedResourcesContainer) {
    // 3. when a new query starts, associate the last section container (for related resources) to that workflow
    context.on('loading', ({ workflow }) => {
      relatedResourcesContainer.workflow = workflow;
    });
  }
  // start query if specified in URL
  rootWorkflow.autoQuery();
});
</script>
{% endraw %}
