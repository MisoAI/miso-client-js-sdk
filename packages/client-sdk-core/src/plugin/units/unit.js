import { uuidv4 } from '@miso.ai/commons';
import Tracker from './tracker';

export default class Unit {

  constructor(context, id) {
    this._context = context;
    Object.defineProperties(this, {
      uuid: { value: uuidv4() },
      id: { value: id },
    });
    context._units.set(id, this);
  }

  get element() {
    return this._element;
  }

  get tracker() {
    return this._tracker || (this._tracker = new Tracker(this));
  }

  bind(element) {
    if (this._element === element) {
      return;
    } else if (this._element) {
      throw new Error(`Element has already been set.`);
    }
    this._element = element;
    this._context._e2u.set(element, this);
    return this;
  }

  destroy() {
    this._tracker && this._tracker._destroy();
    this._context._e2u.delete(this._element);
    this._context._units.delete(this.id);
    this._element = undefined;
  }

}
