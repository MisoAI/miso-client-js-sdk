import MisoComponentElement from './miso-component';
import { ROLE } from '../../constants';

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
