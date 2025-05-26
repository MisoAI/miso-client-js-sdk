import CollectionLayout from './collection.js';

const TYPE = 'horizontal';
const DEFAULT_CLASSNAME = 'miso-horizontal';

export default class HorizontalLayout extends CollectionLayout {

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
