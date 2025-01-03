import { defineValues, delegateGetters, trimObj } from '@miso.ai/commons';
import { ROLE } from '../constants.js';
import * as fields from './fields.js';
import ViewActor from './view.js';
import Filters from './filters.js';
import Tracker from './tracker.js';
import { normalizeTrackerOptions } from '../util/trackers.js';

export default class ViewsActor {

  constructor(hub, {
    workflow,
    extensions,
    layouts,
    roles,
    options,
  }) {
    this._hub = hub;
    this._workflowName = workflow;
    this._extensions = extensions;
    this._layoutFactory = layouts;
    this._options = options;
    this._roles = roles;
    this._containers = new Map();
    this._containerTracker = undefined;
    this._views = {};
    this._trackers = new Trackers(this, roles.members);
    this._filters = new Filters(this);

    for (const role of roles.members) {
      if (role === ROLE.CONTAINER) {
        continue;
      }
      this._views[role] = new ViewActor(this, role);
    }

    defineValues(this, {
      interface: new Views(this),
    });

    const syncSize = () => this.syncSize();
    window.addEventListener('resize', syncSize);

    this._unsubscribes = [
      () => window.removeEventListener('resize', syncSize),
      hub.on(fields.data(), data => this.refresh({ data })),
      options.on('autocomplete', () => this._syncAutocompleteOptions()),
      options.on('pagination', () => this._syncPaginationOptions()),
      options.on('trackers', () => this._syncTrackers()),
      options.on('layouts', () => this._syncLayouts()),
    ];

    this._syncAutocompleteOptions();
    this._syncPaginationOptions();
    this._syncTrackers();
    this._syncLayouts();
  }

  get trackers() {
    return this._trackers;
  }

  get filters() {
    return this._filters;
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

  containsElement(element) {
    return this._containers.has(element) || this._views[element.role];
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

  /*
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
  */

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
        const fn = () => this._layoutFactory.create(name, { ...options, role, workflow: this._workflowName, workflowOptions: this._getWorkflowOptions() });
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
    return this._layoutFactory.create(name, { ...options, role, workflow: this._workflowName, workflowOptions: this._getWorkflowOptions() });
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

  async refresh({ force, data } = {}) {
    data = this._getData(data);
    // container first
    let views = this._getViews(true);

    if (!force && data._inst) {
      const { includes, excludes } = data._inst;
      if (includes) {
        // always include containers
        views = views.filter(view => view.role === ROLE.CONTAINER || includes.includes(view.role));
      }
      if (excludes) {
        views = views.filter(view => !excludes.includes(view.role));
      }
    }

    await Promise.all(views.map(view => view.refresh({ force, data })));
  }

  _getData(data) {
    return data || this._hub.states[fields.data()];
  }

  _syncTrackers() {
    this._trackerOptions = this._options.resolved.trackers;
  }

  _getTrackerOptions(role) {
    return normalizeTrackerOptions((this._trackerOptions && this._trackerOptions[role]) || false);
  }

  _getContainerTracker() {
    if (!this._containerTracker) {
      const hub = this._hub;
      const role = ROLE.CONTAINER;
      this._containerTracker = new Tracker({ hub, role, valueless: true, options: () => this._getTrackerOptions(role) });
    }
    return this._containerTracker;
  }

  _syncAutocompleteOptions() {
    this._autocompleteOptions = this._options.resolved.autocomplete;
  }

  _syncPaginationOptions() {
    this._paginationOptions = this._options.resolved.pagination;
  }

  _getWorkflowOptions() {
    return trimObj({
      autocomplete: this._autocompleteOptions,
      pagination: this._paginationOptions,
    });
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

class Trackers {

  constructor(views, roles) {
    this._views = views;
    for (const role of roles) {
      if (role === ROLE.CONTAINER) {
        continue;
      }
      Object.defineProperty(this, role, {
        get: () => views.get(role).tracker,
      });
    }
    Object.defineProperty(this, ROLE.CONTAINER, {
      get: () => views._getContainerTracker(),
    });
  }

}
