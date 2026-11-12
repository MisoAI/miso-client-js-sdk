import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The question being answered.
 */
class MisoQuestionElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.QUESTION,
    });
  }

  static get tagName() {
    return 'miso-question';
  }

}

export default MisoQuestionElement;
