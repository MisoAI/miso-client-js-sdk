import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

export default class MisoMessagesElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.MESSAGES,
    });
  }

  static get tagName() {
    return 'miso-messages';
  }

}
