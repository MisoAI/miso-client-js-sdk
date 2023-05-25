import CollectionLayout from './collection';

const TYPE = 'list';
const DEFAULT_CLASSNAME = 'miso-list';

export default class ListLayout extends CollectionLayout {

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
