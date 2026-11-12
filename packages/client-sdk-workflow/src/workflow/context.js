/** @module workflow */

import { Component } from '@miso.ai/commons';
import { WorkflowContextOptions, makeConfigurable } from './options/index.js';

/**
 * The base class of workflow contexts, which manage workflows of the same
 * kind, such as {@link module:workflow~Asks Asks}. Options set on a context apply to all of its
 * workflows.
 *
 * @extends Component
 * @mixes module:workflow~Configurable
 */
class WorkflowContext extends Component {

  constructor(name, plugin, client) {
    super(name, plugin);
    this._name = name;
    this._plugin = plugin;
    this._client = client;
    this._options = new WorkflowContextOptions();
  }

}

makeConfigurable(WorkflowContext.prototype);

export default WorkflowContext;
