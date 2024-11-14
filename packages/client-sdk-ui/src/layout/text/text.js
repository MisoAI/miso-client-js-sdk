import { escapeHtml } from '@miso.ai/commons';
import { LAYOUT_CATEGORY } from '../../constants.js';
import TemplateBasedLayout from '../template.js';

const TYPE = 'text';
const DEFAULT_CLASSNAME = 'miso-text';

function root(layout, { value }) {
  const { className, role, options: { raw = false, tag } } = layout;
  const roleAttr = role ? `data-role="${role}"` : '';
  const content = value !== undefined ? escapeHtml(getFormatFunction(layout)(value)) : '';
  return raw ? content : `<${tag} class="${className}" ${roleAttr}>${content}</${tag}>`;
}

function getFormatFunction(layout) {
  let { format } = layout.options;
  const { formatDate, formatNumber } = layout.templates.helpers;
  if (!format) {
    return v => `${v}`;
  }
  switch (typeof format) {
    case 'function':
      return format;
    case 'string':
      format = [format];
      break;
  }
  let [type, args] = format;
  switch (type) {
    case 'date':
      return v => formatDate(v, args);
    case 'number':
      return v => formatNumber(v, args);
    default:
      return v => `${v}`;
  }
}

const DEFAULT_TEMPLATES = Object.freeze({
  root,
});

export default class TextLayout extends TemplateBasedLayout {

  static get category() {
    return LAYOUT_CATEGORY.TEXT;
  }

  static get type() {
    return TYPE;
  }

  static get defaultTemplates() {
    return DEFAULT_TEMPLATES;
  }

  static get defaultClassName() {
    return DEFAULT_CLASSNAME;
  }

  constructor({
    className = DEFAULT_CLASSNAME,
    templates,
    tag = 'p',
    ...options
  } = {}) {
    super({
      className,
      templates: { ...DEFAULT_TEMPLATES, ...templates },
      tag,
      ...options,
    });
  }

}
