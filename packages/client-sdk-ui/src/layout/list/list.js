import CollectionLayout from './collection.js';

const TYPE = 'list';
const DEFAULT_CLASSNAME = 'miso-list';

export default class ListLayout extends CollectionLayout {

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
