import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The generated answer.
 */
class MisoAnswerElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.ANSWER,
    });
  }

  static get tagName() {
    return 'miso-answer';
  }

}

export default MisoAnswerElement;
