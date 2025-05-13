import UnitWorkflowContext from './units.js';
import Recommendation from './recommendation.js';

export default class Recommendations extends UnitWorkflowContext {

  constructor(plugin, client) {
    super('recommendations', plugin, client);
  }

  _create(unitId) {
    return new Recommendation(this, unitId);
  }

}
