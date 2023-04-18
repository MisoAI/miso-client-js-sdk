import { defineValues, delegateGetters } from '@miso.ai/commons';
import { STATUS, ROLE } from '../constants';
import * as fields from './fields';
import ViewActor from './view';

export default class ViewsActor {

  constructor(hub, {
    roles = [],
    layouts = {},
  }) {
    this._hub = hub;
    this._containers = new Map();
    this._views = {};

    for (const role of roles) {
      this._views[role] = new ViewActor(this, role);
    }

    this._layoutFns = new Map();
    this.layouts = layouts;

    defineValues(this, {
      interface: new Views(this),
    });

    const syncSize = () => this.syncSize();
    window.addEventListener('resize', syncSize);

    this._unsubscribes = [
      () => window.removeEventListener('resize', syncSize),
      hub.on(fields.data(), () => this.refresh()),
    ];
  }

  // elements //
  addContainer(element) {
    if (this._containers.has(element)) {
      return;
    }
    const view = new ViewActor(this, ROLE.CONTAINER);
    // TODO: layout options overrides
    view.layout = this._layoutFns.get(ROLE.CONTAINER)();
    view.element = element;
    this._containers.set(element, view);

    const { components } = element;
    for (const component of components) {
      this.addComponent(component);
    }
  }

  removeContainer(element) {
    const view = this._containers.get(element);
    if (!view) {
      return;
    }
    const { components } = element;
    for (const component of components) {
      this.removeComponent(component);
    }
    view._destroy();
    this._containers.delete(element);
  }

  addComponent(element) {
    this._getViewByElement(element).element = element;
  }

  removeComponent(element) {
    this._getViewByElement(element).element = undefined;
  }

  updateComponentRole(element, oldRole, newRole) {
    // TODO
  }

  _getViewByElement(element) {
    let { role } = element;
    if (!role) {
      throw new Error('Component must have a role');
    }
    return this.get(role);
  }

  set layouts(layouts) {
    for (let [role, fn] of Object.entries(layouts)) {
      this._layoutFns.set(role, fn);
      if (role === ROLE.CONTAINER) {
        for (const view of this._containers.values()) {
          // TODO: layout options overrides
          view.layout = fn();
        }
      } else {
        this.get(role).layout = fn();
      }
    }
  }

  get(role) {
    return this._views[role] || (this._views[role] = new ViewActor(this, role));
  }

  get views() {
    return this._getViews(true);
  }

  _getViews(containerFirst = true) {
    return containerFirst ? [
      ...this._containers.values(),
      ...Object.values(this._views),
    ] : [
      ...Object.values(this._views),
      ...this._containers.values(),
    ];
  }

  syncSize() {
    for (const view of Object.values(this._views)) {
      view._syncSize();
    }
  }

  async refresh({ force } = {}) {
    const data = this._getData();
    // container first
    await Promise.all(this._getViews(true).map(view => view.refresh({ force, data })));
  }

  _getData() {
    const { [fields.data()]: data } = this._hub.states;
    // compare to cached
    if (!this._data || this._data.data !== data) {
      const status = (!data || !data.session || !data.session.active) ? STATUS.INITIAL :
        data.error ? STATUS.ERRONEOUS : data.value ? STATUS.READY : STATUS.LOADING;
      this._data = Object.freeze({ ...data, status });
    }
    return this._data;
  }

  _error(e) {
    // TODO: hub trigger error event
    console.error(e);
  }

  destroy() {
    // destroy components, and then containers
    for (const view of this._getViews(false)) {
      view._destroy();
    }
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}

class Views {

  constructor(actor) {
    this._actor = actor;
    delegateGetters(this, actor, ['syncSize', 'refresh']);
  }

  get(role) {
    return this._actor.get(role).interface;
  }

  get views() {
    return this._actor.views.map(view => view.interface);
  }

}
