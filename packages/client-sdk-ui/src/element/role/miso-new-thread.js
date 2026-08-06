import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

export default class MisoNewThreadElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.NEW_THREAD,
    });
  }

  static get tagName() {
    return 'miso-new-thread';
  }

}
