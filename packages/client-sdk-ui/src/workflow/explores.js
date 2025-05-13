import UnitWorkflowContext from './units.js';
import Explore from './explore.js';

export default class Explores extends UnitWorkflowContext {

  constructor(plugin, client) {
    super('explores', plugin, client);
  }

  _create(unitId) {
    return new Explore(this, unitId);
  }

}
