import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

export default class MisoReasoningElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.REASONING,
    });
  }

  static get tagName() {
    return 'miso-reasoning';
  }

}
