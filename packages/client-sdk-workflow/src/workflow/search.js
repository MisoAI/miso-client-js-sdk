import { ROLE } from '../constants.js';
import SearchBasedWorkflow from './search-based.js';
import { makeAutocompletable } from './autocompletable.js';

const ROLES_OPTIONS = SearchBasedWorkflow.ROLES_OPTIONS;

export default class Search extends SearchBasedWorkflow {

  constructor(plugin, client) {
    super({
      name: 'search',
      plugin,
      client,
      roles: ROLES_OPTIONS,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._initAutocomplete(args);
  }

  notifyViewUpdate(role = ROLE.PRODUCTS, ...args) {
    super.notifyViewUpdate(role, ...args);
    return this;
  }

  // destroy //
  _destroy(options) {
    this._destroyAutocomplete();
    super._destroy(options);
  }

}

makeAutocompletable(Search.prototype);
