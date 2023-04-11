import { LAYOUT_CATEGORY } from '../../constants';
import TemplateBasedLayout from '../template';

const TYPE = 'plaintext';
const DEFAULT_CLASSNAME = 'miso-plaintext';

function root(layout, state) {
  const { className, role, options: { tag } } = layout;
  const roleAttr = role ? `data-role="${role}"` : '';
  return `<${tag} class="${className}" ${roleAttr}>${state.value || ''}</${tag}>`;
}

const DEFAULT_TEMPLATES = Object.freeze({
  root,
});

const INHERITED_DEFAULT_TEMPLATES = Object.freeze({
  ...TemplateBasedLayout.defaultTemplates,
  ...DEFAULT_TEMPLATES,
});

export default class PlaintextLayout extends TemplateBasedLayout {

  static get category() {
    return LAYOUT_CATEGORY.TEXT;
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

  constructor({ className = DEFAULT_CLASSNAME, templates, tag = 'p', ...options } = {}) {
    super(className, { ...DEFAULT_TEMPLATES, ...templates }, { tag, ...options });
  }

}
