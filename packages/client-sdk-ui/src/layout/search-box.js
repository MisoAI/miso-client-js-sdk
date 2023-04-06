import { LAYOUT_CATEGORY } from '../constants';
import TemplateBasedLayout from './template';

const TYPE = 'search-box';
const DEFAULT_CLASSNAME = 'miso-search-box';

function root(layout) {
  const { className, templates, options } = layout;
  const { placeholder, buttonText = 'Search' } = options;
  // TODO: button icon
  return `
<div class="${className}">
  <div class="${className}__input-group">
    <input class="${className}__input" type="text">
    <button class="${className}__button" type="submit">${buttonText}</button>
  </div>
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

export default class SearchBoxLayout extends TemplateBasedLayout {

  static get category() {
    return LAYOUT_CATEGORY.INPUT;
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

}
