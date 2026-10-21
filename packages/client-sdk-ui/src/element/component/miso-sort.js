import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The sort order selector of the search results.
 */
export default class MisoSortElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.SORT,
    });
  }

  static get tagName() {
    return 'miso-sort';
  }

}
