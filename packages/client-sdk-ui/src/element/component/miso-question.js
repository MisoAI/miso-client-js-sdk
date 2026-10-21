import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The question being answered.
 */
export default class MisoQuestionElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.QUESTION,
    });
  }

  static get tagName() {
    return 'miso-question';
  }

}
