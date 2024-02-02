import { escapeHtml } from '@miso.ai/commons';
import { LAYOUT_CATEGORY } from '../../constants.js';
import TemplateBasedLayout from '../template.js';

const TYPE = 'text';
const DEFAULT_CLASSNAME = 'miso-text';

function root(layout, state) {
  const { className, role, options: { tag } } = layout;
  const roleAttr = role ? `data-role="${role}"` : '';
  return `<${tag} class="${className}" ${roleAttr}>${escapeHtml(state.value || '')}</${tag}>`;
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
