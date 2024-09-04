import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

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
