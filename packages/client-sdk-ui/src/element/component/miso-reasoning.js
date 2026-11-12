import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The reasoning given while the answer is generated.
 */
class MisoReasoningElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.REASONING,
    });
  }

  static get tagName() {
    return 'miso-reasoning';
  }

}

export default MisoReasoningElement;
