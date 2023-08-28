import { LAYOUT_CATEGORY } from '../../constants.js';
import TemplateBasedLayout from '../template.js';

const TYPE = 'error';
const DEFAULT_CLASSNAME = 'miso-error';

function root(layout, state) {
  const { className, templates } = layout;
  const { status, value } = state;
  if (status !== 'erroneous') {
    return '';
  }
  return `<div class="${className}"><div class="${className}__message">${templates.message(layout, value)}</div></div>`;
}

function message(layout, error) {
  return `Error: ${error.message || error}`;
}

const DEFAULT_TEMPLATES = Object.freeze({
  root,
  message,
});

export default class ErrorLayout extends TemplateBasedLayout {

  static get category() {
    return LAYOUT_CATEGORY.ERROR;
  }

  static get type() {
    return TYPE;
  }

  static get defaultTemplates() {
    return DEFAULT_TEMPLATES;
  }

  constructor({ className = DEFAULT_CLASSNAME, templates, ...options } = {}) {
    super({
      className,
      templates: { ...DEFAULT_TEMPLATES, ...templates },
      ...options,
    });
  }

}
