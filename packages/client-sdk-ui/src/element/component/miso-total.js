import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The total number of search results.
 */
export default class MisoTotalElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.TOTAL,
    });
  }

  static get tagName() {
    return 'miso-total';
  }

}
