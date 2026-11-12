/** @module workflow */

import { defineValues, mergeInteractions } from '@miso.ai/commons';
import Workflow from './base.js';

/**
 * The base class of workflows bound to a unit ID, such as {@link module:workflow~Explore Explore}.
 * Get one from its context by the unit ID. The unit ID is reported in the
 * interactions.
 *
 * @extends module:workflow~Workflow
 * @property {string} id - The unit ID.
 */
class UnitWorkflow extends Workflow {

  _initProperties(args) {
    super._initProperties(args);
    const { id } = args;
    defineValues(this, { id });
  }

  _initSession(args) {
    this._context._members.set(args.id, this);
    super._initSession(args);
  }

  // interactions //
  _defaultProcessInteraction(payload, args) {
    payload = super._defaultProcessInteraction(payload, args);
    payload = this._writeUnitIdToInteraction(payload, args);
    return payload;
  }

  _writeUnitIdToInteraction(payload) {
    const unit_id = this.id;
    const unit_instance_uuid = this.uuid;
    return mergeInteractions(payload, {
      context: {
        custom_context: {
          unit_id,
          unit_instance_uuid,
        },
      },
    });
  }

  // destroy //
  _destroy(options) {
    this._context._members.delete(this.id);
    super._destroy(options);
  }

}

Object.assign(UnitWorkflow, {
  ROLES_OPTIONS: Workflow.ROLES_OPTIONS,
});

export default UnitWorkflow;
