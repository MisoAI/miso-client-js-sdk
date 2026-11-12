import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The questions related to the page.
 */
class MisoRelatedQuestionsElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.RELATED_QUESTIONS,
    });
  }

  static get tagName() {
    return 'miso-related-questions';
  }

}

export default MisoRelatedQuestionsElement;
