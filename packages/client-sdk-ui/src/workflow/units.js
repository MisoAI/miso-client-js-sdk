import { DEFAULT_UNIT_ID } from '../constants.js';
import WorkflowContext from './context.js';

export default class UnitWorkflowContext extends WorkflowContext {

  constructor(name, plugin, client) {
    super(name, plugin, client);
    this._members = new Map();
  }

  workflows() {
    return [...this._members.values()];
  }

  create(unitId = DEFAULT_UNIT_ID) {
    if (this._members.has(unitId)) {
      throw new Error(`Unit already exists: ${unitId}`);
    }
    return this._create(unitId);
  }

  has(unitId = DEFAULT_UNIT_ID) {
    return this._members.has(unitId);
  }

  get(unitId = DEFAULT_UNIT_ID) {
    if (typeof unitId !== 'string') {
      throw new Error(`Required unit ID to be a string: ${unitId}`);
    }
    return this._members.get(unitId) || this._create(unitId);
  }

  _create(unitId) {
    throw new Error('Not implemented');
  }

}
