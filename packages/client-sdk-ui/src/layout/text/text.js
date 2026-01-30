import { escapeHtml } from '@miso.ai/commons';
import TemplateBasedLayout from '../template.js';

const TYPE = 'text';
const DEFAULT_CLASSNAME = 'miso-text';

function root(layout, state) {
  const { className, role, options: { raw = false, tag } } = layout;
  const roleAttr = role ? `data-role="${role}"` : '';
  const text = layout.templates.content(layout, state);
  return raw ? text : `<${tag} class="${className}" ${roleAttr}>${text}</${tag}>`;
}

function content(layout, { value }) {
  return value !== undefined ? escapeHtml(getFormatFunction(layout)(value)) : '';
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
  content,
});

export default class TextLayout extends TemplateBasedLayout {

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
