import { escapeHtml } from '@miso.ai/commons';
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

const { [ROLE.QUERY]: _answerBasedQueryLayout, ...MESSAGE_LAYOUTS } = ANSWER_BASED_LAYOUTS;

// the rename/delete button controls of a thread (the conversation header's,
// and a thread list item's context menu's): mapped to the thread record —
// the dialogs work with its title, and the buttons disable while the record
// has no thread id yet (a thread being created is not addressable until
// resolved; the workflows guard all the same)
const THREAD_CONTROL_OPTIONS = Object.freeze({
  value: thread => thread && thread.title,
  disabled: thread => !(thread && thread.thread_id),
});
const THREAD_RENAME_PROMPT = Object.freeze({
  title: 'Rename thread',
  placeholder: 'Thread name',
  confirmText: 'Rename',
});
const THREAD_DELETE_CONFIRM = Object.freeze({
  title: 'Delete thread',
  message: title => `Are you sure you want to delete "${title || 'this thread'}"? This cannot be undone.`,
  confirmText: 'Delete',
  danger: true,
});

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
    [ROLE.NEW_THREAD]: [LAYOUT_TYPE.BUTTON, { icon: 'plus', text: 'New chat' }],
  }),

  // the message item subworkflow behind <miso-message>: the answer-based
  // layouts, minus the query role — a message has no query flow of its own.
  // The answer types out only while being generated (`instant` renders an
  // already-finished answer in one shot), the sources render as the compact
  // horizontal cards of the hybrid-search UI, and no per-message logo banner
  'message': Object.freeze({
    ...MESSAGE_LAYOUTS,
    [ROLE.CONTAINER]: [LAYOUT_TYPE.CONTAINER, { logo: false }],
    [ROLE.QUESTION]: LAYOUT_TYPE.QUESTION,
    [ROLE.ANSWER]: [LAYOUT_TYPE.TYPEWRITER, { instant: true }],
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

  // the thread item subworkflow behind <miso-thread>: the item decomposes
  // into role elements rendered by the generic layouts — the title text
  // (with a presentation fallback for untitled threads), the context menu's
  // rename (ask-then-submit through the prompt dialog) and delete
  // (confirm-then-submit) buttons, and the subscription toggle for custom
  // item bodies that place one. The context menu markup comes from the item
  // template (threadMenuBlock); the item-container layout drives its
  // open/close behavior by the item-menu data-role contract
  'thread': Object.freeze({
    [ROLE.CONTAINER]: [LAYOUT_TYPE.ITEM_CONTAINER, { logo: false }],
    [ROLE.TITLE]: [LAYOUT_TYPE.TEXT, { tag: 'div', templates: { content: (layout, { value }) => escapeHtml(value || 'Untitled') } }],
    [ROLE.RENAME]: [LAYOUT_TYPE.BUTTON, { ...THREAD_CONTROL_OPTIONS, text: 'Rename', prompt: THREAD_RENAME_PROMPT }],
    [ROLE.DELETE]: [LAYOUT_TYPE.BUTTON, { ...THREAD_CONTROL_OPTIONS, text: 'Delete', confirm: THREAD_DELETE_CONFIRM }],
    [ROLE.SUBSCRIPTION]: [LAYOUT_TYPE.CHECKBOX, { icon: 'bell', text: 'Subscribe', checkedIcon: 'bell-fill', checkedText: 'Subscribed' }],
  }),

  'conversation': Object.freeze({
    ...BASE_LAYOUTS,
    [ROLE.MESSAGES]: [LAYOUT_TYPE.MESSAGES, { itemType: 'message', incremental: true }],
    [ROLE.QUERY]: [LAYOUT_TYPE.SEARCH_BOX, { placeholder: 'Ask a follow-up question', clearOnSubmit: true, blurOnSubmit: false, disableWhenOngoing: true, templates: { buttonIcon: 'send' } }],
    [ROLE.TITLE]: [LAYOUT_TYPE.TEXT, { tag: 'div' }],
    [ROLE.RENAME]: [LAYOUT_TYPE.BUTTON, { ...THREAD_CONTROL_OPTIONS, icon: 'pencil', prompt: THREAD_RENAME_PROMPT }],
    [ROLE.DELETE]: [LAYOUT_TYPE.BUTTON, { ...THREAD_CONTROL_OPTIONS, icon: 'trash', confirm: THREAD_DELETE_CONFIRM }],
    [ROLE.SUBSCRIPTION]: [LAYOUT_TYPE.CHECKBOX, { icon: 'bell', text: 'Subscribe', checkedIcon: 'bell-fill', checkedText: 'Subscribed' }],
  }),

});
