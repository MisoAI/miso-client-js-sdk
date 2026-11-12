import MisoComponentElement from './miso-component.js';
import { ROLE } from '../../constants.js';

/**
 * The title of a thread.
 */
class MisoTitleElement extends MisoComponentElement {

  constructor() {
    super({
      role: ROLE.TITLE,
    });
  }

  static get tagName() {
    return 'miso-title';
  }

}

export default MisoTitleElement;
