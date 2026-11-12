/** @module workflow */

import UnitWorkflowContext from './units.js';
import Explore from './explore.js';
import { makeAutocompletableContext } from './autocompletable.js';

/**
 * The Explore workflow context, available as `client.workflows.explores`.
 * Manages the Explore workflows by unit ID. `client.workflows.explore` is
 * the one of the default unit.
 *
 * @extends module:workflow~UnitWorkflowContext
 */
class Explores extends UnitWorkflowContext {

  constructor(plugin, client) {
    super('explores', plugin, client);
    this._initAutocompleteContext();
  }

  _create(unitId) {
    return new Explore(this, unitId);
  }

}

makeAutocompletableContext(Explores.prototype);

export default Explores;
