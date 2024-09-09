import { STATUS, LAYOUT_CATEGORY } from '../../constants.js';
import CollectionLayout from '../list/collection.js';
import { affiliation } from '../templates.js';

const TYPE = 'affiliation';
const DEFAULT_CLASSNAME = 'miso-affiliation';

function root(layout, state) {
  const { className, role, templates } = layout;
  const { status } = state;
  const roleAttr = role ? ` data-role="${role}"` : '';
  const data = state.value || {};
  const channelAttr = data.channel ? ` data-channel="${data.channel}"` : '';
  return `<div class="${className} ${status}"${roleAttr}${channelAttr}>${status === STATUS.READY ? templates[status](layout, state) : ''}</div>`;
}

function ready(layout, state) {
  const { templates } = layout;
  const items = layout._getItems(state);

  if (items && items.length > 0) {
    return templates.body(layout, state);
  } else {
    return templates.empty(layout, state);
  }
}

function body(layout, state) {
  const { className, templates } = layout;
  const items = layout._getItems(state);
  return `<div class="${className}__body">${templates.header(layout, state)}${templates.list(layout, state, items)}</div>`;
}

function header(layout, state) {
  const { className, templates } = layout;
  let { headerText } = templates;
  if (typeof headerText === 'function') {
    headerText = headerText(layout, state);
  }
  if (!headerText) {
    return '';
  }
  return `<div class="${className}__header"><div class="${className}__header-tab">${headerText}</div></div>`;
}

const DEFAULT_TEMPLATES = Object.freeze({
  root,
  [STATUS.READY]: ready,
  body,
  header,
  affiliation,
  ctaText: 'View',
  headerText: 'Featured',
});

const INHERITED_DEFAULT_TEMPLATES = Object.freeze({
  ...CollectionLayout.defaultTemplates,
  ...DEFAULT_TEMPLATES,
});

export default class AffiliationLayout extends CollectionLayout {

  static get category() {
    return LAYOUT_CATEGORY.AFFILIATION;
  }

  static get type() {
    return TYPE;
  }

  static get defaultTemplates() {
    return INHERITED_DEFAULT_TEMPLATES;
  }

  static get defaultClassName() {
    return DEFAULT_CLASSNAME;
  }

  constructor({ className = DEFAULT_CLASSNAME, templates, ...options } = {}) {
    super({ className, itemType: 'affiliation', templates: { ...DEFAULT_TEMPLATES, ...templates }, ...options });
  }

  _getItems(state) {
    const { products } = state.value || {};
    return products;
  }

}
