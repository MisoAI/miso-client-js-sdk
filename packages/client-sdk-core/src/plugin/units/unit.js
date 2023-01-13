import { uuidv4, defineValues } from '@miso.ai/commons';
import Items from './items';
import Tracker from './tracker';

export default class Unit {

  constructor(context, id) {
    this._context = context;
    defineValues(this, {
      uuid: uuidv4(),
      id,
      items: new Items(this),
    });
    context._units.set(id, this);
  }

  get element() {
    return this._element;
  }

  get tracker() {
    if (!this._tracker) {
      const tracker = this._tracker = new Tracker(this);
      const { id, uuid } = this;
      tracker.on('event', event => this._context.interactions._send({ id, uuid }, event));
    }
    return this._tracker;
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
    this.items._destroy();
    this._context._e2u.delete(this._element);
    this._context._units.delete(this.id);
    this._element = undefined;
  }

}
