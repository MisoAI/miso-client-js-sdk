const paramsFromUrl = Object.fromEntries(new URLSearchParams(window.location.search).entries());
const apiParams = normalizeApiParams(paramsFromUrl);

const elements = {
  login: document.getElementById('login'),
  keyInput: document.getElementById('key-input'),
  mainInput: document.querySelector('miso-ask miso-query input'),
  followUpsSection: document.getElementById('follow-ups'),
  relatedResourcesContainer: document.getElementById('related-resources'),
};

if (paramsFromUrl.api_key) {
  submitApiKey(paramsFromUrl.api_key);
} else {
  const { keyInput } = elements;
  keyInput.focus();
  keyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      submitApiKey(keyInput.value);
      keyInput.value = '';
    }
  });
}

function submitApiKey(value) {
  elements.login.style.display = 'none';
  (window.misocmd || (window.misocmd = [])).push(() => start(value.trim()));
}

async function start(apiKey) {
  const MisoClient = window.MisoClient;

  if (paramsFromUrl.debug !== undefined) {
    window.debug(MisoClient);
  }
  MisoClient.plugins.use('std:ui');

  if (apiKey.toLowerCase() === 'lorem') {
    await MisoClient.plugins.install('std:lorem');
  }

  displayVersionInfo(MisoClient);

  const client = new MisoClient(apiKey);
  const rootWorkflow = client.ui.ask;

  setup(rootWorkflow);
  client.ui.asks.on('create', setup);

  // follow-up questions:
  // if user starts over, clean up current follow-up questions
  rootWorkflow.on('loading', () => {
    // clean up the entire follow-ups section
    elements.followUpsSection.innerHTML = '';
    // destroy all follow-up workflows
    for (const workflow of client.ui.asks.workflows) {
      if (workflow !== rootWorkflow) {
        workflow.destroy();
      }
    }
  });

  // start query if specified in URL
  if (paramsFromUrl.q) {
    elements.mainInput.value = paramsFromUrl.q;
    rootWorkflow.query({ q: paramsFromUrl.q });
  } else {
    elements.mainInput.focus();
  }
}

function setup(workflow) {
  // API parameters (from URL)
  workflow.useApi('questions', apiParams);

  // follow-up questions:
  // when a answer is fully populated, insert a new section for the follow-up question
  workflow.on('done', () => {
    elements.followUpsSection.insertAdjacentHTML('beforeend', render({ parentQuestionId: workflow.questionId }));
  });

  // follow-up questions:
  // when a new query starts, associate the last section container (for related resources) to that workflow
  workflow.on('loading', () => {
    elements.relatedResourcesContainer.workflow = workflow;
  });
}

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

// helpers //
function normalizeApiParams({ yearly_decay, fq } = {}) {
  yearly_decay = normalizeYearlyDecay(yearly_decay);
  const normalized = {};
  if (yearly_decay) {
    normalized.yearly_decay = yearly_decay;
  }
  if (fq) {
    normalized.fq = fq;
  }
  return normalized;
}

function normalizeYearlyDecay(value) {
  if (value === undefined || value === null) {
    return undefined;
  }
  value = Number(value);
  if (isNaN(value)) {
    return undefined;
  }
  return value;
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
