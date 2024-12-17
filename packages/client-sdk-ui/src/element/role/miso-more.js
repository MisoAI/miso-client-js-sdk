import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

export default class MisoMoreElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.MORE,
    });
  }

  static get tagName() {
    return 'miso-more';
  }

}
