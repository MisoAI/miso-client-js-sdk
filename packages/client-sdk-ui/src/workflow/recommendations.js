import { DEFAULT_UNIT_ID } from '../constants.js';
import WorkflowContext from './context.js';
import Recommendation from './recommendation.js';

export default class Recommendations extends WorkflowContext {

  constructor(plugin, client) {
    super('recommendations', plugin, client);
    this._members = new Map();
  }

  workflows() {
    return [...this._members.values()];
  }

  create(unitId = DEFAULT_UNIT_ID) {
    if (this._members.has(unitId)) {
      throw new Error(`Unit already exists: ${unitId}`);
    }
    return new Recommendation(this, unitId);
  }

  has(unitId = DEFAULT_UNIT_ID) {
    return this._members.has(unitId);
  }

  get(unitId = DEFAULT_UNIT_ID) {
    if (typeof unitId !== 'string') {
      throw new Error(`Required unit ID to be a string: ${unitId}`);
    }
    return this._members.get(unitId) || new Recommendation(this, unitId);
  }

}
