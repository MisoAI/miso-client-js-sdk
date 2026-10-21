import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The generated answer.
 */
export default class MisoAnswerElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.ANSWER,
    });
  }

  static get tagName() {
    return 'miso-answer';
  }

}
