const login = document.querySelector('#login');
const keyInput = document.querySelector('#key-input');
const mainInput = document.querySelector('miso-ask miso-query input');

const apiKeyFromUrl = new URLSearchParams(window.location.search).get('api_key');

function submitApiKey(value) {
  login.style.display = 'none';
  start(value);
  mainInput.focus();
}

if (apiKeyFromUrl) {
  submitApiKey(apiKeyFromUrl);
} else {
  keyInput.focus();
  keyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      submitApiKey(keyInput.value);
      keyInput.value = '';
    }
  });
}

const followUpsSection = document.getElementById('follow-ups');
const relatedResourcesContainer = document.getElementById('related-resources');

function render({ parentQuestionId }) {
  return `
<div class="container">
  <miso-ask class="query-suggestions-container" visible-when="initial" parent-question-id="${parentQuestionId}">
    <div class="phrase query-suggestions">Related questions you can explore</div>
    <miso-query-suggestions></miso-query-suggestions>
  </miso-ask>
  <miso-ask class="query-container" visible-when="initial loading" parent-question-id="${parentQuestionId}">
    <miso-query>
      <input class="input" data-role="input" placeholder="Ask a follow-up question">
      <div class="autocomplete" data-role="autocomplete">
        <ol class="suggestion-list" data-role="suggestion-list"></ol>
      </div>
    </miso-query>
  </miso-ask>
  <miso-ask visible-when="ready" logo="false" parent-question-id="${parentQuestionId}">
    <hr>
    <div class="phrase question">And then you asked about...</div>
    <miso-question></miso-question>
    <miso-answer></miso-answer>
    <miso-feedback></miso-feedback>
    <div class="phrase sources">My reply is based on the following:</div>
    <miso-sources></miso-sources>
  </miso-ask>
</div>
`;
}

function setup(workflow) {
  workflow.useApi('questions', {
    source_fl: ['cover_image', 'url'],
    related_resoruce_fl: ['cover_image', 'url'],
  });
  // follow-up questions:
  // when a answer is fully populated, insert a new section for the follow-up question
  workflow.on('done', () => {
    followUpsSection.insertAdjacentHTML('beforeend', render({ parentQuestionId: workflow.questionId }));
  });
  // follow-up questions:
  // when a new query starts, associate the last section container (for related resources) to that workflow
  workflow.on('loading', () => {
    relatedResourcesContainer.workflow = workflow;
  });
}

function useCustomDataSource(workflow) {
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

function start(apiKey) {
  apiKey = apiKey.trim();
  const misocmd = window.misocmd || (window.misocmd = []);
  misocmd.push(() => {
    MisoClient.plugins.use('std:ui');

    displayVersionInfo(MisoClient);

    const client = new MisoClient(apiKey);
    const rootWorkflow = client.ui.ask;

    if (apiKey.toLowerCase() === 'lorem') {
      useCustomDataSource(rootWorkflow);
      client.ui.asks.on('create', useCustomDataSource);
    }

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

function displayVersionInfo(MisoClient) {
  let version = MisoClient.version;
  const versionInfo = document.getElementById('sdk-version');
  if (versionInfo) {
    if (version !== 'dev') {
      version = `v${version}`;
    }
    versionInfo.innerHTML = `SDK ${version}`;
  }
}
