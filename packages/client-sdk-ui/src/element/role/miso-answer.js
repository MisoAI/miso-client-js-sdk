import MisoComponentElement from './miso-component';
import { ROLE } from '../../constants';

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
