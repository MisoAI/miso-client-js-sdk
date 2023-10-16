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

  useLayouts(options) {
    this._options.layouts = options;
    return this;
  }

  useDataProcessor(fn) {
    this._options.dataProcessor = fn;
    return this;
  }

  useInteractions(options) {
    this._options.interactions = options;
    return this;
  }

}
