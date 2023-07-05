const login = document.querySelector('#login');
const keyInput = document.querySelector('#key-input');
const mainInput = document.querySelector('miso-ask miso-query input');

keyInput.focus();

keyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    login.style.display = 'none';
    start(keyInput.value);
    keyInput.value = '';
    mainInput.focus();
  }
});

const followUpsSection = document.getElementById('follow-ups');
const relatedResourcesContainer = document.getElementById('related-resources');

const TEMPLATE_STRING = `
<div class="container">
<miso-ask class="query-container" visible-when="initial loading" parent-question-id="{{parentQuestionId}}">
  <miso-query>
    <input class="input" placeholder="Ask a follow-up question">
  </miso-query>
</miso-ask>
<miso-ask visible-when="ready" logo="false" parent-question-id="{{parentQuestionId}}">
  <hr>
  <div class="phrase question">And then you asked about...</div>
  <miso-question></miso-question>
  <miso-answer></miso-answer>
  <miso-feedback></miso-feedback>
  <div class="phrase sources">My reply is based on the following:</div>
  <miso-sources></miso-sources>
</miso-ask>
</div>
`.trim();

const template = (data) => {
  let html = TEMPLATE_STRING;
  for (const key of Object.keys(data)) {
    const value = data[key];
    html = html.replaceAll(`{{${key}}}`, value);
  }
  return html;
};

function setup(workflow) {
  // follow-up questions:
  // when a answer is fully populated, insert a new section for the follow-up question
  workflow.on('done', () => {
    followUpsSection.insertAdjacentHTML('beforeend', template({ parentQuestionId: workflow.questionId }));
  });
  // follow-up questions:
  // when a new query starts, associate the last section container (for related resources) to that workflow
  workflow.on('loading', () => {
    relatedResourcesContainer.workflow = workflow;
  });
}

function start(apiKey) {
  apiKey = apiKey.trim();
  const misocmd = window.misocmd || (window.misocmd = []);
  misocmd.push(() => {
    MisoClient.plugins.use('std:ui');

    const client = new MisoClient(apiKey);

    if (apiKey.toLowerCase() === 'lorem') {
      useCustomData(client);
    }

    const rootWorkflow = client.ui.ask;
    setup(rootWorkflow);
    client.ui.asks.on('create', setup);

    // follow-up questions:
    // if user starts over, clean up current follow-up questions
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
}

function useCustomData(client) {
  const workflow = client.ui.ask;
  workflow.useApi(false);
  const api = window.doggoganger.buildApi();
  workflow.on('input', async ({ session, payload }) => {
    const answer = await api.ask.questions(payload);
    let intervalId;
    intervalId = setInterval(async () => {
      const value = await answer.get();
      const { finished } = value;
      finished && clearInterval(intervalId);
      workflow.updateData({ session, value, ongoing: !finished });
    }, 1000);
  });
}
