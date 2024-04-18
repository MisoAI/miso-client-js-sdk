const { api_key: apiKey } = Object.fromEntries(new URLSearchParams(window.location.search).entries());

if (!apiKey) {
  alert(`No API key found in the URL. Please provide an API key in the URL query`);
}

const TYPES = [
  {
    type: 'Sponsored',
    alternatives: ['Advertorial', 'Sponsor news'],
  },
  {
    type: 'News',
    alternatives: ['Analysis', 'Investment', 'Investment and news'],
  },
  {
    type: 'Idea exchange',
  },
  {
    type: 'Opinion',
    alternatives: ['Leader', 'LGC Briefing', 'Round Table'],
  },
];

const TYPE_INDEX = TYPES.reduce((map, { type, alternatives }) => {
  map.set(type.toLowerCase(), type);
  for (const alt of alternatives || []) {
    map.set(alt.toLowerCase(), type);
  }
  return map;
}, new Map());

function getType(source) {
  const custom_attributes = source.custom_attributes || {};
  const type = custom_attributes.type && custom_attributes.type[0] || undefined;
  return type && TYPE_INDEX.get(type.toLowerCase()) || 'Other';
}

(window.misocmd || (window.misocmd = [])).push(async () => {

  const MisoClient = window.MisoClient;

  function onCitationLink({ setAttribute, setTooltipHtml, escapeHtml }, { source, index }) {
    if (source) {
      // determine source type by some logic
      const type = getType(source);
      if (type) {
        setAttribute('data-type', type);
        setTooltipHtml(`<span class="title">${escapeHtml(source.title)}</span><span class="type">${type}</span>`);
      } else {
        setTooltipHtml(`<span class="title">${escapeHtml(source.title)}</span>`);
      }
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
      content += `<div class="${className}__item-date">${new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>`;
    }
    if (type) {
      content += `<div class="${className}__item-type" data-type="${type}">${type}</div>`;
    }
    content += `</div>`;
    return `<div class="${className}__item-info-container">${content}</div>`;
  }
  function renderArticleIndexBlock(layout, article, { index }) {
    const { className } = layout;
    const i = index + 1;
    const type = getType(article);
    return `<div class="${className}__item-index-container"><span class="${className}__item-index miso-citation-index" data-index="${i}" data-type="${type}"></span></div>`;
  }
  function getElements(workflow) {
    const parentQuestionId = workflow.parentQuestionId;
    const comboElement = document.querySelector('miso-ask-combo');
    const containerSelector = parentQuestionId ? `miso-ask[parent-question-id="${parentQuestionId}"]` : `miso-ask`;
    // insert type definitions block if not already present
    if (!comboElement.querySelector(`${containerSelector} .miso-type-defs`)) {
      const questionElement = comboElement.querySelector(`${containerSelector} miso-question`);
      questionElement.insertAdjacentHTML('afterend', `<div class="miso-type-defs"><ul></ul></div>`);
    }
    const typeDefsListElement = comboElement.querySelector(`${containerSelector} .miso-type-defs ul`);
    return { comboElement, typeDefsListElement };
  }
  MisoClient.on('create', (client) => {
    const context = client.ui.asks;
    context.useLayouts({
      answer: {
        onCitationLink,
      },
      sources: ['list', {
        templates: {
          infoBlock: renderArticleInfoBlock,
          indexBlock: renderArticleIndexBlock,
        },
      }],
    });
    context.on('loading', (event) => {
      const { typeDefsListElement } = getElements(event.workflow);
      // clean up type definitions block
      typeDefsListElement.innerHTML = '';
    });
    context.on('data', (event) => {
      const data = event.value;
      if (!data) {
        return;
      }
      const sources = data.sources;
      if (!sources || sources.length === 0) {
        return;
      }
      const { typeDefsListElement } = getElements(event.workflow);
      // insert type definitions block if not already present
      for (const type of sources.map(getType)) {
        // add to <ul> if not already present
        if (!type || typeDefsListElement.querySelector(`li[data-type="${type}"]`)) {
          continue;
        }
        typeDefsListElement.insertAdjacentHTML('beforeend', `<li data-type="${type}">${type}</li>`);
      }
    });
  });

  const options = {
    apiKey,
    api: {
      // Tell the API to include custom_attributes.type for source items in response
      source_fl: ['cover_image', 'url', 'created_at', 'updated_at', 'published_at', 'custom_attributes.type'],
    },
  };
  const combo = MisoClient.ui.combo.ask;
  combo.config(options);
  combo.start();
});
