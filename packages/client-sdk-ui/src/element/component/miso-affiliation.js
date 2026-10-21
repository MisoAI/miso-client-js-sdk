import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The affiliate products that come with the answer.
 */
export default class MisoAffiliationElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.AFFILIATION,
    });
  }

  static get tagName() {
    return 'miso-affiliation';
  }

}
