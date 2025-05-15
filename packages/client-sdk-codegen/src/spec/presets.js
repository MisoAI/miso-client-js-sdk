export const hybridSearch = Object.freeze({
  standard: Object.freeze({
    workflow: 'hybrid-search',
    autoQuery: true,
    autocomplete: true,
    facets: ['categories'],
    answerBox: true,
  }),
  minimal: Object.freeze({
    workflow: 'hybrid-search',
  }),
});

export const search = Object.freeze({
  standard: Object.freeze({
    workflow: 'search',
    autoQuery: true,
    autocomplete: true,
    //facets: ['categories'],
  }),
  minimal: Object.freeze({
    workflow: 'search',
  }),
});
