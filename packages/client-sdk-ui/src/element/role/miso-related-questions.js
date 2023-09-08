import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

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
