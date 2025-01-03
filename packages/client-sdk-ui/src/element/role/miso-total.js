import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

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
