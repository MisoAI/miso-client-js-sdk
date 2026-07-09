import UnitWorkflow from './unit.js';
import { ROLE } from '../constants.js';
import { mergeRolesOptions } from './options/index.js';

const ROLES_OPTIONS = mergeRolesOptions(UnitWorkflow.ROLES_OPTIONS, {
  main: ROLE.PRODUCTS,
  members: [ROLE.PRODUCTS],
});

export default class Recommendation extends UnitWorkflow {

  constructor(context, id) {
    super({
      name: 'recommendation',
      context,
      roles: ROLES_OPTIONS,
      id,
    });
  }

  // lifecycle //
  start() {
    // in recommendation workflow, start() triggers query
    this._request();
    return this;
  }

  notifyViewUpdate(role = ROLE.PRODUCTS, ...args) {
    super.notifyViewUpdate(role, ...args);
    return this;
  }

}
