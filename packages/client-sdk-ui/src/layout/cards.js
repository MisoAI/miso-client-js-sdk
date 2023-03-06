import CollectionLayout from './collection';
import { product } from './renderers';

const TYPE = 'cards';
const DEFAULT_CLASSNAME = 'miso-cards';

const DEFAULT_TEMPLATES = Object.freeze({
  product,
});

const INHERITED_DEFAULT_TEMPLATES = Object.freeze({
  ...CollectionLayout.defaultTemplates,
  DEFAULT_TEMPLATES,
});

export default class CardsLayout extends CollectionLayout {

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
