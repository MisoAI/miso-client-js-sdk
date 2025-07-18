import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

export default class MisoFollowUpQuestionsElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.FOLLOW_UP_QUESTIONS,
    });
  }

  static get tagName() {
    return 'miso-follow-up-questions';
  }

}
