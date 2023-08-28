import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

export default class MisoErrorElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.ERROR,
    });
  }

  static get tagName() {
    return 'miso-error';
  }

}
