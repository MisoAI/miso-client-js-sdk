---
---

{% raw %}
<style>
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
  .content > h3 {
    margin-top: 0 !important;
  }
</style>
<h3>Restart DOM/Workflow</h3>
<div>
  <button type="button" class="btn btn-success" onclick="restart({ asynchronous: true });">Both (async)</button>
  <button type="button" class="btn btn-success" onclick="restart({ asynchronous: false });">Both (sync)</button>
  <button type="button" class="btn btn-success" onclick="restartDom({ asynchronous: true });">DOM (async)</button>
  <button type="button" class="btn btn-success" onclick="restartDom({ asynchronous: false });">DOM (sync)</button>
  <!--
  <button type="button" class="btn btn-success" onclick="restartWorkflow({ asynchronous: true });">Workflow (async)</button>
  <button type="button" class="btn btn-success" onclick="restartWorkflow({ asynchronous: false });">Workflow (sync)</button>
  -->
</div>
<hr>
<div id="root-container"></div>
<script id="root-template" type="text/plain">
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
</script>
<script id="follow-up-template" type="text/plain">
<div class="follow-up" data-miso-pqid="{{parentQuestionId}}">
  <hr>
  <miso-ask visible-when="initial" parent-question-id="{{parentQuestionId}}">
    <div class="phrase">Related questions you can explore</div>
    <miso-query-suggestions></miso-query-suggestions>
    <div class="phrase">... or enter by yourself</div>
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
const rootContainer = document.getElementById('root-container');
let followUpsSection, relatedResourcesContainer;
const TEMPLATES = {
  ROOT: document.getElementById('root-template').innerHTML,
  FOLLOW_UP: document.getElementById('follow-up-template').innerHTML,
};
function render(html, data) {
  for (const key of Object.keys(data)) {
    const value = data[key];
    html = html.replaceAll(`{{${key}}}`, value);
  }
  return html;
}
function restart({ asynchronous = false } = {}) {
  clear();
  asynchronous ? setTimeout(start) : start();
}
function restartDom({ asynchronous = false } = {}) {
  const html = rootContainer.innerHTML;
  if (asynchronous) {
    clearDom();
    setTimeout(() => startDom(html));
  } else {
    startDom(html);
  }
}
function restartWorkflow({ asynchronous = false } = {}) {
  clearWorkflow();
  asynchronous ? setTimeout(startWorkflow) : startWorkflow();
}
function clear() {
  clearDom();
  clearWorkflow();
}
function clearDom() {
  rootContainer.innerHTML = '';
}
function clearWorkflow() {
  const client = MisoClient.instances[0];
  client && client.ui.asks.reset();
}
function startDom(html) {
  rootContainer.innerHTML = html || TEMPLATES.ROOT;
  followUpsSection = document.getElementById('follow-ups');
  relatedResourcesContainer = document.getElementById('related-resources');
}
function start() {
  startDom();
  startWorkflow();
}
function startWorkflow() {
  const client = MisoClient.instances[0] || new MisoClient({
    apiKey: '...',
    apiHost: 'http://localhost:9901/api',
  });
  // context
  const context = client.ui.asks;
  context.on('loading', ({ workflow }) => {
    relatedResourcesContainer.workflow = workflow;
  });
  context.on('done', ({ workflow }) => {
    if (followUpsSection.querySelector(`[data-miso-pqid="${workflow.questionId}"]`)) {
      // already rendered
      return;
    }
    followUpsSection.insertAdjacentHTML('beforeend', render(TEMPLATES.FOLLOW_UP, { parentQuestionId: workflow.questionId }));
  });
  // root workflow
  const rootWorkflow = client.ui.ask;
  rootWorkflow.on('loading', () => {
    // clean up the entire follow-ups section
    followUpsSection.innerHTML = '';
    // clear workflows except for the root one
    client.ui.asks.reset({ root: false });
  });
}
// kick off //
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  // TODO: better timing management
  window.helpers.doggo.config({
    answer: { sampling: 0.5 }, speedRate: 2
  });
  MisoClient.plugins.use('std:ui');
  restart();
});
</script>
{% endraw %}
