import CollectionLayout from './collection.js';

const TYPE = 'cards';
const DEFAULT_CLASSNAME = 'miso-cards';

export default class CardsLayout extends CollectionLayout {

  static get category() {
    return super.category;
  }

  static get type() {
    return TYPE;
  }

  static get defaultTemplates() {
    return super.defaultTemplates;
  }

  static get defaultClassName() {
    return DEFAULT_CLASSNAME;
  }

  constructor({ className = DEFAULT_CLASSNAME, ...options } = {}) {
    super({ className, ...options });
  }

}
