import UnitWorkflowContext from './units.js';
import Explore from './explore.js';
import { makeAutocompletableContext } from './autocompletable.js';

export default class Explores extends UnitWorkflowContext {

  constructor(plugin, client) {
    super('explores', plugin, client);
    this._initAutocompleteContext();
  }

  _create(unitId) {
    return new Explore(this, unitId);
  }

}

makeAutocompletableContext(Explores.prototype);
