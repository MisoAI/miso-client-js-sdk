import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

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
