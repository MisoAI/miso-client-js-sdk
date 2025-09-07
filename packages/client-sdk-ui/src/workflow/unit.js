import { defineValues, mergeInteractions } from '@miso.ai/commons';
import Workflow from './base.js';

export default class UnitWorkflow extends Workflow {

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
  DEFAULT_API_OPTIONS: Workflow.DEFAULT_API_OPTIONS,
  DEFAULT_LAYOUTS: Workflow.DEFAULT_LAYOUTS,
  DEFAULT_TRACKERS: Workflow.DEFAULT_TRACKERS,
  DEFAULT_OPTIONS: Workflow.DEFAULT_OPTIONS,
  ROLES_OPTIONS: Workflow.ROLES_OPTIONS,
});
