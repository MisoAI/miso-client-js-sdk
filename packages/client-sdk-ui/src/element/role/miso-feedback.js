import MisoComponentElement from './miso-component';
import { ROLE } from '../../constants';

export default class MisoFeedbackElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.FEEDBACK,
    });
  }

  static get tagName() {
    return 'miso-feedback';
  }

}
