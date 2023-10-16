import { Component } from '@miso.ai/commons';
import { WorkflowContextOptions } from './options.js';

export default class WorkflowContext extends Component {

  constructor(name, plugin, client) {
    super(name, plugin);
    this._plugin = plugin;
    this._client = client;
    this._options = new WorkflowContextOptions();
  }

  useApi(...args) {
    this._options.api = args;
    return this;
  }

  useLayouts(layouts = {}) {
    this._options.layouts = layouts;
    return this;
  }

}
