const { api_key: apiKey } = Object.fromEntries(new URLSearchParams(window.location.search).entries());

if (!apiKey) {
  alert(`No API key found in the URL. Please provide an API key in the URL query`);
}

const TYPES = [
  'type-a', 'type-b', 'type-c', 'type-d', 'type-e',
];
function getType(source) {
  const id = TYPES[source.title.codePointAt(0) % 5];
  const label = id.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  return { id, label };
}

(window.misocmd || (window.misocmd = [])).push(async () => {

  const MisoClient = window.MisoClient;

  function onCitationLink({ setAttribute, setTooltipHtml, escapeHtml }, { source, index }) {
    if (source) {
      // determine source type by some logic
      const type = getType(source);
      setAttribute('data-type', type.id);
      setTooltipHtml(`<div class="title">${escapeHtml(source.title)}</div><div class="type">${type.label}</div>`);
    }
  }
  function escapeHtml(text) {
    text = `${text}`;
    return text && text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
  function renderArticleInfoBlock(layout, article) {
    const { className } = layout;
    const { title, snippet, description, created_at, updated_at, published_at } = article;
    const date = published_at || created_at || updated_at;
    const type = getType(article);
    let content = '';
    if (title) {
      content += `<div class="${className}__item-title">${escapeHtml(title)}</div>`;
    }
    if (snippet) {
      content += `<div class="${className}__item-snippet">${snippet}</div>`;
    } else if (description) {
      content += `<div class="${className}__item-desc">${escapeHtml(description)}</div>`;
    }
    content += `<div class="${className}__item-date-type">`;
    if (date) {
      content += `<div class="${className}__item-date">${new Date(date).toLocaleDateString()}</div>`;
    }
    if (type) {
      content += `<div class="${className}__item-type" data-type="${type.id}">${type.label}</div>`;
    }
    content += `</div>`;
    return `<div class="${className}__item-info-container">${content}</div>`;
  }
  function renderArticleIndexBlock(layout, article, { index }) {
    const { className } = layout;
    const i = index + 1;
    const type = getType(article);
    return `<div class="${className}__item-index-container"><span class="${className}__item-index miso-citation-index" data-index="${i}" data-type="${type.id}"></span></div>`;
  }
  MisoClient.on('create', (client) => {
    client.ui.asks.useLayouts({
      answer: {
        onCitationLink,
      },
      sources: ['list', {
        templates: {
          infoBlock: renderArticleInfoBlock,
          indexBlock: renderArticleIndexBlock,
        },
      }],
      /*
      related_resources: ['list', {
        templates: {
          infoBlock: renderArticleInfoBlock,
        },
      }],
      */
    });
    client.ui.asks.on('ready', (event) => {
      const workflow = event.workflow;
      // workflow.states.data.value
      const parentQuestionId = workflow.parentQuestionId;
      const comboElement = document.querySelector('miso-ask-combo');
      const containerSelector = parentQuestionId ? `miso-ask[parent-question-id="${parentQuestionId}"]` : `miso-ask`;
      if (comboElement.querySelector(`${containerSelector} .miso-type-defs`)) {
        return;
      }
      const questionElement = comboElement.querySelector(`${containerSelector} miso-question`);
      questionElement.insertAdjacentHTML('afterend', `
        <div class="miso-type-defs">
          <ul>
            <li data-type="type-a">Type A</li>
            <li data-type="type-b">Type B</li>
            <li data-type="type-c">Type C</li>
            <li data-type="type-d">Type D</li>
            <li data-type="type-e">Type E</li>
          </ul>
        </div>
      `);
    });
  });

  const options = { apiKey };
  const combo = MisoClient.ui.combo.ask;
  combo.config(options);
  combo.start();
});
