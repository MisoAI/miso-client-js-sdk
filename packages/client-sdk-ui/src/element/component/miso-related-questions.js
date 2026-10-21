import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The questions related to the page.
 */
export default class MisoRelatedQuestionsElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.RELATED_QUESTIONS,
    });
  }

  static get tagName() {
    return 'miso-related-questions';
  }

}
