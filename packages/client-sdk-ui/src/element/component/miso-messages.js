import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The questions and answers of the open thread.
 */
class MisoMessagesElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.MESSAGES,
    });
  }

  static get tagName() {
    return 'miso-messages';
  }

}

export default MisoMessagesElement;
