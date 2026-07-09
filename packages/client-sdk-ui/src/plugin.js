import { Component, Resolution, defineAndUpgrade, delegateGetters, defineValues } from '@miso.ai/commons';
import { WorkflowPlugin } from '@miso.ai/client-sdk-workflow';
import { defaultLayouts } from './defaults.js';
import { AskCombo } from './combo/index.js';
import Layouts from './layouts.js';
import * as elements from './element/index.js';
import * as layouts from './layout/index.js';
import * as defaults from './defaults/index.js';
import { followUp as followUpTemplate } from './defaults/ask/templates.js';
import * as traits from './trait/index.js';
import { loadStylesIfNecessary } from './styles.js';

import MisoContainerElement from './element/container/miso-container.js';
import MisoContextElement from './element/context/miso-context.js';
import MisoComboElement from './element/combo/miso-combo.js';

const PLUGIN_ID = 'std:ui';

export default class UiPlugin extends Component {

  static get id() {
    return PLUGIN_ID;
  }

  constructor() {
    super('ui');
    this.layouts = new Layouts(this);
    this._ready = new Resolution();
  }

  async install(MisoClient, context) {
    const { addSubtree, addExtensionPoints } = context;
    this._pluginContext = context;
    addSubtree(this);

    // make sure the workflow plugin is installed, then provide the layout
    // registry and seed the default layout options
    MisoClient.plugins.use(WorkflowPlugin);
    context.workflows.plugin.setLayouts(this.layouts);
    this._seedWorkflowDefaults(context.workflows.defaults);

    MisoClient.on('create', this._injectClient.bind(this));

    // the UI interface for MisoClient
    const ui = { defaults, traits };
    delegateGetters(ui, this, ['layouts', 'ready']);
    defineValues(this, { MisoClient });
    defineValues(MisoClient, { ui });

    // the plugin context extension
    const uiContext = createUiPluginContext(this, ui, MisoClient);
    const { addElementClasses, addLayoutClasses, addInterface } = uiContext;
    addExtensionPoints({
      ui: uiContext,
    });

    // layouts
    const LayoutClasses = Object.values(layouts).filter(LayoutClass => LayoutClass.type);
    addLayoutClasses(...LayoutClasses);

    // elements
    const ElementSuperClasses = [MisoContainerElement, MisoContextElement];
    for (const ElementClass of ElementSuperClasses) {
      ElementClass.MisoClient = MisoClient; // TODO: find better way
    }
    const { containers, roles, contexts, combos:_, ...others } = elements;
    // containers must go first, so their APIs will be ready before children are defined
    const ElementClasses = [
      ...Object.values(contexts),
      ...Object.values(containers),
      ...Object.values(roles),
      ...Object.values(others),
    ];
    addElementClasses(...ElementClasses);

    // combo
    MisoComboElement.MisoClient = MisoClient;
    addElementClasses(...Object.values(elements.combos));
    addInterface({ combo: new Combo(this, MisoClient) });

    // load styles
    await loadStylesIfNecessary();
    this._ready.resolve();
  }

  get ready() {
    return this._ready.promise;
  }

  /**
   * Seed the workflow plugin's defaults store with the presentational default
   * options: layouts of each workflow, plus UI templates.
   */
  _seedWorkflowDefaults(workflowDefaults) {
    for (const [name, layouts] of Object.entries(defaultLayouts)) {
      workflowDefaults.set(name, { layouts });
    }
    workflowDefaults.set('ask', { templates: { followUp: followUpTemplate } });
  }

  _injectClient(client) {
    defineValues(client, {
      ui: new Ui(this, client),
    });
  }

}

function createUiPluginContext(plugin, ui, MisoClient) {
  async function addElementClasses(...ElementClasses) {
    for (const ElementClass of ElementClasses) {
      ElementClass.MisoClient = MisoClient;
    }
    await plugin.ready;
    for (const ElementClass of ElementClasses) {
      defineAndUpgrade(ElementClass);
    }
  }
  function addLayoutClasses(...LayoutClasses) {
    for (const LayoutClass of LayoutClasses) {
      LayoutClass.MisoClient = MisoClient;
      plugin.layouts.register(LayoutClass);
    }
  }
  function addInterface(obj) {
    defineValues(ui, obj);
  }
  return { plugin, addElementClasses, addLayoutClasses, addInterface };
}

// workflow accessors delegated to client.workflows for backward compatibility
const WORKFLOW_ACCESSORS = ['search', 'hybridSearch', 'asks', 'ask', 'explores', 'explore', 'recommendations', 'recommendation', 'sources'];

/**
 * The UI interface for the client.
 */
class Ui {

  constructor(plugin, client) {
    this._plugin = plugin;
    this._client = client;
    delegateGetters(this, client.workflows, WORKFLOW_ACCESSORS);
  }

  get ready() {
    return this._plugin.ready;
  }

}

class Combo {

  constructor(plugin, MisoClient) {
    this._plugin = plugin;
    this._MisoClient = MisoClient;
  }

  get ask() {
    return this._ask || (this._ask = new AskCombo(this._plugin, this._MisoClient));
  }

}
