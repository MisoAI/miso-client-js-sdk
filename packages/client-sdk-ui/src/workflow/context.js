import { Component } from '@miso.ai/commons';
import { WorkflowContextOptions, normalizeApiOptions } from './options.js';

export default class WorkflowContext extends Component {

  constructor(name, plugin, client) {
    super(name, plugin);
    this._plugin = plugin;
    this._client = client;
    this._options = new WorkflowContextOptions();
  }

  useApi(name, payload) {
    this._options.api = normalizeApiOptions(name, payload);
    return this;
  }

}
