import { Component, defineValues } from '@miso.ai/commons';
import WorkflowDefaults from './defaults.js';
import DEFAULT_OPTIONS from './default-options.js';
import Workflows from './workflows.js';

const PLUGIN_ID = 'std:workflow';

/**
 * `std:workflow`
 *
 * Hosts client-agnostic workflow infrastructure: the workflow classes, actors,
 * and a store of default workflow options (see {@link WorkflowDefaults}).
 *
 * The plugin seeds the store with the built-in default options of each
 * workflow (except layouts, which are seeded by the UI plugin). Workflows read
 * their defaults from the store at creation. The store is exposed to other
 * plugins through the `workflows` extension point.
 */
export default class WorkflowPlugin extends Component {

  static get id() {
    return PLUGIN_ID;
  }

  constructor() {
    super('workflow');
    this._defaults = new WorkflowDefaults({
      onSet: (name, options) => this._events.emit('defaults', { name, options }),
    });
    this._seedDefaults();
  }

  get defaults() {
    return this._defaults;
  }

  /**
   * The layout registry, provided by the UI plugin (std:ui). Workflows read
   * it via `plugin.layouts` when creating views.
   */
  get layouts() {
    return this._layouts;
  }

  setLayouts(layouts) {
    this._layouts = layouts;
  }

  _seedDefaults() {
    for (const [name, options] of Object.entries(DEFAULT_OPTIONS)) {
      this._defaults.set(name, options);
    }
  }

  install(MisoClient, { addSubtree, addExtensionPoints }) {
    addSubtree(this);
    defineValues(this, { MisoClient });
    MisoClient.on('create', this._injectClient.bind(this));

    // the `workflows` plugin extension point
    addExtensionPoints({
      workflows: {
        plugin: this,
        defaults: this._defaults,
      },
    });
  }

  _injectClient(client) {
    defineValues(client, {
      workflows: new Workflows(this, client),
    });
  }

}
