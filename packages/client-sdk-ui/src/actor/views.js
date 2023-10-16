import { defineValues, delegateGetters } from '@miso.ai/commons';
import { STATUS, ROLE } from '../constants.js';
import * as fields from './fields.js';
import ViewActor from './view.js';

export default class ViewsActor {

  constructor(hub, {
    extensions,
    layouts,
    roles = [],
    options,
  }) {
    this._hub = hub;
    this._extensions = extensions;
    this._layoutFactory = layouts;
    this._options = options;
    this._containers = new Map();
    this._views = {};

    for (const role of roles) {
      this._views[role] = new ViewActor(this, role);
    }

    defineValues(this, {
      interface: new Views(this),
    });

    const syncSize = () => this.syncSize();
    window.addEventListener('resize', syncSize);

    this._unsubscribes = [
      () => window.removeEventListener('resize', syncSize),
      hub.on(fields.data(), () => this.refresh()),
      options.on('layouts', () => this._requestSyncLayouts()),
    ];

    this._requestSyncLayouts();
  }

  // elements //
  addContainer(element) {
    if (this._containers.has(element)) {
      return;
    }
    const view = new ViewActor(this, ROLE.CONTAINER);
    view.layout = this._createLayout(ROLE.CONTAINER);
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

  refreshElement(element) {
    const view = element.isContainer ? this._containers.get(element) : this._getViewByElement(element);
    view && view.refresh({ force: true });
  }

  _getViewByElement(element) {
    let { role } = element;
    if (!role) {
      throw new Error('Component must have a role');
    }
    return this.get(role);
  }

  _requestSyncLayouts() {
    this._setLayoutRequested = true;
    setTimeout(() => {
      if (!this._setLayoutRequested) {
        return;
      }
      this._setLayoutRequested = false;
      this._syncLayouts();
    });
  }

  _syncLayouts() {
    // TODO: put a debug event here
    const { layouts } = this._options.resolved;
    if (layouts === false) {
      // containers
      for (const view of this._containers.values()) {
        view.layout = undefined;
      }
      // components
      for (const view of Object.values(this._views)) {
        view.layout = undefined;
      }
    } else {
      for (let [role, [name, options]] of Object.entries(layouts)) {
        // TODO: try to omit if unchanged
        const fn = () => this._layoutFactory.create(name, { ...options, role });
        if (role === ROLE.CONTAINER) {
          for (const view of this._containers.values()) {
            view.layout = fn();
          }
        } else {
          this.get(role).layout = fn();
        }
      }
    }
  }

  _createLayout(role) {
    const args = this._options.resolved.layouts[role];
    if (!args) {
      return undefined;
    }
    const [name, options] = args;
    return this._layoutFactory.create(name, { ...options, role });
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
      const ongoing = status === STATUS.READY ? !!data.ongoing : undefined;
      this._data = Object.freeze({ ...data, status, ongoing });
    }
    return this._data;
  }

  _error(e) {
    // TODO: hub trigger error event
    console.error(e);
  }

  _destroy({ dom } = {}) {
    // destroy components, and then containers
    for (const view of this._getViews(false)) {
      // TODO: handle dom option
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
