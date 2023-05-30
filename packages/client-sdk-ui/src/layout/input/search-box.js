import { LAYOUT_CATEGORY } from '../../constants';
import { fields } from '../../actor';
import TemplateBasedLayout from '../template';

const TYPE = 'search-box';
const DEFAULT_CLASSNAME = 'miso-search-box';

function root(layout) {
  const { className, role, templates, options } = layout;
  const { placeholder, buttonText = 'Search' } = options;
  const roleAttr = role ? `data-role="${role}"` : '';
  // TODO: button icon
  return `
<div class="${className}" ${roleAttr}>
  <div class="${className}__input-group">
    <input class="${className}__input" type="text" ${placeholder ? `placeholder="${placeholder}"` : ''}>
    <button class="${className}__button" type="submit">${buttonText}</button>
  </div>
</div>
`;
}

const DEFAULT_TEMPLATES = Object.freeze({
  root,
});

export default class SearchBoxLayout extends TemplateBasedLayout {

  static get category() {
    return LAYOUT_CATEGORY.QUERY;
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

  constructor({ className = DEFAULT_CLASSNAME, templates, ...options } = {}) {
    super({
      className,
      templates: { ...DEFAULT_TEMPLATES, ...templates },
      ...options,
    });
  }

  initialize(view) {
    this._view = view;
    const { proxyElement } = view;
    this._unsubscribes = [
      ...this._unsubscribes,
      proxyElement.on('keydown', (e) => this._handleKeyDown(e)),
      proxyElement.on('click', (e) => this._handleClick(e)),
    ];
  }

  async render(element, state, controls) {
    if (element.childElementCount > 0) {
      // only render once, and also skip if there are children already to allow customized DOM
      return;
    }
    await super.render(element, state, controls);
  }

  _handleKeyDown({ key, target }) {
    if (key === 'Enter' && target.matches('input')) {
      this._submit();
    }
  }

  _handleClick({ target }) {
    if (target.matches('[type="submit"]')) {
      this._submit();
    }
  }

  async _submit() {
    const view = this._view;
    const input = this._input || (this._input = view.element && view.element.querySelector('input:not([type="submit"])'));
    if (!input) {
      return;
    }
    const { value } = input;
    if (!value) {
      return;
    }
    // TODO: q -> value
    view.hub.trigger(fields.query(), { q: value });
  }

}
