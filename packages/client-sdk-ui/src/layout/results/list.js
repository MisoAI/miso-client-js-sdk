import CollectionLayout from './collection';
import { product } from '../templates';

const TYPE = 'list';
const DEFAULT_CLASSNAME = 'miso-list';

const DEFAULT_TEMPLATES = Object.freeze({
  product,
});

const INHERITED_DEFAULT_TEMPLATES = Object.freeze({
  ...CollectionLayout.defaultTemplates,
  ...DEFAULT_TEMPLATES,
});

export default class ListLayout extends CollectionLayout {

  static get role() {
    return CollectionLayout.role;
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
