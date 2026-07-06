import { LAYOUT_TYPE } from '../../constants.js';
import CollectionLayout from './collection.js';

const TYPE = LAYOUT_TYPE.HORIZONTAL;
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
