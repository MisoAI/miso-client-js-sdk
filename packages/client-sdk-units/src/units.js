import { isElement, delegateGetters } from '@miso.ai/commons';
import { ATTR_UNIT_ID } from './constants';
import Unit from './unit';
import Interactions from './interactions';

export default class UnitsContext {

  constructor(plugin, client) {
    this._plugin = plugin;
    this._client = client;
    this._units = new Map();
    this._e2u = new WeakMap();
    this.interactions = new Interactions(this);
    this.interface = new Units(this);
  }

  list() {
    return [...this._units.values()];
  }

  create(id = 'default') {
    if (this._units.has(id)) {
      throw new Error(`Unit already exists: ${id}`);
    }
    return new Unit(this, id);
  }

  has(ref = 'default') {
    return typeof ref === 'string' ? this._units.has(ref) : (isElement(ref) && this._e2u.has(ref));
  }

  get(ref = 'default') {
    if (typeof ref === 'string') {
      return this._units.get(ref) || new Unit(this, ref);

    } else if (isElement(ref)) {
      if (this._e2u.has(ref)) {
        return this._e2u.get(ref);
      } else {
        const id = ref.getAttribute(ATTR_UNIT_ID) || 'default';
        return new Unit(this, id).bind(ref);
      }

    } else {
      throw new Error(`Required input to be either a string unit ID or an element: ${ref}`);
    }
  }

}

class Units {

  constructor(context) {
    delegateGetters(this, context, ['list', 'has', 'create', 'get', 'interactions']);
  }

}
