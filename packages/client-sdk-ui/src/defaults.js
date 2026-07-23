import { ROLE, LAYOUT_TYPE } from './constants.js';
import { compactArticle, compactArticleInfoBlock } from './layout/templates.js';

/**
 * Default layout options of each workflow, keyed by workflow name. The UI
 * plugin seeds the workflow plugin's defaults store with these values at
 * install. The tables mirror the workflow class hierarchy.
 */

const BASE_LAYOUTS = {
  [ROLE.CONTAINER]: LAYOUT_TYPE.CONTAINER,
  [ROLE.ERROR]: LAYOUT_TYPE.ERROR,
};

const ANSWER_BASED_LAYOUTS = {
  ...BASE_LAYOUTS,
  [ROLE.QUERY]: [LAYOUT_TYPE.SEARCH_BOX, { placeholder: 'Ask a question' }],
  [ROLE.QUESTION]: [LAYOUT_TYPE.TEXT, { tag: 'h2' }],
  [ROLE.ANSWER]: LAYOUT_TYPE.TYPEWRITER,
  [ROLE.FEEDBACK]: LAYOUT_TYPE.FEEDBACK,
  [ROLE.IMAGES]: [LAYOUT_TYPE.GALLERY, { incremental: true, itemType: 'image' }],
  [ROLE.SOURCES]: [LAYOUT_TYPE.LIST, { incremental: true, itemType: 'article', templates: { ordered: true } }],
  [ROLE.AFFILIATION]: [LAYOUT_TYPE.AFFILIATION, { incremental: true, itemType: 'affiliation', link: { rel: 'noopener nofollow' } }],
};

function totalContent(layout, { value }) {
  if (value === undefined) {
    return '';
  }
  const { formatNumber } = layout.templates.helpers;
  const formatted = formatNumber(value);
  const label = value === 1 ? 'result' : 'results';
  return `${formatted} ${label}`;
}

const SEARCH_BASED_LAYOUTS = {
  ...BASE_LAYOUTS,
  [ROLE.QUERY]: [LAYOUT_TYPE.SEARCH_BOX],
  [ROLE.PRODUCTS]: [LAYOUT_TYPE.LIST, { incremental: true, infiniteScroll: true }],
  [ROLE.KEYWORDS]: [LAYOUT_TYPE.TEXT, { raw: true }],
  [ROLE.TOTAL]: [LAYOUT_TYPE.TEXT, { raw: true, templates: { content: totalContent } }],
  [ROLE.FACETS]: [LAYOUT_TYPE.FACETS],
  [ROLE.SORT]: [LAYOUT_TYPE.SELECT],
  [ROLE.MORE]: [LAYOUT_TYPE.MORE_BUTTON],
};

export const defaultLayouts = Object.freeze({

  'ask': Object.freeze({
    ...ANSWER_BASED_LAYOUTS,
    [ROLE.QUERY]: [LAYOUT_TYPE.SEARCH_BOX, { templates: { buttonIcon: 'send' } }],
    [ROLE.REASONING]: LAYOUT_TYPE.TYPEWRITER,
    [ROLE.RELATED_RESOURCES]: [LAYOUT_TYPE.LIST, { incremental: true, itemType: 'article' }],
    [ROLE.QUERY_SUGGESTIONS]: LAYOUT_TYPE.OPTION_LIST,
    [ROLE.FOLLOW_UP_QUESTIONS]: LAYOUT_TYPE.OPTION_LIST,
  }),

  'search': Object.freeze({
    ...SEARCH_BASED_LAYOUTS,
  }),

  'hybrid-search': Object.freeze({
    ...ANSWER_BASED_LAYOUTS,
    ...SEARCH_BASED_LAYOUTS,
    [ROLE.QUERY]: [LAYOUT_TYPE.SEARCH_BOX, { placeholder: '' }],
    [ROLE.QUESTION]: [LAYOUT_TYPE.TEXT, { raw: true }],
    [ROLE.SOURCES]: [
      LAYOUT_TYPE.HORIZONTAL,
      {
        incremental: true,
        itemType: 'article',
        templates: {
          ordered: true,
          article: compactArticle,
          articleInfoBlock: compactArticleInfoBlock
        }
      }
    ],
  }),

  'recommendation': Object.freeze({
    ...BASE_LAYOUTS,
    [ROLE.PRODUCTS]: LAYOUT_TYPE.LIST,
  }),

  'explore': Object.freeze({
    ...BASE_LAYOUTS,
    [ROLE.RELATED_QUESTIONS]: [LAYOUT_TYPE.LIST, { itemType: 'question', link: { rel: 'noopener nofollow' } }], // TODO: should define by useLink()
    [ROLE.QUERY]: [LAYOUT_TYPE.SEARCH_BOX, { placeholder: 'Ask a question' }],
  }),

  'history': Object.freeze({
    ...BASE_LAYOUTS,
    [ROLE.THREADS]: [LAYOUT_TYPE.THREADS, { itemType: 'thread', incremental: true }],
  }),

  'thread': Object.freeze({
    ...BASE_LAYOUTS,
    [ROLE.MESSAGES]: [LAYOUT_TYPE.MESSAGES, { itemType: 'message' }],
  }),

});
