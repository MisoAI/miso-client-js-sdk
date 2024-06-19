export default function run({ Controller, presetMiso, loadStyles }) {
  const DEFAULT_API_KEY = __DEFAULT_ASK_API_KEY__;
  const API_KEY = new URL(window.location).searchParams.get('api_key') || DEFAULT_API_KEY;
  
  loadStyles();
  
  // Elements //
  const input = document.getElementById('input');
  const submit = document.getElementById('submit');
  const answerElement = document.getElementById('answer');
  
  const controller = new Controller(answerElement, {
    presets: [presetMiso],
    onCitationLink,
  });
  
  input.addEventListener('keyup', (event) => (event.key === 'Enter') && handleSubmit(event));
  submit.addEventListener('click', handleSubmit);
  
  function handleSubmit(event) {
    if (event.defaultPrevented) {
      return;
    }
    query(input.value.trim());
    input.blur();
  }
  
  input.focus();
  
  
  
  // API //
  let currentQueryIndex = -1;
  const POLL_INTERVAL_MS = 1000;
  const DEFAULT_QUESTION_PAYLOAD = {
    cite_end: ']',
    cite_link: 1,
    cite_start: '[',
    source_fl: ['cover_image', 'url', 'created_at', 'updated_at', 'published_at'],
  };
  
  async function query(question) {
    if (!question) {
      return;
    }
    // make a new session
    const queryIndex = ++currentQueryIndex;
  
    // show loading status
    controller.clear();
  
    const questionId = await fetchQuestionId({ ...DEFAULT_QUESTION_PAYLOAD, question });
    if (queryIndex !== currentQueryIndex) {
      return; // next question has been asked
    }
  
    // polling for answer
    while (true) {
      if (queryIndex !== currentQueryIndex) {
        break;
      }
      const response = await fetchAnswer(questionId);
      if (queryIndex !== currentQueryIndex) {
        break;
      }
      controller.update(response);
      if (response.finished) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
  
  async function fetchQuestionId(payload) {
    const response = await window.fetch(`https://api.askmiso.com/v1/ask/questions?api_key=${API_KEY}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const { data } = await response.json();
    return data.question_id;
  }
  
  async function fetchAnswer(questionId) {
    const response = await window.fetch(`https://api.askmiso.com/v1/ask/questions/${questionId}/answer?api_key=${API_KEY}`);
    const { data } = await response.json();
    return data;
  }
  
  function onCitationLink({ addClass, setAttribute, setTooltipHtml, escapeHtml }, { source, index }) {
    addClass('my-custom-class');
    if (source) {
      setAttribute('data-title', source.title);
      const date = new Date(source.published_at).toLocaleDateString();
      setTooltipHtml(`<span class="title">${escapeHtml(source.title)}</span><span class="date">${date}</span>`);
    }
  }
}
