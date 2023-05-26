---
---

{% raw %}
<style>
  .btn-group * {
    box-shadow: none !important;
  }
  #reload-btn {
    margin-left: 0.5em;
  }
  .phrase {
    font-size: .875rem;
    line-height: 1.2;
    margin: 1rem auto;
    color: #999;
  }
  .miso-list {
    --miso-list-item-height: 7rem;
    --miso-list-item-gap: 0.65rem;
    --miso-list-description-lines: 3;
  }
  .follow-up {
  }
</style>
<section>
  <miso-ask>
    <miso-query></miso-query>
  </miso-ask>
</section>
<section>
  <miso-ask visible-when="ready" logo="false">
    <div class="phrase">You asked about...</div>
    <miso-question></miso-question>
    <hr>
    <miso-answer></miso-answer>
    <miso-feedback></miso-feedback>
    <hr>
    <div class="phrase">My reply is based on the following:</div>
    <miso-sources></miso-sources>
</section>
<section id="follow-ups">
</section>
<section>
  <miso-ask id="related-resources" visible-when="ready" logo="true">
    <hr>
    <div class="phrase">Go beyond, and learn more about this topic:</div>
    <miso-related-resources></miso-related-resources>
  </miso-ask>
</section>
<script id="follow-up-template" type="text/plain">
<div class="follow-up">
  <hr>
  <miso-ask visible-when="initial loading" parent-question-id="{{parentQuestionId}}">
    <miso-query></miso-query>
  </miso-ask>
  <miso-ask visible-when="ready" parent-question-id="{{parentQuestionId}}" logo="false">
    <div class="phrase">You asked about...</div>
    <miso-question></miso-question>
    <hr>
    <miso-answer></miso-answer>
    <miso-feedback></miso-feedback>
    <hr>
    <div class="phrase">My reply is based on the following:</div>
    <miso-sources></miso-sources>
  </miso-ask>
</div>
</script>
<script>
const followUpsSection = document.getElementById('follow-ups');
const relatedResourcesContainer = document.getElementById('related-resources');
const TEMPLATE_STRING = document.getElementById('follow-up-template').innerHTML;
const template = (data) => {
  let html = TEMPLATE_STRING;
  for (const key of Object.keys(data)) {
    const value = data[key];
    html = html.replaceAll(`{{${key}}}`, value);
  }
  return html;
};
function setup(workflow) {
  // when a new query starts, associate the last section container to that workflow
  workflow.on('loading', () => {
    relatedResourcesContainer.workflow = workflow;
  });
  // when a answer is fully populated, insert a new section for the follow-up question
  workflow.on('done', () => {
    followUpsSection.insertAdjacentHTML('beforeend', template({ parentQuestionId: workflow.questionId }));
  });
}
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  // TODO: better timing management
  window.helpers.fetch.intercept({
    request: (request) => {
      // add header to force plaintext response
      if (request.method.toLowerCase() === 'post' && request.url.indexOf('/api/ask/questions') > -1) {
        request.headers.append('x-answer-sampling', '0.5');
        request.headers.append('x-speed-rate', '2');
      }
      return request;
    }
  });
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient({
    apiKey: '...',
    apiHost: 'http://localhost:9901/api',
  });
  const rootWorkflow = client.ui.ask;
  client.ui.asks.on('create', setup);
  setup(rootWorkflow);
  rootWorkflow.on('loading', () => {
    // clean up the entire follow-ups section
    followUpsSection.innerHTML = '';
    // destroy all follow-up workflows
    for (const workflow of client.ui.asks.workflows) {
      if (workflow !== rootWorkflow) {
        workflow.destroy();
      }
    }
  });
});
</script>
{% endraw %}
