import MisoComponentElement from './miso-component';
import { ROLE } from '../../constants';

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
