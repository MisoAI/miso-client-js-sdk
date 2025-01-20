import { Component } from '@miso.ai/commons';
import { WorkflowContextOptions, makeConfigurable } from './options/index.js';

export default class WorkflowContext extends Component {

  constructor(name, plugin, client) {
    super(name, plugin);
    this._plugin = plugin;
    this._client = client;
    this._options = new WorkflowContextOptions();
  }

}

makeConfigurable(WorkflowContext.prototype);
