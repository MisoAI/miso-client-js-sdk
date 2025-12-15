import { defineValues, delegateGetters, EventEmitter } from '@miso.ai/commons';
import { ROLE } from '../constants.js';
import * as fields from './fields.js';
import ViewActor from './view.js';
import Filters from './filters.js';

export default class ViewsActor {

  constructor(hub, {
    workflow,
    extensions,
    layouts,
    roles,
    options,
  }) {
    this._hub = hub;
    this._workflow = workflow;
    this._workflowName = workflow._name;
    this._extensions = extensions;
    this._layoutFactory = layouts;
    this._options = options;
    this._roles = roles;
    this._containers = new Map();
    this._components = new Map();
    this._filters = new Filters(this);
    this._events = new EventEmitter();

    defineValues(this, {
      interface: new Views(this),
    });

    const syncSize = () => this.syncSize();
    window.addEventListener('resize', syncSize);

    this._unsubscribes = [
      () => window.removeEventListener('resize', syncSize),
      hub.on(fields.data(), data => this.refresh({ data })),
      options.on('layouts', () => this._syncLayouts()),
    ];

    this._syncLayouts();
  }

  get filters() {
    return this._filters;
  }

  get trackers() {
    return this._workflow.trackers;
  }

  on(role, name, fn) {
    return this._events.on(`${role}:${name}`, fn);
  }

  // elements //
  addContainer(element) {
    if (this._containers.has(element)) {
      return;
    }
    const view = this._createView(element);
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
    if (this._components.has(element)) {
      return;
    }
    const view = this._createView(element);
    this._components.set(element, view);
  }

  removeComponent(element) {
    const view = this._components.get(element);
    if (!view) {
      return;
    }
    view._destroy();
    this._components.delete(element);
  }

  updateComponentRole(element, oldRole, newRole) {
    // TODO
  }

  containsElement(element) {
    return this._containers.has(element) || this._components.has(element);
  }

  refreshElement(element) {
    const view = element.isContainer ? this._containers.get(element) : this._components.get(element);
    view && view.refresh({ force: true });
  }

  _createView(element) {
    const view = new ViewActor(this, element.role);
    view.layout = this._createLayout(element.role);
    view.element = element;
    return view;
  }

  _syncLayouts() {
    // TODO: put a debug event here
    const { layouts } = this._options.resolved;
    if (layouts === false) {
      for (const view of [...this._containers.values(), ...this._components.values()]) {
        view.layout = undefined;
      }
    } else {
      for (const view of [...this._containers.values(), ...this._components.values()]) {
        view.layout = this._createLayout(view.role);
      }
    }
  }

  _createLayout(role) {
    const args = this._options.resolved.layouts[role];
    if (!args) {
      return undefined;
    }
    const [name, options] = args;
    return this._layoutFactory.create(name, { ...options, role, workflow: this._workflowName });
  }

  get(role) {
    return this.getAll(role)[0];
  }

  getAll(role) {
    return role === ROLE.CONTAINER ? this._containers.values() : this._components.values().filter(view => view.role === role);
  }

  get views() {
    return this._getViews(true);
  }

  _getViews(containerFirst = true) {
    return containerFirst ? [
      ...this._containers.values(),
      ...this._components.values(),
    ] : [
      ...this._components.values(),
      ...this._containers.values(),
    ];
  }

  syncSize() {
    // TODO: containers?
    for (const view of this._components.values()) {
      view._syncSize();
    }
  }

  async refresh({ force, data } = {}) {
    data = this._getData(data);
    // container first
    let views = this._getViews(true);

    await Promise.all(views.map(view => view.refresh({ force, data })));
  }

  _getData(data) {
    return data || this._hub.states[fields.data()];
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
    this._filters._destroy();
  }

}

class Views {

  constructor(actor) {
    this._actor = actor;
    delegateGetters(this, actor, ['syncSize', 'refresh', 'trackers', 'filters']);
  }

  get(role) {
    return this._actor.get(role).interface;
  }

  get all() {
    return this._actor.views.map(view => view.interface);
  }

}
