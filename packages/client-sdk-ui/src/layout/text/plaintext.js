import { requestAnimationFrame as raf } from '@miso.ai/commons';
import { LAYOUT_CATEGORY } from '../../constants';
import TemplateBasedLayout from '../template';

const TYPE = 'plaintext';
const DEFAULT_CLASSNAME = 'miso-plaintext';

function root(layout) {
  const { className, templates, options } = layout;
  return `
<div class="${className}">
  <p class="${className}__content"></p>
</div>
`;
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

  constructor({ className = DEFAULT_CLASSNAME, templates, ...options } = {}) {
    super(className, { ...DEFAULT_TEMPLATES, ...templates }, options);
  }

  async render(element, state) {
    //console.log(state);
    // only render the last update request
    await raf(() => {
      if (element.children.length === 0) {
        element.innerHTML = this.templates.root(this);
      }
      element.querySelector(`.${this.className}__content`).innerHTML = state.value || '';
    });
  }

}
