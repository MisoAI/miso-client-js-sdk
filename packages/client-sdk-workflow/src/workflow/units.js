/** @module workflow */

import { DEFAULT_UNIT_ID } from '../constants.js';
import WorkflowContext from './context.js';

/**
 * The base class of workflow contexts managing workflows by unit ID, such as
 * {@link module:workflow~Explores Explores}. The default unit ID is `'default'`.
 *
 * @extends module:workflow~WorkflowContext
 */
class UnitWorkflowContext extends WorkflowContext {

  constructor(name, plugin, client) {
    super(name, plugin, client);
    this._members = new Map();
  }

  /**
   * All workflows of this context.
   *
   * @returns {UnitWorkflow[]}
   */
  workflows() {
    return [...this._members.values()];
  }

  /**
   * Create the workflow of a unit.
   *
   * @param {string} [unitId='default'] - The unit ID.
   * @returns {UnitWorkflow}
   * @throws {Error} If the workflow of the unit already exists.
   */
  create(unitId = DEFAULT_UNIT_ID) {
    if (this._members.has(unitId)) {
      throw new Error(`Unit already exists: ${unitId}`);
    }
    return this._createAndEmit(unitId);
  }

  /**
   * Whether the workflow of a unit exists.
   *
   * @param {string} [unitId='default'] - The unit ID.
   * @returns {boolean}
   */
  has(unitId = DEFAULT_UNIT_ID) {
    return this._members.has(unitId);
  }

  /**
   * Get the workflow of a unit, creating it if it does not exist.
   *
   * @param {string} [unitId='default'] - The unit ID.
   * @returns {UnitWorkflow}
   */
  get(unitId = DEFAULT_UNIT_ID) {
    if (typeof unitId !== 'string') {
      throw new Error(`Required unit ID to be a string: ${unitId}`);
    }
    return this._members.get(unitId) || this._createAndEmit(unitId);
  }

  _createAndEmit(unitId) {
    const workflow = this._create(unitId);
    this._client._events.emit('postworkflow', workflow);
    return workflow;
  }

  _create(unitId) {
    throw new Error('Not implemented');
  }

}

export default UnitWorkflowContext;
